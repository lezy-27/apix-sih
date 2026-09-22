import asyncio
from datetime import datetime, timedelta
import json
import logging
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db, AsyncSessionLocal
from app.services.analytics import analytics_service
from app.services.scraper import scraping_engine
from app.services.cleaner import cleaner
from app.services.index_engine import index_engine
from app.models.fares import FareQuote, CleanedFare
from app.models.index import IndexValue, RouteIndexValue
from app.models.quality import ScrapingRun, DataQualityMetric
from app.schemas.scraping import (
    ScrapingStatusResponse,
    DataQualityResponse,
    ScrapingTriggerRequest,
    ScrapingTriggerResponse,
    SourceHealthResponse,
    SourceHealthItem,
)

logger = logging.getLogger("apix.routers.scraping")
router = APIRouter(tags=["Scraping & Data Quality"])

@router.get("/scraping/status", response_model=ScrapingStatusResponse, summary="Get Scraping Pipeline Status")
async def get_scraping_status(db: AsyncSession = Depends(get_db)):
    """Fetch scraper engine telemetry: status, last run, failed sources, quote count."""
    return await analytics_service.get_scraping_status(db)

@router.get("/data-quality", response_model=DataQualityResponse, summary="Get Data Quality Telemetry")
async def get_data_quality(db: AsyncSession = Depends(get_db)):
    """Fetch cleaning telemetry: quality %, duplicates filtered, MAD outliers removed."""
    return await analytics_service.get_data_quality(db)

@router.get("/scraping/sources", response_model=SourceHealthResponse, summary="Get Source Health Status")
async def get_source_health():
    """
    Returns live per-source health status from the scraping engine adapters.
    Shows current status (Online/Blocked/Timeout/Error), response time, and quotes per run.
    """
    health_data = scraping_engine.get_all_source_health()
    sources = []
    for item in health_data:
        sources.append(SourceHealthItem(
            name=item["name"],
            source_type=item["source_type"],
            status=item["status"],
            last_response_ms=item["last_response_ms"],
            quotes_last_run=item["quotes_last_run"],
            last_checked=item["last_checked"],
        ))
    return SourceHealthResponse(sources=sources)

@router.post("/scraping/run", response_model=ScrapingTriggerResponse, summary="Trigger Ingestion & Index Pipeline")
async def trigger_scraping_run(
    req: ScrapingTriggerRequest = ScrapingTriggerRequest(),
    db: AsyncSession = Depends(get_db),
):
    """
    Triggers an extraction run across DGCA routes and advance windows using curl_cffi scrapers,
    runs the MAD cleaning & deduplication engine, recomputes the National APIx index,
    and updates the database.

    Set use_mock=true to use synthetic data generation instead of live OTA scraping.
    """
    run_id = f"RUN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    start_time = datetime.utcnow()
    scrape_mode = "synthetic" if req.use_mock else "live"

    # Step 1: Create ScrapingRun record
    scraping_run = ScrapingRun(
        id=run_id,
        status="RUNNING",
        started_at=start_time,
        total_quotes=0,
        failed_sources="[]",
        is_mock=req.use_mock,
    )
    db.add(scraping_run)
    await db.commit()

    try:
        # Step 2: Extraction (curl_cffi live scraping or synthetic fallback)
        raw_quotes, failed_sources = await scraping_engine.execute_full_run(
            routes=req.routes,
            advance_windows=req.advance_days,
            use_mock=req.use_mock,
        )

        for q in raw_quotes:
            q["scraping_run_id"] = run_id

        # Step 3: Data Cleaningg
        cleaned_records, stats = cleaner.clean_fare_batch(raw_quotes)

        # Step 4: Persist Raw Fare Quotes
        raw_entities = [
            FareQuote(
                source=q["source"],
                origin=q["origin"],
                destination=q["destination"],
                route=q["route"],
                departure_date=q["departure_date"],
                advance_days=q["advance_days"],
                carrier=q["carrier"],
                flight_number=q["flight_number"],
                base_fare=q["base_fare"],
                taxes_udf=q["taxes_udf"],
                convenience_charge=q["convenience_charge"],
                total_fare=q["total_fare"],
                timestamp=datetime.utcnow(),
                scraping_run_id=run_id,
            )
            for q in raw_quotes
        ]
        db.add_all(raw_entities)
        await db.flush()

        # Step 5: Persist Cleaned Fares
        clean_entities = [
            CleanedFare(
                source=c["source"],
                route=c["route"],
                origin=c["origin"],
                destination=c["destination"],
                departure_date=c["departure_date"],
                advance_days=c["advance_days"],
                carrier=c["carrier"],
                flight_number=c["flight_number"],
                base_fare=c["base_fare"],
                taxes_udf=c["taxes_udf"],
                net_consumer_fare=c["net_consumer_fare"],
                convenience_charge=c["convenience_charge"],
                total_fare=c["total_fare"],
                is_outlier=c.get("is_outlier", False),
                mad_zscore=c.get("mad_zscore", 0.0),
                timestamp=datetime.utcnow(),
                scraping_run_id=run_id,
            )
            for c in cleaned_records
        ]
        db.add_all(clean_entities)
        await db.flush()

        # Step 6: Recalculate APIx Index
        index_result = index_engine.compute_national_apix(cleaned_records)
        today_str = datetime.utcnow().strftime("%Y-%m-%d")

        # Get previous index to compute daily change %
        prev_stmt = select(IndexValue).where(IndexValue.date != today_str).order_by(desc(IndexValue.date)).limit(1)
        prev_res = await db.execute(prev_stmt)
        prev_idx = prev_res.scalar_one_or_none()

        daily_change = 0.0
        if prev_idx and prev_idx.apix_index > 0:
            daily_change = round(((index_result["national_apix"] - prev_idx.apix_index) / prev_idx.apix_index) * 100.0, 2)

        # Check if today's index already exists to update it, otherwise insert
        today_idx_stmt = select(IndexValue).where(IndexValue.date == today_str)
        today_idx_res = await db.execute(today_idx_stmt)
        existing_today = today_idx_res.scalar_one_or_none()

        if existing_today:
            existing_today.apix_index = index_result["national_apix"]
            existing_today.daily_change_pct = daily_change
            existing_today.quotes_count += len(raw_quotes)
            existing_today.timestamp = datetime.utcnow()
        else:
            new_idx = IndexValue(
                date=today_str,
                timestamp=datetime.utcnow(),
                apix_index=index_result["national_apix"],
                daily_change_pct=daily_change,
                monthly_inflation_pct=round(daily_change * 3.2, 2),
                quotes_count=len(raw_quotes),
                baseline_value=100.0,
                cpi_benchmark=104.2,
            )
            db.add(new_idx)

        # Update RouteIndexValue
        for route, rdata in index_result["routes"].items():
            route_val = RouteIndexValue(
                date=today_str,
                timestamp=datetime.utcnow(),
                route=route,
                route_index=rdata["route_index"],
                route_avg_fare=rdata["route_avg_fare"],
                daily_change_pct=daily_change,
                weight=rdata["weight"],
            )
            db.add(route_val)

        # Step 7: Record Data Quality Metrics
        quality_rec = DataQualityMetric(
            run_id=run_id,
            timestamp=datetime.utcnow(),
            total_raw=stats["total_raw"],
            duplicates_removed=stats["duplicates_removed"],
            outliers_removed=stats["outliers_removed"],
            missing_observations=0,
            quality_score_pct=stats["quality_score_pct"],
        )
        db.add(quality_rec)

        # Finalize ScrapingRun
        scraping_run.status = "COMPLETED"
        scraping_run.completed_at = datetime.utcnow()
        scraping_run.total_quotes = len(raw_quotes)
        scraping_run.failed_sources = json.dumps(failed_sources)

        await db.commit()

        return ScrapingTriggerResponse(
            message="Data extraction, MAD cleaning, and APIx calculation completed successfully.",
            run_id=run_id,
            status="COMPLETED",
            scrape_mode=scrape_mode,
            quotes_collected=len(raw_quotes),
            cleaned_records=len(cleaned_records),
            duplicates_removed=stats["duplicates_removed"],
            outliers_detected=stats["outliers_removed"],
        )

    except Exception as e:
        logger.exception(f"Scraping run {run_id} failed: {e}")
        scraping_run.status = "FAILED"
        scraping_run.completed_at = datetime.utcnow()
        scraping_run.error_log = str(e)
        await db.commit()
        return ScrapingTriggerResponse(
            message=f"Extraction encountered an error: {str(e)}",
            run_id=run_id,
            status="FAILED",
            scrape_mode=scrape_mode,
            quotes_collected=0,
            cleaned_records=0,
            duplicates_removed=0,
            outliers_detected=0,
        )

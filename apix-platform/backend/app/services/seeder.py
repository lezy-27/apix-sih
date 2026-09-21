import asyncio
from datetime import datetime, timedelta
import logging
import random
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.fares import FareQuote, CleanedFare
from app.models.index import IndexValue, RouteIndexValue
from app.models.quality import ScrapingRun, DataQualityMetric
from app.services.scraper import synthetic_generator
from app.services.cleaner import cleaner
from app.services.index_engine import index_engine
from app.config import settings

logger = logging.getLogger("apix.seeder")

async def seed_database_if_empty(db: AsyncSession) -> None:
    """
    Seed initial 90 days of realistic historical airfare quotes, cleaned data,
    daily APIx index values, route indices, and quality metrics if database is fresh.
    """
    # Check if index_values already exist
    stmt = select(func.count(IndexValue.id))
    res = await db.execute(stmt)
    count = res.scalar() or 0
    if count > 0:
        logger.info(f"Database already populated ({count} index records). Skipping seeding.")
        return

    logger.info("Fresh database detected. Seeding 90 days of high-frequency airfare data...")
    today = datetime.utcnow().date()
    routes = list(settings.ROUTE_WEIGHTS.keys())
    windows = list(settings.ADVANCE_WINDOW_WEIGHTS.keys())
    carriers = list(settings.CARRIER_SHARES.keys())
    sources = settings.SOURCES

    # Base index starting 90 days ago at 100.0
    current_index = 100.0
    cpi_benchmark = 100.0

    all_index_records = []
    all_route_records = []
    recent_quotes = []
    recent_cleaned = []

    # Generate 90 days of historical data
    for d in range(89, -1, -1):
        target_date = today - timedelta(days=d)
        date_str = target_date.strftime("%Y-%m-%d")
        dt_timestamp = datetime.combine(target_date, datetime.min.time()) + timedelta(hours=14)

        # Macro trend: realistic moderate inflation with weekly seasonality
        # Weekday/weekend variation + random economic drift
        day_of_week = target_date.weekday()
        weekend_bump = 0.003 if day_of_week in [4, 6] else -0.001
        drift = random.gauss(0.0004, 0.004) + weekend_bump
        daily_change_pct = round(drift * 100.0, 2)
        current_index = round(current_index * (1 + drift), 2)
        
        # Headline CPI drifts smoothly at ~4.8% annual (~0.013% daily)
        cpi_benchmark = round(cpi_benchmark * (1 + 0.00013 + random.gauss(0, 0.0005)), 2)

        # 30-day inflation calculation
        monthly_inflation_pct = round(((current_index - 100.0) / 100.0) * 100.0 * (30.0 / max(1, 90 - d)), 2)

        quotes_count_day = random.randint(180, 260)

        index_rec = IndexValue(
            date=date_str,
            timestamp=dt_timestamp,
            apix_index=current_index,
            daily_change_pct=daily_change_pct,
            monthly_inflation_pct=monthly_inflation_pct,
            quotes_count=quotes_count_day,
            baseline_value=100.0,
            cpi_benchmark=cpi_benchmark,
        )
        all_index_records.append(index_rec)

        # Route indices
        for route, weight in settings.ROUTE_WEIGHTS.items():
            route_base = index_engine.route_base_prices.get(route, 4500.0)
            # Route-specific variance
            route_ratio = (current_index / 100.0) * random.uniform(0.97, 1.03)
            route_idx = round(route_ratio * 100.0, 2)
            route_fare = round(route_base * route_ratio, 2)
            r_daily_change = round(random.gauss(daily_change_pct, 0.4), 2)

            all_route_records.append(
                RouteIndexValue(
                    date=date_str,
                    timestamp=dt_timestamp,
                    route=route,
                    route_index=route_idx,
                    route_avg_fare=route_fare,
                    daily_change_pct=r_daily_change,
                    weight=weight,
                )
            )

        # For the last 7 days, generate individual fare quotes for the explorer and elasticity table
        if d <= 7:
            for route in routes:
                orig, dest = route.split("-")
                for win in windows:
                    dep_date = (target_date + timedelta(days=win)).strftime("%Y-%m-%d")
                    for c in carriers:
                        source = random.choice(sources)
                        q = synthetic_generator.generate_single_quote(
                            source=source,
                            carrier=c,
                            origin=orig,
                            destination=dest,
                            advance_days=win,
                            departure_date=dep_date,
                            inject_outlier=(random.random() < 0.02),
                        )
                        q["timestamp"] = dt_timestamp
                        recent_quotes.append(q)

    # Insert historical indices in bulk
    db.add_all(all_index_records)
    db.add_all(all_route_records)
    await db.flush()

    # Clean recent quotes using DataCleaner and insert
    cleaned_data, quality_stats = cleaner.clean_fare_batch(recent_quotes)

    # Insert FareQuote records
    fare_quote_entities = []
    for q in recent_quotes:
        entity = FareQuote(
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
            timestamp=q["timestamp"] if isinstance(q["timestamp"], datetime) else datetime.fromisoformat(q["timestamp"]),
            scraping_run_id="RUN-SEED-INITIAL",
        )
        fare_quote_entities.append(entity)
    db.add_all(fare_quote_entities)
    await db.flush()

    # Insert CleanedFare records
    cleaned_entities = []
    for c in cleaned_data:
        entity = CleanedFare(
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
            timestamp=c["timestamp"] if isinstance(c["timestamp"], datetime) else datetime.fromisoformat(c["timestamp"]),
            scraping_run_id="RUN-SEED-INITIAL",
        )
        cleaned_entities.append(entity)
    db.add_all(cleaned_entities)

    # Add initial ScrapingRun and DataQualityMetric
    init_run = ScrapingRun(
        id="RUN-SEED-INITIAL",
        status="COMPLETED",
        started_at=datetime.utcnow() - timedelta(minutes=15),
        completed_at=datetime.utcnow() - timedelta(minutes=14),
        total_quotes=len(recent_quotes),
        failed_sources="[]",
        is_mock=True,
    )
    db.add(init_run)

    quality_metric = DataQualityMetric(
        run_id="RUN-SEED-INITIAL",
        timestamp=datetime.utcnow(),
        total_raw=quality_stats["total_raw"],
        duplicates_removed=quality_stats["duplicates_removed"],
        outliers_removed=quality_stats["outliers_removed"],
        missing_observations=0,
        quality_score_pct=quality_stats["quality_score_pct"],
    )
    db.add(quality_metric)

    await db.commit()
    logger.info("Seeding completed successfully!")

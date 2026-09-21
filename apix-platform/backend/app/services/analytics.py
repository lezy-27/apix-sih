from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from app.models.fares import FareQuote, CleanedFare
from app.models.index import IndexValue, RouteIndexValue
from app.models.quality import ScrapingRun, DataQualityMetric
from app.config import settings
from app.schemas.apix import (
    DailyKPIResponse,
    HistoryResponse,
    HistoryPoint,
    RoutesResponse,
    RouteSummary,
    ElasticityResponse,
    AdvanceWindowFare,
)
from app.schemas.fares import FareListResponse, FareQuoteItem
from app.schemas.scraping import ScrapingStatusResponse, DataQualityResponse

logger = logging.getLogger("apix.analytics")

class AnalyticsService:

    async def get_daily_kpis(self, db: AsyncSession) -> DailyKPIResponse:
        """Fetch current high-frequency APIx KPIs for the dashboard."""
        stmt = select(IndexValue).order_by(desc(IndexValue.date)).limit(2)
        res = await db.execute(stmt)
        records = res.scalars().all()

        today_str = datetime.utcnow().strftime("%Y-%m-%d")

        # Count quotes collected today
        quote_count_stmt = select(func.count(FareQuote.id)).where(
            func.substr(FareQuote.timestamp, 1, 10) == today_str
        )
        count_res = await db.execute(quote_count_stmt)
        quotes_today = count_res.scalar() or 0

        if not records:
            # Default baseline
            return DailyKPIResponse(
                national_apix_index=100.0,
                daily_change_pct=0.0,
                monthly_inflation_pct=0.0,
                quotes_collected_today=quotes_today,
                last_updated=datetime.utcnow(),
                baseline_index=100.0,
            )

        latest = records[0]
        prev = records[1] if len(records) > 1 else None

        daily_change = latest.daily_change_pct
        if prev and prev.apix_index > 0:
            daily_change = round(((latest.apix_index - prev.apix_index) / prev.apix_index) * 100.0, 2)

        return DailyKPIResponse(
            national_apix_index=round(latest.apix_index, 2),
            daily_change_pct=daily_change,
            monthly_inflation_pct=round(latest.monthly_inflation_pct, 2),
            quotes_collected_today=quotes_today or latest.quotes_count,
            last_updated=latest.timestamp,
            baseline_index=100.0,
        )

    async def get_history(self, db: AsyncSession, days: int = 30) -> HistoryResponse:
        """Fetch historical APIx values and official CPI comparison for 7d, 30d, 90d, 365d."""
        stmt = select(IndexValue).order_by(desc(IndexValue.date)).limit(days)
        res = await db.execute(stmt)
        records = res.scalars().all()

        points = []
        for r in reversed(records):
            points.append(
                HistoryPoint(
                    date=r.date,
                    apix_index=round(r.apix_index, 2),
                    daily_change_pct=round(r.daily_change_pct, 2),
                    cpi_benchmark=round(r.cpi_benchmark, 2) if r.cpi_benchmark else None,
                    quotes_count=r.quotes_count,
                )
            )

        return HistoryResponse(range_days=days, points=points)

    async def get_route_analysis(self, db: AsyncSession) -> RoutesResponse:
        """Fetch route comparison metrics: current index, weight, avg fare, daily change, sparklines."""
        routes_list = []
        now = datetime.utcnow()

        route_names = {
            "DEL-BOM": "Delhi ↔ Mumbai",
            "DEL-BLR": "Delhi ↔ Bengaluru",
            "BOM-BLR": "Mumbai ↔ Bengaluru",
            "DEL-CCU": "Delhi ↔ Kolkata",
            "BLR-HYD": "Bengaluru ↔ Hyderabad",
            "MAA-DEL": "Chennai ↔ Delhi",
        }

        for route, weight in settings.ROUTE_WEIGHTS.items():
            # Get last 7 days of route index for sparkline
            stmt = (
                select(RouteIndexValue)
                .where(RouteIndexValue.route == route)
                .order_by(desc(RouteIndexValue.date))
                .limit(7)
            )
            res = await db.execute(stmt)
            route_hist = res.scalars().all()

            if route_hist:
                latest = route_hist[0]
                sparkline = [round(r.route_index, 2) for r in reversed(route_hist)]
                current_idx = round(latest.route_index, 2)
                current_avg_fare = round(latest.route_avg_fare, 2)
                daily_change = round(latest.daily_change_pct, 2)
            else:
                current_idx = 100.0
                current_avg_fare = 4500.0
                daily_change = 0.0
                sparkline = [100.0] * 7

            routes_list.append(
                RouteSummary(
                    route=route,
                    route_name=route_names.get(route, route),
                    route_index=current_idx,
                    weight=weight,
                    current_avg_fare=current_avg_fare,
                    daily_change_pct=daily_change,
                    sparkline=sparkline,
                )
            )

        return RoutesResponse(routes=routes_list, last_updated=now)

    async def get_elasticity(self, db: AsyncSession, route: Optional[str] = None) -> ElasticityResponse:
        """Fetch average fare against advance booking windows (T+1, T+7, T+15, T+30, T+60)."""
        window_labels = {1: "T+1", 7: "T+7", 15: "T+15", 30: "T+30", 60: "T+60"}
        windows_data = []
        overall_fares = []

        query = select(CleanedFare).where(CleanedFare.is_outlier == False)
        if route and route != "ALL":
            query = query.where(CleanedFare.route == route)

        res = await db.execute(query.order_by(desc(CleanedFare.timestamp)).limit(2000))
        all_fares = res.scalars().all()

        for win, weight in settings.ADVANCE_WINDOW_WEIGHTS.items():
            win_fares = [f for f in all_fares if f.advance_days == win]
            carrier_map: Dict[str, List[float]] = {}
            for f in win_fares:
                carrier_map.setdefault(f.carrier, []).append(f.net_consumer_fare)
                overall_fares.append(f.net_consumer_fare)

            carrier_avg: Dict[str, float] = {}
            for c, vals in carrier_map.items():
                carrier_avg[c] = round(sum(vals) / len(vals), 2)

            win_avg = round(sum(f.net_consumer_fare for f in win_fares) / len(win_fares), 2) if win_fares else 0.0

            windows_data.append(
                AdvanceWindowFare(
                    advance_days=win,
                    window_label=window_labels.get(win, f"T+{win}"),
                    weight=weight,
                    avg_fare=win_avg,
                    carrier_fares=carrier_avg,
                )
            )

        overall_avg = round(sum(overall_fares) / len(overall_fares), 2) if overall_fares else 0.0

        return ElasticityResponse(
            route=route or "ALL",
            overall_avg_fare=overall_avg,
            windows=windows_data,
        )

    async def get_fares_list(
        self,
        db: AsyncSession,
        page: int = 1,
        limit: int = 50,
        airline: Optional[str] = None,
        source: Optional[str] = None,
        route: Optional[str] = None,
        advance_days: Optional[int] = None,
        date: Optional[str] = None,
    ) -> FareListResponse:
        """Searchable and filterable fare explorer table."""
        filters = []
        if airline:
            filters.append(CleanedFare.carrier == airline)
        if source:
            filters.append(CleanedFare.source == source)
        if route:
            filters.append(CleanedFare.route == route)
        if advance_days:
            filters.append(CleanedFare.advance_days == advance_days)
        if date:
            filters.append(CleanedFare.departure_date == date)

        # Count total
        count_q = select(func.count(CleanedFare.id))
        if filters:
            count_q = count_q.where(and_(*filters))
        total_res = await db.execute(count_q)
        total = total_res.scalar() or 0

        # Query page items
        q = select(CleanedFare)
        if filters:
            q = q.where(and_(*filters))
        q = q.order_by(desc(CleanedFare.timestamp)).offset((page - 1) * limit).limit(limit)

        res = await db.execute(q)
        items = res.scalars().all()

        quote_items = [
            FareQuoteItem(
                id=item.id,
                carrier=item.carrier,
                route=item.route,
                origin=item.origin,
                destination=item.destination,
                departure_date=item.departure_date,
                advance_days=item.advance_days,
                flight_number=item.flight_number,
                base_fare=item.base_fare,
                taxes_udf=item.taxes_udf,
                net_consumer_fare=item.net_consumer_fare,
                convenience_charge=item.convenience_charge,
                total_fare=item.total_fare,
                source=item.source,
                timestamp=item.timestamp,
                is_outlier=item.is_outlier,
            )
            for item in items
        ]

        total_pages = max(1, (total + limit - 1) // limit)

        return FareListResponse(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
            items=quote_items,
            carriers=list(settings.CARRIER_SHARES.keys()),
            sources=settings.SOURCES,
            routes=list(settings.ROUTE_WEIGHTS.keys()),
            advance_windows=list(settings.ADVANCE_WINDOW_WEIGHTS.keys()),
        )

    async def get_scraping_status(self, db: AsyncSession) -> ScrapingStatusResponse:
        """Current scraping status, last run, collected quotes count."""
        stmt = select(ScrapingRun).order_by(desc(ScrapingRun.started_at)).limit(1)
        res = await db.execute(stmt)
        latest_run = res.scalar_one_or_none()

        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        count_stmt = select(func.count(FareQuote.id)).where(
            func.substr(FareQuote.timestamp, 1, 10) == today_str
        )
        count_res = await db.execute(count_stmt)
        today_quotes = count_res.scalar() or 0

        if not latest_run:
            return ScrapingStatusResponse(
                status="IDLE",
                last_successful_run=datetime.utcnow() - timedelta(hours=2),
                quotes_collected_today=today_quotes,
                failed_sources=[],
                active_run_id=None,
                is_mock=True,
            )

        import json
        try:
            failed_sources = json.loads(latest_run.failed_sources or "[]")
        except Exception:
            failed_sources = []

        return ScrapingStatusResponse(
            status=latest_run.status,
            last_successful_run=latest_run.completed_at or latest_run.started_at,
            quotes_collected_today=today_quotes or latest_run.total_quotes,
            failed_sources=failed_sources,
            active_run_id=latest_run.id if latest_run.status == "RUNNING" else None,
            is_mock=latest_run.is_mock,
        )

    async def get_data_quality(self, db: AsyncSession) -> DataQualityResponse:
        """Data quality telemetry: quality %, duplicates removed, MAD outliers removed."""
        stmt = select(DataQualityMetric).order_by(desc(DataQualityMetric.timestamp)).limit(1)
        res = await db.execute(stmt)
        latest = res.scalar_one_or_none()

        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        # Aggregated stats
        raw_count_stmt = select(func.count(FareQuote.id))
        clean_count_stmt = select(func.count(CleanedFare.id)).where(CleanedFare.is_outlier == False)
        outlier_stmt = select(func.count(CleanedFare.id)).where(CleanedFare.is_outlier == True)

        raw_cnt = (await db.execute(raw_count_stmt)).scalar() or 0
        clean_cnt = (await db.execute(clean_count_stmt)).scalar() or 0
        outlier_cnt = (await db.execute(outlier_stmt)).scalar() or 0

        quality_pct = latest.quality_score_pct if latest else 98.4
        dupes_cnt = latest.duplicates_removed if latest else max(0, raw_cnt - clean_cnt - outlier_cnt)

        return DataQualityResponse(
            quality_score_pct=quality_pct,
            total_raw_today=raw_cnt,
            clean_quotes_today=clean_cnt,
            duplicates_removed=dupes_cnt,
            outliers_removed=outlier_cnt,
            missing_observations=0,
            last_run_id=latest.run_id if latest else "RUN-INIT",
            last_evaluated=latest.timestamp if latest else datetime.utcnow(),
        )

analytics_service = AnalyticsService()

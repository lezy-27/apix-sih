from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.analytics import analytics_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard Summary"])

@router.get("/summary", summary="Consolidated Dashboard Overview")
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Returns aggregated KPIs, route summaries, and recent 30-day index trend."""
    kpis = await analytics_service.get_daily_kpis(db)
    routes = await analytics_service.get_route_analysis(db)
    history = await analytics_service.get_history(db, days=30)
    quality = await analytics_service.get_data_quality(db)

    return {
        "kpis": kpis,
        "routes": routes.routes,
        "history": history.points,
        "quality": quality,
    }

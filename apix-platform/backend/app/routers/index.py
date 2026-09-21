from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.analytics import analytics_service
from app.schemas.apix import DailyKPIResponse, HistoryResponse, RoutesResponse

router = APIRouter(prefix="/apix", tags=["APIx Index Engine"])

@router.get("/daily", response_model=DailyKPIResponse, summary="Get current Daily APIx KPIs")
async def get_daily_kpis(db: AsyncSession = Depends(get_db)):
    """
    Returns the latest high-frequency National APIx Index, 
    daily percentage change, 30-day airfare inflation rate, and today's quote count.
    """
    return await analytics_service.get_daily_kpis(db)

@router.get("/history", response_model=HistoryResponse, summary="Get Historical APIx Index & CPI Benchmark")
async def get_index_history(
    days: int = Query(30, description="Time range in days: 7, 30, 90, 365", ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns time-series history of the National APIx Index 
    along with the official CPI benchmark line for macro comparison.
    """
    return await analytics_service.get_history(db, days=days)

@router.get("/routes", response_model=RoutesResponse, summary="Get DGCA Route Indices & Weight Breakdown")
async def get_route_indices(db: AsyncSession = Depends(get_db)):
    """
    Returns current index, DGCA weight, average fare, daily change, 
    and 7-day sparkline for all representative routes (DEL-BOM, DEL-BLR, BOM-BLR, DEL-CCU, BLR-HYD, MAA-DEL).
    """
    return await analytics_service.get_route_analysis(db)

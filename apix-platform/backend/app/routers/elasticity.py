from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.analytics import analytics_service
from app.schemas.apix import ElasticityResponse

router = APIRouter(prefix="/apix", tags=["Lead-Time Elasticity"])

@router.get("/elasticity", response_model=ElasticityResponse, summary="Get Lead-Time Price Elasticity Curve")
async def get_lead_time_elasticity(
    route: Optional[str] = Query("ALL", description="Route filter: ALL or specific route like DEL-BOM"),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns average fare curve across booking windows (T+1, T+7, T+15, T+30, T+60)
    with carrier breakdowns for measuring lead-time price elasticity.
    """
    return await analytics_service.get_elasticity(db, route=route)

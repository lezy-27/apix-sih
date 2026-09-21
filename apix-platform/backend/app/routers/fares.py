from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.analytics import analytics_service
from app.schemas.fares import FareListResponse

router = APIRouter(prefix="/fares", tags=["Fare Explorer"])

@router.get("", response_model=FareListResponse, summary="Query and Filter Fare Quotes")
async def get_fares(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(25, ge=1, le=200, description="Items per page"),
    airline: Optional[str] = Query(None, description="Filter by carrier (e.g. IndiGo)"),
    source: Optional[str] = Query(None, description="Filter by source (e.g. MakeMyTrip)"),
    route: Optional[str] = Query(None, description="Filter by route (e.g. DEL-BOM)"),
    advance_days: Optional[int] = Query(None, description="Filter by advance window (1, 7, 15, 30, 60)"),
    date: Optional[str] = Query(None, description="Filter by departure date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Paginated, searchable, multi-filterable table of airfare quotes including
    Base Fare, Taxes/UDF, Net Consumer Fare, Convenience Charge, Total Fare, and Timestamp.
    """
    return await analytics_service.get_fares_list(
        db=db,
        page=page,
        limit=limit,
        airline=airline,
        source=source,
        route=route,
        advance_days=advance_days,
        date=date,
    )

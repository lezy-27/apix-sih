from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class FareQuoteItem(BaseModel):
    id: int
    carrier: str
    route: str
    origin: str
    destination: str
    departure_date: str
    advance_days: int
    flight_number: str
    base_fare: float
    taxes_udf: float
    net_consumer_fare: float
    convenience_charge: float
    total_fare: float
    source: str
    timestamp: datetime
    is_outlier: Optional[bool] = False

class FareListResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    items: List[FareQuoteItem]
    carriers: List[str]
    sources: List[str]
    routes: List[str]
    advance_windows: List[int]

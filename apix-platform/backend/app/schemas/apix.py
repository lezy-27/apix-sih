from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class DailyKPIResponse(BaseModel):
    national_apix_index: float = Field(..., description="Current National APIx Index")
    daily_change_pct: float = Field(..., description="Percentage change in index since yesterday")
    monthly_inflation_pct: float = Field(..., description="30-day annualized or monthly airfare inflation rate")
    quotes_collected_today: int = Field(..., description="Total price quotes collected today")
    last_updated: datetime = Field(..., description="Timestamp of the latest index calculation")
    baseline_index: float = Field(100.0, description="Reference baseline index value")

class HistoryPoint(BaseModel):
    date: str
    apix_index: float
    daily_change_pct: float
    cpi_benchmark: Optional[float] = None
    quotes_count: int = 0

class HistoryResponse(BaseModel):
    range_days: int
    points: List[HistoryPoint]

class RouteSummary(BaseModel):
    route: str
    route_name: str
    route_index: float
    weight: float
    current_avg_fare: float
    daily_change_pct: float
    sparkline: List[float] = []

class RoutesResponse(BaseModel):
    routes: List[RouteSummary]
    last_updated: datetime

class AdvanceWindowFare(BaseModel):
    advance_days: int
    window_label: str  # T+1, T+7, T+15, T+30, T+60
    weight: float
    avg_fare: float
    carrier_fares: Dict[str, float] = {}

class ElasticityResponse(BaseModel):
    route: str
    overall_avg_fare: float
    windows: List[AdvanceWindowFare]

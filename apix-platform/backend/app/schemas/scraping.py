from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ScrapingStatusResponse(BaseModel):
    status: str  # IDLE, RUNNING, COMPLETED, FAILED
    last_successful_run: Optional[datetime] = None
    quotes_collected_today: int = 0
    failed_sources: List[str] = []
    active_run_id: Optional[str] = None
    is_mock: bool = False

class DataQualityResponse(BaseModel):
    quality_score_pct: float = 100.0
    total_raw_today: int = 0
    clean_quotes_today: int = 0
    duplicates_removed: int = 0
    outliers_removed: int = 0
    missing_observations: int = 0
    last_run_id: Optional[str] = None
    last_evaluated: Optional[datetime] = None

class ScrapingTriggerRequest(BaseModel):
    use_mock: bool = False
    routes: Optional[List[str]] = None
    advance_days: Optional[List[int]] = None

class ScrapingTriggerResponse(BaseModel):
    message: str
    run_id: str
    status: str
    scrape_mode: str = "live"  # "live" or "synthetic"
    quotes_collected: int = 0
    cleaned_records: int = 0
    duplicates_removed: int = 0
    outliers_detected: int = 0

# --- Source Health Schemas (NEW) ---

class SourceHealthItem(BaseModel):
    name: str
    source_type: str        # "Airline Direct" | "OTA Aggregator"
    status: str             # "Online" | "Blocked" | "Timeout" | "Error" | "Unknown"
    last_response_ms: Optional[float] = None
    quotes_last_run: int = 0
    last_checked: Optional[datetime] = None

class SourceHealthResponse(BaseModel):
    sources: List[SourceHealthItem]

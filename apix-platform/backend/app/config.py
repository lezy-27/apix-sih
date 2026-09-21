import json
from typing import Dict, List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Real-Time Airfare Price Index (APIx)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./apix.db"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]

    # Scraper settings
    SCRAPER_HEADLESS: bool = True
    SCRAPER_TIMEOUT_MS: int = 15000
    SCRAPER_CONCURRENCY: int = 3
    SCRAPER_DOMAIN_DELAY_SEC: float = 1.0
    USE_MOCK_FALLBACK: bool = True

    # DGCA Representative Route Weights (Sum = 1.00)
    ROUTE_WEIGHTS: Dict[str, float] = {
        "DEL-BOM": 0.25,
        "DEL-BLR": 0.20,
        "BOM-BLR": 0.15,
        "DEL-CCU": 0.15,
        "BLR-HYD": 0.12,
        "MAA-DEL": 0.13,
    }

    # Advance-Window Weights (Sum = 1.00)
    ADVANCE_WINDOW_WEIGHTS: Dict[int, float] = {
        1: 0.15,    # T+1
        7: 0.35,    # T+7
        15: 0.25,   # T+15
        30: 0.15,   # T+30
        60: 0.10,   # T+60
    }

    # Carrier Market Shares (Sum = 1.00)
    CARRIER_SHARES: Dict[str, float] = {
        "IndiGo": 0.60,
        "Air India": 0.25,
        "Akasa Air": 0.08,
        "SpiceJet": 0.07,
    }

    # Target Sources
    SOURCES: List[str] = [
        "IndiGo",
        "Air India",
        "Akasa Air",
        "SpiceJet",
        "MakeMyTrip",
        "EaseMyTrip",
    ]

    # Modified Z-Score (MAD) Outlier Threshold
    MAD_THRESHOLD: float = 3.5

    # Index Base
    BASE_INDEX_VALUE: float = 100.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

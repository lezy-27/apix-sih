from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Text, Boolean
from app.database import Base

class ScrapingRun(Base):
    __tablename__ = "scraping_runs"

    id = Column(String(64), primary_key=True)
    status = Column(String(20), nullable=False, default="RUNNING")  # RUNNING, COMPLETED, FAILED
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    total_quotes = Column(Integer, default=0)
    failed_sources = Column(Text, default="[]")  # JSON list
    error_log = Column(Text, nullable=True)
    is_mock = Column(Boolean, default=False)

class DataQualityMetric(Base):
    __tablename__ = "data_quality_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    total_raw = Column(Integer, default=0)
    duplicates_removed = Column(Integer, default=0)
    outliers_removed = Column(Integer, default=0)
    missing_observations = Column(Integer, default=0)
    quality_score_pct = Column(Float, default=100.0)

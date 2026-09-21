from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Index
from app.database import Base

class IndexValue(Base):
    __tablename__ = "index_values"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    apix_index = Column(Float, nullable=False)
    daily_change_pct = Column(Float, default=0.0)
    monthly_inflation_pct = Column(Float, default=0.0)
    quotes_count = Column(Integer, default=0)
    baseline_value = Column(Float, default=100.0)
    cpi_benchmark = Column(Float, nullable=True)

class RouteIndexValue(Base):
    __tablename__ = "route_index_values"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    route = Column(String(20), nullable=False, index=True)
    route_index = Column(Float, nullable=False)
    route_avg_fare = Column(Float, nullable=False)
    daily_change_pct = Column(Float, default=0.0)
    weight = Column(Float, nullable=False)

    __table_args__ = (
        Index("ix_route_index_lookup", "route", "date"),
    )

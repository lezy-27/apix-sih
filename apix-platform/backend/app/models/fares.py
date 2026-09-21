from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, Index
from app.database import Base

class FareQuote(Base):
    __tablename__ = "fare_quotes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(50), nullable=False, index=True)
    origin = Column(String(10), nullable=False)
    destination = Column(String(10), nullable=False)
    route = Column(String(20), nullable=False, index=True)
    departure_date = Column(String(20), nullable=False, index=True)
    advance_days = Column(Integer, nullable=False, index=True)
    carrier = Column(String(50), nullable=False, index=True)
    flight_number = Column(String(50), nullable=False)
    base_fare = Column(Float, nullable=False)
    taxes_udf = Column(Float, nullable=False)
    convenience_charge = Column(Float, default=0.0)
    total_fare = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    scraping_run_id = Column(String(64), nullable=True, index=True)

    __table_args__ = (
        Index("ix_fare_quotes_dedup", "origin", "destination", "departure_date", "advance_days", "carrier", "flight_number"),
    )

class CleanedFare(Base):
    __tablename__ = "cleaned_fares"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quote_id = Column(Integer, nullable=True)
    source = Column(String(50), nullable=False, index=True)
    route = Column(String(20), nullable=False, index=True)
    origin = Column(String(10), nullable=False)
    destination = Column(String(10), nullable=False)
    departure_date = Column(String(20), nullable=False, index=True)
    advance_days = Column(Integer, nullable=False, index=True)
    carrier = Column(String(50), nullable=False, index=True)
    flight_number = Column(String(50), nullable=False)
    base_fare = Column(Float, nullable=False)
    taxes_udf = Column(Float, nullable=False)
    net_consumer_fare = Column(Float, nullable=False)  # base_fare + taxes_udf
    convenience_charge = Column(Float, default=0.0)
    total_fare = Column(Float, nullable=False)
    is_outlier = Column(Boolean, default=False, index=True)
    mad_zscore = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    scraping_run_id = Column(String(64), nullable=True)

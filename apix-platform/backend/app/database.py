import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.config import settings

logger = logging.getLogger("apix.database")

# Create async engine
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db() -> None:
    """Initialize database tables and TimescaleDB hypertables if on PostgreSQL."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Check if database is PostgreSQL and setup TimescaleDB
        if "postgresql" in settings.DATABASE_URL:
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"))
                # Create hypertables for time-series tables
                hypertables = [
                    ("fare_quotes", "timestamp"),
                    ("cleaned_fares", "timestamp"),
                    ("index_values", "timestamp"),
                    ("route_index_values", "timestamp"),
                ]
                for table, time_col in hypertables:
                    await conn.execute(text(
                        f"SELECT create_hypertable('{table}', '{time_col}', if_not_exists => TRUE);"
                    ))
                logger.info("TimescaleDB hypertables configured successfully.")
            except Exception as e:
                logger.warning(f"TimescaleDB extension setup skipped or failed: {e}")

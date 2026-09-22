from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, AsyncSessionLocal
from app.services.seeder import seed_database_if_empty
from app.routers import (
    index_router,
    elasticity_router,
    fares_router,
    scraping_router,
    dashboard_router,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("apix.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AeroIndex Platform Database...")
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_database_if_empty(session)
    logger.info("AeroIndex Platform startup completed successfully.")
    yield
    logger.info("Shutting down AeroIndex Platform...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-Frequency Retail Airfare Inflation Tracker & DGCA Price Index Platform",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers under /api/v1
app.include_router(index_router, prefix=settings.API_V1_STR)
app.include_router(elasticity_router, prefix=settings.API_V1_STR)
app.include_router(fares_router, prefix=settings.API_V1_STR)
app.include_router(scraping_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }

@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Welcome to the Real-Time Airfare Price Index (AeroIndex) API",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": "/health",
    }

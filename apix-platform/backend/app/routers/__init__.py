from app.routers.index import router as index_router
from app.routers.elasticity import router as elasticity_router
from app.routers.fares import router as fares_router
from app.routers.scraping import router as scraping_router
from app.routers.dashboard import router as dashboard_router

__all__ = [
    "index_router",
    "elasticity_router",
    "fares_router",
    "scraping_router",
    "dashboard_router",
]

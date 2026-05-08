from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.logging import setup_logging
from app.database import init_db
from app.routers import health, parcels, plans, municipalities, map, reports, watchlist, auth
from app.celery_app import celery_app
import structlog

# Setup logging
setup_logging()
logger = structlog.get_logger()

def create_app():
    app = FastAPI(
        title="eImarTR API — Türkiye Ulusal e-İmar Platformu",
        description="API for accessing parcel, plan, and municipality data from various sources including TKGM, e-Plan, and TUCBS.",
        version="0.1.0"
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(health.router, prefix="", tags=["health"])
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(parcels.router, prefix="/api/v1", tags=["parcels"])
    app.include_router(plans.router, prefix="/api/v1", tags=["plans"])
    app.include_router(municipalities.router, prefix="/api/v1", tags=["municipalities"])
    app.include_router(map.router, prefix="/api/v1/map", tags=["map"])
    app.include_router(reports.router, prefix="/api/v1", tags=["reports"])
    app.include_router(watchlist.router, prefix="/api/v1", tags=["watchlist"])
    
    @app.on_event("startup")
    async def startup_event():
        logger.info("Initializing database")
        await init_db()
        logger.info("Database initialized")
        
        # Initialize Celery
        logger.info("Initializing Celery")
        celery_app.conf.update(
            broker_url="redis://redis:6379/0",
            result_backend="redis://redis:6379/0"
        )
        logger.info("Celery initialized")
    
    return app

app = create_app()
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.celery_app import celery_app
from app.core.logging import setup_logging
from app.database import safe_init_db
from app.routers import auth, health, map, municipalities, parcels, plans, reports, watchlist
from app.routers import aski, sources

setup_logging()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_error = await safe_init_db()
    if db_error:
        logger.warning("Database init skipped", error=db_error)
        app.state.db_init_error = db_error
    else:
        logger.info("Database initialized")
        app.state.db_init_error = None

    celery_app.conf.update(
        broker_url="redis://redis:6379/0",
        result_backend="redis://redis:6379/0",
    )
    yield


def create_app():
    app = FastAPI(
        title="eImarTR API — Türkiye Ulusal e-İmar Platformu",
        description="API for accessing parcel, plan, and municipality data from various sources including TKGM, e-Plan, and TUCBS.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="", tags=["health"])
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(parcels.router, prefix="/api/v1", tags=["parcels"])
    app.include_router(plans.router, prefix="/api/v1", tags=["plans"])
    app.include_router(municipalities.router, prefix="/api/v1", tags=["municipalities"])
    app.include_router(map.router, prefix="/api/v1/map", tags=["map"])
    app.include_router(reports.router, prefix="/api/v1", tags=["reports"])
    app.include_router(watchlist.router, prefix="/api/v1", tags=["watchlist"])
    app.include_router(sources.router, prefix="/api/v1/sources", tags=["sources"])
    app.include_router(aski.router, prefix="/api/v1/aski", tags=["aski"])

    return app


app = create_app()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.logging import setup_logging
from app.database import init_db
from app.core.exceptions import custom_exception_handler
from app.config import settings
from app.routers import (
    health, parcels, plans, municipalities, map, reports, watchlist, auth,
    simulation, satellite, analysis, user_data,
)
import structlog

setup_logging()
logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database")
    await init_db()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down application")

app = FastAPI(
    title="eImarTR API — Türkiye Ulusal e-İmar Platformu",
    description="Backend API for Turkey's national e-Imar platform. Integrates TKGM, e-Plan, TUCBS, municipal KEOS, 3D simulation, satellite analysis, and watchlist change detection.",
    version="0.1.0",
    lifespan=lifespan,
)

_cors_origins = getattr(settings, "CORS_ORIGINS", "*")
if isinstance(_cors_origins, str):
    _cors_origins = [o.strip() for o in _cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
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
app.include_router(simulation.router, prefix="/api/v1", tags=["simulation"])
app.include_router(satellite.router, prefix="/api/v1", tags=["satellite"])
app.include_router(analysis.router, prefix="/api/v1", tags=["analysis"])
app.include_router(user_data.router, prefix="/api/v1", tags=["user-data"])

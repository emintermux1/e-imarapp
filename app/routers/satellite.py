from fastapi import APIRouter, HTTPException
from app.schemas.satellite import (
    SentinelTileRequest, SentinelTileResponse,
    ChangeDetectionRequest, ChangeDetectionResponse,
    IllegalConstructionRequest, IllegalConstructionResponse,
    ConstructionProgressRequest, ConstructionProgressResponse,
    EmptyParcelsRequest, EmptyParcelsResponse
)
from app.services.satellite_service import SatelliteAnalysisService

router = APIRouter(prefix="/api/v1/satellite", tags=["satellite"])

# Initialize service
satellite_service = SatelliteAnalysisService()


@router.post("/sentinel-tile", response_model=SentinelTileResponse)
async def fetch_sentinel_tile(request: SentinelTileRequest):
    try:
        result = await satellite_service.fetch_sentinel_tile(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Sentinel tile: {str(e)}")


@router.post("/changes", response_model=ChangeDetectionResponse)
async def detect_changes(request: ChangeDetectionRequest):
    try:
        result = await satellite_service.detect_changes(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Change detection failed: {str(e)}")


@router.post("/illegal-construction", response_model=IllegalConstructionResponse)
async def detect_illegal_construction(request: IllegalConstructionRequest):
    try:
        result = await satellite_service.detect_illegal_construction(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Illegal construction detection failed: {str(e)}")


@router.post("/construction-progress", response_model=ConstructionProgressResponse)
async def track_construction_progress(request: ConstructionProgressRequest):
    try:
        result = await satellite_service.track_construction_progress(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Construction progress tracking failed: {str(e)}")


@router.post("/empty-parcels", response_model=EmptyParcelsResponse)
async def detect_empty_parcels(request: EmptyParcelsRequest):
    try:
        result = await satellite_service.detect_empty_parcels(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Empty parcel detection failed: {str(e)}")
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.satellite_service import SatelliteAnalysisService

router = APIRouter()
service = SatelliteAnalysisService()

@router.post("/satellite/changes")
async def detect_changes(
    bbox: List[float],
    date_before: str,
    date_after: str
):
    """İki tarih arasındaki değişim tespiti."""
    try:
        result = await service.detect_changes(bbox, date_before, date_after)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/satellite/illegal-construction")
async def detect_illegal_construction(
    bbox: List[float],
    plan_geom_geojson: Dict[str, Any] = None,
    existing_buildings: List[Dict[str, Any]] = []
):
    """Plan dışı kaçak yapı tespiti."""
    try:
        result = await service.detect_illegal_construction(bbox, plan_geom_geojson, existing_buildings)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/satellite/construction-progress")
async def track_construction_progress(
    bbox: List[float],
    dates: List[str]
):
    """İnşaat ilerleme takibi."""
    try:
        result = await service.track_construction_progress(bbox, dates)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/satellite/empty-parcels")
async def detect_empty_parcels(
    bbox: List[float],
    parcel_geoms: List[Dict[str, Any]]
):
    """Boş parsel tespiti."""
    try:
        result = await service.detect_empty_parcels(bbox, parcel_geoms)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/satellite/sentinel-info")
async def sentinel_info(
    bbox: List[float],
    date_from: str,
    date_to: str,
    cloud_cover: float = 20.0
):
    """Sentinel-2 metadata fetch."""
    try:
        result = await service.fetch_sentinel_metadata(bbox, date_from, date_to, cloud_cover)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
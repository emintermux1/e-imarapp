from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.simulation_service import BuildingSimulationService
from app.schemas.simulation import (
    BuildingVolumeRequest, BuildingVolumeResponse,
    ShadowAnalysisRequest, ShadowAnalysisResponse,
    ComplianceRequest, ComplianceResponse,
    NeighborVisibilityRequest, NeighborVisibilityResponse,
    CesiumTilesetRequest, CesiumTilesetResponse,
)

router = APIRouter()
service = BuildingSimulationService()

@router.post("/simulation/building/volume", response_model=BuildingVolumeResponse)
async def calc_volume(req: BuildingVolumeRequest):
    try:
        result = service.calculate_building_volume(
            req.footprint_geojson, req.floors, req.floor_height
        )
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulation/shadow", response_model=ShadowAnalysisResponse)
async def shadow_analysis(req: ShadowAnalysisRequest):
    try:
        result = service.calculate_shadow(
            req.footprint_geojson, req.building_height,
            req.sun_azimuth_deg, req.sun_elevation_deg
        )
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulation/compliance", response_model=ComplianceResponse)
async def check_compliance(req: ComplianceRequest):
    try:
        result = service.check_compliance(
            req.footprint_geojson, req.parcel_area_m2,
            req.emsal, req.gabari, req.h_max,
            req.floors, req.floor_height
        )
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulation/neighbor-visibility", response_model=NeighborVisibilityResponse)
async def neighbor_visibility(req: NeighborVisibilityRequest):
    try:
        neighbors = [{"footprint": n.footprint, "height": n.height} for n in req.neighbor_buildings]
        result = service.neighbor_visibility(
            req.target_footprint, req.target_height, neighbors, req.observer_height
        )
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulation/cesium-tileset", response_model=CesiumTilesetResponse)
async def generate_tileset(req: CesiumTilesetRequest):
    try:
        tileset = service.generate_cesium_tileset(req.buildings)
        return {"tileset": tileset}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

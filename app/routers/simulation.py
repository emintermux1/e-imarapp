from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
from app.schemas.simulation import (
    BuildingVolumeRequest, BuildingVolumeResponse,
    ShadowAnalysisRequest, ShadowAnalysisResponse,
    NeighborVisibilityRequest, NeighborVisibilityResponse,
    ComplianceRequest, ComplianceResponse,
    CesiumTilesetRequest, CesiumTilesetResponse
)
from app.services.simulation_service import BuildingSimulationService

router = APIRouter(prefix="/api/v1/simulation", tags=["simulation"])

# Initialize service
simulation_service = BuildingSimulationService()


@router.post("/building/volume", response_model=BuildingVolumeResponse)
async def calculate_building_volume(request: BuildingVolumeRequest):
    try:
        result = simulation_service.calculate_building_volume(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Volume calculation failed: {str(e)}")


@router.post("/shadow", response_model=ShadowAnalysisResponse)
async def shadow_analysis(request: ShadowAnalysisRequest):
    try:
        result = simulation_service.calculate_shadow_analysis(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Shadow analysis failed: {str(e)}")


@router.post("/neighbor-visibility", response_model=NeighborVisibilityResponse)
async def neighbor_visibility(request: NeighborVisibilityRequest):
    try:
        result = simulation_service.calculate_neighbor_visibility(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Neighbor visibility analysis failed: {str(e)}")


@router.post("/compliance", response_model=ComplianceResponse)
async def check_compliance(request: ComplianceRequest):
    try:
        result = simulation_service.check_emsal_gabari_compliance(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Compliance check failed: {str(e)}")


@router.post("/cesium-tileset", response_model=CesiumTilesetResponse)
async def generate_cesium_tileset(request: CesiumTilesetRequest):
    try:
        result = simulation_service.generate_cesium_tileset(request)
        return {"tileset": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cesium tileset generation failed: {str(e)}")
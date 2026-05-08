from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List
from app.schemas.analysis import (
    MergeableParcelsRequest, MergeableParcelsResponse,
    AreaValueRequest, AreaValueResponse,
    ImarChangesRequest, ImarChangesResponse,
    PlanLegendRequest, PlanLegendResponse
)
from app.services.analysis_service import AnalysisService
from app.core.database import get_db

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])

# Initialize service
analysis_service = AnalysisService()


@router.post("/mergeable-parcels", response_model=MergeableParcelsResponse)
async def find_mergeable_parcels(request: MergeableParcelsRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await analysis_service.find_mergeable_parcels(request, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find mergeable parcels: {str(e)}")


@router.post("/area-value", response_model=AreaValueResponse)
async def estimate_area_value(request: AreaValueRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await analysis_service.estimate_area_value(request, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to estimate area value: {str(e)}")


@router.post("/imar-changes", response_model=ImarChangesResponse)
async def detect_imar_changes(request: ImarChangesRequest):
    try:
        result = await analysis_service.detect_imar_changes(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to detect imar changes: {str(e)}")


@router.post("/plan-legend", response_model=PlanLegendResponse)
async def parse_plan_legend(request: PlanLegendRequest):
    try:
        result = await analysis_service.parse_plan_legend(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse plan legend: {str(e)}")
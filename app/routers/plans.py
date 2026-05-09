from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.plan import Plan
from app.schemas.plan import PlanResponse, PlanListResponse
from app.services.eplan_service import EPlanService

router = APIRouter()


@router.get("/plans", response_model=PlanListResponse)
async def list_plans(
    municipality_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    plan_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Plan).offset(skip).limit(limit)
    if municipality_id:
        stmt = stmt.where(Plan.municipality_id == municipality_id)
    if status:
        stmt = stmt.where(Plan.status == status)
    if plan_type:
        stmt = stmt.where(Plan.plan_type == plan_type)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return {"items": items, "total": len(items)}


@router.get("/plans/aski")
async def list_aski_plans(db: AsyncSession = Depends(get_db)):
    async with EPlanService() as service:
        return await service.get_aski_plans()


@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(plan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

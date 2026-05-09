from __future__ import annotations

from fastapi import APIRouter

from app.aggregators.service import AskiAggregator

router = APIRouter()
aggregator = AskiAggregator()


@router.get("/active")
async def get_active_aski():
    return await aggregator.aggregate_active_aski()


@router.get("/active/geojson")
async def get_active_aski_geojson():
    return await aggregator.aggregate_active_aski_geojson()

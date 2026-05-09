from __future__ import annotations

import asyncio
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.services.netcad_keos_service import NetcadKeosService
from app.services.source_registry import get_source, list_sources, live_layer_candidates

router = APIRouter()


@router.get("/sources")
async def get_sources(kind: Optional[str] = Query(None), province: Optional[str] = Query(None)):
    sources = list_sources()
    if kind:
        sources = [s for s in sources if s.get("kind") == kind]
    if province:
        sources = [s for s in sources if (s.get("province") or "").lower() == province.lower()]
    return sources


@router.get("/sources/health")
async def get_sources_health(limit: int = Query(12, ge=1, le=40)):
    sources = list_sources()[:limit]
    semaphore = asyncio.Semaphore(6)
    async with NetcadKeosService(timeout=4.0, max_connections=12) as service:
        async def probe(source_dict):
            source = get_source(source_dict["id"])
            if source is None:
                return None
            async with semaphore:
                result = await service._probe_endpoint(source.homepage_url)
                status = result.get("status", "timeout")
                if source.requires_credentials and status == "live":
                    status = "requires_auth"
                elif source.requires_approval and status == "live":
                    status = "requires_approval"
                return {
                    "source_id": source.id,
                    "name": source.name,
                    "slug": source.slug,
                    "kind": source.kind,
                    "homepage_url": source.homepage_url,
                    "status": status,
                    "http_status": result.get("http_status"),
                    "checked_url": source.homepage_url,
                    "requires_approval": source.requires_approval,
                    "requires_credentials": source.requires_credentials,
                }
        results = await asyncio.gather(*(probe(s) for s in sources), return_exceptions=True)
    return [r for r in results if isinstance(r, dict)]


@router.post("/sources/{source_id}/discover")
async def discover_source(source_id: str):
    source = get_source(source_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Veri kaynağı bulunamadı")
    async with NetcadKeosService(timeout=6.0, max_connections=16) as service:
        try:
            return await service.discover_source_urls(source, detailed=True)
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Kaynak keşfi tamamlanamadı: {exc}") from exc

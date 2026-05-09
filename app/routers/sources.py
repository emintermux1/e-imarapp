from __future__ import annotations

import asyncio
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.connectors.http import get_client
from app.connectors.probe import probe_source
from app.core.responses import envelope
from app.services.netcad_keos_service import NetcadKeosService
from app.services.source_registry import get_source as get_legacy_source
from app.services.source_registry import list_sources as list_legacy_sources
from app.sources.registry import get_source, list_sources

router = APIRouter()


def _legacy_filters(sources: list[dict], kind: Optional[str], province: Optional[str]):
    if kind:
        sources = [s for s in sources if s.get("kind") == kind]
    if province:
        sources = [s for s in sources if (s.get("province") or "").lower() == province.lower()]
    return sources


@router.get("/sources")
async def get_sources(
    kind: Optional[str] = Query(None),
    province: Optional[str] = Query(None),
    category: str | None = Query(default=None),
    capability: str | None = Query(default=None),
    provider: str | None = Query(default=None),
):
    if category or capability or provider:
        sources = list_sources()
        if category:
            sources = [src for src in sources if src.category.value == category]
        if capability:
            sources = [src for src in sources if capability in src.capabilities]
        if provider:
            sources = [src for src in sources if src.provider.value == provider]
        return envelope("ok", sources=[src.to_dict() for src in sources], total=len(sources))
    return _legacy_filters(list_legacy_sources(), kind, province)


@router.get("/sources/health")
async def get_sources_health(limit: int = Query(40, ge=1, le=80)):
    registry_sources = list_sources()
    async with await get_client() as client:
        tasks = [asyncio.wait_for(probe_source(client, src), timeout=4.0) for src in registry_sources[:limit]]
        probes = await asyncio.gather(*tasks, return_exceptions=True)
    rollup = {"ok": 0, "unavailable": 0, "requires_credentials": 0, "captcha_required": 0, "provider_error": 0, "public_partial": 0, "other": 0}
    items = []
    for src, probe in zip(registry_sources[:limit], probes, strict=False):
        if isinstance(probe, Exception):
            probe = {"status": "unavailable", "message": str(probe), "discovered_endpoints": [], "latency_ms": None, "http_status": None}
        status = str(probe.get("status", "other"))
        rollup[status if status in rollup else "other"] += 1
        item = {**src.to_dict(), **probe}
        items.append(item)
    if items:
        return envelope("partial" if rollup["ok"] else "empty", total=len(items), rollup=rollup, sources=items)

    legacy = _legacy_filters(list_legacy_sources(), None, None)[:limit]
    semaphore = asyncio.Semaphore(6)
    async with NetcadKeosService(timeout=4.0, max_connections=12) as service:
        async def probe_legacy(source_dict):
            source = get_legacy_source(source_dict["id"])
            if source is None:
                return None
            async with semaphore:
                result = await service._probe_endpoint(source.homepage_url)
                status = result.get("status", "timeout")
                if source.requires_credentials and status == "live":
                    status = "requires_auth"
                elif source.requires_approval and status == "live":
                    status = "requires_approval"
                return {**source.to_dict(), "source_id": source.id, "status": status, "http_status": result.get("http_status"), "checked_url": source.homepage_url}
        results = await asyncio.gather(*(probe_legacy(s) for s in legacy), return_exceptions=True)
    return [r for r in results if isinstance(r, dict)]


@router.get("/sources/{source_id}")
async def get_source_detail(source_id: str):
    src = get_source(source_id)
    if src:
        async with await get_client() as client:
            probe = await probe_source(client, src)
        return envelope("ok", source=src.to_dict(), probe=probe)
    legacy = get_legacy_source(source_id)
    if legacy:
        return legacy.to_dict()
    return envelope("invalid_input", message="Kaynak bulunamadı.")


@router.post("/sources/{source_id}/probe")
async def reprobe_source(source_id: str):
    src = get_source(source_id)
    if not src:
        return envelope("invalid_input", message="Kaynak bulunamadı.")
    async with await get_client() as client:
        probe = await probe_source(client, src)
    return envelope("ok", source=src.to_dict(), probe=probe)


@router.post("/sources/{source_id}/discover")
async def discover_source(source_id: str):
    legacy = get_legacy_source(source_id)
    if legacy is not None:
        async with NetcadKeosService(timeout=6.0, max_connections=16) as service:
            try:
                return await service.discover_source_urls(legacy, detailed=True)
            except Exception as exc:
                raise HTTPException(status_code=502, detail=f"Kaynak keşfi tamamlanamadı: {exc}") from exc
    src = get_source(source_id)
    if not src:
        raise HTTPException(status_code=404, detail="Veri kaynağı bulunamadı")
    service = NetcadKeosService()
    return await service.discover_source(src)

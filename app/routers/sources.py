from __future__ import annotations

import asyncio

from fastapi import APIRouter, Query

from app.connectors.http import get_client
from app.connectors.probe import probe_source
from app.core.responses import envelope
from app.sources.registry import get_source, list_sources

router = APIRouter()


@router.get("")
async def get_sources(
    category: str | None = Query(default=None),
    capability: str | None = Query(default=None),
    provider: str | None = Query(default=None),
):
    sources = list_sources()
    if category:
        sources = [src for src in sources if src.category.value == category]
    if capability:
        sources = [src for src in sources if capability in src.capabilities]
    if provider:
        sources = [src for src in sources if src.provider.value == provider]
    return envelope("ok", sources=[src.to_dict() for src in sources], total=len(sources))


@router.get("/health")
async def get_sources_health():
    sources = list_sources()
    async with await get_client() as client:
        tasks = [asyncio.wait_for(probe_source(client, src), timeout=4.0) for src in sources]
        probes = await asyncio.gather(*tasks, return_exceptions=True)
    rollup = {"ok": 0, "unavailable": 0, "requires_credentials": 0, "captcha_required": 0, "provider_error": 0, "public_partial": 0, "other": 0}
    items = []
    for src, probe in zip(sources, probes, strict=False):
        if isinstance(probe, Exception):
            probe = {"status": "unavailable", "message": str(probe), "discovered_endpoints": [], "latency_ms": None, "http_status": None}
        status = str(probe.get("status", "other"))
        if status in rollup:
            rollup[status] += 1
        else:
            rollup["other"] += 1
        items.append({**src.to_dict(), **probe})
    overall = "partial" if rollup["ok"] else "empty"
    return envelope(overall, total=len(sources), rollup=rollup, sources=items)


@router.get("/{source_id}")
async def get_source_detail(source_id: str):
    src = get_source(source_id)
    if not src:
        return envelope("invalid_input", message="Kaynak bulunamadı.")
    async with await get_client() as client:
        probe = await probe_source(client, src)
    return envelope("ok", source=src.to_dict(), probe=probe)


@router.post("/{source_id}/probe")
async def reprobe_source(source_id: str):
    src = get_source(source_id)
    if not src:
        return envelope("invalid_input", message="Kaynak bulunamadı.")
    async with await get_client() as client:
        probe = await probe_source(client, src)
    return envelope("ok", source=src.to_dict(), probe=probe)

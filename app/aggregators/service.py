from __future__ import annotations

import asyncio
from typing import Any

from app.connectors.http import get_client
from app.connectors.probe import probe_source
from app.core.responses import envelope
from app.sources.registry import SourceEntry, sources_by_capability


class AskiAggregator:
    def __init__(self) -> None:
        self._cache: dict[str, Any] | None = None

    async def aggregate_active_aski(self) -> dict[str, Any]:
        if self._cache is not None:
            return self._cache

        sources = sources_by_capability("aski-list")
        async with await get_client() as client:
            tasks = [asyncio.wait_for(probe_source(client, src), timeout=4.0) for src in sources]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        notices: list[dict[str, Any]] = []
        source_statuses: list[dict[str, Any]] = []
        ok_count = 0
        for src, result in zip(sources, results, strict=False):
            if isinstance(result, Exception):
                source_statuses.append(
                    {
                        "id": src.id,
                        "name": src.name,
                        "status": "provider_error",
                        "count": 0,
                        "latency_ms": None,
                        "message": str(result),
                    }
                )
                continue
            status = result.get("status", "unavailable")
            if status == "ok":
                ok_count += 1
            source_statuses.append(
                {
                    "id": src.id,
                    "name": src.name,
                    "status": status,
                    "count": 0,
                    "latency_ms": result.get("latency_ms"),
                    "message": result.get("message"),
                    "discovered_endpoints": result.get("discovered_endpoints", [])[:10],
                }
            )

        overall = "partial" if ok_count else "empty"
        payload = envelope(
            overall,
            message="Aktif askı kayıtları probe edildi; public geometri bulunursa bu liste dolacak.",
            next_actions=[
                "e-Plan public listesi erişilebilir ise HTML tablosunu parse edip notice üretin",
                "KEOS discovery sonrası askı katmanı bulunan kaynaklardan gerçek geometri akıtın",
            ],
            count=len(notices),
            notices=notices,
            sources=source_statuses,
            total_sources=len(sources),
            ok_sources=ok_count,
        )
        self._cache = payload
        return payload

    async def aggregate_active_aski_geojson(self) -> dict[str, Any]:
        base = await self.aggregate_active_aski()
        return {
            "type": "FeatureCollection",
            "status": base.get("status", "empty"),
            "count": base.get("count", 0),
            "features": [],
            "sources": base.get("sources", []),
            "fetched_at": base.get("fetched_at"),
        }

from __future__ import annotations

from app.connectors.http import get_client
from app.connectors.probe import probe_source
from app.core.responses import envelope
from app.sources.registry import list_sources, sources_by_category


class TUCBSService:
    async def get_municipalities(self):
        municipal = sources_by_category("municipal")
        return envelope(
            "ok",
            municipalities=[
                {
                    "id": src.id,
                    "name": src.municipality_name or src.name,
                    "provider": src.provider.value,
                    "base_url": src.base_url,
                }
                for src in municipal
            ],
            total=len(municipal),
        )

    async def discover_municipality(self, municipality_id: int):
        municipal = sources_by_category("municipal")
        if municipality_id < 0 or municipality_id >= len(municipal):
            return envelope("invalid_input", message="Municipality index geçersiz.")
        src = municipal[municipality_id]
        async with await get_client() as client:
            probe = await probe_source(client, src)
        return envelope("ok", municipality=src.to_dict(), probe=probe)

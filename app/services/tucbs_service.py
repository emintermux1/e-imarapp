from __future__ import annotations

from typing import Dict, List, Optional

import httpx

from app.connectors.http import get_client
from app.connectors.probe import probe_source
from app.core.responses import envelope
from app.services.ogc_service import OGCService
from app.sources.registry import list_sources, sources_by_category


class TUCBSService:
    """Türkiye Ulusal Coğrafi Bilgi Sistemi (TUCBS) entegrasyon servisi."""

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
        self.base_url = "https://tucbs-public-api.csb.gov.tr"
        self.csb_cbs_url = "https://cbs.csb.gov.tr"

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

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

    async def get_available_layers(self) -> List[Dict]:
        wms_url = f"{self.csb_cbs_url}/geoserver/ows?service=WMS&request=GetCapabilities"
        try:
            ogc = OGCService(wms_url=wms_url)
            caps = await ogc.get_wms_capabilities()
            if "error" in caps:
                return []
            return caps.get("contents", [])
        except Exception:
            return []

    async def get_plan_layers(self, plan_type: Optional[str] = None) -> List[Dict]:
        layers = await self.get_available_layers()
        if plan_type:
            keywords = {
                "aski": ["aski", "askida"],
                "yururlukte": ["yururlukte", "yürürlükteki"],
                "cevre_duzeni": ["cevre", "çevre düzeni"],
                "imar": ["imar", "parsel", "plan"],
                "sit_alani": ["sit", "arkeolojik", "koruma"],
            }
            kw = keywords.get(plan_type, [])
            layers = [l for l in layers if any(k in (l.get("title") or "").lower() or k in (l.get("abstract") or "").lower() for k in kw)]
        return layers

    async def query_parcel_plan_status(self, province: str, district: str, ada: str, parsel: str) -> Dict:
        return {
            "province": province,
            "district": district,
            "ada": ada,
            "parsel": parsel,
            "plan_status": None,
            "tucbs_layers": await self.get_plan_layers("imar"),
            "note": "TUCBS WFS feature query requires authenticated access or specific layer name. Use /api/v1/map/layers?wfs_url=... to discover layer names first.",
        }

from __future__ import annotations

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from app.connectors.http import get_client
from app.connectors.probe import probe_source
from app.core.responses import envelope
from app.sources.registry import REGISTRY, SourceEntry, get_source


_ENDPOINT_RE = re.compile(r"(?:[\w/.-]+\.(?:ashx|asmx)(?:\?[^\s\"'<>]+)?|arcgis/rest/services[^\s\"'<>]*|geoserver/[^\s\"'<>]*)", re.I)


class NetcadKeosService:
    async def discover_source(self, source: SourceEntry):
        async with await get_client() as client:
            probe = await probe_source(client, source)
            endpoints = list(probe.get("discovered_endpoints", []))
            if probe.get("http_status") and probe.get("status") in {"ok", "public_partial", "requires_credentials", "captcha_required"}:
                try:
                    response = await client.get(source.base_url)
                    html = response.text
                    soup = BeautifulSoup(html, "lxml")
                    for script in soup.find_all("script", src=True):
                        endpoints.append(urljoin(source.base_url, script.get("src", "")))
                    endpoints.extend(urljoin(source.base_url, m) for m in _ENDPOINT_RE.findall(html))
                except Exception:
                    pass
        uniq = sorted(set(endpoints))[:50]
        return envelope("ok", source=source.to_dict(), probe={**probe, "discovered_endpoints": uniq})

    async def discover_municipality(self, municipality_id: int):
        municipal_ids = [key for key in REGISTRY if key.startswith("bel.")]
        if municipality_id < 0 or municipality_id >= len(municipal_ids):
            return envelope("invalid_input", message="Municipality index geçersiz.")
        src = REGISTRY[municipal_ids[municipality_id]]
        return await self.discover_source(src)

    async def get_imar_status(self, parcel_id: str):
        return envelope(
            "not_ready",
            message="Parsel bazlı KEOS imar statüsü için belediye kaynağı seçilip servis endpoint'i eşleştirilmeli.",
            next_actions=[
                "Kaynaklar ekranından uygun belediye kaynağını probe edin",
                "Discovery sonucunda bulunan WFS/KEOS parcel endpoint'ini sorgu akışına bağlayın",
            ],
            parcel_id=parcel_id,
        )

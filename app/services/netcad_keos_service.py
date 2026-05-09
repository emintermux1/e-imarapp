from __future__ import annotations

import asyncio
import re
from typing import List, Dict, Optional, Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup
import httpx

from app.connectors.http import get_client
from app.connectors.probe import probe_source
from app.config import settings
from app.core.responses import envelope
from app.core.exceptions import KEOSDiscoveryError
from app.sources.registry import REGISTRY, SourceEntry, get_source


_ENDPOINT_RE = re.compile(
    r'(?:[\w/.-]+\.(?:ashx|asmx)(?:\?[^\s"\'<>]+)?|arcgis/rest/services[^\s"\'<>]*|geoserver/[^\s"\'<>]*)',
    re.I,
)

MUNICIPAL_DOMAIN_PATTERNS = [
    "https://keos.{slug}.bel.tr",
    "https://eimar.{slug}.bel.tr",
    "https://webgis.{slug}.bel.tr",
    "https://cbs.{slug}.bel.tr",
    "https://keos.{slug}.gov.tr",
    "https://cbs.{slug}.gov.tr",
    "https://eimar.{slug}.gov.tr",
    "https://webgis.{slug}.gov.tr",
    "https://keos.{slug}.bld.gov.tr",
    "https://cbs.{slug}.bld.gov.tr",
]

NETCAD_KEOS_ENDPOINTS = [
    "/NetGIS/Services/MapService.ashx",
    "/NetGIS/Services/QueryService.ashx",
    "/NetGIS/Services/GeometryService.ashx",
    "/imardurumu/Services/ImarDurumu.ashx",
    "/imardurumu/Services/ImarDurumu.asmx",
    "/imardurumu/Service/ImarDurumu.ashx",
    "/imardurumu/Service/ImarDurumu.asmx",
    "/imardurumu/Services/MapService.ashx",
    "/imardurumu/Services/QueryService.ashx",
    "/imardurumu/Services/Proxy.ashx",
    "/geoserver/ows?service=WMS&request=GetCapabilities",
    "/geoserver/ows?service=WFS&request=GetCapabilities",
    "/arcgis/rest/services?f=pjson",
]


class NetcadKeosService:
    """Belediye KEOS/Netcad discovery ve imar durumu sorgu servisi."""

    def __init__(self):
        self.base_url = settings.TKGM_PARSEL_SORGU_URL.rstrip("/")
        self.client = httpx.AsyncClient(timeout=15.0, follow_redirects=True, limits=httpx.Limits(max_connections=50))

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

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

    async def discover_municipality(self, municipality_id: int | str):
        if isinstance(municipality_id, int):
            municipal_ids = [key for key in REGISTRY if key.startswith("bel.")]
            if municipality_id < 0 or municipality_id >= len(municipal_ids):
                return envelope("invalid_input", message="Municipality index geçersiz.")
            src = REGISTRY[municipal_ids[municipality_id]]
            return await self.discover_source(src)

        slug = str(municipality_id).lower().strip()
        live_endpoints: List[Dict[str, Any]] = []
        keos_url: Optional[str] = None
        wms_url: Optional[str] = None
        wfs_url: Optional[str] = None

        domain_tasks = []
        for pattern in MUNICIPAL_DOMAIN_PATTERNS:
            url = pattern.replace("{slug}", slug)
            domain_tasks.append(self._probe_domain(url))

        domain_results = await asyncio.gather(*domain_tasks, return_exceptions=True)
        live_domains = [r for r in domain_results if isinstance(r, str)]

        endpoint_tasks = []
        for domain in live_domains:
            for endpoint in NETCAD_KEOS_ENDPOINTS:
                endpoint_tasks.append(self._probe_endpoint(domain + endpoint))

        endpoint_results = await asyncio.gather(*endpoint_tasks, return_exceptions=True)
        for res in endpoint_results:
            if isinstance(res, dict):
                live_endpoints.append(res)
                url = res["url"]
                if "GetCapabilities" in url and "WMS" in url:
                    wms_url = url
                elif "GetCapabilities" in url and "WFS" in url:
                    wfs_url = url
                elif any(e in url for e in ["MapService", "QueryService", "ImarDurumu"]):
                    keos_url = url

        return {
            "slug": slug,
            "name": slug,
            "tested_patterns": len(MUNICIPAL_DOMAIN_PATTERNS) * len(NETCAD_KEOS_ENDPOINTS),
            "live_endpoints": live_endpoints,
            "keos_url": keos_url,
            "wms_url": wms_url,
            "wfs_url": wfs_url,
            "discovered_at": asyncio.get_event_loop().time(),
        }

    async def _probe_domain(self, url: str) -> str:
        try:
            resp = await self.client.head(url, timeout=10.0)
            if resp.status_code in (200, 301, 302, 307, 308):
                return url
        except httpx.RequestError:
            pass
        raise KEOSDiscoveryError(f"Domain unreachable: {url}")

    async def _probe_endpoint(self, url: str) -> Dict:
        try:
            resp = await self.client.head(url, timeout=8.0)
            if resp.status_code in (200, 301, 302):
                return {"url": url, "status": resp.status_code, "live": True}
            raise KEOSDiscoveryError(f"Endpoint {url} returned {resp.status_code}")
        except httpx.RequestError:
            raise KEOSDiscoveryError(f"Endpoint unreachable: {url}")

    async def get_imar_status(self, municipality_slug: str, ada: str, parsel: str) -> Dict:
        discovery = await self.discover_municipality(municipality_slug)
        keos_url = discovery.get("keos_url")

        if not keos_url:
            return {
                "belediye": municipality_slug,
                "ada": ada,
                "parsel": parsel,
                "imar_durumu": None,
                "error": f"No KEOS service discovered for {municipality_slug}. Tested {discovery['tested_patterns']} patterns; found {len(discovery['live_endpoints'])} live endpoints.",
            }

        query_endpoints = [
            f"{keos_url}?ada={ada}&parsel={parsel}",
            f"{keos_url}/QueryService?ada={ada}&parsel={parsel}",
        ]

        for qurl in query_endpoints:
            try:
                resp = await self.client.get(qurl, timeout=15.0)
                if resp.status_code == 200:
                    try:
                        data = resp.json()
                        return self._normalize_imar_data(data, municipality_slug, ada, parsel)
                    except ValueError:
                        return {
                            "belediye": municipality_slug,
                            "ada": ada,
                            "parsel": parsel,
                            "imar_durumu": None,
                            "raw_html_length": len(resp.text),
                            "note": "KEOS returned HTML; scraping not yet implemented.",
                        }
            except httpx.RequestError:
                continue

        return {
            "belediye": municipality_slug,
            "ada": ada,
            "parsel": parsel,
            "imar_durumu": None,
            "error": "KEOS query endpoints unreachable or require authentication.",
        }

    async def get_parcel_data(self, ada: str, parsel: str, il: str | None = None, ilce: str | None = None):
        return envelope(
            "requires_credentials",
            message="TKGM Parsel Sorgu public HTML arayüzü captcha/oturum gerektiriyor; doğrudan otomatik parsel çekimi açık değil.",
            next_actions=[
                "Belediye bazlı KEOS kaynağı seçip oradan ada/parsel deneyin",
                "Kurumsal TKGM erişimi veya resmi veri paylaşım protokolü tanımlayın",
            ],
            query={"ada": ada, "parsel": parsel, "il": il, "ilce": ilce},
            source_id="tkgm.parselsorgu",
        )

    async def search_by_address(self, address: str, il: Optional[str] = None, ilce: Optional[str] = None) -> List[Dict]:
        return [{
            "error": "TKGM public address search API unavailable. Use ada/parsel direct query or e-Devlet integration.",
            "query": address,
            "il": il,
            "ilce": ilce,
        }]

    async def get_parcel_geometry(self, ada: str, parsel: str, il: str, ilce: str, mahalle: Optional[str] = None) -> Dict:
        data = await self.get_parcel_data(ada, parsel, il, ilce)
        return {
            "ada": ada,
            "parsel": parsel,
            "geometri": data.get("geometri"),
            "pafta": data.get("pafta"),
            "mevkii": data.get("mevkii"),
        }

    def _normalize_imar_data(self, raw: Dict, belediye: str, ada: str, parsel: str) -> Dict:
        return {
            "belediye": belediye,
            "ada": ada,
            "parsel": parsel,
            "imar_durumu": raw.get("imarDurum"),
            "plan_turu": raw.get("planTuru"),
            "taks": raw.get("taks"),
            "kaks": raw.get("kaks"),
            "h_max": raw.get("hmax"),
            "gabari": raw.get("gabari"),
            "yapilasma_sarti": raw.get("yapilasmaSarti"),
            "kullanim_amaci": raw.get("kullanimAmaci"),
            "aciklama": raw.get("aciklama"),
        }

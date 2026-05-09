from __future__ import annotations

import asyncio
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from app.connectors.http import get_client
from app.connectors.probe import probe_source
from app.core.responses import envelope
from app.sources.registry import REGISTRY, SourceEntry

from app.core.exceptions import KEOSDiscoveryError
from app.services.source_registry import (
    COMMON_KEOS_ENDPOINTS,
    dedupe_urls,
    endpoint_type,
    get_source_by_slug,
    normalize_url,
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

NETCAD_KEOS_ENDPOINTS = COMMON_KEOS_ENDPOINTS
SERVICE_URL_RE = re.compile(
    r"(?P<url>(?:https?:)?//[^\s'\"<>]+|[^\s'\"<>]*(?:\.ashx|\.asmx|NetGIS|MapService|QueryService|GeometryService|ImarDurumu|WMS|WFS|arcgis/rest/services|geoserver/ows)[^\s'\"<>]*)",
    re.IGNORECASE,
)
BLOCKED_TERMS = ("captcha", "recaptcha", "access denied", "forbidden", "bot", "güvenlik kodu")
AUTH_TERMS = ("login", "signin", "giris", "giriş", "oturum", "yetki", "kimlik")


class NetcadKeosService:
    def __init__(self, timeout: float = 6.0, max_connections: int = 20):
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout, connect=min(timeout, 4.0)),
            follow_redirects=True,
            limits=httpx.Limits(max_connections=max_connections),
            headers={"User-Agent": "e-imar-source-discovery/0.1"},
        )

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
                    endpoints.extend(urljoin(source.base_url, m.group("url")) for m in SERVICE_URL_RE.finditer(html[:500_000]))
                except Exception:
                    pass
        uniq = sorted(set(endpoints))[:50]
        return envelope("ok", source=source.to_dict(), probe={**probe, "discovered_endpoints": uniq})

    async def discover_municipality_by_index(self, municipality_id: int):
        municipal_ids = [key for key in REGISTRY if key.startswith("bel.")]
        if municipality_id < 0 or municipality_id >= len(municipal_ids):
            return envelope("invalid_input", message="Municipality index geçersiz.")
        src = REGISTRY[municipal_ids[municipality_id]]
        return await self.discover_source(src)

    async def discover_municipality(self, slug: str, include_patterns: bool = True) -> Dict[str, Any]:
        slug = slug.lower().strip()
        registry_source = get_source_by_slug(slug)
        seeds: List[str] = []
        if registry_source:
            seeds.extend([registry_source.homepage_url, registry_source.base_url])
            seeds.extend(registry_source.candidate_endpoints)
        if include_patterns:
            for pattern in MUNICIPAL_DOMAIN_PATTERNS:
                domain = pattern.replace("{slug}", slug)
                seeds.append(domain)
                seeds.extend(urljoin(domain.rstrip("/") + "/", e.lstrip("/")) for e in NETCAD_KEOS_ENDPOINTS)
        seeds = dedupe_urls(seeds)

        homepage_urls = dedupe_urls([u for u in seeds if self._looks_like_homepage(u)][:6])
        extracted: List[str] = []
        homepage_results = await asyncio.gather(
            *(self._fetch_homepage_candidates(url) for url in homepage_urls),
            return_exceptions=True,
        )
        for result in homepage_results:
            if isinstance(result, list):
                extracted.extend(result)
        candidates = dedupe_urls([*seeds, *extracted])

        semaphore = asyncio.Semaphore(10)
        async def bounded(url: str) -> Dict[str, Any]:
            async with semaphore:
                return await self._probe_endpoint(url)

        results = await asyncio.gather(*(bounded(url) for url in candidates[:160]), return_exceptions=True)
        endpoints = [r for r in results if isinstance(r, dict)]
        live_endpoints = [r for r in endpoints if r.get("status") == "live"]

        keos_url = next((e["url"] for e in live_endpoints if e.get("type") == "keos"), None)
        wms_url = next((e["url"] for e in live_endpoints if e.get("type") == "wms"), None)
        wfs_url = next((e["url"] for e in live_endpoints if e.get("type") == "wfs"), None)

        return {
            "slug": slug,
            "source_id": registry_source.id if registry_source else None,
            "name": registry_source.name if registry_source else slug,
            "homepage_url": registry_source.homepage_url if registry_source else None,
            "base_url": registry_source.base_url if registry_source else None,
            "tested_patterns": len(candidates),
            "endpoints": endpoints,
            "live_endpoints": live_endpoints,
            "keos_url": keos_url,
            "wms_url": wms_url,
            "wfs_url": wfs_url,
            "discovered_at": asyncio.get_event_loop().time(),
        }

    async def discover_source_urls(self, source: Any, detailed: bool = False) -> Dict[str, Any]:
        if getattr(source, "kind", "").startswith("municipal"):
            return await self.discover_municipality(source.slug, include_patterns=detailed)
        homepage = await self._probe_endpoint(source.homepage_url)
        return {
            "slug": source.slug,
            "source_id": source.id,
            "name": source.name,
            "homepage_url": source.homepage_url,
            "base_url": source.base_url,
            "tested_patterns": 1,
            "endpoints": [homepage],
            "live_endpoints": [homepage] if homepage.get("status") == "live" else [],
            "discovered_at": asyncio.get_event_loop().time(),
        }

    async def _fetch_homepage_candidates(self, url: str) -> List[str]:
        try:
            resp = await self.client.get(url, timeout=6.0)
            if resp.status_code >= 400:
                return []
            content_type = resp.headers.get("content-type", "")
            if "text" not in content_type and "javascript" not in content_type and "html" not in content_type:
                return []
            base = str(resp.url)
            matches = [m.group("url") for m in SERVICE_URL_RE.finditer(resp.text[:500_000])]
            urls = [normalize_url(match, base=base) for match in matches]
            return [u for u in dedupe_urls(urls) if urlparse(u).scheme in {"http", "https"}]
        except (httpx.RequestError, httpx.TimeoutException):
            return []

    async def _probe_domain(self, url: str) -> str:
        result = await self._probe_endpoint(url)
        if result["status"] in {"live", "blocked", "requires_auth", "cors_browser_only"}:
            return url
        raise KEOSDiscoveryError(f"Domain unreachable: {url}")

    async def _probe_endpoint(self, url: str) -> Dict[str, Any]:
        status = "not_found"
        http_status: Optional[int] = None
        title: Optional[str] = None
        try:
            resp = await self.client.get(url, timeout=6.0)
            http_status = resp.status_code
            text_sample = resp.text[:8000] if resp.content else ""
            lower = text_sample.lower()
            if resp.status_code in (401, 407):
                status = "requires_auth"
            elif resp.status_code in (403, 429):
                status = "blocked"
            elif resp.status_code == 404:
                status = "not_found"
            elif resp.status_code >= 500:
                status = "blocked"
            elif any(term in lower for term in BLOCKED_TERMS):
                status = "blocked"
            elif any(term in lower for term in AUTH_TERMS) and "getcapabilities" not in url.lower():
                status = "requires_auth"
            elif resp.status_code in (200, 204, 301, 302, 307, 308):
                status = "live"
            else:
                status = "parse_error"
            title_match = re.search(r"<title[^>]*>(.*?)</title>", text_sample, re.IGNORECASE | re.DOTALL)
            if title_match:
                title = re.sub(r"\s+", " ", title_match.group(1)).strip()[:120]
        except httpx.TimeoutException:
            status = "timeout"
        except httpx.ConnectError:
            status = "not_found"
        except httpx.RequestError as exc:
            status = "cors_browser_only" if "certificate" in str(exc).lower() else "not_found"
        except Exception:
            status = "parse_error"

        return {
            "url": url,
            "status": status,
            "http_status": http_status,
            "live": status == "live",
            "type": endpoint_type(url, "municipal_keos"),
            "title": title,
        }

    def _looks_like_homepage(self, url: str) -> bool:
        parsed = urlparse(url)
        path = parsed.path.lower()
        return not parsed.query and not any(token in path for token in (".ashx", ".asmx", "getcapabilities", "arcgis/rest", "geoserver/ows"))

    async def get_imar_status(self, municipality_slug: str, ada: str, parsel: str) -> Dict:
        discovery = await self.discover_municipality(municipality_slug)
        keos_url = discovery.get("keos_url")
        if not keos_url:
            return {
                "belediye": municipality_slug,
                "ada": ada,
                "parsel": parsel,
                "imar_durumu": None,
                "error": f"{municipality_slug} için canlı KEOS sorgu servisi doğrulanamadı. Portal bağlantısı veri kaynaklarında gösteriliyor.",
            }
        for qurl in [f"{keos_url}?ada={ada}&parsel={parsel}", f"{keos_url}/QueryService?ada={ada}&parsel={parsel}"]:
            try:
                resp = await self.client.get(qurl, timeout=10.0)
                if resp.status_code == 200:
                    try:
                        return self._normalize_imar_data(resp.json(), municipality_slug, ada, parsel)
                    except ValueError:
                        return {
                            "belediye": municipality_slug,
                            "ada": ada,
                            "parsel": parsel,
                            "imar_durumu": None,
                            "raw_html_length": len(resp.text),
                            "note": "KEOS HTML döndürdü; giriş/captcha arkasına geçilmedi.",
                        }
            except httpx.RequestError:
                continue
        return {"belediye": municipality_slug, "ada": ada, "parsel": parsel, "imar_durumu": None, "error": "KEOS sorgusu erişilemedi veya yetki gerektiriyor."}

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

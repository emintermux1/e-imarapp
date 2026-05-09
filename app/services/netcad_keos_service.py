from __future__ import annotations

import asyncio
import json
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse
from xml.etree import ElementTree as ET

import httpx
from bs4 import BeautifulSoup

from app.connectors.http import get_client
from app.connectors.probe import probe_source
from app.core.exceptions import KEOSDiscoveryError
from app.core.responses import envelope
from app.services.source_registry import (
    COMMON_KEOS_ENDPOINTS,
    dedupe_urls,
    endpoint_type,
    get_source_by_slug,
    normalize_url,
)
from app.sources.registry import REGISTRY, SourceEntry

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
WMS_PATHS = ["/wms.ashx", "/webgis_net/wms.ashx", "/netgis7/wms", "/netgis5/wms", "/gisapi/wms", "/WebGIS/wms", "/keos/wms"]
WFS_PATHS = ["/wfs.ashx", "/webgis_net/wfs.ashx", "/netgis7/wfs", "/netgis5/wfs", "/gisapi/wfs", "/WebGIS/wfs", "/keos/wfs"]
WMS_VERSIONS = ["1.3.0", "1.1.1"]
WFS_VERSION = "2.0.0"
KEY_LAYER_HINTS = ("imar_durumu", "imar", "parsel", "plan", "pafta", "sit", "koruma")


@dataclass(slots=True)
class OGCDiscoveryResult:
    status: str
    base_url: Optional[str]
    wms_url: Optional[str]
    wms_get_capabilities_url: Optional[str]
    wms_version: Optional[str]
    wfs_url: Optional[str]
    wfs_get_capabilities_url: Optional[str]
    available_layers: list[dict[str, Any]]
    supported_srs: list[str]
    supported_formats: list[str]
    metadata: dict[str, Any]
    last_error: Optional[str]
    tested_urls: list[str]
    discovered_at: str
    refresh_after: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "base_url": self.base_url,
            "wms_url": self.wms_url,
            "wms_get_capabilities_url": self.wms_get_capabilities_url,
            "wms_version": self.wms_version,
            "wfs_url": self.wfs_url,
            "wfs_get_capabilities_url": self.wfs_get_capabilities_url,
            "available_layers": self.available_layers,
            "supported_srs": self.supported_srs,
            "supported_formats": self.supported_formats,
            "metadata": self.metadata,
            "last_error": self.last_error,
            "tested_urls": self.tested_urls,
            "discovered_at": self.discovered_at,
            "refresh_after": self.refresh_after,
        }


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
                        endpoints.append(normalize_url(script.get("src", ""), base=source.base_url))
                    endpoints.extend(normalize_url(m.group("url"), base=source.base_url) for m in SERVICE_URL_RE.finditer(html[:500_000]))
                except Exception:
                    pass
        uniq = sorted({endpoint for endpoint in endpoints if endpoint})[:50]
        ogc = await self.discover_ogc_endpoints([source.base_url, source.homepage_url, *uniq])
        return envelope("ok", source=source.to_dict(), probe={**probe, "discovered_endpoints": uniq, "ogc": ogc.to_dict()})

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

        ogc = await self.discover_ogc_endpoints([wms_url, wfs_url, keos_url, *[item["url"] for item in live_endpoints if item.get("url")]])
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
            "wms_url": ogc.wms_url or wms_url,
            "wfs_url": ogc.wfs_url or wfs_url,
            "discovered_at": ogc.discovered_at,
            "refresh_after": ogc.refresh_after,
            "ogc": ogc.to_dict(),
        }

    async def discover_source_urls(self, source: Any, detailed: bool = False) -> Dict[str, Any]:
        if getattr(source, "kind", "").startswith("municipal"):
            return await self.discover_municipality(source.slug, include_patterns=detailed)
        homepage = await self._probe_endpoint(source.homepage_url)
        ogc = await self.discover_ogc_endpoints([source.base_url, source.homepage_url])
        return {
            "slug": source.slug,
            "source_id": source.id,
            "name": source.name,
            "homepage_url": source.homepage_url,
            "base_url": source.base_url,
            "tested_patterns": 1,
            "endpoints": [homepage],
            "live_endpoints": [homepage] if homepage.get("status") == "live" else [],
            "keos_url": source.base_url,
            "wms_url": ogc.wms_url,
            "wfs_url": ogc.wfs_url,
            "discovered_at": ogc.discovered_at,
            "refresh_after": ogc.refresh_after,
            "ogc": ogc.to_dict(),
        }

    async def discover_ogc_endpoints(self, base_candidates: Iterable[Optional[str]]) -> OGCDiscoveryResult:
        discovered_at = datetime.now(timezone.utc)
        refresh_after = discovered_at + timedelta(days=7)
        tested_urls: list[str] = []
        last_error: Optional[str] = None
        best_wms: Optional[dict[str, Any]] = None
        best_wfs: Optional[dict[str, Any]] = None
        wms_layers: list[dict[str, Any]] = []
        wfs_layers: list[dict[str, Any]] = []
        supported_srs: set[str] = set()
        supported_formats: set[str] = set()
        metadata: dict[str, Any] = {}

        base_urls = []
        for candidate in base_candidates:
            if not candidate:
                continue
            base = self._extract_base_url(candidate)
            if base:
                base_urls.append(base)
        base_urls = dedupe_urls(base_urls)

        for base_url in base_urls:
            for path in WMS_PATHS:
                for version in WMS_VERSIONS:
                    caps_url = self._build_get_capabilities_url(base_url, path, "WMS", version)
                    tested_urls.append(caps_url)
                    fetched = await self._fetch_xml(caps_url)
                    if not fetched:
                        continue
                    if fetched.get("protected"):
                        last_error = fetched.get("error") or last_error
                        continue
                    xml = fetched["text"]
                    if not self._looks_like_capabilities_xml(xml):
                        last_error = "unsupported_format"
                        continue
                    parsed = self._parse_wms_capabilities(xml, base_url, caps_url)
                    if not parsed:
                        last_error = "unsupported_format"
                        continue
                    best_wms = parsed
                    wms_layers = parsed["layers"]
                    supported_srs.update(parsed["supported_srs"])
                    supported_formats.update(parsed["formats"])
                    metadata.update(parsed["metadata"])
                    break
                if best_wms:
                    break
            if best_wms:
                break

        for base_url in base_urls:
            for path in WFS_PATHS:
                caps_url = self._build_get_capabilities_url(base_url, path, "WFS", WFS_VERSION)
                tested_urls.append(caps_url)
                fetched = await self._fetch_xml(caps_url)
                if not fetched:
                    continue
                if fetched.get("protected"):
                    last_error = fetched.get("error") or last_error
                    continue
                xml = fetched["text"]
                if not self._looks_like_capabilities_xml(xml):
                    last_error = "unsupported_format"
                    continue
                parsed = self._parse_wfs_capabilities(xml, base_url, caps_url)
                if not parsed:
                    last_error = "unsupported_format"
                    continue
                best_wfs = parsed
                wfs_layers = parsed["layers"]
                supported_srs.update(parsed["supported_srs"])
                supported_formats.update(parsed["formats"])
                metadata.update({"wfs_title": parsed.get("title")})
                break
            if best_wfs:
                break

        status = self._classify_ogc_status(best_wms, best_wfs, last_error)
        return OGCDiscoveryResult(
            status=status,
            base_url=(best_wms or best_wfs or {}).get("base_url") if (best_wms or best_wfs) else (base_urls[0] if base_urls else None),
            wms_url=best_wms.get("wms_url") if best_wms else None,
            wms_get_capabilities_url=best_wms.get("wms_get_capabilities_url") if best_wms else None,
            wms_version=best_wms.get("wms_version") if best_wms else None,
            wfs_url=best_wfs.get("wfs_url") if best_wfs else None,
            wfs_get_capabilities_url=best_wfs.get("wfs_get_capabilities_url") if best_wfs else None,
            available_layers=self._merge_layers(wms_layers, wfs_layers),
            supported_srs=sorted(supported_srs),
            supported_formats=sorted(supported_formats),
            metadata=metadata,
            last_error=last_error,
            tested_urls=tested_urls[:120],
            discovered_at=discovered_at.isoformat(),
            refresh_after=refresh_after.isoformat(),
        )

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

    def _extract_base_url(self, candidate: str) -> Optional[str]:
        try:
            parsed = urlparse(candidate)
            if parsed.scheme not in {"http", "https"}:
                return None
            return urlunparse((parsed.scheme, parsed.netloc, "/", "", "", ""))
        except Exception:
            return None

    def _build_get_capabilities_url(self, base_url: str, path: str, service: str, version: str) -> str:
        absolute = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))
        parsed = urlparse(absolute)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        query.update({"service": service, "request": "GetCapabilities", "version": version})
        return urlunparse(parsed._replace(query=urlencode(query)))

    async def _fetch_xml(self, url: str) -> Optional[dict[str, Any]]:
        try:
            response = await self.client.get(
                url,
                timeout=8.0,
                headers={"Accept": "application/xml,text/xml,*/*;q=0.8", "User-Agent": "e-imarapp-netcad-discovery/0.1"},
            )
            text = response.text or ""
            lowered = text.lower()
            if response.status_code in (401, 403, 429):
                return {"text": text, "status": response.status_code, "protected": True, "error": self._classify_http_error(response.status_code, lowered)}
            if response.status_code >= 500:
                return None
            if not text.strip():
                return None
            return {"text": text, "status": response.status_code, "protected": False, "error": None}
        except httpx.TimeoutException:
            return None
        except httpx.RequestError:
            return None

    def _classify_http_error(self, status_code: int, text: str) -> str:
        if status_code == 429:
            return "rate_limited"
        if "captcha" in text or "recaptcha" in text:
            return "captcha_required"
        if any(term in text for term in AUTH_TERMS):
            return "requires_credentials"
        return "unavailable"

    def _looks_like_capabilities_xml(self, xml: str) -> bool:
        sample = xml[:5120]
        lowered = sample.lower()
        if any(tag in lowered for tag in ("wms_capabilities", "wmt_ms_capabilities", "wfs_capabilities", "service", "capability", "featuretypelist")):
            return True
        return False

    def _parse_wms_capabilities(self, xml: str, base_url: str, caps_url: str) -> Optional[dict[str, Any]]:
        root = self._safe_xml(xml)
        if root is None:
            return None
        version = root.attrib.get("version") or self._find_first_attr(root, "version")
        title = self._find_first_text(root, {"Title", "{*}Title"})
        layers = []
        for layer in root.iter():
            if not self._local_name(layer.tag).lower().endswith("layer"):
                continue
            name = self._find_child_text(layer, {"Name", "{*}Name"})
            layer_title = self._find_child_text(layer, {"Title", "{*}Title"})
            if not name and not layer_title:
                continue
            crs = self._collect_values(layer, {"CRS", "SRS", "DefaultCRS", "OtherCRS", "{*}CRS", "{*}SRS"})
            bbox = self._collect_bbox(layer)
            layers.append({
                "name": name,
                "title": layer_title,
                "srs": crs,
                "crs": crs,
                "bbox": bbox,
                "queryable": layer.attrib.get("queryable") in {"1", "true", "True"},
                "abstract": self._find_child_text(layer, {"Abstract", "{*}Abstract"}),
            })
        formats = self._collect_service_formats(root, {"GetMap", "GetFeatureInfo"})
        return {
            "base_url": base_url,
            "wms_url": self._strip_get_capabilities(caps_url),
            "wms_get_capabilities_url": caps_url,
            "wms_version": version,
            "layers": self._dedupe_layer_records(layers),
            "supported_srs": self._collect_supported_srs(layers),
            "formats": formats,
            "title": title,
            "metadata": {"service": "WMS", "title": title, "version": version, "formats": formats},
        }

    def _parse_wfs_capabilities(self, xml: str, base_url: str, caps_url: str) -> Optional[dict[str, Any]]:
        root = self._safe_xml(xml)
        if root is None:
            return None
        title = self._find_first_text(root, {"Title", "{*}Title"})
        layers = []
        for feature_type in root.iter():
            if self._local_name(feature_type.tag) not in {"FeatureType", "featuretype"}:
                continue
            name = self._find_child_text(feature_type, {"Name", "{*}Name"})
            layer_title = self._find_child_text(feature_type, {"Title", "{*}Title"})
            if not name and not layer_title:
                continue
            crs = self._collect_values(feature_type, {"DefaultCRS", "OtherCRS", "SRS", "CRS", "{*}DefaultCRS", "{*}OtherCRS", "{*}SRS", "{*}CRS"})
            layers.append({
                "name": name,
                "title": layer_title,
                "srs": crs,
                "crs": crs,
                "bbox": self._collect_bbox(feature_type),
                "queryable": True,
                "abstract": self._find_child_text(feature_type, {"Abstract", "{*}Abstract"}),
            })
        formats = self._collect_service_formats(root, {"GetFeature", "GetPropertyValue"})
        return {
            "base_url": base_url,
            "wfs_url": self._strip_get_capabilities(caps_url),
            "wfs_get_capabilities_url": caps_url,
            "layers": self._dedupe_layer_records(layers),
            "supported_srs": self._collect_supported_srs(layers),
            "formats": formats,
            "title": title,
            "metadata": {"service": "WFS", "title": title, "formats": formats},
        }

    def _classify_ogc_status(self, wms: Optional[dict[str, Any]], wfs: Optional[dict[str, Any]], last_error: Optional[str]) -> str:
        if wms or wfs:
            return "available"
        if last_error in {"captcha_required", "rate_limited", "requires_credentials"}:
            return last_error
        if last_error == "unsupported_format":
            return "unsupported_format"
        if last_error == "unavailable":
            return "unavailable"
        return "endpoint_changed"

    def _merge_layers(self, wms_layers: list[dict[str, Any]], wfs_layers: list[dict[str, Any]]) -> list[dict[str, Any]]:
        merged: dict[str, dict[str, Any]] = {}
        for layer in [*wms_layers, *wfs_layers]:
            key = layer.get("name") or layer.get("title") or json.dumps(layer, sort_keys=True)
            entry = merged.setdefault(key, {**layer, "sources": []})
            if layer.get("title") and not entry.get("title"):
                entry["title"] = layer.get("title")
            if layer.get("name") and not entry.get("name"):
                entry["name"] = layer.get("name")
            entry.setdefault("srs", [])
            entry.setdefault("crs", [])
            entry["srs"] = sorted({*entry.get("srs", []), *(layer.get("srs") or [])})
            entry["crs"] = sorted({*entry.get("crs", []), *(layer.get("crs") or [])})
            entry["sources"] = sorted({*entry.get("sources", []), "WMS" if layer in wms_layers else "WFS"})
        return list(merged.values())

    def _dedupe_layer_records(self, layers: list[dict[str, Any]]) -> list[dict[str, Any]]:
        seen: set[str] = set()
        deduped: list[dict[str, Any]] = []
        for layer in layers:
            key = f"{layer.get('name') or ''}:{layer.get('title') or ''}"
            if key in seen:
                continue
            seen.add(key)
            deduped.append(layer)
        return deduped

    def _collect_supported_srs(self, layers: list[dict[str, Any]]) -> list[str]:
        values: set[str] = set()
        for layer in layers:
            for item in layer.get("srs", []) or []:
                if item:
                    values.add(str(item))
        return sorted(values)

    def _collect_service_formats(self, root: ET.Element, nodes: set[str]) -> list[str]:
        formats: set[str] = set()
        for elem in root.iter():
            if self._local_name(elem.tag) not in {"GetMap", "GetFeatureInfo", "GetFeature", "GetPropertyValue"}:
                continue
            for child in list(elem):
                if self._local_name(child.tag) == "Format" and child.text:
                    formats.add(child.text.strip())
        return sorted(formats)

    def _safe_xml(self, xml: str) -> Optional[ET.Element]:
        try:
            return ET.fromstring(xml)
        except ET.ParseError:
            return None

    def _find_first_text(self, root: ET.Element, tags: set[str]) -> Optional[str]:
        for elem in root.iter():
            if self._local_name(elem.tag) in {self._normalize_tag(tag) for tag in tags} and elem.text and elem.text.strip():
                return elem.text.strip()
        return None

    def _find_child_text(self, root: ET.Element, tags: set[str]) -> Optional[str]:
        for elem in root:
            if self._local_name(elem.tag) in {self._normalize_tag(tag) for tag in tags} and elem.text and elem.text.strip():
                return elem.text.strip()
        for elem in root.iter():
            if self._local_name(elem.tag) in {self._normalize_tag(tag) for tag in tags} and elem.text and elem.text.strip():
                return elem.text.strip()
        return None

    def _collect_values(self, root: ET.Element, tags: set[str]) -> list[str]:
        wanted = {self._normalize_tag(tag) for tag in tags}
        values: list[str] = []
        for elem in root.iter():
            if self._local_name(elem.tag) not in wanted:
                continue
            if elem.text:
                for token in re.split(r"[\s,]+", elem.text.strip()):
                    if token:
                        values.append(token)
        return sorted({value for value in values if value})

    def _collect_bbox(self, root: ET.Element) -> Any:
        for elem in root.iter():
            if self._local_name(elem.tag) in {"BoundingBox", "EX_GeographicBoundingBox", "LatLonBoundingBox", "WGS84BoundingBox"}:
                payload = {f"@{self._local_name(key)}": value for key, value in elem.attrib.items()}
                payload["tag"] = self._local_name(elem.tag)
                return payload
        return None

    def _find_first_attr(self, root: ET.Element, attr_name: str) -> Optional[str]:
        for elem in root.iter():
            if attr_name in elem.attrib:
                return elem.attrib[attr_name]
        return None

    def _strip_get_capabilities(self, url: Optional[str]) -> Optional[str]:
        if not url:
            return None
        parsed = urlparse(url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        query = {k: v for k, v in query.items() if k.lower() not in {"request", "service", "version"}}
        return urlunparse(parsed._replace(query=urlencode(query)))

    def _local_name(self, tag: str) -> str:
        return tag.rsplit("}", 1)[-1].split(":", 1)[-1]

    def _normalize_tag(self, tag: str) -> str:
        return tag.replace("{*}", "").rsplit("}", 1)[-1].split(":", 1)[-1]

    def _classify_http_error(self, status_code: int, text: str) -> str:
        if status_code == 429:
            return "rate_limited"
        if "captcha" in text or "recaptcha" in text:
            return "captcha_required"
        if any(term in text for term in AUTH_TERMS):
            return "requires_credentials"
        return "unavailable"

    def _extract_base_url(self, candidate: str) -> Optional[str]:
        try:
            parsed = urlparse(candidate)
            if parsed.scheme not in {"http", "https"}:
                return None
            return urlunparse((parsed.scheme, parsed.netloc, "/", "", "", ""))
        except Exception:
            return None

    def _build_get_capabilities_url(self, base_url: str, path: str, service: str, version: str) -> str:
        absolute = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))
        parsed = urlparse(absolute)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        query.update({"service": service, "request": "GetCapabilities", "version": version})
        return urlunparse(parsed._replace(query=urlencode(query)))

    def _looks_protected(self, text: str) -> bool:
        return bool(re.search(r"(captcha|recaptcha|g-recaptcha|login|giriş|oturum|unauthorized|forbidden)", text, re.I))

    def _looks_like_homepage(self, url: str) -> bool:
        parsed = urlparse(url)
        path = parsed.path.lower()
        return not parsed.query and not any(token in path for token in (".ashx", ".asmx", "getcapabilities", "arcgis/rest", "geoserver/ows"))

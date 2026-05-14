from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from fastapi import APIRouter, HTTPException, Query
import httpx

from app.core.responses import envelope
from app.services.ogc_service import OGCService
from app.services.source_registry import live_layer_candidates
from app.sources.registry import sources_by_capability

router = APIRouter()
_PROBE_CACHE: dict[str, tuple[datetime, dict[str, Any]]] = {}
_PROBE_CACHE_TTL = timedelta(minutes=15)


def _capabilities_url_to_wms_template(url: str, layer_name: str) -> str:
    parsed = urlparse(url)
    query = {key.lower(): values[-1] for key, values in parse_qs(parsed.query).items()}
    query.update({
        "service": "WMS",
        "request": "GetMap",
        "version": query.get("version", "1.3.0"),
        "layers": layer_name,
        "styles": "",
        "format": "image/png",
        "transparent": "true",
        "width": "256",
        "height": "256",
        "crs": "EPSG:3857",
        "bbox": "{bbox-epsg-3857}",
    })
    return urlunparse(parsed._replace(query=urlencode(query, safe="{}")))


def _probe_cache_key(source_id: str, endpoint_url: str | None, layer_name: str | None) -> str:
    return "|".join([source_id, endpoint_url or "", layer_name or ""])


def _cached_probe(key: str) -> dict[str, Any] | None:
    cached = _PROBE_CACHE.get(key)
    if not cached:
        return None
    expires_at, payload = cached
    if expires_at <= datetime.now(timezone.utc):
        _PROBE_CACHE.pop(key, None)
        return None
    return payload


def _store_probe(key: str, payload: dict[str, Any]) -> dict[str, Any]:
    _PROBE_CACHE[key] = (datetime.now(timezone.utc) + _PROBE_CACHE_TTL, payload)
    payload["cache"] = {"status": "stored", "ttl_seconds": int(_PROBE_CACHE_TTL.total_seconds())}
    return payload


async def _probe_http_endpoint(url: str) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            response = await client.get(url, headers={"Accept": "application/xml,text/xml,application/json,text/html;q=0.8"})
        status = "live" if response.status_code < 400 else "protected" if response.status_code in {401, 403, 429} else "unavailable"
        return {"status": status, "http_status": response.status_code, "content_type": response.headers.get("content-type")}
    except httpx.TimeoutException:
        return {"status": "timeout", "http_status": None, "content_type": None}
    except httpx.HTTPError as exc:
        return {"status": "unavailable", "http_status": None, "content_type": None, "error": str(exc)}


@router.get("/live-layers")
async def get_live_layers():
    layers = live_layer_candidates()
    return envelope(
        "ok",
        message="Official source registry candidates. Candidate endpoints are advertised for discovery/proxy; protected data is not synthesized.",
        layers=layers,
        total=len(layers),
    )


@router.get("/live-layers/probe")
async def probe_live_layer(
    source_id: str = Query(..., description="Source registry id"),
    endpoint_url: str | None = Query(None, description="Candidate endpoint URL from live-layers"),
    layer_name: str | None = Query(None, description="Optional WMS layer name to activate"),
):
    cache_key = _probe_cache_key(source_id, endpoint_url, layer_name)
    cached = _cached_probe(cache_key)
    if cached:
        cached_payload = {**cached, "cache": {"status": "hit", "ttl_seconds": int(_PROBE_CACHE_TTL.total_seconds())}}
        return envelope(
            cached_payload["status"],
            message="Cached live endpoint probe result. Only activatable public WMS layers include a map tile template.",
            layer=cached_payload,
        )

    candidates = [layer for layer in live_layer_candidates() if layer.get("source_id") == source_id]
    if endpoint_url:
        candidates = [layer for layer in candidates if layer.get("url") == endpoint_url]
    if not candidates:
        raise HTTPException(status_code=404, detail="Live layer candidate not found")

    layer = candidates[0]
    url = str(layer.get("url") or "")
    layer_type = str(layer.get("type") or "")
    payload: dict[str, Any] = {**layer, "status": "unavailable", "activatable": False}

    if layer_type == "wms":
        caps = await OGCService(wms_url=url).get_wms_capabilities()
        if "error" not in caps:
            layers = caps.get("contents") or []
            selected = next((item for item in layers if layer_name and item.get("name") == layer_name), None)
            selected = selected or next((item for item in layers if item.get("name")), None)
            payload.update({
                "status": "live",
                "activatable": bool(selected),
                "service_type": "WMS",
                "identification": caps.get("identification"),
                "available_layers": layers[:25],
                "selected_layer": selected,
                "tile_url": _capabilities_url_to_wms_template(url, selected["name"]) if selected else None,
            })
        else:
            payload.update({"status": "unavailable", "error": caps.get("error"), "service_type": "WMS"})
    else:
        probe = await _probe_http_endpoint(url)
        payload.update(probe)
        payload.update({"service_type": layer_type.upper(), "activatable": False})

    payload = _store_probe(cache_key, payload)
    return envelope(
        payload["status"],
        message="Live endpoint probe result. Only activatable public WMS layers include a map tile template.",
        layer=payload,
    )


@router.get("/layers")
async def get_layers(
    wms_url: Optional[str] = Query(None, description="WMS service URL"),
    wfs_url: Optional[str] = Query(None, description="WFS service URL"),
    service_type: str = Query("registry", enum=["registry", "wms", "wfs"]),
) -> Dict[str, Any]:
    if service_type == "registry" or (service_type == "wms" and not wms_url) or (service_type == "wfs" and not wfs_url):
        layers = []
        if sources_by_capability("parcel-query"):
            layers.append({"id": "parcels", "name": "Parseller", "type": "vector", "mode": "registry"})
        if sources_by_capability("aski-list"):
            layers.append({"id": "aski-overlay", "name": "Askıdaki Planlar", "type": "vector", "mode": "registry"})
        if sources_by_capability("layers"):
            layers.append({"id": "source-layers", "name": "Keşfedilen Katmanlar", "type": "catalog", "mode": "registry"})
        layers.extend(live_layer_candidates())
        return envelope("ok", mode="registry", service_type="REGISTRY", identification={"title": "Seeded live municipal/national source candidates"}, layers=layers, total=len(layers), url=None)

    try:
        ogc = OGCService(wms_url=wms_url, wfs_url=wfs_url)
        caps = await (ogc.get_wms_capabilities() if service_type == "wms" else ogc.get_wfs_capabilities())
        if "error" in caps:
            raise HTTPException(status_code=502, detail=caps["error"])
        layers = [
            {
                "name": layer.get("name", ""),
                "title": layer.get("title"),
                "abstract": layer.get("abstract"),
                "bounding_box_wgs84": layer.get("bounding_box_wgs84"),
                "crs_options": layer.get("crs_options"),
                "styles": layer.get("styles"),
            }
            for layer in caps.get("contents", [])
        ]
        return {"service_type": service_type.upper(), "identification": caps.get("identification"), "layers": layers, "url": wms_url if service_type == "wms" else wfs_url}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OGC service error: {exc}") from exc

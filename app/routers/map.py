from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query

from app.core.responses import envelope
from app.services.ogc_service import OGCService
from app.services.source_registry import live_layer_candidates
from app.sources.registry import sources_by_capability

router = APIRouter()


@router.get("/live-layers")
async def get_live_layers():
    layers = live_layer_candidates()
    return envelope(
        "ok",
        message="Official source registry candidates. Candidate endpoints are advertised for discovery/proxy; protected data is not synthesized.",
        layers=layers,
        total=len(layers),
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

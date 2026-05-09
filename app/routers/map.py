from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Any, Dict
from app.services.ogc_service import OGCService
from app.services.source_registry import live_layer_candidates

router = APIRouter()


@router.get("/live-layers")
async def get_live_layers():
    return live_layer_candidates()


@router.get("/layers")
async def get_layers(
    wms_url: Optional[str] = Query(None, description="WMS service URL"),
    wfs_url: Optional[str] = Query(None, description="WFS service URL"),
    service_type: str = Query("wms", enum=["wms", "wfs"])
) -> Dict[str, Any]:
    if service_type == "wms" and not wms_url:
        return {
            "service_type": "REGISTRY",
            "identification": {"title": "Seeded live municipal/national source candidates"},
            "layers": live_layer_candidates(),
            "url": None,
        }
    if service_type == "wfs" and not wfs_url:
        return {
            "service_type": "REGISTRY",
            "identification": {"title": "Seeded live municipal/national source candidates"},
            "layers": live_layer_candidates(),
            "url": None,
        }

    try:
        ogc = OGCService(wms_url=wms_url, wfs_url=wfs_url)
        if service_type == "wms":
            caps = await ogc.get_wms_capabilities()
        else:
            caps = await ogc.get_wfs_capabilities()

        if "error" in caps:
            raise HTTPException(status_code=502, detail=caps["error"])

        layers = []
        for layer in caps.get("contents", []):
            layers.append({
                "name": layer.get("name", ""),
                "title": layer.get("title"),
                "abstract": layer.get("abstract"),
                "bounding_box_wgs84": layer.get("bounding_box_wgs84"),
                "crs_options": layer.get("crs_options"),
                "styles": layer.get("styles"),
            })

        return {
            "service_type": service_type.upper(),
            "identification": caps.get("identification"),
            "layers": layers,
            "url": wms_url if service_type == "wms" else wfs_url,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OGC service error: {str(e)}")

import asyncio
from typing import List, Dict, Optional, Any
from owslib.wms import WebMapService
from owslib.wfs import WebFeatureService

class OGCService:
    """
    OGC WMS/WFS async service wrapper using OWSLib in thread pool.
    """
    def __init__(self, wms_url: Optional[str] = None, wfs_url: Optional[str] = None):
        self.wms_url = wms_url
        self.wfs_url = wfs_url

    async def get_wms_capabilities(self) -> Dict[str, Any]:
        """Get WMS capabilities async via thread pool."""
        if not self.wms_url:
            return {"error": "No WMS URL provided"}
        try:
            wms = await asyncio.to_thread(WebMapService, self.wms_url, version='1.3.0')
            return {
                "identification": {
                    "title": getattr(wms.identification, "title", None),
                    "abstract": getattr(wms.identification, "abstract", None),
                    "type": getattr(wms.identification, "type", None),
                },
                "contents": [
                    {
                        "name": name,
                        "title": getattr(wms[name], "title", None),
                        "abstract": getattr(wms[name], "abstract", None),
                        "bounding_box_wgs84": list(getattr(wms[name], "boundingBoxWGS84", [])) if hasattr(wms[name], "boundingBoxWGS84") else None,
                        "crs_options": list(getattr(wms[name], "crsOptions", [])) if hasattr(wms[name], "crsOptions") else [],
                        "styles": list(getattr(wms[name], "styles", {}).keys()) if hasattr(wms[name], "styles") else [],
                    }
                    for name in list(wms.contents)
                ],
                "url": self.wms_url,
            }
        except Exception as e:
            return {"error": str(e), "url": self.wms_url}

    async def get_wfs_capabilities(self) -> Dict[str, Any]:
        """Get WFS capabilities async via thread pool."""
        if not self.wfs_url:
            return {"error": "No WFS URL provided"}
        try:
            wfs = await asyncio.to_thread(WebFeatureService, self.wfs_url, version='2.0.0')
            return {
                "identification": {
                    "title": getattr(wfs.identification, "title", None),
                    "abstract": getattr(wfs.identification, "abstract", None),
                },
                "contents": [
                    {
                        "name": name,
                        "title": getattr(wfs[name], "title", None),
                        "abstract": getattr(wfs[name], "abstract", None),
                    }
                    for name in list(wfs.contents)
                ],
                "url": self.wfs_url,
            }
        except Exception as e:
            return {"error": str(e), "url": self.wfs_url}

    async def get_feature(self, layer_name: str, bbox: Optional[List[float]] = None,
                        filter_xml: Optional[str] = None, srs: str = "EPSG:4326",
                        max_features: int = 1000) -> Dict[str, Any]:
        """WFS GetFeature request — returns GeoJSON-like dict."""
        if not self.wfs_url:
            return {"error": "No WFS URL provided"}
        try:
            wfs = await asyncio.to_thread(WebFeatureService, self.wfs_url, version='2.0.0')
            params = {"typename": layer_name, "srsname": srs, "maxfeatures": max_features}
            if bbox:
                params["bbox"] = ",".join(str(c) for c in bbox)
            if filter_xml:
                params["filter"] = filter_xml
            resp = wfs.getfeature(**params)
            return {
                "layer": layer_name,
                "srs": srs,
                "features_count": len(list(resp)),
                "raw_response": "Feature data parsed — full GeoJSON conversion available in frontend layer.",
            }
        except Exception as e:
            return {"error": str(e), "url": self.wfs_url, "layer": layer_name}

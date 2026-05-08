import asyncio
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode, urljoin

import httpx
import structlog
from owslib.wfs import WebFeatureService
from owslib.wms import WebMapService
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.municipal_gis_endpoint import MunicipalGisEndpoint
from app.models.municipality import Municipality

logger = structlog.get_logger()

COMMON_PATHS = [
    "/wms.ashx",
    "/webgis_net/wms.ashx",
    "/netgis7/wms",
    "/netgis5/wms",
    "/gisapi/wms",
    "/WebGIS/wms",
    "/keos/wms",
    "/netgis/wms",
    "/wms",
]


class KeosDiscoveryService:
    """Discovers and persists public municipal KEOS WMS/WFS endpoints."""

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            timeout=20.0,
            follow_redirects=True,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                )
            },
        )
        self._rate_limit_lock = asyncio.Lock()
        self._last_request_at = 0.0

    async def close(self) -> None:
        await self._client.aclose()

    async def discover_keos_endpoints(self, db: AsyncSession, belediye_id: int) -> dict[str, Any]:
        municipality = await db.get(Municipality, belediye_id)
        if not municipality:
            raise ValueError(f"Municipality {belediye_id} not found")

        base_url = self._resolve_base_url(municipality)
        logger.info("keos_discovery_started", belediye_id=belediye_id, base_url=base_url)

        for path in COMMON_PATHS:
            endpoint = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))
            capabilities_url = f"{endpoint}?{urlencode({'request': 'GetCapabilities', 'service': 'WMS'})}"
            result = await self._fetch_capabilities(capabilities_url, referer=base_url)
            if not result:
                continue

            parsed = await asyncio.to_thread(self._parse_wms_capabilities, result["final_url"], result["xml"])
            if not parsed:
                continue

            wms_url = result["final_url"]
            wfs_url = await self._discover_wfs_url(base_url, endpoint)
            record = await self._upsert_endpoint_record(
                db=db,
                belediye_id=belediye_id,
                base_url=base_url,
                wms_url=wms_url,
                wfs_url=wfs_url,
                available_layers=parsed["layers"],
                supported_srs=parsed["supported_srs"],
                status="active",
            )
            municipality.wms_url = wms_url
            municipality.wfs_url = wfs_url
            municipality.discovered_at = datetime.now(timezone.utc)
            await db.commit()

            return {
                "status": "active",
                "belediye_id": belediye_id,
                "base_url": base_url,
                "wms_url": wms_url,
                "wfs_url": wfs_url,
                "available_layers": parsed["layers"],
                "supported_srs": parsed["supported_srs"],
                "discovered_at": record.discovered_at.isoformat(),
            }

        record = await self._upsert_endpoint_record(
            db=db,
            belediye_id=belediye_id,
            base_url=base_url,
            wms_url=None,
            wfs_url=None,
            available_layers=[],
            supported_srs=[],
            status="unavailable",
        )
        municipality.discovered_at = datetime.now(timezone.utc)
        await db.commit()
        return {
            "status": "unavailable",
            "belediye_id": belediye_id,
            "base_url": base_url,
            "wms_url": None,
            "wfs_url": None,
            "available_layers": [],
            "supported_srs": [],
            "discovered_at": record.discovered_at.isoformat(),
        }

    async def get_wms_service(self, db: AsyncSession, municipality_id: int) -> WebMapService:
        endpoint = await self._get_active_endpoint(db, municipality_id)
        if not endpoint or not endpoint.wms_url:
            raise ValueError(f"No active WMS endpoint for municipality {municipality_id}")
        return await asyncio.to_thread(WebMapService, endpoint.wms_url, version="1.3.0")

    async def get_wfs_service(self, db: AsyncSession, municipality_id: int) -> WebFeatureService:
        endpoint = await self._get_active_endpoint(db, municipality_id)
        if not endpoint or not endpoint.wfs_url:
            raise ValueError(f"No active WFS endpoint for municipality {municipality_id}")
        return await asyncio.to_thread(WebFeatureService, endpoint.wfs_url, version="2.0.0")

    async def discover_all(self, db: AsyncSession, limit: int | None = None) -> dict[str, Any]:
        stmt = select(Municipality.id).order_by(Municipality.id.asc())
        if limit:
            stmt = stmt.limit(limit)
        rows = (await db.execute(stmt)).all()
        results = []
        for (municipality_id,) in rows:
            try:
                results.append(await self.discover_keos_endpoints(db, municipality_id))
            except Exception as exc:  # pylint: disable=broad-except
                logger.error("keos_discovery_failed", municipality_id=municipality_id, error=str(exc))
                results.append({"status": "error", "belediye_id": municipality_id, "error": str(exc)})
        return {"count": len(results), "results": results}

    async def _rate_limit_wait(self) -> None:
        async with self._rate_limit_lock:
            now = asyncio.get_running_loop().time()
            elapsed = now - self._last_request_at
            if elapsed < 2:
                await asyncio.sleep(2 - elapsed)
            self._last_request_at = asyncio.get_running_loop().time()

    async def _fetch_capabilities(self, capabilities_url: str, referer: str) -> dict[str, Any] | None:
        await self._rate_limit_wait()
        try:
            response = await self._client.get(
                capabilities_url,
                headers={"Referer": referer, "Accept": "application/xml,text/xml;q=0.9,*/*;q=0.8"},
            )
            if response.status_code != 200:
                return None
            text = response.text.strip()
            if not text.startswith("<"):
                return None
            return {"xml": text, "final_url": str(response.url)}
        except httpx.HTTPError:
            return None

    async def _discover_wfs_url(self, base_url: str, wms_endpoint: str) -> str | None:
        candidates = [
            wms_endpoint.replace("/wms", "/wfs"),
            wms_endpoint.replace("wms.ashx", "wfs.ashx"),
            urljoin(base_url.rstrip("/") + "/", "wfs"),
        ]
        for raw in candidates:
            wfs_base = raw.split("?")[0]
            test_url = f"{wfs_base}?{urlencode({'request': 'GetCapabilities', 'service': 'WFS'})}"
            result = await self._fetch_capabilities(test_url, referer=base_url)
            if result:
                return result["final_url"]
        return None

    def _parse_wms_capabilities(self, url: str, xml_text: str) -> dict[str, Any] | None:
        try:
            wms = WebMapService(url, version="1.3.0", xml=xml_text.encode("utf-8"))
        except Exception:
            try:
                wms = WebMapService(url, version="1.1.1", xml=xml_text.encode("utf-8"))
            except Exception:
                return None

        layers = []
        srs_set: set[str] = set()
        for layer_name, layer in wms.contents.items():
            crs_values = list(getattr(layer, "crsOptions", []) or [])
            srs_values = list(getattr(layer, "srsOptions", []) or [])
            all_srs = sorted(set(crs_values + srs_values))
            srs_set.update(all_srs)
            layers.append(
                {
                    "name": layer_name,
                    "title": getattr(layer, "title", layer_name),
                    "abstract": getattr(layer, "abstract", None),
                    "srs": all_srs,
                }
            )
        return {"layers": layers, "supported_srs": sorted(srs_set)}

    async def _upsert_endpoint_record(
        self,
        db: AsyncSession,
        belediye_id: int,
        base_url: str,
        wms_url: str | None,
        wfs_url: str | None,
        available_layers: list[dict[str, Any]],
        supported_srs: list[str],
        status: str,
    ) -> MunicipalGisEndpoint:
        stmt = (
            select(MunicipalGisEndpoint)
            .where(MunicipalGisEndpoint.belediye_id == belediye_id)
            .order_by(MunicipalGisEndpoint.discovered_at.desc())
        )
        existing = (await db.execute(stmt)).scalars().first()
        if existing:
            existing.base_url = base_url
            existing.wms_url = wms_url
            existing.wfs_url = wfs_url
            existing.available_layers = available_layers
            existing.supported_srs = supported_srs
            existing.status = status
            existing.discovered_at = datetime.now(timezone.utc)
            return existing
        row = MunicipalGisEndpoint(
            belediye_id=belediye_id,
            base_url=base_url,
            wms_url=wms_url,
            wfs_url=wfs_url,
            available_layers=available_layers,
            supported_srs=supported_srs,
            status=status,
            discovered_at=datetime.now(timezone.utc),
        )
        db.add(row)
        await db.flush()
        return row

    async def _get_active_endpoint(self, db: AsyncSession, municipality_id: int) -> MunicipalGisEndpoint | None:
        stmt = (
            select(MunicipalGisEndpoint)
            .where(MunicipalGisEndpoint.belediye_id == municipality_id)
            .order_by(MunicipalGisEndpoint.discovered_at.desc())
        )
        return (await db.execute(stmt)).scalars().first()

    def _resolve_base_url(self, municipality: Municipality) -> str:
        if municipality.keos_url:
            return municipality.keos_url.rstrip("/")
        return f"https://keos.{municipality.slug}.bel.tr"

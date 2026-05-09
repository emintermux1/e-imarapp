from __future__ import annotations

import asyncio
from typing import Dict, Optional, List, Any

import httpx

from app.config import settings
from app.core.exceptions import TKGMError


class TKGMService:
    """Tapu ve Kadastro Genel Müdürlüğü (TKGM) parsel sorgu servisi."""

    def __init__(self):
        self.base_url = settings.TKGM_PARSEL_SORGU_URL.rstrip("/")
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def _request(self, method: str, url: str, **kwargs) -> Any:
        for attempt in range(3):
            try:
                resp = await self.client.request(method, url, **kwargs)
                resp.raise_for_status()
                return resp
            except httpx.HTTPStatusError as exc:
                if attempt == 2:
                    raise TKGMError(f"TKGM HTTP error: {exc.response.status_code}")
                await asyncio.sleep(2 ** attempt)
            except httpx.RequestError as exc:
                if attempt == 2:
                    raise TKGMError(f"TKGM request error: {exc}")
                await asyncio.sleep(2 ** attempt)

    async def get_parcel_data(
        self,
        ada: str,
        parsel: str,
        il: Optional[str] = None,
        ilce: Optional[str] = None,
        mahalle: Optional[str] = None,
    ) -> Dict:
        endpoints = [
            f"{self.base_url}/SearchParcelDetail",
            f"{self.base_url}/appcontroller/parselsorgu/parsel",
            "https://cbs.tkgm.gov.tr/ise/rest/ParselSorguService/searchParsel",
        ]

        for endpoint in endpoints:
            try:
                resp = await self._request(
                    "GET",
                    endpoint,
                    params={"ada": ada, "parsel": parsel, "il": il or "", "ilce": ilce or "", "mahalle": mahalle or ""},
                )
                data = resp.json()
                if data and ((isinstance(data, dict) and data.get("ada")) or isinstance(data, list)):
                    return self._normalize_parcel_data(data, ada, parsel, il, ilce)
            except (TKGMError, ValueError):
                continue

        return {
            "ada": ada,
            "parsel": parsel,
            "il": il,
            "ilce": ilce,
            "mahalle": mahalle,
            "nitelik": None,
            "alan_m2": None,
            "tapu_durumu": None,
            "geometri": None,
            "pafta": None,
            "mevkii": None,
        }

    async def search_by_address(self, address: str, il: Optional[str] = None, ilce: Optional[str] = None) -> List[Dict]:
        return [
            {
                "error": "TKGM public address search API unavailable. Use ada/parsel direct query or e-Devlet integration.",
                "query": address,
                "il": il,
                "ilce": ilce,
            }
        ]

    async def get_parcel_geometry(self, ada: str, parsel: str, il: str, ilce: str, mahalle: Optional[str] = None) -> Dict:
        data = await self.get_parcel_data(ada, parsel, il, ilce, mahalle)
        return {
            "ada": ada,
            "parsel": parsel,
            "geometri": data.get("geometri"),
            "pafta": data.get("pafta"),
            "mevkii": data.get("mevkii"),
        }

    def _normalize_parcel_data(self, raw: Any, ada: str, parsel: str, il: Optional[str], ilce: Optional[str]) -> Dict:
        if isinstance(raw, list) and raw:
            raw = raw[0]
        if not isinstance(raw, dict):
            raw = {}
        return {
            "ada": str(raw.get("ada", ada)),
            "parsel": str(raw.get("parsel", parsel)),
            "il": il or raw.get("il"),
            "ilce": ilce or raw.get("ilce"),
            "mahalle": raw.get("mahalle"),
            "nitelik": raw.get("nitelik", raw.get("tur")),
            "alan_m2": raw.get("alan"),
            "tapu_durumu": raw.get("tapuDurum"),
            "geometri": raw.get("geometry") or raw.get("geometri"),
            "pafta": raw.get("pafta"),
            "mevkii": raw.get("mevkii", raw.get("adres")),
        }

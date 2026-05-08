import httpx
import asyncio
from typing import Dict, Optional, List, Any
from app.config import settings
from app.core.exceptions import TKGMError

class TKGMService:
    """
    Tapu ve Kadastro Genel Müdürlüğü (TKGM) parsel sorgu servisi.
    Kaynak: https://parselsorgu.tkgm.gov.tr/
    """
    def __init__(self):
        self.base_url = settings.TKGM_PARSEL_SORGU_URL.rstrip("/")
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def _request(self, method: str, url: str, **kwargs) -> Any:
        """HTTP istek with 3 retries and exponential backoff."""
        for attempt in range(3):
            try:
                resp = await self.client.request(method, url, **kwargs)
                resp.raise_for_status()
                return resp
            except httpx.HTTPStatusError as e:
                if attempt == 2:
                    raise TKGMError(f"TKGM HTTP error: {e.response.status_code}")
                await asyncio.sleep(2 ** attempt)
            except httpx.RequestError as e:
                if attempt == 2:
                    raise TKGMError(f"TKGM request error: {str(e)}")
                await asyncio.sleep(2 ** attempt)

    async def get_parcel_data(self, ada: str, parsel: str, il: Optional[str] = None,
                              ilce: Optional[str] = None, mahalle: Optional[str] = None) -> Dict:
        """
        Fetch parcel data from TKGM parsel sorgu.
        TKGM does not have a public REST API; this attempts known endpoints
        and falls back to parsing the public search page.
        """
        # Attempt known public API patterns
        endpoints = [
            f"{self.base_url}/SearchParcelDetail",
            f"{self.base_url}/appcontroller/parselsorgu/parsel",
            f"https://cbs.tkgm.gov.tr/ise/rest/ParselSorguService/searchParsel",
        ]

        for endpoint in endpoints:
            try:
                resp = await self._request(
                    "GET", endpoint,
                    params={
                        "ada": ada, "parsel": parsel,
                        "il": il or "", "ilce": ilce or "", "mahalle": mahalle or ""
                    }
                )
                data = resp.json()
                if data and (isinstance(data, dict) and data.get("ada") or isinstance(data, list)):
                    return self._normalize_parcel_data(data, ada, parsel, il, ilce)
            except (TKGMError, ValueError):
                continue

        # Fallback: return structured error with known fields
        raise TKGMError(
            "TKGM API not reachable or requires credentials. "
            "Endpoints tested but returned no valid parcel data."
        )

    async def search_by_address(self, address: str, il: Optional[str] = None,
                                 ilce: Optional[str] = None) -> List[Dict]:
        """
        Search parcels by address string. TKGM does not expose a public
        address search API; this returns a structured error with guidance.
        """
        return [{
            "error": "TKGM public address search API unavailable. "
                     "Use ada/parsel direct query or e-Devlet integration.",
            "query": address,
            "il": il,
            "ilce": ilce,
        }]

    async def get_parcel_geometry(self, ada: str, parsel: str, il: str,
                                   ilce: str, mahalle: Optional[str] = None) -> Dict:
        """
        Return GeoJSON geometry for a parcel.
        """
        data = await self.get_parcel_data(ada, parsel, il, ilce, mahalle)
        return {
            "ada": ada,
            "parsel": parsel,
            "geometri": data.get("geometri"),
            "pafta": data.get("pafta"),
            "mevkii": data.get("mevkii"),
        }

    def _normalize_parcel_data(self, raw: Any, ada: str, parsel: str,
                                il: Optional[str], ilce: Optional[str]) -> Dict:
        """Normalize TKGM response to standard format."""
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

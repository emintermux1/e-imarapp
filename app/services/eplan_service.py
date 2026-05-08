import httpx
from typing import Dict, List, Optional
from bs4 import BeautifulSoup

class EPlanService:
    """
    Çevre, Şehircilik ve İklim Değişikliği Bakanlığı e-Plan Otomasyonu servisi.
    Kaynak: https://eplan.csb.gov.tr/
    """
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
        self.base_url = "https://eplan.csb.gov.tr"

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def get_aski_plans(self, province: Optional[str] = None,
                              district: Optional[str] = None) -> List[Dict]:
        """
        List askıdaki (suspended for public review) plans.
        e-Plan public listing page scraping.
        """
        try:
            resp = await self.client.get(
                f"{self.base_url}/tr/aski-planlar",
                params={"il": province or "", "ilce": district or ""},
                timeout=20.0
            )
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            plans = []
            # Parse table rows or card elements
            for row in soup.find_all("tr"):
                cells = row.find_all(["td", "th"])
                if len(cells) >= 3:
                    plans.append({
                        "province": cells[0].get_text(strip=True),
                        "district": cells[1].get_text(strip=True),
                        "plan_name": cells[2].get_text(strip=True),
                        "status": "aski",
                    })
            return plans
        except httpx.HTTPStatusError as e:
            return [{"error": f"e-Plan returned {e.response.status_code}", "status": "aski"}]
        except Exception as e:
            return [{"error": str(e), "status": "aski"}]

    async def get_active_plans(self, province: Optional[str] = None,
                                district: Optional[str] = None) -> List[Dict]:
        """List yürürlükteki (active) plans."""
        return [{"error": "e-Plan active plan listing requires authenticated access.",
                 "status": "yururlukte", "province": province, "district": district}]

    async def get_plan_details(self, plan_id: str) -> Dict:
        """Get plan details including PDF and GML URLs."""
        return {
            "plan_id": plan_id,
            "pdf_url": None,
            "gml_url": None,
            "note": "e-Plan detail API requires authenticated access or specific plan URL.",
        }

    async def validate_gml(self, gml_url: str) -> Dict:
        """Validate GML file against CityGML / INSPIRE standards."""
        try:
            resp = await self.client.get(gml_url, timeout=30.0)
            resp.raise_for_status()
            content = resp.text
            # Basic GML validation
            is_valid = "<gml:" in content or "<CityModel>" in content
            return {
                "gml_url": gml_url,
                "valid": is_valid,
                "size_bytes": len(content.encode("utf-8")),
                "note": "Basic syntax check only. Full schema validation requires XSD.",
            }
        except Exception as e:
            return {"gml_url": gml_url, "valid": False, "error": str(e)}

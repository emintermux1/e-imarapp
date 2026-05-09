from __future__ import annotations

from typing import Optional, List, Dict

from bs4 import BeautifulSoup
import httpx

from app.config import settings
from app.core.responses import envelope
from app.connectors.http import get_client
from app.connectors.probe import probe_source
from app.sources.registry import REGISTRY


class EPlanService:
    """
    Çevre, Şehircilik ve İklim Değişikliği Bakanlığı e-Plan Otomasyonu servisi.
    """

    def __init__(self):
        self.base_url = REGISTRY.get("csb.eplan", None).base_url if REGISTRY.get("csb.eplan") else settings.EPLAN_BASE_URL.rstrip("/")
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def get_plans(self, municipality_id: int | None = None, plan_type: str | None = None):
        return envelope(
            "not_ready",
            message="Detaylı plan listeleme henüz e-Plan HTML tablosuna bağlanmadı; şu an askı agregasyonu hazır.",
            municipality_id=municipality_id,
            plan_type=plan_type,
        )

    async def get_aski_plans(self, province: Optional[str] = None, district: Optional[str] = None) -> Dict:
        source = REGISTRY["csb.eplan"]
        async with await get_client() as client:
            probe = await probe_source(client, source)
            if probe["status"] not in {"ok", "public_partial"}:
                return envelope(
                    probe["status"],
                    message=probe.get("message") or "e-Plan kaynağına erişilemedi.",
                    next_actions=["e-Plan public askı tablosu erişimini doğrulayın"],
                    items=[],
                    total=0,
                    source=source.to_dict(),
                    probe=probe,
                )
            try:
                response = await client.get(source.base_url)
                html = response.text
            except Exception as exc:  # noqa: BLE001
                return envelope("unavailable", message=str(exc), items=[], total=0, source=source.to_dict(), probe=probe)

        soup = BeautifulSoup(html, "lxml")
        links = []
        for link in soup.find_all("a", href=True):
            href = link.get("href", "")
            title = link.get_text(" ", strip=True)
            if any(keyword in title.lower() for keyword in ["askı", "plan", "imar"]) or any(
                keyword in href.lower() for keyword in ["aski", "plan", "imar"]
            ):
                links.append({"title": title[:200], "url": href})
        links = links[:50]
        status = "partial" if links else "empty"
        return envelope(
            status,
            message="e-Plan ana sayfasındaki public linkler toplandı; detay tablo endpoint'i henüz garanti değil.",
            items=links,
            total=len(links),
            source=source.to_dict(),
            probe=probe,
            next_actions=[
                "Public askı tablo endpoint'i bulunursa HTML satır parse'ını genişletin",
                "Gerekirse e-Plan iç sayfa pattern'lerini regex ile eşleştirin",
            ],
        )

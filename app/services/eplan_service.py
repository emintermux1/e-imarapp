from __future__ import annotations

import re

from bs4 import BeautifulSoup

from app.connectors.http import get_client
from app.connectors.probe import probe_source
from app.core.responses import envelope
from app.sources.registry import REGISTRY


class EPlanService:
    def __init__(self):
        self.base_url = REGISTRY["csb.eplan"].base_url

    async def get_plans(self, municipality_id: int | None = None, plan_type: str | None = None):
        return envelope(
            "not_ready",
            message="Detaylı plan listeleme henüz e-Plan HTML tablosuna bağlanmadı; şu an askı agregasyonu hazır.",
            municipality_id=municipality_id,
            plan_type=plan_type,
        )

    async def get_aski_plans(self):
        source = REGISTRY["csb.eplan"]
        async with await get_client() as client:
            probe = await probe_source(client, source)
            if probe["status"] not in {"ok", "public_partial"}:
                return envelope(
                    probe["status"],
                    message=probe.get("message") or "e-Plan kaynağına erişilemedi.",
                    next_actions=["e-Plan public askı tablosu erişimini doğrulayın"],
                    notices=[],
                    count=0,
                    source=source.to_dict(),
                    probe=probe,
                )
            try:
                response = await client.get(source.base_url)
                html = response.text
            except Exception as exc:  # noqa: BLE001
                return envelope("unavailable", message=str(exc), notices=[], count=0, source=source.to_dict(), probe=probe)

        soup = BeautifulSoup(html, "lxml")
        text = soup.get_text(" ", strip=True)
        links = []
        for link in soup.find_all("a", href=True):
            href = link.get("href", "")
            title = link.get_text(" ", strip=True)
            if any(keyword in title.lower() for keyword in ["askı", "plan", "imar"]) or any(keyword in href.lower() for keyword in ["aski", "plan", "imar"]):
                links.append({"title": title[:200], "url": href})
        links = links[:50]
        status = "partial" if links else "empty"
        return envelope(
            status,
            message="e-Plan ana sayfasındaki public linkler toplandı; detay tablo endpoint'i henüz garanti değil.",
            notices=[
                {
                    "id": f"eplan-{index}",
                    "title": item["title"] or "e-Plan linki",
                    "document_url": item["url"],
                    "source_id": source.id,
                }
                for index, item in enumerate(links)
            ],
            count=len(links),
            source=source.to_dict(),
            probe=probe,
            next_actions=[
                "Public askı tablo endpoint'i bulunursa HTML satır parse'ını genişletin",
                "Gerekirse e-Plan iç sayfa pattern'lerini regex ile eşleştirin",
            ],
        )

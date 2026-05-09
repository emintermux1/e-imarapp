from __future__ import annotations

from app.core.responses import envelope
from app.sources.registry import REGISTRY


class TKGMService:
    def __init__(self):
        self.base_url = REGISTRY["tkgm.parselsorgu"].base_url

    async def get_parcel_data(self, ada: str, parsel: str, il: str | None = None, ilce: str | None = None):
        return envelope(
            "requires_credentials",
            message="TKGM Parsel Sorgu public HTML arayüzü captcha/oturum gerektiriyor; doğrudan otomatik parsel çekimi açık değil.",
            next_actions=[
                "Belediye bazlı KEOS kaynağı seçip oradan ada/parsel deneyin",
                "Kurumsal TKGM erişimi veya resmi veri paylaşım protokolü tanımlayın",
            ],
            query={"ada": ada, "parsel": parsel, "il": il, "ilce": ilce},
            source_id="tkgm.parselsorgu",
        )

import httpx
from app.config import settings

class TKGMService:
    def __init__(self):
        self.base_url = settings.TKGM_PARSEL_SORGU_URL
        self.client = httpx.AsyncClient()
    
    async def get_parcel_data(self, ada: str, parsel: str, il: str = None, ilce: str = None):
        """
        Fetch parcel data from TKGM service.
        """
        # Implementation for fetching parcel data
        # This would typically make an HTTP request to the TKGM service
        # and parse the response
        pass
    
    async def close(self):
        await self.client.aclose()
import httpx
from app.config import settings

class EPlanService:
    def __init__(self):
        self.base_url = settings.EPLAN_BASE_URL
        self.client = httpx.AsyncClient()
    
    async def get_plans(self, municipality_id: int = None, plan_type: str = None):
        """
        Fetch plans from e-Plan service.
        """
        # Implementation for fetching plans
        # This would typically make an HTTP request to the e-Plan service
        # and parse the response
        pass
    
    async def get_aski_plans(self):
        """
        Fetch plans currently in aski (public display) period.
        """
        # Implementation for fetching aski plans
        # This would typically make an HTTP request to the e-Plan service
        # and parse the response
        pass
    
    async def close(self):
        await self.client.aclose()
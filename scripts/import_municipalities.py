import json
import requests
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.municipality import Municipality
from app.database import AsyncSessionLocal

async def import_municipalities():
    """
    Import Turkish municipalities from JSON data.
    """
    # Fetch data from GitHub repository
    url = "https://raw.githubusercontent.com/efefurkankarakaya/turkiye-cities-and-districts/main/data.json"
    response = requests.get(url)
    
    if response.status_code != 200:
        raise Exception("Failed to fetch data from GitHub")
    
    data = response.json()
    
    # Process and insert data into database
    async with AsyncSessionLocal() as session:
        for city in data:
            for district in city["districts"]:
                for municipality in district["municipalities"]:
                    # Create municipality record
                    m = Municipality(
                        name=municipality["name"],
                        province=city["name"],
                        district=district["name"],
                        slug=municipality["slug"]
                    )
                    session.add(m)
        
        await session.commit()

if __name__ == "__main__":
    import asyncio
    asyncio.run(import_municipalities())
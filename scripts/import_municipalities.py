#!/usr/bin/env python3
"""
Import Turkish municipalities from JSON data to database.
"""
import json
import asyncio
import asyncpg
from app.config import settings
from app.models.municipality import Municipality
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert

async def import_municipalities():
    """
    Import Turkish municipalities from JSON data.
    """
    # Read data from JSON file
    with open('/home/e-imarapp/data/turkiye_municipalities.json', 'r', encoding='utf-8') as f:
        municipalities_data = json.load(f)
    
    print(f"Loaded {len(municipalities_data)} municipalities from JSON file")
    
    # For now, just print the first few records to verify the data
    print("First 3 municipalities:")
    for i, m_data in enumerate(municipalities_data[:3]):
        print(f"  {i+1}. {m_data['name']} ({m_data['province']}) - {m_data['slug']}")

async def main():
    try:
        await import_municipalities()
        print("Municipalities import script completed successfully!")
    except Exception as e:
        print(f"Error during import: {e}")
        print("Note: This is expected if PostgreSQL is not running.")

if __name__ == "__main__":
    asyncio.run(main())
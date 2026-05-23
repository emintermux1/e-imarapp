"""
Türkiye Belediye Verisi Import Script'i.
data/turkiye_municipalities.json'dan okur ve PostgreSQL'e async bulk insert yapar.
"""
import json
import asyncio
import asyncpg
from app.config import settings


async def import_municipalities(json_path: str = "data/turkiye_municipalities.json"):
    """
    JSON'dan belediye verisini oku ve DB'ye bulk insert et.
    Duplicate slug: ON CONFLICT DO NOTHING.
    """
    with open(json_path, "r", encoding="utf-8") as f:
        municipalities = json.load(f)

    # Parse DATABASE_URL (postgresql+asyncpg://user:pass@host:port/db)
    url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(url)

    try:
        # Ensure table exists (if not, create it)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS municipalities (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                province VARCHAR,
                district VARCHAR,
                slug VARCHAR UNIQUE NOT NULL,
                type VARCHAR,
                population_2023 INTEGER,
                latitude FLOAT,
                longitude FLOAT,
                keos_url VARCHAR,
                wms_url VARCHAR,
                wfs_url VARCHAR,
                ogc_capabilities_json TEXT,
                discovered_at TIMESTAMP
            )
        """)

        # Bulk insert with conflict handling
        inserted = 0
        skipped = 0
        for m in municipalities:
            try:
                await conn.execute(
                    """
                    INSERT INTO municipalities
                    (name, province, district, slug, type, population_2023, latitude, longitude, keos_url, wms_url, wfs_url, ogc_capabilities_json, discovered_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (slug) DO NOTHING
                    """,
                    m["name"],
                    m.get("province"),
                    m.get("district"),
                    m["slug"],
                    m.get("type"),
                    m.get("population_2023"),
                    m.get("latitude"),
                    m.get("longitude"),
                    m.get("keos_url"),
                    m.get("wms_url"),
                    m.get("wfs_url"),
                    m.get("ogc_capabilities_json"),
                    m.get("discovered_at"),
                )
                inserted += 1
            except Exception:
                skipped += 1

        print(f"Import complete: {inserted} inserted, {skipped} skipped (duplicates or errors)")
        print(f"Total in JSON: {len(municipalities)}")

        # Verify count
        count = await conn.fetchval("SELECT COUNT(*) FROM municipalities")
        print(f"Total in DB: {count}")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(import_municipalities())

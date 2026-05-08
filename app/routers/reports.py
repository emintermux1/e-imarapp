from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.services.pdf_report_service import PDFReportService

router = APIRouter()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

@router.post("/reports/generate")
async def generate_report(
    parcel_id: int = None,
    plan_id: int = None,
    db: AsyncSession = Depends(get_db)
):
    try:
        service = PDFReportService()
        result = await service.generate_report(parcel_id, plan_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
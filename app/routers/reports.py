from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.report import Report
from app.schemas.report import ReportRequest, ReportResponse
from app.services.pdf_report_service import PDFReportService

router = APIRouter()

@router.post("/reports/generate", response_model=ReportResponse)
async def generate_report(
    req: ReportRequest,
    db: AsyncSession = Depends(get_db)
):
    report = Report(
        user_id=1,  # TODO: get from auth
        parcel_id=req.parcel_id,
        plan_id=req.plan_id,
        status="pending",
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    # Async report generation would be triggered via Celery
    # For now, return the pending report
    return report

@router.get("/reports/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Report).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

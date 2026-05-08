from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.report import Report
from app.schemas.report import ReportRequest, ReportResponse
from app.services.pdf_report_service import PDFReportService
import uuid
import io

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

@router.get("/reports/{report_id}/download")
async def download_report(report_id: int, db: AsyncSession = Depends(get_db)):
    """Download a generated PDF report."""
    result = await db.execute(
        select(Report).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # In a real implementation, we would retrieve the PDF from storage
    # For now, we'll generate a sample PDF
    service = PDFReportService()
    # This is a placeholder - in reality, you'd fetch the actual data
    pdf_bytes = await service.generate_parcel_report(
        parcel_data={"ada": "123", "parsel": "456", "il": "İstanbul", "ilce": "Beşiktaş"},
        plan_data={"plan_no": "P-2023-001", "plan_adi": "Sample Plan"},
        imar_data={"taks": "0.4", "kaks": "2.5", "h_max": "25.5"}
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=report_{report_id}.pdf"
        }
    )

@router.get("/reports/{report_id}/share")
async def share_report(report_id: int, db: AsyncSession = Depends(get_db)):
    """Get a shareable link for a report."""
    result = await db.execute(
        select(Report).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # In a real implementation, this would return a shareable URL
    # For now, we'll return a placeholder
    share_token = report.share_token or str(uuid.uuid4())
    
    # Update the report with the share token if it doesn't have one
    if not report.share_token:
        report.share_token = share_token
        await db.commit()
    
    # In a real implementation, this would be the actual storage URL
    share_url = f"https://eimartr.example.com/reports/shared/{share_token}"
    
    return {"share_url": share_url, "share_token": share_token}

@router.get("/reports/history")
async def get_report_history(db: AsyncSession = Depends(get_db)):
    """Get user's report history."""
    result = await db.execute(
        select(Report)
        .where(Report.user_id == 1)  # TODO: get from auth
        .order_by(Report.created_at.desc())
        .limit(50)
    )
    reports = result.scalars().all()
    
    return [
        {
            "id": report.id,
            "parcel_id": report.parcel_id,
            "plan_id": report.plan_id,
            "status": report.status,
            "created_at": report.created_at,
            "completed_at": report.completed_at
        }
        for report in reports
    ]
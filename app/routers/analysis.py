from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models.parcel import Parcel

router = APIRouter()

@router.post("/analysis/mergeable-parcels")
async def find_mergeable_parcels(
    parcel_ids: List[int],
    db: AsyncSession = Depends(get_db)
):
    """
    Birleşebilir parsel önerisi — aynı ada, komşu, benzer nitelik.
    """
    try:
        result = await db.execute(
            select(Parcel).where(Parcel.id.in_(parcel_ids))
        )
        parcels = result.scalars().all()
        if len(parcels) < 2:
            return {"mergeable": False, "reason": "En az 2 parsel gerekli", "parcels": len(parcels)}

        # Check if same municipality, same ada (simplified)
        adas = set(p.ada for p in parcels)
        municipalities = set(p.municipality for p in parcels)
        mergeable = len(adas) == 1 and len(municipalities) == 1

        return {
            "mergeable": mergeable,
            "parcels_checked": len(parcels),
            "same_ada": len(adas) == 1,
            "same_municipality": len(municipalities) == 1,
            "ada": list(adas)[0] if len(adas) == 1 else None,
            "note": "Gerçek birleşebilirlik tapu müdürlüğü onayı gerektirir. Bu sadece geometrik öneridir."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis/area-value-estimate")
async def estimate_area_value(
    parcel_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Çevrenin emlak değeri tahmini (opsiyonel ML).
    Şimdilik basit heuristic.
    """
    try:
        result = await db.execute(select(Parcel).where(Parcel.id == parcel_id))
        parcel = result.scalar_one_or_none()
        if not parcel:
            raise HTTPException(status_code=404, detail="Parcel not found")

        # Simplified: estimate based on area and location
        # Real ML would use: comparable sales, location score, infrastructure proximity
        base_value_per_m2 = 5000  # TL/m² baseline
        if parcel.province and parcel.province.lower() in ["istanbul", "ankara", "izmir"]:
            base_value_per_m2 = 15000
        elif parcel.province and parcel.province.lower() in ["antalya", "bursa", "mugla"]:
            base_value_per_m2 = 8000

        estimated_value = (parcel.alan_m2 or 1000) * base_value_per_m2

        return {
            "parcel_id": parcel_id,
            "estimated_value_tl": round(estimated_value, 2),
            "value_per_m2_tl": base_value_per_m2,
            "confidence": 0.4,
            "method": "Heuristic baseline — ML model not yet trained",
            "note": "Gerçek değer için uzman değerleme şirketine başvurunuz."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analysis/detect-imar-changes")
async def detect_imar_changes(
    old_plan: Dict[str, Any],
    new_plan: Dict[str, Any]
):
    """
    İmar değişikliği algılama — emsal/gabari değişimi.
    """
    changes = []
    fields = ["emsal", "kaks", "taks", "h_max", "gabari", "plan_type", "status"]
    for field in fields:
        old_val = old_plan.get(field)
        new_val = new_plan.get(field)
        if old_val != new_val:
            changes.append({
                "field": field,
                "old_value": old_val,
                "new_value": new_val,
                "severity": "high" if field in ["emsal", "kaks", "plan_type"] else "medium"
            })
    return {
        "changes_found": len(changes),
        "changes": changes,
        "significant": any(c["severity"] == "high" for c in changes)
    }

@router.post("/analysis/parse-plan-legend")
async def parse_plan_legend(
    pdf_url: str = Query(..., description="Plan PDF URL")
):
    """
    Plan renk kodlarının anlamı (lejant) otomatik okuma.
    Şimdilik template-based parsing.
    """
    # In production: use pdfplumber + OCR + color extraction
    return {
        "pdf_url": pdf_url,
        "legend_detected": False,
        "legend_items": [
            {"color": "#a9dfbf", "label": "Park, yeşil alan", "code": "P"},
            {"color": "#f9e79f", "label": "Konut alanı, düşük yoğunluk", "code": "K1, K2"},
            {"color": "#f5b041", "label": "Karma kullanım", "code": "K/T"},
            {"color": "#e74c3c", "label": "Ticaret, sanayi", "code": "T, S"},
            {"color": "#85c1e9", "label": "Eğitim, sağlık, kamu", "code": "E, SA, K"},
            {"color": "#d5d8dc", "label": "Yol, ulaşım", "code": "Y, U"},
        ],
        "method": "Template-based legend mapping. Full auto-detection requires pdfplumber + color extraction.",
        "note": "Lejant plan paftasından AI/OCR ile otomatik okunabilir — ileride implemente edilecek."
    }
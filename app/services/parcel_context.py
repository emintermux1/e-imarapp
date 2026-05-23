from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Iterable

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.municipality import Municipality
from app.models.parcel import Parcel
from app.models.plan import Plan
from app.schemas.parcel_context import ParcelQualityMetadata, ParcelSourceMetadata, RelatedPlanItem
from app.sources.registry import SourceEntry, list_sources


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _norm(value: str | None) -> str:
    return (value or "").strip().casefold()


def source_status_from_auth(auth: str | None) -> str:
    if auth == "public":
        return "public_metadata"
    if auth in {"public_partial", "rate_limited"}:
        return "public_metadata"
    if auth in {"requires_credentials", "requires_legal_agreement", "captcha_required"}:
        return "unavailable"
    return "public_metadata"


def source_message_from_auth(auth: str | None) -> str:
    if auth == "public":
        return "Kaynak registry metadatası mevcut; bu yanıtta canlı parsel sorgusu yapılmadı."
    if auth == "public_partial":
        return "Kaynak kısmen açık görünüyor; canlı parsel/imar parametresi garanti edilmez."
    if auth == "captcha_required":
        return "Kaynak captcha veya oturum gerektiriyor; otomatik canlı sorgu yapılamıyor."
    if auth in {"requires_credentials", "requires_legal_agreement"}:
        return "Kaynak kurumsal yetki/protokol gerektiriyor."
    return "Kaynak durumu registry metadatasından türetildi; canlı sağlık geçmişi yok."


def find_best_source(province: str | None = None, district: str | None = None, municipality: str | None = None) -> SourceEntry | None:
    district_norm = _norm(district or municipality)
    province_norm = _norm(province)
    sources = list_sources()
    if district_norm:
        for source in sources:
            haystack = " ".join(filter(None, [source.municipality_name, source.name, source.id]))
            if district_norm in _norm(haystack):
                return source
    if province_norm:
        for source in sources:
            haystack = " ".join(filter(None, [source.municipality_name, source.name, source.id]))
            if province_norm in _norm(haystack):
                return source
    return next((source for source in sources if "parcel-query" in source.capabilities), None)


def parcel_identity(parcel: Parcel) -> dict[str, Any]:
    return {
        "id": parcel.id,
        "ada": parcel.ada,
        "parsel": parcel.parsel,
        "il": parcel.province,
        "ilce": parcel.district,
        "mahalle": parcel.mahalle,
        "nitelik": parcel.nitelik,
        "alan_m2": parcel.alan_m2,
        "tapu_durumu": parcel.tapu_status,
        "municipality": parcel.municipality,
    }


def build_source_metadata(source: SourceEntry | None) -> ParcelSourceMetadata:
    if not source:
        return ParcelSourceMetadata(
            source_status="unavailable",
            source_message="Bu parsel için eşleşen kaynak metadatası bulunamadı.",
        )
    return ParcelSourceMetadata(
        source_id=source.id,
        source_name=source.name,
        municipality=source.municipality_name,
        provider=source.provider.value,
        source_status=source_status_from_auth(source.auth.value),
        source_message=source_message_from_auth(source.auth.value),
    )


def build_quality_metadata(
    *,
    parcel: Parcel,
    source: SourceEntry | None,
    related_count: int = 0,
    aski_count: int = 0,
) -> ParcelQualityMetadata:
    has_geometry = parcel.geom is not None
    source_meta = build_source_metadata(source)
    hints: list[str] = []
    if has_geometry:
        hints.append("Parsel geometrisi veritabanında mevcut.")
    else:
        hints.append("Parsel geometrisi veritabanında yok; haritada çizim için ayrı canlı kaynak gerekir.")
    if related_count:
        hints.append("Belediye/ilçe eşleşmesiyle ilişkili plan kaydı bulundu.")
    if aski_count:
        hints.append("Aktif veya kayıtlı askı planı kaydı bulundu.")
    if source_meta.source_status != "live":
        hints.append("Kaynak durumu canlı sorgudan değil registry/veritabanı metadatasından türetildi.")

    confidence = 0.35
    if has_geometry:
        confidence += 0.25
    if source:
        confidence += 0.15
    if related_count or aski_count:
        confidence += 0.15
    confidence = min(confidence, 0.9)
    if confidence >= 0.75:
        confidence_label = "high"
    elif confidence >= 0.5:
        confidence_label = "medium"
    else:
        confidence_label = "low"

    live_but_unknown = has_geometry and not (related_count or aski_count)
    return ParcelQualityMetadata(
        geometry_available=has_geometry,
        source_status=source_meta.source_status,
        source_name=source_meta.source_name,
        source_municipality=source_meta.municipality,
        source_provider=source_meta.provider,
        confidence=round(confidence, 2),
        confidence_label=confidence_label,
        quality_hints=hints,
        plan_match_status="matched" if related_count else "unknown",
        aski_match_status="matched" if aski_count else "unknown",
        imar_params_status="unknown",
        message=(
            "Parsel kaydı/geometrisi mevcut olabilir; ancak imar parametreleri bu backend verisinde henüz kesinleşmemiştir."
            if live_but_unknown
            else source_meta.source_message
        ),
    )


def parse_geojson(raw: Any) -> dict[str, Any] | None:
    if not raw:
        return None
    if isinstance(raw, dict):
        return raw
    try:
        return json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return None


def related_plan_label(row: Any) -> str:
    parts = [row.get("plan_type"), row.get("municipality_name"), row.get("district"), row.get("province")]
    return " · ".join(str(part) for part in parts if part) or f"Plan #{row['id']}"


def rows_to_related_plans(rows: Iterable[dict[str, Any]], include_geometry: bool = False, relation: str = "municipality") -> list[RelatedPlanItem]:
    items: list[RelatedPlanItem] = []
    for row in rows:
        geometry = parse_geojson(row.get("geom_geojson")) if include_geometry else None
        items.append(
            RelatedPlanItem(
                id=row["id"],
                label=related_plan_label(row),
                municipality_id=row.get("municipality_id"),
                municipality_name=row.get("municipality_name"),
                municipality_slug=row.get("municipality_slug"),
                province=row.get("province"),
                district=row.get("district"),
                status=row.get("status"),
                plan_type=row.get("plan_type"),
                aski_start=row.get("aski_start"),
                aski_end=row.get("aski_end"),
                pdf_url=row.get("pdf_url"),
                gml_url=row.get("gml_url"),
                has_geometry=bool(row.get("has_geometry") or geometry),
                geom_geojson=geometry,
                relation=relation,
            )
        )
    return items


async def get_parcel_or_none(db: AsyncSession, parcel_id: int) -> Parcel | None:
    result = await db.execute(select(Parcel).where(Parcel.id == parcel_id))
    return result.scalar_one_or_none()


async def get_related_plan_rows(
    db: AsyncSession,
    parcel: Parcel,
    *,
    limit: int = 8,
    include_geometry: bool = False,
) -> tuple[list[dict[str, Any]], str]:
    geometry_sql = func.ST_AsGeoJSON(Plan.geom) if include_geometry else None
    columns = [
        Plan.id,
        Plan.municipality_id,
        Plan.plan_type,
        Plan.status,
        Plan.aski_start,
        Plan.aski_end,
        Plan.pdf_url,
        Plan.gml_url,
        Municipality.name.label("municipality_name"),
        Municipality.slug.label("municipality_slug"),
        Municipality.province.label("province"),
        Municipality.district.label("district"),
        (Plan.geom.is_not(None)).label("has_geometry"),
    ]
    if geometry_sql is not None:
        columns.append(geometry_sql.label("geom_geojson"))

    stmt = select(*columns).select_from(Plan).outerjoin(Municipality, Municipality.id == Plan.municipality_id)
    filters = []
    match_method = "none"
    if parcel.district:
        filters.append(func.lower(Municipality.district) == parcel.district.strip().lower())
        filters.append(func.lower(Municipality.name).like(f"%{parcel.district.strip().lower()}%"))
        match_method = "district"
    if parcel.municipality:
        filters.append(func.lower(Municipality.name).like(f"%{parcel.municipality.strip().lower()}%"))
        match_method = "municipality"
    if parcel.province:
        filters.append(func.lower(Municipality.province) == parcel.province.strip().lower())
        if match_method == "none":
            match_method = "municipality"
    if not filters:
        return [], "none"

    freshness = func.coalesce(Plan.aski_end, Plan.aski_start)
    stmt = stmt.where(or_(*filters)).order_by(freshness.desc().nullslast(), Plan.id.desc()).limit(limit)
    result = await db.execute(stmt)
    return [dict(row) for row in result.mappings().all()], match_method

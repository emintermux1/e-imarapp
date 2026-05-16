from __future__ import annotations

import asyncio
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.http import get_client
from app.connectors.probe import probe_source
from app.core.responses import envelope, now_iso
from app.database import get_db
from app.schemas.source import SourceCoverageHints, SourceQualityHistoryResponse, SourceQualityRecord, SourceQualityResponse
from app.services.netcad_keos_service import NetcadKeosService
from app.services.source_health import get_source_health_histories, get_source_health_history, record_source_probe
from app.services.source_registry import get_source as get_legacy_source
from app.services.source_registry import list_sources as list_legacy_sources
from app.sources.registry import SourceEntry, get_source, list_sources

router = APIRouter()


def _legacy_filters(sources: list[dict], kind: Optional[str], province: Optional[str]):
    if kind:
        sources = [s for s in sources if s.get("kind") == kind]
    if province:
        sources = [s for s in sources if (s.get("province") or "").lower() == province.lower()]
    return sources


def _ui_status(raw_status: str | None, auth: str | None = None, live_checked: bool = False) -> str:
    if raw_status == "ok":
        return "live"
    if raw_status in {"unavailable", "provider_error"}:
        return "unavailable"
    if raw_status in {"requires_credentials", "requires_legal_agreement", "captcha_required"}:
        return "unavailable"
    if raw_status == "public_partial" or auth == "public_partial":
        return "fallback" if not live_checked else "unavailable"
    if auth == "public":
        return "fallback"
    return "fallback"


def _coverage(capabilities: list[str]) -> SourceCoverageHints:
    return SourceCoverageHints(
        has_geometry=any(cap in capabilities for cap in ["parcel-geometry", "layers", "wms", "arcgis"]),
        has_imar=any(cap in capabilities for cap in ["parcel-query", "plan-detail", "layers"]),
        has_aski="aski-list" in capabilities,
        has_documents=any(cap in capabilities for cap in ["document-links", "documentation"]),
        capabilities=capabilities,
    )


def _message_for(status: str, raw_status: str | None, coverage: SourceCoverageHints) -> tuple[str, str]:
    if status == "live":
        return "Kaynak ana uç noktası yanıt verdi; detay servis kapsamı ayrıca doğrulanmalıdır.", "Servis katmanlarını keşfet ve ilgili parsel/plan sorgusunu çalıştır."
    if raw_status in {"requires_credentials", "requires_legal_agreement", "captcha_required"}:
        return "Kaynak erişimi oturum, captcha veya kurumsal protokol gerektiriyor; canlı veri yok sayılmamalı.", "Yetkili entegrasyon/protokol tamamlanmadan otomatik canlı veri bekleme."
    if raw_status in {"provider_error", "unavailable"}:
        return "Kaynak son kontrolde yanıt vermedi veya hata döndürdü.", "Daha sonra yeniden probe et veya alternatif belediye/ulusal kaynağa düş."
    if coverage.has_geometry or coverage.has_imar or coverage.has_aski:
        return "Registry metadatası bu kaynağın ilgili kabiliyete sahip olabileceğini söylüyor; canlı kontrol geçmişi yok.", "Canlı probe/discovery çalıştırarak endpoint ve katman durumunu doğrula."
    return "Bu kaynak yalnızca katalog/doküman metadatası sağlıyor olabilir.", "UI'da canlı imar/geometri kaynağı gibi göstermeyin."


def _endpoint_dicts(endpoints: list[Any]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for endpoint in endpoints[:10]:
        if isinstance(endpoint, dict):
            out.append(endpoint)
        elif isinstance(endpoint, str):
            out.append({"url": endpoint})
    return out


def _quality_record(
    src: SourceEntry,
    probe: dict[str, Any] | None = None,
    live_checked: bool = False,
    history: SourceQualityHistoryResponse | None = None,
) -> SourceQualityRecord:
    probe = probe or {}
    raw_status = str(probe.get("status") or src.auth.value)
    status = _ui_status(raw_status, src.auth.value, live_checked)
    endpoints = _endpoint_dicts(probe.get("discovered_endpoints") or [])
    endpoint_url = probe.get("checked_url") or src.base_url
    service_url = endpoints[0].get("url") if endpoints else src.base_url
    coverage = _coverage(src.capabilities)
    user_message, next_action = _message_for(status, raw_status, coverage)
    failure_reason = probe.get("message") if status != "live" else None
    checked_at = now_iso() if live_checked else None
    return SourceQualityRecord(
        source_id=src.id,
        key=src.id,
        name=src.name,
        municipality_name=src.municipality_name,
        category=src.category.value,
        type=src.discovery_strategy,
        provider=src.provider.value,
        status=status,
        raw_status=raw_status,
        last_checked_at=checked_at,
        last_success_at=checked_at if status == "live" else None,
        last_failed_at=history.last_failed_at if history else None,
        next_scheduled_check_at=history.next_scheduled_check_at if history else None,
        next_check_at=history.next_scheduled_check_at if history else None,
        consecutive_failures=history.consecutive_failures if history else 0,
        recent_probe_events=history.recent_probe_events if history else [],
        probe_events=history.recent_probe_events if history else [],
        history_unavailable_reason=history.history_unavailable_reason if history else "Kalıcı probe geçmişi henüz bu kaynak için oluşmadı.",
        suggested_action=history.suggested_action if history else None,
        latency_ms=probe.get("latency_ms"),
        http_status=probe.get("http_status"),
        endpoint_url=endpoint_url,
        service_url=service_url,
        failure_reason=failure_reason,
        coverage=coverage,
        geometry_available=coverage.has_geometry,
        imar_available=coverage.has_imar,
        aski_available=coverage.has_aski,
        history_available=history.history_available if history else False,
        endpoint_count=len(endpoints),
        discovered_endpoints=endpoints,
        next_action=next_action,
        user_message=user_message,
    )


def _quality_response(records: list[SourceQualityRecord], live_checked: bool) -> SourceQualityResponse:
    rollup = {"live": 0, "fallback": 0, "unavailable": 0, "computed": 0, "demo": 0}
    for record in records:
        rollup[record.status] = rollup.get(record.status, 0) + 1
    status = "live" if rollup.get("live") else "fallback"
    if rollup.get("unavailable") and (rollup.get("live") or rollup.get("fallback")):
        status = "fallback"
    elif rollup.get("unavailable") and not (rollup.get("live") or rollup.get("fallback")):
        status = "unavailable"
    history_available = any(record.history_available for record in records)
    message = (
        "Kalıcı sağlık geçmişi kaynak bazında gösteriliyor; boş kaynaklarda history_available=false kalır."
        if history_available
        else "Kalıcı sağlık geçmişi henüz tutulmuyor; last_success_at yalnızca bu istek sırasında canlı probe başarılıysa doludur."
    )
    return SourceQualityResponse(
        status=status,
        fetched_at=now_iso(),
        history_available=history_available,
        total=len(records),
        live_checked=live_checked,
        rollup=rollup,
        sources=records,
        message=message,
    )


@router.get("/sources")
async def get_sources(
    kind: Optional[str] = Query(None),
    province: Optional[str] = Query(None),
    category: str | None = Query(default=None),
    capability: str | None = Query(default=None),
    provider: str | None = Query(default=None),
):
    if category or capability or provider:
        sources = list_sources()
        if category:
            sources = [src for src in sources if src.category.value == category]
        if capability:
            sources = [src for src in sources if capability in src.capabilities]
        if provider:
            sources = [src for src in sources if src.provider.value == provider]
        return envelope("ok", sources=[src.to_dict() for src in sources], total=len(sources))
    return _legacy_filters(list_legacy_sources(), kind, province)


@router.get("/sources/quality", response_model=SourceQualityResponse)
async def get_sources_quality(
    limit: int = Query(80, ge=1, le=120),
    live_check: bool = Query(False),
    category: str | None = Query(None),
    capability: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    registry_sources = list_sources()
    if category:
        registry_sources = [src for src in registry_sources if src.category.value == category]
    if capability:
        registry_sources = [src for src in registry_sources if capability in src.capabilities]
    registry_sources = registry_sources[:limit]
    probes: list[dict[str, Any] | BaseException | None] = [None] * len(registry_sources)
    if live_check and registry_sources:
        async with await get_client() as client:
            tasks = [asyncio.wait_for(probe_source(client, src), timeout=4.0) for src in registry_sources]
            probes = await asyncio.gather(*tasks, return_exceptions=True)
            for src, probe in zip(registry_sources, probes, strict=False):
                if isinstance(probe, dict):
                    await record_source_probe(db, src, probe)
            await db.commit()
    histories = await get_source_health_histories(db, [src.id for src in registry_sources])
    records = []
    for src, probe in zip(registry_sources, probes, strict=False):
        if isinstance(probe, BaseException):
            probe = {"status": "unavailable", "message": str(probe), "discovered_endpoints": [], "latency_ms": None, "http_status": None}
        records.append(_quality_record(src, probe if isinstance(probe, dict) else None, live_check, histories.get(src.id)))
    return _quality_response(records, live_check)


@router.get("/sources/quality/{source_id}", response_model=SourceQualityResponse)
async def get_source_quality(source_id: str, live_check: bool = Query(False), db: AsyncSession = Depends(get_db)):
    src = get_source(source_id)
    if not src:
        legacy = get_legacy_source(source_id)
        if legacy:
            return _quality_response([], live_check=False)
        raise HTTPException(status_code=404, detail="Kaynak bulunamadı")
    probe: dict[str, Any] | None = None
    if live_check:
        async with await get_client() as client:
            probe = await probe_source(client, src)
        await record_source_probe(db, src, probe)
        await db.commit()
    history = await get_source_health_history(db, source_id)
    return _quality_response([_quality_record(src, probe, live_check, history)], live_check)


@router.get("/sources/quality/{source_id}/history", response_model=SourceQualityHistoryResponse)
async def get_source_quality_history(source_id: str, limit: int = Query(14, ge=1, le=60), db: AsyncSession = Depends(get_db)):
    if not get_source(source_id) and not get_legacy_source(source_id):
        raise HTTPException(status_code=404, detail="Kaynak bulunamadı")
    return await get_source_health_history(db, source_id, limit)


@router.get("/sources/health")
async def get_sources_health(limit: int = Query(40, ge=1, le=80)):
    registry_sources = list_sources()
    async with await get_client() as client:
        tasks = [asyncio.wait_for(probe_source(client, src), timeout=4.0) for src in registry_sources[:limit]]
        probes = await asyncio.gather(*tasks, return_exceptions=True)
    rollup = {"ok": 0, "unavailable": 0, "requires_credentials": 0, "captcha_required": 0, "provider_error": 0, "public_partial": 0, "other": 0}
    items = []
    for src, probe in zip(registry_sources[:limit], probes, strict=False):
        if isinstance(probe, Exception):
            probe = {"status": "unavailable", "message": str(probe), "discovered_endpoints": [], "latency_ms": None, "http_status": None}
        status = str(probe.get("status", "other"))
        rollup[status if status in rollup else "other"] += 1
        item = {**src.to_dict(), **probe}
        items.append(item)
    if items:
        return envelope("partial" if rollup["ok"] else "empty", total=len(items), rollup=rollup, sources=items)

    legacy = _legacy_filters(list_legacy_sources(), None, None)[:limit]
    semaphore = asyncio.Semaphore(6)
    async with NetcadKeosService(timeout=4.0, max_connections=12) as service:
        async def probe_legacy(source_dict):
            source = get_legacy_source(source_dict["id"])
            if source is None:
                return None
            async with semaphore:
                result = await service._probe_endpoint(source.homepage_url)
                status = result.get("status", "timeout")
                if source.requires_credentials and status == "live":
                    status = "requires_auth"
                elif source.requires_approval and status == "live":
                    status = "requires_approval"
                return {**source.to_dict(), "source_id": source.id, "status": status, "http_status": result.get("http_status"), "checked_url": source.homepage_url}
        results = await asyncio.gather(*(probe_legacy(s) for s in legacy), return_exceptions=True)
    return [r for r in results if isinstance(r, dict)]


@router.get("/sources/{source_id}")
async def get_source_detail(source_id: str):
    src = get_source(source_id)
    if src:
        async with await get_client() as client:
            probe = await probe_source(client, src)
        return envelope("ok", source=src.to_dict(), probe=probe)
    legacy = get_legacy_source(source_id)
    if legacy:
        return legacy.to_dict()
    return envelope("invalid_input", message="Kaynak bulunamadı.")


@router.post("/sources/{source_id}/probe")
async def reprobe_source(source_id: str):
    src = get_source(source_id)
    if not src:
        return envelope("invalid_input", message="Kaynak bulunamadı.")
    async with await get_client() as client:
        probe = await probe_source(client, src)
    return envelope("ok", source=src.to_dict(), probe=probe)


@router.post("/sources/{source_id}/discover")
async def discover_source(source_id: str):
    legacy = get_legacy_source(source_id)
    if legacy is not None:
        async with NetcadKeosService(timeout=6.0, max_connections=16) as service:
            try:
                return await service.discover_source_urls(legacy, detailed=True)
            except Exception as exc:
                raise HTTPException(status_code=502, detail=f"Kaynak keşfi tamamlanamadı: {exc}") from exc
    src = get_source(source_id)
    if not src:
        raise HTTPException(status_code=404, detail="Veri kaynağı bulunamadı")
    service = NetcadKeosService()
    return await service.discover_source(src)

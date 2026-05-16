from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.probe import probe_source
from app.models.source_health_event import SourceHealthEvent
from app.schemas.source import SourceProbeEvent, SourceQualityHistoryResponse
from app.sources.registry import SourceEntry

FAILURE_STATUSES = {"unavailable", "provider_error", "requires_credentials", "captcha_required", "rate_limited", "degraded"}
SUCCESS_STATUSES = {"ok", "live", "success", "healthy"}


def normalize_probe_status(raw_status: str | None) -> str:
    if raw_status in SUCCESS_STATUSES:
        return "live"
    if raw_status in FAILURE_STATUSES:
        return raw_status or "unavailable"
    if raw_status in {"public_partial", "fallback"}:
        return "fallback"
    return "unknown"


def next_probe_at(status: str, checked_at: datetime | None = None) -> datetime:
    base = checked_at or datetime.now(UTC)
    if status == "live":
        return base + timedelta(hours=12)
    if status in {"requires_credentials", "captcha_required"}:
        return base + timedelta(days=7)
    return base + timedelta(hours=3)


def event_to_probe_event(event: SourceHealthEvent) -> SourceProbeEvent:
    message = event.error_message
    return SourceProbeEvent(
        checked_at=event.checked_at,
        timestamp=event.checked_at,
        status=event.status,
        success=event.success,
        latency_ms=event.latency_ms,
        http_status=event.http_status,
        error=event.error_code,
        message=message,
        endpoint_url=event.endpoint_url,
        next_check_at=event.next_check_at,
    )


def summarize_events(source_id: str, events: list[SourceHealthEvent]) -> SourceQualityHistoryResponse:
    if not events:
        return SourceQualityHistoryResponse(
            source_id=source_id,
            history_available=False,
            history_unavailable_reason="Kalıcı probe geçmişi henüz bu kaynak için oluşmadı.",
            suggested_action="Canlı probe çalıştır veya scheduled probe job'unun ilk kayıtlarını bekle.",
        )

    last_checked = events[0]
    last_success = next((event for event in events if event.success), None)
    last_failed = next((event for event in events if not event.success), None)
    consecutive_failures = 0
    for event in events:
        if event.success:
            break
        consecutive_failures += 1

    suggested_action = None
    if consecutive_failures >= 3:
        suggested_action = "Kaynak ardışık probe hatası veriyor; belediye servis URL'i, kimlik/captcha gereksinimi veya alternatif kaynak kontrol edilmeli."
    elif not last_success:
        suggested_action = "Henüz başarılı probe kaydı yok; canlı kaynak güveni düşük gösterilmeli."

    return SourceQualityHistoryResponse(
        source_id=source_id,
        history_available=True,
        last_checked_at=last_checked.checked_at,
        last_success_at=last_success.checked_at if last_success else None,
        last_failed_at=last_failed.checked_at if last_failed else None,
        next_scheduled_check_at=last_checked.next_check_at,
        consecutive_failures=consecutive_failures,
        recent_probe_events=[event_to_probe_event(event) for event in events[:14]],
        suggested_action=suggested_action,
    )


async def get_source_health_history(db: AsyncSession, source_id: str, limit: int = 14) -> SourceQualityHistoryResponse:
    result = await db.execute(
        select(SourceHealthEvent)
        .where(SourceHealthEvent.source_id == source_id)
        .order_by(SourceHealthEvent.checked_at.desc())
        .limit(limit)
    )
    return summarize_events(source_id, list(result.scalars().all()))


async def get_source_health_histories(db: AsyncSession, source_ids: list[str], limit_per_source: int = 14) -> dict[str, SourceQualityHistoryResponse]:
    histories: dict[str, SourceQualityHistoryResponse] = {}
    for source_id in source_ids:
        histories[source_id] = await get_source_health_history(db, source_id, limit_per_source)
    return histories


async def record_source_probe(
    db: AsyncSession,
    source: SourceEntry,
    probe: dict[str, Any],
    previous_status: str | None = None,
    checked_at: datetime | None = None,
) -> SourceHealthEvent:
    checked = checked_at or datetime.now(UTC)
    status = normalize_probe_status(str(probe.get("status")) if probe.get("status") is not None else None)
    success = status == "live"
    event = SourceHealthEvent(
        source_id=source.id,
        endpoint_url=probe.get("checked_url") or source.base_url,
        probe_type="http",
        status=status,
        raw_status=probe.get("status"),
        success=success,
        http_status=probe.get("http_status"),
        latency_ms=probe.get("latency_ms"),
        error_code=None if success else status,
        error_message=probe.get("message"),
        previous_status=previous_status,
        next_check_at=next_probe_at(status, checked),
        checked_at=checked,
        metadata_json={"discovered_endpoints": probe.get("discovered_endpoints") or []},
    )
    db.add(event)
    await db.flush()
    return event


async def run_source_probe(db: AsyncSession, client: Any, source: SourceEntry) -> SourceHealthEvent:
    latest = await get_source_health_history(db, source.id, 1)
    previous_status = latest.recent_probe_events[0].status if latest.recent_probe_events else None
    probe = await probe_source(client, source)
    return await record_source_probe(db, source, probe, previous_status=previous_status)

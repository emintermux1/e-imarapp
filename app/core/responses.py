from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def envelope(
    status: str,
    *,
    message: str | None = None,
    next_actions: list[str] | None = None,
    **data: Any,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "status": status,
        "fetched_at": now_iso(),
    }
    if message:
        payload["message"] = message
    if next_actions:
        payload["next_actions"] = next_actions
    payload.update(data)
    return payload

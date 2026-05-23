import importlib.util
import pathlib

import pytest

module_path = pathlib.Path(__file__).resolve().parents[1] / "app" / "services" / "notification_service.py"
spec = importlib.util.spec_from_file_location("notification_service", module_path)
notification_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notification_module)
NotificationService = notification_module.NotificationService


@pytest.mark.asyncio
async def test_push_requires_gateway_without_external_call():
    service = NotificationService(push_gateway_url="")
    result = await service.send_push("user-1", "Title", "Body", {"change": "x"})
    assert result == {"channel": "push", "sent": False, "reason": "PUSH_GATEWAY_URL not configured"}


@pytest.mark.asyncio
async def test_push_dry_run_uses_defined_payload_without_http_call():
    service = NotificationService(push_gateway_url="https://push.example.test", dry_run=True)
    result = await service.notify_watchlist_change(
        {"id": "watch-1", "user_id": 42, "parcel_id": "parcel-1", "notification_channels": ["push"]},
        "aski_plan",
        {"plan_id": "plan-1"},
    )

    assert result[0]["dry_run"] is True
    gateway_payload = result[0]["payload"]
    assert gateway_payload["token"] == "42"
    assert gateway_payload["platform"] == "unknown"
    payload = gateway_payload["payload"]
    assert payload["event"] == "watchlist_change"
    assert payload["user_id"] == "42"
    assert payload["parcel_id"] == "parcel-1"
    assert payload["change_type"] == "aski_plan"

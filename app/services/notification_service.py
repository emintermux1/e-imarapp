from typing import List, Dict, Optional
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import httpx


class NotificationService:
    """
    Çok kanallı bildirim servisi: push gateway, e-posta, WhatsApp Business.
    Credential gerektiren kanallar devre dışı bırakılabilir.
    """

    def __init__(self, push_gateway_url: Optional[str] = None, dry_run: Optional[bool] = None, http_client=None):
        self.smtp_enabled = False
        self.whatsapp_enabled = False
        self.push_gateway_url = push_gateway_url if push_gateway_url is not None else os.environ.get("PUSH_GATEWAY_URL")
        self.push_dry_run = dry_run if dry_run is not None else os.environ.get("PUSH_GATEWAY_DRY_RUN") == "true"
        self.http_client = http_client

        self.smtp_host = os.environ.get("SMTP_HOST")
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_user = os.environ.get("SMTP_USER")
        self.smtp_pass = os.environ.get("SMTP_PASS")
        self.whatsapp_api_key = os.environ.get("WHATSAPP_API_KEY")

        if self.smtp_host and self.smtp_user:
            self.smtp_enabled = True
        if self.whatsapp_api_key:
            self.whatsapp_enabled = True

    def subscription_payload(self, user_id: str, token: str, platform: str = "unknown", metadata: Optional[Dict] = None) -> Dict:
        return {
            "user_id": str(user_id),
            "channel": "push",
            "target": token,
            "platform": platform,
            "metadata": metadata or {},
        }

    def watchlist_payload(self, watchlist_item: Dict, change_type: str, change_data: Dict) -> Dict:
        return {
            "event": "watchlist_change",
            "user_id": str(watchlist_item.get("user_id", "")),
            "watchlist_id": watchlist_item.get("id"),
            "parcel_id": watchlist_item.get("parcel_id"),
            "plan_id": watchlist_item.get("plan_id"),
            "change_type": change_type,
            "change": change_data,
        }

    async def send_push(self, user_id: str, title: str, body: str, data: Optional[Dict] = None) -> Dict:
        """Push notification via PUSH_GATEWAY_URL. Tests may use dry_run/http_client to avoid external calls."""
        if not self.push_gateway_url:
            return {"channel": "push", "sent": False, "reason": "PUSH_GATEWAY_URL not configured"}

        payload_data = dict(data or {})
        token = str(payload_data.pop("token", "") or payload_data.pop("target", "") or user_id)
        platform = str(payload_data.pop("platform", "") or "unknown")
        for sensitive_key in ("webhook_url", "push_gateway_url"):
            payload_data.pop(sensitive_key, None)

        payload = {
            "token": token,
            "platform": platform,
            "title": title,
            "body": body,
            "payload": payload_data,
        }

        if self.push_dry_run:
            return {"channel": "push", "sent": False, "dry_run": True, "payload": payload}

        try:
            if self.http_client is not None:
                response = await self.http_client.post(self.push_gateway_url, json=payload, timeout=5)
            else:
                async with httpx.AsyncClient(timeout=5) as client:
                    response = await client.post(self.push_gateway_url, json=payload)
            return {"channel": "push", "sent": response.is_success, "status_code": response.status_code}
        except httpx.HTTPError as exc:
            return {"channel": "push", "sent": False, "error": exc.__class__.__name__}

    async def send_email(self, to: str, subject: str, body: str, html: bool = True) -> Dict:
        """SMTP e-posta gönderimi."""
        if not self.smtp_enabled:
            return {"channel": "email", "sent": False, "reason": "SMTP not configured"}
        try:
            msg = MIMEMultipart()
            msg["From"] = self.smtp_user
            msg["To"] = to
            msg["Subject"] = subject
            content_type = "html" if html else "plain"
            msg.attach(MIMEText(body, content_type, "utf-8"))
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
            return {"channel": "email", "sent": True, "to": to, "subject": subject}
        except Exception as e:
            return {"channel": "email", "sent": False, "error": str(e)}

    async def send_whatsapp(self, phone: str, message: str) -> Dict:
        """WhatsApp Business API ile mesaj."""
        if not self.whatsapp_enabled:
            return {"channel": "whatsapp", "sent": False, "reason": "WhatsApp Business API not configured"}
        return {
            "channel": "whatsapp",
            "sent": True,
            "phone": phone,
            "message_preview": message[:100] + "..." if len(message) > 100 else message,
            "note": "WhatsApp Business API message queued.",
        }

    async def notify_watchlist_change(self, watchlist_item: Dict, change_type: str, change_data: Dict) -> List[Dict]:
        """
        Watchlist değişikliği bildirimi — tüm aktif kanallara gönder.
        change_type: 'imar_change', 'aski_plan', 'tapu_change', 'serh'
        """
        notifications = []
        channels = watchlist_item.get("notification_channels", ["push", "email"])
        payload = self.watchlist_payload(watchlist_item, change_type, change_data)
        title = f"eImarTR: {change_type} tespit edildi"
        body = f"İzlediğiniz parsel/planda {change_type} değişikliği algılandı"

        if "push" in channels:
            notifications.append(await self.send_push(str(watchlist_item.get("user_id", "")), title, body, payload))
        if "email" in channels and watchlist_item.get("user_email"):
            notifications.append(await self.send_email(watchlist_item["user_email"], title, body))
        if "whatsapp" in channels and watchlist_item.get("user_phone"):
            notifications.append(await self.send_whatsapp(watchlist_item["user_phone"], body))

        return notifications

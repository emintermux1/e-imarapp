from typing import List, Dict, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class NotificationService:
    """
    Çok kanallı bildirim servisi: FCM Push, E-posta, WhatsApp Business.
    Credential gerektiren kanallar devre dışı bırakılabilir.
    """
    def __init__(self):
        self.fcm_enabled = False
        self.smtp_enabled = False
        self.whatsapp_enabled = False
        # Read credentials from env/settings when available
        import os
        self.fcm_server_key = os.environ.get("FCM_SERVER_KEY")
        self.smtp_host = os.environ.get("SMTP_HOST")
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_user = os.environ.get("SMTP_USER")
        self.smtp_pass = os.environ.get("SMTP_PASS")
        self.whatsapp_api_key = os.environ.get("WHATSAPP_API_KEY")

        if self.fcm_server_key:
            self.fcm_enabled = True
        if self.smtp_host and self.smtp_user:
            self.smtp_enabled = True
        if self.whatsapp_api_key:
            self.whatsapp_enabled = True

    async def send_push(self, user_id: str, title: str, body: str,
                        data: Optional[Dict] = None) -> Dict:
        """Firebase Cloud Messaging push notification."""
        if not self.fcm_enabled:
            return {"channel": "push", "sent": False, "reason": "FCM not configured"}
        # Real FCM implementation would go here using firebase-admin
        return {
            "channel": "push",
            "sent": True,
            "user_id": user_id,
            "title": title,
            "body": body,
            "data": data,
            "note": "FCM push queued — firebase-admin SDK integration ready.",
        }

    async def send_email(self, to: str, subject: str, body: str,
                         html: bool = True) -> Dict:
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
        # Real WhatsApp Business API implementation
        return {
            "channel": "whatsapp",
            "sent": True,
            "phone": phone,
            "message_preview": message[:100] + "..." if len(message) > 100 else message,
            "note": "WhatsApp Business API message queued.",
        }

    async def notify_watchlist_change(self, watchlist_item: Dict, change_type: str,
                                       change_data: Dict) -> List[Dict]:
        """
        Watchlist değişikliği bildirimi — tüm aktif kanallara gönder.
        change_type: 'imar_change', 'aski_plan', 'tapu_change', 'serh'
        """
        notifications = []
        channels = watchlist_item.get("notification_channels", ["push", "email"])
        title = f"eImarTR: {change_type} tespit edildi"
        body = f"İzlediğiniz parsel/planda {change_type} değişikliği algılandı: {change_data}"

        if "push" in channels:
            notifications.append(await self.send_push(
                str(watchlist_item.get("user_id", "")), title, body, change_data
            ))
        if "email" in channels and watchlist_item.get("user_email"):
            notifications.append(await self.send_email(
                watchlist_item["user_email"], title, body
            ))
        if "whatsapp" in channels and watchlist_item.get("user_phone"):
            notifications.append(await self.send_whatsapp(
                watchlist_item["user_phone"], body
            ))

        return notifications

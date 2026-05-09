from __future__ import annotations

import re
import time
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.sources.registry import SourceAuth, SourceEntry


LOGIN_HINTS = [
    "captcha",
    "giriş yap",
    "login",
    "oturum",
    "şifre",
    "password",
    "kullanıcı adı",
]


def classify_html_auth(html: str, source: SourceEntry) -> str:
    lower = html.lower()
    if source.auth in {SourceAuth.requires_credentials, SourceAuth.captcha_required}:
        return source.auth.value
    if any(hint in lower for hint in LOGIN_HINTS):
        if "captcha" in lower:
            return SourceAuth.captcha_required.value
        return SourceAuth.requires_credentials.value
    if "<input" in lower and "password" in lower:
        return SourceAuth.requires_credentials.value
    return "ok"


async def probe_source(client: httpx.AsyncClient, src: SourceEntry) -> dict[str, Any]:
    started = time.perf_counter()
    try:
        response = await client.get(src.base_url)
        latency_ms = int((time.perf_counter() - started) * 1000)
        content_type = response.headers.get("content-type", "")
        body = response.text if "text" in content_type or "html" in content_type else ""
        status = "ok"
        message = None
        discovered_endpoints: list[str] = []
        if response.status_code in {401, 403}:
            status = SourceAuth.requires_credentials.value
            message = "Kaynak erişimi kimlik doğrulama istiyor."
        elif response.status_code >= 500:
            status = "unavailable"
            message = f"Kaynak {response.status_code} döndürdü."
        elif body:
            status = classify_html_auth(body, src)
            soup = BeautifulSoup(body, "lxml")
            for script in soup.find_all("script", src=True):
                discovered_endpoints.append(httpx.URL(src.base_url).join(script["src"]).__str__())
            matches = re.findall(r"(?:https?://[^\s\"'<>]+|[\w/.-]+\.(?:ashx|asmx)(?:\?[^\s\"'<>]+)?)", body, re.I)
            for match in matches:
                if match.startswith("http"):
                    discovered_endpoints.append(match)
                else:
                    discovered_endpoints.append(httpx.URL(src.base_url).join(match).__str__())
            discovered_endpoints = sorted(set(discovered_endpoints))[:50]
        return {
            "status": status,
            "http_status": response.status_code,
            "latency_ms": latency_ms,
            "discovered_endpoints": discovered_endpoints,
            "message": message,
        }
    except httpx.ReadTimeout:
        return {
            "status": "unavailable",
            "http_status": None,
            "latency_ms": None,
            "discovered_endpoints": [],
            "message": "Kaynak zaman aşımına uğradı.",
        }
    except httpx.ConnectError:
        return {
            "status": "unavailable",
            "http_status": None,
            "latency_ms": None,
            "discovered_endpoints": [],
            "message": "Kaynağa bağlantı kurulamadı.",
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "status": "provider_error",
            "http_status": None,
            "latency_ms": None,
            "discovered_endpoints": [],
            "message": str(exc),
        }

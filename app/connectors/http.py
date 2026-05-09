from __future__ import annotations

import httpx

DEFAULT_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
DEFAULT_TIMEOUT = httpx.Timeout(15.0, connect=8.0)


async def get_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=DEFAULT_TIMEOUT,
        headers={
            "User-Agent": DEFAULT_UA,
            "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
        },
        follow_redirects=True,
        verify=True,
        http2=False,
    )

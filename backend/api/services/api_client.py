"""
External API client template.
Usage:
    from api.services.api_client import ExternalAPIClient
    client = ExternalAPIClient()
    data = await client.get("/endpoint")
"""
import logging
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger(__name__)


class ExternalAPIClient:
    """Async HTTP client with timeout, retries, and fallback data."""

    def __init__(self, base_url: str = "", api_key: str = "", timeout: int = 10):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self._cache: Dict[str, Any] = {}

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def get(self, path: str, params: Optional[Dict] = None,
                 fallback: Any = None) -> Any:
        """GET request with fallback on failure."""
        url = f"{self.base_url}{path}"
        cache_key = f"{url}:{params}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, params=params, headers=self._headers())
                resp.raise_for_status()
                data = resp.json()
                self._cache[cache_key] = data
                return data
        except httpx.HTTPStatusError as e:
            logger.warning("API %s returned %s", url, e.response.status_code)
            return fallback
        except Exception as e:
            logger.warning("API %s failed: %s", url, e)
            return fallback

    async def post(self, path: str, data: Dict,
                  fallback: Any = None) -> Any:
        """POST request with fallback on failure."""
        url = f"{self.base_url}{path}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=data, headers=self._headers())
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("API POST %s failed: %s", url, e)
            return fallback

    def clear_cache(self) -> None:
        self._cache.clear()

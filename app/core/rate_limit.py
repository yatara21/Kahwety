"""Small, process-local rate limiting for sensitive unauthenticated endpoints.

The limiter deliberately exposes only a ``check`` method so deployments with
multiple API workers can replace it with a Redis-backed implementation later
without changing the route handlers.
"""

import asyncio
import math
import time
from collections import defaultdict, deque

from fastapi import Request

from app.core.config import settings
from app.core.exceptions import RateLimitException


class SlidingWindowRateLimiter:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds
        self._attempts: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(self, key: str) -> None:
        now = time.monotonic()
        cutoff = now - self.window_seconds

        async with self._lock:
            attempts = self._attempts[key]
            while attempts and attempts[0] <= cutoff:
                attempts.popleft()

            if len(attempts) >= self.limit:
                retry_after = math.ceil(self.window_seconds - (now - attempts[0]))
                raise RateLimitException(max(retry_after, 1))

            attempts.append(now)


def _client_key(request: Request) -> str:
    # Do not trust forwarded headers here; configure proxy handling separately
    # when the deployment has a trusted reverse proxy.
    return request.client.host if request.client else "unknown"


login_limiter = SlidingWindowRateLimiter(
    settings.auth_login_rate_limit,
    settings.auth_rate_limit_window_seconds,
)
otp_limiter = SlidingWindowRateLimiter(
    settings.auth_otp_rate_limit,
    settings.auth_rate_limit_window_seconds,
)


async def enforce_login_rate_limit(request: Request) -> None:
    await login_limiter.check(_client_key(request))


async def enforce_otp_rate_limit(request: Request) -> None:
    await otp_limiter.check(_client_key(request))

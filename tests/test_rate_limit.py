import pytest

from app.core.exceptions import RateLimitException
from app.core.rate_limit import SlidingWindowRateLimiter


@pytest.mark.asyncio
async def test_sliding_window_limiter_rejects_excess_requests():
    limiter = SlidingWindowRateLimiter(limit=2, window_seconds=60)

    await limiter.check("127.0.0.1")
    await limiter.check("127.0.0.1")

    with pytest.raises(RateLimitException) as exc_info:
        await limiter.check("127.0.0.1")

    assert exc_info.value.status_code == 429
    assert exc_info.value.details[0]["retry_after_seconds"] > 0

import os
import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, status


RATE_LIMIT_REQUESTS = int(
    os.getenv("AI_RATE_LIMIT_REQUESTS", "30")
)

RATE_LIMIT_WINDOW_SECONDS = int(
    os.getenv("AI_RATE_LIMIT_WINDOW_SECONDS", "3600")
)

RATE_LIMIT_EXEMPT_USER_ID = os.getenv(
    "RATE_LIMIT_EXEMPT_USER_ID"
)

_requests: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def check_ai_rate_limit(user_id: str) -> None:
    """
    Enforce a fixed-window rate limit for authenticated users.

    The configured owner/admin user is exempt.
    """

    if (
        RATE_LIMIT_EXEMPT_USER_ID
        and user_id == RATE_LIMIT_EXEMPT_USER_ID
    ):
        return

    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS

    with _lock:
        timestamps = _requests[user_id]

        timestamps[:] = [
            timestamp
            for timestamp in timestamps
            if timestamp > window_start
        ]

        if len(timestamps) >= RATE_LIMIT_REQUESTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "AI request limit exceeded. "
                    "Please try again later."
                ),
            )

        timestamps.append(now)
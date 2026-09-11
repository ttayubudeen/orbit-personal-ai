import time
from dataclasses import dataclass


@dataclass
class ModelHealth:
    unavailable_until: float = 0
    failures: int = 0


# ============================================================
# COOLDOWN CONFIGURATION
# ============================================================

BASE_COOLDOWN_SECONDS = 60 * 30

MAX_COOLDOWN_SECONDS = 60 * 60 * 6  # 6 hours


_model_health: dict[str, ModelHealth] = {}


# ============================================================
# INTERNAL
# ============================================================

def _get_health(model_key: str) -> ModelHealth:

    if model_key not in _model_health:
        _model_health[model_key] = ModelHealth()

    return _model_health[model_key]


# ============================================================
# AVAILABILITY
# ============================================================

def is_model_available(model_key: str) -> bool:

    health = _get_health(model_key)

    return (
        time.time()
        >= health.unavailable_until
    )


# ============================================================
# MARK UNAVAILABLE
# ============================================================

def mark_model_unavailable(
    model_key: str,
):
    """
    Progressive cooldown:

        failure 1 -> 30 minutes
        failure 2 -> 1 hour
        failure 3 -> 2 hours
        failure 4 -> 4 hours
        failure 5 -> 6 hours
        ...
        maximum -> 6 hours
    """

    health = _get_health(model_key)

    health.failures += 1

    cooldown_seconds = (
        BASE_COOLDOWN_SECONDS
        * (
            2
            ** (health.failures - 1)
        )
    )

    cooldown_seconds = min(
        cooldown_seconds,
        MAX_COOLDOWN_SECONDS,
    )

    health.unavailable_until = (
        time.time()
        + cooldown_seconds
    )


# ============================================================
# MARK HEALTHY
# ============================================================

def mark_model_healthy(
    model_key: str,
):
    """
    A successful request completely restores the model.

    Its failure count is reset.

    Therefore:

        failed 3 times
        -> 4 minute cooldown

    but then succeeds

        -> failure count becomes 0
        -> original priority restored
    """

    _model_health[model_key] = ModelHealth()


# ============================================================
# STATUS
# ============================================================

def get_model_status(
    model_key: str,
):
    health = _get_health(model_key)

    remaining = max(
        0,
        int(
            health.unavailable_until
            - time.time()
        ),
    )

    return {
        "available": remaining == 0,
        "failures": health.failures,
        "cooldown_remaining_seconds": remaining,
    }


# ============================================================
# ERROR CLASSIFICATION
# ============================================================

def should_cooldown(
    error: Exception,
) -> bool:

    error_text = str(error).lower()

    temporary_errors = [
        "503",
        "unavailable",
        "high demand",
        "429",
        "resource exhausted",
        "rate limit",
        "rate_limit",
        "too many requests",
        "timeout",
        "timed out",
        "deadline exceeded",
        "connection reset",
        "connection error",
        "overloaded",
        "temporarily unavailable",
    ]

    return any(
        keyword in error_text
        for keyword in temporary_errors
    )

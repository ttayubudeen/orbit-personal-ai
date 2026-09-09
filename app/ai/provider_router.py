import logging

from app.ai.provider_health import (
    is_model_available,
    mark_model_unavailable,
    mark_model_healthy,
    get_model_status,
    should_cooldown,
)

logger = logging.getLogger(__name__)


class ProviderExhaustedError(Exception):
    """
    Raised when every configured model/provider has failed
    or is currently unavailable.
    """

    pass


def is_retryable_provider_error(error: Exception) -> bool:
    """
    Returns True when the error means:

        "This model/provider is temporarily unable to serve
        the request. Try another model."

    Programming errors are NOT considered retryable.
    """

    error_text = str(error).lower()

    retryable_messages = [
        "429",
        "rate limit",
        "rate_limit",
        "quota",
        "resource exhausted",
        "too many requests",
        "503",
        "service unavailable",
        "temporarily unavailable",
        "overloaded",
        "high demand",
        "timeout",
        "timed out",
        "deadline exceeded",
        "connection reset",
        "connection error",
    ]

    return any(
        message in error_text
        for message in retryable_messages
    )


def run_with_fallbacks(
    providers,
    generate_function,
):
    """
    Try providers/models in priority order.

    Models currently in cooldown are skipped.

    Temporary provider failures trigger progressive cooldown.

    Successful models are immediately marked healthy again.

    Non-retryable programming errors are raised immediately
    instead of being silently hidden.
    """

    for provider, model in providers:

        model_key = f"{provider}:{model}"

        # =====================================================
        # COOLDOWN CHECK
        # =====================================================

        if not is_model_available(model_key):

            status = get_model_status(model_key)

            remaining = status[
                "cooldown_remaining_seconds"
            ]

            logger.info(
                "Skipping %s. Cooldown remaining: %s seconds.",
                model_key,
                remaining,
            )

            print(
                f"Skipping {provider} / {model} "
                f"(cooldown: {remaining}s)"
            )

            continue

        # =====================================================
        # TRY MODEL
        # =====================================================

        print(
            f"Trying provider/model: "
            f"{provider} / {model}"
        )

        try:

            result = generate_function(
                provider=provider,
                model=model,
            )

            # =================================================
            # SUCCESS
            # =================================================

            mark_model_healthy(model_key)

            print(
                f"Success: {provider} / {model}"
            )

            return result

        except Exception as exc:

            print(
                f"Failed: {provider} / {model}"
            )

            print(
                f"Error: {exc}"
            )

            # =================================================
            # RETRYABLE ERROR
            # =================================================

            if (
                is_retryable_provider_error(exc)
                or should_cooldown(exc)
            ):

                mark_model_unavailable(
                    model_key
                )

                status = get_model_status(
                    model_key
                )

                print(
                    f"Cooldown applied to "
                    f"{provider} / {model}"
                )

                print(
                    f"Failures: "
                    f"{status['failures']}"
                )

                print(
                    f"Cooldown: "
                    f"{status['cooldown_remaining_seconds']}s"
                )

                continue

            # =================================================
            # PROGRAMMING / LOGIC ERROR
            # =================================================

            print(
                f"Non-retryable error from "
                f"{provider} / {model}."
            )

            logger.exception(
                "Non-retryable provider error"
            )

            raise

    # =========================================================
    # EVERYTHING FAILED / EVERYTHING IN COOLDOWN
    # =========================================================

    raise ProviderExhaustedError(
        "All configured AI models are currently "
        "unavailable or in cooldown."
    )

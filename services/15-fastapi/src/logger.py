"""Structured JSON logger for 15-fastapi.

Uses structlog to emit one JSON object per log call.
Fields emitted on every line:
  - timestamp (ISO 8601)
  - level
  - event (the message string)
  - any kwargs passed to the log call

Usage:
    from src.logger import logger
    logger.info("request received", method="GET", path="/health")
"""

import logging

import structlog

SENSITIVE_KEYS = {"authorization", "x-api-key", "password", "token", "api_key", "apikey"}


def redact_sensitive(logger, method, event_dict):
    for key in list(event_dict.keys()):
        if key.lower() in SENSITIVE_KEYS:
            event_dict[key] = "[REDACTED]"
    return event_dict


structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        redact_sensitive,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()

# ─────────────────────────────────────────────────────────────────────────
# Framework: 15 Python — Django 5.2
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Python 3.12 + venv)
# Runtime:   python:3.12-slim
# FIPS:      registry.access.redhat.com/ubi9/python-39
# Port:      8080
# Django: REPLACE myproject with your Django project name
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3.12 python3-pip python3-venv \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN python3 -m venv /venv \
 && /venv/bin/pip install --no-cache-dir --upgrade pip \
 && /venv/bin/pip install --no-cache-dir -r requirements.txt

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM python:3.12-slim AS runtime
WORKDIR /app
RUN useradd -u 1001 -r app
COPY --from=build --chown=1001:0 /venv /venv
COPY --chown=1001:0 . .
ENV PATH="/venv/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
USER 1001
EXPOSE 8080
CMD ["gunicorn", "myproject.wsgi:application", "--bind", "0.0.0.0:8080"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/python-39 AS runtime-fips
WORKDIR /app
USER 1001
COPY --from=build --chown=1001:0 /venv /venv
COPY --chown=1001:0 . .
ENV PATH="/venv/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
USER 1001
EXPOSE 8080
CMD ["/venv/bin/gunicorn", "myproject.wsgi:application", "--bind", "0.0.0.0:8080"]

# syntax=docker/dockerfile:1

# NOTE: This Dockerfile uses the repository root as the build context.
# Build with:
#   docker build -f backend/Dockerfile .
#
# Do NOT run:
#   docker build .
# from inside the backend/ directory.

# ============================================================
# Build Stage
# ============================================================

FROM python:3.12-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install build dependencies required for Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create isolated virtual environment
RUN python -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

# Install production dependencies
COPY backend/requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# ============================================================
# Runtime Stage
# ============================================================

FROM python:3.12-slim AS runtime

WORKDIR /app

# Runtime system dependencies
# curl    -> container healthcheck
# libpq5  -> PostgreSQL runtime support
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

# ============================================================
# Application and ML Assets
# ============================================================

# ML models
COPY models /models

# Datasets used by analytics
COPY data /data

# ML-related source code / metadata
COPY ml /ml

# FastAPI application
COPY backend/app ./app


# ============================================================
# Runtime User
# ============================================================

# Create non-root user for security
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -m appuser && \
    chown -R appuser:appgroup /app /models /data /ml

USER appuser


# ============================================================
# Production Environment Variables
# ============================================================

ENV MODEL_DIR=/models/diabetes \
    DATA_DIR=/data/diabetes \
    HEART_MODEL_DIR=/models/heart/v1.0.0 \
    PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1


# ============================================================
# Application Port
# ============================================================

EXPOSE 8000


# ============================================================
# Container Healthcheck
# ============================================================

HEALTHCHECK \
    --interval=15s \
    --timeout=5s \
    --start-period=30s \
    --retries=5 \
    CMD curl -fsS http://localhost:8000/health || exit 1


# ============================================================
# Application Startup
# ============================================================

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
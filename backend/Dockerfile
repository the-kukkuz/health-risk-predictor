# syntax=docker/dockerfile:1
# NOTE: This Dockerfile uses the repo root as its build context.
# Build via: docker compose build  (or)  docker build -f backend/Dockerfile .
# Do NOT run: docker build . from inside the backend/ directory.

# --- Build Stage ---
FROM python:3.12-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install production dependencies
COPY backend/requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- Runtime Stage ---
FROM python:3.12-slim AS runtime

WORKDIR /app

# Install runtime system packages (curl for healthcheck, libpq5 for db driver)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy ML models, training scripts/metadata, and datasets into the image
# This makes the image self-contained for production environments (e.g. Azure Container Apps)
COPY models /models
COPY data /data
COPY ml /ml

# Copy application source code
COPY backend/app ./app

# Create a non-privileged user and group for runtime execution
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -m appuser && \
    chown -R appuser:appgroup /app /models /data /ml

USER appuser

# Production environment variables
ENV MODEL_DIR=/models/diabetes \
    DATA_DIR=/data/diabetes \
    PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -fsS http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

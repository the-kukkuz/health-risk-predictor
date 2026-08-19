"""FastAPI application entry point.

At startup we:
  * register the disease services (diabetes live, heart placeholder)
  * load the diabetes model + SHAP explainer ONCE
  * create database tables (idempotent)
  * configure CORS from environment

No model training or tuning ever happens during a request.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    health as health_route,
    models as models_route,
    predict as predict_route,
    predictions as predictions_route,
    statistics as statistics_route,
    auth as auth_route,
    users as users_route,
)
from app.core.config import get_settings
from app.db.session import Base, engine
from app.services.registry import register_all_services

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("health-risk")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    logger.info("Starting %s (%s)", settings.app_name, settings.environment)
    register_all_services()

    # Eagerly load the diabetes model bundle so the first request is fast and
    # so readiness is deterministic.
    from app.ml.diabetes.loader import get_bundle as get_diabetes_bundle

    diabetes_bundle = get_diabetes_bundle()
    if diabetes_bundle.loaded:
        logger.info("Diabetes model loaded successfully at startup.")
    else:
        logger.warning("Diabetes model NOT loaded: %s", diabetes_bundle.error)

    # Eagerly load the heart model bundle
    from app.ml.heart.loader import get_bundle as get_heart_bundle

    heart_bundle = get_heart_bundle()
    if heart_bundle.loaded:
        logger.info("Heart model loaded successfully at startup.")
    else:
        logger.warning("Heart model NOT loaded: %s", heart_bundle.error)

    # Create tables if they do not exist. (Alembic would replace this for
    # production schema migrations; create_all is sufficient for the MVP.)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created.")
    except Exception as exc:
        logger.warning("Database not available at startup: %s", exc)

    yield
    # --- shutdown ---
    logger.info("Shutting down.")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "Healthcare Disease Risk Prediction & Decision-Support API. "
        "Diabetes is live; heart disease is a placeholder for independent "
        "integration. Decision-support/research only -- not a medical device."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_route.router)
app.include_router(models_route.router)
app.include_router(predict_route.router)
app.include_router(statistics_route.router)
app.include_router(predictions_route.router)
app.include_router(auth_route.router)
app.include_router(users_route.router)


@app.get("/", tags=["root"])
def root() -> dict:
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
        "disclaimer": (
            "This system provides machine-learning-based risk stratification "
            "for research and decision-support purposes. It is not a medical "
            "diagnostic tool and should not be used as a substitute for "
            "professional medical evaluation."
        ),
    }

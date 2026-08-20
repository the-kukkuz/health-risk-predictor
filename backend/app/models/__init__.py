"""ORM models. Importing this package registers all tables with Base.metadata."""
from app.models.prediction import PredictionRecord
from app.models.user import User

__all__ = ["PredictionRecord", "User"]
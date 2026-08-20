"""User profile endpoints backed by Supabase Auth."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.user import UserProfileResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user=Depends(get_current_user)):
    """
    Fetch details for the currently authenticated user from Supabase.
    """
    user_metadata = current_user.user_metadata or {}

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=user_metadata.get("first_name"),
        last_name=user_metadata.get("last_name"),
        role=user_metadata.get("role", "patient"),
        created_at=str(current_user.created_at),
    )
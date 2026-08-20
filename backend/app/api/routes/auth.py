"""Supabase-backed authentication routes.

Signup and login are handled by Supabase Auth. The frontend-backend connection
uses the Supabase-issued JWT tokens for subsequent authenticated requests.
"""
from __future__ import annotations

import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY"),
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SignUpSchema(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str | None = ""
    role: str | None = "user"


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
def signup(payload: SignUpSchema):
    try:
        response = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {
                    "first_name": payload.first_name,
                    "last_name": payload.last_name,
                    "role": payload.role,
                }
            },
        })
        return {"message": "User registered successfully", "data": response}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(payload: LoginSchema):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password,
        })
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": response.user,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid login credentials")
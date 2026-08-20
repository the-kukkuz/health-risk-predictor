"""RAG chat endpoint.

POST /api/v1/chat

Accepts a user message (and optional context) and returns an answer grounded
in the clinical knowledge base via the RAGService (Gemini embeddings + Qdrant
retrieval + Gemini generation).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.rag_service import RAGService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

# Single shared RAG service instance (created lazily on first request).
_rag: RAGService | None = None


def _get_rag() -> RAGService:
    global _rag
    if _rag is None:
        _rag = RAGService()
    return _rag


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's question")
    context: str | None = Field(
        default=None,
        description="Optional context, e.g. the disease being assessed",
    )


class ChatResponse(BaseModel):
    message: str
    disclaimer: str = (
        "This is a machine-learning decision-support tool. "
        "This response is not medical advice. Please discuss any concerns "
        "with a qualified healthcare professional."
    )


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    try:
        answer = _get_rag().chat(payload.message, payload.context)
    except Exception as exc:
        logger.error("RAG chat failed: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="The AI assistant is temporarily unavailable. Please try again later.",
        )
    return ChatResponse(message=answer)

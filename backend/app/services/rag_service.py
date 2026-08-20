from __future__ import annotations

import logging
import os
import time
from typing import Any, Callable, Dict, List, Optional

from dotenv import load_dotenv
from google import genai
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

load_dotenv()

logger = logging.getLogger(__name__)


class RAGService:

    def __init__(self):

        # =====================================================
        # Configuration
        # =====================================================

        self.collection_name = "diabetes_knowledge"

        # =====================================================
        # Gemini client
        # =====================================================

        self.gemini = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY")
        )

        # =====================================================
        # Qdrant Cloud client
        # =====================================================

        self.qdrant = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY"),
            timeout=120,
        )

    # =========================================================
    # GEMINI RETRY HELPER
    # =========================================================

    def _call_gemini_with_retry(
        self,
        func: Callable[[], Any],
        max_attempts: int = 3,
    ) -> Any:

        last_error = None

        for attempt in range(max_attempts):

            try:
                return func()

            except Exception as exc:

                last_error = exc

                logger.warning(
                    "Gemini API call attempt %s failed: %s",
                    attempt + 1,
                    exc,
                )

                if attempt < max_attempts - 1:

                    wait_time = 2 * (attempt + 1)

                    logger.warning(
                        "Retrying in %s seconds...",
                        wait_time,
                    )

                    time.sleep(wait_time)

        raise last_error

    # =========================================================
    # NORMALIZE DISEASE
    # =========================================================

    def normalize_disease(self, disease: str) -> str:
        """
        Convert the disease returned by the prediction backend or frontend input
        into the exact disease value stored in Qdrant.
        """
        if not disease:
            raise ValueError(
                "Prediction result or context does not contain a disease."
            )

        raw_disease = str(disease).lower().strip()

        # Exact match alias dictionary
        disease_aliases = {
            # Diabetes
            "diabetes": "diabetes",
            "diabetic": "diabetes",
            "diabetes mellitus": "diabetes",
            "diabetes mellitus type 2": "diabetes",
            "type 2 diabetes": "diabetes",

            # Heart
            "heart": "heart",
            "heart disease": "heart",
            "cardiovascular": "heart",
            "cardiovascular disease": "heart",
            "cardiovascular diseases": "heart",
            "cardiac": "heart",
        }

        # 1. Try exact dictionary match
        normalized = disease_aliases.get(raw_disease)
        if normalized:
            return normalized

        # 2. Substring fallback matching for descriptive inputs
        if "diabet" in raw_disease:
            return "diabetes"
        if any(term in raw_disease for term in ["heart", "cardio", "cardiac"]):
            return "heart"

        # 3. If still unmatched, raise ValueError
        raise ValueError(
            f"Unsupported disease returned by prediction backend or request: "
            f"{disease}"
        )
    # =========================================================
    # RETRIEVE DISEASE-SPECIFIC KNOWLEDGE
    # =========================================================

    def retrieve(
        self,
        query: str,
        disease: str,
        limit: int = 5,
    ) -> List[Dict]:
        """
        Embed the query and retrieve relevant chunks ONLY
        from the selected disease.

        Both diabetes.pdf and heart.pdf are stored in the
        same Qdrant collection.

        The disease payload filter prevents cross-disease
        retrieval.
        """

        # -----------------------------------------------------
        # 1. Normalize disease
        # -----------------------------------------------------

        disease = self.normalize_disease(disease)

        logger.info(
            "Retrieving knowledge for disease=%s",
            disease,
        )

        # -----------------------------------------------------
        # 2. Create query embedding
        # -----------------------------------------------------

        result = self.gemini.models.embed_content(
            model="gemini-embedding-2",
            contents=query,
        )

        query_vector = result.embeddings[0].values

        # -----------------------------------------------------
        # 3. Disease filter
        # -----------------------------------------------------

        disease_filter = Filter(
            must=[
                FieldCondition(
                    key="disease",
                    match=MatchValue(
                        value=disease
                    ),
                )
            ]
        )

        # -----------------------------------------------------
        # 4. Search Qdrant
        # -----------------------------------------------------

        results = self.qdrant.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=disease_filter,
            limit=limit,
        )

        # -----------------------------------------------------
        # 5. Extract chunks
        # -----------------------------------------------------

        chunks = []

        for point in results.points:

            payload = point.payload or {}

            chunks.append(
                {
                    "text": payload.get(
                        "text",
                        ""
                    ),
                    "page": payload.get(
                        "page"
                    ),
                    "source": payload.get(
                        "source"
                    ),
                    "disease": payload.get(
                        "disease"
                    ),
                    "score": point.score,
                }
            )

        logger.info(
            "Retrieved %s chunks for disease=%s",
            len(chunks),
            disease,
        )

        return chunks

    # =========================================================
    # FORMAT REFERENCES
    # =========================================================

    def _format_reference(
        self,
        chunks: List[Dict],
    ) -> str:
        """
        Format retrieved chunks into a context string
        for Gemini.
        """

        context_parts = []

        for chunk in chunks:

            page_str = ""

            if chunk.get("page") is not None:
                page_str = (
                    f"[Page {chunk['page']}]\n"
                )

            source_str = ""

            if chunk.get("source"):
                source_str = (
                    f"[Source: {chunk['source']}]\n"
                )

            context_parts.append(
                f"{source_str}"
                f"{page_str}"
                f"{chunk.get('text', '')}"
            )

        return "\n\n".join(
            context_parts
        )

    # =========================================================
    # GENERAL CHAT
    # =========================================================

    def chat(
        self,
        message: str,
        disease: Optional[str] = None,
        context: Optional[str] = None,
    ) -> str:
        """
        Answer a general user question using disease-specific
        knowledge when a disease is provided.
        """

        # -----------------------------------------------------
        # If disease is known, restrict retrieval to that
        # disease.
        # -----------------------------------------------------

        if disease:

            normalized_disease = (
                self.normalize_disease(disease)
            )

            chunks = self.retrieve(
                query=message,
                disease=normalized_disease,
                limit=5,
            )

        else:

            # No disease supplied.
            #
            # This should only be used for truly general
            # questions because there is no disease filter.

            result = self.gemini.models.embed_content(
                model="gemini-embedding-2",
                contents=message,
            )

            query_vector = result.embeddings[0].values

            results = self.qdrant.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                limit=5,
            )

            chunks = []

            for point in results.points:

                payload = point.payload or {}

                chunks.append(
                    {
                        "text": payload.get(
                            "text",
                            ""
                        ),
                        "page": payload.get(
                            "page"
                        ),
                        "source": payload.get(
                            "source"
                        ),
                        "disease": payload.get(
                            "disease"
                        ),
                        "score": point.score,
                    }
                )

        reference = self._format_reference(
            chunks
        )

        context_text = ""

        if context:
            context_text = (
                f"The current context is: {context}\n\n"
            )

        prompt = f"""
You are a healthcare risk explanation assistant.

{context_text}

User question:

{message}

Use ONLY the reference information below when
providing medical context.

Reference information:

{reference}

Requirements:

Answer the user's question clearly and naturally.

Do not invent medical information that is not
present in the reference.

Do not provide a medical diagnosis.

If the reference information does not contain
the answer, clearly say that the available
knowledge base does not provide enough
information.

If discussing a prediction, clearly state that
it is an ML-based decision-support result.

Do not interpret an ML probability as a clinical
probability.

Recommend discussing concerning results with
a healthcare professional.

Keep the response understandable to a general user.
"""

        return self._call_gemini_with_retry(
            lambda: self.gemini.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt,
            ).text
        )

    # =========================================================
    # EXTRACT MODEL FACTORS
    # =========================================================

    def _extract_factors(
        self,
        factors: Any,
    ) -> List[Dict]:
        """
        Safely extract feature names and contributions from
        dictionaries or Pydantic/model objects.
        """

        extracted_factors = []

        if not factors:
            return extracted_factors

        for factor in factors:

            if isinstance(factor, dict):

                feature = factor.get(
                    "feature"
                )

                contribution = factor.get(
                    "contribution"
                )

            else:

                feature = getattr(
                    factor,
                    "feature",
                    None,
                )

                contribution = getattr(
                    factor,
                    "contribution",
                    None,
                )

            if feature:

                extracted_factors.append(
                    {
                        "feature": str(
                            feature
                        ),
                        "contribution": contribution,
                    }
                )

        return extracted_factors

    # =========================================================
    # EXPLAIN MODEL PREDICTION
    # =========================================================

    def explain_prediction(
        self,
        prediction_result: Dict,
    ) -> str:
        """
        Main RAG pipeline.

        Flow:

        Model prediction
                ↓
        Identify disease
                ↓
        Normalize disease
                ↓
        Extract model factors
                ↓
        Build retrieval query
                ↓
        Qdrant disease filter
                ↓
        Retrieve relevant knowledge
                ↓
        Build context
                ↓
        Gemini explanation
        """

        # =====================================================
        # 1. IDENTIFY DISEASE FROM BACKEND OUTPUT
        # =====================================================

        raw_disease = prediction_result.get(
            "disease",
            ""
        )

        disease = self.normalize_disease(
            raw_disease
        )

        logger.info(
            "Prediction disease identified: %s",
            disease,
        )

        # =====================================================
        # 2. EXTRACT MODEL FACTORS
        # =====================================================

        factors = self._extract_factors(
            prediction_result.get(
                "top_factors",
                []
            )
        )

        factor_lines = []

        for factor in factors:

            feature = factor["feature"]

            contribution = factor[
                "contribution"
            ]

            if contribution is not None:

                factor_lines.append(
                    f"{feature}: "
                    f"contribution={contribution}"
                )

            else:

                factor_lines.append(
                    feature
                )

        factor_text = "\n".join(
            factor_lines
        )

        if not factor_text:

            factor_text = (
                "No model factors were provided."
            )

        # =====================================================
        # 3. BUILD DISEASE-SPECIFIC RETRIEVAL QUERY
        # =====================================================

        query = f"""
Medical information related to {disease}.

The machine-learning model identified these
important factors:

{factor_text}

Retrieve information that can help explain the
medical relevance of these factors in relation
to {disease}.
"""

        # =====================================================
        # 4. RETRIEVE ONLY THE SELECTED DISEASE
        # =====================================================

        chunks = self.retrieve(
            query=query,
            disease=disease,
            limit=5,
        )

        # =====================================================
        # 5. BUILD REFERENCE CONTEXT
        # =====================================================

        reference = self._format_reference(
            chunks
        )

        if not reference.strip():

            reference = (
                "No relevant information was "
                "retrieved from the knowledge base."
            )

        # =====================================================
        # 6. GET MODEL OUTPUT
        # =====================================================

        prediction = prediction_result.get(
            "prediction",
            "Unknown"
        )

        probability = prediction_result.get(
            "probability",
            "Unknown"
        )

        risk_band = prediction_result.get(
            "risk_band",
            "Unknown"
        )

        # =====================================================
        # 7. BUILD EXPLANATION PROMPT
        # =====================================================

        prompt = f"""
You are a healthcare risk explanation assistant.

The backend machine-learning system has already
identified the disease as:

{disease}

The machine-learning model produced this result:

Disease:
{disease}

Prediction:
{prediction}

Model probability:
{probability}

Risk band:
{risk_band}

Important model factors:

{factor_text}

The following information was retrieved ONLY
from the knowledge base for {disease}.

REFERENCE INFORMATION:

{reference}

Your task is to explain the machine-learning
prediction to the user in simple and understandable
language.

IMPORTANT REQUIREMENTS:

Clearly explain what the prediction means.

Mention the prediction, model probability and
risk band naturally.

Explain the important model factors and their
model contributions when available.

The contribution values describe how the model
used the factors. They do NOT prove that a factor
caused the disease.

Only connect a model factor to medical information
when that connection is supported by the reference
information.

Use ONLY the supplied reference information for
medical claims.

Do not invent medical information.

Do not provide a medical diagnosis.

Clearly state that this is an ML-based risk
prediction or decision-support result.

Do not interpret the model probability as a
clinical probability.

Recommend discussing concerning results with
a healthcare professional.

Keep the explanation concise and understandable
to a general user.

Write naturally as if you are responding in a
chatbot.

Use clean Markdown formatting.

You may use short paragraphs and bullet points
where helpful.

Do not overcomplicate the explanation.

Return ONLY the final explanation.
"""

        # =====================================================
        # 8. GENERATE GEMINI EXPLANATION
        # =====================================================

        return self._call_gemini_with_retry(
            lambda: self.gemini.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt,
            ).text
        )
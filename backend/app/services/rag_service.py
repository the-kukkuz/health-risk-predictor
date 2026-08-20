from __future__ import annotations

import logging
import os
import time
from typing import Dict, List

from dotenv import load_dotenv
from google import genai
from qdrant_client import QdrantClient

load_dotenv()

logger = logging.getLogger(__name__)


class RAGService:

    def __init__(self):
        self.collection_name = "diabetes_knowledge"

        # -------------------------------------------------
        # Gemini client
        # -------------------------------------------------
        self.gemini = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY")
        )

        # -------------------------------------------------
        # Qdrant Cloud client
        # -------------------------------------------------
        self.qdrant = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY"),
            timeout=120,
        )

    # =====================================================
    # RETRIEVE RELEVANT KNOWLEDGE
    # =====================================================

    def retrieve(
        self,
        query: str,
        limit: int = 5,
    ) -> List[Dict]:

        # -------------------------------------------------
        # 1. Convert query into embedding
        # -------------------------------------------------
        result = self.gemini.models.embed_content(
            model="gemini-embedding-2",
            contents=query,
        )

        query_vector = result.embeddings[0].values

        # -------------------------------------------------
        # 2. Search Qdrant Cloud
        # -------------------------------------------------
        results = self.qdrant.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit,
        )

        # -------------------------------------------------
        # 3. Extract retrieved chunks
        # -------------------------------------------------
        chunks = []

        for point in results.points:

            chunks.append(
                {
                    "text": point.payload.get("text", ""),
                    "page": point.payload.get("page"),
                    "score": point.score,
                }
            )

        return chunks

    # =====================================================
    # CHAT (general Q&A against the knowledge base)
    # =====================================================

    def chat(
        self,
        message: str,
        context: str | None = None,
    ) -> str:
        """Answer a general user question grounded in the clinical corpus."""

        # 1. Retrieve relevant chunks from Qdrant
        chunks = self.retrieve(message, limit=5)

        # 2. Build reference context
        context_parts = []
        for chunk in chunks:
            context_parts.append(
                f"[Page {chunk['page']}]\n{chunk['text']}"
            )
        reference = "\n\n".join(context_parts)

        # 3. Build Gemini prompt
        prompt = f"""
You are a healthcare risk explanation assistant.

{('The user is asking about: ' + context) if context else ''}

User question:
{message}

Use ONLY the reference information below when providing medical context.

Reference information:

{reference}

Answer the user's question in simple, clear language.

Requirements:

- Answer based only on the reference information provided.
- Do not invent medical information not present in the reference.
- Do not provide a medical diagnosis.
- Clearly state that this is an ML-based decision-support tool.
- If the reference does not contain the answer, say so and recommend
  discussing with a healthcare professional.
- Keep the answer understandable to a general user.
- Include a brief disclaimer that this is not medical advice.
"""

        # 4. Generate Gemini response with retry
        last_error = None
        for attempt in range(3):
            try:
                response = self.gemini.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=prompt,
                )
                return response.text
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Gemini chat attempt %s failed: %s",
                    attempt + 1,
                    exc,
                )
                if attempt < 2:
                    time.sleep(2 * (attempt + 1))

        raise last_error

    # =====================================================
    # GENERATE EXPLANATION
    # =====================================================

    def explain_prediction(
        self,
        prediction_result: Dict,
    ) -> str:

        # -------------------------------------------------
        # 1. Extract model factors
        # -------------------------------------------------

        factors = prediction_result.get(
            "top_factors",
            []
        )

        # Get feature names safely
        factor_names = []

        for factor in factors:

            if isinstance(factor, dict):
                feature = factor.get("feature")

                if feature:
                    factor_names.append(feature)

            else:
                # Handles Pydantic objects such as Factor
                feature = getattr(
                    factor,
                    "feature",
                    None,
                )

                if feature:
                    factor_names.append(feature)

        factor_text = ", ".join(factor_names)

        # -------------------------------------------------
        # 2. Build retrieval query
        # -------------------------------------------------
        #
        # We focus the embedding search on medical knowledge
        # related to the model factors.
        #
        # Probability and risk band are NOT included here
        # because Qdrant should retrieve medical context,
        # not documents about "0.74" or "High".
        # -------------------------------------------------

        query = f"""
        Diabetes health information related to these
        model factors:

        {factor_text}
        """

        # -------------------------------------------------
        # 3. Retrieve relevant knowledge from Qdrant
        # -------------------------------------------------

        chunks = self.retrieve(
            query,
            limit=5,
        )

        # -------------------------------------------------
        # 4. Build reference context
        # -------------------------------------------------

        context_parts = []

        for chunk in chunks:

            context_parts.append(
                f"[Page {chunk['page']}]\n"
                f"{chunk['text']}"
            )

        context = "\n\n".join(context_parts)

        # -------------------------------------------------
        # 5. Build Gemini prompt
        # -------------------------------------------------

        prompt = f"""
You are a healthcare risk explanation assistant.

The machine-learning model produced this result:

Disease:
{prediction_result["disease"]}

Prediction:
{prediction_result["prediction"]}

Probability:
{prediction_result["probability"]}

Risk band:
{prediction_result["risk_band"]}

Top model factors:
{factors}

Use ONLY the reference information below when
providing medical context.

Reference information:

{context}

Explain the model result in simple language.

Requirements:

- Clearly explain what the prediction means.
- Explain the important model factors.
- Explain the factors based on the model's contribution.
- Connect factors to the reference information only
  when the reference information supports the connection.
- Do not claim that any factor caused diabetes.
- Do not invent medical information.
- Do not provide a medical diagnosis.
- Clearly state that this is an ML-based risk prediction.
- Do not imply that the probability is a clinical probability
  unless explicitly supported.
- Recommend discussing concerning results with a
  healthcare professional.
- Keep the explanation understandable to a general user.
"""

        # -------------------------------------------------
        # 6. Generate Gemini explanation
        # -------------------------------------------------
        #
        # Gemini may occasionally return 503 when the service
        # is experiencing high demand.
        #
        # Retry up to 3 times.
        # -------------------------------------------------

        last_error = None

        for attempt in range(3):

            try:

                response = self.gemini.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=prompt,
                )

                return response.text

            except Exception as exc:

                last_error = exc

                logger.warning(
                    "Gemini explanation attempt %s failed: %s",
                    attempt + 1,
                    exc,
                )

                # Don't wait after the final attempt
                if attempt < 2:

                    wait_time = 2 * (attempt + 1)

                    logger.warning(
                        "Retrying Gemini request in %s seconds...",
                        wait_time,
                    )

                    time.sleep(wait_time)

        # -------------------------------------------------
        # 7. All attempts failed
        # -------------------------------------------------

        raise last_error
from __future__ import annotations

import logging
import os
import time
from typing import Any, Callable, Dict, List, Optional

from dotenv import load_dotenv
from google import genai
from qdrant_client import QdrantClient

load_dotenv()

logger = logging.getLogger(__name__)


class RAGService:

    def __init__(self):
        self.collection_name = "diabetes_knowledge"

        # Initialize Clients
        self.gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.qdrant = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY"),
            timeout=120,
        )

    def _call_gemini_with_retry(
        self,
        func: Callable[[], Any],
        max_attempts: int = 3,
    ) -> Any:
        """Helper to retry Gemini API calls with linear/exponential backoff."""
        last_error = None
        for attempt in range(max_attempts):
            try:
                return func()
            except Exception as exc:
                last_error = exc
                logger.warning("Gemini API call attempt %s failed: %s", attempt + 1, exc)
                if attempt < max_attempts - 1:
                    wait_time = 2 * (attempt + 1)
                    logger.warning("Retrying in %s seconds...", wait_time)
                    time.sleep(wait_time)
        raise last_error

    def retrieve(self, query: str, limit: int = 5) -> List[Dict]:
        """Convert query to embedding and search Qdrant Cloud."""
        # Embed query
        result = self.gemini.models.embed_content(
            model="gemini-embedding-2",
            contents=query,
        )
        query_vector = result.embeddings[0].values

        # Vector search
        results = self.qdrant.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit,
        )

        chunks = []
        for point in results.points:
            payload = point.payload or {}
            chunks.append(
                {
                    "text": payload.get("text", ""),
                    "page": payload.get("page"),
                    "score": point.score,
                }
            )
        return chunks

    def _format_reference(self, chunks: List[Dict]) -> str:
        """Format retrieved chunks into a clean context string."""
        context_parts = []
        for chunk in chunks:
            page_str = f"[Page {chunk['page']}]\n" if chunk.get("page") is not None else ""
            context_parts.append(f"{page_str}{chunk['text']}")
        return "\n\n".join(context_parts)

    def chat(self, message: str, context: Optional[str] = None) -> str:
        """Answer a general user question grounded in the clinical corpus."""
        chunks = self.retrieve(message, limit=5)
        reference = self._format_reference(chunks)

        prompt = f"""
You are a healthcare risk explanation assistant.

{('The user is asking about: ' + context) if context else ''}

User question:
{message}

Use ONLY the reference information below when providing medical context.

Reference information:
{reference}

Output Structure Requirements (STRICT):
1. Start with a direct 1-2 sentence summary answer.
2. If listing concepts, findings, or factors, use Markdown bullet points (`* `) with each item on a new line.
3. Use bolding (`**term**`) sparingly for key terms.
4. Place disclaimers, ML notices, and medical advice recommendations in a separate block labeled `### Notice` or italicized on a new line at the bottom.
5. Always separate logical sections with blank lines (`\n\n`).

Requirements:
- Answer based only on the reference information provided.
- Do not invent medical information not present in the reference.
- Do not provide a medical diagnosis.
- Clearly state that this is an ML-based decision-support tool.
- If the reference does not contain the answer, state it clearly before providing guidance.
"""
        return self._call_gemini_with_retry(
            lambda: self.gemini.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt,
            ).text
        )

    def explain_prediction(self, prediction_result: Dict) -> str:
        """Explain model results using retrieved clinical knowledge."""
        factors = prediction_result.get("top_factors", [])
        
        # Safely parse feature names across dictionaries and Pydantic objects
        factor_names = []
        for factor in factors:
            if isinstance(factor, dict):
                feature = factor.get("feature")
            else:
                feature = getattr(factor, "feature", None)
            if feature:
                factor_names.append(str(feature))

        factor_text = ", ".join(factor_names)

        # Build search query focused on factor topics
        query = f"Diabetes health information related to these model factors: {factor_text}"
        chunks = self.retrieve(query, limit=5)
        context = self._format_reference(chunks)

        prompt = f"""
You are a healthcare risk explanation assistant.

The machine-learning model produced this result:

Disease: {prediction_result.get('disease')}
Prediction: {prediction_result.get('prediction')}
Probability: {prediction_result.get('probability')}
Risk band: {prediction_result.get('risk_band')}
Top model factors: {factors}

Use ONLY the reference information below when providing medical context.

Reference information:
{context}

Explain the model result in simple language.

Formatting Directives:
- Respond using clean, structured Markdown.
- Bold important factor names, numerical values, and risk levels (`**High Risk**`, `**BMI**`).
- Structure bullet points (`* `) on separate lines for lists of factors or findings.
- Use double line breaks between distinct logical sections.
- Format disclaimers and tool notices in italics (`*Note: This is an ML-based risk assessment...*`).

Requirements:
- Clearly explain what the prediction means.
- Explain the important model factors based on the model's contribution.
- Connect factors to the reference information only when supported.
- Do not claim that any factor caused diabetes.
- Do not invent medical information.
- Do not provide a medical diagnosis.
- Clearly state that this is an ML-based risk prediction.
- Do not imply that the probability is a clinical probability unless explicitly supported.
- Recommend discussing concerning results with a healthcare professional.
- Keep the explanation understandable to a general user.
"""
        return self._call_gemini_with_retry(
            lambda: self.gemini.models.generate_content(
                 model="gemini-3.5-flash-lite",
                contents=prompt,
            ).text
        )
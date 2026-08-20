import os
import uuid

import fitz
from dotenv import load_dotenv
from google import genai
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct

load_dotenv()

# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------
PDF_PATH = r"C:\Users\Administrator\Desktop\diabetes-project\Data\diabetes\diabetes.pdf"
COLLECTION_NAME = "diabetes_knowledge"

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150

# ---------------------------------------------------------
# Clients
# ---------------------------------------------------------

gemini = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

qdrant = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
    timeout=120,
)

# ---------------------------------------------------------
# 1. Extract text from PDF
# ---------------------------------------------------------

print("Reading PDF...")

doc = fitz.open(PDF_PATH)

pages = []

for page_number, page in enumerate(doc):
    text = page.get_text()

    if text.strip():
        pages.append({
            "page": page_number + 1,
            "text": text,
        })

doc.close()

print(f"Pages with text: {len(pages)}")


# ---------------------------------------------------------
# 2. Split text into chunks
# ---------------------------------------------------------

chunks = []

for page in pages:

    text = page["text"].replace("\n", " ").strip()

    start = 0

    while start < len(text):

        end = start + CHUNK_SIZE

        chunk_text = text[start:end].strip()

        if chunk_text:
            chunks.append({
                "text": chunk_text,
                "page": page["page"],
            })

        start += CHUNK_SIZE - CHUNK_OVERLAP


print(f"Total chunks: {len(chunks)}")


# ---------------------------------------------------------
# 3. Create embeddings
# ---------------------------------------------------------

print("Creating embeddings...")

points = []

for index, chunk in enumerate(chunks):

    result = gemini.models.embed_content(
        model="gemini-embedding-2",
        contents=chunk["text"],
    )

    vector = result.embeddings[0].values

    points.append(
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "text": chunk["text"],
                "source": "diabetes_knowledge.pdf",
                "disease": "diabetes",
                "page": chunk["page"],
                "chunk_id": index,
            },
        )
    )

    print(
        f"Embedded chunk {index + 1}/{len(chunks)}"
    )


# ---------------------------------------------------------
# 4. Upload vectors to Qdrant
# ---------------------------------------------------------

print("Uploading vectors to Qdrant...")

BATCH_SIZE = 10

print("Uploading vectors to Qdrant...")

for start in range(0, len(points), BATCH_SIZE):
    batch = points[start:start + BATCH_SIZE]

    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=batch,
    )

    print(
        f"Uploaded {min(start + BATCH_SIZE, len(points))}/{len(points)}"
    )

print("\nIngestion completed successfully!")

print("\nIngestion completed successfully!")

# ---------------------------------------------------------
# 5. Verify
# ---------------------------------------------------------

info = qdrant.get_collection(COLLECTION_NAME)

print(
    f"Vectors stored: {info.points_count}"
)
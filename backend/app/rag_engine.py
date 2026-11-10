import os
import re
from typing import List, Dict, Any, Tuple
from pypdf import PdfReader
from sqlalchemy.orm import Session
import httpx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from .config import OLLAMA_BASE_URL, DEFAULT_MODEL
from .models import Document, DocumentChunk

def chunk_text(text: str, max_chars: int = 800, overlap: int = 150) -> List[str]:
    """Splits text into overlapping semantic chunks."""
    paragraphs = re.split(r'\n\s*\n', text)
    chunks = []
    current_chunk = ""

    for para in paragraphs:
        cleaned_para = " ".join(para.split())
        if not cleaned_para:
            continue

        if len(current_chunk) + len(cleaned_para) < max_chars:
            current_chunk = (current_chunk + " " + cleaned_para).strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            # If paragraph itself is longer than max_chars, split by sentence or fixed window
            if len(cleaned_para) > max_chars:
                words = cleaned_para.split()
                temp = ""
                for w in words:
                    if len(temp) + len(w) + 1 <= max_chars:
                        temp = (temp + " " + w).strip()
                    else:
                        if temp:
                            chunks.append(temp)
                        temp = w
                if temp:
                    current_chunk = temp
            else:
                current_chunk = cleaned_para

    if current_chunk:
        chunks.append(current_chunk)

    return chunks if chunks else ([text[:max_chars]] if text.strip() else [])

def process_pdf_document(document_id: int, file_path: str, db: Session) -> Tuple[int, int]:
    """Reads PDF, extracts text page by page, chunks, and saves to DB."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        return 0, 0

    try:
        reader = PdfReader(file_path)
        total_pages = len(reader.pages)
        total_chunks = 0

        for page_idx, page in enumerate(reader.pages):
            page_num = page_idx + 1
            text = page.extract_text() or ""
            text = text.strip()
            if not text:
                continue

            page_chunks = chunk_text(text)
            for c_idx, chunk_content in enumerate(page_chunks):
                chunk = DocumentChunk(
                    document_id=document_id,
                    page_number=page_num,
                    chunk_index=c_idx,
                    content=chunk_content
                )
                db.add(chunk)
                total_chunks += 1

        doc.num_pages = total_pages
        doc.status = "indexed"
        doc.error_message = None
        db.commit()
        return total_pages, total_chunks
    except Exception as e:
        doc.status = "error"
        doc.error_message = str(e)
        db.commit()
        raise e

def retrieve_relevant_chunks(
    query: str,
    document_ids: List[int],
    db: Session,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """Retrieves top_k relevant chunks across specified document_ids using TF-IDF similarity."""
    query_builder = db.query(DocumentChunk, Document).join(Document, DocumentChunk.document_id == Document.id)
    if document_ids and len(document_ids) > 0:
        query_builder = query_builder.filter(DocumentChunk.document_id.in_(document_ids))

    results = query_builder.all()
    if not results:
        return []

    corpus = [chunk.content for chunk, doc in results]
    if not corpus or not query.strip():
        return []

    try:
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", max_features=10000)
        tfidf_matrix = vectorizer.fit_transform(corpus)
        query_vec = vectorizer.transform([query])
        scores = cosine_similarity(query_vec, tfidf_matrix).flatten()

        top_indices = np.argsort(scores)[::-1][:top_k]
        relevant = []
        for idx in top_indices:
            score = float(scores[idx])
            chunk, doc = results[idx]
            # Include even modest matches or top chunks
            relevant.append({
                "document_id": doc.id,
                "document_name": doc.original_filename,
                "page_number": chunk.page_number,
                "content": chunk.content,
                "excerpt": chunk.content[:200] + ("..." if len(chunk.content) > 200 else ""),
                "score": round(score, 4)
            })
        return relevant
    except Exception as e:
        # Fallback keyword match if TF-IDF hits edge case (e.g., all stop words)
        words = set(query.lower().split())
        matched = []
        for chunk, doc in results:
            content_lower = chunk.content.lower()
            hit_count = sum(1 for w in words if w in content_lower)
            if hit_count > 0:
                matched.append((hit_count, chunk, doc))
        matched.sort(key=lambda x: x[0], reverse=True)
        return [
            {
                "document_id": doc.id,
                "document_name": doc.original_filename,
                "page_number": chunk.page_number,
                "content": chunk.content,
                "excerpt": chunk.content[:200] + ("..." if len(chunk.content) > 200 else ""),
                "score": 0.5
            }
            for _, chunk, doc in matched[:top_k]
        ]

async def check_ollama_status() -> Dict[str, Any]:
    """Checks if Ollama service is reachable and lists available models."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                return {
                    "online": True,
                    "models": models,
                    "default_model": DEFAULT_MODEL if DEFAULT_MODEL in models else (models[0] if models else DEFAULT_MODEL)
                }
    except Exception as e:
        return {
            "online": False,
            "models": [],
            "error": str(e),
            "default_model": DEFAULT_MODEL
        }
    return {"online": False, "models": [], "default_model": DEFAULT_MODEL}

async def generate_rag_answer(
    query: str,
    context_chunks: List[Dict[str, Any]],
    model_name: str = "qwen2.5:3b"
) -> Tuple[str, List[Dict[str, Any]]]:
    """Calls Ollama to synthesize an answer based on retrieved context chunks."""
    citations = []
    for c in context_chunks:
        citations.append({
            "document_id": c["document_id"],
            "document_name": c["document_name"],
            "page_number": c["page_number"],
            "excerpt": c["excerpt"],
            "score": c.get("score", 0.0)
        })

    if not context_chunks:
        return (
            "I could not find relevant information in the selected document(s) to answer your question. "
            "Please ensure the document contains relevant text, or try rephrasing your question.",
            []
        )

    context_str = ""
    for idx, c in enumerate(context_chunks):
        context_str += f"\n--- EXCERPT {idx+1} [Document: {c['document_name']}, Page: {c['page_number']}] ---\n{c['content']}\n"

    system_prompt = (
        "You are DocChat, an expert AI document analysis assistant. "
        "Answer the user's question clearly, thoroughly, and factually based strictly on the provided document excerpts. "
        "Always cite the source document name and page number when stating facts or references (e.g., [Source: filename.pdf, Page: X]). "
        "If the excerpts do not contain enough information to fully answer, state what is known and clarify what is missing. "
        "Do not make up facts."
    )

    user_prompt = f"DOCUMENT EXCERPTS:\n{context_str}\n\nUSER QUESTION: {query}\n\nANSWER:"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": model_name or DEFAULT_MODEL,
                "prompt": f"{system_prompt}\n\n{user_prompt}",
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "top_p": 0.9,
                }
            }
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            if resp.status_code == 200:
                data = resp.json()
                answer = data.get("response", "").strip()
                return answer, citations
            else:
                return (
                    f"Ollama returned status code {resp.status_code}: {resp.text}. "
                    f"Here are the most relevant excerpts found in your document:\n\n"
                    + "\n\n".join([f"**Page {c['page_number']}**: {c['content']}" for c in context_chunks[:3]]),
                    citations
                )
    except Exception as e:
        # If Ollama is offline or timed out, deliver the retrieved excerpts gracefully!
        fallback_msg = (
            f"Note: Local Ollama AI service is currently unavailable ({str(e)}). "
            f"However, DocChat successfully retrieved the most relevant sections from your selected document(s):\n\n"
            + "\n\n".join([f"📄 **{c['document_name']}** (Page {c['page_number']}):\n> {c['content']}" for c in context_chunks[:3]])
        )
        return fallback_msg, citations


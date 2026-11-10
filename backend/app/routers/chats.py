import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import User, Conversation, Message, Document
from ..schemas import (
    ConversationResponse, ConversationCreate,
    MessageResponse, MessageSend, FeedbackUpdate
)
from ..auth import get_current_user
from ..rag_engine import retrieve_relevant_chunks, generate_rag_answer

router = APIRouter(prefix="/api/chats", tags=["chats"])

@router.get("/", response_model=List[ConversationResponse])
def list_conversations(
    document_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_docs = set(d.id for d in db.query(Document.id).filter(Document.user_id == current_user.id).all())

    convs = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(desc(Conversation.updated_at)).all()

    results = []
    for c in convs:
        valid_doc_ids = [did for did in c.document_ids if did in existing_docs]
        if c.document_ids and len(valid_doc_ids) == 0:
            # Conversation belonged to a deleted document, prune it
            db.delete(c)
            continue

        if document_id is not None:
            if document_id not in valid_doc_ids:
                continue

        last_msg = db.query(Message).filter(Message.conversation_id == c.id).order_by(desc(Message.created_at)).first()
        msg_count = db.query(Message).filter(Message.conversation_id == c.id).count()
        results.append({
            "id": c.id,
            "title": c.title,
            "document_ids": valid_doc_ids,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "last_message": last_msg.content[:100] if last_msg else None,
            "message_count": msg_count
        })
    db.commit()
    return results

@router.post("/", response_model=ConversationResponse)
def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = Conversation(
        user_id=current_user.id,
        title=data.title or "New Chat"
    )
    conv.document_ids = data.document_ids
    db.add(conv)
    db.commit()
    db.refresh(conv)

    return {
        "id": conv.id,
        "title": conv.title,
        "document_ids": conv.document_ids,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "last_message": None,
        "message_count": 0
    }

@router.get("/{conversation_id}")
def get_conversation_details(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).order_by(Message.created_at.asc()).all()

    # Also resolve document names for selected document_ids
    selected_docs = db.query(Document).filter(Document.id.in_(conv.document_ids)).all() if conv.document_ids else []

    return {
        "id": conv.id,
        "title": conv.title,
        "document_ids": conv.document_ids,
        "documents": [{"id": d.id, "original_filename": d.original_filename, "num_pages": d.num_pages} for d in selected_docs],
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "messages": [
            {
                "id": m.id,
                "conversation_id": m.conversation_id,
                "sender": m.sender,
                "content": m.content,
                "citations": m.citations,
                "feedback": m.feedback,
                "created_at": m.created_at
            }
            for m in messages
        ]
    }

@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    data: MessageSend,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # If documents passed in request, update conversation doc list
    active_doc_ids = data.document_ids if (data.document_ids is not None and len(data.document_ids) > 0) else conv.document_ids
    if data.document_ids is not None and data.document_ids != conv.document_ids:
        conv.document_ids = data.document_ids
        db.commit()

    # 1. Save user message
    user_msg = Message(
        conversation_id=conv.id,
        sender="user",
        content=data.content
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Auto-generate title if this is the first message or titled "New Chat"
    if conv.title == "New Chat":
        clean_title = data.content.strip().split("\n")[0][:40]
        if len(data.content.strip().split("\n")[0]) > 40:
            clean_title += "..."
        conv.title = clean_title
        db.commit()

    # 2. Retrieve relevant chunks across the target document IDs
    relevant_chunks = retrieve_relevant_chunks(
        query=data.content,
        document_ids=active_doc_ids,
        db=db,
        top_k=5
    )

    # 3. Generate answer using Ollama Qwen2.5 3B
    model_to_use = data.model or current_user.preferred_model or "qwen2.5:3b"
    answer_text, citations = await generate_rag_answer(
        query=data.content,
        context_chunks=relevant_chunks,
        model_name=model_to_use
    )

    # 4. Save assistant message
    assistant_msg = Message(
        conversation_id=conv.id,
        sender="assistant",
        content=answer_text
    )
    assistant_msg.citations = citations
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return {
        "user_message": {
            "id": user_msg.id,
            "conversation_id": user_msg.conversation_id,
            "sender": user_msg.sender,
            "content": user_msg.content,
            "citations": [],
            "feedback": None,
            "created_at": user_msg.created_at
        },
        "assistant_message": {
            "id": assistant_msg.id,
            "conversation_id": assistant_msg.conversation_id,
            "sender": assistant_msg.sender,
            "content": assistant_msg.content,
            "citations": assistant_msg.citations,
            "feedback": None,
            "created_at": assistant_msg.created_at
        }
    }

@router.post("/{conversation_id}/messages/{message_id}/retry")
async def retry_message(
    conversation_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    target_msg = db.query(Message).filter(
        Message.id == message_id,
        Message.conversation_id == conv.id
    ).first()

    if not target_msg or target_msg.sender != "assistant":
        raise HTTPException(status_code=404, detail="Assistant message not found to retry")

    # Find the preceding user message
    preceding_user_msg = db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.sender == "user",
        Message.created_at < target_msg.created_at
    ).order_by(desc(Message.created_at)).first()

    prompt = preceding_user_msg.content if preceding_user_msg else "Please answer based on the document"

    relevant_chunks = retrieve_relevant_chunks(
        query=prompt,
        document_ids=conv.document_ids,
        db=db,
        top_k=5
    )

    answer_text, citations = await generate_rag_answer(
        query=prompt,
        context_chunks=relevant_chunks,
        model_name=current_user.preferred_model or "qwen2.5:3b"
    )

    target_msg.content = answer_text
    target_msg.citations = citations
    target_msg.feedback = None
    db.commit()
    db.refresh(target_msg)

    return {
        "id": target_msg.id,
        "conversation_id": target_msg.conversation_id,
        "sender": target_msg.sender,
        "content": target_msg.content,
        "citations": target_msg.citations,
        "feedback": target_msg.feedback,
        "created_at": target_msg.created_at
    }

@router.post("/{conversation_id}/messages/{message_id}/feedback")
def update_feedback(
    conversation_id: int,
    message_id: int,
    data: FeedbackUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).join(Conversation).filter(
        Message.id == message_id,
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    msg.feedback = data.feedback
    db.commit()
    return {"status": "ok", "feedback": msg.feedback}

@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted", "id": conversation_id}


import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, Document, DocumentChunk, Folder
from ..schemas import (
    DocumentResponse, DocumentRename, DocumentMove,
    FolderCreate, FolderResponse, StorageStats
)
from ..auth import get_current_user
from ..config import STORAGE_DIR, MAX_STORAGE_BYTES
from ..rag_engine import process_pdf_document

router = APIRouter(prefix="/api/documents", tags=["documents"])

def format_bytes(size: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"

@router.get("/storage", response_model=StorageStats)
def get_storage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    used_bytes = sum(doc.file_size or 0 for doc in docs)
    percentage = (used_bytes / MAX_STORAGE_BYTES) * 100 if MAX_STORAGE_BYTES > 0 else 0
    return {
        "used_bytes": used_bytes,
        "total_bytes": MAX_STORAGE_BYTES,
        "used_percentage": round(min(percentage, 100.0), 1),
        "formatted_used": format_bytes(used_bytes),
        "formatted_total": format_bytes(MAX_STORAGE_BYTES),
        "document_count": len(docs)
    }

@router.post("/upload", response_model=List[DocumentResponse])
async def upload_documents(
    files: List[UploadFile] = File(...),
    folder_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    uploaded_docs = []

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            continue

        file_ext = os.path.splitext(file.filename)[1]
        unique_name = f"{uuid.uuid4().hex}{file_ext}"
        save_path = STORAGE_DIR / unique_name

        content = await file.read()
        file_size = len(content)

        with open(save_path, "wb") as f:
            f.write(content)

        doc = Document(
            user_id=current_user.id,
            original_filename=file.filename,
            stored_filename=unique_name,
            file_path=str(save_path),
            file_size=file_size,
            status="processing",
            folder_id=folder_id
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Process PDF and extract chunks
        try:
            process_pdf_document(doc.id, str(save_path), db)
            db.refresh(doc)
        except Exception as e:
            doc.status = "error"
            doc.error_message = str(e)
            db.commit()

        uploaded_docs.append(doc)

    return uploaded_docs

@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    search: Optional[str] = Query(None),
    folder_id: Optional[int] = Query(None),
    sort_by: Optional[str] = Query("date"), # "date", "name", "size"
    sort_order: Optional[str] = Query("desc"), # "asc", "desc"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Document).filter(Document.user_id == current_user.id)

    if folder_id is not None:
        query = query.filter(Document.folder_id == folder_id)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(Document.original_filename.ilike(search_filter))

    if sort_by == "name":
        query = query.order_by(Document.original_filename.asc() if sort_order == "asc" else Document.original_filename.desc())
    elif sort_by == "size":
        query = query.order_by(Document.file_size.asc() if sort_order == "asc" else Document.file_size.desc())
    else:
        query = query.order_by(Document.created_at.asc() if sort_order == "asc" else Document.created_at.desc())

    return query.all()

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.get("/{document_id}/file")
def get_document_file(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found")

    return FileResponse(
        path=doc.file_path,
        media_type="application/pdf",
        filename=doc.original_filename,
        headers={"Content-Disposition": f'inline; filename="{doc.original_filename}"'}
    )

@router.patch("/{document_id}", response_model=DocumentResponse)
def rename_document(
    document_id: int,
    data: DocumentRename,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    clean_name = data.filename.strip()
    if not clean_name.lower().endswith(".pdf"):
        clean_name += ".pdf"
    doc.original_filename = clean_name
    db.commit()
    db.refresh(doc)
    return doc

@router.patch("/{document_id}/move", response_model=DocumentResponse)
def move_document(
    document_id: int,
    data: DocumentMove,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.folder_id = data.folder_id
    db.commit()
    db.refresh(doc)
    return doc

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove physical file
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    # Clean up conversations referencing this document
    user_convs = db.query(Conversation).filter(Conversation.user_id == current_user.id).all()
    for conv in user_convs:
        doc_ids = conv.document_ids
        if document_id in doc_ids:
            remaining_ids = [did for did in doc_ids if did != document_id]
            if len(remaining_ids) == 0:
                db.delete(conv)
            else:
                conv.document_ids = remaining_ids

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully", "id": document_id}

# Folder Routes
@router.get("/folders/list", response_model=List[FolderResponse])
def list_folders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    folders = db.query(Folder).filter(Folder.user_id == current_user.id).all()
    results = []
    for f in folders:
        doc_count = db.query(func.count(Document.id)).filter(Document.folder_id == f.id).scalar()
        results.append({
            "id": f.id,
            "name": f.name,
            "color": f.color,
            "created_at": f.created_at,
            "document_count": doc_count or 0
        })
    return results

@router.post("/folders/create", response_model=FolderResponse)
def create_folder(
    data: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_folder = Folder(
        user_id=current_user.id,
        name=data.name.strip(),
        color=data.color or "indigo"
    )
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    return {
        "id": new_folder.id,
        "name": new_folder.name,
        "color": new_folder.color,
        "created_at": new_folder.created_at,
        "document_count": 0
    }

@router.delete("/folders/{folder_id}")
def delete_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == current_user.id
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Reset folder_id on documents in this folder
    db.query(Document).filter(Document.folder_id == folder_id).update({"folder_id": None})
    db.delete(folder)
    db.commit()
    return {"message": "Folder deleted"}


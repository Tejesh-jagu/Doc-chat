import shutil
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Document
from ..schemas import SystemSettingsUpdate
from ..auth import get_current_user
from ..rag_engine import check_ollama_status
from ..config import STORAGE_DIR, MAX_STORAGE_BYTES

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("/status")
async def get_system_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ollama_info = await check_ollama_status()
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    used_bytes = sum(doc.file_size or 0 for doc in docs)

    # Disk space of the drive
    try:
        total, used, free = shutil.disk_usage(STORAGE_DIR)
    except Exception:
        total, used, free = (0, 0, 0)

    return {
        "status": "healthy",
        "backend": "online",
        "ollama": ollama_info,
        "active_model": current_user.preferred_model or "qwen2.5:3b",
        "active_background": current_user.background_theme or "mountains",
        "storage": {
            "used_bytes": used_bytes,
            "max_bytes": MAX_STORAGE_BYTES,
            "document_count": len(docs),
            "drive_free_gb": round(free / (1024**3), 2)
        }
    }

@router.patch("/settings")
def update_settings(
    settings: SystemSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if settings.background_theme:
        current_user.background_theme = settings.background_theme
    if settings.preferred_model:
        current_user.preferred_model = settings.preferred_model

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Settings updated",
        "background_theme": current_user.background_theme,
        "preferred_model": current_user.preferred_model
    }


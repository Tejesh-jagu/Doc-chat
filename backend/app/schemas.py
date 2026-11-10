from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    background_theme: str
    preferred_model: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Folder Schemas
class FolderCreate(BaseModel):
    name: str
    color: Optional[str] = "indigo"

class FolderResponse(BaseModel):
    id: int
    name: str
    color: str
    created_at: datetime
    document_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Document Schemas
class DocumentResponse(BaseModel):
    id: int
    original_filename: str
    file_size: int
    num_pages: int
    status: str
    error_message: Optional[str] = None
    folder_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentRename(BaseModel):
    filename: str

class DocumentMove(BaseModel):
    folder_id: Optional[int] = None

class StorageStats(BaseModel):
    used_bytes: int
    total_bytes: int
    used_percentage: float
    formatted_used: str
    formatted_total: str
    document_count: int

# Chat & Message Schemas
class Citation(BaseModel):
    document_id: int
    document_name: str
    page_number: int
    excerpt: str
    score: Optional[float] = None

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender: str
    content: str
    citations: List[Citation] = []
    feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    title: str
    document_ids: List[int]
    created_at: datetime
    updated_at: datetime
    last_message: Optional[str] = None
    message_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Chat"
    document_ids: List[int] = []

class MessageSend(BaseModel):
    content: str
    document_ids: Optional[List[int]] = None
    model: Optional[str] = None

class FeedbackUpdate(BaseModel):
    feedback: Optional[str] # "up", "down", or null

class SystemSettingsUpdate(BaseModel):
    background_theme: Optional[str] = None
    preferred_model: Optional[str] = None


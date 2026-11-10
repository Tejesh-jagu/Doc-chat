import datetime
import json
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    background_theme = Column(String(50), default="mountains") # mountains, ocean, gradient, abstract, dark
    preferred_model = Column(String(50), default="qwen2.5:3b")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="owner", cascade="all, delete-orphan")

class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(50), default="indigo")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="folders")
    documents = relationship("Document", back_populates="folder")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, default=0)
    num_pages = Column(Integer, default=0)
    status = Column(String(50), default="processing") # processing, indexed, error
    error_message = Column(Text, nullable=True)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="documents")
    folder = relationship("Folder", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)

    document = relationship("Document", back_populates="chunks")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), default="New Chat")
    document_ids_json = Column(Text, default="[]") # JSON list of document IDs
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

    @property
    def document_ids(self):
        try:
            return json.loads(self.document_ids_json or "[]")
        except Exception:
            return []

    @document_ids.setter
    def document_ids(self, val):
        self.document_ids_json = json.dumps(val or [])

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender = Column(String(20), nullable=False) # "user" or "assistant"
    content = Column(Text, nullable=False)
    citations_json = Column(Text, default="[]") # JSON list of citation objects
    feedback = Column(String(10), nullable=True) # "up", "down", None
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

    @property
    def citations(self):
        try:
            return json.loads(self.citations_json or "[]")
        except Exception:
            return []

    @citations.setter
    def citations(self, val):
        self.citations_json = json.dumps(val or [])


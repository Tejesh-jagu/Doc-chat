from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, documents, chats, system

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DocChat API",
    description="Intelligent AI Document Workspace powered by Ollama and Qwen2.5 3B",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chats.router)
app.include_router(system.router)

@app.get("/")
def root():
    return {"message": "DocChat API is running", "docs_url": "/docs"}


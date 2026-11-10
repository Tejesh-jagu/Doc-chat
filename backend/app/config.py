import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage" / "documents"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{BASE_DIR}/docchat.db"
SECRET_KEY = os.getenv("SECRET_KEY", "docchat-super-secret-jwt-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "qwen2.5:3b")
MAX_STORAGE_BYTES = 500 * 1024 * 1024 # 500 MB


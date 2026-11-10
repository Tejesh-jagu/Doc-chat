# DocChat — AI Document Workspace

DocChat is a premium AI document workspace inspired by DocGPT, powered locally by **Ollama** and **Qwen2.5 3B**. It delivers private, high-accuracy document intelligence with page-level citations, multi-document cross-referencing, an integrated PDF viewer, and scenic glassmorphism UI.

---

## Key Features

1. **Three-Section Dashboard Layout**
   - **Left Navigation Sidebar (~190px)**: DocChat logo, navigation (Home, Documents, Help, Settings), live Ollama model indicator, real storage bar, user profile, and sign-out.
   - **Middle File Panel (~320px)**: Live document count, real-time title search, PDF upload button, status indicators (Indexed, Processing, Error), 3-dots actions (Open in PDF Viewer, Rename, Download, Delete), and live storage meter.
   - **Main Glassmorphism Workspace**: Dynamic split-view workspace supporting side-by-side PDF reading and AI chat with page citations.

2. **Customizable Scenic Backgrounds**
   - Full-screen scenic landscape wallpapers with dark translucent glass panels and backdrop blur.
   - Presets configurable in Settings:
     - 🏔️ **Alpine Mountains** (Misty mountain valley & dusk glow)
     - 🌊 **Deep Ocean** (Azure horizon & twilight waters)
     - 🌅 **Sunset Horizon** (Warm golden alpine sunset)
     - 🌌 **Abstract Gradient** (Deep violet & midnight teal mesh)
     - 🏙️ **Midnight Dark** (Ultra-clean starlight aesthetic)

3. **Local RAG Pipeline with Ollama & Qwen2.5 3B**
   - 100% private and offline-capable: no documents or queries are sent to external third parties.
   - Precise page-by-page PDF extraction and semantic chunking.
   - Real-time similarity retrieval across single or multiple selected documents.
   - Structured page-level citations (`Source: <filename>, Page: <page_number>`).
   - Clicking any citation card navigates the integrated PDF viewer directly to that page!

4. **Integrated PDF Viewer**
   - Direct PDF.js canvas rendering with offline local worker.
   - Previous / Next page navigation, jump-to-page, and page counter.
   - Zoom In / Zoom Out controls with percentage display.
   - Full-screen mode and direct original file download.
   - Seamless split-view and citation jump integration.

5. **Complete Document Management**
   - List and Grid view toggles.
   - Search by document title and sort by upload date, name, or file size.
   - Multi-file batch selection with bulk delete and multi-document chat creation.
   - Folder categorization (e.g., Research, Contracts, Notes).

6. **Authentication & User Management**
   - JWT authentication with secure password hashing (`bcrypt`).
   - Built-in demo user mode for immediate zero-friction testing.
   - Sign up, login, user profile, and change password features.

---

## Architecture & Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, PDF.js (`pdfjs-dist`), React-Markdown, Remark-GFM.
- **Backend**: FastAPI, Uvicorn, Python 3.12, SQLAlchemy, SQLite, Pypdf, Scikit-Learn (TF-IDF vector retrieval), Bcrypt, PyJWT, HTTPX.
- **AI Inference**: Ollama running `qwen2.5:3b` locally on port 11434.

---

## Running the Application

### Option A: Using the Windows Launcher
Double-click `start.bat` in the project root.

### Option B: Running Manually

1. **Start the Backend**:
   ```powershell
   cd "e:\Doc chat"
   .\backend\venv\Scripts\python run_backend.py
   ```
   Backend will be active at `http://127.0.0.1:8000` (API docs at `/docs`).

2. **Start the Frontend**:
   ```powershell
   cd "e:\Doc chat\frontend"
   npm run dev
   ```
   Frontend will be active at `http://127.0.0.1:5173`.


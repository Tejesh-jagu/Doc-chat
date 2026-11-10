@echo off
echo ===================================================
echo Starting DocChat AI Document Workspace
echo ===================================================

echo [1/2] Starting DocChat FastAPI Backend (Port 8000)...
start "DocChat Backend" cmd /k "backend\venv\Scripts\python run_backend.py"

echo [2/2] Starting DocChat Vite Frontend (Port 5173)...
start "DocChat Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo DocChat is running!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo ===================================================
pause


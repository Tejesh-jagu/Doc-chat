import uvicorn
import sys
import os

# Ensure backend folder is on python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

if __name__ == "__main__":
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True, reload_dirs=[backend_dir])


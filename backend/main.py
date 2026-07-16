from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import FRONTEND_DIR
from routers import analyze, complaint, dlsa

app = FastAPI(title="Clause by Clause API")

# Allow the frontend to call the API even if you serve it from a
# different origin during development (e.g. VS Code Live Server).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(complaint.router)
app.include_router(dlsa.router)

# Serve the frontend from the same server so there's only one thing
# to run and deploy. index.html is served at "/".
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

"""
Central place for configuration. Nothing else in the app should call
os.getenv() directly — import from here instead. Makes it obvious what
the app depends on, and makes it trivial to swap providers later.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = "gemini-3-flash-preview"

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

RENTAL_RULES_PATH = BASE_DIR / "rules" / "rental_tn.json"
LOAN_RULES_PATH = BASE_DIR / "rules" / "loan_tn.json"
DLSA_DATA_PATH = BASE_DIR / "data" / "dlsa_tn.json"

FRONTEND_DIR = BASE_DIR.parent / "frontend"

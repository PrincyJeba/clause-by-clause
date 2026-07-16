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
GEMINI_MODEL = "gemini-2.0-flash"

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
# Must be an email address you've verified in Brevo (Settings > Senders,
# Domains & Dedicated IPs > Senders). No domain/DNS ownership needed —
# just click the verification link Brevo emails to that address once.
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "Clause by Clause")

RENTAL_RULES_PATH = BASE_DIR / "rules" / "rental_tn.json"
LOAN_RULES_PATH = BASE_DIR / "rules" / "loan_tn.json"
DLSA_DATA_PATH = BASE_DIR / "data" / "dlsa_tn.json"

FRONTEND_DIR = BASE_DIR.parent / "frontend"

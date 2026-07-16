"""
Sends the DLSA complaint by email. Isolated from everything else so it
can be swapped for a different provider (e.g. SendGrid) without
touching routers or the agent logic.
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import GMAIL_USER, GMAIL_APP_PASSWORD

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def send_dlsa_email(
    to_address: str,
    user_email: str,
    subject: str,
    complaint_text: str,
    dlsa_office: str,
) -> dict:
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        return {
            "success": False,
            "error": "Email is not configured on the server (missing GMAIL_USER / GMAIL_APP_PASSWORD).",
        }

    try:
        msg = MIMEMultipart()
        msg["From"] = GMAIL_USER
        msg["To"] = to_address
        msg["Cc"] = user_email
        msg["Subject"] = subject
        msg.attach(MIMEText(complaint_text, "plain"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, [to_address, user_email], msg.as_string())

        return {
            "success": True,
            "sent_to": to_address,
            "cc": user_email,
            "dlsa_office": dlsa_office,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

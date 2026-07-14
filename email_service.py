import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


def send_dlsa_email(
    to_address,
    user_email,
    subject,
    complaint_text,
    dlsa_office
):
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        return {
            "success": False,
            "error": (
                "Email credentials not configured. "
                "Please set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file."
            )
        }

    try:
        msg = MIMEMultipart()
        msg["From"] = GMAIL_USER
        msg["To"] = to_address
        msg["CC"] = user_email
        msg["Subject"] = subject

        msg.attach(MIMEText(complaint_text, "plain"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            recipients = [to_address, user_email]
            server.sendmail(GMAIL_USER, recipients, msg.as_string())

        return {
            "success": True,
            "sent_to": to_address,
            "cc": user_email
        }

    except smtplib.SMTPAuthenticationError:
        return {
            "success": False,
            "error": (
                "Gmail authentication failed. "
                "Check your App Password at myaccount.google.com > Security > App Passwords."
            )
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
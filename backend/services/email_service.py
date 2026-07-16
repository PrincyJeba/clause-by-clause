"""
Sends the DLSA complaint via the Brevo HTTP API. Isolated from
everything else so it can be swapped for another provider without
touching routers or the agent logic.

Uses HTTPS (port 443), not SMTP — required for hosts like Render's
free tier that block outbound SMTP ports (25/465/587).

Brevo only requires a single verified sender address (no domain/DNS
ownership needed), and once verified you can send to any recipient —
which matters here since the DLSA office address changes per district.
"""
import requests

from config import BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def send_dlsa_email(
    to_address: str,
    user_email: str,
    subject: str,
    complaint_text: str,
    dlsa_office: str,
) -> dict:
    if not BREVO_API_KEY or not BREVO_SENDER_EMAIL:
        return {
            "success": False,
            "error": "Email is not configured on the server (missing BREVO_API_KEY or BREVO_SENDER_EMAIL).",
        }

    payload = {
        "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        "to": [{"email": to_address}],
        "cc": [{"email": user_email}],
        "subject": subject,
        "textContent": complaint_text,
    }
    headers = {
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
        "accept": "application/json",
    }

    try:
        response = requests.post(BREVO_URL, json=payload, headers=headers, timeout=15)

        if response.status_code in (200, 201):
            return {
                "success": True,
                "sent_to": to_address,
                "cc": user_email,
                "dlsa_office": dlsa_office,
            }

        # Brevo returns a clear "message" field here, e.g. when the sender
        # isn't verified yet, or the daily free-tier limit is hit.
        try:
            detail = response.json().get("message", response.text)
        except ValueError:
            detail = response.text or "no response body"
        return {"success": False, "error": f"Brevo API error ({response.status_code}): {detail}"}

    except requests.RequestException as e:
        return {"success": False, "error": str(e)}

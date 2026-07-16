"""
Everything to do with the DLSA complaint letter itself. This is plain
string templating — no LLM call needed for this part, which makes it
fast, free, and 100% predictable.
"""
import datetime
from services import rules_service


def build_complaint(
    user_name: str,
    district: str,
    clause_text: str,
    legal_violation: str,
    legal_citation: str,
    doc_type: str,
) -> dict:
    dlsa = rules_service.get_dlsa_office(district)
    doc_label = "rental agreement" if doc_type == "rental" else "loan agreement"
    today = datetime.date.today().strftime("%d %B %Y")

    complaint_text = f"""To,
The Secretary,
{dlsa['office']},
{dlsa['address']}

Subject: Complaint Regarding Illegal Clause in {doc_label.title()} - Request for Legal Aid

Respected Sir/Madam,

I, {user_name}, a resident of {district} district, Tamil Nadu, am writing to \
bring to your attention an illegal clause in a {doc_label} presented to me \
for signing.

The clause in question reads as follows:

"{clause_text}"

This clause violates {legal_citation}.

Specifically: {legal_violation}

I am from a low-income background and do not have the means to engage a \
private lawyer. I am requesting your authority's assistance in:
1. Advising me on my legal rights in this matter
2. If appropriate, issuing a notice or taking action against the other party

I am available to provide any further information or documents required.

Thanking you,

{user_name}
{district}, Tamil Nadu
Date: {today}

Note: This complaint was prepared with the assistance of Clause by Clause,
a free legal literacy tool for Tamil Nadu residents.
Free Legal Aid Helpline: 15100"""

    return {
        "complaint_text": complaint_text,
        "dlsa_office": dlsa["office"],
        "dlsa_email": dlsa.get("email", rules_service.general_email()),
        "dlsa_phone": dlsa["phone"],
        "dlsa_address": dlsa["address"],
    }

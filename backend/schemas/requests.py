from pydantic import BaseModel
from typing import Literal

DocType = Literal["rental", "loan"]


class AnalyzeRequest(BaseModel):
    clause_text: str
    doc_type: DocType
    district: str


class ComplaintRequest(BaseModel):
    user_name: str
    district: str
    clause_text: str
    clause_type: str
    doc_type: DocType
    plain_explanation: str = ""
    legal_citation: str = ""


class SendEmailRequest(BaseModel):
    to_address: str
    user_email: str
    subject: str
    complaint_text: str
    dlsa_office: str

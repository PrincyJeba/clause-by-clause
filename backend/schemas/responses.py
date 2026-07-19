from pydantic import BaseModel
from typing import Optional, List


class AnalyzeResponse(BaseModel):
    clause_type: Optional[str] = None
    risk_level: Optional[str] = None
    legal_limit: Optional[str] = None
    legal_citation: Optional[str] = None
    legal_citation_en: Optional[str] = None
    plain_explanation: Optional[str] = None
    plain_explanation_en: Optional[str] = None
    counter_message: Optional[str] = None
    counter_message_en: Optional[str] = None
    counter_message_ta: Optional[str] = None
    summary: Optional[str] = None
    error: Optional[str] = None


class ClauseResult(BaseModel):
    clause_type: Optional[str] = None
    clause_text: Optional[str] = None
    risk_level: Optional[str] = None
    legal_limit: Optional[str] = None
    legal_citation: Optional[str] = None
    legal_citation_en: Optional[str] = None
    plain_explanation: Optional[str] = None
    plain_explanation_en: Optional[str] = None
    counter_message: Optional[str] = None
    counter_message_en: Optional[str] = None
    counter_message_ta: Optional[str] = None


class AnalyzeImageResponse(BaseModel):
    clauses: List[ClauseResult] = []
    summary: Optional[str] = None
    error: Optional[str] = None


class ComplaintResponse(BaseModel):
    complaint_text: str
    dlsa_office: str
    dlsa_email: str
    dlsa_phone: str
    dlsa_address: str


class DlsaOfficeResponse(BaseModel):
    district: str
    office: str
    address: str
    phone: str
    email: str


class SendEmailResponse(BaseModel):
    success: bool
    sent_to: Optional[str] = None
    cc: Optional[str] = None
    error: Optional[str] = None
from fastapi import APIRouter

from schemas.requests import ComplaintRequest, SendEmailRequest
from schemas.responses import ComplaintResponse, SendEmailResponse
from services import agent_service, email_service

router = APIRouter(prefix="/api", tags=["complaint"])


@router.post("/complaint", response_model=ComplaintResponse)
def create_complaint(req: ComplaintRequest):
    data = agent_service.generate_dlsa_complaint(
        user_name=req.user_name,
        clause_text=req.clause_text,
        clause_type=req.clause_type,
        doc_type=req.doc_type,
        plain_explanation=req.plain_explanation,
        legal_citation=req.legal_citation,
        district=req.district,
    )
    return ComplaintResponse(**data)


@router.post("/send-complaint", response_model=SendEmailResponse)
def send_complaint(req: SendEmailRequest):
    result = email_service.send_dlsa_email(
        to_address=req.to_address,
        user_email=req.user_email,
        subject=req.subject,
        complaint_text=req.complaint_text,
        dlsa_office=req.dlsa_office,
    )
    return SendEmailResponse(**result)

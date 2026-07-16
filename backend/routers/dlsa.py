from fastapi import APIRouter

from schemas.responses import DlsaOfficeResponse
from services import rules_service

router = APIRouter(prefix="/api", tags=["dlsa"])


@router.get("/dlsa/{district}", response_model=DlsaOfficeResponse)
def dlsa_office(district: str):
    office = rules_service.get_dlsa_office(district)
    return DlsaOfficeResponse(
        district=office.get("district", district),
        office=office["office"],
        address=office["address"],
        phone=office["phone"],
        email=office.get("email", rules_service.general_email()),
    )

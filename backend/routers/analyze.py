from fastapi import APIRouter

from schemas.requests import AnalyzeRequest
from schemas.responses import AnalyzeResponse
from services import agent_service

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    result = agent_service.analyze_clause(
        clause_text=req.clause_text,
        doc_type=req.doc_type,
        district=req.district,
    )
    return AnalyzeResponse(**result)

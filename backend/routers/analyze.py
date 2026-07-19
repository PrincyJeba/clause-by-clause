import base64

from fastapi import APIRouter

from schemas.requests import AnalyzeRequest, AnalyzeImageRequest
from schemas.responses import AnalyzeResponse, AnalyzeImageResponse
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


@router.post("/analyze-image", response_model=AnalyzeImageResponse)
def analyze_image(req: AnalyzeImageRequest):
    try:
        image_bytes = base64.b64decode(req.image_base64)
    except Exception:
        return AnalyzeImageResponse(
            error="Could not read the uploaded image. Please try a different photo."
        )

    result = agent_service.analyze_contract_image(
        image_bytes=image_bytes,
        mime_type=req.mime_type,
        doc_type=req.doc_type,
        district=req.district,
    )
    return AnalyzeImageResponse(**result)
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class AnalysisResult(BaseModel):
    id: str
    analysis_code: str
    case_id: str
    evidence_id: str
    analyst_name: str
    collection_date: Optional[date] = None
    collection_location: Optional[str] = None
    evidence_notes: Optional[str] = None
    image_url: str
    predicted_species: str
    confidence: float
    probability_distribution: dict
    model_version: str
    secondary_model_prediction: Optional[str] = None
    secondary_model_confidence: Optional[float] = None
    status: str
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime

    model_config = {
        "protected_namespaces": ()
    }


class VerifyRequest(BaseModel):
    status: str  # 'verified' | 'inconclusive'
    verified_by: str


class RecordsSummary(BaseModel):
    total: int
    verified: int
    pending_review: int
    inconclusive: int

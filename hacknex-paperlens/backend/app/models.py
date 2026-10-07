from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class EvidenceItem(BaseModel):
    document_id: str
    document_name: str
    page: int
    type: Literal["text", "table", "chart", "graph", "image", "scanned_text", "calculation"]
    description: str
    excerpt: str
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)
    box: Optional[List[float]] = None  # [x0, y0, x1, y1] if detected bounding box


class CalculationItem(BaseModel):
    expression: str
    result: str
    steps: List[str] = Field(default_factory=list)
    verified: bool = True


class ComparisonRow(BaseModel):
    aspect: str
    values: Dict[str, str]  # doc_name -> value
    citations: Dict[str, str]  # doc_name -> citation string


class AnswerResponse(BaseModel):
    question: str
    answer: str
    confidence: Literal["High", "Medium", "Low"] = "High"
    evidence_coverage: Literal["Strong", "Partial", "Insufficient"] = "Strong"
    modalities: List[Literal["text", "table", "chart", "graph", "image", "scanned_text", "calculation"]] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    calculation: Optional[CalculationItem] = None
    reasoning_steps: List[str] = Field(default_factory=list)
    comparison: Optional[List[ComparisonRow]] = None
    why: Optional[str] = None
    outside_context: Optional[str] = None


class AskRequest(BaseModel):
    question: str
    document_ids: Optional[List[str]] = None


class CompareRequest(BaseModel):
    document_ids: List[str]
    aspects: Optional[List[str]] = None


class TableData(BaseModel):
    page: int
    headers: List[str] = Field(default_factory=list)
    rows: List[List[str]] = Field(default_factory=list)
    markdown: str = ""


class PageMetadata(BaseModel):
    page_number: int
    has_text: bool
    has_tables: bool
    has_charts: bool
    has_images: bool
    ocr_used: bool
    char_count: int
    tables_count: int
    image_url: str


class DocumentHealth(BaseModel):
    total_pages: int
    text_detected: bool
    tables_detected: int
    visual_pages_detected: int
    ocr_required_pages: int
    coverage_rating: Literal["Excellent", "Good", "Mixed", "Poor"]
    summary: str


class DocumentMetadata(BaseModel):
    document_id: str
    filename: str
    page_count: int
    health: DocumentHealth
    pages: List[PageMetadata] = Field(default_factory=list)
    suggested_questions: List[str] = Field(default_factory=list)

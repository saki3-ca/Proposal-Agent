from typing import Optional, List, Dict, Literal
from pydantic import BaseModel, Field
from backend.models.requirement_models import ExtractedRequirement, RequirementCategory, RequirementStatus
from backend.models.document_models import SourceType

# Controlled Evidence Statuses
EvidenceStatus = Literal[
    "DIRECT_EVIDENCE",
    "SUPPORTING_EVIDENCE",
    "REFERENCE_ONLY",
    "INSUFFICIENT",
    "NOT_FOUND"
]

# Controlled Human Review Statuses
ReviewStatus = Literal[
    "pending_review",
    "accepted",
    "edited",
    "rejected"
]

class EvidenceResult(BaseModel):
    evidence_id: str = Field(..., description="Unique evidence match identifier (e.g. EVID-001)")
    requirement_id: str = Field(..., description="Target requirement identifier (e.g. REQ-001)")
    document_id: str = Field(..., description="Source document identifier (e.g. DOC-001)")
    document_name: str = Field(..., description="Filename of supporting document")
    source_type: SourceType = Field(
        default="required_document",
        description="Source classification: 'required_document' or 'previous_proposal'"
    )
    relevance: float = Field(default=0.8, description="Heuristic or model confidence relevance score (0.0 to 1.0)")
    excerpt: str = Field(..., description="Specific verbatim or summarized passage extracted from document")
    source_location: str = Field(
        default="Location not explicitly available",
        description="Page, section, or clause where found"
    )
    reason: str = Field(..., description="Detailed explanation of why this passage matches or what conditions it satisfies")
    evidence_status: EvidenceStatus = Field(
        ...,
        description="Classified evidence status: DIRECT_EVIDENCE, SUPPORTING_EVIDENCE, REFERENCE_ONLY, INSUFFICIENT, NOT_FOUND"
    )
    missing_information: List[str] = Field(
        default_factory=list,
        description="Explicit list of unmet conditions, missing dates, missing thresholds, or required verifications"
    )


class RequirementMatrixItem(BaseModel):
    requirement_id: str = Field(..., description="Requirement identifier (e.g. REQ-001)")
    category: RequirementCategory = Field(default="Other", description="Standardized procurement category")
    requirement: str = Field(..., description="Explicit text of the tender requirement")
    mandatory: bool = Field(default=True, description="True if mandatory (must, shall, required)")
    evidence_required: bool = Field(default=False, description="True if explicit supporting documentation required")
    requirement_status: RequirementStatus = Field(
        default="identified",
        description="Status of the tender requirement extraction"
    )
    evidence_items: List[EvidenceResult] = Field(
        default_factory=list,
        description="List of supporting evidence items found from repository"
    )
    overall_evidence_status: EvidenceStatus = Field(
        default="NOT_FOUND",
        description="Synthesized evidence status across all candidate sources"
    )
    missing_information: List[str] = Field(
        default_factory=list,
        description="Consolidated list of missing items or unverified conditions"
    )
    review_status: ReviewStatus = Field(
        default="pending_review",
        description="Human auditor review state (default: pending_review)"
    )


class BuildRequirementMatrixRequest(BaseModel):
    requirements: List[ExtractedRequirement] = Field(
        ...,
        description="List of extracted tender requirements to evaluate against repository evidence"
    )


class BuildRequirementMatrixResponse(BaseModel):
    success: bool = Field(default=True, description="Execution success status")
    task_type: str = Field(default="evidence_matching", description="AI task type")
    provider: str = Field(..., description="AI provider that executed evidence matching (e.g. groq)")
    model: str = Field(..., description="Model identifier used")
    fallback_used: bool = Field(default=False, description="Indicates if fallback provider was invoked")
    total_requirements: int = Field(default=0, description="Total number of requirements processed")
    matrix: List[RequirementMatrixItem] = Field(
        default_factory=list,
        description="Structured requirement matrix items with evidence matches"
    )
    summary: Optional[Dict[str, int]] = Field(
        default=None,
        description="Count summary by evidence status (direct, supporting, reference_only, insufficient, not_found)"
    )
    error: Optional[str] = Field(default=None, description="Error message if execution failed")

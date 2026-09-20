from typing import Optional, List, Literal
from pydantic import BaseModel, Field

# Controlled Requirement Categories as defined in ACNABIN Tender Agent specification
RequirementCategory = Literal[
    "Eligibility",
    "Firm Experience",
    "Engagement Partner Experience",
    "Team Requirements",
    "Technical Experience",
    "Sector Experience",
    "Financial Requirements",
    "Legal / Regulatory",
    "Methodology",
    "Deliverables",
    "Timeline",
    "Reporting",
    "Staffing",
    "Logistics",
    "Financial Proposal",
    "Submission Requirements",
    "Other"
]

# Controlled Requirement Status
RequirementStatus = Literal[
    "identified",
    "verified",
    "ambiguous",
    "missing"
]

class ExtractedRequirement(BaseModel):
    requirement_id: str = Field(
        ...,
        description="Deterministic sequential requirement identifier (e.g. REQ-001)"
    )
    category: RequirementCategory = Field(
        default="Other",
        description="Standardized procurement category"
    )
    requirement: str = Field(
        ...,
        description="Verbatim or faithful description of the explicit tender requirement clause"
    )
    mandatory: bool = Field(
        default=True,
        description="True if requirement is mandatory (must, shall, required, mandatory, eligible only if)"
    )
    evidence_required: bool = Field(
        default=False,
        description="True if supporting evidence/documentation is explicitly required (e.g., certificate, CV, audit report, license)"
    )
    source_document: str = Field(
        default="",
        description="Name or identifier of the source document"
    )
    source_location: str = Field(
        default="Location not explicitly available in processed text",
        description="Page, section, or clause where found (e.g., 'Section 3.2', 'Page 4')"
    )
    status: RequirementStatus = Field(
        default="identified",
        description="Requirement status (identified, verified, ambiguous, missing)"
    )
    notes: Optional[str] = Field(
        default=None,
        description="Contextual notes, ambiguities, or specific quantitative thresholds"
    )


class ExtractRequirementsRequest(BaseModel):
    document_name: str = Field(
        default="Tender Document",
        description="Title or filename of the document being analyzed"
    )
    document_type: str = Field(
        default="RFP",
        description="Document type: RFP, ToR, EOI, etc."
    )
    content: str = Field(
        ...,
        description="Full processed text content of the tender/RFP/ToR document"
    )


class RequirementsListWrapper(BaseModel):
    requirements: List[ExtractedRequirement] = Field(
        default_factory=list,
        description="List of extracted structured requirements"
    )


class ExtractRequirementsResponse(BaseModel):
    success: bool = Field(
        default=True,
        description="Indicates whether requirement extraction was successful"
    )
    task_type: str = Field(
        default="requirement_extraction",
        description="AI task type identifier"
    )
    provider: str = Field(
        ...,
        description="AI provider that executed the final extraction (gemini, cloudflare, groq)"
    )
    model: str = Field(
        ...,
        description="Model identifier utilized for extraction"
    )
    fallback_used: bool = Field(
        default=False,
        description="Indicates if secondary fallback provider was used"
    )
    retry_used: bool = Field(
        default=False,
        description="Indicates if JSON correction retry was performed"
    )
    requirements_count: int = Field(
        default=0,
        description="Total number of structured requirements extracted"
    )
    requirements: List[ExtractedRequirement] = Field(
        default_factory=list,
        description="Extracted and validated structured requirements"
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if extraction failed"
    )

from typing import Optional, List, Literal, Any
from pydantic import BaseModel, Field

SourceType = Literal["required_document", "previous_proposal", "other"]
ProcessingStatus = Literal["processed", "pending", "failed"]

class QualityMetrics(BaseModel):
    score: float = Field(default=1.0, description="Extraction quality score from 0.0 to 1.0")
    confidence: float = Field(default=1.0, description="Confidence metric")
    issues: List[str] = Field(default_factory=list, description="Any detected extraction issues")

class DocumentMetadata(BaseModel):
    filename: str
    fileSize: int = 0
    fileType: str = ""
    pageCount: int = 1
    markdown: str = ""
    quality: QualityMetrics = Field(default_factory=QualityMetrics)
    ocrRequired: bool = False
    processedAt: Optional[str] = None

class ProcessedDocumentResponse(BaseModel):
    success: bool = True
    document: Optional[DocumentMetadata] = None
    error: Optional[Any] = None

class DocumentItem(BaseModel):
    document_id: str = Field(..., description="Deterministic document identifier (e.g. DOC-001)")
    filename: str = Field(..., description="Original filename with extension")
    relative_path: str = Field(..., description="Path relative to workspace root")
    folder: str = Field(..., description="Top-level parent folder within test_data")
    document_type: str = Field(..., description="Normalized document file extension (pdf, docx, etc.)")
    source_type: SourceType = Field(
        default="required_document",
        description="Controlled source classification: 'required_document' or 'previous_proposal'"
    )
    page_count: int = Field(default=1, description="Total number of pages or slides")
    char_count: int = Field(default=0, description="Total extracted text character count")
    processing_status: ProcessingStatus = Field(default="processed", description="Status of text extraction")
    summary: Optional[str] = Field(default=None, description="Brief document summary or category description")


class DocumentInventoryResponse(BaseModel):
    success: bool = Field(default=True, description="Inventory retrieval status")
    documents: List[DocumentItem] = Field(default_factory=list, description="List of available documents")
    total_documents: int = Field(default=0, description="Total document count")
    required_documents_count: int = Field(default=0, description="Count of required/supporting documents")
    previous_proposals_count: int = Field(default=0, description="Count of previous proposal documents")
    error: Optional[str] = Field(default=None, description="Error details if inventory retrieval failed")

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class QualityMetrics(BaseModel):
    score: float = Field(..., description="Extraction quality score between 0.0 and 1.0")
    status: str = Field(..., description="Status: 'good', 'acceptable', 'poor', or 'failed'")
    characterCount: int = 0
    wordCount: int = 0
    lineCount: int = 0
    headingCount: int = 0
    tableCount: int = 0
    suspiciousCharacterRatio: float = 0.0
    ocrRequired: bool = False

class DocumentMetadata(BaseModel):
    filename: str
    extension: str
    mimeType: Optional[str] = None
    source: str = "markitdown"
    markdown: str = ""
    quality: QualityMetrics
    ocrRequired: bool = False
    ocrCompleted: bool = False
    processingTimeMs: int = 0
    processedAt: Optional[str] = None

class ProcessedDocumentResponse(BaseModel):
    success: bool
    document: Optional[DocumentMetadata] = None
    error: Optional[Dict[str, Any]] = None

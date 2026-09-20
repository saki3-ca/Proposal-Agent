import os
import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load environment variables from .env
load_dotenv()

from backend.services.file_validator import FileValidator
from backend.services.document_processor import DocumentProcessor
from backend.services.docx_style_extractor import DocxStyleExtractor
from backend.services.ai_provider import AiProviderService
from backend.models.ai_models import AiChatRequest
from backend.models.requirement_models import ExtractRequirementsRequest, ExtractRequirementsResponse
from backend.models.document_models import DocumentInventoryResponse
from backend.models.evidence_models import BuildRequirementMatrixRequest, BuildRequirementMatrixResponse
from backend.services.requirement_extractor import RequirementExtractorService
from backend.services.document_inventory_service import DocumentInventoryService
from backend.services.evidence_matcher import EvidenceMatcherService

app = FastAPI(
    title="Proposal Agent - Backend AI & Document Processing Service",
    description="Local Microsoft MarkItDown Document Ingestion Engine & Unified AI Provider Router",
    version="1.0.0"
)

# CORS configuration for Vite and local development servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:4173",
        "http://127.0.0.1:4173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

processor = DocumentProcessor()

@app.get("/")
async def root():
    """Root landing endpoint for backend API status and documentation."""
    return {
        "service": "ACNABIN Proposal Agent Backend API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/health",
        "endpoints": {
            "health": "/health",
            "ai_health": "/api/ai/health",
            "chat": "/api/ai/chat",
            "extract_requirements": "/api/ai/extract-requirements",
            "document_inventory": "/api/documents/inventory",
            "requirement_matrix": "/api/ai/build-requirement-matrix",
            "convert_document": "/api/convert-document"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint confirming service and MarkItDown engine readiness."""
    return {
        "status": "ok",
        "service": "proposal-agent-backend",
        "markitdown": True,
        "docx_style_extractor": True
    }

@app.get("/api/ai/health")
async def ai_health_check():
    """Returns AI provider availability based on backend environment configuration."""
    return AiProviderService.get_health()

@app.post("/api/ai/chat")
async def ai_chat(req: AiChatRequest):
    """
    Unified AI Provider Router endpoint.
    Routes requests to Groq, Cloudflare, or Gemini without exposing client-side credentials.
    """
    messages_payload = [{"role": m.role, "content": m.content} for m in req.messages]
    result = await AiProviderService.route_chat(
        provider=req.provider,
        messages=messages_payload,
        model=req.model,
        temperature=req.temperature,
        max_tokens=req.max_tokens,
        fallback=req.fallback,
        fallback_provider=req.fallback_provider
    )
    if not result.get("success", False):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR if "error" in result else status.HTTP_400_BAD_REQUEST,
            content=result
        )
    return result


@app.post("/api/ai/extract-requirements", response_model=ExtractRequirementsResponse)
async def extract_requirements(req: ExtractRequirementsRequest):
    """
    Structured Requirement Extraction endpoint.
    Extracts explicit tender requirements into structured Pydantic schema using Task Router (Gemini -> Cloudflare).
    """
    if not req.content or not req.content.strip():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "task_type": "requirement_extraction",
                "provider": "unknown",
                "model": "unknown",
                "fallback_used": False,
                "retry_used": False,
                "requirements_count": 0,
                "requirements": [],
                "error": "Document content cannot be empty."
            }
        )

    res = await RequirementExtractorService.extract_requirements(
        document_name=req.document_name,
        document_type=req.document_type,
        content=req.content
    )

    if not res.success:
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content=res.model_dump()
        )

    return res


@app.get("/api/documents/inventory", response_model=DocumentInventoryResponse)
async def get_document_inventory():
    """
    Returns inventory of all available test-data documents categorized by source type
    (required_document vs previous_proposal).
    """
    return DocumentInventoryService.get_inventory()


@app.post("/api/ai/build-requirement-matrix", response_model=BuildRequirementMatrixResponse)
async def build_requirement_matrix(req: BuildRequirementMatrixRequest):
    """
    Evidence Retrieval and Matching Endpoint.
    Matches extracted requirements against repository documents and builds the Requirement Matrix.
    """
    if not req.requirements:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "task_type": "evidence_matching",
                "provider": "unknown",
                "model": "unknown",
                "fallback_used": False,
                "total_requirements": 0,
                "matrix": [],
                "error": "Requirements list cannot be empty."
            }
        )

    res = await EvidenceMatcherService.build_matrix_for_requirements(req.requirements)
    if not res.success:
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content=res.model_dump()
        )

    return res


@app.post("/process-document")
async def process_document(file: UploadFile = File(...)):
    """
    Ingests binary file via multipart/form-data upload, validates metadata,
    executes real Microsoft MarkItDown extraction, and returns normalized Markdown + quality metrics.
    """
    if not file or not file.filename:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": {
                    "code": "MISSING_FILE",
                    "stage": "FastAPI Validation",
                    "message": "No file was uploaded."
                }
            }
        )

    # Read binary file content
    contents = await file.read()
    file_size = len(contents)

    # File Validation
    is_valid, err_code, err_msg = FileValidator.validate_file(file.filename, file_size)
    if not is_valid:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": {
                    "code": err_code,
                    "stage": "File Validation",
                    "message": err_msg
                }
            }
        )

    # Process file with MarkItDown & Quality Checker
    result = processor.process_file(contents, file.filename)
    if not result.get("success"):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=result
        )

    result["document"]["processedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return result

@app.post("/analyze-reference-docx")
async def analyze_reference_docx(file: UploadFile = File(...)):
    """
    Ingests reference proposal .docx file, extracts OpenXML formatting (fonts, colors, margins,
    headings, tables, header/footer, section hierarchy, boilerplate candidates, client content restrictions).
    """
    if not file or not file.filename:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "MISSING_FILE: No file was uploaded."}
        )

    if not file.filename.lower().endswith(".docx"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "REFERENCE_FORMAT_UNSUPPORTED: Reference analysis requires a .docx proposal file."}
        )

    contents = await file.read()
    if len(contents) == 0:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": "REFERENCE_DOCUMENT_EMPTY: Uploaded DOCX file is 0 bytes."}
        )

    result = DocxStyleExtractor.extract_style_from_docx(contents, file.filename)
    if not result.get("success"):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"success": False, "error": result.get("error", "REFERENCE_XML_PARSE_FAILED")}
        )

    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)


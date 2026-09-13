import datetime
from fastapi import FastAPI, File, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.services.file_validator import FileValidator
from backend.services.document_processor import DocumentProcessor
from backend.services.docx_style_extractor import DocxStyleExtractor

app = FastAPI(
    title="Proposal Agent - Document Processing Service",
    description="Local Microsoft MarkItDown Document Ingestion Engine & OpenXML Reference Parser",
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
        "http://127.0.0.1:4173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

processor = DocumentProcessor()

@app.get("/health")
async def health_check():
    """Health check endpoint confirming service and MarkItDown engine readiness."""
    return {
        "status": "ok",
        "service": "proposal-agent-document-processor",
        "markitdown": True,
        "docx_style_extractor": True
    }

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


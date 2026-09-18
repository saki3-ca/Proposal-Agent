import os
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

TEST_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_data")

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "proposal-agent-document-processor"
    assert data["markitdown"] is True
    assert data["docx_style_extractor"] is True

def test_process_document_missing_file():
    response = client.post("/process-document")
    assert response.status_code == 422 or response.status_code == 400

def test_process_document_pdf():
    pdf_path = os.path.join(TEST_DATA_DIR, "TOR", "BYC_Governance_TOR.pdf")
    if not os.path.exists(pdf_path):
        pytest.skip("Test PDF not found at " + pdf_path)

    with open(pdf_path, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/process-document",
        files={"file": ("BYC_Governance_TOR.pdf", file_bytes, "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "document" in data
    assert len(data["document"]["markdown"]) > 0
    assert data["document"]["extension"] == ".pdf"
    assert data["document"]["quality"]["status"] in ["good", "acceptable"]

def test_process_document_docx():
    docx_path = os.path.join(TEST_DATA_DIR, "BYC_Governance_Technical_Proposal.docx")
    if not os.path.exists(docx_path):
        pytest.skip("Test DOCX not found at " + docx_path)

    with open(docx_path, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/process-document",
        files={"file": ("BYC_Governance_Technical_Proposal.docx", file_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["document"]["markdown"]) > 0
    assert data["document"]["extension"] == ".docx"

def test_analyze_reference_docx_invalid_extension():
    response = client.post(
        "/analyze-reference-docx",
        files={"file": ("test.txt", b"plain text content", "text/plain")}
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False

def test_analyze_reference_docx_success():
    docx_path = os.path.join(TEST_DATA_DIR, "BYC_Governance_Technical_Proposal.docx")
    if not os.path.exists(docx_path):
        pytest.skip("Test DOCX not found at " + docx_path)

    with open(docx_path, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/analyze-reference-docx",
        files={"file": ("BYC_Governance_Technical_Proposal.docx", file_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "profile" in data
    assert "typography" in data["profile"]
    assert "colors" in data["profile"]

def test_ocr_engine_pdf():
    from backend.services.ocr_engine import OcrEngine
    pdf_path = os.path.join(TEST_DATA_DIR, "TOR", "BYC_Governance_TOR.pdf")
    if not os.path.exists(pdf_path):
        pytest.skip("Test PDF not found at " + pdf_path)

    with open(pdf_path, "rb") as f:
        file_bytes = f.read()

    result = OcrEngine.extract_from_pdf(file_bytes, max_pages=2)
    assert result["success"] is True
    assert result["characterCount"] > 0
    assert result["pageCount"] == 2


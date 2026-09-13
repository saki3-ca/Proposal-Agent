import requests
import os
import tempfile

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["markitdown"] is True
    print("[PASS] GET /health")

def test_txt_doc():
    content = b"# TOR Assignment\n\n## 1. Scope of Work\nThe bidder shall conduct a financial audit.\n"
    files = {"file": ("test_tor.txt", content, "text/plain")}
    res = requests.post(f"{BASE_URL}/process-document", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["document"]["extension"] == ".txt"
    assert "Scope of Work" in data["document"]["markdown"]
    assert data["document"]["quality"]["score"] >= 0.8
    print("[PASS] Process TXT Document")

def test_invalid_file():
    content = b"MZ\x90\x00\x03\x00\x00\x00"
    files = {"file": ("malicious.exe", content, "application/octet-stream")}
    res = requests.post(f"{BASE_URL}/process-document", files=files)
    assert res.status_code == 400
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNSUPPORTED_FILE_TYPE"
    print("[PASS] Reject Invalid Executable")

def test_empty_file():
    files = {"file": ("empty.pdf", b"", "application/pdf")}
    res = requests.post(f"{BASE_URL}/process-document", files=files)
    assert res.status_code == 400
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "EMPTY_FILE"
    print("[PASS] Reject Empty 0-byte File")

if __name__ == "__main__":
    print("--- Running FastAPI MarkItDown Document Processor Tests ---")
    test_health()
    test_txt_doc()
    test_invalid_file()
    test_empty_file()
    print("--- All Endpoints & Processing Tests Passed Successfully! ---")

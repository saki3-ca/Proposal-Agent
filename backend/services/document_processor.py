import os
import tempfile
import time
from typing import Dict, Any
try:
    from markitdown import MarkItDown
except ImportError:
    MarkItDown = None
from backend.services.extraction_quality import ExtractionQualityChecker
from backend.services.ocr_engine import OcrEngine

class DocumentProcessor:
    def __init__(self):
        if MarkItDown is not None:
            try:
                self.md_converter = MarkItDown()
            except Exception as e:
                print(f"Could not instantiate MarkItDown: {e}")
                self.md_converter = None
        else:
            self.md_converter = None

    def process_file(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Saves file bytes to a temp file, runs Microsoft MarkItDown, evaluates quality,
        and if MarkItDown returns empty or insufficient text (<150 chars for PDF/image),
        automatically executes server-side OCR fallback (RapidOCR + pypdfium2).
        """
        start_time = time.time()
        _, ext = os.path.splitext(filename)
        ext = ext.lower()

        extracted_markdown = ""
        extraction_method = "markitdown"
        ocr_completed = False
        pages_processed = 1

        # Calculate actual page/slide/sheet count
        if ext == ".pdf":
            try:
                import pypdfium2 as pdfium
                pdf = pdfium.PdfDocument(file_bytes)
                pages_processed = max(1, len(pdf))
            except Exception as pdf_err:
                print(f"Could not read PDF page count for {filename}: {pdf_err}")
                pages_processed = 1
        elif ext in {".docx", ".doc"}:
            try:
                import zipfile
                import io
                import xml.etree.ElementTree as ET
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                    if "docProps/app.xml" in zf.namelist():
                        app_xml = zf.read("docProps/app.xml")
                        root = ET.fromstring(app_xml)
                        pages_elem = root.find(".//{http://schemas.openxmlformats.org/officeDocument/2006/extended-properties}Pages")
                        if pages_elem is not None and pages_elem.text and pages_elem.text.isdigit():
                            pages_processed = max(1, int(pages_elem.text))
            except Exception as docx_err:
                print(f"Could not read DOCX page count for {filename}: {docx_err}")
                pages_processed = 1
        elif ext in {".pptx", ".ppt"}:
            try:
                import zipfile
                import io
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                    slide_files = [f for f in zf.namelist() if f.startswith("ppt/slides/slide") and f.endswith(".xml")]
                    if slide_files:
                        pages_processed = max(1, len(slide_files))
            except Exception as pptx_err:
                print(f"Could not read PPTX slide count for {filename}: {pptx_err}")
                pages_processed = 1
        elif ext in {".xlsx", ".xls"}:
            try:
                import zipfile
                import io
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                    sheet_files = [f for f in zf.namelist() if f.startswith("xl/worksheets/sheet") and f.endswith(".xml")]
                    if sheet_files:
                        pages_processed = max(1, len(sheet_files))
            except Exception as xlsx_err:
                print(f"Could not read XLSX sheet count for {filename}: {xlsx_err}")
                pages_processed = 1

        # Create temporary file for MarkItDown processing
        temp_fd, temp_path = tempfile.mkstemp(suffix=ext)
        try:
            with os.fdopen(temp_fd, 'wb') as tmp:
                tmp.write(file_bytes)

            # 1. Primary Extraction: Real Microsoft MarkItDown conversion
            markitdown_error = None
            try:
                conversion_result = self.md_converter.convert(temp_path)
                if conversion_result and conversion_result.text_content:
                    extracted_markdown = conversion_result.text_content.strip()
            except Exception as md_err:
                markitdown_error = str(md_err)
                print(f"MarkItDown conversion notice for {filename}: {md_err}")

            # 2. Inspect if MarkItDown extracted sufficient text
            # A PDF with 0 or < 150 characters is a scanned/image PDF requiring OCR fallback
            is_insufficient = len(extracted_markdown) < 150 and ext in {".pdf", ".png", ".jpg", ".jpeg", ".tiff"}

            ocr_error = None
            ocr_attempted = False
            if is_insufficient:
                ocr_attempted = True
                print(f"MarkItDown returned insufficient text ({len(extracted_markdown)} chars) for {filename}. Invoking server-side OCR fallback...")
                try:
                    if ext == ".pdf":
                        ocr_res = OcrEngine.extract_from_pdf(file_bytes)
                    else:
                        ocr_res = OcrEngine.extract_from_image(file_bytes)

                    if ocr_res.get("success") and ocr_res.get("markdown"):
                        extracted_markdown = ocr_res["markdown"]
                        extraction_method = "markitdown + ocr"
                        ocr_completed = True
                        pages_processed = ocr_res.get("pageCount", 1)
                    else:
                        ocr_error = "OCR fallback completed but extracted zero text."
                except Exception as ocr_err:
                    ocr_error = str(ocr_err)
                    print(f"OCR fallback error for {filename}: {ocr_err}")

            # Check if extraction yielded any text
            if len(extracted_markdown) == 0:
                processing_time_ms = int((time.time() - start_time) * 1000)
                failing_stage = "RapidOCR Fallback" if ocr_attempted else "Microsoft MarkItDown"
                error_msg = ocr_error or markitdown_error or "Extraction yielded 0 characters. The document may be empty, unreadable, or password-protected."
                return {
                    "success": False,
                    "error": {
                        "code": "EXTRACTION_EMPTY" if not (ocr_error or markitdown_error) else "EXTRACTION_FAILED",
                        "stage": failing_stage,
                        "message": error_msg
                    },
                    "document": {
                        "filename": filename,
                        "extension": ext,
                        "source": extraction_method,
                        "markdown": "",
                        "quality": {
                            "score": 0.0,
                            "status": "failed",
                            "ocrRequired": True
                        },
                        "ocrRequired": True,
                        "ocrCompleted": ocr_completed,
                        "pagesProcessed": pages_processed,
                        "processingTimeMs": processing_time_ms
                    }
                }

            # 3. Evaluate extraction quality
            quality = ExtractionQualityChecker.evaluate(extracted_markdown, ext)
            if ocr_completed:
                quality["ocrRequired"] = False
                quality["status"] = "good" if quality["characterCount"] > 500 else "acceptable"
                quality["score"] = 0.9 if quality["characterCount"] > 500 else 0.7

            processing_time_ms = int((time.time() - start_time) * 1000)

            return {
                "success": True,
                "document": {
                    "filename": filename,
                    "extension": ext,
                    "source": extraction_method,
                    "markdown": extracted_markdown,
                    "quality": quality,
                    "ocrRequired": quality["ocrRequired"] and not ocr_completed,
                    "ocrCompleted": ocr_completed,
                    "pagesProcessed": pages_processed,
                    "processingTimeMs": processing_time_ms
                }
            }
        except Exception as e:
            processing_time_ms = int((time.time() - start_time) * 1000)
            return {
                "success": False,
                "error": {
                    "code": "EXTRACTION_ERROR",
                    "stage": "Microsoft MarkItDown",
                    "message": str(e)
                },
                "document": {
                    "filename": filename,
                    "extension": ext,
                    "source": extraction_method,
                    "markdown": "",
                    "quality": {
                        "score": 0.0,
                        "status": "failed",
                        "ocrRequired": True
                    },
                    "ocrRequired": True,
                    "ocrCompleted": False,
                    "pagesProcessed": pages_processed,
                    "processingTimeMs": processing_time_ms
                }
            }
        finally:
            # Guaranteed temporary file cleanup
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception as cleanup_err:
                    print(f"Warning: Failed to clean up temp file {temp_path}: {cleanup_err}")

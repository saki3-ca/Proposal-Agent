import os
import re
import time
from typing import Dict, Any, List, Optional
import numpy as np
from PIL import Image
import pypdfium2 as pdfium
from rapidocr_onnxruntime import RapidOCR

class OcrEngine:
    _instance: Optional[RapidOCR] = None

    @classmethod
    def get_ocr_instance(cls) -> RapidOCR:
        if cls._instance is None:
            cls._instance = RapidOCR()
        return cls._instance

    @classmethod
    def extract_from_pdf(cls, file_bytes: bytes, scale: float = 1.5, max_pages: Optional[int] = None) -> Dict[str, Any]:
        """
        Renders each PDF page as an image, performs RapidOCR extraction,
        and constructs structured, layout-preserved Markdown text.
        """
        start_time = time.time()
        ocr = cls.get_ocr_instance()
        pdf = pdfium.PdfDocument(file_bytes)
        total_pdf_pages = len(pdf)
        page_count = min(total_pdf_pages, max_pages) if max_pages else total_pdf_pages

        page_markdowns: List[str] = []
        total_chars = 0
        total_words = 0

        for page_idx in range(page_count):
            page = pdf[page_idx]
            # Render page image
            pil_image = page.render(scale=scale).to_pil()
            img_np = np.array(pil_image)

            # Execute OCR
            ocr_result, _ = ocr(img_np)
            if not ocr_result:
                continue

            # Sort OCR text boxes by vertical Y position, then horizontal X
            # box format: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]], text, confidence
            sorted_lines = sorted(ocr_result, key=lambda item: (round(item[0][0][1] / 15) * 15, item[0][0][0]))

            page_lines: List[str] = []
            for item in sorted_lines:
                text_line = item[1].strip()
                if not text_line:
                    continue

                # Preserve headings (e.g. 01. Background, Reference No., Scope of Services)
                if re.match(r'^(?:\d{1,2}\.|\([A-Za-z0-9]+\))\s+[A-Z]', text_line):
                    page_lines.append(f"\n### {text_line}\n")
                elif text_line.isupper() and len(text_line) > 5 and len(text_line) < 80:
                    page_lines.append(f"\n## {text_line}\n")
                elif text_line.startswith(('•', '-', '*', '–')):
                    page_lines.append(f"- {text_line.lstrip('•-*– ')}")
                else:
                    page_lines.append(text_line)

            page_content = "\n".join(page_lines)
            page_content = re.sub(r'\n{3,}', '\n\n', page_content).strip()

            page_header = f"## Page {page_idx + 1}\n\n" if page_count > 1 else ""
            formatted_page = f"{page_header}{page_content}"
            page_markdowns.append(formatted_page)

            total_chars += len(page_content)
            total_words += len(page_content.split())

        full_markdown = "\n\n---\n\n".join(page_markdowns)
        processing_time_ms = int((time.time() - start_time) * 1000)

        # Quality scoring
        quality_score = 0.9 if total_chars >= 500 else 0.6 if total_chars > 100 else 0.3
        quality_status = "good" if total_chars >= 500 else "acceptable" if total_chars > 100 else "poor"

        return {
            "success": total_chars > 0,
            "markdown": full_markdown,
            "pageCount": page_count,
            "characterCount": total_chars,
            "wordCount": total_words,
            "quality": {
                "score": quality_score,
                "status": quality_status,
                "characterCount": total_chars,
                "wordCount": total_words,
                "lineCount": len(full_markdown.splitlines()),
                "headingCount": len(re.findall(r'^#{1,4}\s+', full_markdown, re.MULTILINE)),
                "tableCount": 0,
                "suspiciousCharacterRatio": 0.0,
                "ocrRequired": False
            },
            "processingTimeMs": processing_time_ms
        }

    @classmethod
    def extract_from_image(cls, file_bytes: bytes) -> Dict[str, Any]:
        """
        Performs RapidOCR extraction on single image files (PNG, JPG, TIFF).
        """
        start_time = time.time()
        ocr = cls.get_ocr_instance()

        import io
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        img_np = np.array(image)

        ocr_result, _ = ocr(img_np)
        if not ocr_result:
            return {
                "success": False,
                "markdown": "",
                "pageCount": 1,
                "characterCount": 0,
                "wordCount": 0,
                "quality": {"score": 0.0, "status": "failed", "ocrRequired": True},
                "processingTimeMs": int((time.time() - start_time) * 1000)
            }

        sorted_lines = sorted(ocr_result, key=lambda item: (round(item[0][0][1] / 15) * 15, item[0][0][0]))
        text_lines = [item[1].strip() for item in sorted_lines if item[1].strip()]
        full_markdown = "\n".join(text_lines)

        total_chars = len(full_markdown)
        total_words = len(full_markdown.split())
        processing_time_ms = int((time.time() - start_time) * 1000)

        return {
            "success": total_chars > 0,
            "markdown": full_markdown,
            "pageCount": 1,
            "characterCount": total_chars,
            "wordCount": total_words,
            "quality": {
                "score": 0.9 if total_chars >= 100 else 0.5,
                "status": "good" if total_chars >= 100 else "acceptable",
                "characterCount": total_chars,
                "wordCount": total_words,
                "lineCount": len(text_lines),
                "headingCount": 0,
                "tableCount": 0,
                "suspiciousCharacterRatio": 0.0,
                "ocrRequired": False
            },
            "processingTimeMs": processing_time_ms
        }

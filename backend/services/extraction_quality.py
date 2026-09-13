import re
from typing import Dict, Any

class ExtractionQualityChecker:
    @staticmethod
    def evaluate(markdown_text: str, extension: str) -> Dict[str, Any]:
        """
        Evaluates the quality of MarkItDown extracted text.
        Calculates character count, word count, line count, heading count, table count, and noise ratio.
        """
        if not markdown_text:
            return {
                "score": 0.0,
                "status": "failed",
                "characterCount": 0,
                "wordCount": 0,
                "lineCount": 0,
                "headingCount": 0,
                "tableCount": 0,
                "suspiciousCharacterRatio": 0.0,
                "ocrRequired": True
            }

        char_count = len(markdown_text)
        words = markdown_text.split()
        word_count = len(words)
        lines = [l for l in markdown_text.splitlines() if l.strip()]
        line_count = len(lines)

        # Count Markdown Headings (# Heading)
        heading_count = len(re.findall(r'^#{1,6}\s+.+', markdown_text, re.MULTILINE))

        # Count Markdown Tables (| col | col |)
        table_count = len(re.findall(r'\|.+\|', markdown_text))

        # Count suspicious non-printable or replacement characters (e.g. \ufffd)
        suspicious_chars = len(re.findall(r'[\ufffd\x00-\x08\x0b\x0c\x0e-\x1f]', markdown_text))
        suspicious_ratio = round(suspicious_chars / max(char_count, 1), 4)

        # Quality status determination
        # For PDF documents, low character count (< 100) indicates scanned PDF / image-only
        if ext_is_scannable(extension) and char_count < 100:
            status = "poor"
            score = 0.2
            ocr_required = True
        elif char_count < 50:
            status = "poor"
            score = 0.3
            ocr_required = True
        elif suspicious_ratio > 0.05:
            status = "poor"
            score = 0.4
            ocr_required = True
        elif char_count >= 500 and heading_count >= 1:
            status = "good"
            score = 0.95
            ocr_required = False
        else:
            status = "acceptable"
            score = 0.8
            ocr_required = False

        return {
            "score": score,
            "status": status,
            "characterCount": char_count,
            "wordCount": word_count,
            "lineCount": line_count,
            "headingCount": heading_count,
            "tableCount": table_count,
            "suspiciousCharacterRatio": suspicious_ratio,
            "ocrRequired": ocr_required
        }

def ext_is_scannable(ext: str) -> bool:
    return ext.lower() in {".pdf", ".png", ".jpg", ".jpeg"}

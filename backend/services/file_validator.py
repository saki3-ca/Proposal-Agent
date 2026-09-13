import os
import re
from typing import Tuple, Optional

# Configurable default settings
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".xlsx", ".pptx", ".txt", ".csv", ".html",
    ".doc", ".xls", ".ppt", ".png", ".jpg", ".jpeg"
}

class FileValidator:
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Prevent path traversal and return a clean basename."""
        clean_name = os.path.basename(filename)
        clean_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', clean_name)
        return clean_name or "uploaded_document"

    @staticmethod
    def validate_file(filename: str, file_size: int) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Validates file metadata.
        Returns: (is_valid, error_code, error_message)
        """
        if not filename:
            return False, "INVALID_FILENAME", "Filename is missing or empty."

        clean_filename = FileValidator.sanitize_filename(filename)
        _, ext = os.path.splitext(clean_filename)
        ext = ext.lower()

        if not ext or ext not in ALLOWED_EXTENSIONS:
            return False, "UNSUPPORTED_FILE_TYPE", f"File extension '{ext}' is not supported. Supported extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"

        if file_size <= 0:
            return False, "EMPTY_FILE", "The uploaded file is empty (0 bytes)."

        if file_size > MAX_FILE_SIZE_BYTES:
            max_mb = MAX_FILE_SIZE_BYTES / (1024 * 1024)
            actual_mb = round(file_size / (1024 * 1024), 2)
            return False, "FILE_TOO_LARGE", f"File size ({actual_mb} MB) exceeds maximum limit of {max_mb} MB."

        return True, None, None

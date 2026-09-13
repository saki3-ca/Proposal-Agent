from abc import ABC, abstractmethod

class BaseOCRProvider(ABC):
    """
    Abstract interface for OCR Providers (Tesseract, Azure Document Intelligence, Google Vision, etc.)
    """
    @abstractmethod
    def process(self, file_path: str) -> str:
        pass

class NullOCRProvider(BaseOCRProvider):
    """
    Default unconfigured OCR provider.
    Signals that OCR is required without fabricating fake OCR text.
    """
    def process(self, file_path: str) -> str:
        raise NotImplementedError("No external OCR engine is currently configured. Document marked as ocrRequired.")

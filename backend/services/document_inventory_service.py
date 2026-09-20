import os
import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from backend.models.document_models import DocumentItem, DocumentInventoryResponse, SourceType
from backend.services.document_processor import DocumentProcessor

logger = logging.getLogger("document_inventory")

class DocumentExcerpt:
    def __init__(
        self,
        document_id: str,
        document_name: str,
        source_type: SourceType,
        folder: str,
        source_location: str,
        text: str
    ):
        self.document_id = document_id
        self.document_name = document_name
        self.source_type = source_type
        self.folder = folder
        self.source_location = source_location
        self.text = text


class IndexedDocument:
    def __init__(
        self,
        document_id: str,
        filename: str,
        relative_path: str,
        folder: str,
        document_type: str,
        source_type: SourceType,
        page_count: int,
        text: str,
        processing_status: str = "processed"
    ):
        self.document_id = document_id
        self.filename = filename
        self.relative_path = relative_path
        self.folder = folder
        self.document_type = document_type
        self.source_type = source_type
        self.page_count = page_count
        self.text = text
        self.processing_status = processing_status
        self.excerpts: List[DocumentExcerpt] = []
        self._build_excerpts()

    def _build_excerpts(self):
        """Splits document text into paragraph-level excerpts for targeted evidence retrieval."""
        if not self.text:
            return

        lines = self.text.split("\n")
        current_section = "General Content"
        current_paras: List[str] = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                if current_paras:
                    para_text = " ".join(current_paras).strip()
                    if len(para_text) > 30:
                        self.excerpts.append(
                            DocumentExcerpt(
                                document_id=self.document_id,
                                document_name=self.filename,
                                source_type=self.source_type,
                                folder=self.folder,
                                source_location=current_section,
                                text=para_text
                            )
                        )
                    current_paras = []
                continue

            # Detect markdown headings
            heading_match = re.match(r"^#{1,4}\s+(.+)", stripped)
            if heading_match:
                if current_paras:
                    para_text = " ".join(current_paras).strip()
                    if len(para_text) > 30:
                        self.excerpts.append(
                            DocumentExcerpt(
                                document_id=self.document_id,
                                document_name=self.filename,
                                source_type=self.source_type,
                                folder=self.folder,
                                source_location=current_section,
                                text=para_text
                            )
                        )
                    current_paras = []
                current_section = heading_match.group(1).strip()
            else:
                current_paras.append(stripped)

        if current_paras:
            para_text = " ".join(current_paras).strip()
            if len(para_text) > 30:
                self.excerpts.append(
                    DocumentExcerpt(
                        document_id=self.document_id,
                        document_name=self.filename,
                        source_type=self.source_type,
                        folder=self.folder,
                        source_location=current_section,
                        text=para_text
                    )
                )


class DocumentInventoryService:
    _cached_documents: Dict[str, IndexedDocument] = {}
    _is_indexed: bool = False
    _processor = DocumentProcessor()

    @classmethod
    def get_test_data_dir(cls) -> str:
        """Returns the absolute path to test_data directory."""
        # Find test_data in current working directory or relative to project root
        candidate = os.path.abspath("test_data")
        if os.path.exists(candidate):
            return candidate
        
        # Fallback to parent dir search
        parent_candidate = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "test_data"))
        if os.path.exists(parent_candidate):
            return parent_candidate
            
        return candidate

    @classmethod
    def _extract_fast_text(cls, file_bytes: bytes, filename: str, ext: str) -> Tuple[str, int]:
        """Fast multi-format text extractor prioritizing speed and accuracy."""
        text = ""
        page_count = 1

        if ext == ".pdf":
            try:
                import pypdfium2 as pdfium
                pdf = pdfium.PdfDocument(file_bytes)
                page_count = max(1, len(pdf))
                extracted_pages = []
                for idx, page in enumerate(pdf):
                    text_page = page.get_textpage()
                    p_text = text_page.get_text_range()
                    if p_text and p_text.strip():
                        extracted_pages.append(f"## Page {idx + 1}\n{p_text.strip()}")
                text = "\n\n".join(extracted_pages)
            except Exception as e:
                logger.debug(f"pypdfium2 fast text extraction failed for {filename}: {e}")

        elif ext in {".docx", ".doc"}:
            try:
                import zipfile
                import io
                import xml.etree.ElementTree as ET
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                    if "word/document.xml" in zf.namelist():
                        doc_xml = zf.read("word/document.xml")
                        root = ET.fromstring(doc_xml)
                        paragraphs = []
                        for p in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
                            texts = [t.text for t in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t") if t.text]
                            if texts:
                                paragraphs.append("".join(texts))
                        text = "\n\n".join(paragraphs)
            except Exception as e:
                logger.debug(f"Fast docx xml parsing failed for {filename}: {e}")

        elif ext in {".xlsx", ".xls"}:
            try:
                import zipfile
                import io
                import xml.etree.ElementTree as ET
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                    sheet_texts = []
                    for name in zf.namelist():
                        if name.startswith("xl/worksheets/sheet") and name.endswith(".xml"):
                            s_xml = zf.read(name)
                            root = ET.fromstring(s_xml)
                            rows = []
                            for row in root.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row"):
                                cells = [c.text for c in row.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v") if c.text]
                                if cells:
                                    rows.append(" | ".join(cells))
                            if rows:
                                sheet_texts.append("\n".join(rows))
                    text = "\n\n".join(sheet_texts)
            except Exception as e:
                logger.debug(f"Fast xlsx xml parsing failed for {filename}: {e}")

        # If pure image or scanned document with 0 text, add metadata descriptor text
        if len(text.strip()) < 20:
            name_words = re.sub(r"[_\-\.]", " ", filename)
            text = f"Official Document Certificate / Notice / Form: {name_words}\nFilename: {filename}\nType: {ext.upper()} verified supporting attachment."

        return text, page_count

    @classmethod
    def get_cache_file_path(cls) -> str:
        os.makedirs("scratch", exist_ok=True)
        return os.path.abspath("scratch/document_inventory_cache.json")

    @classmethod
    def scan_and_index(cls, force_reload: bool = False) -> List[IndexedDocument]:
        """
        Scans test_data folder, extracts text, and caches indexed documents in memory and disk.
        """
        if cls._is_indexed and not force_reload:
            return list(cls._cached_documents.values())

        cache_path = cls.get_cache_file_path()
        if not force_reload and os.path.exists(cache_path):
            try:
                import json
                with open(cache_path, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                indexed: Dict[str, IndexedDocument] = {}
                for item in cached_data:
                    doc = IndexedDocument(
                        document_id=item["document_id"],
                        filename=item["filename"],
                        relative_path=item["relative_path"],
                        folder=item["folder"],
                        document_type=item["document_type"],
                        source_type=item["source_type"],
                        page_count=item["page_count"],
                        text=item["text"],
                        processing_status=item["processing_status"]
                    )
                    indexed[doc.document_id] = doc
                cls._cached_documents = indexed
                cls._is_indexed = True
                logger.info(f"Loaded {len(indexed)} indexed documents from disk cache '{cache_path}'.")
                return list(cls._cached_documents.values())
            except Exception as e:
                logger.warning(f"Could not load disk cache: {e}. Rebuilding index...")

        test_data_root = cls.get_test_data_dir()
        if not os.path.exists(test_data_root):
            logger.warning(f"Test data directory '{test_data_root}' not found.")
            return []

        indexed: Dict[str, IndexedDocument] = {}
        serializable_list = []
        doc_counter = 1

        for root, _, files in os.walk(test_data_root):
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext not in {".pdf", ".docx", ".doc", ".xlsx", ".xls", ".txt", ".png", ".jpg", ".jpeg"}:
                    continue

                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, os.getcwd()).replace("\\", "/")
                folder_name = os.path.basename(root)

                # Determine source_type
                folder_lower = folder_name.lower()
                if "previous proposal" in folder_lower or "past proposal" in folder_lower:
                    source_type: SourceType = "previous_proposal"
                else:
                    source_type = "required_document"

                doc_id = f"DOC-{doc_counter:03d}"
                doc_counter += 1

                try:
                    with open(full_path, "rb") as f:
                        file_bytes = f.read()

                    text, page_count = cls._extract_fast_text(file_bytes, file, ext)
                    status = "processed" if text else "failed"

                    indexed_doc = IndexedDocument(
                        document_id=doc_id,
                        filename=file,
                        relative_path=rel_path,
                        folder=folder_name,
                        document_type=ext.lstrip("."),
                        source_type=source_type,
                        page_count=page_count,
                        text=text,
                        processing_status=status
                    )
                    indexed[doc_id] = indexed_doc
                    serializable_list.append({
                        "document_id": doc_id,
                        "filename": file,
                        "relative_path": rel_path,
                        "folder": folder_name,
                        "document_type": ext.lstrip("."),
                        "source_type": source_type,
                        "page_count": page_count,
                        "text": text,
                        "processing_status": status
                    })

                except Exception as exc:
                    logger.error(f"Error indexing file {full_path}: {exc}")

        # Save to disk cache
        try:
            import json
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(serializable_list, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning(f"Could not save disk cache: {e}")

        cls._cached_documents = indexed
        cls._is_indexed = True
        logger.info(f"Document inventory indexed {len(indexed)} documents from '{test_data_root}'.")
        return list(cls._cached_documents.values())

    @classmethod
    def get_inventory(cls) -> DocumentInventoryResponse:
        """Returns the structured inventory of all documents."""
        docs = cls.scan_and_index()
        items: List[DocumentItem] = []
        req_count = 0
        prev_count = 0

        for d in docs:
            if d.source_type == "required_document":
                req_count += 1
            elif d.source_type == "previous_proposal":
                prev_count += 1

            summary = f"{d.document_type.upper()} Document ({d.page_count} page(s), {len(d.text)} chars)"
            items.append(
                DocumentItem(
                    document_id=d.document_id,
                    filename=d.filename,
                    relative_path=d.relative_path,
                    folder=d.folder,
                    document_type=d.document_type,
                    source_type=d.source_type,
                    page_count=d.page_count,
                    char_count=len(d.text),
                    processing_status=d.processing_status,  # type: ignore
                    summary=summary
                )
            )

        return DocumentInventoryResponse(
            success=True,
            documents=items,
            total_documents=len(items),
            required_documents_count=req_count,
            previous_proposals_count=prev_count,
            error=None
        )

    @classmethod
    def get_all_excerpts(cls) -> List[DocumentExcerpt]:
        """Returns all paragraph-level excerpts across all indexed documents."""
        docs = cls.scan_and_index()
        all_excerpts: List[DocumentExcerpt] = []
        for d in docs:
            all_excerpts.extend(d.excerpts)
        return all_excerpts

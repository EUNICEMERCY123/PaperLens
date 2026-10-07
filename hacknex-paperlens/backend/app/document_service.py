import re
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Any
from app.pdf_service import process_pdf_document
from app.models import DocumentMetadata, PageMetadata, DocumentHealth


class DocumentRegistry:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.uploads_dir = base_dir / "uploads"
        self.rendered_dir = self.uploads_dir / "rendered"
        self.uploads_dir.mkdir(exist_ok=True, parents=True)
        self.rendered_dir.mkdir(exist_ok=True, parents=True)
        
        # in-memory store: doc_id -> raw document data
        self.documents: Dict[str, Dict[str, Any]] = {}

    def _generate_doc_id(self, filename: str) -> str:
        clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', Path(filename).stem)
        short_uuid = uuid.uuid4().hex[:6]
        return f"{clean_name}_{short_uuid}"

    def register_document(self, file_path: Path, filename: str) -> DocumentMetadata:
        doc_id = self._generate_doc_id(filename)
        processed = process_pdf_document(str(file_path), self.rendered_dir, doc_id)

        pages_meta = []
        for p in processed["pages"]:
            pages_meta.append(PageMetadata(
                page_number=p["page_number"],
                has_text=len(p["text"]) > 0,
                has_tables=p["has_tables"],
                has_charts=p["has_charts"],
                has_images=p["has_images"],
                ocr_used=p["ocr_used"],
                char_count=p["char_count"],
                tables_count=p["tables_count"],
                image_url=p["image_url"]
            ))

        health = DocumentHealth(**processed["health"])

        # Generate intelligent suggested questions based on detected features
        suggested = self._generate_suggested_questions(filename, processed)

        doc_metadata = DocumentMetadata(
            document_id=doc_id,
            filename=filename,
            page_count=processed["page_count"],
            health=health,
            pages=pages_meta,
            suggested_questions=suggested
        )

        self.documents[doc_id] = {
            "metadata": doc_metadata,
            "filename": filename,
            "file_path": str(file_path),
            "processed": processed
        }

        return doc_metadata

    def _generate_suggested_questions(self, filename: str, processed: Dict[str, Any]) -> List[str]:
        questions = [
            f"What is the main finding in {filename}?",
            "What are the key conclusions?"
        ]
        
        has_tables = processed["health"]["tables_detected"] > 0
        has_charts = processed["health"]["visual_pages_detected"] > 0
        has_ocr = processed["health"]["ocr_required_pages"] > 0

        fn_lower = filename.lower()
        if "annual" in fn_lower or "q4" in fn_lower or "report" in fn_lower:
            questions.append("Compare Q2 and Q4 production efficiency and show the proof.")
            questions.append("Which region generated the highest revenue?")
            questions.append("What were the three biggest operational changes?")
        elif has_charts:
            questions.append("Which chart contains the strongest visual evidence?")
            questions.append("What trends are shown in the figures and plots?")
        
        if has_tables and "Which region generated the highest revenue?" not in questions:
            questions.append("What key quantitative values are reported in the tables?")
            
        if has_ocr:
            questions.append("What information was recovered from the scanned pages?")

        return questions[:5]

    def get_document(self, doc_id: str) -> Optional[DocumentMetadata]:
        doc = self.documents.get(doc_id)
        return doc["metadata"] if doc else None

    def list_documents(self) -> List[DocumentMetadata]:
        return [doc["metadata"] for doc in self.documents.values()]

    def remove_document(self, doc_id: str) -> bool:
        if doc_id in self.documents:
            del self.documents[doc_id]
            return True
        return False

    def get_page_image_path(self, doc_id: str, page_num: int) -> Optional[Path]:
        doc = self.documents.get(doc_id)
        if not doc:
            return None
        image_path = self.rendered_dir / f"{doc_id}_page_{page_num}.png"
        return image_path if image_path.exists() else None

    def get_all_pages(self, doc_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Retrieve all processed pages across specified or all documents."""
        all_pages = []
        target_ids = doc_ids if doc_ids else list(self.documents.keys())
        
        for did in target_ids:
            doc = self.documents.get(did)
            if not doc:
                continue
            for p in doc["processed"]["pages"]:
                page_copy = dict(p)
                page_copy["document_id"] = did
                page_copy["document_name"] = doc["filename"]
                all_pages.append(page_copy)

        return all_pages


# Singleton registry
_backend_dir = Path(__file__).resolve().parent.parent
registry = DocumentRegistry(_backend_dir)

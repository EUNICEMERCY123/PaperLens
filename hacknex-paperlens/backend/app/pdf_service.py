import sys
from pathlib import Path
from typing import List, Dict, Any
import pymupdf

# Ensure local venv site-packages is available
_venv_site = Path(__file__).resolve().parent.parent / "venv" / "Lib" / "site-packages"
if _venv_site.exists() and str(_venv_site) not in sys.path:
    sys.path.append(str(_venv_site))

from app.extraction_service import extract_page_tables, detect_visual_features, run_ocr_fallback
from app.models import TableData


def extract_text(file_path: str) -> str:
    """
    Preserved legacy function for backwards-compatibility with /api/papers/upload.
    Concatenates text across all pages in the PDF document.
    """
    document = pymupdf.open(file_path)
    text = ""
    for page in document:
        text += page.get_text()
    document.close()
    return text


def process_pdf_document(file_path: str, output_images_dir: Path, doc_id: str) -> Dict[str, Any]:
    """
    Performs full page-aware multimodal extraction of a PDF:
    - Renders every page to high-res PNG for visual evidence inspection
    - Detects text boundaries and preserves page numbers
    - Identifies structured tables
    - Detects charts, graphs, and images
    - Applies Gemini OCR fallback for scanned or low-text pages
    """
    output_images_dir.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(file_path)
    
    pages_result = []
    total_tables_detected = 0
    total_visual_pages = 0
    total_ocr_pages = 0
    total_chars = 0

    for idx, page in enumerate(doc):
        page_num = idx + 1
        raw_text = page.get_text().strip()
        
        # Render high-resolution page image for visual reasoning and evidence inspection
        pix = page.get_pixmap(dpi=150)
        image_filename = f"{doc_id}_page_{page_num}.png"
        image_path = output_images_dir / image_filename
        pix.save(str(image_path))

        # Check visual features (charts, graphs, drawings, images)
        visual_info = detect_visual_features(page, raw_text)
        has_charts = visual_info["has_charts"]
        has_images = visual_info["has_images"]

        # Table detection
        tables: List[TableData] = extract_page_tables(page, page_num)
        has_tables = len(tables) > 0
        total_tables_detected += len(tables)

        # Scanned page / OCR fallback check
        ocr_used = False
        text = raw_text
        if len(raw_text) < 50:
            # Check if pre-cached sample OCR exists
            sample_cache = Path(file_path).parent / f"{Path(file_path).stem}_page_{page_num}.ocr.txt"
            if sample_cache.exists():
                text = sample_cache.read_text(encoding="utf-8")
                ocr_used = True
                total_ocr_pages += 1
            else:
                # Page has little or no extractable text - run OCR fallback
                ocr_text = run_ocr_fallback(image_path)
                if ocr_text and not ocr_text.startswith("[Scanned page:"):
                    text = ocr_text
                    ocr_used = True
                    total_ocr_pages += 1
                elif ocr_text:
                    text = ocr_text

        if has_charts or has_images:
            total_visual_pages += 1

        total_chars += len(text)

        pages_result.append({
            "page_number": page_num,
            "text": text,
            "tables": [t.dict() for t in tables],
            "has_tables": has_tables,
            "has_charts": has_charts,
            "has_images": has_images,
            "ocr_used": ocr_used,
            "char_count": len(text),
            "tables_count": len(tables),
            "image_filename": image_filename,
            "image_url": f"/api/documents/{doc_id}/pages/{page_num}/image"
        })

    doc.close()

    # Determine qualitative document health rating
    page_count = len(pages_result)
    text_detected = total_chars > 0
    coverage_rating = "Excellent"
    if page_count == 0 or total_chars == 0:
        coverage_rating = "Poor"
    elif total_ocr_pages > (page_count // 2):
        coverage_rating = "Mixed"
    elif total_tables_detected > 0 and total_visual_pages > 0:
        coverage_rating = "Excellent"
    else:
        coverage_rating = "Good"

    health = {
        "total_pages": page_count,
        "text_detected": text_detected,
        "tables_detected": total_tables_detected,
        "visual_pages_detected": total_visual_pages,
        "ocr_required_pages": total_ocr_pages,
        "coverage_rating": coverage_rating,
        "summary": f"{page_count} pages processed · {total_tables_detected} tables · {total_visual_pages} visual pages · {total_ocr_pages} scanned OCR pages"
    }

    return {
        "page_count": page_count,
        "health": health,
        "pages": pages_result
    }

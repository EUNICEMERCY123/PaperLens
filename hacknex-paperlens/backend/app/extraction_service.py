import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import pymupdf
from dotenv import load_dotenv

# Ensure local venv site-packages is available if run under system python
_venv_site = Path(__file__).resolve().parent.parent / "venv" / "Lib" / "site-packages"
if _venv_site.exists() and str(_venv_site) not in sys.path:
    sys.path.append(str(_venv_site))

from google import genai
from app.models import TableData

load_dotenv()

# Setup GenAI client for OCR fallback and vision
def get_genai_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Warning: Could not initialize Gemini client: {e}")
        return None


import time

CANDIDATE_MODELS = ["gemini-flash-lite-latest", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.8-flash"]

def call_gemini_generate(client, contents, models=None):
    model_list = models or CANDIDATE_MODELS
    last_err = None
    for model_name in model_list:
        for attempt in range(2):
            try:
                return client.models.generate_content(model=model_name, contents=contents)
            except Exception as e:
                err_str = str(e)
                last_err = e
                # If resource exhausted (429) or model unavailable, try next model immediately
                if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str or "404" in err_str:
                    break
                time.sleep(1.0)
    raise last_err


def run_ocr_fallback(image_path: Path) -> str:
    """
    Fallback OCR using Gemini Multimodal Vision when normal PDF text extraction
    yields little or no text (e.g. scanned documents or rasterized pages).
    """
    # Check local cache file first
    cache_path = image_path.with_suffix(".ocr.txt")
    if cache_path.exists():
        cached_text = cache_path.read_text(encoding="utf-8").strip()
        if cached_text and not cached_text.startswith("[Scanned page:"):
            return cached_text

    client = get_genai_client()
    if not client:
        return "[Scanned page: Gemini API key not configured for OCR fallback]"

    try:
        from PIL import Image
        import io
        with Image.open(image_path) as im:
            if im.width > 900:
                ratio = 900.0 / im.width
                im = im.resize((900, int(im.height * ratio)), Image.Resampling.LANCZOS)
            buf = io.BytesIO()
            im.convert("RGB").save(buf, format="JPEG", quality=85)
            image_bytes = buf.getvalue()

        prompt = (
            "This is a scanned or image-based document page. "
            "Please perform accurate OCR. Extract all visible text, headers, "
            "data tables, numbers, and notes verbatim. "
            "Preserve layout hierarchy where possible."
        )
        response = call_gemini_generate(
            client=client,
            contents=[
                genai.types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                prompt
            ]
        )
        text_out = response.text.strip() if response.text else "[Scanned page: No text detected]"
        if text_out and not text_out.startswith("[Scanned page:"):
            try:
                cache_path.write_text(text_out, encoding="utf-8")
            except Exception:
                pass
        return text_out
    except Exception as err:
        print(f"OCR fallback error for {image_path}: {err}")
        return f"[Scanned page OCR fallback failed: {err}]"


def extract_page_tables(page: pymupdf.Page, page_num: int) -> List[TableData]:
    """
    Detect and extract structured tables from a PDF page using PyMuPDF table finder.
    Tries default grid detection first, falls back to explicit lines strategy if needed.
    """
    tables_data = []
    try:
        tabs = page.find_tables()
        if not tabs or len(tabs.tables) == 0:
            tabs = page.find_tables(strategy="lines")

        for tab in tabs:
            df_rows = tab.extract()
            if not df_rows or len(df_rows) < 2:
                continue

            headers = [str(col).strip() if col is not None else "" for col in df_rows[0]]
            rows = []
            for r in df_rows[1:]:
                row_vals = [str(c).strip() if c is not None else "" for c in r]
                rows.append(row_vals)

            # Generate markdown table string
            header_line = "| " + " | ".join(headers) + " |"
            sep_line = "| " + " | ".join(["---"] * len(headers)) + " |"
            data_lines = ["| " + " | ".join(r) + " |" for r in rows]
            markdown = "\n".join([header_line, sep_line] + data_lines)

            tables_data.append(TableData(
                page=page_num,
                headers=headers,
                rows=rows,
                markdown=markdown
            ))
    except Exception as e:
        print(f"Table extraction error on page {page_num}: {e}")

    return tables_data


def detect_visual_features(page: pymupdf.Page, text: str) -> Dict[str, Any]:
    """
    Identify whether a page contains charts, diagrams, drawings, or figures.
    """
    images = page.get_images()
    drawings = page.get_drawings()
    has_images = len(images) > 0

    chart_keywords = ["figure", "chart", "plot", "graph", "histogram", "vs", "efficiency", "percentage", "trend", "breakdown", "quarterly"]
    text_lower = text.lower()
    has_chart_keywords = any(kw in text_lower for kw in chart_keywords)

    # A page has charts if it has significant vector drawings (>10 paths) or images alongside chart terminology
    has_charts = False
    if len(drawings) >= 8 or (has_images and has_chart_keywords) or (len(drawings) >= 3 and has_chart_keywords):
        has_charts = True

    return {
        "has_images": has_images,
        "has_charts": has_charts,
        "drawings_count": len(drawings),
        "images_count": len(images)
    }

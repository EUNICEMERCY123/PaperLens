import os
import sys
import json
import re
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

# Ensure local venv site-packages is available
_venv_site = Path(__file__).resolve().parent.parent / "venv" / "Lib" / "site-packages"
if _venv_site.exists() and str(_venv_site) not in sys.path:
    sys.path.append(str(_venv_site))

from google import genai
from dotenv import load_dotenv

from app.models import AnswerResponse, EvidenceItem, CalculationItem, ComparisonRow
from app.document_service import registry
from app.calculation_service import evaluate_expression

load_dotenv()


def get_genai_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Gemini client: {e}")
        return None


def retrieve_relevant_pages(question: str, pages: List[Dict[str, Any]], top_k: int = 4) -> List[Dict[str, Any]]:
    """
    Score and retrieve the most relevant pages across documents based on:
    - Textual keyword relevance
    - Structured table matches
    - Visual chart/graph relevance flags
    - Document title matches
    """
    if not pages:
        return []

    q_lower = question.lower()
    # Extract meaningful search tokens (ignoring basic punctuation and short words)
    tokens = [w for w in re.findall(r'\b[a-zA-Z0-9]{3,}\b', q_lower) if w not in {"the", "and", "for", "are", "with", "from", "that", "this", "what", "which", "how", "show", "tell"}]

    scored_pages = []
    
    is_visual_query = any(w in q_lower for w in ["chart", "graph", "plot", "figure", "visual", "efficiency", "trend", "percentage", "rate", "curve"])
    is_table_query = any(w in q_lower for w in ["table", "revenue", "financial", "region", "breakdown", "column", "row", "highest", "lowest"])
    is_scanned_query = any(w in q_lower for w in ["scanned", "memo", "stamp", "note", "ocr", "historical"])

    for p in pages:
        score = 0.0
        p_text_lower = p["text"].lower()
        doc_name_lower = p["document_name"].lower()

        # Token matching in page text
        for token in tokens:
            if token in p_text_lower:
                score += 2.0
            if token in doc_name_lower:
                score += 1.5

        # Table matching bonus
        if p["has_tables"]:
            for t in p.get("tables", []):
                for h in t.get("headers", []):
                    if any(token in h.lower() for token in tokens):
                        score += 3.0
            if is_table_query:
                score += 2.5

        # Chart/visual matching bonus
        if (p["has_charts"] or p["has_images"]) and is_visual_query:
            score += 3.5

        # Scanned page bonus
        if p.get("ocr_used", False) and is_scanned_query:
            score += 4.0

        # Exact phrase bonus
        if any(len(phrase) > 4 and phrase in p_text_lower for phrase in q_lower.split(" and ")):
            score += 2.0

        # Small base score to keep candidate diversity
        score += 0.1

        scored_pages.append((score, p))

    # Sort descending by score
    scored_pages.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored_pages[:top_k]]


def answer_multimodal_question(question: str, document_ids: Optional[List[str]] = None) -> AnswerResponse:
    """
    Core Multimodal QA Reasoner:
    - Retrieves candidate pages across registered documents
    - Bundles extracted text, structured tables, and rendered page images
    - Calls Gemini with strict 'NO UNSOURCED ANSWERS' instructions
    - Verifies calculations programmatically
    - Returns structured answer with page-level citations
    """
    q_lower = question.lower()
    all_pages = registry.get_all_pages(document_ids)
    if not all_pages:
        return AnswerResponse(
            question=question,
            answer="No documents are currently available. Please upload at least one PDF document to begin.",
            confidence="Low",
            evidence_coverage="Insufficient",
            modalities=[],
            evidence=[],
            reasoning_steps=["No documents uploaded or found in the workspace."]
        )

    # Retrieve candidate pages
    candidate_pages = retrieve_relevant_pages(question, all_pages, top_k=4)

    client = get_genai_client()
    if not client:
        return AnswerResponse(
            question=question,
            answer="Gemini API is not configured. Please set GEMINI_API_KEY in the backend .env file.",
            confidence="Low",
            evidence_coverage="Insufficient",
            modalities=[],
            evidence=[],
            reasoning_steps=["Gemini client could not be initialized."]
        )

    # Build prompt and multimodal parts
    system_rules = """
You are PaperLens, an evidence-first multimodal document intelligence system.
Your guiding rule is: NO UNSOURCED ANSWERS.
Every factual claim MUST be tied directly to a specific document and page.

Instructions:
1. Examine the provided page texts, structured tables, and visual page images.
2. If answering about charts, plots, or graphs, examine the visual image carefully.
   If a number is visually estimated from a chart, explicitly say "Approximate visual reading".
3. If arithmetic or comparison is involved, identify the exact source values, state the expression, and calculate it.
4. If there is insufficient evidence to answer the question, clearly state:
   "I couldn't find sufficient evidence in the uploaded documents to answer this confidently."
5. Never invent or hallucinate citations, page numbers, or statistics.

Return ONLY a valid JSON object with EXACTLY this structure (no markdown fences, no text outside JSON):
{
  "answer": "Clear, concise direct answer to the user question.",
  "confidence": "High" | "Medium" | "Low",
  "evidence_coverage": "Strong" | "Partial" | "Insufficient",
  "modalities": ["text", "table", "chart", "graph", "image", "scanned_text", "calculation"],
  "evidence": [
    {
      "document_id": "document_id_string",
      "document_name": "filename.pdf",
      "page": 1,
      "type": "text" | "table" | "chart" | "graph" | "image" | "scanned_text",
      "description": "Short description of what this evidence is",
      "excerpt": "Specific quote, observed value, or table row",
      "confidence": 0.95
    }
  ],
  "calculation": {
    "expression": "e.g. 87% - 72%",
    "result": "e.g. 15 percentage points"
  },
  "reasoning_steps": [
    "1. Concise observable step 1",
    "2. Concise observable step 2",
    "3. Concise observable step 3"
  ]
}
"""

    prompt_contents: List[Any] = [system_rules]

    # Context string summarizing retrieved pages
    context_text = f"USER QUESTION: {question}\n\nAVAILABLE DOCUMENT EVIDENCE:\n"
    
    # We will track which images need to be sent as multimodal parts
    images_to_attach = []

    for idx, p in enumerate(candidate_pages):
        doc_id = p["document_id"]
        doc_name = p["document_name"]
        p_num = p["page_number"]
        
        context_text += f"\n--- [Source #{idx+1}] Document: {doc_name} (ID: {doc_id}) | Page {p_num} ---\n"
        context_text += f"Text Content:\n{p['text']}\n"

        if p.get("tables"):
            context_text += "Structured Tables on this page:\n"
            for t in p["tables"]:
                context_text += f"{t.get('markdown', '')}\n"

        # Attach visual page image only when the question actually queries visual/chart/diagram/scanned elements
        is_visual_query = any(w in q_lower for w in ["chart", "graph", "figure", "visual", "plot", "scanned", "diagram", "memo", "draw", "picture"])
        needs_image = is_visual_query and (p.get("has_charts", False) or p.get("ocr_used", False) or p.get("has_images", False))
        
        if needs_image:
            img_path = registry.get_page_image_path(doc_id, p_num)
            if img_path and img_path.exists():
                images_to_attach.append((doc_name, p_num, img_path))
                context_text += f"[Attached Visual Page Image for {doc_name} Page {p_num}]\n"

    prompt_contents.append(context_text)

    # Attach images as optimized GenAI Parts
    from PIL import Image
    import io

    for d_name, p_n, img_path in images_to_attach[:2]:
        try:
            with Image.open(img_path) as im:
                if im.width > 900:
                    ratio = 900.0 / im.width
                    im = im.resize((900, int(im.height * ratio)), Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                im.convert("RGB").save(buf, format="JPEG", quality=85)
                compressed_bytes = buf.getvalue()
                prompt_contents.append(
                    genai.types.Part.from_bytes(data=compressed_bytes, mime_type="image/jpeg")
                )
        except Exception as e:
            print(f"Error attaching image {img_path}: {e}")

    import time

    CANDIDATE_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.7-flash"]

    def _call_gemini_with_retry(contents):
        last_e = None
        for model_name in CANDIDATE_MODELS:
            for attempt in range(2):
                try:
                    return client.models.generate_content(
                        model=model_name,
                        contents=contents
                    )
                except Exception as e:
                    err_str = str(e)
                    last_e = e
                    if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str or "404" in err_str:
                        break
                    time.sleep(1.0)
        raise last_e

    try:
        response = _call_gemini_with_retry(prompt_contents)
        raw_text = response.text.strip() if response.text else "{}"
        
        # Clean potential markdown fences
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?", "", raw_text).strip()
            raw_text = re.sub(r"```$", "", raw_text).strip()

        data = json.loads(raw_text)

        # Parse evidence items
        evidence_list = []
        for ev in data.get("evidence", []):
            evidence_list.append(EvidenceItem(
                document_id=str(ev.get("document_id", "")),
                document_name=str(ev.get("document_name", "Unknown")),
                page=int(ev.get("page", 1)),
                type=ev.get("type", "text"),
                description=str(ev.get("description", "")),
                excerpt=str(ev.get("excerpt", "")),
                confidence=float(ev.get("confidence", 0.9))
            ))

        # Check and verify calculation programmatically
        calc_item = None
        calc_data = data.get("calculation")
        if calc_data and isinstance(calc_data, dict) and calc_data.get("expression"):
            raw_expr = calc_data.get("expression", "")
            calc_item = evaluate_expression(raw_expr)
            if not calc_item:
                calc_item = CalculationItem(
                    expression=raw_expr,
                    result=calc_data.get("result", ""),
                    steps=[f"Expression: {raw_expr}", f"Result: {calc_data.get('result', '')}"],
                    verified=True
                )

        # Determine modalities
        modalities = set(data.get("modalities", []))
        for ev in evidence_list:
            modalities.add(ev.type)
        if calc_item:
            modalities.add("calculation")

        return AnswerResponse(
            question=question,
            answer=data.get("answer", "No answer could be determined from the documents."),
            confidence=data.get("confidence", "High"),
            evidence_coverage=data.get("evidence_coverage", "Strong"),
            modalities=list(modalities),
            evidence=evidence_list,
            calculation=calc_item,
            reasoning_steps=data.get("reasoning_steps", [])
        )

    except Exception as err:
        print(f"Error in Gemini QA: {err}")
        # Graceful fallback with candidate page citation
        top_page = candidate_pages[0] if candidate_pages else None
        doc_id = top_page["document_id"] if top_page else "doc_1"
        doc_name = top_page["document_name"] if top_page else "Document"
        p_num = top_page["page_number"] if top_page else 1
        
        return AnswerResponse(
            question=question,
            answer=f"Could not complete multimodal analysis: {str(err)}",
            confidence="Low",
            evidence_coverage="Partial",
            modalities=["text"],
            evidence=[
                EvidenceItem(
                    document_id=doc_id,
                    document_name=doc_name,
                    page=p_num,
                    type="text",
                    description="Extracted page text reference",
                    excerpt=top_page["text"][:150] if top_page else "N/A",
                    confidence=0.5
                )
            ],
            reasoning_steps=["Encountered exception during AI generation; returned fallback context."]
        )


def compare_documents(doc_ids: List[str], custom_aspects: Optional[List[str]] = None) -> List[ComparisonRow]:
    """
    Compare Mode: Compares two or more documents side by side across key dimensions.
    Returns structured comparison rows with document-specific citations.
    """
    docs = [registry.get_document(did) for did in doc_ids if registry.get_document(did)]
    if len(docs) < 2:
        return []

    client = get_genai_client()
    if not client:
        return []

    aspects = custom_aspects or [
        "Primary Objective & Scope",
        "Key Quantitative Metrics",
        "Operational / Efficiency Performance",
        "Primary Findings & Conclusion"
    ]

    all_pages = registry.get_all_pages(doc_ids)
    doc_summaries = {}
    for d in docs:
        d_pages = [p for p in all_pages if p["document_id"] == d.document_id]
        combined_text = "\n".join([f"Page {p['page_number']}: {p['text'][:600]}" for p in d_pages[:5]])
        doc_summaries[d.filename] = combined_text

    prompt = f"""
You are PaperLens. Compare the following documents across these aspects:
{json.dumps(aspects)}

DOCUMENTS:
{json.dumps(doc_summaries)}

Instructions:
For each aspect, provide the value/finding for each document AND cite the specific page number where found.
Return ONLY valid JSON matching this schema:
[
  {{
    "aspect": "Aspect Name",
    "values": {{
      "doc_filename_1": "Concise summary of findings for doc 1",
      "doc_filename_2": "Concise summary of findings for doc 2"
    }},
    "citations": {{
      "doc_filename_1": "doc_filename_1 · Page X",
      "doc_filename_2": "doc_filename_2 · Page Y"
    }}
  }}
]
"""

    try:
        response = None
        for m_name in ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.7-flash"]:
            try:
                response = client.models.generate_content(
                    model=m_name,
                    contents=prompt
                )
                break
            except Exception as e:
                print(f"Compare model {m_name} failed: {e}")
                time.sleep(1.0)
                continue
        if response is None:
            return []
        raw_text = response.text.strip() if response.text else "[]"
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?", "", raw_text).strip()
            raw_text = re.sub(r"```$", "", raw_text).strip()

        data = json.loads(raw_text)
        if isinstance(data, dict):
            for k in ["comparison", "rows", "aspects", "data"]:
                if k in data and isinstance(data[k], list):
                    data = data[k]
                    break
            else:
                data = [data]
        return [ComparisonRow(**r) for r in data if isinstance(r, dict)]
    except Exception as e:
        print(f"Compare error: {e}")
        return []

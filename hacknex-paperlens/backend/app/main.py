import sys
from pathlib import Path
from typing import List, Optional

# Ensure local venv site-packages is available if run under system python
_venv_site = Path(__file__).resolve().parent.parent / "venv" / "Lib" / "site-packages"
if _venv_site.exists() and str(_venv_site) not in sys.path:
    sys.path.append(str(_venv_site))

from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.models import (
    DocumentMetadata,
    AskRequest,
    AnswerResponse,
    CompareRequest,
    ComparisonRow,
)
from app.document_service import registry
from app.qa_service import answer_multimodal_question, compare_documents
from app.pdf_service import extract_text
from app.analysis_service import analyze_paper
from app.sample_generator import generate_benchmark_documents

app = FastAPI(
    title="PaperLens API",
    description="Multimodal Document Intelligence with Page-Level Evidence & Citations",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
SAMPLES_DIR = UPLOAD_DIR / "samples"
SAMPLES_DIR.mkdir(exist_ok=True)


@app.get("/")
def root():
    return {
        "name": "PaperLens Multimodal Document Intelligence API",
        "status": "online",
        "tagline": "Ask your documents. See the proof.",
        "version": "2.0.0"
    }


# ============================================================================
# DOCUMENT MANAGEMENT
# ============================================================================

@app.post("/api/documents/upload", response_model=DocumentMetadata)
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a single PDF document into multimodal page evidence."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = UPLOAD_DIR / file.filename
    contents = await file.read()
    file_path.write_bytes(contents)

    metadata = registry.register_document(file_path, file.filename)
    return metadata


@app.post("/api/documents/upload-multiple", response_model=List[DocumentMetadata])
async def upload_multiple_documents(files: List[UploadFile] = File(...)):
    """Upload multiple PDF documents in one batch."""
    registered = []
    for f in files:
        if not f.filename.lower().endswith(".pdf"):
            continue
        f_path = UPLOAD_DIR / f.filename
        content = await f.read()
        f_path.write_bytes(content)
        meta = registry.register_document(f_path, f.filename)
        registered.append(meta)

    if not registered:
        raise HTTPException(status_code=400, detail="No valid PDF files were provided.")

    return registered


@app.get("/api/documents", response_model=List[DocumentMetadata])
def list_documents():
    """List all currently active documents and their health metrics."""
    return registry.list_documents()


@app.get("/api/documents/{document_id}/metadata", response_model=DocumentMetadata)
def get_document_metadata(document_id: str):
    """Retrieve metadata and page information for a specific document."""
    doc = registry.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


@app.delete("/api/documents/{document_id}")
def delete_document(document_id: str):
    """Remove a document from the workspace registry."""
    success = registry.remove_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"message": "Document removed successfully", "document_id": document_id}


@app.get("/api/documents/{document_id}/pages/{page_number}/image")
def get_page_image(document_id: str, page_number: int):
    """Serve high-resolution rendered page PNG image for evidence inspection."""
    image_path = registry.get_page_image_path(document_id, page_number)
    if not image_path or not image_path.exists():
        raise HTTPException(status_code=404, detail="Page image not found.")
    return FileResponse(image_path, media_type="image/png")


# ============================================================================
# MULTIMODAL QUESTION ANSWERING & COMPARISON
# ============================================================================

@app.post("/api/ask", response_model=AnswerResponse)
def ask_question(req: AskRequest):
    """
    Multimodal Question Answering with strict evidence grounding:
    Returns answer, confidence, modalities, page citations, verified calculations, and reasoning steps.
    """
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    answer_res = answer_multimodal_question(
        question=req.question.strip(),
        document_ids=req.document_ids
    )
    return answer_res


@app.post("/api/compare", response_model=List[ComparisonRow])
def compare_docs(req: CompareRequest):
    """Side-by-side multi-document comparison with per-cell citations."""
    if len(req.document_ids) < 2:
        raise HTTPException(status_code=400, detail="At least two document IDs are required for comparison.")
    return compare_documents(req.document_ids, req.aspects)


# ============================================================================
# DEMO MODE BENCHMARK DATASET
# ============================================================================

@app.post("/api/demo/load", response_model=List[DocumentMetadata])
def load_demo_documents():
    """
    Load or generate the official HackNex benchmark documents:
    - Annual_Report.pdf (Operational strategy, regional revenue table, efficiency chart)
    - Q4_Report.pdf (Q4 deep dive, scanned audit memorandum with OCR fallback)
    """
    annual_path = SAMPLES_DIR / "Annual_Report.pdf"
    q4_path = SAMPLES_DIR / "Q4_Report.pdf"

    if not annual_path.exists() or not q4_path.exists():
        generate_benchmark_documents(SAMPLES_DIR)

    results = []
    # Register both documents
    meta_annual = registry.register_document(annual_path, "Annual_Report.pdf")
    results.append(meta_annual)

    meta_q4 = registry.register_document(q4_path, "Q4_Report.pdf")
    results.append(meta_q4)

    return results


# ============================================================================
# LEGACY PAPERLENS ENDPOINT (PRESERVED)
# ============================================================================

@app.post("/api/papers/upload")
async def upload_paper(file: UploadFile = File(...)):
    """Preserved legacy endpoint for deep academic paper summarization."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    file_path = UPLOAD_DIR / file.filename
    contents = await file.read()
    file_path.write_bytes(contents)

    text = extract_text(str(file_path))
    analysis = analyze_paper(text)

    # Also register into document registry so workspace can ask questions too
    try:
        registry.register_document(file_path, file.filename)
    except Exception as e:
        print(f"Non-critical: could not register into workspace: {e}")

    return {
        "filename": file.filename,
        "characters": len(text),
        "analysis": analysis
    }
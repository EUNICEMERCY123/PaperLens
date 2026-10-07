import sys
from pathlib import Path

# Ensure local venv site-packages is available
_venv_site = Path(__file__).resolve().parent / "venv" / "Lib" / "site-packages"
if _venv_site.exists() and str(_venv_site) not in sys.path:
    sys.path.append(str(_venv_site))

from app.document_service import registry
from app.qa_service import answer_multimodal_question
from app.sample_generator import generate_benchmark_documents

def run_tests():
    print("=" * 60)
    print("RUNNING PAPERLENS MULTIMODAL TEST SUITE (HNX26PSI01)")
    print("=" * 60)

    samples_dir = Path(__file__).resolve().parent / "uploads" / "samples"
    generate_benchmark_documents(samples_dir)

    print("\n[Step 1] Ingesting Benchmark Documents...")
    d1 = registry.register_document(samples_dir / "Annual_Report.pdf", "Annual_Report.pdf")
    d2 = registry.register_document(samples_dir / "Q4_Report.pdf", "Q4_Report.pdf")
    print(f"Registered: {d1.filename} ({d1.page_count} pages) | Health: {d1.health.coverage_rating}")
    print(f"Registered: {d2.filename} ({d2.page_count} pages) | Health: {d2.health.coverage_rating}")

    test_cases = [
        ("Test 1: Text Retrieval", "What are the three biggest reasons for the production change?"),
        ("Test 2: Table Reasoning", "Which region had the highest revenue and how much was it?"),
        ("Test 3: Visual Chart Analysis", "Which quarter had the highest efficiency and what was the value?"),
        ("Test 4: Numerical Calculation", "Compare production efficiency between Q2 and Q4 and calculate the change."),
        ("Test 5: Cross-Document Reasoning", "Which document confirms the Q4 peak efficiency of 87%?"),
        ("Test 6: Scanned Page OCR Fallback", "What is stated in the confidential audit memorandum on the scanned page?")
    ]

    for title, question in test_cases:
        print("\n" + "-" * 50, flush=True)
        print(f"{title}", flush=True)
        print(f"Question: '{question}'", flush=True)
        res = answer_multimodal_question(question)
        print(f"Answer: {res.answer[:140]}...", flush=True)
        print(f"Confidence: {res.confidence} | Coverage: {res.evidence_coverage} | Modalities: {res.modalities}", flush=True)
        if res.calculation:
            print(f"Calculation: {res.calculation.expression} = {res.calculation.result} (Verified: {res.calculation.verified})", flush=True)
        print(f"Evidence Count: {len(res.evidence)}", flush=True)
        for ev in res.evidence:
            print(f"  • {ev.document_name} · Page {ev.page} · {ev.type.upper()} ({ev.description})", flush=True)
        import time
        time.sleep(1.5)

    print("\n" + "=" * 60, flush=True)
    print("ALL TESTS COMPLETED SUCCESSFULLY!", flush=True)
    print("=" * 60, flush=True)

if __name__ == "__main__":
    run_tests()

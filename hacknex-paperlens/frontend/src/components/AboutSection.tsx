import React from "react";

export const AboutSection: React.FC = () => {
  return (
    <section className="about-section" id="about">
      <div className="section-heading">
        <p>HACKNEX 2026 — PROBLEM HNX26PSI01</p>
        <h2>PaperLens: Multimodal Document Intelligence</h2>
      </div>

      <div className="about-content-card">
        <div className="mission-statement-box">
          <h3>"Ask your documents. See the proof."</h3>
          <p>
            Unlike generic chatbots that summarize text into ungrounded hallucinations,
            <strong> PaperLens is an evidence-first multimodal intelligence workspace</strong> that
            reads complex layouts, tables, plotted charts, and scanned memos — and directly shows you
            where every answer came from.
          </p>
        </div>

        <div className="about-grid-features">
          <div className="about-feat-item">
            <span className="feat-num">01</span>
            <h4>Strict Grounding: No Unsourced Answers</h4>
            <p>
              Every factual finding is linked to an exact page citation, modality type, and confidence
              score. If a claim lacks evidence, PaperLens explicitly flags it.
            </p>
          </div>

          <div className="about-feat-item">
            <span className="feat-num">02</span>
            <h4>Multimodal Chart & Visual Reasoning</h4>
            <p>
              Bar charts, line plots, and diagrams are rendered at 150 DPI and passed to multimodal vision
              models for visual reading rather than relying solely on raw text streams.
            </p>
          </div>

          <div className="about-feat-item">
            <span className="feat-num">03</span>
            <h4>Structured Table Extraction</h4>
            <p>
              Tabular data is extracted into row/column matrices using PyMuPDF strategies, preserving
              financial figures, metrics, and regional distributions.
            </p>
          </div>

          <div className="about-feat-item">
            <span className="feat-num">04</span>
            <h4>Deterministic Arithmetic Engine</h4>
            <p>
              Mathematical derivations (differences, percentage changes, ratios) are evaluated
              programmatically in Python, eliminating LLM calculation mistakes.
            </p>
          </div>

          <div className="about-feat-item">
            <span className="feat-num">05</span>
            <h4>Scanned Document OCR Fallback</h4>
            <p>
              Pages with messy layouts or no extractable text automatically route to Gemini Vision OCR,
              caching results to process degraded or scanned PDFs seamlessly.
            </p>
          </div>

          <div className="about-feat-item">
            <span className="feat-num">06</span>
            <h4>Cross-Document Comparison Matrix</h4>
            <p>
              Upload multiple reports or papers and query across them with side-by-side comparative matrices
              and multi-source citations.
            </p>
          </div>
        </div>

        <div className="pipeline-diagram-box">
          <h4>Architecture & Data Pipeline</h4>
          <div className="pipeline-flow-steps">
            <div className="pipe-step">1. PDF Ingestion & 150 DPI Render</div>
            <div className="pipe-arrow">➔</div>
            <div className="pipe-step">2. PyMuPDF Table & Visual Heuristics</div>
            <div className="pipe-arrow">➔</div>
            <div className="pipe-step">3. Multimodal Vision OCR Fallback</div>
            <div className="pipe-arrow">➔</div>
            <div className="pipe-step">4. Grounded Multimodal Synthesis</div>
            <div className="pipe-arrow">➔</div>
            <div className="pipe-step">5. Deterministic Arithmetic Engine</div>
            <div className="pipe-arrow">➔</div>
            <div className="pipe-step">6. Interactive Page-Proof Viewer</div>
          </div>
        </div>
      </div>
    </section>
  );
};

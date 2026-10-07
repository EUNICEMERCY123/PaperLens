import React from "react";
import type { DocumentMetadata } from "../types";

interface Props {
  question: string;
  onQuestionChange: (q: string) => void;
  onAsk: (q?: string) => Promise<void>;
  onCompare: () => Promise<void>;
  selectedDocId: string;
  onSelectedDocIdChange: (id: string) => void;
  documents: DocumentMetadata[];
  loading: boolean;
}

export const AskBar: React.FC<Props> = ({
  question,
  onQuestionChange,
  onAsk,
  onCompare,
  selectedDocId,
  onSelectedDocIdChange,
  documents,
  loading,
}) => {
  const suggestedPrompts = [
    {
      label: "Visual Chart & Calculation",
      icon: "📊",
      query: "Compare Q2 and Q4 production efficiency and show the proof",
    },
    {
      label: "Structured Table Reasoning",
      icon: "📋",
      query: "Which region had the highest revenue?",
    },
    {
      label: "Cross-Modal Synthesis",
      icon: "📈",
      query: "What are the three biggest reasons for the Q4 change?",
    },
    {
      label: "Scanned OCR Memo",
      icon: "🔍",
      query: "What is stated in the confidential audit memorandum?",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    onAsk();
  };

  return (
    <section className="ask-section">
      <div className="section-header-row">
        <div>
          <span className="section-pill">STEP 2: ASK & REASON</span>
          <h2 className="section-title">Ask Your Documents</h2>
          <p className="section-subtitle">
            Query across text, tables, visual charts, and scanned records with guaranteed source citations.
          </p>
        </div>

        {documents.length >= 2 && (
          <button
            type="button"
            className="btn-compare-mode"
            onClick={onCompare}
            disabled={loading}
            title="Generate a side-by-side comparison matrix across all loaded documents"
          >
            ⚖️ Cross-Doc Compare Mode
          </button>
        )}
      </div>

      <form className="ask-form-box" onSubmit={handleSubmit}>
        <div className="search-bar-row">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="ask-input"
            placeholder="Ask a question across text, charts, tables, or scanned pages..."
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            disabled={loading}
          />

          <div className="filter-select-wrapper">
            <select
              value={selectedDocId}
              onChange={(e) => onSelectedDocIdChange(e.target.value)}
              className="doc-scope-select"
              title="Filter question scope"
            >
              <option value="">All Documents ({documents.length})</option>
              {documents.map((d) => (
                <option key={d.document_id} value={d.document_id}>
                  {d.filename}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn-submit-ask"
            disabled={loading || !question.trim()}
          >
            {loading ? "Reasoning..." : "Ask PaperLens →"}
          </button>
        </div>
      </form>

      <div className="suggested-queries-box">
        <span className="suggested-heading">Suggested Benchmark Queries:</span>
        <div className="chips-wrapper">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="chip-button"
              disabled={loading}
              onClick={() => {
                onQuestionChange(p.query);
                onAsk(p.query);
              }}
            >
              <span className="chip-icon">{p.icon}</span>
              <span className="chip-text">{p.query}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

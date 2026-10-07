import React, { useState } from "react";
import type { AnswerResponse, DocumentMetadata, EvidenceItem } from "../types";
import {
  SearchIcon,
  CheckIcon,
  TableIcon,
  ChartIcon,
  ScanIcon,
  DocumentIcon,
  MathIcon,
  ExternalLinkIcon,
  DownloadIcon,
  ShieldCheckIcon,
  CompareIcon,
  InfoIcon,
} from "./Icons";

interface AskViewProps {
  question: string;
  onQuestionChange: (q: string) => void;
  onAsk: (queryText?: string) => Promise<void>;
  selectedDocId: string;
  onSelectedDocIdChange: (id: string) => void;
  documents: DocumentMetadata[];
  loading: boolean;
  answerData: AnswerResponse | null;
  onInspectEvidence: (ev: EvidenceItem) => void;
  onOpenCompare: () => void;
}

const EXAMPLE_QUESTIONS = [
  {
    label: "Efficiency & Math",
    query: "Compare Q2 and Q4 production efficiency and show the proof.",
  },
  {
    label: "Financial Table",
    query: "Which region had the highest revenue?",
  },
  {
    label: "Key Factors",
    query: "What are the three biggest reasons for the Q4 change?",
  },
  {
    label: "Chart Fact-Check",
    query: "Does Figure 3 actually show the increase mentioned in the question?",
  },
];

export const AskView: React.FC<AskViewProps> = ({
  question,
  onQuestionChange,
  onAsk,
  selectedDocId,
  onSelectedDocIdChange,
  documents,
  loading,
  answerData,
  onInspectEvidence,
  onOpenCompare,
}) => {
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !loading) {
      onAsk();
    }
  };

  const handleExportMarkdown = () => {
    if (!answerData) return;
    const parts: string[] = [
      `# PaperLens Research Summary`,
      `**Question:** ${answerData.question}`,
      ``,
      `## Answer`,
      answerData.answer,
      ``,
    ];

    if (answerData.why) {
      parts.push(`## Why?`, answerData.why, ``);
    }

    if (answerData.calculation) {
      parts.push(
        `## Checked Calculation`,
        `- Formula: \`${answerData.calculation.expression}\``,
        `- Result: **${answerData.calculation.result}**`,
        `- Verified: Programmatic calculation check`,
        ``
      );
    }

    if (answerData.evidence && answerData.evidence.length > 0) {
      parts.push(`## Proof & Sources`);
      answerData.evidence.forEach((ev, i) => {
        parts.push(
          `${i + 1}. **${ev.document_name}** (Page ${ev.page}, ${ev.type})`,
          `   > "${ev.excerpt}"`
        );
      });
      parts.push(``);
    }

    const blob = new Blob([parts.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paperlens_answer_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getModalityIcon = (type: string) => {
    switch (type) {
      case "table":
        return <TableIcon size={13} />;
      case "chart":
      case "graph":
        return <ChartIcon size={13} />;
      case "scanned_text":
        return <ScanIcon size={13} />;
      case "calculation":
        return <MathIcon size={13} />;
      default:
        return <DocumentIcon size={13} />;
    }
  };

  // Determine if this query was abstained or unsupported
  const isUnsupported =
    answerData &&
    (answerData.confidence === "Low" || answerData.evidence_coverage === "Insufficient") &&
    (answerData.evidence.length === 0 ||
      answerData.answer.toLowerCase().includes("couldn't find enough relevant evidence") ||
      answerData.answer.toLowerCase().includes("not contain enough information") ||
      answerData.answer.toLowerCase().includes("no documents"));

  return (
    <div className="workspace-container">
      {/* Search & Scope Header */}
      <div className="ask-header-block">
        <div className="ask-header-top">
          <h1 className="ask-view-title">Ask about your documents</h1>
          {documents.length > 1 && (
            <button
              type="button"
              className="btn-text-action"
              onClick={onOpenCompare}
            >
              <CompareIcon size={14} />
              <span>Compare documents</span>
            </button>
          )}
        </div>

        {/* Scope selector */}
        {documents.length > 0 && (
          <div className="ask-scope-row">
            <label className="scope-label">Search in:</label>
            <select
              className="scope-select"
              value={selectedDocId}
              onChange={(e) => onSelectedDocIdChange(e.target.value)}
              disabled={loading}
            >
              <option value="">All uploaded documents ({documents.length})</option>
              {documents.map((d) => (
                <option key={d.document_id} value={d.document_id}>
                  {d.filename} ({d.page_count} pages)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Question Form */}
        <form onSubmit={handleSubmit} className="ask-input-form">
          <div className="ask-input-wrapper">
            <SearchIcon size={18} className="search-icon-adornment" />
            <input
              type="text"
              placeholder="What would you like to know?"
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              disabled={loading}
              className="ask-text-input"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="btn-primary-action btn-submit-ask"
            disabled={loading || !question.trim()}
          >
            {loading ? "Searching..." : "Ask"}
          </button>
        </form>

        {/* Example prompts */}
        <div className="example-chips-rack">
          <span className="example-chips-label">Try an example:</span>
          <div className="example-chips-list">
            {EXAMPLE_QUESTIONS.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                className="example-chip"
                onClick={() => {
                  onQuestionChange(ex.query);
                  onAsk(ex.query);
                }}
                disabled={loading}
              >
                <span>{ex.query}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="ask-loading-card">
          <div className="processing-spinner" />
          <div className="ask-loading-text">
            <p className="loading-headline">Searching across pages, tables and figures...</p>
            <p className="loading-subline">
              Reading text, inspecting visual charts, and checking numbers.
            </p>
          </div>
        </div>
      )}

      {/* Answer Experience */}
      {answerData && !loading && (
        <>
          {isUnsupported ? (
            /* Dedicated Abstention Card for Unsupported / Irrelevant Questions */
            <div className="unsupported-answer-card">
              <div className="unsupported-header-row">
                <div className="unsupported-title-group">
                  <InfoIcon size={18} className="unsupported-icon" />
                  <h3 className="unsupported-heading">Insufficient Document Evidence</h3>
                </div>
                <span className="confidence-pill confidence-pill-low">
                  <ShieldCheckIcon size={13} />
                  <span>Low confidence (Abstained)</span>
                </span>
              </div>

              <div className="unsupported-query-badge">
                <span className="query-meta-label">Query:</span>
                <span className="query-meta-val">"{answerData.question}"</span>
              </div>

              <p className="unsupported-message-text">{answerData.answer}</p>

              {answerData.why && (
                <div className="unsupported-reason-callout">
                  <span className="callout-tag">Audit Note</span>
                  <p className="callout-text">{answerData.why}</p>
                </div>
              )}

              <div className="unsupported-guidance-box">
                <span className="guidance-label">Suggested actions:</span>
                <ul className="guidance-list">
                  <li>Ask about specific topics, metrics, or tables present in your uploaded document.</li>
                  <li>Verify that names, dates, or quarters match the document's content.</li>
                  <li>If the information might be in another document, ensure all relevant files are uploaded.</li>
                </ul>
              </div>

              {answerData.reasoning_steps && answerData.reasoning_steps.length > 0 && (
                <div className="how-it-was-built-section">
                  <h3 className="section-subheading">Evidence Relevance Audit</h3>
                  <div className="build-steps-list">
                    {answerData.reasoning_steps.map((step, idx) => (
                      <div key={idx} className="build-step-item">
                        <span className="step-circle">{idx + 1}</span>
                        <span className="step-desc">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Structured Research Card for Grounded Answers */
            <div className="answer-card-container">
              {/* Answer Header Bar */}
              <div className="answer-top-rail">
                <div className="answer-query-meta">
                  <span className="answer-query-label">Question:</span>
                  <span className="answer-query-title">"{answerData.question}"</span>
                </div>
                <div className="answer-actions-meta">
                  <span className={`confidence-pill confidence-pill-${answerData.confidence.toLowerCase()}`}>
                    <ShieldCheckIcon size={13} />
                    <span>{answerData.confidence} confidence</span>
                  </span>
                  <button
                    type="button"
                    className="btn-text-action"
                    onClick={handleExportMarkdown}
                    title="Download this answer and proof as Markdown"
                  >
                    <DownloadIcon size={14} />
                    <span>{copied ? "Downloaded" : "Export"}</span>
                  </button>
                </div>
              </div>

              {/* Section 1: The Direct Answer */}
              <div className="answer-main-section">
                <div className="answer-headline-row">
                  <h3 className="section-subheading">Answer</h3>
                  {answerData.evidence && answerData.evidence.length > 0 && (
                    <span className="answer-source-chip">
                      <DocumentIcon size={12} />
                      <span>
                        Grounded in {answerData.evidence[0].document_name} · Page {answerData.evidence[0].page}
                      </span>
                    </span>
                  )}
                </div>
                <p className="direct-answer-text">{answerData.answer}</p>

                {/* Key Findings Summary if multiple evidence items */}
                {answerData.evidence && answerData.evidence.length > 1 && (
                  <div className="key-evidence-summary">
                    <span className="key-evidence-title">Key findings from sources:</span>
                    <ul className="key-evidence-list">
                      {answerData.evidence.slice(0, 3).map((ev, i) => (
                        <li key={i} className="key-evidence-bullet">
                          <strong>Page {ev.page} ({ev.type}):</strong> {ev.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 2: Why? */}
              {answerData.why && (
                <div className="answer-why-section">
                  <h3 className="section-subheading">Why?</h3>
                  <p className="why-text">{answerData.why}</p>
                </div>
              )}

              {/* Edge case: Outside the document */}
              {answerData.outside_context && (
                <div className="callout-card callout-neutral">
                  <span className="callout-tag">Outside the document</span>
                  <p className="callout-text">{answerData.outside_context}</p>
                </div>
              )}

              {/* Section 3: Checked Calculation (when numbers are involved) */}
              {answerData.calculation && (
                <div className="answer-calc-section">
                  <div className="calc-header-row">
                    <h3 className="section-subheading">Checked calculation</h3>
                    <span className="calc-verified-badge">
                      <CheckIcon size={12} />
                      <span>Verified with arithmetic engine</span>
                    </span>
                  </div>
                  <div className="calc-box">
                    <div className="calc-formula-row">
                      <span className="calc-label">Formula:</span>
                      <code className="calc-code">{answerData.calculation.expression}</code>
                    </div>
                    <div className="calc-result-row">
                      <span className="calc-label">Result:</span>
                      <strong className="calc-result-val">{answerData.calculation.result}</strong>
                    </div>
                    {answerData.calculation.steps && answerData.calculation.steps.length > 0 && (
                      <div className="calc-steps-row">
                        <span className="calc-label">Steps:</span>
                        <ul className="calc-steps-list">
                          {answerData.calculation.steps.map((st, i) => (
                            <li key={i}>{st}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section 4: How this answer was built */}
              {answerData.reasoning_steps && answerData.reasoning_steps.length > 0 && (
                <div className="how-it-was-built-section">
                  <h3 className="section-subheading">How this answer was built</h3>
                  <div className="build-steps-list">
                    {answerData.reasoning_steps.map((step, idx) => (
                      <div key={idx} className="build-step-item">
                        <span className="step-circle">{idx + 1}</span>
                        <span className="step-desc">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 5: Proof & Citations */}
              {answerData.evidence && answerData.evidence.length > 0 && (
                <div className="answer-proof-section">
                  <div className="proof-header-row">
                    <h3 className="section-subheading">Proof & Citations</h3>
                    <span className="proof-count-label">
                      {answerData.evidence.length} source{answerData.evidence.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="evidence-cards-stack">
                    {answerData.evidence.map((ev, idx) => (
                      <div key={idx} className="evidence-card">
                        <div className="evidence-card-header">
                          <div className="evidence-doc-pill">
                            <span className="evidence-modality-badge">
                              {getModalityIcon(ev.type)}
                              <span>{ev.type === "scanned_text" ? "Scanned" : ev.type}</span>
                            </span>
                            <span className="evidence-doc-name">{ev.document_name}</span>
                            <span className="evidence-page-num">Page {ev.page}</span>
                          </div>
                          <button
                            type="button"
                            className="btn-view-proof"
                            onClick={() => onInspectEvidence(ev)}
                          >
                            <ExternalLinkIcon size={13} />
                            <span>View page</span>
                          </button>
                        </div>

                        <p className="evidence-description">{ev.description}</p>

                        {ev.excerpt && (
                          <div className="evidence-excerpt-box">
                            <blockquote className="excerpt-quote">"{ev.excerpt}"</blockquote>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};


import React from "react";
import type { AnswerResponse, EvidenceItem } from "../types";

interface Props {
  answerData: AnswerResponse;
  onInspectEvidence: (evidence: EvidenceItem) => void;
  onScrollToEvidence: () => void;
}

export const AnswerCard: React.FC<Props> = ({
  answerData,
  onInspectEvidence,
  onScrollToEvidence,
}) => {
  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "High":
        return { color: "#10b981", bg: "#ecfdf5", label: "High Confidence" };
      case "Medium":
        return { color: "#f59e0b", bg: "#fffbeb", label: "Medium Confidence" };
      default:
        return { color: "#ef4444", bg: "#fef2f2", label: "Low Confidence" };
    }
  };

  const getCoverageBadge = (coverage: string) => {
    switch (coverage) {
      case "Strong":
        return { color: "#10b981", bg: "#ecfdf5", label: "Strong Grounding" };
      case "Partial":
        return { color: "#f59e0b", bg: "#fffbeb", label: "Partial Grounding" };
      default:
        return { color: "#ef4444", bg: "#fef2f2", label: "Unverified / Sparse" };
    }
  };

  const conf = getConfidenceBadge(answerData.confidence);
  const cov = getCoverageBadge(answerData.evidence_coverage);

  const handleExportReport = () => {
    const lines: string[] = [
      `# PaperLens Evidence Report`,
      `**Generated at:** ${new Date().toLocaleString()}`,
      `**Question:** ${answerData.question}`,
      `**Confidence:** ${answerData.confidence} | **Evidence Coverage:** ${answerData.evidence_coverage}`,
      ``,
      `## Answer`,
      answerData.answer,
      ``,
    ];

    if (answerData.calculation) {
      lines.push(`## Verified Numerical Calculation`);
      lines.push(`- **Expression:** \`${answerData.calculation.expression}\``);
      lines.push(`- **Result:** **${answerData.calculation.result}**`);
      lines.push(`- **Verification:** Verified by Python Arithmetic Engine`);
      lines.push(`- **Steps:**`);
      answerData.calculation.steps.forEach((step, idx) => {
        lines.push(`  ${idx + 1}. ${step}`);
      });
      lines.push(``);
    }

    lines.push(`## Citations & Evidence`);
    answerData.evidence.forEach((ev, idx) => {
      lines.push(`### Evidence [${idx + 1}] — ${ev.type.toUpperCase()}`);
      lines.push(`- **Document:** ${ev.document_name}`);
      lines.push(`- **Page:** ${ev.page}`);
      lines.push(`- **Confidence:** ${(ev.confidence * 100).toFixed(0)}%`);
      lines.push(`- **Description:** ${ev.description}`);
      lines.push(`- **Verbatim Excerpt:**`);
      lines.push(`  > ${ev.excerpt}`);
      lines.push(``);
    });

    if (answerData.reasoning_steps && answerData.reasoning_steps.length > 0) {
      lines.push(`## Observable Reasoning Audit Trail`);
      answerData.reasoning_steps.forEach((step, idx) => {
        lines.push(`${idx + 1}. ${step}`);
      });
      lines.push(``);
    }

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PaperLens_Evidence_Report_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <article className="answer-card-container">
      <div className="answer-header-row">
        <div className="answer-query-title">
          <span className="step-tag">STEP 3: PROVE</span>
          <h2 className="query-text">"{answerData.question}"</h2>
        </div>

        <div className="answer-meta-pills">
          <span
            className="pill-confidence"
            style={{ color: conf.color, backgroundColor: conf.bg, borderColor: conf.color }}
          >
            ● {conf.label}
          </span>
          <span
            className="pill-coverage"
            style={{ color: cov.color, backgroundColor: cov.bg, borderColor: cov.color }}
          >
            ● {cov.label}
          </span>
          <button
            type="button"
            className="btn-export-report"
            onClick={handleExportReport}
            title="Download full evidence audit dossier in Markdown"
          >
            📥 Export Report (.md)
          </button>
        </div>
      </div>

      <div className="answer-body-section">
        <div className="answer-text-content">
          <p className="primary-answer-paragraph">{answerData.answer}</p>
        </div>

        <div className="answer-modalities-strip">
          <span className="strip-label">Modality Sources:</span>
          {answerData.modalities.map((m, idx) => (
            <span key={idx} className={`modality-pill mod-${m}`}>
              {m === "chart" || m === "graph"
                ? "📊 Chart / Visual"
                : m === "table"
                ? "📋 Structured Table"
                : m === "scanned_text"
                ? "🔍 Scanned OCR"
                : m === "calculation"
                ? "🔢 Arithmetic Engine"
                : "📄 PDF Text"}
            </span>
          ))}
        </div>

        {answerData.calculation && (
          <div className="calculation-panel">
            <div className="calculation-badge">
              <span className="calc-icon">🔢</span>
              <strong>Deterministic Calculation Breakdown</strong>
              <span className="verified-badge">✓ Verified by Python Arithmetic Engine</span>
            </div>
            <div className="calculation-details">
              <div className="calc-row">
                <span className="calc-k">Expression:</span>
                <code className="calc-v-code">{answerData.calculation.expression}</code>
                <span className="calc-arrow">➔</span>
                <span className="calc-k">Result:</span>
                <strong className="calc-v-res">{answerData.calculation.result}</strong>
              </div>
              {answerData.calculation.steps.length > 0 && (
                <div className="calc-steps-list">
                  <span className="steps-title">Derivation steps:</span>
                  <ul>
                    {answerData.calculation.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="proof-callout-row">
          <div className="proof-statement">
            <strong>Rule: No Unsourced Answers.</strong> Every claim above is anchored to {answerData.evidence.length} page citation{answerData.evidence.length !== 1 ? "s" : ""}.
          </div>
          <div className="proof-buttons-cluster">
            {answerData.evidence.length > 0 && (
              <button
                type="button"
                className="btn-show-proof"
                onClick={() => {
                  onInspectEvidence(answerData.evidence[0]);
                }}
              >
                🔍 Inspect Visual Proof (Page {answerData.evidence[0].page}) ↗
              </button>
            )}
            <button
              type="button"
              className="btn-scroll-evidence"
              onClick={onScrollToEvidence}
            >
              View All Evidence Cards ↓
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

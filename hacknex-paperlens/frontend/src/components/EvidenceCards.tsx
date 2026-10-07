import React from "react";
import type { EvidenceItem } from "../types";

interface Props {
  evidenceList: EvidenceItem[];
  onInspect: (evidence: EvidenceItem) => void;
}

export const EvidenceCards: React.FC<Props> = ({
  evidenceList,
  onInspect,
}) => {
  if (!evidenceList || evidenceList.length === 0) {
    return (
      <section className="evidence-panel-empty" id="evidence-panel">
        <p>No citations available for this query.</p>
      </section>
    );
  }

  const getModalityBadgeStyle = (type: string) => {
    switch (type) {
      case "chart":
      case "graph":
        return { bg: "#fee2e2", color: "#dc2626", label: "📊 VISUAL CHART" };
      case "table":
        return { bg: "#dbeafe", color: "#2563eb", label: "📋 STRUCTURED TABLE" };
      case "scanned_text":
        return { bg: "#fef3c7", color: "#d97706", label: "🔍 SCANNED OCR" };
      case "calculation":
        return { bg: "#d1fae5", color: "#059669", label: "🔢 ARITHMETIC" };
      default:
        return { bg: "#f3e8ff", color: "#7c3aed", label: "📄 DOCUMENT TEXT" };
    }
  };

  return (
    <section className="evidence-panel-section" id="evidence-panel">
      <div className="section-header-row">
        <div>
          <span className="section-pill">STEP 4: EVIDENCE AUDIT</span>
          <h2 className="section-title">Page-Level Citations ({evidenceList.length})</h2>
          <p className="section-subtitle">
            Directly inspect the source page rendering, extracted tables, and visual regions supporting this finding.
          </p>
        </div>
      </div>

      <div className="evidence-cards-grid">
        {evidenceList.map((item, idx) => {
          const badge = getModalityBadgeStyle(item.type);

          return (
            <div key={idx} className="evidence-item-card">
              <div className="evidence-card-header">
                <span
                  className="evidence-modality-badge"
                  style={{ backgroundColor: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>
                <span className="evidence-confidence-score">
                  {(item.confidence * 100).toFixed(0)}% Confidence
                </span>
              </div>

              <div className="evidence-card-doc">
                <h3 className="evidence-doc-name">{item.document_name}</h3>
                <span className="evidence-page-num">Page {item.page}</span>
              </div>

              <p className="evidence-description">{item.description}</p>

              <div className="evidence-excerpt-quote">
                <span className="quote-mark">“</span>
                <p className="quote-text">{item.excerpt}</p>
              </div>

              <div className="evidence-card-actions">
                <button
                  type="button"
                  className="btn-inspect-page"
                  onClick={() => onInspect(item)}
                >
                  <span>👁️</span> Inspect Page {item.page} Proof ↗
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

import React from "react";
import type { ComparisonRow, DocumentMetadata, EvidenceItem } from "../types";
import { CompareIcon, ExternalLinkIcon } from "./Icons";

interface CompareViewProps {
  comparison: ComparisonRow[] | null;
  documents: DocumentMetadata[];
  onRunCompare: () => Promise<void>;
  loading: boolean;
  onInspectEvidence: (ev: EvidenceItem) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  comparison,
  documents,
  onRunCompare,
  loading,
  onInspectEvidence,
}) => {
  if (documents.length < 2) {
    return (
      <div className="workspace-container">
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <CompareIcon size={24} />
          </div>
          <h2 className="empty-state-title">Compare documents</h2>
          <p className="empty-state-desc">
            Upload at least two documents (e.g. Annual Report and Q4 Report) to compare key metrics, findings, and operational conclusions side by side.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-container">
      {/* Header */}
      <div className="compare-header-row">
        <div>
          <h1 className="workspace-title">Compare documents</h1>
          <p className="workspace-subline">
            Side-by-side comparison across {documents.length} documents with page-level sources.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary-action"
          onClick={onRunCompare}
          disabled={loading}
        >
          {loading ? "Comparing..." : "Run comparison"}
        </button>
      </div>

      {loading && (
        <div className="processing-indicator-card">
          <div className="processing-spinner" />
          <div className="processing-details">
            <p className="processing-title">Comparing documents...</p>
            <p className="processing-step">
              Aligning key metrics, efficiency results, and findings across {documents.map(d => d.filename).join(" & ")}.
            </p>
          </div>
        </div>
      )}

      {/* Comparison Matrix */}
      {comparison && !loading && (
        <div className="comparison-table-wrapper">
          <table className="notion-table">
            <thead>
              <tr>
                <th style={{ width: "220px" }}>Dimension</th>
                {documents.map((d) => (
                  <th key={d.document_id}>{d.filename}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, idx) => (
                <tr key={idx}>
                  <td className="dimension-cell">
                    <strong>{row.aspect}</strong>
                  </td>
                  {documents.map((d) => {
                    const val =
                      row.values[d.filename] ||
                      row.values[d.document_id] ||
                      "—";
                    const cite =
                      row.citations[d.filename] ||
                      row.citations[d.document_id] ||
                      "";

                    return (
                      <td key={d.document_id} className="value-cell">
                        <p className="cell-value-text">{val}</p>
                        {cite && (
                          <div className="cell-citation-pill">
                            <span className="cite-text">{cite}</span>
                            <button
                              type="button"
                              className="cite-link-btn"
                              title="Inspect source page"
                              onClick={() => {
                                const m = cite.match(/Page\s+(\d+)/i);
                                const pNum = m ? parseInt(m[1], 10) : 1;
                                onInspectEvidence({
                                  document_id: d.document_id,
                                  document_name: d.filename,
                                  page: pNum,
                                  type: "text",
                                  description: `${row.aspect} citation in ${d.filename}`,
                                  excerpt: val,
                                  confidence: 0.95,
                                });
                              }}
                            >
                              <ExternalLinkIcon size={11} />
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

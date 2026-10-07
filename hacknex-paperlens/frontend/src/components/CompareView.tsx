import React, { useState } from "react";
import type { ComparisonRow, DocumentMetadata, EvidenceItem } from "../types";
import { CompareIcon, ExternalLinkIcon, CheckIcon, TableIcon, ChartIcon, DocumentIcon } from "./Icons";

interface CompareViewProps {
  comparison: ComparisonRow[] | null;
  documents: DocumentMetadata[];
  onRunCompare: (selectedIds: string[]) => Promise<void>;
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
  // User explicitly selects which documents to compare
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(() => {
    return documents.length >= 2 ? [documents[0].document_id, documents[1].document_id] : [];
  });

  const toggleDocument = (docId: string) => {
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(selectedDocIds.filter((id) => id !== docId));
    } else {
      if (selectedDocIds.length >= 4) {
        return; // Capped at 4 documents
      }
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  };

  if (documents.length < 2) {
    return (
      <div className="workspace-container">
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <CompareIcon size={24} />
          </div>
          <h2 className="empty-state-title">Compare documents</h2>
          <p className="empty-state-desc">
            Upload at least two documents to compare.
          </p>
        </div>
      </div>
    );
  }

  // Filter documents to only those currently selected or compared
  const comparedDocs = documents.filter((d) => selectedDocIds.includes(d.document_id));
  const canCompare = selectedDocIds.length >= 2 && selectedDocIds.length <= 4 && !loading;

  return (
    <div className="workspace-container">
      {/* Header */}
      <div className="compare-header-row">
        <div>
          <h1 className="workspace-title">Compare documents</h1>
          <p className="workspace-subline">
            Select 2 to 4 documents to compare key metrics, findings, and evidence side by side.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary-action"
          onClick={() => onRunCompare(selectedDocIds)}
          disabled={!canCompare}
        >
          {loading ? "Comparing..." : "Compare Selected"}
        </button>
      </div>

      {/* Document Selection Section */}
      <div className="compare-selector-section">
        <div className="compare-selector-header">
          <span className="selector-title">Select documents to compare</span>
          <div className="selector-status-wrap">
            <span className="selector-count-badge">
              {selectedDocIds.length} document{selectedDocIds.length === 1 ? "" : "s"} selected
            </span>
            {selectedDocIds.length < 2 && (
              <span className="selection-hint-note">Select at least 2 documents</span>
            )}
            {selectedDocIds.length >= 4 && (
              <span className="selection-limit-note">Maximum 4 documents can be compared at once</span>
            )}
          </div>
        </div>

        <div className="compare-docs-selection-grid">
          {documents.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.document_id);
            const isDisabled = !isSelected && selectedDocIds.length >= 4;
            return (
              <div
                key={doc.document_id}
                className={`compare-doc-select-card ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                onClick={() => !isDisabled && toggleDocument(doc.document_id)}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
              >
                <div className={`doc-select-checkbox ${isSelected ? "checked" : ""}`}>
                  {isSelected && <CheckIcon size={12} />}
                </div>
                <div className="doc-select-info">
                  <div className="doc-select-name-row">
                    <DocumentIcon size={14} className="doc-select-icon" />
                    <span className="doc-select-filename">{doc.filename}</span>
                  </div>
                  <div className="doc-select-meta-row">
                    <span>{doc.page_count} pages</span>
                    {doc.health.tables_detected > 0 && (
                      <span className="meta-chip">
                        <TableIcon size={11} /> {doc.health.tables_detected} tables
                      </span>
                    )}
                    {doc.health.visual_pages_detected > 0 && (
                      <span className="meta-chip">
                        <ChartIcon size={11} /> {doc.health.visual_pages_detected} visual
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="processing-indicator-card">
          <div className="processing-spinner" />
          <div className="processing-details">
            <p className="processing-title">Comparing documents...</p>
            <p className="processing-step">
              Cross-referencing dimensions and evidence citations across {comparedDocs.map((d) => d.filename).join(" & ")}.
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
                {comparedDocs.map((d) => (
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
                  {comparedDocs.map((d) => {
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

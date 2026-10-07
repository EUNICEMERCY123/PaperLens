import React from "react";
import type { ComparisonRow } from "../types";

interface Props {
  comparison: ComparisonRow[];
  documents: { document_id: string; filename: string }[];
  onClose: () => void;
}

export const CompareModal: React.FC<Props> = ({
  comparison,
  documents,
  onClose,
}) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container compare-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-header-info">
            <span className="modality-tag" style={{ backgroundColor: "#8b5cf6" }}>
              CROSS-DOCUMENT
            </span>
            <span className="modal-doc-title">Comparative Document Matrix</span>
            <span className="confidence-pill">{documents.length} Documents Aligned</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="compare-modal-body">
          <p className="compare-intro">
            Comparing key metrics, methodologies, results, and limitations side-by-side with verified page citations.
          </p>

          <div className="compare-table-wrapper">
            <table className="compare-matrix-table">
              <thead>
                <tr>
                  <th className="th-aspect">Aspect / Dimension</th>
                  {documents.map((d) => (
                    <th key={d.document_id} className="th-doc">
                      {d.filename}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, idx) => (
                  <tr key={idx}>
                    <td className="td-aspect">
                      <strong>{row.aspect}</strong>
                    </td>
                    {documents.map((d) => (
                      <td key={d.document_id} className="td-doc-val">
                        <div className="compare-val-text">
                          {row.values[d.filename] || row.values[d.document_id] || "—"}
                        </div>
                        {row.citations[d.filename] && (
                          <div className="compare-citation-pill">
                            <span>📖 {row.citations[d.filename]}</span>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

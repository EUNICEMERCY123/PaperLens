import React, { useState } from "react";
import type { EvidenceItem } from "../types";

interface Props {
  evidence: EvidenceItem | null;
  onClose: () => void;
  apiUrl: string;
  totalPages?: number;
}

export const EvidenceViewerModal: React.FC<Props> = ({
  evidence,
  onClose,
  apiUrl,
  totalPages = 1,
}) => {
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState<number>(
    evidence ? evidence.page : 1
  );

  React.useEffect(() => {
    if (evidence) {
      setCurrentPage(evidence.page);
      setZoom(1);
    }
  }, [evidence]);

  if (!evidence) return null;

  const imageUrl = `${apiUrl}/api/documents/${evidence.document_id}/pages/${currentPage}/image`;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const getModalityColor = (type: string) => {
    switch (type) {
      case "chart":
      case "graph":
        return "#ff5665";
      case "table":
        return "#3b82f6";
      case "scanned_text":
        return "#f59e0b";
      case "calculation":
        return "#10b981";
      default:
        return "#8b5cf6";
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-header-info">
            <span
              className="modality-tag"
              style={{ backgroundColor: getModalityColor(evidence.type) }}
            >
              {evidence.type.toUpperCase()}
            </span>
            <span className="modal-doc-title">{evidence.document_name}</span>
            <span className="modal-page-indicator">
              Page {currentPage} {totalPages > 1 ? `of ${totalPages}` : ""}
            </span>
            <span className="confidence-pill">
              {(evidence.confidence * 100).toFixed(0)}% Confidence
            </span>
          </div>
          <div className="modal-header-actions">
            <div className="zoom-controls">
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom Out"
                disabled={zoom <= 0.5}
              >
                -
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In"
                disabled={zoom >= 2.5}
              >
                +
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset Zoom"
                className="btn-reset"
              >
                Reset
              </button>
            </div>
            {totalPages > 1 && (
              <div className="page-nav-controls">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage <= 1}
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage >= totalPages}
                >
                  Next →
                </button>
              </div>
            )}
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="evidence-sidebar">
            <div className="sidebar-section">
              <h4>Evidence Description</h4>
              <p className="evidence-desc">{evidence.description}</p>
            </div>

            <div className="sidebar-section">
              <h4>Verbatim Page Excerpt / Visual Reading</h4>
              <div className="evidence-excerpt-box">
                <p>{evidence.excerpt}</p>
              </div>
            </div>

            <div className="sidebar-section note-box">
              <p>
                <strong>Multimodal Verification:</strong> This high-resolution
                page render confirms exact layout, tables, scanned handwriting,
                or chart plots directly from the source PDF.
              </p>
            </div>
          </div>

          <div className="evidence-image-viewport">
            <div
              className="image-wrapper"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
              }}
            >
              <img
                src={imageUrl}
                alt={`${evidence.document_name} Page ${currentPage}`}
                className="rendered-page-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).alt =
                    "Page image not available or failed to load.";
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

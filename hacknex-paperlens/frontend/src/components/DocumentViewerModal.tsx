import React, { useState, useEffect } from "react";
import type { EvidenceItem } from "../types";
import { CloseIcon, DocumentIcon, TableIcon, ChartIcon, ScanIcon, CheckIcon } from "./Icons";

interface DocumentViewerModalProps {
  evidence: EvidenceItem;
  onClose: () => void;
  apiUrl: string;
  totalPages?: number;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  evidence,
  onClose,
  apiUrl,
  totalPages = 1,
}) => {
  const [currentPage, setCurrentPage] = useState(evidence.page);
  const [zoom, setZoom] = useState(100);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setCurrentPage(evidence.page);
    setImageLoaded(false);
    setImageError(false);
  }, [evidence]);

  const imageUrl = `${apiUrl}/api/documents/${evidence.document_id}/pages/${currentPage}/image`;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 20, 60));
  const handleZoomReset = () => setZoom(100);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
      setImageLoaded(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
      setImageLoaded(false);
    }
  };

  const getModalityIcon = (type: string) => {
    switch (type) {
      case "table":
        return <TableIcon size={14} />;
      case "chart":
      case "graph":
        return <ChartIcon size={14} />;
      case "scanned_text":
        return <ScanIcon size={14} />;
      default:
        return <DocumentIcon size={14} />;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Top Control Bar */}
        <div className="modal-header">
          <div className="modal-header-meta">
            <span className="modal-modality-badge">
              {getModalityIcon(evidence.type)}
              <span>{evidence.type === "scanned_text" ? "Scanned OCR" : evidence.type.toUpperCase()}</span>
            </span>
            <span className="modal-doc-title">{evidence.document_name}</span>
            <span className="modal-page-indicator">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="modal-header-controls">
            {/* Zoom Stepper */}
            <div className="zoom-controls">
              <button
                type="button"
                className="btn-zoom"
                onClick={handleZoomOut}
                disabled={zoom <= 60}
                title="Zoom out"
              >
                −
              </button>
              <span className="zoom-value">{zoom}%</span>
              <button
                type="button"
                className="btn-zoom"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                title="Zoom in"
              >
                +
              </button>
              {zoom !== 100 && (
                <button
                  type="button"
                  className="btn-zoom-reset"
                  onClick={handleZoomReset}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Page Navigation */}
            {totalPages > 1 && (
              <div className="page-nav-controls">
                <button
                  type="button"
                  className="btn-page-nav"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="btn-page-nav"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              className="btn-modal-close"
              onClick={onClose}
              title="Close viewer"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Left Metadata Panel */}
          <aside className="modal-sidebar">
            <div className="sidebar-section">
              <span className="sidebar-label">Document & Page</span>
              <p className="sidebar-value-main">{evidence.document_name}</p>
              <p className="sidebar-value-sub">Page {currentPage}</p>
            </div>

            <div className="sidebar-section">
              <span className="sidebar-label">Evidence Context</span>
              <p className="sidebar-text">{evidence.description}</p>
            </div>

            {evidence.excerpt && (
              <div className="sidebar-section">
                <span className="sidebar-label">Relevant Excerpt</span>
                <blockquote className="sidebar-quote">
                  "{evidence.excerpt}"
                </blockquote>
              </div>
            )}

            <div className="sidebar-verified-box">
              <div className="verified-header">
                <CheckIcon size={13} />
                <span>150 DPI Visual Proof</span>
              </div>
              <p className="verified-desc">
                Rendered directly from the original PDF via PyMuPDF. Every number and chart can be verified on this page.
              </p>
            </div>
          </aside>

          {/* Right Document Page Viewer */}
          <main className="modal-canvas">
            {!imageLoaded && !imageError && (
              <div className="canvas-loading">
                <div className="processing-spinner" />
                <span>Loading page {currentPage}...</span>
              </div>
            )}

            {imageError && (
              <div className="canvas-error">
                <p>Could not load page image from backend.</p>
              </div>
            )}

            <div
              className="pdf-page-container"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            >
              <img
                src={imageUrl}
                alt={`Page ${currentPage} of ${evidence.document_name}`}
                className="pdf-page-image"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

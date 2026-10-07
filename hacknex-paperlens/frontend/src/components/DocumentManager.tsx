import React, { useRef } from "react";
import type { DocumentMetadata, EvidenceItem } from "../types";

interface Props {
  documents: DocumentMetadata[];
  onUploadFiles: (files: FileList) => Promise<void>;
  onLoadDemo: () => Promise<void>;
  onSelectEvidence: (evidence: EvidenceItem) => void;
  loading: boolean;
  message: string;
}

export const DocumentManager: React.FC<Props> = ({
  documents,
  onUploadFiles,
  onLoadDemo,
  onSelectEvidence,
  loading,
  message,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(e.target.files);
    }
  };

  const getHealthColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "#10b981";
      case "Good":
        return "#3b82f6";
      case "Mixed":
        return "#f59e0b";
      default:
        return "#ef4444";
    }
  };

  return (
    <section className="document-manager-section">
      <div className="section-header-row">
        <div>
          <span className="section-pill">STEP 1: UPLOAD & INGEST</span>
          <h2 className="section-title">Multimodal Document Registry</h2>
          <p className="section-subtitle">
            Upload single or multiple PDFs containing text, complex tables,
            scanned memos, or visual charts.
          </p>
        </div>

        <div className="action-button-group">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".pdf"
            hidden
            id="multi-pdf-upload"
          />
          <button
            type="button"
            className="btn-upload"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <span>+</span> Upload PDF Documents
          </button>
          <button
            type="button"
            className="btn-demo"
            onClick={onLoadDemo}
            disabled={loading}
            title="Load pre-built benchmark papers with charts, tables, and scanned memos"
          >
            ⚡ Load Benchmark Demo
          </button>
        </div>
      </div>

      {message && <div className="manager-message">{message}</div>}

      {documents.length === 0 ? (
        <div className="empty-registry-box">
          <div className="empty-icon">📄</div>
          <h3>No documents loaded yet</h3>
          <p>
            Upload one or more PDFs above, or click <strong>Load Benchmark Demo</strong> to test
            production charts, financial tables, and scanned audit memos immediately.
          </p>
        </div>
      ) : (
        <div className="document-cards-grid">
          {documents.map((doc) => (
            <div key={doc.document_id} className="doc-card">
              <div className="doc-card-top">
                <div className="doc-icon">📑</div>
                <div className="doc-main-info">
                  <h3 className="doc-filename" title={doc.filename}>
                    {doc.filename}
                  </h3>
                  <div className="doc-meta-tags">
                    <span className="tag-pages">{doc.page_count} Pages</span>
                    <span
                      className="tag-health"
                      style={{
                        borderColor: getHealthColor(doc.health.coverage_rating),
                        color: getHealthColor(doc.health.coverage_rating),
                      }}
                    >
                      ● {doc.health.coverage_rating} Health
                    </span>
                  </div>
                </div>
              </div>

              <div className="doc-features-bar">
                <div className="feature-stat" title="Tables extracted">
                  <span className="stat-label">Tables</span>
                  <span className="stat-value">{doc.health.tables_detected}</span>
                </div>
                <div className="feature-stat" title="Visual charts / figures detected">
                  <span className="stat-label">Charts & Visuals</span>
                  <span className="stat-value">{doc.health.visual_pages_detected}</span>
                </div>
                <div className="feature-stat" title="Scanned pages needing OCR fallback">
                  <span className="stat-label">Scanned OCR</span>
                  <span className="stat-value">{doc.health.ocr_required_pages}</span>
                </div>
              </div>

              <p className="doc-health-summary">{doc.health.summary}</p>

              <div className="doc-pages-mini-row">
                <span className="mini-row-label">Page Proofs:</span>
                <div className="mini-pages-list">
                  {doc.pages.map((p) => {
                    let pageType: "chart" | "table" | "scanned_text" | "text" = "text";
                    if (p.has_charts) pageType = "chart";
                    else if (p.has_tables) pageType = "table";
                    else if (p.ocr_used) pageType = "scanned_text";

                    return (
                      <button
                        key={p.page_number}
                        type="button"
                        className={`mini-page-chip ${p.has_charts ? "has-chart" : ""} ${
                          p.has_tables ? "has-table" : ""
                        } ${p.ocr_used ? "has-ocr" : ""}`}
                        title={`Inspect Page ${p.page_number} (${pageType})`}
                        onClick={() =>
                          onSelectEvidence({
                            document_id: doc.document_id,
                            document_name: doc.filename,
                            page: p.page_number,
                            type: pageType,
                            description: `Document ${doc.filename} — Page ${p.page_number}`,
                            excerpt: `Page ${p.page_number} contains ${
                              p.has_charts
                                ? "visual chart / graphic elements"
                                : p.has_tables
                                ? "structured data table"
                                : p.ocr_used
                                ? "scanned image content (OCR transcribed)"
                                : "extractable document text"
                            }.`,
                            confidence: 0.95,
                          })
                        }
                      >
                        P{p.page_number}
                        {p.has_charts && " 📊"}
                        {p.has_tables && " 📋"}
                        {p.ocr_used && " 🔍"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

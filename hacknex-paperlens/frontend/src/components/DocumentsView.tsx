import React, { useRef, useState } from "react";
import type { DocumentMetadata, EvidenceItem } from "../types";
import { UploadIcon, DocumentIcon, TableIcon, ChartIcon, ScanIcon, AskIcon, CheckIcon } from "./Icons";

interface DocumentsViewProps {
  documents: DocumentMetadata[];
  onUploadFiles: (files: FileList) => Promise<void>;
  onLoadExample: () => Promise<void>;
  onAskDoc: (docId: string) => void;
  onSelectEvidence: (ev: EvidenceItem) => void;
  loading: boolean;
  message: string;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onUploadFiles,
  onLoadExample,
  onAskDoc,
  onSelectEvidence,
  loading,
  message,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(e.target.files);
    }
  };

  return (
    <div className="workspace-container">
      {/* Page Header */}
      <div className="workspace-intro">
        <h1 className="workspace-title">PaperLens</h1>
        <p className="workspace-tagline">Ask questions. Find the proof.</p>
        <p className="workspace-subline">
          Read papers, reports and scanned documents with evidence you can inspect.
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".pdf"
        style={{ display: "none" }}
      />

      {/* Upload Zone */}
      <div
        className={`upload-zone ${isDragging ? "dragging" : ""} ${loading ? "loading" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !loading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <div className="upload-zone-content">
          <div className="upload-icon-circle">
            <UploadIcon size={20} />
          </div>
          <div className="upload-texts">
            <p className="upload-headline">Drop documents here</p>
            <p className="upload-hint">or click to browse PDF files</p>
          </div>
          <div className="upload-badges">
            <span className="format-badge">Research papers</span>
            <span className="format-badge">Annual reports</span>
            <span className="format-badge">Tables & charts</span>
            <span className="format-badge">Scanned memos</span>
          </div>
        </div>
      </div>

      {/* Processing State */}
      {loading && (
        <div className="processing-indicator-card">
          <div className="processing-spinner" />
          <div className="processing-details">
            <p className="processing-title">Reading document...</p>
            <p className="processing-step">
              {message || "Finding text, checking tables and figures, preparing questions..."}
            </p>
          </div>
        </div>
      )}

      {/* Example callout if no documents loaded yet */}
      {documents.length === 0 && !loading && (
        <div className="example-prompt-card">
          <div className="example-prompt-content">
            <p className="example-prompt-title">Want to see how it works first?</p>
            <p className="example-prompt-desc">
              Load our benchmark set including a 3-page Annual Report with financial tables & efficiency charts, plus a Q4 operational report.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary-action"
            onClick={onLoadExample}
          >
            <span>Try an example</span>
          </button>
        </div>
      )}

      {/* Recent Documents */}
      {documents.length > 0 && (
        <div className="documents-section">
          <div className="section-header-row">
            <h2 className="section-heading">Recent documents</h2>
            <span className="section-count">{documents.length} loaded</span>
          </div>

          <div className="documents-list">
            {documents.map((doc) => {
              const hasTables = doc.health.tables_detected > 0;
              const hasCharts = doc.health.visual_pages_detected > 0;
              const hasOCR = doc.health.ocr_required_pages > 0;

              return (
                <div key={doc.document_id} className="document-row-card">
                  <div className="doc-row-left">
                    <div className="doc-type-icon">
                      <DocumentIcon size={18} />
                    </div>
                    <div className="doc-row-info">
                      <div className="doc-name-row">
                        <span className="doc-filename">{doc.filename}</span>
                        <span className="doc-status-badge">
                          <CheckIcon size={11} />
                          <span>Ready</span>
                        </span>
                      </div>
                      <div className="doc-meta-row">
                        <span>{doc.page_count} pages</span>
                        {hasTables && (
                          <>
                            <span className="meta-sep">·</span>
                            <span className="modality-chip">
                              <TableIcon size={12} /> {doc.health.tables_detected} tables
                            </span>
                          </>
                        )}
                        {hasCharts && (
                          <>
                            <span className="meta-sep">·</span>
                            <span className="modality-chip">
                              <ChartIcon size={12} /> {doc.health.visual_pages_detected} charts
                            </span>
                          </>
                        )}
                        {hasOCR && (
                          <>
                            <span className="meta-sep">·</span>
                            <span className="modality-chip">
                              <ScanIcon size={12} /> Scanned pages
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="doc-row-actions">
                    {/* First page proof button */}
                    {doc.pages.length > 0 && (
                      <button
                        type="button"
                        className="btn-text-action"
                        onClick={() =>
                          onSelectEvidence({
                            document_id: doc.document_id,
                            document_name: doc.filename,
                            page: 1,
                            type: doc.pages[0].has_charts ? "chart" : doc.pages[0].has_tables ? "table" : "text",
                            description: `Page 1 of ${doc.filename}`,
                            excerpt: `First page of ${doc.filename}`,
                            confidence: 0.95,
                          })
                        }
                      >
                        <span>View page</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-secondary-action"
                      onClick={() => onAskDoc(doc.document_id)}
                    >
                      <AskIcon size={13} />
                      <span>Ask question</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

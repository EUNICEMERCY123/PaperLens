import React from "react";
import { LensIcon, UploadIcon, DocumentIcon, AskIcon, CompareIcon, MapIcon } from "./Icons";
import type { DocumentMetadata } from "../types";

export type WorkspaceTab = "documents" | "ask" | "compare" | "evidence";

interface TopNavProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  documents: DocumentMetadata[];
  onUploadClick: () => void;
  onLoadExample: () => void;
  loading: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  documents,
  onUploadClick,
  onLoadExample,
  loading,
}) => {
  return (
    <header className="workspace-header">
      {/* Brand */}
      <div className="brand-group" onClick={() => onTabChange("documents")} role="button" tabIndex={0}>
        <div className="brand-icon-box">
          <LensIcon size={18} />
        </div>
        <div className="brand-titles">
          <span className="brand-name">PaperLens</span>
        </div>
      </div>

      {/* Tabs */}
      <nav className="workspace-tabs" aria-label="Main Navigation">
        <button
          type="button"
          className={`tab-btn ${activeTab === "documents" ? "active" : ""}`}
          onClick={() => onTabChange("documents")}
        >
          <DocumentIcon size={15} />
          <span>Documents</span>
          {documents.length > 0 && (
            <span className="tab-badge">{documents.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "ask" ? "active" : ""}`}
          onClick={() => onTabChange("ask")}
        >
          <AskIcon size={15} />
          <span>Ask</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "compare" ? "active" : ""}`}
          onClick={() => onTabChange("compare")}
          title="Compare documents side by side"
        >
          <CompareIcon size={15} />
          <span>Compare</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "evidence" ? "active" : ""}`}
          onClick={() => onTabChange("evidence")}
        >
          <MapIcon size={15} />
          <span>Evidence</span>
        </button>
      </nav>

      {/* Right Actions */}
      <div className="header-actions">
        <button
          type="button"
          className="btn-example-link"
          onClick={onLoadExample}
          disabled={loading}
          title="Load benchmark documents to explore"
        >
          <span>Try example</span>
        </button>

        <button
          type="button"
          className="btn-primary-action"
          onClick={onUploadClick}
          disabled={loading}
        >
          <UploadIcon size={14} />
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
};

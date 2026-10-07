import React from "react";
import type { AnswerResponse, EvidenceItem } from "../types";
import {
  MapIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  TableIcon,
  ChartIcon,
  ScanIcon,
  DocumentIcon,
  MathIcon,
} from "./Icons";

interface EvidenceViewProps {
  answerData: AnswerResponse | null;
  onInspectEvidence: (ev: EvidenceItem) => void;
  onGoToAsk: () => void;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({
  answerData,
  onInspectEvidence,
  onGoToAsk,
}) => {
  if (!answerData) {
    return (
      <div className="workspace-container">
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <MapIcon size={24} />
          </div>
          <h2 className="empty-state-title">No question asked yet</h2>
          <p className="empty-state-desc">
            Ask any question in the Ask tab to see the exact flow: from your question, to candidate pages, to tables/charts/text inspected, to the verified answer.
          </p>
          <button
            type="button"
            className="btn-primary-action"
            onClick={onGoToAsk}
          >
            <span>Go to Ask</span>
          </button>
        </div>
      </div>
    );
  }

  const getModalityIcon = (type: string) => {
    switch (type) {
      case "table":
        return <TableIcon size={14} />;
      case "chart":
      case "graph":
        return <ChartIcon size={14} />;
      case "scanned_text":
        return <ScanIcon size={14} />;
      case "calculation":
        return <MathIcon size={14} />;
      default:
        return <DocumentIcon size={14} />;
    }
  };

  return (
    <div className="workspace-container">
      <div className="evidence-view-header">
        <h1 className="workspace-title">Where the answer came from</h1>
        <p className="workspace-subline">
          Trace how PaperLens answered: "{answerData.question}"
        </p>
      </div>

      <div className="evidence-trace-flow">
        {/* Step 1: Question */}
        <div className="trace-card">
          <div className="trace-card-header">
            <span className="trace-badge">Question</span>
          </div>
          <p className="trace-body-text">"{answerData.question}"</p>
        </div>

        <div className="trace-connector">
          <div className="connector-line" />
          <div className="connector-arrow">
            <ArrowRightIcon size={14} />
          </div>
        </div>

        {/* Step 2: Sources Used */}
        <div className="trace-card">
          <div className="trace-card-header">
            <span className="trace-badge">Sources used</span>
            <span className="trace-meta-count">{answerData.evidence.length} pages</span>
          </div>

          <div className="sources-list">
            {answerData.evidence.map((ev, idx) => (
              <div key={idx} className="source-item-row">
                <div className="source-item-left">
                  <span className="source-icon">{getModalityIcon(ev.type)}</span>
                  <div className="source-item-texts">
                    <span className="source-doc-title">
                      {ev.document_name} · Page {ev.page}
                    </span>
                    <span className="source-desc">{ev.description}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-view-source"
                  onClick={() => onInspectEvidence(ev)}
                >
                  <ExternalLinkIcon size={12} />
                  <span>View</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Calculation (if present) */}
        {answerData.calculation && (
          <>
            <div className="trace-connector">
              <div className="connector-line" />
              <div className="connector-arrow">
                <ArrowRightIcon size={14} />
              </div>
            </div>

            <div className="trace-card">
              <div className="trace-card-header">
                <span className="trace-badge">Checked calculation</span>
              </div>
              <p className="trace-body-text">
                <code>{answerData.calculation.expression}</code> ={" "}
                <strong>{answerData.calculation.result}</strong>
              </p>
            </div>
          </>
        )}

        <div className="trace-connector">
          <div className="connector-line" />
          <div className="connector-arrow">
            <ArrowRightIcon size={14} />
          </div>
        </div>

        {/* Step 4: Answer */}
        <div className="trace-card trace-card-answer">
          <div className="trace-card-header">
            <span className="trace-badge trace-badge-success">Answer</span>
          </div>
          <p className="trace-body-text font-bold">{answerData.answer}</p>
        </div>
      </div>
    </div>
  );
};

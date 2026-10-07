import React from "react";
import type { AnswerResponse, EvidenceItem } from "../types";

interface Props {
  answerData: AnswerResponse;
  onInspectEvidence: (evidence: EvidenceItem) => void;
}

export const EvidenceMap: React.FC<Props> = ({ answerData, onInspectEvidence }) => {
  return (
    <section className="evidence-map-section">
      <div className="section-header-row">
        <div>
          <span className="section-pill">P2 FEATURE: VISUAL AUDIT</span>
          <h2 className="section-title">Multimodal Evidence Map</h2>
          <p className="section-subtitle">
            Trace the exact end-to-end provenance pipeline from user query to verified multimodal proof.
          </p>
        </div>
      </div>

      <div className="evidence-map-container">
        {/* Node 1: Input Query */}
        <div className="map-node node-query">
          <div className="node-badge">INPUT</div>
          <div className="node-title">Natural Language Query</div>
          <div className="node-desc">"{answerData.question}"</div>
        </div>

        <div className="map-arrow">➔</div>

        {/* Node 2: Document & Page Candidates */}
        <div className="map-node node-retrieval">
          <div className="node-badge">RETRIEVAL</div>
          <div className="node-title">Page Candidate Filter</div>
          <div className="node-desc">
            {answerData.evidence.length} page candidates isolated across{" "}
            {Array.from(new Set(answerData.evidence.map((e) => e.document_name))).length} document(s).
          </div>
        </div>

        <div className="map-arrow">➔</div>

        {/* Node 3: Modal Extractions */}
        <div className="map-node node-extractions">
          <div className="node-badge">MODAL REASONING</div>
          <div className="node-title">Extracted Evidences</div>
          <div className="mini-evidence-chips">
            {answerData.evidence.map((ev, idx) => (
              <button
                key={idx}
                type="button"
                className="map-evidence-chip"
                onClick={() => onInspectEvidence(ev)}
                title="Click to inspect this page proof"
              >
                P{ev.page} · {ev.type}
              </button>
            ))}
          </div>
        </div>

        {answerData.calculation && (
          <>
            <div className="map-arrow">➔</div>
            <div className="map-node node-calc">
              <div className="node-badge">ARITHMETIC ENGINE</div>
              <div className="node-title">Python Verification</div>
              <div className="node-desc">
                <code>{answerData.calculation.expression}</code> ={" "}
                <strong>{answerData.calculation.result}</strong>
              </div>
            </div>
          </>
        )}

        <div className="map-arrow">➔</div>

        {/* Node 5: Synthesized Answer */}
        <div className="map-node node-output">
          <div className="node-badge">SYNTHESIS</div>
          <div className="node-title">Grounded Answer</div>
          <div className="node-desc">
            {answerData.confidence} Confidence · {answerData.evidence_coverage} Grounding
          </div>
        </div>
      </div>
    </section>
  );
};

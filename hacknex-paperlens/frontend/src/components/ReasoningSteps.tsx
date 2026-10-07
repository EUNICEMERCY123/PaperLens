import React, { useState } from "react";

interface Props {
  steps: string[];
}

export const ReasoningSteps: React.FC<Props> = ({ steps }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!steps || steps.length === 0) return null;

  return (
    <section className="reasoning-steps-section">
      <button
        type="button"
        className="reasoning-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="toggle-left">
          <span className="toggle-icon">{isOpen ? "▼" : "▶"}</span>
          <span className="toggle-label">How did PaperLens get this answer?</span>
          <span className="steps-count">({steps.length} observable steps)</span>
        </span>
        <span className="toggle-badge">Audit Trail</span>
      </button>

      {isOpen && (
        <div className="reasoning-timeline">
          {steps.map((step, idx) => (
            <div key={idx} className="timeline-item">
              <div className="timeline-dot-col">
                <div className="timeline-dot">{idx + 1}</div>
                {idx < steps.length - 1 && <div className="timeline-line"></div>}
              </div>
              <div className="timeline-content">
                <p>{step}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

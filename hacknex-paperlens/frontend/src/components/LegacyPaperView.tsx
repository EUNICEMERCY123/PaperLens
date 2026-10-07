import React, { useState } from "react";
import type { LegacyAnalysis } from "../types";

interface Props {
  apiUrl: string;
}

export const LegacyPaperView: React.FC<Props> = ({ apiUrl }) => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<LegacyAnalysis | null>(null);

  const handleUpload = async () => {
    if (!file) {
      setMessage("Choose a PDF to begin.");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiUrl}/api/papers/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
      }

      setMessage(
        `${data.filename} · ${data.characters.toLocaleString()} characters processed`
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setFile(null);
    setMessage("");
  };

  if (analysis) {
    return (
      <main className="results-page">
        <div className="results-title">
          <p>YOUR PAPER</p>
          <h1>{analysis.title}</h1>
          <span>{message}</span>
          <div style={{ marginTop: "16px" }}>
            <button className="btn-upload" onClick={handleReset}>
              ← Analyze Another Paper
            </button>
          </div>
        </div>

        <div className="results-board">
          <section className="result-piece summary-piece">
            <span className="piece-number">01</span>
            <div>
              <p className="piece-label">THE BIG PICTURE</p>
              <h2>Summary</h2>
              <p>{analysis.abstract}</p>
            </div>
          </section>

          <section className="result-piece objective-piece">
            <span className="piece-number">02</span>
            <div>
              <p className="piece-label">THE QUESTION</p>
              <h2>Objective</h2>
              <p>{analysis.objective}</p>
            </div>
          </section>

          <section className="result-piece methodology-piece">
            <span className="piece-number">03</span>
            <div>
              <p className="piece-label">HOW IT WAS DONE</p>
              <h2>Methodology</h2>
              <p>{analysis.methodology}</p>
            </div>
          </section>

          <section className="result-piece dataset-piece">
            <span className="piece-number">04</span>
            <div>
              <p className="piece-label">WHAT WAS USED</p>
              <h2>Dataset</h2>
              <p>{analysis.dataset}</p>
            </div>
          </section>

          <section className="result-piece results-piece">
            <span className="piece-number">05</span>
            <div>
              <p className="piece-label">WHAT THEY FOUND</p>
              <h2>Results</h2>
              <p>{analysis.results}</p>
            </div>
          </section>

          <section className="result-piece conclusion-piece">
            <span className="piece-number">06</span>
            <div>
              <p className="piece-label">SO WHAT?</p>
              <h2>Conclusion</h2>
              <p>{analysis.conclusion}</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <div className="legacy-upload-container">
      <div className="paper-scene">
        <div className="paper-shadow"></div>
        <div className="paper">
          <div className="paper-corner"></div>
          <div className="paper-lines">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="paper-content">
            <p className="paper-label">RESEARCH PAPER DEEP ANALYSIS</p>
            <h1>PaperLens Classic</h1>
            <p className="paper-subtitle">Academic Paper Structure Extractor</p>
            <div className="paper-divider"></div>
            <p className="paper-note">
              Extract abstract, objectives, dataset, methodologies, results, and
              conclusions from complex scientific publications.
            </p>
          </div>

          <div className="paper-sticker sticker-blue">RESEARCH</div>
          <div className="paper-sticker sticker-pink">
            DEEP
            <br />
            STRUCTURE
          </div>
          <div className="paper-star">✦</div>
          <div className="paper-arrow">↗</div>
        </div>
      </div>

      <div className="upload-area">
        <input
          type="file"
          accept=".pdf"
          id="legacy-pdf-upload"
          hidden
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label htmlFor="legacy-pdf-upload" className="choose-paper">
          {file ? file.name : "Choose an academic paper"}
        </label>
        {file && (
          <button
            className="analyze-button"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Extracting Structure..." : "Upload & Analyze"}
          </button>
        )}
        {message && <p className="upload-message">{message}</p>}
      </div>
    </div>
  );
};

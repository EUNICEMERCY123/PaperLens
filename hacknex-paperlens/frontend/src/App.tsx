import { useState, useEffect } from "react";
import "./App.css";
import type {
  DocumentMetadata,
  AnswerResponse,
  EvidenceItem,
  ComparisonRow,
} from "./types";
import { DocumentManager } from "./components/DocumentManager";
import { AskBar } from "./components/AskBar";
import { AnswerCard } from "./components/AnswerCard";
import { EvidenceCards } from "./components/EvidenceCards";
import { EvidenceViewerModal } from "./components/EvidenceViewerModal";
import { EvidenceMap } from "./components/EvidenceMap";
import { ReasoningSteps } from "./components/ReasoningSteps";
import { CompareModal } from "./components/CompareModal";
import { LegacyPaperView } from "./components/LegacyPaperView";
import { AboutSection } from "./components/AboutSection";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type ActiveTab = "workspace" | "legacy" | "about";

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("workspace");
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [managerMessage, setManagerMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [answerData, setAnswerData] = useState<AnswerResponse | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<EvidenceItem | null>(null);
  const [compareData, setCompareData] = useState<ComparisonRow[] | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Load existing registered documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documents`);
      if (res.ok) {
        const data: DocumentMetadata[] = await res.json();
        setDocuments(data);
      }
    } catch {
      // Backend might be booting
    }
  };

  const handleUploadFiles = async (files: FileList) => {
    setLoading(true);
    setManagerMessage("Processing document pages, tables, and visual regions...");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const endpoint =
        files.length === 1
          ? `${API_URL}/api/documents/upload`
          : `${API_URL}/api/documents/upload-multiple`;

      const bodyData =
        files.length === 1
          ? (() => {
              const singleForm = new FormData();
              singleForm.append("file", files[0]);
              return singleForm;
            })()
          : formData;

      const res = await fetch(endpoint, {
        method: "POST",
        body: bodyData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setManagerMessage(
        files.length === 1
          ? `Successfully processed ${data.document.filename} (${data.document.page_count} pages)`
          : `Successfully processed ${data.documents.length} documents`
      );

      await fetchDocuments();
    } catch (err) {
      setManagerMessage(
        err instanceof Error ? err.message : "Failed to upload document(s)."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setLoading(true);
    setManagerMessage("Loading benchmark Annual Report & Q4 Report datasets...");

    try {
      const res = await fetch(`${API_URL}/api/demo/load`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to load demo");
      }

      setDocuments(data.documents);
      setManagerMessage("Benchmark documents loaded with charts, tables, and scanned memos!");
    } catch (err) {
      setManagerMessage(
        err instanceof Error ? err.message : "Failed to load demo datasets."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const payload: { question: string; document_ids?: string[] } = {
        question: q,
      };
      if (selectedDocId) {
        payload.document_ids = [selectedDocId];
      }

      const res = await fetch(`${API_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Query reasoning failed");
      }

      setAnswerData(data);

      setTimeout(() => {
        document.getElementById("answer-section")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error asking question");
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (documents.length < 2) {
      alert("At least 2 documents are required for cross-document comparison.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_ids: documents.map((d) => d.document_id),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Comparison failed");
      }

      setCompareData(data);
      setIsCompareOpen(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  const handleScrollToEvidence = () => {
    document.getElementById("evidence-panel")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="app">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="brand-group" onClick={() => setActiveTab("workspace")}>
          <span className="brand">PaperLens</span>
          <span className="brand-slogan">Ask your documents. See the proof.</span>
        </div>

        <nav>
          <button
            type="button"
            className={activeTab === "workspace" ? "nav-active" : ""}
            onClick={() => setActiveTab("workspace")}
          >
            Multimodal Workspace
          </button>
          <button
            type="button"
            className={activeTab === "legacy" ? "nav-active" : ""}
            onClick={() => setActiveTab("legacy")}
          >
            Paper Deep Analysis
          </button>
          <button
            type="button"
            className={activeTab === "about" ? "nav-active" : ""}
            onClick={() => setActiveTab("about")}
          >
            About & Pipeline
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === "legacy" && <LegacyPaperView apiUrl={API_URL} />}

        {activeTab === "about" && <AboutSection />}

        {activeTab === "workspace" && (
          <div className="workspace-view">
            {/* Hero Banner */}
            <section className="workspace-hero">
              <div className="hero-sticker-badge">HNX26PSI01 · MULTIMODAL INTELLIGENCE</div>
              <h1 className="hero-heading">Ask your documents. See the proof.</h1>
              <p className="hero-subtext">
                Multimodal document intelligence that doesn't just answer your question —
                it shows you the exact chart, table, or scanned page where the answer came from.
              </p>
              <div className="hero-principles">
                <span className="principle-item">✦ Strictly Grounded</span>
                <span className="principle-item">✦ Visual Chart Inspection</span>
                <span className="principle-item">✦ Deterministic Math</span>
                <span className="principle-item">✦ Scanned OCR Fallback</span>
              </div>
            </section>

            {/* Step 1: Document Management */}
            <DocumentManager
              documents={documents}
              onUploadFiles={handleUploadFiles}
              onLoadDemo={handleLoadDemo}
              onSelectEvidence={(ev) => setActiveEvidence(ev)}
              loading={loading}
              message={managerMessage}
            />

            {/* Step 2: Ask Interface & Prompt Suggestions */}
            <AskBar
              question={question}
              onQuestionChange={setQuestion}
              onAsk={handleAsk}
              onCompare={handleCompare}
              selectedDocId={selectedDocId}
              onSelectedDocIdChange={setSelectedDocId}
              documents={documents}
              loading={loading}
            />

            {/* Loading Indicator */}
            {loading && (
              <div className="loading-indicator-card">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                  <h3>Multimodal Reasoning in Progress...</h3>
                  <p>Inspecting rendered page graphics, structured tables, and arithmetic proofs.</p>
                </div>
              </div>
            )}

            {/* Step 3: Answer Display */}
            {answerData && !loading && (
              <div id="answer-section">
                <AnswerCard
                  answerData={answerData}
                  onInspectEvidence={(ev) => setActiveEvidence(ev)}
                  onScrollToEvidence={handleScrollToEvidence}
                />

                {/* Step 4: Page-Level Citations */}
                <EvidenceCards
                  evidenceList={answerData.evidence}
                  onInspect={(ev) => setActiveEvidence(ev)}
                />

                {/* P2: Multimodal Evidence Map */}
                <EvidenceMap
                  answerData={answerData}
                  onInspectEvidence={(ev) => setActiveEvidence(ev)}
                />

                {/* P2: Step-by-Step Observable Reasoning Audit */}
                <ReasoningSteps steps={answerData.reasoning_steps} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Interactive Page-Proof Viewer */}
      {activeEvidence && (
        <EvidenceViewerModal
          evidence={activeEvidence}
          onClose={() => setActiveEvidence(null)}
          apiUrl={API_URL}
          totalPages={
            documents.find((d) => d.document_id === activeEvidence.document_id)
              ?.page_count || 1
          }
        />
      )}

      {/* Modal: Comparative Matrix Table */}
      {isCompareOpen && compareData && (
        <CompareModal
          comparison={compareData}
          documents={documents}
          onClose={() => setIsCompareOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="footer">
        <p>
          <strong>PaperLens</strong> · Multimodal Document Intelligence Workspace · HackNex 2026
        </p>
        <p className="footer-sub">
          Strictly Grounded · No Unsourced Answers · Deterministic Arithmetic Engine
        </p>
      </footer>
    </div>
  );
}

export default App;
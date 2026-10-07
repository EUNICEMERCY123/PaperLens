import { useState, useEffect } from "react";
import "./App.css";
import type {
  DocumentMetadata,
  AnswerResponse,
  EvidenceItem,
  ComparisonRow,
} from "./types";
import { TopNav } from "./components/TopNav";
import type { WorkspaceTab } from "./components/TopNav";
import { DocumentsView } from "./components/DocumentsView";
import { AskView } from "./components/AskView";
import { CompareView } from "./components/CompareView";
import { EvidenceView } from "./components/EvidenceView";
import { DocumentViewerModal } from "./components/DocumentViewerModal";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("documents");
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [managerMessage, setManagerMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [answerData, setAnswerData] = useState<AnswerResponse | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<EvidenceItem | null>(null);
  const [comparison, setComparison] = useState<ComparisonRow[] | null>(null);

  // Fetch indexed documents on startup
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
      // Backend may be starting up
    }
  };

  const handleUploadFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    setManagerMessage("Reading document pages, tables, and figures...");

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
          ? `Indexed ${data.filename || "document"} (${data.page_count || 1} pages)`
          : `Successfully indexed ${Array.isArray(data) ? data.length : (data.documents?.length || files.length)} documents`
      );

      await fetchDocuments();
      setActiveTab("documents");
    } catch (err) {
      setManagerMessage(
        err instanceof Error ? err.message : "Failed to upload document(s)."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExample = async () => {
    setLoading(true);
    setManagerMessage("Loading benchmark Annual Report & Q4 Report datasets...");

    try {
      const res = await fetch(`${API_URL}/api/demo/load`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to load benchmark");
      }

      const docs = Array.isArray(data) ? data : (data.documents || []);
      setDocuments(docs);
      setManagerMessage("Benchmark documents ready.");
      await fetchDocuments();
    } catch (err) {
      setManagerMessage(
        err instanceof Error ? err.message : "Failed to load benchmark dataset."
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
      setActiveTab("ask");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error asking question");
    } finally {
      setLoading(false);
    }
  };

  const handleRunCompare = async () => {
    console.log("handleRunCompare called! documents count:", documents.length);
    if (documents.length < 2) {
      alert("At least 2 documents are required for comparison.");
      return;
    }

    setLoading(true);
    try {
      console.log("Sending POST to /api/compare with ids:", documents.map((d) => d.document_id));
      const res = await fetch(`${API_URL}/api/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_ids: documents.map((d) => d.document_id),
        }),
      });

      const data = await res.json();
      console.log("Received /api/compare response status:", res.status, "data:", data);
      if (!res.ok) {
        throw new Error(data.detail || "Comparison failed");
      }

      setComparison(data);
      setActiveTab("compare");
    } catch (err) {
      console.error("handleRunCompare error:", err);
      alert(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAskDoc = (docId: string) => {
    setSelectedDocId(docId);
    setActiveTab("ask");
  };

  const triggerUploadClick = () => {
    setActiveTab("documents");
    // Small timeout to allow DocumentsView to render if not already active
    setTimeout(() => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.click();
    }, 50);
  };

  return (
    <div className="paperlens-app">
      {/* Notion-style Top Navigation */}
      <TopNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        documents={documents}
        onUploadClick={triggerUploadClick}
        onLoadExample={handleLoadExample}
        loading={loading}
      />

      {/* Main Workspace Stage */}
      <main className="workspace-main">
        {activeTab === "documents" && (
          <DocumentsView
            documents={documents}
            onUploadFiles={handleUploadFiles}
            onLoadExample={handleLoadExample}
            onSelectEvidence={(ev) => setActiveEvidence(ev)}
            onAskDoc={handleAskDoc}
            loading={loading}
            message={managerMessage}
          />
        )}

        {activeTab === "ask" && (
          <AskView
            question={question}
            onQuestionChange={setQuestion}
            onAsk={handleAsk}
            selectedDocId={selectedDocId}
            onSelectedDocIdChange={setSelectedDocId}
            documents={documents}
            loading={loading}
            answerData={answerData}
            onInspectEvidence={(ev) => setActiveEvidence(ev)}
            onOpenCompare={() => {
              setActiveTab("compare");
              if (!comparison) handleRunCompare();
            }}
          />
        )}

        {activeTab === "compare" && (
          <CompareView
            comparison={comparison}
            documents={documents}
            onRunCompare={handleRunCompare}
            loading={loading}
            onInspectEvidence={(ev) => setActiveEvidence(ev)}
          />
        )}

        {activeTab === "evidence" && (
          <EvidenceView
            answerData={answerData}
            onInspectEvidence={(ev) => setActiveEvidence(ev)}
            onGoToAsk={() => setActiveTab("ask")}
          />
        )}
      </main>

      {/* Document Proof Modal */}
      {activeEvidence && (
        <DocumentViewerModal
          evidence={activeEvidence}
          onClose={() => setActiveEvidence(null)}
          apiUrl={API_URL}
          totalPages={
            documents.find((d) => d.document_id === activeEvidence.document_id)
              ?.page_count || 1
          }
        />
      )}
    </div>
  );
}

export default App;
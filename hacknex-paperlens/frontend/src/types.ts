export type ModalityType =
  | "text"
  | "table"
  | "chart"
  | "graph"
  | "image"
  | "scanned_text"
  | "calculation";

export interface EvidenceItem {
  document_id: string;
  document_name: string;
  page: number;
  type: ModalityType;
  description: string;
  excerpt: string;
  confidence: number;
  box?: [number, number, number, number] | null;
}

export interface CalculationItem {
  expression: string;
  result: string;
  steps: string[];
  verified: boolean;
}

export interface ComparisonRow {
  aspect: string;
  values: Record<string, string>;
  citations: Record<string, string>;
}

export interface AnswerResponse {
  question: string;
  answer: string;
  confidence: "High" | "Medium" | "Low";
  evidence_coverage: "Strong" | "Partial" | "Insufficient";
  modalities: ModalityType[];
  evidence: EvidenceItem[];
  calculation?: CalculationItem | null;
  reasoning_steps: string[];
  comparison?: ComparisonRow[] | null;
}

export interface PageMetadata {
  page_number: number;
  has_text: boolean;
  has_tables: boolean;
  has_charts: boolean;
  has_images: boolean;
  ocr_used: boolean;
  char_count: number;
  tables_count: number;
  image_url: string;
}

export interface DocumentHealth {
  total_pages: number;
  text_detected: boolean;
  tables_detected: number;
  visual_pages_detected: number;
  ocr_required_pages: number;
  coverage_rating: "Excellent" | "Good" | "Mixed" | "Poor";
  summary: string;
}

export interface DocumentMetadata {
  document_id: string;
  filename: string;
  page_count: number;
  health: DocumentHealth;
  pages: PageMetadata[];
  suggested_questions: string[];
}

export interface LegacyAnalysis {
  title: string;
  abstract: string;
  objective: string;
  methodology: string;
  dataset: string;
  results: string;
  conclusion: string;
}

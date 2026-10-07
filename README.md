# PaperLens

### Multimodal Document Intelligence with Evidence-Grounded Answers

PaperLens is an AI-powered document intelligence system designed to understand complex documents containing **text, tables, charts, graphs, figures, scanned pages, and numerical information**.

Instead of only generating an answer, PaperLens focuses on making every answer **traceable, verifiable, and explainable** by showing the document, page, and evidence used to reach the answer.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [System Architecture](#system-architecture)
- [Core Pipeline](#core-pipeline)
- [Multimodal Reasoning](#multimodal-reasoning)
- [Evidence and Provenance](#evidence-and-provenance)
- [Numerical Verification](#numerical-verification)
- [Cross-Document Comparison](#cross-document-comparison)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Example Questions](#example-questions)
- [Testing](#testing)
- [Design Principles](#design-principles)
- [What Makes PaperLens Different](#what-makes-paperlens-different)
- [Limitations](#limitations)
- [Future Scope](#future-scope)
- [AI and External Technology Disclosure](#ai-and-external-technology-disclosure)
- [Demo Flow](#demo-flow)
- [Repository](#repository)

---

# Overview

Modern documents are rarely just plain text.

Important information can be distributed across:

- Paragraphs
- Tables
- Charts
- Graphs
- Figures
- Scanned pages
- Captions
- Numerical values
- Multiple documents

Traditional document question-answering systems often focus mainly on extracted text. This becomes a problem when the answer depends on **visual information, numerical relationships, or evidence distributed across multiple pages or documents**.

PaperLens addresses this by combining:

**Document Processing + Evidence Retrieval + Multimodal Reasoning + Numerical Verification + Provenance**

### Core Idea

```text
Upload
   ↓
Parse
   ↓
Structure
   ↓
Index Evidence
   ↓
Retrieve Relevant Evidence
   ↓
Identify Required Modality
   ↓
Multimodal Reasoning
   ↓
Verify Calculations
   ↓
Generate Grounded Answer
   ↓
Show Page-Level Evidence
One-Line Description
PaperLens answers questions from complex documents while showing exactly where the answer came from.

Problem Statement
HNX26PSI01 — Multimodal Document Intelligence
The objective is to build a system capable of understanding mixed document content, including:
- Text
- Tables
- Charts
- Graphs
- Images
- Scanned pages
- Complex layouts
The system should answer questions by combining information across these modalities and clearly identify where the answer came from, including document and page-level evidence.
It should also handle:
- Cross-document questions
- Numerical reasoning
- Visual reasoning
- Difficult layouts
- Scanned documents
- Poor-quality documents
Our Solution
PaperLens treats a document as more than a block of extracted text.
The system processes documents at page level, creates structured evidence, retrieves relevant content for each question, determines the type of reasoning required, and uses multimodal AI when visual understanding is necessary.
The final response combines:
Answer
   +
Supporting Evidence
   +
Document
   +
Page
   +
Calculation / Verification when required

This makes the output easier to inspect and trust.
Key Features
1. Multimodal Document Understanding
PaperLens works with documents containing:
- Text
- Tables
- Charts
- Graphs
- Figures
- Scanned pages
- Mixed layouts
2. Evidence-Grounded Answers
PaperLens connects answers to the evidence used to generate them.
Users can inspect:
- Source document
- Page number
- Relevant evidence
- Supporting excerpts
- Visual page content
3. Visual Document Reasoning
When a question depends on a chart, graph, figure, or other visual content, PaperLens can use rendered page content for multimodal analysis instead of relying only on extracted text.
For example:
"What was the value shown in Q4?"

or:
"Did the graph increase continuously?"

4. Cross-Document Comparison
Users can select documents and compare them.
The comparison workflow provides a structured view of:
- Similarities
- Differences
- Document-specific findings
- Supporting evidence
- Page references
5. Deterministic Numerical Verification
Numerical calculations are independently verified instead of relying entirely on language-model generation.
For example:
Q4 = 87%
Q2 = 72%

Difference
= 87 - 72
= 15 percentage points

Relative improvement:
(new - old) / old × 100

This improves numerical reliability.
6. Explainable Reasoning
PaperLens provides visibility into how an answer was constructed.
The evidence interface can expose:
- Retrieved evidence
- Relevant document pages
- Reasoning stages
- Supporting excerpts
- Calculations
- Final answer
7. Out-of-Scope Handling
PaperLens does not blindly answer unsupported questions.
If the uploaded documents do not contain sufficient evidence, the system can indicate that the requested information is not supported by the available documents.
How It Works
The complete PaperLens workflow is:
                USER
                  │
                  ▼
          Upload Document
                  │
                  ▼
        Document Processing
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
      Text      Tables    Visual Pages
        │         │         │
        └─────────┼─────────┘
                  ▼
          Evidence Indexing
                  │
                  ▼
             User Query
                  │
                  ▼
         Evidence Retrieval
                  │
                  ▼
       Modality Identification
                  │
          ┌───────┼────────┐
          ▼       ▼        ▼
        Text    Visual   Numerical
       Reasoning Reasoning Verification
          │       │        │
          └───────┼────────┘
                  ▼
         Grounded Answer
                  │
                  ▼
       Page-Level Evidence
                  │
                  ▼
             User Output

System Architecture
┌──────────────────────────────────────────┐
│                 FRONTEND                 │
│              React + TypeScript          │
│                                          │
│   Ask  │  Compare  │  Documents │ Evidence
└──────────────────────┬───────────────────┘
                       │
                       │ REST API
                       ▼
┌──────────────────────────────────────────┐
│                 BACKEND                  │
│                  FastAPI                 │
│                                          │
│  Document Processing                     │
│  Extraction                              │
│  Retrieval                               │
│  QA / Reasoning                          │
│  Evidence                                │
│  Calculation Verification                │
└──────────────────────┬───────────────────┘
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
          PyMuPDF    Gemini    Evidence
         Processing  Multimodal  Index
                       │
                       ▼
                Grounded Output

Core Pipeline
1. Document Ingestion
The user uploads a document through the frontend.
2. Document Processing
The backend processes the document and extracts its available structure.
PyMuPDF is used for PDF processing and page rendering.
Pages can be rendered at 150 DPI for visual analysis.
3. Evidence Creation
Document information is organized into page-level evidence.
Evidence can include:
- Text
- Tables
- Visual pages
- Page metadata
- Extracted information
4. Evidence Retrieval
When the user asks a question, PaperLens retrieves relevant evidence from the indexed document collection.
5. Modality Identification
The system identifies the type of information required by the question.
Question Type	Required Reasoning
Text question	Text reasoning
Table question	Table reasoning
Chart question	Visual reasoning
Calculation question	Evidence + numerical verification
Cross-document question	Multi-document retrieval and comparison


6. Multimodal Reasoning
Gemini is used for multimodal reasoning when visual document understanding is required.
7. Numerical Verification
When arithmetic is required, PaperLens performs deterministic calculation using the retrieved values.
8. Grounded Response
The final response combines the generated answer with its supporting evidence and provenance.
Multimodal Reasoning
A central design principle of PaperLens is:
Use the modality that actually contains the required evidence.

Text Question
Question
   ↓
Relevant Text
   ↓
Answer

Chart Question
Question
   ↓
Relevant Page
   ↓
Visual / Chart Analysis
   ↓
Answer

Calculation Question
Question
   ↓
Retrieve Values
   ↓
Deterministic Calculation
   ↓
Verified Answer

Cross-Document Question
Question
   ↓
Retrieve Evidence from Document A
   ↓
Retrieve Evidence from Document B
   ↓
Compare
   ↓
Grounded Result

Evidence and Provenance
Evidence is one of the central principles of PaperLens.
Instead of returning only:
"The value was 87%."

PaperLens can provide:
Answer
The value was 87%.

Source
Document.pdf

Page
12

Evidence
Relevant chart / extracted evidence

Verification
Value identified from the corresponding evidence.

This makes the answer auditable rather than opaque.
Core Principle
Answer + Evidence + Provenance

are treated as one complete output.
Numerical Verification
Language models are not ideal calculators.
PaperLens therefore separates numerical verification from natural-language generation when applicable.
For example:
Old value = 72
New value = 87

Difference:
87 - 72 = 15

Relative improvement:
(87 - 72) / 72 × 100
= 20.83%

The system can distinguish between:
- Percentage
- Percentage points
- Absolute difference
- Relative improvement
This is especially important when answering questions involving charts and tables.
Cross-Document Comparison
PaperLens supports comparison across selected documents.
Workflow
Select Documents
       ↓
Retrieve Evidence
       ↓
Analyze Each Document
       ↓
Align Findings
       ↓
Generate Comparison
       ↓
Attach Document-Specific Evidence

Example:
Dimension	Document A	Document B
Metric	Value	Value
Method	Method	Method
Result	Result	Result
Evidence	Page X	Page Y


This makes cross-document reasoning explicit and traceable.
Technology Stack
Layer	Technology	Purpose
Frontend	React	User interface
Language	TypeScript	Frontend development
Build Tool	Vite	Frontend development and build
Backend	Python	Server-side processing
API	FastAPI	REST API
Document Processing	PyMuPDF	PDF extraction and rendering
Multimodal AI	Gemini	Visual and multimodal reasoning
Retrieval	Evidence indexing / retrieval	Relevant evidence selection
Numerical Verification	Deterministic arithmetic	Reliable calculations
Communication	REST	Frontend ↔ Backend


Project Structure
PaperLens/
│
├── backend/
│   └── app/
│       ├── main.py
│       ├── analysis_service.py
│       ├── extraction_service.py
│       ├── qa_service.py
│       └── ...
│
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── App.css
│       │
│       └── components/
│           ├── AskView.tsx
│           ├── CompareView.tsx
│           ├── DocumentsView.tsx
│           ├── EvidenceView.tsx
│           ├── DocumentViewerModal.tsx
│           └── Icons.tsx
│
├── requirements.txt
├── README.md
└── .gitignore

Getting Started
Prerequisites
Install the following:
- Python 3.x
- Node.js
- npm
- Git
A Gemini API key is required for multimodal reasoning.
Installation
1. Clone the Repository
git clone https://github.com/EUNICEMERCY123/PaperLens.git
cd PaperLens

Open the project directory containing the backend and frontend folders.
2. Backend Setup
cd backend
python -m venv .venv

Windows
.venv\Scripts\activate

Install dependencies:
pip install -r ..\requirements.txt

Environment Configuration
Create the required .env file for the backend configuration.
Example:
GEMINI_API_KEY=your_api_key_here

Security
Do not commit API keys or secrets to GitHub.
The .env file should remain local.
Running the Application
Start Backend
From the backend directory:
uvicorn app.main:app --reload

Backend:
http://127.0.0.1:8000

Start Frontend
Open a second terminal:
cd frontend
npm install
npm run dev

Frontend:
http://127.0.0.1:5173

Open the frontend URL in your browser.
Example Questions
PaperLens supports natural-language questions such as:
Text
"So what is this paper basically about?"

Chart
"What was the value shown in Q4?"

Table
"Which model performed best in the benchmark table?"

Messy Natural Language
"So which one actually did best on ChartQA, and like how much did it score compared to the others?"

Numerical
"What's the difference between Q4 and Q2?"

Trend
"Did the value keep increasing every quarter?"

Cross-Document
"How do the results in these two reports differ?"

Wrong Assumption
"DePlot got the highest score on ChartQA, right?"

The system should verify the claim against the document evidence rather than blindly accepting the assumption.
Testing
PaperLens should be evaluated across multiple dimensions.
Text Retrieval
Can the system retrieve the correct textual evidence?
Table Understanding
Can it identify values and relationships inside tables?
Chart Understanding
Can it answer questions that require visual chart interpretation?
Numerical Correctness
Can it correctly distinguish:
- Percentage
- Percentage points
- Relative improvement
- Absolute difference
Evidence Correctness
Does the cited page actually support the answer?
Cross-Document Retrieval
Can the system retrieve evidence from the correct document when multiple documents are available?
Messy Queries
Can it understand informal natural-language questions?
Example:
"that graph thing, did it keep going up and what's the q4 vs q2 difference?"

False Premises
Does the system correct incorrect assumptions instead of agreeing with them?
Unsupported Questions
Does the system avoid inventing information when the answer is not present in the uploaded documents?
Design Principles
PaperLens follows five core principles.
1. Grounded
Answers should be supported by document evidence.
2. Multimodal
The system should understand more than plain text.
3. Verifiable
Users should be able to inspect the evidence behind an answer.
4. Numerically Reliable
Calculations should be independently verified.
5. User-Friendly
Complex document intelligence should be presented through a simple interface.
What Makes PaperLens Different?
Many document QA systems focus primarily on:
Question → Answer

PaperLens focuses on:
Question
   ↓
Relevant Evidence
   ↓
Multimodal Reasoning
   ↓
Verification
   ↓
Answer
   ↓
Proof

Our Key Added Value
PaperLens makes the answer auditable.

The system combines:
- Evidence mapping
- Page-level citations
- Visual reasoning
- "Show Me the Proof"
- Deterministic calculations
- Cross-document comparison
- Explainable reasoning
The goal is not only to answer:
"What is the answer?"

but also:
"Where did this answer come from, and can I verify it?"

Limitations
PaperLens is a hackathon prototype and has practical limitations.
Potential limitations include:
- Performance may depend on document quality.
- Poor scans may reduce extraction accuracy.
- Highly complex visual layouts may require additional processing.
- Multimodal reasoning depends on the configured AI model.
- Very large document collections may require more advanced indexing infrastructure.
- External API availability and latency can affect response time.
Future Scope
Potential improvements include:
- Advanced OCR pipelines
- Better table structure extraction
- More specialized chart reasoning
- Larger-scale retrieval infrastructure
- Document-level confidence scoring
- Automated citation validation
- More document formats
- Enterprise document repositories
- Local or on-device inference
- Human feedback loops
- Advanced document analytics
AI and External Technology Disclosure
PaperLens uses external technologies as part of its implementation.
Open-Source Technologies
- React
- TypeScript
- Vite
- Python
- FastAPI
- PyMuPDF
AI
- Gemini multimodal reasoning
AI-Assisted Development
AI development tools were used during implementation and refinement of the project.
All external libraries, APIs, models, and services should be used according to their respective licenses and terms.
Demo Flow
A recommended live demonstration is:
1. Upload a document
        ↓
2. Show document processing
        ↓
3. Ask a text question
        ↓
4. Ask a chart question
        ↓
5. Show page-level evidence
        ↓
6. Ask a calculation question
        ↓
7. Show numerical verification
        ↓
8. Select multiple documents
        ↓
9. Run comparison
        ↓
10. Show evidence-backed comparison

Why PaperLens?
Documents contain answers in many different forms.
A paragraph may explain the result.
A table may contain the exact value.
A chart may reveal the trend.
A figure may contain critical information.
A calculation may connect two values.
PaperLens brings these forms of information together into one evidence-grounded workflow.
Read less. Verify more.

Repository
GitHub:
https://github.com/EUNICEMERCY123/PaperLens
Project
Problem Statement: HNX26PSI01 — Multimodal Document Intelligence
Project: PaperLens
Focus: Multimodal document understanding, evidence-grounded question answering, visual reasoning, numerical verification, and cross-document comparison.
Built for HackNex
PaperLens was developed as a solution for the HackNex Multimodal Document Intelligence challenge.

**One thing:** after pasting it, don't push immediately. First preview the README on GitHub/local VS Code and make sure the wording matches your final implementation. Then commit it as something like:

```powershell
git add README.md
git commit -m "Improve project documentation"
git push origin main

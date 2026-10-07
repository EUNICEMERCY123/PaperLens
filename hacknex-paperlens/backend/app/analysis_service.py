import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def analyze_paper(text):
    text = text.strip()

    # Keep the initial version within a reasonable input size
    text = text[:30000]

    prompt = f"""
You are PaperLens, an AI research-paper analysis assistant.

Analyze the academic paper below.

Return ONLY valid JSON.
Do not use markdown.
Do not add explanations outside the JSON.

Return exactly this structure:

{{
    "title": "",
    "abstract": "",
    "objective": "",
    "methodology": "",
    "dataset": "",
    "results": "",
    "conclusion": "",
    "key_contributions": [],
    "strengths": [],
    "weaknesses": [],
    "limitations": [],
    "research_gap": "",
    "future_work": []
}}

Instructions:

TITLE:
Extract the actual title.

ABSTRACT:
Summarize the paper's abstract/main purpose in 3-5 sentences.

OBJECTIVE:
Explain the main research problem, aim, or research question.

METHODOLOGY:
Explain the methods, algorithms, models, experiments, or procedures used.

DATASET:
Identify datasets, data sources, participants, sample size, or other relevant data.
If no dataset is used, explain what information/material was used.

RESULTS:
Summarize the main findings and important performance metrics.

CONCLUSION:
Summarize the authors' main conclusion.

KEY CONTRIBUTIONS:
List 3-5 important contributions made by the paper.

STRENGTHS:
List 3-5 strengths supported by evidence from the paper.

WEAKNESSES:
List 2-4 weaknesses or shortcomings that can reasonably be identified from the paper.

LIMITATIONS:
List limitations explicitly stated by the authors and clearly identifiable limitations.
Do not invent limitations.

RESEARCH GAP:
Identify what is still missing, unresolved, or insufficiently addressed by the paper.
Base this on the paper itself.

FUTURE WORK:
List future research directions mentioned by the authors.
If none are explicitly mentioned, provide reasonable directions clearly marked as potential future work.

IMPORTANT:
- Do not invent facts, datasets, results, or citations.
- If something genuinely cannot be determined, say "Not detected."
- Distinguish between what the authors explicitly state and your own analysis.
- Keep each item concise and useful.

RESEARCH PAPER:

{text}
"""

    import time
    last_err = None
    response = None
    for m_name in ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.8-flash"]:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=m_name,
                    contents=prompt
                )
                break
            except Exception as e:
                last_err = e
                if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e) or "404" in str(e):
                    break
                time.sleep(1.0)
        if response is not None:
            break

    if response is None:
        raise last_err

    result = response.text.strip()

    # Remove markdown code fences if Gemini adds them
    if result.startswith("```"):
        result = result.replace("```json", "")
        result = result.replace("```", "")
        result = result.strip()

    try:
        return json.loads(result)

    except json.JSONDecodeError:
        return {
            "title": "Analysis generated",
            "abstract": result,
            "objective": "Could not parse separately.",
            "methodology": "Could not parse separately.",
            "dataset": "Could not parse separately.",
            "results": "Could not parse separately.",
            "conclusion": "Could not parse separately.",
            "key_contributions": [],
            "strengths": [],
            "weaknesses": [],
            "limitations": [],
            "research_gap": "Could not parse separately.",
            "future_work": []
        }
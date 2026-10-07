import io
import sys
from pathlib import Path

# Ensure local venv site-packages is available
_venv_site = Path(__file__).resolve().parent.parent / "venv" / "Lib" / "site-packages"
if _venv_site.exists() and str(_venv_site) not in sys.path:
    sys.path.append(str(_venv_site))

import pymupdf
from PIL import Image, ImageDraw, ImageFont


def create_chart_image() -> bytes:
    """Generate a clean, high-contrast bar & line chart for quarterly efficiency."""
    width, height = 750, 420
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Title & border
    draw.rectangle([(20, 20), (width - 20, height - 20)], outline=(220, 220, 225), width=2)
    draw.text((40, 35), "FIGURE 3.1: QUARTERLY PRODUCTION EFFICIENCY (%)", fill=(30, 41, 59))

    # Chart Area
    origin_x, origin_y = 100, 340
    chart_w, chart_h = 580, 240

    # Gridlines & Y-axis labels
    y_levels = [50, 60, 70, 80, 90, 100]
    for y_val in y_levels:
        y_pos = origin_y - int((y_val - 50) / 50 * chart_h)
        draw.line([(origin_x, y_pos), (origin_x + chart_w, y_pos)], fill=(235, 238, 242), width=1)
        draw.text((55, y_pos - 7), f"{y_val}%", fill=(100, 116, 139))

    # Axis lines
    draw.line([(origin_x, origin_y), (origin_x + chart_w, origin_y)], fill=(71, 85, 105), width=2)
    draw.line([(origin_x, origin_y - chart_h), (origin_x, origin_y)], fill=(71, 85, 105), width=2)

    # Data points
    data = [
        ("Q1", 65, (79, 70, 229)),   # Indigo
        ("Q2", 72, (59, 130, 246)),  # Blue
        ("Q3", 79, (16, 185, 129)),  # Emerald
        ("Q4", 87, (239, 68, 68)),   # Red / Accent
    ]

    bar_width = 65
    spacing = 135
    line_points = []

    for i, (qtr, val, color) in enumerate(data):
        bx = origin_x + 55 + i * spacing
        bar_h = int((val - 50) / 50 * chart_h)
        by = origin_y - bar_h

        # Draw Bar with subtle gradient/border
        draw.rectangle([(bx, by), (bx + bar_width, origin_y)], fill=color, outline=(30, 41, 59), width=1)

        # Value label on top of bar
        draw.text((bx + 15, by - 22), f"{val}%", fill=(15, 23, 42))

        # X-axis label
        draw.text((bx + 20, origin_y + 12), qtr, fill=(51, 65, 85))

        center_x = bx + bar_width // 2
        line_points.append((center_x, by))

    # Draw trendline connecting tops
    for i in range(len(line_points) - 1):
        draw.line([line_points[i], line_points[i + 1]], fill=(15, 23, 42), width=3)
        draw.ellipse([(line_points[i][0] - 4, line_points[i][1] - 4), (line_points[i][0] + 4, line_points[i][1] + 4)], fill=(255, 255, 255), outline=(15, 23, 42), width=2)
    
    last_pt = line_points[-1]
    draw.ellipse([(last_pt[0] - 4, last_pt[1] - 4), (last_pt[0] + 4, last_pt[1] + 4)], fill=(255, 255, 255), outline=(15, 23, 42), width=2)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def create_scanned_memo_image() -> bytes:
    """Generate a realistic scanned memorandum page with slight grain & audit stamp."""
    width, height = 750, 950
    # Aged warm cream paper
    img = Image.new("RGB", (width, height), color=(248, 246, 238))
    draw = ImageDraw.Draw(img)

    # Document Header
    draw.text((60, 60), "CONFIDENTIAL INTERNAL AUDIT MEMORANDUM", fill=(70, 70, 70))
    draw.line([(60, 85), (width - 60, 85)], fill=(160, 160, 160), width=1)

    draw.text((60, 110), "TO: Executive Operations Committee", fill=(60, 60, 60))
    draw.text((60, 135), "FROM: Global Quality & Audit Verification Unit", fill=(60, 60, 60))
    draw.text((60, 160), "DATE: December 18, 2025", fill=(60, 60, 60))
    draw.text((60, 185), "SUBJECT: Verification of Q4 Plant Performance & Historical Benchmarks", fill=(60, 60, 60))
    draw.line([(60, 215), (width - 60, 215)], fill=(160, 160, 160), width=1)

    memo_body = [
        "1. AUDIT SUMMARY AND INDEPENDENT CONFIRMATION",
        "Our independent quality engineering team completed an on-site physical inspection",
        "of production facilities across both North American and European manufacturing plants.",
        "",
        "2. EFFICIENCY FINDINGS VERIFICATION",
        "We independently verified that Q4 production efficiency reached approximately 87%,",
        "representing a confirmed 15 percentage point improvement over the Q2 benchmark of 72%.",
        "All telemetry records match the industrial sensor logs without discrepancy.",
        "",
        "3. THREE PRIMARY ROOT CAUSES CONFIRMED",
        "A) Automated assembly robotics deployed on Cell B reduced cycle downtime by 44%.",
        "B) Tier-1 supplier contract renegotiation ensured uninterrupted raw material flow.",
        "C) Predictive vibration sensors prevented three major kiln outages.",
        "",
        "4. AUDITOR'S CONCLUSION",
        "The historical benchmark is officially certified as authentic and fully compliant."
    ]

    y_pos = 250
    for line in memo_body:
        draw.text((60, y_pos), line, fill=(50, 50, 50))
        y_pos += 26

    # Stamped Official Seal
    draw.rectangle([(width - 270, height - 200), (width - 70, height - 80)], outline=(180, 40, 40), width=3)
    draw.text((width - 250, height - 180), "OFFICIALLY AUDITED", fill=(180, 40, 40))
    draw.text((width - 250, height - 150), "STATUS: VERIFIED 87%", fill=(180, 40, 40))
    draw.text((width - 250, height - 120), "SEAL REF: #AQ-2025-994", fill=(180, 40, 40))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_benchmark_documents(output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # -------------------------------------------------------------
    # 1. Annual_Report.pdf (3 pages)
    # -------------------------------------------------------------
    annual_path = output_dir / "Annual_Report.pdf"
    doc_annual = pymupdf.open()

    # Page 1: Executive Overview & Three Main Reasons
    p1 = doc_annual.new_page(width=595, height=842) # A4
    p1.insert_text((50, 60), "ACME INDUSTRIAL TECHNOLOGIES", fontsize=18, fontname="helv", color=(0.1, 0.2, 0.4))
    p1.insert_text((50, 85), "Annual Operational Review & Performance Report — Fiscal 2025", fontsize=12, fontname="helv", color=(0.3, 0.3, 0.3))
    p1.draw_line((50, 100), (545, 100), color=(0.7, 0.7, 0.7), width=1)

    p1.insert_text((50, 130), "1. Executive Summary & Operational Strategy", fontsize=14, fontname="helv", color=(0.1, 0.1, 0.1))
    
    text_p1 = (
        "During fiscal year 2025, Acme Industrial Technologies undertook a comprehensive modernization\n"
        "program across manufacturing lines. The primary objective was to expand throughput capacity\n"
        "while simultaneously driving double-digit efficiency improvements across all quarters."
    )
    p1.insert_text((50, 155), text_p1, fontsize=10, fontname="helv", color=(0.2, 0.2, 0.2))

    p1.insert_text((50, 220), "2. Three Primary Factors Driving the Production Change", fontsize=13, fontname="helv", color=(0.1, 0.1, 0.1))
    reasons_text = (
        "Across the operational analysis, three key factors contributed most significantly to the gains:\n\n"
        "1. Automated Assembly Robotics:\n"
        "   Commissioned in Q3 across all primary cells, eliminating manual assembly bottlenecks and\n"
        "   reducing cycle times by 32%.\n\n"
        "2. Supplier Tier-1 Optimization:\n"
        "   Streamlined procurement cycles with strategic partners, eliminating parts starvation and\n"
        "   cutting component delivery wait-times by 40%.\n\n"
        "3. Predictive Maintenance Systems:\n"
        "   Continuous IoT sensor telemetry enabled proactive servicing, reducing unplanned machine\n"
        "   downtime from 14% in Q2 down to 3.2% by Q4."
    )
    p1.insert_text((50, 245), reasons_text, fontsize=10, fontname="helv", color=(0.2, 0.2, 0.2))
    p1.insert_text((50, 790), "Page 1 of 3 · Annual_Report.pdf · Operational Review", fontsize=8, color=(0.5, 0.5, 0.5))

    # Page 2: Financial Performance & Tables
    p2 = doc_annual.new_page(width=595, height=842)
    p2.insert_text((50, 60), "2. Financial Breakdown & Regional Performance", fontsize=16, fontname="helv", color=(0.1, 0.2, 0.4))
    p2.draw_line((50, 80), (545, 80), color=(0.7, 0.7, 0.7), width=1)

    p2.insert_text((50, 110), "Table 1: Regional Revenue Breakdown (FY2025)", fontsize=12, fontname="helv", color=(0.1, 0.1, 0.1))

    # Draw structured Table 1 using vector rectangles and text
    table_headers = ["Region", "Revenue ($M)", "YoY Growth", "Performance Status"]
    table_rows = [
        ["North America", "$4.8M", "+18.4%", "Highest Performing"],
        ["Europe", "$3.2M", "+9.1%", "Steady Growth"],
        ["Asia-Pacific", "$2.9M", "+14.6%", "Accelerating"],
        ["Latin America", "$1.1M", "+5.3%", "Emerging Market"]
    ]

    col_widths = [140, 110, 110, 135]
    start_x, start_y = 50, 130
    row_h = 24

    # Header Row
    p2.draw_rect(pymupdf.Rect(start_x, start_y, start_x + sum(col_widths), start_y + row_h), color=(0.2, 0.3, 0.5), fill=(0.9, 0.93, 0.98))
    cx = start_x
    for i, h in enumerate(table_headers):
        p2.insert_text((cx + 8, start_y + 16), h, fontsize=9, fontname="helv", color=(0.1, 0.1, 0.3))
        cx += col_widths[i]

    # Data Rows
    for r_idx, row in enumerate(table_rows):
        ry = start_y + (r_idx + 1) * row_h
        fill_col = (0.98, 0.98, 0.99) if r_idx % 2 == 0 else (1.0, 1.0, 1.0)
        p2.draw_rect(pymupdf.Rect(start_x, ry, start_x + sum(col_widths), ry + row_h), color=(0.8, 0.8, 0.8), fill=fill_col)
        cx = start_x
        for i, val in enumerate(row):
            p2.insert_text((cx + 8, ry + 16), val, fontsize=9, fontname="helv", color=(0.15, 0.15, 0.15))
            cx += col_widths[i]

    # Draw explicit outer and inner grid lines for PyMuPDF table detection
    total_w = sum(col_widths)
    total_h = (len(table_rows) + 1) * row_h
    # Horizontal grid lines
    for line_idx in range(len(table_rows) + 2):
        ly = start_y + line_idx * row_h
        p2.draw_line((start_x, ly), (start_x + total_w, ly), color=(0.4, 0.4, 0.5), width=1)
    # Vertical grid lines
    vx = start_x
    p2.draw_line((vx, start_y), (vx, start_y + total_h), color=(0.4, 0.4, 0.5), width=1)
    for w in col_widths:
        vx += w
        p2.draw_line((vx, start_y), (vx, start_y + total_h), color=(0.4, 0.4, 0.5), width=1)

    # Additional text
    p2.insert_text((50, 300), "Financial Summary:", fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))
    p2.insert_text((50, 320), "North America had the highest revenue at $4.8M, representing 40% of total group turnover.", fontsize=10, fontname="helv", color=(0.2, 0.2, 0.2))

    p2.insert_text((50, 790), "Page 2 of 3 · Annual_Report.pdf · Regional Financials", fontsize=8, color=(0.5, 0.5, 0.5))

    # Page 3: Visual Chart & Efficiency Metrics
    p3 = doc_annual.new_page(width=595, height=842)
    p3.insert_text((50, 60), "3. Production Efficiency Metrics & Visual Analysis", fontsize=16, fontname="helv", color=(0.1, 0.2, 0.4))
    p3.draw_line((50, 80), (545, 80), color=(0.7, 0.7, 0.7), width=1)

    p3.insert_text((50, 110), "Quarterly Efficiency Analysis (Q1 - Q4):", fontsize=12, fontname="helv", color=(0.1, 0.1, 0.1))
    p3.insert_text((50, 130), "As depicted in the visual chart below, operational efficiency exhibited substantial quarterly progress.", fontsize=10, fontname="helv", color=(0.2, 0.2, 0.2))

    # Insert rendered chart image
    chart_bytes = create_chart_image()
    chart_rect = pymupdf.Rect(50, 160, 545, 450)
    p3.insert_image(chart_rect, stream=chart_bytes)

    chart_analysis = (
        "Visual Analysis Notes:\n"
        "• Q1 production efficiency recorded at 65%.\n"
        "• Q2 production efficiency stabilized at 72%.\n"
        "• Q3 production efficiency increased to 79% following robotics installation.\n"
        "• Q4 production efficiency reached the annual peak of approximately 87%.\n"
        "• Overall increase between Q2 (72%) and Q4 (87%) equals 15 percentage points."
    )
    p3.insert_text((50, 480), chart_analysis, fontsize=10, fontname="helv", color=(0.2, 0.2, 0.2))

    p3.insert_text((50, 790), "Page 3 of 3 · Annual_Report.pdf · Visual Production Efficiency", fontsize=8, color=(0.5, 0.5, 0.5))
    doc_annual.save(str(annual_path))
    doc_annual.close()

    # -------------------------------------------------------------
    # 2. Q4_Report.pdf (2 pages - includes scanned memo page)
    # -------------------------------------------------------------
    q4_path = output_dir / "Q4_Report.pdf"
    doc_q4 = pymupdf.open()

    # Page 1: Q4 Specific Review
    q_p1 = doc_q4.new_page(width=595, height=842)
    q_p1.insert_text((50, 60), "ACME INDUSTRIAL — Q4 SPECIFIC OPERATIONAL REVIEW", fontsize=16, fontname="helv", color=(0.1, 0.2, 0.4))
    q_p1.draw_line((50, 80), (545, 80), color=(0.7, 0.7, 0.7), width=1)

    q4_summary = (
        "Quarter 4 Operational Performance Deep Dive:\n\n"
        "The fourth quarter represented our strongest operational period of the fiscal year.\n"
        "Production efficiency surged to 87%, exceeding internal expectations and confirming\n"
        "the success of the factory automation rollout.\n\n"
        "When compared to the second quarter baseline of 72%, Q4 demonstrated an absolute efficiency\n"
        "increase of 15 percentage points (87% - 72% = 15 percentage points).\n\n"
        "Key drivers cited by plant management:\n"
        "1. Full capacity utilization of automated robotic assembly.\n"
        "2. Zero supply disruptions due to supplier tier-1 contract renegotiations.\n"
        "3. Predictive telemetry preventing catastrophic line stoppages."
    )
    q_p1.insert_text((50, 120), q4_summary, fontsize=10, fontname="helv", color=(0.2, 0.2, 0.2))
    q_p1.insert_text((50, 790), "Page 1 of 2 · Q4_Report.pdf · Operations Deep Dive", fontsize=8, color=(0.5, 0.5, 0.5))

    # Page 2: Scanned Audit Memorandum (Image-only page to exercise OCR fallback)
    q_p2 = doc_q4.new_page(width=595, height=842)
    scanned_memo_bytes = create_scanned_memo_image()
    # Insert as full-page image without digital text to simulate scanned document
    q_p2.insert_image(pymupdf.Rect(0, 0, 595, 842), stream=scanned_memo_bytes)

    doc_q4.save(str(q4_path))
    doc_q4.close()

    print(f"Sample benchmark documents generated at {output_dir}:")
    print(f" - {annual_path.name}")
    print(f" - {q4_path.name}")


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "uploads" / "samples"
    generate_benchmark_documents(out)

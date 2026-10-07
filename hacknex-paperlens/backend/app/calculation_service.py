import re
from typing import Optional, List, Tuple
from app.models import CalculationItem


def clean_number(num_str: str) -> float:
    """Extract numeric float from string like '87%', '$4.8M', '72', etc."""
    cleaned = num_str.replace("$", "").replace("%", "").replace(",", "").strip()
    multiplier = 1.0
    if cleaned.upper().endswith("M"):
        multiplier = 1_000_000.0
        cleaned = cleaned[:-1].strip()
    elif cleaned.upper().endswith("K"):
        multiplier = 1_000.0
        cleaned = cleaned[:-1].strip()
    elif cleaned.upper().endswith("B"):
        multiplier = 1_000_000_000.0
        cleaned = cleaned[:-1].strip()
    return float(cleaned) * multiplier


def evaluate_expression(expr: str) -> Optional[CalculationItem]:
    """
    Safely evaluate an arithmetic expression or normalize calculation steps.
    Supports expressions like '87 - 72', '87% - 72%', '((87 - 72) / 72) * 100', etc.
    """
    if not expr or not expr.strip():
        return None

    expr_clean = expr.strip()
    
    # Check if expression contains percentage signs
    is_percentage = "%" in expr_clean or "percentage points" in expr_clean.lower()
    
    # Try simple subtraction e.g. "87% - 72%" or "87 - 72"
    sub_match = re.search(r'([\d\.]+)\s*%\s*-\s*([\d\.]+)\s*%', expr_clean)
    if not sub_match:
        sub_match = re.search(r'([\d\.]+)\s*-\s*([\d\.]+)', expr_clean)
    
    if sub_match:
        val1 = float(sub_match.group(1))
        val2 = float(sub_match.group(2))
        diff = val1 - val2
        diff_str = f"{diff:+.1f}".rstrip('0').rstrip('.') if '.' in f"{diff:+.1f}" else f"{diff:+d}"
        if not diff_str.startswith("+") and not diff_str.startswith("-"):
            diff_str = f"+{diff_str}" if diff >= 0 else str(diff_str)
        
        unit = " percentage points" if is_percentage else ""
        result_text = f"{diff_str}{unit}"
        
        steps = [
            f"Value 1: {val1}%" if is_percentage else f"Value 1: {val1}",
            f"Value 2: {val2}%" if is_percentage else f"Value 2: {val2}",
            f"Difference = {val1} - {val2} = {diff_str}{unit}"
        ]
        
        return CalculationItem(
            expression=f"{val1}{'%' if is_percentage else ''} - {val2}{'%' if is_percentage else ''}",
            result=result_text,
            steps=steps,
            verified=True
        )

    # Percentage change: ((new - old) / old) * 100
    pct_change_match = re.search(r'\(\s*\(\s*([\d\.]+)\s*-\s*([\d\.]+)\s*\)\s*/\s*([\d\.]+)\s*\)\s*\*\s*100', expr_clean)
    if pct_change_match:
        v_new = float(pct_change_match.group(1))
        v_old = float(pct_change_match.group(2))
        if v_old != 0:
            pct_change = ((v_new - v_old) / v_old) * 100
            steps = [
                f"Initial value: {v_old}",
                f"New value: {v_new}",
                f"Absolute change: {v_new - v_old}",
                f"Percentage change: (({v_new} - {v_old}) / {v_old}) × 100 = {pct_change:+.2f}%"
            ]
            return CalculationItem(
                expression=f"(({v_new} - {v_old}) / {v_old}) × 100",
                result=f"{pct_change:+.2f}%",
                steps=steps,
                verified=True
            )

    # General safe math evaluation for basic expressions [0-9 + - * / . ( )]
    sanitized = re.sub(r'[^0-9\+\-\*\/\.\(\)\s]', '', expr_clean)
    if sanitized:
        try:
            # Safe evaluation using simple eval of arithmetic tokens only
            val = eval(sanitized, {"__builtins__": None}, {})
            if isinstance(val, (int, float)):
                res_str = f"{val:.2f}".rstrip('0').rstrip('.')
                return CalculationItem(
                    expression=sanitized,
                    result=res_str,
                    steps=[f"Evaluated {sanitized} = {res_str}"],
                    verified=True
                )
        except Exception:
            pass

    return CalculationItem(
        expression=expr_clean,
        result=expr_clean,
        steps=[expr_clean],
        verified=False
    )

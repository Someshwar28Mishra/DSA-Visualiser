"""
snapshot.py — Captures variable state at each execution step.
Converts raw Python values into typed DSA snapshots.
"""

import copy
from typing import Any


def _serialize_value(val: Any) -> Any:
    """Recursively serialize a Python value to a JSON-safe structure."""
    if isinstance(val, (int, float, bool, str, type(None))):
        return val
    if isinstance(val, (list, tuple)):
        return [_serialize_value(v) for v in val]
    if isinstance(val, dict):
        return {str(k): _serialize_value(v) for k, v in val.items()}
    if isinstance(val, set):
        return list(val)
    return str(val)


def _detect_type(variables: dict) -> str:
    """Auto-detect the primary DSA type from the current variable state."""
    for name, val in variables.items():
        if name.startswith("_"):
            continue
        if isinstance(val, list):
            # Check if it's a list of lists → could be adjacency list / 2D
            if val and isinstance(val[0], list):
                return "matrix"
            # Check if elements are dicts with 'node'/'neighbor' keys → graph
            if val and isinstance(val[0], dict) and ("neighbors" in val[0] or "edges" in val[0]):
                return "graph"
            return "array"
        if isinstance(val, dict):
            # If values are lists → adjacency list graph
            if val and all(isinstance(v, list) for v in val.values()):
                return "graph"
            # If values are dicts with left/right → tree
            if val and all(isinstance(v, dict) for v in val.values()):
                return "tree"
    return "array"


def build_snapshot(
    lineno: int,
    filename: str,
    local_vars: dict,
    highlights: dict,
    description: str = "",
    code_lines: list = None,
) -> dict:
    """
    Build a single step snapshot.

    Returns:
        {
          "line": int,
          "description": str,
          "code_line": str,
          "type": "array" | "graph" | "tree" | "matrix",
          "variables": { name: serialized_value },
          "highlights": { name: [indices] },
          "swapped": bool,
        }
    """
    safe_vars = {}
    for name, val in local_vars.items():
        if name.startswith("_") or callable(val):
            continue
        try:
            safe_vars[name] = _serialize_value(copy.deepcopy(val))
        except Exception:
            safe_vars[name] = str(val)

    dsa_type = _detect_type(safe_vars)
    code_line = ""
    if code_lines and 1 <= lineno <= len(code_lines):
        code_line = code_lines[lineno - 1].rstrip()

    return {
        "line": lineno,
        "code_line": code_line,
        "description": description,
        "type": dsa_type,
        "variables": safe_vars,
        "highlights": highlights,
        "swapped": highlights.get("swapped", False),
    }

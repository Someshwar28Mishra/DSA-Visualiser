"""
executor.py — Safe code execution engine using sys.settrace.
Captures step-by-step variable snapshots with control-flow metadata.
"""

import sys
import copy
import traceback
from typing import List, Dict, Any


# Variables to ignore (Python internals and our own injected names)
_IGNORED = frozenset([
    "__builtins__", "__name__", "__doc__", "__package__",
    "__loader__", "__spec__", "__annotations__", "__file__",
    "_tracer_snapshots", "_tracer_highlights", "_tracer_code_lines",
    "_tracer_prev_vars",
])

# Safe builtins allowed in user code
_SAFE_BUILTINS = {
    "range": range, "len": len, "print": print, "enumerate": enumerate,
    "zip": zip, "sorted": sorted, "reversed": reversed, "min": min,
    "max": max, "abs": abs, "sum": sum, "list": list, "dict": dict,
    "set": set, "tuple": tuple, "int": int, "float": float, "str": str,
    "bool": bool, "True": True, "False": False, "None": None,
    "append": None,  # methods handled via object
}


def _serialize(val: Any) -> Any:
    if isinstance(val, bool):
        return val
    if isinstance(val, float):
        if val == float('inf'):  return "Infinity"
        if val == float('-inf'): return "-Infinity"
        if val != val:           return "NaN"   # nan check
        return val
    if isinstance(val, (int, str, type(None))):
        return val
    if isinstance(val, (list, tuple)):
        return [_serialize(v) for v in val]
    if isinstance(val, dict):
        return {str(k): _serialize(v) for k, v in val.items()}
    if isinstance(val, set):
        return sorted([_serialize(v) for v in val], key=str)
    return str(val)


def _is_binary_tree(val: dict) -> bool:
    """Return True if val looks like a binary-tree dict: {node: [left, right]}
    where every value is a 2-element list whose elements are int or None."""
    if not val:
        return False
    for v in val.values():
        if not (isinstance(v, (list, tuple)) and len(v) == 2):
            return False
        left, right = v
        if not (left is None or isinstance(left, int)) or \
           not (right is None or isinstance(right, int)):
            return False
    return True


def _detect_type(variables: dict) -> str:
    # Check tree FIRST (before graph) — binary tree dict: node -> [left, right]
    for name, val in variables.items():
        if isinstance(val, dict) and val:
            if _is_binary_tree(val):
                return "tree"

    for name, val in variables.items():
        if isinstance(val, dict) and val:
            # Graph: dict whose values are all lists (adjacency list)
            if all(isinstance(v, list) for v in val.values()):
                return "graph"

    # Second pass: check for 2D arrays (prefer matrix over array)
    for name, val in variables.items():
        if isinstance(val, list) and len(val) > 0:
            if all(isinstance(x, list) for x in val):
                return "matrix"
    # Fallback to array
    for name, val in variables.items():
        if isinstance(val, list):
            return "array"
    return "array"



def _classify_line(stripped: str) -> str:
    """Classify a stripped code line into a control-flow category."""
    if stripped.startswith(("for ", "for\t")):
        return "for_loop"
    if stripped.startswith(("while ", "while\t")):
        return "while_loop"
    if stripped.startswith(("if ", "if\t")):
        return "if_cond"
    if stripped.startswith(("elif ", "elif\t")):
        return "elif_cond"
    if stripped.startswith("else:") or stripped == "else":
        return "else_branch"
    if stripped.startswith("return"):
        return "return_stmt"
    if stripped.startswith(("break", "continue")):
        return "loop_control"
    if "=" in stripped and "==" not in stripped and "!=" not in stripped and ">=" not in stripped and "<=" not in stripped:
        return "assignment"
    return "expression"


def _extract_loop_var(stripped: str, local_vars: dict) -> dict:
    """For a 'for x in ...' line, extract the current value of loop variable."""
    if not stripped.startswith("for "):
        return {}
    try:
        # "for x in ..." → loop_var = "x"
        parts = stripped[4:].split(" in ", 1)
        if parts:
            var_name = parts[0].strip()
            if "," in var_name:  # tuple unpacking: "for i, v in enumerate(...)"
                names = [n.strip() for n in var_name.strip("()").split(",")]
                return {n: local_vars.get(n) for n in names if n in local_vars}
            if var_name in local_vars:
                return {var_name: local_vars[var_name]}
    except Exception:
        pass
    return {}


def _infer_description(
    lineno: int, code_lines: list, local_vars: dict,
    prev_vars: dict, ctrl_type: str, iter_count: int,
) -> str:
    """Generate human-readable description of what happened at this step."""
    if not code_lines or lineno < 1 or lineno > len(code_lines):
        return f"Line {lineno}"

    line = code_lines[lineno - 1].strip()

    # Detect array modifications
    for name, val in local_vars.items():
        if name in prev_vars and isinstance(val, list) and isinstance(prev_vars.get(name), list):
            if val != prev_vars[name]:
                return f"Array `{name}` modified"

    if ctrl_type == "for_loop":
        loop_var_parts = []
        for k, v in local_vars.items():
            if k in ("i", "j", "k", "x", "y", "v", "val", "num", "char", "item", "node"):
                loop_var_parts.append(f"{k}={v}")
        var_str = ", ".join(loop_var_parts) if loop_var_parts else ""
        return f"🔄 Loop iteration #{iter_count}" + (f"  [{var_str}]" if var_str else "")

    if ctrl_type == "while_loop":
        return f"🔄 While loop check (×{iter_count})"

    if ctrl_type == "if_cond":
        return f"❓ Condition check: {line}"

    if ctrl_type == "elif_cond":
        return f"❓ elif check: {line}"

    if ctrl_type == "else_branch":
        return f"↪ else branch taken"

    if ctrl_type == "return_stmt":
        return "↩ Returning value"

    if ctrl_type == "loop_control":
        return f"⚡ {line}"

    if ctrl_type == "assignment":
        return f"📝 {line}"

    return f"▶ {line}"


# Types that should be forced via algo_hint (not auto-detected)
_DS_TYPES = frozenset({"stack", "queue", "deque", "linked_list", "hashmap"})

# Control-flow categories
_LOOP_TYPES    = frozenset({"for_loop", "while_loop"})
_COND_TYPES    = frozenset({"if_cond", "elif_cond", "else_branch"})


def execute_and_trace(code: str, algo_hint: str = "auto") -> Dict[str, Any]:
    """
    Execute `code` and return a list of snapshots, one per line executed.

    Returns:
        {
            "snapshots": [...],
            "error": str | None,
            "total_steps": int,
        }
    """
    snapshots: List[dict] = []
    code_lines = code.splitlines()
    error_msg = None
    prev_vars: dict = {}
    line_counts: Dict[int, int] = {}   # lineno -> execution count

    def tracer(frame, event, arg):
        nonlocal prev_vars
        if event not in ("line", "return"):
            return tracer
        if frame.f_code.co_filename != "<dsa_exec>":
            return tracer

        lineno = frame.f_lineno
        local_vars = {}

        for k, v in frame.f_locals.items():
            if k in _IGNORED or callable(v):
                continue
            try:
                local_vars[k] = _serialize(copy.deepcopy(v))
            except Exception:
                local_vars[k] = str(v)

        # ── Control flow classification ──────────────────────────────────
        stripped = code_lines[lineno - 1].strip() if 1 <= lineno <= len(code_lines) else ""
        ctrl_type = _classify_line(stripped)

        # Track per-line execution counts (= loop iteration counter)
        line_counts[lineno] = line_counts.get(lineno, 0) + 1
        iter_count = line_counts[lineno]

        # For conditionals: track what branch was resolved on the NEXT step
        # We store the branch result in the *prev* snapshot by comparing
        # which line came next — handled on the frontend from line sequences.
        # Here we emit the raw info; frontend does the "was branch taken?" inference.

        # Extract loop variable values for the current iteration
        loop_vars = {}
        if ctrl_type in _LOOP_TYPES:
            loop_vars = _extract_loop_var(stripped, local_vars)

        # ── Highlights ───────────────────────────────────────────────────
        highlights: Dict[str, Any] = {}
        idx_vars = {k: v for k, v in local_vars.items()
                    if isinstance(v, int) and k in ("i", "j", "k", "lo", "hi", "mid", "left", "right", "l", "r", "pivot", "row", "col", "r", "c")}

        for arr_name, arr_val in local_vars.items():
            if isinstance(arr_val, list) and arr_val:
                highlighted_idxs = [v for v in idx_vars.values()
                                     if isinstance(v, int) and 0 <= v < len(arr_val)]
                if highlighted_idxs:
                    highlights[arr_name] = highlighted_idxs

        # Matrix cell highlights: intelligently map loop variables to [row, col]
        # Supports Floyd-Warshall style (k, i, j) and standard (i, j) / (row, col)
        matrix_cell = None
        # Check if there's a matrix (2D list) in locals
        has_matrix = any(
            isinstance(v, list) and v and all(isinstance(x, list) for x in v)
            for v in local_vars.values()
        )
        if has_matrix:
            # Floyd-Warshall / 3-index pattern: prefer i, j as the cell being computed
            i_val   = local_vars.get("i")
            j_val   = local_vars.get("j")
            row_val = local_vars.get("row") if i_val is None else None
            col_val = local_vars.get("col") if j_val is None else None

            row_idx = i_val if isinstance(i_val, int) else (row_val if isinstance(row_val, int) else None)
            col_idx = j_val if isinstance(j_val, int) else (col_val if isinstance(col_val, int) else None)

            if isinstance(row_idx, int) and isinstance(col_idx, int):
                matrix_cell = [row_idx, col_idx]

            # Expose intermediate vertex k for Floyd-Warshall
            k_val = local_vars.get("k")

        # ── Type detection ───────────────────────────────────────────────
        if algo_hint in _DS_TYPES:
            dsa_type = algo_hint
        else:
            dsa_type = _detect_type(local_vars)

        description = _infer_description(lineno, code_lines, local_vars, prev_vars, ctrl_type, iter_count)
        prev_vars = copy.deepcopy(local_vars)

        code_line = code_lines[lineno - 1].rstrip() if 1 <= lineno <= len(code_lines) else ""

        # ── Graph edge detection ──────────────────────────────────────────
        # Detect the currently relaxed / explored edge for graph algorithms
        active_edge = None
        has_graph = any(
            isinstance(v, dict) and v and all(isinstance(x, list) for x in v.values())
            for v in local_vars.values()
        )
        if has_graph:
            node_val     = local_vars.get("node")
            neighbor_val = local_vars.get("neighbor")
            u_val        = local_vars.get("u")
            v_val        = local_vars.get("v")
            src_val      = local_vars.get("src")
            dst_val      = local_vars.get("dst")

            if node_val is not None and neighbor_val is not None:
                active_edge = [str(node_val), str(neighbor_val)]
            elif u_val is not None and v_val is not None and not isinstance(u_val, list):
                active_edge = [str(u_val), str(v_val)]
            elif src_val is not None and dst_val is not None:
                active_edge = [str(src_val), str(dst_val)]

        # Intermediate_vertex = k in triple-loop matrix algorithms (Floyd-Warshall)
        intermediate_vertex = None
        try:
            if has_matrix and isinstance(k_val, int):
                intermediate_vertex = k_val
        except NameError:
            pass

        snapshot = {
            "line":               lineno,
            "code_line":          code_line,
            "description":        description,
            "type":               dsa_type,
            "variables":          local_vars,
            "highlights":         highlights,
            # ── Control flow metadata ──
            "ctrl_type":          ctrl_type,
            "iter_count":         iter_count,
            "loop_vars":          loop_vars,
            "matrix_cell":        matrix_cell,
            "intermediate_vertex": intermediate_vertex,
            "active_edge":        active_edge,
            "is_loop":            ctrl_type in _LOOP_TYPES,
            "is_condition":       ctrl_type in _COND_TYPES,
        }
        snapshots.append(snapshot)
        return tracer

    # Compile and run
    try:
        compiled = compile(code, "<dsa_exec>", "exec")
        namespace: dict = {"__builtins__": __builtins__}
        sys.settrace(tracer)
        try:
            exec(compiled, namespace)
        finally:
            sys.settrace(None)
    except Exception as e:
        sys.settrace(None)
        error_msg = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"

    return {
        "snapshots": snapshots,
        "error": error_msg,
        "total_steps": len(snapshots),
    }

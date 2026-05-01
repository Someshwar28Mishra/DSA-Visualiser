"""
multi_executor.py — Enhanced code execution engine that captures ALL variables
and their data-structure types per step, enabling multi-DS visualization.
Also captures stdout (print) output per snapshot.
"""

import sys
import io
import copy
import traceback
from typing import List, Dict, Any, Optional


_IGNORED = frozenset([
    "__builtins__", "__name__", "__doc__", "__package__",
    "__loader__", "__spec__", "__annotations__", "__file__",
    "_tracer_snapshots", "_tracer_highlights", "_tracer_code_lines",
    "_tracer_prev_vars",
])


def _serialize(val: Any) -> Any:
    if isinstance(val, bool):
        return val
    if isinstance(val, float):
        if val == float('inf'):  return "Infinity"
        if val == float('-inf'): return "-Infinity"
        if val != val:           return "NaN"
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


def _detect_var_type(name: str, val: Any) -> Optional[str]:
    """Detect the data-structure type of a single variable."""
    if isinstance(val, dict) and val:
        if _is_binary_tree(val):
            return "tree"
        if all(isinstance(v, list) for v in val.values()):
            return "graph"
        return "hashmap"
    if isinstance(val, list) and len(val) > 0:
        if all(isinstance(x, list) for x in val):
            return "matrix"
        return "array"
    return None


def _classify_line(stripped: str) -> str:
    if stripped.startswith(("for ", "for\t")):    return "for_loop"
    if stripped.startswith(("while ", "while\t")): return "while_loop"
    if stripped.startswith(("if ", "if\t")):       return "if_cond"
    if stripped.startswith(("elif ", "elif\t")):   return "elif_cond"
    if stripped.startswith("else:") or stripped == "else": return "else_branch"
    if stripped.startswith("return"):              return "return_stmt"
    if stripped.startswith(("break", "continue")): return "loop_control"
    if "=" in stripped and "==" not in stripped and "!=" not in stripped \
       and ">=" not in stripped and "<=" not in stripped:
        return "assignment"
    return "expression"


def _infer_description(lineno, code_lines, local_vars, prev_vars, ctrl_type, iter_count):
    if not code_lines or lineno < 1 or lineno > len(code_lines):
        return f"Line {lineno}"
    line = code_lines[lineno - 1].strip()

    for name, val in local_vars.items():
        if name in prev_vars and isinstance(val, list) and isinstance(prev_vars.get(name), list):
            if val != prev_vars[name]:
                return f"Array `{name}` modified"

    if ctrl_type == "for_loop":
        loop_var_parts = []
        for k, v in local_vars.items():
            if k in ("i", "j", "k", "x", "y", "v", "val", "num", "char", "item", "node"):
                loop_var_parts.append(f"{k}={v}")
        var_str = ", ".join(loop_var_parts)
        return f"🔄 Loop iteration #{iter_count}" + (f"  [{var_str}]" if var_str else "")
    if ctrl_type == "while_loop":   return f"🔄 While loop check (×{iter_count})"
    if ctrl_type == "if_cond":      return f"❓ Condition check: {line}"
    if ctrl_type == "elif_cond":    return f"❓ elif check: {line}"
    if ctrl_type == "else_branch":  return f"↪ else branch taken"
    if ctrl_type == "return_stmt":  return "↩ Returning value"
    if ctrl_type == "loop_control": return f"⚡ {line}"
    if ctrl_type == "assignment":   return f"📝 {line}"
    return f"▶ {line}"


_DS_TYPES = frozenset({"stack", "queue", "deque", "linked_list", "hashmap"})
_LOOP_TYPES = frozenset({"for_loop", "while_loop"})
_COND_TYPES = frozenset({"if_cond", "elif_cond", "else_branch"})


def execute_and_trace_multi(code: str, algo_hint: str = "auto") -> Dict[str, Any]:
    """
    Execute `code` and return step-by-step snapshots with per-variable type info.
    Each snapshot's `variables` is a dict of { name: { value, type } }.
    Also includes a top-level `type` for backward compat with existing visualizers.
    stdout from print() calls is captured and included in each snapshot.
    """
    snapshots: List[dict] = []
    code_lines = code.splitlines()
    error_msg = None
    prev_vars: dict = {}
    line_counts: Dict[int, int] = {}
    stdout_capture = io.StringIO()
    stdout_so_far: str = ""

    def tracer(frame, event, arg):
        nonlocal prev_vars, stdout_so_far
        if event not in ("line", "return"):
            return tracer
        if frame.f_code.co_filename != "<dsa_exec>":
            return tracer

        # Capture any new stdout output since last snapshot
        current_stdout = stdout_capture.getvalue()
        new_output = current_stdout[len(stdout_so_far):] if len(current_stdout) > len(stdout_so_far) else None
        stdout_so_far = current_stdout

        lineno = frame.f_lineno
        raw_locals = {}

        for k, v in frame.f_locals.items():
            if k in _IGNORED or callable(v):
                continue
            try:
                raw_locals[k] = copy.deepcopy(v)
            except Exception:
                raw_locals[k] = v

        # Serialize
        serialized = {}
        typed_vars = {}
        for k, v in raw_locals.items():
            sv = _serialize(v)
            serialized[k] = sv
            ds_type = _detect_var_type(k, v)
            typed_vars[k] = {"value": sv, "type": ds_type}

        # Control flow
        stripped = code_lines[lineno - 1].strip() if 1 <= lineno <= len(code_lines) else ""
        ctrl_type = _classify_line(stripped)
        line_counts[lineno] = line_counts.get(lineno, 0) + 1
        iter_count = line_counts[lineno]

        # Loop var extraction
        loop_vars = {}
        if ctrl_type in _LOOP_TYPES and stripped.startswith("for "):
            try:
                parts = stripped[4:].split(" in ", 1)
                if parts:
                    var_name = parts[0].strip()
                    if "," in var_name:
                        names = [n.strip() for n in var_name.strip("()").split(",")]
                        loop_vars = {n: serialized.get(n) for n in names if n in serialized}
                    elif var_name in serialized:
                        loop_vars = {var_name: serialized[var_name]}
            except Exception:
                pass

        # Highlights: index variables
        highlights: Dict[str, Any] = {}
        idx_vars = {k: v for k, v in serialized.items()
                    if isinstance(v, int) and k in
                    ("i", "j", "k", "lo", "hi", "mid", "left", "right", "l", "r", "pivot", "row", "col")}

        for arr_name, arr_val in serialized.items():
            if isinstance(arr_val, list) and arr_val and not all(isinstance(x, list) for x in arr_val):
                highlighted_idxs = [v for v in idx_vars.values()
                                     if isinstance(v, int) and 0 <= v < len(arr_val)]
                if highlighted_idxs:
                    highlights[arr_name] = highlighted_idxs

        # Matrix cell
        matrix_cell = None
        has_matrix = any(
            isinstance(v, list) and v and all(isinstance(x, list) for x in v)
            for v in serialized.values()
        )
        if has_matrix:
            i_val   = serialized.get("i")
            j_val   = serialized.get("j")
            row_val = serialized.get("row") if i_val is None else None
            col_val = serialized.get("col") if j_val is None else None
            row_idx = i_val if isinstance(i_val, int) else (row_val if isinstance(row_val, int) else None)
            col_idx = j_val if isinstance(j_val, int) else (col_val if isinstance(col_val, int) else None)
            if isinstance(row_idx, int) and isinstance(col_idx, int):
                matrix_cell = [row_idx, col_idx]

        # Intermediate vertex (Floyd-Warshall)
        intermediate_vertex = None
        k_val = serialized.get("k")
        if has_matrix and isinstance(k_val, int):
            intermediate_vertex = k_val

        # Active graph edge
        active_edge = None
        has_graph = any(
            isinstance(v, dict) and v and all(isinstance(x, list) for x in v.values())
            for v in serialized.values()
        )
        if has_graph:
            node_val     = serialized.get("node")
            neighbor_val = serialized.get("neighbor")
            u_val        = serialized.get("u")
            v_val        = serialized.get("v")
            src_val      = serialized.get("src")
            dst_val      = serialized.get("dst")
            if node_val is not None and neighbor_val is not None:
                active_edge = [str(node_val), str(neighbor_val)]
            elif u_val is not None and v_val is not None and not isinstance(u_val, list):
                active_edge = [str(u_val), str(v_val)]
            elif src_val is not None and dst_val is not None:
                active_edge = [str(src_val), str(dst_val)]

        # Top-level type detection (for backward compat)
        if algo_hint in _DS_TYPES:
            top_type = algo_hint
        else:
            top_type = _infer_top_type(serialized, algo_hint)

        description = _infer_description(lineno, code_lines, serialized, prev_vars, ctrl_type, iter_count)
        prev_vars = copy.deepcopy(serialized)
        code_line = code_lines[lineno - 1].rstrip() if 1 <= lineno <= len(code_lines) else ""

        # Collect all DS variables for multi-panel rendering
        ds_panels = []
        for name, info in typed_vars.items():
            if info["type"] is not None:
                ds_panels.append({
                    "name": name,
                    "type": info["type"],
                    "value": info["value"],
                })
        # Sort: prefer main DS types first
        ds_panels.sort(key=lambda p: (
            0 if p["type"] in ("graph", "tree") else
            1 if p["type"] == "matrix" else
            2
        ))

        snapshot = {
            "line":               lineno,
            "code_line":          code_line,
            "description":        description,
            "type":               top_type,
            "variables":          serialized,
            "typed_variables":    typed_vars,
            "ds_panels":          ds_panels,
            "highlights":         highlights,
            "ctrl_type":          ctrl_type,
            "iter_count":         iter_count,
            "loop_vars":          loop_vars,
            "matrix_cell":        matrix_cell,
            "intermediate_vertex": intermediate_vertex,
            "active_edge":        active_edge,
            "is_loop":            ctrl_type in _LOOP_TYPES,
            "is_condition":       ctrl_type in _COND_TYPES,
            "stdout":             new_output if new_output else None,
            "stdout_all":         stdout_so_far if stdout_so_far else None,
        }
        snapshots.append(snapshot)
        return tracer

    # Redirect stdout to capture print() output
    old_stdout = sys.stdout
    sys.stdout = stdout_capture

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
    finally:
        sys.stdout = old_stdout

    # Attach final stdout to last snapshot if any output remains
    final_stdout = stdout_capture.getvalue()
    if final_stdout and snapshots:
        # Attach cumulative output to all snapshots that had any stdout up to that point
        running = ""
        for snap in snapshots:
            if snap.get("stdout"):
                running += snap["stdout"]
            snap["stdout_all"] = running if running else None

    return {
        "snapshots": snapshots,
        "error": error_msg,
        "total_steps": len(snapshots),
        "stdout": final_stdout if final_stdout else None,
    }


def _infer_top_type(variables: dict, hint: str) -> str:
    if hint and hint != "auto":
        return hint
    # Tree first
    for v in variables.values():
        if isinstance(v, dict) and v and _is_binary_tree(v):
            return "tree"
    # Graph
    for v in variables.values():
        if isinstance(v, dict) and v and all(isinstance(x, list) for x in v.values()):
            return "graph"
    # Matrix
    for v in variables.values():
        if isinstance(v, list) and len(v) > 0 and all(isinstance(x, list) for x in v):
            return "matrix"
    # Array
    for v in variables.values():
        if isinstance(v, list):
            return "array"
    return "array"

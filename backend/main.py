"""
main.py — FastAPI entry point for the DSA Visualizer backend.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from tracer.executor import execute_and_trace
from tracer.multi_executor import execute_and_trace_multi
from tracer.transpiler import transpile_to_python
from algorithms import (
    sorting, searching, graph, tree,
    recursion, dp, greedy, strings, heap,
    stack_ds, queue_ds, linked_list, hashmap, deque_ds,
)

app = FastAPI(title="DSA Visualizer API", version="3.0.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
# allow_origins=["*"] + allow_credentials=True is rejected by browsers.
# We list explicit local origins, then extend from env vars for production.
import os

_ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",   # Vite preview
    "http://127.0.0.1:4173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

# CORS_ORIGINS — comma-separated list of extra allowed origins.
# Set this in Render dashboard, e.g.:
#   CORS_ORIGINS=https://my-app.vercel.app,https://my-app-git-main-user.vercel.app
_extra_origins = os.getenv("CORS_ORIGINS", os.getenv("CORS_ORIGIN", ""))
for _o in _extra_origins.split(","):
    _o = _o.strip()
    if _o and _o not in _ALLOWED_ORIGINS:
        _ALLOWED_ORIGINS.append(_o)

# CORS_ORIGIN_REGEX — regex matching ALL Vercel preview deploy URLs.
# Default covers any *.vercel.app subdomain so preview deploys work automatically.
_ORIGIN_REGEX = os.getenv(
    "CORS_ORIGIN_REGEX",
    r"https://.*\.vercel\.app",   # covers all vercel preview URLs
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_origin_regex=_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# Merge all built-in algorithm libraries
ALL_ALGORITHMS = {
    **searching.ALGORITHMS,
    **sorting.ALGORITHMS,
    **recursion.ALGORITHMS,
    **dp.ALGORITHMS,
    **greedy.ALGORITHMS,
    **graph.ALGORITHMS,
    **tree.ALGORITHMS,
    **heap.ALGORITHMS,
    **strings.ALGORITHMS,
    **stack_ds.ALGORITHMS,
    **queue_ds.ALGORITHMS,
    **linked_list.ALGORITHMS,
    **hashmap.ALGORITHMS,
    **deque_ds.ALGORITHMS,
}

# ── Free-form code templates ─────────────────────────────────────────────────
FREE_TEMPLATES = {
    "custom_array": {
        "label": "Custom Array",
        "category": "Custom",
        "type": "array",
        "code": """\
# Write any array manipulation code here
arr = [64, 34, 25, 12, 22, 11, 90]

# Example: manual bubble sort step-by-step
n = len(arr)
for i in range(n):
    for j in range(0, n - i - 1):
        if arr[j] > arr[j + 1]:
            arr[j], arr[j + 1] = arr[j + 1], arr[j]
""",
    },
    "custom_graph": {
        "label": "Custom Graph",
        "category": "Custom",
        "type": "graph",
        "code": """\
# Define any graph as adjacency list and traverse it
graph = {
    0: [1, 2],
    1: [0, 3, 4],
    2: [0, 5],
    3: [1],
    4: [1, 5],
    5: [2, 4],
}

visited = set()
queue = [0]
visited.add(0)

while queue:
    node = queue.pop(0)
    for neighbor in graph[node]:
        if neighbor not in visited:
            visited.add(neighbor)
            queue.append(neighbor)
""",
    },
    "custom_stack": {
        "label": "Custom Stack",
        "category": "Custom",
        "type": "stack",
        "code": """\
# Simulate a stack with a list — push/pop operations
stack = []

# Push elements
for val in [10, 20, 30, 40, 50]:
    stack.append(val)

# Pop elements one by one
while stack:
    top = stack.pop()
""",
    },
    "custom_queue": {
        "label": "Custom Queue",
        "category": "Custom",
        "type": "queue",
        "code": """\
# FIFO queue simulation
queue = []

# Enqueue
for val in [1, 2, 3, 4, 5]:
    queue.append(val)

# Dequeue
while queue:
    front = queue.pop(0)
""",
    },
    "custom_matrix": {
        "label": "Custom Matrix / DP",
        "category": "Custom",
        "type": "matrix",
        "code": """\
# 2D DP table — example: coin change
coins = [1, 2, 5]
amount = 6
INF = float('inf')

dp = [[INF] * (amount + 1) for _ in range(len(coins) + 1)]
for i in range(len(coins) + 1):
    dp[i][0] = 0

for i in range(1, len(coins) + 1):
    for j in range(1, amount + 1):
        dp[i][j] = dp[i - 1][j]
        if coins[i - 1] <= j:
            val = dp[i][j - coins[i - 1]]
            if val + 1 < dp[i][j]:
                dp[i][j] = val + 1
""",
    },
    "custom_tree": {
        "label": "Custom Tree",
        "category": "Custom",
        "type": "tree",
        "code": """\
# Binary tree as {node: [left, right]}
# None means no child
tree = {
    1: [2, 3],
    2: [4, 5],
    3: [6, None],
    4: [None, None],
    5: [None, None],
    6: [None, None],
}

# BFS level-order traversal
queue = [1]
visited = []

while queue:
    node = queue.pop(0)
    visited.append(node)
    left, right = tree[node]
    if left is not None:
        queue.append(left)
    if right is not None:
        queue.append(right)
""",
    },
    "custom_hashmap": {
        "label": "Custom HashMap",
        "category": "Custom",
        "type": "hashmap",
        "code": """\
# Frequency counter using a hashmap
words = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple']
freq = {}

for word in words:
    if word in freq:
        freq[word] = freq[word] + 1
    else:
        freq[word] = 1

# Find the most frequent word
max_word = ''
max_count = 0
for word in freq:
    if freq[word] > max_count:
        max_count = freq[word]
        max_word = word
""",
    },
    "custom_linked_list": {
        "label": "Custom Linked List",
        "category": "Custom",
        "type": "linked_list",
        "code": """\
# Linked list as {node: next_node}  (None = tail)
ll = {1: 2, 2: 3, 3: 4, 4: 5, 5: None}
head = 1

# Traverse and collect values
result = []
current = head
while current is not None:
    result.append(current)
    current = ll[current]

# Reverse the linked list in-place
prev = None
current = head
while current is not None:
    nxt = ll[current]
    ll[current] = prev
    prev = current
    current = nxt
head = prev
""",
    },
    "custom_multi": {
        "label": "Multi-DS Example",
        "category": "Custom",
        "type": "auto",
        "code": """\
# Example showing multiple data structures at once
arr = [3, 1, 4, 1, 5, 9, 2, 6]
stack = []
result = []

# Use a stack to find next greater element
for i in range(len(arr)):
    while stack and arr[stack[-1]] < arr[i]:
        idx = stack.pop()
        result.append((idx, arr[i]))
    stack.append(i)
""",
    },
}


# ─── Request / Response Models ───────────────────────────────────────────────

class TraceRequest(BaseModel):
    code: str
    algo_hint: Optional[str] = "auto"


class RunRequest(BaseModel):
    code: str
    lang: Optional[str] = "python"      # python | java | cpp | javascript | csharp
    ds_hint: Optional[str] = "auto"


class TranspileRequest(BaseModel):
    code: str
    lang: str   # source language


class AlgorithmRequest(BaseModel):
    algorithm_id: str


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok", "message": "DSA Visualizer API v3.0.0 running"}


@app.get("/api/algorithms")
def list_algorithms():
    """Return all available built-in algorithms with category information."""
    return {
        "algorithms": [
            {
                "id": k,
                "label": v["label"],
                "type": v["type"],
                "category": v.get("category", "General"),
            }
            for k, v in ALL_ALGORITHMS.items()
        ]
    }


@app.get("/api/algorithms/{algo_id}")
def get_algorithm(algo_id: str):
    """Return the code for a specific algorithm."""
    if algo_id not in ALL_ALGORITHMS:
        raise HTTPException(status_code=404, detail=f"Algorithm '{algo_id}' not found")
    algo = ALL_ALGORITHMS[algo_id]
    return {
        "id": algo_id,
        "label": algo["label"],
        "code": algo["code"],
        "type": algo["type"],
        "category": algo.get("category", "General"),
    }


@app.get("/api/templates")
def list_templates():
    """Return all free-form code templates."""
    return {
        "templates": [
            {
                "id": k,
                "label": v["label"],
                "type": v["type"],
                "category": v["category"],
                "code": v["code"],
            }
            for k, v in FREE_TEMPLATES.items()
        ]
    }


@app.post("/api/trace")
def trace_code(req: TraceRequest):
    """
    Execute the provided Python code and return step-by-step snapshots.
    Uses the legacy executor for backward compatibility.
    """
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    if len(req.code) > 10_000:
        raise HTTPException(status_code=400, detail="Code too long (max 10,000 chars)")

    result = execute_and_trace(req.code, req.algo_hint)
    return result


@app.post("/api/run")
def run_custom_code(req: RunRequest):
    """
    Execute any code and return multi-DS snapshots.
    For non-Python languages, auto-transpiles to Python first.
    Returns transpiled Python + trace results + any transpilation warnings.
    """
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    if len(req.code) > 20_000:
        raise HTTPException(status_code=400, detail="Code too long (max 20,000 chars)")

    lang = (req.lang or "python").lower().strip()
    code_to_run = req.code
    transpile_warnings = []
    transpiled_python = None

    # Transpile non-Python code to Python
    if lang != "python":
        t = transpile_to_python(req.code, lang)
        code_to_run = t["python_code"]
        transpile_warnings = t.get("warnings", [])
        transpiled_python = code_to_run

    result = execute_and_trace_multi(code_to_run, req.ds_hint or "auto")
    result["transpile_warnings"] = transpile_warnings
    result["transpiled_python"] = transpiled_python  # shown in UI
    result["original_lang"] = lang
    return result


@app.post("/api/transpile")
def transpile_code(req: TranspileRequest):
    """
    Convert code from any language to Python without executing it.
    Used for preview before running.
    """
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    lang = req.lang.lower().strip()
    if lang == "python":
        return {"python_code": req.code, "warnings": [], "lang": "python"}
    result = transpile_to_python(req.code, lang)
    result["lang"] = lang
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

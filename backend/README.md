# DSA Visualiser — Backend

A **FastAPI** server that executes Python code step-by-step, captures every variable state per line, and streams structured snapshots to the frontend for real-time visualization.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web framework | [FastAPI](https://fastapi.tiangolo.com/) `0.111.0` |
| ASGI server | [Uvicorn](https://www.uvicorn.org/) `0.29.0` (with standard extras) |
| Data validation | [Pydantic](https://docs.pydantic.dev/) `2.7.1` |
| Language | Python 3.10+ |

---

## Directory Structure

```
backend/
├── main.py                  # FastAPI app, all API routes, free-form template registry
├── requirements.txt         # Python dependencies
│
├── tracer/
│   ├── __init__.py
│   ├── executor.py          # Legacy single-DS tracer (used by /api/trace)
│   ├── multi_executor.py    # Multi-DS tracer with stdout capture (used by /api/run)
│   ├── snapshot.py          # Snapshot dataclass helpers
│   └── transpiler.py        # Multi-language → Python transpiler
│
└── algorithms/
    ├── __init__.py
    ├── sorting.py           # Bubble, Selection, Insertion, Merge, Quick, Heap, Counting, Radix
    ├── searching.py         # Linear Search, Binary Search
    ├── graph.py             # BFS, DFS, Dijkstra, Bellman-Ford, Kruskal, Prim, Floyd-Warshall
    ├── tree.py              # Inorder, Preorder, Postorder, Level-Order, BST Insert, AVL
    ├── recursion.py         # Fibonacci, Tower of Hanoi, Power, GCD
    ├── dp.py                # Knapsack, LCS, LIS, Coin Change, Matrix Chain
    ├── greedy.py            # Activity Selection, Fractional Knapsack, Job Scheduling
    ├── heap.py              # Min-Heap / Max-Heap operations
    ├── strings.py           # KMP, Rabin-Karp, Z-Algorithm, Anagram Check
    ├── stack_ds.py          # Stack push/pop, balanced brackets, next greater element
    ├── queue_ds.py          # Queue enqueue/dequeue, circular queue, priority queue
    ├── linked_list.py       # Traverse, reverse, detect cycle, merge sorted lists
    ├── hashmap.py           # Frequency counter, two-sum, group anagrams
    └── deque_ds.py          # Sliding window maximum, palindrome check
```

---

## How It Works

### Execution & Tracing Pipeline

```
User Code (Python)
       │
       ▼
  compile()  ←─── compile to bytecode with filename "<dsa_exec>"
       │
       ▼
  sys.settrace(tracer)
       │
       ▼
  exec(compiled, namespace)
       │
  (every "line" event fires the tracer function)
       │
       ▼
  tracer() per line:
    ├─ deepcopy all local variables
    ├─ serialize each value (handle inf, NaN, sets, dicts, lists)
    ├─ detect DS type per variable (array / matrix / graph / tree / hashmap)
    ├─ classify the line (for_loop / while_loop / if_cond / assignment / ...)
    ├─ compute highlights (which array indices are being pointed to)
    ├─ detect active graph edge (node + neighbor variables)
    ├─ capture any new stdout since the last snapshot
    └─ append snapshot to list
       │
       ▼
  Return list of snapshots to FastAPI
       │
       ▼
  JSON response to frontend
```

### Data Flow

```
Frontend POST /api/run
         │
         ▼
      main.py (run_custom_code)
         │  lang == 'python' → skip transpilation
         │  lang != 'python' → transpiler.py → Python code
         ▼
      multi_executor.py (execute_and_trace_multi)
         │
         ▼
      { snapshots, error, total_steps, stdout }
         │
         ▼
      JSON response back to frontend
```

---

## Core Modules

### `main.py`

The FastAPI application entry point. Responsibilities:

- **Registers all built-in algorithm modules** into a single `ALL_ALGORITHMS` dict
- **Hosts the free-form template registry** (`FREE_TEMPLATES`) — 9 Python starter templates (Array, Graph, Stack, Queue, Matrix, Tree, HashMap, Linked List, Multi-DS)
- **Exposes all REST API routes** (see [API Reference](#api-reference))
- **Validates inputs** using Pydantic models (`TraceRequest`, `RunRequest`, `TranspileRequest`, `AlgorithmRequest`)

---

### `tracer/multi_executor.py`

The main execution engine. Key functions:

#### `execute_and_trace_multi(code, algo_hint)`

Executes Python code and produces a snapshot per line.

**Each snapshot contains:**

| Field | Type | Description |
|-------|------|-------------|
| `line` | `int` | Line number currently executing |
| `code_line` | `str` | The actual source line |
| `description` | `str` | Human-readable description of what happened |
| `type` | `str` | Top-level DS type (`array`, `graph`, `tree`, etc.) |
| `variables` | `dict` | All local variable values (serialized) |
| `typed_variables` | `dict` | Variables with their inferred DS types |
| `ds_panels` | `list` | All detected DS variables for multi-panel rendering |
| `highlights` | `dict` | Per-array: which indices are currently pointed to |
| `ctrl_type` | `str` | `for_loop`, `while_loop`, `if_cond`, `assignment`, etc. |
| `iter_count` | `int` | How many times this line has been hit |
| `loop_vars` | `dict` | Current values of loop variables |
| `matrix_cell` | `list\|null` | Active `[row, col]` for matrix visualization |
| `active_edge` | `list\|null` | Active `[u, v]` edge for graph visualization |
| `is_loop` | `bool` | Whether current line is a loop header |
| `is_condition` | `bool` | Whether current line is a conditional |
| `stdout` | `str\|null` | New output printed since last snapshot |
| `stdout_all` | `str\|null` | Cumulative stdout up to this point |

**DS Type Detection (`_detect_var_type`):**

| Python value | Detected as |
|---|---|
| `dict` where all values are 2-element lists | `tree` |
| `dict` where all values are lists | `graph` |
| `dict` (otherwise) | `hashmap` |
| `list` of `list`s | `matrix` |
| `list` | `array` |

**Line Classification (`_classify_line`):**

| Starts with | Classified as |
|---|---|
| `for ` | `for_loop` |
| `while ` | `while_loop` |
| `if ` | `if_cond` |
| `elif ` | `elif_cond` |
| `else:` | `else_branch` |
| `return` | `return_stmt` |
| `break` / `continue` | `loop_control` |
| contains `=` (not `==`, `!=`, `>=`, `<=`) | `assignment` |
| anything else | `expression` |

---

### `tracer/executor.py`

Legacy single-DS tracer used by the Algorithm Library mode (`/api/trace`). Works the same way as `multi_executor.py` but produces simpler snapshots — one primary DS type per run, no multi-panel output.

---

### `tracer/transpiler.py`

Converts Java / C++ / JavaScript / C# code to executable Python so it can be traced and visualized without requiring those language runtimes.

**How it works:**

1. **Strip boilerplate** — removes `#include`, `using namespace`, `import`, `class` declarations, JavaScript IIFEs
2. **Apply `_COMMON_OPS`** — shared across all C-family languages (boolean literals, math functions, C-style for loops, `++`/`--` operators, logical ops)
3. **Apply language-specific ops** — per-language regex rules for types, collections, I/O
4. **Fix `.length` / `.Length`** — converts to Python `len()`
5. **Fix indentation** — rebuilds correct Python indentation from block keywords
6. **Cleanup** — collapses excessive blank lines

**Supported conversions per language:**

| Java | C++ | JavaScript | C# |
|------|-----|-----------|-----|
| `int[] arr = {1,2,3}` → `arr = [1,2,3]` | `vector<int> arr = {1,2}` → `arr = [1,2]` | `let x = 5` → `x = 5` | `int[] arr = {1,2}` → `arr = [1,2]` |
| `ArrayList`, `LinkedList` → `list` | `stack<int>`, `queue<int>` → `list` | `const`, `var` → stripped | `List<T>` → `list` |
| `HashMap` → `dict` | `unordered_map` → `dict` | `console.log` → `print` | `Dictionary<K,V>` → `dict` |
| `System.out.println` → `print` | `cout <<` → `print` | `for...of`, `for...in` → Python for | `Console.WriteLine` → `print` |
| `for (int i=0; i<n; i++)` → `for i in range(0, n):` | `swap(a,b)` → `a, b = b, a` | `.push()` → `.append()`, `.shift()` → `.pop(0)` | `foreach (var x in xs)` → `for x in xs:` |
| for-each `for (int x : arr)` → `for x in arr:` | Range-based for | `new Set()` → `set()` | `Stack<T>`, `Queue<T>` → list |

**Key helper — `_clean_param(p)`:**
Safely extracts just the variable name from a method parameter that may have been partially converted (e.g. `arr = []` from `int[] arr`) — prevents the `def method([]):` syntax error.

---

### `algorithms/`

Each file exports an `ALGORITHMS` dict:

```python
ALGORITHMS = {
    "bubble_sort": {
        "label": "Bubble Sort",
        "category": "Sorting",
        "type": "array",        # DS type hint for the visualizer
        "code": "...",          # Python source code
    },
    ...
}
```

**Algorithm categories and counts:**

| File | Category | Algorithms |
|------|----------|-----------|
| `sorting.py` | Sorting | Bubble, Selection, Insertion, Merge, Quick, Heap, Counting, Radix (8) |
| `searching.py` | Searching | Linear Search, Binary Search (2) |
| `graph.py` | Graph | BFS, DFS, Dijkstra, Bellman-Ford, Kruskal, Prim, Floyd-Warshall (7) |
| `tree.py` | Tree | Inorder, Preorder, Postorder, Level-Order, BST Insert, BST Search, AVL (7) |
| `recursion.py` | Recursion | Fibonacci, Hanoi, Power, GCD, Factorial (5) |
| `dp.py` | Dynamic Programming | Knapsack, LCS, LIS, Coin Change, Matrix Chain (5) |
| `greedy.py` | Greedy | Activity Selection, Fractional Knapsack, Job Scheduling (3) |
| `heap.py` | Heap | Min-Heap Build, Heap Sort, Max-Heap Extract (3) |
| `strings.py` | Strings | KMP, Rabin-Karp, Z-Algorithm, Anagram, Palindrome (5) |
| `stack_ds.py` | Stack | Push/Pop, Balanced Brackets, Next Greater Element, Min Stack (4) |
| `queue_ds.py` | Queue | Enqueue/Dequeue, Circular Queue, Priority Queue, BFS Queue (4) |
| `linked_list.py` | Linked List | Traverse, Reverse, Detect Cycle, Find Middle, Merge Sorted (5) |
| `hashmap.py` | HashMap | Frequency Counter, Two Sum, Group Anagrams, LRU Cache (4) |
| `deque_ds.py` | Deque | Sliding Window Max, Palindrome, Monotonic Deque (3) |

---

## API Reference

### `GET /`
Health check.
```json
{ "status": "ok", "message": "DSA Visualizer API v3.0.0 running" }
```

---

### `GET /api/algorithms`
Returns all built-in algorithms with metadata.
```json
{
  "algorithms": [
    { "id": "bubble_sort", "label": "Bubble Sort", "type": "array", "category": "Sorting" }
  ]
}
```

---

### `GET /api/algorithms/{algo_id}`
Returns the full source code of a specific algorithm.
```json
{
  "id": "bubble_sort",
  "label": "Bubble Sort",
  "code": "arr = [5, 3, 8, 1, 9, 2, 7, 4, 6]\n...",
  "type": "array",
  "category": "Sorting"
}
```

---

### `GET /api/templates`
Returns all free-form code templates.
```json
{
  "templates": [
    { "id": "custom_array", "label": "Custom Array", "type": "array", "category": "Custom", "code": "..." }
  ]
}
```

---

### `POST /api/trace`
Executes Python code and returns step-by-step snapshots. Used by the **Algorithm Library** mode.

**Request:**
```json
{ "code": "arr = [5,3,1]\n...", "algo_hint": "array" }
```

**Response:**
```json
{
  "snapshots": [ { "line": 1, "variables": {...}, "type": "array", ... } ],
  "error": null,
  "total_steps": 42
}
```

---

### `POST /api/run`
Executes code in any language (Python native, others auto-transpiled). Used by the **Code Sandbox** mode.

**Request:**
```json
{ "code": "arr = [5,3,1]\n...", "lang": "python", "ds_hint": "auto" }
```

**Response:**
```json
{
  "snapshots": [...],
  "error": null,
  "total_steps": 42,
  "stdout": "Hello\n",
  "transpiled_python": null,
  "transpile_warnings": [],
  "original_lang": "python"
}
```

---

### `POST /api/transpile`
Preview what any code transpiles to in Python, without executing.

**Request:**
```json
{ "code": "int[] arr = {1,2,3};", "lang": "java" }
```

**Response:**
```json
{ "python_code": "arr = [1, 2, 3]", "warnings": [], "lang": "java" }
```

---

## Running the Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The server starts at **http://localhost:8000**.  
Interactive API docs available at **http://localhost:8000/docs**.

> The server runs with `reload=True` — any file changes are picked up automatically without restarting.

---

## Security Notes

- Code is executed with `exec()` inside a controlled namespace — only `__builtins__` is injected
- Max code length: **10,000 chars** for `/api/trace`, **20,000 chars** for `/api/run`
- `sys.settrace` is always cleaned up in a `finally` block even if execution raises
- CORS is open (`allow_origins=["*"]`) — suitable for local development only

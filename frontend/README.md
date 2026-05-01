# DSA Visualiser — Frontend

A **React + Vite** single-page application that visualises Data Structures and Algorithms by communicating with the Python backend to step through code execution and render animated, interactive visualisations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 18](https://react.dev/) |
| Build tool | [Vite](https://vitejs.dev/) |
| Code editor | [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) |
| Graph / Tree rendering | [D3.js](https://d3js.org/) |
| HTTP client | [Axios](https://axios-http.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Toast notifications | [React Hot Toast](https://react-hot-toast.com/) |
| Styling | Vanilla CSS (`index.css`) — no Tailwind |

---

## Directory Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
│
└── src/
    ├── main.jsx                          # React entry point
    ├── App.jsx                           # Root component — routing, mode switching, layout
    ├── App.css                           # App-level overrides
    ├── index.css                         # Full design system (tokens, components, animations)
    │
    ├── hooks/
    │   └── useTracer.js                  # Custom hook — API calls, snapshot navigation, playback
    │
    ├── utils/
    │   └── diffUtils.js                  # Diff helpers (array swap/push/pop, map changes)
    │
    └── components/
        ├── ControlFlowPanel/
        │   └── ControlFlowPanel.jsx      # Live control-flow badge overlay
        │
        ├── CustomCodePanel/
        │   └── CustomCodePanel.jsx       # Python code editor + DS selector + templates
        │
        ├── PlaybackControls/
        │   └── PlaybackControls.jsx      # Step / play / speed controls
        │
        ├── StepLog/
        │   └── StepLog.jsx               # Scrollable step history sidebar
        │
        └── Visualizer/
            ├── ArrayViz.jsx              # Array / list visualizer
            ├── GraphViz.jsx              # Directed / undirected graph (D3 force-directed)
            ├── TreeViz.jsx               # Binary tree (D3 hierarchical layout)
            ├── MatrixViz.jsx             # 2D matrix / DP table
            ├── StackViz.jsx              # Stack (vertical tower)
            ├── QueueViz.jsx              # Queue / Deque (horizontal strip)
            ├── LinkedListViz.jsx         # Linked list (node → node → null)
            ├── HashMapViz.jsx            # HashMap / Dict (key → value cards)
            └── MultiVizPanel.jsx         # Composite panel — renders all DS at once
```

---

## How It Works

### Overall Data Flow

```
User writes Python code in CustomCodePanel
              │
              ▼
   "Run & Trace" clicked
              │
              ▼
   useTracer.runCustomCode()
      POST /api/run  ──────────────────────► Backend executes code
                                                    │
                                            Returns snapshots[]
              │
              ◄────────────────────────────────────┘
              │
   snapshots[] stored in React state
              │
              ▼
   PlaybackControls steps through snapshots
   [currentStep] → currentSnapshot
              │
         ┌────┴──────────────┐
         ▼                   ▼
  ControlFlowPanel     MultiVizPanel
  (shows ctrl_type,    (renders all DS
   loop vars,           variables found
   branch result)       in the snapshot)
              │
              ▼
    StepLog (history of all steps)
```

---

## Components

### `App.jsx`

The root component. Manages two modes:

| Mode | Description |
|------|-------------|
| **Algorithm Library** | Browse 60+ built-in algorithms. Select from dropdown, click Run & Trace. Python-only. Uses `useTracer.runTrace()` → `POST /api/trace`. |
| **Code Sandbox** | Write any Python code. Click Run & Trace or the header Run & Test button. Uses `useTracer.runCustomCode()` → `POST /api/run`. |

**Key state in `App.jsx`:**

| State | Purpose |
|-------|---------|
| `mode` | `'library'` or `'sandbox'` |
| `snapshots` | Array of execution snapshots from backend |
| `currentStep` | Index into `snapshots` |
| `currentSnapshot` | `snapshots[currentStep]` |
| `sandboxCode` | Live-synced Python code from the editor (via `onCodeChange` callback) |
| `sandboxDsHint` | Forced DS type hint (`auto`, `array`, `graph`, etc.) |
| `lastStdout` | Captured stdout from the last run |

**`handleSandboxRun(code, dsHint, lang)`:**  
Called both by the editor's internal Run button and the header Run & Test button.
Calls `runCustomCode()`, captures `stdout`, shows a success toast.

**`VisualizerRouter`** (library mode only):  
A simple switch that routes `snapshot.type` → the correct visualizer component.

**`ModeToggle`:**  
Two-button tab bar at the top of the header switching between Library and Sandbox modes.

---

### `hooks/useTracer.js`

Custom React hook encapsulating all API communication and playback state.

**Exposed state:**

| Value | Type | Description |
|-------|------|-------------|
| `snapshots` | `Snapshot[]` | All execution steps from the last run |
| `currentStep` | `number` | Currently viewed step index |
| `currentSnapshot` | `Snapshot \| null` | Snapshot at `currentStep` |
| `loading` | `boolean` | API request in-flight |
| `error` | `string \| null` | Last error message |
| `isPlaying` | `boolean` | Auto-play mode active |
| `speed` | `number` | Auto-play interval in ms (default 500) |
| `transpileInfo` | `object \| null` | `{ python, warnings, lang }` from last non-Python run |

**Exposed functions:**

| Function | Description |
|----------|-------------|
| `runTrace(code, algoType)` | Calls `POST /api/trace`. Used by Algorithm Library. |
| `runCustomCode(code, dsHint, lang)` | Calls `POST /api/run`. Used by Code Sandbox. Returns full response. |
| `stepForward()` | Advance one step |
| `stepBack()` | Go back one step |
| `goToStep(n)` | Jump to arbitrary step |
| `reset()` | Return to step 0, stop auto-play |
| `togglePlay()` | Start / stop auto-play at current speed |
| `setSpeed(ms)` | Change auto-play interval |
| `fetchAlgorithms()` | `GET /api/algorithms` — returns algorithm list |
| `fetchAlgorithmCode(id)` | `GET /api/algorithms/{id}` — returns code + metadata |

---

### `components/CustomCodePanel/CustomCodePanel.jsx`

Python-only code editor panel used in sandbox mode.

**Features:**
- Monaco Editor with a custom `dsa-dark` theme (purple keywords, teal strings, orange numbers)
- **DS Type selector** — forces a specific visualizer type or leaves it on `auto`
- **Templates dropdown** — 9 Python starter templates fetched from `GET /api/templates`
- **Active line highlight** — synced to `currentSnapshot.line` during playback
- **Reset button** — appears after a run, clears snapshots

**Key props:**

| Prop | Type | Description |
|------|------|-------------|
| `onRun(code, dsHint, lang)` | `function` | Called when user clicks Run & Trace |
| `onReset()` | `function` | Called when Reset is clicked |
| `loading` | `boolean` | Disables run button while tracing |
| `snapshots` | `array` | Used to show/hide the Reset button |
| `currentSnapshot` | `object\|null` | Used to highlight the active line |
| `onCodeChange(code)` | `function` | Live-syncs editor content to `App.jsx` |
| `children` | `ReactNode` | `PlaybackControls` rendered at the bottom |

**Live sync mechanism:**  
Every time the user types, changes language, selects a DS hint, or picks a template, `onCodeChange` fires → `App.jsx` updates `sandboxCode` → the header Run & Test button always has the current code even before the first run.

---

### `components/ControlFlowPanel/ControlFlowPanel.jsx`

A compact floating badge that describes what the current execution line is doing.

**Displayed information:**

| Condition | Shows |
|-----------|-------|
| `for_loop` / `while_loop` | 🔄 LOOP badge + iteration count + progress bar |
| `if_cond` / `elif_cond` | ❓ IF/ELIF badge + **TRUE / FALSE** branch result |
| `else_branch` | ↪ ELSE badge + "fallthrough" label |
| `return_stmt` | ↩ RETURN badge |
| `assignment` | 📝 ASSIGN badge |
| loop is active | Shows current loop variable values (e.g. `i=3`, `j=1`) |

**Branch result inference:**  
Compares `snapshots[currentStep + 1].line` vs `currentSnapshot.line + 1`. If the next line is immediately after, the condition was TRUE. Otherwise it was FALSE (branch skipped).

---

### `components/PlaybackControls/PlaybackControls.jsx`

Controls for navigating through execution steps.

| Control | Action |
|---------|--------|
| ⏮ | Go to step 0 |
| ◀ | Step backward |
| ▶ / ⏸ | Toggle auto-play |
| ▶ | Step forward |
| ⏭ | Go to last step |
| Speed slider | Adjusts auto-play interval (50ms – 2000ms) |
| Progress bar | Click to jump to any step |

---

### `components/StepLog/StepLog.jsx`

A scrollable sidebar showing the history of all executed steps. Each row shows:
- Step number
- `snapshot.description` (e.g. "🔄 Loop iteration #3 [i=2, j=1]")
- The raw source line
- Clicking a row jumps directly to that step

---

### `components/Visualizer/MultiVizPanel.jsx`

Composite renderer for the Code Sandbox. Iterates over `snapshot.ds_panels` (all detected DS variables) and renders the appropriate visualizer for each one.

**DS type → visualizer mapping:**

| `type` | Component |
|--------|-----------|
| `array` | `ArrayViz` |
| `matrix` | `MatrixViz` |
| `graph` | `GraphViz` |
| `tree` | `TreeViz` |
| `stack` | `StackViz` |
| `queue` / `deque` | `QueueViz` |
| `linked_list` | `LinkedListViz` |
| `hashmap` | `HashMapViz` |

If multiple DS variables exist in the same snapshot (e.g. `arr` + `stack`), multiple panels are rendered simultaneously.

---

### `components/Visualizer/ArrayViz.jsx`

Renders a 1D list as a row of coloured cells.

- **Highlighted cells** — indices in `snapshot.highlights[varName]` glow with accent colour
- **Diff animation** — uses `diffUtils.diffArrays()` to detect swap / push / pop and plays a colour-pulse animation
- **Index labels** beneath each cell
- Handles arrays up to ~50 elements before switching to a compact mode

---

### `components/Visualizer/GraphViz.jsx`

Renders a directed or undirected graph using **D3 force-directed simulation**.

- **Nodes** — circles with labels, coloured by visited state
- **Edges** — animated arrows with gradient colouring
- **Active edge** — `snapshot.active_edge` highlights the edge being relaxed/traversed
- **Shortest path** — Dijkstra parent pointers rendered as a highlighted sub-graph
- Supports weighted graphs (edge weights displayed on edges)
- Drag nodes interactively

---

### `components/Visualizer/TreeViz.jsx`

Renders a binary tree as a top-down hierarchical layout using **D3 tree layout**.

- Input format: `{ node: [left_child, right_child] }` Python dict
- **Level indicators** on the left axis
- **Node depth colouring** — each level has a distinct hue
- **Active node highlight** — current node pulsing
- Animated edge drawing

---

### `components/Visualizer/MatrixViz.jsx`

Renders a 2D list as a grid table.

- **Active cell** — `snapshot.matrix_cell [row, col]` highlighted with a glow
- **Changed cells** — cells that changed since the previous snapshot flash briefly
- **Intermediate vertex** — Floyd-Warshall `k` vertex shown as a badge
- Cell values colour-coded by magnitude (useful for DP tables)

---

### `components/Visualizer/StackViz.jsx`

Renders a Python list used as a stack as a vertical tower.

- **Top of stack** glows with accent colour
- **Push animation** — new element slides in from the top
- **Pop animation** — element slides out upward and fades
- Diff computed via `diffUtils.diffArrays()`

---

### `components/Visualizer/QueueViz.jsx`

Renders a Python list used as a queue or deque as a horizontal strip.

- **Front / Rear** labels on each end
- **Enqueue animation** — element enters from the right
- **Dequeue animation** — element exits from the left
- Supports **Deque** mode (both ends highlighted)

---

### `components/Visualizer/LinkedListViz.jsx`

Renders a Python dict `{ node: next_node }` as a linked list chain.

- **Nodes** connected by arrows (→)
- **Current node** pulsing highlight during traversal
- **Null terminator** rendered at the tail
- Supports reversed lists (arrow direction inferred from `head` variable)

---

### `components/Visualizer/HashMapViz.jsx`

Renders a Python dict as a set of key → value cards.

- **Inserted keys** glow green
- **Updated keys** glow blue
- **Deleted keys** fade out with a red tint
- Diff computed via `diffUtils.diffMaps()`

---

### `utils/diffUtils.js`

Pure utility functions for computing what changed between two consecutive snapshots.

| Function | Purpose |
|----------|---------|
| `diffArrays(prev, curr)` | Returns `{ op: 'push'\|'pop'\|'swap'\|'modify', ... }` |
| `diffMaps(prev, curr)` | Returns `{ inserted, deleted, updated }` key lists |
| `diffPointer(prev, curr, name)` | Tracks movement of a named integer pointer variable |
| `getListVar(vars, preferredKey)` | Finds the primary list variable in a snapshot's variables |

---

## Design System (`index.css`)

All styling is in a single `index.css` file with CSS custom properties (tokens).

**Key tokens:**

```css
--bg-primary:      #0d0f17   /* Deep dark background */
--bg-secondary:    #111318   /* Panel / editor background */
--bg-surface:      #1c1f28   /* Card / elevated surface */
--accent-purple:   #6c63ff   /* Primary accent (keywords, cursor) */
--accent-green:    #00f5a0   /* Success, strings */
--accent-blue:     #00d4ff   /* Info, loop highlights */
--accent-orange:   #ff9f43   /* Numbers, warnings */
--accent-red:      #ff4757   /* Errors, break/continue */
```

**Notable UI patterns:**
- Glassmorphism card style on all panels (`backdrop-filter: blur`)
- Smooth gradient borders via `border-image` or pseudo-elements
- Monaco editor custom theme (`dsa-dark`) defined inline in `CustomCodePanel.jsx`
- All animations use CSS `@keyframes` — `pulse`, `slideIn`, `fadeIn`, `swapFlash`

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at **http://localhost:5173** (Vite default).

> Ensure the backend is running at `http://localhost:8000` before starting the frontend. The API base URL is hardcoded in `CustomCodePanel.jsx` and `useTracer.js` as `http://localhost:8000`.

---

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE` | *(not used — hardcoded)* | Backend API URL |

To change the backend URL, search for `http://localhost:8000` in:
- `src/hooks/useTracer.js`
- `src/components/CustomCodePanel/CustomCodePanel.jsx`

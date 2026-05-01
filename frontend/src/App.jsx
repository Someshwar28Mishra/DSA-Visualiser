/**
 * App.jsx — Main application with two modes:
 *   1. Algorithm Library — browse & run built-in algorithms
 *   2. Custom Code Sandbox — write any code in any language & visualize it
 */
import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Braces, Zap, Terminal, BookOpen, ChevronRight, Play } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

import { useTracer } from './hooks/useTracer';

// Visualizers
import ArrayViz      from './components/Visualizer/ArrayViz';
import GraphViz      from './components/Visualizer/GraphViz';
import TreeViz       from './components/Visualizer/TreeViz';
import StackViz      from './components/Visualizer/StackViz';
import QueueViz      from './components/Visualizer/QueueViz';
import LinkedListViz from './components/Visualizer/LinkedListViz';
import HashMapViz    from './components/Visualizer/HashMapViz';
import MatrixViz     from './components/Visualizer/MatrixViz';
import MultiVizPanel from './components/Visualizer/MultiVizPanel';

// Panels
import ControlFlowPanel from './components/ControlFlowPanel/ControlFlowPanel';
import PlaybackControls from './components/PlaybackControls/PlaybackControls';
import StepLog          from './components/StepLog/StepLog';
import CustomCodePanel  from './components/CustomCodePanel/CustomCodePanel';
// langSnippets not needed in library (Python-only) — kept for future use

// ─── Legacy Visualizer Router (Algorithm Library mode) ────────────────────────
function VisualizerRouter({ snapshot, prevSnapshot }) {
  if (!snapshot) return null;
  const p = prevSnapshot;
  switch (snapshot.type) {
    case 'graph':       return <GraphViz      snapshot={snapshot} />;
    case 'tree':        return <TreeViz       snapshot={snapshot} />;
    case 'matrix':      return <MatrixViz     snapshot={snapshot} prevSnapshot={p} />;
    case 'stack':       return <StackViz      snapshot={snapshot} prevSnapshot={p} />;
    case 'queue':       return <QueueViz      snapshot={snapshot} prevSnapshot={p} />;
    case 'deque':       return <QueueViz      snapshot={snapshot} prevSnapshot={p} isDeque />;
    case 'linked_list': return <LinkedListViz snapshot={snapshot} prevSnapshot={p} />;
    case 'hashmap':     return <HashMapViz    snapshot={snapshot} prevSnapshot={p} />;
    default:            return <ArrayViz      snapshot={snapshot} prevSnapshot={p} />;
  }
}

function TypeBadge({ type }) {
  if (!type) return null;
  return <span className={`viz-type-badge badge-${type}`}>{type.replace('_',' ').toUpperCase()}</span>;
}

// ─── App Mode Toggle ─────────────────────────────────────────────────────────
function ModeToggle({ mode, onChange }) {
  return (
    <div className="mode-toggle">
      <button
        className={`mode-btn ${mode === 'library' ? 'active' : ''}`}
        onClick={() => onChange('library')}
      >
        <BookOpen size={14} />
        Algorithm Library
      </button>
      <button
        className={`mode-btn ${mode === 'sandbox' ? 'active' : ''}`}
        onClick={() => onChange('sandbox')}
      >
        <Terminal size={14} />
        Code Sandbox
        <span className="mode-badge-new">NEW</span>
      </button>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const tracer = useTracer();
  const {
    snapshots, currentStep, currentSnapshot, loading, error,
    isPlaying, speed, setSpeed,
    runTrace, runCustomCode,
    stepForward, stepBack, goToStep, reset, togglePlay,
    fetchAlgorithms, fetchAlgorithmCode,
  } = tracer;

  // App mode: 'library' | 'sandbox'
  const [mode, setMode] = useState('sandbox');

  // Library mode state
  const [algorithms, setAlgorithms]     = useState([]);
  const [selectedAlgo, setSelectedAlgo] = useState('');
  const [algoType, setAlgoType]         = useState('auto');
  const [pythonCode, setPythonCode]     = useState('');
  const [libCode, setLibCode]           = useState('# Select an algorithm or write your own Python code here\n');
  const [highlightLine, setHighlightLine] = useState(null);
  const [libEditorRef, setLibEditorRef] = useState(null);

  // Sandbox mode state — live-synced with CustomCodePanel editor
  const [sandboxDsHint, setSandboxDsHint] = useState('auto');
  const [sandboxCode, setSandboxCode]     = useState(() => {
    // Default starter code so the header Run & Test button works immediately
    return `# Python — Bubble Sort\narr = [5, 3, 8, 1, 9, 2, 7, 4, 6]\n\nfor i in range(len(arr)):\n    for j in range(0, len(arr) - i - 1):\n        if arr[j] > arr[j + 1]:\n            arr[j], arr[j + 1] = arr[j + 1], arr[j]\n`;
  });
  const [sandboxLang, setSandboxLang]     = useState('python');
  // stdout from last run result
  const [lastStdout, setLastStdout]       = useState(null);

  // Library always uses Python

  // Load algorithm list on mount
  useEffect(() => {
    fetchAlgorithms().then(list => {
      setAlgorithms(list);
      if (list.length > 0) setSelectedAlgo(list[0].id);
    });
  }, [fetchAlgorithms]);

  // Load Python code when algo changes
  useEffect(() => {
    if (!selectedAlgo) return;
    fetchAlgorithmCode(selectedAlgo)
      .then(data => {
        setPythonCode(data.code);
        setAlgoType(data.type || 'auto');
        setLibCode(data.code);
      })
      .catch(() => {});
  }, [selectedAlgo, fetchAlgorithmCode]); // eslint-disable-line

  // (Library is Python-only, no language swap needed)

  // Highlight current line in library mode
  useEffect(() => {
    if (!libEditorRef || !currentSnapshot || mode !== 'library') return;
    const lineNo = currentSnapshot.line;
    setHighlightLine(lineNo);
    libEditorRef.revealLineInCenter(lineNo);
  }, [currentSnapshot, libEditorRef, mode]);

  // Editor decoration for active line
  useEffect(() => {
    if (!libEditorRef || !highlightLine || mode !== 'library') return;
    const monaco = window.monaco;
    if (!monaco) return;
    const decs = libEditorRef.createDecorationsCollection([{
      range: new monaco.Range(highlightLine, 1, highlightLine, 1),
      options: { isWholeLine: true, className: 'active-line-highlight', glyphMarginClassName: 'active-line-glyph' },
    }]);
    return () => decs.clear();
  }, [highlightLine, libEditorRef, mode]);

  // ── Handlers ──
  const handleLibraryRun = useCallback(async () => {
    if (!libCode.trim()) { toast.error('Please enter some code first!'); return; }
    await runTrace(libCode, algoType);
    toast.success('Trace complete — use controls to step through!', { duration: 2500 });
  }, [libCode, runTrace, algoType]);

  const handleSandboxRun = useCallback(async (code, dsHint, lang) => {
    setSandboxDsHint(dsHint);
    setSandboxCode(code);
    setSandboxLang(lang);
    setLastStdout(null);
    // All languages supported: Python runs natively, others auto-transpile
    const result = await runCustomCode(code, dsHint, lang);
    if (result?.stdout) setLastStdout(result.stdout);
    const langLabel = lang === 'python' ? 'Python' : `${lang} → Python`;
    toast.success(`${langLabel} traced — step through with the controls!`, { duration: 2500 });
  }, [runCustomCode]);

  // Live callbacks from CustomCodePanel — keep App state in sync so the
  // header Run & Test button always has the current editor code/lang/dsHint
  const handleSandboxCodeChange = useCallback((code) => setSandboxCode(code), []);
  const handleSandboxLangChange = useCallback((lang) => setSandboxLang(lang), []);
  const handleSandboxDsHintChange = useCallback((hint) => setSandboxDsHint(hint), []);

  const handleLibEditorMount = useCallback((editor, monaco) => {
    setLibEditorRef(editor);
    monaco.editor.defineTheme('dsa-dark', {
      base: 'vs-dark', inherit: true,
      rules: [
        { token: 'keyword',    foreground: '6c63ff', fontStyle: 'bold' },
        { token: 'string',     foreground: '00f5a0' },
        { token: 'number',     foreground: 'ff9f43' },
        { token: 'comment',    foreground: '5a5f7a', fontStyle: 'italic' },
        { token: 'identifier', foreground: 'f0f0ff' },
        { token: 'type',       foreground: '00d4ff' },
      ],
      colors: {
        'editor.background':              '#111318',
        'editor.foreground':              '#f0f0ff',
        'editorLineNumber.foreground':    '#5a5f7a',
        'editorLineNumber.activeForeground': '#6c63ff',
        'editor.selectionBackground':     '#6c63ff33',
        'editor.lineHighlightBackground': '#6c63ff18',
        'editorCursor.foreground':        '#6c63ff',
        'scrollbar.shadow':               '#00000000',
      },
    });
    monaco.editor.setTheme('dsa-dark');
  }, []);

  // Group algorithms by category
  const grouped = algorithms.reduce((acc, a) => {
    const cat = a.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  const dsaType = currentSnapshot?.type;
  const isSandbox = mode === 'sandbox';

  // Playback controls shared between both modes
  const playbackEl = (
    <PlaybackControls
      isPlaying={isPlaying}
      onTogglePlay={togglePlay}
      onStepBack={stepBack}
      onStepForward={stepForward}
      onReset={reset}
      currentStep={currentStep}
      totalSteps={snapshots.length}
      speed={speed}
      onSpeedChange={setSpeed}
      disabled={snapshots.length === 0 || loading}
    />
  );

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1c1f28', color: '#f0f0ff', border: '1px solid #2a2d3e', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' },
      }} />

      <div className={`app-layout ${isSandbox ? 'app-layout--sandbox' : ''}`}>
        {/* ── Header ── */}
        <header className="app-header">
          <div className="app-logo">
            <Braces size={22} style={{ color: '#6c63ff' }} />
            DSA Visualiser
          </div>

          <div className="header-divider" />

          {/* Mode Toggle */}
          <ModeToggle mode={mode} onChange={(m) => { setMode(m); reset(); }} />

          <div className="header-divider" />

          {/* Library mode controls — Python only */}
          {mode === 'library' && (
            <>
              <div className="algo-selector">
                <label>Algorithm</label>
                <select className="algo-select" value={selectedAlgo} onChange={e => setSelectedAlgo(e.target.value)}>
                  {Object.entries(grouped).map(([cat, items]) => (
                    <optgroup key={cat} label={cat}>
                      {items.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Python-only badge */}
              <div className="lib-python-badge">
                <span className="lang-trace-dot" style={{ marginRight: 6 }} />
                Python
              </div>

              <button className="btn btn-primary" onClick={handleLibraryRun} disabled={loading}>
                {loading
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Tracing…</>
                  : <><Zap size={14} /> Run &amp; Trace</>
                }
              </button>
            </>
          )}

          {/* Sandbox mode header info + Run & Test button */}
          {mode === 'sandbox' && (
            <>
              <div className="sandbox-header-info">
                <Terminal size={14} style={{ color: 'var(--accent-green)' }} />
                <span style={{ color: '#4B8BBE', fontWeight: 600 }}>Python</span>
                <ChevronRight size={12} style={{ opacity: 0.5 }} />
                <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Auto-visualized</span>
              </div>
              <button
                id="sandbox-run-test-btn"
                className="btn btn-run-test"
                onClick={() => {
                  // Always use live sandboxCode (synced via onCodeChange)
                  const trimmed = (sandboxCode || '').trim();
                  if (!trimmed) {
                    toast('Write some code first!', { icon: '📝' });
                    return;
                  }
                  handleSandboxRun(sandboxCode, sandboxDsHint, sandboxLang);
                }}
                disabled={loading}
                title="Run & Test the current code"
              >
                {loading
                  ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Tracing…</>
                  : <><Play size={13} fill="currentColor" /> Run &amp; Test</>
                }
              </button>
            </>
          )}
        </header>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── SANDBOX MODE ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {isSandbox && (
          <>
            {/* Sidebar: Custom Code Panel */}
            <aside className="sidebar sidebar--sandbox">
              <CustomCodePanel
                onRun={handleSandboxRun}
                onReset={reset}
                loading={loading}
                snapshots={snapshots}
                currentStep={currentStep}
                isPlaying={isPlaying}
                currentSnapshot={currentSnapshot}
                onCodeChange={handleSandboxCodeChange}
              >
                {playbackEl}
              </CustomCodePanel>
            </aside>

            {/* Main Canvas */}
            <main className="canvas-area">
              <div className="canvas-header">
                <TypeBadge type={dsaType} />
                <div className="step-description">
                  {currentSnapshot
                    ? <><strong>Step {currentStep + 1}/{snapshots.length}</strong> — {currentSnapshot.description || currentSnapshot.code_line}</>
                    : 'Write any code in the editor → click Run & Trace to visualize.'
                  }
                </div>
              </div>

              <div className="canvas-body">
                {currentSnapshot && !loading && (
                  <ControlFlowPanel
                    snapshot={currentSnapshot}
                    prevSnapshot={snapshots[currentStep - 1] || null}
                    snapshots={snapshots}
                    currentStep={currentStep}
                  />
                )}
                {loading && (
                  <div className="loading-overlay">
                    <div className="spinner" />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tracing execution…</span>
                  </div>
                )}
                {error && !loading && <div className="error-banner">{error}</div>}
                {!loading && !error && snapshots.length === 0 && (
                  <div className="empty-state sandbox-empty">
                    <div className="sandbox-empty-icon">
                      <Terminal size={52} strokeWidth={1.2} />
                    </div>
                    <h3>Code Sandbox</h3>
                    <p>Write <strong>any</strong> Python code in the editor on the left.</p>
                    <p>Supports: arrays, graphs, trees, stacks, queues, matrices, hashmaps, linked lists, DP, and more.</p>
                    <div className="sandbox-tips">
                      <div className="sandbox-tip"><span>💡</span> Use the <strong>Templates</strong> button for starter code</div>
                      <div className="sandbox-tip"><span>🤖</span> DS type is <strong>auto-detected</strong> — or force it with the selector</div>
                      <div className="sandbox-tip"><span>🔢</span> Multiple data structures shown simultaneously</div>
                      <div className="sandbox-tip"><span>🌐</span> <strong>Java, C++, JS, C#</strong> auto-transpile to Python — full execution &amp; visualization!</div>
                    </div>
                  </div>
                )}
                {!loading && !error && currentSnapshot && (
                  <MultiVizPanel
                    snapshot={currentSnapshot}
                    prevSnapshot={snapshots[currentStep - 1] || null}
                    dsHint={sandboxDsHint !== 'auto' ? sandboxDsHint : null}
                  />
                )}
                {/* Stdout output panel — shown at bottom of canvas when code prints */}
                {!loading && lastStdout && (
                  <div className="canvas-stdout-panel">
                    <div className="canvas-stdout-header">
                      <span className="canvas-stdout-icon">⌨</span>
                      <span>Program Output</span>
                      <span className="canvas-stdout-lang">{sandboxLang.toUpperCase()}</span>
                    </div>
                    <pre className="canvas-stdout-body">{lastStdout}</pre>
                  </div>
                )}
              </div>
            </main>

            {/* Step Log */}
            <StepLog snapshots={snapshots} currentStep={currentStep} onGoToStep={goToStep} />
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── LIBRARY MODE ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {!isSandbox && (
          <>
            {/* Sidebar: Python Code Editor */}
            <aside className="sidebar">
              <div className="sidebar-header">
                <span className="sidebar-title">Python Editor</span>
                <span className="lib-python-badge" style={{ marginLeft: 8, fontSize: '0.72rem' }}>
                  <span className="lang-trace-dot" style={{ marginRight: 4 }} />
                  Python Only
                </span>
              </div>

              <div className="editor-wrap">
                <Editor
                  height="100%"
                  language="python"
                  value={libCode}
                  onChange={v => setLibCode(v || '')}
                  onMount={handleLibEditorMount}
                  options={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    glyphMargin: true,
                    folding: false,
                    lineDecorationsWidth: 8,
                    renderLineHighlight: 'line',
                    wordWrap: 'on',
                    tabSize: 4,
                    padding: { top: 12 },
                    smoothScrolling: true,
                    readOnly: false,
                  }}
                />
              </div>

              {playbackEl}
            </aside>

            {/* Main Canvas */}
            <main className="canvas-area">
              <div className="canvas-header">
                <TypeBadge type={dsaType} />
                <div className="step-description">
                  {currentSnapshot
                    ? <><strong>Step {currentStep + 1}/{snapshots.length}</strong> — {currentSnapshot.description || currentSnapshot.code_line}</>
                    : 'Select an algorithm and click Run & Trace to begin.'
                  }
                </div>
              </div>

              <div className="canvas-body">
                {currentSnapshot && !loading && (
                  <ControlFlowPanel
                    snapshot={currentSnapshot}
                    prevSnapshot={snapshots[currentStep - 1] || null}
                    snapshots={snapshots}
                    currentStep={currentStep}
                  />
                )}
                {loading && (
                  <div className="loading-overlay">
                    <div className="spinner" />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tracing execution…</span>
                  </div>
                )}
                {error && !loading && <div className="error-banner">{error}</div>}
                {!loading && !error && snapshots.length === 0 && (
                  <div className="empty-state">
                    <Braces size={48} />
                    <h3>Ready to Visualize</h3>
                    <p>Pick an algorithm from the dropdown, then click <strong>Run &amp; Trace</strong>.</p>
                    <p style={{ marginTop: 8 }}>Supported: <strong>Arrays</strong>, <strong>Graphs</strong>, <strong>Trees</strong>, <strong>DP</strong>, and more</p>
                  </div>
                )}
                {!loading && !error && currentSnapshot && (
                  <VisualizerRouter
                    snapshot={currentSnapshot}
                    prevSnapshot={snapshots[currentStep - 1] || null}
                  />
                )}
              </div>
            </main>

            {/* Step Log */}
            <StepLog snapshots={snapshots} currentStep={currentStep} onGoToStep={goToStep} />
          </>
        )}
      </div>
    </>
  );
}

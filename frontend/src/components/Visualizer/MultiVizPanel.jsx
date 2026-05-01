/**
 * MultiVizPanel.jsx
 * Renders ALL data-structure variables captured in a snapshot simultaneously.
 * Each DS variable gets its own mini-panel with the right visualizer.
 */
import ArrayViz from './ArrayViz';
import GraphViz from './GraphViz';
import TreeViz from './TreeViz';
import StackViz from './StackViz';
import QueueViz from './QueueViz';
import LinkedListViz from './LinkedListViz';
import HashMapViz from './HashMapViz';
import MatrixViz from './MatrixViz';

// DS type → display color
const TYPE_COLORS = {
  array:       { color: '#00f5a0', bg: '#00f5a011', label: 'Array' },
  matrix:      { color: '#ff6b9d', bg: '#ff6b9d11', label: 'Matrix' },
  graph:       { color: '#00d4ff', bg: '#00d4ff11', label: 'Graph' },
  tree:        { color: '#ff9f43', bg: '#ff9f4311', label: 'Tree' },
  stack:       { color: '#a78bfa', bg: '#a78bfa11', label: 'Stack' },
  queue:       { color: '#34d399', bg: '#34d39911', label: 'Queue' },
  deque:       { color: '#34d399', bg: '#34d39911', label: 'Deque' },
  linked_list: { color: '#f472b6', bg: '#f472b611', label: 'Linked List' },
  hashmap:     { color: '#fbbf24', bg: '#fbbf2411', label: 'HashMap' },
};

/** Thin wrapper to route each panel to the right visualizer */
function PanelViz({ panel, snapshot, prevSnapshot, dsHint }) {
  // Build a minimal snapshot-like object for the child viz component
  const fakeSnap = {
    ...snapshot,
    type: dsHint || panel.type,
    variables: { [panel.name]: panel.value },
    highlights: snapshot.highlights || {},
    active_edge: snapshot.active_edge,
    matrix_cell: snapshot.matrix_cell,
    intermediate_vertex: snapshot.intermediate_vertex,
  };
  const fakePrev = prevSnapshot
    ? {
        ...prevSnapshot,
        type: dsHint || panel.type,
        variables: { [panel.name]: (prevSnapshot.variables || {})[panel.name] },
      }
    : null;

  switch (panel.type) {
    case 'graph':       return <GraphViz snapshot={fakeSnap} />;
    case 'tree':        return <TreeViz  snapshot={fakeSnap} />;
    case 'matrix':      return <MatrixViz snapshot={fakeSnap} prevSnapshot={fakePrev} />;
    case 'stack':       return <StackViz snapshot={fakeSnap} prevSnapshot={fakePrev} />;
    case 'queue':       return <QueueViz snapshot={fakeSnap} prevSnapshot={fakePrev} />;
    case 'deque':       return <QueueViz snapshot={fakeSnap} prevSnapshot={fakePrev} isDeque />;
    case 'linked_list': return <LinkedListViz snapshot={fakeSnap} prevSnapshot={fakePrev} />;
    case 'hashmap':     return <HashMapViz snapshot={fakeSnap} prevSnapshot={fakePrev} />;
    default:            return <ArrayViz snapshot={fakeSnap} prevSnapshot={fakePrev} />;
  }
}

export default function MultiVizPanel({ snapshot, prevSnapshot, dsHint }) {
  if (!snapshot) return null;

  const panels = snapshot.ds_panels || [];

  // If there are no typed DS panels, fall back to legacy single-viz
  if (panels.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', padding: 32, textAlign: 'center', fontSize: '0.85rem' }}>
        No data structures detected in current step.<br />
        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
          Assign a list, dict, or other DS variable to see it visualized.
        </span>
      </div>
    );
  }

  // Single DS — full-size
  if (panels.length === 1) {
    const panel = panels[0];
    const meta = TYPE_COLORS[panel.type] || { color: '#6c63ff', bg: '#6c63ff11', label: panel.type };
    return (
      <div className="multi-viz-single">
        <div className="multi-panel-label" style={{ color: meta.color, borderColor: meta.color, background: meta.bg }}>
          <span className="panel-label-name">{panel.name}</span>
          <span className="panel-label-type">{meta.label}</span>
        </div>
        <div className="multi-panel-body full">
          <PanelViz panel={panel} snapshot={snapshot} prevSnapshot={prevSnapshot} dsHint={dsHint} />
        </div>
      </div>
    );
  }

  // Multiple DS — grid layout
  return (
    <div className="multi-viz-grid">
      {panels.map((panel) => {
        const meta = TYPE_COLORS[panel.type] || { color: '#6c63ff', bg: '#6c63ff11', label: panel.type };
        const isLarge = panel.type === 'graph' || panel.type === 'tree' || panel.type === 'matrix';
        return (
          <div
            key={panel.name}
            className={`multi-panel-card ${isLarge ? 'multi-panel-large' : 'multi-panel-small'}`}
            style={{ borderColor: meta.color + '44' }}
          >
            <div className="multi-panel-label" style={{ color: meta.color, borderColor: meta.color + '44', background: meta.bg }}>
              <span className="panel-label-name">{panel.name}</span>
              <span className="panel-label-type">{meta.label}</span>
            </div>
            <div className="multi-panel-body">
              <PanelViz panel={panel} snapshot={snapshot} prevSnapshot={prevSnapshot} dsHint={dsHint} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

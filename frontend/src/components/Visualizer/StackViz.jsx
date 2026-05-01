/**
 * StackViz.jsx — Visual stack with push/pop change arrows.
 */
import { diffArrays } from '../../utils/diffUtils';

export default function StackViz({ snapshot, prevSnapshot }) {
  if (!snapshot) return null;
  const vars = snapshot.variables || {};
  const prevVars = prevSnapshot?.variables || {};

  const stackEntry = Object.entries(vars).find(([k, v]) => k === 'stack' && Array.isArray(v))
    || Object.entries(vars).find(([, v]) => Array.isArray(v) && (v.length === 0 || typeof v[0] !== 'object'));
  const stack = stackEntry ? stackEntry[1] : [];
  const stackKey = stackEntry ? stackEntry[0] : 'stack';

  const prevStack = Array.isArray(prevVars[stackKey]) ? prevVars[stackKey] : [];
  const diff = diffArrays(prevStack, stack);

  const sideVars = Object.entries(vars).filter(([k, v]) => k !== stackKey && typeof v !== 'object');

  // Build change annotation
  let annotation = null;
  if (diff?.op === 'push') {
    annotation = {
      label: `↓ PUSH: ${diff.values.join(', ')}`,
      color: '#00f5a0',
      bg: '#00f5a018',
      border: '#00f5a044',
      arrow: '↓',
    };
  } else if (diff?.op === 'pop') {
    annotation = {
      label: `↑ POP: ${diff.values.join(', ')}`,
      color: '#ff9f43',
      bg: '#ff9f4318',
      border: '#ff9f4344',
      arrow: '↑',
    };
  } else if (diff?.op === 'modify') {
    annotation = {
      label: `✎ MODIFY: [${diff.changes.map(c => `${c.from}→${c.to}`).join(', ')}]`,
      color: '#00d4ff',
      bg: '#00d4ff18',
      border: '#00d4ff44',
      arrow: '✎',
    };
  }

  const topIdx = stack.length - 1;

  return (
    <div className="ds-viz-container">
      <div className="stack-scene">

        {/* Change Annotation Banner */}
        {annotation && (
          <div className="change-annotation" style={{ background: annotation.bg, border: `1px solid ${annotation.border}`, color: annotation.color }}>
            <span className="change-annotation-arrow">{annotation.arrow}</span>
            <span className="change-annotation-label">{annotation.label}</span>
          </div>
        )}

        <div className="stack-label-top">TOP {stack.length > 0 ? `(size: ${stack.length})` : '(empty)'}</div>

        <div className="stack-column">
          {stack.length === 0 && <div className="stack-empty">Empty Stack</div>}
          {[...stack].reverse().map((val, revIdx) => {
            const idx = stack.length - 1 - revIdx;
            const isTop = idx === topIdx;
            const isNew = diff?.op === 'push' && idx >= prevStack.length;
            const isModified = diff?.op === 'modify' && diff.changes.some(c => c.idx === idx);

            return (
              <div
                key={idx}
                className={`stack-block ${isTop ? 'stack-block--top' : ''} ${isNew ? 'stack-block--new' : ''} ${isModified ? 'stack-block--modified' : ''}`}
                style={{ '--delay': `${revIdx * 30}ms` }}
              >
                {/* Left: push arrow for new element */}
                {isNew && (
                  <span className="stack-block-change-arrow" style={{ color: '#00f5a0' }}>↓</span>
                )}
                {isModified && (
                  <span className="stack-block-change-arrow" style={{ color: '#00d4ff' }}>✎</span>
                )}
                {!isNew && !isModified && (
                  <span className="stack-block-idx">[{idx}]</span>
                )}

                <span className="stack-block-val">{String(val)}</span>

                {isTop && <span className="stack-block-badge">TOP</span>}
              </div>
            );
          })}

          {/* Ghost row for popped element */}
          {diff?.op === 'pop' && diff.values.map((v, i) => (
            <div key={`popped-${i}`} className="stack-block stack-block--popped">
              <span className="stack-block-change-arrow" style={{ color: '#ff9f43' }}>↑</span>
              <span className="stack-block-val" style={{ textDecoration: 'line-through', color: '#ff9f43' }}>{String(v)}</span>
              <span className="stack-block-badge" style={{ color: '#ff9f43', borderColor: '#ff9f43' }}>POPPED</span>
            </div>
          ))}
        </div>

        <div className="stack-label-bottom">BOTTOM</div>
      </div>

      {sideVars.length > 0 && (
        <div className="ds-side-panel">
          <div className="ds-side-title">Variables</div>
          {sideVars.map(([k, v]) => {
            const changed = prevVars[k] !== undefined && prevVars[k] !== v;
            return (
              <div key={k} className="ds-var-row">
                <span className="ds-var-name">{k}</span>
                <span className="ds-var-eq">=</span>
                <span className="ds-var-val" style={changed ? { color: '#ff9f43' } : {}}>
                  {changed && <span style={{ marginRight: 4, fontSize: '0.65rem' }}>({String(prevVars[k])}→)</span>}
                  {String(v)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

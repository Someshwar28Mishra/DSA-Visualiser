/**
 * StepLog.jsx — Right panel showing per-step history and current variable state.
 * Steps list and Variables each take 50% of the available panel height.
 */
import { useRef, useEffect } from 'react';

function formatValue(val) {
  if (Array.isArray(val)) {
    if (val.length > 10) return `[${val.slice(0, 10).join(', ')}, ...]`;
    return `[${val.join(', ')}]`;
  }
  if (typeof val === 'object' && val !== null) {
    const entries = Object.entries(val).slice(0, 5);
    const str = entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ');
    return `{${str}${Object.keys(val).length > 5 ? ', ...' : ''}}`;
  }
  return String(val);
}

export default function StepLog({ snapshots, currentStep, onGoToStep }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('.log-item.active');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentStep]);

  const current = snapshots[currentStep];
  const variables = current?.variables || {};
  const stdout = current?.stdout || null;

  const interestingVars = Object.entries(variables).filter(([k]) =>
    !['__builtins__', '__name__', '__doc__'].includes(k)
  );

  return (
    <div className="log-panel">
      <div className="log-header">Step Log</div>

      {/* Steps section — 50% height */}
      <div className="log-section log-section--steps">
        <div className="log-section-title">Steps</div>
        <div ref={listRef} className="log-list">
          {snapshots.map((snap, i) => (
            <div
              key={i}
              className={`log-item${i === currentStep ? ' active' : ''}`}
              onClick={() => onGoToStep(i)}
            >
              <div className="log-item-line">Line {snap.line}</div>
              <div className="log-item-desc">{snap.description || snap.code_line}</div>
            </div>
          ))}
          {snapshots.length === 0 && (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
              Run an algorithm to see step logs here.
            </div>
          )}
        </div>
      </div>

      {/* Variables section — 50% height */}
      <div className="log-section log-section--vars">
        <div className="log-section-title">
          Variables at Step {currentStep + 1}
          {stdout && <span className="stdout-badge">stdout</span>}
        </div>
        <div className="log-section-content">
          {/* Stdout output from print() calls */}
          {stdout && (
            <div className="stdout-panel">
              <div className="stdout-label">📤 Output</div>
              <pre className="stdout-output">{stdout}</pre>
            </div>
          )}
          {interestingVars.length > 0 ? (
            interestingVars.map(([name, val]) => (
              <div key={name} className="var-row">
                <span className="var-name">{name}</span>
                <span className="var-eq">&nbsp;=&nbsp;</span>
                <span className="var-val">{formatValue(val)}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
              {snapshots.length === 0 ? 'No variables yet.' : 'No tracked variables at this step.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

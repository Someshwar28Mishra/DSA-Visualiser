/**
 * QueueViz.jsx — Visual queue/deque with enqueue/dequeue change arrows.
 */
import { diffArrays } from '../../utils/diffUtils';

export default function QueueViz({ snapshot, prevSnapshot, isDeque = false }) {
  if (!snapshot) return null;
  const vars = snapshot.variables || {};
  const prevVars = prevSnapshot?.variables || {};

  const qKey = isDeque
    ? (Object.keys(vars).find(k => k === 'dq') || Object.keys(vars).find(k => Array.isArray(vars[k])))
    : (Object.keys(vars).find(k => k === 'queue') || Object.keys(vars).find(k => Array.isArray(vars[k]) && k !== 'stack'));

  const queue = qKey ? (vars[qKey] || []) : [];
  const prevQueue = qKey && Array.isArray(prevVars[qKey]) ? prevVars[qKey] : [];
  const diff = diffArrays(prevQueue, queue);

  const sideVars = Object.entries(vars).filter(([k, v]) => k !== qKey && k !== 'stack' && typeof v !== 'object');

  // Determine what changed and where
  let leftAnnotation = null;   // dequeue from front
  let rightAnnotation = null;  // enqueue at rear
  let newIndices = new Set();
  let poppedFront = null;
  let poppedRear = null;

  if (diff) {
    if (diff.op === 'push') {
      const addedCount = queue.length - prevQueue.length;
      for (let i = queue.length - addedCount; i < queue.length; i++) newIndices.add(i);
      rightAnnotation = { label: isDeque ? `INSERT REAR: ${diff.values.join(', ')}` : `ENQUEUE: ${diff.values.join(', ')}`, color: '#00f5a0' };
    } else if (diff.op === 'pop') {
      if (!isDeque) {
        // Standard queue: dequeue from front
        poppedFront = diff.values[0];
        leftAnnotation = { label: `DEQUEUE: ${diff.values.join(', ')}`, color: '#00d4ff' };
      } else {
        // Deque: check if front or rear was removed
        if (prevQueue[prevQueue.length - 1] !== queue[queue.length - 1]) {
          poppedRear = diff.values[0];
          rightAnnotation = { label: `DELETE REAR: ${diff.values.join(', ')}`, color: '#ff9f43' };
        } else {
          poppedFront = diff.values[0];
          leftAnnotation = { label: `DELETE FRONT: ${diff.values.join(', ')}`, color: '#ff9f43' };
        }
      }
    } else if (diff.op === 'modify') {
      rightAnnotation = { label: `MODIFY: ${diff.changes.map(c => `[${c.idx}]: ${c.from}→${c.to}`).join(', ')}`, color: '#a78bfa' };
    }
  }

  return (
    <div className="ds-viz-container">
      <div className="queue-scene">

        {/* Change annotation banners */}
        <div className="queue-annotations">
          {leftAnnotation && (
            <div className="change-annotation change-annotation--left" style={{ color: leftAnnotation.color, borderColor: `${leftAnnotation.color}44`, background: `${leftAnnotation.color}15` }}>
              <span className="change-annotation-arrow">←</span>
              <span className="change-annotation-label">{leftAnnotation.label}</span>
            </div>
          )}
          {rightAnnotation && (
            <div className="change-annotation change-annotation--right" style={{ color: rightAnnotation.color, borderColor: `${rightAnnotation.color}44`, background: `${rightAnnotation.color}15` }}>
              <span className="change-annotation-label">{rightAnnotation.label}</span>
              <span className="change-annotation-arrow">→</span>
            </div>
          )}
        </div>

        {isDeque ? (
          <div className="deque-arrows">
            <div className="deque-arrow deque-arrow--left">
              <span className="deque-arrow-label">INSERT / DELETE</span>
              <span className="deque-arrow-sym">◀</span>
            </div>
            <div className="deque-arrow deque-arrow--right">
              <span className="deque-arrow-sym">▶</span>
              <span className="deque-arrow-label">INSERT / DELETE</span>
            </div>
          </div>
        ) : (
          <div className="queue-arrows">
            <div className="queue-arrow-label queue-arrow-label--dequeue">← DEQUEUE<br /><small>FRONT</small></div>
            <div className="queue-arrow-label queue-arrow-label--enqueue">ENQUEUE →<br /><small>REAR</small></div>
          </div>
        )}

        <div className="queue-track">
          {/* Ghost popped-from-front */}
          {poppedFront !== null && (
            <div className="queue-block queue-block--ghost">
              <span className="queue-block-change-arrow" style={{ color: '#ff9f43' }}>←</span>
              <span className="queue-block-val" style={{ textDecoration: 'line-through', color: '#ff9f43' }}>{String(poppedFront)}</span>
            </div>
          )}

          {queue.length === 0 && <div className="queue-empty">Empty {isDeque ? 'Deque' : 'Queue'}</div>}

          {queue.map((val, idx) => {
            const isFront = idx === 0;
            const isRear = idx === queue.length - 1;
            const isNew = newIndices.has(idx);

            return (
              <div
                key={idx}
                className={`queue-block
                  ${isFront && !isDeque ? 'queue-block--front' : ''}
                  ${isRear && !isDeque ? 'queue-block--rear' : ''}
                  ${(isFront || isRear) && isDeque ? 'queue-block--deque-end' : ''}
                  ${isNew ? 'queue-block--new' : ''}
                `}
              >
                {isNew && <span className="queue-block-change-arrow" style={{ color: '#00f5a0', fontSize: '0.7rem' }}>NEW→</span>}
                <span className="queue-block-val">{String(val)}</span>
                {isFront && <span className="queue-block-badge">{isDeque ? 'L' : 'F'}</span>}
                {isRear && queue.length > 1 && <span className="queue-block-badge queue-block-badge--rear">{isDeque ? 'R' : 'R'}</span>}
              </div>
            );
          })}

          {/* Ghost popped-from-rear */}
          {poppedRear !== null && (
            <div className="queue-block queue-block--ghost">
              <span className="queue-block-val" style={{ textDecoration: 'line-through', color: '#ff9f43' }}>{String(poppedRear)}</span>
              <span className="queue-block-change-arrow" style={{ color: '#ff9f43' }}>→</span>
            </div>
          )}
        </div>

        <div className="queue-size-label">Size: {queue.length} | [{qKey}]</div>
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

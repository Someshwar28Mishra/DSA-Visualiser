/**
 * ControlFlowPanel.jsx
 * Floating overlay that describes the current control-flow event:
 * loop iteration, conditional branch, assignment, return.
 *
 * Uses the new snapshot fields: ctrl_type, iter_count, loop_vars, is_loop, is_condition
 */

const CTRL_CONFIG = {
  for_loop:     { icon: '🔄', label: 'FOR LOOP',    color: '#00d4ff', bg: '#00d4ff' },
  while_loop:   { icon: '🔄', label: 'WHILE LOOP',  color: '#00d4ff', bg: '#00d4ff' },
  if_cond:      { icon: '❓', label: 'IF',          color: '#ff9f43', bg: '#ff9f43' },
  elif_cond:    { icon: '❓', label: 'ELIF',        color: '#ff9f43', bg: '#ff9f43' },
  else_branch:  { icon: '↪', label: 'ELSE',        color: '#a78bfa', bg: '#a78bfa' },
  return_stmt:  { icon: '↩', label: 'RETURN',       color: '#00f5a0', bg: '#00f5a0' },
  loop_control: { icon: '⚡', label: 'BREAK/CONT',  color: '#ff4757', bg: '#ff4757' },
  assignment:   { icon: '📝', label: 'ASSIGN',      color: '#6c63ff', bg: '#6c63ff' },
  expression:   { icon: '▶',  label: 'EXECUTE',     color: '#5a5f7a', bg: '#5a5f7a' },
};

export default function ControlFlowPanel({ snapshot, prevSnapshot, snapshots, currentStep }) {
  if (!snapshot) return null;

  const ctrl = snapshot.ctrl_type || 'expression';
  const cfg  = CTRL_CONFIG[ctrl] || CTRL_CONFIG.expression;
  const isLoop = snapshot.is_loop;
  const isCond = snapshot.is_condition;

  // Infer conditional branch result: look at the NEXT snapshot's line number.
  // If next line > current line + 1, condition was False (branch skipped).
  let branchResult = null;
  if (isCond && ctrl !== 'else_branch') {
    const next = snapshots?.[currentStep + 1];
    if (next) {
      const currLine = snapshot.line;
      const nextLine = next.line;
      // If next line is the immediate next line (inside the if-block), branch was TRUE
      // else branch was FALSE (skipped to else/elif/end of block)
      branchResult = nextLine === currLine + 1 ? true : false;
    }
  }

  const loopVarEntries = Object.entries(snapshot.loop_vars || {});

  return (
    <div className="ctrl-flow-panel">
      {/* Main control type badge */}
      <div className="ctrl-badge" style={{ '--ctrl-color': cfg.color, background: `${cfg.bg}18`, border: `1px solid ${cfg.bg}44` }}>
        <span className="ctrl-badge-icon">{cfg.icon}</span>
        <span className="ctrl-badge-label">{cfg.label}</span>

        {/* Loop iteration counter */}
        {isLoop && (
          <span className="ctrl-iter-badge">
            iteration #{snapshot.iter_count}
          </span>
        )}

        {/* Branch result for conditionals */}
        {isCond && branchResult !== null && (
          <span
            className="ctrl-branch-badge"
            style={{ background: branchResult ? '#00f5a022' : '#ff475722', color: branchResult ? '#00f5a0' : '#ff4757', border: `1px solid ${branchResult ? '#00f5a044' : '#ff475744'}` }}
          >
            {branchResult ? '✓ TRUE → branch taken' : '✗ FALSE → branch skipped'}
          </span>
        )}

        {/* else branch: always taken */}
        {ctrl === 'else_branch' && (
          <span className="ctrl-branch-badge" style={{ background: '#a78bfa22', color: '#a78bfa', border: '1px solid #a78bfa44' }}>
            ↪ fallthrough
          </span>
        )}
      </div>

      {/* Loop variable current values */}
      {isLoop && loopVarEntries.length > 0 && (
        <div className="ctrl-loop-vars">
          {loopVarEntries.map(([k, v]) => (
            <span key={k} className="ctrl-loop-var">
              <span className="ctrl-loop-var-name">{k}</span>
              <span className="ctrl-loop-var-eq">=</span>
              <span className="ctrl-loop-var-val">{String(v)}</span>
            </span>
          ))}
        </div>
      )}

      {/* Loop progress bar: shows how many times this line has been hit vs total steps */}
      {isLoop && snapshot.iter_count > 1 && (
        <div className="ctrl-loop-progress">
          <div className="ctrl-loop-bar-track">
            <div
              className="ctrl-loop-bar-fill"
              style={{ width: `${Math.min((snapshot.iter_count / 20) * 100, 100)}%`, background: cfg.color }}
            />
          </div>
          <span className="ctrl-loop-bar-label">×{snapshot.iter_count}</span>
        </div>
      )}
    </div>
  );
}

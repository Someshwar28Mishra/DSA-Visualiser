/**
 * MatrixViz.jsx — Premium 2D matrix visualizer.
 *
 * Features:
 *  • Renders ALL 2D-list variables (not just the first)
 *  • Heat-map coloring based on normalized finite values
 *  • Row / col crosshair highlight on current cell (i, j)
 *  • Floyd-Warshall "via vertex k" banner
 *  • Changed-cell pulse animation with old → new value overlay
 *  • Scrollable container for large matrices (up to 20×20)
 *  • Side panel with every scalar variable and change tracking
 */

const MAX_COLS = 20;
const MAX_ROWS = 20;
const CELL_SIZE = 48; // px — base cell size

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCell(v) {
  if (v === 'Infinity' || v === Infinity)   return '∞';
  if (v === '-Infinity' || v === -Infinity) return '-∞';
  if (v === null || v === undefined)        return '?';
  return String(v);
}

/**
 * Compute a heat-map intensity [0..1] for a finite numeric value
 * relative to the min/max of ALL finite values in the matrix.
 */
function heatIntensity(val, min, max) {
  if (min === max || val === 'Infinity' || val === '-Infinity') return null;
  if (typeof val !== 'number') return null;
  return (val - min) / (max - min); // 0 = coolest, 1 = hottest
}

/** Interpolate between two hex colors based on t ∈ [0,1] */
function lerpColor(t) {
  // Cool: #1c1f28  →  Warm: #6c63ff  →  Hot: #ff6b9d
  const cool = [28, 31, 40];
  const mid  = [108, 99, 255];
  const hot  = [255, 107, 157];
  let r, g, b;
  if (t < 0.5) {
    const s = t * 2;
    r = Math.round(cool[0] + s * (mid[0] - cool[0]));
    g = Math.round(cool[1] + s * (mid[1] - cool[1]));
    b = Math.round(cool[2] + s * (mid[2] - cool[2]));
  } else {
    const s = (t - 0.5) * 2;
    r = Math.round(mid[0] + s * (hot[0] - mid[0]));
    g = Math.round(mid[1] + s * (hot[1] - mid[1]));
    b = Math.round(mid[2] + s * (hot[2] - mid[2]));
  }
  return `rgb(${r},${g},${b})`;
}

/**
 * Collect all finite values in a 2D matrix array for min/max range.
 */
function finiteRange(matrix) {
  let min = Infinity, max = -Infinity;
  for (const row of matrix) {
    for (const v of row) {
      if (typeof v === 'number' && isFinite(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
  }
  return { min: isFinite(min) ? min : 0, max: isFinite(max) ? max : 0 };
}

// ── Single Matrix Grid ──────────────────────────────────────────────────────

function MatrixGrid({ name, matrix, prevMatrix, matrixCell, intermediateVertex, showHeatMap }) {
  const rows = Math.min(matrix.length, MAX_ROWS);
  const cols = Math.min((matrix[0] || []).length, MAX_COLS);

  // Detect changed cells
  const changedCells = new Set();
  if (prevMatrix && prevMatrix.length > 0) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const prev = prevMatrix[r]?.[c];
        const curr = matrix[r]?.[c];
        if (prev !== undefined && JSON.stringify(prev) !== JSON.stringify(curr)) {
          changedCells.add(`${r},${c}`);
        }
      }
    }
  }

  const { min: fMin, max: fMax } = showHeatMap ? finiteRange(matrix) : { min: 0, max: 0 };

  // Changed cells list for annotation bar
  const changedList = [...changedCells].slice(0, 5).map(key => {
    const [r, c] = key.split(',').map(Number);
    return { r, c, oldVal: prevMatrix?.[r]?.[c], newVal: matrix[r]?.[c] };
  });

  const activeRow = matrixCell?.[0] ?? null;
  const activeCol = matrixCell?.[1] ?? null;

  return (
    <div className="matrix-grid-block">
      {/* Matrix name label */}
      <div className="matrix-grid-label">
        <span className="matrix-name-badge">{name}</span>
        <span className="matrix-size-tag">{rows} × {cols}</span>
        {showHeatMap && fMin !== fMax && (
          <span className="matrix-heatmap-tag">heat map</span>
        )}
      </div>

      {/* Annotation bar */}
      {(changedList.length > 0 || (matrixCell && activeRow !== null)) && (
        <div className="matrix-annotation-bar">
          {matrixCell && activeRow !== null && (
            <span className="matrix-ann matrix-ann--active">
              ▶ [{activeRow}][{activeCol}] = {formatCell(matrix[activeRow]?.[activeCol])}
              {intermediateVertex !== null && intermediateVertex !== undefined && (
                <span className="matrix-ann-k"> via k={intermediateVertex}</span>
              )}
            </span>
          )}
          {changedList.map(({ r, c, oldVal, newVal }, i) => (
            <span key={i} className="matrix-ann matrix-ann--changed">
              ✎ [{r}][{c}]: {formatCell(oldVal)} → {formatCell(newVal)}
            </span>
          ))}
        </div>
      )}

      {/* Grid scroll container */}
      <div className="matrix-scroll-area">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="matrix-corner" />
              {Array.from({ length: cols }, (_, c) => (
                <th
                  key={c}
                  className={`matrix-col-hdr${activeCol === c ? ' matrix-col-hdr--active' : ''}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                <td className={`matrix-row-hdr${activeRow === r ? ' matrix-row-hdr--active' : ''}`}>
                  {r}
                </td>
                {Array.from({ length: cols }, (_, c) => {
                  const val       = matrix[r]?.[c];
                  const isActive  = activeRow === r && activeCol === c;
                  const isRowHl   = !isActive && activeRow === r;
                  const isColHl   = !isActive && !isRowHl && activeCol === c;
                  const isChanged = changedCells.has(`${r},${c}`);
                  const prevVal   = prevMatrix?.[r]?.[c];

                  // Heat map color
                  let cellBg   = 'var(--bg-card)';
                  let cellBdr  = 'var(--border)';
                  let cellGlow = 'none';
                  let textColor = 'var(--text-primary)';

                  if (isActive) {
                    cellBg   = 'linear-gradient(135deg, #6c63ff, #8b5cf6)';
                    cellBdr  = '#6c63ff';
                    cellGlow = '0 0 18px #6c63ff88';
                    textColor = '#fff';
                  } else if (isChanged) {
                    cellBg   = '#ff9f4322';
                    cellBdr  = '#ff9f43';
                    cellGlow = '0 0 12px #ff9f4344';
                    textColor = '#ff9f43';
                  } else if (showHeatMap && typeof val === 'number' && isFinite(val) && fMin !== fMax) {
                    const t = heatIntensity(val, fMin, fMax);
                    if (t !== null) {
                      const base = lerpColor(t);
                      cellBg   = base + '44';
                      cellBdr  = base + '99';
                      textColor = t > 0.6 ? '#fff' : 'var(--text-primary)';
                    }
                  } else if (isRowHl) {
                    cellBg  = '#6c63ff0d';
                    cellBdr = '#6c63ff33';
                  } else if (isColHl) {
                    cellBg  = '#00d4ff0a';
                    cellBdr = '#00d4ff22';
                  }

                  return (
                    <td
                      key={c}
                      className={`matrix-cell${isActive ? ' matrix-cell--active' : ''}${isChanged ? ' matrix-cell--changed' : ''}`}
                      style={{ background: cellBg, border: `1px solid ${cellBdr}`, boxShadow: cellGlow }}
                      title={`[${r}][${c}] = ${formatCell(val)}`}
                    >
                      {isChanged && prevVal !== undefined && prevVal !== val && (
                        <span className="matrix-cell-old">{formatCell(prevVal)}</span>
                      )}
                      <span className="matrix-cell-val" style={{ color: textColor }}>
                        {formatCell(val)}
                      </span>
                      {isChanged && <span className="matrix-changed-dot" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Scalar side-panel ───────────────────────────────────────────────────────

function ScalarPanel({ vars, prevVars }) {
  const scalars = Object.entries(vars).filter(([k, v]) => {
    if (k.startsWith('_')) return false;
    return typeof v !== 'object' || v === null;
  });
  if (scalars.length === 0) return null;

  return (
    <div className="matrix-scalar-panel">
      <div className="matrix-scalar-title">Variables</div>
      {scalars.map(([k, v]) => {
        const prev = prevVars?.[k];
        const changed = prev !== undefined && JSON.stringify(prev) !== JSON.stringify(v);
        return (
          <div key={k} className={`matrix-scalar-row${changed ? ' matrix-scalar-row--changed' : ''}`}>
            <span className="matrix-scalar-name">{k}</span>
            <span className="matrix-scalar-eq">=</span>
            <span className="matrix-scalar-val">
              {changed && (
                <span className="matrix-scalar-prev">{formatCell(prev)}→</span>
              )}
              {formatCell(v)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────────

export default function MatrixViz({ snapshot, prevSnapshot }) {
  if (!snapshot) return null;

  const vars     = snapshot.variables  || {};
  const prevVars = prevSnapshot?.variables || {};

  // Find ALL 2D list variables
  const matEntries = Object.entries(vars).filter(
    ([k, v]) => !k.startsWith('_') && Array.isArray(v) && v.length > 0 && Array.isArray(v[0])
  );

  if (matEntries.length === 0) {
    return (
      <div className="ds-viz-container">
        <div className="matrix-empty">No 2D matrix found in this snapshot.</div>
      </div>
    );
  }

  const matrixCell         = snapshot.matrix_cell ?? null;
  const intermediateVertex = snapshot.intermediate_vertex ?? null;
  // Show heat map only if any matrix has more than trivial range
  const showHeatMap = true;

  return (
    <div className="ds-viz-container matrix-viz-root">
      {/* Intermediate vertex banner (Floyd-Warshall k) */}
      {intermediateVertex !== null && intermediateVertex !== undefined && (
        <div className="matrix-k-banner">
          <span className="matrix-k-icon">🔀</span>
          <span>
            Intermediate vertex <strong>k = {intermediateVertex}</strong>
            {matrixCell && (
              <> &nbsp;·&nbsp; Testing path <strong>[{matrixCell[0]}][{matrixCell[1]}]</strong> via <strong>k</strong></>
            )}
          </span>
        </div>
      )}

      {/* All matrix grids */}
      <div className="matrix-grids-area">
        {matEntries.map(([name, matrix]) => {
          const prevMatrix = Array.isArray(prevVars[name]) ? prevVars[name] : [];
          return (
            <MatrixGrid
              key={name}
              name={name}
              matrix={matrix}
              prevMatrix={prevMatrix}
              matrixCell={matrixCell}
              intermediateVertex={intermediateVertex}
              showHeatMap={showHeatMap}
            />
          );
        })}
      </div>

      {/* Scalar variables panel */}
      <ScalarPanel vars={vars} prevVars={prevVars} />
    </div>
  );
}

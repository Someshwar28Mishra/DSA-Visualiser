/**
 * ArrayViz.jsx — CS-Textbook style array visualization.
 * Shows a flat horizontal row of boxes with:
 *  - Value inside each cell
 *  - Index label below each cell
 *  - Green highlighted cell for the active pointer
 *  - Animated arrow pointer above active cell
 *  - Variable name label on the left (arr[] =)
 *  - Swap / modification annotations above the array
 */
import { motion, AnimatePresence } from 'framer-motion';
import { diffArrays } from '../../utils/diffUtils';

/* ── Color scheme matching image ─────────────────────────────────────────── */
const CELL_COLORS = {
  default:     { bg: 'transparent',         border: '#2a2d3e', text: '#f0f0ff'  },
  primary:     { bg: '#00f5a022',            border: '#00f5a0', text: '#00f5a0'  }, // green – main pointer
  secondary:   { bg: '#00d4ff18',            border: '#00d4ff', text: '#00d4ff'  }, // cyan – second pointer
  swapped:     { bg: '#ff9f4322',            border: '#ff9f43', text: '#ff9f43'  }, // orange – swap
  modified:    { bg: '#6c63ff22',            border: '#6c63ff', text: '#6c63ff'  }, // purple – modified
};

function getCellStyle(idx, highlights, name, swapSet, modSet) {
  if (swapSet.has(idx))    return CELL_COLORS.swapped;
  if (modSet.has(idx))     return CELL_COLORS.modified;
  const hl = highlights?.[name] || [];
  if (hl.length >= 2) {
    if (idx === hl[0]) return CELL_COLORS.primary;
    if (idx === hl[1]) return CELL_COLORS.secondary;
  }
  if (hl.includes(idx))   return CELL_COLORS.primary;
  return CELL_COLORS.default;
}

/* ── Pointer arrow above a cell ──────────────────────────────────────────── */
function PointerArrow({ label, color = '#00f5a0' }) {
  return (
    <div className="arr-pointer-wrap">
      <span className="arr-pointer-label" style={{ color }}>{label}</span>
      <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
        <path d="M7 0 L7 12 M7 12 L2 7 M7 12 L12 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ── A single horizontal "textbook" array row ────────────────────────────── */
function TextbookRow({ name, arr, highlights, diff, prevArr }) {
  if (!Array.isArray(arr) || arr.length === 0) return null;

  const hlList  = highlights?.[name] || [];
  const swapSet = new Set(diff?.op === 'swap'   ? diff.changes.map(c => c.idx) : []);
  const modSet  = new Set(diff?.op === 'modify' ? diff.changes.map(c => c.idx) : []);

  // Only show annotations if something changed
  const hasSwap = swapSet.size >= 2;
  const hasMod  = modSet.size > 0;

  return (
    <div className="arr-row-wrap">
      {/* ── Change annotations above the row ── */}
      {hasSwap && (
        <motion.div
          className="arr-annotation arr-annotation--swap"
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          key={`swap-${[...swapSet].join('-')}`}
        >
          ↕&nbsp;SWAP&nbsp;[{[...swapSet][0]}]&nbsp;↔&nbsp;[{[...swapSet][1]}]
        </motion.div>
      )}
      {hasMod && (
        <motion.div
          className="arr-annotation arr-annotation--mod"
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          key={`mod-${[...modSet].join('-')}`}
        >
          ✎&nbsp;MODIFIED:&nbsp;
          {diff.changes.map(c => `[${c.idx}] ${c.from}→${c.to}`).join(', ')}
        </motion.div>
      )}

      {/* ── Pointer arrows row (above cells) ── */}
      <div className="arr-pointer-row">
        {/* left label placeholder */}
        <div className="arr-name-label">{name}[] =</div>

        {arr.map((_, i) => {
          const isP1 = hlList.length >= 2 ? i === hlList[0] : hlList.includes(i);
          const isP2 = hlList.length >= 2 && i === hlList[1];
          const isSwap = swapSet.has(i);
          return (
            <div key={i} className="arr-cell-slot">
              {isSwap && <PointerArrow label="↕" color="#ff9f43" />}
              {isP1 && !isSwap && <PointerArrow label="" color="#00f5a0" />}
              {isP2 && !isSwap && <PointerArrow label="" color="#00d4ff" />}
            </div>
          );
        })}
      </div>

      {/* ── Main cell row ── */}
      <div className="arr-cell-row">
        <div className="arr-name-label-spacer" />

        <AnimatePresence mode="popLayout">
          {arr.map((val, i) => {
            const style   = getCellStyle(i, highlights, name, swapSet, modSet);
            const isHL    = hlList.includes(i) || swapSet.has(i) || modSet.has(i);
            const prevVal = Array.isArray(prevArr) ? prevArr[i] : undefined;
            const changed = modSet.has(i) && prevVal !== undefined && prevVal !== val;

            return (
              <motion.div
                key={i}
                className={`arr-cell${isHL ? ' arr-cell--active' : ''}`}
                style={{
                  background:   style.bg,
                  borderColor:  style.border,
                  color:        style.text,
                  boxShadow:    isHL ? `0 0 14px ${style.border}55` : 'none',
                }}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 35, delay: i * 0.02 }}
              >
                {/* Old value strikethrough if modified */}
                {changed && (
                  <span className="arr-cell-old">{String(prevVal)}</span>
                )}
                <span className="arr-cell-val">{String(val)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Index labels below cells ── */}
      <div className="arr-index-row">
        <div className="arr-name-label-spacer" />
        {arr.map((_, i) => (
          <div key={i} className="arr-index-label">{i}</div>
        ))}
      </div>
    </div>
  );
}

/* ── Bar chart (only used for pure-number arrays > 4 elements) ─────────── */
function BarChart({ name, arr, highlights, diff }) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const maxVal   = Math.max(...arr.filter(v => typeof v === 'number'), 1);
  const hlList   = highlights?.[name] || [];
  const swapSet  = new Set(diff?.op === 'swap'   ? diff.changes.map(c => c.idx) : []);

  return (
    <div className="arr-barchart-wrap">
      <div className="arr-barchart-title">{name}</div>
      <div className="arr-barchart">
        {arr.map((val, i) => {
          if (typeof val !== 'number') return null;
          const pct     = Math.max((val / maxVal) * 100, 3);
          const isHL    = hlList.includes(i);
          const isSwap  = swapSet.has(i);
          const color   = isSwap ? '#ff9f43' : isHL ? '#00f5a0' : '#6c63ff';
          return (
            <div key={i} className="arr-bar-col">
              {(isHL || isSwap) && (
                <PointerArrow label="" color={color} />
              )}
              <motion.div
                className="arr-bar"
                style={{ height: `${pct}%`, background: color, boxShadow: isHL || isSwap ? `0 0 10px ${color}88` : 'none' }}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
              <span className="arr-bar-val" style={{ color }}>{val}</span>
              <span className="arr-bar-idx">{i}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function ArrayViz({ snapshot, prevSnapshot }) {
  if (!snapshot) return null;
  const { variables, highlights } = snapshot;
  const prevVars = prevSnapshot?.variables || {};

  const numArrays   = Object.entries(variables || {}).filter(([, v]) => Array.isArray(v) && v.every(x => typeof x === 'number'));
  const mixedArrays = Object.entries(variables || {}).filter(([, v]) => Array.isArray(v) && !v.every(x => typeof x === 'number'));

  const diffs = {};
  for (const [name, arr] of [...numArrays, ...mixedArrays]) {
    const prev = Array.isArray(prevVars[name]) ? prevVars[name] : null;
    diffs[name] = prev ? diffArrays(prev, arr) : null;
  }

  if (numArrays.length === 0 && mixedArrays.length === 0) {
    return (
      <div className="empty-state">
        <p>No array variables found in this snapshot.</p>
      </div>
    );
  }

  // Large arrays (> 12 elements) also get a bar chart on top
  const showBarchart = numArrays.length === 1 && numArrays[0][1].length > 8;

  return (
    <div className="arr-viz-root">
      {/* Bar chart for large numeric arrays */}
      {showBarchart && (
        <BarChart
          name={numArrays[0][0]}
          arr={numArrays[0][1]}
          highlights={highlights}
          diff={diffs[numArrays[0][0]]}
        />
      )}

      {/* Textbook rows for all arrays */}
      {numArrays.map(([name, arr]) => (
        <TextbookRow
          key={name}
          name={name}
          arr={arr}
          highlights={highlights}
          diff={diffs[name]}
          prevArr={prevVars[name]}
        />
      ))}
      {mixedArrays.map(([name, arr]) => (
        <TextbookRow
          key={name}
          name={name}
          arr={arr}
          highlights={highlights}
          diff={diffs[name]}
          prevArr={prevVars[name]}
        />
      ))}
    </div>
  );
}

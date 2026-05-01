/**
 * LinkedListViz.jsx — SVG-based linked list visualizer with pointer change arrows.
 * Reads `ll` (list of [value, next_index]), `head`, `current`, `slow`, `fast` from variables.
 */
import { diffPointer } from '../../utils/diffUtils';

const NODE_W = 64, NODE_H = 40, ARROW_W = 44, ROW_H = 120;
const COLORS = {
  default: '#1c1f28', border: '#2a2d3e',
  current: '#6c63ff', slow: '#00d4ff', fast: '#ff9f43', head: '#00f5a0',
  null_node: '#161820',
};

function buildChain(ll, head) {
  if (!Array.isArray(ll) || head === undefined || head === null) return [];
  const nodes = [];
  const visited = new Set();
  let cur = head;
  while (cur !== -1 && cur !== null && !visited.has(cur)) {
    if (cur >= ll.length) break;
    visited.add(cur);
    const [val, next] = ll[cur];
    nodes.push({ idx: cur, val, next });
    cur = next;
  }
  // If cycle detected, mark last as cycling back
  if (cur !== -1 && cur !== null && visited.has(cur)) {
    nodes.push({ idx: cur, val: ll[cur]?.[0], next: null, isCycle: true });
  }
  return nodes;
}

export default function LinkedListViz({ snapshot, prevSnapshot }) {
  if (!snapshot) return null;
  const vars = snapshot.variables || {};

  const ll = vars.ll || vars.ll_nodes || null;
  const head = vars.head ?? vars.head_node ?? 0;
  const current = vars.current ?? vars.curr ?? null;
  const slow = vars.slow ?? null;
  const fast = vars.fast ?? null;

  // Pointer movement diffs
  const currDiff = diffPointer(prevSnapshot, snapshot, 'current') || diffPointer(prevSnapshot, snapshot, 'curr');
  const slowDiff = diffPointer(prevSnapshot, snapshot, 'slow');
  const fastDiff = diffPointer(prevSnapshot, snapshot, 'fast');
  const headDiff = diffPointer(prevSnapshot, snapshot, 'head');

  // Detect changed next pointers in ll
  const prevLL = prevSnapshot?.variables?.ll || prevSnapshot?.variables?.ll_nodes || [];
  const changedNextNodes = new Set();
  if (Array.isArray(ll) && Array.isArray(prevLL)) {
    for (let i = 0; i < ll.length; i++) {
      if (prevLL[i] && ll[i] && ll[i][1] !== prevLL[i][1]) changedNextNodes.add(i);
    }
  }

  const pointerAnnotations = [
    currDiff && { label: `CURR: [${currDiff.from}] → [${currDiff.to}]`, color: '#6c63ff' },
    slowDiff && { label: `SLOW: [${slowDiff.from}] → [${slowDiff.to}]`, color: '#00d4ff' },
    fastDiff && { label: `FAST: [${fastDiff.from}] → [${fastDiff.to}]`, color: '#ff9f43' },
    headDiff && { label: `HEAD: [${headDiff.from}] → [${headDiff.to}]`, color: '#00f5a0' },
  ].filter(Boolean);

  if (!Array.isArray(ll)) {
    return (
      <div className="ds-viz-container">
        <div className="ll-empty">No linked list data yet.</div>
      </div>
    );
  }

  const chain = buildChain(ll, head);
  const totalW = chain.length * (NODE_W + ARROW_W) + 80;
  const svgH = ROW_H;

  const getNodeColor = (idx) => {
    if (idx === slow && slow !== null) return COLORS.slow;
    if (idx === fast && fast !== null) return COLORS.fast;
    if (idx === current && current !== null) return COLORS.current;
    if (idx === head) return COLORS.head;
    return COLORS.default;
  };

  const sideVars = Object.entries(vars).filter(
    ([k, v]) => !['ll', 'll_nodes', 'head', 'current', 'curr', 'slow', 'fast'].includes(k) && typeof v !== 'object'
  );

  return (
    <div className="ds-viz-container">
      <div className="ll-scene">

        {/* Pointer movement annotations */}
        {pointerAnnotations.length > 0 && (
          <div className="ll-annotations">
            {pointerAnnotations.map((a, i) => (
              <div key={i} className="change-annotation" style={{ color: a.color, borderColor: `${a.color}44`, background: `${a.color}15` }}>
                <span className="change-annotation-arrow">→</span>
                <span className="change-annotation-label">{a.label}</span>
              </div>
            ))}
          </div>
        )}

        {changedNextNodes.size > 0 && (
          <div className="change-annotation" style={{ color: '#a78bfa', borderColor: '#a78bfa44', background: '#a78bfa15' }}>
            <span className="change-annotation-arrow">↪</span>
            <span className="change-annotation-label">
              NEXT pointer changed on node(s): [{[...changedNextNodes].join(', ')}]
            </span>
          </div>
        )}

        <svg width={Math.max(totalW, 400)} height={svgH} className="ll-svg">
          {chain.map((node, i) => {
            const x = 40 + i * (NODE_W + ARROW_W);
            const y = (svgH - NODE_H) / 2;
            const color = getNodeColor(node.idx);
            const isNull = node.isCycle;

            return (
              <g key={i}>
                {/* Arrow from previous */}
                {i > 0 && (
                  <g>
                    <line
                      x1={x - ARROW_W + 4}
                      y1={svgH / 2}
                      x2={x - 6}
                      y2={svgH / 2}
                      stroke="#2a2d3e"
                      strokeWidth={2}
                    />
                    <polygon
                      points={`${x - 6},${svgH / 2 - 4} ${x + 2},${svgH / 2} ${x - 6},${svgH / 2 + 4}`}
                      fill="#2a2d3e"
                    />
                  </g>
                )}

                {/* Node box */}
                <rect
                  x={x} y={y} width={NODE_W} height={NODE_H}
                  rx={8} ry={8}
                  fill={color}
                  stroke={color === COLORS.default ? '#2a2d3e' : color}
                  strokeWidth={2}
                  style={{ filter: color !== COLORS.default ? `drop-shadow(0 0 8px ${color})` : 'none' }}
                />

                {/* Divider (val | next) */}
                <line
                  x1={x + NODE_W * 0.65} y1={y + 4}
                  x2={x + NODE_W * 0.65} y2={y + NODE_H - 4}
                  stroke={color === COLORS.default ? '#2a2d3e' : `${color}88`}
                  strokeWidth={1}
                />

                {/* Value */}
                <text
                  x={x + NODE_W * 0.32} y={svgH / 2}
                  textAnchor="middle" dominantBaseline="central"
                  fill="#f0f0ff" fontSize={13} fontWeight={700}
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {String(node.val)}
                </text>

                {/* Next pointer label */}
                <text
                  x={x + NODE_W * 0.82} y={svgH / 2}
                  textAnchor="middle" dominantBaseline="central"
                  fill="#5a5f7a" fontSize={9}
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {node.next === -1 || node.next === null ? 'NULL' : `→${node.next}`}
                </text>

                {/* Index label below */}
                <text
                  x={x + NODE_W / 2} y={y + NODE_H + 14}
                  textAnchor="middle" fill="#5a5f7a" fontSize={10}
                  fontFamily="'JetBrains Mono', monospace"
                >
                  [{node.idx}]
                </text>

                {/* Pointer badges above */}
                {node.idx === head && (
                  <text x={x + NODE_W / 2} y={y - 10} textAnchor="middle"
                    fill={COLORS.head} fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono', monospace">
                    HEAD
                  </text>
                )}
                {node.idx === current && current !== null && (
                  <text x={x + NODE_W / 2} y={y - (node.idx === head ? 22 : 10)} textAnchor="middle"
                    fill={COLORS.current} fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono', monospace">
                    CURR
                  </text>
                )}
                {node.idx === slow && slow !== null && (
                  <text x={x + NODE_W / 2} y={y - 24} textAnchor="middle"
                    fill={COLORS.slow} fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono', monospace">
                    SLOW
                  </text>
                )}
                {node.idx === fast && fast !== null && (
                  <text x={x + NODE_W / 2} y={y - (slow === fast ? 36 : 24)} textAnchor="middle"
                    fill={COLORS.fast} fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono', monospace">
                    FAST
                  </text>
                )}

                {/* NULL terminator */}
                {(node.next === -1 || node.next === null) && !isNull && (
                  <g>
                    <line
                      x1={x + NODE_W} y1={svgH / 2}
                      x2={x + NODE_W + 30} y2={svgH / 2}
                      stroke="#2a2d3e" strokeWidth={2}
                    />
                    <text
                      x={x + NODE_W + 38} y={svgH / 2}
                      textAnchor="start" dominantBaseline="central"
                      fill="#5a5f7a" fontSize={11}
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      NULL
                    </text>
                  </g>
                )}

                {isNull && (
                  <text x={x + NODE_W / 2} y={y + NODE_H / 2}
                    textAnchor="middle" dominantBaseline="central"
                    fill="#ff4757" fontSize={10} fontFamily="'JetBrains Mono', monospace">
                    ↩ CYCLE
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="ll-legend">
          <span style={{ color: COLORS.head }}>■ HEAD</span>
          <span style={{ color: COLORS.current }}>■ CURRENT</span>
          <span style={{ color: COLORS.slow }}>■ SLOW</span>
          <span style={{ color: COLORS.fast }}>■ FAST</span>
        </div>
      </div>

      {sideVars.length > 0 && (
        <div className="ds-side-panel">
          <div className="ds-side-title">Variables</div>
          {sideVars.map(([k, v]) => (
            <div key={k} className="ds-var-row">
              <span className="ds-var-name">{k}</span>
              <span className="ds-var-eq">=</span>
              <span className="ds-var-val">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

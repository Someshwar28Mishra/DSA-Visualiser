/**
 * TreeViz.jsx — Classic binary tree with vibrant depth-level colors.
 *
 * Layout: identical to the reference image (root at top, children spread below,
 *         straight lines, circular nodes, proper Reingold-Tilford positioning).
 *
 * Colors: each depth level gets its own vivid color from a curated palette,
 *         matching the dark-mode DSA Visualiser theme.
 *
 * State highlights:
 *   • Current node  → bright white fill + pulse glow
 *   • In Result     → gold/yellow (already visited in traversal)
 *   • In Stack/Queue→ hot-pink outline badge
 */
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// ── Layout ───────────────────────────────────────────────────────────────────
const NODE_R  = 26;
const V_GAP   = 85;
const MARGIN  = { top: 60, right: 60, bottom: 70, left: 60 };

// ── Per-level depth colors (fill, stroke, text) ──────────────────────────────
// 8 colors that cycle if tree is deeper than 8 levels
const DEPTH_PALETTE = [
  { fill: '#7c3aed', stroke: '#5b21b6', text: '#ede9fe' },  // L0 – deep violet
  { fill: '#2563eb', stroke: '#1d4ed8', text: '#dbeafe' },  // L1 – royal blue
  { fill: '#0891b2', stroke: '#0e7490', text: '#cffafe' },  // L2 – cyan
  { fill: '#059669', stroke: '#047857', text: '#d1fae5' },  // L3 – emerald
  { fill: '#d97706', stroke: '#b45309', text: '#fef3c7' },  // L4 – amber
  { fill: '#dc2626', stroke: '#b91c1c', text: '#fee2e2' },  // L5 – red
  { fill: '#db2777', stroke: '#be185d', text: '#fce7f3' },  // L6 – pink
  { fill: '#7c3aed', stroke: '#5b21b6', text: '#ede9fe' },  // L7 – loops back
];

function depthPalette(depth) {
  return DEPTH_PALETTE[depth % DEPTH_PALETTE.length];
}

// ── Special-state colors ─────────────────────────────────────────────────────
const CURRENT = { fill: '#ffffff', stroke: '#6c63ff', text: '#6c63ff' };
const RESULT  = { fill: '#fbbf24', stroke: '#d97706', text: '#1c1400' };
const STACK   = { fill: '#f472b6', stroke: '#db2777', text: '#fff' };

// ── Edge colors match child node's fill ──────────────────────────────────────
function edgeColor(targetDepth, targetId, currentStr, resultSet, stackSet, queueSet) {
  if (targetId === currentStr)                         return CURRENT.stroke;
  if (resultSet.has(targetId))                          return RESULT.stroke;
  if (stackSet.has(targetId) || queueSet.has(targetId)) return STACK.stroke;
  return depthPalette(targetDepth).stroke;
}

// ── Build hierarchy with phantom slots for correct L/R positioning ───────────
function buildHierarchy(treeDict, rootId) {
  const visited = new Set();

  function build(nodeId) {
    if (nodeId === null || nodeId === undefined) return null;
    const key = String(nodeId);
    const dictKey = (key in treeDict) ? key : nodeId;
    if (!(dictKey in treeDict)) return null;
    if (visited.has(key)) return null;
    visited.add(key);

    const raw = treeDict[dictKey];
    const [left, right] = Array.isArray(raw) ? raw : [null, null];

    const lNode = build(left);
    const rNode = build(right);

    const children = [];
    if (lNode || rNode) {
      children.push(lNode ?? { id: `_ph_L_${key}`, _phantom: true });
      children.push(rNode ?? { id: `_ph_R_${key}`, _phantom: true });
    }

    return { id: key, _phantom: false, children: children.length ? children : undefined };
  }

  return build(rootId);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TreeViz({ snapshot }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!snapshot || !wrapRef.current) return;
    const { variables } = snapshot;

    // Find tree variable
    const treeEntry = Object.entries(variables || {}).find(([, v]) =>
      v && typeof v === 'object' && !Array.isArray(v) &&
      Object.keys(v).length > 0 &&
      Object.values(v).every(x => Array.isArray(x) && x.length === 2)
    );
    if (!treeEntry) return;

    const [, treeDict] = treeEntry;
    const rootRaw = variables?.root ?? variables?.current ?? Object.keys(treeDict)[0];
    const rootKey = String(rootRaw);

    const hierarchyData = buildHierarchy(treeDict, rootKey);
    if (!hierarchyData) return;

    // State sets
    const resultSet  = new Set((variables?.result || []).map(String));
    const stackSet   = new Set((variables?.stack  || []).map(String));
    const queueSet   = new Set((variables?.queue  || []).map(String));
    const currentStr = String(variables?.node ?? variables?.current ?? '');

    // Container dimensions
    const container = wrapRef.current;
    const CW = container.clientWidth  || 800;
    const CH = container.clientHeight || 520;

    d3.select(container).selectAll('*').remove();

    // D3 layout
    const root = d3.hierarchy(hierarchyData);
    const treeDepth = root.height;
    const leafCount = root.leaves().length;

    const treeW = Math.max(CW  - MARGIN.left - MARGIN.right,  leafCount * NODE_R * 2.8);
    const treeH = Math.max(CH  - MARGIN.top  - MARGIN.bottom, treeDepth * V_GAP  + V_GAP * 0.5);

    d3.tree()
      .size([treeW, treeH])
      .separation((a, b) => {
        if (a.data._phantom || b.data._phantom) return 0.9;
        return a.parent === b.parent ? 1.5 : 2.2;
      })(root);

    const svgW = treeW + MARGIN.left + MARGIN.right;
    const svgH = treeH  + MARGIN.top  + MARGIN.bottom + (resultSet.size > 0 ? 48 : 0);

    // SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width',  svgW)
      .attr('height', svgH)
      .style('font-family', "'Inter', sans-serif");

    // ── Gradient defs for each edge ───────────────────────────────────────
    const defs = svg.append('defs');

    // Subtle dot-grid background
    const pat = defs.append('pattern')
      .attr('id', 'tv-dots').attr('width', 28).attr('height', 28)
      .attr('patternUnits', 'userSpaceOnUse');
    pat.append('circle').attr('cx', 14).attr('cy', 14).attr('r', 1)
       .attr('fill', '#252836');
    svg.append('rect').attr('width', svgW).attr('height', svgH)
       .attr('fill', 'url(#tv-dots)');

    const g = svg.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Real nodes only
    const realNodes = root.descendants().filter(d => !d.data._phantom);
    const realLinks = root.links().filter(l => !l.target.data._phantom);

    // ── Level depth dashed guides & labels ────────────────────────────────
    const depthYMap = new Map();
    realNodes.forEach(d => { if (!depthYMap.has(d.depth)) depthYMap.set(d.depth, d.y); });

    depthYMap.forEach((y, depth) => {
      const { fill } = depthPalette(depth);
      // Dashed horizontal guide
      g.append('line')
        .attr('x1', -MARGIN.left + 30).attr('y1', y)
        .attr('x2', treeW + 8).attr('y2', y)
        .attr('stroke', fill)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,8')
        .attr('opacity', 0.2);

      // Level pill
      const pillG = g.append('g').attr('transform', `translate(${-MARGIN.left + 6}, ${y})`);
      pillG.append('rect')
        .attr('x', 0).attr('y', -11).attr('width', 24).attr('height', 22).attr('rx', 6)
        .attr('fill', fill).attr('opacity', 0.18);
      pillG.append('text')
        .attr('x', 12).attr('y', 0)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
        .style('font-size', '9px').style('font-weight', '800')
        .style('fill', fill)
        .text(`L${depth}`);
    });

    // ── Edges ─────────────────────────────────────────────────────────────
    realLinks.forEach((link, idx) => {
      const tid   = link.target.data.id;
      const tDepth = link.target.depth;
      const eColor = edgeColor(tDepth, tid, currentStr, resultSet, stackSet, queueSet);

      // gradient per edge
      const gid = `eg${idx}`;
      const lg = defs.append('linearGradient')
        .attr('id', gid).attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', link.source.x).attr('y1', link.source.y)
        .attr('x2', link.target.x).attr('y2', link.target.y);
      lg.append('stop').attr('offset', '0%')
        .attr('stop-color', depthPalette(link.source.depth).stroke).attr('stop-opacity', 0.6);
      lg.append('stop').attr('offset', '100%')
        .attr('stop-color', eColor).attr('stop-opacity', 1);

      const isActive  = link.source.data.id === currentStr || tid === currentStr;
      const isResult  = resultSet.has(link.source.data.id) && resultSet.has(tid);

      g.append('line')
        .attr('x1', link.source.x).attr('y1', link.source.y)
        .attr('x2', link.target.x).attr('y2', link.target.y)
        .attr('stroke', isActive ? CURRENT.stroke : `url(#${gid})`)
        .attr('stroke-width', isActive ? 3.5 : isResult ? 3 : 2.5)
        .attr('stroke-opacity', isActive ? 1 : 0.7)
        .style('filter', isActive ? `drop-shadow(0 0 4px ${CURRENT.stroke})` : 'none');
    });

    // ── Nodes ─────────────────────────────────────────────────────────────
    const nodeG = g.selectAll('.tv-node')
      .data(realNodes)
      .join('g')
      .attr('class', 'tv-node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    // Outer animated pulse ring for current node
    nodeG.append('circle')
      .attr('r', NODE_R + 9)
      .attr('fill', 'none')
      .attr('stroke', d => {
        const id = d.data.id;
        if (id === currentStr) return CURRENT.stroke;
        if (resultSet.has(id)) return RESULT.stroke;
        if (stackSet.has(id) || queueSet.has(id)) return STACK.stroke;
        return 'none';
      })
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', d => (d.data.id === currentStr) ? '4,3' : 'none');

    // Shadow ring — gives nodes depth
    nodeG.append('circle')
      .attr('r', NODE_R + 2)
      .attr('fill', d => {
        const { stroke } = getNodeColors(d, currentStr, resultSet, stackSet, queueSet);
        return stroke + '55';
      });

    // Main circle
    nodeG.append('circle')
      .attr('r', NODE_R)
      .attr('fill', d => getNodeColors(d, currentStr, resultSet, stackSet, queueSet).fill)
      .attr('stroke', d => getNodeColors(d, currentStr, resultSet, stackSet, queueSet).stroke)
      .attr('stroke-width', 3)
      .style('filter', d => {
        const id = d.data.id;
        const { stroke } = getNodeColors(d, currentStr, resultSet, stackSet, queueSet);
        if (id === currentStr) return `drop-shadow(0 0 12px ${stroke})`;
        return `drop-shadow(0 3px 6px rgba(0,0,0,0.5))`;
      });

    // Value label
    nodeG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', d => String(d.data.id).length <= 2 ? '13px' : '10px')
      .style('font-weight', '800')
      .style('fill', d => getNodeColors(d, currentStr, resultSet, stackSet, queueSet).text)
      .style('pointer-events', 'none')
      .text(d => d.data.id);

    // ── Traversal result strip ────────────────────────────────────────────
    if (resultSet.size > 0) {
      const resultArr = variables?.result || [];
      const stripY = treeH + 36;
      const stripG = g.append('g').attr('transform', `translate(0,${stripY})`);

      // Label
      stripG.append('text')
        .attr('x', 0).attr('y', 0)
        .attr('dominant-baseline', 'central')
        .style('font-size', '11px').style('font-weight', '700')
        .style('fill', '#a0a3b8')
        .text('Traversal:');

      // Nodes with arrows
      resultArr.slice(0, 18).forEach((val, i) => {
        const cx = 95 + i * 42;
        const pal = DEPTH_PALETTE[i % DEPTH_PALETTE.length];
        stripG.append('circle')
          .attr('cx', cx).attr('cy', 0).attr('r', 15)
          .attr('fill', pal.fill).attr('stroke', pal.stroke).attr('stroke-width', 2);
        stripG.append('text')
          .attr('x', cx).attr('y', 0)
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
          .style('font-family', "'JetBrains Mono', monospace")
          .style('font-size', '11px').style('font-weight', '800')
          .style('fill', pal.text)
          .text(String(val));
        if (i < resultArr.length - 1) {
          stripG.append('text')
            .attr('x', cx + 26).attr('y', 0)
            .attr('dominant-baseline', 'central')
            .style('font-size', '14px').style('fill', '#4a4f6a')
            .text('›');
        }
      });
    }

    // ── Legend ────────────────────────────────────────────────────────────
    const legItems = [
      { fill: DEPTH_PALETTE[0].fill, stroke: DEPTH_PALETTE[0].stroke, label: 'Node (by level)' },
      { fill: CURRENT.fill,          stroke: CURRENT.stroke,          label: 'Current' },
      { fill: RESULT.fill,           stroke: RESULT.stroke,           label: 'In Result' },
      { fill: STACK.fill,            stroke: STACK.stroke,            label: 'Stack / Queue' },
    ];

    const legG = g.append('g').attr('transform', `translate(${treeW - 145}, ${-46})`);
    legItems.forEach(({ fill, stroke, label }, i) => {
      const row = legG.append('g').attr('transform', `translate(0, ${i * 20})`);
      row.append('circle').attr('cx', 8).attr('cy', 0).attr('r', 7)
        .attr('fill', fill).attr('stroke', stroke).attr('stroke-width', 2);
      row.append('text').attr('x', 20).attr('y', 0)
        .attr('dominant-baseline', 'central')
        .style('font-size', '10px').style('fill', '#8a8fb8')
        .text(label);
    });

  }, [snapshot]);

  return (
    <div
      ref={wrapRef}
      className="tree-viz"
      style={{ width: '100%', height: '100%', minHeight: 480, overflow: 'auto' }}
    />
  );
}

// ── Helper: get fill/stroke/text for a node based on its state ────────────────
function getNodeColors(d, currentStr, resultSet, stackSet, queueSet) {
  const id = d.data.id;
  if (id === currentStr)                    return CURRENT;
  if (resultSet.has(id))                     return RESULT;
  if (stackSet.has(id) || queueSet.has(id))  return STACK;
  return {
    fill:   depthPalette(d.depth).fill,
    stroke: depthPalette(d.depth).stroke,
    text:   depthPalette(d.depth).text,
  };
}

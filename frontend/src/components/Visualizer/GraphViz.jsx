/**
 * GraphViz.jsx — Premium graph visualizer with colorful arrows.
 *
 * Features:
 *  • Colorful gradient arrows on directed edges
 *  • Animated glowing active-edge highlight (currently explored)
 *  • Visited path edges rendered in cyan
 *  • Weight labels on weighted graphs (Dijkstra, etc.)
 *  • Node states: default / queued / visited / current
 *  • Shortest-path dist table (when dist variable present)
 *  • Draggable D3 force simulation
 */
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const R = 24; // node radius

// ── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg:            '#1c1f28',
  border:        '#2a2d3e',
  visited:       '#00d4ff',
  current:       '#6c63ff',
  queued:        '#ff9f43',
  inStack:       '#ff6b9d',
  text:          '#f0f0ff',
  edgeDefault:   '#3a3d52',
  edgeVisited:   '#00d4ff',
  edgeActive:    '#ff9f43',
  edgeRelaxed:   '#00f5a0',
};

// Arrow marker IDs
const MARKERS = {
  default:  'arrow-default',
  visited:  'arrow-visited',
  active:   'arrow-active',
  relaxed:  'arrow-relaxed',
};

// ── Helper: build graph from variables ──────────────────────────────────────
function buildGraph(variables) {
  // Look for adjacency list: dict whose values are lists
  const entry = Object.entries(variables).find(
    ([, v]) => v && typeof v === 'object' && !Array.isArray(v) &&
               Object.values(v).every(x => Array.isArray(x))
  );
  if (!entry) return null;

  const [graphName, adj] = entry;
  const nodeIds = Object.keys(adj);
  const nodes = nodeIds.map(id => ({ id: String(id) }));
  const links = [];
  const seen = new Set();
  let weighted = false;

  for (const [src, neighbors] of Object.entries(adj)) {
    for (const dst of neighbors) {
      let to, weight = null;
      // Weighted: neighbor is [node, weight] tuple
      if (Array.isArray(dst) && dst.length === 2 && typeof dst[1] === 'number') {
        [to, weight] = dst;
        weighted = true;
      } else {
        to = dst;
      }
      const key = `${src}->${to}`;
      if (!seen.has(key)) {
        seen.add(key);
        links.push({ source: String(src), target: String(to), weight });
      }
    }
  }
  return { nodes, links, weighted, graphName };
}

// ── Helper: build shortest-path tree edges from dist + prev variables ───────
function getRelaxedEdges(variables) {
  // prev/parent map: node -> previous node on shortest path
  const prev = variables?.prev || variables?.parent || {};
  const edges = new Set();
  for (const [to, from] of Object.entries(prev)) {
    if (from !== null && from !== undefined && String(from) !== 'None') {
      edges.add(`${from}->${to}`);
    }
  }
  return edges;
}

// ── Define arrow markers inside <defs> ──────────────────────────────────────
function defineMarkers(defs) {
  const markerDefs = [
    { id: MARKERS.default, color: C.edgeDefault },
    { id: MARKERS.visited, color: C.edgeVisited },
    { id: MARKERS.active,  color: C.edgeActive  },
    { id: MARKERS.relaxed, color: C.edgeRelaxed },
  ];

  markerDefs.forEach(({ id, color }) => {
    defs.append('marker')
      .attr('id', id)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', R + 10)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', color);
  });

  // Gradient defs for active edge glow
  const grad = defs.append('linearGradient')
    .attr('id', 'edge-active-grad')
    .attr('gradientUnits', 'userSpaceOnUse');
  grad.append('stop').attr('offset', '0%').attr('stop-color', '#ff9f43');
  grad.append('stop').attr('offset', '100%').attr('stop-color', '#ff6b9d');

  const gradRelaxed = defs.append('linearGradient')
    .attr('id', 'edge-relaxed-grad')
    .attr('gradientUnits', 'userSpaceOnUse');
  gradRelaxed.append('stop').attr('offset', '0%').attr('stop-color', '#00f5a0');
  gradRelaxed.append('stop').attr('offset', '100%').attr('stop-color', '#00d4ff');
}

// ── Main component ───────────────────────────────────────────────────────────
export default function GraphViz({ snapshot }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!snapshot || !svgRef.current) return;
    const { variables, active_edge: activeEdge } = snapshot;
    const graphData = buildGraph(variables || {});
    if (!graphData) return;

    const { nodes, weighted } = graphData;
    const nodeIdSet = new Set(nodes.map(n => n.id));
    const links = graphData.links.filter(
      l => nodeIdSet.has(l.source) && nodeIdSet.has(l.target) &&
           l.source !== 'null' && l.target !== 'null'
    );

    // Node states
    const visited  = new Set((variables?.visited  || []).map(String));
    const queue    = new Set((variables?.queue    || []).map(String));
    const stack    = new Set((variables?.stack    || []).map(String));
    const currentN = String(variables?.node ?? variables?.current ?? '');

    // Edge states
    const relaxedEdges = getRelaxedEdges(variables);
    const activeEdgeKey = activeEdge ? `${activeEdge[0]}->${activeEdge[1]}` : null;

    // Visited edge: both endpoints visited
    const visitedEdgeKey = new Set();
    for (const l of links) {
      if (visited.has(String(l.source)) && visited.has(String(l.target))) {
        visitedEdgeKey.add(`${l.source}->${l.target}`);
      }
    }

    const container = svgRef.current;
    const W = container.clientWidth  || 700;
    const H = container.clientHeight || 500;

    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', W)
      .attr('height', H)
      .style('overflow', 'visible');

    const defs = svg.append('defs');
    defineMarkers(defs);

    // ── Force simulation ─────────────────────────────────────────────────
    const sim = d3.forceSimulation(nodes)
      .force('link',      d3.forceLink(links).id(d => d.id).distance(110))
      .force('charge',    d3.forceManyBody().strength(-350))
      .force('center',    d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(R + 14));

    // ── Edges ────────────────────────────────────────────────────────────
    const edgeG = svg.append('g').attr('class', 'edges');

    const edgeLine = edgeG.selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => {
        const key = `${d.source?.id ?? d.source}->${d.target?.id ?? d.target}`;
        if (key === activeEdgeKey) return 4;
        if (relaxedEdges.has(key))  return 3;
        if (visitedEdgeKey.has(key)) return 2.5;
        return 1.8;
      })
      .attr('stroke', d => {
        const key = `${d.source?.id ?? d.source}->${d.target?.id ?? d.target}`;
        if (key === activeEdgeKey)    return C.edgeActive;
        if (relaxedEdges.has(key))    return C.edgeRelaxed;
        if (visitedEdgeKey.has(key))  return C.edgeVisited;
        return C.edgeDefault;
      })
      .attr('stroke-opacity', d => {
        const key = `${d.source?.id ?? d.source}->${d.target?.id ?? d.target}`;
        if (key === activeEdgeKey) return 1;
        if (relaxedEdges.has(key)) return 0.9;
        return 0.6;
      })
      .attr('marker-end', d => {
        const key = `${d.source?.id ?? d.source}->${d.target?.id ?? d.target}`;
        if (key === activeEdgeKey)   return `url(#${MARKERS.active})`;
        if (relaxedEdges.has(key))   return `url(#${MARKERS.relaxed})`;
        if (visitedEdgeKey.has(key)) return `url(#${MARKERS.visited})`;
        return `url(#${MARKERS.default})`;
      })
      .style('filter', d => {
        const key = `${d.source?.id ?? d.source}->${d.target?.id ?? d.target}`;
        if (key === activeEdgeKey)   return 'drop-shadow(0 0 6px #ff9f43)';
        if (relaxedEdges.has(key))   return 'drop-shadow(0 0 4px #00f5a0)';
        if (visitedEdgeKey.has(key)) return 'drop-shadow(0 0 3px #00d4ff)';
        return 'none';
      });

    // ── Edge weight labels ────────────────────────────────────────────────
    const weightLabels = edgeG.selectAll('text.edge-wt')
      .data(links.filter(l => l.weight !== null && l.weight !== undefined))
      .join('text')
      .attr('class', 'edge-wt')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', d => {
        const key = `${d.source?.id ?? d.source}->${d.target?.id ?? d.target}`;
        if (key === activeEdgeKey)   return C.edgeActive;
        if (relaxedEdges.has(key))   return C.edgeRelaxed;
        if (visitedEdgeKey.has(key)) return C.edgeVisited;
        return '#6a6f8a';
      })
      .style('pointer-events', 'none')
      .style('paint-order', 'stroke')
      .style('stroke', '#0a0b0f')
      .style('stroke-width', '3px')
      .text(d => d.weight);

    // ── Nodes ────────────────────────────────────────────────────────────
    const nodeG = svg.append('g').attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(
        d3.drag()
          .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
          .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    // Node outer glow ring
    nodeG.append('circle')
      .attr('r', R + 6)
      .attr('fill', 'none')
      .attr('stroke', d => {
        const id = d.id;
        if (id === currentN)      return C.current;
        if (visited.has(id))      return C.visited;
        if (queue.has(id))        return C.queued;
        if (stack.has(id))        return C.inStack;
        return 'transparent';
      })
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.4);

    // Node main circle
    nodeG.append('circle')
      .attr('r', R)
      .attr('fill', d => {
        const id = d.id;
        if (id === currentN)   return C.current;
        if (visited.has(id))   return C.visited + '33';
        if (queue.has(id))     return C.queued + '33';
        if (stack.has(id))     return C.inStack + '33';
        return C.bg;
      })
      .attr('stroke', d => {
        const id = d.id;
        if (id === currentN)   return C.current;
        if (visited.has(id))   return C.visited;
        if (queue.has(id))     return C.queued;
        if (stack.has(id))     return C.inStack;
        return C.border;
      })
      .attr('stroke-width', 2.5)
      .style('filter', d => {
        const id = d.id;
        if (id === currentN)   return `drop-shadow(0 0 10px ${C.current})`;
        if (visited.has(id))   return `drop-shadow(0 0 7px ${C.visited})`;
        if (queue.has(id))     return `drop-shadow(0 0 6px ${C.queued})`;
        return 'none';
      });

    // Node label
    nodeG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-family', "'JetBrains Mono', monospace")
      .style('font-size', '13px')
      .style('font-weight', '700')
      .style('fill', d => {
        const id = d.id;
        if (id === currentN)   return '#fff';
        if (visited.has(id))   return C.visited;
        return C.text;
      })
      .style('pointer-events', 'none')
      .text(d => d.id);

    // ── Dist labels below node (Dijkstra etc.) ───────────────────────────
    const distMap = variables?.dist;
    if (distMap && typeof distMap === 'object' && !Array.isArray(distMap)) {
      nodeG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', R + 14)
        .style('font-family', "'JetBrains Mono', monospace")
        .style('font-size', '10px')
        .style('font-weight', '600')
        .style('fill', d => {
          const v = distMap[d.id];
          if (v === 'Infinity' || v === undefined) return '#5a5f7a';
          return '#00f5a0';
        })
        .style('pointer-events', 'none')
        .text(d => {
          const v = distMap[d.id];
          if (v === 'Infinity' || v === undefined) return '∞';
          return String(v);
        });
    }

    // ── Legend ────────────────────────────────────────────────────────────
    const legend = svg.append('g')
      .attr('transform', `translate(12, ${H - 110})`);

    const legendItems = [
      { color: C.current,   label: 'Current' },
      { color: C.visited,   label: 'Visited' },
      { color: C.queued,    label: 'In Queue' },
      { color: C.edgeActive,  label: 'Active Edge' },
      { color: C.edgeRelaxed, label: 'Shortest Path' },
    ];

    legendItems.forEach(({ color, label }, i) => {
      const row = legend.append('g').attr('transform', `translate(0, ${i * 18})`);
      row.append('circle').attr('r', 5).attr('cx', 5).attr('cy', 0).attr('fill', color).attr('opacity', 0.85);
      row.append('text')
        .attr('x', 14).attr('y', 0)
        .attr('dominant-baseline', 'central')
        .style('font-family', "'Inter', sans-serif")
        .style('font-size', '10px')
        .style('fill', '#a0a3b8')
        .text(label);
    });

    // ── Active edge annotation ────────────────────────────────────────────
    if (activeEdge) {
      const annG = svg.append('g').attr('transform', `translate(${W - 240}, 12)`);
      annG.append('rect')
        .attr('width', 226).attr('height', 32).attr('rx', 8)
        .attr('fill', '#ff9f4318').attr('stroke', '#ff9f4344').attr('stroke-width', 1);
      annG.append('text')
        .attr('x', 12).attr('y', 16)
        .attr('dominant-baseline', 'central')
        .style('font-family', "'JetBrains Mono', monospace")
        .style('font-size', '11px').style('font-weight', '700')
        .style('fill', C.edgeActive)
        .text(`→ Exploring: ${activeEdge[0]} → ${activeEdge[1]}`);
    }

    // ── Simulation tick ───────────────────────────────────────────────────
    sim.on('tick', () => {
      edgeLine
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);

      weightLabels
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2 - 7);

      nodeG.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [snapshot]);

  return (
    <div ref={svgRef} className="graph-viz" style={{ width: '100%', height: '100%', minHeight: 400 }} />
  );
}

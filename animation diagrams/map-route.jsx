// map-route.jsx
// Procedural city-like street network with an animated shortest-path search.
// Phase 1 (search): Dijkstra explores outward from the start node, lighting up
//                    edges in the order they are reached.
// Phase 2 (path):    The found path is drawn from start to end.
// Phase 3 (pause):   Final state held for a moment.
// The cycle loops indefinitely when `loop` is on.

const { useEffect: mrUseEffect, useRef: mrUseRef, useState: mrUseState, useMemo: mrUseMemo } = React;

// ─── RNG (mulberry32) ───────────────────────────────────────────────────────
function mrRng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Network generation ─────────────────────────────────────────────────────
// Returns { nodes, edges, adj, startNode, endNode }. Endpoints are picked
// deterministically from N so different seeds give different street layouts
// while the two visible dots stay roughly in the same spots.
function mrGenerateNetwork({ density, seed, width, height, edgeRemovalRate = 0.22, perturbation = 0.55 }) {
  const N = Math.max(6, Math.min(40, parseInt(density, 10) || 20));
  const rng = mrRng((parseInt(seed, 10) || 1) * 9337 + N);

  const nodes = new Array(N * N);
  const cellW = width / Math.max(1, N - 1);
  const cellH = height / Math.max(1, N - 1);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const baseX = j * cellW;
      const baseY = i * cellH;
      const dx = (rng() - 0.5) * cellW * perturbation;
      const dy = (rng() - 0.5) * cellH * perturbation;
      nodes[i * N + j] = { id: i * N + j, x: baseX + dx, y: baseY + dy, row: i, col: j };
    }
  }

  // 4-neighbour edges, then drop a fraction so the network feels organic.
  const allEdges = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const idx = i * N + j;
      if (j < N - 1) allEdges.push([idx, idx + 1]);
      if (i < N - 1) allEdges.push([idx, idx + N]);
    }
  }
  // Edges incident to the endpoints are always kept so the graph is connected
  // around the dots.
  const startId = Math.floor(N * 0.30) * N + Math.floor(N * 0.40);
  const endId   = Math.floor(N * 0.70) * N + Math.floor(N * 0.55);
  const edges = allEdges.filter(([a, b]) => {
    if (a === startId || b === startId || a === endId || b === endId) return true;
    return rng() > edgeRemovalRate;
  });

  const adj = nodes.map(() => []);
  for (const [a, b] of edges) {
    const w = Math.hypot(nodes[b].x - nodes[a].x, nodes[b].y - nodes[a].y);
    adj[a].push({ to: b, w });
    adj[b].push({ to: a, w });
  }
  return { nodes, edges, adj, startNode: startId, endNode: endId };
}

// ─── Dijkstra (O(n²); fine for ≤ ~1500 nodes) ───────────────────────────────
function mrDijkstra(adj, source) {
  const n = adj.length;
  const dist = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);
  dist[source] = 0;
  for (let k = 0; k < n; k++) {
    let u = -1, ud = Infinity;
    for (let v = 0; v < n; v++) {
      if (!visited[v] && dist[v] < ud) { ud = dist[v]; u = v; }
    }
    if (u === -1) break;
    visited[u] = true;
    const neigh = adj[u];
    for (let i = 0; i < neigh.length; i++) {
      const { to, w } = neigh[i];
      if (visited[to]) continue;
      const nd = ud + w;
      if (nd < dist[to]) { dist[to] = nd; prev[to] = u; }
    }
  }
  return { dist, prev };
}

function mrReconstructPath(prev, target) {
  const out = [];
  let u = target;
  let guard = 0;
  while (u !== -1 && guard++ < prev.length + 1) { out.unshift(u); u = prev[u]; }
  return out;
}

// ─── Shape clip-path map ────────────────────────────────────────────────────
const MR_SHAPE_CLIPS = {
  square:   'none',
  circle:   'circle(50% at 50% 50%)',
  ellipse:  'ellipse(50% 35% at 50% 50%)',
  triangle: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  hexagon:  'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  diamond:  'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  octagon:  'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
};

// ─── Component ──────────────────────────────────────────────────────────────
function MapRouteDiagram({
  networkColor   = '#7a3d10',
  searchColor    = '#ffb066',
  routeColor     = '#ffffff',
  nodeColor      = '#ffffff',
  searchDuration = 3500,
  pathDuration   = 1200,
  pauseDuration  = 800,
  density        = 24,
  seed           = 1,
  loop           = true,
  shape          = 'square',
  rotateX        = 0,
  rotateY        = 0,
}) {
  // Virtual viewBox; SVG scales to the actual cell size via preserveAspectRatio.
  const VW = 600, VH = 600;

  const network = mrUseMemo(
    () => mrGenerateNetwork({ density, seed, width: VW, height: VH }),
    [density, seed]
  );
  const { nodes, edges, adj, startNode, endNode } = network;

  const { dist, prev } = mrUseMemo(() => mrDijkstra(adj, startNode), [adj, startNode]);

  const maxDist = mrUseMemo(() => {
    let m = 0;
    for (let i = 0; i < dist.length; i++) {
      const d = dist[i];
      if (Number.isFinite(d) && d > m) m = d;
    }
    return m || 1;
  }, [dist]);

  const path = mrUseMemo(() => mrReconstructPath(prev, endNode), [prev, endNode]);

  // Pre-build base network as a single SVG path string.
  const networkD = mrUseMemo(() => {
    let s = '';
    for (let i = 0; i < edges.length; i++) {
      const a = nodes[edges[i][0]], b = nodes[edges[i][1]];
      s += `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    return s;
  }, [edges, nodes]);

  // Pre-sort edges by the time (= max distance of either endpoint) at which
  // they become "reached" by Dijkstra. The search animation walks this list.
  const edgeSegments = mrUseMemo(() => {
    const arr = new Array(edges.length);
    for (let i = 0; i < edges.length; i++) {
      const a = edges[i][0], b = edges[i][1];
      const ta = dist[a], tb = dist[b];
      const t = Math.max(Number.isFinite(ta) ? ta : Infinity, Number.isFinite(tb) ? tb : Infinity);
      const na = nodes[a], nb = nodes[b];
      arr[i] = { t, s: `M${na.x.toFixed(1)} ${na.y.toFixed(1)}L${nb.x.toFixed(1)} ${nb.y.toFixed(1)}` };
    }
    arr.sort((x, y) => x.t - y.t);
    return arr;
  }, [edges, dist, nodes]);

  const pathD = mrUseMemo(() => {
    if (!path || path.length < 2) return '';
    let s = `M${nodes[path[0]].x.toFixed(1)} ${nodes[path[0]].y.toFixed(1)}`;
    for (let i = 1; i < path.length; i++) {
      const n = nodes[path[i]];
      s += `L${n.x.toFixed(1)} ${n.y.toFixed(1)}`;
    }
    return s;
  }, [path, nodes]);

  const pathLength = mrUseMemo(() => {
    let len = 0;
    for (let i = 1; i < path.length; i++) {
      const a = nodes[path[i - 1]], b = nodes[path[i]];
      len += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return len || 1;
  }, [path, nodes]);

  // Animation state
  const [tick, setTick] = mrUseState({ phase: 'search', t: 0 });

  mrUseEffect(() => {
    let raf;
    let start = null;
    const sd = Math.max(0, parseInt(searchDuration, 10) || 0);
    const pd = Math.max(0, parseInt(pathDuration,   10) || 0);
    const ps = Math.max(0, parseInt(pauseDuration,  10) || 0);
    const total = Math.max(1, sd + pd + ps);

    const step = (now) => {
      if (start === null) start = now;
      let elapsed = now - start;
      if (loop) elapsed = ((elapsed % total) + total) % total;
      else elapsed = Math.min(elapsed, total);

      let phase, t;
      if (elapsed < sd && sd > 0) {
        phase = 'search'; t = elapsed / sd;
      } else if (elapsed < sd + pd && pd > 0) {
        phase = 'path';   t = (elapsed - sd) / pd;
      } else {
        phase = 'pause';  t = ps === 0 ? 1 : (elapsed - sd - pd) / ps;
      }
      setTick({ phase, t });

      if (loop || elapsed < total - 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [searchDuration, pathDuration, pauseDuration, loop]);

  // Visited cutoff and visible search overlay
  const visitCutoff = tick.phase === 'search' ? tick.t * maxDist : maxDist + 1;
  const visitedD = mrUseMemo(() => {
    let s = '';
    for (let i = 0; i < edgeSegments.length; i++) {
      const seg = edgeSegments[i];
      if (seg.t > visitCutoff) break;
      s += seg.s;
    }
    return s;
  }, [edgeSegments, visitCutoff]);

  const pathDrawProgress =
    tick.phase === 'search' ? 0 :
    tick.phase === 'path'   ? Math.max(0, Math.min(1, tick.t)) : 1;

  const startPos = nodes[startNode];
  const endPos   = nodes[endNode];

  const clipPath = MR_SHAPE_CLIPS[shape] || 'none';
  const rx = parseFloat(rotateX) || 0;
  const ry = parseFloat(rotateY) || 0;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', perspective: '800px' }}>
      <div style={{
        width: '100%', height: '100%',
        transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
        transformOrigin: 'center center',
        clipPath: clipPath,
        overflow: 'hidden',
        position: 'relative',
      }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet"
           style={{ width: '100%', height: '100%', display: 'block' }}>
        {/* Base network — full graph, faint */}
        <path d={networkD} stroke={networkColor} strokeWidth="0.8"
              fill="none" strokeLinecap="round" opacity="0.55" />
        {/* Search overlay — visited subset, brighter */}
        <path d={visitedD} stroke={searchColor} strokeWidth="1.4"
              fill="none" strokeLinecap="round" opacity="0.95" />
        {/* Final route — drawn over the top with a stroke-dashoffset reveal */}
        {pathD && (
          <path d={pathD}
                stroke={routeColor} strokeWidth="3" fill="none"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={pathLength}
                strokeDashoffset={pathLength * (1 - pathDrawProgress)}
                style={{ filter: `drop-shadow(0 0 4px ${routeColor})`, opacity: tick.phase === 'search' ? 0 : 1, transition: 'opacity 0.2s linear' }} />
        )}
        {/* Endpoint dots */}
        {startPos && (
          <g>
            <circle cx={startPos.x} cy={startPos.y} r="9" fill={nodeColor} opacity="0.18">
              <animate attributeName="r" values="9;14;9" dur="1.6s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.32;0;0.32" dur="1.6s" repeatCount="indefinite"/>
            </circle>
            <circle cx={startPos.x} cy={startPos.y} r="6" fill={nodeColor}
                    style={{ filter: `drop-shadow(0 0 8px ${nodeColor})` }}/>
          </g>
        )}
        {endPos && (
          <g>
            <circle cx={endPos.x} cy={endPos.y} r="9" fill={nodeColor} opacity="0.18">
              <animate attributeName="r" values="9;14;9" dur="1.6s" begin="0.6s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.32;0;0.32" dur="1.6s" begin="0.6s" repeatCount="indefinite"/>
            </circle>
            <circle cx={endPos.x} cy={endPos.y} r="6" fill={nodeColor}
                    style={{ filter: `drop-shadow(0 0 8px ${nodeColor})` }}/>
          </g>
        )}
      </svg>
      </div>
    </div>
  );
}

Object.assign(window, { MapRouteDiagram });

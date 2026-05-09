// route-diagram.jsx
// Parametric, animated route diagram. A bus travels along a smooth zig-zag
// path, lighting up each stop as it passes; loops indefinitely.

const { useEffect, useMemo, useRef, useState, useCallback } = React;

// Brand palette (matches Goal Systems onboarding flow)
const PALETTE = {
  bg:        '#0a0e22',
  track:     '#1f2647',
  trackDim:  '#161a35',
  accent:    '#42dcc6',
  accentDim: 'rgba(66,220,198,0.18)',
  ink:       '#dde4e1',
  inkDim:    '#bbcac5',
  muted:     '#859490',
  border:    '#1c2341',
  multi: ['#42dcc6', '#fae374', '#ff7775', '#bec5eb', '#83e287', '#fae374', '#ff7775', '#42dcc6'],
};

// Easing for pause-at-stop motion
const easeInOut = (t) => t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;

// Build a smooth zig-zag path connecting alternating-side stops with cubic Bézier curves.
// Returns { d, stops: [{x, y, ...}] }.
function buildRoute({ stops, width, height, padX, padY, curvature }) {
  const n = stops.length;
  if (n === 0) return { d: '', stopsXY: [] };

  const leftX  = padX;
  const rightX = width - padX;
  // Slight indent on rows so the curve doesn't hug the wall
  const xs = stops.map((_, i) => i % 2 === 0 ? leftX : rightX);
  const ys = stops.map((_, i) =>
    n === 1 ? height/2 : padY + (height - 2*padY) * (i / (n - 1))
  );

  const stopsXY = stops.map((s, i) => ({ ...s, x: xs[i], y: ys[i] }));
  if (n === 1) return { d: `M ${xs[0]} ${ys[0]}`, stopsXY };

  // Curvature controls how far the control points push out horizontally.
  // 0 → almost straight zig-zag; 1 → very rounded U-turns.
  const k = Math.max(0, Math.min(1, curvature));

  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < n; i++) {
    const x0 = xs[i-1], y0 = ys[i-1];
    const x1 = xs[i],   y1 = ys[i];
    // Push control points outward beyond the rows for U-turn feel
    const overshoot = (x1 - x0) * (0.15 + 0.55 * k); // signed
    const c1x = x0 + overshoot;
    const c1y = y0 + (y1 - y0) * (0.05 + 0.05 * k);
    const c2x = x1 - overshoot;
    const c2y = y1 - (y1 - y0) * (0.05 + 0.05 * k);
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x1} ${y1}`;
  }
  return { d, stopsXY };
}

// ─── Bus markers ─────────────────────────────────────────────────────────────
function BusMarker({ style, color, secondary, size = 38 }) {
  const half = size / 2;

  if (style === 'dot') {
    return (
      <g>
        <circle r={size*0.55} fill={color} opacity={0.18}>
          <animate attributeName="r" values={`${size*0.55};${size*1.1};${size*0.55}`} dur="1.6s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.35;0;0.35" dur="1.6s" repeatCount="indefinite"/>
        </circle>
        <circle r={size*0.32} fill={color} />
        <circle r={size*0.32} fill="none" stroke="#00001b" strokeWidth="2.5"/>
      </g>
    );
  }

  if (style === 'pin') {
    // Map-pin style (similar to reference image)
    return (
      <g transform={`translate(0,${-size*0.35})`}>
        <path
          d={`M 0 ${-size*0.55}
              a ${size*0.55} ${size*0.55} 0 1 0 0.001 0
              Z
              M -${size*0.18} ${size*0.05}
              L 0 ${size*0.55}
              L ${size*0.18} ${size*0.05} Z`}
          fill={color}
        />
        <circle cy={-size*0.05} r={size*0.18} fill="#0a0e22"/>
      </g>
    );
  }

  if (style === 'plate') {
    // Rectangular destination plate
    const w = size*1.6, h = size*0.7;
    return (
      <g>
        <rect x={-w/2} y={-h/2} width={w} height={h} fill="#00001b" stroke={color} strokeWidth="2" />
        <rect x={-w/2+4} y={-h/2+4} width={w-8} height={h-8} fill="none" stroke={color} strokeWidth="0.5" opacity="0.5"/>
        <text x={0} y={4} textAnchor="middle" fill={color}
              style={{ fontFamily:"'JetBrains Mono', monospace", fontSize: size*0.32, fontWeight:700, letterSpacing:'0.1em' }}>
          BUS
        </text>
      </g>
    );
  }

  // Default: circular badge with bus glyph
  return (
    <g>
      {/* Pulse rings */}
      <circle r={half*0.95} fill={color} opacity={0.18}>
        <animate attributeName="r" values={`${half*0.95};${half*1.7};${half*0.95}`} dur="1.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.35;0;0.35" dur="1.6s" repeatCount="indefinite"/>
      </circle>
      {/* Badge */}
      <circle r={half} fill={color} stroke="#00001b" strokeWidth="3"/>
      <circle r={half-3} fill="none" stroke={secondary || '#003730'} strokeWidth="0.5" opacity="0.4"/>
      {/* Bus icon — drawn as SVG paths so it can sit inside the circle without rotation */}
      <g transform={`translate(${-half*0.55}, ${-half*0.55}) scale(${size/35})`}>
        <path
          d="M 5 4 h 10 a 2 2 0 0 1 2 2 v 12 a 1.5 1.5 0 0 1 -1.5 1.5 H 16.5 v 1 a 1 1 0 0 1 -2 0 v -1 H 5.5 v 1 a 1 1 0 0 1 -2 0 v -1 H 3.5 A 1.5 1.5 0 0 1 2 18 V 6 a 2 2 0 0 1 2 -2 z m 0 2 v 6 h 10 V 6 H 5 z m 0.5 9 a 1 1 0 1 0 0.001 0 z m 9 0 a 1 1 0 1 0 0.001 0 z"
          fill="#003730"
        />
      </g>
    </g>
  );
}

// ─── Battery floating tag ────────────────────────────────────────────────────
function BatteryTag({ progress, start, end, high, mid, unit }) {
  // Linear drain from start% at progress=0 to end% at progress=1
  const pct = Math.max(0, Math.min(100, start + (end - start) * progress));
  const rounded = Math.round(pct);

  // Color by threshold
  let color = '#ff7775';        // < mid → red
  if (rounded >= high)      color = '#83e287';  // ≥ high → green
  else if (rounded >= mid)  color = '#fae374';  // ≥ mid  → yellow

  // Float above bus
  const tagY = -54;
  const w = 78, h = 26;
  const fillRatio = rounded / 100;

  return (
    <g transform={`translate(0, ${tagY})`} style={{ pointerEvents:'none' }}>
      {/* Connector line from bus to tag */}
      <line x1="0" y1={h/2 + 2} x2="0" y2={20} stroke={color} strokeWidth="1.5" opacity="0.6" strokeDasharray="2 2"/>

      {/* Background plate */}
      <rect x={-w/2} y={-h/2} width={w} height={h} fill="#00001b" stroke={color} strokeWidth="1.25"/>

      {/* Inner battery body */}
      <g transform={`translate(${-w/2 + 8}, ${-7})`}>
        <rect x="0" y="0" width="18" height="14" fill="none" stroke={color} strokeWidth="1.25"/>
        <rect x="18" y="4" width="2.5" height="6" fill={color}/>
        {/* Fill — animated by ratio */}
        <rect x="2" y="2" width={Math.max(0.5, 14 * fillRatio)} height="10" fill={color}>
          {rounded < mid && (
            <animate attributeName="opacity" values="1;0.35;1" dur="0.9s" repeatCount="indefinite"/>
          )}
        </rect>
      </g>

      {/* Percentage text */}
      <text x={w/2 - 8} y="4" textAnchor="end"
            style={{ fontFamily:"'JetBrains Mono', ui-monospace, monospace", fontSize:11, fontWeight:700, letterSpacing:'0.04em' }}
            fill={color}>
        {rounded}{unit}
      </text>
    </g>
  );
}

// ─── Stop pin ────────────────────────────────────────────────────────────────
function StopPin({ stop, index, total, active, completed, color, showLabel, side }) {
  const r = 18;
  const labelOffset = side === 'left' ? -r - 18 : r + 18;
  const anchor = side === 'left' ? 'end' : 'start';

  return (
    <g transform={`translate(${stop.x}, ${stop.y})`}>
      {/* Outer faint ring (always) */}
      <circle r={r + 8} fill="none" stroke={completed ? color : '#1c2341'} strokeWidth="1" opacity={completed ? 0.5 : 1} />

      {/* Pulse ring on active */}
      {active && (
        <>
          <circle r={r} fill={color} opacity={0.25}>
            <animate attributeName="r" values={`${r};${r*1.9};${r}`} dur="1.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0;0.5" dur="1.2s" repeatCount="indefinite"/>
          </circle>
        </>
      )}

      {/* Filled or outlined pin */}
      <g style={{ animation: active ? 'stopHit 0.6s ease-out' : 'none' }}>
        <circle r={r} fill={completed ? color : '#0a0e22'}
                stroke={completed ? color : '#464a6c'}
                strokeWidth={completed ? 2 : 1.5}/>
        <circle r={r-6} fill={completed ? '#0a0e22' : 'transparent'}
                stroke={completed ? '#0a0e22' : color}
                strokeWidth={completed ? 0 : 1.5}/>
      </g>

      {/* Index inside */}
      <text y={4} textAnchor="middle"
            style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:12, fontWeight:700, letterSpacing:'0.04em' }}
            fill={completed ? color : '#bbcac5'}>
        {String(index + 1).padStart(2,'0')}
      </text>

      {/* Label */}
      {showLabel && (
        <g transform={`translate(${labelOffset}, 0)`}>
          <text textAnchor={anchor} y={-4}
                style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:14, fontWeight:600 }}
                fill={completed || active ? '#dde4e1' : '#bbcac5'}>
            {stop.label}
          </text>
          {stop.caption && (
            <text textAnchor={anchor} y={14}
                  style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:11, letterSpacing:'0.02em' }}
                  fill="#859490">
              {stop.caption}
            </text>
          )}
        </g>
      )}
    </g>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
function RouteDiagram({
  stops = [],
  speed = 1,
  pauseAtStops = true,
  showLabels = true,
  colorMode = 'brand',     // 'brand' | 'multi'
  busStyle = 'badge',      // 'badge' | 'pin' | 'dot' | 'plate'
  curvature = 0.55,
  trackStyle = 'dashed',   // 'solid' | 'dashed'
  showProgress = true,
  loop = true,
  // Battery overlay — floats above the bus, drains as it travels
  showBattery = false,
  batteryStart = 100,
  batteryEnd = 5,
  batteryHigh = 60,        // ≥ high → green
  batteryMid  = 25,        // ≥ mid  → yellow; below → red
  batteryUnit = '%',
}) {
  const wrapRef = useRef(null);
  const pathRef = useRef(null);
  const [size, setSize] = useState({ w: 600, h: 720 });
  const [progress, setProgress] = useState(0);   // 0..1 along path
  const [activeStop, setActiveStop] = useState(-1);
  const [running, setRunning] = useState(true);

  // Resize observer
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setSize({ w: Math.max(360, width), h: Math.max(420, height) });
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Build path — asymmetric padding so right-side labels don't clip
  const padX = showLabels ? 160 : 70;
  const padY = 70;
  const { d, stopsXY } = useMemo(
    () => buildRoute({ stops, width: size.w, height: size.h, padX, padY, curvature }),
    [stops, size.w, size.h, curvature]
  );

  // Path length
  const [pathLength, setPathLength] = useState(0);
  useEffect(() => {
    if (pathRef.current) {
      // requestAnimationFrame ensures layout is committed
      requestAnimationFrame(() => {
        if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
      });
    }
  }, [d]);

  // Animation loop — progress in segments between stops, optional pause at each
  const tRef = useRef(0);
  const pauseRef = useRef(0); // remaining pause time
  const segIdxRef = useRef(0);

  useEffect(() => {
    let raf;
    let last = performance.now();
    const loopTime = 12 / Math.max(0.05, speed); // seconds for full traversal at speed=1

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!running) { raf = requestAnimationFrame(tick); return; }

      const n = stops.length;
      if (n < 2) { raf = requestAnimationFrame(tick); return; }

      // Segment-based motion: 0..n-1 segments connecting stops
      const totalSegs = n - 1;
      const segDur = loopTime / totalSegs;
      const pauseDur = pauseAtStops ? Math.min(0.9, segDur * 0.35) : 0;

      if (pauseRef.current > 0) {
        pauseRef.current -= dt;
        raf = requestAnimationFrame(tick);
        return;
      }

      let t = tRef.current + dt / segDur;
      let seg = segIdxRef.current;

      if (t >= 1) {
        // Reached next stop
        t = 0;
        seg += 1;
        if (seg >= totalSegs) {
          // End of route
          setActiveStop(n - 1);
          if (loop) {
            // Hold briefly at end then restart
            pauseRef.current = pauseDur * 1.4;
            seg = 0;
            tRef.current = 0;
            segIdxRef.current = 0;
            // Reset progress immediately on new loop
            setProgress(0);
          } else {
            setRunning(false);
            setProgress(1);
            return;
          }
        } else {
          setActiveStop(seg);
          if (pauseAtStops) pauseRef.current = pauseDur;
        }
      }

      tRef.current = t;
      segIdxRef.current = seg;

      // Eased segment progress
      const eased = easeInOut(t);
      const overall = (seg + eased) / totalSegs;
      setProgress(overall);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed, pauseAtStops, stops.length, loop, running]);

  // Reset when stops/speed config changes meaningfully
  useEffect(() => {
    tRef.current = 0;
    segIdxRef.current = 0;
    pauseRef.current = 0;
    setProgress(0);
    setActiveStop(-1);
    setRunning(true);
  }, [stops.length, loop]);

  // Bus position
  const busPos = useMemo(() => {
    if (!pathRef.current || pathLength === 0) return { x: 0, y: 0 };
    const len = Math.max(0, Math.min(1, progress)) * pathLength;
    const pt = pathRef.current.getPointAtLength(len);
    return { x: pt.x, y: pt.y };
  }, [progress, pathLength]);

  // Color resolver
  const stopColor = useCallback((i) => {
    if (colorMode === 'multi') return PALETTE.multi[i % PALETTE.multi.length];
    return PALETTE.accent;
  }, [colorMode]);

  // Determine completion per stop based on segment index
  const completedStop = useCallback((i) => {
    return segIdxRef.current >= i || (segIdxRef.current === i - 1 && tRef.current >= 0.98);
  }, [progress]); // deps include progress so it re-renders

  // Active stop = first stop AT or just-passed
  const isActive = (i) => {
    // The current segment goes from stop i to stop i+1 — both are "in play"
    if (i === segIdxRef.current && tRef.current < 0.05) return true;
    if (i === segIdxRef.current + 1 && tRef.current > 0.95) return true;
    if (i === stops.length - 1 && progress >= 0.999) return true;
    if (i === 0 && progress < 0.01) return true;
    return false;
  };

  const busColor = colorMode === 'multi' ? PALETTE.accent : PALETTE.accent;

  return (
    <div ref={wrapRef} style={{ position:'relative', flex:1, minHeight:600 }}>
      {/* Progress chip */}
      {showProgress && (
        <div style={{
          position:'absolute', top:14, left:14, zIndex:2,
          display:'flex', alignItems:'center', gap:10,
          padding:'8px 12px', background:'rgba(13,18,40,0.85)',
          border:`1px solid ${PALETTE.border}`,
          fontFamily:"'JetBrains Mono', monospace", fontSize:11, letterSpacing:'0.04em',
        }}>
          <span style={{ width:6, height:6, background:PALETTE.accent, display:'inline-block' }}/>
          <span style={{ color: PALETTE.muted }}>PROG</span>
          <span style={{ color: PALETTE.ink, fontWeight:700 }}>{(progress*100).toFixed(0).padStart(3,'0')}%</span>
          <span style={{ color: PALETTE.border }}>│</span>
          <span style={{ color: PALETTE.muted }}>STOP</span>
          <span style={{ color: PALETTE.accent, fontWeight:700 }}>
            {String(Math.min(stops.length, segIdxRef.current + 1)).padStart(2,'0')}/{String(stops.length).padStart(2,'0')}
          </span>
        </div>
      )}

      {/* Play/Pause */}
      <button
        onClick={() => setRunning(r => !r)}
        style={{
          position:'absolute', top:14, right:14, zIndex:2,
          background:'rgba(13,18,40,0.85)', border:`1px solid ${PALETTE.border}`,
          color: PALETTE.ink, cursor:'pointer', padding:'7px 12px',
          fontFamily:'Space Grotesk', fontSize:11, fontWeight:700, letterSpacing:'0.12em',
          textTransform:'uppercase', display:'flex', alignItems:'center', gap:8,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize:14, color: PALETTE.accent }}>
          {running ? 'pause' : 'play_arrow'}
        </span>
        {running ? 'Pause' : 'Play'}
      </button>

      <svg width="100%" height="100%" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="xMidYMid meet"
           style={{ display:'block', overflow:'visible' }}>
        <defs>
          <filter id="bus-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="completed-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={PALETTE.accent} stopOpacity="0.9"/>
            <stop offset="100%" stopColor={PALETTE.accent} stopOpacity="1"/>
          </linearGradient>
        </defs>

        {/* Background grid stripes (very subtle) */}
        <g opacity="0.5">
          {Array.from({ length: Math.floor(size.h/40) }).map((_, i) => (
            <line key={i} x1="0" x2={size.w} y1={i*40} y2={i*40} stroke="#0f1430" strokeWidth="1"/>
          ))}
        </g>

        {/* Track — base (full path, dim) */}
        <path
          ref={pathRef}
          d={d}
          fill="none"
          stroke={PALETTE.track}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={trackStyle === 'dashed' ? '2 14' : '0'}
        />

        {/* Track — completed portion (overlay, animated dash flow when solid) */}
        <path
          d={d}
          fill="none"
          stroke="url(#completed-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength > 0 ? `${progress * pathLength} ${pathLength}` : '0'}
          opacity="0.95"
        />

        {/* Subtle flowing dashes ahead of the bus on the completed track */}
        <path
          d={d}
          fill="none"
          stroke="#00001b"
          strokeWidth="1.5"
          strokeDasharray="6 22"
          strokeDashoffset="0"
          strokeLinecap="round"
          opacity="0.6"
          style={{
            strokeDasharray: '6 22',
            animation: 'dashFlow 1.4s linear infinite',
            // Mask through completed portion
            ...(pathLength > 0 ? {} : {})
          }}
        />

        {/* Stops */}
        {stopsXY.map((s, i) => (
          <StopPin
            key={s.id}
            stop={s}
            index={i}
            total={stops.length}
            active={isActive(i)}
            completed={completedStop(i)}
            color={stopColor(i)}
            showLabel={showLabels}
            side={i % 2 === 0 ? 'left' : 'right'}
          />
        ))}

        {/* Bus */}
        {pathLength > 0 && (
          <g transform={`translate(${busPos.x}, ${busPos.y})`} filter="url(#bus-glow)">
            <BusMarker style={busStyle} color={busColor} size={42}/>
            {showBattery && (
              <BatteryTag
                progress={progress}
                start={batteryStart}
                end={batteryEnd}
                high={batteryHigh}
                mid={batteryMid}
                unit={batteryUnit}
              />
            )}
          </g>
        )}
      </svg>
    </div>
  );
}

Object.assign(window, { RouteDiagram });

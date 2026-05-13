// animation diagrams/funnel.jsx
// DIAG-008 · Funnel — Conversion funnel with staggered entrance, particle flow,
// dynamic glow lights, and draggable labels with animated arrow connectors.
// Exposes: window.FunnelDiagram

(function () {
  const { useState, useEffect, useRef, useCallback, useLayoutEffect } = React;

  // ── helpers ──────────────────────────────────────────────────────────────────

  function fnParseStages(text) {
    return (text || '').split(/\r?\n/)
      .map(l => l.trim()).filter(Boolean)
      .map((l, i) => {
        const parts = l.split('|').map(s => s.trim());
        return { id: i, label: parts[0] || '', value: parts[1] || '', sub: parts[2] || '' };
      });
  }

  function fnHexToRgb(hex) {
    const h = (hex || '#42dcc6').replace(/^#/, '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16) || 0;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function fnLerpColor(hexA, hexB, t) {
    const a = fnHexToRgb(hexA), b = fnHexToRgb(hexB);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function fnHexToRgbStr(hex) {
    const { r, g, b } = fnHexToRgb(hex);
    return `${r},${g},${b}`;
  }

  // ── particle canvas ───────────────────────────────────────────────────────────

  function useParticleCanvas(canvasRef, enabled, n, colors, density, size) {
    const rafRef = useRef(null);
    const pRef = useRef([]);

    useEffect(() => {
      cancelAnimationFrame(rafRef.current);
      pRef.current = [];
      if (!enabled || !n) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      function spawn() {
        const si = Math.floor(Math.random() * n);
        const t0 = si / n;
        const PAD = 40;
        const totalH = canvas.height - PAD * 2;
        const topW = canvas.width * 0.76;
        const botW = canvas.width * 0.16;
        const cx = canvas.width / 2;
        const w = topW + (botW - topW) * (t0 + 0.5 / n);
        const xMin = cx - w / 2 + 6, xMax = cx + w / 2 - 6;
        const yMin = PAD + totalH * t0;
        const yMax = yMin + totalH / n;
        const { r, g, b } = fnHexToRgb(colors[si % colors.length] || '#42dcc6');
        pRef.current.push({
          x: xMin + Math.random() * (xMax - xMin),
          y: yMin + Math.random() * (yMax - yMin),
          vx: (Math.random() - 0.5) * 0.5,
          vy: 0.4 + Math.random() * 1.0,
          life: 0.75 + Math.random() * 0.25,
          decay: 0.005 + Math.random() * 0.007,
          r: 1.2 + Math.random() * 2.2,
          rgb: { r, g, b },
        });
      }

      function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (Math.random() < density / 80) spawn();
        pRef.current = pRef.current.filter(p => p.life > 0.03);
        for (const p of pRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.rgb.r},${p.rgb.g},${p.rgb.b},${Math.min(p.life * 0.85, 0.65)})`;
          ctx.fill();
        }
        rafRef.current = requestAnimationFrame(tick);
      }

      rafRef.current = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(rafRef.current);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      };
    }, [enabled, n, density, colors.join(','), size.w, size.h]);
  }

  // ── component ─────────────────────────────────────────────────────────────────

  function FunnelDiagram({
    stagesText,
    colorTop,
    colorBottom,
    showValues,
    showSub,
    showPercentages,
    showArrows,
    particleMode,
    particleDensity,
    entranceAnim,
    glowIntensity,
    labelSide,
    align,
    valign,
  }) {
    stagesText    = stagesText    !== undefined ? stagesText    : 'Awareness|12,400|Top of funnel\nInterest|8,200|Marketing qualified\nConsideration|3,600|Product page views\nIntent|1,800|Trial starts\nConversion|540|Paid customers';
    colorTop      = colorTop      || '#42dcc6';
    colorBottom   = colorBottom   || '#8b5cf6';
    showValues    = showValues    !== false;
    showSub       = showSub       !== false;
    showPercentages = showPercentages !== false;
    showArrows    = showArrows    !== false;
    particleMode  = particleMode  || 'flow';
    particleDensity = particleDensity !== undefined ? particleDensity : 40;
    entranceAnim  = entranceAnim  !== false;
    glowIntensity = glowIntensity !== undefined ? glowIntensity : 60;
    labelSide     = labelSide     || 'right';
    align         = align         || 'center';
    valign        = valign        || 'middle';

    const containerRef = useRef(null);
    const canvasRef    = useRef(null);
    const [size, setSize]             = useState({ w: 600, h: 480 });
    const [visibleCount, setVisible]  = useState(0);
    const [labelOffsets, setOffsets]  = useState({});

    const stages = fnParseStages(stagesText);
    const n = Math.max(stages.length, 1);
    const values = stages.map(s => parseFloat((s.value || '').replace(/[^0-9.]/g, '')) || 0);

    const colors = stages.map((_, i) =>
      fnLerpColor(colorTop, colorBottom, i / Math.max(n - 1, 1))
    );

    // resize
    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (width > 10 && height > 10) setSize({ w: width, h: height });
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    // canvas dimensions
    useEffect(() => {
      const c = canvasRef.current;
      if (c) { c.width = size.w; c.height = size.h; }
    }, [size.w, size.h]);

    // entrance stagger
    useEffect(() => {
      setVisible(entranceAnim ? 0 : n);
      setOffsets({});
      if (!entranceAnim) return;
      let i = 0;
      const id = setInterval(() => { i++; setVisible(i); if (i >= n) clearInterval(id); }, 175);
      return () => clearInterval(id);
    }, [entranceAnim, stagesText, n]);

    // particles
    useParticleCanvas(canvasRef, particleMode !== 'none', n, colors, particleDensity, size);

    // drag
    const onLabelDown = useCallback((e, id) => {
      e.preventDefault(); e.stopPropagation();
      const sx = e.clientX, sy = e.clientY;
      const base = labelOffsets[id] || { x: 0, y: 0 };
      function move(e) {
        setOffsets(prev => ({ ...prev, [id]: { x: base.x + e.clientX - sx, y: base.y + e.clientY - sy } }));
      }
      function up() {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      }
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    }, [labelOffsets]);

    // geometry
    const PAD    = 40;
    const topW   = size.w * 0.76;
    const botW   = size.w * 0.16;
    const totalH = size.h - PAD * 2;
    const cx     = size.w / 2;
    const stageH = totalH / n;
    const gblur  = (glowIntensity / 100) * 9;

    const jc = { left: 'flex-start', center: 'center', right: 'flex-end' }[align]  || 'center';
    const ai = { top: 'flex-start',  middle: 'center', bottom: 'flex-end' }[valign] || 'center';

    function trapPts(i, fractionEnd) {
      const t0 = i / n, t1 = (fractionEnd !== undefined ? fractionEnd : i + 1) / n;
      const w0 = topW + (botW - topW) * t0;
      const w1 = topW + (botW - topW) * t1;
      const y0 = PAD + totalH * t0, y1 = PAD + totalH * t1;
      return { lx0: cx - w0/2, rx0: cx + w0/2, lx1: cx - w1/2, rx1: cx + w1/2, y0, y1, w0, w1 };
    }

    return (
      <div ref={containerRef} style={{
        width: '100%', height: '100%', minHeight: 280,
        display: 'flex', alignItems: ai, justifyContent: jc,
        position: 'relative', overflow: 'hidden',
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        <style>{`
          @keyframes fn-enter {
            from { opacity: 0; transform: scaleX(0.5); }
            to   { opacity: 1; transform: scaleX(1); }
          }
          @keyframes fn-shimmer {
            0%   { transform: translateX(-250%); opacity: 0; }
            15%  { opacity: 0.55; }
            85%  { opacity: 0.35; }
            100% { transform: translateX(600%); opacity: 0; }
          }
          @keyframes fn-glow-pulse {
            0%, 100% { opacity: 0.35; }
            50%      { opacity: 0.85; }
          }
          @keyframes fn-arrow-march {
            from { stroke-dashoffset: 16; }
            to   { stroke-dashoffset: 0; }
          }
          @keyframes fn-dot-pulse {
            0%, 100% { r: 3; opacity: 0.7; }
            50%      { r: 5; opacity: 1; }
          }
        `}</style>

        {/* particle canvas — below labels */}
        <canvas ref={canvasRef}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}
        />

        {/* SVG funnel body */}
        <svg
          width={size.w} height={size.h}
          style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'visible' }}
          viewBox={`0 0 ${size.w} ${size.h}`}
        >
          <defs>
            <filter id="fn-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={gblur} result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {stages.map((_, i) => {
              const { lx0, rx0, lx1, rx1, y0, y1 } = trapPts(i);
              return (
                <React.Fragment key={i}>
                  <clipPath id={`fn-clip-${i}`}>
                    <polygon points={`${lx0},${y0} ${rx0},${y0} ${rx1},${y1} ${lx1},${y1}`} />
                  </clipPath>
                  <linearGradient id={`fn-lg-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stopColor="rgba(255,255,255,0.20)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
                  </linearGradient>
                </React.Fragment>
              );
            })}
          </defs>

          {/* funnel stages */}
          {stages.map((stage, i) => {
            if (i >= visibleCount) return null;
            const { lx0, rx0, lx1, rx1, y0, y1, w0 } = trapPts(i);
            const pts = `${lx0},${y0} ${rx0},${y0} ${rx1},${y1} ${lx1},${y1}`;
            const col = colors[i];
            const { r, g, b } = fnHexToRgb(col);
            const midY = (y0 + y1) / 2;
            const shimW = w0 * 0.35;
            const glowDelay = `${i * 0.28}s`;

            return (
              <g key={i} style={entranceAnim ? {
                animation: `fn-enter 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s both`,
                transformOrigin: `${cx}px ${midY}px`,
              } : {}}>
                {/* main trapezoid */}
                <polygon points={pts} fill={col} opacity={0.88} />
                {/* light gradient overlay */}
                <polygon points={pts} fill={`url(#fn-lg-${i})`} />
                {/* shimmer sweep — clipped to trapezoid */}
                <rect
                  x={lx0 - shimW} y={y0}
                  width={shimW} height={y1 - y0 + 1}
                  fill="rgba(255,255,255,0.28)"
                  clipPath={`url(#fn-clip-${i})`}
                  style={{
                    animation: `fn-shimmer ${3.2 + i * 0.4}s ease-in-out ${i * 0.9 + 0.6}s infinite`,
                    transformBox: 'fill-box',
                  }}
                />
                {/* interior glow orb */}
                {glowIntensity > 10 && (
                  <ellipse
                    cx={cx} cy={midY}
                    rx={w0 * 0.28} ry={(y1 - y0) * 0.32}
                    fill={`rgba(${r},${g},${b},0.18)`}
                    filter="url(#fn-glow)"
                    style={{ animation: `fn-glow-pulse ${1.8 + i * 0.25}s ease-in-out ${glowDelay} infinite` }}
                  />
                )}
                {/* top edge highlight */}
                <line x1={lx0} y1={y0} x2={rx0} y2={y0}
                  stroke="rgba(255,255,255,0.42)" strokeWidth="1.5" />
                {/* stage divider */}
                {i < n - 1 && (
                  <line x1={lx1} y1={y1} x2={rx1} y2={y1}
                    stroke="#00001b" strokeWidth="2.5" />
                )}
              </g>
            );
          })}

          {/* animated arrow connectors between stages */}
          {showArrows && stages.map((_, i) => {
            if (i < 1 || i >= visibleCount) return null;
            const { lx0: lx, rx0: rx, y0: y } = trapPts(i);
            const arrowH = stageH * 0.22;
            const col = colors[i - 1];
            return (
              <g key={`arr${i}`} opacity={0.55}>
                {[lx - 24, rx + 8].map((ax, ai) => (
                  <polyline key={ai}
                    points={`${ax},${y - arrowH} ${ax + 9},${y} ${ax},${y + arrowH}`}
                    fill="none" stroke={col} strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="4 4"
                    style={{ animation: `fn-arrow-march 0.9s linear infinite` }}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* draggable label cards + connector lines */}
        {stages.map((stage, i) => {
          if (i >= visibleCount) return null;
          const tMid   = (i + 0.5) / n;
          const wMid   = topW + (botW - topW) * tMid;
          const yCtr   = PAD + totalH * tMid;
          const off    = labelOffsets[i] || { x: 0, y: 0 };
          const col    = colors[i];
          const { r, g, b } = fnHexToRgb(col);
          const isRight = labelSide !== 'left';
          const anchorX = isRight ? cx + wMid / 2 : cx - wMid / 2;
          const labelX  = isRight ? anchorX + 20 + off.x : anchorX - 20 + off.x;
          const labelY  = yCtr + off.y;
          const pct     = values[0] > 0 && i > 0 ? Math.round((values[i] / values[0]) * 100) : null;

          return (
            <React.Fragment key={i}>
              {/* SVG connector + anchor dot */}
              <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:3 }}
                viewBox={`0 0 ${size.w} ${size.h}`}>
                <line
                  x1={anchorX} y1={yCtr} x2={labelX} y2={labelY}
                  stroke={col} strokeWidth="1"
                  strokeDasharray="4 3" opacity="0.55"
                />
                <circle cx={anchorX} cy={yCtr} r="3.5" fill={col} opacity="0.85"
                  style={{ animation: `fn-dot-pulse ${1.6 + i * 0.2}s ease-in-out infinite` }}
                />
              </svg>

              {/* label card */}
              <div
                onMouseDown={e => onLabelDown(e, i)}
                style={{
                  position: 'absolute',
                  left:      isRight ? labelX : undefined,
                  right:     isRight ? undefined : size.w - labelX,
                  top:       labelY - 24,
                  transform: isRight ? 'none' : 'translateX(-100%)',
                  zIndex: 4,
                  cursor: 'grab',
                  userSelect: 'none',
                  pointerEvents: 'auto',
                  minWidth: 108,
                  ...(entranceAnim ? {
                    animation: `fn-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.12 + 0.25}s both`,
                    transformOrigin: isRight ? 'left center' : 'right center',
                  } : {}),
                }}
              >
                <div style={{
                  background: 'rgba(10,14,34,0.92)',
                  border: `1px solid rgba(${r},${g},${b},0.55)`,
                  padding: '7px 12px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: `0 0 ${Math.round(glowIntensity / 6)}px rgba(${r},${g},${b},0.3), inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: col, textTransform: 'uppercase', marginBottom: 2 }}>
                    {stage.label}
                  </div>
                  {showValues && stage.value && (
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#dde4e1', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                      {stage.value}
                    </div>
                  )}
                  {showSub && stage.sub && (
                    <div style={{ fontSize: 10, color: '#859490', marginTop: 3, lineHeight: 1.4 }}>{stage.sub}</div>
                  )}
                  {pct !== null && showPercentages && (
                    <div style={{ fontSize: 10, color: col, marginTop: 3, opacity: 0.8, fontVariantNumeric: 'tabular-nums' }}>
                      {pct}% of top
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  window.FunnelDiagram = FunnelDiagram;
})();

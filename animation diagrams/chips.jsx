// chips.jsx
// Rows of pill-style chips that always fit their cell. The diagram renders
// chips at their natural size and uses a ResizeObserver-driven CSS scale to
// shrink them uniformly when the cell is smaller than the natural content.
//
// Background is always transparent (the cell behind the diagram shows through).
//
// Props:
//   chipsText       String, one chip per line. Lines may use "text|#bg|#fg".
//   rows            How many visual rows the chips are split into (1..8).
//   colorMode       'alternate' | 'random' | 'mono'
//   palette         [{bg, fg}, ...] — used by alternate / random
//   borderRadius    Px radius (use 999 for pill / 0 for square)
//   paddingX        Inner horizontal padding (px)
//   paddingY        Inner vertical padding (px)
//   gap             Gap between chips and between rows (px)
//   fontSize        Chip text size (px)
//   fontWeight      Chip text weight (300..900)
//   animation       'none' | 'pulse' | 'fade'
//   pulseDuration   ms (used by pulse / fade)
//   align           'left'   | 'center' | 'right'    (horizontal in the cell)
//   valign          'top'    | 'middle' | 'bottom'   (vertical in the cell)

const {
  useMemo: chUseMemo, useRef: chUseRef, useState: chUseState,
  useLayoutEffect: chUseLayoutEffect, useEffect: chUseEffect,
} = React;

// ─── Small seeded RNG so 'random' mode is stable for the same chip count ────
function chRng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Parse chipsText into [{text, bg, fg}, ...] ─────────────────────────────
// Each non-empty line is a chip. Lines may carry inline color overrides:
//   "Focus"
//   "Coffee | #5a1f23 | #f0d871"
//   "Studio|#5a1f23"          (only bg override)
function chParseChips(text) {
  const out = [];
  if (typeof text !== 'string') return out;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw) continue;
    const parts = raw.split('|').map(s => s.trim());
    const t = parts[0];
    if (!t) continue;
    const bg = parts[1] && /^#?[0-9a-fA-F]{3,8}$/.test(parts[1]) ? (parts[1].startsWith('#') ? parts[1] : `#${parts[1]}`) : null;
    const fg = parts[2] && /^#?[0-9a-fA-F]{3,8}$/.test(parts[2]) ? (parts[2].startsWith('#') ? parts[2] : `#${parts[2]}`) : null;
    out.push({ text: t, bg, fg });
  }
  return out;
}

// ─── Split chips evenly across N rows, preserving order ─────────────────────
function chSplitRows(chips, rowCount) {
  const n = Math.max(1, Math.min(8, parseInt(rowCount, 10) || 1));
  if (chips.length === 0) return Array.from({ length: n }, () => []);
  const rows = Array.from({ length: n }, () => []);
  const per = Math.ceil(chips.length / n);
  for (let i = 0; i < chips.length; i++) {
    const r = Math.min(n - 1, Math.floor(i / per));
    rows[r].push(chips[i]);
  }
  return rows;
}

// ─── Pick a {bg, fg} pair given index, mode and palette ─────────────────────
function chPickColors(idx, mode, palette, rng) {
  const safe = Array.isArray(palette) && palette.length > 0
    ? palette
    : [{ bg: '#5a1f23', fg: '#f0d871' }, { bg: '#f0d871', fg: '#5a1f23' }];
  if (mode === 'mono') return safe[0];
  if (mode === 'random') return safe[Math.floor(rng() * safe.length)];
  // alternate
  return safe[idx % safe.length];
}

// ─── Component ──────────────────────────────────────────────────────────────
function ChipsDiagram({
  chipsText      = 'focus\ntech-equipped\ncreativity\ncoffee\ncommunity\ncoworking\nproductivity\ninspiration\nflexible\nworkshops\ncollaboration\nstudio',
  rows           = 3,
  colorMode      = 'alternate',
  palette        = [{ bg: '#5a1f23', fg: '#f0d871' }, { bg: '#f0d871', fg: '#5a1f23' }],
  borderRadius   = 999,
  paddingX       = 18,
  paddingY       = 8,
  gap            = 10,
  fontSize       = 16,
  fontWeight     = 600,
  animation      = 'none',
  pulseDuration  = 2400,
  align          = 'center',
  valign         = 'middle',
}) {
  const parsed = chUseMemo(() => chParseChips(chipsText), [chipsText]);
  const grid = chUseMemo(() => chSplitRows(parsed, rows), [parsed, rows]);

  // ── Scale-to-fit ──
  // Render the chip stack at its natural size in `contentRef`, measure it via
  // offsetWidth/offsetHeight (which ignore transforms), then scale uniformly
  // so the whole stack fits the container with a small margin.
  const containerRef = chUseRef(null);
  const contentRef   = chUseRef(null);
  const [scale, setScale] = chUseState(1);

  chUseLayoutEffect(() => {
    let raf = 0;
    const recompute = () => {
      if (!containerRef.current || !contentRef.current) return;
      const cw = containerRef.current.clientWidth  - 16; // 8px breathing room each side
      const ch = containerRef.current.clientHeight - 16;
      const nw = contentRef.current.offsetWidth;
      const nh = contentRef.current.offsetHeight;
      if (cw <= 0 || ch <= 0 || nw <= 0 || nh <= 0) return;
      const s = Math.min(1, cw / nw, ch / nh);
      setScale(prev => Math.abs(prev - s) > 0.001 ? s : prev);
    };
    // Initial measure on the next frame so layout is stable.
    raf = requestAnimationFrame(recompute);
    const ro = new ResizeObserver(() => recompute());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [chipsText, rows, fontSize, paddingX, paddingY, gap, fontWeight, borderRadius]);

  const justifyH =
    align === 'left'  ? 'flex-start' :
    align === 'right' ? 'flex-end'   : 'center';
  const justifyV =
    valign === 'top'    ? 'flex-start' :
    valign === 'bottom' ? 'flex-end'   : 'center';
  // Transform origin so that scale shrinks toward the chosen alignment corner,
  // keeping the chip block visually anchored to the user's chosen side.
  const originX = align  === 'left' ? '0%' : align  === 'right'  ? '100%' : '50%';
  const originY = valign === 'top'  ? '0%' : valign === 'bottom' ? '100%' : '50%';

  // Animation CSS — kept inline so the diagram has no external dependency.
  // Pulse uses both transform (more visible at any scale) and box-shadow ring
  // so the effect reads on any background.
  const animCss = `
    @keyframes gs-chip-pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0); }
      50%      { transform: scale(1.06); box-shadow: 0 0 0 6px rgba(255,255,255,0.10); }
    }
    @keyframes gs-chip-fade {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.55; }
    }
  `;

  // Per-render counter + fresh RNG so palette assignment is deterministic.
  let idx = 0;
  const rng = chRng((parsed.length || 1) * 7919 + (Number(rows) || 1));

  return (
    <div ref={containerRef} style={{
      width: '100%', height: '100%',
      display: 'flex',
      justifyContent: justifyH, alignItems: justifyV,
      padding: '8px',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      <style>{animCss}</style>
      <div ref={contentRef} style={{
        display: 'inline-flex', flexDirection: 'column',
        gap: `${gap}px`,
        transform: `scale(${scale})`,
        transformOrigin: `${originX} ${originY}`,
        // Critical: do NOT shrink based on flex parent — we want the natural
        // size for measurement. The CSS scale above is what fits-to-cell.
        flex: '0 0 auto',
      }}>
        {grid.map((row, ri) => (
          <div key={ri} style={{
            display: 'flex', flexWrap: 'nowrap',
            justifyContent: justifyH, alignItems: 'center',
            gap: `${gap}px`,
          }}>
            {row.map((c) => {
              const pick = chPickColors(idx, colorMode, palette, rng);
              const bg = c.bg || pick.bg;
              const fg = c.fg || pick.fg;
              const animName =
                animation === 'pulse' ? 'gs-chip-pulse' :
                animation === 'fade'  ? 'gs-chip-fade'  : '';
              const dur = Math.max(400, parseInt(pulseDuration, 10) || 2400);
              const delay = (idx * 137) % dur;
              const thisIdx = idx;
              idx += 1;
              return (
                <span key={`${ri}-${thisIdx}`} style={{
                  display: 'inline-block',
                  padding: `${paddingY}px ${paddingX}px`,
                  background: bg, color: fg,
                  borderRadius: `${borderRadius}px`,
                  fontSize: `${fontSize}px`, fontWeight,
                  lineHeight: 1.2, whiteSpace: 'nowrap',
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  willChange: animName ? 'transform, box-shadow, opacity' : 'auto',
                  animation: animName
                    ? `${animName} ${dur}ms ease-in-out ${delay}ms infinite`
                    : 'none',
                }}>{c.text}</span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ChipsDiagram });

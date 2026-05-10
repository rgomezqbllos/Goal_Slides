// chips.jsx
// Rows of pill-style chips, responsive to text length, centered with even
// spacing. Colors come from a small palette (alternating or random) and can be
// overridden per chip via "text|#bg|#fg" syntax in the textarea. An optional
// "pulse" animation gently breathes the chip background.
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
//   align           'left'   | 'center' | 'right'    (horizontal, per row)
//   valign          'top'    | 'middle' | 'bottom'   (vertical inside cell)
//   background      Cell background color (or 'transparent')

const { useMemo: chUseMemo } = React;

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
  background     = 'transparent',
}) {
  const parsed = chUseMemo(() => chParseChips(chipsText), [chipsText]);
  const grid = chUseMemo(() => chSplitRows(parsed, rows), [parsed, rows]);

  const justify =
    align === 'left'  ? 'flex-start' :
    align === 'right' ? 'flex-end'   : 'center';
  const alignItems =
    valign === 'top'    ? 'flex-start' :
    valign === 'bottom' ? 'flex-end'   : 'center';

  // Animation CSS (kept inline so the diagram has no external CSS dependency)
  const animCss = `
    @keyframes gs-chip-pulse {
      0%, 100% { filter: brightness(1); }
      50%      { filter: brightness(1.15); }
    }
    @keyframes gs-chip-fade {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.55; }
    }
  `;

  // Per-render counter + fresh RNG so palette assignment is deterministic and
  // stable across renders (seeded by content + row count).
  let idx = 0;
  const rng = chRng((parsed.length || 1) * 7919 + (Number(rows) || 1));

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      justifyContent: alignItems, alignItems: 'stretch',
      padding: `${Math.max(8, gap)}px ${Math.max(12, gap * 1.4)}px`,
      gap: `${gap}px`,
      background: background || 'transparent',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      <style>{animCss}</style>
      {grid.map((row, ri) => (
        <div key={ri} style={{
          display: 'flex', flexWrap: 'wrap',
          justifyContent: justify, alignItems: 'center',
          gap: `${gap}px`,
        }}>
          {row.map((c) => {
            const pick = chPickColors(idx, colorMode, palette, rng);
            const bg = c.bg || pick.bg;
            const fg = c.fg || pick.fg;
            const animName =
              animation === 'pulse' ? 'gs-chip-pulse' :
              animation === 'fade'  ? 'gs-chip-fade'  : 'none';
            const delay = (idx * 137) % Math.max(400, pulseDuration);
            idx += 1;
            return (
              <span key={`${ri}-${idx}`} style={{
                display: 'inline-block',
                padding: `${paddingY}px ${paddingX}px`,
                background: bg, color: fg,
                borderRadius: `${borderRadius}px`,
                fontSize: `${fontSize}px`, fontWeight,
                lineHeight: 1.2, whiteSpace: 'nowrap',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                animation: animName === 'none'
                  ? 'none'
                  : `${animName} ${pulseDuration}ms ease-in-out ${delay}ms infinite`,
              }}>{c.text}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { ChipsDiagram });

// kpi-counter.jsx
// Parametric, animated KPI counter. Tween from `from` to `to` over `duration`.
// While tweening, the displayed color crosses user-defined thresholds. The
// value is formatted as number / integer / time (HH:MM:SS) / date and can be
// flanked by a prefix and a free-text suffix ($, %, COP, USD, hours…).

const { useEffect: kpiUseEffect, useState: kpiUseState } = React;

// ─── Easing ──────────────────────────────────────────────────────────────────
const KPI_EASINGS = {
  linear:        t => t,
  'ease-in':     t => t * t,
  'ease-out':    t => 1 - Math.pow(1 - t, 3),
  'ease-in-out': t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2,
};

// ─── Color picker by % of journey ────────────────────────────────────────────
// stops = [{ at: number /* 0..100 */, color: '#hex' }] — picks the largest
// stop whose `at` is ≤ the current progress percent. Works for both
// ascending (from < to) and descending (from > to) animations.
function progressOf(value, from, to) {
  const f = parseFloat(from), t = parseFloat(to);
  if (!Number.isFinite(f) || !Number.isFinite(t) || f === t) return 1;
  const p = (value - f) / (t - f);
  return Math.max(0, Math.min(1, p));
}

function pickKPIColor(value, stops, from, to) {
  if (!Array.isArray(stops) || stops.length === 0) return '#42dcc6';
  const pct = progressOf(value, from, to) * 100;
  const sorted = [...stops].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  let chosen = sorted[0].color || '#42dcc6';
  for (const s of sorted) {
    if (pct >= (s.at ?? 0)) chosen = s.color || chosen;
  }
  return chosen;
}

// Build a CSS linear-gradient that paints all the stops along a 0-100% strip.
// Used by the optional progress bar to look like a multi-color buffer.
function stopsGradientCss(stops) {
  if (!Array.isArray(stops) || stops.length === 0) return '#42dcc6';
  const sorted = [...stops].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const parts = sorted.map(s => {
    const at = Math.max(0, Math.min(100, parseFloat(s.at) || 0));
    return `${s.color || '#42dcc6'} ${at}%`;
  });
  if (parts.length === 1) return parts[0].split(' ')[0];
  return `linear-gradient(90deg, ${parts.join(', ')})`;
}

// ─── Number formatting ──────────────────────────────────────────────────────
function pad2(n) { return String(n).padStart(2, '0'); }

function formatKPIValue(value, format, decimals) {
  if (!Number.isFinite(value)) return '—';
  if (format === 'integer') {
    return Math.round(value).toLocaleString('en-US');
  }
  if (format === 'time') {
    // value is total seconds → HH:MM:SS
    const total = Math.max(0, Math.floor(value));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }
  if (format === 'date') {
    // value is a unix timestamp (ms)
    return new Date(value).toLocaleDateString();
  }
  // 'number' / 'decimal' — locked to en-US so split on '.' is safe later.
  const d = Math.max(0, parseInt(decimals, 10) || 0);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

// Split formatted string into integer + decimal parts so the renderer can
// style them differently (decimals muted, mirrors the gallery thumb style).
function splitKPI(formatted, format) {
  if (format === 'time' || format === 'date' || format === 'integer') {
    return { int: formatted, dec: '' };
  }
  const idx = formatted.lastIndexOf('.');
  if (idx < 0) return { int: formatted, dec: '' };
  return { int: formatted.slice(0, idx), dec: formatted.slice(idx) };
}

// ─── Component ──────────────────────────────────────────────────────────────
function KPICounter({
  from = 0,
  to = 100,
  duration = 2000,    // ms
  decimals = 1,
  format = 'number',  // 'number' | 'integer' | 'time' | 'date'
  prefix = '',
  suffix = '%',
  caption = '',
  size = 'lg',         // 'sm' | 'md' | 'lg' | 'xl'
  align = 'center',    // 'left' | 'center' | 'right' (horizontal)
  valign = 'middle',   // 'top'  | 'middle' | 'bottom' (vertical)
  colorStops = [
    { at: 0,  color: '#ff7775' },
    { at: 60, color: '#fae374' },
    { at: 90, color: '#42dcc6' },
  ],
  easing = 'ease-out',
  showProgress = false,
}) {
  const [value, setValue] = kpiUseState(parseFloat(from) || 0);

  // Ramp animation. Re-runs whenever the meaningful inputs change so the
  // editor's live preview reflects every tweak.
  kpiUseEffect(() => {
    const f = parseFloat(from);
    const tval = parseFloat(to);
    const dur = Math.max(0, parseInt(duration, 10) || 0);
    if (!Number.isFinite(f) || !Number.isFinite(tval)) { setValue(0); return; }
    if (dur === 0 || f === tval) { setValue(tval); return; }
    setValue(f);
    let raf, start = null;
    const ease = KPI_EASINGS[easing] || KPI_EASINGS['ease-out'];
    const tick = (now) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / dur);
      const eased = ease(t);
      setValue(f + (tval - f) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(tval);
    };
    raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [from, to, duration, easing]);

  const color     = pickKPIColor(value, colorStops, from, to);
  const formatted = formatKPIValue(value, format, decimals);
  const parts     = splitKPI(formatted, format);

  const SIZE_EM = { sm: '2.5em', md: '4em', lg: '6em', xl: '9em' };
  const fontSize = SIZE_EM[size] || SIZE_EM.lg;
  const justifyH = align === 'left'  ? 'flex-start' : align === 'right'  ? 'flex-end' : 'center';
  const justifyV = valign === 'top'  ? 'flex-start' : valign === 'bottom' ? 'flex-end' : 'center';

  const progress = progressOf(value, from, to); // 0..1
  const gradientCss = stopsGradientCss(colorStops);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: justifyH, justifyContent: justifyV,
      height: '100%', gap: '0.4em', padding: '1em',
    }}>
      <div style={{
        fontSize, fontWeight: 800, letterSpacing: '-0.02em',
        display: 'flex', alignItems: 'baseline', gap: '0.04em',
        lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        color, textAlign: align,
      }}>
        {prefix && (
          <span style={{ fontSize: '0.42em', color: '#bbcac5', marginRight: '0.12em', fontWeight: 700 }}>
            {prefix}
          </span>
        )}
        <span>{parts.int}</span>
        {parts.dec && <span style={{ color: '#464a6c' }}>{parts.dec}</span>}
        {suffix && (
          <span style={{ fontSize: '0.38em', color: '#859490', marginLeft: '0.18em', fontWeight: 700 }}>
            {suffix}
          </span>
        )}
      </div>

      {caption && (
        <div style={{
          fontSize: '0.95em', color: '#bbcac5', letterSpacing: '0.04em',
          textAlign: align, lineHeight: 1.4, maxWidth: '90%',
        }}>{caption}</div>
      )}

      {showProgress && (
        <div style={{
          width: '80%', maxWidth: '28em', height: '0.5em',
          background: '#0d1228', border: '1px solid #1c2341',
          position: 'relative', overflow: 'hidden',
          borderRadius: '0.25em', marginTop: '0.6em',
        }}>
          {/* Multi-color gradient track painted across all stops */}
          <div style={{ position: 'absolute', inset: 0, background: gradientCss }}/>
          {/* Mask covering the unfilled portion — retreats as progress grows */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: `${(1 - progress) * 100}%`,
            background: '#0d1228',
            transition: 'width 0.08s linear',
          }}/>
          {/* Subtle border highlight on the filled edge */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${progress * 100}%`,
            width: 1, background: 'rgba(255,255,255,0.18)',
            transition: 'left 0.08s linear',
            display: progress > 0 && progress < 1 ? 'block' : 'none',
          }}/>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { KPICounter, formatKPIValue, pickKPIColor, progressOf, stopsGradientCss, KPI_EASINGS });

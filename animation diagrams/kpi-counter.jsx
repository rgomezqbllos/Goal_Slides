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

// ─── Color picker by threshold ───────────────────────────────────────────────
// stops = [{ at: number, color: '#hex' }] — picks the largest stop whose
// `at` is ≤ value. Works for ascending or descending animations.
function pickKPIColor(value, stops) {
  if (!Array.isArray(stops) || stops.length === 0) return '#42dcc6';
  const sorted = [...stops].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  let chosen = sorted[0].color || '#42dcc6';
  for (const s of sorted) {
    if (value >= (s.at ?? 0)) chosen = s.color || chosen;
  }
  return chosen;
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
  size = 'lg',        // 'sm' | 'md' | 'lg' | 'xl'
  align = 'center',   // 'left' | 'center' | 'right'
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

  const color     = pickKPIColor(value, colorStops);
  const formatted = formatKPIValue(value, format, decimals);
  const parts     = splitKPI(formatted, format);

  const SIZE_EM = { sm: '2.5em', md: '4em', lg: '6em', xl: '9em' };
  const fontSize = SIZE_EM[size] || SIZE_EM.lg;
  const justify  = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  // 0..1 progress for optional bar
  const f = parseFloat(from), tval = parseFloat(to);
  const progress = (tval === f) ? 1 : Math.max(0, Math.min(1, (value - f) / (tval - f)));

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: justify,
      justifyContent: 'center', height: '100%', gap: '0.4em', padding: '1em',
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
          width: '70%', maxWidth: '24em', height: '0.18em',
          background: '#1c2341', marginTop: '0.4em',
        }}>
          <div style={{
            width: `${progress * 100}%`, height: '100%',
            background: color, transition: 'width 0.08s linear',
          }}/>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { KPICounter, formatKPIValue, pickKPIColor, KPI_EASINGS });

// editor/EditorShell.jsx — Full editor UI
// Exports: EditorShell

const { useState: useS, useEffect: useE, useRef: useR, useCallback: useCB } = React;

// ─── UI helpers ───────────────────────────────────────────────────────────────
const EIcon = ({ name, size = 18, style = {} }) => (
  <span className="material-symbols-outlined"
    style={{ fontSize: size, lineHeight: 1, fontVariationSettings: "'FILL' 0,'wght' 300", display: 'inline-block', ...style }}>{name}</span>
);

const Btn = ({ onClick, title, children, active, danger, small, style: s = {} }) => (
  <button onClick={onClick} title={title} style={{
    background: active ? 'rgba(66,220,198,0.15)' : danger ? 'rgba(255,119,117,0.1)' : 'transparent',
    border: `1px solid ${active ? '#42dcc6' : danger ? '#ff7775' : '#464a6c'}`,
    color: active ? '#42dcc6' : danger ? '#ff7775' : '#bbcac5',
    cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
    fontSize: small ? 10 : 11, fontWeight: 600, letterSpacing: '0.06em',
    textTransform: 'uppercase', padding: small ? '4px 8px' : '6px 12px',
    display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s', ...s
  }}>{children}</button>
);

const Input = ({ value, onChange, placeholder, multiline, style: s = {} }) => {
  const base = {
    background: '#0d1228', border: '1px solid #464a6c', color: '#dde4e1',
    fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, padding: '7px 10px',
    outline: 'none', width: '100%', resize: multiline ? 'vertical' : 'none', ...s
  };
  return multiline
    ? <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={base} />
    : <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />;
};

const Select = ({ value, onChange, options, style: s = {} }) => (
  <select value={value || ''} onChange={e => onChange(e.target.value)} style={{
    background: '#0d1228', border: '1px solid #464a6c', color: '#dde4e1',
    fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, padding: '7px 10px',
    outline: 'none', width: '100%', cursor: 'pointer', appearance: 'none', ...s
  }}>
    {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
  </select>
);

const Label = ({ children, style: s = {} }) => (
  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#859490', marginBottom: 4, ...s }}>{children}</div>
);

const Divider = () => <div style={{ height: 1, background: '#1c2341', margin: '12px 0' }} />;

// ─── Column Layout Picker ────────────────────────────────────────────────────
const COL_PRESETS = [
  { label: '1',     cols: ['1fr'] },
  { label: '1:1',   cols: ['1fr', '1fr'] },
  { label: '2:1',   cols: ['2fr', '1fr'] },
  { label: '1:2',   cols: ['1fr', '2fr'] },
  { label: '1:1:1', cols: ['1fr', '1fr', '1fr'] },
  { label: '2:1:1', cols: ['2fr', '1fr', '1fr'] },
  { label: '1:1:2', cols: ['1fr', '1fr', '2fr'] },
];

// ─── Path helpers ─────────────────────────────────────────────────────────────
// selPath = null | [[ri,ci], [ri2,ci2], ...]
// parentContainerPath = selPath.slice(0,-1)  ([] means slide-level rows)

function getCellAtPath(slide, path) {
  if (!path || path.length === 0) return null;
  let rows = slide.rows;
  let cell = null;
  for (const [ri, ci] of path) {
    if (!rows || !rows[ri] || !rows[ri].cells) return null;
    cell = rows[ri].cells[ci];
    if (!cell) return null;
    if (cell.rows) rows = cell.rows;
  }
  return cell;
}

// Get the rows array for a container at containerPath ([] = slide.rows)
function getContainerRows(slide, containerPath) {
  if (containerPath.length === 0) return slide.rows;
  const cell = getCellAtPath(slide, containerPath);
  return cell ? (cell.rows || []) : [];
}

// Immutably update cell at path using fn(oldCell) => newCell
function setAtPath(slide, path, fn) {
  function recurse(rows, remaining) {
    const [ri, ci] = remaining[0];
    return rows.map((row, r) => r !== ri ? row : {
      ...row,
      cells: row.cells.map((cell, c) => c !== ci ? cell :
        remaining.length === 1
          ? fn(cell)
          : { ...cell, rows: recurse(cell.rows || [], remaining.slice(1)) }
      )
    });
  }
  return { ...slide, rows: recurse(slide.rows, path) };
}

// Update the rows array at a container path ([] = slide-level rows)
function setContainerRows(slide, containerPath, fn) {
  if (containerPath.length === 0) return { ...slide, rows: fn(slide.rows) };
  return setAtPath(slide, containerPath, cell => ({ ...cell, rows: fn(cell.rows || []) }));
}

// ─── Array Item Editor ────────────────────────────────────────────────────────
function ArrayEditor({ items = [], onChange, fields, addLabel = '+ Add item', defaultItem }) {
  const add = () => onChange([...items, { ...defaultItem, id: uid() }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, k, v) => onChange(items.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={item.id || i} style={{ background: '#111633', border: '1px solid #1c2341', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: '#464a6c', fontWeight: 600 }}>#{i + 1}</span>
            <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#ff7775', cursor: 'pointer', fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 600 }}>✕ Remove</button>
          </div>
          {fields.map(f => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              {f.type === 'select'
                ? <Select value={item[f.key]} onChange={v => update(i, f.key, v)} options={f.options} />
                : f.type === 'checkbox'
                  ? <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!item[f.key]} onChange={e => update(i, f.key, e.target.checked)} />
                      <span style={{ fontSize: 11, color: '#bbcac5' }}>Active / Done</span>
                    </label>
                  : <Input value={item[f.key]} onChange={v => update(i, f.key, v)} placeholder={f.placeholder} />
              }
            </div>
          ))}
        </div>
      ))}
      <button onClick={add} style={{ background: 'none', border: '1px dashed #464a6c', color: '#42dcc6', cursor: 'pointer', padding: '7px', fontSize: 11, fontWeight: 600, fontFamily: 'Space Grotesk', letterSpacing: '0.06em' }}>{addLabel}</button>
    </div>
  );
}

// ─── Slide Tree (recursive, path-aware) ──────────────────────────────────────
function SlideTree({ slide, selPath, selMulti, onSelectPath, onSetMulti, lang, accent }) {
  if (!slide) return null;

  const BLOCK_ICONS = {
    title:'title', text:'notes', checklist:'checklist', timeline:'linear_scale',
    metrics:'monitoring', table:'table_chart', chart:'bar_chart', cta:'smart_button',
    divider:'horizontal_rule', image:'image', empty:'crop_square',
  };

  // Only top-level cells participate in multi-select (for simplicity)
  const topCells = [];
  (slide.rows||[]).forEach((row, ri) => (row.cells||[]).forEach((_, ci) => topCells.push([[ri,ci]])));
  const isTopChecked = (p) => selMulti.some(sp => pathsEqual(sp, p));
  const allChecked = topCells.length > 0 && topCells.every(p => isTopChecked(p));

  const toggleAll = () => onSetMulti(allChecked ? [] : topCells);
  const toggleOne = (p) => {
    if (isTopChecked(p)) onSetMulti(selMulti.filter(sp => !pathsEqual(sp, p)));
    else onSetMulti([...selMulti, p]);
  };

  // Recursive cell renderer
  function renderCell(cell, path, depth) {
    const isSelected = selPath && pathsEqual(path, selPath);
    const isContainer = !!cell.rows;
    const isTop = depth === 0;
    const checked = isTop && isTopChecked(path);
    const cnt = (!isContainer && cell.content) ? (cell.content[lang] || cell.content['en'] || cell.content[Object.keys(cell.content)[0]] || {}) : {};
    const preview = cnt.title || cnt.label || cnt.body?.slice(0, 30) || '';
    const [ri, ci] = path[path.length - 1];

    return (
      <div key={cell.id || path.toString()}>
        {/* Cell row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: `5px 8px 5px ${14 + depth * 14}px`,
          marginBottom: 2, cursor: 'pointer',
          background: isSelected ? 'rgba(66,220,198,0.14)' : checked ? 'rgba(66,220,198,0.07)' : '#0a0f26',
          border: `1px solid ${isSelected ? accent : checked ? 'rgba(66,220,198,0.35)' : '#1c2341'}`,
          transition: 'all 0.1s',
        }}>
          {/* Checkbox — only for top-level cells */}
          {isTop && (
            <label style={{ display: 'flex', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={checked} onChange={() => toggleOne(path)}
                style={{ accentColor: accent, width: 11, height: 11 }} />
            </label>
          )}
          {/* Depth indicator */}
          {depth > 0 && (
            <div style={{ width: 2, height: 14, background: `rgba(66,220,198,${0.25 * depth})`, flexShrink: 0 }} />
          )}
          {/* Icon */}
          <span className="material-symbols-outlined" style={{
            fontSize: 13, color: isSelected ? accent : isContainer ? 'rgba(66,220,198,0.5)' : '#859490',
            fontVariationSettings: "'FILL' 0,'wght' 300", flexShrink: 0
          }}>
            {isContainer ? 'grid_view' : (BLOCK_ICONS[cell.block] || 'crop_square')}
          </span>
          {/* Label */}
          <div style={{ flex: 1, minWidth: 0 }} onClick={() => onSelectPath(path)}>
            <div style={{ fontSize: 10, fontWeight: 700, color: isSelected ? accent : '#dde4e1', textTransform: 'capitalize' }}>
              {isContainer ? `container` : cell.block}
              {depth > 0 && <span style={{ color: '#464a6c', fontWeight: 400, fontSize: 9 }}> r{ri+1}·c{ci+1}</span>}
            </div>
            {preview && !isContainer && (
              <div style={{ fontSize: 9, color: '#859490', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</div>
            )}
          </div>
        </div>
        {/* Nested rows for container cells */}
        {isContainer && cell.rows && cell.rows.map((subRow, sri) => (
          <div key={subRow.id || sri}>
            {/* Sub-row label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: `2px 8px 2px ${22 + depth * 14}px` }}>
              <span className="material-symbols-outlined" style={{ fontSize: 9, color: '#1c2341', fontVariationSettings: "'FILL' 0,'wght' 300" }}>table_rows</span>
              <span style={{ fontSize: 8, color: '#1c2341', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Row {sri + 1} · {(subRow.cols||['1fr']).map(c=>c.replace('fr','')).join(':')}
              </span>
            </div>
            {(subRow.cells || []).map((subCell, sci) =>
              renderCell(subCell, [...path, [sri, sci]], depth + 1)
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid #1c2341' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={allChecked} onChange={toggleAll}
            style={{ accentColor: accent, width: 11, height: 11 }} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#859490' }}>
            Elements — {topCells.length}
          </span>
        </label>
        {selMulti.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 9, color: accent, fontWeight: 700 }}>
            {selMulti.length} sel.
          </span>
        )}
      </div>

      {(slide.rows || []).map((row, ri) => (
        <div key={row.id || ri} style={{ marginBottom: 4 }}>
          {/* Row label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0 2px 2px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 10, color: '#2a3060', fontVariationSettings: "'FILL' 0,'wght' 300" }}>table_rows</span>
            <span style={{ fontSize: 8, color: '#2a3060', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Row {ri + 1} · {(row.cols || ['1fr']).map(c => c.replace('fr', '')).join(':')}
            </span>
          </div>
          {(row.cells || []).map((cell, ci) => renderCell(cell, [[ri, ci]], 0))}
        </div>
      ))}
    </div>
  );
}

// ─── Multi-Edit Panel ─────────────────────────────────────────────────────────
function MultiEditPanel({ project, slideIdx, selMulti, onUpdateCell, lang, accent }) {
  const slide = project.slides[slideIdx];
  // selMulti items are paths like [[ri,ci]]
  const cells = selMulti.map(path => {
    const [ri, ci] = path[0];
    const cell = slide?.rows[ri]?.cells[ci];
    return cell ? { path, ri, ci, cell } : null;
  }).filter(Boolean);

  const blockTypes = [...new Set(cells.map(x => x.cell.block).filter(Boolean))];
  const hasTitles = blockTypes.includes('title');

  const applyToAll = (updater) => {
    cells.forEach(({ path, cell }) => {
      if (cell.rows) return; // skip containers
      const cur = cell.content[lang] || cell.content['en'] || {};
      const updates = updater(cur, cell.block);
      if (!updates) return;
      const nc = { ...cell.content, [lang]: { ...cur, ...updates } };
      onUpdateCell(slideIdx, path, { ...cell, content: nc });
    });
  };

  const BLOCK_ICONS = { title:'title', text:'notes', checklist:'checklist', timeline:'linear_scale',
    metrics:'monitoring', table:'table_chart', chart:'bar_chart', cta:'smart_button',
    divider:'horizontal_rule', image:'image', empty:'crop_square' };

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', flex: 1 }}>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>
          {cells.length} blocks selected
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {cells.map(({ path, ri, ci, cell }) => (
            <div key={`${ri}-${ci}`} style={{ background: '#0d1228', border: '1px solid #1c2341',
              padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: '#bbcac5' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'FILL' 0,'wght' 300" }}>{BLOCK_ICONS[cell.block]||'crop_square'}</span>
              R{ri+1}·C{ci+1} <span style={{ color: '#464a6c' }}>{cell.block}</span>
            </div>
          ))}
        </div>
      </div>

      {hasTitles && (
        <div>
          <Label>Size (title blocks)</Label>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['sm','S'],['md','M'],['lg','L'],['xl','XL']].map(([v, label]) => (
              <button key={v} onClick={() => applyToAll((cur, b) => b === 'title' ? { size: v } : null)} style={{
                flex: 1, padding: '5px', fontSize: 10, fontWeight: 700, background: '#0d1228',
                border: '1px solid #464a6c', color: '#bbcac5', cursor: 'pointer', fontFamily: 'Space Grotesk' }}>{label}</button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label>Change type for all</Label>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {BLOCKS_META.map(b => (
            <button key={b.id} onClick={() => cells.forEach(({ path, cell }) => {
              if (!cell.rows) onUpdateCell(slideIdx, path, { ...cell, block: b.id });
            })} style={{ padding: '4px 8px', fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'Space Grotesk',
              background: '#0d1228', border: '1px solid #464a6c', color: '#859490', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
function PropSection({ title, icon, defaultOpen = true, children, badge }) {
  const [open, setOpen] = useS(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid #1c2341', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
        fontFamily: 'Space Grotesk', textAlign: 'left',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#464a6c', fontVariationSettings: "'FILL' 0,'wght' 300", flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#859490', flex: 1 }}>{title}</span>
        {badge && <span style={{ fontSize: 8, background: 'rgba(66,220,198,0.12)', color: '#42dcc6', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{badge}</span>}
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#464a6c', fontVariationSettings: "'FILL' 0,'wght' 300" }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && <div style={{ padding: '0 16px 12px' }}>{children}</div>}
    </div>
  );
}

// ─── Chart ↔ Table Linker ─────────────────────────────────────────────────────
function ChartTableLinker({ project, slideIdx, content, setContent }) {
  // Collect all table cells across all slides
  const allTables = [];
  project.slides.forEach((sl, si) => {
    function scanRows(rows) {
      (rows || []).forEach((row) => {
        (row.cells || []).forEach((cell) => {
          if (cell.block === 'table') {
            const c = cell.content?.en || cell.content?.es || {};
            allTables.push({ slideIdx: si, cellId: cell.id, label: `Slide ${si+1} — ${sl.label||'Slide'}: ${c.title || 'Table'}`, headers: c.headers || [], rows: c.rows || [] });
          }
          if (cell.rows) scanRows(cell.rows);
        });
      });
    }
    scanRows(sl.rows);
  });

  const linked = content.linkedTable || null;
  const source = linked ? allTables.find(t => t.cellId === linked.cellId) : null;
  const headers = source ? source.headers : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Source table picker */}
      <div>
        <Label>Source table</Label>
        <Select
          value={linked?.cellId || ''}
          onChange={v => {
            if (!v) { setContent({ linkedTable: null }); return; }
            const tbl = allTables.find(t => t.cellId === v);
            setContent({ linkedTable: { cellId: v, xCol: 0, yCols: [1] } });
          }}
          options={[
            { value: '', label: '— Manual data —' },
            ...allTables.map(t => ({ value: t.cellId, label: t.label }))
          ]}
        />
      </div>

      {source && headers.length > 0 && (<>
        {/* X axis column */}
        <div>
          <Label>X axis (labels column)</Label>
          <Select
            value={String(linked.xCol ?? 0)}
            onChange={v => setContent({ linkedTable: { ...linked, xCol: parseInt(v) } })}
            options={headers.map((h, i) => ({ value: String(i), label: `Col ${i+1}: ${h}` }))}
          />
        </div>

        {/* Y axis columns */}
        <div>
          <Label>Y axis (data columns — check to include)</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            {headers.map((h, i) => {
              if (i === (linked.xCol ?? 0)) return null;
              const checked = (linked.yCols || []).includes(i);
              return (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked}
                    style={{ accentColor: '#42dcc6', width: 11, height: 11 }}
                    onChange={e => {
                      const yCols = checked
                        ? (linked.yCols || []).filter(c => c !== i)
                        : [...(linked.yCols || []), i];
                      setContent({ linkedTable: { ...linked, yCols } });
                    }}/>
                  <span style={{ fontSize: 11, color: '#bbcac5' }}>{h || `Col ${i+1}`}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div style={{ background: '#0d1228', border: '1px solid #1c2341', padding: '8px 10px', fontSize: 9, color: '#859490', lineHeight: 1.7 }}>
          <div style={{ color: '#42dcc6', fontWeight: 700, marginBottom: 4 }}>Preview</div>
          <div>X: <span style={{ color: '#dde4e1' }}>{headers[linked.xCol ?? 0]}</span></div>
          <div>Y: <span style={{ color: '#dde4e1' }}>{(linked.yCols||[]).map(i => headers[i]).join(', ') || '—'}</span></div>
          <div>Rows: <span style={{ color: '#dde4e1' }}>{source.rows.length}</span></div>
        </div>
      </>)}

      {!source && allTables.length === 0 && (
        <p style={{ fontSize: 10, color: '#464a6c', lineHeight: 1.5 }}>No table blocks found in this project. Add a Table block to link data.</p>
      )}
    </div>
  );
}

// ─── Properties Panel ─────────────────────────────────────────────────────────
function PropertiesPanel({ project, slideIdx, selPath, onUpdateCell, onUpdateSlide, lang, setLang, onSelectPath, accent }) {
  const slide = project.slides[slideIdx];
  const [selMulti, setSelMulti] = useS([]);

  const cell = slide && selPath ? getCellAtPath(slide, selPath) : null;
  const isContainer = cell && !!cell.rows;
  const content = (cell && !isContainer) ? (cell.content[lang] || cell.content['en'] || {}) : {};

  const setContent = (updates) => {
    if (!cell || isContainer) return;
    const newContent = { ...cell.content, [lang]: { ...content, ...updates } };
    onUpdateCell(slideIdx, selPath, { ...cell, content: newContent });
  };
  const setArrayContent = (key, val) => setContent({ [key]: val });

  const activeMulti = selMulti.length > 0;
  const LANGS = ['en', 'es', 'pt', 'it', 'fr', 'nl', 'ar'];

  if (!slide) return <div style={{ padding: 20, color: '#464a6c', fontSize: 12 }}>No slide selected</div>;

  // Count top-level cells for tree badge
  const topCellCount = (slide.rows || []).reduce((a, r) => a + (r.cells||[]).length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Slide ── */}
      <PropSection title="Slide" icon="slideshow" defaultOpen={true}>
        <Label style={{ marginTop: 4 }}>Label</Label>
        <Input value={slide.label} onChange={v => onUpdateSlide(slideIdx, { label: v })} placeholder="e.g. Training" />
      </PropSection>

      {/* ── Design tree ── */}
      <PropSection title="Design tree" icon="account_tree" defaultOpen={true} badge={String(topCellCount)}>
        <div style={{ margin: '0 -16px' }}>
          <SlideTree
            slide={slide}
            selPath={selPath}
            selMulti={selMulti}
            onSelectPath={(p) => { onSelectPath(p); setSelMulti([]); }}
            onSetMulti={setSelMulti}
            lang={lang}
            accent={accent}
          />
        </div>
      </PropSection>

      {/* ── Multi-edit ── */}
      {activeMulti && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <MultiEditPanel project={project} slideIdx={slideIdx} selMulti={selMulti} onUpdateCell={onUpdateCell} lang={lang} accent={accent} />
        </div>
      )}

      {/* ── Single cell editor ── */}
      {!activeMulti && (
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Language */}
          <PropSection title="Language" icon="translate" defaultOpen={false}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {LANGS.map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  padding: '4px 8px', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'Space Grotesk',
                  border: `1px solid ${lang === l ? accent : '#464a6c'}`,
                  background: lang === l ? 'rgba(66,220,198,0.1)' : 'transparent',
                  color: lang === l ? accent : '#859490',
                }}>{l}</button>
              ))}
            </div>
          </PropSection>

          {/* Block type */}
          {cell && !isContainer && (
            <PropSection title="Block type" icon="widgets" defaultOpen={true} badge={cell.block}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                {BLOCKS_META.map(b => (
                  <button key={b.id} onClick={() => onUpdateCell(slideIdx, selPath, { ...cell, block: b.id })}
                    title={b.label} style={{
                      padding: '5px 8px', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                      cursor: 'pointer', fontFamily: 'Space Grotesk',
                      border: `1px solid ${cell.block === b.id ? accent : '#464a6c'}`,
                      background: cell.block === b.id ? 'rgba(66,220,198,0.1)' : 'transparent',
                      color: cell.block === b.id ? accent : '#859490',
                    }}>{b.label}</button>
                ))}
              </div>
            </PropSection>
          )}

          {/* Container info */}
          {cell && isContainer && (
            <PropSection title="Container" icon="grid_view" defaultOpen={true}>
              <div style={{ fontSize: 10, color: '#859490', marginTop: 4 }}>
                {cell.rows.length} row{cell.rows.length !== 1 ? 's' : ''} · {cell.rows.reduce((acc, r) => acc + r.cells.length, 0)} cells inside
              </div>
              <div style={{ fontSize: 9, color: '#464a6c', marginTop: 4 }}>Click sub-cells in the tree or canvas to edit them.</div>
            </PropSection>
          )}

          {/* Content */}
          {cell && !isContainer && (
            <PropSection title="Content" icon="edit_note" defaultOpen={true}>
              {!cell && <p style={{ fontSize: 11, color: '#464a6c' }}>Click a cell or select it from the tree.</p>}

              {cell.block === 'title' && <>
                <Label>Tag / Eyebrow</Label>
                <Input value={content.tag} onChange={v => setContent({ tag: v })} placeholder="e.g. Step 01" />
                <Divider />
                <Label>Title</Label>
                <Input value={content.title} onChange={v => setContent({ title: v })} multiline placeholder="Slide title" />
                <Divider />
                <Label>Subtitle</Label>
                <Input value={content.subtitle} onChange={v => setContent({ subtitle: v })} multiline placeholder="Supporting text" />
                <Divider />
                <Label>Size</Label>
                <Select value={content.size || 'lg'} onChange={v => setContent({ size: v })} options={[
                  { value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' },
                  { value: 'lg', label: 'Large' }, { value: 'xl', label: 'XL' }
                ]} />
              </>}

              {cell.block === 'text' && <>
                <Label>Body text</Label>
                <Input value={content.body} onChange={v => setContent({ body: v })} multiline placeholder="Paragraph text..." style={{ minHeight: 100 }} />
              </>}

              {cell.block === 'checklist' && <>
                <Label>Title</Label>
                <Input value={content.title} onChange={v => setContent({ title: v })} placeholder="e.g. Training Modules" />
                <Divider />
                <Label>Subtitle</Label>
                <Input value={content.subtitle} onChange={v => setContent({ subtitle: v })} placeholder="Supporting text" />
                <Divider />
                <Label>Items</Label>
                <ArrayEditor items={content.items || []} onChange={v => setArrayContent('items', v)}
                  addLabel="+ Add module"
                  defaultItem={{ title: 'New Module', desc: '', dur: '15 min', tag: 'Required', done: false }}
                  fields={[
                    { key: 'title', label: 'Title', placeholder: 'Module name' },
                    { key: 'desc', label: 'Description', placeholder: 'Short description' },
                    { key: 'dur', label: 'Duration', placeholder: '15 min' },
                    { key: 'tag', label: 'Tag', placeholder: 'Required / Optional' },
                    { key: 'done', label: 'Completed', type: 'checkbox' },
                  ]} />
              </>}

              {cell.block === 'timeline' && <>
                <Label>Title</Label>
                <Input value={content.title} onChange={v => setContent({ title: v })} placeholder="Timeline title" />
                <Divider />
                <Label>Subtitle</Label>
                <Input value={content.subtitle} onChange={v => setContent({ subtitle: v })} placeholder="Supporting text" />
                <Divider />
                <Label>Phases</Label>
                <ArrayEditor items={content.phases || []} onChange={v => setArrayContent('phases', v)}
                  addLabel="+ Add phase"
                  defaultItem={{ label: 'New Phase', desc: 'Description', active: false }}
                  fields={[
                    { key: 'label', label: 'Label', placeholder: 'Phase name' },
                    { key: 'desc', label: 'Description', placeholder: 'Short description' },
                    { key: 'active', label: 'Active', type: 'checkbox' },
                  ]} />
              </>}

              {cell.block === 'metrics' && <>
                <Label>Title</Label>
                <Input value={content.title} onChange={v => setContent({ title: v })} placeholder="Metrics title" />
                <Divider />
                <Label>Columns</Label>
                <Select value={String(content.cols || 3)} onChange={v => setContent({ cols: parseInt(v) })} options={['1', '2', '3', '4']} />
                <Divider />
                <Label>Metrics</Label>
                <ArrayEditor items={content.items || []} onChange={v => setArrayContent('items', v)}
                  addLabel="+ Add metric"
                  defaultItem={{ label: 'New Metric', value: '0', trend: '', color: '#42dcc6' }}
                  fields={[
                    { key: 'label', label: 'Label', placeholder: 'Metric name' },
                    { key: 'value', label: 'Value', placeholder: '0' },
                    { key: 'trend', label: 'Trend', placeholder: '+2.3%' },
                    { key: 'color', label: 'Color (hex)', placeholder: '#42dcc6' },
                  ]} />
              </>}

              {cell.block === 'table' && <>
                <Label>Title</Label>
                <Input value={content.title} onChange={v => setContent({ title: v })} placeholder="Table title" />
                <Divider />
                <Label>Headers (one per line)</Label>
                <Input value={(content.headers || []).join('\n')} onChange={v => setContent({ headers: v.split('\n').filter(Boolean) })} multiline placeholder="Column 1&#10;Column 2" />
                <Divider />
                <Label>Rows (cells separated by |)</Label>
                <Input value={(content.rows || []).map(r => Array.isArray(r) ? r.join(' | ') : r).join('\n')}
                  onChange={v => setContent({ rows: v.split('\n').filter(Boolean).map(line => line.split('|').map(c => c.trim())) })}
                  multiline placeholder="Cell 1 | Cell 2&#10;Cell A | Cell B" style={{ minHeight: 120 }} />
              </>}

              {cell.block === 'chart' && <>
                <Label>Title</Label>
                <Input value={content.title} onChange={v => setContent({ title: v })} placeholder="Chart title" />
                <Divider />
                <Label>Chart type</Label>
                <Select value={content.chartType || 'bar'} onChange={v => setContent({ chartType: v })} options={[
                  { value: 'bar', label: 'Bar' }, { value: 'line', label: 'Line' }, { value: 'pie', label: 'Pie' }
                ]} />
                <Divider />
                {/* Table link */}
                <ChartTableLinker project={project} slideIdx={slideIdx} content={content} setContent={setContent} />
                {/* Manual data — only shown when no table linked */}
                {!content.linkedTable && <>
                  <Divider />
                  <Label>Labels (comma-separated)</Label>
                  <Input value={Array.isArray(content.labels) ? content.labels.join(', ') : (content.labels || '')}
                    onChange={v => setContent({ labels: v.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Jan, Feb, Mar" />
                  <Divider />
                  <Label>Datasets</Label>
                  <ArrayEditor items={content.datasets || []} onChange={v => setArrayContent('datasets', v)}
                    addLabel="+ Add dataset"
                    defaultItem={{ label: 'Dataset', data: [10, 20, 30], color: '#42dcc6' }}
                    fields={[
                      { key: 'label', label: 'Label', placeholder: 'Series name' },
                      { key: 'data', label: 'Data (comma-separated)', placeholder: '10, 20, 30' },
                      { key: 'color', label: 'Color (hex)', placeholder: '#42dcc6' },
                    ]} />
                </>}
              </>}

              {cell.block === 'cta' && <>
                <Label>Pre-text</Label>
                <Input value={content.pretext} onChange={v => setContent({ pretext: v })} placeholder="e.g. Ready to start?" />
                <Divider />
                <Label>Primary button</Label>
                <Input value={content.label} onChange={v => setContent({ label: v })} placeholder="Button label" />
                <Label style={{ marginTop: 6 }}>Link to slide</Label>
                <Select value={content.primaryTarget ?? ''} onChange={v => setContent({ primaryTarget: v })}
                  options={[{ value: '', label: '— No link —' }, ...project.slides.map((s, i) => ({ value: String(i), label: `${i+1}. ${s.label || 'Slide '+(i+1)}` }))]} />
                <Divider />
                <Label>Secondary button</Label>
                <Input value={content.secondary} onChange={v => setContent({ secondary: v })} placeholder="Secondary label" />
                <Label style={{ marginTop: 6 }}>Link to slide</Label>
                <Select value={content.secondaryTarget ?? ''} onChange={v => setContent({ secondaryTarget: v })}
                  options={[{ value: '', label: '— No link —' }, ...project.slides.map((s, i) => ({ value: String(i), label: `${i+1}. ${s.label || 'Slide '+(i+1)}` }))]} />
                <Divider />
                <Label>Note</Label>
                <Input value={content.note} onChange={v => setContent({ note: v })} placeholder="Additional note" />
              </>}

              {cell.block === 'divider' && <>
                <Label>Style</Label>
                <Select value={content.style || 'accent'} onChange={v => setContent({ style: v })}
                  options={[{ value: 'accent', label: 'Accent color' }, { value: 'muted', label: 'Muted' }]} />
                <Divider />
                <Label>Label (optional)</Label>
                <Input value={content.label} onChange={v => setContent({ label: v })} placeholder="Optional label" />
              </>}

              {cell.block === 'image' && <>
                <Label>Image</Label>
                <label style={{ display: 'block', cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setContent({ src: ev.target.result });
                    reader.readAsDataURL(file);
                  }}/>
                  <div style={{ background: '#0d1228', border: '1px dashed #42dcc6', color: '#42dcc6', padding: '10px', textAlign: 'center', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer' }}>
                    {content.src ? '↺ Replace image' : '↑ Upload image'}
                  </div>
                </label>
                {content.src && <div style={{ marginTop: 6, border: '1px solid #1c2341', overflow: 'hidden', height: 90 }}>
                  <img src={content.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview"/>
                </div>}
                <Divider />
                <Label>Object Fit</Label>
                <Select value={content.fit || 'cover'} onChange={v => setContent({ fit: v })} options={[
                  { value: 'cover', label: 'Cover (fill, crop)' }, { value: 'contain', label: 'Contain (fit)' },
                  { value: 'fill', label: 'Fill (stretch)' }, { value: 'none', label: 'None (original)' },
                ]}/>
                <Divider />
                <Label>Position</Label>
                <Select value={content.align || 'center'} onChange={v => setContent({ align: v })} options={[
                  { value: 'center', label: 'Center' }, { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' },
                  { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' },
                  { value: 'top left', label: 'Top left' }, { value: 'top right', label: 'Top right' },
                ]}/>
                <Divider />
                <Label>Caption</Label>
                <Input value={content.caption} onChange={v => setContent({ caption: v })} placeholder="Image caption…"/>
              </>}

              {cell.block === 'empty' && (
                <p style={{ fontSize: 11, color: '#464a6c', lineHeight: 1.6 }}>Select a block type above to add content.</p>
              )}
            </PropSection>
          )}

          {/* Animation — leaf cells only */}
          {cell && !isContainer && (
            <AnimationPanel cell={cell} accent={accent}
              hasItems={['checklist','timeline','metrics','table'].includes(cell.block)}
              onUpdate={(animation) => onUpdateCell(slideIdx, selPath, { ...cell, animation })}/>
          )}

          {!cell && (
            <div style={{ padding: '20px 16px', color: '#464a6c', fontSize: 11 }}>Click a cell or select it from the tree.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Animation Panel ─────────────────────────────────────────────────────────
function AnimationPanel({ cell, accent, hasItems, onUpdate }) {
  const a = cell.animation || {};
  const set = (patch) => onUpdate({ ...a, ...patch });
  const blockBadge = (a.type && a.type !== 'none') ? (BLOCK_ANIMATIONS.find(x => x.id === a.type)?.label) : 'None';

  return (
    <PropSection title="Animation" icon="animation" defaultOpen={false} badge={blockBadge}>
      <Label style={{ marginTop: 4 }}>Block animation</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {BLOCK_ANIMATIONS.map(opt => {
          const active = (a.type || 'none') === opt.id;
          return (
            <button key={opt.id} onClick={() => set({ type: opt.id })}
              title={opt.label}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 4px',
                background: active ? 'rgba(66,220,198,0.12)' : '#0d1228',
                border: `1px solid ${active ? accent : '#1c2341'}`,
                color: active ? accent : '#bbcac5',
                fontFamily: 'Space Grotesk', fontSize: 8, fontWeight: 700,
                letterSpacing: '0.04em', cursor: 'pointer',
              }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 0,'wght' 300" }}>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {a.type && a.type !== 'none' && <>
        <Divider />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <Label>Order</Label>
            <Input value={a.order ?? ''} onChange={v => set({ order: v === '' ? undefined : Math.max(0, parseInt(v) || 0) })} placeholder="auto"/>
          </div>
          <div>
            <Label>Delay (ms)</Label>
            <Input value={a.delay ?? ''} onChange={v => set({ delay: v === '' ? undefined : Math.max(0, parseInt(v) || 0) })} placeholder="auto"/>
          </div>
          <div>
            <Label>Duration</Label>
            <Input value={a.duration ?? 750} onChange={v => set({ duration: Math.max(50, parseInt(v) || 750) })} placeholder="750"/>
          </div>
          <div>
            <Label>Auto step (ms)</Label>
            <Input value={a.baseDelay ?? 140} onChange={v => set({ baseDelay: Math.max(0, parseInt(v) || 0) })} placeholder="140"/>
          </div>
        </div>
      </>}

      {hasItems && <>
        <Divider />
        <Label>Items animation</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          {ITEM_ANIMATIONS.map(opt => {
            const active = (a.itemType || 'none') === opt.id;
            return (
              <button key={opt.id} onClick={() => set({ itemType: opt.id })}
                title={opt.label}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '6px 4px',
                  background: active ? 'rgba(66,220,198,0.12)' : '#0d1228',
                  border: `1px solid ${active ? accent : '#1c2341'}`,
                  color: active ? accent : '#bbcac5',
                  fontFamily: 'Space Grotesk', fontSize: 8, fontWeight: 700,
                  letterSpacing: '0.04em', cursor: 'pointer',
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 0,'wght' 300" }}>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {a.itemType && a.itemType !== 'none' && <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <div>
              <Label>Stagger (ms)</Label>
              <Input value={a.itemStagger ?? 90} onChange={v => set({ itemStagger: Math.max(0, parseInt(v) || 0) })} placeholder="90"/>
            </div>
            <div>
              <Label>Item duration</Label>
              <Input value={a.itemDuration ?? 600} onChange={v => set({ itemDuration: Math.max(50, parseInt(v) || 600) })} placeholder="600"/>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
            <input type="checkbox" checked={!!a.itemAfterBlock}
              onChange={e => set({ itemAfterBlock: e.target.checked })}
              style={{ accentColor: accent, width: 12, height: 12 }}/>
            <span style={{ fontSize: 10, color: '#bbcac5' }}>Start items after block animation</span>
          </label>
        </>}
      </>}

      {((a.type && a.type !== 'none') || (a.itemType && a.itemType !== 'none')) && (
        <button onClick={() => onUpdate(null)}
          style={{
            marginTop: 10, width: '100%',
            background: 'rgba(255,119,117,0.08)', border: '1px solid #ff7775',
            color: '#ff7775', cursor: 'pointer', padding: '6px',
            fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
          Clear animations
        </button>
      )}
      <p style={{ fontSize: 9, color: '#3b426b', marginTop: 8, lineHeight: 1.5 }}>
        Tip: leave Order empty for auto sequence (top-down).
      </p>
    </PropSection>
  );
}

// ─── Side Block Toolbar (vertical, integrated, no overlap) ───────────────────
// Compact icon-based vertical column placed BETWEEN the canvas and the
// properties panel. Always visible — when no cell is selected, it shows a
// hint and slide-level shortcuts. When a cell is selected, it exposes the
// row/column/split/scale controls inline (no collapse needed).
function SideBlockToolbar({ slide, slideIdx, selPath, onReplaceSlide, onSelectPath, onScaleChange }) {
  if (!slide) return null;

  const hasSel = !!(selPath && selPath.length > 0);
  const cell = hasSel ? getCellAtPath(slide, selPath) : null;
  const validSel = hasSel && !!cell;

  // Resolve context from path (safe defaults when nothing is selected)
  const [curRi, curCi] = validSel ? selPath[selPath.length - 1] : [0, 0];
  const parentContainerPath = validSel ? selPath.slice(0, -1) : [];
  const parentRows = validSel ? getContainerRows(slide, parentContainerPath) : [];
  const curRow = parentRows[curRi];

  const isContainer = validSel && !!cell.rows;
  const isLeaf = validSel && !isContainer;

  // Breadcrumb label
  const levelLabel = !validSel ? '' : selPath.length === 1
    ? `slide`
    : selPath.slice(0, -1).map(([r, c]) => `R${r+1}·C${c+1}`).join(' › ');

  // ── Row operations (in parent container) ──
  const addRowBelow = () => {
    const newSlide = setContainerRows(slide, parentContainerPath, rows => {
      const r = [...rows];
      r.splice(curRi + 1, 0, makeRow(['1fr'], ['empty']));
      return r;
    });
    onReplaceSlide(slideIdx, newSlide);
  };
  const removeRow = () => {
    if (parentRows.length <= 1) return;
    const newSlide = setContainerRows(slide, parentContainerPath, rows => rows.filter((_, i) => i !== curRi));
    onReplaceSlide(slideIdx, newSlide);
    onSelectPath(null);
  };
  const moveRow = (dir) => {
    const target = curRi + dir;
    if (target < 0 || target >= parentRows.length) return;
    const newSlide = setContainerRows(slide, parentContainerPath, rows => {
      const r = [...rows];
      [r[curRi], r[target]] = [r[target], r[curRi]];
      return r;
    });
    onReplaceSlide(slideIdx, newSlide);
  };

  // ── Column operations (in current row of parent) ──
  const addColRight = () => {
    const newSlide = setContainerRows(slide, parentContainerPath, rows =>
      rows.map((row, r) => r !== curRi ? row : {
        ...row, cols: [...row.cols, '1fr'], cells: [...row.cells, makeCell('empty')]
      })
    );
    onReplaceSlide(slideIdx, newSlide);
  };
  const removeCol = () => {
    if (!curRow || curRow.cells.length <= 1) return;
    const newSlide = setContainerRows(slide, parentContainerPath, rows =>
      rows.map((row, r) => r !== curRi ? row : {
        ...row,
        cols: row.cols.filter((_, i) => i !== curCi),
        cells: row.cells.filter((_, i) => i !== curCi),
      })
    );
    onReplaceSlide(slideIdx, newSlide);
    onSelectPath(null);
  };
  const setColLayout = (cols) => {
    const newSlide = setContainerRows(slide, parentContainerPath, rows =>
      rows.map((row, r) => r !== curRi ? row : {
        ...row,
        cols,
        cells: cols.map((_, i) => row.cells[i] || makeCell('empty')),
      })
    );
    onReplaceSlide(slideIdx, newSlide);
  };

  // ── Split operations (leaf → container) ──
  const splitIntoCols = (n) => {
    if (!isLeaf) return;
    const newCells = [{ ...cell, id: cell.id }, ...Array.from({ length: n - 1 }, () => makeCell('empty'))];
    const newRows = [{ id: uid(), cols: Array(n).fill('1fr'), flex: 1, cells: newCells }];
    const newSlide = setAtPath(slide, selPath, () => ({ id: uid(), rows: newRows }));
    onReplaceSlide(slideIdx, newSlide);
    // Select the first sub-cell
    onSelectPath([...selPath, [0, 0]]);
  };
  const splitIntoRows = (n) => {
    if (!isLeaf) return;
    const firstRow = { id: uid(), cols: ['1fr'], flex: 1, cells: [{ ...cell, id: cell.id }] };
    const extraRows = Array.from({ length: n - 1 }, () => makeRow(['1fr'], ['empty']));
    const newSlide = setAtPath(slide, selPath, () => ({ id: uid(), rows: [firstRow, ...extraRows] }));
    onReplaceSlide(slideIdx, newSlide);
    onSelectPath([...selPath, [0, 0]]);
  };

  // ── Container operations ──
  const addRowInside = () => {
    if (!isContainer) return;
    const newSlide = setAtPath(slide, selPath, c => ({
      ...c, rows: [...c.rows, makeRow(['1fr'], ['empty'])]
    }));
    onReplaceSlide(slideIdx, newSlide);
  };
  const addColInside = () => {
    // Adds a column to the last row of the container
    if (!isContainer || cell.rows.length === 0) return;
    const lastRowIdx = cell.rows.length - 1;
    const newSlide = setAtPath(slide, selPath, c => ({
      ...c,
      rows: c.rows.map((row, ri) => ri !== lastRowIdx ? row : {
        ...row, cols: [...row.cols, '1fr'], cells: [...row.cells, makeCell('empty')]
      })
    }));
    onReplaceSlide(slideIdx, newSlide);
  };
  const flattenContainer = () => {
    if (!isContainer) return;
    const newSlide = setAtPath(slide, selPath, () => makeCell('empty'));
    onReplaceSlide(slideIdx, newSlide);
    onSelectPath(null);
  };

  // ── Compact icon button (32×32 / 28×28 for tighter rows) ──
  const IconBtn = ({ icon, title, onClick, active, danger, disabled, size = 32, label, accent: ac }) => (
    <button onClick={onClick} title={title} disabled={disabled} style={{
      width: size, height: size, padding: 0,
      background: active ? 'rgba(66,220,198,0.16)' : danger ? 'rgba(255,119,117,0.10)' : '#0d1228',
      border: `1px solid ${active ? '#42dcc6' : danger ? '#ff7775' : '#1c2341'}`,
      color: disabled ? '#2a3060' : active ? '#42dcc6' : danger ? '#ff7775' : ac || '#bbcac5',
      cursor: disabled ? 'default' : 'pointer', borderRadius: 4,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 700,
      transition: 'all 0.12s', flexShrink: 0,
    }}>
      {label
        ? label
        : <span className="material-symbols-outlined" style={{ fontSize: size === 28 ? 16 : 18, fontVariationSettings: "'FILL' 0,'wght' 300" }}>{icon}</span>}
    </button>
  );

  const SectionTitle = ({ children }) => (
    <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3b426b', textAlign: 'center', padding: '6px 0 2px', borderTop: '1px solid #11162d' }}>
      {children}
    </div>
  );

  return (
    <div style={{
      width: 52, flexShrink: 0,
      borderLeft: '1px solid #1c2341', borderRight: '1px solid #1c2341',
      background: '#06091a', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', userSelect: 'none',
    }}>
      {/* Header badge */}
      <div title={validSel ? `${isContainer ? 'Container' : 'Block'} · ${levelLabel} › R${curRi+1}·C${curCi+1}` : 'Select a cell'}
        style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, borderBottom: '1px solid #11162d' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: validSel ? '#42dcc6' : '#3b426b', fontVariationSettings: "'FILL' 0,'wght' 300" }}>
          {validSel ? (isContainer ? 'grid_view' : 'widgets') : 'crop_free'}
        </span>
        <span style={{ fontSize: 8, fontWeight: 700, color: validSel ? '#42dcc6' : '#3b426b', letterSpacing: '0.1em' }}>
          {validSel ? `L${selPath.length}` : '—'}
        </span>
      </div>

      {/* Empty state */}
      {!validSel && (
        <div style={{ padding: '14px 6px', textAlign: 'center', color: '#3b426b', fontSize: 8, lineHeight: 1.5, letterSpacing: '0.06em' }}>
          Select a cell on the slide to edit its layout.
        </div>
      )}

      {/* Tools — only when selected */}
      {validSel && (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '4px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>

          {/* SPLIT — leaf only */}
          {isLeaf && <>
            <SectionTitle>Split</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, padding: '0 6px', width: '100%' }}>
              <IconBtn icon="splitscreen_vertical_add" title="Split into 2 columns" onClick={() => splitIntoCols(2)} size={28}/>
              <IconBtn icon="splitscreen_add" title="Split into 2 rows" onClick={() => splitIntoRows(2)} size={28}/>
              <IconBtn label="3⫶" title="Split into 3 columns" onClick={() => splitIntoCols(3)} size={28}/>
              <IconBtn label="3≡" title="Split into 3 rows" onClick={() => splitIntoRows(3)} size={28}/>
            </div>
          </>}

          {/* CONTAINER */}
          {isContainer && <>
            <SectionTitle>Inside</SectionTitle>
            <IconBtn icon="add_row_below" title="Add row inside container" onClick={addRowInside} active size={36}/>
            <IconBtn icon="add_column_right" title="Add column to last row" onClick={addColInside} size={36}/>
            <IconBtn icon="layers_clear" title="Flatten container" onClick={flattenContainer} danger size={36}/>
          </>}

          {/* ROW */}
          <SectionTitle>Row</SectionTitle>
          <IconBtn icon="arrow_upward"   title="Move row up"   onClick={() => moveRow(-1)} disabled={curRi === 0}/>
          <IconBtn icon="arrow_downward" title="Move row down" onClick={() => moveRow(1)}  disabled={curRi === parentRows.length - 1}/>
          <IconBtn icon="add_row_below"  title="Add row below" onClick={addRowBelow} active/>
          {parentRows.length > 1 && (
            <IconBtn icon="delete" title="Remove this row" onClick={removeRow} danger/>
          )}

          {/* COLUMN */}
          <SectionTitle>Col</SectionTitle>
          <IconBtn icon="add_column_right" title="Add column right" onClick={addColRight} active/>
          {curRow && curRow.cells.length > 1 && (
            <IconBtn icon="variable_remove" title="Remove this column" onClick={removeCol} danger/>
          )}

          {/* LAYOUT PRESETS */}
          <SectionTitle>Layout</SectionTitle>
          {COL_PRESETS.map(p => {
            const active = curRow && JSON.stringify(curRow.cols) === JSON.stringify(p.cols);
            return (
              <IconBtn key={p.label} label={p.label} title={`Layout ${p.label}`} onClick={() => setColLayout(p.cols)} active={active} size={28}/>
            );
          })}

          {/* CONTENT SCALE — leaf only */}
          {isLeaf && <>
            <SectionTitle>Scale</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 4px', width: '100%' }}>
              <IconBtn icon="add" title="Increase content scale" size={28}
                onClick={() => onScaleChange && onScaleChange(Math.min(2, +((cell.fontSize||1) + 0.1).toFixed(2)))}/>
              <input type="range" min={50} max={200} step={5} orient="vertical"
                value={Math.round((cell.fontSize||1)*100)}
                onChange={e => onScaleChange && onScaleChange(parseInt(e.target.value)/100)}
                style={{
                  WebkitAppearance:'slider-vertical', writingMode: 'bt-lr',
                  width: 6, height: 90, accentColor: '#42dcc6', cursor: 'pointer',
                }}/>
              <IconBtn icon="remove" title="Decrease content scale" size={28}
                onClick={() => onScaleChange && onScaleChange(Math.max(0.5, +((cell.fontSize||1) - 0.1).toFixed(2)))}/>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#42dcc6', textAlign: 'center' }}>
                {Math.round((cell.fontSize||1)*100)}%
              </span>
              <button onClick={() => onScaleChange && onScaleChange(1)}
                style={{ background: 'none', border: 'none', color: '#3b426b', cursor: 'pointer', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px' }}>
                reset
              </button>
            </div>
          </>}
        </div>
      )}
    </div>
  );
}

// ─── Template Picker Modal ────────────────────────────────────────────────────
function TemplatePicker({ onSelect, onClose, insertAfter }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#0d1228', border: '1.5px solid #464a6c', padding: 28, width: 560, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#dde4e1', letterSpacing: '0.04em' }}>Insert slide {insertAfter !== null ? `after #${insertAfter + 1}` : 'at end'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#859490', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {SLIDE_TEMPLATES.map(t => (
            <div key={t.id} onClick={() => { onSelect(t); onClose(); }}
              style={{ padding: '14px 12px', background: '#111633', border: '1.5px solid #1c2341', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#42dcc6'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1c2341'}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#42dcc6', fontVariationSettings: "'FILL' 0,'wght' 300" }}>{t.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#dde4e1' }}>{t.label}</span>
              <span style={{ fontSize: 10, color: '#859490', lineHeight: 1.4 }}>{t.desc}</span>
            </div>
          ))}
          <div onClick={() => { onSelect({ make: () => ({ id: uid(), label: 'Slide', bg: 'dark', rows: [makeRow(['1fr'], ['empty'])] }) }); onClose(); }}
            style={{ padding: '14px 12px', background: '#111633', border: '1.5px dashed #464a6c', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#42dcc6'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#464a6c'}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#464a6c', fontVariationSettings: "'FILL' 0,'wght' 300" }}>add</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#464a6c' }}>Blank</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
function exportAsPDF(project, lang, accent) {
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${project.meta.clientName || 'Presentation'} — PDF</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;color-adjust:exact !important;}
body{background:#00001b;font-family:'Space Grotesk',sans-serif;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}
.material-symbols-outlined{font-family:'Material Symbols Outlined';font-weight:normal;font-style:normal;line-height:1;letter-spacing:normal;text-transform:none;white-space:nowrap;direction:ltr;-webkit-font-smoothing:antialiased;}
.page{width:297mm;height:167mm;overflow:hidden;position:relative;page-break-after:always;break-after:page;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}
@media print{html,body{margin:0;background:#00001b !important;}@page{size:297mm 167mm landscape;margin:0;}.page{page-break-after:always;break-after:page;}.print-btn{display:none;}}
.print-btn{position:fixed;bottom:24px;right:24px;background:#42dcc6;color:#003730;border:none;padding:12px 24px;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:.08em;border-radius:4px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.4);}
.instructions{position:fixed;bottom:24px;left:24px;background:#0d1228;border:1px solid #42dcc6;color:#bbcac5;padding:14px 18px;font-family:'Space Grotesk',sans-serif;font-size:11px;line-height:1.7;border-radius:4px;max-width:320px;}
.instructions strong{color:#42dcc6;}
@media print{.instructions{display:none;}}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">🖨 Imprimir / Guardar PDF</button>
<div class="instructions">
  <strong>Para preservar colores al guardar PDF:</strong><br/>
  1. Clic en "Imprimir / Guardar PDF"<br/>
  2. En el diálogo busca:<br/>
  &nbsp;&nbsp;• Chrome/Edge: <strong>Más configuración → Gráficos de fondo ✓</strong><br/>
  &nbsp;&nbsp;• Firefox: <strong>Opciones → Imprimir fondos ✓</strong><br/>
  &nbsp;&nbsp;• Safari: <strong>Mostrar detalles → Fondos ✓</strong><br/>
  3. Guardar como PDF
</div>
<div id="root"></div>
<script>window.__PROJ__=${JSON.stringify({project,lang,accent})};</script>
<script type="text/babel" src="${location.origin + location.pathname.replace(/[^/]*$/, '')}editor/Blocks.jsx"></script>
<script type="text/babel">
const {project,lang,accent} = window.__PROJ__;
function PDFPages() {
  return React.createElement(React.Fragment, null,
    project.slides.map((slide, i) =>
      React.createElement('div', { key: slide.id, className: 'page' },
        React.createElement('div', { style: { transform: 'scale(0.546)', transformOrigin: 'top left', width: 1920, height: 1080 } },
          React.createElement(SlideView, { slide: {...slide, slideNum: (i+1)+' / '+project.slides.length}, lang, accent: accent||'#42dcc6', logoSrc: project.meta.logoSrc, clientName: project.meta.clientName, mode: 'present' })
        )
      )
    )
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(PDFPages));
</script>
</body></html>`);
  win.document.close();
}

// ─── Logo Upload Guide Modal ──────────────────────────────────────────────────
function LogoGuideModal({ onClose, onUpload }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#0d1228', border:'1.5px solid #42dcc6', padding:28, width:380, borderRadius:4 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#dde4e1' }}>Upload client logo</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#859490', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>
        <div style={{ background:'#111633', border:'1px solid #1c2341', padding:16, marginBottom:16, display:'flex', flexDirection:'column', gap:10 }}>
          {[
            ['Dimensiones recomendadas', 'Mínimo 400 × 120 px, ideal 800 × 240 px. Relación horizontal.'],
            ['Formato y fondo', 'PNG con fondo transparente (preferido). SVG también funciona.'],
            ['Color sobre fondo oscuro', 'Logo sobre fondo #00001B. Usa versión blanca o clara.'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize:22, color:'#42dcc6', fontVariationSettings:"'FILL' 0,'wght' 300", flexShrink:0, marginTop:2 }}>check_circle</span>
              <div>
                <p style={{ fontSize:12, fontWeight:700, color:'#dde4e1', marginBottom:2 }}>{title}</p>
                <p style={{ fontSize:11, color:'#bbcac5', lineHeight:1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <label style={{ display:'block', cursor:'pointer' }}>
          <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => { onUpload(e); onClose(); }}/>
          <div style={{ background:'#42dcc6', color:'#003730', padding:'12px', textAlign:'center', fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
            Seleccionar archivo de logo
          </div>
        </label>
      </div>
    </div>
  );
}

// ─── HTML Export ──────────────────────────────────────────────────────────────
function exportAsHTML(project) {
  const data = JSON.stringify(project);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${project.meta.clientName || 'Presentation'} — Goal Systems</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin="anonymous"><\/script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"><\/script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin="anonymous"><\/script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #000; overflow: hidden; font-family: 'Space Grotesk', sans-serif; }
.material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; line-height: 1; letter-spacing: normal; text-transform: none; white-space: nowrap; direction: ltr; -webkit-font-smoothing: antialiased; }
.gsa-anim { animation-fill-mode: backwards; animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); will-change: transform, opacity, filter, clip-path; }
@keyframes gsa-fade        { from { opacity: 0; } to { opacity: 1; } }
@keyframes gsa-slide-up    { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes gsa-slide-down  { from { opacity: 0; transform: translateY(-24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes gsa-slide-left  { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
@keyframes gsa-slide-right { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
@keyframes gsa-zoom-in     { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
@keyframes gsa-zoom-out    { from { opacity: 0; transform: scale(1.18); } to { opacity: 1; transform: scale(1); } }
@keyframes gsa-blur-in     { from { opacity: 0; filter: blur(14px); } to { opacity: 1; filter: blur(0); } }
@keyframes gsa-glow-in     { 0% { opacity: 0; transform: scale(0.96); filter: brightness(2.4) drop-shadow(0 0 22px rgba(66,220,198,0.9)); } 60% { opacity: 1; transform: scale(1.01); filter: brightness(1.2) drop-shadow(0 0 8px rgba(66,220,198,0.5)); } 100% { opacity: 1; transform: scale(1); filter: brightness(1) drop-shadow(0 0 0 transparent); } }
@keyframes gsa-reveal-x    { from { opacity: 0; clip-path: inset(0 100% 0 0); } to { opacity: 1; clip-path: inset(0 0 0 0); } }
@keyframes gsa-reveal-y    { from { opacity: 0; clip-path: inset(0 0 100% 0); } to { opacity: 1; clip-path: inset(0 0 0 0); } }
@keyframes gsa-flicker     { 0% { opacity: 0; } 8% { opacity: 0.7; } 14% { opacity: 0.15; } 24% { opacity: 0.95; } 32% { opacity: 0.4; } 42% { opacity: 1; } 52% { opacity: 0.6; } 60% { opacity: 1; } 100% { opacity: 1; } }
@keyframes gsa-pop         { 0% { opacity: 0; transform: scale(0.55); } 60% { opacity: 1; transform: scale(1.07); } 100% { opacity: 1; transform: scale(1); } }
@keyframes gsa-bracket     { 0% { opacity: 0; transform: scale(1.18); letter-spacing: 0.4em; filter: blur(2px); } 100% { opacity: 1; transform: scale(1); letter-spacing: normal; filter: blur(0); } }
@keyframes gsa-rise-fade   { from { opacity: 0; transform: translateY(10px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
<\/style>
</head>
<body>
<div id="root"></div>
<script>window.__PROJECT__ = ${data};<\/script>
<script type="text/babel" src="editor/Blocks.jsx"><\/script>
<script type="text/babel">
const project = window.__PROJECT__;
function PresenterMode({ project }) {
  const [i, setI] = React.useState(() => { const s = parseInt(localStorage.getItem('gs_pres_idx')||'0'); return isNaN(s)||s>=project.slides.length?0:s; });
  React.useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setI(n => Math.min(project.slides.length-1, n+1));
      if (e.key === 'ArrowLeft') setI(n => Math.max(0, n-1));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  React.useEffect(() => { localStorage.setItem('gs_pres_idx', i); }, [i]);
  const slide = { ...project.slides[i], slideNum: (i+1) + ' / ' + project.slides.length };
  const scale = Math.min(window.innerWidth/1920, window.innerHeight/1080);
  return React.createElement('div', { style: { position:'fixed', inset:0, background:'#000', display:'flex', alignItems:'center', justifyContent:'center' } },
    React.createElement('div', { style: { width:1920, height:1080, transform:'scale('+scale+')', transformOrigin:'center' } },
      React.createElement(SlideView, { key: 'pres-'+i, slide, lang:project.meta.lang||'en', accent:project.meta.accent||'#42dcc6', logoSrc:project.meta.logoSrc, clientName:project.meta.clientName, mode:'present', project })
    ),
    i > 0 && React.createElement('button', { onClick:()=>setI(n=>n-1), style:{ position:'fixed', left:20, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.5)', border:'1px solid #464a6c', color:'#bbcac5', cursor:'pointer', padding:'14px 10px' } }, React.createElement('span', { className:'material-symbols-outlined' }, 'arrow_back')),
    i < project.slides.length-1 && React.createElement('button', { onClick:()=>setI(n=>n+1), style:{ position:'fixed', right:20, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.5)', border:'1px solid #464a6c', color:'#bbcac5', cursor:'pointer', padding:'14px 10px' } }, React.createElement('span', { className:'material-symbols-outlined' }, 'arrow_forward')),
    React.createElement('div', { style:{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', color:'#464a6c', fontSize:11, fontFamily:'Space Grotesk', letterSpacing:'0.1em' } }, (i+1) + ' / ' + project.slides.length)
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(PresenterMode, { project }));
<\/script>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(project.meta.clientName || 'presentation').replace(/\s+/g,'-').toLowerCase()}-slides.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Editor Shell ────────────────────────────────────────────────────────
function EditorShell({ project, setProject, onPresent, onExportHTML }) {
  const [selSlide, setSelSlide] = useS(0);
  const [selPath, setSelPath] = useS(null); // null | [[ri,ci], ...] — path to selected cell
  const [lang, setLang] = useS(project.meta.lang || 'en');
  // Sync lang when a new project is imported (meta.lang may differ from the
  // currently selected language; without this, imported decks render blank
  // when their content is keyed under a language other than the active one).
  useE(() => {
    if (project.meta.lang && project.meta.lang !== lang) setLang(project.meta.lang);
  }, [project.meta.lang]);
  const [picker, setPicker] = useS(null);
  const [logoModal, setLogoModal] = useS(false);
  const [zoom, setZoom] = useS(0.38);
  const [zoomCollapsed, setZoomCollapsed] = useS(false);
  const [savedFlash, setSavedFlash] = useS(false);
  const [spaceDown, setSpaceDown] = useS(false);
  const [isPanning, setIsPanning] = useS(false);
  const [currentFileName, setCurrentFileName] = useS(null);
  const fileHandleRef = useR(null);
  const didPan = useR(false);
  const canvasRef = useR(null);
  const containerRef = useR(null);

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const history = useR([project]);
  const histIdx = useR(0);
  const skipHistory = useR(false);

  const fitZoom = useCB(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    setZoom(Math.min((width - 80) / 1920, (height - 80) / 1080, 1));
  }, []);

  useE(() => {
    fitZoom();
    // Re-trigger after fonts/layout settle
    const t = setTimeout(fitZoom, 100);
    return () => clearTimeout(t);
  }, []);

  const slide = project.slides[selSlide];

  const pushHistory = (p) => {
    const trimmed = history.current.slice(0, histIdx.current + 1);
    trimmed.push(p);
    if (trimmed.length > 60) trimmed.shift();
    history.current = trimmed;
    histIdx.current = trimmed.length - 1;
  };
  const undo = () => {
    if (histIdx.current <= 0) return;
    histIdx.current--;
    skipHistory.current = true;
    setProject(history.current[histIdx.current]);
  };
  const redo = () => {
    if (histIdx.current >= history.current.length - 1) return;
    histIdx.current++;
    skipHistory.current = true;
    setProject(history.current[histIdx.current]);
  };

  // Ref to always call the latest save handlers (avoids stale closures in keydown).
  const saveHandlersRef = useR({ save: () => {}, saveAs: () => {} });

  useE(() => {
    const onDown = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (mod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (e.shiftKey) saveHandlersRef.current.saveAs();
        else saveHandlersRef.current.save();
      }
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setSpaceDown(true);
      }
    };
    const onUp = (e) => {
      if (e.code === 'Space') setSpaceDown(false);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  // ── Project updaters ────────────────────────────────────────────────────────
  const updateSlide = (idx, updates) => {
    setProject(p => {
      const next = { ...p, slides: p.slides.map((s, i) => i === idx ? { ...s, ...updates } : s) };
      if (!skipHistory.current) pushHistory(next);
      skipHistory.current = false;
      return next;
    });
  };

  // Full slide replacement (used by FloatingBlockMenu for path-based ops)
  const replaceSlide = (idx, newSlide) => {
    setProject(p => {
      const next = { ...p, slides: p.slides.map((s, i) => i === idx ? newSlide : s) };
      pushHistory(next);
      return next;
    });
  };

  // Update a cell at a given path
  const updateCell = (si, path, newCell) => {
    setProject(p => {
      const slide = p.slides[si];
      if (!slide) return p;
      const next = { ...p, slides: p.slides.map((s, i) => i !== si ? s : setAtPath(s, path, () => newCell)) };
      pushHistory(next);
      return next;
    });
  };

  const insertSlide = (template, afterIdx) => {
    const newSlide = template.make();
    const slides = [...project.slides];
    slides.splice(afterIdx + 1, 0, newSlide);
    const next = { ...project, slides };
    pushHistory(next);
    setProject(() => next);
    setSelSlide(afterIdx + 1);
    setSelPath(null);
  };

  const deleteSlide = (idx) => {
    if (project.slides.length <= 1) return;
    const slides = project.slides.filter((_, i) => i !== idx);
    const next = { ...project, slides };
    pushHistory(next);
    setProject(() => next);
    setSelSlide(Math.max(0, idx - 1));
    setSelPath(null);
  };

  const moveSlide = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= project.slides.length) return;
    const slides = [...project.slides];
    [slides[idx], slides[target]] = [slides[target], slides[idx]];
    const next = { ...project, slides };
    pushHistory(next);
    setProject(() => next);
    setSelSlide(target);
  };

  const cloneSlide = (idx) => {
    const clone = JSON.parse(JSON.stringify(project.slides[idx]));
    clone.id = uid();
    clone.label = (clone.label || 'Slide') + ' (copy)';
    const slides = [...project.slides];
    slides.splice(idx + 1, 0, clone);
    const next = { ...project, slides };
    pushHistory(next);
    setProject(() => next);
    setSelSlide(idx + 1);
    setSelPath(null);
  };

  const updateMeta = (updates) => setProject(p => ({ ...p, meta: { ...p.meta, ...updates } }));

  // Image transform — no history push (called on every drag frame)
  const updateImageTransform = useCB((cellPath, updates) => {
    setProject(p => {
      const sl = p.slides[selSlide];
      if (!sl) return p;
      const cell = getCellAtPath(sl, cellPath);
      if (!cell || cell.rows) return p;
      const curContent = cell.content[lang] || cell.content['en'] || {};
      const newContent = { ...cell.content, [lang]: { ...curContent, ...updates } };
      return {
        ...p,
        slides: p.slides.map((s, i) => i !== selSlide ? s : setAtPath(s, cellPath, c => ({ ...c, content: newContent })))
      };
    });
  }, [selSlide, lang]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateMeta({ logoSrc: ev.target.result });
    reader.readAsDataURL(file);
  };

  const CANVAS_W = Math.round(1920 * zoom);
  const CANVAS_H = Math.round(1080 * zoom);

  const defaultFileName = () =>
    `${(project.meta.clientName || 'presentation').replace(/\s+/g, '-').toLowerCase() || 'presentation'}-slides.json`;

  const writeProjectToDisk = async (forceNewFile) => {
    const json = JSON.stringify(project, null, 2);
    // Path A — File System Access API (Chrome / Edge / Brave)
    if (window.showSaveFilePicker) {
      try {
        let handle = forceNewFile ? null : fileHandleRef.current;
        if (!handle) {
          handle = await window.showSaveFilePicker({
            suggestedName: currentFileName || defaultFileName(),
            types: [{ description: 'Goal Slides JSON', accept: { 'application/json': ['.json'] } }],
          });
          fileHandleRef.current = handle;
          setCurrentFileName(handle.name);
        }
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        return true;
      } catch (err) {
        if (err && err.name === 'AbortError') return false;
        // Fall through to download fallback
        console.warn('FSA save failed, falling back to download', err);
      }
    }
    // Path B — fallback download (Safari / Firefox / iframes without permission)
    const name = currentFileName || defaultFileName();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    if (!currentFileName) setCurrentFileName(name);
    return true;
  };

  const handleSave = async () => {
    // Always persist to localStorage (instant, offline-safe)
    window.saveProject(project);
    const ok = await writeProjectToDisk(false);
    if (ok) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    }
  };

  const handleSaveAs = async () => {
    window.saveProject(project);
    const ok = await writeProjectToDisk(true);
    if (ok) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    }
  };

  // Keep keyboard shortcuts in sync with the latest project state.
  saveHandlersRef.current = { save: handleSave, saveAs: handleSaveAs };

  const accent = project.meta.accent || '#42dcc6';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#00001b', fontFamily: 'Space Grotesk, sans-serif', color: '#dde4e1', overflow: 'hidden' }}>

      {/* ── TOP BAR ── */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: '1px solid #1c2341', flexShrink: 0, background: '#00001b' }}>
        <img src="assets/goal-logo-white.png" alt="Goal Systems" style={{ height: 26, objectFit: 'contain' }} />
        <div style={{ width: 1, height: 24, background: '#1c2341' }} />
        <input value={project.meta.clientName || ''} onChange={e => updateMeta({ clientName: e.target.value })}
          placeholder="Client name"
          style={{ background: 'transparent', border: 'none', color: '#dde4e1', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, outline: 'none', letterSpacing: '0.04em', width: 180 }} />
        <div style={{ width: 1, height: 24, background: '#1c2341' }} />
        <Btn small onClick={() => setLogoModal(true)}>
          <EIcon name="image" size={13} />
          {project.meta.logoSrc ? 'Change logo' : 'Upload logo'}
        </Btn>
        {/* Accent picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Label style={{ margin: 0, whiteSpace: 'nowrap' }}>Accent</Label>
          {['#42dcc6', '#67f9e2', '#bec5eb', '#fae374', '#83e287', '#ff7775'].map(c => (
            <div key={c} onClick={() => updateMeta({ accent: c })}
              style={{ width: 18, height: 18, background: c, cursor: 'pointer', border: accent === c ? '2px solid #fff' : '2px solid transparent', transition: 'border 0.15s' }} />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Btn small onClick={undo} title="Undo (Ctrl+Z)" style={{ padding: '6px 9px' }}><EIcon name="undo" size={15} /></Btn>
        <Btn small onClick={redo} title="Redo (Ctrl+Y)" style={{ padding: '6px 9px', marginRight: 6 }}><EIcon name="redo" size={15} /></Btn>
        <Btn small onClick={() => exportAsPDF(project, lang, accent)}><EIcon name="picture_as_pdf" size={13} />PDF</Btn>
        <Btn onClick={() => { const d = document.createElement('a'); d.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2)); d.download = 'presentation.json'; d.click(); }}>
          <EIcon name="download" size={13} />Export JSON
        </Btn>
        <Btn onClick={() => exportAsHTML(project)}><EIcon name="html" size={13} />Export HTML</Btn>
        <Btn onClick={onPresent} active><EIcon name="play_arrow" size={16} />Present</Btn>
        <div style={{ width: 1, height: 24, background: '#1c2341' }} />
        <Btn onClick={handleSave}
          title={currentFileName ? `Save to ${currentFileName} (⌘S)` : 'Save project to file (⌘S)'}
          style={{ borderColor: savedFlash ? accent : '#464a6c', background: savedFlash ? 'rgba(66,220,198,0.15)' : 'transparent', color: savedFlash ? accent : '#bbcac5', transition: 'all 0.3s' }}>
          <EIcon name={savedFlash ? 'check' : 'save'} size={15} />
          {savedFlash ? 'Saved!' : 'Save'}
        </Btn>
        <Btn small onClick={handleSaveAs} title="Save project as a new file (⇧⌘S)" style={{ padding: '6px 9px' }}>
          <EIcon name="save_as" size={14} />
        </Btn>
        {currentFileName && (
          <span title={currentFileName} style={{ fontSize: 9, color: '#859490', fontWeight: 600, letterSpacing: '0.04em', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentFileName}
          </span>
        )}
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: Filmstrip ── */}
        <div style={{ width: 180, borderRight: '1px solid #1c2341', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, background: '#00001b' }}>
          <div style={{ padding: '10px 8px 4px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#464a6c' }}>
            Slides — {project.slides.length}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
              <button onClick={() => setPicker(-1)}
                style={{ background: 'none', border: '1px dashed #464a6c', color: '#464a6c', cursor: 'pointer', fontSize: 9, fontWeight: 700, padding: '3px 12px', fontFamily: 'Space Grotesk', letterSpacing: '0.08em' }}>
                + INSERT
              </button>
            </div>
            {project.slides.map((s, i) => (
              <React.Fragment key={s.id}>
                <div onClick={() => { setSelSlide(i); setSelPath(null); }}
                  style={{ margin: '0 8px', padding: '8px', background: selSlide === i ? 'rgba(66,220,198,0.08)' : 'transparent', border: `1.5px solid ${selSlide === i ? accent : '#1c2341'}`, cursor: 'pointer', position: 'relative' }}>
                  <div style={{ width: '100%', paddingBottom: '56.25%', background: '#0d1228', position: 'relative', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ transform: 'scale(0.085)', transformOrigin: 'center', width: 1920, height: 1080 }}>
                        <SlideView slide={s} lang={lang} accent={accent} logoSrc={project.meta.logoSrc} clientName={project.meta.clientName} mode="thumb" selPath={null} project={project} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: selSlide === i ? accent : '#859490', letterSpacing: '0.06em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {String(i + 1).padStart(2, '0')} {s.label || 'Slide'}
                    </span>
                  </div>
                  {selSlide === i && (
                    <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); moveSlide(i, -1); }} disabled={i === 0} style={{ flex: 1, background: '#0d1228', border: '1px solid #464a6c', color: i === 0 ? '#464a6c' : '#bbcac5', cursor: i === 0 ? 'default' : 'pointer', fontSize: 9, padding: '3px', fontFamily: 'Space Grotesk' }}>↑</button>
                      <button onClick={(e) => { e.stopPropagation(); moveSlide(i, 1); }} disabled={i === project.slides.length - 1} style={{ flex: 1, background: '#0d1228', border: '1px solid #464a6c', color: i === project.slides.length - 1 ? '#464a6c' : '#bbcac5', cursor: i === project.slides.length - 1 ? 'default' : 'pointer', fontSize: 9, padding: '3px', fontFamily: 'Space Grotesk' }}>↓</button>
                      <button onClick={(e) => { e.stopPropagation(); cloneSlide(i); }} style={{ flex: 1, background: '#0d1228', border: `1px solid ${accent}`, color: accent, cursor: 'pointer', fontSize: 9, padding: '3px', fontFamily: 'Space Grotesk' }}>⧉</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }} disabled={project.slides.length <= 1} style={{ flex: 1, background: '#0d1228', border: '1px solid #ff7775', color: project.slides.length <= 1 ? '#464a6c' : '#ff7775', cursor: project.slides.length <= 1 ? 'default' : 'pointer', fontSize: 9, padding: '3px', fontFamily: 'Space Grotesk' }}>✕</button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                  <button onClick={() => setPicker(i)}
                    style={{ background: 'none', border: '1px dashed #464a6c', color: '#464a6c', cursor: 'pointer', fontSize: 9, fontWeight: 700, padding: '3px 12px', fontFamily: 'Space Grotesk', letterSpacing: '0.08em' }}>
                    + INSERT
                  </button>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── CENTER: Canvas ── */}
        <div
          ref={containerRef}
          style={{
            flex: 1, overflow: 'auto', background: '#080e0d', position: 'relative',
            cursor: isPanning ? 'grabbing' : spaceDown ? 'grab' : 'default',
          }}
          onClick={() => { if (!didPan.current) setSelPath(null); }}
          onMouseDown={(e) => {
            // Pan on background click OR when Space is held
            if (!spaceDown && e.target !== e.currentTarget && !e.target.closest('[data-canvas-bg]')) return;
            e.preventDefault();
            didPan.current = false;
            const el = containerRef.current;
            const startX = e.clientX + el.scrollLeft;
            const startY = e.clientY + el.scrollTop;
            setIsPanning(true);
            const onMove = (ev) => {
              el.scrollLeft = startX - ev.clientX;
              el.scrollTop  = startY - ev.clientY;
              didPan.current = true;
            };
            const onUp = () => {
              setIsPanning(false);
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        >
          {slide && (() => {
            const PAD = 80;
            const totalW = Math.max(CANVAS_W + PAD * 2, containerRef.current?.clientWidth || 0);
            const totalH = Math.max(CANVAS_H + PAD * 2, containerRef.current?.clientHeight || 0);
            const offsetX = Math.max(0, Math.floor((totalW - CANVAS_W) / 2));
            const offsetY = Math.max(0, Math.floor((totalH - CANVAS_H) / 2));
            return (
              <div data-canvas-bg="1" style={{ width: totalW, height: totalH, position: 'relative', flexShrink: 0 }}>
                <div ref={canvasRef} style={{
                  position: 'absolute', left: offsetX, top: offsetY,
                  width: CANVAS_W, height: CANVAS_H,
                  boxShadow: '0 0 60px rgba(0,0,0,0.8)', flexShrink: 0,
                  outline: selPath ? `2px solid rgba(66,220,198,0.15)` : 'none',
                }}>
                  <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: 1920, height: 1080, pointerEvents: spaceDown ? 'none' : 'all' }}>
                    <SlideView
                      slide={{ ...slide, slideNum: `${selSlide + 1} / ${project.slides.length}` }}
                      lang={lang}
                      accent={accent}
                      logoSrc={project.meta.logoSrc}
                      clientName={project.meta.clientName}
                      mode="editor"
                      selPath={selPath}
                      onSelect={(path) => setSelPath(path)}
                      onTransformChange={updateImageTransform}
                      project={project}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Zoom toolbar — collapsible at the bottom */}
          {zoomCollapsed ? (
            <button onClick={(e) => { e.stopPropagation(); setZoomCollapsed(false); }}
              title="Show zoom controls"
              style={{
                position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                background: '#0a0f26', border: '1px solid #1c2341', borderRadius: 6,
                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                color: '#bbcac5', fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', cursor: 'pointer', zIndex: 50,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 0,'wght' 300", color: accent }}>expand_less</span>
              <span style={{ color: accent }}>{Math.round(zoom * 100)}%</span>
              <span style={{ color: '#464a6c' }}>·</span>
              <span>{selSlide + 1}/{project.slides.length}</span>
            </button>
          ) : (
            <div onClick={e => e.stopPropagation()} style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              background: '#0a0f26', border: '1px solid #1c2341',
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)', zIndex: 50, minWidth: 460,
            }}>
              <button onClick={() => setZoom(z => Math.max(0.1, +(z - 0.02).toFixed(2)))}
                title="Zoom out"
                style={{ background: '#0d1228', border: '1px solid #1c2341', borderRadius: 4, color: '#bbcac5', cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0,'wght' 300" }}>remove</span>
              </button>
              <input type="range" min={10} max={200} step={1} value={Math.round(zoom * 100)}
                onChange={e => setZoom(parseInt(e.target.value) / 100)}
                style={{ flex: 1, accentColor: accent, cursor: 'pointer', minWidth: 200 }}/>
              <button onClick={() => setZoom(z => Math.min(2, +(z + 0.02).toFixed(2)))}
                title="Zoom in"
                style={{ background: '#0d1228', border: '1px solid #1c2341', borderRadius: 4, color: '#bbcac5', cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0,'wght' 300" }}>add</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <input type="number" min={10} max={200} step={1} value={Math.round(zoom * 100)}
                  onChange={e => { const v = parseInt(e.target.value); if (v >= 10 && v <= 200) setZoom(v / 100); }}
                  style={{ width: 46, background: '#111633', border: '1px solid #2a3060', color: '#dde4e1', fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '4px', borderRadius: 3, outline: 'none' }}/>
                <span style={{ fontSize: 10, color: '#464a6c', fontWeight: 700 }}>%</span>
              </div>
              <div style={{ width: 1, height: 20, background: '#1c2341' }}/>
              <button onClick={fitZoom}
                title="Fit slide to current viewport"
                style={{ background: 'rgba(66,220,198,0.10)', border: `1px solid ${accent}`, borderRadius: 4, color: accent, cursor: 'pointer', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0,'wght' 300" }}>fit_screen</span>Fit
              </button>
              <span style={{ fontSize: 9, color: '#464a6c', fontWeight: 700, letterSpacing: '0.06em' }}>
                {selSlide + 1} / {project.slides.length}
              </span>
              <div style={{ width: 1, height: 20, background: '#1c2341' }}/>
              <button onClick={() => setZoomCollapsed(true)}
                title="Collapse zoom toolbar"
                style={{ background: 'transparent', border: 'none', color: '#859490', cursor: 'pointer', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0,'wght' 300" }}>expand_more</span>
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Side Block Toolbar (vertical icon column) ── */}
        <SideBlockToolbar
          slide={slide}
          slideIdx={selSlide}
          selPath={selPath}
          onReplaceSlide={replaceSlide}
          onSelectPath={(p) => setSelPath(p)}
          onScaleChange={(scale) => {
            if (!selPath) return;
            setProject(p => {
              const sl = p.slides[selSlide];
              if (!sl) return p;
              return { ...p, slides: p.slides.map((s, i) => i !== selSlide ? s : setAtPath(s, selPath, c => ({ ...c, fontSize: scale }))) };
            });
          }}
        />

        {/* ── RIGHT: Properties ── */}
        <div style={{ width: 240, borderLeft: '1px solid #1c2341', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, background: '#00001b' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #1c2341', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#464a6c' }}>
            Properties
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <PropertiesPanel
              project={project}
              slideIdx={selSlide}
              selPath={selPath}
              onUpdateCell={updateCell}
              onUpdateSlide={updateSlide}
              lang={lang}
              setLang={setLang}
              onSelectPath={(p) => setSelPath(p)}
              accent={accent}
            />
          </div>
        </div>
      </div>

      {/* Logo Guide Modal */}
      {logoModal && <LogoGuideModal onClose={() => setLogoModal(false)} onUpload={handleLogoUpload} />}

      {/* Template Picker */}
      {picker !== null && (
        <TemplatePicker
          insertAfter={picker}
          onSelect={(t) => insertSlide(t, picker)}
          onClose={() => setPicker(null)}
        />
      )}

      {/* Import JSON + Reset */}
      <button onClick={() => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => { try { setProject(JSON.parse(ev.target.result)); } catch { alert('Invalid JSON.'); } };
          reader.readAsText(file);
        };
        input.click();
      }} style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 999, background: '#0d1228', border: '1px solid #464a6c', color: '#859490', cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 0,'wght' 300" }}>upload</span>
        Import JSON
      </button>
    </div>
  );
}

Object.assign(window, { EditorShell, COL_PRESETS, getCellAtPath, setAtPath, setContainerRows, getContainerRows });

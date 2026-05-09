// editor/Blocks.jsx — Block components, SlideView, defaults & templates
// All block font sizes use em — scaled by a root fontSize on the wrapper div.
// Exports to window: BlockRenderer, SlideView, BLOCK_DEFAULTS, SLIDE_TEMPLATES, BLOCKS_META
//                    uid, makeCell, makeRow, pathsEqual, isPathPrefix

const { useState, useEffect, useRef } = React;

// ─── Path helpers ─────────────────────────────────────────────────────────────
function pathsEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return a.every(([r, c], i) => r === b[i][0] && c === b[i][1]);
}
function isPathPrefix(prefix, full) {
  if (!prefix || !full || prefix.length >= full.length) return false;
  return prefix.every(([r, c], i) => r === full[i][0] && c === full[i][1]);
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
const GIcon = ({ name, size = '1.1em', color, style = {} }) => (
  <span className="material-symbols-outlined"
    style={{ fontSize: size, lineHeight: 1, display: 'inline-block',
      fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24",
      color: color || 'inherit', flexShrink: 0, ...style }}>{name}</span>
);

const tagColor = (tag) => {
  const t = (tag || '').toLowerCase();
  if (t.includes('req') || t.includes('oblig')) return '#42dcc6';
  if (t.includes('rec')) return '#fae374';
  return '#859490';
};

// BASE px that 1em equals at scale=1. All blocks use em after this.
const BASE = 16;

// ─── BLOCK: Title ─────────────────────────────────────────────────────────────
function BlockTitle({ content, accent }) {
  const sz = { sm: '2em', md: '3em', lg: '4em', xl: '5em' }[content.size || 'lg'];
  return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', height:'100%', padding:'1.75em 3em', gap:'0.75em' }}>
      {content.tag && <p style={{ fontSize:'0.75em', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:accent }}>{content.tag}</p>}
      <h1 style={{ fontSize:sz, fontWeight:900, lineHeight:1.05, color:'#dde4e1', whiteSpace:'pre-line', letterSpacing:'-0.01em' }}>{content.title || 'Slide Title'}</h1>
      {content.subtitle && <p style={{ fontSize:'1em', lineHeight:1.65, color:'#bbcac5', maxWidth:'42em' }}>{content.subtitle}</p>}
    </div>
  );
}

// ─── BLOCK: Text ─────────────────────────────────────────────────────────────
function BlockText({ content }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', height:'100%', padding:'1.5em 3em' }}>
      <p style={{ fontSize:'1.125em', lineHeight:1.8, color:'#bbcac5' }}>{content.body || 'Text content goes here.'}</p>
    </div>
  );
}

// ─── BLOCK: Checklist ────────────────────────────────────────────────────────
function BlockChecklist({ content, accent }) {
  const items = content.items || [];
  const done = items.filter(i => i.done).length;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.5em', padding:'1.25em 1.75em', height:'100%', overflow:'hidden' }}>
      {content.title && (
        <div style={{ marginBottom:'0.5em', flexShrink:0 }}>
          <h3 style={{ fontSize:'1.25em', fontWeight:700, color:'#dde4e1' }}>{content.title}</h3>
          {content.subtitle && <p style={{ fontSize:'0.75em', color:'#859490', marginTop:'0.25em' }}>{content.subtitle}</p>}
        </div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.44em', overflow:'hidden', flex:1 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75em', padding:'0.69em 0.875em', background:'#0d1228', border:`1.5px solid ${item.done ? accent : '#1c2341'}`, flexShrink:0 }}>
            <div style={{ width:'1.125em', height:'1.125em', border:`2px solid ${item.done ? accent : '#464a6c'}`, background:item.done ? accent : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {item.done && <GIcon name="check" size="0.7em" color="#003730"/>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5em' }}>
                <span style={{ fontSize:'0.8125em', fontWeight:600, color:'#dde4e1', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</span>
                {item.tag && <span style={{ fontSize:'0.5625em', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', padding:'0.2em 0.5em', border:`1px solid ${tagColor(item.tag)}`, color:tagColor(item.tag), flexShrink:0 }}>{item.tag}</span>}
              </div>
              {item.desc && <p style={{ fontSize:'0.6875em', color:'#859490', marginTop:'0.125em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.desc}</p>}
            </div>
            {item.dur && <span style={{ fontSize:'0.625em', color:'#859490', flexShrink:0 }}>{item.dur}</span>}
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div style={{ marginTop:'auto', paddingTop:'0.5em', flexShrink:0 }}>
          <div style={{ height:2, background:'#1c2341' }}>
            <div style={{ height:'100%', background:accent, width:`${(done/items.length)*100}%`, transition:'width 0.3s' }}/>
          </div>
          <p style={{ fontSize:'0.625em', color:accent, marginTop:'0.25em' }}>{done}/{items.length}</p>
        </div>
      )}
    </div>
  );
}

// ─── BLOCK: Timeline ─────────────────────────────────────────────────────────
function BlockTimeline({ content, accent }) {
  const phases = content.phases || [];
  return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'1.5em 3em', height:'100%', gap:'1.5em' }}>
      {content.title && <div style={{ flexShrink:0 }}>
        <h3 style={{ fontSize:'1.25em', fontWeight:700, color:'#dde4e1' }}>{content.title}</h3>
        {content.subtitle && <p style={{ fontSize:'0.75em', color:'#859490', marginTop:'0.25em' }}>{content.subtitle}</p>}
      </div>}
      <div style={{ display:'flex', alignItems:'flex-start', position:'relative' }}>
        {phases.map((ph, i) => (
          <React.Fragment key={i}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
              <div style={{ width:'1.625em', height:'1.625em', border:`2px solid ${ph.active ? accent : '#464a6c'}`, background:ph.active ? accent : '#0d1228', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'0.625em', position:'relative', zIndex:1 }}>
                {ph.active ? <GIcon name="check" size="0.8em" color="#003730"/> : <span style={{ fontSize:'0.625em', color:'#464a6c', fontWeight:700 }}>{i+1}</span>}
              </div>
              <p style={{ fontSize:'0.75em', fontWeight:600, color:ph.active ? '#dde4e1' : '#859490', textAlign:'center', marginBottom:'0.25em' }}>{ph.label}</p>
              {ph.desc && <p style={{ fontSize:'0.625em', color:'#859490', textAlign:'center', maxWidth:'6.875em', lineHeight:1.4 }}>{ph.desc}</p>}
            </div>
            {i < phases.length - 1 && <div style={{ height:2, flex:0.4, background:ph.active ? accent : '#1c2341', marginTop:'0.75em', flexShrink:0 }}/>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── BLOCK: Metrics ──────────────────────────────────────────────────────────
function BlockMetrics({ content, accent }) {
  const items = content.items || [];
  const cols = content.cols || Math.min(items.length, 3) || 3;
  return (
    <div style={{ display:'flex', flexDirection:'column', padding:'1.25em 1.75em', height:'100%', gap:'0.75em' }}>
      {content.title && <h3 style={{ fontSize:'1.25em', fontWeight:700, color:'#dde4e1', flexShrink:0 }}>{content.title}</h3>}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:'0.625em', flex:1, alignContent:'start' }}>
        {items.map((item, i) => (
          <div key={i} style={{ background:'#0d1228', padding:'1em 0.875em', borderLeft:`3px solid ${item.color || accent}` }}>
            <div style={{ fontSize:'0.625em', letterSpacing:'0.1em', textTransform:'uppercase', color:'#859490', marginBottom:'0.375em' }}>{item.label}</div>
            <div style={{ fontSize:'1.625em', fontWeight:800, color:item.color || accent }}>{item.value}</div>
            {item.trend && <div style={{ fontSize:'0.625em', color:accent, marginTop:'0.25em' }}>{item.trend}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BLOCK: Table ────────────────────────────────────────────────────────────
function BlockTable({ content, accent }) {
  const headers = content.headers || [];
  const rows = content.rows || [];
  return (
    <div style={{ display:'flex', flexDirection:'column', padding:'1.25em 1.75em', height:'100%', gap:'0.75em' }}>
      {content.title && <h3 style={{ fontSize:'1.25em', fontWeight:700, color:'#dde4e1', flexShrink:0 }}>{content.title}</h3>}
      <div style={{ overflow:'auto', flex:1 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.8125em' }}>
          <thead>
            <tr>{headers.map((h,i) => <th key={i} style={{ padding:'0.5625em 0.875em', textAlign:'left', fontSize:'0.75em', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:accent, borderBottom:`2px solid ${accent}`, whiteSpace:'nowrap' }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row,ri) => (
              <tr key={ri} style={{ borderBottom:'1px solid #1c2341' }}>
                {(Array.isArray(row) ? row : [row]).map((cell,ci) => (
                  <td key={ci} style={{ padding:'0.5625em 0.875em', color:ci===0?'#dde4e1':'#bbcac5', fontWeight:ci===0?600:400 }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── BLOCK: Chart ────────────────────────────────────────────────────────────
function BlockChart({ content, accent }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const keyStr = JSON.stringify({ t: content.chartType, l: content.labels, d: content.datasets });

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    const ctx = canvasRef.current.getContext('2d');
    const labels = Array.isArray(content.labels) ? content.labels : (content.labels||'').split(',').map(s=>s.trim()).filter(Boolean);
    const PIE_COLORS = ['#42dcc6','#bec5eb','#fae374','#83e287','#ff7775','#3151d9','#9197ca'];
    const datasets = (content.datasets || []).map((ds) => {
      const raw = Array.isArray(ds.data) ? ds.data : String(ds.data||'').split(',').map(Number);
      const color = ds.color || accent;
      return {
        label: ds.label || '',
        data: raw,
        backgroundColor: content.chartType === 'pie' ? PIE_COLORS : color + 'aa',
        borderColor: content.chartType === 'pie' ? PIE_COLORS : color,
        borderWidth: content.chartType === 'line' ? 2 : 0,
        fill: false, tension: 0.4,
        pointBackgroundColor: color,
        pointRadius: content.chartType === 'line' ? 4 : 0,
      };
    });
    chartRef.current = new Chart(ctx, {
      type: content.chartType || 'bar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color:'#bbcac5', font:{ family:'Space Grotesk', size:11 }, boxWidth:12 } } },
        scales: ['pie','doughnut'].includes(content.chartType) ? {} : {
          x: { grid:{ color:'#1c2341' }, ticks:{ color:'#859490', font:{ family:'Space Grotesk', size:10 } }, border:{ color:'#1c2341' } },
          y: { grid:{ color:'#1c2341' }, ticks:{ color:'#859490', font:{ family:'Space Grotesk', size:10 } }, border:{ color:'#1c2341' } },
        },
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [keyStr]);

  return (
    <div style={{ display:'flex', flexDirection:'column', padding:'1.25em 1.75em', height:'100%', gap:'0.625em' }}>
      {content.title && <h3 style={{ fontSize:'1.25em', fontWeight:700, color:'#dde4e1', flexShrink:0 }}>{content.title}</h3>}
      <div style={{ flex:1, position:'relative', minHeight:0 }}>
        <canvas ref={canvasRef} style={{ width:'100% !important', height:'100% !important' }}/>
      </div>
    </div>
  );
}

// ─── BLOCK: CTA ──────────────────────────────────────────────────────────────
function BlockCTA({ content, accent, onNavigate }) {
  const hasPrimaryLink   = onNavigate && content.primaryTarget  !== undefined && content.primaryTarget  !== '';
  const hasSecondaryLink = onNavigate && content.secondaryTarget !== undefined && content.secondaryTarget !== '';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'0.875em', padding:'1.5em' }}>
      {content.pretext && <p style={{ fontSize:'0.75em', color:'#859490', letterSpacing:'0.08em', textTransform:'uppercase' }}>{content.pretext}</p>}
      {content.label && (
        <div onClick={() => hasPrimaryLink && onNavigate(Number(content.primaryTarget))}
          onMouseEnter={e => { if(hasPrimaryLink) e.currentTarget.style.opacity='0.8'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity='1'; }}
          style={{ background:accent, color:'#003730', padding:'1em 2.5em', fontSize:'0.9375em', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
            cursor:hasPrimaryLink?'pointer':'default', transition:'opacity 0.15s', display:'flex', alignItems:'center', gap:'0.625em' }}>
          {content.label}
          {hasPrimaryLink && <span style={{ fontSize:'0.75em', opacity:0.7 }}>→</span>}
        </div>
      )}
      {content.secondary && (
        <div onClick={() => hasSecondaryLink && onNavigate(Number(content.secondaryTarget))}
          onMouseEnter={e => { if(hasSecondaryLink) e.currentTarget.style.opacity='0.7'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity='1'; }}
          style={{ border:'1.5px solid #464a6c', color:'#bbcac5', padding:'0.75em 2em', fontSize:'0.8125em', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase',
            cursor:hasSecondaryLink?'pointer':'default', transition:'opacity 0.15s', display:'flex', alignItems:'center', gap:'0.5em' }}>
          {content.secondary}
          {hasSecondaryLink && <span style={{ fontSize:'0.6875em', opacity:0.6 }}>→</span>}
        </div>
      )}
      {content.note && <p style={{ fontSize:'0.6875em', color:'#859490', marginTop:'0.25em' }}>{content.note}</p>}
    </div>
  );
}

// ─── BLOCK: Divider ──────────────────────────────────────────────────────────
function BlockDivider({ content, accent }) {
  const c = content.style === 'accent' ? accent : '#1c2341';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:'0 3em', gap:'0.75em' }}>
      <div style={{ width:'100%', height:2, background:c }}/>
      {content.label && <span style={{ fontSize:'0.6875em', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:c }}>{content.label}</span>}
    </div>
  );
}

// ─── BLOCK: Image ────────────────────────────────────────────────────────────
function BlockImage({ content, isSelected, onTransformChange }) {
  const fit = content.fit || 'cover';
  const align = content.align || 'center';
  const imgScale    = content.imgScale    ?? 1;
  const imgRotation = content.imgRotation ?? 0;
  const imgX        = content.imgX        ?? 0;
  const imgY        = content.imgY        ?? 0;
  const containerRef = useRef(null);

  const startDrag = (e, type) => {
    e.stopPropagation(); e.preventDefault();
    if (!onTransformChange) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX, startY = e.clientY;
    const startScale = imgScale, startRot = imgRotation, startImgX = imgX, startImgY = imgY;
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const startDist = Math.max(1, Math.hypot(startX - cx, startY - cy));
    const onMove = (ev) => {
      if (type === 'scale') {
        const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
        onTransformChange({ imgScale: +Math.max(0.1, Math.min(6, startScale * (d / startDist))).toFixed(3) });
      } else if (type === 'rotate') {
        const a0 = Math.atan2(startY - cy, startX - cx);
        const a1 = Math.atan2(ev.clientY - cy, ev.clientX - cx);
        onTransformChange({ imgRotation: +((startRot + (a1 - a0) * 180 / Math.PI) % 360).toFixed(1) });
      } else if (type === 'move') {
        onTransformChange({ imgX: +(startImgX + (ev.clientX - startX) / rect.width  * 100).toFixed(2), imgY: +(startImgY + (ev.clientY - startY) / rect.height * 100).toFixed(2) });
      }
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  };

  if (!content.src) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', minHeight:'5em',
        background:'repeating-linear-gradient(45deg,#0d1228 0,#0d1228 10px,#111633 10px,#111633 20px)', pointerEvents:isSelected?'all':'none' }}>
        <GIcon name="image" size="2.25em" color="#464a6c"/>
        <span style={{ fontSize:'0.625em', color:'#464a6c', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:'0.5em' }}>Image block — upload in properties</span>
      </div>
    );
  }

  const H = { position:'absolute', background:'#42dcc6', border:'2px solid #003730', zIndex:20, pointerEvents:'all', flexShrink:0 };
  return (
    <div ref={containerRef} style={{ width:'100%', height:'100%', minHeight:'5em', overflow:'hidden', position:'relative', pointerEvents:isSelected?'all':'none', cursor:isSelected?'move':'default' }}
      onMouseDown={isSelected ? (e) => startDrag(e, 'move') : undefined}>
      <img src={content.src} alt={content.alt||''} style={{ width:'100%', height:'100%', objectFit:fit, objectPosition:align, display:'block',
        transform:`translate(${imgX}%, ${imgY}%) scale(${imgScale}) rotate(${imgRotation}deg)`, transformOrigin:'center center', pointerEvents:'none' }}/>
      {content.caption && (
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0.5em 1em', background:'rgba(0,0,27,0.75)', fontSize:'0.6875em', color:'#bbcac5', pointerEvents:'none' }}>
          {content.caption}
        </div>
      )}
      {isSelected && (<>
        <div style={{ ...H, top:0, left:0,  width:14, height:14, cursor:'nw-resize' }} onMouseDown={e=>startDrag(e,'scale')}/>
        <div style={{ ...H, top:0, right:0, width:14, height:14, cursor:'ne-resize' }} onMouseDown={e=>startDrag(e,'scale')}/>
        <div style={{ ...H, bottom:0, left:0,  width:14, height:14, cursor:'sw-resize' }} onMouseDown={e=>startDrag(e,'scale')}/>
        <div style={{ ...H, bottom:0, right:0, width:14, height:14, cursor:'se-resize' }} onMouseDown={e=>startDrag(e,'scale')}/>
        <div style={{ ...H, top:'50%', left:0,  width:10, height:28, transform:'translateY(-50%)', cursor:'ew-resize' }} onMouseDown={e=>startDrag(e,'scale')}/>
        <div style={{ ...H, top:'50%', right:0, width:10, height:28, transform:'translateY(-50%)', cursor:'ew-resize' }} onMouseDown={e=>startDrag(e,'scale')}/>
        <div style={{ ...H, left:'50%', top:0,    width:28, height:10, transform:'translateX(-50%)', cursor:'ns-resize' }} onMouseDown={e=>startDrag(e,'scale')}/>
        <div style={{ ...H, left:'50%', bottom:0, width:28, height:10, transform:'translateX(-50%)', cursor:'ns-resize' }} onMouseDown={e=>startDrag(e,'scale')}/>
        <div title="Rotar" style={{ ...H, top:6, right:6, width:30, height:30, borderRadius:'50%', background:'#0a0f26', border:'2px solid #42dcc6', cursor:'crosshair', display:'flex', alignItems:'center', justifyContent:'center' }}
          onMouseDown={e=>startDrag(e,'rotate')}><GIcon name="rotate_right" size={16} color="#42dcc6"/></div>
        <div title="Resetear" style={{ position:'absolute', bottom:6, right:6, background:'#0a0f26', border:'1px solid #42dcc6', color:'#42dcc6', fontSize:9, fontWeight:700, padding:'3px 8px', cursor:'pointer', letterSpacing:'0.06em', pointerEvents:'all', zIndex:20 }}
          onMouseDown={e=>{ e.stopPropagation(); e.preventDefault(); onTransformChange && onTransformChange({imgScale:1,imgRotation:0,imgX:0,imgY:0}); }}>RESET</div>
        <div style={{ position:'absolute', top:6, left:6, background:'rgba(10,15,38,0.85)', border:'1px solid #1c2341', color:'#42dcc6', fontSize:9, fontWeight:700, padding:'2px 7px', letterSpacing:'0.06em', pointerEvents:'none', zIndex:20 }}>
          {Math.round(imgScale*100)}% · {Math.round(imgRotation)}°
        </div>
      </>)}
    </div>
  );
}

// ─── BLOCK: Empty ────────────────────────────────────────────────────────────
function BlockEmpty({ editorMode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', minHeight:'3.75em' }}>
      {editorMode && <span style={{ fontSize:'0.625em', color:'#464a6c', letterSpacing:'0.08em', textTransform:'uppercase' }}>Empty — click to add block</span>}
    </div>
  );
}

// ─── Block Dispatcher ────────────────────────────────────────────────────────
// scale = cell.fontSize || 1  → sets the root fontSize of the block wrapper
function BlockRenderer({ cell, lang, accent, editorMode, isSelected, onTransformChange, onNavigate, project }) {
  const content = (cell.content && (cell.content[lang] || cell.content['en'] || cell.content[Object.keys(cell.content)[0]])) || {};
  const scale = cell.fontSize || 1;
  const t = cell.block;

  // Resolve chart data from linked table if configured
  let resolvedContent = content;
  if (t === 'chart' && content.linkedTable && project) {
    const link = content.linkedTable;
    let srcContent = null;
    outer: for (const sl of project.slides) {
      function scanForTable(rows) {
        for (const row of (rows||[])) {
          for (const c of (row.cells||[])) {
            if (c.id === link.cellId && c.block === 'table') {
              srcContent = c.content?.[lang] || c.content?.en || (c.content && c.content[Object.keys(c.content)[0]]) || {};
              return true;
            }
            if (c.rows && scanForTable(c.rows)) return true;
          }
        }
        return false;
      }
      if (scanForTable(sl.rows)) break outer;
    }
    if (srcContent) {
      const headers = srcContent.headers || [];
      const rows = srcContent.rows || [];
      const xCol = link.xCol ?? 0;
      const yCols = link.yCols || [1];
      const PIE_COLORS = ['#42dcc6','#bec5eb','#fae374','#83e287','#ff7775','#3151d9','#9197ca'];
      const labels = rows.map(r => (Array.isArray(r) ? r[xCol] : r) || '');
      const datasets = yCols.map((ci, di) => ({
        label: headers[ci] || `Col ${ci+1}`,
        data: rows.map(r => {
          const v = Array.isArray(r) ? r[ci] : '';
          return parseFloat(String(v).replace(/[^0-9.\-]/g,'')) || 0;
        }),
        color: PIE_COLORS[di % PIE_COLORS.length],
      }));
      resolvedContent = { ...content, labels, datasets };
    }
  }

  let inner;
  if (t === 'title')     inner = <BlockTitle     content={resolvedContent} accent={accent}/>;
  else if (t === 'text')      inner = <BlockText      content={resolvedContent}/>;
  else if (t === 'checklist') inner = <BlockChecklist content={resolvedContent} accent={accent}/>;
  else if (t === 'timeline')  inner = <BlockTimeline  content={resolvedContent} accent={accent}/>;
  else if (t === 'metrics')   inner = <BlockMetrics   content={resolvedContent} accent={accent}/>;
  else if (t === 'table')     inner = <BlockTable     content={resolvedContent} accent={accent}/>;
  else if (t === 'chart')     inner = <BlockChart     content={resolvedContent} accent={accent}/>;
  else if (t === 'cta')       inner = <BlockCTA       content={resolvedContent} accent={accent} onNavigate={onNavigate}/>;
  else if (t === 'divider')   inner = <BlockDivider   content={resolvedContent} accent={accent}/>;
  else if (t === 'image')     inner = <BlockImage     content={resolvedContent} isSelected={isSelected} onTransformChange={onTransformChange}/>;
  else                        inner = <BlockEmpty editorMode={editorMode}/>;

  return (
    <div style={{ fontSize: scale * BASE, width:'100%', height:'100%', display:'flex', flexDirection:'column' }}>
      {inner}
    </div>
  );
}

// ─── Slide View ──────────────────────────────────────────────────────────────
function SlideView({ slide, lang, accent, logoSrc, clientName, mode, selPath, onSelect, onTransformChange, onNavigate, project }) {

  function renderRows(rows, pathPrefix) {
    return (rows || []).map((row, ri) => (
      <div key={row.id || ri} style={{ display:'grid', gridTemplateColumns:(row.cols||['1fr']).join(' '), flex:row.flex||1, minHeight:0 }}>
        {(row.cells || []).map((cell, ci) => {
          const cellPath = [...pathPrefix, [ri, ci]];
          const isSelected  = mode === 'editor' && selPath && pathsEqual(cellPath, selPath);
          const isAncestor  = mode === 'editor' && selPath && isPathPrefix(cellPath, selPath);
          const isContainer = !!cell.rows;

          return (
            <div key={cell.id || ci}
              onClick={mode === 'editor' ? (e) => { e.stopPropagation(); onSelect && onSelect(cellPath); } : undefined}
              onMouseDown={mode === 'editor' ? (e) => { e.stopPropagation(); } : undefined}
              style={{
                position:'relative', overflow:'hidden', minHeight:0,
                display:'flex', flexDirection:'column',
                userSelect:'none',
                border: isSelected
                  ? `2px solid ${accent}`
                  : isAncestor
                    ? `1px solid rgba(66,220,198,0.35)`
                    : mode === 'editor' ? '1px dashed #1c2341' : 'none',
                cursor: mode === 'editor' ? 'pointer' : 'default',
                background: isContainer && mode === 'editor' ? 'rgba(66,220,198,0.02)' : 'transparent',
              }}>

              {isContainer
                ? <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
                    {renderRows(cell.rows, cellPath)}
                  </div>
                : <BlockRenderer
                    cell={cell} lang={lang} accent={accent}
                    editorMode={mode === 'editor'}
                    isSelected={isSelected}
                    onTransformChange={onTransformChange ? (updates) => onTransformChange(cellPath, updates) : null}
                    onNavigate={mode !== 'editor' ? onNavigate : null}
                    project={project}
                  />
              }

              {isSelected && mode === 'editor' && (
                <div style={{ position:'absolute', top:4, right:4, background: isContainer ? 'rgba(10,15,38,0.9)' : accent,
                  border: isContainer ? `1px solid ${accent}` : 'none', color: isContainer ? accent : '#003730',
                  fontSize:9, fontWeight:700, padding:'2px 6px', letterSpacing:'0.08em', textTransform:'uppercase', pointerEvents:'none' }}>
                  {isContainer ? 'container' : (cell.fontSize && cell.fontSize !== 1 ? `${Math.round(cell.fontSize*100)}%` : 'editing')}
                </div>
              )}

              {pathPrefix.length > 0 && mode === 'editor' && !isSelected && (
                <div style={{ position:'absolute', top:2, left:2, width:4, height:4,
                  background:`rgba(66,220,198,${0.15 * pathPrefix.length})`, pointerEvents:'none' }}/>
              )}
            </div>
          );
        })}
      </div>
    ));
  }

  return (
    <div style={{ width:1920, height:1080, background:'#00001b', fontFamily:"'Space Grotesk',sans-serif", position:'relative', overflow:'hidden', userSelect:'none' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(rgba(66,220,198,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(66,220,198,0.025) 1px,transparent 1px)`, backgroundSize:'40px 40px', pointerEvents:'none' }}/>
      {/* Header */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:68, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 64px', borderBottom:'1px solid #1c2341', zIndex:5, background:'#00001b' }}>
        {logoSrc
          ? <img src={logoSrc} style={{ height:30, objectFit:'contain' }} alt="logo"/>
          : <span style={{ fontSize:14, fontWeight:800, letterSpacing:'0.1em', color:'#dde4e1', textTransform:'uppercase' }}>{clientName || 'GOAL SYSTEMS'}</span>}
        <span style={{ fontSize:10, color:'#464a6c', letterSpacing:'0.1em', textTransform:'uppercase' }}>{slide.label || ''}</span>
      </div>
      {/* Content */}
      <div style={{ position:'absolute', top:68, left:0, right:0, bottom:36, display:'flex', flexDirection:'column' }}>
        {renderRows(slide.rows || [], [])}
      </div>
      {/* Footer */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:36, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 64px', borderTop:'1px solid #1c2341', background:'#00001b' }}>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#464a6c' }}>{clientName || 'GOAL SYSTEMS'}</span>
        <span style={{ fontSize:9, color:'#464a6c' }}>{slide.slideNum || ''}</span>
      </div>
    </div>
  );
}

// ─── Block Metadata ──────────────────────────────────────────────────────────
const BLOCKS_META = [
  { id:'empty',     label:'Empty',     icon:'crop_square' },
  { id:'title',     label:'Title',     icon:'title' },
  { id:'text',      label:'Text',      icon:'notes' },
  { id:'checklist', label:'Checklist', icon:'checklist' },
  { id:'timeline',  label:'Timeline',  icon:'linear_scale' },
  { id:'metrics',   label:'Metrics',   icon:'monitoring' },
  { id:'table',     label:'Table',     icon:'table_chart' },
  { id:'chart',     label:'Chart',     icon:'bar_chart' },
  { id:'cta',       label:'CTA',       icon:'smart_button' },
  { id:'divider',   label:'Divider',   icon:'horizontal_rule' },
  { id:'image',     label:'Image',     icon:'image' },
];

// ─── Block Default Content ───────────────────────────────────────────────────
const BLOCK_DEFAULTS = {
  title:     { en:{ tag:'', title:'Slide Title', subtitle:'Supporting description for this section.', size:'lg' }, es:{ tag:'', title:'Título del Slide', subtitle:'Descripción de apoyo para esta sección.', size:'lg' } },
  text:      { en:{ body:'Add your text content here.' }, es:{ body:'Añade el contenido de texto aquí.' } },
  checklist: { en:{ title:'Training Modules', subtitle:'Complete required modules before going live.', items:[
    { title:'Platform Overview', desc:'Navigation and workspace orientation', dur:'15 min', tag:'Required', done:false },
    { title:'Fleet Management',  desc:'Vehicle assignment and tracking',       dur:'25 min', tag:'Required', done:false },
    { title:'Route & Schedule',  desc:'Configure routes and timetables',       dur:'30 min', tag:'Required', done:false },
    { title:'Incident Response', desc:'Handling alerts and delays',            dur:'20 min', tag:'Recommended', done:false },
  ]}, es:{ title:'Módulos de Formación', subtitle:'Completa los módulos obligatorios antes del lanzamiento.', items:[
    { title:'Visión General',       desc:'Navegación y orientación del workspace', dur:'15 min', tag:'Obligatorio', done:false },
    { title:'Gestión de Flota',     desc:'Asignación de vehículos y seguimiento', dur:'25 min', tag:'Obligatorio', done:false },
    { title:'Ruta y Horario',       desc:'Configurar rutas y horarios',            dur:'30 min', tag:'Obligatorio', done:false },
    { title:'Respuesta a Incidentes', desc:'Gestión de alertas y retrasos',        dur:'20 min', tag:'Recomendado', done:false },
  ]}},
  timeline:  { en:{ title:'Deployment Timeline', subtitle:'Phased rollout from staging to full operation.', phases:[
    { label:'Staging', desc:'Internal testing', active:true }, { label:'Pilot', desc:'10% of fleet', active:true },
    { label:'Full Rollout', desc:'All routes', active:false }, { label:'Steady State', desc:'Full monitoring', active:false },
  ]}, es:{ title:'Cronograma de Despliegue', subtitle:'Despliegue por fases hasta operación completa.', phases:[
    { label:'Staging', desc:'Pruebas internas', active:true }, { label:'Piloto', desc:'10% de la flota', active:true },
    { label:'Despliegue Total', desc:'Todas las rutas', active:false }, { label:'Estado Estable', desc:'Monitoreo completo', active:false },
  ]}},
  metrics:   { en:{ title:'Key Metrics', cols:3, items:[
    { label:'Active Vehicles', value:'4,092', trend:'+2.3%', color:'#42dcc6' },
    { label:'On-Time Rate',    value:'94.7%', trend:'+0.8%', color:'#83e287' },
    { label:'Daily Passengers',value:'142K',  trend:'+5.1%', color:'#fae374' },
  ]}, es:{ title:'Indicadores Clave', cols:3, items:[
    { label:'Vehículos Activos', value:'4,092', trend:'+2.3%', color:'#42dcc6' },
    { label:'Puntualidad',       value:'94.7%', trend:'+0.8%', color:'#83e287' },
    { label:'Pasajeros/Día',     value:'142K',  trend:'+5.1%', color:'#fae374' },
  ]}},
  table:     { en:{ title:'Operational Data', headers:['Route','Vehicles','On-Time %','Status'], rows:[
    ['Route 01 — Centro','24','96.2%','Active'], ['Route 05 — Norte','18','91.4%','Active'], ['Route 12 — Sur','31','88.7%','Pilot'],
  ]}, es:{ title:'Datos Operativos', headers:['Ruta','Vehículos','Puntualidad %','Estado'], rows:[
    ['Línea 01 — Centro','24','96.2%','Activo'], ['Línea 05 — Norte','18','91.4%','Activo'], ['Línea 12 — Sur','31','88.7%','Piloto'],
  ]}},
  chart:     { en:{ title:'Fleet Performance', chartType:'bar', labels:['Jan','Feb','Mar','Apr','May','Jun'], datasets:[
    { label:'On-Time', data:[91,93,89,94,96,95], color:'#42dcc6' }, { label:'Delayed', data:[9,7,11,6,4,5], color:'#ff7775' },
  ]}, es:{ title:'Rendimiento de la Flota', chartType:'bar', labels:['Ene','Feb','Mar','Abr','May','Jun'], datasets:[
    { label:'Puntual', data:[91,93,89,94,96,95], color:'#42dcc6' }, { label:'Con Retraso', data:[9,7,11,6,4,5], color:'#ff7775' },
  ]}},
  cta:       { en:{ pretext:'Ready to start?', label:'Open Command Center', secondary:'View Documentation', note:'' },
               es:{ pretext:'¿Listo para empezar?', label:'Abrir Centro de Control', secondary:'Ver Documentación', note:'' } },
  divider:   { en:{ style:'accent', label:'' }, es:{ style:'accent', label:'' } },
  image:     { en:{ src:'', alt:'', caption:'', fit:'cover', align:'center', imgScale:1, imgRotation:0, imgX:0, imgY:0 },
               es:{ src:'', alt:'', caption:'', fit:'cover', align:'center', imgScale:1, imgRotation:0, imgX:0, imgY:0 } },
  empty:     { en:{}, es:{} },
};

// ─── Slide Templates ─────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2,9); }
function makeCell(block) {
  return { id:uid(), block, content: JSON.parse(JSON.stringify(BLOCK_DEFAULTS[block]||{en:{},es:{}})) };
}
function makeRow(cols, blocks) {
  return { id:uid(), cols, flex:1, cells:blocks.map(makeCell) };
}

const SLIDE_TEMPLATES = [
  { id:'welcome',    label:'Welcome',        icon:'waving_hand',    desc:'Hero screen with logo and features',
    make:()=>({ id:uid(), label:'Welcome',  bg:'dark', rows:[ makeRow(['1fr'],['title']), makeRow(['1fr','1fr'],['checklist','metrics']) ] }) },
  { id:'section',    label:'Section Divider',icon:'bookmark',       desc:'Large section number and title',
    make:()=>({ id:uid(), label:'Section',  bg:'dark', rows:[ makeRow(['1fr'],['title']) ] }) },
  { id:'checklist',  label:'Checklist',      icon:'checklist',      desc:'Training modules list',
    make:()=>({ id:uid(), label:'Training', bg:'dark', rows:[ makeRow(['1fr','2fr'],['title','checklist']) ] }) },
  { id:'timeline',   label:'Timeline',       icon:'linear_scale',   desc:'Phased deployment timeline',
    make:()=>({ id:uid(), label:'Timeline', bg:'dark', rows:[ makeRow(['1fr'],['title']), makeRow(['1fr'],['timeline']) ] }) },
  { id:'metrics',    label:'Metrics',        icon:'monitoring',     desc:'KPI grid',
    make:()=>({ id:uid(), label:'Metrics',  bg:'dark', rows:[ makeRow(['1fr'],['title']), makeRow(['1fr'],['metrics']) ] }) },
  { id:'table',      label:'Table',          icon:'table_chart',    desc:'Data table',
    make:()=>({ id:uid(), label:'Data',     bg:'dark', rows:[ makeRow(['1fr'],['table']) ] }) },
  { id:'chart',      label:'Chart',          icon:'bar_chart',      desc:'Bar, line or pie chart',
    make:()=>({ id:uid(), label:'Chart',    bg:'dark', rows:[ makeRow(['1fr'],['chart']) ] }) },
  { id:'table-chart',label:'Table + Chart',  icon:'dashboard',      desc:'Table and chart side by side',
    make:()=>({ id:uid(), label:'Data',     bg:'dark', rows:[ makeRow(['1fr','1fr'],['table','chart']) ] }) },
  { id:'launch',     label:'Launch / Close', icon:'rocket_launch',  desc:'Closing confirmation screen',
    make:()=>({ id:uid(), label:'Launch',   bg:'dark', rows:[ makeRow(['1fr'],['title']), makeRow(['1fr'],['metrics']), makeRow(['1fr'],['cta']) ] }) },
];

Object.assign(window, { BlockRenderer, SlideView, BLOCK_DEFAULTS, SLIDE_TEMPLATES, BLOCKS_META, uid, makeCell, makeRow, pathsEqual, isPathPrefix });

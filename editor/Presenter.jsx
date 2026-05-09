// editor/Presenter.jsx — Fullscreen presentation mode
// Exports: PresenterMode

function PresenterMode({ project, onExit }) {
  const { slides, meta } = project;
  const lang = meta.lang || 'en';
  const accent = meta.accent || '#42dcc6';
  const [idx, setIdx] = React.useState(() => {
    const s = parseInt(localStorage.getItem('gs_editor_presIdx') || '0');
    return Math.min(s, slides.length - 1);
  });

  const go = (n) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, n));
    setIdx(clamped);
    localStorage.setItem('gs_editor_presIdx', clamped);
  };

  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') go(idx + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(idx - 1);
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [idx]);

  const slide = slides[idx];
  if (!slide) return null;

  const slideWithNum = { ...slide, slideNum: `${idx + 1} / ${slides.length}` };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Scaled slide */}
      <div style={{
        width: '100vw', height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 1920, height: 1080,
          transform: `scale(${Math.min(window.innerWidth / 1920, window.innerHeight / 1080)})`,
          transformOrigin: 'center center',
        }}>
          <SlideView
            slide={slideWithNum}
            lang={lang}
            accent={accent}
            logoSrc={meta.logoSrc}
            clientName={meta.clientName}
            mode="present"
            onNavigate={go}
          />
        </div>
      </div>

      {/* Exit button */}
      <button
        onClick={onExit}
        title="Exit (Esc)"
        style={{
          position: 'fixed', top: 20, right: 20, zIndex: 10000,
          background: 'rgba(0,0,0,0.6)', border: '1px solid #464a6c',
          color: '#bbcac5', cursor: 'pointer', padding: '8px 14px',
          fontFamily: 'Space Grotesk, sans-serif', fontSize: 12,
          fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 6,
          opacity: 0, transition: 'opacity 0.3s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
        ESC
      </button>

      {/* Prev / Next arrows */}
      {idx > 0 && (
        <button onClick={() => go(idx - 1)} style={{
          position: 'fixed', left: 20, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.5)', border: '1px solid #464a6c',
          color: '#bbcac5', cursor: 'pointer', padding: '14px 10px',
          opacity: 0, transition: 'opacity 0.3s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      )}
      {idx < slides.length - 1 && (
        <button onClick={() => go(idx + 1)} style={{
          position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(0,0,0,0.5)', border: '1px solid #464a6c',
          color: '#bbcac5', cursor: 'pointer', padding: '14px 10px',
          opacity: 0, transition: 'opacity 0.3s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
        >
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      )}

      {/* Slide counter */}
      <div style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.6)', border: '1px solid #464a6c',
        color: '#859490', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 600, letterSpacing: '0.1em', padding: '6px 16px',
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        {slides.map((_, i) => (
          <div key={i} onClick={() => go(i)} style={{
            width: i === idx ? 20 : 6, height: 6,
            background: i === idx ? accent : '#464a6c',
            cursor: 'pointer', transition: 'all 0.3s',
          }} />
        ))}
        <span style={{ marginLeft: 8 }}>{idx + 1} / {slides.length}</span>
      </div>
    </div>
  );
}

Object.assign(window, { PresenterMode });

// ── Tweaks panel (tasarım modu) ────────────────────────────────
// Ctrl+Shift+T ile aç/kapat. Sadece geliştirme amaçlıdır.

(function () {
  const { useState, useEffect } = React;

  const THEMES  = ['navy', 'dark', 'light'];
  const DENSITY = ['compact', 'comfortable'];

  function TweaksPanel() {
    const defaults = window.__tweakDefaults || {};
    const [side,    setSide]    = useState(defaults.sideTheme  || 'navy');
    const [density, setDensity] = useState(defaults.density    || 'compact');
    const [width,   setWidth]   = useState(defaults.sideWidth  || 248);

    const apply = (s, d, w) => {
      const shell = document.querySelector('.shell');
      if (!shell) return;
      shell.dataset.side    = s;
      shell.dataset.density = d;
      shell.style.setProperty('--side-w', w + 'px');
    };

    useEffect(() => apply(side, density, width), []);

    const changeSide = (v)    => { setSide(v);    apply(v, density, width); };
    const changeDens = (v)    => { setDensity(v); apply(side, v, width); };
    const changeWidth= (v)    => { setWidth(v);   apply(side, density, v); };

    return (
      <div style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
        background: '#fff', border: '1px solid var(--border)',
        borderRadius: 14, boxShadow: 'var(--shadow-pop)',
        padding: '16px 18px', width: 220,
        display: 'flex', flexDirection: 'column', gap: 12,
        fontSize: 12,
      }}>
        <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-2)', textTransform: 'uppercase' }}>
          Tasarım Tweaks
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Kenar çubuğu teması</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {THEMES.map(t => (
              <button key={t}
                onClick={() => changeSide(t)}
                style={{
                  flex: 1, padding: '5px 4px', borderRadius: 6, border: '1px solid',
                  borderColor: side === t ? 'var(--brand-navy)' : 'var(--border)',
                  background: side === t ? 'var(--brand-navy-soft)' : 'transparent',
                  color: side === t ? 'var(--brand-navy)' : 'var(--text-2)',
                  fontWeight: side === t ? 700 : 500, fontSize: 11, cursor: 'pointer',
                }}
              >{t}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Yoğunluk</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {DENSITY.map(d => (
              <button key={d}
                onClick={() => changeDens(d)}
                style={{
                  flex: 1, padding: '5px 4px', borderRadius: 6, border: '1px solid',
                  borderColor: density === d ? 'var(--brand-navy)' : 'var(--border)',
                  background: density === d ? 'var(--brand-navy-soft)' : 'transparent',
                  color: density === d ? 'var(--brand-navy)' : 'var(--text-2)',
                  fontWeight: density === d ? 700 : 500, fontSize: 11, cursor: 'pointer',
                }}
              >{d === 'compact' ? 'Sıkışık' : 'Geniş'}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Kenar çubuğu genişliği: {width}px</div>
          <input type="range" min="200" max="320" value={width}
            onChange={e => changeWidth(Number(e.target.value))}
            style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  // Tweaks container'ı oluştur
  const host = document.querySelector('.tweaks-host');
  if (host) {
    const root = ReactDOM.createRoot(host);

    // Ctrl+Shift+T ile aç/kapat
    let visible = false;
    const toggle = () => {
      visible = !visible;
      document.body.dataset.edit = visible ? '1' : '0';
      if (visible) root.render(<TweaksPanel />);
    };
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') toggle();
    });
  }
})();

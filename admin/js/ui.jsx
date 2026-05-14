// ── Paylaşılan UI bileşenleri ───────────────────────────────────
// app.css sınıf sistemini kullanır. Tüm bileşenler window üzerine
// export edilir böylece Babel standalone'un her dosyası erişebilir.

// ── Spinner ────────────────────────────────────────────────────
window.Spinner = function Spinner({ size = 36 }) {
  return (
    <div className="loading-wrap">
      <div className="spinner" style={{ width: size, height: size }} />
    </div>
  );
};

// ── Badge ──────────────────────────────────────────────────────
window.Badge = function Badge({ cls = 'b-muted', children, icon }) {
  return (
    <span className={`badge ${cls}`}>
      {icon && <span className="material-icons">{icon}</span>}
      {children}
    </span>
  );
};

// ── Avatar ─────────────────────────────────────────────────────
window.Av = function Av({ name, size = '', square = false, img }) {
  const cls = ['av', size && `av-${size}`, square && 'av-sq', avColor(name)].filter(Boolean).join(' ');
  if (img) return <img className={cls} src={img} alt={name} style={{ objectFit: 'cover' }} />;
  return <div className={cls}>{initials(name)}</div>;
};

// ── Modal ──────────────────────────────────────────────────────
window.Modal = function Modal({ title, sub, wide, onClose, footer, children }) {
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`modal${wide ? ' wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <div style={{ flex: 1 }}>
            <h3>{title}</h3>
            {sub && <div className="sub">{sub}</div>}
          </div>
          <button className="x" onClick={onClose}><span className="material-icons">close</span></button>
        </div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  );
};

// ── Field (form alanı) ─────────────────────────────────────────
window.Field = function Field({ label, children, hint }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{hint}</span>}
    </div>
  );
};

// ── Switch ─────────────────────────────────────────────────────
window.Switch = function Switch({ on, onChange, label }) {
  return (
    <label className={`switch${on ? ' on' : ''}`} style={{ cursor: 'pointer' }}>
      <div className="track" onClick={() => onChange?.(!on)} />
      {label && <span style={{ fontSize: 13, color: 'var(--text-1)' }}>{label}</span>}
    </label>
  );
};

// ── Stat kartı ─────────────────────────────────────────────────
window.StatCard = function StatCard({ icon, n, label, tint = '', delta, deltaDir = 'flat' }) {
  return (
    <div className={`stat${tint ? ` tint-${tint}` : ''}`}>
      <div className="ic"><span className="material-icons">{icon}</span></div>
      <div className="n">{n ?? '—'}</div>
      <div className="l">{label}</div>
      {delta != null && (
        <div className={`delta ${deltaDir}`}>
          <span className="material-icons">{deltaDir === 'up' ? 'arrow_upward' : deltaDir === 'dn' ? 'arrow_downward' : 'remove'}</span>
          {delta}
        </div>
      )}
    </div>
  );
};

// ── TimeBubble ─────────────────────────────────────────────────
window.TimeBubble = function TimeBubble({ start, end }) {
  return (
    <div className="time-bubble">
      <b>{fmtTime(start)}</b>
      <b>{fmtTime(end)}</b>
    </div>
  );
};

// ── BookingRow ─────────────────────────────────────────────────
window.BookingRow = function BookingRow({ booking, onClick }) {
  const players = booking.players || booking.booking_players || [];
  const playerName = booking.player_name ||
    players.find(p => p.is_primary_player)?.profiles?.full_name ||
    players[0]?.profiles?.full_name || '—';
  const others = players.length - 1;

  const courtNum = booking.court_number ||
    booking.courts?.court_number ||
    (booking.court_id ? 'K-' + booking.court_id.slice(-4) : '—');

  return (
    <div className="book-row" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <TimeBubble start={booking.start_time} end={booking.end_time} />
      <div className="info">
        <div className="n">{playerName}{others > 0 ? ` +${others}` : ''}</div>
        <div className="l">
          <span className="material-icons">sports_tennis</span>
          Kort {courtNum}
        </div>
      </div>
      <Badge cls={statusClass(booking.status)}>{statusLabel(booking.status)}</Badge>
    </div>
  );
};

// ── EmptyState ─────────────────────────────────────────────────
window.EmptyState = function EmptyState({ icon = 'inbox', title = 'Veri yok', sub }) {
  return (
    <div className="empty">
      <div className="ic"><span className="material-icons">{icon}</span></div>
      <div className="t">{title}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  );
};

// ── Tabs ───────────────────────────────────────────────────────
window.Tabs = function Tabs({ items, active, onChange }) {
  return (
    <div className="tabs">
      {items.map(it => (
        <button
          key={it.key}
          className={active === it.key ? 'active' : ''}
          onClick={() => onChange(it.key)}
        >
          {it.label}
          {it.count != null && <span className="ct">{it.count}</span>}
        </button>
      ))}
    </div>
  );
};

// ── Confirm Dialog ─────────────────────────────────────────────
window.Confirm = function Confirm({ title, body, danger, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} footer={
      <>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Vazgeç</button>
        <button className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-pri'}`} onClick={onConfirm}>
          {danger ? 'Evet, sil' : 'Onayla'}
        </button>
      </>
    }>
      <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{body}</p>
    </Modal>
  );
};

// ── MiniCalendar ───────────────────────────────────────────────
window.MiniCalendar = function MiniCalendar({ selected, onSelect, dotDates = [] }) {
  const { useState: uSt, useMemo: uMemo } = React;
  const today = new Date();
  const [cur, setCur] = uSt(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const days = uMemo(() => {
    const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
    const last  = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    const start = first.getDay(); // 0=Sun
    const cells = [];
    // padding from previous month
    for (let i = 0; i < start; i++) {
      const d = new Date(first); d.setDate(d.getDate() - (start - i));
      cells.push({ date: d, muted: true });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push({ date: new Date(cur.getFullYear(), cur.getMonth(), d), muted: false });
    }
    // pad to 6 rows
    while (cells.length % 7 !== 0) {
      const prev = cells[cells.length - 1].date;
      const d = new Date(prev); d.setDate(d.getDate() + 1);
      cells.push({ date: d, muted: true });
    }
    return cells;
  }, [cur]);

  const fmt = d => d.toISOString().split('T')[0];
  const todayStr = fmt(today);
  const dotSet = new Set(dotDates);

  const prevMonth = () => setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
  const nextMonth = () => setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));

  const monthLabel = cur.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <div className="calendar">
      <div className="cal-h">
        <button className="icon-btn" onClick={prevMonth}><span className="material-icons">chevron_left</span></button>
        <span className="m" style={{ textTransform: 'capitalize' }}>{monthLabel}</span>
        <button className="icon-btn" onClick={nextMonth}><span className="material-icons">chevron_right</span></button>
      </div>
      <div className="cal-grid">
        {['Pz','Pt','Sa','Ça','Pe','Cu','Ct'].map(d => (
          <div key={d} className="dow">{d}</div>
        ))}
        {days.map(({ date, muted }, i) => {
          const ds = fmt(date);
          const isToday = ds === todayStr;
          const isSel   = ds === selected;
          const hasDot  = dotSet.has(ds);
          return (
            <div
              key={i}
              className={['d', muted && 'muted', isToday && !isSel && 'today', isSel && 'sel'].filter(Boolean).join(' ')}
              onClick={() => !muted && onSelect(ds)}
            >
              {date.getDate()}
              {hasDot && <span className="dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

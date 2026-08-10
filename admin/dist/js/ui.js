window.Spinner = function Spinner({ size = 36 }) {
  return /* @__PURE__ */ React.createElement("div", { className: "loading-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "spinner", style: { width: size, height: size } }));
};
window.Badge = function Badge2({ cls = "b-muted", children, icon }) {
  return /* @__PURE__ */ React.createElement("span", { className: `badge ${cls}` }, icon && /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, icon), children);
};
window.Av = function Av({ name, size = "", square = false, img }) {
  const cls = ["av", size && `av-${size}`, square && "av-sq", avColor(name)].filter(Boolean).join(" ");
  if (img) return /* @__PURE__ */ React.createElement("img", { className: cls, src: img, alt: name, style: { objectFit: "cover" } });
  return /* @__PURE__ */ React.createElement("div", { className: cls }, initials(name));
};
window.Modal = function Modal2({ title, sub, wide, onClose, footer, children }) {
  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return /* @__PURE__ */ React.createElement("div", { className: "modal-backdrop", onClick: (e) => {
    if (e.target === e.currentTarget) onClose?.();
  } }, /* @__PURE__ */ React.createElement("div", { className: `modal${wide ? " wide" : ""}`, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-h" }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("h3", null, title), sub && /* @__PURE__ */ React.createElement("div", { className: "sub" }, sub)), /* @__PURE__ */ React.createElement("button", { className: "x", onClick: onClose }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "close"))), /* @__PURE__ */ React.createElement("div", { className: "modal-b" }, children), footer && /* @__PURE__ */ React.createElement("div", { className: "modal-f" }, footer)));
};
window.Field = function Field({ label, children, hint }) {
  return /* @__PURE__ */ React.createElement("div", { className: "field" }, label && /* @__PURE__ */ React.createElement("label", null, label), children, hint && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)" } }, hint));
};
window.Switch = function Switch({ on, onChange, label }) {
  return /* @__PURE__ */ React.createElement("label", { className: `switch${on ? " on" : ""}`, style: { cursor: "pointer" } }, /* @__PURE__ */ React.createElement("div", { className: "track", onClick: () => onChange?.(!on) }), label && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-1)" } }, label));
};
window.StatCard = function StatCard({ icon, n, label, tint = "", delta, deltaDir = "flat" }) {
  return /* @__PURE__ */ React.createElement("div", { className: `stat${tint ? ` tint-${tint}` : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "ic" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, icon)), /* @__PURE__ */ React.createElement("div", { className: "n" }, n ?? "\u2014"), /* @__PURE__ */ React.createElement("div", { className: "l" }, label), delta != null && /* @__PURE__ */ React.createElement("div", { className: `delta ${deltaDir}` }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, deltaDir === "up" ? "arrow_upward" : deltaDir === "dn" ? "arrow_downward" : "remove"), delta));
};
window.TimeBubble = function TimeBubble2({ start, end }) {
  return /* @__PURE__ */ React.createElement("div", { className: "time-bubble" }, /* @__PURE__ */ React.createElement("b", null, fmtTime(start)), /* @__PURE__ */ React.createElement("b", null, fmtTime(end)));
};
window.BookingRow = function BookingRow({ booking, onClick }) {
  const players = booking.players || booking.booking_players || [];
  const playerName = booking.player_name || players.find((p) => p.is_primary_player)?.profiles?.full_name || players[0]?.profiles?.full_name || booking.user_profile?.full_name || "\u2014";
  const others = players.length - 1;
  const courtNum = booking.court_number || booking.courts?.court_number || (booking.court_id ? "K-" + booking.court_id.slice(-4) : "\u2014");
  return /* @__PURE__ */ React.createElement("div", { className: "book-row", style: { cursor: onClick ? "pointer" : "default" }, onClick }, /* @__PURE__ */ React.createElement(TimeBubble, { start: booking.start_time, end: booking.end_time }), /* @__PURE__ */ React.createElement("div", { className: "info" }, /* @__PURE__ */ React.createElement("div", { className: "n" }, playerName, others > 0 ? ` +${others}` : ""), /* @__PURE__ */ React.createElement("div", { className: "l" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "sports_tennis"), "Kort ", courtNum)), /* @__PURE__ */ React.createElement(Badge, { cls: paymentClass(booking.payment_status) }, paymentLabel(booking.payment_status)));
};
window.EmptyState = function EmptyState({ icon = "inbox", title = "Veri yok", sub }) {
  return /* @__PURE__ */ React.createElement("div", { className: "empty" }, /* @__PURE__ */ React.createElement("div", { className: "ic" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, icon)), /* @__PURE__ */ React.createElement("div", { className: "t" }, title), sub && /* @__PURE__ */ React.createElement("div", { className: "s" }, sub));
};
window.Tabs = function Tabs({ items, active, onChange }) {
  return /* @__PURE__ */ React.createElement("div", { className: "tabs" }, items.map((it) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: it.key,
      className: active === it.key ? "active" : "",
      onClick: () => onChange(it.key)
    },
    it.label,
    it.count != null && /* @__PURE__ */ React.createElement("span", { className: "ct" }, it.count)
  )));
};
window.Confirm = function Confirm({ title, body, danger, onConfirm, onCancel }) {
  return /* @__PURE__ */ React.createElement(Modal, { title, onClose: onCancel, footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: onCancel }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: `btn btn-sm ${danger ? "btn-danger" : "btn-pri"}`, onClick: onConfirm }, danger ? "Evet, sil" : "Onayla")) }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 } }, body));
};
window.MiniCalendar = function MiniCalendar({ selected, onSelect, dotDates = [] }) {
  const { useState: uSt, useMemo: uMemo } = React;
  const today = /* @__PURE__ */ new Date();
  const [cur, setCur] = uSt(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const days = uMemo(() => {
    const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
    const last = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    const start = first.getDay();
    const cells = [];
    for (let i = 0; i < start; i++) {
      const d = new Date(first);
      d.setDate(d.getDate() - (start - i));
      cells.push({ date: d, muted: true });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push({ date: new Date(cur.getFullYear(), cur.getMonth(), d), muted: false });
    }
    while (cells.length % 7 !== 0) {
      const prev = cells[cells.length - 1].date;
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      cells.push({ date: d, muted: true });
    }
    return cells;
  }, [cur]);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayStr = fmt(today);
  const dotSet = new Set(dotDates);
  const prevMonth = () => setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
  const nextMonth = () => setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
  const monthLabel = cur.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  return /* @__PURE__ */ React.createElement("div", { className: "calendar" }, /* @__PURE__ */ React.createElement("div", { className: "cal-h" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: prevMonth }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_left")), /* @__PURE__ */ React.createElement("span", { className: "m", style: { textTransform: "capitalize" } }, monthLabel), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: nextMonth }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_right"))), /* @__PURE__ */ React.createElement("div", { className: "cal-grid" }, ["Pz", "Pt", "Sa", "\xC7a", "Pe", "Cu", "Ct"].map((d) => /* @__PURE__ */ React.createElement("div", { key: d, className: "dow" }, d)), days.map(({ date, muted }, i) => {
    const ds = fmt(date);
    const isToday = ds === todayStr;
    const isSel = ds === selected;
    const hasDot = dotSet.has(ds);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        className: ["d", muted && "muted", isToday && !isSel && "today", isSel && "sel"].filter(Boolean).join(" "),
        onClick: () => !muted && onSelect(ds)
      },
      date.getDate(),
      hasDot && /* @__PURE__ */ React.createElement("span", { className: "dot" })
    );
  })));
};

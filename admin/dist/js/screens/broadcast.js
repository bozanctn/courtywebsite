const AUDIENCE_OPTS = [
  { key: "members", label: "\xDCyeler", icon: "card_membership" },
  { key: "customers", label: "M\xFC\u015Fteriler", icon: "people" },
  { key: "both", label: "\u0130kisi", icon: "groups" }
];
const TITLE_MAX = 80;
const MSG_MAX = 500;
window.ClubBroadcastModal = function ClubBroadcastModal({ clubId, initialAudience, onClose }) {
  const { useState, useEffect } = React;
  const [audience, setAudience] = useState(initialAudience || "both");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [counts, setCounts] = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [sending, setSending] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!clubId) return;
      try {
        setLoadingCounts(true);
        const c = await BroadcastSvc.getRecipientCounts(clubId);
        if (alive) setCounts(c);
      } catch (e) {
        console.error("Broadcast counts:", e.message);
      } finally {
        if (alive) setLoadingCounts(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [clubId]);
  const recipientCount = counts ? counts[audience] : 0;
  const doSend = async () => {
    if (!title.trim() || !message.trim()) {
      alert("L\xFCtfen ba\u015Fl\u0131k ve mesaj girin.");
      return;
    }
    if (recipientCount === 0) {
      alert("Se\xE7ilen kitlede uygulama hesab\u0131 olan aktif ki\u015Fi bulunmuyor.");
      return;
    }
    if (!confirm(`${recipientCount} ki\u015Fiye g\xF6nderilecek. Onayl\u0131yor musunuz?`)) return;
    setSending(true);
    try {
      const sent = await BroadcastSvc.sendBroadcast(audience, title.trim(), message.trim());
      alert(`${sent} ki\u015Fiye bildirim g\xF6nderildi.`);
      onClose?.();
    } catch (e) {
      const msg = e?.message || "";
      if (msg.includes("not_authorized")) alert("Bu i\u015Flem i\xE7in kul\xFCp hesab\u0131 gerekiyor.");
      else if (msg.includes("empty_message")) alert("Ba\u015Fl\u0131k ve mesaj bo\u015F olamaz.");
      else alert("Bildirim g\xF6nderilemedi. L\xFCtfen tekrar deneyin.");
    } finally {
      setSending(false);
    }
  };
  return /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "Toplu Bildirim",
      sub: "Aktif \xFCye ve m\xFC\u015Fterilerine \xF6zel push bildirimi g\xF6nder",
      onClose,
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: onClose }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: doSend, disabled: sending || loadingCounts }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "send"), sending ? " G\xF6nderiliyor\u2026" : ` G\xF6nder${recipientCount > 0 ? ` (${recipientCount})` : ""}`))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" } }, "Kime g\xF6nderilsin?"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, AUDIENCE_OPTS.map((opt) => {
      const active = audience === opt.key;
      const n = counts ? counts[opt.key] : 0;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: opt.key,
          type: "button",
          onClick: () => setAudience(opt.key),
          style: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "12px 8px",
            borderRadius: 12,
            cursor: "pointer",
            border: `1px solid ${active ? "var(--brand-navy)" : "var(--border)"}`,
            background: active ? "var(--brand-navy)" : "#fff",
            color: active ? "#fff" : "var(--text-1)"
          }
        },
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: active ? "#fff" : "var(--brand-navy)" } }, opt.icon),
        /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600 } }, opt.label),
        /* @__PURE__ */ React.createElement("span", { style: {
          minWidth: 22,
          padding: "1px 6px",
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700,
          textAlign: "center",
          background: active ? "rgba(255,255,255,0.22)" : "#EEF2FF",
          color: active ? "#fff" : "var(--brand-navy)"
        } }, loadingCounts ? "\u2026" : n)
      );
    })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 10, lineHeight: 1.4 } }, loadingCounts ? "Al\u0131c\u0131lar hesaplan\u0131yor\u2026" : `Bu bildirim ${recipientCount} ki\u015Fiye ula\u015Facak. Yaln\u0131z uygulama hesab\u0131 olan aktif \xFCye/m\xFC\u015Fteriler push al\u0131r.`)), /* @__PURE__ */ React.createElement(Field, { label: "Ba\u015Fl\u0131k" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: title,
        maxLength: TITLE_MAX,
        onChange: (e) => setTitle(e.target.value),
        placeholder: "\xD6rn. Bu hafta sonu turnuva!"
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", textAlign: "right", marginTop: 4 } }, title.length, "/", TITLE_MAX)), /* @__PURE__ */ React.createElement(Field, { label: "Mesaj" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: 5,
        value: message,
        maxLength: MSG_MAX,
        onChange: (e) => setMessage(e.target.value),
        placeholder: "Bildirim i\xE7eri\u011Fini yaz\u0131n\u2026",
        style: { resize: "vertical" }
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", textAlign: "right", marginTop: 4 } }, message.length, "/", MSG_MAX)))
  );
};

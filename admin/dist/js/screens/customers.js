const GENDER_LABELS_C = { male: "Erkek", female: "Kad\u0131n", other: "Di\u011Fer" };
function CustomerDetailModal({ customer, clubId, onClose, onReservation, onLinked }) {
  const { useState, useEffect } = React;
  const [tab, setTab] = useState("activities");
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addPkgOpen, setAddPkgOpen] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [linkStep, setLinkStep] = useState("idle");
  const [linkQuery, setLinkQuery] = useState("");
  const [linkResults, setLinkResults] = useState([]);
  const [linkTarget, setLinkTarget] = useState(null);
  const [linkSaving, setLinkSaving] = useState(false);
  const [accountLink, setAccountLink] = useState(null);
  const [revertBusy, setRevertBusy] = useState(false);
  const [suggestedProfile, setSuggestedProfile] = useState(null);
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [membership, setMembership] = useState(null);
  useEffect(() => {
    load();
  }, [customer.id]);
  const load = async () => {
    setLoading(true);
    try {
      const [s, b, l, p] = await Promise.all([
        CustomerSvc.getCustomerStats(customer.id, clubId, customer.user_id, customer.full_name),
        CustomerSvc.getCustomerBookings(customer.id, clubId, customer.user_id),
        CustomerSvc.getCustomerLessons(customer.user_id, clubId, customer.full_name, customer.id),
        CustomerSvc.getCustomerLessonPackages(customer.id, clubId, customer.user_id, customer.full_name)
      ]);
      setStats(s);
      setBookings(b);
      setLessons(l);
      setPackages(p);
      setAccountLink(await CustomerSvc.getAccountLink(customer.id));
      if (customer.suggested_user_id && !customer.user_id) {
        setSuggestedProfile(await CustomerSvc.getProfileBrief(customer.suggested_user_id));
      } else {
        setSuggestedProfile(null);
      }
      setMembership(await CustomerSvc.getCustomerMembership(clubId, customer.user_id, customer.full_name, customer.phone));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const searchProfiles = async (q) => {
    setLinkQuery(q);
    if (q.length < 2) {
      setLinkResults([]);
      return;
    }
    const safe = q.replace(/[,()]/g, " ").trim();
    const { data } = await sb.from("profiles").select("id, full_name, email").or(`full_name_fold.like.%${trFold(safe)}%,email.ilike.%${safe}%`).eq("user_type", "player").limit(8);
    setLinkResults(data || []);
  };
  const confirmLink = async () => {
    if (!linkTarget) return;
    setLinkSaving(true);
    try {
      await CustomerSvc.requestAccountLink(customer.id, linkTarget.id);
      setLinkStep("idle");
      setLinkTarget(null);
      setLinkQuery("");
      setLinkResults([]);
      onLinked();
      load();
      alert("Davet g\xF6nderildi. Hesap sahibi mobil uygulamadan kabul edince ge\xE7mi\u015F kay\u0131tlar birle\u015Fir ve bilgiler g\xFCncellenir.");
    } catch (e) {
      alert((e.message || "").includes("pending_exists") ? "Bu m\xFC\u015Fteri i\xE7in bekleyen bir e\u015Fleme daveti zaten var." : e.message);
    } finally {
      setLinkSaving(false);
    }
  };
  const handleRevert = async () => {
    if (!accountLink) return;
    if (!confirm("Hesap e\u015Flemesi geri al\u0131nacak: m\xFC\u015Fteri bilgileri eski h\xE2line d\xF6ner, birle\u015Ftirilen ders/rezervasyon/gruplar ayr\u0131l\u0131r. E\u015Flemeden sonraki yeni i\u015Flemler etkilenmez. Emin misiniz?")) return;
    setRevertBusy(true);
    try {
      await CustomerSvc.revertAccountLink(accountLink.id);
      onLinked();
      load();
      alert("E\u015Fleme geri al\u0131nd\u0131, m\xFC\u015Fteri eski h\xE2line d\xF6nd\xFC.");
    } catch (e) {
      alert(e.message);
    } finally {
      setRevertBusy(false);
    }
  };
  const acceptSuggestion = async () => {
    if (!customer.suggested_user_id) return;
    if (!confirm("Hesap sahibine e\u015Fleme daveti g\xF6nderilecek. Kabul edince ge\xE7mi\u015F kay\u0131tlar birle\u015Fir ve bilgiler g\xFCncellenir. G\xF6nderilsin mi?")) return;
    setSuggestBusy(true);
    try {
      await CustomerSvc.requestAccountLink(customer.id, customer.suggested_user_id);
      await CustomerSvc.dismissSuggestion(customer.id);
      onLinked();
      load();
      alert("Davet g\xF6nderildi. Hesap sahibi mobilden kabul edince e\u015Fle\u015Fme tamamlan\u0131r.");
    } catch (e) {
      alert((e.message || "").includes("pending_exists") ? "Bu m\xFC\u015Fteri i\xE7in bekleyen bir e\u015Fleme daveti zaten var." : e.message);
    } finally {
      setSuggestBusy(false);
    }
  };
  const rejectSuggestion = async () => {
    setSuggestBusy(true);
    try {
      await CustomerSvc.dismissSuggestion(customer.id);
      setSuggestedProfile(null);
      onLinked();
    } catch (e) {
      alert(e.message);
    } finally {
      setSuggestBusy(false);
    }
  };
  const tabItems = [
    { key: "activities", label: `Aktiviteler (${bookings.length + lessons.length})` },
    { key: "packages", label: `Ders Paketleri (${packages.length})` }
  ];
  const bkStatusColor = { confirmed: "#22C55E", completed: "#6366F1", cancelled: "#EF4444", pending: "#F59E0B" };
  const pkgStatusColor = { active: "#22C55E", completed: "#6366F1", expired: "#F59E0B", cancelled: "#EF4444" };
  const lsPayColor = { paid: "#22C55E", pending: "#F59E0B", waived: "#6366F1" };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: customer.full_name,
      wide: true,
      onClose,
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: onClose }, "Kapat"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: () => onReservation(customer) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "event_available"), "Rezervasyon Olu\u015Ftur"))
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(Av, { name: customer.full_name, size: 52 }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: 16 } }, customer.full_name), customer.user_id ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { style: { background: "#EEF2FF", color: "var(--brand-navy)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 } }, "CourtyCLUB"), accountLink && accountLink.status === "confirmed" && /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn btn-ghost btn-sm",
        style: { fontSize: 11, padding: "2px 10px", height: "auto", color: "#DC2626" },
        onClick: handleRevert,
        disabled: revertBusy
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12 } }, "link_off"),
      " ",
      revertBusy ? "Geri al\u0131n\u0131yor\u2026" : "E\u015Flemeyi Geri Al"
    )) : accountLink && accountLink.status === "pending" ? /* @__PURE__ */ React.createElement("span", { style: { background: "#FFFBEB", color: "#92400E", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 3 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12 } }, "schedule"), " E\u015Fleme daveti bekliyor") : /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn btn-ghost btn-sm",
        style: { fontSize: 11, padding: "2px 10px", height: "auto" },
        onClick: () => setLinkStep("search")
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12 } }, "link"),
      " E\u015Fle\u015Ftir"
    ), membership && /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 3, background: "#F3EEFF", color: "#7C3AED", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12 } }, "card_membership"), membership.packageName || "\xDCye", membership.status === "pending" ? " (bekliyor)" : "")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "var(--text-2)" } }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12, verticalAlign: "middle" } }, "phone"), " ", customer.phone), customer.email && /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12, verticalAlign: "middle" } }, "email"), " ", customer.email), customer.gender && /* @__PURE__ */ React.createElement("span", null, GENDER_LABELS_C[customer.gender]), customer.birth_date && /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12, verticalAlign: "middle" } }, "cake"), " ", fmtDate(customer.birth_date))), customer.notes && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, fontSize: 12, color: "var(--text-2)", fontStyle: "italic", background: "var(--bg)", borderRadius: 8, padding: "5px 10px" } }, customer.notes))),
    !customer.user_id && !accountLink && suggestedProfile && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16, padding: 14, background: "#EEF2FF", borderRadius: 12, border: "1px solid #C7D2FE" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: "var(--brand-navy)" } }, "person_search"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--brand-navy)" } }, "Telefon bir hesapla e\u015Fle\u015Fti"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-1)", marginTop: 2 } }, /* @__PURE__ */ React.createElement("strong", null, suggestedProfile.full_name), suggestedProfile.email ? ` (${suggestedProfile.email})` : "", " \u2014 bu m\xFC\u015Fteriyle ayn\u0131 numaray\u0131 kullan\u0131yor. E\u015Fleme daveti g\xF6nderilsin mi?"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: rejectSuggestion, disabled: suggestBusy }, "Yoksay"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: acceptSuggestion, disabled: suggestBusy }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "link"), " ", suggestBusy ? "G\xF6nderiliyor\u2026" : "Davet G\xF6nder"))),
    linkStep === "search" && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16, padding: 14, background: "#EEF2FF", borderRadius: 12, border: "1px solid #C7D2FE" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 10, color: "var(--brand-navy)" } }, "CourtyCLUB Hesab\u0131 Ara"), /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "Oyuncu ad\u0131 ara...",
        value: linkQuery,
        onChange: (e) => searchProfiles(e.target.value),
        style: { width: "100%", boxSizing: "border-box" }
      }
    ), linkResults.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", overflow: "hidden", marginTop: 4 } }, linkResults.map((p) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: p.id,
        style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 },
        onMouseDown: () => {
          setLinkTarget(p);
          setLinkStep("confirm");
          setLinkResults([]);
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: "var(--brand-navy)" } }, "person"),
      /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontWeight: 600 } }, p.full_name),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)" } }, p.email)
    )))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { marginTop: 8 }, onClick: () => {
      setLinkStep("idle");
      setLinkQuery("");
      setLinkResults([]);
    } }, "Vazge\xE7")),
    linkStep === "confirm" && linkTarget && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16, padding: 14, background: "#FFFBEB", borderRadius: 12, border: "1px solid #FDE68A" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#92400E" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, verticalAlign: "middle", marginRight: 4 } }, "warning"), "E\u015Fle\u015Ftirmeyi Onayla"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 12, color: "var(--text-1)" } }, /* @__PURE__ */ React.createElement("strong", null, customer.full_name), " m\xFC\u015Fterisi ile ", /* @__PURE__ */ React.createElement("strong", null, linkTarget.full_name), " (", linkTarget.email, ") hesab\u0131n\u0131 e\u015Flemek i\xE7in ", /* @__PURE__ */ React.createElement("strong", null, "davet"), " g\xF6nderilecek. Hesap sahibi mobil uygulamadan kabul edince ge\xE7mi\u015F ders/rezervasyon/gruplar bu hesaba ba\u011Flan\u0131r ve hesab\u0131n bilgileri (isim, e-posta, do\u011Fum, cinsiyet) m\xFC\u015Fteri kayd\u0131n\u0131n \xFCst\xFCne yaz\u0131l\u0131r."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => {
      setLinkStep("idle");
      setLinkTarget(null);
    } }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: confirmLink, disabled: linkSaving }, linkSaving ? "G\xF6nderiliyor\u2026" : "Davet G\xF6nder"))),
    stats && /* @__PURE__ */ React.createElement("div", { className: "stats", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement(StatCard, { icon: "account_balance_wallet", n: fmtMoney(stats.totalSpent), label: "Toplam Harcama", tint: "navy" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "event_available", n: stats.bookingCount, label: "Rezervasyon" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "inventory_2", n: stats.packageCount, label: "Ders Paketi" })),
    /* @__PURE__ */ React.createElement(Tabs, { items: tabItems, active: tab, onChange: setTab }),
    /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12 } }, loading ? /* @__PURE__ */ React.createElement(Spinner, null) : tab === "activities" ? (() => {
      const items = [
        ...bookings.map((b) => ({ kind: "booking", data: b })),
        ...lessons.map((l) => ({ kind: "lesson", data: l }))
      ].sort((a, b) => new Date(b.data.start_time) - new Date(a.data.start_time));
      if (items.length === 0) return /* @__PURE__ */ React.createElement(EmptyState, { icon: "event_available", title: "Hen\xFCz aktivite yok" });
      return items.map((item) => {
        if (item.kind === "booking") {
          const b = item.data;
          const color = bkStatusColor[b.status] || "#6B7280";
          return /* @__PURE__ */ React.createElement("div", { key: `bk-${b.id}`, style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            background: "#EEF2FF",
            border: "1px solid #C7D2FE",
            borderRadius: 8,
            padding: "4px 7px",
            minWidth: 42,
            flexShrink: 0
          } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13, color: "var(--brand-navy)" } }, "sports_tennis"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "var(--brand-navy)" } }, "Rez")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, "Kort ", b.court?.court_number ?? "?", " \xB7 ", fmtDateTime(b.start_time)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2 } }, paymentLabel(b.payment_status), b.total_amount > 0 ? ` \xB7 ${fmtMoney(b.total_amount)}` : "")), /* @__PURE__ */ React.createElement("span", { style: {
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 20,
            background: color + "22",
            color
          } }, statusLabel(b.status)));
        } else {
          const l = item.data;
          const color = lsPayColor[l.payment_status] || "#6B7280";
          const payLbl = l.payment_status === "paid" ? "\xD6dendi" : l.payment_status === "waived" ? "Muaf" : "Bekliyor";
          return /* @__PURE__ */ React.createElement("div", { key: `ls-${l.id}`, style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            background: "#FFF7ED",
            border: "1px solid #FED7AA",
            borderRadius: 8,
            padding: "4px 7px",
            minWidth: 42,
            flexShrink: 0
          } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13, color: "#EA580C" } }, "school"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#EA580C" } }, "Ders")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, l.coach_name ? `${l.coach_name} \xB7 ` : "", fmtDateTime(l.start_time)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2 } }, l.is_package_lesson ? "Paketten \xB7 " : "", l.amount > 0 ? fmtMoney(l.amount) : "\xDCcretsiz")), /* @__PURE__ */ React.createElement("span", { style: {
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 20,
            background: color + "22",
            color
          } }, payLbl));
        }
      });
    })() : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: () => setAddPkgOpen(true) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "add"), "Ders Paketi Ekle")), packages.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "inventory_2", title: "Ders paketi yok", sub: "Yukar\u0131daki butona t\u0131klayarak paket ekleyebilirsiniz." }) : packages.map((p) => {
      const isCustom = !p.package_id;
      const pkgName = p.package?.name || p.custom_name || "\xD6zel Paket";
      const stColor = pkgStatusColor[p.status] || "#6B7280";
      const psColor = p.payment_status === "paid" ? "#22C55E" : "#F59E0B";
      const psLabel = p.payment_status === "paid" ? "\xD6dendi" : "Bekliyor";
      const progress = p.total_lessons > 0 ? p.used_lessons / p.total_lessons : 0;
      return /* @__PURE__ */ React.createElement("div", { key: p.id, style: { background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)", padding: "14px 16px", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14, flex: 1 } }, pkgName), isCustom && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#FFF7ED", color: "#EA580C", border: "1px solid #FED7AA" } }, "\xD6zel"), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setEditPkg(p),
          title: "Paketi d\xFCzenle",
          style: { background: "none", border: "none", cursor: "pointer", padding: 2, display: "grid", placeItems: "center", color: "var(--brand-navy)" }
        },
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "edit")
      )), /* @__PURE__ */ React.createElement("div", { style: { height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${Math.round(progress * 100)}%`, background: "var(--brand-navy)", borderRadius: 3 } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginBottom: 10 } }, p.used_lessons, "/", p.total_lessons, " ders kullan\u0131ld\u0131"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: stColor + "22", color: stColor } }, statusLabel(p.status)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: psColor + "22", color: psColor } }, psLabel), p.total_paid > 0 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "var(--border)", color: "var(--text-2)" } }, fmtMoney(p.total_paid)), p.expiry_date && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "var(--border)", color: "var(--text-2)" } }, "Son: ", fmtDate(p.expiry_date))));
    })))
  ), addPkgOpen && /* @__PURE__ */ React.createElement(
    AddPackageModal,
    {
      customer,
      clubId,
      onClose: () => setAddPkgOpen(false),
      onSaved: load
    }
  ), editPkg && /* @__PURE__ */ React.createElement(
    EditPackageModal,
    {
      pkg: editPkg,
      customer,
      clubId,
      onClose: () => setEditPkg(null),
      onSaved: load
    }
  ));
}
function AddPackageModal({ customer, clubId, onClose, onSaved }) {
  const { useState, useEffect } = React;
  const [mode, setMode] = useState("predefined");
  const [clubPkgs, setClubPkgs] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [customName, setCustomName] = useState("");
  const [customLessons, setCustomLessons] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customCoachPct, setCustomCoachPct] = useState("70");
  const [customValidity, setCustomValidity] = useState("90");
  const [coachId, setCoachId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [totalPaid, setTotalPaid] = useState("");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    (async () => {
      const [pkgs, coachs] = await Promise.all([
        LessonPackageSvc.getClubPackages(clubId),
        CoachSvc.getActiveClubCoaches(clubId)
      ]);
      setClubPkgs((pkgs || []).filter((p) => p.is_active));
      setCoaches(coachs || []);
      setLoading(false);
    })();
  }, []);
  const handlePkgSelect = (p) => {
    setSelectedPkg(p);
    setTotalPaid(String(p.price || ""));
  };
  const handleSave = async () => {
    if (mode === "predefined" && !selectedPkg) {
      alert("L\xFCtfen bir paket se\xE7in.");
      return;
    }
    if (mode === "custom") {
      if (!customName.trim()) {
        alert("Paket ad\u0131 giriniz.");
        return;
      }
      if (!customLessons || +customLessons <= 0) {
        alert("Ders say\u0131s\u0131 giriniz.");
        return;
      }
    }
    if (paymentStatus === "paid" && (!totalPaid || +totalPaid < 0)) {
      alert("\xD6denen tutar\u0131 giriniz.");
      return;
    }
    setSaving(true);
    try {
      await LessonPackageSvc.enrollCustomerPackage({
        clubId,
        clubCustomerId: customer.id,
        customerUserId: customer.user_id || null,
        customerName: customer.full_name,
        packageId: mode === "predefined" ? selectedPkg.id : null,
        packageName: mode === "predefined" ? selectedPkg.name : customName.trim(),
        totalLessons: mode === "predefined" ? selectedPkg.total_lessons : +customLessons,
        customPrice: mode === "custom" ? +customPrice : null,
        customCoachPct: null,
        // Özel pakette de sabit pay yok — finans, antrenöre tanımlı orandan hesaplar.
        validityDays: mode === "predefined" ? selectedPkg.validity_days || 90 : +customValidity,
        coachId: coachId || null,
        paymentStatus,
        totalPaid: +totalPaid,
        notes: notes.trim() || null
      });
      onSaved();
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const inputStyle = { width: "100%", boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 5, letterSpacing: 0.4 };
  const tabBtn = (key, label) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key,
      type: "button",
      style: {
        flex: 1,
        padding: "9px 0",
        borderRadius: 10,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        border: mode === key ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)",
        background: mode === key ? "#EEF2FF" : "var(--bg)",
        color: mode === key ? "var(--brand-navy)" : "var(--text-2)"
      },
      onClick: () => setMode(key)
    },
    label
  );
  const payBtn = (key, label) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key,
      type: "button",
      style: {
        flex: 1,
        padding: "9px 0",
        borderRadius: 10,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        border: paymentStatus === key ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)",
        background: paymentStatus === key ? "#EEF2FF" : "var(--bg)",
        color: paymentStatus === key ? "var(--brand-navy)" : "var(--text-2)"
      },
      onClick: () => setPaymentStatus(key)
    },
    label
  );
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: (e) => e.target === e.currentTarget && onClose()
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface)", borderRadius: 20, width: "min(480px,95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--brand-navy)", fontSize: 20 } }, "inventory_2"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: 17, flex: 1 } }, "Ders Paketi Ekle"), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", cursor: "pointer", padding: 4, display: "grid", placeItems: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 20, color: "var(--text-2)" } }, "close"))), /* @__PURE__ */ React.createElement("div", { style: { overflowY: "auto", flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 } }, loading ? /* @__PURE__ */ React.createElement(Spinner, null) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, tabBtn("predefined", "Tan\u0131ml\u0131 Paket"), tabBtn("custom", "\xD6zel Paket")), mode === "predefined" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "PAKET SE\xC7"), clubPkgs.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "inventory_2", title: "Aktif paket yok", sub: "Ders paketleri ekran\u0131ndan \xF6nce paket olu\u015Fturun." }) : clubPkgs.map((p) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: p.id,
        onClick: () => handlePkgSelect(p),
        style: {
          padding: "12px 14px",
          borderRadius: 12,
          marginBottom: 8,
          cursor: "pointer",
          border: selectedPkg?.id === p.id ? "2px solid var(--brand-navy)" : "1.5px solid var(--border)",
          background: selectedPkg?.id === p.id ? "#EEF2FF" : "var(--bg)"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: "var(--text-1)" } }, p.name),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 3 } }, p.total_lessons, " ders \xB7 ", fmtMoney(p.price), p.validity_days ? ` \xB7 ${p.validity_days} g\xFCn ge\xE7erli` : "")
    ))), mode === "custom" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "PAKET ADI"), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: customName,
        onChange: (e) => setCustomName(e.target.value),
        placeholder: "\xD6rn: 10 Seans \xD6zel Paket",
        style: inputStyle
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "TOPLAM DERS"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "1",
        value: customLessons,
        onChange: (e) => setCustomLessons(e.target.value),
        placeholder: "10",
        style: inputStyle
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "TOPLAM F\u0130YAT (\u20BA)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "0",
        value: customPrice,
        onChange: (e) => {
          setCustomPrice(e.target.value);
          setTotalPaid(e.target.value);
        },
        placeholder: "2000",
        style: inputStyle
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "GE\xC7ERL\u0130L\u0130K (g\xFCn)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "1",
        value: customValidity,
        onChange: (e) => setCustomValidity(e.target.value),
        placeholder: "90",
        style: inputStyle
      }
    ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "HOCA (opsiyonel \u2014 bo\u015F b\u0131rak\u0131l\u0131rsa t\xFCm ho\xE7alarda ge\xE7erli)"), /* @__PURE__ */ React.createElement("select", { value: coachId, onChange: (e) => setCoachId(e.target.value), style: inputStyle }, /* @__PURE__ */ React.createElement("option", { value: "" }, "T\xFCm antren\xF6rler"), coaches.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.individual_coach_id || "" }, c.full_name)))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" } }, "Hoca pay\u0131 sabit girilmez; antren\xF6re tan\u0131ml\u0131 pay oran\u0131ndan otomatik uygulan\u0131r.")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "\xD6DEME DURUMU"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: paymentStatus === "paid" ? 10 : 0 } }, payBtn("paid", "\xD6dendi"), payBtn("pending", "Bekliyor")), paymentStatus === "paid" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "\xD6DENEN TUTAR (\u20BA)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "0",
        value: totalPaid,
        onChange: (e) => setTotalPaid(e.target.value),
        placeholder: "2000",
        style: inputStyle
      }
    ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "NOTLAR (opsiyonel)"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: notes,
        onChange: (e) => setNotes(e.target.value),
        placeholder: "Not ekleyin...",
        rows: 2,
        style: { ...inputStyle, resize: "vertical" }
      }
    )))), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: onClose }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: handleSave, disabled: saving || loading }, saving ? "Kaydediliyor\u2026" : "Paketi Ekle")))
  );
}
function EditPackageModal({ pkg, customer, clubId, onClose, onSaved }) {
  const { useState, useEffect } = React;
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(pkg.payment_status === "paid" ? "paid" : "pending");
  const [totalPaid, setTotalPaid] = useState(String(pkg.total_paid ?? pkg.package?.price ?? pkg.custom_price ?? ""));
  const [totalLessons, setTotalLessons] = useState(String(pkg.total_lessons ?? pkg.package?.total_lessons ?? ""));
  const [usedLessons, setUsedLessons] = useState(String(pkg.used_lessons ?? 0));
  const [expiryDate, setExpiryDate] = useState(pkg.expiry_date ? pkg.expiry_date.slice(0, 10) : "");
  const [status, setStatus] = useState(pkg.status === "completed" ? "completed" : "active");
  const [coachId, setCoachId] = useState(pkg.coach_id || "");
  const [notes, setNotes] = useState(pkg.notes || "");
  useEffect(() => {
    (async () => {
      const cs = await CoachSvc.getActiveClubCoaches(clubId);
      setCoaches(cs || []);
      setLoading(false);
    })();
  }, []);
  const wasPaid = pkg.payment_status === "paid";
  const pkgName = pkg.package?.name || pkg.custom_name || "\xD6zel Paket";
  const usedNum = parseInt(usedLessons, 10) || 0;
  const totalNum = parseInt(totalLessons, 10) || 0;
  const inputStyle = { width: "100%", boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 5, letterSpacing: 0.4 };
  const toggleBtn = (active, label, onClick) => /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick,
      style: {
        flex: 1,
        padding: "9px 0",
        borderRadius: 10,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        border: active ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)",
        background: active ? "#EEF2FF" : "var(--bg)",
        color: active ? "var(--brand-navy)" : "var(--text-2)"
      }
    },
    label
  );
  const handleSave = async () => {
    if (!totalNum || totalNum <= 0) {
      alert("Toplam ders 0'dan b\xFCy\xFCk olmal\u0131.");
      return;
    }
    if (usedNum < 0 || usedNum > totalNum) {
      alert("Kullan\u0131lan ders 0 ile toplam ders aras\u0131nda olmal\u0131.");
      return;
    }
    const nowPaid = paymentStatus === "paid";
    const wasPending = pkg.payment_status !== "paid";
    if (wasPaid && !nowPaid) {
      if (!confirm('\xD6deme durumu "Bekliyor"a \xE7ekiliyor. Daha \xF6nce yaz\u0131lm\u0131\u015F gelir ve hoca hakedi\u015F kay\u0131tlar\u0131 OTOMAT\u0130K geri al\u0131nmaz; gerekiyorsa Finans ekran\u0131ndan elle d\xFCzeltin.\n\nDevam edilsin mi?')) return;
    }
    let expiryIso = expiryDate ? (/* @__PURE__ */ new Date(expiryDate + "T12:00:00")).toISOString() : null;
    if (wasPending && nowPaid && !expiryIso) {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() + (pkg.package?.validity_days || 90));
      expiryIso = d.toISOString();
    }
    let financeOpts = null;
    if (wasPending && nowPaid) {
      const price = parseFloat(totalPaid) || 0;
      if (!(price > 0) && !confirm("Tahsil edilen tutar 0 g\xF6r\xFCn\xFCyor; gelir ve hoca hakedi\u015Fi OLU\u015EMAYACAK. Yine de kaydedilsin mi?")) return;
      const coachRec = coaches.find((c) => c.individual_coach_id === (coachId || pkg.coach_id));
      const pkgPct = pkg.package?.coach_percentage ?? pkg.custom_coach_pct;
      const coachPayRate = Number(pkgPct) > 0 ? Number(pkgPct) : coachRec?.coach_pay_rate || 0;
      const payoutMode = pkg.coach_payout_mode || pkg.package?.coach_payout_mode || "upfront";
      financeOpts = {
        clubId,
        price,
        playerName: customer.full_name,
        packageName: pkgName,
        coachInfo: coachRec ? { clubCoachId: coachRec.id, coachName: coachRec.full_name, coachPayRate, individualCoachId: coachId || pkg.coach_id || null } : null,
        payoutMode
      };
    }
    setSaving(true);
    try {
      await LessonPackageSvc.updatePlayerPackage(pkg.id, {
        payment_status: nowPaid ? "paid" : "pending",
        total_lessons: totalNum,
        used_lessons: usedNum,
        total_paid: parseFloat(totalPaid) || 0,
        expiry_date: expiryIso,
        status,
        coach_id: coachId || null,
        notes: notes.trim() || null
      }, financeOpts);
      onSaved();
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: (e) => e.target === e.currentTarget && onClose()
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface)", borderRadius: 20, width: "min(480px,95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--brand-navy)", fontSize: 20 } }, "edit"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: 17, flex: 1 } }, "Paketi D\xFCzenle"), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", cursor: "pointer", padding: 4, display: "grid", placeItems: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 20, color: "var(--text-2)" } }, "close"))), /* @__PURE__ */ React.createElement("div", { style: { overflowY: "auto", flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 } }, loading ? /* @__PURE__ */ React.createElement(Spinner, null) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, pkgName), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "TOPLAM DERS"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "1",
        value: totalLessons,
        onChange: (e) => setTotalLessons(e.target.value),
        style: inputStyle
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "KULLANILAN DERS"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "0",
        max: totalLessons || void 0,
        value: usedLessons,
        onChange: (e) => setUsedLessons(e.target.value),
        style: inputStyle
      }
    ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: -8 } }, "Kalan ders: ", /* @__PURE__ */ React.createElement("strong", null, Math.max(0, totalNum - usedNum))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "\xD6DEME DURUMU"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, toggleBtn(paymentStatus === "paid", "\xD6dendi", () => setPaymentStatus("paid")), toggleBtn(paymentStatus === "pending", "Bekliyor", () => setPaymentStatus("pending"))), !wasPaid && paymentStatus === "paid" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#059669", marginTop: 6 } }, "Kaydedince gelir ve (upfront) hoca hakedi\u015Fi otomatik olu\u015Fturulacak."), wasPaid && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 6 } }, "Not: Zaten \xF6denmi\u015F bir pakette tutar\u0131 de\u011Fi\u015Ftirmek ge\xE7mi\u015F gelir kayd\u0131n\u0131 otomatik g\xFCncellemez.")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "TAHS\u0130L ED\u0130LEN TUTAR (\u20BA)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "0",
        value: totalPaid,
        onChange: (e) => setTotalPaid(e.target.value),
        placeholder: "0",
        style: inputStyle
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "SON KULLANMA"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        value: expiryDate,
        onChange: (e) => setExpiryDate(e.target.value),
        style: inputStyle
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "DURUM"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, toggleBtn(status === "active", "Aktif", () => setStatus("active")), toggleBtn(status === "completed", "Tamamland\u0131", () => setStatus("completed"))))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "ANTREN\xD6R (opsiyonel \u2014 bo\u015F b\u0131rak\u0131l\u0131rsa t\xFCm antren\xF6rlerde ge\xE7erli)"), /* @__PURE__ */ React.createElement("select", { value: coachId, onChange: (e) => setCoachId(e.target.value), style: inputStyle }, /* @__PURE__ */ React.createElement("option", { value: "" }, "T\xFCm antren\xF6rler"), coaches.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.individual_coach_id || "" }, c.full_name)))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: labelStyle }, "NOTLAR (opsiyonel)"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: notes,
        onChange: (e) => setNotes(e.target.value),
        placeholder: "Not ekleyin...",
        rows: 2,
        style: { ...inputStyle, resize: "vertical" }
      }
    )))), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: onClose }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: handleSave, disabled: saving || loading }, saving ? "Kaydediliyor\u2026" : "Kaydet")))
  );
}
function CustomersScreen({ clubId, setScreen }) {
  const { useState, useEffect, useMemo } = React;
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [selectedCust, setSelectedCust] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [emailMatch, setEmailMatch] = useState(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailDebounce, setEmailDebounce] = useState(null);
  const [ccQuery, setCcQuery] = useState("");
  const [ccResults, setCcResults] = useState([]);
  const [ccSelected, setCcSelected] = useState(null);
  const [dupCustomer, setDupCustomer] = useState(null);
  const [lockedMatch, setLockedMatch] = useState(null);
  const [phoneMatches, setPhoneMatches] = useState([]);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [phoneDebounce, setPhoneDebounce] = useState(null);
  useEffect(() => {
    if (clubId) load();
  }, [clubId]);
  const load = async () => {
    setLoading(true);
    try {
      const data = await CustomerSvc.getClubCustomers(clubId);
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const filtered = useMemo(() => {
    const q = trFold(searchQuery.trim());
    if (!q) return customers;
    return customers.filter(
      (c) => trFold(c.full_name).includes(q) || c.phone.includes(searchQuery.trim()) || trFold(c.email || "").includes(q)
    );
  }, [customers, searchQuery]);
  const openAdd = () => {
    setForm({ full_name: "", phone: "", email: "", gender: "", birth_date: "", notes: "" });
    setEmailMatch(null);
    setCcQuery("");
    setCcResults([]);
    setCcSelected(null);
    setDupCustomer(null);
    setLockedMatch(null);
    setPhoneMatches([]);
    setModal("add");
  };
  const openEdit = (c) => {
    setForm({
      id: c.id,
      full_name: c.full_name,
      phone: c.phone,
      email: c.email || "",
      gender: c.gender || "",
      birth_date: c.birth_date || "",
      notes: c.notes || "",
      user_id_original: c.user_id || null
      // mevcut bağlantıyı takip et
    });
    setEmailMatch(null);
    setCcQuery("");
    setCcResults([]);
    setCcSelected(c.user_id ? { id: c.user_id, full_name: c.full_name, email: c.email } : null);
    setDupCustomer(null);
    setLockedMatch(null);
    setPhoneMatches([]);
    setModal("edit");
  };
  const openDetail = (c) => {
    setSelectedCust(c);
    setModal("detail");
  };
  const save = async () => {
    if (!form.full_name?.trim()) {
      alert("Ad soyad zorunludur.");
      return;
    }
    if (!form.phone?.trim()) {
      alert("Telefon numaras\u0131 zorunludur.");
      return;
    }
    if (dupCustomer) {
      alert(`"${dupCustomer.full_name}" bu telefon numaras\u0131yla zaten m\xFC\u015Fteri. Ayn\u0131 numarayla ikinci kay\u0131t olu\u015Fturulamaz.`);
      return;
    }
    setSaving(true);
    try {
      const emailLink = emailMatch && !emailMatch.alreadyLinkedTo ? emailMatch : null;
      const profileToLink = lockedMatch || ccSelected || emailLink;
      if (modal === "add") {
        const created = await CustomerSvc.createCustomer(clubId, form);
        if (profileToLink && created?.id) {
          await CustomerSvc.linkToProfile(created.id, profileToLink.id);
        }
      } else {
        await CustomerSvc.updateCustomer(form.id, form);
        if (ccSelected && ccSelected.id !== form.user_id_original) {
          await CustomerSvc.linkToProfile(form.id, ccSelected.id);
        }
      }
      setModal(null);
      setEmailMatch(null);
      setCcSelected(null);
      setCcQuery("");
      setCcResults([]);
      setDupCustomer(null);
      setLockedMatch(null);
      setPhoneMatches([]);
      load();
    } catch (e) {
      const msg = e?.message || "";
      alert(/uq_club_customer_name/.test(msg) ? "Bu ad ve telefona sahip aktif bir m\xFC\u015Fteri zaten var. Ayn\u0131 ki\u015Fiyse mevcut kayd\u0131 d\xFCzenleyin." : msg);
    } finally {
      setSaving(false);
    }
  };
  const handleEmailChange = (val) => {
    formField("email", val);
    setEmailMatch(null);
    if (emailDebounce) clearTimeout(emailDebounce);
    const trimmed = val.trim();
    if (!trimmed || modal !== "add") return;
    const t = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const { data: profile } = await sb.from("profiles").select("id, full_name, email").eq("email", trimmed).eq("user_type", "player").maybeSingle();
        if (!profile) {
          setEmailMatch(null);
          return;
        }
        const excludeId = form.user_id_original || null;
        const { data: alreadyLinked } = await sb.from("club_customers").select("id, full_name").eq("club_id", clubId).eq("user_id", profile.id).eq("is_active", true).neq("id", form.id || "00000000-0000-0000-0000-000000000000").maybeSingle();
        if (alreadyLinked) {
          setEmailMatch({ ...profile, alreadyLinkedTo: alreadyLinked.full_name });
        } else {
          setEmailMatch(profile);
        }
      } catch (e) {
        setEmailChecking(false);
        alert("E-posta kontrol\xFC s\u0131ras\u0131nda hata olu\u015Ftu. L\xFCtfen tekrar deneyin.");
        return;
      } finally {
        setEmailChecking(false);
      }
    }, 500);
    setEmailDebounce(t);
  };
  const applyPhoneMatch = (acc) => {
    setForm((f) => ({ ...f, full_name: acc.full_name, email: acc.email || f.email }));
    setLockedMatch(acc);
    setPhoneMatches([]);
    setDupCustomer(null);
    setEmailMatch(null);
  };
  const resetPhoneMatch = () => {
    if (phoneDebounce) clearTimeout(phoneDebounce);
    setLockedMatch(null);
    setPhoneMatches([]);
    setDupCustomer(null);
    setForm((f) => ({ ...f, full_name: "", phone: "", email: "" }));
  };
  const handlePhoneChange = (val) => {
    formField("phone", val);
    if (lockedMatch || form.user_id_original || ccSelected) return;
    if (phoneDebounce) clearTimeout(phoneDebounce);
    setDupCustomer(null);
    setPhoneMatches([]);
    if (val.replace(/\D/g, "").length < 7) return;
    const t = setTimeout(async () => {
      setPhoneChecking(true);
      try {
        const dup = await CustomerSvc.findCustomerByPhone(val, clubId, form.id || null);
        if (dup) {
          setDupCustomer(dup);
          return;
        }
        const accounts = await CustomerSvc.findAccountsByPhone(val);
        if (accounts.length === 1) applyPhoneMatch(accounts[0]);
        else if (accounts.length > 1) setPhoneMatches(accounts);
      } catch (_) {
      } finally {
        setPhoneChecking(false);
      }
    }, 500);
    setPhoneDebounce(t);
  };
  const softDelete = async (id) => {
    try {
      await CustomerSvc.deleteCustomer(id);
      setConfirmDelete(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  };
  const openReservationForCustomer = (c) => {
    window.__customerPrefill = {
      customerId: c.id,
      customerName: c.full_name,
      userId: c.user_id || null
    };
    setScreen("reservations");
  };
  const formField = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const searchCcProfiles = async (q) => {
    setCcQuery(q);
    if (q.length < 2) {
      setCcResults([]);
      return;
    }
    try {
      const { data: linked } = await sb.from("club_customers").select("user_id").eq("club_id", clubId).eq("is_active", true).not("user_id", "is", null);
      const excludeId = form.user_id_original || null;
      const linkedIds = (linked || []).map((c) => c.user_id).filter((id) => id !== excludeId);
      const { data } = await sb.from("profiles").select("id, full_name, email").like("full_name_fold", `%${trFold(q)}%`).eq("user_type", "player").limit(20);
      const filtered2 = (data || []).filter((p) => !linkedIds.includes(p.id));
      setCcResults(filtered2.slice(0, 8));
    } catch (e) {
      console.error("Profil arama hatas\u0131:", e);
      setCcResults([]);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "M\xFC\u015Fteriler"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, customers.length, " m\xFC\u015Fteri kay\u0131tl\u0131")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => setBroadcastOpen(true), title: "Toplu bildirim g\xF6nder" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "campaign"), " Toplu Bildirim"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: openAdd }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "person_add"), " M\xFC\u015Fteri Ekle"))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      placeholder: "Ad, telefon veya e-posta ara...",
      value: searchQuery,
      onChange: (e) => setSearchQuery(e.target.value),
      style: { width: "100%", paddingLeft: 36, boxSizing: "border-box" }
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--text-2)", pointerEvents: "none" } }, "search"))), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : filtered.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "people_alt",
      title: searchQuery ? "E\u015Fle\u015Fen m\xFC\u015Fteri bulunamad\u0131" : "Hen\xFCz m\xFC\u015Fteri yok",
      sub: searchQuery ? "Farkl\u0131 bir arama terimi deneyin." : "\u0130lk m\xFC\u015Fterinizi ekleyin."
    }
  ) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, filtered.map((c) => /* @__PURE__ */ React.createElement("div", { key: c.id, className: "card tight", style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" } }, /* @__PURE__ */ React.createElement(Av, { name: c.full_name }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14 } }, c.full_name), c.user_id && /* @__PURE__ */ React.createElement("span", { style: { background: "#EEF2FF", color: "var(--brand-navy)", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20 } }, "CourtyCLUB")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2, display: "flex", flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 3 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12 } }, "phone"), c.phone), c.email && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 3 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12 } }, "email"), c.email)), c.notes && /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 11,
    color: "var(--text-2)",
    marginTop: 2,
    fontStyle: "italic",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 300
  } }, c.notes)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, flexShrink: 0 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-ghost btn-sm btn-icon",
      title: "Rezervasyon Olu\u015Ftur",
      onClick: () => openReservationForCustomer(c)
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "event_available")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-ghost btn-sm btn-icon",
      title: "D\xFCzenle",
      onClick: () => openEdit(c)
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "edit")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-ghost btn-sm btn-icon",
      title: "Profil / Ge\xE7mi\u015F",
      onClick: () => openDetail(c)
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "account_circle")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-danger btn-sm btn-icon",
      title: "Sil",
      onClick: () => setConfirmDelete(c)
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "delete")
  ))))), (modal === "add" || modal === "edit") && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: modal === "add" ? "M\xFC\u015Fteri Ekle" : "M\xFC\u015Fteri D\xFCzenle",
      onClose: () => setModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: save, disabled: saving }, saving ? "Kaydediliyor\u2026" : (lockedMatch || ccSelected || emailMatch && !emailMatch.alreadyLinkedTo) && modal === "add" ? "Kaydet & E\u015Fle\u015Ftir" : ccSelected && ccSelected.id !== form.user_id_original ? "Kaydet & E\u015Fle\u015Ftir" : "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Field, { label: "Ad Soyad *" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: form.full_name || "",
        placeholder: "\xD6rn: Ahmet Y\u0131lmaz",
        disabled: !!lockedMatch,
        onChange: (e) => formField("full_name", e.target.value),
        style: lockedMatch ? { background: "#F1F5F9", color: "var(--text-2)" } : void 0
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Telefon *" }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "tel",
        value: form.phone || "",
        placeholder: "0532 000 00 00",
        disabled: !!lockedMatch,
        onChange: (e) => handlePhoneChange(e.target.value),
        style: { width: "100%", boxSizing: "border-box", paddingRight: phoneChecking ? 32 : void 0, ...lockedMatch ? { background: "#F1F5F9", color: "var(--text-2)" } : {} }
      }
    ), phoneChecking && /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--text-2)", animation: "spin 1s linear infinite" } }, "refresh")), lockedMatch && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, padding: "10px 12px", background: "#EEF2FF", borderRadius: 10, border: "1px solid #C7D2FE", display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: "var(--brand-navy)", flexShrink: 0 } }, "verified_user"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, fontSize: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--brand-navy)" } }, "Hesap e\u015Fle\u015Fti: ", lockedMatch.full_name), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text-2)", marginTop: 1 } }, "Bu numaraya ait CourtyCLUB hesab\u0131. Ad/e-posta hesaptan al\u0131nd\u0131; kay\u0131t bu hesapla e\u015Fle\u015Ftirilecek.")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: resetPhoneMatch,
        style: { background: "none", border: "1px solid #C7D2FE", borderRadius: 8, cursor: "pointer", color: "var(--brand-navy)", fontSize: 11, fontWeight: 700, padding: "4px 8px", whiteSpace: "nowrap" }
      },
      "Farkl\u0131 ki\u015Fi"
    )), dupCustomer && !lockedMatch && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, padding: "10px 12px", background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: "#EF4444", flexShrink: 0 } }, "block"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, fontSize: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "#EF4444" } }, "Bu numara zaten kay\u0131tl\u0131: ", dupCustomer.full_name), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text-2)", marginTop: 1 } }, "Ayn\u0131 numarayla ikinci m\xFC\u015Fteri olu\u015Fturulamaz. Ayn\u0131 ki\u015Fiyse mevcut kayd\u0131 d\xFCzenleyin."))), phoneMatches.length > 1 && !lockedMatch && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, padding: "10px 12px", background: "#F1F5F9", borderRadius: 10, border: "1px solid #CBD5E1" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 } }, "Bu numarayla ", phoneMatches.length, " hesap e\u015Fle\u015Fti \u2014 do\u011Fru ki\u015Fiyi se\xE7in"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, phoneMatches.map((acc) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: acc.id,
        type: "button",
        onClick: () => applyPhoneMatch(acc),
        style: { display: "flex", alignItems: "center", gap: 8, textAlign: "left", background: "#fff", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: "8px 10px" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: "var(--brand-navy)" } }, "person"),
      /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 12, fontWeight: 600 } }, acc.full_name),
      acc.email && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)" } }, acc.email)
    ))))), /* @__PURE__ */ React.createElement(Field, { label: "E-posta" }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "email",
        value: form.email || "",
        placeholder: "ornek@email.com",
        disabled: !!lockedMatch,
        onChange: (e) => handleEmailChange(e.target.value),
        style: { width: "100%", boxSizing: "border-box", paddingRight: emailChecking ? 32 : void 0, ...lockedMatch ? { background: "#F1F5F9", color: "var(--text-2)" } : {} }
      }
    ), emailChecking && /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--text-2)", animation: "spin 1s linear infinite" } }, "refresh")), emailMatch && !ccSelected && !lockedMatch && (emailMatch.alreadyLinkedTo ? /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, padding: "10px 12px", background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: "#EF4444", flexShrink: 0 } }, "warning"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, fontSize: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "#EF4444" } }, "Bu email zaten ba\u015Fka bir m\xFC\u015Fteriye ba\u011Fl\u0131"), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text-2)", marginTop: 1 } }, '"', emailMatch.alreadyLinkedTo, '" m\xFC\u015Fterisi bu CourtyCLUB hesab\u0131n\u0131 kullan\u0131yor. E\u015Fle\u015Ftirme yap\u0131lmayacak.'))) : /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, padding: "10px 12px", background: "#EEF2FF", borderRadius: 10, border: "1px solid #C7D2FE", display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: "var(--brand-navy)", flexShrink: 0 } }, "link"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, fontSize: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--brand-navy)" } }, "CourtyCLUB hesab\u0131 bulundu: ", emailMatch.full_name), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text-2)", marginTop: 1 } }, "Kay\u0131t bu hesapla otomatik e\u015Fle\u015Ftirilecek. Ge\xE7mi\u015F rezervasyonlar da g\xF6r\xFCnecek."))))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Cinsiyet" }, /* @__PURE__ */ React.createElement("select", { value: form.gender || "", onChange: (e) => formField("gender", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Belirtilmemi\u015F"), /* @__PURE__ */ React.createElement("option", { value: "male" }, "Erkek"), /* @__PURE__ */ React.createElement("option", { value: "female" }, "Kad\u0131n"), /* @__PURE__ */ React.createElement("option", { value: "other" }, "Di\u011Fer"))), /* @__PURE__ */ React.createElement(Field, { label: "Do\u011Fum Tarihi" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        value: form.birth_date || "",
        onChange: (e) => formField("birth_date", e.target.value)
      }
    ))), /* @__PURE__ */ React.createElement(Field, { label: "Notlar" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: 3,
        value: form.notes || "",
        placeholder: "M\xFC\u015Fteri hakk\u0131nda notlar\u2026",
        onChange: (e) => formField("notes", e.target.value),
        style: { resize: "vertical" }
      }
    )), !lockedMatch && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" } }, "CourtyCLUB Hesab\u0131 (opsiyonel)"), ccSelected ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, background: "#EEF2FF", borderRadius: 10, padding: "10px 12px", border: "1px solid #C7D2FE" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--brand-navy)", fontSize: 16 } }, "verified_user"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--brand-navy)" } }, ccSelected.full_name), ccSelected.email && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, ccSelected.email)), ccSelected.id !== form.user_id_original && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setCcSelected(null);
          setCcQuery("");
          setCcResults([]);
        },
        style: { background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 0 }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "close")
    )) : /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "CourtyCLUB'da \xFCye ara (ad ile)\u2026",
        value: ccQuery,
        onChange: (e) => searchCcProfiles(e.target.value),
        style: { width: "100%", paddingLeft: 34, boxSizing: "border-box" }
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--text-2)", pointerEvents: "none" } }, "search")), ccResults.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 30, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", overflow: "hidden", marginTop: 4 } }, ccResults.map((p, idx) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: p.id,
        style: { padding: "9px 14px", cursor: "pointer", borderBottom: idx < ccResults.length - 1 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
        onMouseDown: () => {
          setCcSelected(p);
          setCcQuery("");
          setCcResults([]);
          if (!form.email?.trim() && p.email) formField("email", p.email);
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: "var(--brand-navy)" } }, "person"),
      /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontWeight: 600 } }, p.full_name),
      p.email && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)" } }, p.email)
    ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 5 } }, "Ba\u011Flan\u0131rsa ge\xE7mi\u015F rezervasyonlar da bu m\xFC\u015Fteride g\xF6r\xFCn\xFCr."))))
  ), modal === "detail" && selectedCust && /* @__PURE__ */ React.createElement(
    CustomerDetailModal,
    {
      customer: selectedCust,
      clubId,
      onClose: () => {
        setModal(null);
        setSelectedCust(null);
      },
      onReservation: (c) => {
        setModal(null);
        openReservationForCustomer(c);
      },
      onLinked: () => {
        load();
        CustomerSvc.getClubCustomers(clubId).then((data) => {
          const updated = data.find((x) => x.id === selectedCust.id);
          if (updated) setSelectedCust(updated);
        });
      }
    }
  ), confirmDelete && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "M\xFC\u015Fteriyi Sil",
      onClose: () => setConfirmDelete(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setConfirmDelete(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", onClick: () => softDelete(confirmDelete.id) }, "Sil"))
    },
    /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: "var(--text-1)" } }, /* @__PURE__ */ React.createElement("strong", null, confirmDelete.full_name), " m\xFC\u015Fterisini silmek istedi\u011Finize emin misiniz? Rezervasyon ge\xE7mi\u015Fi korunur, m\xFC\u015Fteri listeden kald\u0131r\u0131l\u0131r.")
  ), broadcastOpen && /* @__PURE__ */ React.createElement(ClubBroadcastModal, { clubId, initialAudience: "customers", onClose: () => setBroadcastOpen(false) }));
}

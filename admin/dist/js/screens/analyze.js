const INCOME_CATEGORIES = [
  "Rezervasyon Geliri",
  "Ders Geliri",
  "Ekipman Sat\u0131\u015F\u0131",
  "\xDCyelik Geliri",
  "Kafetarya Geliri",
  "Aidat Geliri",
  "Di\u011Fer Gelir"
];
const EXPENSE_CATEGORIES = [
  "Elektrik Faturas\u0131",
  "Su Faturas\u0131",
  "Personel Maa\u015F\u0131",
  "Ekipman Al\u0131m\u0131",
  "Bak\u0131m Onar\u0131m",
  "Temizlik",
  "Di\u011Fer Gider"
];
const MONTH_NAMES = [
  "Ocak",
  "\u015Eubat",
  "Mart",
  "Nisan",
  "May\u0131s",
  "Haziran",
  "Temmuz",
  "A\u011Fustos",
  "Eyl\xFCl",
  "Ekim",
  "Kas\u0131m",
  "Aral\u0131k"
];
function FinanceScreen({ clubId, clubProfile }) {
  const { useState, useEffect, useMemo } = React;
  const [records, setRecords] = useState([]);
  const [coachEarnings, setCoachEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("records");
  const [showFilters, setShowFilters] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [coachFilter, setCoachFilter] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [filters, setFilters] = useState({
    type: "all",
    category: "all",
    dateRange: "month",
    specificYear: (/* @__PURE__ */ new Date()).getFullYear(),
    specificMonth: (/* @__PURE__ */ new Date()).getMonth()
  });
  const [form, setForm] = useState({
    type: "income",
    category: "",
    amount: "",
    description: ""
  });
  useEffect(() => {
    if (clubId) loadAll();
  }, [clubId]);
  const loadAll = async () => {
    setLoading(true);
    try {
      const courtIds = await getClubCourtIds(clubId);
      const [recRes, earnRes] = await Promise.all([
        sb.from("club_finances").select("*").eq("club_id", clubId).order("created_at", { ascending: false }),
        sb.from("coach_earnings").select("*").eq("club_id", clubId).order("date", { ascending: false })
      ]);
      setRecords(recRes.data || []);
      setCoachEarnings(earnRes.data || []);
      if (courtIds.length > 0) {
        const { data: pending } = await sb.from("bookings").select("id, total_amount").in("court_id", courtIds).eq("status", "confirmed").eq("payment_status", "pending");
        const rows = pending || [];
        setPendingRevenue(rows.reduce((s, b) => s + (b.total_amount || 0), 0));
        setPendingCount(rows.length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = (recs) => recs.filter((r) => {
    if (filters.type !== "all" && r.type !== filters.type) return false;
    if (filters.category !== "all" && r.category !== filters.category) return false;
    if (filters.dateRange !== "all") {
      const rDate = new Date(r.date);
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      if (filters.dateRange === "today") {
        const rd = new Date(rDate);
        rd.setHours(0, 0, 0, 0);
        if (rd.getTime() !== today.getTime()) return false;
      } else if (filters.dateRange === "week") {
        const ago = new Date(today);
        ago.setDate(today.getDate() - 7);
        if (rDate < ago) return false;
      } else if (filters.dateRange === "month") {
        const ago = new Date(today);
        ago.setMonth(today.getMonth() - 1);
        if (rDate < ago) return false;
      } else if (filters.dateRange === "specificMonth") {
        if (rDate.getMonth() !== filters.specificMonth || rDate.getFullYear() !== filters.specificYear) return false;
      }
    }
    return true;
  });
  const filteredRecords = useMemo(() => applyFilters(records), [records, filters]);
  const stats = useMemo(() => {
    const totalIncome = filteredRecords.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
    const totalExpenses = filteredRecords.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
    return { totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses };
  }, [filteredRecords]);
  const earningsSummary = useMemo(() => ({
    totalUnpaid: coachEarnings.filter((e) => e.payment_status === "unpaid").reduce((s, e) => s + e.amount, 0),
    unpaidCount: coachEarnings.filter((e) => e.payment_status === "unpaid").length
  }), [coachEarnings]);
  const uniqueCoaches = useMemo(() => Array.from(new Set(coachEarnings.map((e) => e.coach_name))).sort(), [coachEarnings]);
  const filteredEarnings = coachFilter ? coachEarnings.filter((e) => e.coach_name === coachFilter) : coachEarnings;
  const getPeriodLabel = () => {
    const dr = filters.dateRange;
    if (dr === "today") return "Bug\xFCn";
    if (dr === "week") return "Bu Hafta";
    if (dr === "month") return "Bu Ay";
    if (dr === "specificMonth") return `${MONTH_NAMES[filters.specificMonth].slice(0, 3)} ${filters.specificYear}`;
    return "Toplam";
  };
  const getPeriodText = () => {
    const now = /* @__PURE__ */ new Date();
    const dr = filters.dateRange;
    if (dr === "today") return `Bug\xFCn (${now.toLocaleDateString("tr-TR")})`;
    if (dr === "week") {
      const w = new Date(now);
      w.setDate(now.getDate() - 7);
      return `Son 7 G\xFCn (${w.toLocaleDateString("tr-TR")} \u2013 ${now.toLocaleDateString("tr-TR")})`;
    }
    if (dr === "month") return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
    if (dr === "specificMonth") return `${MONTH_NAMES[filters.specificMonth]} ${filters.specificYear}`;
    return "T\xFCm Zamanlar";
  };
  const getActiveFilterCount = () => {
    return (filters.type !== "all" ? 1 : 0) + (filters.category !== "all" ? 1 : 0) + (filters.dateRange !== "all" ? 1 : 0);
  };
  const addRecord = async () => {
    if (!form.category) {
      alert("Kategori se\xE7in.");
      return;
    }
    if (!form.amount) {
      alert("Tutar girin.");
      return;
    }
    if (!form.description) {
      alert("A\xE7\u0131klama girin.");
      return;
    }
    setSaving(true);
    try {
      await sb.from("club_finances").insert({
        club_id: clubId,
        type: form.type,
        category: form.category,
        amount: parseFloat(form.amount),
        description: form.description,
        date: todayISO()
      });
      setAddModal(false);
      setForm({ type: "income", category: "", amount: "", description: "" });
      loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const markEarningPaid = async (id) => {
    if (!confirm("Bu hakedi\u015Fi \xF6dendi olarak i\u015Faretle?")) return;
    await sb.from("coach_earnings").update({ payment_status: "paid", paid_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    loadAll();
  };
  const markAllEarningsPaid = async (coachName) => {
    const unpaid = coachEarnings.filter((e) => e.coach_name === coachName && e.payment_status === "unpaid");
    if (unpaid.length === 0) {
      alert("Bu hocan\u0131n bekleyen hakedi\u015Fi yok.");
      return;
    }
    const total = unpaid.reduce((s, e) => s + e.amount, 0);
    if (!confirm(`${coachName} adl\u0131 hocan\u0131n ${unpaid.length} hakedi\u015Fi toplam ${fmtMoney(total)} \xF6dendi olarak i\u015Faretlensin mi?`)) return;
    await sb.from("coach_earnings").update({ payment_status: "paid", paid_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("club_id", clubId).eq("coach_name", coachName).eq("payment_status", "unpaid");
    loadAll();
  };
  const netPositive = stats.netProfit >= 0;
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Finansal Y\xF6netim"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, "Gelir & gider takibi")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", style: { position: "relative" }, onClick: () => setShowFilters((v) => !v) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "tune"), " Filtrele", getActiveFilterCount() > 0 && /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4, background: "#EF4444" } })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: loadAll }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "refresh")))), /* @__PURE__ */ React.createElement("div", { style: { background: "#0f172a", borderRadius: 16, padding: "20px 24px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 1 } }, "PERFORMANS \xD6ZET\u0130"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.6)" } }, getPeriodText()), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginTop: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 28, fontWeight: 800, color: "#fff", flex: 1 } }, fmtMoney(Math.abs(stats.netProfit))), /* @__PURE__ */ React.createElement("span", { style: { background: netPositive ? "#22C55E" : "#EF4444", color: "#fff", borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 } }, netPositive ? "NET KAR" : "NET ZARAR"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { borderLeft: "3px solid #3B82F6", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "#3B82F6", fontSize: 18 } }, "account_balance_wallet")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, fontWeight: 600, color: "var(--text-2)", letterSpacing: 0.3 } }, "Al\u0131nacak Para"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "#3B82F6" } }, fmtMoney(pendingRevenue)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text-2)" } }, pendingCount, " rezervasyon")), /* @__PURE__ */ React.createElement("div", { className: "card", style: { borderLeft: "3px solid #22C55E", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: 10, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "#22C55E", fontSize: 18 } }, "trending_up")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, fontWeight: 600, color: "var(--text-2)", letterSpacing: 0.3 } }, getPeriodLabel(), " Gelir"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "#22C55E" } }, fmtMoney(stats.totalIncome)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text-2)" } }, getPeriodLabel())), /* @__PURE__ */ React.createElement("div", { className: "card", style: { borderLeft: "3px solid #EF4444", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: 10, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "#EF4444", fontSize: 18 } }, "trending_down")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, fontWeight: 600, color: "var(--text-2)", letterSpacing: 0.3 } }, getPeriodLabel(), " Gider"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "#EF4444" } }, fmtMoney(stats.totalExpenses)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text-2)" } }, getPeriodLabel()))), showFilters && /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 14, gap: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", letterSpacing: 0.8, marginBottom: 8 } }, "T\xDCR"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [{ v: "all", l: "T\xFCm\xFC" }, { v: "income", l: "Gelir" }, { v: "expense", l: "Gider" }].map((o) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: o.v,
      type: "button",
      style: { flex: 1, padding: "9px", borderRadius: 999, border: "1.5px solid", borderColor: filters.type === o.v ? "var(--brand-navy)" : "var(--border)", background: filters.type === o.v ? "var(--brand-navy)" : "var(--bg)", color: filters.type === o.v ? "#fff" : "var(--text-2)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
      onClick: () => setFilters({ ...filters, type: o.v })
    },
    o.l
  )))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", letterSpacing: 0.8, marginBottom: 8 } }, "ZAMAN ARALI\u011EI"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, [{ v: "all", l: "T\xFCm Tarihler" }, { v: "today", l: "Bug\xFCn" }, { v: "week", l: "Bu Hafta" }, { v: "month", l: "Bu Ay" }].map((o) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: o.v,
      type: "button",
      style: { padding: "7px 14px", borderRadius: 999, border: "1.5px solid", borderColor: filters.dateRange === o.v ? "var(--brand-navy)" : "var(--border)", background: filters.dateRange === o.v ? "var(--brand-navy)" : "var(--bg)", color: filters.dateRange === o.v ? "#fff" : "var(--text-2)", fontWeight: filters.dateRange === o.v ? 700 : 500, fontSize: 13, cursor: "pointer" },
      onClick: () => setFilters({ ...filters, dateRange: o.v })
    },
    o.l
  )))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", letterSpacing: 0.8, marginBottom: 8 } }, "AY SE\xC7"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)", borderRadius: 10, border: "1.5px solid var(--border)", padding: "4px 8px", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm btn-icon", onClick: () => setFilters((f) => ({ ...f, specificYear: f.specificYear - 1, dateRange: "specificMonth" })) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_left")), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 15 } }, filters.specificYear), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm btn-icon", onClick: () => setFilters((f) => ({ ...f, specificYear: f.specificYear + 1, dateRange: "specificMonth" })) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_right"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 } }, MONTH_NAMES.map((name, idx) => {
    const sel = filters.dateRange === "specificMonth" && filters.specificMonth === idx;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: idx,
        type: "button",
        style: { padding: "9px 4px", borderRadius: 10, border: "1.5px solid", borderColor: sel ? "var(--brand-navy)" : "var(--border)", background: sel ? "var(--brand-navy)" : "var(--bg)", color: sel ? "#fff" : "var(--text-2)", fontWeight: sel ? 700 : 600, fontSize: 12, cursor: "pointer" },
        onClick: () => setFilters((f) => ({ ...f, dateRange: "specificMonth", specificMonth: idx }))
      },
      name.slice(0, 3)
    );
  }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { flex: 1 }, onClick: () => setFilters({ type: "all", category: "all", dateRange: "month", specificYear: (/* @__PURE__ */ new Date()).getFullYear(), specificMonth: (/* @__PURE__ */ new Date()).getMonth() }) }, "Temizle"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", style: { flex: 2 }, onClick: () => setShowFilters(false) }, "Uygula"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", background: "#fff", borderRadius: 14, padding: 4, gap: 4, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" } }, [
    { k: "records", icon: "receipt_long", l: "Kay\u0131tlar" },
    { k: "earnings", icon: "school", l: "Hoca Hakedi\u015Fleri" }
  ].map((t) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: t.k,
      type: "button",
      style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, border: "none", background: activeTab === t.k ? "#EEF2FF" : "transparent", color: activeTab === t.k ? "var(--brand-navy)" : "var(--text-2)", fontWeight: activeTab === t.k ? 700 : 600, fontSize: 13, cursor: "pointer", position: "relative" },
      onClick: () => setActiveTab(t.k)
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, t.icon),
    t.l,
    t.k === "earnings" && earningsSummary.unpaidCount > 0 && /* @__PURE__ */ React.createElement("span", { style: { background: "#F97316", color: "#fff", borderRadius: 9, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", fontSize: 10, fontWeight: 700 } }, earningsSummary.unpaidCount)
  ))), activeTab === "records" ? /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "Finansal Kay\u0131tlar"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: () => {
    setForm({ type: "income", category: "", amount: "", description: "" });
    setAddModal(true);
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "add"), " Yeni Kay\u0131t")), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : filteredRecords.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "account_balance_wallet",
      title: records.length === 0 ? "Hen\xFCz kay\u0131t yok" : "Kay\u0131t bulunamad\u0131",
      sub: records.length === 0 ? "\u0130lk kayd\u0131 eklemek i\xE7in Yeni Kay\u0131t butonuna t\u0131klay\u0131n" : "Filtreleri de\u011Fi\u015Ftirmeyi deneyin"
    }
  ) : /* @__PURE__ */ React.createElement("div", null, filteredRecords.map((r, i) => {
    const isIncome = r.type === "income";
    const isBooking = r.category === "Rezervasyon Geliri";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: r.id,
        style: { display: "flex", alignItems: "center", padding: "14px 16px", gap: 12, borderBottom: i < filteredRecords.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer" },
        onClick: () => setDetailRecord(r)
      },
      /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 40, borderRadius: 12, background: isIncome ? "#DCFCE7" : "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: isIncome ? "#22C55E" : "#EF4444", fontSize: 20 } }, isBooking ? "calendar_today" : isIncome ? "trending_up" : "trending_down")),
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 14, color: "var(--text-1)" } }, r.category), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2 } }, fmtDate(r.date), r.receipt_category ? ` \u2022 ${r.receipt_category}` : "")),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: isIncome ? "#22C55E" : "#EF4444" } }, isIncome ? "+" : "\u2013", " ", fmtMoney(r.amount)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: "2px 7px", borderRadius: 999, background: isIncome ? "#DCFCE7" : "#FEE2E2", color: isIncome ? "#22C55E" : "#EF4444" } }, isBooking ? "OTOMAT\u0130K" : isIncome ? "ONAYLANDI" : "FATURA"))
    );
  }))) : /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700 } }, "Hoca Hakedi\u015Fleri"), earningsSummary.unpaidCount > 0 && /* @__PURE__ */ React.createElement("span", { style: { background: "#FFF7ED", border: "1px solid #FDBA74", color: "#F97316", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 700 } }, "Bekleyen: ", fmtMoney(earningsSummary.totalUnpaid))), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : coachEarnings.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "school", title: "Hen\xFCz hakedi\u015F kayd\u0131 yok", sub: "Hocaya atanm\u0131\u015F rezervasyonlar \xF6dendi\u011Finde hakedi\u015Fler otomatik olu\u015Fur" }) : /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      style: { width: "100%", display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontSize: 14, fontWeight: coachFilter ? 700 : 600, color: coachFilter ? "var(--brand-navy)" : "var(--text-2)" },
      onClick: () => setDropdownOpen((v) => !v)
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: coachFilter ? "var(--brand-navy)" : "var(--text-2)" } }, "person_search"),
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1, textAlign: "left" } }, coachFilter || "T\xFCm Hocalar"),
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 20, color: "var(--text-2)" } }, dropdownOpen ? "keyboard_arrow_up" : "keyboard_arrow_down")
  ), dropdownOpen && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 10, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }, [null, ...uniqueCoaches].map((name) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: name || "_all",
      style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: coachFilter === name ? "#EEF2FF" : "transparent", fontSize: 14, fontWeight: coachFilter === name ? 700 : 500, color: coachFilter === name ? "var(--brand-navy)" : "var(--text-1)" },
      onClick: () => {
        setCoachFilter(name);
        setDropdownOpen(false);
      }
    },
    name || "T\xFCm Hocalar",
    coachFilter === name && /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: "var(--brand-navy)" } }, "check")
  )))), coachFilter && (() => {
    const unpaid = filteredEarnings.filter((e) => e.payment_status === "unpaid");
    if (unpaid.length === 0) return null;
    const total = unpaid.reduce((s, e) => s + e.amount, 0);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn btn-sm",
        style: { background: "#22C55E", color: "#fff", border: "none", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: "11px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13 },
        onClick: () => markAllEarningsPaid(coachFilter)
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "payments"),
      "Toplu \xD6de \xB7 ",
      fmtMoney(total),
      " (",
      unpaid.length,
      " hakedi\u015F)"
    );
  })(), filteredEarnings.map((e, i) => {
    const isPaid = e.payment_status === "paid";
    const isRefund = Number(e.amount) < 0;
    return /* @__PURE__ */ React.createElement("div", { key: e.id, style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < filteredEarnings.length - 1 ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 40, borderRadius: 12, background: isRefund ? "#FEE2E2" : isPaid ? "#DCFCE7" : "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: isRefund ? "#EF4444" : isPaid ? "#22C55E" : "#F97316", fontSize: 20 } }, isRefund ? "undo" : "school")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 14 } }, e.coach_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2 } }, fmtDate(e.date), e.student_name ? ` \u2022 ${e.student_name}` : ""), isRefund && e.description ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#EF4444", marginTop: 2 } }, e.description) : e.court_fee != null && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 1 } }, "Kort: ", fmtMoney(e.court_fee))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: isRefund ? "#EF4444" : "#F97316" } }, fmtMoney(e.amount)), isRefund && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: "2px 7px", borderRadius: 999, background: "#FEE2E2", color: "#EF4444" } }, "\u0130ADE"), isPaid ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: "2px 7px", borderRadius: 999, background: "#DCFCE7", color: "#22C55E" } }, isRefund ? "\u0130\u015ELEND\u0130" : "\xD6DEND\u0130") : /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        style: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: "3px 8px", borderRadius: 999, background: "#FFF7ED", color: "#F97316", border: "none", cursor: "pointer" },
        onClick: () => markEarningPaid(e.id)
      },
      isRefund ? "\u0130\u015ELE" : "\xD6DEND\u0130 M\u0130?"
    )));
  }))), addModal && /* @__PURE__ */ React.createElement(Modal, { title: "Yeni Kay\u0131t Ekle", wide: true, onClose: () => setAddModal(false), footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setAddModal(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: addRecord, disabled: saving }, saving ? "Kaydediliyor\u2026" : "Kaydet")) }, /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Field, { label: "T\xDCR" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, background: "var(--border)", borderRadius: 12, padding: 4 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 9, border: "none", background: form.type === "income" ? "#22C55E" : "transparent", color: form.type === "income" ? "#fff" : "var(--text-2)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
      onClick: () => setForm({ ...form, type: "income", category: "" })
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "trending_up"),
    " Gelir"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 9, border: "none", background: form.type === "expense" ? "#EF4444" : "transparent", color: form.type === "expense" ? "#fff" : "var(--text-2)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
      onClick: () => setForm({ ...form, type: "expense", category: "" })
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "trending_down"),
    " Gider"
  ))), /* @__PURE__ */ React.createElement(Field, { label: "KATEGOR\u0130" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 } }, (form.type === "income" ? INCOME_CATEGORIES.filter((c) => clubProfile?.has_cafe_system !== false || c !== "Kafetarya Geliri") : EXPENSE_CATEGORIES).map((cat) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: cat,
      type: "button",
      style: { padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: form.category === cat ? 700 : 500, border: "1.5px solid", borderColor: form.category === cat ? "var(--brand-navy)" : "var(--border)", background: form.category === cat ? "var(--brand-navy)" : "var(--bg)", color: form.category === cat ? "#fff" : "var(--text-2)", cursor: "pointer" },
      onClick: () => setForm({ ...form, category: cat })
    },
    cat
  )))), /* @__PURE__ */ React.createElement(Field, { label: "TUTAR" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 12, paddingLeft: 14 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginRight: 6 } }, "\u20BA"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      value: form.amount,
      placeholder: "0,00",
      style: { border: "none", background: "transparent", fontSize: 18, fontWeight: 700, outline: "none", paddingTop: 12, paddingBottom: 12, flex: 1, color: "var(--text-1)" },
      onChange: (e) => setForm({ ...form, amount: e.target.value })
    }
  ))), /* @__PURE__ */ React.createElement(Field, { label: "A\xC7IKLAMA" }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 3,
      value: form.description,
      placeholder: "Kay\u0131t a\xE7\u0131klamas\u0131\u2026",
      onChange: (e) => setForm({ ...form, description: e.target.value }),
      style: { resize: "vertical" }
    }
  )))), detailRecord && (() => {
    const r = detailRecord;
    const isIncome = r.type === "income";
    const isBooking = r.category === "Rezervasyon Geliri";
    return /* @__PURE__ */ React.createElement(Modal, { title: "\u0130\u015Flem Detay\u0131", onClose: () => setDetailRecord(null), footer: /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setDetailRecord(null) }, "Kapat") }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 64, height: 64, borderRadius: 20, background: isIncome ? "#DCFCE7" : "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: isIncome ? "#22C55E" : "#EF4444", fontSize: 28 } }, isBooking ? "calendar_today" : isIncome ? "trending_up" : "trending_down")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", letterSpacing: 1 } }, "\u0130\u015ELEM TUTARI"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 28, fontWeight: 800, color: isIncome ? "#22C55E" : "#EF4444" } }, isIncome ? "+" : "\u2013", " ", fmtMoney(r.amount)), isBooking && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, border: "1.5px solid #22C55E", borderRadius: 999, padding: "4px 12px" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12, color: "#22C55E" } }, "auto_awesome"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "#22C55E", letterSpacing: 0.5 } }, "OTOMAT\u0130K KAYIT"))), /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "var(--border)" } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, [
      { icon: "category", label: "KATEGOR\u0130", value: r.category },
      { icon: "event", label: "TAR\u0130H", value: fmtDate(r.date) },
      r.receipt_category ? { icon: "receipt", label: "F\u0130\u015E T\xDCR\xDC", value: r.receipt_category } : null
    ].filter(Boolean).map((row, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--brand-navy)", fontSize: 16 } }, row.icon)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--text-2)", letterSpacing: 0.5 } }, row.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginTop: 2 } }, row.value))))), r.description && /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg)", borderRadius: 12, padding: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--text-2)", letterSpacing: 0.5, marginBottom: 6 } }, "A\xC7IKLAMA"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "var(--text-1)", lineHeight: 1.5 } }, r.description))));
  })());
}
function BarChart({ data, labelKey, valueKey, color = "var(--brand-navy)", height = 160 }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  const BAR_AREA = height - 36;
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 6, height, paddingTop: 20 } }, data.map((d, i) => {
    const barH = Math.max(d[valueKey] > 0 ? Math.round(d[valueKey] / max * BAR_AREA) : 0, d[valueKey] > 0 ? 4 : 0);
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: BAR_AREA + 20 } }, d[valueKey] > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, fontWeight: 700, color: "var(--text-2)", marginBottom: 3 } }, d[valueKey]), /* @__PURE__ */ React.createElement(
      "div",
      {
        title: `${d[labelKey]}: ${d[valueKey]}`,
        style: { width: "80%", minWidth: 8, height: barH, background: color, borderRadius: "4px 4px 0 0", transition: "height 400ms ease" }
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: "var(--text-2)", marginTop: 5, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" } }, d[labelKey]));
  }));
}
function HBar({ label, value, max, color = "var(--brand-navy)" }) {
  const pct = max > 0 ? value / max * 100 : 0;
  const alpha = 0.12 + pct / 100 * 0.78;
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 38, fontSize: 10, color: "var(--text-2)", fontWeight: 600, textAlign: "right", flexShrink: 0 } }, label), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 20, background: `rgba(0,51,153,${alpha})`, borderRadius: 4, position: "relative", minWidth: 0 } }, value > 0 && /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: pct > 45 ? "#fff" : "var(--brand-navy)", fontWeight: 700 } }, value)));
}
function AnalyticsScreen({ clubId }) {
  const { useState, useEffect, useMemo } = React;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [monthly, setMonthly] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [catIncome, setCatIncome] = useState([]);
  useEffect(() => {
    if (clubId) load();
  }, [clubId]);
  const load = async () => {
    setLoading(true);
    try {
      const sixAgo = /* @__PURE__ */ new Date();
      sixAgo.setMonth(sixAgo.getMonth() - 6);
      const sixAgoStr = sixAgo.toISOString().split("T")[0];
      const courtIds = await getClubCourtIds(clubId);
      const [bkRes, memRes, finRes] = await Promise.all([
        courtIds.length > 0 ? sb.from("bookings").select("id,start_time,end_time,status,payment_status,total_amount").in("court_id", courtIds).gte("start_time", sixAgo.toISOString()) : Promise.resolve({ data: [] }),
        sb.from("club_memberships").select("id,status,created_at").eq("club_id", clubId),
        sb.from("club_finances").select("type,amount,category,date").eq("club_id", clubId).gte("date", sixAgoStr)
      ]);
      const bookings = bkRes.data || [];
      const members = memRes.data || [];
      const finances = finRes.data || [];
      const monthKeys = [];
      const monthMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = /* @__PURE__ */ new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthKeys.push({ key, iso });
        monthMap[iso] = { m: key, reservations: 0, income: 0, expense: 0 };
      }
      bookings.forEach((b) => {
        const iso = b.start_time.slice(0, 7);
        if (monthMap[iso]) monthMap[iso].reservations++;
      });
      finances.forEach((f) => {
        const iso = f.date.slice(0, 7);
        if (monthMap[iso]) {
          if (f.type === "income") monthMap[iso].income += f.amount || 0;
          if (f.type === "expense") monthMap[iso].expense += f.amount || 0;
        }
      });
      setMonthly(Object.values(monthMap));
      const hMap = {};
      for (let h = 7; h <= 22; h++) hMap[h] = 0;
      bookings.forEach((b) => {
        const h = new Date(b.start_time).getHours();
        if (hMap[h] !== void 0) hMap[h]++;
      });
      setHourly(Object.entries(hMap).map(([h, n]) => ({ h: Number(h), n })));
      const catMap = {};
      finances.filter((f) => f.type === "income").forEach((f) => {
        catMap[f.category] = (catMap[f.category] || 0) + (f.amount || 0);
      });
      const sorted = Object.entries(catMap).map(([cat, amount]) => ({ cat, amount })).sort((a, b) => b.amount - a.amount).slice(0, 6);
      setCatIncome(sorted);
      const totalIncome = finances.filter((f) => f.type === "income").reduce((s, f) => s + (f.amount || 0), 0);
      const totalExpense = finances.filter((f) => f.type === "expense").reduce((s, f) => s + (f.amount || 0), 0);
      const unpaidBk = bookings.filter((b) => b.status === "confirmed" && b.payment_status !== "paid");
      setStats({
        totalBookings: bookings.length,
        completedRate: bookings.length > 0 ? Math.round(bookings.filter((b) => b.status === "completed").length / bookings.length * 100) : 0,
        activeMembers: members.filter((m) => m.status === "active").length,
        totalMembers: members.length,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        unpaidCount: unpaidBk.length,
        unpaidRevenue: unpaidBk.reduce((s, b) => s + (b.total_amount || 0), 0)
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const maxHourly = useMemo(() => Math.max(...hourly.map((h) => h.n), 1), [hourly]);
  const maxCat = useMemo(() => Math.max(...catIncome.map((c) => c.amount), 1), [catIncome]);
  const netPos = (stats.netProfit || 0) >= 0;
  if (loading) return /* @__PURE__ */ React.createElement(Spinner, null);
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Analitik"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, "Son 6 ay \xB7 ", (/* @__PURE__ */ new Date()).toLocaleDateString("tr-TR", { month: "long", year: "numeric" }))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: load }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "refresh"))), /* @__PURE__ */ React.createElement("div", { className: "stats" }, /* @__PURE__ */ React.createElement(StatCard, { icon: "event_available", n: stats.totalBookings, label: "6 Ayl\u0131k Rezervasyon" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "check_circle", n: `%${stats.completedRate}`, label: "Tamamlanma Oran\u0131", tint: "green" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "group", n: stats.activeMembers, label: "Aktif \xDCye", tint: "navy" }), /* @__PURE__ */ React.createElement(
    StatCard,
    {
      icon: "account_balance_wallet",
      n: stats.unpaidCount > 0 ? stats.unpaidCount : "\u2014",
      label: "\xD6denmemi\u015F Rezervasyon",
      tint: stats.unpaidCount > 0 ? "purple" : ""
    }
  )), (stats.totalIncome > 0 || stats.totalExpense > 0) && /* @__PURE__ */ React.createElement("div", { style: { background: "#0f172a", borderRadius: 14, padding: "16px 20px", marginBottom: 14, display: "flex", alignItems: "center", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: 1 } }, "6 AYLIK NET KAR/ZARAR"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 26, fontWeight: 800, color: "#fff", marginTop: 4 } }, fmtMoney(Math.abs(stats.netProfit)))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#86EFAC" } }, "\u2191 ", fmtMoney(stats.totalIncome), " gelir"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#FCA5A5" } }, "\u2193 ", fmtMoney(stats.totalExpense), " gider")), /* @__PURE__ */ React.createElement("span", { style: { background: netPos ? "#22C55E" : "#EF4444", color: "#fff", borderRadius: 999, padding: "6px 14px", fontSize: 11, fontWeight: 800, letterSpacing: 0.5, flexShrink: 0 } }, netPos ? "KAR" : "ZARAR")), /* @__PURE__ */ React.createElement("div", { className: "row2", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "chart-card" }, /* @__PURE__ */ React.createElement("div", { className: "h", style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("h4", null, "Ayl\u0131k Rezervasyon (Son 6 Ay)")), /* @__PURE__ */ React.createElement(
    BarChart,
    {
      data: monthly,
      labelKey: "m",
      valueKey: "reservations",
      color: "var(--brand-navy)",
      height: 180
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "chart-card" }, /* @__PURE__ */ React.createElement("div", { className: "h", style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("h4", null, "Ayl\u0131k Gelir & Gider (Son 6 Ay)")), monthly.every((m) => m.income === 0 && m.expense === 0) ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "bar_chart", title: "Finans kayd\u0131 yok", sub: "Finans ekran\u0131ndan kay\u0131t ekleyin" }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 6, height: 180, paddingTop: 20 } }, (() => {
    const maxVal = Math.max(...monthly.flatMap((m) => [m.income, m.expense]), 1);
    const BAR_AREA = 180 - 36;
    return monthly.map((m, i) => {
      const incH = Math.max(m.income > 0 ? Math.round(m.income / maxVal * BAR_AREA) : 0, m.income > 0 ? 4 : 0);
      const expH = Math.max(m.expense > 0 ? Math.round(m.expense / maxVal * BAR_AREA) : 0, m.expense > 0 ? 4 : 0);
      return /* @__PURE__ */ React.createElement("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: BAR_AREA + 20 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 2, width: "90%" } }, /* @__PURE__ */ React.createElement(
        "div",
        {
          title: `Gelir: ${fmtMoney(m.income)}`,
          style: { flex: 1, height: incH, background: "#22C55E", borderRadius: "3px 3px 0 0", transition: "height 400ms ease" }
        }
      ), /* @__PURE__ */ React.createElement(
        "div",
        {
          title: `Gider: ${fmtMoney(m.expense)}`,
          style: { flex: 1, height: expH, background: "#EF4444", borderRadius: "3px 3px 0 0", transition: "height 400ms ease" }
        }
      )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: "var(--text-2)", marginTop: 5, textAlign: "center" } }, m.m));
    });
  })()), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, marginTop: 8, fontSize: 11, color: "var(--text-2)" } }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#22C55E", marginRight: 5 } }), "Gelir"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#EF4444", marginRight: 5 } }), "Gider")))), /* @__PURE__ */ React.createElement("div", { className: "row2" }, /* @__PURE__ */ React.createElement("div", { className: "chart-card" }, /* @__PURE__ */ React.createElement("div", { className: "h", style: { marginBottom: 8 } }, /* @__PURE__ */ React.createElement("h4", null, "Saat Da\u011F\u0131l\u0131m\u0131")), hourly.every((h) => h.n === 0) ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "schedule", title: "Rezervasyon verisi yok", sub: "Rezervasyon eklendi\u011Finde saat da\u011F\u0131l\u0131m\u0131 burada g\xF6r\xFCn\xFCr" }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 5 } }, hourly.map(({ h, n }) => /* @__PURE__ */ React.createElement(HBar, { key: h, label: `${String(h).padStart(2, "0")}:00`, value: n, max: maxHourly })))), /* @__PURE__ */ React.createElement("div", { className: "chart-card" }, /* @__PURE__ */ React.createElement("div", { className: "h", style: { marginBottom: 8 } }, /* @__PURE__ */ React.createElement("h4", null, "Gelir Kaynaklar\u0131 (Son 6 Ay)")), catIncome.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "pie_chart", title: "Finans kayd\u0131 yok", sub: "Finans ekran\u0131ndan kay\u0131t ekleyin" }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, catIncome.map((c, i) => {
    const pct = Math.round(c.amount / catIncome.reduce((s, x) => s + x.amount, 0) * 100);
    const barW = Math.max(c.amount / maxCat * 100, 2);
    const COLORS = ["#003399", "#0EA5E9", "#22C55E", "#F97316", "#8B5CF6", "#EC4899"];
    return /* @__PURE__ */ React.createElement("div", { key: i }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "var(--text-1)" } }, c.cat), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, color: "var(--text-2)" } }, fmtMoney(c.amount), " ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-2)", fontWeight: 400 } }, "(%", pct, ")"))), /* @__PURE__ */ React.createElement("div", { style: { height: 10, background: "var(--border)", borderRadius: 5, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${barW}%`, background: COLORS[i % COLORS.length], borderRadius: 5, transition: "width 500ms ease" } })));
  })))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 17, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--brand-navy)", fontSize: 20 } }, "insights"), "Ak\u0131ll\u0131 \u0130\xE7g\xF6r\xFCler"), /* @__PURE__ */ React.createElement(AnalyticsInsightsPanel, { clubId })));
}

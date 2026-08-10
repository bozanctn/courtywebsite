function ClubReviewsScreen({ clubId }) {
  const { useState, useEffect, useMemo } = React;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState(null);
  useEffect(() => {
    if (clubId) load();
  }, [clubId]);
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await sb.from("club_reviews").select("*, reviewer:profiles!club_reviews_reviewer_id_fkey(id, full_name, profile_photo_url)").eq("club_id", clubId).order("created_at", { ascending: false });
      setReviews(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const stats = useMemo(() => {
    if (!reviews.length) return { avg: 0, dist: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, total: 0 };
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach((r) => {
      const star = Math.round(r.rating || 0);
      if (star >= 1 && star <= 5) dist[star]++;
      sum += r.rating || 0;
    });
    return { avg: sum / reviews.length, dist, total: reviews.length };
  }, [reviews]);
  const Stars = ({ rating, size = 16 }) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", gap: 1 } }, [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ React.createElement(
      "span",
      {
        key: i,
        className: "material-icons",
        style: { fontSize: size, color: i <= full ? "#F59E0B" : i === full + 1 && half ? "#F59E0B" : "#D1D5DB" }
      },
      i <= full ? "star" : i === full + 1 && half ? "star_half" : "star_outline"
    )));
  };
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Kul\xFCp Yorumlar\u0131"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, stats.total, " yorum \xB7 Ortalama ", stats.avg.toFixed(1), " puan")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: load }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "refresh"))), stats.total > 0 && /* @__PURE__ */ React.createElement("div", { className: "card", style: { display: "flex", gap: 24, alignItems: "center", marginBottom: 14, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 48, fontWeight: 900, color: "var(--brand-navy)", lineHeight: 1 } }, stats.avg.toFixed(1)), /* @__PURE__ */ React.createElement(Stars, { rating: stats.avg, size: 18 }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 4 } }, stats.total, " yorum")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 160 } }, [5, 4, 3, 2, 1].map((star) => {
    const pct = stats.total > 0 ? stats.dist[star] / stats.total * 100 : 0;
    return /* @__PURE__ */ React.createElement("div", { key: star, style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", width: 14, textAlign: "right" } }, star), /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: "#F59E0B" } }, "star"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${pct}%`, background: "#F59E0B", borderRadius: 4, transition: "width 400ms" } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)", width: 20 } }, stats.dist[star]));
  }))), /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, loading ? /* @__PURE__ */ React.createElement(Spinner, null) : reviews.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "star_outline", title: "Hen\xFCz yorum yok", sub: "Kul\xFCb\xFCn\xFCze yap\u0131lan yorumlar burada g\xF6r\xFCnecek." }) : /* @__PURE__ */ React.createElement("div", null, reviews.map((r, i) => {
    const name = r.reviewer?.full_name || "Anonim";
    const date = r.created_at ? new Date(r.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "";
    return /* @__PURE__ */ React.createElement("div", { key: r.id, style: { padding: "16px", borderBottom: i < reviews.length - 1 ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 } }, /* @__PURE__ */ React.createElement(Av, { name, size: 36 }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14 } }, name), /* @__PURE__ */ React.createElement(Stars, { rating: r.rating || 0, size: 14 }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)", marginLeft: "auto" } }, date)), r.comment && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--text-1)", margin: "6px 0 0", lineHeight: 1.5 } }, r.comment), r.club_reply && /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg)", borderRadius: 8, padding: "8px 12px", marginTop: 8, borderLeft: "3px solid var(--brand-navy)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--brand-navy)", marginBottom: 4 } }, "Kul\xFCp Yan\u0131t\u0131"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--text-1)", margin: 0 } }, r.club_reply)), !r.club_reply && /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn btn-ghost btn-sm",
        style: { marginTop: 8 },
        onClick: () => setReply({ reviewId: r.id, text: "" })
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "reply"),
      " Yan\u0131tla"
    ))));
  }))), reply && /* @__PURE__ */ React.createElement(Modal, { title: "Yoruma Yan\u0131t Ver", onClose: () => setReply(null), footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setReply(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: async () => {
    if (!reply.text.trim()) {
      alert("Yan\u0131t metni bo\u015F olamaz.");
      return;
    }
    await sb.from("club_reviews").update({ club_reply: reply.text.trim() }).eq("id", reply.reviewId);
    setReply(null);
    load();
  } }, "G\xF6nder")) }, /* @__PURE__ */ React.createElement(Field, { label: "Yan\u0131t\u0131n\u0131z" }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 4,
      placeholder: "Yoruma yan\u0131t\u0131n\u0131z\u0131 yaz\u0131n\u2026",
      value: reply.text,
      onChange: (e) => setReply({ ...reply, text: e.target.value }),
      style: { resize: "vertical" }
    }
  ))));
}
function LessonRequestsScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [coaches, setCoaches] = useState([]);
  useEffect(() => {
    if (clubId) load();
  }, [clubId]);
  const load = async () => {
    setLoading(true);
    try {
      const [coachRes, courtIds] = await Promise.all([
        sb.from("club_coaches").select("id, full_name").eq("club_id", clubId).eq("is_active", true),
        getClubCourtIds(clubId)
      ]);
      setCoaches(coachRes.data || []);
      const coachIds = (coachRes.data || []).map((c) => c.id);
      if (coachIds.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }
      const { data } = await sb.from("lesson_requests").select("*, player:profiles!lesson_requests_player_id_fkey(id, full_name, email, profile_photo_url), coach:club_coaches!lesson_requests_coach_id_fkey(id, full_name)").in("coach_id", coachIds).order("created_at", { ascending: false });
      setRequests(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const updateStatus = async (id, status) => {
    const labels = { accepted: "kabul edilsin", rejected: "reddedilsin", completed: "tamamland\u0131 olarak i\u015Faretlensin" };
    if (!confirm(`Bu talep ${labels[status] || status} mi?`)) return;
    try {
      await sb.from("lesson_requests").update({ status }).eq("id", id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };
  const STATUS_LABELS = { pending: "Bekliyor", accepted: "Kabul", rejected: "Red", completed: "Tamamland\u0131" };
  const STATUS_CLS = { pending: "b-warning", accepted: "b-success", rejected: "b-danger", completed: "b-muted" };
  const TAB_ITEMS = [
    { key: "pending", label: "Bekliyor", count: requests.filter((r) => r.status === "pending").length },
    { key: "accepted", label: "Kabul Edilen", count: requests.filter((r) => r.status === "accepted").length },
    { key: "completed", label: "Tamamlanan", count: requests.filter((r) => r.status === "completed").length },
    { key: "rejected", label: "Reddedilen", count: requests.filter((r) => r.status === "rejected").length },
    { key: "all", label: "T\xFCm\xFC", count: requests.length }
  ];
  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Ders Talepleri"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, requests.filter((r) => r.status === "pending").length, " bekleyen talep")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: load }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "refresh"))), /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "table-toolbar" }, /* @__PURE__ */ React.createElement(Tabs, { items: TAB_ITEMS, active: filter, onChange: setFilter })), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : filtered.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "school", title: "Talep bulunamad\u0131", sub: "Bu kategoride ders talebi yok." }) : /* @__PURE__ */ React.createElement("div", null, filtered.map((r, i) => {
    const playerName = r.player?.full_name || "Bilinmiyor";
    const coachName = r.coach?.full_name || "Antren\xF6r atanmam\u0131\u015F";
    const date = r.requested_date ? new Date(r.requested_date).toLocaleDateString("tr-TR", { weekday: "short", day: "2-digit", month: "short" }) : "Tarih belirtilmemi\u015F";
    return /* @__PURE__ */ React.createElement("div", { key: r.id, style: { display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement(Av, { name: playerName, size: 38 }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14 } }, playerName), /* @__PURE__ */ React.createElement(Badge, { cls: STATUS_CLS[r.status] || "" }, STATUS_LABELS[r.status] || r.status)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12, verticalAlign: "middle" } }, "person"), " ", coachName), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12, verticalAlign: "middle" } }, "calendar_today"), " ", date), r.duration_minutes && /* @__PURE__ */ React.createElement("span", null, r.duration_minutes, " dk")), r.notes && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "var(--text-2)", margin: "6px 0 0" } }, '"', r.notes, '"')), r.status === "pending" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-success btn-sm", onClick: () => updateStatus(r.id, "accepted") }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "check"), " Kabul"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", onClick: () => updateStatus(r.id, "rejected") }, "Red")), r.status === "accepted" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { flexShrink: 0 }, onClick: () => updateStatus(r.id, "completed") }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "done_all"), " Tamamla"));
  }))));
}
function ClubWalletScreen({ clubId }) {
  const { useState, useEffect, useMemo } = React;
  const [finances, setFinances] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  useEffect(() => {
    if (clubId) load();
  }, [clubId]);
  const load = async () => {
    setLoading(true);
    try {
      const courtIds = await getClubCourtIds(clubId);
      const [finRes, bkRes, earnRes] = await Promise.all([
        sb.from("club_finances").select("*").eq("club_id", clubId).order("created_at", { ascending: false }),
        courtIds.length > 0 ? sb.from("bookings").select("id,total_amount,payment_status,status,start_time").in("court_id", courtIds) : Promise.resolve({ data: [] }),
        sb.from("coach_earnings").select("*").eq("club_id", clubId)
      ]);
      setFinances(finRes.data || []);
      setBookings(bkRes.data || []);
      setEarnings(earnRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const filterDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = /* @__PURE__ */ new Date();
    if (period === "week") {
      const ago = new Date(now);
      ago.setDate(now.getDate() - 7);
      return d >= ago;
    }
    if (period === "month") {
      const ago = new Date(now);
      ago.setMonth(now.getMonth() - 1);
      return d >= ago;
    }
    if (period === "year") {
      const ago = new Date(now);
      ago.setFullYear(now.getFullYear() - 1);
      return d >= ago;
    }
    return true;
  };
  const stats = useMemo(() => {
    const fin = finances.filter((f) => filterDate(f.date || f.created_at));
    const bk = bookings.filter((b) => filterDate(b.start_time));
    const earn = earnings.filter((e) => filterDate(e.date || e.created_at));
    const totalIncome = fin.filter((f) => f.type === "income").reduce((s, f) => s + (f.amount || 0), 0);
    const totalExpenses = fin.filter((f) => f.type === "expense").reduce((s, f) => s + (f.amount || 0), 0);
    const pendingBk = bk.filter((b) => b.payment_status !== "paid" && b.status === "confirmed");
    const pendingRevenue = pendingBk.reduce((s, b) => s + (b.total_amount || 0), 0);
    const unpaidEarnings = earn.filter((e) => e.payment_status === "unpaid").reduce((s, e) => s + (e.amount || 0), 0);
    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      pendingRevenue,
      pendingCount: pendingBk.length,
      unpaidEarnings
    };
  }, [finances, bookings, earnings, period]);
  const PERIOD_OPTS = [
    { v: "week", l: "Bu Hafta" },
    { v: "month", l: "Bu Ay" },
    { v: "year", l: "Bu Y\u0131l" },
    { v: "all", l: "T\xFCm\xFC" }
  ];
  const netPos = stats.netProfit >= 0;
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Kul\xFCp C\xFCzdan\u0131"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, "Gelir, gider ve bekleyen \xF6demelerin \xF6zeti")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, PERIOD_OPTS.map((o) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: o.v,
      className: `btn btn-sm ${period === o.v ? "btn-pri" : "btn-ghost"}`,
      onClick: () => setPeriod(o.v)
    },
    o.l
  )))), /* @__PURE__ */ React.createElement("div", { style: { background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", borderRadius: 16, padding: "20px 24px", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 1 } }, "NET KAR / ZARAR"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, fontWeight: 900, color: "#fff", marginTop: 4 } }, fmtMoney(Math.abs(stats.netProfit))), /* @__PURE__ */ React.createElement("span", { style: { background: netPos ? "#22C55E" : "#EF4444", color: "#fff", borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 700 } }, netPos ? "\u2191 KAR" : "\u2193 ZARAR")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10, marginBottom: 14 } }, [
    { icon: "trending_up", color: "#22C55E", bg: "#F0FDF4", label: "Toplam Gelir", val: fmtMoney(stats.totalIncome) },
    { icon: "trending_down", color: "#EF4444", bg: "#FEF2F2", label: "Toplam Gider", val: fmtMoney(stats.totalExpenses) },
    { icon: "account_balance_wallet", color: "#3B82F6", bg: "#EFF6FF", label: `Tahsil Edilecek (${stats.pendingCount})`, val: fmtMoney(stats.pendingRevenue) },
    { icon: "school", color: "#F97316", bg: "#FFF7ED", label: "Bekleyen Hoca Hakedi\u015Fi", val: fmtMoney(stats.unpaidEarnings) }
  ].map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "card", style: { gap: 6, borderLeft: `3px solid ${s.color}` } }, /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: s.color, fontSize: 17 } }, s.icon)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, fontWeight: 600, color: "var(--text-2)", letterSpacing: 0.3 } }, s.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, fontWeight: 800, color: s.color } }, s.val)))), /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 15 } }, "Son \u0130\u015Flemler"), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : finances.filter((f) => filterDate(f.date || f.created_at)).length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "receipt_long", title: "\u0130\u015Flem bulunamad\u0131", sub: "Se\xE7ilen d\xF6nem i\xE7in kay\u0131t yok." }) : /* @__PURE__ */ React.createElement("div", null, finances.filter((f) => filterDate(f.date || f.created_at)).slice(0, 20).map((r, i, arr) => {
    const isIncome = r.type === "income";
    return /* @__PURE__ */ React.createElement("div", { key: r.id, style: { display: "flex", alignItems: "center", padding: "12px 16px", gap: 12, borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: isIncome ? "#DCFCE7" : "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: isIncome ? "#22C55E" : "#EF4444", fontSize: 18 } }, isIncome ? "trending_up" : "trending_down")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, r.category), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, fmtDate(r.date || r.created_at?.split("T")[0]))), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: isIncome ? "#22C55E" : "#EF4444" } }, isIncome ? "+" : "\u2013", fmtMoney(r.amount)));
  }))));
}
function StudentNotesScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [notes, setNotes] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [coachFilter, setCoachFilter] = useState("");
  useEffect(() => {
    if (clubId) load();
  }, [clubId]);
  const load = async () => {
    setLoading(true);
    try {
      const [noteRes, coachRes] = await Promise.all([
        sb.from("student_notes").select("*, coach:club_coaches!student_notes_coach_id_fkey(id, full_name)").eq("club_id", clubId).order("created_at", { ascending: false }),
        sb.from("club_coaches").select("id, full_name").eq("club_id", clubId).eq("is_active", true)
      ]);
      setNotes(noteRes.data || []);
      setCoaches(coachRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    if (!form.student_name?.trim()) {
      alert("\xD6\u011Frenci ad\u0131 zorunludur.");
      return;
    }
    if (!form.note?.trim()) {
      alert("Not i\xE7eri\u011Fi zorunludur.");
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await sb.from("student_notes").update({ student_name: form.student_name.trim(), note: form.note.trim(), coach_id: form.coach_id || null }).eq("id", form.id);
      } else {
        await sb.from("student_notes").insert({ club_id: clubId, student_name: form.student_name.trim(), note: form.note.trim(), coach_id: form.coach_id || null });
      }
      setModal(null);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const del = async (id) => {
    if (!confirm("Bu notu silmek istedi\u011Finize emin misiniz?")) return;
    await sb.from("student_notes").delete().eq("id", id);
    load();
  };
  const filtered = notes.filter((n) => {
    if (coachFilter && n.coach_id !== coachFilter) return false;
    if (search && !n.student_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "\xD6\u011Frenci Notlar\u0131"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, notes.length, " not kayd\u0131")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: () => {
    setForm({});
    setModal("add");
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), " Not Ekle")), /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "table-toolbar", style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "search", style: { flex: 1, minWidth: 160 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "search"), /* @__PURE__ */ React.createElement("input", { placeholder: "\xD6\u011Frenci ad\u0131 ara\u2026", value: search, onChange: (e) => setSearch(e.target.value) })), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: coachFilter,
      onChange: (e) => setCoachFilter(e.target.value),
      style: { padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 13, background: "var(--bg)", color: "var(--text-1)" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "T\xFCm Antren\xF6rler"),
    coaches.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.full_name))
  )), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : filtered.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "sticky_note_2", title: "Not bulunamad\u0131", sub: "\xD6\u011Frenci notlar\u0131 eklemek i\xE7in + butonunu kullan\u0131n." }) : /* @__PURE__ */ React.createElement("div", null, filtered.map((n, i) => /* @__PURE__ */ React.createElement("div", { key: n.id, style: { padding: "14px 16px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--brand-navy)", fontSize: 18 } }, "person")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14 } }, n.student_name), n.coach && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)" } }, "\u2014 ", n.coach.full_name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)", marginLeft: "auto" } }, fmtDate(n.created_at?.split("T")[0]))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--text-1)", margin: "6px 0 0", lineHeight: 1.5 } }, n.note)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => {
    setForm({ ...n });
    setModal("edit");
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "edit")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => del(n.id) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "delete")))))))), modal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: modal === "edit" ? "Notu D\xFCzenle" : "Yeni Not Ekle",
      wide: true,
      onClose: () => setModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: save, disabled: saving }, saving ? "Kaydediliyor\u2026" : "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Field, { label: "\xD6\u011Frenci Ad\u0131 *" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Ad Soyad", value: form.student_name || "", onChange: (e) => setForm({ ...form, student_name: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Antren\xF6r" }, /* @__PURE__ */ React.createElement("select", { value: form.coach_id || "", onChange: (e) => setForm({ ...form, coach_id: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Antren\xF6r se\xE7in (iste\u011Fe ba\u011Fl\u0131)"), coaches.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.full_name)))), /* @__PURE__ */ React.createElement(Field, { label: "Not \u0130\xE7eri\u011Fi *" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: 5,
        placeholder: "\xD6\u011Frenci hakk\u0131nda notunuzu yaz\u0131n\u2026",
        value: form.note || "",
        onChange: (e) => setForm({ ...form, note: e.target.value }),
        style: { resize: "vertical" }
      }
    )))
  ));
}
function MyProgramScreen({ clubId, setScreen, clubProfile }) {
  const { useState, useEffect, useMemo } = React;
  const [selDate, setSelDate] = useState(todayISO());
  const [courts, setCourts] = useState([]);
  const [selCourtId, setSelCourtId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotClickInfo, setSlotClickInfo] = useState(null);
  const [slotTypeModal, setSlotTypeModal] = useState(false);
  const [closureGroups, setClosureGroups] = useState([]);
  const [closureType, setClosureType] = useState(null);
  const [closureIsRecurring, setClosureIsRecurring] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [slotSaving, setSlotSaving] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({});
  const [bookingAvailCourts, setBookingAvailCourts] = useState([]);
  const [bookingCourtsLoading, setBookingCourtsLoading] = useState(false);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingMemberId, setBookingMemberId] = useState(null);
  const [bookingMemberName, setBookingMemberName] = useState("");
  const [bookingMemberQuery, setBookingMemberQuery] = useState("");
  const [bookingMemberResults, setBookingMemberResults] = useState([]);
  const [bookingMemberLoading, setBookingMemberLoading] = useState(false);
  const [bookingCustomerId, setBookingCustomerId] = useState(null);
  const [bookingCustomerName, setBookingCustomerName] = useState("");
  const [bookingCustomerQuery, setBookingCustomerQuery] = useState("");
  const [bookingCustomerResults, setBookingCustomerResults] = useState([]);
  const [bookingCourtyclubResults, setBookingCourtyclubResults] = useState([]);
  const hasMembership = clubProfile?.has_membership_system !== false;
  const [bookingPersonMode, setBookingPersonMode] = useState("member");
  const [bookingPriceOverride, setBookingPriceOverride] = useState("");
  const [quickAddCust, setQuickAddCust] = useState(null);
  const [quickAddForm, setQuickAddForm] = useState({ name: "", phone: "" });
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [allManualLessons, setAllManualLessons] = useState([]);
  const [allClosureEvents, setAllClosureEvents] = useState([]);
  const [coachMap, setCoachMap] = useState(/* @__PURE__ */ new Map());
  const [bkPlayerMap, setBkPlayerMap] = useState(/* @__PURE__ */ new Map());
  const [bkDetail, setBkDetail] = useState(null);
  const [bkDetailSaving, setBkDetailSaving] = useState(false);
  const [lsDetail, setLsDetail] = useState(null);
  const [lsDetailSaving, setLsDetailSaving] = useState(false);
  const lsEditInitRef = React.useRef(null);
  const [clDetail, setClDetail] = useState(null);
  const [clDetailSaving, setClDetailSaving] = useState(false);
  const [clEditMode, setClEditMode] = useState(false);
  const [clEditForm, setClEditForm] = useState({ start_time: "", end_time: "" });
  const [clDeleteChoice, setClDeleteChoice] = useState(false);
  const [coachesList, setCoachesList] = useState([]);
  const [lsModal, setLsModal] = useState(null);
  const [lsForm, setLsForm] = useState({});
  const [lsSelectedPlayer, setLsSelectedPlayer] = useState(null);
  const [lsPlayerSearch, setLsPlayerSearch] = useState("");
  const [lsPlayerResults, setLsPlayerResults] = useState([]);
  const [lsPackages, setLsPackages] = useState([]);
  const [lsLoadingPkgs, setLsLoadingPkgs] = useState(false);
  const [lsUsePkg, setLsUsePkg] = useState(false);
  const [lsSelectedPkgId, setLsSelectedPkgId] = useState(null);
  const [lsSaving, setLsSaving] = useState(false);
  const lsSavingGuard = React.useRef(false);
  const [lsPersonMode, setLsPersonMode] = useState("member");
  const [lsSelectedCustomer, setLsSelectedCustomer] = useState(null);
  const [lsCustomerSearch, setLsCustomerSearch] = useState("");
  const [lsCustomerResults, setLsCustomerResults] = useState([]);
  const [lsCourtyclubResults, setLsCourtyclubResults] = useState([]);
  const [lsAutoCoachLoading, setLsAutoCoachLoading] = useState(false);
  const [lsPriceMode, setLsPriceMode] = useState("normal");
  const [lsCoachAmount, setLsCoachAmount] = useState("");
  const [lsClubAmount, setLsClubAmount] = useState("");
  const [grpModal, setGrpModal] = useState(null);
  const [grpGroups, setGrpGroups] = useState([]);
  const [grpSelectedId, setGrpSelectedId] = useState("");
  const [grpSaving, setGrpSaving] = useState(false);
  const [grpIsRecurring, setGrpIsRecurring] = useState(false);
  const [grpMembers, setGrpMembers] = useState([]);
  const [grpGroupCoaches, setGrpGroupCoaches] = useState([]);
  const [grpSelectedMembers, setGrpSelectedMembers] = useState(/* @__PURE__ */ new Set());
  const [grpSelectedCoaches, setGrpSelectedCoaches] = useState(/* @__PURE__ */ new Set());
  const [grpLoadingDetails, setGrpLoadingDetails] = useState(false);
  const SLOT_H = 64;
  const START_H = 6;
  const END_H = 24;
  useEffect(() => {
    if (clubId) load();
  }, [clubId]);
  React.useEffect(() => {
    const onFocus = () => {
      if (clubId && !document.hidden) load();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [clubId]);
  React.useEffect(() => {
    if (lsEditInitRef.current) return;
    const playerId = lsSelectedPlayer?.id || lsSelectedCustomer?.user_id || null;
    const manualName = !playerId && lsSelectedCustomer && !lsSelectedCustomer.user_id ? lsSelectedCustomer.full_name : null;
    if (!playerId && !manualName || lsForm.use_manual_coach) {
      setLsPackages([]);
      setLsUsePkg(false);
      setLsSelectedPkgId(null);
      return;
    }
    (async () => {
      setLsLoadingPkgs(true);
      try {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const baseQ = () => sb.from("player_lesson_packages").select("*, lesson_packages(name, total_lessons, price, validity_days, coach_percentage, coach_payout_mode)").in("payment_status", ["paid", "pending"]).eq("status", "active").or(`expiry_date.is.null,expiry_date.gt.${now}`).order("created_at", { ascending: false });
        const queries = [];
        if (playerId) queries.push(baseQ().eq("player_id", playerId));
        if (manualName) queries.push(baseQ().is("player_id", null).eq("manual_player_name", manualName));
        if (playerId && lsSelectedCustomer?.full_name) {
          queries.push(baseQ().is("player_id", null).eq("manual_player_name", lsSelectedCustomer.full_name));
        }
        const results = await Promise.all(queries);
        const seen = /* @__PURE__ */ new Set();
        const allData = results.flatMap((r) => r.data || []).filter((r) => {
          if (seen.has(r.id)) return false;
          seen.add(r.id);
          return true;
        });
        const pkgs = allData.map((r) => ({
          ...r,
          package_name: r.lesson_packages?.name || r.custom_name || "\xD6zel Paket",
          remaining: (r.total_lessons || 0) - (r.used_lessons || 0)
        }));
        setLsPackages(pkgs);
        if (pkgs.length > 0) {
          setLsSelectedPkgId(pkgs[0].id);
          setLsUsePkg(true);
          if (!lsForm.coach_id && pkgs[0].coach_id) {
            const autoCoach = coachesList.find((c) => c.individual_coach_id === pkgs[0].coach_id);
            if (autoCoach) {
              setLsForm((prev) => ({ ...prev, coach_id: autoCoach.id, amount: "0", payment_status: "paid" }));
            } else {
              setLsForm((prev) => ({ ...prev, amount: "0", payment_status: "paid" }));
            }
          } else {
            setLsForm((prev) => ({ ...prev, amount: "0", payment_status: "paid" }));
          }
        } else {
          setLsUsePkg(false);
          setLsSelectedPkgId(null);
        }
      } catch (e) {
        console.error("ls package load:", e);
      } finally {
        setLsLoadingPkgs(false);
      }
    })();
  }, [lsSelectedPlayer, lsSelectedCustomer, lsForm.use_manual_coach]);
  React.useEffect(() => {
    if (!grpSelectedId) {
      setGrpMembers([]);
      setGrpGroupCoaches([]);
      setGrpSelectedMembers(/* @__PURE__ */ new Set());
      setGrpSelectedCoaches(/* @__PURE__ */ new Set());
      return;
    }
    (async () => {
      setGrpLoadingDetails(true);
      try {
        const [{ data: membersData }, { data: coachesData }] = await Promise.all([
          sb.from("club_group_members").select("id,member_name").eq("group_id", grpSelectedId),
          sb.from("club_group_coaches").select("coach_id,club_coaches(id,full_name)").eq("group_id", grpSelectedId)
        ]);
        const members = membersData || [];
        const coaches_ = (coachesData || []).map((gc) => ({
          coach_id: gc.coach_id,
          full_name: gc.club_coaches?.full_name ?? "Hoca"
        }));
        setGrpMembers(members);
        setGrpGroupCoaches(coaches_);
        setGrpSelectedMembers(new Set(members.map((m) => m.id)));
        setGrpSelectedCoaches(new Set(coaches_.map((c) => c.coach_id)));
      } catch (e) {
        console.error("grp detail load:", e);
      } finally {
        setGrpLoadingDetails(false);
      }
    })();
  }, [grpSelectedId]);
  const load = async () => {
    setLoading(true);
    try {
      const [courtRes, coachRes] = await Promise.all([
        sb.from("courts").select("id,court_number,court_type,hourly_rate,is_indoor").eq("club_id", clubId).eq("is_active", true).order("court_number"),
        sb.from("club_coaches").select("id,full_name,individual_coach_id,coach_pay_rate").eq("club_id", clubId)
      ]);
      const courts_ = courtRes.data || [];
      const coaches_ = coachRes.data || [];
      const coachMap_ = new Map(coaches_.map((c) => [c.id, c.full_name]));
      setCourts(courts_);
      setCoachMap(coachMap_);
      setCoachesList(coaches_);
      const courtIds = courts_.map((c) => c.id);
      if (courtIds.length === 0) {
        setLoading(false);
        return;
      }
      const [bkRes, lessonRes, manualRes, closureRes] = await Promise.all([
        sb.from("bookings").select("id,start_time,end_time,status,payment_status,total_amount,user_id,court_id,club_customer_id,player_name").in("court_id", courtIds).neq("status", "cancelled").is("lesson_id", null),
        sb.from("lessons").select("id,start_time,end_time,student_name,status,payment_status,amount,coach_amount,court_id,club_coach_id,price_mode").in("court_id", courtIds).neq("status", "cancelled"),
        sb.from("club_manual_lessons").select("*, club_coaches(full_name)").eq("club_id", clubId),
        sb.from("court_closures").select("*,coach:club_coaches(id,full_name),group:club_groups(id,name)").in("court_id", courtIds).eq("is_active", true)
      ]);
      if (bkRes.error) console.error("bookings error:", bkRes.error);
      if (lessonRes.error) console.error("lessons error:", lessonRes.error);
      if (manualRes.error) console.error("manual_lessons error:", manualRes.error);
      if (closureRes.error) console.error("closures error:", closureRes.error);
      const groupIds = [...new Set((closureRes.data || []).filter((c) => c.group_id).map((c) => c.group_id))];
      let exceptionsData = [];
      if (groupIds.length > 0) {
        const { data: exData } = await sb.from("group_lesson_exceptions").select("group_id, exception_date, start_hour, start_minute").in("group_id", groupIds);
        exceptionsData = exData ?? [];
      }
      const today_ = /* @__PURE__ */ new Date();
      const closureEvents = [];
      (closureRes.data || []).forEach((cl) => {
        for (let offset = -90; offset <= 90; offset++) {
          const d = new Date(today_);
          d.setDate(d.getDate() + offset);
          const yr = d.getFullYear();
          const mo = String(d.getMonth() + 1).padStart(2, "0");
          const dy = String(d.getDate()).padStart(2, "0");
          const dateStr = `${yr}-${mo}-${dy}`;
          const dow = d.getDay();
          let applies = false;
          if (cl.closure_type === "recurring_weekly") {
            applies = cl.day_of_week === dow;
            if (applies && cl.start_date && cl.start_date > dateStr) applies = false;
            if (applies && cl.end_date && cl.end_date < dateStr) applies = false;
            if (applies && cl.group_id) {
              const isExc = exceptionsData.some(
                (ex) => ex.group_id === cl.group_id && ex.exception_date === dateStr && ex.start_hour === cl.start_hour && (ex.start_minute ?? 0) === (cl.start_minute ?? 0)
              );
              if (isExc) applies = false;
            }
          } else {
            applies = (!cl.start_date || cl.start_date <= dateStr) && (!cl.end_date || cl.end_date >= dateStr);
          }
          if (applies) closureEvents.push({ ...cl, _date: dateStr });
        }
      });
      const bookingIds = (bkRes.data || []).map((b) => b.id);
      const playerMap_ = /* @__PURE__ */ new Map();
      if (bookingIds.length > 0) {
        const { data: bpData } = await sb.from("booking_players").select("booking_id,is_primary_player,profiles(full_name)").in("booking_id", bookingIds);
        (bpData || []).forEach((bp) => {
          if (!playerMap_.has(bp.booking_id) || bp.is_primary_player)
            playerMap_.set(bp.booking_id, bp.profiles?.full_name || null);
        });
      }
      (bkRes.data || []).forEach((b) => {
        if (b.player_name) playerMap_.set(b.id, b.player_name);
      });
      const customerBookings = (bkRes.data || []).filter((b) => b.club_customer_id && !playerMap_.get(b.id));
      if (customerBookings.length > 0) {
        const custIds = [...new Set(customerBookings.map((b) => b.club_customer_id))];
        const { data: custData } = await sb.from("club_customers").select("id,full_name").in("id", custIds);
        const custMap = new Map((custData || []).map((c) => [c.id, c.full_name]));
        customerBookings.forEach((b) => {
          const name = custMap.get(b.club_customer_id);
          if (name) playerMap_.set(b.id, name);
        });
      }
      const lessonIds = (lessonRes.data || []).map((l) => l.id);
      const pkgSessionMap = /* @__PURE__ */ new Map();
      if (lessonIds.length > 0) {
        const { data: pkgSessions } = await sb.from("lesson_package_sessions").select("id, lesson_id, player_package_id").in("lesson_id", lessonIds).not("lesson_id", "is", null);
        (pkgSessions || []).forEach((s) => pkgSessionMap.set(s.lesson_id, { sessionId: s.id, packageId: s.player_package_id }));
      }
      const lessonsWithPkg = (lessonRes.data || []).map((l) => ({
        ...l,
        is_package_lesson: pkgSessionMap.has(l.id),
        pkg_session_id: pkgSessionMap.get(l.id)?.sessionId || null,
        player_package_id: pkgSessionMap.get(l.id)?.packageId || null
      }));
      const bkData = bkRes.data || [];
      const pendingIds = bkData.filter((b) => b.status === "pending").map((b) => b.id);
      if (pendingIds.length > 0) {
        sb.from("bookings").update({ status: "confirmed" }).in("id", pendingIds).then(() => {
        }).catch((e) => console.warn("Auto-confirm error:", e));
      }
      setAllBookings(bkData.map((b) => b.status === "pending" ? { ...b, status: "confirmed" } : b));
      setAllLessons(lessonsWithPkg);
      const manualData = manualRes.data || [];
      const individualIds_ = coaches_.map((c) => c.individual_coach_id).filter(Boolean);
      const coachToIndividual_ = new Map(coaches_.map((c) => [c.id, c.individual_coach_id]));
      let manualPkgMap = /* @__PURE__ */ new Map();
      if (individualIds_.length > 0) {
        const { data: manualSessions } = await sb.from("lesson_package_sessions").select("id, player_package_id, coach_id, session_date").is("lesson_id", null).in("coach_id", individualIds_);
        (manualSessions || []).forEach((s) => {
          manualPkgMap.set(`${s.coach_id}_${s.session_date}`, { session_id: s.id, player_package_id: s.player_package_id });
        });
      }
      const manualWithPkg = manualData.map((m) => {
        const indId = coachToIndividual_.get(m.coach_id);
        const pkgInfo = indId ? manualPkgMap.get(`${indId}_${m.date}`) : null;
        return { ...m, is_package_lesson: !!pkgInfo, pkg_session_id: pkgInfo?.session_id || null, player_package_id: pkgInfo?.player_package_id || null };
      });
      setAllManualLessons(manualWithPkg);
      setAllClosureEvents(closureEvents);
      setBkPlayerMap(playerMap_);
    } catch (e) {
      console.error("Program load error:", e);
    } finally {
      setLoading(false);
    }
  };
  const parseHM = (str) => {
    if (!str) return [0, 0];
    const [h, m] = str.slice(0, 5).split(":").map(Number);
    return [h || 0, m || 0];
  };
  const dayEvents = useMemo(() => {
    const all = [];
    const extractDateTime = (isoOrStr) => {
      if (!isoOrStr) return [null, null];
      return [isoOrStr.slice(0, 10), isoOrStr.slice(11, 16)];
    };
    allBookings.forEach((b) => {
      if (b.status === "cancelled") return;
      const [dateStr, startHM] = extractDateTime(b.start_time);
      const [, endHM] = extractDateTime(b.end_time);
      if (dateStr !== selDate) return;
      const [sh, sm] = parseHM(startHM);
      let [eh, em] = parseHM(endHM);
      if (eh * 60 + em <= sh * 60 + sm) eh += 24;
      const courtNum = courts.find((c) => c.id === b.court_id)?.court_number;
      const playerName = bkPlayerMap.get(b.id) || null;
      all.push({
        id: b.id,
        type: "booking",
        courtId: b.court_id,
        courtNum,
        label: playerName || "Rezervasyon",
        sh,
        sm,
        eh,
        em,
        color: "#22C55E",
        status: b.status,
        paymentStatus: b.payment_status,
        totalAmount: b.total_amount,
        userId: b.user_id,
        playerName
      });
    });
    allLessons.forEach((l) => {
      if (l.status === "cancelled") return;
      const startDate = new Date(l.start_time);
      const endDate = new Date(l.end_time);
      const dateStr = startDate.toLocaleDateString("sv-SE");
      if (dateStr !== selDate) return;
      const sh = startDate.getHours();
      const sm = startDate.getMinutes();
      let eh = endDate.getHours();
      const em = endDate.getMinutes();
      if (eh * 60 + em <= sh * 60 + sm) eh += 24;
      const coachName = l.club_coach_id && coachMap.get(l.club_coach_id) || "Antren\xF6r";
      const courtNum = courts.find((c) => c.id === l.court_id)?.court_number;
      all.push({
        id: "ls_" + l.id,
        type: "lesson",
        courtId: l.court_id,
        courtNum,
        label: `${l.student_name || "\xD6\u011Frenci"} \xB7 ${coachName}`,
        sh,
        sm,
        eh,
        em,
        color: "#8B5CF6",
        paymentStatus: l.payment_status,
        amount: l.amount,
        coachName,
        studentName: l.student_name,
        source: "lesson",
        rawId: l.id,
        lessonDate: dateStr,
        coachId: l.club_coach_id,
        isPackageLesson: !!l.is_package_lesson,
        pkgSessionId: l.pkg_session_id || null,
        playerPackageId: l.player_package_id || null,
        priceMode: l.price_mode || "normal",
        coachAmount: l.coach_amount ?? null,
        clubAmount: l.coach_amount != null ? l.amount - l.coach_amount : null
      });
    });
    allManualLessons.forEach((m) => {
      if (m.status === "cancelled") return;
      if (m.date !== selDate) return;
      const [sh, sm] = parseHM(m.start_time);
      let [eh, em] = parseHM(m.end_time);
      if (eh * 60 + em <= sh * 60 + sm) eh += 24;
      const coachName = m.club_coaches?.full_name || m.coach_name || "Antren\xF6r";
      const courtNum = courts.find((c) => c.id === m.court_id)?.court_number;
      all.push({
        id: "ml_" + m.id,
        type: "lesson",
        courtId: m.court_id,
        courtNum,
        label: `${m.student_name || "\xD6\u011Frenci"} \xB7 ${coachName}`,
        sh,
        sm,
        eh,
        em,
        color: "#8B5CF6",
        paymentStatus: m.payment_status,
        amount: m.amount,
        coachName,
        studentName: m.student_name,
        source: "manual",
        rawId: m.id,
        lessonDate: m.date,
        coachId: m.coach_id,
        priceMode: m.price_mode || "normal",
        coachAmount: m.coach_amount ?? null,
        clubAmount: m.club_amount ?? null,
        isPackageLesson: !!m.is_package_lesson,
        pkgSessionId: m.pkg_session_id || null,
        playerPackageId: m.player_package_id || null
      });
    });
    const groupedClosures = /* @__PURE__ */ new Map();
    allClosureEvents.forEach((cl) => {
      if (cl._date !== selDate) return;
      const coachName = cl.coach?.full_name;
      const groupName = cl.group?.name;
      if (cl.group_id) {
        const key = `${cl.group_id}|${cl.court_id}|${cl.start_hour}|${cl.start_minute ?? 0}|${cl.end_hour}|${cl.end_minute ?? 0}`;
        if (groupedClosures.has(key)) {
          const ev = groupedClosures.get(key);
          if (coachName && !ev.coaches.includes(coachName)) ev.coaches.push(coachName);
        } else {
          groupedClosures.set(key, {
            id: `cl_grp_${cl.group_id}_${cl._date}_${cl.court_id}`,
            type: "block",
            courtId: cl.court_id,
            courtNum: courts.find((c) => c.id === cl.court_id)?.court_number,
            label: groupName || cl.reason || "Kapal\u0131",
            coaches: coachName ? [coachName] : [],
            sh: cl.start_hour ?? 8,
            sm: cl.start_minute ?? 0,
            eh: cl.end_hour ?? 9,
            em: cl.end_minute ?? 0,
            color: "#F97316",
            groupId: cl.group_id,
            closureType: cl.closure_type,
            closureDate: cl._date
          });
        }
      } else {
        all.push({
          id: `cl_${cl.id}_${cl._date}`,
          type: "block",
          courtId: cl.court_id,
          courtNum: courts.find((c) => c.id === cl.court_id)?.court_number,
          label: groupName || cl.reason || "Kapal\u0131",
          coaches: coachName ? [coachName] : [],
          sh: cl.start_hour ?? 8,
          sm: cl.start_minute ?? 0,
          eh: cl.end_hour ?? 9,
          em: cl.end_minute ?? 0,
          color: "#F97316",
          rawId: cl.id,
          closureType: cl.closure_type,
          closureDate: cl._date
        });
      }
    });
    groupedClosures.forEach((ev) => all.push(ev));
    const manualLessonEvents = all.filter((e) => e.type === "lesson" && e.source === "manual");
    return all.filter((e) => {
      if (e.type !== "booking") return true;
      return !manualLessonEvents.some(
        (m) => m.courtId === e.courtId && m.sh * 60 + m.sm < e.eh * 60 + e.em && m.eh * 60 + m.em > e.sh * 60 + e.sm
      );
    });
  }, [selDate, allBookings, allLessons, allManualLessons, allClosureEvents, courts, coachMap, bkPlayerMap]);
  const displayCourts = useMemo(
    () => selCourtId ? courts.filter((c) => c.id === selCourtId) : courts,
    [courts, selCourtId]
  );
  const occupiedCourtIds = useMemo(() => new Set(dayEvents.map((e) => e.courtId).filter(Boolean)), [dayEvents]);
  const noCourtLessons = useMemo(() => dayEvents.filter((e) => !e.courtId && e.type === "lesson"), [dayEvents]);
  const isSlotOccupied = (courtId, hour) => dayEvents.some(
    (e) => e.courtId === courtId && e.sh * 60 + e.sm < (hour + 1) * 60 && e.eh * 60 + e.em > hour * 60
  );
  const slotToHM = (slot) => ({ h: START_H + Math.floor(slot / 4), m: slot % 4 * 15 });
  const isSlot15Occupied = (courtId, slot) => {
    const sm = slotToHM(slot);
    const startMins = sm.h * 60 + sm.m;
    return dayEvents.some(
      (e) => e.courtId === courtId && e.sh * 60 + e.sm < startMins + 15 && e.eh * 60 + e.em > startMins
    );
  };
  const { useRef } = React;
  const dragStateRef = useRef(null);
  const rectAllEmpty = (minCIdx, maxCIdx, minS, maxS, dcourts) => {
    for (let ci = minCIdx; ci <= maxCIdx; ci++) {
      const cId = dcourts[ci]?.id;
      if (!cId) return false;
      for (let s = minS; s <= maxS; s++) {
        if (isSlot15Occupied(cId, s)) return false;
      }
    }
    return true;
  };
  const commitDrag = (ds, dcourts) => {
    if (!ds) return;
    const minSlot = Math.min(ds.startSlot, ds.currentSlot);
    const maxSlot = Math.max(ds.startSlot, ds.currentSlot);
    const minCIdx = Math.min(ds.startCIdx, ds.currentCIdx);
    const maxCIdx = Math.max(ds.startCIdx, ds.currentCIdx);
    const courtIds = (dcourts || []).slice(minCIdx, maxCIdx + 1).map((c) => c.id);
    const { h: startHour, m: startMinute } = slotToHM(minSlot);
    const { h: endHour, m: endMinute } = slotToHM(maxSlot + 1);
    setDragState(null);
    dragStateRef.current = null;
    setSlotClickInfo({ courtIds, startHour, startMinute, endHour, endMinute });
    setClosureType(null);
    setSelectedGroup("");
    setSlotTypeModal(true);
  };
  const displayCourtsRef = useRef([]);
  React.useEffect(() => {
    const onUp = () => {
      if (dragStateRef.current) commitDrag(dragStateRef.current, displayCourtsRef.current);
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);
  const handleMouseDown = (courtIdx, courtId, slot) => {
    if (isSlot15Occupied(courtId, slot)) return;
    const ds = { startCIdx: courtIdx, currentCIdx: courtIdx, startSlot: slot, currentSlot: slot };
    dragStateRef.current = ds;
    setDragState(ds);
  };
  const handleMouseEnter = (courtIdx, courtId, slot) => {
    const cur = dragStateRef.current;
    if (!cur) return;
    const minCIdx = Math.min(cur.startCIdx, courtIdx);
    const maxCIdx = Math.max(cur.startCIdx, courtIdx);
    const minS = Math.min(cur.startSlot, slot);
    const maxS = Math.max(cur.startSlot, slot);
    if (!rectAllEmpty(minCIdx, maxCIdx, minS, maxS, displayCourtsRef.current)) return;
    const ds = { ...cur, currentCIdx: courtIdx, currentSlot: slot };
    dragStateRef.current = ds;
    setDragState(ds);
  };
  const applySlotPrefill = async (type) => {
    const { courtIds, startHour, startMinute, endHour, endMinute } = slotClickInfo;
    const startStr = `${String(startHour).padStart(2, "0")}:${String(startMinute || 0).padStart(2, "0")}`;
    const endStr = `${String(endHour).padStart(2, "0")}:${String(endMinute || 0).padStart(2, "0")}`;
    if (type === "reservation") {
      const [sh, sm] = startStr.split(":").map(Number);
      const [eh, em] = endStr.split(":").map(Number);
      const durationMins = eh * 60 + em - (sh * 60 + sm);
      const duration = [0.25, 0.5, 0.75, 1, 1.5, 2].reduce(
        (prev, cur) => Math.abs(cur * 60 - durationMins) < Math.abs(prev * 60 - durationMins) ? cur : prev
      );
      setBookingForm({ courtId: courtIds[0], date: selDate, startTime: startStr, endTime: endStr, duration, status: "confirmed" });
      setBookingMemberId(null);
      setBookingMemberName("");
      setBookingMemberQuery("");
      setBookingMemberResults([]);
      setBookingCustomerId(null);
      setBookingCustomerName("");
      setBookingCustomerQuery("");
      setBookingCustomerResults([]);
      setBookingCourtyclubResults([]);
      setBookingPersonMode("member");
      setBookingPriceOverride("");
      setSlotTypeModal(false);
      loadBookingAvailCourts(selDate, startStr, endStr);
      setBookingModal(true);
    } else if (type === "lesson") {
      setLsForm({
        use_manual_coach: false,
        coach_id: "",
        manual_coach_name: "",
        date: selDate,
        start_time: startStr,
        end_time: endStr,
        duration: null,
        student_name: "",
        player_id: null,
        court_id: courtIds[0],
        notes: "",
        amount: "",
        payment_status: "unpaid"
      });
      setLsSelectedPlayer(null);
      setLsPlayerSearch("");
      setLsPlayerResults([]);
      setLsSelectedCustomer(null);
      setLsCustomerSearch("");
      setLsCustomerResults([]);
      setLsCourtyclubResults([]);
      setLsPersonMode("member");
      setLsUsePkg(false);
      setLsSelectedPkgId(null);
      setLsPackages([]);
      setLsPriceMode("normal");
      lsEditInitRef.current = null;
      setLsModal({ type: "add" });
      setSlotTypeModal(false);
      setSlotClickInfo(null);
    } else if (type === "group") {
      if (grpGroups.length === 0) {
        const { data } = await sb.from("club_groups").select("id,name,coach_id,billing_type").eq("club_id", clubId).eq("is_active", true);
        setGrpGroups(data || []);
      }
      setGrpSelectedId("");
      setGrpIsRecurring(false);
      setGrpMembers([]);
      setGrpGroupCoaches([]);
      setGrpSelectedMembers(/* @__PURE__ */ new Set());
      setGrpSelectedCoaches(/* @__PURE__ */ new Set());
      setGrpModal({ type: "add" });
      setSlotTypeModal(false);
    } else {
      setClosureType(type);
    }
  };
  const saveInlineClosure = async () => {
    if (!slotClickInfo) return;
    setSlotSaving(true);
    try {
      if (closureType === "group" && selectedGroup) {
        const group = closureGroups.find((g) => g.id === selectedGroup);
        const coachId = group?.coach_id;
        if (coachId) {
          const startISO = `${selDate}T${String(slotClickInfo.startHour).padStart(2, "0")}:${String(slotClickInfo.startMinute || 0).padStart(2, "0")}:00`;
          const endISO = `${selDate}T${String(slotClickInfo.endHour).padStart(2, "0")}:${String(slotClickInfo.endMinute || 0).padStart(2, "0")}:00`;
          const [{ data: lessonConflict }, { data: manualConflict }, { data: closureConflict }] = await Promise.all([
            sb.from("lessons").select("id").eq("club_coach_id", coachId).neq("status", "cancelled").lt("start_time", endISO).gt("end_time", startISO),
            sb.from("club_manual_lessons").select("id, start_time, end_time").eq("coach_id", coachId).eq("date", selDate),
            sb.from("court_closures").select("id, coach_id, start_hour, end_hour, start_date, end_date, closure_type, day_of_week").eq("coach_id", coachId).eq("is_active", true)
          ]);
          if (lessonConflict?.length > 0) {
            const ok = confirm("\u26A0\uFE0F Bu saatte hocan\u0131n ba\u015Fka bir dersi var. Yine de eklensin mi?");
            if (!ok) {
              setSlotSaving(false);
              return;
            }
          } else {
            const sh = String(slotClickInfo.startHour).padStart(2, "0") + ":" + String(slotClickInfo.startMinute || 0).padStart(2, "0");
            const eh = String(slotClickInfo.endHour).padStart(2, "0") + ":" + String(slotClickInfo.endMinute || 0).padStart(2, "0");
            const manualOk = !(manualConflict || []).some(
              (l) => (l.start_time || "").slice(0, 5) < eh && (l.end_time || "").slice(0, 5) > sh
            );
            const dow2 = (/* @__PURE__ */ new Date(selDate + "T12:00:00")).getDay();
            const closureOk = !(closureConflict || []).some((cl) => {
              const cs = String(cl.start_hour ?? 0).padStart(2, "0") + ":00";
              const ce = String(cl.end_hour ?? 0).padStart(2, "0") + ":00";
              if (!(cs < eh && ce > sh)) return false;
              if (cl.closure_type === "recurring_weekly") return cl.day_of_week === dow2;
              return (!cl.start_date || cl.start_date <= selDate) && (!cl.end_date || cl.end_date >= selDate);
            });
            if (!manualOk || !closureOk) {
              const ok = confirm("\u26A0\uFE0F Bu saatte hocan\u0131n ba\u015Fka bir program\u0131 var. Yine de eklensin mi?");
              if (!ok) {
                setSlotSaving(false);
                return;
              }
            }
          }
        }
      }
      const isRecurring = closureType === "closure" && closureIsRecurring;
      const dow = (/* @__PURE__ */ new Date(selDate + "T12:00:00")).getDay();
      const rows = slotClickInfo.courtIds.map((cId) => ({
        court_id: cId,
        closure_type: isRecurring ? "recurring_weekly" : "one_time",
        reason: closureType === "group" ? "Grup Dersi" : "Kapal\u0131",
        start_hour: slotClickInfo.startHour,
        start_minute: slotClickInfo.startMinute || 0,
        end_hour: slotClickInfo.endHour,
        end_minute: slotClickInfo.endMinute || 0,
        start_date: selDate,
        ...isRecurring ? { day_of_week: dow } : { end_date: selDate },
        is_active: true,
        group_id: selectedGroup || null
      }));
      const { error } = await sb.from("court_closures").insert(rows);
      if (error) throw error;
      setSlotTypeModal(false);
      setSlotClickInfo(null);
      setClosureType(null);
      setClosureIsRecurring(false);
      await load();
    } catch (e) {
      alert("Hata: " + e.message);
    } finally {
      setSlotSaving(false);
    }
  };
  const saveGroupLesson = async () => {
    if (!grpSelectedId) {
      alert("L\xFCtfen bir grup se\xE7in");
      return;
    }
    setGrpSaving(true);
    try {
      const group = grpGroups.find((g) => g.id === grpSelectedId);
      if (!group) throw new Error("Grup bulunamad\u0131");
      const { courtIds, startHour, startMinute, endHour, endMinute } = slotClickInfo;
      const startH = startHour + (startMinute || 0) / 60;
      const endH = endHour + (endMinute || 0) / 60;
      const startStr = `${String(startHour).padStart(2, "0")}:${String(startMinute || 0).padStart(2, "0")}`;
      const endStr = `${String(endHour).padStart(2, "0")}:${String(endMinute || 0).padStart(2, "0")}`;
      const dow = (/* @__PURE__ */ new Date(selDate + "T12:00:00")).getDay();
      const conflictMsgs = [];
      const { data: courtClosures } = await sb.from("court_closures").select("id,court_id,closure_type,day_of_week,start_hour,start_minute,end_hour,end_minute,start_date,end_date,reason,group_id,courts(court_number)").in("court_id", courtIds).eq("is_active", true);
      const courtClosureGroupIds = (courtClosures || []).map((r) => r.group_id).filter(Boolean);
      const exSetGrp = /* @__PURE__ */ new Set();
      if (courtClosureGroupIds.length > 0) {
        const { data: exDataGrp } = await sb.from("group_lesson_exceptions").select("group_id, start_hour, start_minute").in("group_id", courtClosureGroupIds).eq("exception_date", selDate);
        (exDataGrp || []).forEach((ex) => exSetGrp.add(`${ex.group_id}_${ex.start_hour}_${ex.start_minute ?? 0}`));
      }
      for (const row of courtClosures || []) {
        if (row.group_id === grpSelectedId) continue;
        if (row.group_id && exSetGrp.has(`${row.group_id}_${row.start_hour}_${row.start_minute ?? 0}`)) continue;
        const cs = (row.start_hour || 0) + (row.start_minute || 0) / 60;
        const ce = (row.end_hour || 0) + (row.end_minute || 0) / 60;
        if (!(startH < ce && endH > cs)) continue;
        let applies = false;
        if (row.closure_type === "recurring_weekly") {
          applies = row.day_of_week === dow;
          if (applies && row.start_date && row.start_date > selDate) applies = false;
          if (applies && row.end_date && row.end_date < selDate) applies = false;
        } else {
          applies = (!row.start_date || row.start_date <= selDate) && (!row.end_date || row.end_date >= selDate);
        }
        if (applies) {
          const label = row.reason ? ` (${row.reason})` : "";
          conflictMsgs.push(`Kort ${row.courts?.court_number ?? "?"} \xB7 ${startStr}\u2013${endStr} dolu${label}`);
        }
      }
      const coachIdsToCheck = grpGroupCoaches.filter((gc) => grpSelectedCoaches.has(gc.coach_id)).map((gc) => gc.coach_id);
      for (const coachId of coachIdsToCheck) {
        const coachName = grpGroupCoaches.find((gc) => gc.coach_id === coachId)?.full_name ?? "Hoca";
        const { data: coachClosures } = await sb.from("court_closures").select("*, courts(court_number)").eq("coach_id", coachId).eq("is_active", true);
        for (const cl of coachClosures || []) {
          if (cl.group_id === grpSelectedId) continue;
          const cs = (cl.start_hour || 0) + (cl.start_minute || 0) / 60;
          const ce = (cl.end_hour || 0) + (cl.end_minute || 0) / 60;
          if (!(startH < ce && endH > cs)) continue;
          let applies = false;
          if (cl.closure_type === "recurring_weekly") {
            applies = cl.day_of_week === dow;
            if (applies && cl.start_date && cl.start_date > selDate) applies = false;
            if (applies && cl.end_date && cl.end_date < selDate) applies = false;
          } else {
            applies = (!cl.start_date || cl.start_date <= selDate) && (!cl.end_date || cl.end_date >= selDate);
          }
          if (applies) conflictMsgs.push(`${coachName} \xB7 ${startStr}\u2013${endStr} ba\u015Fka program\u0131 var`);
        }
        const { data: manualLessons } = await sb.from("club_manual_lessons").select("id,date,start_time,end_time").eq("coach_id", coachId).eq("date", selDate);
        for (const ml of manualLessons || []) {
          const [lsh, lsm] = (ml.start_time || "0:0").split(":").map(Number);
          const [leh, lem] = (ml.end_time || "0:0").split(":").map(Number);
          const lStart = lsh + lsm / 60;
          const lEnd = leh + lem / 60;
          if (startH < lEnd && endH > lStart) {
            conflictMsgs.push(`${coachName} \xB7 ${startStr}\u2013${endStr} manuel dersi var`);
            break;
          }
        }
      }
      if (conflictMsgs.length > 0) {
        const ok = confirm("\u26A0\uFE0F \xC7ak\u0131\u015Fma Var!\n\n" + conflictMsgs.join("\n") + "\n\nYine de eklensin mi?");
        if (!ok) {
          setGrpSaving(false);
          return;
        }
      }
      const selectedCoachArr = [...grpSelectedCoaches];
      const closureRows = [];
      for (const cId of courtIds) {
        const base = {
          court_id: cId,
          closure_type: grpIsRecurring ? "recurring_weekly" : "one_time",
          reason: `Grup Dersi \u2013 ${group.name}`,
          start_hour: startHour,
          start_minute: startMinute || 0,
          end_hour: endHour,
          end_minute: endMinute || 0,
          start_date: selDate,
          is_active: true,
          group_id: grpSelectedId
        };
        if (grpIsRecurring) {
          base.day_of_week = dow;
        } else {
          base.end_date = selDate;
        }
        if (selectedCoachArr.length === 0) {
          closureRows.push(base);
        } else {
          selectedCoachArr.forEach((cid) => closureRows.push({ ...base, coach_id: cid }));
        }
      }
      const { error } = await sb.from("court_closures").insert(closureRows);
      if (error) throw error;
      if (grpMembers.length > 0) {
        const primaryCoachId = selectedCoachArr[0] || null;
        const attendanceRows = grpMembers.map((m) => ({
          group_id: grpSelectedId,
          member_id: m.id,
          session_date: selDate,
          start_hour: startHour,
          end_hour: endHour,
          status: grpSelectedMembers.has(m.id) ? "present" : "absent",
          coach_id: primaryCoachId
        }));
        const { error: attErr } = await sb.from("group_attendance").insert(attendanceRows);
        if (attErr) console.warn("Devams\u0131zl\u0131k kayd\u0131 hatas\u0131:", attErr.message);
        if (group?.billing_type === "credit") {
          const presentIds = grpMembers.filter((m) => grpSelectedMembers.has(m.id)).map((m) => m.id);
          for (const memberId of presentIds) {
            const { data: pkgs } = await sb.from("club_group_member_packages").select("id,used_sessions,total_sessions").eq("group_id", grpSelectedId).eq("member_id", memberId).order("purchased_at", { ascending: true });
            const activePkg = (pkgs || []).find((p) => p.used_sessions < p.total_sessions);
            if (activePkg) {
              await sb.from("club_group_member_packages").update({ used_sessions: activePkg.used_sessions + 1 }).eq("id", activePkg.id);
            }
          }
        }
      }
      setGrpModal(null);
      setGrpSelectedId("");
      setSlotClickInfo(null);
      await load();
    } catch (e) {
      alert("Hata: " + e.message);
    } finally {
      setGrpSaving(false);
    }
  };
  const handleBkDetailCancel = async () => {
    if (!bkDetail) return;
    if (!confirm("Bu rezervasyonu iptal etmek istedi\u011Finize emin misiniz?")) return;
    setBkDetailSaving(true);
    try {
      const { error } = await sb.from("bookings").update({ status: "cancelled" }).eq("id", bkDetail.id);
      if (error) throw error;
      if (bkDetail.userId) {
        await sb.from("notifications").insert({
          user_id: bkDetail.userId,
          title: "Rezervasyon \u0130ptal Edildi",
          message: "Rezervasyonunuz kul\xFCp taraf\u0131ndan iptal edildi.",
          type: "reservation_cancelled",
          data: { booking_id: bkDetail.id }
        });
      }
      setBkDetail(null);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBkDetailSaving(false);
    }
  };
  const handleBkDetailComplete = async () => {
    if (!bkDetail) return;
    setBkDetailSaving(true);
    try {
      const { error } = await sb.from("bookings").update({ status: "completed" }).eq("id", bkDetail.id);
      if (error) throw error;
      setBkDetail(null);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBkDetailSaving(false);
    }
  };
  const handleBkDetailPaid = async () => {
    if (!bkDetail) return;
    const amount = Number(bkDetail.totalAmount) || 0;
    const amtStr = amount > 0 ? `

Tutar: \u20BA${amount.toLocaleString("tr-TR")}` : "";
    if (!confirm(`Bu rezervasyon i\xE7in \xF6deme al\u0131nd\u0131 m\u0131?${amtStr}`)) return;
    setBkDetailSaving(true);
    try {
      const { error } = await sb.from("bookings").update({ payment_status: "paid" }).eq("id", bkDetail.id);
      if (error) throw error;
      if (amount > 0) {
        await sb.from("club_finances").insert({
          club_id: clubId,
          type: "income",
          category: "Rezervasyon Geliri",
          amount,
          description: `${bkDetail.playerName || "Misafir"} - Kort ${bkDetail.courtNum || "?"} rezervasyon \xF6demesi`,
          date: selDate
        });
      }
      setBkDetail(null);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBkDetailSaving(false);
    }
  };
  const cancelCourtBooking = async (courtId, lessonDate, sh, sm, eh, em) => {
    const pad = (n) => String(n).padStart(2, "0");
    const startWeb = localTimeToDb(`${lessonDate}T${pad(sh)}:${pad(sm)}`);
    const startMob = (/* @__PURE__ */ new Date(`${lessonDate}T${pad(sh)}:${pad(sm)}:00+03:00`)).toISOString();
    await Promise.all([
      sb.from("bookings").update({ status: "cancelled" }).eq("court_id", courtId).eq("start_time", startWeb).neq("status", "cancelled"),
      sb.from("bookings").update({ status: "cancelled" }).eq("court_id", courtId).eq("start_time", startMob).neq("status", "cancelled")
    ]);
  };
  const handleLsDetailPaid = async () => {
    if (!lsDetail) return;
    const isSplitLesson = lsDetail.priceMode === "split";
    const isNewNormal = lsDetail.priceMode === "dual" || lsDetail.priceMode === "normal" && lsDetail.coachAmount != null;
    let coachAmt, clubAmt, courtFee, total, lines;
    if (isNewNormal) {
      coachAmt = Math.round((Number(lsDetail.coachAmount) || 0) * 100) / 100;
      clubAmt = Math.round((Number(lsDetail.clubAmount) || 0) * 100) / 100;
      courtFee = 0;
      total = Math.round((coachAmt + clubAmt) * 100) / 100;
      lines = [
        `Hoca Hakedi\u015Fi: \u20BA${coachAmt.toLocaleString("tr-TR")}`,
        `Kul\xFCp Pay\u0131:    \u20BA${clubAmt.toLocaleString("tr-TR")}`,
        `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
        `Toplam:        \u20BA${total.toLocaleString("tr-TR")}`
      ].join("\n");
    } else if (isSplitLesson) {
      const coachRec = coachesList.find((c) => c.id === lsDetail.coachId);
      const payRate = coachRec?.coach_pay_rate ?? 0;
      const rawAmt = Math.round((Number(lsDetail.amount) || 0) * 100) / 100;
      courtFee = 0;
      coachAmt = payRate > 0 ? Math.round(rawAmt * (payRate / 100) * 100) / 100 : rawAmt;
      clubAmt = payRate > 0 ? Math.round((rawAmt - coachAmt) * 100) / 100 : 0;
      total = rawAmt;
      lines = payRate > 0 ? [
        `Ders \xDCcreti:   \u20BA${rawAmt.toLocaleString("tr-TR")}`,
        `Hoca Hakedi\u015Fi: \u20BA${coachAmt.toLocaleString("tr-TR")} (%${payRate})`,
        `Kul\xFCp Pay\u0131:    \u20BA${clubAmt.toLocaleString("tr-TR")}`,
        `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
        `Toplam:        \u20BA${total.toLocaleString("tr-TR")}`
      ].join("\n") : `Pay oran\u0131 tan\u0131ml\u0131 de\u011Fil. T\xFCm tutar (\u20BA${rawAmt.toLocaleString("tr-TR")}) hocaya gidecek.`;
    } else {
      const court = courts.find((c) => c.id === lsDetail.courtId);
      const durationH = Math.max(0, (lsDetail.eh * 60 + lsDetail.em - (lsDetail.sh * 60 + lsDetail.sm)) / 60);
      courtFee = Math.round((court?.hourly_rate || 0) * durationH * 100) / 100;
      coachAmt = Math.round((Number(lsDetail.amount) || 0) * 100) / 100;
      clubAmt = 0;
      total = Math.round((courtFee + coachAmt) * 100) / 100;
      lines = [
        `Hoca Hakedi\u015Fi: \u20BA${coachAmt.toLocaleString("tr-TR")}`,
        `Kort \xDCcreti:   \u20BA${courtFee.toLocaleString("tr-TR")}`,
        `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
        `Toplam:        \u20BA${total.toLocaleString("tr-TR")}`
      ].join("\n");
    }
    if (!confirm(`\xD6deme Al

${lines}

\xD6deme al\u0131nd\u0131 olarak i\u015Faretlensin mi?`)) return;
    setLsDetailSaving(true);
    try {
      const payIndCoachId = coachesList.find((c) => c.id === lsDetail.coachId)?.individual_coach_id || null;
      if (isNewNormal) {
        if (clubAmt > 0) {
          await sb.from("club_finances").insert({
            club_id: clubId,
            type: "income",
            category: "\xD6zel Ders Geliri",
            amount: clubAmt,
            description: `${lsDetail.coachName} - ${lsDetail.studentName || "\xD6\u011Frenci"} - \xD6zel Ders`,
            date: lsDetail.lessonDate
          });
        }
        if (coachAmt > 0) {
          await sb.from("coach_earnings").insert({
            club_id: clubId,
            coach_id: lsDetail.coachId || null,
            individual_coach_id: payIndCoachId,
            manual_lesson_id: lsDetail.source === "manual" ? lsDetail.rawId : null,
            lesson_id: lsDetail.source === "lesson" ? lsDetail.rawId : null,
            coach_name: lsDetail.coachName,
            student_name: lsDetail.studentName || null,
            amount: coachAmt,
            court_fee: 0,
            date: lsDetail.lessonDate,
            description: `\xD6zel ders - ${lsDetail.studentName || "\xD6\u011Frenci"} - ${String(lsDetail.sh).padStart(2, "0")}:${String(lsDetail.sm).padStart(2, "0")}`,
            payment_status: "unpaid"
          });
        }
      } else if (isSplitLesson) {
        if (coachAmt > 0) {
          await sb.from("coach_earnings").insert({
            club_id: clubId,
            coach_id: lsDetail.coachId || null,
            individual_coach_id: payIndCoachId,
            manual_lesson_id: lsDetail.source === "manual" ? lsDetail.rawId : null,
            lesson_id: lsDetail.source === "lesson" ? lsDetail.rawId : null,
            coach_name: lsDetail.coachName,
            student_name: lsDetail.studentName || null,
            amount: coachAmt,
            court_fee: 0,
            date: lsDetail.lessonDate,
            description: `\xD6zel ders (pay) - ${lsDetail.studentName || "\xD6\u011Frenci"} - ${String(lsDetail.sh).padStart(2, "0")}:${String(lsDetail.sm).padStart(2, "0")}`,
            payment_status: "unpaid"
          });
        }
        if (clubAmt > 0) {
          await sb.from("club_finances").insert({
            club_id: clubId,
            type: "income",
            category: "\xD6zel Ders Geliri",
            amount: clubAmt,
            description: `${lsDetail.coachName} - ${lsDetail.studentName || "\xD6\u011Frenci"} - \xD6zel Ders`,
            date: lsDetail.lessonDate
          });
        }
      } else {
        if (courtFee > 0) {
          await sb.from("club_finances").insert({
            club_id: clubId,
            type: "income",
            category: "Rezervasyon Geliri",
            amount: courtFee,
            description: `${lsDetail.coachName} - ${lsDetail.studentName || "\xD6\u011Frenci"} - \xD6zel ders kort \xFCcreti`,
            date: lsDetail.lessonDate
          });
        }
        if (coachAmt > 0) {
          await sb.from("coach_earnings").insert({
            club_id: clubId,
            coach_id: lsDetail.coachId || null,
            individual_coach_id: payIndCoachId,
            lesson_id: lsDetail.source === "lesson" ? lsDetail.rawId : null,
            manual_lesson_id: lsDetail.source === "manual" ? lsDetail.rawId : null,
            coach_name: lsDetail.coachName,
            student_name: lsDetail.studentName || null,
            amount: coachAmt,
            court_fee: courtFee,
            date: lsDetail.lessonDate,
            description: `\xD6zel ders - ${lsDetail.studentName || "\xD6\u011Frenci"} - ${String(lsDetail.sh).padStart(2, "0")}:${String(lsDetail.sm).padStart(2, "0")}`,
            payment_status: "unpaid"
          });
        }
      }
      if (lsDetail.source === "lesson") {
        const { error } = await sb.from("lessons").update({ payment_status: "paid" }).eq("id", lsDetail.rawId);
        if (error) throw error;
      } else {
        const { error } = await sb.from("club_manual_lessons").update({ payment_status: "paid" }).eq("id", lsDetail.rawId);
        if (error) throw error;
      }
      setLsDetail(null);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setLsDetailSaving(false);
    }
  };
  const handleLsDetailCancel = async () => {
    if (!lsDetail) return;
    let pkgSessionId = null, playerPackageId = null;
    if (lsDetail.source === "manual" && lsDetail.coachId && lsDetail.lessonDate) {
      const coachRec = coachesList.find((c) => c.id === lsDetail.coachId);
      const indCoachId = coachRec?.individual_coach_id;
      if (indCoachId) {
        const { data: sess } = await sb.from("lesson_package_sessions").select("id, player_package_id").eq("session_date", lsDetail.lessonDate).eq("coach_id", indCoachId).is("lesson_id", null).limit(1);
        if (sess?.length > 0) {
          pkgSessionId = sess[0].id;
          playerPackageId = sess[0].player_package_id;
        }
      }
    } else if (lsDetail.source === "lesson") {
      const { data: sess } = await sb.from("lesson_package_sessions").select("id, player_package_id").eq("lesson_id", lsDetail.rawId).limit(1);
      if (sess?.length > 0) {
        pkgSessionId = sess[0].id;
        playerPackageId = sess[0].player_package_id;
      }
    }
    const isPackage = !!(pkgSessionId && playerPackageId);
    const msg = isPackage ? "Bu dersi silmek istedi\u011Finizden emin misiniz? Paketten d\xFC\u015F\xFClm\xFC\u015Fse kredi geri y\xFCklenir." : "Bu dersi iptal etmek istedi\u011Finize emin misiniz?";
    if (!confirm(msg)) return;
    setLsDetailSaving(true);
    try {
      if (pkgSessionId && playerPackageId) {
        const { data: plp } = await sb.from("player_lesson_packages").select("used_lessons").eq("id", playerPackageId).single();
        if (plp) {
          await Promise.all([
            sb.from("player_lesson_packages").update({
              used_lessons: Math.max(0, (plp.used_lessons || 0) - 1),
              status: "active",
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }).eq("id", playerPackageId),
            sb.from("lesson_package_sessions").delete().eq("id", pkgSessionId)
          ]);
        }
      }
      if (lsDetail.source === "manual") {
        await sb.from("coach_earnings").delete().eq("manual_lesson_id", lsDetail.rawId);
        const _stu = lsDetail.studentName || "\xD6\u011Frenci";
        const _coach = lsDetail.coachName || "Hoca";
        const _sigs = [
          { category: "\xD6zel Ders Geliri", description: `${_coach} - ${_stu} - \xD6zel Ders` },
          { category: "Rezervasyon Geliri", description: `${_coach} - ${_stu} - \xD6zel ders kort \xFCcreti` }
        ];
        for (const sig of _sigs) {
          const { data: rows } = await sb.from("club_finances").select("id").eq("club_id", clubId).eq("date", lsDetail.lessonDate).eq("category", sig.category).eq("description", sig.description);
          if (rows && rows.length === 1) await sb.from("club_finances").delete().eq("id", rows[0].id);
        }
        await sb.from("club_manual_lessons").delete().eq("id", lsDetail.rawId);
        if (lsDetail.courtId) {
          await cancelCourtBooking(lsDetail.courtId, lsDetail.lessonDate, lsDetail.sh, lsDetail.sm, lsDetail.eh, lsDetail.em);
        }
      } else {
        await sb.from("lessons").update({ status: "cancelled" }).eq("id", lsDetail.rawId);
        if (lsDetail.courtId) {
          await cancelCourtBooking(lsDetail.courtId, lsDetail.lessonDate, lsDetail.sh, lsDetail.sm, lsDetail.eh, lsDetail.em);
        }
      }
      setLsDetail(null);
      load();
    } catch (e) {
      console.warn("Ders iptal hatas\u0131:", e.message);
      alert(e.message);
    } finally {
      setLsDetailSaving(false);
    }
  };
  const rebuildManualLessonFinance = async (oldInfo, newInfo) => {
    const pad = (n) => String(n).padStart(2, "0");
    const warnings = [];
    await sb.from("coach_earnings").delete().eq("manual_lesson_id", oldInfo.manualLessonId);
    const oldStu = oldInfo.oldStudentName || "\xD6\u011Frenci";
    const oldCoach = oldInfo.oldCoachName || "Hoca";
    const sigs = [
      { category: "\xD6zel Ders Geliri", description: `${oldCoach} - ${oldStu} - \xD6zel Ders` },
      { category: "Rezervasyon Geliri", description: `${oldCoach} - ${oldStu} - \xD6zel ders kort \xFCcreti` }
    ];
    for (const sig of sigs) {
      const { data: rows } = await sb.from("club_finances").select("id").eq("club_id", clubId).eq("date", oldInfo.oldDate).eq("category", sig.category).eq("description", sig.description);
      if (!rows || rows.length === 0) continue;
      if (rows.length > 1) {
        warnings.push("kul\xFCp gelir kayd\u0131 (birden fazla e\u015Fle\u015Fme)");
        continue;
      }
      await sb.from("club_finances").delete().eq("id", rows[0].id);
    }
    const stu = newInfo.studentName || "\xD6\u011Frenci";
    const startLabel = `${pad(newInfo.sh)}:${pad(newInfo.sm)}`;
    const coachRec = newInfo.coachId ? coachesList.find((c) => c.id === newInfo.coachId) : null;
    const indCoachId = coachRec?.individual_coach_id || null;
    const proms = [];
    if (newInfo.priceMode === "split") {
      const rawAmt = Math.round((Number(newInfo.amount) || 0) * 100) / 100;
      const payRate = coachRec?.coach_pay_rate ?? 0;
      if (newInfo.coachId && rawAmt > 0 && payRate > 0) {
        const coachEarn = Math.round(rawAmt * (payRate / 100) * 100) / 100;
        const clubEarn = Math.round((rawAmt - coachEarn) * 100) / 100;
        if (coachEarn > 0) proms.push(sb.from("coach_earnings").insert({
          club_id: clubId,
          coach_id: newInfo.coachId,
          individual_coach_id: indCoachId,
          manual_lesson_id: oldInfo.manualLessonId,
          coach_name: newInfo.coachName,
          student_name: newInfo.studentName || null,
          amount: coachEarn,
          court_fee: 0,
          date: newInfo.date,
          description: `\xD6zel ders (pay) - ${stu} - ${startLabel}`,
          payment_status: "unpaid",
          collected_by_coach: false,
          court_fee_settled: false
        }));
        if (clubEarn > 0) proms.push(sb.from("club_finances").insert({
          club_id: clubId,
          type: "income",
          category: "\xD6zel Ders Geliri",
          amount: clubEarn,
          description: `${newInfo.coachName} - ${stu} - \xD6zel Ders`,
          date: newInfo.date
        }));
      }
    } else if (newInfo.priceMode === "dual") {
      if (newInfo.paid) {
        const coachAmt = Math.round((Number(newInfo.coachAmount) || 0) * 100) / 100;
        const clubAmt = Math.round((Number(newInfo.clubAmount) || 0) * 100) / 100;
        if (clubAmt > 0) proms.push(sb.from("club_finances").insert({
          club_id: clubId,
          type: "income",
          category: "\xD6zel Ders Geliri",
          amount: clubAmt,
          description: `${newInfo.coachName} - ${stu} - \xD6zel Ders`,
          date: newInfo.date
        }));
        if (coachAmt > 0) proms.push(sb.from("coach_earnings").insert({
          club_id: clubId,
          coach_id: newInfo.coachId || null,
          individual_coach_id: indCoachId,
          manual_lesson_id: oldInfo.manualLessonId,
          coach_name: newInfo.coachName,
          student_name: newInfo.studentName || null,
          amount: coachAmt,
          court_fee: 0,
          date: newInfo.date,
          description: `\xD6zel ders - ${stu} - ${startLabel}`,
          payment_status: "unpaid",
          collected_by_coach: false,
          court_fee_settled: false
        }));
      }
    } else {
      if (newInfo.paid) {
        const court = courts.find((c) => c.id === newInfo.courtId);
        const durH = Math.max(0, (newInfo.eh * 60 + newInfo.em - (newInfo.sh * 60 + newInfo.sm)) / 60);
        const courtFee = Math.round((court?.hourly_rate || 0) * durH * 100) / 100;
        const coachAmt = Math.round((Number(newInfo.amount) || 0) * 100) / 100;
        if (courtFee > 0) proms.push(sb.from("club_finances").insert({
          club_id: clubId,
          type: "income",
          category: "Rezervasyon Geliri",
          amount: courtFee,
          description: `${newInfo.coachName} - ${stu} - \xD6zel ders kort \xFCcreti`,
          date: newInfo.date
        }));
        if (coachAmt > 0) proms.push(sb.from("coach_earnings").insert({
          club_id: clubId,
          coach_id: newInfo.coachId || null,
          individual_coach_id: indCoachId,
          manual_lesson_id: oldInfo.manualLessonId,
          coach_name: newInfo.coachName,
          student_name: newInfo.studentName || null,
          amount: coachAmt,
          court_fee: courtFee,
          date: newInfo.date,
          description: `\xD6zel ders - ${stu} - ${startLabel}`,
          payment_status: "unpaid",
          collected_by_coach: false,
          court_fee_settled: false
        }));
      }
    }
    if (proms.length) await Promise.all(proms);
    return warnings;
  };
  const reconcilePackageOnEdit = async ({ editId, orig, coachId, studentName, playerId, date }) => {
    const origInd = orig.coach_id ? coachesList.find((c) => c.id === orig.coach_id)?.individual_coach_id || null : null;
    const newInd = coachId ? coachesList.find((c) => c.id === coachId)?.individual_coach_id || null : null;
    const oldCoachDisplay = orig.coach_id ? coachesList.find((c) => c.id === orig.coach_id)?.full_name || orig.coach_name : orig.coach_name;
    const oldStu = orig.student_name || "\xD6\u011Frenci";
    if (origInd) {
      const { data: sess } = await sb.from("lesson_package_sessions").select("id, player_package_id").eq("session_date", orig.date).eq("coach_id", origInd).is("lesson_id", null).limit(1);
      if (sess?.length) {
        const { id: sessId, player_package_id } = sess[0];
        const { data: plp } = await sb.from("player_lesson_packages").select("used_lessons").eq("id", player_package_id).single();
        if (plp) {
          await sb.from("player_lesson_packages").update({
            used_lessons: Math.max(0, (plp.used_lessons || 0) - 1),
            status: "active",
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }).eq("id", player_package_id);
        }
        await sb.from("lesson_package_sessions").delete().eq("id", sessId);
      }
    }
    await sb.from("coach_earnings").delete().eq("manual_lesson_id", editId).eq("description", "Ders Paketi Oturumu");
    const oldSig = `${oldCoachDisplay || "Antren\xF6r"} - ${oldStu} - Ders Paketi Oturumu`;
    const { data: cfOld } = await sb.from("club_finances").select("id").eq("club_id", clubId).eq("date", orig.date).eq("category", "Ders Paketi Geliri").eq("description", oldSig);
    if (cfOld?.length === 1) await sb.from("club_finances").delete().eq("id", cfOld[0].id);
    const newManualName = !playerId ? studentName || null : null;
    if (!playerId && !newManualName) {
      return "Paket dersinde ki\u015Fi kald\u0131r\u0131ld\u0131; ders paketsiz kald\u0131. \xDCcret/\xF6deme durumunu kontrol edin.";
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const baseQ = () => sb.from("player_lesson_packages").select("*, lesson_packages(name, total_lessons, price, coach_percentage, coach_payout_mode)").in("payment_status", ["paid", "pending"]).eq("status", "active").or(`expiry_date.is.null,expiry_date.gt.${now}`).order("created_at", { ascending: false });
    const queries = [];
    if (playerId) queries.push(baseQ().eq("player_id", playerId));
    if (newManualName) queries.push(baseQ().is("player_id", null).eq("manual_player_name", newManualName));
    const results = await Promise.all(queries);
    const seen = /* @__PURE__ */ new Set();
    const pkgs = results.flatMap((r) => r.data || []).filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    const pkg = pkgs.find((p) => (p.total_lessons || 0) - (p.used_lessons || 0) > 0);
    if (!pkg) {
      return "Yeni ki\u015Finin uygun (kalan seansl\u0131) paketi bulunamad\u0131; ders paketsiz kald\u0131. \xDCcret/\xF6deme durumunu kontrol edin.";
    }
    const newUsed = (pkg.used_lessons || 0) + 1;
    const isCompleted = newUsed >= (pkg.total_lessons || 0);
    await sb.from("lesson_package_sessions").insert({
      player_package_id: pkg.id,
      lesson_id: null,
      coach_id: newInd,
      session_date: date,
      notes: null
    });
    await sb.from("player_lesson_packages").update({
      used_lessons: newUsed,
      status: isCompleted ? "completed" : "active",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", pkg.id);
    const pkgDef = pkg.lesson_packages || {};
    const mode = pkgDef.coach_payout_mode || pkg.coach_payout_mode || "upfront";
    if (mode === "per_session") {
      const perSessionTotal = (pkgDef.price ?? pkg.custom_price ?? 0) / (pkgDef.total_lessons || pkg.total_lessons || 1);
      const coachRec = coachesList.find((c) => c.id === coachId);
      const pkgPct = pkgDef.coach_percentage ?? pkg.custom_coach_pct;
      const coachPct = Number(pkgPct) > 0 ? Number(pkgPct) : coachRec?.coach_pay_rate || 0;
      const coachEarning = Math.round(perSessionTotal * (coachPct / 100) * 100) / 100;
      if (coachRec && coachEarning > 0) {
        await sb.from("coach_earnings").insert({
          club_id: clubId,
          coach_id: coachId,
          individual_coach_id: coachRec.individual_coach_id || null,
          coach_name: coachRec.full_name,
          student_name: studentName || null,
          manual_lesson_id: editId,
          amount: coachEarning,
          court_fee: 0,
          date,
          description: "Ders Paketi Oturumu",
          payment_status: "unpaid"
        });
      }
    }
    return `Paket d\xFC\u015F\xFCm\xFC g\xFCncellendi: ${pkg.lesson_packages?.name || "Paket"} (${newUsed}/${pkg.total_lessons || "?"}).`;
  };
  const applyLessonEditSideEffects = async ({ editId, orig, payload, coachId, amountVal, startDb, endDb, startHH, endHH }) => {
    if (!orig) return;
    const pad = (n) => String(n).padStart(2, "0");
    const [nsh, nsm] = startHH.split(":").map(Number);
    const [neh, nem] = endHH.split(":").map(Number);
    const courtId = payload.court_id;
    const courtChanged = courtId !== orig.court_id;
    const timeChanged = nsh !== orig.sh || nsm !== orig.sm || neh !== orig.eh || nem !== orig.em;
    const coachChanged = coachId !== orig.coach_id;
    const oldStartWeb = orig.court_id ? localTimeToDb(`${orig.date}T${pad(orig.sh)}:${pad(orig.sm)}`) : null;
    const oldStartMob = orig.court_id ? (/* @__PURE__ */ new Date(`${orig.date}T${pad(orig.sh)}:${pad(orig.sm)}:00+03:00`)).toISOString() : null;
    if (courtChanged || timeChanged) {
      if (orig.court_id) await cancelCourtBooking(orig.court_id, orig.date, orig.sh, orig.sm, orig.eh, orig.em);
      const { data: { user } } = await sb.auth.getUser();
      if (user?.id && courtId) {
        const durH = Math.round((new Date(endDb) - new Date(startDb)) / 36e5 * 100) / 100;
        await sb.from("bookings").insert({
          court_id: courtId,
          user_id: user.id,
          start_time: startDb,
          end_time: endDb,
          status: "confirmed",
          is_solo_booking: false,
          duration_hours: durH,
          total_amount: amountVal || 0,
          club_coach_id: coachId
        }).then(() => {
        }).catch((e) => console.warn("Kort blok g\xFCncellenemedi:", e.message));
      }
    } else if (coachChanged && orig.court_id) {
      await sb.from("bookings").update({ club_coach_id: coachId }).eq("court_id", orig.court_id).in("start_time", [oldStartWeb, oldStartMob]).neq("status", "cancelled");
    }
    if (orig.is_package) {
      const personChanged = (payload.player_id || null) !== (orig.player_id || null) || (payload.club_customer_id || null) !== (orig.club_customer_id || null);
      const coachChangedPkg = coachId !== (orig.coach_id || null);
      if (personChanged || coachChangedPkg) {
        const msg = await reconcilePackageOnEdit({
          editId,
          orig,
          coachId,
          studentName: payload.student_name,
          playerId: payload.player_id || null,
          date: payload.date
        });
        if (msg) alert(msg);
      }
      return;
    }
    const coachDisplayName = coachId ? coachesList.find((c) => c.id === coachId)?.full_name || null : payload.coach_name || null;
    const warnings = await rebuildManualLessonFinance(
      { manualLessonId: editId, oldCoachName: orig.coach_name, oldStudentName: orig.student_name, oldDate: orig.date },
      {
        coachId,
        coachName: coachDisplayName,
        studentName: payload.student_name,
        date: payload.date,
        priceMode: payload.price_mode,
        coachAmount: payload.coach_amount,
        clubAmount: payload.club_amount,
        amount: payload.amount,
        paid: payload.payment_status === "paid",
        courtId,
        sh: nsh,
        sm: nsm,
        eh: neh,
        em: nem
      }
    );
    if (warnings.length) {
      alert("Ders g\xFCncellendi. Not: " + warnings.join(", ") + " otomatik g\xFCncellenemedi, elle kontrol edilmeli.");
    }
  };
  const openLsEdit = async (d) => {
    if (!d?.rawId) return;
    setLsDetailSaving(true);
    try {
      const { data: row, error } = await sb.from("club_manual_lessons").select("*").eq("id", d.rawId).single();
      if (error || !row) {
        alert("Ders bulunamad\u0131: " + (error?.message || ""));
        return;
      }
      let selPlayer = null, selCustomer = null, personMode = "member";
      if (row.club_customer_id) {
        const { data: cust } = await sb.from("club_customers").select("*").eq("id", row.club_customer_id).maybeSingle();
        if (cust) {
          selCustomer = cust;
          personMode = "customer";
          if (cust.user_id) selPlayer = { id: cust.user_id, full_name: cust.full_name, email: cust.email };
        }
      } else if (row.player_id) {
        const { data: prof } = await sb.from("profiles").select("id, full_name, email").eq("id", row.player_id).maybeSingle();
        if (prof) {
          selPlayer = prof;
          personMode = "member";
        }
      }
      const pad = (n) => String(n).padStart(2, "0");
      const sh = parseInt((row.start_time || "0:0").split(":")[0], 10) || 0;
      const sm = parseInt((row.start_time || "0:0").split(":")[1], 10) || 0;
      const eh = parseInt((row.end_time || "0:0").split(":")[0], 10) || 0;
      const em = parseInt((row.end_time || "0:0").split(":")[1], 10) || 0;
      lsEditInitRef.current = row.id;
      const uiPriceMode = row.price_mode === "split" ? "split" : "normal";
      setLsPriceMode(uiPriceMode);
      if (row.price_mode === "dual") {
        setLsCoachAmount(row.coach_amount != null ? String(row.coach_amount) : "");
        setLsClubAmount(row.club_amount != null ? String(row.club_amount) : "");
      } else if (row.price_mode === "split") {
        setLsCoachAmount("");
        setLsClubAmount("");
      } else {
        setLsCoachAmount(row.amount != null ? String(row.amount) : "");
        setLsClubAmount("0");
      }
      setLsForm({
        use_manual_coach: !row.coach_id && !!row.coach_name,
        coach_id: row.coach_id || "",
        manual_coach_name: row.coach_id ? "" : row.coach_name || "",
        date: row.date,
        start_time: `${pad(sh)}:${pad(sm)}`,
        end_time: `${pad(eh)}:${pad(em)}`,
        duration: null,
        student_name: row.student_name || "",
        player_id: row.player_id || null,
        court_id: row.court_id || "",
        notes: row.notes || "",
        amount: row.amount != null ? String(row.amount) : "",
        payment_status: row.payment_status || "unpaid"
      });
      setLsSelectedPlayer(selPlayer);
      setLsSelectedCustomer(selCustomer);
      setLsPersonMode(personMode);
      setLsPlayerSearch(!selPlayer && !selCustomer ? row.student_name || "" : "");
      setLsPlayerResults([]);
      setLsCustomerSearch("");
      setLsCustomerResults([]);
      setLsCourtyclubResults([]);
      let pkgId = d.playerPackageId || null;
      if (!pkgId && row.coach_id) {
        const indId = coachesList.find((c) => c.id === row.coach_id)?.individual_coach_id;
        if (indId) {
          const { data: sess } = await sb.from("lesson_package_sessions").select("player_package_id").is("lesson_id", null).eq("coach_id", indId).eq("session_date", row.date).limit(1).maybeSingle();
          pkgId = sess?.player_package_id || null;
        }
      }
      if (pkgId) {
        const { data: plp } = await sb.from("player_lesson_packages").select("*, lesson_packages(name, total_lessons, price, coach_percentage, coach_payout_mode)").eq("id", pkgId).maybeSingle();
        if (plp) {
          setLsPackages([{
            ...plp,
            package_name: plp.lesson_packages?.name || plp.custom_name || "\xD6zel Paket",
            remaining: (plp.total_lessons || 0) - (plp.used_lessons || 0)
          }]);
          setLsSelectedPkgId(plp.id);
          setLsUsePkg(true);
        } else {
          setLsUsePkg(false);
          setLsSelectedPkgId(null);
          setLsPackages([]);
        }
      } else {
        setLsUsePkg(false);
        setLsSelectedPkgId(null);
        setLsPackages([]);
      }
      setLsDetail(null);
      setLsModal({
        type: "edit",
        id: row.id,
        orig: {
          court_id: row.court_id || null,
          date: row.date,
          sh,
          sm,
          eh,
          em,
          coach_id: row.coach_id || null,
          coach_name: row.coach_name || d.coachName || null,
          student_name: row.student_name || null,
          player_id: row.player_id || null,
          club_customer_id: row.club_customer_id || null,
          price_mode: row.price_mode || "normal",
          payment_status: row.payment_status || "unpaid",
          is_package: !!d.isPackageLesson
        }
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setLsDetailSaving(false);
    }
  };
  const deleteBlockClosure = async () => {
    if (!clDetail) return;
    if (clDetail.groupId && clDetail.closureType === "recurring_weekly") {
      setClDeleteChoice(true);
      return;
    }
    const label = clDetail.groupId ? `"${clDetail.label}" grup dersini` : "bu kapatmay\u0131";
    if (!confirm(`${label} silmek istedi\u011Finize emin misiniz?`)) return;
    setClDetailSaving(true);
    try {
      if (clDetail.groupId && clDetail.closureType === "one_time") {
        const { error } = await sb.from("court_closures").delete().eq("group_id", clDetail.groupId).eq("start_date", clDetail.closureDate).eq("end_date", clDetail.closureDate).eq("start_hour", clDetail.sh);
        if (error) throw error;
        await sb.from("group_attendance").delete().eq("group_id", clDetail.groupId).eq("session_date", clDetail.closureDate).eq("start_hour", clDetail.sh);
      } else if (clDetail.rawId) {
        const { error } = await sb.from("court_closures").delete().eq("id", clDetail.rawId);
        if (error) throw error;
      }
      setClDetail(null);
      await load();
    } catch (e) {
      alert("Hata: " + e.message);
    } finally {
      setClDetailSaving(false);
    }
  };
  const deleteThisSession = async () => {
    if (!clDetail) return;
    setClDetailSaving(true);
    try {
      const { error } = await sb.from("group_lesson_exceptions").upsert({
        group_id: clDetail.groupId,
        exception_date: clDetail.closureDate,
        start_hour: clDetail.sh,
        start_minute: clDetail.sm ?? 0
      });
      if (error) throw error;
      await sb.from("group_attendance").delete().eq("group_id", clDetail.groupId).eq("session_date", clDetail.closureDate).eq("start_hour", clDetail.sh);
      setClDeleteChoice(false);
      setClDetail(null);
      await load();
    } catch (e) {
      alert("Hata: " + e.message);
    } finally {
      setClDetailSaving(false);
    }
  };
  const deleteEntireSeries = async () => {
    if (!clDetail) return;
    if (!confirm(`"${clDetail.label}" grubunun t\xFCm haftal\u0131k serisini silmek istedi\u011Finize emin misiniz?`)) return;
    setClDetailSaving(true);
    try {
      let error;
      if (clDetail.groupId) {
        ({ error } = await sb.from("court_closures").delete().eq("group_id", clDetail.groupId).eq("closure_type", "recurring_weekly"));
      } else if (clDetail.rawId) {
        ({ error } = await sb.from("court_closures").delete().eq("id", clDetail.rawId));
      }
      if (error) throw error;
      setClDeleteChoice(false);
      setClDetail(null);
      await load();
    } catch (e) {
      alert("Hata: " + e.message);
    } finally {
      setClDetailSaving(false);
    }
  };
  const updateBlockClosure = async () => {
    if (!clDetail) return;
    const [sh, sm] = clEditForm.start_time.split(":").map(Number);
    const [eh, em] = clEditForm.end_time.split(":").map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      alert("Biti\u015F saati ba\u015Flang\u0131\xE7tan b\xFCy\xFCk olmal\u0131");
      return;
    }
    setClDetailSaving(true);
    try {
      if (clDetail.groupId && clDetail.closureType === "one_time") {
        const { error } = await sb.from("court_closures").update({ start_hour: sh, start_minute: sm, end_hour: eh, end_minute: em }).eq("group_id", clDetail.groupId).eq("start_date", clDetail.closureDate).eq("end_date", clDetail.closureDate).eq("start_hour", clDetail.sh);
        if (error) throw error;
        await sb.from("group_attendance").update({ start_hour: sh, end_hour: eh }).eq("group_id", clDetail.groupId).eq("session_date", clDetail.closureDate).eq("start_hour", clDetail.sh);
      } else if (clDetail.rawId) {
        const { error } = await sb.from("court_closures").update({ start_hour: sh, start_minute: sm, end_hour: eh, end_minute: em }).eq("id", clDetail.rawId);
        if (error) throw error;
      }
      setClDetail(null);
      setClEditMode(false);
      await load();
    } catch (e) {
      alert("Hata: " + e.message);
    } finally {
      setClDetailSaving(false);
    }
  };
  const searchLsPlayers = async (query) => {
    if (!query || query.length < 2) {
      setLsPlayerResults([]);
      return;
    }
    const { data } = await sb.from("club_memberships").select("user_id, member_name, profile:profiles!club_memberships_user_id_fkey(id, full_name, email)").eq("club_id", clubId).eq("status", "active").limit(30);
    const lq = query.toLowerCase();
    const filtered = (data || []).filter((m) => (m.profile?.full_name || m.member_name || "").toLowerCase().includes(lq)).map((m) => ({ id: m.profile?.id || m.user_id, full_name: m.profile?.full_name || m.member_name, email: m.profile?.email }));
    setLsPlayerResults(filtered);
  };
  const searchLsCustomers = async (query) => {
    if (!query || query.length < 2) {
      setLsCustomerResults([]);
      return;
    }
    try {
      const { data } = await sb.from("club_customers").select("id, full_name, phone, email, user_id").eq("club_id", clubId).eq("is_active", true).or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`).limit(8);
      setLsCustomerResults(data || []);
    } catch (e) {
      console.error(e);
    }
  };
  const searchLsPerson = async (query) => {
    setLsPlayerSearch(query);
    setLsForm((prev) => ({ ...prev, student_name: query, player_id: null }));
    if (!query || query.length < 2) {
      setLsPlayerResults([]);
      setLsCustomerResults([]);
      setLsCourtyclubResults([]);
      return;
    }
    const [{ data: memberships }, { data: customers }, { data: appPlayers }] = await Promise.all([
      sb.from("club_memberships").select("user_id, member_name, profile:profiles!club_memberships_user_id_fkey(id, full_name, email)").eq("club_id", clubId).eq("status", "active").limit(30),
      sb.from("club_customers").select("id,full_name,phone,email,user_id").eq("club_id", clubId).eq("is_active", true).or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`).limit(6),
      sb.from("profiles").select("id,full_name,email,phone").eq("user_type", "player").or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`).limit(8)
    ]);
    const lq = query.toLowerCase();
    const players = (memberships || []).filter((m) => (m.profile?.full_name || m.member_name || "").toLowerCase().includes(lq)).map((m) => ({ id: m.profile?.id || m.user_id, full_name: m.profile?.full_name || m.member_name, email: m.profile?.email, _kind: "member" }));
    setLsPlayerResults(players);
    setLsCustomerResults((customers || []).map((c) => ({ ...c, _kind: "customer" })));
    const memberIds = new Set(players.map((p) => p.id).filter(Boolean));
    const customerUserIds = new Set((customers || []).map((c) => c.user_id).filter(Boolean));
    const courtyclubPlayers = (appPlayers || []).filter(
      (p) => !memberIds.has(p.id) && !customerUserIds.has(p.id)
    ).map((p) => ({ ...p, _kind: "courtyclub" }));
    setLsCourtyclubResults(courtyclubPlayers);
  };
  React.useEffect(() => {
    if (lsEditInitRef.current) return;
    const playerId = lsSelectedPlayer?.id || lsSelectedCustomer?.user_id || null;
    const manualName = !playerId && lsSelectedCustomer && !lsSelectedCustomer.user_id ? lsSelectedCustomer.full_name : null;
    if (!playerId && !manualName || lsForm.use_manual_coach || coachesList.length === 0) return;
    let cancelled = false;
    (async () => {
      setLsAutoCoachLoading(true);
      try {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const baseQ = () => sb.from("player_lesson_packages").select("coach_id").in("payment_status", ["paid", "pending"]).eq("status", "active").or(`expiry_date.is.null,expiry_date.gt.${now}`).order("created_at", { ascending: false }).limit(1);
        const queries = [];
        if (playerId) queries.push(baseQ().eq("player_id", playerId));
        if (manualName) queries.push(baseQ().is("player_id", null).eq("manual_player_name", manualName));
        if (playerId && lsSelectedCustomer?.full_name) {
          queries.push(baseQ().is("player_id", null).eq("manual_player_name", lsSelectedCustomer.full_name));
        }
        const results = await Promise.all(queries);
        const data = results.flatMap((r) => r.data || []);
        if (!cancelled && data?.length > 0) {
          const matchedCoach = coachesList.find((c) => c.individual_coach_id === data[0].coach_id);
          if (matchedCoach) setLsForm((prev) => ({ ...prev, coach_id: matchedCoach.id }));
        }
      } catch (e) {
        console.error("auto coach:", e);
      } finally {
        if (!cancelled) setLsAutoCoachLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lsSelectedPlayer, lsSelectedCustomer, coachesList.length, lsForm.use_manual_coach]);
  const saveNewLesson = async () => {
    if (!lsForm.date || !lsForm.start_time || !lsForm.end_time) {
      alert("Tarih, ba\u015Flang\u0131\xE7 ve biti\u015F saati zorunludur.");
      return;
    }
    if (!lsForm.court_id) {
      alert("L\xFCtfen kort se\xE7in.");
      return;
    }
    const coachOk = lsForm.use_manual_coach ? !!lsForm.manual_coach_name?.trim() : !!lsForm.coach_id;
    if (!coachOk) {
      alert("L\xFCtfen bir antren\xF6r se\xE7in veya antren\xF6r ad\u0131n\u0131 girin.");
      return;
    }
    if (lsForm.start_time >= lsForm.end_time) {
      alert("Biti\u015F saati ba\u015Flang\u0131\xE7 saatinden sonra olmal\u0131d\u0131r.");
      return;
    }
    if (lsSavingGuard.current) return;
    lsSavingGuard.current = true;
    setLsSaving(true);
    const editId = lsModal?.id || null;
    const orig = lsModal?.orig || null;
    const pad2 = (n) => String(n).padStart(2, "0");
    const dateStr = lsForm.date;
    const startHH = lsForm.start_time.slice(0, 5);
    const endHH = lsForm.end_time.slice(0, 5);
    const startDb = localTimeToDb(`${dateStr}T${startHH}`);
    const endDb = localTimeToDb(`${dateStr}T${endHH}`);
    if (!editId && new Date(startDb) < /* @__PURE__ */ new Date()) {
      if (!confirm("Ge\xE7mi\u015F bir tarihe ders eklensin mi?")) {
        lsSavingGuard.current = false;
        setLsSaving(false);
        return;
      }
    }
    const [{ data: bConflict }, { data: mConflict }, { data: closures }] = await Promise.all([
      sb.from("bookings").select("id,court_id,start_time").eq("court_id", lsForm.court_id).neq("status", "cancelled").lt("start_time", endDb).gt("end_time", startDb),
      sb.from("club_manual_lessons").select("id,start_time,end_time,court_id,location").eq("club_id", clubId).eq("date", dateStr),
      sb.from("court_closures").select("*").eq("court_id", lsForm.court_id).eq("is_active", true)
    ]);
    const resetGuard = () => {
      lsSavingGuard.current = false;
      setLsSaving(false);
    };
    let realBConflict = bConflict || [];
    if (editId && orig && orig.court_id) {
      const oldWebMs = new Date(localTimeToDb(`${orig.date}T${pad2(orig.sh)}:${pad2(orig.sm)}`)).getTime();
      const oldMobMs = (/* @__PURE__ */ new Date(`${orig.date}T${pad2(orig.sh)}:${pad2(orig.sm)}:00+03:00`)).getTime();
      realBConflict = realBConflict.filter((b) => {
        if (b.court_id !== orig.court_id) return true;
        const t = new Date(b.start_time).getTime();
        return !(t === oldWebMs || t === oldMobMs);
      });
    }
    if (realBConflict.length > 0) {
      resetGuard();
      alert("Bu kort se\xE7ilen saatte zaten rezerve edilmi\u015F.");
      return;
    }
    const courtRow0 = courts.find((c) => c.id === lsForm.court_id);
    const locationStr = courtRow0 ? `Kort ${courtRow0.court_number}` : "";
    const hasManualConflict = (mConflict || []).filter((l) => l.id !== editId).filter((l) => l.court_id ? l.court_id === lsForm.court_id : l.location === locationStr).some((l) => {
      const ls = (l.start_time || "").slice(0, 5);
      const le = (l.end_time || "").slice(0, 5);
      return ls < endHH && le > startHH;
    });
    if (hasManualConflict) {
      resetGuard();
      alert("Bu kort se\xE7ilen saatte zaten dolu.");
      return;
    }
    const dow = (/* @__PURE__ */ new Date(dateStr + "T12:00:00")).getDay();
    const closureGroupIdsEx = (closures || []).map((c) => c.group_id).filter(Boolean);
    const exSetEx = /* @__PURE__ */ new Set();
    if (closureGroupIdsEx.length > 0) {
      const { data: exDataEx } = await sb.from("group_lesson_exceptions").select("group_id, start_hour, start_minute").in("group_id", closureGroupIdsEx).eq("exception_date", dateStr);
      (exDataEx || []).forEach((ex) => exSetEx.add(`${ex.group_id}_${ex.start_hour}_${ex.start_minute ?? 0}`));
    }
    const closureBlock = (closures || []).some((cl) => {
      const cs = String(cl.start_hour ?? 0).padStart(2, "0") + ":00";
      const ce = String(cl.end_hour ?? 0).padStart(2, "0") + ":00";
      if (!(cs < endHH && ce > startHH)) return false;
      if (cl.group_id && exSetEx.has(`${cl.group_id}_${cl.start_hour}_${cl.start_minute ?? 0}`)) return false;
      if (cl.closure_type === "recurring_weekly") return cl.day_of_week === dow;
      return (!cl.start_date || cl.start_date <= dateStr) && (!cl.end_date || cl.end_date >= dateStr);
    });
    if (closureBlock) {
      resetGuard();
      alert("Bu kort se\xE7ilen saatte kapal\u0131 olarak i\u015Faretlenmi\u015F.");
      return;
    }
    if (!lsForm.use_manual_coach && lsForm.coach_id) {
      const [sh, sm] = startHH.split(":").map(Number);
      const [eh, em] = endHH.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      const lessonDow = (/* @__PURE__ */ new Date(dateStr + "T12:00:00")).getDay();
      const coachLabel = coachesList.find((c) => c.id === lsForm.coach_id)?.full_name || "Antren\xF6r";
      const { data: coachConflict } = await sb.from("club_manual_lessons").select("id,start_time,end_time").eq("coach_id", lsForm.coach_id).eq("date", dateStr);
      const hasCoachConflict = (coachConflict || []).filter((l) => l.id !== editId).some((l) => {
        const ls = (l.start_time || "").slice(0, 5);
        const le = (l.end_time || "").slice(0, 5);
        return ls < endHH && le > startHH;
      });
      if (hasCoachConflict) {
        resetGuard();
        alert(`${coachLabel} adl\u0131 antren\xF6r\xFCn bu saatte zaten bir dersi var. Ders eklenemez.`);
        return;
      }
      const { data: coachClosures } = await sb.from("court_closures").select("closure_type,day_of_week,start_hour,end_hour,start_date,end_date,reason").eq("coach_id", lsForm.coach_id).eq("is_active", true);
      const conflicts = [];
      for (const cl of coachClosures || []) {
        const clStart = (cl.start_hour || 0) * 60;
        const clEnd = (cl.end_hour || 0) * 60;
        if (startMin >= clEnd || endMin <= clStart) continue;
        if (cl.closure_type === "recurring_weekly" && cl.day_of_week === lessonDow) {
          conflicts.push(`Grup Program\u0131: ${cl.reason || "Antrenman"} \xB7 ${String(cl.start_hour).padStart(2, "0")}:00\u2013${String(cl.end_hour).padStart(2, "0")}:00`);
        } else if (cl.closure_type === "one_time" && cl.start_date && cl.end_date) {
          if (dateStr >= cl.start_date && dateStr <= cl.end_date) {
            conflicts.push(`Tek Seferlik Program: ${cl.reason || "Kapal\u0131"} \xB7 ${cl.start_date}\u2013${cl.end_date}`);
          }
        }
      }
      if (conflicts.length > 0) {
        resetGuard();
        alert(`\u26A0\uFE0F Hoca \xC7ak\u0131\u015Fmas\u0131

${coachLabel} adl\u0131 hocan\u0131n bu saatte ba\u015Fka program\u0131 var:

${conflicts.join("\n")}

Ders eklenemez.`);
        return;
      }
    }
    if (lsForm.player_id) {
      const [{ data: ownBk }, { data: allConflictBk }, { data: stuLessons }] = await Promise.all([
        sb.from("bookings").select("id").eq("user_id", lsForm.player_id).in("status", ["pending", "confirmed"]).lt("start_time", endDb).gt("end_time", startDb),
        sb.from("bookings").select("id").in("status", ["pending", "confirmed"]).lt("start_time", endDb).gt("end_time", startDb),
        sb.from("lessons").select("id").eq("student_id", lsForm.player_id).neq("status", "cancelled").lt("start_time", endDb).gt("end_time", startDb)
      ]);
      const conflictBkIds = (allConflictBk || []).map((b) => b.id);
      let isInvited = false;
      if (conflictBkIds.length > 0) {
        const { data: invited } = await sb.from("booking_players").select("player_id").eq("player_id", lsForm.player_id).in("booking_id", conflictBkIds);
        isInvited = (invited?.length ?? 0) > 0;
      }
      if ((ownBk?.length ?? 0) > 0 || isInvited || (stuLessons?.length ?? 0) > 0) {
        resetGuard();
        alert(`${lsSelectedPlayer?.full_name || "\xD6\u011Frenci"} adl\u0131 oyuncunun bu saatte ba\u015Fka bir rezervasyonu veya dersi bulunuyor.`);
        return;
      }
    }
    if (lsUsePkg && lsSelectedPkgId) {
      const preCoachId = !lsForm.use_manual_coach ? lsForm.coach_id || null : null;
      const preCoachRec = coachesList.find((c) => c.id === preCoachId);
      const prePkg = lsPackages.find((p) => p.id === lsSelectedPkgId);
      if (prePkg) {
        const pkgDef_ = prePkg.lesson_packages || {};
        const preMode = pkgDef_.coach_payout_mode || prePkg.coach_payout_mode || "upfront";
        const perSession = (pkgDef_.price ?? prePkg.custom_price ?? 0) / (pkgDef_.total_lessons || prePkg.total_lessons || 1);
        const pkgPct_ = pkgDef_.coach_percentage ?? prePkg.custom_coach_pct;
        const pct_ = Number(pkgPct_) > 0 ? Number(pkgPct_) : preCoachRec?.coach_pay_rate || 0;
        const coachEarn_ = Math.round(perSession * (pct_ / 100) * 100) / 100;
        const summaryLines = [`Ders ba\u015F\u0131 tutar: \u20BA${perSession.toLocaleString("tr-TR")}`];
        if (preMode === "per_session") {
          if (preCoachRec && pct_ > 0) {
            summaryLines.push(`Hoca Hakedi\u015Fi:   \u20BA${coachEarn_.toLocaleString("tr-TR")} (%${pct_}) \u2014 bu seansta hocaya i\u015Flenir`);
          } else {
            summaryLines.push(`Hoca pay oran\u0131 tan\u0131ml\u0131 de\u011Fil \u2014 bu seansta hoca hakedi\u015Fi olu\u015Fmaz`);
          }
          summaryLines.push(`Kul\xFCp pay\u0131 sat\u0131\u015Fta al\u0131nd\u0131 \u2014 bu seansta ek mali kay\u0131t olu\u015Fmaz`);
        } else {
          summaryLines.push(`Hoca ve kul\xFCp pay\u0131 sat\u0131\u015Fta al\u0131nd\u0131 \u2014 bu seansta ek mali kay\u0131t olu\u015Fmaz`);
        }
        if (!confirm(`Ders Paketi Oturumu

${summaryLines.join("\n")}

Kaydedilsin mi?`)) {
          resetGuard();
          return;
        }
      }
    }
    try {
      const courtRow = courts.find((c) => c.id === lsForm.court_id);
      const coachId = !lsForm.use_manual_coach ? lsForm.coach_id || null : null;
      const coachName = lsForm.use_manual_coach ? lsForm.manual_coach_name || null : null;
      const usingPkg = !!(lsUsePkg && lsSelectedPkgId);
      const normalCoachAmt = lsPriceMode === "normal" ? parseFloat(String(lsCoachAmount).replace(",", ".")) || 0 : null;
      const normalClubAmt = lsPriceMode === "normal" ? parseFloat(String(lsClubAmount).replace(",", ".")) || 0 : null;
      const amountVal = usingPkg ? 0 : lsPriceMode === "normal" ? (normalCoachAmt || 0) + (normalClubAmt || 0) : lsForm.amount ? parseFloat(String(lsForm.amount).replace(",", ".")) : null;
      const payStatus = usingPkg ? "paid" : lsForm.payment_status || "unpaid";
      const linkPlayerId = lsSelectedPlayer?.id || lsSelectedCustomer?.user_id || null;
      const linkCustomerId = lsSelectedCustomer?.id || null;
      const payload = {
        club_id: clubId,
        coach_id: coachId,
        coach_name: coachName,
        date: lsForm.date,
        start_time: startHH,
        end_time: endHH,
        student_name: lsForm.student_name || null,
        player_id: linkPlayerId,
        club_customer_id: linkCustomerId,
        court_id: lsForm.court_id,
        location: courtRow ? `Kort ${courtRow.court_number}` : "",
        notes: lsForm.notes?.trim() || null,
        payment_status: payStatus,
        amount: amountVal,
        price_mode: lsPriceMode === "normal" ? "dual" : lsPriceMode,
        coach_amount: lsPriceMode === "normal" ? normalCoachAmt || 0 : null,
        club_amount: lsPriceMode === "normal" ? normalClubAmt || 0 : null
      };
      if (editId) {
        const { error: upErr } = await sb.from("club_manual_lessons").update(payload).eq("id", editId);
        if (upErr) throw upErr;
        await applyLessonEditSideEffects({ editId, orig, payload, coachId, amountVal, startDb, endDb, startHH, endHH });
      } else {
        const { data: inserted, error: insErr } = await sb.from("club_manual_lessons").insert(payload).select("id").single();
        if (insErr) throw insErr;
        if (inserted?.id) {
          const { data: { user } } = await sb.auth.getUser();
          if (user?.id && lsForm.court_id) {
            const durH = Math.round((new Date(endDb) - new Date(startDb)) / 36e5 * 100) / 100;
            await sb.from("bookings").insert({
              court_id: lsForm.court_id,
              user_id: user.id,
              start_time: startDb,
              end_time: endDb,
              status: "confirmed",
              is_solo_booking: false,
              duration_hours: durH,
              total_amount: amountVal || 0,
              club_coach_id: coachId,
              // Derse bağ: bu satır kort bloke gölgesidir, gerçek rezervasyon değil.
              // Rezervasyon listeleri bunu eler, ders silinince FK ile birlikte gider.
              manual_lesson_id: inserted.id
            }).then(() => {
            }).catch((e) => console.warn("Kort blok eklenemedi:", e.message));
          }
          if (usingPkg) {
            try {
              const pkg = lsPackages.find((p) => p.id === lsSelectedPkgId);
              if (pkg) {
                const remaining = (pkg.total_lessons || 0) - (pkg.used_lessons || 0);
                if (remaining <= 0) throw new Error("Bu pakette kalan ders yok");
                const newUsed = (pkg.used_lessons || 0) + 1;
                const isCompleted = newUsed >= (pkg.total_lessons || 0);
                const { error: sessErr } = await sb.from("lesson_package_sessions").insert({
                  player_package_id: lsSelectedPkgId,
                  lesson_id: null,
                  coach_id: coachesList.find((c) => c.id === coachId)?.individual_coach_id || null,
                  session_date: lsForm.date,
                  notes: lsForm.notes?.trim() || null
                });
                if (sessErr) throw sessErr;
                const { error: updErr } = await sb.from("player_lesson_packages").update({
                  used_lessons: newUsed,
                  status: isCompleted ? "completed" : "active",
                  updated_at: (/* @__PURE__ */ new Date()).toISOString()
                }).eq("id", lsSelectedPkgId);
                if (updErr) throw updErr;
                const pkgDef = pkg.lesson_packages || {};
                const mode = pkgDef.coach_payout_mode || pkg.coach_payout_mode || "upfront";
                if (mode === "per_session") {
                  const perSessionTotal = (pkgDef.price ?? pkg.custom_price ?? 0) / (pkgDef.total_lessons || pkg.total_lessons || 1);
                  const coachRec = coachesList.find((c) => c.id === coachId);
                  const pkgPct = pkgDef.coach_percentage ?? pkg.custom_coach_pct;
                  const coachPct = Number(pkgPct) > 0 ? Number(pkgPct) : coachRec?.coach_pay_rate || 0;
                  const coachEarning = Math.round(perSessionTotal * (coachPct / 100) * 100) / 100;
                  if (coachRec && coachEarning > 0) {
                    await sb.from("coach_earnings").insert({
                      club_id: clubId,
                      coach_id: coachId,
                      individual_coach_id: coachRec.individual_coach_id || null,
                      coach_name: coachRec.full_name,
                      student_name: lsForm.student_name || null,
                      manual_lesson_id: inserted.id,
                      amount: coachEarning,
                      court_fee: 0,
                      date: lsForm.date,
                      description: "Ders Paketi Oturumu",
                      payment_status: "unpaid"
                    });
                  }
                }
              }
            } catch (pkgErr) {
              alert(`Ders kaydedildi ancak paketten d\xFC\u015F\xFClemedi: ${pkgErr.message}`);
            }
          }
          if (!usingPkg && lsPriceMode === "normal" && payStatus === "paid" && inserted?.id) {
            const cAmt = normalCoachAmt || 0;
            const kAmt = normalClubAmt || 0;
            try {
              const normalPromises = [];
              if (cAmt > 0) {
                normalPromises.push(sb.from("coach_earnings").insert({
                  club_id: clubId,
                  coach_id: coachId,
                  individual_coach_id: coachId ? coachesList.find((c) => c.id === coachId)?.individual_coach_id || null : null,
                  manual_lesson_id: inserted.id,
                  coach_name: lsForm.use_manual_coach ? lsForm.manual_coach_name || null : coachesList.find((c) => c.id === coachId)?.full_name || null,
                  student_name: lsForm.student_name || null,
                  amount: cAmt,
                  court_fee: 0,
                  date: lsForm.date,
                  description: `\xD6zel ders - ${lsForm.student_name || "\xD6\u011Frenci"} - ${lsForm.start_time}`,
                  payment_status: "unpaid",
                  collected_by_coach: false,
                  court_fee_settled: false
                }));
              }
              if (kAmt > 0) {
                normalPromises.push(sb.from("club_finances").insert({
                  club_id: clubId,
                  type: "income",
                  category: "\xD6zel Ders Geliri",
                  amount: kAmt,
                  description: `${coachId ? coachesList.find((c) => c.id === coachId)?.full_name || "Hoca" : lsForm.manual_coach_name || "Hoca"} - ${lsForm.student_name || "\xD6\u011Frenci"} - \xD6zel Ders`,
                  date: lsForm.date
                }));
              }
              await Promise.all(normalPromises);
            } catch (normalErr) {
              console.warn("Finansal kay\u0131t olu\u015Fturulamad\u0131:", normalErr.message);
            }
          }
          if (!usingPkg && lsPriceMode === "split" && coachId && amountVal > 0) {
            const coachRec = coachesList.find((c) => c.id === coachId);
            const payRate = coachRec?.coach_pay_rate ?? 0;
            if (payRate > 0) {
              const coachEarning = Math.round(amountVal * (payRate / 100) * 100) / 100;
              const clubEarning = Math.round((amountVal - coachEarning) * 100) / 100;
              try {
                const splitPromises = [];
                if (coachEarning > 0) {
                  splitPromises.push(sb.from("coach_earnings").insert({
                    club_id: clubId,
                    coach_id: coachId,
                    individual_coach_id: coachRec.individual_coach_id || null,
                    manual_lesson_id: inserted.id,
                    coach_name: coachRec.full_name,
                    student_name: lsForm.student_name || null,
                    amount: coachEarning,
                    court_fee: 0,
                    date: lsForm.date,
                    description: `\xD6zel ders (pay) - ${lsForm.student_name || "\xD6\u011Frenci"} - ${lsForm.start_time}`,
                    payment_status: "unpaid",
                    collected_by_coach: false,
                    court_fee_settled: false
                  }));
                }
                if (clubEarning > 0) {
                  splitPromises.push(sb.from("club_finances").insert({
                    club_id: clubId,
                    type: "income",
                    category: "\xD6zel Ders Geliri",
                    amount: clubEarning,
                    description: `${coachRec.full_name} - ${lsForm.student_name || "\xD6\u011Frenci"} - \xD6zel Ders`,
                    date: lsForm.date
                  }));
                }
                await Promise.all(splitPromises);
              } catch (splitErr) {
                console.warn("Pay kayd\u0131 olu\u015Fturulamad\u0131:", splitErr.message);
              }
            }
          }
        }
      }
      lsEditInitRef.current = null;
      setLsModal(null);
      setLsSelectedPlayer(null);
      setLsPlayerSearch("");
      setLsPlayerResults([]);
      setLsSelectedCustomer(null);
      setLsCustomerSearch("");
      setLsCustomerResults([]);
      setLsCourtyclubResults([]);
      setLsPersonMode("member");
      setLsUsePkg(false);
      setLsSelectedPkgId(null);
      setLsPackages([]);
      setLsCoachAmount("");
      setLsClubAmount("");
      load();
    } catch (e) {
      if (e.message?.includes("no_overlapping_bookings") || e.code === "23P01") {
        alert("Bu kort se\xE7ilen saatte zaten dolu. L\xFCtfen farkl\u0131 bir saat veya kort se\xE7in.");
      } else {
        alert(e.message);
      }
    } finally {
      lsSavingGuard.current = false;
      setLsSaving(false);
    }
  };
  const saveQuickCust = async () => {
    if (!quickAddForm.name.trim()) {
      alert("Ad Soyad gereklidir.");
      return;
    }
    if (!quickAddForm.phone.trim()) {
      alert("Telefon gereklidir.");
      return;
    }
    setQuickAddSaving(true);
    try {
      const { data: newCust, error } = await sb.from("club_customers").insert({
        club_id: clubId,
        full_name: quickAddForm.name.trim(),
        phone: quickAddForm.phone.trim(),
        is_active: true
      }).select().single();
      if (error) throw error;
      if (quickAddCust === "lesson") {
        setLsSelectedCustomer(newCust);
        setLsForm((prev) => ({ ...prev, student_name: newCust.full_name, player_id: null }));
        setLsPlayerSearch("");
        setLsPlayerResults([]);
        setLsCustomerResults([]);
      } else {
        setBookingCustomerId(newCust.id);
        setBookingCustomerName(newCust.full_name);
        setBookingPersonMode("customer");
        setBookingMemberQuery("");
        setBookingMemberResults([]);
        setBookingCustomerResults([]);
        setBookingCourtyclubResults([]);
      }
      setQuickAddCust(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setQuickAddSaving(false);
    }
  };
  const loadBookingAvailCourts = async (date, startTime, endTime) => {
    if (!date || !startTime || !endTime || courts.length === 0) {
      setBookingAvailCourts([...courts]);
      return;
    }
    setBookingCourtsLoading(true);
    try {
      const startDb = localTimeToDb(`${date}T${startTime}`);
      const endDb = localTimeToDb(`${date}T${endTime}`);
      const allIds = courts.map((c) => c.id);
      const blocked = /* @__PURE__ */ new Set();
      const [bRes, lRes, mlRes, clRes] = await Promise.all([
        sb.from("bookings").select("court_id").in("court_id", allIds).in("status", ["pending", "confirmed"]).lt("start_time", endDb).gt("end_time", startDb),
        sb.from("lessons").select("court_id").in("court_id", allIds).neq("status", "cancelled").lt("start_time", endDb).gt("end_time", startDb).not("court_id", "is", null),
        sb.from("club_manual_lessons").select("court_id, start_time, end_time").in("court_id", allIds).eq("date", date).not("court_id", "is", null),
        sb.from("court_closures").select("court_id, closure_type, day_of_week, start_hour, start_minute, end_hour, end_minute, start_date, end_date").in("court_id", allIds).eq("is_active", true)
      ]);
      (bRes.data || []).forEach((r) => blocked.add(r.court_id));
      (lRes.data || []).forEach((r) => blocked.add(r.court_id));
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const newStart = sh * 60 + sm;
      const newEnd = eh * 60 + em;
      for (const ml of mlRes.data || []) {
        const [msh, msm] = ml.start_time.split(":").map(Number);
        const [meh, mem] = ml.end_time.split(":").map(Number);
        if (newStart < meh * 60 + mem && newEnd > msh * 60 + msm) blocked.add(ml.court_id);
      }
      const dow = (/* @__PURE__ */ new Date(date + "T12:00:00")).getDay();
      for (const cl of clRes.data || []) {
        const clStart = (cl.start_hour || 0) * 60 + (cl.start_minute || 0);
        const clEnd = (cl.end_hour || 0) * 60 + (cl.end_minute || 0);
        if (newStart >= clEnd || newEnd <= clStart) continue;
        if (cl.closure_type === "recurring_weekly" && cl.day_of_week === dow) blocked.add(cl.court_id);
        else if (cl.closure_type === "one_time") {
          if ((!cl.start_date || cl.start_date <= date) && (!cl.end_date || cl.end_date >= date)) blocked.add(cl.court_id);
        }
      }
      setBookingAvailCourts(courts.filter((c) => !blocked.has(c.id)));
    } catch (e) {
      console.error(e);
      setBookingAvailCourts([...courts]);
    } finally {
      setBookingCourtsLoading(false);
    }
  };
  const handleBookingDuration = (d) => {
    const [sh, sm] = (bookingForm.startTime || "09:00").split(":").map(Number);
    const totalMin = sh * 60 + sm + Math.round(d * 60);
    const eh = Math.floor(totalMin / 60) % 24;
    const em = totalMin % 60;
    const newEnd = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
    const newForm = { ...bookingForm, duration: d, endTime: newEnd };
    setBookingForm(newForm);
    loadBookingAvailCourts(newForm.date, newForm.startTime, newEnd);
  };
  const searchBookingMembers = async (q) => {
    setBookingMemberQuery(q);
    if (q.length < 2) {
      setBookingMemberResults([]);
      return;
    }
    setBookingMemberLoading(true);
    try {
      const { data } = await sb.from("profiles").select("id, full_name, email").ilike("full_name", `%${q}%`).limit(8);
      setBookingMemberResults(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setBookingMemberLoading(false);
    }
  };
  const searchBookingCustomers = async (q) => {
    setBookingCustomerQuery(q);
    if (q.length < 2) {
      setBookingCustomerResults([]);
      return;
    }
    try {
      const { data } = await sb.from("club_customers").select("id, full_name, phone, email, user_id").eq("club_id", clubId).eq("is_active", true).or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`).limit(8);
      setBookingCustomerResults(data || []);
    } catch (e) {
      console.error(e);
    }
  };
  const searchBookingPerson = async (q) => {
    setBookingMemberQuery(q);
    if (q.length < 2) {
      setBookingMemberResults([]);
      setBookingCustomerResults([]);
      setBookingCourtyclubResults([]);
      return;
    }
    setBookingMemberLoading(true);
    try {
      const [memRes, custRes, ccRes] = await Promise.all([
        sb.from("club_memberships").select("user_id, member_name, profile:profiles!club_memberships_user_id_fkey(id, full_name, email)").eq("club_id", clubId).eq("status", "active").limit(30),
        sb.from("club_customers").select("id, full_name, phone, email, user_id").eq("club_id", clubId).eq("is_active", true).or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`).limit(6),
        sb.from("profiles").select("id, full_name, email, phone").eq("user_type", "player").or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`).limit(8)
      ]);
      const lq = q.toLowerCase();
      const members = (memRes.data || []).filter((m) => (m.profile?.full_name || m.member_name || "").toLowerCase().includes(lq)).map((m) => ({ id: m.profile?.id || m.user_id, full_name: m.profile?.full_name || m.member_name, email: m.profile?.email }));
      const customers = custRes.data || [];
      const memberIds = new Set(members.map((p) => p.id).filter(Boolean));
      const customerUserIds = new Set(customers.map((c) => c.user_id).filter(Boolean));
      setBookingMemberResults(members);
      setBookingCustomerResults(customers);
      setBookingCourtyclubResults((ccRes.data || []).filter((p) => !memberIds.has(p.id) && !customerUserIds.has(p.id)));
    } catch (e) {
      console.error(e);
    } finally {
      setBookingMemberLoading(false);
    }
  };
  const saveInlineBooking = async () => {
    const { courtId, date, startTime, endTime, duration, status } = bookingForm;
    if (!courtId) {
      alert("L\xFCtfen bir kort se\xE7in.");
      return;
    }
    if (!startTime) {
      alert("Ba\u015Flang\u0131\xE7 saati eksik.");
      return;
    }
    const startDb = localTimeToDb(`${date}T${startTime}`);
    const endDb = localTimeToDb(`${date}T${endTime}`);
    if (new Date(startDb) < /* @__PURE__ */ new Date()) {
      const ok = confirm("Ge\xE7mi\u015F bir saate rezervasyon olu\u015Fturulsun mu?");
      if (!ok) return;
    }
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const newStart = sh * 60 + sm;
    const newEnd = eh * 60 + em;
    const dow = (/* @__PURE__ */ new Date(date + "T12:00:00")).getDay();
    setBookingSaving(true);
    try {
      const [bConflict, mConflict, closures] = await Promise.all([
        sb.from("bookings").select("id").eq("court_id", courtId).in("status", ["pending", "confirmed"]).lt("start_time", endDb).gt("end_time", startDb),
        sb.from("club_manual_lessons").select("id, start_time, end_time").eq("court_id", courtId).eq("date", date),
        sb.from("court_closures").select("*").eq("court_id", courtId).eq("is_active", true)
      ]);
      if ((bConflict.data || []).length > 0) {
        alert("Bu kort se\xE7ilen saatte zaten rezerve edilmi\u015F.");
        return;
      }
      const hasManualConflict = (mConflict.data || []).some((l) => {
        const [lsh, lsm] = l.start_time.split(":").map(Number);
        const [leh, lem] = l.end_time.split(":").map(Number);
        return newStart < leh * 60 + lem && newEnd > lsh * 60 + lsm;
      });
      if (hasManualConflict) {
        alert("Bu kort se\xE7ilen saatte planlanm\u0131\u015F bir ders var.");
        return;
      }
      const closureBlock = (closures.data || []).some((cl) => {
        const clStart = (cl.start_hour || 0) * 60 + (cl.start_minute || 0);
        const clEnd = (cl.end_hour || 0) * 60 + (cl.end_minute || 0);
        if (newStart >= clEnd || newEnd <= clStart) return false;
        if (cl.closure_type === "recurring_weekly") return cl.day_of_week === dow;
        return (!cl.start_date || cl.start_date <= date) && (!cl.end_date || cl.end_date >= date);
      });
      if (closureBlock) {
        alert("Bu kort se\xE7ilen saatte kapal\u0131 (bak\u0131m veya etkinlik).");
        return;
      }
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error("Oturum bulunamad\u0131.");
      const court = courts.find((c) => c.id === courtId);
      const durationHours = (newEnd - newStart) / 60;
      const calculatedAmount = Math.round((court?.hourly_rate || 0) * durationHours * 100) / 100;
      const parsedOverride = parseFloat((bookingPriceOverride || "").replace(",", "."));
      const totalAmount = !isNaN(parsedOverride) && parsedOverride !== calculatedAmount ? parsedOverride : calculatedAmount;
      const { data: bk, error: bkErr } = await sb.from("bookings").insert({
        court_id: courtId,
        user_id: user.id,
        start_time: startDb,
        end_time: endDb,
        status: status || "confirmed",
        is_solo_booking: !bookingMemberId && !bookingCustomerId,
        duration_hours: durationHours,
        total_amount: totalAmount,
        calculated_amount: calculatedAmount,
        club_customer_id: bookingCustomerId || null,
        player_name: bookingMemberName || bookingCustomerName || null
      }).select("id").single();
      if (bkErr) throw bkErr;
      const insertedBkId = bk?.id ?? null;
      const playerIdToLink = bookingMemberId || null;
      if (playerIdToLink && insertedBkId) {
        await sb.from("booking_players").insert({
          booking_id: insertedBkId,
          player_id: playerIdToLink,
          is_primary_player: true,
          status: "confirmed"
        });
      }
      setBookingModal(false);
      setSlotClickInfo(null);
      setBookingCustomerId(null);
      setBookingCustomerName("");
      setBookingCustomerQuery("");
      setBookingCustomerResults([]);
      setBookingCourtyclubResults([]);
      setBookingPersonMode("member");
      await load();
      alert("Rezervasyon ba\u015Far\u0131yla olu\u015Fturuldu.");
    } catch (e) {
      if (e.message?.includes("duration_hours_check")) {
        alert("Ge\xE7ersiz s\xFCre: Se\xE7ilen s\xFCre minimum rezervasyon s\xFCresinin alt\u0131nda. L\xFCtfen biti\u015F saatini kontrol edin.");
      } else {
        alert("Hata: " + e.message);
      }
    } finally {
      setBookingSaving(false);
    }
  };
  React.useEffect(() => {
    displayCourtsRef.current = displayCourts;
  }, [displayCourts]);
  const prevDay = () => {
    const d = /* @__PURE__ */ new Date(selDate + "T12:00:00");
    d.setDate(d.getDate() - 1);
    setSelDate(d.toISOString().split("T")[0]);
  };
  const nextDay = () => {
    const d = /* @__PURE__ */ new Date(selDate + "T12:00:00");
    d.setDate(d.getDate() + 1);
    setSelDate(d.toISOString().split("T")[0]);
  };
  const dateLabel = (/* @__PURE__ */ new Date(selDate + "T12:00:00")).toLocaleDateString(
    "tr-TR",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  );
  const isToday = selDate === todayISO();
  const EventBlock = ({ ev, col, totalCols }) => {
    const startMins = ev.sh * 60 + ev.sm;
    const endMins = ev.eh * 60 + ev.em;
    const top = (startMins - START_H * 60) / 60 * SLOT_H + 36;
    const height = Math.max((endMins - startMins) / 60 * SLOT_H, 22);
    if (endMins <= START_H * 60 || startMins >= END_H * 60 || endMins <= startMins) return null;
    const timeStr = `${String(ev.sh).padStart(2, "0")}:${String(ev.sm).padStart(2, "0")}\u2013${String(ev.eh % 24).padStart(2, "0")}:${String(ev.em).padStart(2, "0")}`;
    const widthPct = 100 / totalCols;
    const isBooking = ev.type === "booking";
    const isLesson = ev.type === "lesson";
    const isBlock = ev.type === "block";
    const isClickable = isBooking || isLesson || isBlock;
    const isPaid = ev.paymentStatus === "paid";
    const handleEvClick = isClickable ? (e) => {
      e.stopPropagation();
      if (isBooking) setBkDetail(ev);
      else if (isLesson) setLsDetail(ev);
      else if (isBlock) {
        const sh = ev.sh, sm = ev.sm, eh = ev.eh, em = ev.em;
        setClDetail(ev);
        setClEditMode(false);
        setClEditForm({
          start_time: `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
          end_time: `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`
        });
      }
    } : void 0;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        onMouseDown: handleEvClick,
        style: {
          position: "absolute",
          top: top + "px",
          left: `calc(${col * widthPct}% + 2px)`,
          width: `calc(${widthPct}% - 4px)`,
          height: height + "px",
          background: ev.color + "22",
          borderLeft: `3px solid ${ev.color}`,
          borderRadius: "0 6px 6px 0",
          padding: "2px 6px",
          overflow: "hidden",
          zIndex: 1,
          cursor: isClickable ? "pointer" : "default"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: ev.color, lineHeight: 1.4, display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", null, timeStr), (isBooking || isLesson) && height >= 22 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, background: isPaid ? "#22C55E22" : "#F59E0B22", color: isPaid ? "#16A34A" : "#D97706", borderRadius: 3, padding: "1px 4px", fontWeight: 700 } }, isPaid ? "\u2713" : "\u20BA"), isBlock && height >= 22 && /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13, color: ev.color, opacity: 0.7 } }, "touch_app")),
      height >= 30 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, ev.label), ev.coaches && ev.coaches.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", lineHeight: 1.4, overflowWrap: "break-word" } }, ev.coaches.join(", ")))
    );
  };
  const CourtColumn = ({ courtId, courtIdx, label }) => {
    const evs = courtId ? dayEvents.filter((e) => e.courtId === courtId) : noCourtLessons;
    const evLayout = React.useMemo(() => {
      const sorted = [...evs].sort((a, b) => a.sh * 60 + a.sm - (b.sh * 60 + b.sm));
      const colEnds = [];
      const result = /* @__PURE__ */ new Map();
      sorted.forEach((ev) => {
        const startMins = ev.sh * 60 + ev.sm;
        const endMins = ev.eh * 60 + ev.em;
        let col = colEnds.findIndex((end) => end <= startMins);
        if (col === -1) {
          col = colEnds.length;
          colEnds.push(endMins);
        } else colEnds[col] = endMins;
        result.set(ev.id, { col, startMins, endMins });
      });
      result.forEach((val, id) => {
        let maxCol = 0;
        result.forEach((other) => {
          if (other.startMins < val.endMins && other.endMins > val.startMins)
            maxCol = Math.max(maxCol, other.col);
        });
        result.set(id, { ...val, totalCols: maxCol + 1 });
      });
      return result;
    }, [evs]);
    return /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 120, borderLeft: "1px solid var(--border)", position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: {
      height: 36,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: 12,
      color: "var(--text-2)",
      borderBottom: "1px solid var(--border)",
      background: "var(--bg)"
    } }, label, courtId && /* @__PURE__ */ React.createElement("div", { style: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      marginLeft: 5,
      background: occupiedCourtIds.has(courtId) ? "#EF4444" : "#22C55E"
    } })), Array.from({ length: (END_H - START_H) * 4 }, (_, i) => {
      const slot = i;
      const { h, m } = slotToHM(slot);
      const isHour = m === 45;
      const occupied = courtId ? isSlot15Occupied(courtId, slot) : true;
      const inDrag = dragState && courtId != null && courtIdx >= Math.min(dragState.startCIdx, dragState.currentCIdx) && courtIdx <= Math.max(dragState.startCIdx, dragState.currentCIdx) && slot >= Math.min(dragState.startSlot, dragState.currentSlot) && slot <= Math.max(dragState.startSlot, dragState.currentSlot);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: i,
          onMouseDown: () => courtId != null && !occupied && handleMouseDown(courtIdx, courtId, slot),
          onMouseEnter: () => courtId != null && handleMouseEnter(courtIdx, courtId, slot),
          title: courtId != null && !occupied ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} \u2013 s\xFCr\xFCkleyerek se\xE7` : void 0,
          style: {
            height: SLOT_H / 4,
            borderBottom: isHour ? "1px solid #cbd5e1" : "1px solid #f1f5f9",
            cursor: courtId != null && !occupied ? "crosshair" : "default",
            background: inDrag ? "#EEF2FF" : "",
            outline: inDrag ? "2px solid #6366F1" : "none",
            outlineOffset: "-1px",
            userSelect: "none",
            transition: "background 0.05s"
          }
        }
      );
    }), evs.map((ev, idx) => {
      const lay = evLayout.get(ev.id) || { col: 0, totalCols: 1 };
      return /* @__PURE__ */ React.createElement(EventBlock, { key: ev.id || idx, ev, col: lay.col, totalCols: lay.totalCols });
    }));
  };
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Program"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, dateLabel)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-icon", onClick: prevDay }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_left")), /* @__PURE__ */ React.createElement("button", { className: `btn btn-sm ${isToday ? "btn-pri" : "btn-ghost"}`, onClick: () => setSelDate(todayISO()) }, "Bug\xFCn"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-icon", onClick: nextDay }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_right")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: selDate,
      onChange: (e) => setSelDate(e.target.value),
      style: { border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", fontSize: 13, cursor: "pointer" }
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-icon", onClick: load, title: "Yenile" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "refresh")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setSelCourtId(null),
      className: `btn btn-sm ${!selCourtId ? "btn-pri" : "btn-ghost"}`
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "sports_tennis"),
    "\xA0T\xFCm Kortlar"
  ), courts.map((c) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: c.id,
      onClick: () => setSelCourtId(c.id),
      className: `btn btn-sm ${selCourtId === c.id ? "btn-pri" : "btn-ghost"}`,
      style: { display: "flex", alignItems: "center", gap: 5 }
    },
    /* @__PURE__ */ React.createElement("div", { style: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: occupiedCourtIds.has(c.id) ? "#EF4444" : "#22C55E"
    } }),
    "Kort ",
    c.court_number
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" } }, [{ color: "#22C55E", label: "Rezervasyon" }, { color: "#8B5CF6", label: "Ders" }, { color: "#F97316", label: "Kapal\u0131 / Blok" }].map((l) => /* @__PURE__ */ React.createElement("div", { key: l.label, style: { display: "flex", alignItems: "center", gap: 6, fontSize: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 10, height: 10, borderRadius: 3, background: l.color } }), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-2)" } }, l.label)))), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg-card,#fff)", borderRadius: 12, border: "1px solid var(--border)", overflow: "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", minWidth: displayCourts.length * 160 + 52 + "px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 52, flexShrink: 0, borderRight: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { height: 36, borderBottom: "1px solid var(--border)" } }), Array.from({ length: END_H - START_H }, (_, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { height: SLOT_H, borderBottom: "1px solid #cbd5e1", position: "relative" } }, [0, 15, 30, 45].map((min) => /* @__PURE__ */ React.createElement("div", { key: min, style: {
    position: "absolute",
    top: `${min / 60 * 100}%`,
    right: 8,
    transform: "translateY(2px)",
    fontSize: min === 0 ? 11 : min === 30 ? 10 : 9,
    color: min === 0 ? "var(--text-2)" : "var(--text-3,#94a3b8)",
    fontWeight: min === 0 ? 500 : 400,
    lineHeight: 1,
    whiteSpace: "nowrap"
  } }, String(START_H + i).padStart(2, "0"), ":", String(min).padStart(2, "0")))))), displayCourts.map((c, idx) => /* @__PURE__ */ React.createElement(CourtColumn, { key: c.id, courtId: c.id, courtIdx: idx, label: `Kort ${c.court_number}` })), !selCourtId && noCourtLessons.length > 0 && /* @__PURE__ */ React.createElement(CourtColumn, { courtId: null, label: "Genel" }))), slotTypeModal && slotClickInfo && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: (e) => {
        if (e.target === e.currentTarget) {
          setSlotTypeModal(false);
          setSlotClickInfo(null);
          setClosureType(null);
        }
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 20, padding: 24, width: 340, display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 17, color: "var(--text-1)", marginBottom: 2 } }, slotClickInfo.courtIds.map((id) => {
      const c = courts.find((x) => x.id === id);
      return c ? `Kort ${c.court_number}` : "";
    }).join(", "), " \xB7 ", String(slotClickInfo.startHour).padStart(2, "0"), ":", String(slotClickInfo.startMinute || 0).padStart(2, "0"), " \u2013 ", String(slotClickInfo.endHour).padStart(2, "0"), ":", String(slotClickInfo.endMinute || 0).padStart(2, "0")), slotClickInfo.courtIds.length > 1 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#6366F1", background: "#EEF2FF", borderRadius: 8, padding: "4px 10px", marginBottom: 4 } }, slotClickInfo.courtIds.length, " kort se\xE7ildi \u2014 Rezervasyon/Ders i\xE7in yaln\u0131zca ilk kort kullan\u0131l\u0131r"), !closureType ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", marginBottom: 4 } }, "Ne yapmak istersiniz?"), [
      { type: "reservation", icon: "event", label: "Rezervasyon", color: "#003399" },
      { type: "lesson", icon: "school", label: "\xD6zel Ders", color: "#7C3AED" },
      { type: "group", icon: "groups", label: "Grup Dersi", color: "#0891B2" },
      { type: "closure", icon: "lock", label: "Kapatma", color: "#DC2626" }
    ].map(({ type, icon, label, color }) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: type,
        style: { display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 14, border: `1.5px solid ${color}20`, background: `${color}08`, cursor: "pointer", fontSize: 14, fontWeight: 700, color, textAlign: "left" },
        onClick: () => applySlotPrefill(type)
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 20, color } }, icon),
      label
    ))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 } }, closureType === "group" ? "Grup se\xE7in (opsiyonel)" : "Kapatma Onay\u0131"), closureType === "closure" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 8 } }, [
      { v: false, label: "Tek Seferlik", icon: "today", desc: "Sadece bu tarih i\xE7in" },
      { v: true, label: "Haftal\u0131k", icon: "repeat", desc: "Her hafta tekrarlan\u0131r" }
    ].map(({ v, label, icon, desc }) => {
      const sel = closureIsRecurring === v;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: String(v),
          onClick: () => setClosureIsRecurring(v),
          style: {
            flex: 1,
            padding: "12px 14px",
            borderRadius: 14,
            border: sel ? "2px solid #DC2626" : "1.5px solid var(--border)",
            background: sel ? "#FEE2E2" : "var(--bg)",
            cursor: "pointer",
            transition: "all 0.12s"
          }
        },
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 17, color: sel ? "#DC2626" : "var(--text-2)" } }, icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: sel ? "#B91C1C" : "var(--text-1)" } }, label)),
        /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, desc)
      );
    })), closureType === "group" && /* @__PURE__ */ React.createElement(
      "select",
      {
        value: selectedGroup,
        onChange: (e) => setSelectedGroup(e.target.value),
        style: { border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontSize: 14 }
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "\u2014 Grup se\xE7in (opsiyonel)"),
      closureGroups.map((g) => /* @__PURE__ */ React.createElement("option", { key: g.id, value: g.id }, g.name))
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { padding: "13px", borderRadius: 14, background: closureType === "group" ? "#0891B2" : "#DC2626", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: slotSaving ? "not-allowed" : "pointer", opacity: slotSaving ? 0.6 : 1 },
        onClick: saveInlineClosure,
        disabled: slotSaving
      },
      slotSaving ? "Kaydediliyor\u2026" : closureType === "group" ? "Grup Dersi Ekle" : "Kapat"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { padding: "10px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: 13, color: "var(--text-2)", fontWeight: 600 },
        onClick: () => {
          setClosureType(null);
          setClosureIsRecurring(false);
        }
      },
      "\u2190 Geri"
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { marginTop: 2, padding: "10px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: 13, color: "var(--text-2)", fontWeight: 600 },
        onClick: () => {
          setSlotTypeModal(false);
          setSlotClickInfo(null);
          setClosureType(null);
          setClosureIsRecurring(false);
        }
      },
      "\u0130ptal"
    ))
  ), bkDetail && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: (e) => {
        if (e.target === e.currentTarget && !bkDetailSaving) setBkDetail(null);
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 20, width: "min(480px,95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 8px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, fontWeight: 800, color: "var(--text-1)" } }, bkDetail.playerName || "Misafir"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", marginTop: 2 } }, "Kort ", bkDetail.courtNum, " \xB7 ", String(bkDetail.sh).padStart(2, "0"), ":", String(bkDetail.sm).padStart(2, "0"), "\u2013", String(bkDetail.eh).padStart(2, "0"), ":", String(bkDetail.em).padStart(2, "0"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setBkDetail(null), style: { background: "none", border: "none", cursor: "pointer", padding: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--text-2)" } }, "close"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, padding: "0 20px 16px", flexWrap: "wrap" } }, (() => {
      const s = bkDetail.status;
      const cfg = s === "confirmed" || s === "pending" ? { bg: "#DBEAFE", color: "#1D4ED8", label: "Onayl\u0131" } : s === "completed" ? { bg: "#DCFCE7", color: "#16A34A", label: "Tamamland\u0131" } : { bg: "#FEE2E2", color: "#DC2626", label: "\u0130ptal Edildi" };
      return /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "4px 10px", background: cfg.bg, color: cfg.color } }, cfg.label);
    })(), (() => {
      const p = bkDetail.paymentStatus;
      const cfg = p === "paid" ? { bg: "#DCFCE7", color: "#16A34A", label: "\xD6dendi" } : { bg: "#FEF3C7", color: "#D97706", label: "\xD6denmedi" };
      return /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "4px 10px", background: cfg.bg, color: cfg.color } }, cfg.label);
    })(), bkDetail.totalAmount > 0 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "4px 10px", background: "#F8FAFC", color: "var(--text-2)" } }, "\u20BA", Number(bkDetail.totalAmount).toLocaleString("tr-TR"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, padding: "0 20px 28px", flexWrap: "wrap" } }, bkDetail.paymentStatus !== "paid" && ["pending", "confirmed", "completed"].includes(bkDetail.status) && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleBkDetailPaid,
        disabled: bkDetailSaving,
        style: { flex: 1, minWidth: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px", borderRadius: 14, border: "none", cursor: bkDetailSaving ? "not-allowed" : "pointer", background: "#22C55E", color: "#fff", fontSize: 14, fontWeight: 700 }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "payments"),
      "\xD6deme Al",
      bkDetail.totalAmount > 0 ? ` \xB7 \u20BA${Number(bkDetail.totalAmount).toLocaleString("tr-TR")}` : ""
    ), ["pending", "confirmed"].includes(bkDetail.status) && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleBkDetailComplete,
        disabled: bkDetailSaving,
        style: { flex: 1, minWidth: 100, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px", borderRadius: 14, border: "1.5px solid #22C55E", cursor: bkDetailSaving ? "not-allowed" : "pointer", background: "#fff", color: "#16A34A", fontSize: 14, fontWeight: 700 }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "done_all"),
      "Tamamland\u0131"
    ), ["pending", "confirmed"].includes(bkDetail.status) && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleBkDetailCancel,
        disabled: bkDetailSaving,
        style: { flex: 1, minWidth: 80, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px", borderRadius: 14, border: "none", cursor: bkDetailSaving ? "not-allowed" : "pointer", background: "#EF4444", color: "#fff", fontSize: 14, fontWeight: 700 }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "close"),
      "\u0130ptal Et"
    ), !["pending", "confirmed", "completed"].includes(bkDetail.status) && /* @__PURE__ */ React.createElement("div", { style: { flex: 1, textAlign: "center", color: "var(--text-2)", fontSize: 13, padding: "13px" } }, "Bu rezervasyon zaten iptal edilmi\u015F.")))
  ), lsDetail && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: (e) => {
        if (e.target === e.currentTarget && !lsDetailSaving) setLsDetail(null);
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 20, width: "min(480px,95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 8px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, fontWeight: 800, color: "var(--text-1)" } }, lsDetail.studentName || "\xD6\u011Frenci"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", marginTop: 2 } }, "Kort ", lsDetail.courtNum, " \xB7 ", String(lsDetail.sh).padStart(2, "0"), ":", String(lsDetail.sm).padStart(2, "0"), "\u2013", String(lsDetail.eh).padStart(2, "0"), ":", String(lsDetail.em).padStart(2, "0")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 1 } }, lsDetail.coachName)), /* @__PURE__ */ React.createElement("button", { onClick: () => setLsDetail(null), disabled: lsDetailSaving, style: { background: "none", border: "none", cursor: "pointer", padding: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--text-2)" } }, "close"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, padding: "0 20px 16px", flexWrap: "wrap" } }, lsDetail.isPackageLesson ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "4px 10px", background: "#EEF2FF", color: "#6366F1", display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "inventory"), "Paket") : (() => {
      const p = lsDetail.paymentStatus;
      const cfg = p === "paid" ? { bg: "#DCFCE7", color: "#16A34A", label: "\xD6dendi" } : { bg: "#FEF3C7", color: "#D97706", label: "\xD6denmedi" };
      return /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "4px 10px", background: cfg.bg, color: cfg.color } }, cfg.label);
    })(), !lsDetail.isPackageLesson && (() => {
      const isSplit = lsDetail.priceMode === "split";
      const isNewNormal = !isSplit && lsDetail.coachAmount != null;
      if (isNewNormal) {
        const cAmt = Math.round((Number(lsDetail.coachAmount) || 0) * 100) / 100;
        const kAmt = Math.round((Number(lsDetail.clubAmount) || 0) * 100) / 100;
        const total2 = cAmt + kAmt;
        if (total2 <= 0) return null;
        return /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "4px 10px", background: "#F0FDF4", color: "#16A34A" } }, "\u20BA", total2.toLocaleString("tr-TR"), " (Hoca \u20BA", cAmt.toLocaleString("tr-TR"), " + Kul\xFCp \u20BA", kAmt.toLocaleString("tr-TR"), ")");
      }
      const ca = Math.round((Number(lsDetail.amount) || 0) * 100) / 100;
      let total;
      if (isSplit) {
        total = ca;
      } else {
        const court = courts.find((c) => c.id === lsDetail.courtId);
        const dh = Math.max(0, (lsDetail.eh * 60 + lsDetail.em - (lsDetail.sh * 60 + lsDetail.sm)) / 60);
        const cf = Math.round((court?.hourly_rate || 0) * dh * 100) / 100;
        total = Math.round((cf + ca) * 100) / 100;
      }
      if (total <= 0) return null;
      return /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "4px 10px", background: isSplit ? "#F5F3FF" : "#F8FAFC", color: isSplit ? "#7C3AED" : "var(--text-2)" } }, "\u20BA", total.toLocaleString("tr-TR"));
    })()), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, padding: "0 20px 28px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, lsDetail.isPackageLesson ? /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px", borderRadius: 14, background: "#EEF2FF", color: "#6366F1", fontSize: 14, fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "inventory"), "Paketten D\xFC\u015F\xFCld\xFC") : lsDetail.paymentStatus !== "paid" ? /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleLsDetailPaid,
        disabled: lsDetailSaving,
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px", borderRadius: 14, border: "none", cursor: lsDetailSaving ? "not-allowed" : "pointer", background: "#22C55E", color: "#fff", fontSize: 14, fontWeight: 700 }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "payments"),
      (() => {
        const isDual = lsDetail.priceMode === "dual" || lsDetail.priceMode === "normal" && lsDetail.coachAmount != null;
        const isSplit = lsDetail.priceMode === "split";
        let total;
        if (isDual) {
          total = Math.round((Number(lsDetail.amount) || 0) * 100) / 100;
        } else if (isSplit) {
          total = Math.round((Number(lsDetail.amount) || 0) * 100) / 100;
        } else {
          const ca = Math.round((Number(lsDetail.amount) || 0) * 100) / 100;
          const court = courts.find((c) => c.id === lsDetail.courtId);
          const dh = Math.max(0, (lsDetail.eh * 60 + lsDetail.em - (lsDetail.sh * 60 + lsDetail.sm)) / 60);
          const cf = Math.round((court?.hourly_rate || 0) * dh * 100) / 100;
          total = Math.round((cf + ca) * 100) / 100;
        }
        return `\xD6deme Al${total > 0 ? ` \xB7 \u20BA${total.toLocaleString("tr-TR")}` : ""}`;
      })()
    ) : /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px", borderRadius: 14, background: "#DCFCE7", color: "#16A34A", fontSize: 14, fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "check_circle"), "\xD6dendi"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleLsDetailCancel,
        disabled: lsDetailSaving,
        style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px 16px", borderRadius: 14, border: "1.5px solid #EF4444", background: "#FEF2F2", cursor: lsDetailSaving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, color: "#EF4444", opacity: lsDetailSaving ? 0.6 : 1, flexShrink: 0 }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "cancel"),
      "\u0130ptal"
    )), lsDetail.source === "manual" && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => openLsEdit(lsDetail),
        disabled: lsDetailSaving,
        style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px", borderRadius: 14, border: "1.5px solid #0891B2", background: "#F0FDFA", cursor: lsDetailSaving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, color: "#0E7490" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "edit"),
      "D\xFCzenle"
    )))
  ), clDetail && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: (e) => {
        if (e.target === e.currentTarget && !clDetailSaving) {
          setClDetail(null);
          setClEditMode(false);
        }
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 20, width: "min(480px,95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 16px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 34, height: 34, borderRadius: 10, background: "#FFF7ED", display: "grid", placeItems: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: "#F97316" } }, clDetail.groupId ? "groups" : "lock")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "var(--text-1)" } }, clDetail.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2 } }, "Kort ", clDetail.courtNum, " \xB7 ", String(clDetail.sh).padStart(2, "0"), ":", String(clDetail.sm).padStart(2, "0"), "\u2013", String(clDetail.eh).padStart(2, "0"), ":", String(clDetail.em).padStart(2, "0"), " \xB7 ", (/* @__PURE__ */ new Date((clDetail.closureDate || selDate) + "T12:00:00")).toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" })))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 20,
      padding: "3px 10px",
      background: clDetail.closureType === "one_time" ? "#FFF7ED" : "#EFF6FF",
      color: clDetail.closureType === "one_time" ? "#EA580C" : "#2563EB"
    } }, clDetail.closureType === "one_time" ? "Tek Seferlik" : "Haftal\u0131k Tekrar"), clDetail.groupId && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "3px 10px", background: "#F0FDFA", color: "#0891B2" } }, "Grup Dersi")), clDetail.coaches && clDetail.coaches.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13, verticalAlign: "middle", marginRight: 4 } }, "person"), clDetail.coaches.join(" \xB7 "))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setClDetail(null);
          setClEditMode(false);
        },
        disabled: clDetailSaving,
        style: { background: "none", border: "none", cursor: "pointer", padding: 8, alignSelf: "flex-start" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--text-2)" } }, "close")
    )), clDetail.closureType === "recurring_weekly" && /* @__PURE__ */ React.createElement("div", { style: { margin: "0 20px 12px", padding: "10px 14px", borderRadius: 10, background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: 12, color: "#1E40AF", display: "flex", gap: 8, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, flexShrink: 0, marginTop: 1 } }, "info"), /* @__PURE__ */ React.createElement("span", null, clDetail.groupId ? "Bu haftal\u0131k tekrarlayan bir grup dersi. Sil butonuna bas\u0131nca sadece bu seans\u0131 m\u0131 yoksa t\xFCm seriyi mi silmek istedi\u011Finiz sorulacak." : "Bu haftal\u0131k tekrarlayan bir kapatma. D\xFCzenleme veya silme t\xFCm haftalar\u0131 etkiler.")), clEditMode && /* @__PURE__ */ React.createElement("div", { style: { padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", letterSpacing: 0.4 } }, "SAATI D\xDCZENLE"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginBottom: 4 } }, "Ba\u015Flang\u0131\xE7"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: clEditForm.start_time,
        onChange: (e) => setClEditForm((f) => ({ ...f, start_time: e.target.value })),
        style: { width: "100%", border: "1.5px solid var(--border)", borderRadius: 10, padding: "9px 12px", fontSize: 14, boxSizing: "border-box" }
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginBottom: 4 } }, "Biti\u015F"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: clEditForm.end_time,
        onChange: (e) => setClEditForm((f) => ({ ...f, end_time: e.target.value })),
        style: { width: "100%", border: "1.5px solid var(--border)", borderRadius: 10, padding: "9px 12px", fontSize: 14, boxSizing: "border-box" }
      }
    )))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, padding: "0 20px 28px", flexWrap: "wrap" } }, !clEditMode ? /* @__PURE__ */ React.createElement(React.Fragment, null, (clDetail.closureType === "one_time" || clDetail.rawId) && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setClEditMode(true),
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px", borderRadius: 14, border: "1.5px solid #0891B2", background: "#F0FDFA", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#0E7490" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "edit"),
      "D\xFCzenle"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: deleteBlockClosure,
        disabled: clDetailSaving,
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px", borderRadius: 14, border: "none", background: "#EF4444", cursor: clDetailSaving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, color: "#fff" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "delete"),
      clDetailSaving ? "Siliniyor..." : "Sil"
    )) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setClEditMode(false),
        disabled: clDetailSaving,
        style: { flex: 1, padding: "13px", borderRadius: 14, border: "1.5px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--text-2)" }
      },
      "\u0130ptal"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: updateBlockClosure,
        disabled: clDetailSaving,
        style: { flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px", borderRadius: 14, border: "none", background: clDetailSaving ? "#94a3b8" : "#0891B2", cursor: clDetailSaving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 800, color: "#fff" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "save"),
      clDetailSaving ? "Kaydediliyor..." : "Kaydet"
    ))))
  ), clDeleteChoice && clDetail && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1350, display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 20, width: "min(400px,92vw)", padding: "28px 24px", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "var(--text-1)", marginBottom: 8 } }, "Silme Kapsam\u0131"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", marginBottom: 24 } }, /* @__PURE__ */ React.createElement("b", null, '"', clDetail.label, '"'), " grubunun", " ", (/* @__PURE__ */ new Date((clDetail.closureDate || selDate) + "T12:00:00")).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }), " ", "tarihli seans\u0131 i\xE7in ne yapmak istiyorsunuz?"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: deleteThisSession,
      disabled: clDetailSaving,
      style: { padding: "13px", borderRadius: 14, border: "1.5px solid #EF4444", background: "#FEF2F2", color: "#DC2626", fontWeight: 700, fontSize: 14, cursor: clDetailSaving ? "not-allowed" : "pointer", textAlign: "left" }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, verticalAlign: "middle", marginRight: 6 } }, "event_busy"),
    "Sadece bu seans (",
    (/* @__PURE__ */ new Date((clDetail.closureDate || selDate) + "T12:00:00")).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
    ")"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: deleteEntireSeries,
      disabled: clDetailSaving,
      style: { padding: "13px", borderRadius: 14, border: "none", background: "#EF4444", color: "#fff", fontWeight: 700, fontSize: 14, cursor: clDetailSaving ? "not-allowed" : "pointer", textAlign: "left" }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, verticalAlign: "middle", marginRight: 6 } }, "delete_forever"),
    "T\xFCm seriyi sil"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setClDeleteChoice(false),
      disabled: clDetailSaving,
      style: { padding: "11px", borderRadius: 14, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text-2)", fontWeight: 600, fontSize: 14, cursor: clDetailSaving ? "not-allowed" : "pointer" }
    },
    "\u0130ptal"
  )))), lsModal && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1250, display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: (e) => {
        if (e.target === e.currentTarget && !lsSaving) {
          lsEditInitRef.current = null;
          setLsModal(null);
        }
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 20, width: "min(480px,95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 17, fontWeight: 800, color: "var(--text-1)" } }, lsModal?.type === "edit" ? "\xD6zel Ders D\xFCzenle" : "\xD6zel Ders Ekle"), /* @__PURE__ */ React.createElement("button", { style: { background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }, onClick: () => {
      lsEditInitRef.current = null;
      setLsModal(null);
    } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 22, color: "var(--text-2)" } }, "close"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, background: "#EEF2FF", color: "var(--brand-navy)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "schedule"), lsForm.start_time, " \u2013 ", lsForm.end_time), lsForm.court_id && courts.find((c) => c.id === lsForm.court_id) && /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, background: "#EEF2FF", color: "var(--brand-navy)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "sports_tennis"), "Kort ", courts.find((c) => c.id === lsForm.court_id).court_number), /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, background: "#F1F5F9", color: "var(--text-2)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "calendar_today"), (/* @__PURE__ */ new Date(lsForm.date + "T12:00:00")).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })))), /* @__PURE__ */ React.createElement("div", { style: { overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 0, padding: "16px 20px" } }, lsModal?.type === "edit" && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "KORT & SAAT"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: lsForm.court_id || "",
        onChange: (e) => setLsForm((prev) => ({ ...prev, court_id: e.target.value })),
        style: { width: "100%", border: "1.5px solid var(--border)", borderRadius: 10, padding: "9px 12px", fontSize: 14, boxSizing: "border-box", marginBottom: 8 }
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "Kort se\xE7in"),
      courts.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, "Kort ", c.court_number))
    ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginBottom: 4 } }, "Ba\u015Flang\u0131\xE7"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: lsForm.start_time || "",
        onChange: (e) => setLsForm((prev) => ({ ...prev, start_time: e.target.value })),
        style: { width: "100%", border: "1.5px solid var(--border)", borderRadius: 10, padding: "9px 12px", fontSize: 14, boxSizing: "border-box" }
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginBottom: 4 } }, "Biti\u015F"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: lsForm.end_time || "",
        onChange: (e) => setLsForm((prev) => ({ ...prev, end_time: e.target.value })),
        style: { width: "100%", border: "1.5px solid var(--border)", borderRadius: 10, padding: "9px 12px", fontSize: 14, boxSizing: "border-box" }
      }
    )))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "OYUNCU"), lsSelectedPlayer || lsSelectedCustomer ? (
      /* Seçili kişi kartı */
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", border: "1.5px solid var(--brand-navy)", borderRadius: 12, padding: "11px 12px", marginBottom: 12, background: "#EEF2FF" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--brand-navy)" } }, lsSelectedCustomer?.full_name || lsSelectedPlayer?.full_name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: lsSelectedCustomer && !lsSelectedPlayer ? "#0891B2" : "var(--brand-navy)", borderRadius: 5, padding: "2px 6px", letterSpacing: 0.2 } }, lsSelectedCustomer && !lsSelectedPlayer ? "M\xFC\u015Fteri" : "\xDCye")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 1 } }, lsSelectedPlayer?.email || lsSelectedCustomer?.phone || lsSelectedCustomer?.email || ""), lsAutoCoachLoading && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--brand-navy)", marginTop: 2 } }, "Paket kontrol ediliyor...")), /* @__PURE__ */ React.createElement(
        "button",
        {
          style: { background: "none", border: "none", cursor: "pointer", padding: 4 },
          onClick: () => {
            setLsSelectedPlayer(null);
            setLsPlayerSearch("");
            setLsPlayerResults([]);
            setLsSelectedCustomer(null);
            setLsCustomerSearch("");
            setLsCustomerResults([]);
            setLsCourtyclubResults([]);
            setLsForm((prev) => ({ ...prev, student_name: "", player_id: null }));
            setLsPackages([]);
            setLsUsePkg(false);
            setLsSelectedPkgId(null);
          }
        },
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: "var(--text-2)" } }, "close")
      ))
    ) : quickAddCust === "lesson" ? (
      /* Inline hızlı müşteri ekleme */
      /* @__PURE__ */ React.createElement("div", { style: { border: "1.5px solid var(--brand-navy)", borderRadius: 12, padding: "12px 14px", background: "#F0F4FF", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--brand-navy)", marginBottom: 10 } }, "H\u0131zl\u0131 M\xFC\u015Fteri Ekle"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement(
        "input",
        {
          placeholder: "Ad Soyad *",
          value: quickAddForm.name,
          onChange: (e) => setQuickAddForm((p) => ({ ...p, name: e.target.value })),
          style: { border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text-1)", background: "#fff", boxSizing: "border-box", width: "100%" }
        }
      ), /* @__PURE__ */ React.createElement(
        "input",
        {
          placeholder: "Telefon *",
          value: quickAddForm.phone,
          onChange: (e) => setQuickAddForm((p) => ({ ...p, phone: e.target.value })),
          style: { border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text-1)", background: "#fff", boxSizing: "border-box", width: "100%" }
        }
      ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setQuickAddCust(null),
          style: { flex: 1, padding: "9px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-2)" }
        },
        "\u0130ptal"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: saveQuickCust,
          disabled: quickAddSaving,
          style: { flex: 2, padding: "9px", borderRadius: 10, border: "none", background: "var(--brand-navy)", color: "#fff", cursor: quickAddSaving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }
        },
        quickAddSaving ? "Ekleniyor\u2026" : "Ekle ve Se\xE7"
      ))))
    ) : (
      /* Birleşik arama kutusu */
      /* @__PURE__ */ React.createElement("div", { style: { position: "relative", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
        "input",
        {
          style: { flex: 1, border: "1.5px solid var(--border)", borderRadius: 12, padding: "11px 12px", fontSize: 14, color: "var(--text-1)", background: "var(--bg)", boxSizing: "border-box" },
          placeholder: "Ad, telefon veya e-posta ile ara...",
          value: lsPlayerSearch,
          onChange: (e) => searchLsPerson(e.target.value)
        }
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          style: { width: 42, height: 42, borderRadius: 12, border: "1.5px solid var(--brand-navy)", background: "var(--brand-navy)", color: "#fff", cursor: "pointer", flexShrink: 0, display: "grid", placeItems: "center" },
          title: "Yeni m\xFC\u015Fteri ekle",
          onClick: () => {
            setQuickAddForm({ name: "", phone: "" });
            setQuickAddCust("lesson");
          }
        },
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 20 } }, "person_add")
      )), (lsPlayerResults.length > 0 || lsCustomerResults.length > 0 || lsCourtyclubResults.length > 0) && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden", marginTop: 4 } }, lsPlayerResults.map((p) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: "m-" + p.id,
          style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" },
          onMouseDown: () => {
            setLsSelectedPlayer(p);
            setLsForm((prev) => ({ ...prev, student_name: p.full_name, player_id: p.id }));
            setLsPlayerSearch("");
            setLsPlayerResults([]);
            setLsCustomerResults([]);
            setLsCourtyclubResults([]);
          }
        },
        /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)" } }, p.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, p.email)),
        /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: "var(--brand-navy)", borderRadius: 5, padding: "2px 6px", flexShrink: 0, marginLeft: 8 } }, "\xDCye")
      )), lsCustomerResults.map((c) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: "c-" + c.id,
          style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" },
          onMouseDown: () => {
            setLsSelectedCustomer(c);
            setLsForm((prev) => ({ ...prev, student_name: c.full_name, player_id: c.user_id || null }));
            setLsPlayerSearch("");
            setLsPlayerResults([]);
            setLsCustomerResults([]);
            setLsCourtyclubResults([]);
            if (c.user_id) setLsSelectedPlayer({ id: c.user_id, full_name: c.full_name, email: c.email });
          }
        },
        /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)" } }, c.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, c.phone || c.email || "")),
        /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: "#0891B2", borderRadius: 5, padding: "2px 6px", flexShrink: 0, marginLeft: 8 } }, "M\xFC\u015Fteri")
      )), lsCourtyclubResults.map((p) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: "cc-" + p.id,
          style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" },
          onMouseDown: () => {
            setLsSelectedPlayer({ id: p.id, full_name: p.full_name, email: p.email });
            setLsForm((prev) => ({ ...prev, student_name: p.full_name, player_id: p.id }));
            setLsPlayerSearch("");
            setLsPlayerResults([]);
            setLsCustomerResults([]);
            setLsCourtyclubResults([]);
          }
        },
        /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)" } }, p.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, p.phone || p.email || "")),
        /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: "#22C55E", borderRadius: 5, padding: "2px 6px", flexShrink: 0, marginLeft: 8 } }, "CourtyClub \xDCyesi")
      ))))
    ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "ANTREN\xD6R"), coachesList.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 14, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--border)", textAlign: "center", color: "var(--text-2)", fontSize: 13, marginBottom: 14 } }, "Hen\xFCz antren\xF6r eklenmemi\u015F.") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 } }, coachesList.map((c) => {
      const isAuto = lsAutoCoachLoading && !lsForm.coach_id;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: c.id,
          style: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 12, border: lsForm.coach_id === c.id ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)", background: lsForm.coach_id === c.id ? "#EEF2FF" : "var(--bg)", cursor: "pointer", opacity: isAuto ? 0.6 : 1 },
          onClick: () => setLsForm({ ...lsForm, coach_id: c.id })
        },
        /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: 16, background: "rgba(0,51,153,0.12)", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" } }, c.full_name.charAt(0).toUpperCase())),
        /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 13, color: "var(--text-1)", fontWeight: lsForm.coach_id === c.id ? 700 : 500 } }, c.full_name),
        lsForm.coach_id === c.id && /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: "var(--brand-navy)" } }, "check_circle")
      );
    })), (lsSelectedPlayer || lsSelectedCustomer || lsPackages.length > 0) && lsForm.coach_id && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, lsLoadingPkgs ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", padding: "6px 0" } }, "Paketler y\xFCkleniyor...") : lsPackages.length > 0 ? /* @__PURE__ */ React.createElement("div", { style: { border: `1.5px solid ${lsUsePkg ? "var(--brand-navy)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: lsUsePkg ? "#EEF2FF" : "var(--bg)", borderBottom: "1.5px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 17, color: lsUsePkg ? "var(--brand-navy)" : "var(--text-2)" } }, "inventory_2"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: lsUsePkg ? "var(--brand-navy)" : "var(--text-1)" } }, "Paketi Kullan"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, lsPackages.length, " aktif paket \xB7 kapal\u0131ysa normal ders gibi kaydedilir"))), /* @__PURE__ */ React.createElement(
      "div",
      {
        style: { width: 44, height: 24, borderRadius: 12, background: lsUsePkg ? "var(--brand-navy)" : "#CBD5E1", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 },
        onClick: () => {
          const next = !lsUsePkg;
          setLsUsePkg(next);
          setLsForm((prev) => ({ ...prev, amount: next ? "0" : "", payment_status: next ? "paid" : "unpaid" }));
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { width: 18, height: 18, borderRadius: 9, background: "#fff", position: "absolute", top: 3, left: lsUsePkg ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" } })
    )), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 14px", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 8 } }, lsPackages.map((pkg) => {
      const remaining = (pkg.total_lessons || 0) - (pkg.used_lessons || 0);
      const isSelected = lsSelectedPkgId === pkg.id;
      const expiry = pkg.expiry_date ? new Date(pkg.expiry_date).toLocaleDateString("tr-TR") : null;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: pkg.id,
          onClick: () => {
            if (!lsUsePkg) return;
            setLsSelectedPkgId(pkg.id);
            if (pkg.coach_id) {
              const cr = coachesList.find((c) => c.individual_coach_id === pkg.coach_id);
              if (cr) setLsForm((prev) => ({ ...prev, coach_id: cr.id }));
            }
          },
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderRadius: 10,
            border: isSelected && lsUsePkg ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)",
            background: isSelected && lsUsePkg ? "#EEF2FF" : "var(--bg)",
            cursor: lsUsePkg ? "pointer" : "default",
            opacity: lsUsePkg ? 1 : 0.55
          }
        },
        /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: isSelected && lsUsePkg ? "var(--brand-navy)" : "var(--text-1)" } }, pkg.package_name || "Ders Paketi"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, color: remaining <= 2 ? "#EF4444" : "#059669" } }, remaining, " ders kald\u0131"), ` / ${pkg.total_lessons} toplam`, expiry ? ` \xB7 Son: ${expiry}` : "")),
        isSelected && lsUsePkg && /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: "var(--brand-navy)" } }, "check_circle")
      );
    }), lsUsePkg && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#059669", fontWeight: 600, paddingTop: 2 } }, "Ders \xFCcreti 0 \u20BA olarak kaydedilecek, \xF6demesi paket sat\u0131\u015F\u0131nda al\u0131nd\u0131."))) : null), !lsUsePkg && lsPriceMode === "normal" ? /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16, opacity: lsUsePkg ? 0.7 : 1, pointerEvents: lsUsePkg ? "none" : "auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 6, letterSpacing: 0.4 } }, "HOCA HAKED\u0130\u015E\u0130 (\u20BA)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 12, background: "var(--bg)", paddingLeft: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--text-2)", marginRight: 3 } }, "\u20BA"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "0",
        step: "0.01",
        style: { flex: 1, border: "none", background: "transparent", padding: "11px 8px 11px 0", fontSize: 14, color: "var(--text-1)", outline: "none" },
        placeholder: "0,00",
        value: lsCoachAmount,
        onChange: (e) => setLsCoachAmount(e.target.value)
      }
    ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 6, letterSpacing: 0.4 } }, "KUL\xDCP PAYI (\u20BA)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 12, background: "var(--bg)", paddingLeft: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--text-2)", marginRight: 3 } }, "\u20BA"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "0",
        step: "0.01",
        style: { flex: 1, border: "none", background: "transparent", padding: "11px 8px 11px 0", fontSize: 14, color: "var(--text-1)", outline: "none" },
        placeholder: "0,00",
        value: lsClubAmount,
        onChange: (e) => setLsClubAmount(e.target.value)
      }
    )))), (() => {
      const total = (parseFloat(lsCoachAmount) || 0) + (parseFloat(lsClubAmount) || 0);
      if (total <= 0) return null;
      return /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--text-2)", textAlign: "right" } }, "Toplam: ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-1)", fontWeight: 800 } }, "\u20BA", total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })));
    })()) : !lsUsePkg ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "DERS \xDCCRET\u0130 (opsiyonel)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 12, background: "var(--bg)", paddingLeft: 12, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, fontWeight: 700, color: "var(--text-2)", marginRight: 4 } }, "\u20BA"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "0",
        step: "0.01",
        style: { flex: 1, border: "none", background: "transparent", padding: "11px 12px 11px 0", fontSize: 15, color: "var(--text-1)", outline: "none" },
        placeholder: "0,00",
        value: lsForm.amount || "",
        onChange: (e) => setLsForm({ ...lsForm, amount: e.target.value })
      }
    ))) : null, !lsUsePkg && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "\xD6DEME MODEL\u0130"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { flex: 1, padding: "9px", borderRadius: 10, border: lsPriceMode === "normal" ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)", background: lsPriceMode === "normal" ? "#EEF2FF" : "var(--bg)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: lsPriceMode === "normal" ? "var(--brand-navy)" : "var(--text-2)" },
        onClick: () => {
          setLsPriceMode("normal");
          setLsForm((prev) => ({ ...prev, payment_status: "unpaid" }));
        }
      },
      "\xD6zel Fiyat"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { flex: 1, padding: "9px", borderRadius: 10, border: lsPriceMode === "split" ? "1.5px solid #7C3AED" : "1.5px solid var(--border)", background: lsPriceMode === "split" ? "#F5F3FF" : "var(--bg)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: lsPriceMode === "split" ? "#7C3AED" : "var(--text-2)" },
        onClick: () => setLsPriceMode("split")
      },
      "Pay Modeli"
    )), lsPriceMode === "split" && (() => {
      const coachRec = !lsForm.use_manual_coach ? coachesList.find((c) => c.id === lsForm.coach_id) : null;
      const payRate = coachRec?.coach_pay_rate ?? 0;
      const totalAmt = lsForm.amount ? parseFloat(String(lsForm.amount).replace(",", ".")) : 0;
      const coachEarning = payRate > 0 ? Math.round(totalAmt * (payRate / 100) * 100) / 100 : 0;
      const clubEarning = payRate > 0 ? Math.round((totalAmt - coachEarning) * 100) / 100 : 0;
      return /* @__PURE__ */ React.createElement("div", { style: { borderRadius: 12, border: "1.5px solid #DDD6FE", background: "#F5F3FF", padding: "12px 14px", marginBottom: 12 } }, !coachRec ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#7C3AED" } }, "Listeden bir hoca se\xE7in.") : payRate === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#7C3AED" } }, "Bu hocan\u0131n pay oran\u0131 tan\u0131ml\u0131 de\u011Fil. Ekip y\xF6netiminden pay oran\u0131 girin.") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#7C3AED", marginBottom: 6 } }, coachRec.full_name, " \xB7 Pay Oran\u0131 %", payRate), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, background: "#fff", borderRadius: 8, padding: "8px 10px", border: "1px solid #DDD6FE" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text-2)", fontWeight: 600 } }, "HOCA HAKED\u0130\u015E\u0130"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, color: "#7C3AED" } }, "\u20BA", coachEarning.toLocaleString("tr-TR"))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, background: "#fff", borderRadius: 8, padding: "8px 10px", border: "1px solid #DDD6FE" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text-2)", fontWeight: 600 } }, "KUL\xDCP PAYI"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, color: "var(--brand-navy)" } }, "\u20BA", clubEarning.toLocaleString("tr-TR")))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#059669", fontWeight: 600, marginTop: 8 } }, "Kay\u0131t an\u0131nda otomatik ayr\u0131\u015Ft\u0131r\u0131l\u0131r, kort \xFCcreti eklenmez.")));
    })()), !lsUsePkg && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "\xD6DEME DURUMU"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 20 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", borderRadius: 12, border: (lsForm.payment_status || "unpaid") === "unpaid" ? "1.5px solid #F59E0B" : "1.5px solid var(--border)", background: (lsForm.payment_status || "unpaid") === "unpaid" ? "#FEF3C7" : "var(--bg)", cursor: "pointer" },
        onClick: () => setLsForm({ ...lsForm, payment_status: "unpaid" })
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: (lsForm.payment_status || "unpaid") === "unpaid" ? "#F59E0B" : "var(--text-2)" } }, "schedule"),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: (lsForm.payment_status || "unpaid") === "unpaid" ? "#F59E0B" : "var(--text-2)" } }, "\xD6denmedi")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", borderRadius: 12, border: lsForm.payment_status === "paid" ? "1.5px solid #22C55E" : "1.5px solid var(--border)", background: lsForm.payment_status === "paid" ? "#DCFCE7" : "var(--bg)", cursor: "pointer" },
        onClick: () => setLsForm({ ...lsForm, payment_status: "paid" })
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: lsForm.payment_status === "paid" ? "#22C55E" : "var(--text-2)" } }, "check_circle"),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: lsForm.payment_status === "paid" ? "#22C55E" : "var(--text-2)" } }, "\xD6dendi")
    ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "NOT (opsiyonel)"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        style: { width: "100%", border: "1.5px solid var(--border)", borderRadius: 12, padding: "11px 12px", fontSize: 15, color: "var(--text-1)", background: "var(--bg)", boxSizing: "border-box", minHeight: 72, resize: "vertical", marginBottom: 16 },
        placeholder: "Ders hakk\u0131nda not...",
        value: lsForm.notes || "",
        onChange: (e) => setLsForm({ ...lsForm, notes: e.target.value })
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { width: "100%", background: "var(--brand-navy)", color: "#fff", border: "none", borderRadius: 14, padding: "15px", fontSize: 15, fontWeight: 800, cursor: lsSaving ? "not-allowed" : "pointer", opacity: lsSaving ? 0.6 : 1 },
        onClick: saveNewLesson,
        disabled: lsSaving
      },
      lsSaving ? "Kaydediliyor..." : lsModal?.type === "edit" ? "De\u011Fi\u015Fiklikleri Kaydet" : "Dersi Kaydet"
    )))
  ), grpModal && slotClickInfo && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1250, display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: (e) => {
        if (e.target === e.currentTarget && !grpSaving) {
          setGrpModal(null);
          setSlotClickInfo(null);
        }
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 20, width: "min(480px,95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 800, color: "var(--text-1)" } }, "Grup Dersi Ekle"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", marginTop: 2 } }, slotClickInfo.courtIds.map((id) => {
      const c = courts.find((x) => x.id === id);
      return c ? `Kort ${c.court_number}` : "";
    }).join(", "), " \xB7 ", String(slotClickInfo.startHour).padStart(2, "0"), ":", String(slotClickInfo.startMinute || 0).padStart(2, "0"), " \u2013 ", String(slotClickInfo.endHour).padStart(2, "0"), ":", String(slotClickInfo.endMinute || 0).padStart(2, "0"), " \xB7 ", (/* @__PURE__ */ new Date(selDate + "T12:00:00")).toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" }))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setGrpModal(null);
          setSlotClickInfo(null);
        },
        disabled: grpSaving,
        style: { background: "none", border: "none", cursor: "pointer", padding: 8 }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--text-2)" } }, "close")
    )), /* @__PURE__ */ React.createElement("div", { style: { overflowY: "auto", flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 20 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 10, letterSpacing: 0.4 } }, "EKLEME T\xDCR\xDC"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [{ v: false, label: "Bu Seferlik", icon: "today", desc: "Sadece bu tarih i\xE7in" }, { v: true, label: "Kal\u0131c\u0131", icon: "repeat", desc: "Her hafta tekrarlan\u0131r" }].map(({ v, label, icon, desc }) => {
      const sel = grpIsRecurring === v;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: String(v),
          onClick: () => setGrpIsRecurring(v),
          style: { flex: 1, padding: "12px 14px", borderRadius: 14, border: sel ? "2px solid #0891B2" : "1.5px solid var(--border)", background: sel ? "#E0F7FA" : "var(--bg)", cursor: "pointer", transition: "all 0.12s" }
        },
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 17, color: sel ? "#0891B2" : "var(--text-2)" } }, icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: sel ? "#0E7490" : "var(--text-1)" } }, label)),
        /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, desc)
      );
    }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 10, letterSpacing: 0.4 } }, "GRUP"), grpGroups.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 20, textAlign: "center", color: "var(--text-2)", fontSize: 13 } }, "Aktif grup bulunamad\u0131.") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, grpGroups.map((g) => {
      const sel = grpSelectedId === g.id;
      const coach = coachesList.find((c) => c.id === g.coach_id);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: g.id,
          onClick: () => setGrpSelectedId(sel ? "" : g.id),
          style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: sel ? "2px solid #0891B2" : "1.5px solid var(--border)", background: sel ? "#E0F7FA" : "var(--bg)", cursor: "pointer", transition: "all 0.12s" }
        },
        /* @__PURE__ */ React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: sel ? "#0891B2" : "#E2E8F0", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: sel ? "#fff" : "var(--text-2)" } }, "groups")),
        /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: sel ? "#0E7490" : "var(--text-1)" } }, g.name), coach && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 1 } }, coach.full_name)),
        sel && /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "#0891B2", fontSize: 20 } }, "check_circle")
      );
    }))), grpSelectedId && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 10, letterSpacing: 0.4 } }, "DERSE G\u0130RECEK HOCALAR", grpLoadingDetails && /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, marginLeft: 8 } }, "y\xFCkleniyor\u2026")), !grpLoadingDetails && grpGroupCoaches.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)" } }, "Bu gruba tan\u0131ml\u0131 hoca yok."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, grpGroupCoaches.map((gc) => {
      const checked = grpSelectedCoaches.has(gc.coach_id);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: gc.coach_id,
          onClick: () => {
            setGrpSelectedCoaches((prev) => {
              const next = new Set(prev);
              checked ? next.delete(gc.coach_id) : next.add(gc.coach_id);
              return next;
            });
          },
          style: { display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: "1.5px solid var(--border)", background: checked ? "#F0FDF4" : "var(--bg)", cursor: "pointer", transition: "all 0.1s" }
        },
        /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: 50, background: checked ? "#16A34A" : "#E2E8F0", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: checked ? "#fff" : "var(--text-2)" } }, "person")),
        /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-1)" } }, gc.full_name),
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 20, color: checked ? "#16A34A" : "#CBD5E1" } }, checked ? "check_box" : "check_box_outline_blank")
      );
    }))), grpSelectedId && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 6, letterSpacing: 0.4 } }, "DERSE GELECEKLEr (KATILIM)", grpLoadingDetails && /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, marginLeft: 8 } }, "y\xFCkleniyor\u2026")), !grpLoadingDetails && grpMembers.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setGrpSelectedMembers(new Set(grpMembers.map((m) => m.id))),
        style: { fontSize: 12, fontWeight: 600, color: "#16A34A", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }
      },
      "T\xFCm\xFCn\xFC Se\xE7"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setGrpSelectedMembers(/* @__PURE__ */ new Set()),
        style: { fontSize: 12, fontWeight: 600, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }
      },
      "Temizle"
    )), !grpLoadingDetails && grpMembers.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)" } }, "Bu grupta \xFCye yok."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, grpMembers.map((m) => {
      const checked = grpSelectedMembers.has(m.id);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: m.id,
          onClick: () => {
            setGrpSelectedMembers((prev) => {
              const next = new Set(prev);
              checked ? next.delete(m.id) : next.add(m.id);
              return next;
            });
          },
          style: { display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: "1.5px solid var(--border)", background: checked ? "#F0FDF4" : "#FEF2F2", cursor: "pointer", transition: "all 0.1s" }
        },
        /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: 50, background: checked ? "#16A34A" : "#FCA5A5", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 800, color: "#fff" } }, (m.member_name || "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase())),
        /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-1)" } }, m.member_name),
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 20, color: checked ? "#16A34A" : "#CBD5E1" } }, checked ? "check_box" : "check_box_outline_blank")
      );
    })))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, padding: "16px 20px", borderTop: "1px solid var(--border)", flexShrink: 0 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setGrpModal(null);
          setSlotClickInfo(null);
        },
        disabled: grpSaving,
        style: { flex: 1, padding: "13px", borderRadius: 14, border: "1.5px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--text-2)" }
      },
      "\u0130ptal"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: saveGroupLesson,
        disabled: !grpSelectedId || grpSaving || grpLoadingDetails,
        style: { flex: 2, padding: "13px", borderRadius: 14, border: "none", cursor: !grpSelectedId || grpSaving || grpLoadingDetails ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 800, color: "#fff", background: !grpSelectedId || grpSaving || grpLoadingDetails ? "#94a3b8" : "#0891B2" }
      },
      grpSaving ? "Kaydediliyor..." : grpIsRecurring ? "Kal\u0131c\u0131 Ekle" : "Bu Seferlik Ekle"
    )))
  ), bookingModal && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: (e) => {
        if (e.target === e.currentTarget && !bookingSaving) {
          setBookingModal(false);
          setSlotClickInfo(null);
        }
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 20, width: "min(480px,95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 17, fontWeight: 800, color: "var(--text-1)" } }, "Yeni Rezervasyon"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setBookingModal(false);
          setSlotClickInfo(null);
        },
        disabled: bookingSaving,
        style: { background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 22, color: "var(--text-2)" } }, "close")
    )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, background: "#EEF2FF", color: "var(--brand-navy)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "schedule"), bookingForm.startTime, " \u2013 ", bookingForm.endTime), bookingForm.courtId && courts.find((c) => c.id === bookingForm.courtId) && /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, background: "#EEF2FF", color: "var(--brand-navy)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "sports_tennis"), "Kort ", courts.find((c) => c.id === bookingForm.courtId).court_number), /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, background: "#F1F5F9", color: "var(--text-2)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "calendar_today"), (/* @__PURE__ */ new Date((bookingForm.date || "") + "T12:00:00")).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })))), /* @__PURE__ */ React.createElement("div", { style: { overflowY: "auto", flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "OYUNCU"), bookingMemberName || bookingCustomerName ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", border: "1.5px solid var(--brand-navy)", borderRadius: 12, padding: "10px 12px", background: "#EEF2FF" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--brand-navy)" } }, bookingMemberName || bookingCustomerName), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: bookingPersonMode === "member" ? "var(--brand-navy)" : "#0891B2", borderRadius: 5, padding: "2px 6px" } }, bookingPersonMode === "member" ? "\xDCye" : "M\xFC\u015Fteri")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setBookingMemberId(null);
          setBookingMemberName("");
          setBookingMemberQuery("");
          setBookingMemberResults([]);
          setBookingCustomerId(null);
          setBookingCustomerName("");
          setBookingCustomerQuery("");
          setBookingCustomerResults([]);
          setBookingCourtyclubResults([]);
        },
        style: { background: "none", border: "none", cursor: "pointer", padding: 4, display: "grid", placeItems: "center" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: "var(--text-2)" } }, "close")
    )) : quickAddCust === "booking" ? /* @__PURE__ */ React.createElement("div", { style: { border: "1.5px solid var(--brand-navy)", borderRadius: 12, padding: "12px 14px", background: "#F0F4FF" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--brand-navy)", marginBottom: 10 } }, "H\u0131zl\u0131 M\xFC\u015Fteri Ekle"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "Ad Soyad *",
        value: quickAddForm.name,
        onChange: (e) => setQuickAddForm((p) => ({ ...p, name: e.target.value })),
        style: { border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text-1)", background: "#fff", boxSizing: "border-box", width: "100%" }
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "Telefon *",
        value: quickAddForm.phone,
        onChange: (e) => setQuickAddForm((p) => ({ ...p, phone: e.target.value })),
        style: { border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text-1)", background: "#fff", boxSizing: "border-box", width: "100%" }
      }
    ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setQuickAddCust(null),
        style: { flex: 1, padding: "9px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-2)" }
      },
      "\u0130ptal"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: saveQuickCust,
        disabled: quickAddSaving,
        style: { flex: 2, padding: "9px", borderRadius: 10, border: "none", background: "var(--brand-navy)", color: "#fff", cursor: quickAddSaving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }
      },
      quickAddSaving ? "Ekleniyor\u2026" : "Ekle ve Se\xE7"
    )))) : /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "Ad, telefon veya e-posta ile ara...",
        value: bookingMemberQuery,
        onChange: (e) => searchBookingPerson(e.target.value),
        style: { flex: 1, border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 14, boxSizing: "border-box", color: "var(--text-1)", background: "var(--bg)" }
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        style: { width: 42, height: 42, borderRadius: 12, border: "1.5px solid var(--brand-navy)", background: "var(--brand-navy)", color: "#fff", cursor: "pointer", flexShrink: 0, display: "grid", placeItems: "center" },
        title: "Yeni m\xFC\u015Fteri ekle",
        onClick: () => {
          setQuickAddForm({ name: "", phone: "" });
          setQuickAddCust("booking");
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 20 } }, "person_add")
    )), (bookingMemberResults.length > 0 || bookingCustomerResults.length > 0 || bookingCourtyclubResults.length > 0) && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden", marginTop: 4 } }, bookingMemberResults.map((m) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: "p-" + m.id,
        style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" },
        onMouseDown: () => {
          setBookingMemberId(m.id);
          setBookingMemberName(m.full_name);
          setBookingPersonMode("member");
          setBookingMemberQuery("");
          setBookingMemberResults([]);
          setBookingCustomerResults([]);
          setBookingCourtyclubResults([]);
        }
      },
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)" } }, m.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, m.email)),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: "var(--brand-navy)", borderRadius: 5, padding: "2px 6px", flexShrink: 0, marginLeft: 8 } }, "\xDCye")
    )), bookingCustomerResults.map((c) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: "c-" + c.id,
        style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" },
        onMouseDown: () => {
          setBookingCustomerId(c.id);
          setBookingCustomerName(c.full_name);
          setBookingPersonMode("customer");
          if (c.user_id) {
            setBookingMemberId(c.user_id);
            setBookingMemberName(c.full_name);
          }
          setBookingMemberQuery("");
          setBookingMemberResults([]);
          setBookingCustomerResults([]);
          setBookingCourtyclubResults([]);
        }
      },
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)" } }, c.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, c.phone || c.email || "")),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: "#0891B2", borderRadius: 5, padding: "2px 6px", flexShrink: 0, marginLeft: 8 } }, "M\xFC\u015Fteri")
    )), bookingCourtyclubResults.map((p) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: "cc-" + p.id,
        style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" },
        onMouseDown: () => {
          setBookingMemberId(p.id);
          setBookingMemberName(p.full_name);
          setBookingPersonMode("member");
          setBookingMemberQuery("");
          setBookingMemberResults([]);
          setBookingCustomerResults([]);
          setBookingCourtyclubResults([]);
        }
      },
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)" } }, p.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, p.phone || p.email || "")),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: "#22C55E", borderRadius: 5, padding: "2px 6px", flexShrink: 0, marginLeft: 8 } }, "CourtyClub \xDCyesi")
    ))))), bookingForm.courtId && (() => {
      const court = courts.find((c) => c.id === bookingForm.courtId);
      const dh = bookingForm.duration || 1;
      const calcAmt = Math.round((court?.hourly_rate || 0) * dh * 100) / 100;
      const fmtD = (d) => d === 0.25 ? "15 dk" : d === 0.5 ? "30 dk" : d === 0.75 ? "45 dk" : d === 1.5 ? "1,5 saat" : `${d} saat`;
      return /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", borderRadius: 14, padding: "16px 18px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 12, letterSpacing: 0.4 } }, "REZERVASYON \xD6ZET\u0130"), [
        { label: "Tarih", value: (/* @__PURE__ */ new Date((bookingForm.date || "") + "T12:00:00")).toLocaleDateString("tr-TR") },
        { label: "Saat", value: `${bookingForm.startTime} \u2013 ${bookingForm.endTime}` },
        { label: "S\xFCre", value: fmtD(dh) },
        { label: "Kort", value: `Kort ${court?.court_number}` },
        ...bookingMemberName || bookingCustomerName ? [{ label: "Oyuncu", value: bookingMemberName || bookingCustomerName }] : []
      ].map(({ label, value }) => /* @__PURE__ */ React.createElement("div", { key: label, style: { display: "flex", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-2)" } }, label, ":"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--text-1)" } }, value))), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--text-1)" } }, "Kort \xDCcreti (\u20BA):"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          min: "0",
          step: "0.01",
          value: bookingPriceOverride,
          onChange: (e) => setBookingPriceOverride(e.target.value),
          placeholder: calcAmt.toFixed(2),
          style: { width: 130, border: "1.5px solid var(--border)", borderRadius: 8, padding: "5px 10px", fontSize: 16, fontWeight: 800, color: "var(--brand-navy)", textAlign: "right", background: "#fff", outline: "none" }
        }
      )), bookingPriceOverride && parseFloat(bookingPriceOverride) !== calcAmt && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, fontSize: 11, color: "var(--text-2)", textAlign: "right" } }, "Saatlik \xFCcret: \u20BA", calcAmt.toFixed(2)));
    })()), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border)", flexShrink: 0 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setBookingModal(false);
          setSlotClickInfo(null);
        },
        disabled: bookingSaving,
        style: { flex: 1, padding: "13px", borderRadius: 14, border: "1.5px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--text-2)" }
      },
      "\u0130ptal"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: saveInlineBooking,
        disabled: !bookingForm.courtId || bookingSaving || bookingCourtsLoading,
        style: { flex: 2, padding: "13px", borderRadius: 14, border: "none", cursor: !bookingForm.courtId || bookingSaving || bookingCourtsLoading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, color: "#fff", background: !bookingForm.courtId || bookingSaving || bookingCourtsLoading ? "#94a3b8" : "var(--brand-navy)" }
      },
      bookingSaving ? "Kaydediliyor..." : "Rezervasyon Olu\u015Ftur"
    )))
  ));
}
const CAFE_CATEGORIES = ["\u0130\xE7ecek", "Yiyecek", "Sporcu \xDCr\xFCn\xFC", "Ekipman", "Di\u011Fer"];
function CafeScreen({ clubId }) {
  const { useState, useEffect, useMemo } = React;
  const [tab, setTab] = useState("products");
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingS, setLoadingS] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [catFilter, setCatFilter] = useState("all");
  const [cart, setCart] = useState({});
  const [saleNote, setSaleNote] = useState("");
  useEffect(() => {
    if (clubId) loadProducts();
  }, [clubId]);
  useEffect(() => {
    if (clubId && tab === "sales") loadSales();
  }, [clubId, tab]);
  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await sb.from("cafe_products").select("*").eq("club_id", clubId).order("category").order("name");
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const loadSales = async () => {
    setLoadingS(true);
    try {
      const { data } = await sb.from("cafe_sales").select("*, items:cafe_sale_items(*)").eq("club_id", clubId).order("created_at", { ascending: false }).limit(100);
      setSales(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingS(false);
    }
  };
  const saveProduct = async () => {
    if (!form.name?.trim()) {
      alert("\xDCr\xFCn ad\u0131 zorunludur.");
      return;
    }
    if (form.price === "" || form.price == null) {
      alert("Fiyat zorunludur.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category || "Di\u011Fer",
        price: parseFloat(form.price) || 0,
        is_available: form.is_available !== false,
        stock_quantity: form.stock_quantity !== "" && form.stock_quantity != null ? parseInt(form.stock_quantity) : null
      };
      if (form.id) {
        await sb.from("cafe_products").update(payload).eq("id", form.id);
      } else {
        await sb.from("cafe_products").insert({ club_id: clubId, ...payload });
      }
      setModal(null);
      loadProducts();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const delProduct = async (id) => {
    if (!confirm("Bu \xFCr\xFCn\xFC silmek istedi\u011Finize emin misiniz?")) return;
    await sb.from("cafe_products").delete().eq("id", id);
    loadProducts();
  };
  const toggleAvail = async (item) => {
    await sb.from("cafe_products").update({ is_available: !item.is_available }).eq("id", item.id);
    loadProducts();
  };
  const cartItems = useMemo(
    () => Object.entries(cart).filter(([, qty]) => qty > 0).map(([id, qty]) => {
      const p = items.find((i) => i.id === id);
      return p ? { product: p, qty, subtotal: p.price * qty } : null;
    }).filter(Boolean),
    [cart, items]
  );
  const cartTotal = useMemo(() => cartItems.reduce((s, ci) => s + ci.subtotal, 0), [cartItems]);
  const setQty = (productId, delta) => {
    setCart((prev) => {
      const cur = prev[productId] || 0;
      const next = Math.max(0, cur + delta);
      const product = items.find((i) => i.id === productId);
      if (delta > 0 && product?.stock_quantity != null && next > product.stock_quantity) return prev;
      return { ...prev, [productId]: next };
    });
  };
  const completeSale = async () => {
    if (cartItems.length === 0) {
      alert("Sepet bo\u015F.");
      return;
    }
    setSaving(true);
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const { data: sale, error: sErr } = await sb.from("cafe_sales").insert({
        club_id: clubId,
        total_amount: cartTotal,
        notes: saleNote.trim() || null,
        sale_date: today
      }).select().single();
      if (sErr) throw sErr;
      const saleItems = cartItems.map((ci) => ({
        sale_id: sale.id,
        product_id: ci.product.id,
        product_name: ci.product.name,
        unit_price: ci.product.price,
        quantity: ci.qty,
        subtotal: ci.subtotal
      }));
      const { error: iErr } = await sb.from("cafe_sale_items").insert(saleItems);
      if (iErr) throw iErr;
      await sb.from("club_finances").insert({
        club_id: clubId,
        type: "income",
        category: "Kafe Geliri",
        amount: cartTotal,
        description: saleNote.trim() ? `Kafe Sat\u0131\u015F\u0131 \u2014 ${saleNote.trim()}` : "Kafe Sat\u0131\u015F\u0131",
        date: today
      });
      await Promise.all(
        cartItems.filter((ci) => ci.product.stock_quantity != null).map(
          (ci) => sb.rpc("decrement_cafe_stock", { p_product_id: ci.product.id, p_qty: ci.qty })
        )
      );
      setModal(null);
      setCart({});
      setSaleNote("");
      loadProducts();
      if (tab === "sales") loadSales();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const categories = useMemo(() => ["all", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))], [items]);
  const filtered = catFilter === "all" ? items : items.filter((i) => i.category === catFilter);
  const availableForSale = useMemo(() => items.filter((i) => i.is_available), [items]);
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Kafe / Market"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, items.length, " \xFCr\xFCn \xB7 ", items.filter((i) => i.is_available).length, " sat\u0131\u015Fta")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => {
    setCart({});
    setSaleNote("");
    setModal("sale");
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "point_of_sale"), " Sat\u0131\u015F Yap"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: () => {
    setForm({ is_available: true, category: "\u0130\xE7ecek" });
    setModal("add_product");
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), " \xDCr\xFCn Ekle"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 0 } }, [{ key: "products", label: "\xDCr\xFCnler" }, { key: "sales", label: "Sat\u0131\u015F Ge\xE7mi\u015Fi" }].map((t) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: t.key,
      onClick: () => setTab(t.key),
      style: {
        padding: "8px 18px",
        fontWeight: 600,
        fontSize: 13,
        background: "none",
        border: "none",
        cursor: "pointer",
        borderBottom: tab === t.key ? "2px solid var(--brand-navy)" : "2px solid transparent",
        color: tab === t.key ? "var(--brand-navy)" : "var(--text-2)"
      }
    },
    t.label
  ))), tab === "products" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 } }, categories.map((cat) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: cat,
      className: `btn btn-sm ${catFilter === cat ? "btn-pri" : "btn-ghost"}`,
      onClick: () => setCatFilter(cat)
    },
    cat === "all" ? "T\xFCm\xFC" : cat
  ))), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : filtered.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "local_cafe", title: "\xDCr\xFCn bulunamad\u0131", sub: "Kafe & market \xFCr\xFCnlerinizi ekleyin." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 } }, filtered.map((item) => {
    const lowStock = item.stock_quantity != null && item.stock_quantity <= 3;
    return /* @__PURE__ */ React.createElement("div", { key: item.id, className: "card", style: { opacity: item.is_available ? 1 : 0.55 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, item.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2 } }, item.category)), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 18, color: "var(--brand-navy)" } }, fmtMoney(item.price))), item.stock_quantity != null && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: lowStock ? "#EF4444" : "#22C55E" } }, "inventory_2"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: lowStock ? "#EF4444" : "var(--text-2)" } }, "Stok: ", item.stock_quantity, " ", lowStock ? "(Az kald\u0131!)" : "")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 12 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn btn-ghost btn-sm",
        style: { flex: 1 },
        onClick: () => {
          setForm({ ...item, stock_quantity: item.stock_quantity ?? "" });
          setModal("edit_product");
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "edit")
    ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { flex: 1 }, onClick: () => toggleAvail(item) }, item.is_available ? "Durdur" : "Aktif Et"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => delProduct(item.id) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "delete"))));
  }))), tab === "sales" && (loadingS ? /* @__PURE__ */ React.createElement(Spinner, null) : sales.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "receipt_long", title: "Sat\u0131\u015F kayd\u0131 yok", sub: "Sat\u0131\u015F yapt\u0131k\xE7a burada g\xF6r\xFCn\xFCr." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, sales.map((sale) => /* @__PURE__ */ React.createElement("div", { key: sale.id, className: "card", style: { padding: "14px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14 } }, sale.sale_date), sale.notes && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)", marginLeft: 10 } }, sale.notes)), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 800, fontSize: 16, color: "var(--brand-navy)" } }, fmtMoney(sale.total_amount))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, (sale.items || []).map((it, idx) => /* @__PURE__ */ React.createElement("span", { key: idx, style: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", fontSize: 12 } }, it.product_name, " \xD7 ", it.quantity, " \u2014 ", fmtMoney(it.subtotal)))))))), (modal === "add_product" || modal === "edit_product") && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: modal === "edit_product" ? "\xDCr\xFCn\xFC D\xFCzenle" : "Yeni \xDCr\xFCn",
      wide: true,
      onClose: () => setModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: saveProduct, disabled: saving }, saving ? "Kaydediliyor\u2026" : "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Field, { label: "\xDCr\xFCn Ad\u0131 *" }, /* @__PURE__ */ React.createElement("input", { placeholder: "\xD6rn: Su, Enerji \u0130\xE7ece\u011Fi", value: form.name || "", onChange: (e) => setForm({ ...form, name: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Kategori" }, /* @__PURE__ */ React.createElement("select", { value: form.category || "Di\u011Fer", onChange: (e) => setForm({ ...form, category: e.target.value }) }, CAFE_CATEGORIES.map((c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c }, c)))), /* @__PURE__ */ React.createElement(Field, { label: "Fiyat (\u20BA) *" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 0, step: 0.5, placeholder: "0.00", value: form.price ?? "", onChange: (e) => setForm({ ...form, price: e.target.value }) }))), /* @__PURE__ */ React.createElement(Field, { label: "Ba\u015Flang\u0131\xE7 Sto\u011Fu" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 0, placeholder: "Bo\u015F b\u0131rak\u0131l\u0131rsa s\u0131n\u0131rs\u0131z", value: form.stock_quantity ?? "", onChange: (e) => setForm({ ...form, stock_quantity: e.target.value }) })), /* @__PURE__ */ React.createElement(Switch, { on: form.is_available !== false, onChange: (v) => setForm({ ...form, is_available: v }), label: "Sat\u0131\u015Fta" }))
  ), modal === "sale" && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "Sat\u0131\u015F Yap",
      wide: true,
      onClose: () => setModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: completeSale, disabled: saving || cartItems.length === 0 }, saving ? "Kaydediliyor\u2026" : `Tamamla \u2014 ${fmtMoney(cartTotal)}`))
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, availableForSale.length === 0 ? /* @__PURE__ */ React.createElement("p", { style: { color: "var(--text-2)", textAlign: "center", padding: 20 } }, "Sat\u0131\u015Fta \xFCr\xFCn yok.") : availableForSale.map((item) => {
      const qty = cart[item.id] || 0;
      const outOfStock = item.stock_quantity != null && item.stock_quantity === 0;
      return /* @__PURE__ */ React.createElement("div", { key: item.id, style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: outOfStock ? "#FEF2F2" : qty > 0 ? "#F0FDF4" : "var(--bg)",
        borderRadius: 10,
        border: `1px solid ${qty > 0 ? "#22C55E" : "var(--border)"}`
      } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 14 } }, item.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, fmtMoney(item.price), item.stock_quantity != null && ` \xB7 Stok: ${item.stock_quantity}`, outOfStock && /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444", marginLeft: 6 } }, "T\xFCkendi"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setQty(item.id, -1),
          disabled: qty === 0,
          style: { width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)", background: "#fff", cursor: qty > 0 ? "pointer" : "not-allowed", fontSize: 16, display: "grid", placeItems: "center" }
        },
        "\u2212"
      ), /* @__PURE__ */ React.createElement("span", { style: { width: 24, textAlign: "center", fontWeight: 700, fontSize: 15 } }, qty), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setQty(item.id, 1),
          disabled: outOfStock,
          style: { width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)", background: "#fff", cursor: outOfStock ? "not-allowed" : "pointer", fontSize: 16, display: "grid", placeItems: "center" }
        },
        "+"
      )), qty > 0 && /* @__PURE__ */ React.createElement("div", { style: { width: 64, textAlign: "right", fontWeight: 700, fontSize: 13, color: "var(--brand-navy)" } }, fmtMoney(item.price * qty)));
    }), cartItems.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, borderTop: "2px solid var(--border)", paddingTop: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, marginBottom: 8 } }, "Toplam: ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--brand-navy)" } }, fmtMoney(cartTotal)), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, fontSize: 12, color: "var(--text-2)", marginLeft: 8 } }, cartItems.length, " kalem")), /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "Not (iste\u011Fe ba\u011Fl\u0131)\u2026",
        value: saleNote,
        onChange: (e) => setSaleNote(e.target.value),
        style: { width: "100%" }
      }
    )))
  ));
}
function PracticeMatchesScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [matches, setMatches] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => {
    if (clubId) load();
  }, [clubId]);
  const load = async () => {
    setLoading(true);
    try {
      const courtIds = await getClubCourtIds(clubId);
      const [mRes, cRes] = await Promise.all([
        sb.from("practice_matches").select("*").eq("club_id", clubId).order("match_date", { ascending: false }),
        sb.from("courts").select("id, court_number, court_type").eq("club_id", clubId).eq("is_active", true)
      ]);
      setMatches(mRes.data || []);
      setCourts(cRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    if (!form.player1_name?.trim()) {
      alert("Oyuncu 1 ad\u0131 zorunludur.");
      return;
    }
    if (!form.player2_name?.trim()) {
      alert("Oyuncu 2 ad\u0131 zorunludur.");
      return;
    }
    if (!form.match_date) {
      alert("Tarih zorunludur.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        player1_name: form.player1_name.trim(),
        player2_name: form.player2_name.trim(),
        player3_name: form.player3_name?.trim() || null,
        player4_name: form.player4_name?.trim() || null,
        match_date: form.match_date,
        start_time: form.start_time || null,
        court_id: form.court_id || null,
        score: form.score?.trim() || null,
        match_type: form.match_type || "singles",
        notes: form.notes?.trim() || null,
        status: form.status || "scheduled"
      };
      if (form.id) {
        await sb.from("practice_matches").update(payload).eq("id", form.id);
      } else {
        await sb.from("practice_matches").insert({ club_id: clubId, ...payload });
      }
      setModal(false);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const del = async (id) => {
    if (!confirm("Bu ma\xE7\u0131 silmek istedi\u011Finize emin misiniz?")) return;
    await sb.from("practice_matches").delete().eq("id", id);
    load();
  };
  const STATUS_LABELS = { scheduled: "Planland\u0131", ongoing: "Devam Ediyor", completed: "Tamamland\u0131", cancelled: "\u0130ptal" };
  const STATUS_CLS = { scheduled: "b-info", ongoing: "b-success", completed: "b-muted", cancelled: "b-danger" };
  const filtered = search ? matches.filter((m) => m.player1_name?.toLowerCase().includes(search.toLowerCase()) || m.player2_name?.toLowerCase().includes(search.toLowerCase())) : matches;
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Pratik Ma\xE7lar"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, matches.length, " kay\u0131tl\u0131 ma\xE7")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: () => {
    setForm({ match_type: "singles", status: "scheduled", match_date: todayISO() });
    setModal(true);
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), " Ma\xE7 Ekle")), /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "table-toolbar" }, /* @__PURE__ */ React.createElement("div", { className: "search" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "search"), /* @__PURE__ */ React.createElement("input", { placeholder: "Oyuncu ara\u2026", value: search, onChange: (e) => setSearch(e.target.value) }))), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : filtered.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "sports_tennis", title: "Ma\xE7 bulunamad\u0131", sub: "Pratik ma\xE7 kaydetmek i\xE7in + butonunu kullan\u0131n." }) : /* @__PURE__ */ React.createElement("div", null, filtered.map((m, i) => {
    const court = courts.find((c) => c.id === m.court_id);
    const isDoubles = m.match_type === "doubles";
    return /* @__PURE__ */ React.createElement("div", { key: m.id, style: { padding: "14px 16px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 40, borderRadius: 12, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--brand-navy)", fontSize: 20 } }, "sports_tennis")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14 } }, isDoubles ? `${m.player1_name}/${m.player3_name || "?"} vs ${m.player2_name}/${m.player4_name || "?"}` : `${m.player1_name} vs ${m.player2_name}`), /* @__PURE__ */ React.createElement(Badge, { cls: STATUS_CLS[m.status] || "" }, STATUS_LABELS[m.status] || m.status)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12, verticalAlign: "middle" } }, "calendar_today"), " ", fmtDate(m.match_date)), m.start_time && /* @__PURE__ */ React.createElement("span", null, m.start_time.slice(0, 5)), court && /* @__PURE__ */ React.createElement("span", null, "Kort ", court.court_number), m.score && /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, color: "var(--brand-navy)" } }, m.score))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => {
      setForm({ ...m });
      setModal(true);
    } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "edit")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => del(m.id) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "delete")))));
  }))), modal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: form.id ? "Ma\xE7\u0131 D\xFCzenle" : "Pratik Ma\xE7 Ekle",
      wide: true,
      onClose: () => setModal(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setModal(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: save, disabled: saving }, saving ? "Kaydediliyor\u2026" : "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Field, { label: "Ma\xE7 T\xFCr\xFC" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, ["singles", "doubles"].map((t) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: t,
        type: "button",
        style: {
          flex: 1,
          padding: "9px",
          borderRadius: 10,
          border: "1.5px solid",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          borderColor: form.match_type === t ? "var(--brand-navy)" : "var(--border)",
          background: form.match_type === t ? "var(--brand-navy)" : "var(--bg)",
          color: form.match_type === t ? "#fff" : "var(--text-2)"
        },
        onClick: () => setForm({ ...form, match_type: t })
      },
      t === "singles" ? "Tekler" : "\xC7iftler"
    )))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Oyuncu 1 *" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Ad Soyad", value: form.player1_name || "", onChange: (e) => setForm({ ...form, player1_name: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Oyuncu 2 *" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Ad Soyad", value: form.player2_name || "", onChange: (e) => setForm({ ...form, player2_name: e.target.value }) }))), form.match_type === "doubles" && /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Oyuncu 3 (1. tak\u0131m e\u015Fi)" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Ad Soyad", value: form.player3_name || "", onChange: (e) => setForm({ ...form, player3_name: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Oyuncu 4 (2. tak\u0131m e\u015Fi)" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Ad Soyad", value: form.player4_name || "", onChange: (e) => setForm({ ...form, player4_name: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Tarih *" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: form.match_date || "", onChange: (e) => setForm({ ...form, match_date: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Saat" }, /* @__PURE__ */ React.createElement("input", { type: "time", value: form.start_time || "", onChange: (e) => setForm({ ...form, start_time: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Kort" }, /* @__PURE__ */ React.createElement("select", { value: form.court_id || "", onChange: (e) => setForm({ ...form, court_id: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Kort se\xE7in"), courts.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, "Kort ", c.court_number, " (", c.court_type, ")")))), /* @__PURE__ */ React.createElement(Field, { label: "Durum" }, /* @__PURE__ */ React.createElement("select", { value: form.status || "scheduled", onChange: (e) => setForm({ ...form, status: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "scheduled" }, "Planland\u0131"), /* @__PURE__ */ React.createElement("option", { value: "ongoing" }, "Devam Ediyor"), /* @__PURE__ */ React.createElement("option", { value: "completed" }, "Tamamland\u0131"), /* @__PURE__ */ React.createElement("option", { value: "cancelled" }, "\u0130ptal")))), /* @__PURE__ */ React.createElement(Field, { label: "Skor (\xF6rn: 6-4, 7-5)" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Skor girin", value: form.score || "", onChange: (e) => setForm({ ...form, score: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Notlar" }, /* @__PURE__ */ React.createElement("textarea", { rows: 2, placeholder: "\u0130ste\u011Fe ba\u011Fl\u0131 notlar\u2026", value: form.notes || "", onChange: (e) => setForm({ ...form, notes: e.target.value }), style: { resize: "vertical" } })))
  ));
}
const NOTIF_TYPES = [
  { key: "booking_created", label: "Rezervasyon Olu\u015Fturuldu", icon: "calendar_today", desc: "Yeni bir rezervasyon olu\u015Fturuldu\u011Funda" },
  { key: "booking_confirmed", label: "Rezervasyon Onayland\u0131", icon: "check_circle", desc: "Rezervasyon onayland\u0131\u011F\u0131nda" },
  { key: "booking_cancelled", label: "Rezervasyon \u0130ptal Edildi", icon: "cancel", desc: "Rezervasyon iptal edildi\u011Finde" },
  { key: "payment_success", label: "\xD6deme Al\u0131nd\u0131", icon: "payments", desc: "Ba\u015Far\u0131l\u0131 \xF6deme al\u0131nd\u0131\u011F\u0131nda" },
  { key: "membership_request", label: "\xDCyelik Ba\u015Fvurusu", icon: "person_add", desc: "Yeni \xFCyelik ba\u015Fvurusu geldi\u011Finde" },
  { key: "membership_accepted", label: "\xDCyelik Onayland\u0131", icon: "how_to_reg", desc: "\xDCyelik ba\u015Fvurusu onayland\u0131\u011F\u0131nda" },
  { key: "lesson_created", label: "Ders Olu\u015Fturuldu", icon: "school", desc: "Yeni ders eklendi\u011Finde" },
  { key: "lesson_reminder", label: "Ders Hat\u0131rlat\u0131c\u0131s\u0131", icon: "alarm", desc: "Ders ba\u015Flamadan \xF6nce hat\u0131rlatma" },
  { key: "message", label: "Yeni Mesaj", icon: "chat", desc: "Yeni mesaj al\u0131nd\u0131\u011F\u0131nda" },
  { key: "review", label: "Yeni Yorum", icon: "star", desc: "Yeni kul\xFCp yorumu geldi\u011Finde" },
  { key: "lesson_request", label: "Ders Talebi", icon: "school", desc: "Yeni ders talebi geldi\u011Finde" }
];
function NotificationPreferencesScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        const p = {};
        NOTIF_TYPES.forEach((t) => {
          p[t.key] = data[t.key] !== false;
        });
        setPrefs(p);
      } else {
        const p = {};
        NOTIF_TYPES.forEach((t) => {
          p[t.key] = true;
        });
        setPrefs(p);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const payload = { user_id: user.id, ...prefs };
      await sb.from("notification_preferences").upsert(payload, { onConflict: "user_id" });
      alert("Bildirim tercihleri kaydedildi.");
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const toggleAll = (val) => {
    const p = {};
    NOTIF_TYPES.forEach((t) => {
      p[t.key] = val;
    });
    setPrefs(p);
  };
  const enabledCount = NOTIF_TYPES.filter((t) => prefs[t.key] !== false).length;
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Bildirim Tercihleri"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, enabledCount, " / ", NOTIF_TYPES.length, " bildirim t\xFCr\xFC aktif")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => toggleAll(true) }, "T\xFCm\xFCn\xFC A\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => toggleAll(false) }, "T\xFCm\xFCn\xFC Kapat"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: save, disabled: saving }, saving ? "Kaydediliyor\u2026" : "Kaydet"))), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 0, overflow: "hidden" } }, NOTIF_TYPES.map((t, i) => {
    const enabled = prefs[t.key] !== false;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: t.key,
        style: { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < NOTIF_TYPES.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer" },
        onClick: () => setPrefs({ ...prefs, [t.key]: !enabled })
      },
      /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 40, borderRadius: 12, background: enabled ? "#EEF2FF" : "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: enabled ? "var(--brand-navy)" : "var(--text-2)", fontSize: 20 } }, t.icon)),
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: enabled ? "var(--text-1)" : "var(--text-2)" } }, t.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2 } }, t.desc)),
      /* @__PURE__ */ React.createElement("div", { style: { width: 44, height: 24, borderRadius: 12, background: enabled ? "var(--brand-navy)" : "var(--border)", position: "relative", flexShrink: 0, transition: "background 200ms" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 18, height: 18, borderRadius: 9, background: "#fff", position: "absolute", top: 3, left: enabled ? 23 : 3, transition: "left 200ms", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" } }))
    );
  })));
}
function AnalyticsInsightsPanel({ clubId }) {
  const { useState, useEffect, useMemo } = React;
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [finances, setFinances] = useState([]);
  useEffect(() => {
    if (clubId) load();
  }, [clubId]);
  const load = async () => {
    setLoading(true);
    try {
      const threeAgo = /* @__PURE__ */ new Date();
      threeAgo.setMonth(threeAgo.getMonth() - 3);
      const courtIds = await getClubCourtIds(clubId);
      const [memRes, bkRes, finRes] = await Promise.all([
        sb.from("club_memberships").select("id,status,join_date,package_id").eq("club_id", clubId),
        courtIds.length > 0 ? sb.from("bookings").select("id,start_time,status,payment_status,total_amount,court_id").in("court_id", courtIds).gte("start_time", threeAgo.toISOString()) : Promise.resolve({ data: [] }),
        sb.from("club_finances").select("type,amount,date,category").eq("club_id", clubId).gte("date", threeAgo.toISOString().split("T")[0])
      ]);
      setMembers(memRes.data || []);
      setBookings(bkRes.data || []);
      setFinances(finRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const insights = useMemo(() => {
    const ins = [];
    if (!bookings.length && !members.length) return ins;
    const dayCount = {};
    bookings.forEach((b) => {
      const d = new Date(b.start_time).getDay();
      dayCount[d] = (dayCount[d] || 0) + 1;
    });
    const DAYS_TR = ["Pazar", "Pazartesi", "Sal\u0131", "\xC7ar\u015Famba", "Per\u015Fembe", "Cuma", "Cumartesi"];
    const busyDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
    if (busyDay) ins.push({ icon: "trending_up", color: "#3B82F6", title: "En Yo\u011Fun G\xFCn", body: `${DAYS_TR[busyDay[0]]} g\xFCnleri en \xE7ok rezervasyon yap\u0131lan g\xFCn (${busyDay[1]} rezervasyon).` });
    const paid = bookings.filter((b) => b.payment_status === "paid").length;
    const paidPct = bookings.length > 0 ? Math.round(paid / bookings.length * 100) : 0;
    if (paidPct < 70 && bookings.length > 5) {
      ins.push({ icon: "warning", color: "#F59E0B", title: "D\xFC\u015F\xFCk \xD6deme Oran\u0131", body: `Rezervasyonlar\u0131n sadece %${paidPct}'i \xF6dendi. \xD6deme takibini g\xFC\xE7lendirmeyi d\xFC\u015F\xFCn\xFCn.` });
    } else if (paidPct >= 90 && bookings.length > 5) {
      ins.push({ icon: "check_circle", color: "#22C55E", title: "Harika \xD6deme Oran\u0131", body: `Rezervasyonlar\u0131n %${paidPct}'i \xF6dendi. M\xFCkemmel bir tahsilat performans\u0131!` });
    }
    const newMembers30 = members.filter((m) => {
      if (!m.join_date) return false;
      const d = new Date(m.join_date);
      const ago = /* @__PURE__ */ new Date();
      ago.setDate(ago.getDate() - 30);
      return d >= ago;
    }).length;
    if (newMembers30 > 0) ins.push({ icon: "group_add", color: "#8B5CF6", title: "Yeni \xDCyeler", body: `Son 30 g\xFCnde ${newMembers30} yeni \xFCye kat\u0131ld\u0131.` });
    const monthlyInc = {};
    finances.filter((f) => f.type === "income").forEach((f) => {
      const m = f.date.slice(0, 7);
      monthlyInc[m] = (monthlyInc[m] || 0) + (f.amount || 0);
    });
    const monthVals = Object.values(monthlyInc);
    if (monthVals.length >= 2) {
      const last = monthVals[monthVals.length - 1];
      const prev = monthVals[monthVals.length - 2];
      const delta = last - prev;
      if (delta > 0) {
        ins.push({ icon: "show_chart", color: "#22C55E", title: "Gelir Art\u0131\u015F\u0131", body: `Bu ay ge\xE7en aya g\xF6re ${fmtMoney(delta)} fazla gelir elde edildi.` });
      } else if (delta < 0) {
        ins.push({ icon: "trending_down", color: "#EF4444", title: "Gelir D\xFC\u015F\xFC\u015F\xFC", body: `Bu ay ge\xE7en aya g\xF6re ${fmtMoney(Math.abs(delta))} daha az gelir elde edildi.` });
      }
    }
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const cancelPct = bookings.length > 0 ? Math.round(cancelled / bookings.length * 100) : 0;
    if (cancelPct > 20 && bookings.length > 5) {
      ins.push({ icon: "cancel", color: "#EF4444", title: "Y\xFCksek \u0130ptal Oran\u0131", body: `Rezervasyonlar\u0131n %${cancelPct}'i iptal edildi. Politikan\u0131z\u0131 g\xF6zden ge\xE7irmenizi \xF6neririz.` });
    }
    const withPkg = members.filter((m) => m.package_id && m.status === "active").length;
    const total = members.filter((m) => m.status === "active").length;
    if (total > 0) {
      const pct = Math.round(withPkg / total * 100);
      ins.push({ icon: "card_membership", color: "#F97316", title: "Paket Kullan\u0131m\u0131", body: `Aktif \xFCyelerin %${pct}'i (${withPkg}/${total}) bir \xFCyelik paketine sahip.` });
    }
    return ins;
  }, [bookings, members, finances]);
  if (loading) return /* @__PURE__ */ React.createElement(Spinner, null);
  if (insights.length === 0) return /* @__PURE__ */ React.createElement("div", { className: "card", style: { textAlign: "center", padding: "24px 16px", color: "var(--text-2)" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 40, marginBottom: 8, display: "block" } }, "insights"), "Yeterli veri olmad\u0131\u011F\u0131 i\xE7in i\xE7g\xF6r\xFC \xFCretilemedi.");
  return /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 } }, insights.map((ins, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "card", style: { borderLeft: `3px solid ${ins.color}`, gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 36, height: 36, borderRadius: 10, background: ins.color + "18", display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: ins.color, fontSize: 18 } }, ins.icon)), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, ins.title)), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.5 } }, ins.body))));
}
function ScheduleDisplay({ groupId, courts, coaches }) {
  const { useState, useEffect } = React;
  const [closures, setClosures] = useState([]);
  const DAY_NAMES = ["Pazar", "Pazartesi", "Sal\u0131", "\xC7ar\u015Famba", "Per\u015Fembe", "Cuma", "Cumartesi"];
  const fmtH = (h, m) => `${String(h).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
  useEffect(() => {
    if (!groupId) return;
    sb.from("court_closures").select("*, courts(court_number)").eq("group_id", groupId).order("day_of_week").then(({ data }) => setClosures(data || []));
  }, [groupId]);
  if (closures.length === 0) return /* @__PURE__ */ React.createElement(EmptyState, { icon: "calendar_today", title: "Program tan\u0131mlanmam\u0131\u015F", sub: "Program\u0131 D\xFCzenle butonundan program ekleyebilirsiniz." });
  const byDay = {};
  closures.forEach((cl) => {
    const d = cl.day_of_week;
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(cl);
  });
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, Object.keys(byDay).sort((a, b) => Number(a) - Number(b)).map((day) => {
    const cls = byDay[day];
    const slotMap = {};
    cls.forEach((cl) => {
      const key = `${cl.start_hour}_${cl.start_minute || 0}_${cl.end_hour}_${cl.end_minute || 0}`;
      if (!slotMap[key]) slotMap[key] = [];
      slotMap[key].push(cl);
    });
    const slots = Object.values(slotMap);
    return slots.map((slotCls, si) => {
      const first = slotCls[0];
      const courtNums = [...new Set(slotCls.map((c) => c.courts?.court_number).filter(Boolean))];
      const coachIds = [...new Set(slotCls.map((c) => c.coach_id).filter(Boolean))];
      const coachNames = coachIds.map((id) => coaches.find((c) => c.id === id)?.full_name).filter(Boolean);
      return /* @__PURE__ */ React.createElement("div", { key: `${day}_${si}`, style: { display: "flex", gap: 10, padding: "10px 14px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 4, alignSelf: "stretch", borderRadius: 2, background: "#8B5CF6", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, DAY_NAMES[Number(day)], " \xB7 ", fmtH(first.start_hour, first.start_minute), "\u2013", fmtH(first.end_hour, first.end_minute)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2 } }, courtNums.length > 0 && `Kort ${courtNums.join(", ")}`, courtNums.length > 0 && coachNames.length > 0 && " \xB7 ", coachNames.join(", "))));
    });
  }));
}
function GroupsScreen({ clubId, setScreen }) {
  const { useState, useEffect } = React;
  const PAGE_SIZE = 5;
  const DAYS = [["Pzt", 1], ["Sal", 2], ["\xC7ar", 3], ["Per", 4], ["Cum", 5], ["Cmt", 6], ["Paz", 0]];
  const DAY_NAMES = ["Pazar", "Pazartesi", "Sal\u0131", "\xC7ar\u015Famba", "Per\u015Fembe", "Cuma", "Cumartesi"];
  const MONTHS_TR = ["Ocak", "\u015Eubat", "Mart", "Nisan", "May\u0131s", "Haziran", "Temmuz", "A\u011Fustos", "Eyl\xFCl", "Ekim", "Kas\u0131m", "Aral\u0131k"];
  const formatHour = (h) => {
    const w = Math.floor(h);
    const m = Math.round(h % 1 * 60);
    return `${String(w).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  const combineHour = (h, m) => h + (m || 0) / 60;
  const splitHour = (h) => ({ hour: Math.floor(h), minute: Math.round(h % 1 * 60) });
  const makeMember = () => ({ key: Date.now() + Math.random(), name: "", phone: "", contact: "", fee: "", schedule_slots: [], joinDate: "" });
  const makeSlot = () => ({ courts: [], start: 9, end: 11 });
  const [groups, setGroups] = useState([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [coaches, setCoaches] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedCoachIds, setSelectedCoachIds] = useState([]);
  const [coachShares, setCoachShares] = useState({});
  const [coachFixedAmounts, setCoachFixedAmounts] = useState({});
  const [monthlyFee, setMonthlyFee] = useState("0");
  const [duesDueDay, setDuesDueDay] = useState("1");
  const [billingType, setBillingType] = useState("monthly");
  const [creditSessions, setCreditSessions] = useState("8");
  const [creditPrice, setCreditPrice] = useState("0");
  const [clubPercentage, setClubPercentage] = useState("100");
  const [splitType, setSplitType] = useState("percentage");
  const [selectedDays, setSelectedDays] = useState([]);
  const [daySettings, setDaySettings] = useState({});
  const [diffCoachesPerDay, setDiffCoachesPerDay] = useState(false);
  const [dayCoachIds, setDayCoachIds] = useState({});
  const [members, setMembers] = useState([makeMember(), makeMember()]);
  const [detailGroup, setDetailGroup] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailGroupDays, setDetailGroupDays] = useState([]);
  const [detailGroupSlots, setDetailGroupSlots] = useState([]);
  const [detailTab, setDetailTab] = useState("members");
  const [memberPackageSummary, setMemberPackageSummary] = useState({});
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", phone: "", contact: "", fee: "", days: [], joinDate: "" });
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberRemain, setAddMemberRemain] = useState({ total: 0, remaining: 0, monthName: "" });
  const [editMemberVisible, setEditMemberVisible] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({ name: "", phone: "", contact: "", fee: "", days: [] });
  const [editSchedVisible, setEditSchedVisible] = useState(false);
  const [editSchedName, setEditSchedName] = useState("");
  const [editSchedDesc, setEditSchedDesc] = useState("");
  const [editSchedDays, setEditSchedDays] = useState([]);
  const [editSchedDaySettings, setEditSchedDaySettings] = useState({});
  const [editSchedCoachIds, setEditSchedCoachIds] = useState([]);
  const [editDiffCoachesPerDay, setEditDiffCoachesPerDay] = useState(false);
  const [editDayCoachIds, setEditDayCoachIds] = useState({});
  const [savingSched, setSavingSched] = useState(false);
  const [use15Min, setUse15Min] = useState(false);
  const [editSchedUse15Min, setEditSchedUse15Min] = useState(false);
  const [editFeeVisible, setEditFeeVisible] = useState(false);
  const [editFee, setEditFee] = useState("0");
  const [editPct, setEditPct] = useState("100");
  const [editDuesDueDay, setEditDuesDueDay] = useState("1");
  const [editSplitType, setEditSplitType] = useState("percentage");
  const [editCoachFixed, setEditCoachFixed] = useState({});
  const [savingFee, setSavingFee] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [paymentGroup, setPaymentGroup] = useState(null);
  const [payYear, setPayYear] = useState((/* @__PURE__ */ new Date()).getFullYear());
  const [payMonth, setPayMonth] = useState((/* @__PURE__ */ new Date()).getMonth() + 1);
  const [dues, setDues] = useState([]);
  const [duesPost, setDuesPost] = useState(null);
  const [loadingDues, setLoadingDues] = useState(false);
  const [postingFinance, setPostingFinance] = useState(false);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [addPkgVisible, setAddPkgVisible] = useState(false);
  const [addPkgMember, setAddPkgMember] = useState(null);
  const [addPkgSessions, setAddPkgSessions] = useState("");
  const [addPkgPrice, setAddPkgPrice] = useState("");
  const [savingPkg, setSavingPkg] = useState(false);
  const [postingPkg, setPostingPkg] = useState(false);
  useEffect(() => {
    if (clubId) init();
  }, [clubId]);
  useEffect(() => {
    if (clubId) {
      setCurrentPage(0);
      loadGroups(0, searchQuery);
    }
  }, [searchQuery]);
  const init = async () => {
    setLoading(true);
    await Promise.all([loadGroups(0, ""), loadCoaches(), loadCourts()]);
    setLoading(false);
  };
  const loadGroups = async (page = currentPage, search = searchQuery) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = sb.from("club_groups").select("*, coach:club_coaches(id,full_name), group_coaches:club_group_coaches(share_percentage,fixed_amount,club_coaches(id,full_name)), members:club_group_members(*)", { count: "exact" }).eq("club_id", clubId).order("created_at", { ascending: false }).range(from, to);
    if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
    const { data, count } = await q;
    setGroups((data || []).map((g) => ({
      ...g,
      member_count: g.members?.length ?? 0,
      coaches: (g.group_coaches || []).map((gc) => ({
        id: gc.club_coaches?.id,
        full_name: gc.club_coaches?.full_name,
        share_percentage: gc.share_percentage ?? 100,
        fixed_amount: gc.fixed_amount ?? null
      })).filter((c) => c.id)
    })));
    setTotalGroups(count ?? 0);
  };
  const loadCoaches = async () => {
    const { data } = await sb.from("club_coaches").select("id,full_name,hourly_rate").eq("club_id", clubId).eq("is_active", true);
    setCoaches(data || []);
  };
  const loadCourts = async () => {
    const { data } = await sb.from("courts").select("id,court_number,court_type").eq("club_id", clubId).eq("is_active", true).order("court_number");
    setCourts(data || []);
  };
  const loadGroupDetail = async (groupId) => {
    const { data, error } = await sb.from("club_groups").select("*, coach:club_coaches(id,full_name), group_coaches:club_group_coaches(share_percentage,fixed_amount,club_coaches(id,full_name)), members:club_group_members(*)").eq("id", groupId).single();
    if (error) throw error;
    return {
      ...data,
      member_count: data.members?.length ?? 0,
      coaches: (data.group_coaches || []).map((gc) => ({
        id: gc.club_coaches?.id,
        full_name: gc.club_coaches?.full_name,
        share_percentage: gc.share_percentage ?? 100,
        fixed_amount: gc.fixed_amount ?? null
      })).filter((c) => c.id)
    };
  };
  const checkConflicts = async (daySettingsMap, coachIds, excludeGroupId, perDayCoachIdsMap) => {
    const days = Object.keys(daySettingsMap).map(Number);
    if (days.length === 0) return [];
    const msgs = [];
    for (const day of days) {
      const slots = Array.isArray(daySettingsMap[day]) ? daySettingsMap[day] : [daySettingsMap[day] ?? makeSlot()];
      for (const { courts: courtIds, start, end } of slots) {
        if (courtIds.length > 0) {
          const { data: courtRows } = await sb.from("court_closures").select("court_id,day_of_week,start_hour,start_minute,end_hour,end_minute,reason,group_id,courts(court_number)").in("court_id", courtIds).eq("day_of_week", day).eq("is_active", true).lt("start_hour", Math.ceil(end)).gt("end_hour", Math.floor(start));
          for (const row of courtRows || []) {
            if (excludeGroupId && row.group_id === excludeGroupId) continue;
            const rs = combineHour(row.start_hour, row.start_minute || 0);
            const re = combineHour(row.end_hour, row.end_minute || 0);
            if (start >= re || end <= rs) continue;
            const label = row.reason ? ` (${row.reason})` : "";
            msgs.push(`Kort ${row.courts?.court_number ?? "?"} \xB7 ${DAY_NAMES[day]} ${formatHour(rs)}\u2013${formatHour(re)} dolu${label}`);
          }
        }
        const effectiveCoachIds = perDayCoachIdsMap?.[day] ?? coachIds;
        for (const coachId of effectiveCoachIds) {
          const coach = coaches.find((c) => c.id === coachId);
          const coachName = coach?.full_name ?? "Hoca";
          const { data: closureRows } = await sb.from("court_closures").select("*, courts(court_number)").eq("coach_id", coachId).eq("is_active", true);
          for (const cl of closureRows || []) {
            if (excludeGroupId && cl.group_id === excludeGroupId) continue;
            const cs = combineHour(cl.start_hour, cl.start_minute || 0);
            const ce = combineHour(cl.end_hour, cl.end_minute || 0);
            if (!(start < ce && end > cs)) continue;
            if (cl.closure_type === "recurring_weekly" && cl.day_of_week === day) {
              msgs.push(`${coachName} \xB7 Kort ${cl.courts?.court_number ?? ""}: ${DAY_NAMES[day]} ${formatHour(cs)}\u2013${formatHour(ce)}`);
            }
          }
          const { data: manualLessons } = await sb.from("club_manual_lessons").select("id,date,start_time,end_time,student_name").eq("coach_id", coachId).gte("date", todayISO());
          const seen = /* @__PURE__ */ new Set();
          for (const ml of manualLessons || []) {
            const lessonDate = /* @__PURE__ */ new Date(ml.date + "T12:00:00");
            if (lessonDate.getDay() !== day) continue;
            const [lsh, lsm] = (ml.start_time || "0:0").split(":").map(Number);
            const [leh, lem] = (ml.end_time || "0:0").split(":").map(Number);
            const lStart = lsh + lsm / 60;
            const lEnd = leh + lem / 60;
            if (start < lEnd && end > lStart) {
              const key = `${coachId}-${day}-${start}-${end}`;
              if (!seen.has(key)) {
                seen.add(key);
                msgs.push(`${coachName} \xB7 Manuel Ders: her ${DAY_NAMES[day]} ${formatHour(lStart)}\u2013${formatHour(lEnd)}`);
              }
            }
          }
        }
      }
    }
    return msgs;
  };
  const clampDueDay = (v) => {
    const d = (v || "").replace(/\D/g, "").slice(0, 2);
    return d && parseInt(d, 10) > 28 ? "28" : d;
  };
  const openCreate = () => {
    setGroupName("");
    setGroupDesc("");
    setSelectedCoachIds([]);
    setCoachShares({});
    setCoachFixedAmounts({});
    setMonthlyFee("0");
    setDuesDueDay("1");
    setClubPercentage("100");
    setSplitType("percentage");
    setSelectedDays([]);
    setDaySettings({});
    setDiffCoachesPerDay(false);
    setDayCoachIds({});
    setUse15Min(false);
    setMembers([makeMember(), makeMember()]);
    setCreateVisible(true);
  };
  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      alert("Grup ad\u0131 bo\u015F olamaz");
      return;
    }
    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length < 2) {
      alert("En az 2 \xFCye eklemeniz gerekiyor");
      return;
    }
    for (const day of selectedDays) {
      const slots = Array.isArray(daySettings[day]) ? daySettings[day] : [daySettings[day] ?? makeSlot()];
      for (const { start, end } of slots) {
        if (start >= end) {
          alert(`${DAY_NAMES[day]}: Biti\u015F saati ba\u015Flang\u0131\xE7 saatinden b\xFCy\xFCk olmal\u0131`);
          return;
        }
      }
    }
    if (!diffCoachesPerDay && selectedCoachIds.length > 1) {
      const total = selectedCoachIds.reduce((s, id) => s + (parseFloat(coachShares[id]) || 0), 0);
      if (Math.abs(total - 100) > 0.1) {
        alert(`Antren\xF6r paylar\u0131 toplam\u0131 %100 olmal\u0131 (\u015Fu an: %${total.toFixed(1)})`);
        return;
      }
    }
    const allCoachIds = diffCoachesPerDay ? [...new Set(selectedDays.flatMap((d) => dayCoachIds[d] || []))] : selectedCoachIds;
    if (selectedDays.length > 0 && (selectedDays.some((d) => {
      const slots = Array.isArray(daySettings[d]) ? daySettings[d] : [daySettings[d] ?? makeSlot()];
      return slots.some((sl) => sl.courts.length > 0);
    }) || allCoachIds.length > 0)) {
      const active = {};
      selectedDays.forEach((d) => {
        active[d] = Array.isArray(daySettings[d]) ? daySettings[d] : [daySettings[d] ?? makeSlot()];
      });
      const conflicts = await checkConflicts(active, selectedCoachIds, void 0, diffCoachesPerDay ? dayCoachIds : void 0);
      if (conflicts.length > 0) {
        alert("\xC7ak\u0131\u015Fma Var!\n\nA\u015Fa\u011F\u0131daki saatler dolu:\n\n" + conflicts.join("\n"));
        return;
      }
    }
    setSaving(true);
    try {
      const fee = billingType === "monthly" ? parseFloat(monthlyFee) || 0 : 0;
      const pct = Math.min(100, Math.max(0, parseFloat(clubPercentage) || 100));
      const primaryCoachId = allCoachIds[0] || null;
      const { data: group, error: groupErr } = await sb.from("club_groups").insert([{ club_id: clubId, name: groupName.trim(), coach_id: primaryCoachId, description: groupDesc.trim() || null, monthly_fee: fee, dues_due_day: Math.min(28, Math.max(1, parseInt(duesDueDay) || 1)), club_percentage: pct, split_type: splitType, billing_type: billingType, credit_sessions: billingType === "credit" ? parseInt(creditSessions) || 8 : null, credit_price: billingType === "credit" ? parseFloat(creditPrice) || 0 : null }]).select().single();
      if (groupErr) throw groupErr;
      const { error: membErr } = await sb.from("club_group_members").insert(
        validMembers.map((m) => ({
          group_id: group.id,
          member_name: m.name.trim(),
          contact_number: m.phone.trim() || null,
          contact_person: m.contact.trim() || null,
          custom_fee: m.fee.trim() && !isNaN(parseFloat(m.fee)) ? parseFloat(m.fee) : null,
          schedule_slots: (m.schedule_slots || []).length === 0 ? allSlots : m.schedule_slots,
          join_date: m.joinDate || todayISO()
        }))
      );
      if (membErr) throw membErr;
      if (billingType === "credit") {
        const { data: createdMembers } = await sb.from("club_group_members").select("id, member_name").eq("group_id", group.id);
        if (createdMembers?.length) {
          const pkgRows = createdMembers.map((m) => ({
            group_id: group.id,
            club_id: clubId,
            member_id: m.id,
            member_name: m.member_name,
            total_sessions: parseInt(creditSessions) || 8,
            used_sessions: 0,
            amount: parseFloat(creditPrice) || 0,
            is_paid: false,
            purchased_at: (/* @__PURE__ */ new Date()).toISOString()
          }));
          await sb.from("club_group_member_packages").insert(pkgRows);
        }
      }
      if (allCoachIds.length > 0) {
        const eq = parseFloat((100 / allCoachIds.length).toFixed(2));
        await sb.from("club_group_coaches").insert(
          allCoachIds.map((coachId, i) => ({
            group_id: group.id,
            coach_id: coachId,
            share_percentage: diffCoachesPerDay ? i === allCoachIds.length - 1 ? parseFloat((100 - eq * (allCoachIds.length - 1)).toFixed(2)) : eq : allCoachIds.length === 1 ? 100 : parseFloat(coachShares[coachId]) || eq,
            fixed_amount: splitType === "fixed_amount" ? parseFloat(coachFixedAmounts[coachId] ?? "") || null : null
          }))
        );
      }
      if (selectedDays.length > 0) {
        const rows = [];
        for (const day of selectedDays) {
          const slots = Array.isArray(daySettings[day]) ? daySettings[day] : [daySettings[day] ?? makeSlot()];
          const effDayCoachIds = diffCoachesPerDay ? dayCoachIds[day] || [] : selectedCoachIds;
          for (const { courts: dayCourts, start: startH, end: endH, coachIds: slotCoachIds } of slots) {
            const ss = splitHour(startH), es = splitHour(endH);
            const effCoachIds = slotCoachIds?.length ? slotCoachIds : effDayCoachIds;
            for (const courtId of dayCourts) {
              const base = { court_id: courtId, closure_type: "recurring_weekly", day_of_week: day, start_hour: ss.hour, start_minute: ss.minute, end_hour: es.hour, end_minute: es.minute, reason: groupName.trim(), group_id: group.id, is_active: true };
              if (effCoachIds.length === 0) rows.push(base);
              else effCoachIds.forEach((cid) => rows.push({ ...base, coach_id: cid }));
            }
          }
        }
        if (rows.length > 0) {
          const { error } = await sb.from("court_closures").insert(rows);
          if (error) throw error;
        }
      }
      setCreateVisible(false);
      setCurrentPage(0);
      await loadGroups(0, searchQuery);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const loadMemberPackageSummary = async (groupId, members2) => {
    if (!members2?.length) return;
    const { data: pkgs } = await sb.from("club_group_member_packages").select("member_id, total_sessions, used_sessions, purchased_at").eq("group_id", groupId).order("purchased_at", { ascending: true });
    const summary = {};
    for (const m of members2) {
      const mp = (pkgs || []).filter((p) => p.member_id === m.id);
      const active = mp.find((p) => p.used_sessions < p.total_sessions);
      const pkgIdx = active ? mp.indexOf(active) : mp.length - 1;
      if (mp.length > 0) {
        const pkg = active ?? mp[mp.length - 1];
        summary[m.id] = { label: `${pkgIdx + 1}. Paket`, total: pkg.total_sessions, used: pkg.used_sessions, remaining: pkg.total_sessions - pkg.used_sessions };
      }
    }
    setMemberPackageSummary(summary);
  };
  const openDetail = async (group) => {
    try {
      const [fresh, { data: closures }] = await Promise.all([
        loadGroupDetail(group.id),
        sb.from("court_closures").select("day_of_week,start_hour").eq("group_id", group.id).eq("is_active", true)
      ]);
      setDetailGroup(fresh);
      const slotMap = {};
      for (const c of closures || []) {
        if (c.day_of_week == null) continue;
        const key = `${c.day_of_week}_${c.start_hour || 0}`;
        if (!slotMap[key]) slotMap[key] = { day: c.day_of_week, start_hour: c.start_hour || 0 };
      }
      const slots = Object.values(slotMap).sort((a, b) => (a.day === 0 ? 7 : a.day) - (b.day === 0 ? 7 : b.day) || a.start_hour - b.start_hour);
      setDetailGroupDays([...new Set(slots.map((s) => s.day))]);
      setDetailGroupSlots(slots);
      setDetailTab("members");
      setMemberPackageSummary({});
      if (fresh.billing_type === "credit") await loadMemberPackageSummary(group.id, fresh.members);
      setDetailVisible(true);
    } catch (e) {
      alert(e.message);
    }
  };
  const handleToggleGroup = async (groupId) => {
    try {
      const { data: cur } = await sb.from("club_groups").select("is_active").eq("id", groupId).single();
      if (cur.is_active) await sb.from("court_closures").delete().eq("group_id", groupId);
      await sb.from("club_groups").update({ is_active: !cur.is_active }).eq("id", groupId);
      await loadGroups(currentPage, searchQuery);
      if (detailGroup?.id === groupId) setDetailGroup(await loadGroupDetail(groupId));
    } catch (e) {
      alert(e.message);
    }
  };
  const handleDeleteGroup = async (group) => {
    if (!confirm(`"${group.name}" grubunu silmek istiyor musunuz? Bu i\u015Flem geri al\u0131namaz.`)) return;
    try {
      await sb.from("court_closures").delete().eq("group_id", group.id);
      const { data: posts } = await sb.from("club_group_dues_posts").select("id,finance_record_id").eq("group_id", group.id);
      const fids = (posts || []).map((p) => p.finance_record_id).filter(Boolean);
      if (fids.length > 0) await sb.from("club_finances").delete().in("id", fids);
      await sb.from("club_group_dues_posts").delete().eq("group_id", group.id);
      await sb.from("club_group_dues").delete().eq("group_id", group.id);
      await sb.from("club_group_members").delete().eq("group_id", group.id);
      await sb.from("club_group_coaches").delete().eq("group_id", group.id);
      await sb.from("club_groups").delete().eq("id", group.id);
      setDetailVisible(false);
      setCurrentPage(0);
      await loadGroups(0, searchQuery);
    } catch (e) {
      alert(e.message);
    }
  };
  const reloadDetail = async () => {
    const fresh = await loadGroupDetail(detailGroup.id);
    setDetailGroup(fresh);
    if (fresh.billing_type === "credit") await loadMemberPackageSummary(detailGroup.id, fresh.members);
  };
  const handleRemoveMember = async (member) => {
    if ((detailGroup?.members?.length ?? 0) <= 2) {
      alert("Grupta en az 2 \xFCye bulunmal\u0131d\u0131r");
      return;
    }
    if (!confirm(`"${member.member_name}" grubdan \xE7\u0131kar\u0131ls\u0131n m\u0131?`)) return;
    try {
      await sb.from("club_group_members").delete().eq("id", member.id);
      await reloadDetail();
      await loadGroups(currentPage, searchQuery);
    } catch (e) {
      alert(e.message);
    }
  };
  const calcSessionsInRangeG = (days, from, to) => {
    let count = 0;
    const d = new Date(from);
    d.setHours(12, 0, 0, 0);
    const end = new Date(to);
    end.setHours(12, 0, 0, 0);
    while (d <= end) {
      if (days.includes(d.getDay())) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  };
  useEffect(() => {
    if (!addMemberVisible) {
      setAddMemberRemain({ total: 0, remaining: 0, monthName: "" });
      return;
    }
    const billingType2 = detailGroup?.billing_type;
    if (billingType2 === "credit") {
      const load = async () => {
        const creditSessions2 = detailGroup?.credit_sessions || 8;
        const { data: pkgs } = await sb.from("club_group_member_packages").select("used_sessions, total_sessions").eq("group_id", detailGroup.id);
        const activePkgs = (pkgs || []).filter((p) => p.used_sessions < p.total_sessions);
        const sessionsDone = activePkgs.length > 0 ? Math.max(...activePkgs.map((p) => p.used_sessions)) : 0;
        const remaining = Math.max(creditSessions2 - sessionsDone, 0);
        setAddMemberRemain({ total: creditSessions2, remaining, monthName: "" });
      };
      load();
      return;
    }
    if (billingType2 === "monthly") {
      const days = [...new Set((detailGroupSlots || []).map((s) => s.day))];
      if (!days.length) {
        setAddMemberRemain({ total: 0, remaining: 0, monthName: "" });
        return;
      }
      const joinDate = newMember.joinDate ? /* @__PURE__ */ new Date(newMember.joinDate + "T12:00:00") : /* @__PURE__ */ new Date();
      const targetYear = joinDate.getFullYear();
      const targetMth = joinDate.getMonth();
      const monthStart = new Date(targetYear, targetMth, 1);
      const monthEnd = new Date(targetYear, targetMth + 1, 0);
      const total = calcSessionsInRangeG(days, monthStart, monthEnd);
      const remaining = calcSessionsInRangeG(days, joinDate, monthEnd);
      const MONTHS_TR_LOCAL = ["Ocak", "\u015Eubat", "Mart", "Nisan", "May\u0131s", "Haziran", "Temmuz", "A\u011Fustos", "Eyl\xFCl", "Ekim", "Kas\u0131m", "Aral\u0131k"];
      setAddMemberRemain({ total, remaining, monthName: MONTHS_TR_LOCAL[targetMth] });
    }
  }, [addMemberVisible, newMember.joinDate, detailGroupSlots, detailGroup?.billing_type, detailGroup?.id]);
  const handleAddMember = async () => {
    if (!newMember.name.trim()) {
      alert("\xDCye ad\u0131 bo\u015F olamaz");
      return;
    }
    setAddingMember(true);
    try {
      const feeVal = newMember.fee.trim() && !isNaN(parseFloat(newMember.fee)) ? parseFloat(newMember.fee) : null;
      const joinDateVal = newMember.joinDate.trim() || todayISO();
      const nm = newMember.name.trim();
      const ph = newMember.phone.trim();
      let manualCustomerId = null;
      try {
        if (ph) {
          const matches = await CustomerSvc.findCustomersByPhone(ph, clubId);
          const similar = matches.find((m) => namesLookSimilar(m.full_name, nm));
          if (similar && confirm(`"${similar.full_name}" ile ayn\u0131 telefon numaras\u0131 kullan\u0131yor. Ayn\u0131 ki\u015Fi mi?

Tamam: mevcut m\xFC\u015Fteriye ba\u011Flan\u0131r.
\u0130ptal: yeni ki\u015Fi olu\u015Fturulur.`)) {
            manualCustomerId = similar.id;
          }
        } else {
          const matches = await CustomerSvc.findSimilarCustomersByName(nm, clubId);
          const similar = matches[0];
          if (similar && confirm(`"${similar.full_name}" zaten kay\u0131tl\u0131. Ayn\u0131 \xE7ocuk mu?

Tamam: mevcut kayda ba\u011Flan\u0131r.
\u0130ptal: yeni kay\u0131t olu\u015Fturulur.`)) {
            manualCustomerId = similar.id;
          }
        }
      } catch (_) {
      }
      await sb.from("club_group_members").insert([{ group_id: detailGroup.id, member_name: nm, contact_number: ph || null, contact_person: newMember.contact.trim() || null, custom_fee: feeVal, schedule_slots: newMember.schedule_slots, join_date: joinDateVal, club_customer_id: manualCustomerId }]);
      const { data: newMemberRow } = await sb.from("club_group_members").select("id, member_name").eq("group_id", detailGroup.id).eq("member_name", newMember.name.trim()).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (detailGroup?.billing_type === "credit" && newMemberRow) {
        const fullSessions = detailGroup.credit_sessions || 8;
        const fullPrice = detailGroup.credit_price || 0;
        const initSess = addMemberRemain.remaining > 0 && addMemberRemain.remaining < fullSessions ? addMemberRemain.remaining : fullSessions;
        const initAmt = Math.round(initSess / fullSessions * fullPrice * 100) / 100;
        await sb.from("club_group_member_packages").insert({
          group_id: detailGroup.id,
          club_id: clubId,
          member_id: newMemberRow.id,
          member_name: newMemberRow.member_name,
          total_sessions: initSess,
          used_sessions: 0,
          amount: initAmt,
          is_paid: false,
          purchased_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      if (detailGroup?.billing_type === "monthly" && newMemberRow && addMemberRemain.remaining > 0 && addMemberRemain.total > 0) {
        const now = /* @__PURE__ */ new Date();
        const { data: existingDues } = await sb.from("club_group_dues").select("id").eq("group_id", detailGroup.id).eq("year", now.getFullYear()).eq("month", now.getMonth() + 1).limit(1);
        if (existingDues && existingDues.length > 0) {
          const baseFee = feeVal ?? detailGroup.monthly_fee ?? 0;
          const proratedFee = Math.round(addMemberRemain.remaining / addMemberRemain.total * baseFee * 100) / 100;
          await sb.from("club_group_dues").insert({
            group_id: detailGroup.id,
            club_id: clubId,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            member_id: newMemberRow.id,
            member_name: newMemberRow.member_name,
            amount: proratedFee,
            is_paid: false
          });
        }
      }
      setNewMember({ name: "", phone: "", contact: "", fee: "", schedule_slots: [], joinDate: "" });
      setAddMemberVisible(false);
      await reloadDetail();
      await loadGroups(currentPage, searchQuery);
    } catch (e) {
      alert(e.message);
    } finally {
      setAddingMember(false);
    }
  };
  const handleSaveEditMember = async () => {
    if (!editingMember || !editMemberForm.name.trim()) {
      alert("\xDCye ad\u0131 bo\u015F olamaz");
      return;
    }
    try {
      const feeVal = editMemberForm.fee.trim() && !isNaN(parseFloat(editMemberForm.fee)) ? parseFloat(editMemberForm.fee) : null;
      await sb.from("club_group_members").update({ member_name: editMemberForm.name.trim(), contact_number: editMemberForm.phone.trim() || null, contact_person: editMemberForm.contact.trim() || null, custom_fee: feeVal, schedule_slots: editMemberForm.schedule_slots }).eq("id", editingMember.id);
      setEditMemberVisible(false);
      await reloadDetail();
      await loadGroups(currentPage, searchQuery);
    } catch (e) {
      alert(e.message);
    }
  };
  const openEditSchedule = async (group) => {
    try {
      const [{ data: closures }, { data: groupCoaches }] = await Promise.all([
        sb.from("court_closures").select("court_id,day_of_week,start_hour,start_minute,end_hour,end_minute,coach_id").eq("group_id", group.id),
        sb.from("club_group_coaches").select("coach_id").eq("group_id", group.id)
      ]);
      const perDay = {};
      const perDayCoachMap = {};
      for (const c of closures || []) {
        const d = c.day_of_week;
        if (!perDay[d]) perDay[d] = [];
        const start = combineHour(c.start_hour, c.start_minute || 0);
        const end = combineHour(c.end_hour, c.end_minute || 0);
        let slot = perDay[d].find((sl) => sl.start === start && sl.end === end);
        if (!slot) {
          slot = { courts: [], start, end };
          perDay[d].push(slot);
        }
        if (c.court_id && !slot.courts.includes(c.court_id)) slot.courts.push(c.court_id);
        if (c.coach_id) {
          if (!perDayCoachMap[d]) perDayCoachMap[d] = [];
          if (!perDayCoachMap[d].includes(c.coach_id)) perDayCoachMap[d].push(c.coach_id);
        }
      }
      const days = Object.keys(perDay).map(Number);
      const daySets = Object.values(perDayCoachMap).map((ids) => [...ids].sort().join(","));
      const isDiffPerDay = daySets.length > 1 && !daySets.every((s) => s === daySets[0]);
      const coachIdsFromClosures = [...new Set((closures || []).filter((c) => c.coach_id).map((c) => c.coach_id))];
      const coachIdsFromGC = (groupCoaches || []).map((gc) => gc.coach_id);
      setEditSchedName(group.name);
      setEditSchedDesc(group.description || "");
      setEditSchedDays(days);
      setEditSchedDaySettings(perDay);
      setEditSchedCoachIds(coachIdsFromClosures.length > 0 ? coachIdsFromClosures : coachIdsFromGC);
      setEditDiffCoachesPerDay(isDiffPerDay);
      setEditDayCoachIds(isDiffPerDay ? perDayCoachMap : {});
      setEditSchedUse15Min(false);
      setEditSchedVisible(true);
    } catch (e) {
      alert(e.message);
    }
  };
  const handleSaveSchedule = async () => {
    if (!detailGroup) return;
    if (!editSchedName.trim()) {
      alert("Grup ad\u0131 bo\u015F olamaz");
      return;
    }
    for (const day of editSchedDays) {
      const slots = Array.isArray(editSchedDaySettings[day]) ? editSchedDaySettings[day] : [editSchedDaySettings[day] ?? makeSlot()];
      for (const { start, end } of slots) {
        if (start >= end) {
          alert(`${DAY_NAMES[day]}: Biti\u015F saati ba\u015Flang\u0131\xE7 saatinden b\xFCy\xFCk olmal\u0131`);
          return;
        }
      }
    }
    const editAllCoachIds = editDiffCoachesPerDay ? [...new Set(editSchedDays.flatMap((d) => editDayCoachIds[d] || []))] : editSchedCoachIds;
    const hasCourts = editSchedDays.some((d) => {
      const slots = Array.isArray(editSchedDaySettings[d]) ? editSchedDaySettings[d] : [editSchedDaySettings[d] ?? makeSlot()];
      return slots.some((sl) => sl.courts.length > 0);
    });
    if (editSchedDays.length > 0 && (hasCourts || editAllCoachIds.length > 0)) {
      const active = {};
      editSchedDays.forEach((d) => {
        active[d] = Array.isArray(editSchedDaySettings[d]) ? editSchedDaySettings[d] : [editSchedDaySettings[d] ?? makeSlot()];
      });
      const conflicts = await checkConflicts(active, editSchedCoachIds, detailGroup.id, editDiffCoachesPerDay ? editDayCoachIds : void 0);
      if (conflicts.length > 0) {
        alert("\xC7ak\u0131\u015Fma Var!\n\nA\u015Fa\u011F\u0131daki saatler dolu:\n\n" + conflicts.join("\n"));
        return;
      }
    }
    setSavingSched(true);
    try {
      const primaryCoachId = editAllCoachIds[0] || null;
      await sb.from("club_groups").update({ name: editSchedName.trim(), description: editSchedDesc.trim() || null, coach_id: primaryCoachId }).eq("id", detailGroup.id);
      await sb.from("club_group_coaches").delete().eq("group_id", detailGroup.id);
      if (editAllCoachIds.length > 0) {
        const eq = parseFloat((100 / editAllCoachIds.length).toFixed(2));
        await sb.from("club_group_coaches").insert(
          editAllCoachIds.map((cid, i) => ({ group_id: detailGroup.id, coach_id: cid, share_percentage: i === editAllCoachIds.length - 1 ? parseFloat((100 - eq * (editAllCoachIds.length - 1)).toFixed(2)) : eq }))
        );
      }
      await sb.from("court_closures").delete().eq("group_id", detailGroup.id);
      if (editSchedDays.length > 0) {
        const rows = [];
        for (const day of editSchedDays) {
          const slots = Array.isArray(editSchedDaySettings[day]) ? editSchedDaySettings[day] : [editSchedDaySettings[day] ?? makeSlot()];
          const effDayCoachIds = editDiffCoachesPerDay ? editDayCoachIds[day] || [] : editSchedCoachIds;
          for (const { courts: dayCourts, start: startH, end: endH, coachIds: slotCoachIds } of slots) {
            const ss = splitHour(startH), es = splitHour(endH);
            const effCoachIds = slotCoachIds?.length ? slotCoachIds : effDayCoachIds;
            for (const courtId of dayCourts) {
              const base = { court_id: courtId, closure_type: "recurring_weekly", day_of_week: day, start_hour: ss.hour, start_minute: ss.minute, end_hour: es.hour, end_minute: es.minute, reason: editSchedName.trim(), group_id: detailGroup.id, is_active: true };
              if (effCoachIds.length === 0) rows.push(base);
              else effCoachIds.forEach((cid) => rows.push({ ...base, coach_id: cid }));
            }
          }
        }
        if (rows.length > 0) {
          const { error } = await sb.from("court_closures").insert(rows);
          if (error) throw error;
        }
      }
      setEditSchedVisible(false);
      await reloadDetail();
      await loadGroups(currentPage, searchQuery);
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingSched(false);
    }
  };
  const openEditFee = () => {
    setEditFee(String(detailGroup?.monthly_fee ?? 0));
    setEditPct(String(detailGroup?.club_percentage ?? 100));
    setEditDuesDueDay(String(detailGroup?.dues_due_day ?? 1));
    setEditSplitType(detailGroup?.split_type ?? "percentage");
    const fm = {};
    (detailGroup?.coaches || []).forEach((c) => {
      fm[c.id] = c.fixed_amount != null ? String(c.fixed_amount) : "";
    });
    setEditCoachFixed(fm);
    setEditFeeVisible(true);
  };
  const handleSaveFee = async () => {
    setSavingFee(true);
    try {
      const fee = parseFloat(editFee) || 0;
      const pct = Math.min(100, Math.max(0, parseFloat(editPct) || 100));
      await sb.from("club_groups").update({ monthly_fee: fee, dues_due_day: Math.min(28, Math.max(1, parseInt(editDuesDueDay) || 1)), club_percentage: pct, split_type: editSplitType }).eq("id", detailGroup.id);
      for (const coach of detailGroup?.coaches || []) {
        const faStr = editCoachFixed[coach.id] ?? "";
        const fa = faStr.trim() && !isNaN(parseFloat(faStr)) ? parseFloat(faStr) : null;
        await sb.from("club_group_coaches").update({ fixed_amount: editSplitType === "fixed_amount" ? fa : null }).eq("group_id", detailGroup.id).eq("coach_id", coach.id);
      }
      setEditFeeVisible(false);
      await reloadDetail();
      await loadGroups(currentPage, searchQuery);
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingFee(false);
    }
  };
  const openPayment = async (group) => {
    setPaymentGroup(group);
    setPaymentVisible(true);
    if (group.billing_type === "credit") {
      setPackages([]);
      await loadPackages(group);
    } else {
      const now = /* @__PURE__ */ new Date();
      const yr = now.getFullYear(), mo = now.getMonth() + 1;
      setPayYear(yr);
      setPayMonth(mo);
      setDues([]);
      setDuesPost(null);
      await loadDues(group, yr, mo);
    }
  };
  const loadDues = async (group, year, month) => {
    setLoadingDues(true);
    try {
      const { data: existing } = await sb.from("club_group_dues").select("*").eq("group_id", group.id).eq("year", year).eq("month", month).order("created_at");
      if (existing?.length > 0) {
        setDues(existing);
      } else {
        const { data: mbs } = await sb.from("club_group_members").select("id,member_name,custom_fee").eq("group_id", group.id);
        if (mbs && mbs.length > 0) {
          const { data: created } = await sb.from("club_group_dues").insert(
            mbs.map((m) => ({ group_id: group.id, club_id: clubId, year, month, member_id: m.id, member_name: m.member_name, amount: m.custom_fee != null ? m.custom_fee : group.monthly_fee, is_paid: false }))
          ).select();
          setDues(created || []);
        } else {
          setDues([]);
        }
      }
      const { data: post } = await sb.from("club_group_dues_posts").select("*").eq("group_id", group.id).eq("year", year).eq("month", month).maybeSingle();
      setDuesPost(post);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingDues(false);
    }
  };
  const navigatePayMonth = async (dir) => {
    if (!paymentGroup) return;
    let newMonth = payMonth + dir, newYear = payYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setPayMonth(newMonth);
    setPayYear(newYear);
    setDues([]);
    setDuesPost(null);
    await loadDues(paymentGroup, newYear, newMonth);
  };
  const handleToggleDuePaid = async (due) => {
    if (duesPost) return;
    try {
      const np = !due.is_paid;
      const { data } = await sb.from("club_group_dues").update({ is_paid: np, paid_at: np ? (/* @__PURE__ */ new Date()).toISOString() : null }).eq("id", due.id).select().single();
      setDues((prev) => prev.map((d) => d.id === data.id ? data : d));
    } catch (e) {
      alert(e.message);
    }
  };
  const handlePostToFinance = async () => {
    if (!paymentGroup) return;
    if (!dues.every((d) => d.is_paid)) {
      alert("T\xFCm \xFCyeler \xF6demesini tamamlamadan finansa i\u015Fleyemezsiniz");
      return;
    }
    if (!confirm("Aidat finansa i\u015Flensin mi?")) return;
    setPostingFinance(true);
    try {
      const { error } = await sb.rpc("post_group_dues_to_finance", {
        p_group_id: paymentGroup.id,
        p_year: payYear,
        p_month: payMonth
      });
      if (error) throw error;
      const { data: post } = await sb.from("club_group_dues_posts").select("*").eq("group_id", paymentGroup.id).eq("year", payYear).eq("month", payMonth).maybeSingle();
      setDuesPost(post);
      alert("Aidat kul\xFCp finans kayd\u0131na eklendi");
    } catch (e) {
      alert(e.message);
    } finally {
      setPostingFinance(false);
    }
  };
  const loadPackages = async (group) => {
    setLoadingPackages(true);
    try {
      const { data: mbs } = await sb.from("club_group_members").select("id,member_name").eq("group_id", group.id);
      const { data: pkgs } = await sb.from("club_group_member_packages").select("*").eq("group_id", group.id).order("purchased_at", { ascending: false });
      const memberMap = {};
      for (const m of mbs || []) {
        const memberPkgs = (pkgs || []).filter((p) => p.member_id === m.id);
        const active = memberPkgs.find((p) => p.used_sessions < p.total_sessions);
        memberMap[m.id] = { ...m, packages: memberPkgs, activePackage: active || null };
      }
      setPackages(Object.values(memberMap));
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingPackages(false);
    }
  };
  const handleAddPackage = async () => {
    if (!addPkgMember || !paymentGroup) return;
    const sessions = parseInt(addPkgSessions) || paymentGroup.credit_sessions || 8;
    const price = parseFloat(addPkgPrice) ?? paymentGroup.credit_price ?? 0;
    setSavingPkg(true);
    try {
      await sb.from("club_group_member_packages").insert({
        group_id: paymentGroup.id,
        club_id: clubId,
        member_id: addPkgMember.id,
        member_name: addPkgMember.member_name,
        total_sessions: sessions,
        used_sessions: 0,
        amount: price,
        is_paid: false,
        purchased_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      setAddPkgVisible(false);
      await loadPackages(paymentGroup);
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingPkg(false);
    }
  };
  const handleTogglePkgPaid = async (pkg) => {
    try {
      const np = !pkg.is_paid;
      await sb.from("club_group_member_packages").update({ is_paid: np, paid_at: np ? (/* @__PURE__ */ new Date()).toISOString() : null }).eq("id", pkg.id);
      await loadPackages(paymentGroup);
    } catch (e) {
      alert(e.message);
    }
  };
  const handlePostPkgToFinance = async (pkg) => {
    if (pkg.posted_to_finance) {
      alert("Bu paket zaten finansa i\u015Flenmi\u015F");
      return;
    }
    if (!pkg.is_paid) {
      alert("\xD6nce paketi \xF6denmi\u015F olarak i\u015Faretleyin");
      return;
    }
    if (!confirm("Bu paket finansa i\u015Flensin mi?")) return;
    setPostingPkg(true);
    try {
      const { error } = await sb.rpc("post_group_package_to_finance", { p_package_id: pkg.id });
      if (error) throw error;
      await loadPackages(paymentGroup);
      alert("Paket finansa i\u015Flendi");
    } catch (e) {
      alert(e.message);
    } finally {
      setPostingPkg(false);
    }
  };
  const allSlots = selectedDays.flatMap((dayIdx) => {
    const slots = Array.isArray(daySettings[dayIdx]) ? daySettings[dayIdx] : [daySettings[dayIdx] ?? makeSlot()];
    return slots.map((sl) => ({ day: dayIdx, start_hour: Math.floor(sl.start), start_minute: Math.round(sl.start % 1 * 60), end_hour: Math.floor(sl.end), end_minute: Math.round(sl.end % 1 * 60) }));
  });
  const paidCount = dues.filter((d) => d.is_paid).length;
  const totalDuesAmt = dues.reduce((s, d) => s + d.amount, 0);
  const allDuesPaid = dues.length > 0 && paidCount === dues.length;
  const renderDayCards = (days, settingsState, setSettingsState, coachIdsState, setCoachIdsState, diffPerDay, use15MinStep, setUse15MinStep, globalCoachIds) => {
    if (!days || days.length === 0) return null;
    const getSlots = (p, idx) => Array.isArray(p[idx]) ? p[idx] : p[idx] ? [p[idx]] : [makeSlot()];
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)", fontWeight: 600 } }, "15 Dakikal\u0131k Art\u0131\u015F"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-sm " + (use15MinStep ? "btn-pri" : "btn-ghost"),
        onClick: () => setUse15MinStep((v) => !v)
      },
      use15MinStep ? "A\xE7\u0131k" : "Kapal\u0131"
    ), use15MinStep && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)" } }, "22:15 gibi saatler se\xE7ilebilir")), [...days].sort((a, b) => a - b).map((idx) => {
      const slots = getSlots(settingsState, idx);
      const step = use15MinStep ? 0.25 : 0.5;
      return /* @__PURE__ */ React.createElement("div", { key: idx, style: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 13, color: "var(--text-1)" } }, DAY_NAMES[idx]), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "btn btn-ghost btn-sm",
          style: { fontSize: 12 },
          onClick: () => setSettingsState((p) => {
            const cur = getSlots(p, idx);
            const last = cur[cur.length - 1];
            return { ...p, [idx]: [...cur, { courts: [], start: last.end, end: Math.min(23.75, last.end + 2) }] };
          })
        },
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, verticalAlign: "middle" } }, "add"),
        " Seans Ekle"
      )), diffPerDay && coaches.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "ANTREN\xD6RLER"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, coaches.map((coach) => {
        const dayIds = coachIdsState[idx] || [];
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: coach.id,
            type: "button",
            className: "btn btn-sm " + (dayIds.includes(coach.id) ? "btn-pri" : "btn-ghost"),
            onClick: () => setCoachIdsState((p) => {
              const cur = p[idx] || [];
              return { ...p, [idx]: cur.includes(coach.id) ? cur.filter((id) => id !== coach.id) : [...cur, coach.id] };
            })
          },
          coach.full_name
        );
      }))), slots.map((s, si) => {
        const pool = diffPerDay ? coachIdsState[idx] || [] : globalCoachIds || [];
        const poolCoaches = coaches.filter((c) => pool.includes(c.id));
        return /* @__PURE__ */ React.createElement("div", { key: si, style: { border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", marginBottom: si < slots.length - 1 ? 10 : 0 } }, slots.length > 1 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)" } }, "SEANS ", si + 1), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            className: "btn btn-ghost btn-sm btn-icon",
            onClick: () => setSettingsState((p) => {
              const cur = getSlots(p, idx);
              if (cur.length <= 1) return p;
              return { ...p, [idx]: cur.filter((_, i) => i !== si) };
            })
          },
          /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: "#EF4444" } }, "close")
        )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "KORTLAR"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 } }, courts.map((c) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: c.id,
            type: "button",
            className: "btn btn-sm " + (s.courts.includes(c.id) ? "btn-pri" : "btn-ghost"),
            onClick: () => setSettingsState((p) => {
              const cur = getSlots(p, idx).map((sl, i) => {
                if (i !== si) return sl;
                const nc = sl.courts.includes(c.id) ? sl.courts.filter((id) => id !== c.id) : [...sl.courts, c.id];
                return { ...sl, courts: nc };
              });
              return { ...p, [idx]: cur };
            })
          },
          "Kort ",
          c.court_number
        ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "SAAT ARALI\u011EI"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: poolCoaches.length > 0 ? 10 : 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px" } }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            className: "btn btn-ghost btn-sm btn-icon",
            onClick: () => setSettingsState((p) => {
              const cur = getSlots(p, idx).map((sl, i) => i !== si ? sl : { ...sl, start: Math.max(0, parseFloat((sl.start - step).toFixed(2))) });
              return { ...p, [idx]: cur };
            })
          },
          /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "remove")
        ), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14, minWidth: 40, textAlign: "center" } }, formatHour(s.start)), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            className: "btn btn-ghost btn-sm btn-icon",
            onClick: () => setSettingsState((p) => {
              const cur = getSlots(p, idx).map((sl, i) => {
                if (i !== si) return sl;
                const ns = Math.min(23 - step, parseFloat((sl.start + step).toFixed(2)));
                const gap = sl.end - sl.start;
                return { ...sl, start: ns, end: Math.min(23.75, parseFloat((ns + gap).toFixed(2))) };
              });
              return { ...p, [idx]: cur };
            })
          },
          /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "add")
        )), /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--text-2)", fontSize: 16 } }, "arrow_forward"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px" } }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            className: "btn btn-ghost btn-sm btn-icon",
            onClick: () => setSettingsState((p) => {
              const cur = getSlots(p, idx).map((sl, i) => i !== si ? sl : { ...sl, end: Math.max(step, parseFloat((sl.end - step).toFixed(2))) });
              return { ...p, [idx]: cur };
            })
          },
          /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "remove")
        ), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14, minWidth: 40, textAlign: "center" } }, formatHour(s.end)), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            className: "btn btn-ghost btn-sm btn-icon",
            onClick: () => setSettingsState((p) => {
              const cur = getSlots(p, idx).map((sl, i) => i !== si ? sl : { ...sl, end: Math.min(23.75, parseFloat((sl.end + step).toFixed(2))) });
              return { ...p, [idx]: cur };
            })
          },
          /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "add")
        ))), poolCoaches.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "BU SEANSA GELECEK ANTREN\xD6RLER"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, poolCoaches.map((coach) => {
          const isActive = s.coachIds == null || s.coachIds.includes(coach.id);
          return /* @__PURE__ */ React.createElement(
            "button",
            {
              key: coach.id,
              type: "button",
              className: "btn btn-sm " + (isActive ? "btn-pri" : "btn-ghost"),
              onClick: () => setSettingsState((p) => {
                const cur = getSlots(p, idx).map((sl, i) => {
                  if (i !== si) return sl;
                  const currentIds = sl.coachIds ?? pool;
                  const nextIds = currentIds.includes(coach.id) ? currentIds.filter((id) => id !== coach.id) : [...currentIds, coach.id];
                  return { ...sl, coachIds: nextIds.length === 0 || nextIds.length === pool.length ? void 0 : nextIds };
                });
                return { ...p, [idx]: cur };
              })
            },
            coach.full_name
          );
        }))));
      }));
    }));
  };
  if (loading) return /* @__PURE__ */ React.createElement(Spinner, null);
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Gruplar"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, totalGroups, " grup")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: openCreate }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), "Grup Ekle")), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-2)", fontSize: 18, pointerEvents: "none" } }, "search"), /* @__PURE__ */ React.createElement(
    "input",
    {
      style: { width: "100%", paddingLeft: 38, boxSizing: "border-box" },
      placeholder: "Grup ara...",
      value: searchQuery,
      onChange: (e) => setSearchQuery(e.target.value)
    }
  )), groups.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "groups",
      title: searchQuery ? "Sonu\xE7 bulunamad\u0131" : "Hen\xFCz grup yok",
      sub: searchQuery ? `"${searchQuery}" ile e\u015Fle\u015Fen grup yok` : "D\xFCzenli dersler i\xE7in grup olu\u015Fturun ve kortlara atay\u0131n"
    }
  ) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, groups.map((group) => /* @__PURE__ */ React.createElement("div", { key: group.id, className: "card tight", style: { cursor: "pointer" }, onClick: () => openDetail(group) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "stretch", gap: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 4, borderRadius: "4px 0 0 4px", background: group.is_active ? "#0D9488" : "var(--border)", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "14px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, group.name), /* @__PURE__ */ React.createElement(Badge, { cls: group.is_active ? "b-green" : "" }, group.is_active ? "Aktif" : "Pasif")), group.description && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginBottom: 6 } }, group.description), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-2)" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "person_outline"), group.member_count ?? 0, " \xFCye"), (group.coaches?.length > 0 ? group.coaches : group.coach ? [group.coach] : []).map((c) => /* @__PURE__ */ React.createElement("span", { key: c.id, style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#8B5CF6" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "sports"), c.full_name)), group.monthly_fee > 0 && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#0D9488" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "payments"), group.monthly_fee, " \u20BA/ay")), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-pri btn-sm",
      style: { marginTop: 10, fontSize: 12 },
      onClick: (e) => {
        e.stopPropagation();
        openPayment(group);
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "account_balance_wallet"),
    "\xD6deme Al"
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", paddingRight: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--border)" } }, "chevron_right")))))), totalGroups > PAGE_SIZE && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-ghost btn-sm",
      disabled: currentPage === 0,
      onClick: () => {
        const p = Math.max(0, currentPage - 1);
        setCurrentPage(p);
        loadGroups(p, searchQuery);
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_left"),
    " \xD6nceki"
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-2)" } }, currentPage * PAGE_SIZE + 1, "\u2013", Math.min((currentPage + 1) * PAGE_SIZE, totalGroups), " / ", totalGroups), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-ghost btn-sm",
      disabled: (currentPage + 1) * PAGE_SIZE >= totalGroups,
      onClick: () => {
        const p = currentPage + 1;
        setCurrentPage(p);
        loadGroups(p, searchQuery);
      }
    },
    "Sonraki ",
    /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_right")
  )), createVisible && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "Yeni Grup",
      wide: true,
      onClose: () => setCreateVisible(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setCreateVisible(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: handleSaveGroup, disabled: saving }, saving ? "Kaydediliyor\u2026" : "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "GRUP ADI *" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Pazartesi Sabah Grubu", value: groupName, onChange: (e) => setGroupName(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "A\xC7IKLAMA" }, /* @__PURE__ */ React.createElement("input", { placeholder: "\u0130ste\u011Fe ba\u011Fl\u0131 not", value: groupDesc, onChange: (e) => setGroupDesc(e.target.value) }))), /* @__PURE__ */ React.createElement(Field, { label: "\xD6DEME MODEL\u0130" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" } }, [{ v: "monthly", l: "Ayl\u0131k Aidat" }, { v: "credit", l: "Kredi / Paket" }].map((opt) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.v,
        type: "button",
        style: { flex: 1, padding: "8px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: billingType === opt.v ? "var(--brand-navy)" : "transparent", color: billingType === opt.v ? "#fff" : "var(--text-1)" },
        onClick: () => setBillingType(opt.v)
      },
      opt.l
    )))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, billingType === "monthly" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "AYLIK A\u0130DAT (\u20BA)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", placeholder: "0", value: monthlyFee, onChange: (e) => setMonthlyFee(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "A\u0130DAT SON \xD6DEME G\xDCN\xDC (1\u201328)", hint: "\xDCyelere bu tarihe 7 ve 1 g\xFCn kala, ge\xE7ince de hat\u0131rlatma bildirimi gider (hesab\u0131 olanlara)." }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "1", max: "28", placeholder: "1", value: duesDueDay, onChange: (e) => setDuesDueDay(clampDueDay(e.target.value)) }))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "PAKET SEANS SAYISI" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "1", placeholder: "8", value: creditSessions, onChange: (e) => setCreditSessions(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "PAKET F\u0130YATI (\u20BA)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", placeholder: "0", value: creditPrice, onChange: (e) => setCreditPrice(e.target.value) }))), selectedCoachIds.length > 0 && /* @__PURE__ */ React.createElement(Field, { label: "PAY MODEL\u0130" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" } }, [{ v: "percentage", l: "% Y\xFCzde" }, { v: "fixed_amount", l: "\u20BA Tutar" }].map((opt) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.v,
        type: "button",
        style: { flex: 1, padding: "8px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: splitType === opt.v ? "var(--brand-navy)" : "transparent", color: splitType === opt.v ? "#fff" : "var(--text-1)" },
        onClick: () => setSplitType(opt.v)
      },
      opt.l
    ))))), selectedCoachIds.length > 0 && splitType === "percentage" && /* @__PURE__ */ React.createElement(Field, { label: "KUL\xDCP PAYI (%)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", max: "100", placeholder: "100", value: clubPercentage, onChange: (e) => setClubPercentage(e.target.value) }), parseFloat(clubPercentage) < 100 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 4 } }, "Hoca pay\u0131: %", Math.round((100 - parseFloat(clubPercentage)) * 100) / 100)), selectedCoachIds.length > 0 && splitType === "fixed_amount" && /* @__PURE__ */ React.createElement(Field, { label: "HOCA TUTARLARI (\u20BA / \xF6\u011Frenci ba\u015F\u0131na)" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginBottom: 6 } }, "Her \xF6\u011Frenci i\xE7in hocan\u0131n alaca\u011F\u0131 tutar. Toplam = tutar \xD7 \xF6\u011Frenci say\u0131s\u0131."), selectedCoachIds.map((id) => {
      const c = coaches.find((c2) => c2.id === id);
      return /* @__PURE__ */ React.createElement("div", { key: id, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 13 } }, c?.full_name ?? "Hoca"), /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", style: { width: 100 }, placeholder: "0 \u20BA", value: coachFixedAmounts[id] ?? "", onChange: (e) => setCoachFixedAmounts((p) => ({ ...p, [id]: e.target.value })) }));
    })), selectedCoachIds.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, "Hoca se\xE7ilmedi\u011Finde t\xFCm aidat kul\xFCbe gider"), /* @__PURE__ */ React.createElement(Field, { label: "ANTREN\xD6RLER (\xE7oklu se\xE7im, iste\u011Fe ba\u011Fl\u0131)" }, coaches.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)" } }, "Aktif antren\xF6r bulunamad\u0131") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, coaches.map((c) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: c.id,
        type: "button",
        className: "btn btn-sm " + (selectedCoachIds.includes(c.id) ? "btn-pri" : "btn-ghost"),
        onClick: () => {
          const next = selectedCoachIds.includes(c.id) ? selectedCoachIds.filter((id) => id !== c.id) : [...selectedCoachIds, c.id];
          setSelectedCoachIds(next);
          if (next.length > 0) {
            const eq = parseFloat((100 / next.length).toFixed(2));
            const sh = {};
            next.forEach((id, i) => {
              sh[id] = i === next.length - 1 ? (100 - eq * (next.length - 1)).toFixed(2) : eq.toFixed(2);
            });
            setCoachShares(sh);
          } else setCoachShares({});
        }
      },
      c.full_name
    ))), selectedCoachIds.length > 1 && splitType === "percentage" && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)" } }, "PAYLAR (toplam %100)"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        style: { fontSize: 12, color: "var(--brand-navy)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 },
        onClick: () => {
          const eq = parseFloat((100 / selectedCoachIds.length).toFixed(2));
          const sh = {};
          selectedCoachIds.forEach((id, i) => {
            sh[id] = i === selectedCoachIds.length - 1 ? (100 - eq * (selectedCoachIds.length - 1)).toFixed(2) : eq.toFixed(2);
          });
          setCoachShares(sh);
        }
      },
      "= E\u015Fit B\xF6l"
    )), selectedCoachIds.map((id) => {
      const c = coaches.find((c2) => c2.id === id);
      return /* @__PURE__ */ React.createElement("div", { key: id, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 13 } }, c?.full_name), /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", max: "100", style: { width: 70, textAlign: "center" }, value: coachShares[id] ?? "", onChange: (e) => setCoachShares((p) => ({ ...p, [id]: e.target.value })) }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-2)" } }, "%"));
    }), (() => {
      const total = selectedCoachIds.reduce((s, id) => s + (parseFloat(coachShares[id]) || 0), 0);
      const ok = Math.abs(total - 100) < 0.1;
      return /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: ok ? "#22C55E" : "#EF4444", marginTop: 2 } }, "Toplam: %", total.toFixed(1), " ", ok ? "\u2713" : "\u2717 (100 olmal\u0131)");
    })())), coaches.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, "Farkl\u0131 g\xFCnlere farkl\u0131 hocalar"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, "Her g\xFCn i\xE7in ayr\u0131 antren\xF6r se\xE7in")), /* @__PURE__ */ React.createElement(Switch, { on: diffCoachesPerDay, onChange: (v) => {
      setDiffCoachesPerDay(v);
      if (v) {
        const init2 = {};
        selectedDays.forEach((d) => {
          init2[d] = [...selectedCoachIds];
        });
        setDayCoachIds(init2);
      }
    } })), courts.length > 0 && /* @__PURE__ */ React.createElement(Field, { label: "PROGRAM (iste\u011Fe ba\u011Fl\u0131)" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginBottom: 8 } }, "Her g\xFCn i\xE7in farkl\u0131 kortlar se\xE7ebilirsiniz. Se\xE7ilen kortlar otomatik kapat\u0131l\u0131r, hocan\u0131n takvimine eklenir."), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "G\xDCNLER"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 } }, DAYS.map(([label, idx]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: idx,
        type: "button",
        className: "btn btn-sm " + (selectedDays.includes(idx) ? "btn-pri" : "btn-ghost"),
        onClick: () => {
          if (selectedDays.includes(idx)) {
            setSelectedDays((p) => p.filter((d) => d !== idx));
            setDaySettings((p) => {
              const n = { ...p };
              delete n[idx];
              return n;
            });
            setDayCoachIds((p) => {
              const n = { ...p };
              delete n[idx];
              return n;
            });
          } else {
            setSelectedDays((p) => [...p, idx]);
            setDaySettings((p) => ({ ...p, [idx]: Array.isArray(p[idx]) ? p[idx] : p[idx] ? [p[idx]] : [makeSlot()] }));
            if (diffCoachesPerDay) setDayCoachIds((p) => ({ ...p, [idx]: p[idx] ?? [...selectedCoachIds] }));
          }
        }
      },
      label
    ))), selectedDays.length > 0 && (() => {
      const _days = [...selectedDays].sort((a, b) => a - b);
      const _step = use15Min ? 0.25 : 0.5;
      const _getSlots = (idx) => {
        const v = daySettings[idx];
        return Array.isArray(v) ? v.length > 0 ? v : [makeSlot()] : v ? [v] : [makeSlot()];
      };
      return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)", fontWeight: 600 } }, "15 Dakikal\u0131k Art\u0131\u015F"), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "btn btn-sm " + (use15Min ? "btn-pri" : "btn-ghost"),
          onClick: () => setUse15Min((v) => !v)
        },
        use15Min ? "A\xE7\u0131k" : "Kapal\u0131"
      ), use15Min && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)" } }, "22:15 gibi saatler se\xE7ilebilir")), _days.map((dayIdx) => {
        const _slots = _getSlots(dayIdx);
        return /* @__PURE__ */ React.createElement("div", { key: dayIdx, style: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 13, color: "var(--text-1)" } }, DAY_NAMES[dayIdx]), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            className: "btn btn-ghost btn-sm",
            style: { fontSize: 12 },
            onClick: () => {
              const cur = _getSlots(dayIdx);
              const last = cur[cur.length - 1];
              setDaySettings((p) => ({ ...p, [dayIdx]: [...cur, { courts: [], start: last.end, end: Math.min(23.75, last.end + 2) }] }));
            }
          },
          /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, verticalAlign: "middle" } }, "add"),
          " Seans Ekle"
        )), diffCoachesPerDay && coaches.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "ANTREN\xD6RLER"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, coaches.map((coach) => {
          const _dayIds = dayCoachIds[dayIdx] || [];
          return /* @__PURE__ */ React.createElement(
            "button",
            {
              key: coach.id,
              type: "button",
              className: "btn btn-sm " + (_dayIds.includes(coach.id) ? "btn-pri" : "btn-ghost"),
              onClick: () => setDayCoachIds((p) => {
                const cur = p[dayIdx] || [];
                return { ...p, [dayIdx]: cur.includes(coach.id) ? cur.filter((id) => id !== coach.id) : [...cur, coach.id] };
              })
            },
            coach.full_name
          );
        }))), _slots.map((s, si) => {
          const _pool = diffCoachesPerDay ? dayCoachIds[dayIdx] || [] : selectedCoachIds;
          const _poolCoaches = coaches.filter((c) => _pool.includes(c.id));
          return /* @__PURE__ */ React.createElement("div", { key: si, style: { border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", marginBottom: si < _slots.length - 1 ? 10 : 0 } }, _slots.length > 1 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)" } }, "SEANS ", si + 1), /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              className: "btn btn-ghost btn-sm btn-icon",
              onClick: () => {
                const cur = _getSlots(dayIdx);
                if (cur.length <= 1) return;
                setDaySettings((p) => ({ ...p, [dayIdx]: cur.filter((_, i) => i !== si) }));
              }
            },
            /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: "#EF4444" } }, "close")
          )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "KORTLAR"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 } }, courts.map((c) => /* @__PURE__ */ React.createElement(
            "button",
            {
              key: c.id,
              type: "button",
              className: "btn btn-sm " + (s.courts.includes(c.id) ? "btn-pri" : "btn-ghost"),
              onClick: () => {
                const cur = _getSlots(dayIdx);
                const next = cur.map((sl, i) => i !== si ? sl : { ...sl, courts: sl.courts.includes(c.id) ? sl.courts.filter((id) => id !== c.id) : [...sl.courts, c.id] });
                setDaySettings((p) => ({ ...p, [dayIdx]: next }));
              }
            },
            "Kort ",
            c.court_number
          ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "SAAT ARALI\u011EI"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: _poolCoaches.length > 0 ? 10 : 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm btn-icon", onClick: () => {
            const cur = _getSlots(dayIdx);
            setDaySettings((p) => ({ ...p, [dayIdx]: cur.map((sl, i) => i !== si ? sl : { ...sl, start: Math.max(0, parseFloat((sl.start - _step).toFixed(2))) }) }));
          } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "remove")), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14, minWidth: 40, textAlign: "center" } }, formatHour(s.start)), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm btn-icon", onClick: () => {
            const cur = _getSlots(dayIdx);
            setDaySettings((p) => ({ ...p, [dayIdx]: cur.map((sl, i) => {
              if (i !== si) return sl;
              const ns = Math.min(23 - _step, parseFloat((sl.start + _step).toFixed(2)));
              const gap = sl.end - sl.start;
              return { ...sl, start: ns, end: Math.min(23.75, parseFloat((ns + gap).toFixed(2))) };
            }) }));
          } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "add"))), /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--text-2)", fontSize: 16 } }, "arrow_forward"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm btn-icon", onClick: () => {
            const cur = _getSlots(dayIdx);
            setDaySettings((p) => ({ ...p, [dayIdx]: cur.map((sl, i) => i !== si ? sl : { ...sl, end: Math.max(_step, parseFloat((sl.end - _step).toFixed(2))) }) }));
          } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "remove")), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14, minWidth: 40, textAlign: "center" } }, formatHour(s.end)), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm btn-icon", onClick: () => {
            const cur = _getSlots(dayIdx);
            setDaySettings((p) => ({ ...p, [dayIdx]: cur.map((sl, i) => i !== si ? sl : { ...sl, end: Math.min(23.75, parseFloat((sl.end + _step).toFixed(2))) }) }));
          } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "add")))), _poolCoaches.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "BU SEANSA GELECEK ANTREN\xD6RLER"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, _poolCoaches.map((coach) => {
            const _isActive = s.coachIds == null || s.coachIds.includes(coach.id);
            return /* @__PURE__ */ React.createElement(
              "button",
              {
                key: coach.id,
                type: "button",
                className: "btn btn-sm " + (_isActive ? "btn-pri" : "btn-ghost"),
                onClick: () => {
                  const cur = _getSlots(dayIdx);
                  const next = cur.map((sl, i) => {
                    if (i !== si) return sl;
                    const cids = sl.coachIds ?? _pool;
                    const nids = cids.includes(coach.id) ? cids.filter((id) => id !== coach.id) : [...cids, coach.id];
                    return { ...sl, coachIds: nids.length === 0 || nids.length === _pool.length ? void 0 : nids };
                  });
                  setDaySettings((p) => ({ ...p, [dayIdx]: next }));
                }
              },
              coach.full_name
            );
          }))));
        }));
      }));
    })()), /* @__PURE__ */ React.createElement(Field, { label: `\xDCYELER (${members.filter((m) => m.name.trim()).length}/${members.length}, en az 2 gerekli)` }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, members.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: m.key, style: { display: "flex", gap: 8, alignItems: "flex-start", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 22, height: 22, borderRadius: 11, background: "var(--brand-navy-soft,#EEF2FF)", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 800, color: "var(--brand-navy)" } }, i + 1)), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 6 } }, /* @__PURE__ */ React.createElement("input", { placeholder: "Ad Soyad *", value: m.name, onChange: (e) => setMembers((p) => p.map((r) => r.key === m.key ? { ...r, name: e.target.value } : r)) }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("input", { style: { flex: 1 }, placeholder: "\u0130leti\u015Fim no", value: m.phone, onChange: (e) => setMembers((p) => p.map((r) => r.key === m.key ? { ...r, phone: e.target.value } : r)) }), /* @__PURE__ */ React.createElement("input", { style: { flex: 1 }, placeholder: "Ki\u015Fi (veli vb.)", value: m.contact, onChange: (e) => setMembers((p) => p.map((r) => r.key === m.key ? { ...r, contact: e.target.value } : r)) })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", style: { flex: 1 }, placeholder: `\xD6zel \xDCcret \u20BA (bo\u015F: ${monthlyFee || "0"} \u20BA)`, value: m.fee, onChange: (e) => setMembers((p) => p.map((r) => r.key === m.key ? { ...r, fee: e.target.value } : r)) }), /* @__PURE__ */ React.createElement("input", { type: "date", style: { flex: 1 }, title: "Kat\u0131l\u0131m Tarihi (bo\u015F: bug\xFCn)", value: m.joinDate, onChange: (e) => setMembers((p) => p.map((r) => r.key === m.key ? { ...r, joinDate: e.target.value } : r)) })), allSlots.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 } }, allSlots.map((slot, si) => {
      const effectiveSlots = (m.schedule_slots || []).length === 0 ? allSlots : m.schedule_slots;
      const active = effectiveSlots.some((s) => s.day === slot.day && s.start_hour === slot.start_hour && (s.start_minute || 0) === (slot.start_minute || 0));
      const dayLbl = ["Paz", "Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt"][slot.day];
      const timeLbl = `${String(slot.start_hour).padStart(2, "0")}:${String(slot.start_minute || 0).padStart(2, "0")}`;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: si,
          type: "button",
          style: {
            padding: "2px 7px",
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 5,
            border: "1px solid",
            cursor: "pointer",
            borderColor: active ? "#0D9488" : "var(--border)",
            background: active ? "#0D948818" : "var(--surface)",
            color: active ? "#0D9488" : "var(--text-2)"
          },
          onClick: () => {
            const base = (m.schedule_slots || []).length === 0 ? [...allSlots] : m.schedule_slots;
            const next = active ? base.filter((s) => !(s.day === slot.day && s.start_hour === slot.start_hour && (s.start_minute || 0) === (slot.start_minute || 0))) : [...base, slot];
            setMembers((p) => p.map((r) => r.key === m.key ? { ...r, schedule_slots: next } : r));
          }
        },
        dayLbl,
        " ",
        timeLbl
      );
    }))), members.length > 3 && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        style: { background: "none", border: "none", cursor: "pointer", color: "#EF4444", marginTop: 6, padding: 2 },
        onClick: () => setMembers((p) => p.filter((r) => r.key !== m.key))
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "close")
    ))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-sm",
        onClick: () => setMembers((p) => [...p, makeMember()])
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "add"),
      " \xDCye Ekle"
    ))))
  ), detailVisible && detailGroup && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: detailGroup.name,
      wide: true,
      onClose: () => setDetailVisible(false),
      footer: /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", width: "100%" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", onClick: () => handleDeleteGroup(detailGroup) }, "Sil"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => handleToggleGroup(detailGroup.id) }, detailGroup.is_active ? "Pasife Al" : "Aktifle\u015Ftir")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setDetailVisible(false) }, "Kapat"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "tabs", style: { marginBottom: 16 } }, [{ k: "members", l: "\xDCyeler" }, { k: "schedule", l: "Program" }, { k: "settings", l: "\xDCcret & Ayarlar" }].map((t) => /* @__PURE__ */ React.createElement("button", { key: t.k, className: detailTab === t.k ? "active" : "", onClick: () => setDetailTab(t.k) }, t.l))),
    detailTab === "members" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: () => {
      setNewMember({ name: "", phone: "", contact: "", fee: "", schedule_slots: [...detailGroupSlots], joinDate: "" });
      setAddMemberVisible(true);
    } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "person_add"), " \xDCye Ekle")), (detailGroup.members || []).length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "person", title: "\xDCye yok" }) : (detailGroup.members || []).map((member) => /* @__PURE__ */ React.createElement("div", { key: member.id, style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 34, height: 34, borderRadius: 17, background: "#EEF2FF", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" } }, member.member_name?.charAt(0)?.toUpperCase())), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, member.member_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, [member.contact_number, member.contact_person].filter(Boolean).join(" \xB7 ")), member.custom_fee != null && detailGroup?.billing_type !== "credit" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#0D9488" } }, "\xD6zel: \u20BA", member.custom_fee, "/ay"), (member.schedule_slots || []).length > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#0D9488", fontWeight: 600, marginTop: 1 } }, (member.schedule_slots || []).slice().sort((a, b) => (a.day === 0 ? 7 : a.day) - (b.day === 0 ? 7 : b.day) || a.start_hour - b.start_hour).map((s) => `${["Paz", "Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt"][s.day]} ${String(s.start_hour).padStart(2, "0")}:00`).join(" \xB7 ")), detailGroup?.billing_type === "credit" && memberPackageSummary[member.id] && (() => {
      const pkg = memberPackageSummary[member.id];
      const barPct = pkg.total > 0 ? Math.round(pkg.used / pkg.total * 100) : 0;
      const barColor = pkg.remaining <= 2 ? "#EF4444" : pkg.remaining <= 4 ? "#F59E0B" : "#22C55E";
      return /* @__PURE__ */ React.createElement("div", { style: { marginTop: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "var(--text-2)" } }, pkg.label), /* @__PURE__ */ React.createElement("span", { style: { color: barColor, fontWeight: 700 } }, pkg.used, "/", pkg.total, " \xB7 ", pkg.remaining, " kald\u0131")), /* @__PURE__ */ React.createElement("div", { style: { height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${barPct}%`, background: barColor, borderRadius: 2, transition: "width 0.4s" } })));
    })()), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn btn-ghost btn-sm btn-icon",
        title: "D\xFCzenle",
        onClick: () => {
          setEditingMember(member);
          const currentSlots = (member.schedule_slots?.length ?? 0) > 0 ? member.schedule_slots : [...detailGroupSlots];
          setEditMemberForm({ name: member.member_name, phone: member.contact_number || "", contact: member.contact_person || "", fee: member.custom_fee != null ? String(member.custom_fee) : "", schedule_slots: currentSlots });
          setEditMemberVisible(true);
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "edit")
    ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", title: "\xC7\u0131kar", onClick: () => handleRemoveMember(member) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "person_remove"))))),
    detailTab === "schedule" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: () => openEditSchedule(detailGroup) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "edit"), " Program\u0131 D\xFCzenle")), /* @__PURE__ */ React.createElement(ScheduleDisplay, { groupId: detailGroup.id, courts, coaches })),
    detailTab === "settings" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: openEditFee }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "edit"), " D\xFCzenle")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Ayl\u0131k Aidat"), /* @__PURE__ */ React.createElement("span", { className: "v" }, "\u20BA", detailGroup.monthly_fee ?? 0, "/ay")), detailGroup.billing_type === "monthly" && /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Aidat Son \xD6deme"), /* @__PURE__ */ React.createElement("span", { className: "v" }, "Ay\u0131n ", detailGroup.dues_due_day ?? 1, ". g\xFCn\xFC")), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Kul\xFCp Pay\u0131"), /* @__PURE__ */ React.createElement("span", { className: "v" }, "%", detailGroup.club_percentage ?? 100)), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Pay Modeli"), /* @__PURE__ */ React.createElement("span", { className: "v" }, detailGroup.split_type === "fixed_amount" ? "\u20BA Sabit Tutar" : "% Y\xFCzde")), (detailGroup.coaches || []).length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13, marginBottom: 6 } }, "Antren\xF6rler"), (detailGroup.coaches || []).map((c) => /* @__PURE__ */ React.createElement("div", { key: c.id, style: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", null, c.full_name), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-2)" } }, detailGroup.split_type === "fixed_amount" ? `\u20BA${c.fixed_amount ?? 0}` : `%${c.share_percentage}`))))))
  ), addMemberVisible && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "\xDCye Ekle",
      onClose: () => setAddMemberVisible(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setAddMemberVisible(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: handleAddMember, disabled: addingMember }, addingMember ? "Ekleniyor\u2026" : "Ekle"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Field, { label: "AD SOYAD *" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Ad Soyad", value: newMember.name, onChange: (e) => setNewMember({ ...newMember, name: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "TELEFON" }, /* @__PURE__ */ React.createElement("input", { placeholder: "\u0130leti\u015Fim no", value: newMember.phone, onChange: (e) => setNewMember({ ...newMember, phone: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "K\u0130\u015E\u0130" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Veli ad\u0131 vb.", value: newMember.contact, onChange: (e) => setNewMember({ ...newMember, contact: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "\xD6ZEL \xDCCRET (\u20BA)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", placeholder: `Bo\u015F: ${detailGroup?.monthly_fee ?? 0} \u20BA`, value: newMember.fee, onChange: (e) => setNewMember({ ...newMember, fee: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "KATILIM TAR\u0130H\u0130" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: newMember.joinDate, onChange: (e) => setNewMember({ ...newMember, joinDate: e.target.value }), placeholder: todayISO() }))), addMemberRemain.total > 0 && (() => {
      const mn = addMemberRemain.monthName;
      if (detailGroup?.billing_type === "credit") {
        const fullSess = detailGroup.credit_sessions || 8;
        const fullPrice = detailGroup.credit_price || 0;
        const sessionsDone = fullSess - addMemberRemain.remaining;
        const initSess = addMemberRemain.remaining > 0 && addMemberRemain.remaining < fullSess ? addMemberRemain.remaining : fullSess;
        const initAmt = Math.round(initSess / fullSess * fullPrice * 100) / 100;
        const label = addMemberRemain.remaining === 0 ? `Aktif pakette t\xFCm ${fullSess} ders yap\u0131lm\u0131\u015F \u2192 Tam yeni paket: ${fullSess} seans / ${fullPrice.toFixed(2)} \u20BA` : addMemberRemain.remaining < fullSess ? `Aktif pakette ${sessionsDone}/${fullSess} ders yap\u0131lm\u0131\u015F, ${addMemberRemain.remaining} ders kald\u0131 \u2192 \u0130lk paket: ${initSess} seans / ${initAmt.toFixed(2)} \u20BA` : `Paket hen\xFCz ba\u015Flamam\u0131\u015F \u2192 Tam paket: ${fullSess} seans / ${fullPrice.toFixed(2)} \u20BA`;
        return /* @__PURE__ */ React.createElement("div", { style: { background: "#EFF6FF", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#1D4ED8" } }, label);
      }
      if (detailGroup?.billing_type === "monthly") {
        const feeVal2 = newMember.fee.trim() && !isNaN(parseFloat(newMember.fee)) ? parseFloat(newMember.fee) : null;
        const baseFee = feeVal2 ?? detailGroup?.monthly_fee ?? 0;
        const prorated = Math.round(addMemberRemain.remaining / addMemberRemain.total * baseFee * 100) / 100;
        const label = addMemberRemain.remaining === 0 ? `${mn}'da bu tarihten sonra ders yok` : `${mn}'da ${addMemberRemain.total} ders / ${addMemberRemain.remaining} kat\u0131lacak \u2192 Orant\u0131l\u0131 aidat: ${prorated.toFixed(2)} \u20BA`;
        return /* @__PURE__ */ React.createElement("div", { style: { background: "#F0FDF4", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#15803D" } }, label);
      }
      return null;
    })(), detailGroupSlots.length > 0 && /* @__PURE__ */ React.createElement(Field, { label: "SEANSLAR" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, detailGroupSlots.map((slot, si) => {
      const active = (newMember.schedule_slots || []).some((s) => s.day === slot.day && s.start_hour === slot.start_hour);
      const lbl = `${["Paz", "Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt"][slot.day]} ${String(slot.start_hour).padStart(2, "0")}:00`;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: si,
          type: "button",
          style: {
            padding: "3px 9px",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 6,
            border: "1px solid",
            cursor: "pointer",
            borderColor: active ? "#0D9488" : "var(--border)",
            background: active ? "#0D948818" : "var(--surface)",
            color: active ? "#0D9488" : "var(--text-2)"
          },
          onClick: () => setNewMember((p) => {
            const cur = p.schedule_slots || [];
            return { ...p, schedule_slots: active ? cur.filter((s) => !(s.day === slot.day && s.start_hour === slot.start_hour)) : [...cur, slot] };
          })
        },
        lbl
      );
    }))))
  ), editMemberVisible && editingMember && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "\xDCyeyi D\xFCzenle",
      onClose: () => setEditMemberVisible(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setEditMemberVisible(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: handleSaveEditMember }, "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Field, { label: "AD SOYAD *" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Ad Soyad", value: editMemberForm.name, onChange: (e) => setEditMemberForm({ ...editMemberForm, name: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "TELEFON" }, /* @__PURE__ */ React.createElement("input", { placeholder: "\u0130leti\u015Fim no", value: editMemberForm.phone, onChange: (e) => setEditMemberForm({ ...editMemberForm, phone: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "K\u0130\u015E\u0130" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Veli ad\u0131 vb.", value: editMemberForm.contact, onChange: (e) => setEditMemberForm({ ...editMemberForm, contact: e.target.value }) }))), /* @__PURE__ */ React.createElement(Field, { label: "\xD6ZEL \xDCCRET (\u20BA)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", placeholder: "Bo\u015F: grup aidat\u0131", value: editMemberForm.fee, onChange: (e) => setEditMemberForm({ ...editMemberForm, fee: e.target.value }) })), detailGroupSlots.length > 0 && /* @__PURE__ */ React.createElement(Field, { label: "SEANSLAR" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, detailGroupSlots.map((slot, si) => {
      const active = (editMemberForm.schedule_slots || []).some((s) => s.day === slot.day && s.start_hour === slot.start_hour);
      const lbl = `${["Paz", "Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt"][slot.day]} ${String(slot.start_hour).padStart(2, "0")}:00`;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: si,
          type: "button",
          style: {
            padding: "3px 9px",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 6,
            border: "1px solid",
            cursor: "pointer",
            borderColor: active ? "#0D9488" : "var(--border)",
            background: active ? "#0D948818" : "var(--surface)",
            color: active ? "#0D9488" : "var(--text-2)"
          },
          onClick: () => setEditMemberForm((p) => {
            const cur = p.schedule_slots || [];
            return { ...p, schedule_slots: active ? cur.filter((s) => !(s.day === slot.day && s.start_hour === slot.start_hour)) : [...cur, slot] };
          })
        },
        lbl
      );
    }))))
  ), editSchedVisible && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "Program\u0131 D\xFCzenle",
      wide: true,
      onClose: () => setEditSchedVisible(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setEditSchedVisible(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: handleSaveSchedule, disabled: savingSched }, savingSched ? "Kaydediliyor\u2026" : "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "GRUP ADI" }, /* @__PURE__ */ React.createElement("input", { value: editSchedName, onChange: (e) => setEditSchedName(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "A\xC7IKLAMA" }, /* @__PURE__ */ React.createElement("input", { placeholder: "\u0130ste\u011Fe ba\u011Fl\u0131", value: editSchedDesc, onChange: (e) => setEditSchedDesc(e.target.value) }))), coaches.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, "Farkl\u0131 g\xFCnlere farkl\u0131 hocalar")), /* @__PURE__ */ React.createElement(Switch, { on: editDiffCoachesPerDay, onChange: (v) => {
      setEditDiffCoachesPerDay(v);
      if (!v) setEditDayCoachIds({});
    } })), !editDiffCoachesPerDay && /* @__PURE__ */ React.createElement(Field, { label: "ANTREN\xD6RLER" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, coaches.map((c) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: c.id,
        type: "button",
        className: "btn btn-sm " + (editSchedCoachIds.includes(c.id) ? "btn-pri" : "btn-ghost"),
        onClick: () => setEditSchedCoachIds((p) => p.includes(c.id) ? p.filter((id) => id !== c.id) : [...p, c.id])
      },
      c.full_name
    )))), courts.length > 0 && /* @__PURE__ */ React.createElement(Field, { label: "G\xDCNLER" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 } }, DAYS.map(([label, idx]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: idx,
        type: "button",
        className: "btn btn-sm " + (editSchedDays.includes(idx) ? "btn-pri" : "btn-ghost"),
        onClick: () => {
          if (editSchedDays.includes(idx)) {
            setEditSchedDays((p) => p.filter((d) => d !== idx));
            setEditSchedDaySettings((p) => {
              const n = { ...p };
              delete n[idx];
              return n;
            });
            setEditDayCoachIds((p) => {
              const n = { ...p };
              delete n[idx];
              return n;
            });
          } else {
            setEditSchedDays((p) => [...p, idx]);
            setEditSchedDaySettings((p) => ({ ...p, [idx]: Array.isArray(p[idx]) ? p[idx] : p[idx] ? [p[idx]] : [makeSlot()] }));
            if (editDiffCoachesPerDay) setEditDayCoachIds((p) => ({ ...p, [idx]: p[idx] ?? [...editSchedCoachIds] }));
          }
        }
      },
      label
    ))), editSchedDays.length > 0 && (() => {
      const _days = [...editSchedDays].sort((a, b) => a - b);
      const _step = editSchedUse15Min ? 0.25 : 0.5;
      const _getSlots = (idx) => {
        const v = editSchedDaySettings[idx];
        return Array.isArray(v) ? v.length > 0 ? v : [makeSlot()] : v ? [v] : [makeSlot()];
      };
      return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)", fontWeight: 600 } }, "15 Dakikal\u0131k Art\u0131\u015F"), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "btn btn-sm " + (editSchedUse15Min ? "btn-pri" : "btn-ghost"),
          onClick: () => setEditSchedUse15Min((v) => !v)
        },
        editSchedUse15Min ? "A\xE7\u0131k" : "Kapal\u0131"
      ), editSchedUse15Min && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)" } }, "22:15 gibi saatler se\xE7ilebilir")), _days.map((dayIdx) => {
        const _slots = _getSlots(dayIdx);
        return /* @__PURE__ */ React.createElement("div", { key: dayIdx, style: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 13, color: "var(--text-1)" } }, DAY_NAMES[dayIdx]), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            className: "btn btn-ghost btn-sm",
            style: { fontSize: 12 },
            onClick: () => {
              const cur = _getSlots(dayIdx);
              const last = cur[cur.length - 1];
              setEditSchedDaySettings((p) => ({ ...p, [dayIdx]: [...cur, { courts: [], start: last.end, end: Math.min(23.75, last.end + 2) }] }));
            }
          },
          /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, verticalAlign: "middle" } }, "add"),
          " Seans Ekle"
        )), editDiffCoachesPerDay && coaches.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "ANTREN\xD6RLER"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, coaches.map((coach) => {
          const _dayIds = editDayCoachIds[dayIdx] || [];
          return /* @__PURE__ */ React.createElement(
            "button",
            {
              key: coach.id,
              type: "button",
              className: "btn btn-sm " + (_dayIds.includes(coach.id) ? "btn-pri" : "btn-ghost"),
              onClick: () => setEditDayCoachIds((p) => {
                const cur = p[dayIdx] || [];
                return { ...p, [dayIdx]: cur.includes(coach.id) ? cur.filter((id) => id !== coach.id) : [...cur, coach.id] };
              })
            },
            coach.full_name
          );
        }))), _slots.map((s, si) => {
          const _pool = editDiffCoachesPerDay ? editDayCoachIds[dayIdx] || [] : editSchedCoachIds;
          const _poolCoaches = coaches.filter((c) => _pool.includes(c.id));
          return /* @__PURE__ */ React.createElement("div", { key: si, style: { border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", marginBottom: si < _slots.length - 1 ? 10 : 0 } }, _slots.length > 1 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)" } }, "SEANS ", si + 1), /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              className: "btn btn-ghost btn-sm btn-icon",
              onClick: () => {
                const cur = _getSlots(dayIdx);
                if (cur.length <= 1) return;
                setEditSchedDaySettings((p) => ({ ...p, [dayIdx]: cur.filter((_, i) => i !== si) }));
              }
            },
            /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: "#EF4444" } }, "close")
          )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "KORTLAR"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 } }, courts.map((c) => /* @__PURE__ */ React.createElement(
            "button",
            {
              key: c.id,
              type: "button",
              className: "btn btn-sm " + (s.courts.includes(c.id) ? "btn-pri" : "btn-ghost"),
              onClick: () => {
                const cur = _getSlots(dayIdx);
                const next = cur.map((sl, i) => i !== si ? sl : { ...sl, courts: sl.courts.includes(c.id) ? sl.courts.filter((id) => id !== c.id) : [...sl.courts, c.id] });
                setEditSchedDaySettings((p) => ({ ...p, [dayIdx]: next }));
              }
            },
            "Kort ",
            c.court_number
          ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "SAAT ARALI\u011EI"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: _poolCoaches.length > 0 ? 10 : 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm btn-icon", onClick: () => {
            const cur = _getSlots(dayIdx);
            setEditSchedDaySettings((p) => ({ ...p, [dayIdx]: cur.map((sl, i) => i !== si ? sl : { ...sl, start: Math.max(0, parseFloat((sl.start - _step).toFixed(2))) }) }));
          } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "remove")), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14, minWidth: 40, textAlign: "center" } }, formatHour(s.start)), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm btn-icon", onClick: () => {
            const cur = _getSlots(dayIdx);
            setEditSchedDaySettings((p) => ({ ...p, [dayIdx]: cur.map((sl, i) => {
              if (i !== si) return sl;
              const ns = Math.min(23 - _step, parseFloat((sl.start + _step).toFixed(2)));
              const gap = sl.end - sl.start;
              return { ...sl, start: ns, end: Math.min(23.75, parseFloat((ns + gap).toFixed(2))) };
            }) }));
          } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "add"))), /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--text-2)", fontSize: 16 } }, "arrow_forward"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm btn-icon", onClick: () => {
            const cur = _getSlots(dayIdx);
            setEditSchedDaySettings((p) => ({ ...p, [dayIdx]: cur.map((sl, i) => i !== si ? sl : { ...sl, end: Math.max(_step, parseFloat((sl.end - _step).toFixed(2))) }) }));
          } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "remove")), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14, minWidth: 40, textAlign: "center" } }, formatHour(s.end)), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm btn-icon", onClick: () => {
            const cur = _getSlots(dayIdx);
            setEditSchedDaySettings((p) => ({ ...p, [dayIdx]: cur.map((sl, i) => i !== si ? sl : { ...sl, end: Math.min(23.75, parseFloat((sl.end + _step).toFixed(2))) }) }));
          } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "add")))), _poolCoaches.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "BU SEANSA GELECEK ANTREN\xD6RLER"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, _poolCoaches.map((coach) => {
            const _isActive = s.coachIds == null || s.coachIds.includes(coach.id);
            return /* @__PURE__ */ React.createElement(
              "button",
              {
                key: coach.id,
                type: "button",
                className: "btn btn-sm " + (_isActive ? "btn-pri" : "btn-ghost"),
                onClick: () => {
                  const cur = _getSlots(dayIdx);
                  const next = cur.map((sl, i) => {
                    if (i !== si) return sl;
                    const cids = sl.coachIds ?? _pool;
                    const nids = cids.includes(coach.id) ? cids.filter((id) => id !== coach.id) : [...cids, coach.id];
                    return { ...sl, coachIds: nids.length === 0 || nids.length === _pool.length ? void 0 : nids };
                  });
                  setEditSchedDaySettings((p) => ({ ...p, [dayIdx]: next }));
                }
              },
              coach.full_name
            );
          }))));
        }));
      }));
    })()))
  ), editFeeVisible && detailGroup && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "\xDCcret & Pay Ayarlar\u0131",
      onClose: () => setEditFeeVisible(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setEditFeeVisible(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: handleSaveFee, disabled: savingFee }, savingFee ? "Kaydediliyor\u2026" : "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "AYLIK A\u0130DAT (\u20BA)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", value: editFee, onChange: (e) => setEditFee(e.target.value) })), detailGroup.billing_type === "monthly" && /* @__PURE__ */ React.createElement(Field, { label: "A\u0130DAT SON \xD6DEME G\xDCN\xDC (1\u201328)", hint: "\xDCyelere bu tarihe 7 ve 1 g\xFCn kala, ge\xE7ince de hat\u0131rlatma bildirimi gider (hesab\u0131 olanlara)." }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "1", max: "28", value: editDuesDueDay, onChange: (e) => setEditDuesDueDay(clampDueDay(e.target.value)) })), (detailGroup.coaches || []).length > 0 && /* @__PURE__ */ React.createElement(Field, { label: "PAY MODEL\u0130" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" } }, [{ v: "percentage", l: "% Y\xFCzde" }, { v: "fixed_amount", l: "\u20BA Tutar" }].map((opt) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.v,
        type: "button",
        style: { flex: 1, padding: "8px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: editSplitType === opt.v ? "var(--brand-navy)" : "transparent", color: editSplitType === opt.v ? "#fff" : "var(--text-1)" },
        onClick: () => setEditSplitType(opt.v)
      },
      opt.l
    )))), (detailGroup.coaches || []).length > 0 && editSplitType === "percentage" && /* @__PURE__ */ React.createElement(Field, { label: "KUL\xDCP PAYI (%)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", max: "100", value: editPct, onChange: (e) => setEditPct(e.target.value) }), parseFloat(editPct) < 100 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 4 } }, "Hoca pay\u0131: %", Math.round((100 - parseFloat(editPct)) * 100) / 100)), (detailGroup.coaches || []).length > 0 && editSplitType === "fixed_amount" && /* @__PURE__ */ React.createElement(Field, { label: "HOCA TUTARLARI (\u20BA / \xF6\u011Frenci ba\u015F\u0131na)" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginBottom: 6 } }, "Her \xF6\u011Frenci i\xE7in hocan\u0131n alaca\u011F\u0131 tutar. Toplam = tutar \xD7 \xF6\u011Frenci say\u0131s\u0131."), (detailGroup.coaches || []).map((c) => /* @__PURE__ */ React.createElement("div", { key: c.id, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 13 } }, c.full_name), /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", style: { width: 100 }, placeholder: "0 \u20BA", value: editCoachFixed[c.id] ?? "", onChange: (e) => setEditCoachFixed((p) => ({ ...p, [c.id]: e.target.value })) })))))
  ), paymentVisible && paymentGroup && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: `${paymentGroup.name} \u2014 ${paymentGroup.billing_type === "credit" ? "Paket Takibi" : "Aidat Takibi"}`,
      wide: true,
      onClose: () => setPaymentVisible(false),
      footer: /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setPaymentVisible(false) }, "Kapat")
    },
    paymentGroup.billing_type === "credit" ? (
      /* ── KREDİ / PAKET GÖRÜNÜMÜ ── */
      loadingPackages ? /* @__PURE__ */ React.createElement(Spinner, { size: 28 }) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-2)" } }, paymentGroup.credit_sessions, " seans / paket \xB7 \u20BA", paymentGroup.credit_price, " / paket")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, packages.map((mb) => {
        const ap = mb.activePackage;
        const remaining = ap ? ap.total_sessions - ap.used_sessions : 0;
        return /* @__PURE__ */ React.createElement("div", { key: mb.id, style: { padding: "12px 14px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: ap ? 10 : 0 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 34, height: 34, borderRadius: 17, background: "#EEF2FF", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" } }, mb.member_name?.charAt(0)?.toUpperCase())), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, mb.member_name), ap ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: remaining <= 2 ? "#EF4444" : "#22C55E", fontWeight: 600 } }, remaining, " seans kald\u0131 (", ap.used_sessions, "/", ap.total_sessions, ")") : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, "Aktif paket yok")), /* @__PURE__ */ React.createElement(
          "button",
          {
            className: "btn btn-ghost btn-sm",
            style: { fontSize: 12 },
            onClick: () => {
              setAddPkgMember(mb);
              setAddPkgSessions(String(paymentGroup.credit_sessions || 8));
              setAddPkgPrice(String(paymentGroup.credit_price || 0));
              setAddPkgVisible(true);
            }
          },
          /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, verticalAlign: "middle" } }, "add"),
          " Paket"
        )), mb.packages.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginTop: 6 } }, mb.packages.map((pkg) => /* @__PURE__ */ React.createElement("div", { key: pkg.id, style: { display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--surface)", borderRadius: 8, border: `1px solid ${pkg.posted_to_finance ? "#BBF7D0" : pkg.is_paid ? "#C7D2FE" : "var(--border)"}` } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, flex: 1, color: "var(--text-2)" } }, pkg.total_sessions, " seans \xB7 \u20BA", pkg.amount, pkg.purchased_at && ` \xB7 ${new Date(pkg.purchased_at).toLocaleDateString("tr-TR")}`), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: pkg.used_sessions >= pkg.total_sessions ? "#6B7280" : "#22C55E" } }, pkg.used_sessions >= pkg.total_sessions ? "T\xFCkendi" : `${pkg.total_sessions - pkg.used_sessions} kald\u0131`), pkg.posted_to_finance ? /* @__PURE__ */ React.createElement(Badge, { cls: "b-green" }, "Finansa \u0130\u015Flendi") : pkg.is_paid ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { fontSize: 11, padding: "3px 8px" }, onClick: () => handleTogglePkgPaid(pkg) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12, verticalAlign: "middle", color: "#22C55E" } }, "check_circle"), " \xD6dendi"), /* @__PURE__ */ React.createElement(
          "button",
          {
            className: "btn btn-sm",
            style: { fontSize: 11, padding: "3px 8px", background: "#22C55E", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", opacity: postingPkg ? 0.6 : 1 },
            onClick: () => handlePostPkgToFinance(pkg),
            disabled: postingPkg
          },
          "Finansa \u0130\u015Fle"
        )) : /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { fontSize: 11, padding: "3px 8px" }, onClick: () => handleTogglePkgPaid(pkg) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12, verticalAlign: "middle" } }, "radio_button_unchecked"), " \u0130\u015Faretle")))));
      })))
    ) : (
      /* ── AYLIK AİDAT GÖRÜNÜMÜ ── */
      /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "10px 14px", background: "var(--bg)", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => navigatePayMonth(-1) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_left")), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 15 } }, MONTHS_TR[payMonth - 1], " ", payYear), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => navigatePayMonth(1) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_right"))), loadingDues ? /* @__PURE__ */ React.createElement(Spinner, { size: 28 }) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "10px 14px", background: "var(--bg)", borderRadius: 10, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 20, color: "#22C55E" } }, paidCount, "/", dues.length), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2 } }, "\xD6dedi")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "10px 14px", background: "var(--bg)", borderRadius: 10, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 20, color: "var(--brand-navy)" } }, "\u20BA", totalDuesAmt.toLocaleString("tr-TR")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2 } }, "Toplam Aidat"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 } }, dues.map((due) => /* @__PURE__ */ React.createElement("div", { key: due.id, style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg)", borderRadius: 10, border: `1px solid ${due.is_paid ? "#BBF7D0" : "var(--border)"}` } }, /* @__PURE__ */ React.createElement("div", { style: { width: 34, height: 34, borderRadius: 17, background: due.is_paid ? "#DCFCE7" : "#EEF2FF", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: due.is_paid ? "#22C55E" : "var(--brand-navy)" } }, due.member_name?.charAt(0)?.toUpperCase())), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, due.member_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, "\u20BA", due.amount, " / ay")), duesPost ? /* @__PURE__ */ React.createElement(Badge, { cls: due.is_paid ? "b-green" : "" }, due.is_paid ? "\xD6dendi" : "Bekliyor") : /* @__PURE__ */ React.createElement(
        "button",
        {
          style: { display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: due.is_paid ? "#DCFCE7" : "#EEF2FF", color: due.is_paid ? "#22C55E" : "var(--brand-navy)", fontWeight: 600, fontSize: 12 },
          onClick: () => handleToggleDuePaid(due)
        },
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, due.is_paid ? "check_circle" : "radio_button_unchecked"),
        due.is_paid ? "\xD6dendi" : "\u0130\u015Faretle"
      )))), !duesPost ? /* @__PURE__ */ React.createElement(
        "button",
        {
          style: { width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: allDuesPaid ? "pointer" : "not-allowed", background: allDuesPaid ? "#22C55E" : "var(--border)", color: allDuesPaid ? "#fff" : "var(--text-2)", fontWeight: 700, fontSize: 14, opacity: postingFinance ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
          onClick: handlePostToFinance,
          disabled: !allDuesPaid || postingFinance
        },
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "account_balance_wallet"),
        postingFinance ? "\u0130\u015Fleniyor..." : allDuesPaid ? "Finansa \u0130\u015Fle" : `${dues.length - paidCount} \xFCye \xF6deme bekliyor`
      ) : /* @__PURE__ */ React.createElement("div", { style: { padding: "13px", borderRadius: 12, background: "#DCFCE7", textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "#22C55E", fontSize: 20, verticalAlign: "middle", marginRight: 6 } }, "check_circle"), /* @__PURE__ */ React.createElement("span", { style: { color: "#22C55E", fontWeight: 700, fontSize: 14 } }, "Finansa i\u015Flendi"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#16A34A", marginTop: 4 } }, "Kul\xFCp: \u20BA", duesPost.club_amount?.toLocaleString("tr-TR"), " \xB7 Hoca: \u20BA", duesPost.coach_amount?.toLocaleString("tr-TR")))))
    )
  ), addPkgVisible && addPkgMember && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: `${addPkgMember.member_name} \u2014 Yeni Paket`,
      onClose: () => setAddPkgVisible(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setAddPkgVisible(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: handleAddPackage, disabled: savingPkg }, savingPkg ? "Kaydediliyor\u2026" : "Ekle"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "SEANS SAYISI" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "1", value: addPkgSessions, onChange: (e) => setAddPkgSessions(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "PAKET \xDCCRET\u0130 (\u20BA)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", value: addPkgPrice, onChange: (e) => setAddPkgPrice(e.target.value) })))
  ));
}
function MemberProfileView({ member, onBack, clubId }) {
  const { useState, useEffect, useCallback } = React;
  const DAY_NAMES = ["Pazar", "Pazartesi", "Sal\u0131", "\xC7ar\u015Famba", "Per\u015Fembe", "Cuma", "Cumartesi"];
  const DAY_LABELS = ["Paz", "Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt"];
  const MONTHS_TR = ["Ocak", "\u015Eubat", "Mart", "Nisan", "May\u0131s", "Haziran", "Temmuz", "A\u011Fustos", "Eyl\xFCl", "Ekim", "Kas\u0131m", "Aral\u0131k"];
  const NOTE_TABS = [
    { type: "weekly_training", label: "Antrenman", icon: "fitness_center", color: "#003399", bg: "#EEF2FF" },
    { type: "match_summary", label: "Ma\xE7", icon: "emoji_events", color: "#F59E0B", bg: "#FEF3C7" },
    { type: "private_lesson", label: "\xD6zel Ders", icon: "person", color: "#0D9488", bg: "#CCFBF1" },
    { type: "general", label: "Genel", icon: "notes", color: "#F97316", bg: "#FFEDD5" }
  ];
  const [attendance, setAttendance] = useState([]);
  const [isCreditGroup, setIsCreditGroup] = useState(false);
  const [attendanceDetail, setAttendanceDetail] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState("weekly_training");
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState(null);
  const [allMemberships, setAllMemberships] = useState([]);
  const [membershipClosures, setMembershipClosures] = useState({});
  const [editMemModal, setEditMemModal] = useState(false);
  const [editingMem, setEditingMem] = useState(null);
  const [editMemForm, setEditMemForm] = useState({ custom_fee: "", schedule_slots: [], groupSlots: [] });
  const [savingMem, setSavingMem] = useState(false);
  const [addGroupModal, setAddGroupModal] = useState(false);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [addForm, setAddForm] = useState({ groupId: "", groupName: "", custom_fee: "", schedule_slots: [], groupSlots: [] });
  const [addGroupClosures, setAddGroupClosures] = useState([]);
  const [conflictWarnings, setConflictWarnings] = useState([]);
  const [savingAdd, setSavingAdd] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [saving, setSaving] = useState(false);
  const [noteForm, setNoteForm] = useState({ note_type: "weekly_training", title: "", content: "", session_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) });
  const avatarColor = (name) => {
    const COLORS = ["#003399", "#0D9488", "#22C55E", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444"];
    return COLORS[(name || "").charCodeAt(0) % COLORS.length];
  };
  const inits = (name) => (name || "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const color = avatarColor(member.member_name || "");
  const fmtH = (h, m) => `${String(h).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}`;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await sb.auth.getUser();
      const [{ data: attendRows }, { data: noteRows }, { data: coachRow }, { data: membershipsData }, { data: groupRow }, { data: pkgRows }] = await Promise.all([
        sb.from("group_attendance").select("status, session_date").eq("group_id", member.groupId).eq("member_id", member.id).order("session_date", { ascending: false }),
        sb.from("student_coach_notes").select("*").eq("member_id", member.id).order("session_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
        clubId ? sb.from("club_coaches").select("id").eq("club_id", clubId).limit(1).maybeSingle() : Promise.resolve({ data: null }),
        sb.from("club_group_members").select("id, group_id, custom_fee, schedule_days, schedule_slots, club_groups!inner(id, name, club_id, is_active)").eq("member_name", member.member_name).eq("club_groups.club_id", clubId).eq("club_groups.is_active", true),
        member.groupId ? sb.from("club_groups").select("billing_type, credit_sessions").eq("id", member.groupId).maybeSingle() : Promise.resolve({ data: null }),
        member.groupId ? sb.from("club_group_member_packages").select("id, total_sessions, used_sessions, purchased_at, is_paid").eq("group_id", member.groupId).eq("member_id", member.id).order("purchased_at", { ascending: true }) : Promise.resolve({ data: [] })
      ]);
      setCoachId(coachRow?.id ?? null);
      setNotes(noteRows || []);
      const memberships = (membershipsData || []).map((r) => ({
        id: r.id,
        groupId: r.group_id,
        groupName: r.club_groups?.name ?? "",
        custom_fee: r.custom_fee ?? null,
        schedule_days: r.schedule_days ?? [],
        schedule_slots: r.schedule_slots ?? []
      }));
      setAllMemberships(memberships);
      if (memberships.length > 0) {
        const gIds = memberships.map((m) => m.groupId);
        const { data: allClosures } = await sb.from("court_closures").select("group_id, day_of_week, start_hour, start_minute, end_hour, end_minute, coach:club_coaches(full_name), courts(court_number)").in("group_id", gIds).eq("is_active", true);
        const closureMap = {};
        for (const c of allClosures || []) {
          if (!closureMap[c.group_id]) closureMap[c.group_id] = [];
          closureMap[c.group_id].push({
            day_of_week: c.day_of_week,
            start_hour: c.start_hour,
            start_minute: c.start_minute,
            end_hour: c.end_hour,
            end_minute: c.end_minute,
            coachName: c.coach?.full_name,
            courtNumber: c.courts?.court_number
          });
        }
        setMembershipClosures(closureMap);
      }
      const isCredit = groupRow?.billing_type === "credit";
      setIsCreditGroup(isCredit);
      let list;
      if (isCredit && (pkgRows || []).length > 0) {
        const pkgs = pkgRows || [];
        const sortedRows = [...attendRows || []].sort((a, b) => a.session_date.localeCompare(b.session_date));
        list = pkgs.map((pkg, i) => {
          const start = pkg.purchased_at ? new Date(pkg.purchased_at) : null;
          const nextPkg = pkgs[i + 1];
          const end = nextPkg?.purchased_at ? new Date(nextPkg.purchased_at) : null;
          const pkgRows2 = sortedRows.filter((r) => {
            const d = /* @__PURE__ */ new Date(r.session_date + "T12:00:00");
            return (!start || d >= start) && (!end || d < end);
          });
          const present = pkgRows2.filter((r) => r.status === "present").length;
          const absent = pkgRows2.filter((r) => r.status === "absent").length;
          const total = pkg.total_sessions;
          const used = pkg.used_sessions;
          const sessions = [...pkgRows2].sort((a, b) => b.session_date.localeCompare(a.session_date)).map((r) => ({ date: r.session_date, status: r.status }));
          return { key: pkg.id, label: `${i + 1}. Paket`, present, absent, total, used, remaining: total - used, isPaid: pkg.is_paid, sessions };
        }).reverse();
      } else {
        const monthMap = {};
        for (const row of attendRows || []) {
          const d = /* @__PURE__ */ new Date(row.session_date + "T12:00:00");
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (!monthMap[key]) monthMap[key] = { present: 0, total: 0, year: d.getFullYear(), month: d.getMonth(), sessions: [] };
          monthMap[key].total += 1;
          if (row.status === "present") monthMap[key].present += 1;
          monthMap[key].sessions.push({ date: row.session_date, status: row.status });
        }
        list = Object.entries(monthMap).sort(([a], [b]) => b.localeCompare(a)).map(([key, val]) => ({
          key,
          label: `${MONTHS_TR[val.month]} ${val.year}`,
          present: val.present,
          total: val.total,
          sessions: val.sessions.sort((a, b) => b.date.localeCompare(a.date))
        }));
      }
      setAttendance(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [member.id, member.groupId, member.member_name, clubId]);
  useEffect(() => {
    load();
  }, [load]);
  const openEditMem = async (mem) => {
    const { data: gc } = await sb.from("court_closures").select("day_of_week,start_hour").eq("group_id", mem.groupId).eq("is_active", true);
    const slotMap = {};
    for (const c of gc || []) {
      const k = `${c.day_of_week}_${c.start_hour || 0}`;
      if (!slotMap[k]) slotMap[k] = { day: c.day_of_week, start_hour: c.start_hour || 0 };
    }
    const groupSlots = Object.values(slotMap).sort((a, b) => (a.day === 0 ? 7 : a.day) - (b.day === 0 ? 7 : b.day) || a.start_hour - b.start_hour);
    const currentSlots = (mem.schedule_slots?.length ?? 0) > 0 ? mem.schedule_slots : groupSlots;
    setEditingMem(mem);
    setEditMemForm({ custom_fee: mem.custom_fee != null ? String(mem.custom_fee) : "", schedule_slots: currentSlots, groupSlots });
    setEditMemModal(true);
  };
  const saveEditMem = async () => {
    setSavingMem(true);
    try {
      const fee = editMemForm.custom_fee.trim() !== "" ? parseFloat(editMemForm.custom_fee) : null;
      await sb.from("club_group_members").update({ custom_fee: fee, schedule_slots: editMemForm.schedule_slots }).eq("id", editingMem.id);
      setEditMemModal(false);
      await load();
    } catch (e) {
      console.error(e);
      alert("\xDCyelik g\xFCncellenemedi.");
    } finally {
      setSavingMem(false);
    }
  };
  const checkConflicts = (newClosures, selectedDays, currentMemberships, currentClosureMap) => {
    const warnings = [];
    for (const day of selectedDays) {
      const newForDay = newClosures.filter((c) => c.day_of_week === day);
      for (const nc of newForDay) {
        const newStart = nc.start_hour + (nc.start_minute ?? 0) / 60;
        const newEnd = nc.end_hour + (nc.end_minute ?? 0) / 60;
        for (const mem of currentMemberships) {
          const existing = (currentClosureMap[mem.groupId] || []).filter((c) => c.day_of_week === day);
          for (const ec of existing) {
            const exStart = ec.start_hour + (ec.start_minute ?? 0) / 60;
            const exEnd = ec.end_hour + (ec.end_minute ?? 0) / 60;
            if (newStart < exEnd && newEnd > exStart) {
              warnings.push(`${DAY_NAMES[day]} g\xFCn\xFC ${fmtH(nc.start_hour, nc.start_minute)}\u2013${fmtH(nc.end_hour, nc.end_minute)} saatinde "${mem.groupName}" grubunda \xE7ak\u0131\u015Fma var`);
            }
          }
        }
      }
    }
    return warnings;
  };
  const openAddGroup = async () => {
    const existingIds = allMemberships.map((m) => m.groupId);
    const { data } = await sb.from("club_groups").select("id, name").eq("club_id", clubId).eq("is_active", true).order("name");
    setAvailableGroups((data || []).filter((g) => !existingIds.includes(g.id)));
    setAddForm({ groupId: "", groupName: "", custom_fee: "", schedule_slots: [], groupSlots: [] });
    setAddGroupClosures([]);
    setConflictWarnings([]);
    setAddGroupModal(true);
  };
  const selectGroup = async (g) => {
    const { data: gc } = await sb.from("court_closures").select("day_of_week, start_hour, start_minute, end_hour, end_minute").eq("group_id", g.id).eq("is_active", true);
    const closures = gc || [];
    const slotMap = {};
    for (const c of closures) {
      const k = `${c.day_of_week}_${c.start_hour || 0}`;
      if (!slotMap[k]) slotMap[k] = { day: c.day_of_week, start_hour: c.start_hour || 0 };
    }
    const groupSlots = Object.values(slotMap).sort((a, b) => (a.day === 0 ? 7 : a.day) - (b.day === 0 ? 7 : b.day) || a.start_hour - b.start_hour);
    const groupDays = [...new Set(groupSlots.map((s) => s.day))];
    setAddGroupClosures(closures);
    setAddForm((prev) => ({ ...prev, groupId: g.id, groupName: g.name, schedule_slots: [...groupSlots], groupSlots }));
    setConflictWarnings(checkConflicts(closures, groupDays, allMemberships, membershipClosures));
  };
  const toggleAddSlot = (slot) => {
    const active = addForm.schedule_slots.some((s) => s.day === slot.day && s.start_hour === slot.start_hour);
    const next = active ? addForm.schedule_slots.filter((s) => !(s.day === slot.day && s.start_hour === slot.start_hour)) : [...addForm.schedule_slots, slot];
    setAddForm((prev) => ({ ...prev, schedule_slots: next }));
    const nextDays = [...new Set(next.map((s) => s.day))];
    setConflictWarnings(checkConflicts(addGroupClosures, nextDays, allMemberships, membershipClosures));
  };
  const doAddToGroup = async () => {
    if (!addForm.groupId) return alert("L\xFCtfen bir grup se\xE7in.");
    setSavingAdd(true);
    try {
      const fee = addForm.custom_fee.trim() !== "" ? parseFloat(addForm.custom_fee) : null;
      await sb.from("club_group_members").insert({
        group_id: addForm.groupId,
        member_name: member.member_name,
        contact_number: member.contact_number || null,
        contact_person: member.contact_person || null,
        custom_fee: fee,
        schedule_slots: addForm.schedule_slots
      });
      setAddGroupModal(false);
      await load();
    } catch (e) {
      console.error(e);
      alert("Gruba eklenemedi.");
    } finally {
      setSavingAdd(false);
    }
  };
  const openNewNote = () => {
    setEditingNote(null);
    setNoteForm({ note_type: activeTab, title: "", content: "", session_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) });
    setNoteModal(true);
  };
  const openEditNote = (note) => {
    setEditingNote(note);
    setNoteForm({ note_type: note.note_type, title: note.title || "", content: note.content, session_date: note.session_date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) });
    setNoteModal(true);
  };
  const saveNote = async () => {
    if (!noteForm.content.trim()) return alert("Not i\xE7eri\u011Fi bo\u015F olamaz.");
    setSaving(true);
    try {
      if (editingNote) {
        await sb.from("student_coach_notes").update({ note_type: noteForm.note_type, title: noteForm.title.trim() || null, content: noteForm.content.trim(), session_date: noteForm.session_date || null, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", editingNote.id);
      } else {
        if (!coachId) return alert("Kul\xFCbe kay\u0131tl\u0131 antren\xF6r bulunamad\u0131. Not ekleyebilmek i\xE7in \xF6nce kul\xFCbe en az bir antren\xF6r ekleyin.");
        await sb.from("student_coach_notes").insert({ member_id: member.id, coach_id: coachId, note_type: noteForm.note_type, title: noteForm.title.trim() || null, content: noteForm.content.trim(), session_date: noteForm.session_date || null });
      }
      setNoteModal(false);
      await load();
    } catch (e) {
      console.error(e);
      alert("Not kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };
  const deleteNote = async (note) => {
    if (!confirm("Bu notu silmek istedi\u011Finizden emin misiniz?")) return;
    try {
      await sb.from("student_coach_notes").delete().eq("id", note.id);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    } catch (e) {
      console.error(e);
      alert("Not silinemedi.");
    }
  };
  const filteredNotes = notes.filter((n) => n.note_type === activeTab);
  const activeTabMeta = NOTE_TABS.find((t) => t.type === activeTab);
  const formatDate = (str) => {
    if (!str) return "";
    const d = /* @__PURE__ */ new Date(str + "T12:00:00");
    return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
  };
  const scheduleSections = allMemberships.map((mem) => {
    const closures = membershipClosures[mem.groupId] || [];
    let relevant;
    if (mem.schedule_slots.length > 0) {
      relevant = closures.filter((c) => mem.schedule_slots.some((s) => s.day === c.day_of_week && s.start_hour === c.start_hour));
    } else if (mem.schedule_days.length > 0) {
      relevant = closures.filter((c) => mem.schedule_days.includes(c.day_of_week));
    } else {
      relevant = closures;
    }
    const slotMap = {};
    for (const c of relevant) {
      const key = `${c.day_of_week}_${c.start_hour}_${c.start_minute || 0}_${c.end_hour}_${c.end_minute || 0}`;
      if (!slotMap[key]) slotMap[key] = { day_of_week: c.day_of_week, start_hour: c.start_hour, start_minute: c.start_minute, end_hour: c.end_hour, end_minute: c.end_minute, coachNames: [], courtNums: [] };
      if (c.coachName && !slotMap[key].coachNames.includes(c.coachName)) slotMap[key].coachNames.push(c.coachName);
      if (c.courtNumber != null && !slotMap[key].courtNums.includes(c.courtNumber)) slotMap[key].courtNums.push(c.courtNumber);
    }
    const days = Object.values(slotMap).sort((a, b) => (a.day_of_week === 0 ? 7 : a.day_of_week) - (b.day_of_week === 0 ? 7 : b.day_of_week) || a.start_hour - b.start_hour);
    return { mem, days };
  }).filter((s) => s.days.length > 0);
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head", style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: onBack, style: { display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18 } }, "arrow_back"), " Geri"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("h1", { style: { margin: 0 } }, member.member_name), /* @__PURE__ */ React.createElement("div", { className: "sub" }, member.groupName))), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "card", style: { display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 18, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, flex: "0 0 auto", alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 64, height: 64, borderRadius: 32, background: color + "22", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22, fontWeight: 800, color } }, inits(member.member_name))), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 160 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, marginBottom: 4 } }, member.member_name), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: "#0D9488" } }, "groups"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "#0D9488", fontWeight: 600 } }, member.groupName)), member.contact_number && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-2)", marginBottom: 2 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "phone"), member.contact_number), member.contact_person && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-2)", marginBottom: 2 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "person_outline"), member.contact_person))), allMemberships.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 200 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: "0.05em" } }, "GRUPLAR"), allMemberships.map((mem) => {
    const dayLabels = mem.schedule_slots.length > 0 ? mem.schedule_slots.slice().sort((a, b) => (a.day === 0 ? 7 : a.day) - (b.day === 0 ? 7 : b.day) || a.start_hour - b.start_hour).map((s) => {
      const cl = (membershipClosures[mem.groupId] || []).find((c) => c.day_of_week === s.day && c.start_hour === s.start_hour);
      const min = s.start_minute ?? cl?.start_minute ?? 0;
      return `${DAY_LABELS[s.day]} ${String(s.start_hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }).join(", ") : mem.schedule_days.length > 0 ? mem.schedule_days.map((d) => DAY_LABELS[d]).join(", ") : "T\xFCm seanslar";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: mem.id,
        onClick: () => openEditMem(mem),
        style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: "#0D9488" } }, "groups"),
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, mem.groupName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, dayLabels, mem.custom_fee != null ? `  \xB7  \u20BA${mem.custom_fee}` : "")),
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: "var(--text-2)" } }, "edit")
    );
  }), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: openAddGroup,
      style: { display: "flex", alignItems: "center", gap: 5, marginTop: 10, padding: "7px 14px", borderRadius: 8, border: "1px solid #003399", background: "#00339912", color: "#003399", cursor: "pointer", fontWeight: 600, fontSize: 12 }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "group_add"),
    "Gruba Ekle"
  )), scheduleSections.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { minWidth: 200, flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: "0.05em" } }, "PROGRAM"), scheduleSections.map(({ mem, days }, si) => /* @__PURE__ */ React.createElement("div", { key: mem.id, style: { marginBottom: si < scheduleSections.length - 1 ? 12 : 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#0D9488", marginBottom: 4, letterSpacing: "0.03em" } }, mem.groupName), days.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: s.day_of_week, style: { display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < days.length - 1 ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 3, alignSelf: "stretch", borderRadius: 2, background: "#8B5CF6", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, DAY_NAMES[s.day_of_week], "  \xB7  ", fmtH(s.start_hour, s.start_minute), "\u2013", fmtH(s.end_hour, s.end_minute)), (s.courtNums.length > 0 || s.coachNames.length > 0) && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 1 } }, [s.courtNums.length > 0 && `Kort ${s.courtNums.join(", ")}`, ...s.coachNames].filter(Boolean).join(" \xB7 ")))))))), attendance.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { minWidth: 200, flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: "0.05em" } }, "DEVAM"), attendance.map((m) => {
    if (isCreditGroup) {
      const done = m.used ?? m.present;
      const remaining = m.remaining ?? m.total - done;
      const pct2 = m.total > 0 ? Math.round(done / m.total * 100) : 0;
      const barColor2 = remaining <= 2 ? "#EF4444" : remaining <= 4 ? "#F59E0B" : "#22C55E";
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: m.key,
          onClick: () => setAttendanceDetail(m),
          style: { marginBottom: 6, cursor: "pointer", borderRadius: 6, padding: "4px 2px" },
          onMouseEnter: (e) => e.currentTarget.style.background = "var(--surface-2)",
          onMouseLeave: (e) => e.currentTarget.style.background = "transparent"
        },
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 3 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, m.label), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-2)", fontSize: 11 } }, done, "/", m.total, " yap\u0131ld\u0131"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, color: barColor2, fontSize: 11 } }, remaining, " kald\u0131"))),
        /* @__PURE__ */ React.createElement("div", { style: { height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${pct2}%`, background: barColor2, borderRadius: 3, transition: "width 0.4s" } })),
        (m.present > 0 || m.absent > 0) && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 3, fontSize: 11 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#22C55E" } }, "\u2713 ", m.present, " geldi"), m.absent > 0 && /* @__PURE__ */ React.createElement("span", { style: { color: "#EF4444" } }, "\u2717 ", m.absent, " gelmedi"))
      );
    }
    const pct = m.total > 0 ? Math.round(m.present / m.total * 100) : 0;
    const barColor = pct >= 75 ? "#22C55E" : pct >= 50 ? "#F59E0B" : "#EF4444";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: m.key,
        onClick: () => setAttendanceDetail(m),
        style: { marginBottom: 8, cursor: "pointer", borderRadius: 6, padding: "4px 2px" },
        onMouseEnter: (e) => e.currentTarget.style.background = "var(--surface-2)",
        onMouseLeave: (e) => e.currentTarget.style.background = "transparent"
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, m.label), /* @__PURE__ */ React.createElement("span", { style: { color: barColor, fontWeight: 700 } }, m.present, "/", m.total, " antrenman")),
      /* @__PURE__ */ React.createElement("div", { style: { height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3, transition: "width 0.4s" } }))
    );
  }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 10, letterSpacing: "0.05em" } }, "NOTLAR"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 } }, NOTE_TABS.map((tab) => {
    const active = tab.type === activeTab;
    const count = notes.filter((n) => n.note_type === tab.type).length;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: tab.type,
        onClick: () => setActiveTab(tab.type),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "6px 12px",
          borderRadius: 20,
          border: "1px solid",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 12,
          transition: "all 0.15s",
          borderColor: active ? tab.color : "var(--border)",
          background: active ? tab.color : "var(--surface)",
          color: active ? "#fff" : "var(--text-2)"
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, tab.icon),
      tab.label,
      count > 0 && /* @__PURE__ */ React.createElement("span", { style: {
        fontSize: 10,
        fontWeight: 700,
        padding: "1px 6px",
        borderRadius: 10,
        background: active ? "rgba(255,255,255,0.25)" : tab.color + "22",
        color: active ? "#fff" : tab.color
      } }, count)
    );
  })), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: openNewNote,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 13,
        marginBottom: 14,
        background: activeTabMeta.color,
        color: "#fff"
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "add"),
    activeTabMeta.label,
    " Notu Ekle"
  ), filteredNotes.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "32px 0", color: "var(--text-2)", fontSize: 13 } }, "Hen\xFCz ", activeTabMeta.label.toLowerCase(), " notu yok") : filteredNotes.map((note) => /* @__PURE__ */ React.createElement("div", { key: note.id, style: { background: "var(--surface)", borderRadius: 10, padding: "12px 14px", marginBottom: 10, borderLeft: `3px solid ${activeTabMeta.color}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", null, note.title && /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 2 } }, note.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, formatDate(note.session_date || note.created_at))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, flexShrink: 0 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => openEditNote(note),
      style: { background: "none", border: "none", cursor: "pointer", padding: 4, color: activeTabMeta.color, display: "flex", alignItems: "center" }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "edit")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => deleteNote(note),
      style: { background: "none", border: "none", cursor: "pointer", padding: 4, color: "#EF4444", display: "flex", alignItems: "center" }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "delete_outline")
  ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-1)", lineHeight: 1.6 } }, note.content)))), editMemModal && editingMem && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: editingMem.groupName,
      onClose: () => setEditMemModal(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setEditMemModal(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: saveEditMem, disabled: savingMem }, savingMem ? "Kaydediliyor\u2026" : "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "\xD6ZEL \xDCCRET (\u20BA)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        placeholder: "Varsay\u0131lan \xFCcret",
        value: editMemForm.custom_fee,
        onChange: (e) => setEditMemForm((p) => ({ ...p, custom_fee: e.target.value }))
      }
    )), editMemForm.groupSlots.length > 0 && /* @__PURE__ */ React.createElement(Field, { label: "SEANSLAR" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, editMemForm.groupSlots.map((slot, si) => {
      const sel = (editMemForm.schedule_slots || []).some((s) => s.day === slot.day && s.start_hour === slot.start_hour);
      const lbl = `${DAY_LABELS[slot.day]} ${String(slot.start_hour).padStart(2, "0")}:00`;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: si,
          type: "button",
          onClick: () => setEditMemForm((p) => {
            const cur = p.schedule_slots || [];
            return { ...p, schedule_slots: sel ? cur.filter((s) => !(s.day === slot.day && s.start_hour === slot.start_hour)) : [...cur, slot] };
          }),
          style: {
            padding: "4px 12px",
            borderRadius: 8,
            border: "1px solid",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            borderColor: sel ? "#0D9488" : "var(--border)",
            background: sel ? "#0D9488" : "var(--surface)",
            color: sel ? "#fff" : "var(--text-2)"
          }
        },
        lbl
      );
    }))))
  ), addGroupModal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "Gruba Ekle",
      onClose: () => setAddGroupModal(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setAddGroupModal(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-pri btn-sm",
          onClick: doAddToGroup,
          disabled: savingAdd || !addForm.groupId,
          style: { background: conflictWarnings.length > 0 ? "#F59E0B" : void 0 }
        },
        savingAdd ? "Ekleniyor\u2026" : conflictWarnings.length > 0 ? "Yine de Ekle" : "Ekle"
      ))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "GRUP SE\xC7" }, availableGroups.length === 0 ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-2)" } }, "Eklenebilecek ba\u015Fka grup yok.") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, availableGroups.map((g) => {
      const sel = addForm.groupId === g.id;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: g.id,
          type: "button",
          onClick: () => selectGroup(g),
          style: {
            padding: "4px 12px",
            borderRadius: 8,
            border: "1px solid",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            borderColor: sel ? "#003399" : "var(--border)",
            background: sel ? "#003399" : "var(--surface)",
            color: sel ? "#fff" : "var(--text-2)"
          }
        },
        g.name
      );
    }))), addForm.groupId && /* @__PURE__ */ React.createElement(React.Fragment, null, conflictWarnings.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 8, padding: "10px 12px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 12, color: "#92400E", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "warning"), "Program \xC7ak\u0131\u015Fmas\u0131"), conflictWarnings.map((w, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { fontSize: 12, color: "#78350F", lineHeight: 1.6 } }, "\u2022 ", w))), /* @__PURE__ */ React.createElement(Field, { label: "\xD6ZEL \xDCCRET (\u20BA)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        placeholder: "Varsay\u0131lan \xFCcret",
        value: addForm.custom_fee,
        onChange: (e) => setAddForm((p) => ({ ...p, custom_fee: e.target.value }))
      }
    )), addForm.groupSlots.length > 0 && /* @__PURE__ */ React.createElement(Field, { label: "SEANSLAR" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, addForm.groupSlots.map((slot, si) => {
      const sel = addForm.schedule_slots.some((s) => s.day === slot.day && s.start_hour === slot.start_hour);
      const lbl = `${DAY_LABELS[slot.day]} ${String(slot.start_hour).padStart(2, "0")}:00`;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: si,
          type: "button",
          onClick: () => toggleAddSlot(slot),
          style: {
            padding: "4px 12px",
            borderRadius: 8,
            border: "1px solid",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            borderColor: sel ? "#003399" : "var(--border)",
            background: sel ? "#003399" : "var(--surface)",
            color: sel ? "#fff" : "var(--text-2)"
          }
        },
        lbl
      );
    })))))
  ), noteModal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: editingNote ? "Notu D\xFCzenle" : `${activeTabMeta.label} Notu`,
      onClose: () => setNoteModal(false),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setNoteModal(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: saveNote, disabled: saving }, saving ? "Kaydediliyor\u2026" : "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "NOT T\xDCR\xDC" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, NOTE_TABS.map((tab) => {
      const sel = tab.type === noteForm.note_type;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: tab.type,
          type: "button",
          onClick: () => setNoteForm((p) => ({ ...p, note_type: tab.type })),
          style: {
            padding: "4px 12px",
            borderRadius: 8,
            border: "1px solid",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            borderColor: sel ? tab.color : "var(--border)",
            background: sel ? tab.color : "var(--surface)",
            color: sel ? "#fff" : "var(--text-2)"
          }
        },
        tab.label
      );
    }))), /* @__PURE__ */ React.createElement(Field, { label: "TAR\u0130H" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: noteForm.session_date, onChange: (e) => setNoteForm((p) => ({ ...p, session_date: e.target.value })) })), /* @__PURE__ */ React.createElement(Field, { label: "BA\u015ELIK (opsiyonel)" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Not ba\u015Fl\u0131\u011F\u0131...", value: noteForm.title, onChange: (e) => setNoteForm((p) => ({ ...p, title: e.target.value })) })), /* @__PURE__ */ React.createElement(Field, { label: "NOT *" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: 5,
        placeholder: "Notunuzu yaz\u0131n...",
        value: noteForm.content,
        onChange: (e) => setNoteForm((p) => ({ ...p, content: e.target.value })),
        style: { width: "100%", resize: "vertical", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, fontFamily: "inherit" }
      }
    )))
  ), attendanceDetail && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: `${attendanceDetail.label} \u2014 Dersler`,
      onClose: () => setAttendanceDetail(null),
      footer: /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setAttendanceDetail(null) }, "Kapat")
    },
    /* @__PURE__ */ React.createElement("div", { style: { maxHeight: 400, overflowY: "auto" } }, !attendanceDetail.sessions || attendanceDetail.sessions.length === 0 ? /* @__PURE__ */ React.createElement("p", { style: { color: "var(--text-2)", fontSize: 13 } }, "Hen\xFCz ders kayd\u0131 yok.") : attendanceDetail.sessions.map((s, i) => {
      const d = /* @__PURE__ */ new Date(s.date + "T12:00:00");
      const formatted = d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
      return /* @__PURE__ */ React.createElement("div", { key: i, style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        borderBottom: i < attendanceDetail.sessions.length - 1 ? "1px solid var(--border)" : "none"
      } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, s.status === "present" ? "\u2705" : "\u274C"), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 13 } }, formatted), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: s.status === "present" ? "#22C55E" : "#EF4444" } }, s.status === "present" ? "Geldi" : "Gelmedi"));
    }))
  ));
}
function GroupPlayersScreen({ clubId }) {
  const { useState, useEffect, useCallback, useRef } = React;
  const PAGE_SIZE = 5;
  const DAY_LABELS = ["Paz", "Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt"];
  const [groups, setGroups] = useState([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const isFirst = useRef(true);
  const fetchGroups = useCallback(async (p, search) => {
    if (!clubId) return;
    try {
      let matchingGroupIds = [];
      if (search.trim()) {
        const { data: memberRows } = await sb.from("club_group_members").select("group_id").ilike("member_name", `%${search.trim()}%`);
        matchingGroupIds = [...new Set((memberRows || []).map((r) => r.group_id))];
      }
      let query = sb.from("club_groups").select("id, name, members:club_group_members(id, member_name, contact_number, contact_person, schedule_days, schedule_slots), closures:court_closures(day_of_week, start_hour, start_minute)", { count: "exact" }).eq("club_id", clubId).eq("is_active", true).order("name").range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1);
      if (search.trim()) {
        let orFilter = `name.ilike.%${search.trim()}%`;
        if (matchingGroupIds.length > 0) orFilter += `,id.in.(${matchingGroupIds.join(",")})`;
        query = query.or(orFilter);
      }
      const { data, count } = await query;
      setGroups((data || []).filter((g) => (g.members || []).length > 0));
      setTotalGroups(count ?? 0);
    } catch (e) {
      console.error("GroupPlayersScreen fetchGroups error:", e);
    }
  }, [clubId]);
  useEffect(() => {
    setLoading(true);
    fetchGroups(0, "").finally(() => setLoading(false));
  }, [fetchGroups]);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    setPage(0);
    fetchGroups(0, searchQuery);
  }, [searchQuery]);
  const avatarColor = (name) => {
    const COLORS = ["#003399", "#0D9488", "#22C55E", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444"];
    return COLORS[(name || "").charCodeAt(0) % COLORS.length];
  };
  const inits = (name) => (name || "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (selectedMember) {
    return /* @__PURE__ */ React.createElement(MemberProfileView, { member: selectedMember, clubId, onBack: () => setSelectedMember(null) });
  }
  const totalPlayers = groups.reduce((s, g) => s + (g.members || []).length, 0);
  if (loading) return /* @__PURE__ */ React.createElement(Spinner, null);
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Grup Oyuncular\u0131"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, totalPlayers > 0 ? `${totalPlayers} oyuncu` : "Aktif gruplardaki t\xFCm \xFCyeler"))), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-2)", fontSize: 18 } }, "search"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: searchQuery,
      onChange: (e) => setSearchQuery(e.target.value),
      placeholder: "Oyuncu veya grup ara\u2026",
      style: { paddingLeft: 36, paddingRight: searchQuery ? 32 : 10 }
    }
  ), searchQuery && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setSearchQuery(""),
      style: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", display: "flex", alignItems: "center", padding: 0 }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "close")
  )), groups.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: searchQuery ? "search_off" : "groups",
      title: searchQuery ? "Sonu\xE7 bulunamad\u0131" : "Hen\xFCz grup oyuncusu yok",
      subtitle: searchQuery ? `"${searchQuery}" ile e\u015Fle\u015Fen oyuncu veya grup bulunamad\u0131` : "Aktif gruplara \xFCye eklendik\xE7e burada g\xF6r\xFCn\xFCr."
    }
  ) : /* @__PURE__ */ React.createElement(React.Fragment, null, groups.map((group) => /* @__PURE__ */ React.createElement("div", { key: group.id, className: "card tight", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "#0D94880a", borderRadius: "10px 10px 0 0" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: "#0D9488" } }, "groups"), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 13, fontWeight: 700, color: "var(--text-1)" } }, group.name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: "#0D9488", background: "#0D948820", padding: "2px 8px", borderRadius: 999 } }, (group.members || []).length, " oyuncu")), (group.members || []).map((member, idx) => {
    const color = avatarColor(member.member_name || "");
    const slots = (member.schedule_slots || []).slice().sort((a, b) => (a.day === 0 ? 7 : a.day) - (b.day === 0 ? 7 : b.day) || a.start_hour - b.start_hour);
    const days = slots.length === 0 ? (member.schedule_days || []).filter((d) => typeof d === "number" && d >= 0 && d <= 6).slice().sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)) : [];
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: member.id,
        style: { display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: idx < group.members.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", transition: "background 0.15s" },
        onClick: () => setSelectedMember({ ...member, groupId: group.id, groupName: group.name }),
        onMouseEnter: (e) => e.currentTarget.style.background = "var(--bg)",
        onMouseLeave: (e) => e.currentTarget.style.background = ""
      },
      /* @__PURE__ */ React.createElement("div", { style: { width: 38, height: 38, borderRadius: 19, background: color + "22", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 800, color } }, inits(member.member_name))),
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, member.member_name), (member.contact_number || member.contact_person) && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 1 } }, [member.contact_number, member.contact_person].filter(Boolean).join(" \xB7 ")), (slots.length > 0 || days.length > 0) && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#0D9488", fontWeight: 600, marginTop: 1 } }, slots.length > 0 ? slots.map((s) => {
        const cl = (group.closures || []).find((c) => c.day_of_week === s.day && c.start_hour === s.start_hour);
        const min = s.start_minute ?? cl?.start_minute ?? 0;
        return `${DAY_LABELS[s.day]} ${String(s.start_hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      }).join(" \xB7 ") : days.map((d) => DAY_LABELS[d]).join(" \xB7 "))),
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: "var(--text-2)" } }, "chevron_right")
    );
  }))), totalGroups > PAGE_SIZE && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingTop: 8 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-ghost btn-sm",
      disabled: page === 0,
      onClick: () => {
        const n = page - 1;
        setPage(n);
        fetchGroups(n, searchQuery);
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "chevron_left"),
    " \xD6nceki"
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)" } }, page * PAGE_SIZE + 1, "\u2013", Math.min((page + 1) * PAGE_SIZE, totalGroups), " / ", totalGroups, " grup"), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-ghost btn-sm",
      disabled: (page + 1) * PAGE_SIZE >= totalGroups,
      onClick: () => {
        const n = page + 1;
        setPage(n);
        fetchGroups(n, searchQuery);
      }
    },
    "Sonraki ",
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "chevron_right")
  ))));
}

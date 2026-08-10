function MemberLimitSearch({ clubId, value, onChange }) {
  const { useState, useEffect } = React;
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [chosen, setChosen] = React.useState(null);
  const [limWarn, setLimWarn] = React.useState([]);
  const search = async (q) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const { data } = await sb.from("club_memberships").select("user_id, member_name, profile:profiles!club_memberships_user_id_fkey(id, full_name)").eq("club_id", clubId).eq("status", "active").limit(8);
    const filtered = (data || []).filter((m) => {
      const name = m.profile?.full_name || m.member_name || "";
      return name.toLowerCase().includes(q.toLowerCase());
    });
    setResults(filtered);
  };
  const select = (m) => {
    const name = m.profile?.full_name || m.member_name || "";
    setChosen({ id: m.user_id || m.id, name });
    setResults([]);
    setQuery("");
    onChange(m.user_id || m.id);
  };
  const clear = () => {
    setChosen(null);
    setLimWarn([]);
    onChange(null);
  };
  if (chosen) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, background: "#EEF2FF", borderRadius: 8, padding: "8px 12px" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--brand-navy)", fontSize: 16 } }, "person"), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontWeight: 600, fontSize: 13 } }, chosen.name), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: clear,
        style: { background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 0 }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "close")
    ));
  }
  return /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      placeholder: "\xDCye ad\u0131 ara\u2026",
      value: query,
      onChange: (e) => search(e.target.value),
      style: { width: "100%" }
    }
  ), results.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "#fff", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", overflow: "hidden" } }, results.map((m) => {
    const name = m.profile?.full_name || m.member_name || "";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: m.user_id || m.id,
        style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 500 },
        onMouseDown: () => select(m)
      },
      name
    );
  })));
}
function DashboardScreen({ clubId, clubProfile, setScreen }) {
  const { useState, useEffect } = React;
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [pendingPay, setPendingPay] = useState(0);
  const [pendingMem, setPendingMem] = useState(0);
  const [courtCount, setCourtCount] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  useEffect(() => {
    if (clubId) load();
  }, [clubId]);
  const load = async () => {
    setLoading(true);
    try {
      const todayStart = /* @__PURE__ */ new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = /* @__PURE__ */ new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const dbStart = localTimeToDb(todayStart.toISOString());
      const dbEnd = localTimeToDb(todayEnd.toISOString());
      const courtIds = await getClubCourtIds(clubId);
      const [bRes, pendMemRes, courtRes] = await Promise.all([
        courtIds.length > 0 ? sb.from("bookings").select("*, courts!bookings_court_id_fkey(court_number,court_type), booking_players!booking_players_booking_id_fkey(player_id,is_primary_player, profiles!booking_players_player_id_fkey(id,full_name,email))").in("court_id", courtIds).neq("status", "cancelled").gte("start_time", dbStart).lte("start_time", dbEnd).order("start_time", { ascending: true }).limit(8) : Promise.resolve({ data: [] }),
        sb.from("club_memberships").select("*", { count: "exact", head: true }).eq("club_id", clubId).eq("status", "pending"),
        sb.from("courts").select("id,court_number,court_type,hourly_rate,is_indoor,is_active").eq("club_id", clubId).eq("is_active", true).order("court_number")
      ]);
      const rows = (bRes.data || []).map((b) => ({
        ...b,
        start_time: dbTimeToLocal(b.start_time),
        end_time: dbTimeToLocal(b.end_time)
      }));
      const courtList = courtRes.data || [];
      setBookings(rows);
      setCourts(courtList);
      setTodayCount(rows.length);
      setPendingPay(rows.filter((b) => b.payment_status !== "paid").length);
      setPendingMem(pendMemRes.count ?? 0);
      setCourtCount(courtList.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const TILES = [
    { icon: "event_available", label: "Rezervasyonlar", screen: "reservations", color: "#003399" },
    { icon: "calendar_today", label: "Program", screen: "program", color: "#6366F1" },
    { icon: "sports_tennis", label: "Kortlar", screen: "courts", color: "#0891B2" },
    { icon: "bar_chart", label: "Analitik", screen: "analytics", color: "#8B5CF6" },
    { icon: "person", label: "Ko\xE7lar", screen: "coaches", color: "#0D9488" },
    { icon: "emoji_events", label: "Turnuvalar", screen: "tournaments", color: "#F97316" },
    { icon: "groups", label: "Gruplar", screen: "groups", color: "#0EA5E9" },
    { icon: "sports_tennis", label: "Grup Oyuncular\u0131", screen: "group_players", color: "#0F766E" },
    { icon: "group", label: "\xDCyeler", screen: "members", color: "#22C55E" }
  ];
  if (loading) return /* @__PURE__ */ React.createElement(Spinner, null);
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Dashboard"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, (/* @__PURE__ */ new Date()).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: load }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "refresh"), "Yenile")), /* @__PURE__ */ React.createElement("div", { className: "stats" }, /* @__PURE__ */ React.createElement(StatCard, { icon: "event_available", n: todayCount, label: "Bug\xFCnk\xFC Rezervasyonlar", tint: "" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "account_balance_wallet", n: pendingPay, label: "Bekleyen \xD6deme", tint: pendingPay > 0 ? "purple" : "" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "group", n: pendingMem, label: "Bekleyen \xDCye", tint: pendingMem > 0 ? "" : "" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "sports_tennis", n: courtCount, label: "Aktif Kort", tint: "green" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow", style: { marginBottom: 10 } }, "H\u0131zl\u0131 Eri\u015Fim"), /* @__PURE__ */ React.createElement("div", { className: "tiles" }, TILES.map((t) => /* @__PURE__ */ React.createElement("div", { key: t.screen, className: "tile", style: { background: t.color }, onClick: () => setScreen(t.screen) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, t.icon), /* @__PURE__ */ React.createElement("span", { className: "l" }, t.label))))), /* @__PURE__ */ React.createElement("div", { className: "row2" }, /* @__PURE__ */ React.createElement("div", { className: "card tight" }, /* @__PURE__ */ React.createElement("div", { className: "card-h" }, /* @__PURE__ */ React.createElement("h3", null, "Bug\xFCnk\xFC Rezervasyonlar"), /* @__PURE__ */ React.createElement("div", { className: "right" }, /* @__PURE__ */ React.createElement("a", { onClick: () => setScreen("reservations"), style: { cursor: "pointer" } }, "T\xFCm\xFCn\xFC G\xF6r"))), bookings.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "event_available", title: "Bug\xFCn rezervasyon yok" }) : bookings.map((b) => /* @__PURE__ */ React.createElement(BookingRow, { key: b.id, booking: b, onClick: () => setScreen("reservations") }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { cursor: "pointer", border: "1.5px solid #6366F122" }, onClick: () => setScreen("program") }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 44, height: 44, borderRadius: 12, background: "#EEF2FF", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "#6366F1", fontSize: 22 } }, "calendar_today")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: "var(--text-1)" } }, "Program"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2 } }, "G\xFCnl\xFCk kort takvimini g\xF6r\xFCnt\xFCle")), /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--text-3, #cbd5e1)", fontSize: 18 } }, "chevron_right"))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "row between", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 15 } }, "Kul\xFCp Bilgileri"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-soft btn-sm", onClick: () => setScreen("profile") }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "edit"), " D\xFCzenle")), clubProfile && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Adres"), /* @__PURE__ */ React.createElement("span", { className: "v" }, clubProfile.address || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Telefon"), /* @__PURE__ */ React.createElement("span", { className: "v" }, clubProfile.contact_phone || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "E-posta"), /* @__PURE__ */ React.createElement("span", { className: "v" }, clubProfile.email || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Kortlar"), /* @__PURE__ */ React.createElement("span", { className: "v" }, courtCount, " kort")))))), courts.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "card tight", style: { marginTop: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-h" }, /* @__PURE__ */ React.createElement("h3", null, "Kortlar"), /* @__PURE__ */ React.createElement("div", { className: "right" }, /* @__PURE__ */ React.createElement("a", { onClick: () => setScreen("courts"), style: { cursor: "pointer" } }, "T\xFCm\xFCn\xFC G\xF6r"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, padding: "12px 16px 16px" } }, courts.map((c) => {
    const todayBkCount = bookings.filter((b) => b.court_id === c.id).length;
    const typeLabel = c.court_type === "clay" ? "Toprak" : c.court_type === "hard" ? "Sert" : c.court_type === "grass" ? "\xC7im" : c.court_type === "indoor" ? "Kapal\u0131" : c.court_type || "\u2014";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: c.id,
        onClick: () => setScreen("courts"),
        style: { background: "var(--bg)", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--border)", cursor: "pointer", transition: "box-shadow 0.15s" },
        onMouseEnter: (e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)",
        onMouseLeave: (e) => e.currentTarget.style.boxShadow = ""
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, fontWeight: 800, color: "var(--text-1)" } }, "Kort ", c.court_number), /* @__PURE__ */ React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: todayBkCount > 0 ? "#EF4444" : "#22C55E" } })),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginBottom: 4 } }, typeLabel, c.is_indoor ? " \xB7 Kapal\u0131" : " \xB7 A\xE7\u0131k"),
      c.hourly_rate > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, "\u20BA", c.hourly_rate, "/saat"),
      /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 11, fontWeight: 700, color: todayBkCount > 0 ? "#DC2626" : "#16A34A" } }, todayBkCount > 0 ? `${todayBkCount} rezervasyon` : "M\xFCsait")
    );
  }))));
}
function lesson_court_row(lesson, courts) {
  if (lesson.court_id) return courts.find((c) => c.id === lesson.court_id);
  const m = (lesson.location || "").match(/Kort\s*(\d+)/i);
  return m ? courts.find((c) => c.court_number === parseInt(m[1])) : null;
}
function ReservationsScreen({ clubId, setScreen, clubProfile }) {
  const { useState, useEffect } = React;
  const [mainTab, setMainTab] = useState("bookings");
  const [selDate, setSelDate] = useState(todayISO());
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dotDates, setDotDates] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [bkModalVisible, setBkModalVisible] = useState(false);
  const [bkForm, setBkForm] = useState({});
  const [bkAvailCourts, setBkAvailCourts] = useState([]);
  const [bkCourtsLoading, setBkCourtsLoading] = useState(false);
  const [bkSaving, setBkSaving] = useState(false);
  const [bkMemberId, setBkMemberId] = useState(null);
  const [bkMemberName, setBkMemberName] = useState("");
  const [bkMemberQuery, setBkMemberQuery] = useState("");
  const [bkMemberResults, setBkMemberResults] = useState([]);
  const [bkMemberLoading, setBkMemberLoading] = useState(false);
  const [bkCustomerId, setBkCustomerId] = useState(null);
  const [bkCustomerName, setBkCustomerName] = useState("");
  const [bkCustomerQuery, setBkCustomerQuery] = useState("");
  const [bkCustomerResults, setBkCustomerResults] = useState([]);
  const [bkCourtyclubResults, setBkCourtyclubResults] = useState([]);
  const hasMembership = clubProfile?.has_membership_system !== false;
  const [bkPersonMode, setBkPersonMode] = useState("member");
  const [bkPriceOverride, setBkPriceOverride] = useState("");
  const [quickAddCust, setQuickAddCust] = useState(null);
  const [quickAddForm, setQuickAddForm] = useState({ name: "", phone: "" });
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [lessonCourts, setLessonCourts] = useState([]);
  const [loadingL, setLoadingL] = useState(false);
  const [lessonModal, setLessonModal] = useState(null);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState({});
  const [lessonMarkingId, setLessonMarkingId] = useState(null);
  const [lessonPlayerSearch, setLessonPlayerSearch] = useState("");
  const [lessonPlayerResults, setLessonPlayerResults] = useState([]);
  const [lessonSelectedPlayer, setLessonSelectedPlayer] = useState(null);
  const [lessonCustomerResults, setLessonCustomerResults] = useState([]);
  const [lessonSelectedCustomer, setLessonSelectedCustomer] = useState(null);
  const [lessonCourtyclubResults, setLessonCourtyclubResults] = useState([]);
  const [lessonPackages, setLessonPackages] = useState([]);
  const [lessonUsePackage, setLessonUsePackage] = useState(false);
  const [lessonSelectedPackageId, setLessonSelectedPackageId] = useState(null);
  const [lessonLoadingPackages, setLessonLoadingPackages] = useState(false);
  const [lessonPriceMode, setLessonPriceMode] = useState("normal");
  const [lessonCoachAmountInput, setLessonCoachAmountInput] = useState("");
  const [lessonClubAmountInput, setLessonClubAmountInput] = useState("");
  useEffect(() => {
    if (!clubId) return;
    loadCourts();
    loadDotDates();
    sb.from("club_profiles").select("requires_booking_approval").eq("id", clubId).maybeSingle().then(({ data }) => setRequiresApproval(data?.requires_booking_approval === true));
  }, [clubId]);
  useEffect(() => {
    if (clubId) loadDay();
  }, [clubId, selDate, requiresApproval]);
  useEffect(() => {
    if (clubId && mainTab === "lessons") loadLessons();
  }, [clubId, mainTab, selDate]);
  useEffect(() => {
    const p = window.__slotPrefill;
    if (!p) return;
    if (p.type === "reservation") {
      window.__slotPrefill = null;
      const [sh, sm] = p.start_time.split(":").map(Number);
      const [eh, em] = p.end_time.split(":").map(Number);
      const dMins = eh * 60 + em - (sh * 60 + sm);
      const dur = [0.75, 1, 1.5, 2].reduce(
        (prev, cur) => Math.abs(cur * 60 - dMins) < Math.abs(prev * 60 - dMins) ? cur : prev
      );
      setBkForm({ courtId: p.court_id, date: p.date, startTime: p.start_time, endTime: p.end_time, duration: dur, status: "confirmed" });
      setBkMemberId(null);
      setBkMemberName("");
      setBkMemberQuery("");
      setBkMemberResults([]);
      setBkCourtyclubResults([]);
      setBkCustomerId(null);
      setBkCustomerName("");
      setBkCustomerResults([]);
      setBkModalVisible(true);
      if (courts.length > 0) {
        loadBkAvailCourts(p.date, p.start_time, p.end_time);
      } else {
        sb.from("courts").select("id,court_number,court_type,hourly_rate,is_indoor").eq("club_id", clubId).eq("is_active", true).order("court_number").then(({ data }) => {
          const list = data || [];
          setCourts(list);
          loadBkAvailCourts(p.date, p.start_time, p.end_time, list);
        });
      }
    } else if (p.type === "lesson") {
      setMainTab("lessons");
    }
    const cp = window.__customerPrefill;
    if (cp) {
      window.__customerPrefill = null;
      setBkCustomerId(cp.customerId);
      setBkCustomerName(cp.customerName);
      if (cp.userId) {
        setBkMemberId(cp.userId);
        setBkMemberName(cp.customerName);
      }
      setBkPersonMode("customer");
      setBkMemberId(cp.userId || null);
      setBkMemberName(cp.userId ? cp.customerName : "");
      const todayStr = todayISO();
      setBkForm({ courtId: "", date: todayStr, startTime: "09:00", endTime: "10:00", duration: 1, status: "confirmed" });
      setBkMemberQuery("");
      setBkMemberResults([]);
      setBkCustomerQuery("");
      setBkCustomerResults([]);
      setBkCourtyclubResults([]);
      setBkModalVisible(true);
      sb.from("courts").select("id,court_number,court_type,hourly_rate,is_indoor").eq("club_id", clubId).eq("is_active", true).order("court_number").then(({ data }) => {
        const list = data || [];
        setCourts(list);
        setBkForm((prev) => ({ ...prev, courtId: list[0]?.id || "" }));
        loadBkAvailCourts(todayStr, "09:00", "10:00", list);
      });
    }
  }, []);
  useEffect(() => {
    if (!lessonForm.duration || !lessonForm.start_time || lessonForm.start_time.length < 5) return;
    const [sh, sm] = lessonForm.start_time.split(":").map(Number);
    if (isNaN(sh) || isNaN(sm)) return;
    const totalMin = sh * 60 + sm + Math.round(lessonForm.duration * 60);
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    const newEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    setLessonForm((prev) => ({ ...prev, end_time: newEnd }));
  }, [lessonForm.duration, lessonForm.start_time]);
  const loadCourts = async () => {
    const { data } = await sb.from("courts").select("id,court_number,court_type,hourly_rate,is_indoor").eq("club_id", clubId).eq("is_active", true);
    setCourts(data || []);
  };
  const loadDotDates = async () => {
    const from = /* @__PURE__ */ new Date();
    from.setDate(1);
    const to = new Date(from.getFullYear(), from.getMonth() + 2, 0);
    const courtIds = await getClubCourtIds(clubId);
    if (courtIds.length === 0) return;
    const { data } = await sb.from("bookings").select("start_time").in("court_id", courtIds).neq("status", "cancelled").gte("start_time", from.toISOString()).lte("start_time", to.toISOString());
    const dates = [...new Set((data || []).map((b) => b.start_time.split("T")[0]))];
    setDotDates(dates);
  };
  const loadDay = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const startDt = /* @__PURE__ */ new Date(selDate + "T00:00:00");
      const endDt = /* @__PURE__ */ new Date(selDate + "T23:59:59");
      const courtIds = await getClubCourtIds(clubId);
      if (courtIds.length === 0) {
        setBookings([]);
        return;
      }
      const startDb = localTimeToDb(startDt.toISOString());
      const endDb = localTimeToDb(endDt.toISOString());
      const { data, error } = await sb.from("bookings").select("*, courts!bookings_court_id_fkey(court_number,court_type), booking_players!booking_players_booking_id_fkey(player_id, is_primary_player, profiles!booking_players_player_id_fkey(id,full_name,email))").in("court_id", courtIds).neq("status", "cancelled").is("lesson_id", null).gte("start_time", startDb).lte("start_time", endDb).order("start_time", { ascending: true });
      if (error) {
        console.error("loadDay error:", error);
        setBookings([]);
        return;
      }
      const customerIds = [...new Set((data || []).map((b) => b.club_customer_id).filter(Boolean))];
      const custNameMap = /* @__PURE__ */ new Map();
      if (customerIds.length > 0) {
        const { data: custData } = await sb.from("club_customers").select("id,full_name").in("id", customerIds);
        (custData || []).forEach((c) => custNameMap.set(c.id, c.full_name));
      }
      if (!requiresApproval) {
        const pendingIds = (data || []).filter((b) => b.status === "pending").map((b) => b.id);
        if (pendingIds.length > 0) {
          sb.from("bookings").update({ status: "confirmed" }).in("id", pendingIds).then(() => {
          }).catch((e) => console.warn("Auto-confirm error:", e));
        }
      }
      setBookings((data || []).map((b) => ({
        ...b,
        _customerName: custNameMap.get(b.club_customer_id) || null,
        status: !requiresApproval && b.status === "pending" ? "confirmed" : b.status,
        start_time: dbTimeToLocal(b.start_time),
        end_time: dbTimeToLocal(b.end_time)
      })));
    } catch (e) {
      console.error("loadDay exception:", e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };
  const updateStatus = async (id, status, booking) => {
    try {
      if (status === "cancelled") {
        if (!confirm("Bu rezervasyonu iptal etmek istedi\u011Finize emin misiniz?")) return;
        const { error } = await sb.from("bookings").update({ status }).eq("id", id);
        if (error) throw error;
        if (booking?.user_id) {
          sb.from("notifications").insert({
            user_id: booking.user_id,
            title: "Rezervasyon \u0130ptal Edildi",
            message: "Rezervasyonunuz kul\xFCp taraf\u0131ndan iptal edildi.",
            type: "reservation_cancelled",
            data: { booking_id: id }
          }).then(() => {
          }).catch((e) => console.warn("Bildirim g\xF6nderilemedi:", e));
        }
      } else {
        const { error } = await sb.from("bookings").update({ status }).eq("id", id);
        if (error) throw error;
        if (status === "confirmed" && booking?.user_id) {
          sb.from("notifications").insert({
            user_id: booking.user_id,
            title: "Rezervasyon Onayland\u0131",
            message: "Rezervasyonunuz kul\xFCp taraf\u0131ndan onayland\u0131.",
            type: "reservation_confirmed",
            data: { booking_id: id }
          }).then(() => {
          }).catch((e) => console.warn("Bildirim g\xF6nderilemedi:", e));
        }
      }
    } catch (e) {
      alert(e.message);
      return;
    }
    loadDay();
  };
  const markBookingPaid = async (booking) => {
    const amount = Number(booking.total_amount) || 0;
    const amtStr = amount > 0 ? `

Tutar: \u20BA${amount.toLocaleString("tr-TR")}` : "";
    if (!confirm(`Bu rezervasyon i\xE7in \xF6deme al\u0131nd\u0131 m\u0131?${amtStr}`)) return;
    try {
      const { error } = await sb.from("bookings").update({ payment_status: "paid" }).eq("id", booking.id);
      if (error) throw error;
      if (amount > 0) {
        const playerName = booking.player_name || booking.booking_players?.find((p) => p.is_primary_player)?.profiles?.full_name || booking.booking_players?.[0]?.profiles?.full_name || booking._customerName || "Misafir";
        await sb.from("club_finances").insert({
          club_id: clubId,
          type: "income",
          category: "Rezervasyon Geliri",
          amount,
          description: `${playerName} - Kort ${booking.courts?.court_number || "?"} rezervasyon \xF6demesi`,
          date: booking.start_time?.slice(0, 10) || todayISO()
        });
      }
      loadDay();
    } catch (e) {
      alert(e.message);
    }
  };
  const openAdd = () => {
    const startTime = "09:00";
    const endTime = "10:00";
    setBkForm({ courtId: courts[0]?.id || "", date: selDate, startTime, endTime, duration: 1, status: "confirmed" });
    setBkMemberId(null);
    setBkMemberName("");
    setBkMemberQuery("");
    setBkMemberResults([]);
    setBkCustomerId(null);
    setBkCustomerName("");
    setBkCustomerQuery("");
    setBkCustomerResults([]);
    setBkCourtyclubResults([]);
    setBkPersonMode(hasMembership ? "member" : "customer");
    setBkPriceOverride("");
    loadBkAvailCourts(selDate, startTime, endTime);
    setBkModalVisible(true);
  };
  const loadBkAvailCourts = async (date, startTime, endTime, courtList) => {
    const list = courtList ?? courts;
    if (!date || !startTime || !endTime || list.length === 0) {
      setBkAvailCourts([...list]);
      return;
    }
    setBkCourtsLoading(true);
    try {
      const startDb = localTimeToDb(`${date}T${startTime}`);
      const endDb = localTimeToDb(`${date}T${endTime}`);
      const allIds = list.map((c) => c.id);
      const blocked = /* @__PURE__ */ new Set();
      const [bRes, lRes, mlRes, clRes] = await Promise.all([
        sb.from("bookings").select("court_id").in("court_id", allIds).in("status", ["pending", "confirmed"]).lt("start_time", endDb).gt("end_time", startDb),
        sb.from("lessons").select("court_id").in("court_id", allIds).neq("status", "cancelled").lt("start_time", endDb.replace("Z", "+03:00")).gt("end_time", startDb.replace("Z", "+03:00")).not("court_id", "is", null),
        sb.from("club_manual_lessons").select("court_id, start_time, end_time").in("court_id", allIds).eq("date", date).not("court_id", "is", null),
        sb.from("court_closures").select("court_id, closure_type, day_of_week, start_hour, start_minute, end_hour, end_minute, start_date, end_date, group_id").in("court_id", allIds).eq("is_active", true)
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
      const closureGroupIds = (clRes.data || []).map((c) => c.group_id).filter(Boolean);
      const exceptionSet = /* @__PURE__ */ new Set();
      if (closureGroupIds.length > 0) {
        const { data: exData } = await sb.from("group_lesson_exceptions").select("group_id, start_hour, start_minute").in("group_id", closureGroupIds).eq("exception_date", date);
        (exData || []).forEach((ex) => exceptionSet.add(`${ex.group_id}_${ex.start_hour}_${ex.start_minute ?? 0}`));
      }
      const dow = (/* @__PURE__ */ new Date(date + "T12:00:00")).getDay();
      for (const cl of clRes.data || []) {
        const clStart = (cl.start_hour || 0) * 60 + (cl.start_minute || 0);
        const clEnd = (cl.end_hour || 0) * 60 + (cl.end_minute || 0);
        if (newStart >= clEnd || newEnd <= clStart) continue;
        if (cl.group_id && exceptionSet.has(`${cl.group_id}_${cl.start_hour}_${cl.start_minute ?? 0}`)) continue;
        if (cl.closure_type === "recurring_weekly" && cl.day_of_week === dow) blocked.add(cl.court_id);
        else if (cl.closure_type === "one_time") {
          if ((!cl.start_date || cl.start_date <= date) && (!cl.end_date || cl.end_date >= date)) blocked.add(cl.court_id);
        }
      }
      setBkAvailCourts(list.filter((c) => !blocked.has(c.id)));
    } catch (e) {
      console.error(e);
      setBkAvailCourts([]);
    } finally {
      setBkCourtsLoading(false);
    }
  };
  const handleBkDuration = (d) => {
    const [sh, sm] = (bkForm.startTime || "09:00").split(":").map(Number);
    const totalMin = sh * 60 + sm + Math.round(d * 60);
    const eh = Math.floor(totalMin / 60) % 24;
    const em = totalMin % 60;
    const newEnd = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
    const newForm = { ...bkForm, duration: d, endTime: newEnd };
    setBkForm(newForm);
    loadBkAvailCourts(newForm.date, newForm.startTime, newEnd);
  };
  const searchBkPerson = async (q) => {
    setBkMemberQuery(q);
    if (q.length < 2) {
      setBkMemberResults([]);
      setBkCustomerResults([]);
      setBkCourtyclubResults([]);
      return;
    }
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
      setBkMemberResults(members);
      setBkCustomerResults(customers);
      setBkCourtyclubResults((ccRes.data || []).filter((p) => !memberIds.has(p.id) && !customerUserIds.has(p.id)));
    } catch (e) {
      console.error(e);
    }
  };
  const searchLessonPerson = async (q) => {
    setLessonPlayerSearch(q);
    if (q.length < 2) {
      setLessonPlayerResults([]);
      setLessonCustomerResults([]);
      setLessonCourtyclubResults([]);
      return;
    }
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
      setLessonPlayerResults(members);
      setLessonCustomerResults(customers);
      setLessonCourtyclubResults((ccRes.data || []).filter((p) => !memberIds.has(p.id) && !customerUserIds.has(p.id)));
    } catch (e) {
      console.error(e);
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
        setLessonSelectedCustomer(newCust);
        setLessonForm((prev) => ({ ...prev, student_name: newCust.full_name, player_id: null }));
        setLessonPlayerSearch("");
        setLessonPlayerResults([]);
        setLessonCustomerResults([]);
        setLessonCourtyclubResults([]);
      } else {
        setBkCustomerId(newCust.id);
        setBkCustomerName(newCust.full_name);
        setBkPersonMode("customer");
        setBkMemberQuery("");
        setBkMemberResults([]);
        setBkCustomerResults([]);
        setBkCourtyclubResults([]);
      }
      setQuickAddCust(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setQuickAddSaving(false);
    }
  };
  const saveBkBooking = async () => {
    const { courtId, date, startTime, endTime, duration, status } = bkForm;
    if (!courtId) {
      alert("L\xFCtfen bir kort se\xE7in.");
      return;
    }
    if (!startTime) {
      alert("Ba\u015Flang\u0131\xE7 saati eksik.");
      return;
    }
    if (bkMemberId) {
      const startDT = `${date}T${startTime}`;
      const warnings = await checkMembershipLimits(bkMemberId, startDT);
      if (warnings.length > 0) {
        const ok = confirm("\u26A0\uFE0F \xDCyelik Uyar\u0131s\u0131:\n\n" + warnings.join("\n") + "\n\nYine de rezervasyon olu\u015Fturulsun mu?");
        if (!ok) return;
      }
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
    setBkSaving(true);
    try {
      const [bConflict, mConflict, closures, lConflict] = await Promise.all([
        sb.from("bookings").select("id").eq("court_id", courtId).in("status", ["pending", "confirmed"]).lt("start_time", endDb).gt("end_time", startDb),
        sb.from("club_manual_lessons").select("id, start_time, end_time").eq("court_id", courtId).eq("date", date),
        sb.from("court_closures").select("*").eq("court_id", courtId).eq("is_active", true),
        // bookings=fake-UTC (Z), lessons=GERÇEK +03:00 saklanır → lessons sınırlarını +03:00 ile kur (mobil ile aynı)
        sb.from("lessons").select("id").eq("court_id", courtId).neq("status", "cancelled").lt("start_time", endDb.replace("Z", "+03:00")).gt("end_time", startDb.replace("Z", "+03:00")).not("court_id", "is", null)
      ]);
      if ((bConflict.data || []).length > 0) {
        alert("Bu kort se\xE7ilen saatte zaten rezerve edilmi\u015F.");
        return;
      }
      if ((lConflict.data || []).length > 0) {
        alert("Bu kort se\xE7ilen saatte planlanm\u0131\u015F bir \xF6zel ders var.");
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
      const closureGroupIds2 = (closures.data || []).map((c) => c.group_id).filter(Boolean);
      const exSet2 = /* @__PURE__ */ new Set();
      if (closureGroupIds2.length > 0) {
        const { data: exData2 } = await sb.from("group_lesson_exceptions").select("group_id, start_hour, start_minute").in("group_id", closureGroupIds2).eq("exception_date", date);
        (exData2 || []).forEach((ex) => exSet2.add(`${ex.group_id}_${ex.start_hour}_${ex.start_minute ?? 0}`));
      }
      const closureBlock = (closures.data || []).some((cl) => {
        const clStart = (cl.start_hour || 0) * 60 + (cl.start_minute || 0);
        const clEnd = (cl.end_hour || 0) * 60 + (cl.end_minute || 0);
        if (newStart >= clEnd || newEnd <= clStart) return false;
        if (cl.group_id && exSet2.has(`${cl.group_id}_${cl.start_hour}_${cl.start_minute ?? 0}`)) return false;
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
      const parsedOverride = parseFloat((bkPriceOverride || "").replace(",", "."));
      const totalAmount = !isNaN(parsedOverride) && parsedOverride !== calculatedAmount ? parsedOverride : calculatedAmount;
      const { data: bk, error: bkErr } = await sb.from("bookings").insert({
        court_id: courtId,
        user_id: user.id,
        start_time: startDb,
        end_time: endDb,
        status: status || "confirmed",
        is_solo_booking: !bkMemberId && !bkCustomerId,
        duration_hours: durationHours,
        total_amount: totalAmount,
        calculated_amount: calculatedAmount,
        club_customer_id: bkCustomerId || null,
        player_name: bkMemberName || bkCustomerName || null
      }).select("id").single();
      if (bkErr) throw bkErr;
      const playerIdToLink = bkMemberId || null;
      const insertedBkId = bk?.id ?? null;
      if (playerIdToLink && insertedBkId) {
        await sb.from("booking_players").insert({
          booking_id: insertedBkId,
          player_id: playerIdToLink,
          is_primary_player: true,
          status: "confirmed"
        });
      }
      setBkModalVisible(false);
      loadDay();
      loadDotDates();
      alert("Rezervasyon ba\u015Far\u0131yla olu\u015Fturuldu.");
    } catch (e) {
      alert("Hata: " + e.message);
    } finally {
      setBkSaving(false);
    }
  };
  const checkMembershipLimits = async (memberId, startTime) => {
    const warnings = [];
    try {
      const { data: membership } = await sb.from("club_memberships").select("*, package:club_membership_packages(*)").eq("user_id", memberId).eq("club_id", clubId).eq("status", "active").maybeSingle();
      if (!membership?.package) return warnings;
      const pkg = membership.package;
      if (pkg.valid_days && pkg.valid_days !== "all") {
        const day = new Date(startTime).getDay();
        const isWeekend = day === 0 || day === 6;
        if (pkg.valid_days === "weekdays" && isWeekend)
          warnings.push("Bu \xFCyenin paketi sadece hafta i\xE7i ge\xE7erli. Hafta sonu rezervasyon k\u0131s\u0131tl\u0131!");
        if (pkg.valid_days === "weekends" && !isWeekend)
          warnings.push("Bu \xFCyenin paketi sadece hafta sonu ge\xE7erli. Hafta i\xE7i rezervasyon k\u0131s\u0131tl\u0131!");
      }
      if (pkg.penalty_no_reservation && pkg.penalty_duration_days) {
        const { data: lastCancelled } = await sb.from("bookings").select("updated_at").in("court_id", await getClubCourtIds(clubId)).eq("status", "cancelled").order("updated_at", { ascending: false }).limit(1);
        if (lastCancelled?.length > 0) {
          const since = new Date(lastCancelled[0].updated_at);
          const cutoff = new Date(since);
          cutoff.setDate(cutoff.getDate() + pkg.penalty_duration_days);
          if (/* @__PURE__ */ new Date() < cutoff)
            warnings.push(`Bu \xFCye yapt\u0131r\u0131m cezas\u0131 alt\u0131nda \u2014 ${cutoff.toLocaleDateString("tr-TR")} tarihine kadar rezervasyon yapamaz.`);
        }
      }
      if (pkg.weekly_court_hours_limit) {
        const weekStart = new Date(startTime);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        const courtIds = await getClubCourtIds(clubId);
        if (courtIds.length > 0) {
          const { data: weekBks } = await sb.from("booking_players").select("booking:bookings!booking_players_booking_id_fkey(start_time, end_time, status)").eq("player_id", memberId).not("booking.status", "eq", "cancelled");
          let usedHours = 0;
          (weekBks || []).forEach((bp) => {
            const b = bp.booking;
            if (!b?.start_time) return;
            const bs = new Date(b.start_time);
            if (bs >= weekStart && bs < weekEnd) {
              const be = new Date(b.end_time);
              usedHours += (be - bs) / 36e5;
            }
          });
          const remaining = pkg.weekly_court_hours_limit - usedHours;
          if (remaining <= 0) {
            warnings.push(`Bu \xFCye haftal\u0131k kort limitini (${pkg.weekly_court_hours_limit} saat) doldurmu\u015F!`);
          } else if (remaining < 1) {
            warnings.push(`Bu \xFCyenin bu hafta sadece ${(remaining * 60).toFixed(0)} dakika hakk\u0131 kald\u0131.`);
          }
        }
      }
    } catch (e) {
      console.error("checkMembershipLimits:", e);
    }
    return warnings;
  };
  const saveBooking = async () => {
    if (form.member_id) {
      const warnings = await checkMembershipLimits(form.member_id, form.start_time);
      if (warnings.length > 0) {
        const proceed = confirm("\u26A0\uFE0F \xDCyelik Uyar\u0131s\u0131:\n\n" + warnings.join("\n") + "\n\nYine de rezervasyon olu\u015Fturulsun mu?");
        if (!proceed) return;
      }
    }
    if (new Date(form.start_time) < /* @__PURE__ */ new Date()) {
      alert("Ge\xE7mi\u015F bir tarihe rezervasyon olu\u015Fturamazs\u0131n\u0131z.");
      return;
    }
    if (form.court_id) {
      const startDb2 = localTimeToDb(form.start_time);
      const endDb2 = localTimeToDb(form.end_time);
      const dateStr = form.start_time.slice(0, 10);
      const startHH = form.start_time.slice(11, 16);
      const endHH = form.end_time.slice(11, 16);
      const [{ data: bConflict }, { data: mConflict }, { data: lConflict }, { data: closures }] = await Promise.all([
        sb.from("bookings").select("id").eq("court_id", form.court_id).in("status", ["pending", "confirmed"]).lt("start_time", endDb2).gt("end_time", startDb2),
        sb.from("club_manual_lessons").select("id, start_time, end_time").eq("court_id", form.court_id).eq("date", dateStr),
        sb.from("lessons").select("id").eq("court_id", form.court_id).neq("status", "cancelled").lt("start_time", endDb2.replace("Z", "+03:00")).gt("end_time", startDb2.replace("Z", "+03:00")),
        sb.from("court_closures").select("*").eq("court_id", form.court_id).eq("is_active", true)
      ]);
      if (bConflict?.length > 0 || lConflict?.length > 0) {
        alert("Bu kort se\xE7ilen saatte zaten rezerve edilmi\u015F.");
        return;
      }
      const hasManualConflict = (mConflict || []).some((l) => {
        const ls = (l.start_time || "").slice(0, 5);
        const le = (l.end_time || "").slice(0, 5);
        return ls < endHH && le > startHH;
      });
      if (hasManualConflict) {
        alert("Bu kort se\xE7ilen saatte planlanm\u0131\u015F bir ders var.");
        return;
      }
      const dow = (/* @__PURE__ */ new Date(dateStr + "T12:00:00")).getDay();
      const closureGroupIds3 = (closures || []).map((c) => c.group_id).filter(Boolean);
      const exSet3 = /* @__PURE__ */ new Set();
      if (closureGroupIds3.length > 0) {
        const { data: exData3 } = await sb.from("group_lesson_exceptions").select("group_id, start_hour, start_minute").in("group_id", closureGroupIds3).eq("exception_date", dateStr);
        (exData3 || []).forEach((ex) => exSet3.add(`${ex.group_id}_${ex.start_hour}_${ex.start_minute ?? 0}`));
      }
      const closureBlock = (closures || []).some((cl) => {
        const cs = String(cl.start_hour ?? 0).padStart(2, "0") + ":" + String(cl.start_minute ?? 0).padStart(2, "0");
        const ce = String(cl.end_hour ?? 0).padStart(2, "0") + ":" + String(cl.end_minute ?? 0).padStart(2, "0");
        if (!(cs < endHH && ce > startHH)) return false;
        if (cl.group_id && exSet3.has(`${cl.group_id}_${cl.start_hour}_${cl.start_minute ?? 0}`)) return false;
        if (cl.closure_type === "recurring_weekly") return cl.day_of_week === dow;
        return (!cl.start_date || cl.start_date <= dateStr) && (!cl.end_date || cl.end_date >= dateStr);
      });
      if (closureBlock) {
        alert("Bu kort se\xE7ilen saatte kapal\u0131 (bak\u0131m veya etkinlik).");
        return;
      }
    }
    if (!form.start_time || !form.end_time) {
      alert("Ba\u015Flang\u0131\xE7 ve biti\u015F saati zorunludur.");
      return;
    }
    if (!form.court_id) {
      alert("Kort se\xE7imi zorunludur.");
      return;
    }
    const startDb = localTimeToDb(form.start_time);
    const endDb = localTimeToDb(form.end_time);
    const durationHours = Math.round((new Date(endDb) - new Date(startDb)) / 36e5 * 100) / 100;
    if (!(durationHours > 0)) {
      alert("Biti\u015F saati ba\u015Flang\u0131\xE7 saatinden sonra olmal\u0131d\u0131r.");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error("Oturum bulunamad\u0131.");
      const court = courts.find((c) => c.id === form.court_id);
      const totalAmount = Math.round((court?.hourly_rate || 0) * durationHours * 100) / 100;
      const { data: bk, error: bkErr } = await sb.from("bookings").insert({
        court_id: form.court_id,
        user_id: user.id,
        start_time: startDb,
        end_time: endDb,
        status: form.status || "confirmed",
        is_solo_booking: !form.member_id,
        duration_hours: durationHours,
        total_amount: totalAmount
      }).select().single();
      if (bkErr) throw bkErr;
      if (form.member_id && bk?.id) {
        await sb.from("booking_players").insert({
          booking_id: bk.id,
          player_id: form.member_id,
          is_primary_player: true,
          status: "confirmed"
        });
      }
      setModal(null);
      loadDay();
    } catch (e) {
      if (e.message?.includes("no_overlapping_bookings") || e.code === "23P01") {
        alert("Bu kort se\xE7ilen saatte zaten dolu. L\xFCtfen farkl\u0131 bir saat veya kort se\xE7in.");
      } else {
        alert(e.message);
      }
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    if (!lessonModal) {
      setLessonSelectedPlayer(null);
      setLessonPlayerSearch("");
      setLessonPlayerResults([]);
      setLessonCourtyclubResults([]);
      setLessonPackages([]);
      setLessonUsePackage(false);
      setLessonSelectedPackageId(null);
    }
  }, [lessonModal]);
  useEffect(() => {
    const playerId = lessonSelectedPlayer?.id;
    const coachClubId = lessonForm.coach_id;
    if (!playerId || !coachClubId || lessonForm.use_manual_coach) {
      setLessonPackages([]);
      setLessonUsePackage(false);
      setLessonSelectedPackageId(null);
      return;
    }
    (async () => {
      setLessonLoadingPackages(true);
      try {
        const coachRec = coaches.find((c) => c.id === coachClubId);
        const individualCoachId = coachRec?.individual_coach_id;
        if (!individualCoachId) {
          setLessonPackages([]);
          return;
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const { data } = await sb.from("player_lesson_packages").select("*, lesson_packages(name, total_lessons, price, validity_days, coach_percentage, coach_payout_mode)").eq("player_id", playerId).eq("coach_id", individualCoachId).in("payment_status", ["paid", "pending"]).eq("status", "active").or(`expiry_date.is.null,expiry_date.gt.${now}`).order("created_at", { ascending: false });
        const pkgs = (data || []).map((r) => ({
          ...r,
          package_name: r.lesson_packages?.name || r.custom_name || "\xD6zel Paket",
          remaining: (r.total_lessons || 0) - (r.used_lessons || 0)
        }));
        setLessonPackages(pkgs);
        if (pkgs.length > 0) {
          setLessonSelectedPackageId(pkgs[0].id);
        } else {
          setLessonUsePackage(false);
          setLessonSelectedPackageId(null);
        }
      } catch (e) {
        console.error("package load:", e);
      } finally {
        setLessonLoadingPackages(false);
      }
    })();
  }, [lessonSelectedPlayer?.id, lessonForm.coach_id, lessonForm.use_manual_coach]);
  const loadLessons = async () => {
    setLoadingL(true);
    try {
      const d = selDate;
      const dbStart = (/* @__PURE__ */ new Date(d + "T00:00:00")).toISOString();
      const dbEnd = (/* @__PURE__ */ new Date(d + "T23:59:59")).toISOString();
      const [coachRes, courtRes] = await Promise.all([
        sb.from("club_coaches").select("id, full_name, hourly_rate, individual_coach_id, coach_pay_rate").eq("club_id", clubId),
        sb.from("courts").select("id, court_number, hourly_rate").eq("club_id", clubId).eq("is_active", true)
      ]);
      const allClubCoaches = coachRes.data || [];
      const myCoachIds = allClubCoaches.map((c) => c.id);
      const coachMap = new Map(allClubCoaches.map((c) => [c.id, c.full_name]));
      setCoaches(allClubCoaches);
      setLessonCourts(courtRes.data || []);
      const p = window.__slotPrefill;
      if (p?.type === "lesson") {
        window.__slotPrefill = null;
        setLessonForm({ use_manual_coach: false, coach_id: "", manual_coach_name: "", date: p.date, start_time: p.start_time, end_time: p.end_time, duration: 1, student_name: "", player_id: null, court_id: p.court_id, notes: "", amount: "", payment_status: "unpaid" });
        setLessonModal({ type: "add" });
      }
      const combined = [];
      const coachToIndividual = new Map(allClubCoaches.map((c) => [c.id, c.individual_coach_id]));
      const { data: manual } = await sb.from("club_manual_lessons").select("*, club_coaches(full_name)").eq("club_id", clubId).eq("date", d).order("start_time", { ascending: true });
      const individualIds = allClubCoaches.map((c) => c.individual_coach_id).filter(Boolean);
      let manualPkgMap = /* @__PURE__ */ new Map();
      if (individualIds.length > 0) {
        const { data: manualSessions } = await sb.from("lesson_package_sessions").select("id, player_package_id, coach_id").eq("session_date", d).is("lesson_id", null).in("coach_id", individualIds);
        (manualSessions || []).forEach((s) => manualPkgMap.set(s.coach_id, { session_id: s.id, player_package_id: s.player_package_id }));
      }
      (manual || []).forEach((m) => {
        const individualId = coachToIndividual.get(m.coach_id);
        const pkgInfo = individualId ? manualPkgMap.get(individualId) : null;
        combined.push({
          id: m.id,
          date: m.date,
          start_time: (m.start_time || "").slice(0, 5),
          end_time: (m.end_time || "").slice(0, 5),
          student_name: m.student_name || null,
          coach_name: m.coach_name || m.club_coaches?.full_name || "Antren\xF6r",
          coach_id: m.coach_id || null,
          court_id: m.court_id || null,
          court_fee: m.court_fee || 0,
          location: m.location || "\u2014",
          source: "manual",
          payment_status: m.payment_status || "unpaid",
          amount: m.amount || 0,
          is_package_lesson: !!pkgInfo,
          pkg_session_id: pkgInfo?.session_id || null,
          player_package_id: pkgInfo?.player_package_id || null,
          price_mode: m.price_mode || "normal",
          coach_amount: m.coach_amount ?? null
        });
      });
      if (myCoachIds.length > 0) {
        const { data: directLessons } = await sb.from("lessons").select("id, start_time, end_time, student_name, club_coach_id, court_id, amount, coach_amount, payment_status, price_mode, courts(court_number)").in("club_coach_id", myCoachIds).neq("status", "cancelled").gte("start_time", dbStart).lte("start_time", dbEnd);
        const lessonIds = (directLessons || []).map((l) => l.id);
        let pkgSessionMap = /* @__PURE__ */ new Map();
        if (lessonIds.length > 0) {
          const { data: pkgSessions } = await sb.from("lesson_package_sessions").select("id, lesson_id, player_package_id").in("lesson_id", lessonIds);
          (pkgSessions || []).forEach((s) => pkgSessionMap.set(s.lesson_id, { session_id: s.id, player_package_id: s.player_package_id }));
        }
        (directLessons || []).forEach((l) => {
          const start = new Date(l.start_time);
          const end = new Date(l.end_time);
          const court = Array.isArray(l.courts) ? l.courts[0] : l.courts;
          const pkgInfo = pkgSessionMap.get(l.id);
          combined.push({
            id: l.id,
            date: start.toISOString().split("T")[0],
            start_time: start.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
            end_time: end.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
            student_name: l.student_name || null,
            coach_name: l.club_coach_id ? coachMap.get(l.club_coach_id) || "Antren\xF6r" : "Antren\xF6r",
            coach_id: l.club_coach_id || null,
            court_id: l.court_id || null,
            location: court?.court_number ? `Kort ${court.court_number}` : "\u2014",
            source: "lesson",
            payment_status: l.payment_status === "paid" ? "paid" : "unpaid",
            amount: l.amount || null,
            is_package_lesson: !!pkgInfo,
            pkg_session_id: pkgInfo?.session_id || null,
            player_package_id: pkgInfo?.player_package_id || null,
            price_mode: l.price_mode || "normal",
            coach_amount: l.coach_amount ?? null
          });
        });
      }
      combined.sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
      setLessons(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingL(false);
    }
  };
  const saveLesson = async () => {
    const isNew = !lessonModal?.id;
    if (!lessonForm.date || !lessonForm.start_time || !lessonForm.end_time) {
      alert("Tarih, ba\u015Flang\u0131\xE7 ve biti\u015F saati zorunludur.");
      return;
    }
    if (!lessonForm.court_id) {
      alert("L\xFCtfen kort se\xE7in.");
      return;
    }
    const coachOk = lessonForm.use_manual_coach ? !!lessonForm.manual_coach_name?.trim() : !!lessonForm.coach_id;
    if (!coachOk) {
      alert("L\xFCtfen bir antren\xF6r se\xE7in veya antren\xF6r ad\u0131n\u0131 girin.");
      return;
    }
    if (lessonForm.start_time >= lessonForm.end_time) {
      alert("Biti\u015F saati ba\u015Flang\u0131\xE7 saatinden sonra olmal\u0131d\u0131r.");
      return;
    }
    if (isNew) {
      if (/* @__PURE__ */ new Date(`${lessonForm.date}T${lessonForm.start_time}`) < /* @__PURE__ */ new Date()) {
        if (!confirm("Ge\xE7mi\u015F bir tarihe ders eklensin mi?")) return;
      }
    }
    if (isNew) {
      const dateStr = lessonForm.date;
      const startHH = lessonForm.start_time.slice(0, 5);
      const endHH = lessonForm.end_time.slice(0, 5);
      const startDb = localTimeToDb(`${dateStr}T${startHH}`);
      const endDb = localTimeToDb(`${dateStr}T${endHH}`);
      const courtRow0 = lessonCourts.find((c) => c.id === lessonForm.court_id);
      const locationStr = courtRow0 ? `Kort ${courtRow0.court_number}` : "";
      const [{ data: bConflict }, { data: mConflict }, { data: lConflict }, { data: closures }] = await Promise.all([
        sb.from("bookings").select("id").eq("court_id", lessonForm.court_id).neq("status", "cancelled").lt("start_time", endDb).gt("end_time", startDb),
        sb.from("club_manual_lessons").select("id,start_time,end_time,court_id,location").eq("club_id", clubId).eq("date", dateStr),
        sb.from("lessons").select("id").eq("court_id", lessonForm.court_id).neq("status", "cancelled").lt("start_time", endDb.replace("Z", "+03:00")).gt("end_time", startDb.replace("Z", "+03:00")),
        sb.from("court_closures").select("*").eq("court_id", lessonForm.court_id).eq("is_active", true)
      ]);
      if (bConflict?.length > 0 || lConflict?.length > 0) {
        alert("Bu kort se\xE7ilen saatte zaten rezerve edilmi\u015F.");
        return;
      }
      const hasManualConflict = (mConflict || []).filter((l) => l.court_id ? l.court_id === lessonForm.court_id : l.location === locationStr).some((l) => {
        const ls = (l.start_time || "").slice(0, 5);
        const le = (l.end_time || "").slice(0, 5);
        return ls < endHH && le > startHH;
      });
      if (hasManualConflict) {
        alert("Bu kort se\xE7ilen saatte zaten dolu. L\xFCtfen farkl\u0131 bir saat veya kort se\xE7in.");
        return;
      }
      const dow = (/* @__PURE__ */ new Date(dateStr + "T12:00:00")).getDay();
      const closureGroupIds4 = (closures || []).map((c) => c.group_id).filter(Boolean);
      const exSet4 = /* @__PURE__ */ new Set();
      if (closureGroupIds4.length > 0) {
        const { data: exData4 } = await sb.from("group_lesson_exceptions").select("group_id, start_hour, start_minute").in("group_id", closureGroupIds4).eq("exception_date", dateStr);
        (exData4 || []).forEach((ex) => exSet4.add(`${ex.group_id}_${ex.start_hour}_${ex.start_minute ?? 0}`));
      }
      const closureBlock = (closures || []).some((cl) => {
        const cs = String(cl.start_hour ?? 0).padStart(2, "0") + ":" + String(cl.start_minute ?? 0).padStart(2, "0");
        const ce = String(cl.end_hour ?? 0).padStart(2, "0") + ":" + String(cl.end_minute ?? 0).padStart(2, "0");
        if (!(cs < endHH && ce > startHH)) return false;
        if (cl.group_id && exSet4.has(`${cl.group_id}_${cl.start_hour}_${cl.start_minute ?? 0}`)) return false;
        if (cl.closure_type === "recurring_weekly") return cl.day_of_week === dow;
        return (!cl.start_date || cl.start_date <= dateStr) && (!cl.end_date || cl.end_date >= dateStr);
      });
      if (closureBlock) {
        if (!confirm("Bu kort se\xE7ilen saatte kapal\u0131 olarak i\u015Faretlenmi\u015F. Yine de ders olu\u015Fturulsun mu?")) return;
      }
      if (!lessonForm.use_manual_coach && lessonForm.coach_id) {
        const [sh, sm] = startHH.split(":").map(Number);
        const [eh, em] = endHH.split(":").map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        const lessonDow = (/* @__PURE__ */ new Date(dateStr + "T12:00:00")).getDay();
        const coachLabel = coaches.find((c) => c.id === lessonForm.coach_id)?.full_name || "Antren\xF6r";
        const { data: coachConflict } = await sb.from("club_manual_lessons").select("id,start_time,end_time").eq("coach_id", lessonForm.coach_id).eq("date", dateStr);
        const hasCoachConflict = (coachConflict || []).some((l) => {
          const ls = (l.start_time || "").slice(0, 5);
          const le = (l.end_time || "").slice(0, 5);
          return ls < endHH && le > startHH;
        });
        if (hasCoachConflict) {
          alert("Bu antren\xF6r\xFCn se\xE7ilen saatte ba\u015Fka bir dersi var.");
          return;
        }
        const { data: lessonCoachConflict } = await sb.from("lessons").select("id").or(`coach_id.eq.${lessonForm.coach_id},club_coach_id.eq.${lessonForm.coach_id}`).neq("status", "cancelled").lt("start_time", endDb.replace("Z", "+03:00")).gt("end_time", startDb.replace("Z", "+03:00"));
        if (lessonCoachConflict?.length > 0) {
          alert("Bu antren\xF6r\xFCn se\xE7ilen saatte ba\u015Fka bir dersi var.");
          return;
        }
        const { data: coachClosures } = await sb.from("court_closures").select("closure_type, day_of_week, start_hour, end_hour, start_date, end_date, reason").eq("coach_id", lessonForm.coach_id).eq("is_active", true);
        const conflicts = [];
        for (const cl of coachClosures || []) {
          const clStart = (cl.start_hour || 0) * 60 + (cl.start_minute || 0);
          const clEnd = (cl.end_hour || 0) * 60 + (cl.end_minute || 0);
          if (startMin >= clEnd || endMin <= clStart) continue;
          if (cl.closure_type === "recurring_weekly" && cl.day_of_week === lessonDow) {
            const clStartStr = String(cl.start_hour).padStart(2, "0") + ":" + String(cl.start_minute ?? 0).padStart(2, "0");
            const clEndStr = String(cl.end_hour).padStart(2, "0") + ":" + String(cl.end_minute ?? 0).padStart(2, "0");
            conflicts.push(`Grup Program\u0131: ${cl.reason || "Antrenman"} \xB7 ${clStartStr}\u2013${clEndStr}`);
          } else if (cl.closure_type === "one_time" && cl.start_date && cl.end_date) {
            if (dateStr >= cl.start_date && dateStr <= cl.end_date) {
              conflicts.push(`Tek Seferlik Program: ${cl.reason || "Kapal\u0131"} \xB7 ${cl.start_date}\u2013${cl.end_date}`);
            }
          }
        }
        if (conflicts.length > 0) {
          if (!confirm(`\u26A0\uFE0F Hoca \xC7ak\u0131\u015Fmas\u0131

${coachLabel} adl\u0131 hocan\u0131n bu saatte ba\u015Fka program\u0131 var:

${conflicts.join("\n")}

Yine de eklensin mi?`)) return;
        }
      }
      if (lessonForm.player_id) {
        const [{ data: ownBookings }, { data: allConflictBookings }, { data: studentLessons }] = await Promise.all([
          sb.from("bookings").select("id").eq("user_id", lessonForm.player_id).in("status", ["pending", "confirmed"]).lt("start_time", endDb).gt("end_time", startDb),
          sb.from("bookings").select("id").in("status", ["pending", "confirmed"]).lt("start_time", endDb).gt("end_time", startDb),
          sb.from("lessons").select("id").eq("student_id", lessonForm.player_id).neq("status", "cancelled").lt("start_time", `${dateStr}T${endHH}:00+03:00`).gt("end_time", `${dateStr}T${startHH}:00+03:00`)
        ]);
        const conflictBookingIds = (allConflictBookings || []).map((b) => b.id);
        let isInvited = false;
        if (conflictBookingIds.length > 0) {
          const { data: invited } = await sb.from("booking_players").select("player_id").eq("player_id", lessonForm.player_id).in("booking_id", conflictBookingIds);
          isInvited = (invited?.length ?? 0) > 0;
        }
        if ((ownBookings?.length ?? 0) > 0 || isInvited || (studentLessons?.length ?? 0) > 0) {
          alert(`${lessonSelectedPlayer?.full_name || "\xD6\u011Frenci"} adl\u0131 oyuncunun bu saatte ba\u015Fka bir rezervasyonu veya dersi bulunuyor.`);
          return;
        }
      }
    }
    setSaving(true);
    try {
      const courtRow = lessonCourts.find((c) => c.id === lessonForm.court_id);
      const coachId = !lessonForm.use_manual_coach ? lessonForm.coach_id || null : null;
      const coachName = lessonForm.use_manual_coach ? lessonForm.manual_coach_name || null : null;
      const usingPkg = !!(lessonUsePackage && lessonSelectedPackageId);
      const coachAmt = parseFloat(String(lessonCoachAmountInput).replace(",", ".")) || 0;
      const clubAmt = parseFloat(String(lessonClubAmountInput).replace(",", ".")) || 0;
      const dualTotal = coachAmt + clubAmt;
      const isDual = lessonPriceMode === "normal";
      const amountVal = usingPkg ? 0 : isDual ? dualTotal || null : lessonForm.amount ? parseFloat(String(lessonForm.amount).replace(",", ".")) : null;
      const coachAmtVal = usingPkg ? null : isDual ? coachAmt || null : null;
      const payStatus = usingPkg ? "paid" : lessonPriceMode === "split" ? "paid" : lessonForm.payment_status || "unpaid";
      const linkPlayerId = lessonSelectedPlayer?.id || lessonSelectedCustomer?.user_id || null;
      const linkCustomerId = lessonSelectedCustomer?.id || null;
      const payload = {
        club_id: clubId,
        coach_id: coachId,
        coach_name: coachName,
        date: lessonForm.date,
        start_time: lessonForm.start_time.slice(0, 5),
        end_time: lessonForm.end_time.slice(0, 5),
        student_name: lessonForm.student_name || null,
        player_id: linkPlayerId,
        club_customer_id: linkCustomerId,
        court_id: lessonForm.court_id,
        location: courtRow ? `Kort ${courtRow.court_number}` : "",
        notes: lessonForm.notes?.trim() || null,
        payment_status: payStatus,
        amount: amountVal,
        coach_amount: coachAmtVal,
        price_mode: lessonPriceMode === "normal" ? "dual" : lessonPriceMode
      };
      if (lessonModal?.id) {
        await sb.from("club_manual_lessons").update(payload).eq("id", lessonModal.id);
      } else {
        const { data: inserted, error: insErr } = await sb.from("club_manual_lessons").insert(payload).select("id").single();
        if (insErr) throw insErr;
        if (inserted?.id) {
          const { data: { user } } = await sb.auth.getUser();
          const bookingUserId = user?.id;
          if (bookingUserId && lessonForm.court_id) {
            const startDb = localTimeToDb(`${lessonForm.date}T${lessonForm.start_time.slice(0, 5)}`);
            const endDb = localTimeToDb(`${lessonForm.date}T${lessonForm.end_time.slice(0, 5)}`);
            const durH = Math.round((new Date(endDb) - new Date(startDb)) / 36e5 * 100) / 100;
            const { error: bErr } = await sb.from("bookings").insert({
              court_id: lessonForm.court_id,
              user_id: bookingUserId,
              start_time: startDb,
              end_time: endDb,
              status: "confirmed",
              is_solo_booking: false,
              duration_hours: durH,
              total_amount: amountVal || 0,
              club_coach_id: coachId
            });
            if (bErr) console.warn("Kort takvim blo\u011Fu eklenemedi:", bErr.message);
          }
          if (usingPkg) {
            try {
              const pkg = lessonPackages.find((p) => p.id === lessonSelectedPackageId);
              if (pkg) {
                const remaining = (pkg.total_lessons || 0) - (pkg.used_lessons || 0);
                if (remaining <= 0) throw new Error("Bu pakette kalan ders yok");
                const newUsed = (pkg.used_lessons || 0) + 1;
                const isCompleted = newUsed >= (pkg.total_lessons || 0);
                const { error: sessErr } = await sb.from("lesson_package_sessions").insert({
                  player_package_id: lessonSelectedPackageId,
                  lesson_id: null,
                  coach_id: coaches.find((c) => c.id === coachId)?.individual_coach_id || null,
                  session_date: lessonForm.date,
                  notes: lessonForm.notes?.trim() || null
                });
                if (sessErr) throw sessErr;
                const { error: updErr } = await sb.from("player_lesson_packages").update({
                  used_lessons: newUsed,
                  status: isCompleted ? "completed" : "active",
                  updated_at: (/* @__PURE__ */ new Date()).toISOString()
                }).eq("id", lessonSelectedPackageId);
                if (updErr) throw updErr;
                const pkgDef = pkg.lesson_packages || {};
                const mode = pkgDef.coach_payout_mode || pkg.coach_payout_mode || "upfront";
                if (mode === "per_session") {
                  const perSessionTotal = (pkgDef.price ?? pkg.custom_price ?? 0) / (pkgDef.total_lessons || pkg.total_lessons || 1);
                  const coachRec = coaches.find((c) => c.id === coachId);
                  const pkgPct = pkgDef.coach_percentage ?? pkg.custom_coach_pct;
                  const coachPct = Number(pkgPct) > 0 ? Number(pkgPct) : coachRec?.coach_pay_rate || 0;
                  const coachEarning = Math.round(perSessionTotal * (coachPct / 100) * 100) / 100;
                  if (coachRec && coachEarning > 0) {
                    await sb.from("coach_earnings").insert({
                      club_id: clubId,
                      coach_id: coachId,
                      individual_coach_id: coachRec.individual_coach_id || null,
                      coach_name: coachRec.full_name,
                      student_name: lessonForm.student_name || null,
                      manual_lesson_id: inserted.id,
                      booking_id: null,
                      amount: coachEarning,
                      court_fee: 0,
                      date: lessonForm.date,
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
          if (!usingPkg && lessonPriceMode === "split" && coachId && amountVal > 0) {
            const coachRec = coaches.find((c) => c.id === coachId);
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
                    student_name: lessonForm.student_name || null,
                    amount: coachEarning,
                    court_fee: 0,
                    date: lessonForm.date,
                    description: `\xD6zel ders (pay) - ${lessonForm.student_name || "\xD6\u011Frenci"} - ${lessonForm.start_time.slice(0, 5)}`,
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
                    description: `${coachRec.full_name} - ${lessonForm.student_name || "\xD6\u011Frenci"} - \xD6zel Ders`,
                    date: lessonForm.date
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
      setLessonModal(null);
      loadLessons();
    } catch (e) {
      if (e.message?.includes("no_overlapping_bookings") || e.code === "23P01") {
        alert("Bu kort se\xE7ilen saatte zaten dolu. L\xFCtfen farkl\u0131 bir saat veya kort se\xE7in.");
      } else {
        alert(e.message);
      }
    } finally {
      setSaving(false);
    }
  };
  const cancelLesson = async (lesson) => {
    if (lesson.source === "booking") {
      alert("Rezervasyon kaynakl\u0131 dersler buradan iptal edilemez.");
      return;
    }
    const msg = lesson.is_package_lesson ? "Bu dersi silmek istedi\u011Finizden emin misiniz? Paketten d\xFC\u015F\xFClm\xFC\u015Fse kredi geri y\xFCklenir." : "Bu dersi iptal etmek istedi\u011Finize emin misiniz?";
    if (!confirm(msg)) return;
    try {
      if (lesson.pkg_session_id && lesson.player_package_id) {
        const { data: plp } = await sb.from("player_lesson_packages").select("used_lessons").eq("id", lesson.player_package_id).single();
        if (plp) {
          await Promise.all([
            sb.from("player_lesson_packages").update({
              used_lessons: Math.max(0, (plp.used_lessons || 0) - 1),
              status: "active",
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }).eq("id", lesson.player_package_id),
            sb.from("lesson_package_sessions").delete().eq("id", lesson.pkg_session_id)
          ]);
        }
      }
      const cancelCourtBooking = async (courtId, date, startTime, endTime) => {
        const startWeb = localTimeToDb(`${date}T${startTime}`);
        const endWeb = localTimeToDb(`${date}T${endTime}`);
        const startMob = (/* @__PURE__ */ new Date(`${date}T${startTime}:00+03:00`)).toISOString();
        const endMob = (/* @__PURE__ */ new Date(`${date}T${endTime}:00+03:00`)).toISOString();
        await Promise.all([
          sb.from("bookings").update({ status: "cancelled" }).eq("court_id", courtId).eq("start_time", startWeb).neq("status", "cancelled"),
          sb.from("bookings").update({ status: "cancelled" }).eq("court_id", courtId).eq("start_time", startMob).neq("status", "cancelled")
        ]);
      };
      if (lesson.source === "lesson") {
        await sb.from("lessons").update({ status: "cancelled" }).eq("id", lesson.id);
        if (lesson.court_id) {
          await cancelCourtBooking(lesson.court_id, lesson.date, lesson.start_time, lesson.end_time);
        }
      } else {
        await sb.from("club_manual_lessons").delete().eq("id", lesson.id);
        if (lesson.court_id) {
          await cancelCourtBooking(lesson.court_id, lesson.date, lesson.start_time, lesson.end_time);
        }
      }
    } catch (e) {
      console.warn("Ders iptal hatas\u0131:", e.message);
    }
    loadLessons();
  };
  const markLessonPaid = async (lesson) => {
    const locationMatch = (lesson.location || "").match(/Kort\s*(\d+)/i);
    const courtNum = locationMatch ? parseInt(locationMatch[1]) : null;
    const courtRow = courtNum != null ? lessonCourts.find((c) => c.court_number === courtNum) : null;
    const [sh, sm] = (lesson.start_time || "00:00").split(":").map(Number);
    const [eh, em] = (lesson.end_time || "00:00").split(":").map(Number);
    const durationH = Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
    const courtFee = Math.round((courtRow?.hourly_rate || 0) * durationH * 100) / 100;
    const coachAmount = Math.round((Number(lesson.amount) || 0) * 100) / 100;
    const total = Math.round((courtFee + coachAmount) * 100) / 100;
    const individualCoachId = coaches.find((c) => c.id === lesson.coach_id)?.individual_coach_id || null;
    if (lesson.source === "booking") {
      if (!confirm("Bu rezervasyon i\xE7in \xF6deme al\u0131nd\u0131 m\u0131?")) return;
      setLessonMarkingId(lesson.id);
      try {
        const { error } = await sb.from("bookings").update({ payment_status: "paid" }).eq("id", lesson.id);
        if (error) throw error;
        loadLessons();
      } catch (e) {
        alert(e.message);
      } finally {
        setLessonMarkingId(null);
      }
      return;
    }
    const isDual = lesson.price_mode === "dual";
    const isSplit = lesson.price_mode === "split";
    if (isDual) {
      const dualCoachAmt = Math.round((Number(lesson.coach_amount) || 0) * 100) / 100;
      const dualClubAmt = Math.round((coachAmount - dualCoachAmt) * 100) / 100;
      const lines2 = [
        `Hoca Hakedi\u015Fi: \u20BA${dualCoachAmt.toLocaleString("tr-TR")}`,
        `Kul\xFCp Pay\u0131:    \u20BA${dualClubAmt.toLocaleString("tr-TR")}`,
        `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
        `Toplam:        \u20BA${coachAmount.toLocaleString("tr-TR")}`
      ].join("\n");
      if (!confirm(`\xD6deme Al

${lines2}

\xD6deme al\u0131nd\u0131 olarak i\u015Faretlensin mi?`)) return;
      setLessonMarkingId(lesson.id);
      try {
        if (dualCoachAmt > 0) {
          const { error } = await sb.from("coach_earnings").insert({
            club_id: clubId,
            coach_id: lesson.coach_id || null,
            individual_coach_id: individualCoachId,
            ...lesson.source === "manual" ? { manual_lesson_id: lesson.id } : { lesson_id: lesson.id },
            coach_name: lesson.coach_name,
            student_name: lesson.student_name || null,
            amount: dualCoachAmt,
            court_fee: 0,
            date: lesson.date,
            description: `\xD6zel ders - ${lesson.student_name || "\xD6\u011Frenci"} - ${lesson.start_time}`,
            payment_status: "unpaid",
            collected_by_coach: false,
            court_fee_settled: false
          });
          if (error) throw error;
        }
        if (dualClubAmt > 0) {
          const { error } = await sb.from("club_finances").insert({
            club_id: clubId,
            type: "income",
            category: "\xD6zel Ders Geliri",
            amount: dualClubAmt,
            description: `${lesson.coach_name} - ${lesson.student_name || "\xD6\u011Frenci"} - \xD6zel Ders`,
            date: lesson.date
          });
          if (error) throw error;
        }
        if (lesson.source === "lesson") {
          const { error } = await sb.from("lessons").update({ payment_status: "paid" }).eq("id", lesson.id);
          if (error) throw error;
        } else {
          const { error } = await sb.from("club_manual_lessons").update({ payment_status: "paid" }).eq("id", lesson.id);
          if (error) throw error;
        }
        loadLessons();
      } catch (e) {
        alert(e.message);
      } finally {
        setLessonMarkingId(null);
      }
      return;
    }
    const lines = [
      `Hoca Hakedi\u015Fi: \u20BA${coachAmount.toLocaleString("tr-TR")}`,
      `Kort \xDCcreti:   \u20BA${courtFee.toLocaleString("tr-TR")}`,
      `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
      `Toplam:        \u20BA${total.toLocaleString("tr-TR")}`
    ].join("\n");
    if (!confirm(`\xD6deme Al

${lines}

\xD6deme al\u0131nd\u0131 olarak i\u015Faretlensin mi?`)) return;
    setLessonMarkingId(lesson.id);
    try {
      if (courtFee > 0) {
        const { error } = await sb.from("club_finances").insert({
          club_id: clubId,
          type: "income",
          category: "Rezervasyon Geliri",
          amount: courtFee,
          description: `${lesson.coach_name} - ${lesson.student_name || "\xD6\u011Frenci"} - \xD6zel ders kort \xFCcreti`,
          date: lesson.date
        });
        if (error) throw error;
      }
      if (coachAmount > 0) {
        const { error } = await sb.from("coach_earnings").insert({
          club_id: clubId,
          coach_id: lesson.coach_id || null,
          individual_coach_id: individualCoachId,
          ...lesson.source === "manual" ? { manual_lesson_id: lesson.id } : { lesson_id: lesson.id },
          coach_name: lesson.coach_name,
          student_name: lesson.student_name || null,
          amount: coachAmount,
          court_fee: courtFee,
          date: lesson.date,
          description: `\xD6zel ders - ${lesson.student_name || "\xD6\u011Frenci"} - ${lesson.start_time}`,
          payment_status: "unpaid",
          collected_by_coach: false,
          court_fee_settled: false
        });
        if (error) throw error;
      }
      if (lesson.source === "lesson") {
        const { error } = await sb.from("lessons").update({ payment_status: "paid" }).eq("id", lesson.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("club_manual_lessons").update({ payment_status: "paid" }).eq("id", lesson.id);
        if (error) throw error;
      }
      loadLessons();
    } catch (e) {
      alert(e.message);
    } finally {
      setLessonMarkingId(null);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Rezervasyonlar"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, selDate && (/* @__PURE__ */ new Date(selDate + "T12:00")).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }))), mainTab === "bookings" ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: openAdd }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), " Yeni Rezervasyon") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => setRecurringOpen(true) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "repeat"), " Tekrarlayan Ders"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: () => {
    setLessonForm({ date: selDate, start_time: "09:00", end_time: "10:00", payment_status: "unpaid", use_manual_coach: false });
    setLessonPriceMode("normal");
    setLessonCoachAmountInput("");
    setLessonClubAmountInput("");
    setLessonModal({ type: "add" });
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), " Ders Ekle"))), /* @__PURE__ */ React.createElement("div", { className: "tabs", style: { marginBottom: 18 } }, /* @__PURE__ */ React.createElement("button", { className: mainTab === "bookings" ? "active" : "", onClick: () => setMainTab("bookings") }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, verticalAlign: "middle", marginRight: 4 } }, "event_available"), "Kort Rezervasyonlar\u0131"), /* @__PURE__ */ React.createElement("button", { className: mainTab === "lessons" ? "active" : "", onClick: () => setMainTab("lessons") }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, verticalAlign: "middle", marginRight: 4 } }, "school"), "\xD6zel Dersler")), recurringOpen && /* @__PURE__ */ React.createElement(RecurringLessonModal, { clubId, onClose: () => setRecurringOpen(false), onCreated: () => {
    loadLessons();
  } }), mainTab === "bookings" && /* @__PURE__ */ React.createElement("div", { className: "row2" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, loading ? /* @__PURE__ */ React.createElement(Spinner, { size: 28 }) : bookings.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "event_available", title: "Bu tarihte rezervasyon yok", sub: "Yeni rezervasyon eklemek i\xE7in + butonunu kullan\u0131n." }) : bookings.map((b) => /* @__PURE__ */ React.createElement("div", { key: b.id, className: "card tight" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" } }, /* @__PURE__ */ React.createElement(TimeBubble, { start: b.start_time, end: b.end_time }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700 } }, b.player_name || b.booking_players?.find((p) => p.is_primary_player)?.profiles?.full_name || b.booking_players?.[0]?.profiles?.full_name || b._customerName || "Misafir", (b.booking_players?.length || 0) > 1 && ` +${b.booking_players.length - 1}`), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2 } }, "Kort ", b.courts?.court_number || "\u2014", " \xB7 ", courtTypeLabel(b.courts?.court_type)), b.notes && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2 } }, b.notes)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" } }, b.payment_status !== "paid" && b.status !== "cancelled" ? /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-success btn-sm",
      style: { fontSize: 11, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 },
      onClick: () => markBookingPaid(b)
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "payments"),
    "\xD6deme Al",
    b.total_amount > 0 ? ` \xB7 \u20BA${Number(b.total_amount).toLocaleString("tr-TR")}` : ""
  ) : b.status !== "cancelled" ? /* @__PURE__ */ React.createElement(Badge, { cls: paymentClass(b.payment_status) }, paymentLabel(b.payment_status)) : null, requiresApproval && b.status === "pending" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-pri btn-sm",
      style: { display: "flex", alignItems: "center", gap: 4, fontSize: 11 },
      onClick: () => updateStatus(b.id, "confirmed", b)
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "check"),
    "Onayla"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-danger btn-sm",
      style: { display: "flex", alignItems: "center", gap: 4, fontSize: 11 },
      onClick: () => updateStatus(b.id, "cancelled", b)
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "close"),
    "Reddet"
  )), b.status === "confirmed" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", title: "Tamamland\u0131", onClick: () => updateStatus(b.id, "completed", b) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "done_all")), b.status !== "cancelled" && b.status !== "completed" && b.status !== "pending" && /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-danger btn-sm",
      style: { display: "flex", alignItems: "center", gap: 4, fontSize: 11 },
      onClick: () => updateStatus(b.id, "cancelled", b)
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "close"),
    "\u0130ptal Et"
  )))))), /* @__PURE__ */ React.createElement(MiniCalendar, { selected: selDate, onSelect: setSelDate, dotDates })), mainTab === "lessons" && /* @__PURE__ */ React.createElement("div", { className: "row2" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, loadingL ? /* @__PURE__ */ React.createElement(Spinner, { size: 28 }) : lessons.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "school", title: "Bu tarihte ders yok", sub: "Ders eklemek i\xE7in + butonunu kullan\u0131n." }) : lessons.map((l) => {
    const isToday = l.date === todayISO();
    return /* @__PURE__ */ React.createElement("div", { key: `${l.source}-${l.id}`, style: {
      background: "var(--bg)",
      borderRadius: 12,
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      border: "1px solid var(--border)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 38, height: 38, borderRadius: 10, background: "#EEF2FF", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: "var(--brand-navy)" } }, "school")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: "var(--text-1)" } }, l.student_name ? `${l.student_name} \xB7 Ders` : "Tenis Dersi"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 1 } }, l.start_time, " \u2013 ", l.end_time)), /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: "4px 8px",
      borderRadius: 999,
      flexShrink: 0,
      background: isToday ? "#DCFCE7" : "#FEF3C7"
    } }, /* @__PURE__ */ React.createElement("div", { style: { width: 6, height: 6, borderRadius: 3, background: isToday ? "#22C55E" : "#F59E0B" } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: isToday ? "#22C55E" : "#F59E0B" } }, isToday ? "Bug\xFCn" : "Yakla\u015Fan"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px", fontSize: 12, color: "var(--text-2)" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "person"), l.coach_name), l.location && l.location !== "\u2014" && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px", fontSize: 12, color: "var(--text-2)" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "location_on"), l.location), l.source === "manual" && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 8, padding: "4px 8px", fontSize: 12, color: "#F59E0B" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "edit_note"), "Manuel"), l.is_package_lesson && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, padding: "4px 8px", fontSize: 12, color: "#6366F1" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "inventory"), "Paket"), (() => {
      const totalAmt = Math.round((Number(l.amount) || 0) * 100) / 100;
      const isDualBadge = l.price_mode === "dual";
      const isSplitBadge = l.price_mode === "split";
      if (isDualBadge) {
        const dualCoach = Math.round((Number(l.coach_amount) || 0) * 100) / 100;
        const dualClub = Math.round((totalAmt - dualCoach) * 100) / 100;
        return /* @__PURE__ */ React.createElement(React.Fragment, null, dualCoach > 0 && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, padding: "4px 8px", fontSize: 12, color: "var(--brand-navy)" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "person"), "Hoca: \u20BA", dualCoach.toLocaleString("tr-TR")), dualClub > 0 && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "4px 8px", fontSize: 12, color: "#16A34A" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "account_balance"), "Kul\xFCp: \u20BA", dualClub.toLocaleString("tr-TR")));
      }
      if (isSplitBadge) {
        return totalAmt > 0 ? /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 8, padding: "4px 8px", fontSize: 12, color: "#7C3AED" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "account_balance_wallet"), "Toplam: \u20BA", totalAmt.toLocaleString("tr-TR")) : null;
      }
      const cr = lesson_court_row(l, lessonCourts);
      const [sh2, sm2] = (l.start_time || "0:0").split(":").map(Number);
      const [eh2, em2] = (l.end_time || "0:0").split(":").map(Number);
      const dur = Math.max(0, (eh2 * 60 + em2 - (sh2 * 60 + sm2)) / 60);
      const courtFee = Math.round((cr?.hourly_rate || 0) * dur * 100) / 100;
      const coachFee = totalAmt;
      return /* @__PURE__ */ React.createElement(React.Fragment, null, coachFee > 0 && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, padding: "4px 8px", fontSize: 12, color: "var(--brand-navy)" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "person"), "Hoca: \u20BA", coachFee.toLocaleString("tr-TR")), courtFee > 0 && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "4px 8px", fontSize: 12, color: "#16A34A" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "sports_tennis"), "Kort: \u20BA", courtFee.toLocaleString("tr-TR")));
    })()), l.notes && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", fontStyle: "italic", paddingLeft: 2 } }, l.notes), /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "var(--border)" } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, l.is_package_lesson ? /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", gap: 5, padding: "7px 10px", borderRadius: 10, background: "#EEF2FF" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: "#6366F1" } }, "inventory"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#6366F1" } }, "Paketten D\xFC\u015F\xFCld\xFC")) : l.payment_status === "paid" ? /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", gap: 5, padding: "7px 10px", borderRadius: 10, background: "#DCFCE7" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: "#22C55E" } }, "check_circle"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#22C55E" } }, "\xD6dendi"), l.amount > 0 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: "#22C55E" } }, "\xB7 \u20BA", Number(l.amount).toLocaleString("tr-TR"))) : /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", borderRadius: 10, background: "#22C55E", border: "none", cursor: lessonMarkingId === l.id ? "not-allowed" : "pointer", opacity: lessonMarkingId === l.id ? 0.5 : 1 },
        onClick: () => markLessonPaid(l),
        disabled: lessonMarkingId === l.id
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: "#fff" } }, "payments"),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#fff" } }, (() => {
        if (lessonMarkingId === l.id) return "\u0130\u015Fleniyor...";
        if (l.source === "booking") return `\xD6deme Al${l.amount > 0 ? ` \xB7 \u20BA${Number(l.amount).toLocaleString("tr-TR")}` : ""}`;
        if (l.price_mode === "dual") return `\xD6deme Al${l.amount > 0 ? ` \xB7 \u20BA${Number(l.amount).toLocaleString("tr-TR")}` : ""}`;
        const lm = (l.location || "").match(/Kort\s*(\d+)/i);
        const cr = lm ? lessonCourts.find((c) => c.court_number === parseInt(lm[1])) : null;
        const [sh2, sm2] = (l.start_time || "0:0").split(":").map(Number);
        const [eh2, em2] = (l.end_time || "0:0").split(":").map(Number);
        const dur2 = Math.max(0, (eh2 * 60 + em2 - (sh2 * 60 + sm2)) / 60);
        const cf2 = Math.round((cr?.hourly_rate || 0) * dur2 * 100) / 100;
        const tot2 = Math.round((cf2 + (Number(l.amount) || 0)) * 100) / 100;
        return `\xD6deme Al${tot2 > 0 ? ` \xB7 \u20BA${tot2.toLocaleString("tr-TR")}` : ""}`;
      })())
    ), l.source !== "booking" && /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { width: 36, height: 36, borderRadius: 10, background: "#FEE2E2", border: "none", display: "grid", placeItems: "center", cursor: "pointer" },
        title: "\u0130ptal Et",
        onClick: () => cancelLesson(l)
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: "#EF4444" } }, "cancel")
    )));
  })), /* @__PURE__ */ React.createElement(MiniCalendar, { selected: selDate, onSelect: setSelDate, dotDates })), bkModalVisible && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: (e) => {
        if (e.target === e.currentTarget && !bkSaving) {
          setBkModalVisible(false);
        }
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 20, width: "min(480px,95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 17, fontWeight: 800, color: "var(--text-1)" } }, "Yeni Rezervasyon"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setBkModalVisible(false),
        disabled: bkSaving,
        style: { background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 24, color: "var(--text-2)" } }, "close")
    )), /* @__PURE__ */ React.createElement("div", { style: { overflowY: "auto", flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "#EEF2FF", borderRadius: 10, padding: "6px 12px" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: "#6366F1" } }, "calendar_today"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "#4338CA" } }, (/* @__PURE__ */ new Date((bkForm.date || "") + "T12:00:00")).toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "#EEF2FF", borderRadius: 10, padding: "6px 12px" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: "#6366F1" } }, "schedule"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "#4338CA" } }, bkForm.startTime, " \u2013 ", bkForm.endTime)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "5px 10px" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: "var(--text-2)" } }, "edit_calendar"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        value: bkForm.date || "",
        min: todayISO(),
        onChange: (e) => {
          const newForm = { ...bkForm, date: e.target.value };
          setBkForm(newForm);
          loadBkAvailCourts(e.target.value, newForm.startTime, newForm.endTime);
        },
        style: { border: "none", background: "transparent", fontSize: 13, fontWeight: 600, color: "var(--text-2)", cursor: "pointer", outline: "none" }
      }
    ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 10, letterSpacing: 0.4 } }, "S\xDCRE"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, [{ d: 0.75, l: "45 dk" }, { d: 1, l: "1 saat" }, { d: 1.5, l: "1,5 saat" }, { d: 2, l: "2 saat" }].map(({ d, l }) => {
      const sel = bkForm.duration === d;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: d,
          onClick: () => handleBkDuration(d),
          style: { padding: "9px 18px", borderRadius: 12, border: sel ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)", background: sel ? "#EEF2FF" : "var(--bg)", cursor: "pointer", fontSize: 13, fontWeight: sel ? 700 : 500, color: sel ? "var(--brand-navy)" : "var(--text-2)" }
        },
        l
      );
    }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 10, letterSpacing: 0.4 } }, "SAAT"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: bkForm.startTime || "",
        step: "900",
        onChange: (e) => {
          const [sh, sm] = e.target.value.split(":").map(Number);
          const totalMin = sh * 60 + sm + Math.round((bkForm.duration || 1) * 60);
          const eh = Math.floor(totalMin / 60) % 24;
          const em = totalMin % 60;
          const newEnd = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
          const newForm = { ...bkForm, startTime: e.target.value, endTime: newEnd };
          setBkForm(newForm);
          loadBkAvailCourts(newForm.date, e.target.value, newEnd);
        },
        style: { flex: 1, border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 15, color: "var(--text-1)", background: "var(--bg)" }
      }
    ), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-2)", fontWeight: 600 } }, "\u2013"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: bkForm.endTime || "",
        step: "900",
        onChange: (e) => {
          const [eh, em] = (e.target.value || "").split(":").map(Number);
          const [sh, sm] = (bkForm.startTime || "").split(":").map(Number);
          let dur = bkForm.duration;
          if (![eh, em, sh, sm].some(isNaN)) {
            const diff = eh * 60 + em - (sh * 60 + sm);
            if (diff > 0) dur = diff / 60;
          }
          const newForm = { ...bkForm, endTime: e.target.value, duration: dur };
          setBkForm(newForm);
          loadBkAvailCourts(newForm.date, newForm.startTime, e.target.value);
        },
        style: { flex: 1, border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 15, color: "var(--text-1)", background: "var(--bg)" }
      }
    ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", letterSpacing: 0.4 } }, "KORT"), bkCourtsLoading && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "hourglass_empty"), "M\xFCsaitlik kontrol ediliyor...")), courts.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 16, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--border)", textAlign: "center", color: "var(--text-2)", fontSize: 13 } }, "Kort bulunamad\u0131.") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, courts.map((court) => {
      const avail = !bkCourtsLoading && bkAvailCourts.some((c) => c.id === court.id);
      const sel = bkForm.courtId === court.id;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: court.id,
          onClick: () => !bkCourtsLoading && avail && setBkForm((f) => ({ ...f, courtId: court.id })),
          style: {
            padding: "12px 16px",
            borderRadius: 14,
            minWidth: 100,
            transition: "all 0.12s",
            border: sel ? "2px solid var(--brand-navy)" : `1.5px solid ${avail ? "var(--border)" : "#FEE2E2"}`,
            background: sel ? "#EEF2FF" : avail ? "var(--bg)" : "#FEF2F2",
            cursor: !bkCourtsLoading && avail ? "pointer" : "not-allowed",
            opacity: bkCourtsLoading ? 0.5 : 1
          }
        },
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 5, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 6, height: 6, borderRadius: "50%", background: avail ? "#22C55E" : "#EF4444", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: avail ? "#16A34A" : "#DC2626", letterSpacing: 0.3 } }, bkCourtsLoading ? "..." : avail ? "M\xDCSA\u0130T" : "DOLU")),
        /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: sel ? "var(--brand-navy)" : "var(--text-1)" } }, "Kort ", court.court_number),
        /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2 } }, court.court_type, " \xB7 ", court.hourly_rate || "\u2014", "\u20BA/sa"),
        court.is_indoor !== void 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text-2)", marginTop: 1 } }, court.is_indoor ? "Kapal\u0131" : "A\xE7\u0131k")
      );
    }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 10, letterSpacing: 0.4 } }, "OYUNCU"), bkMemberName || bkCustomerName ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", border: "1.5px solid var(--brand-navy)", borderRadius: 12, padding: "10px 14px", background: "#EEF2FF" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--brand-navy)" } }, bkMemberName || bkCustomerName), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: bkPersonMode === "member" ? "var(--brand-navy)" : "#0891B2", borderRadius: 5, padding: "2px 6px" } }, bkPersonMode === "member" ? "\xDCye" : "M\xFC\u015Fteri")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setBkMemberId(null);
          setBkMemberName("");
          setBkMemberQuery("");
          setBkMemberResults([]);
          setBkCustomerId(null);
          setBkCustomerName("");
          setBkCustomerResults([]);
          setBkCourtyclubResults([]);
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
        value: bkMemberQuery,
        onChange: (e) => searchBkPerson(e.target.value),
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
    )), (bkMemberResults.length > 0 || bkCustomerResults.length > 0 || bkCourtyclubResults.length > 0) && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden", marginTop: 4 } }, bkMemberResults.map((m) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: "m-" + m.id,
        style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" },
        onMouseDown: () => {
          setBkMemberId(m.id);
          setBkMemberName(m.full_name);
          setBkPersonMode("member");
          setBkMemberQuery("");
          setBkMemberResults([]);
          setBkCustomerResults([]);
          setBkCourtyclubResults([]);
        }
      },
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)" } }, m.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, m.email)),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: "var(--brand-navy)", borderRadius: 5, padding: "2px 6px", flexShrink: 0, marginLeft: 8 } }, "\xDCye")
    )), bkCustomerResults.map((c) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: "c-" + c.id,
        style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" },
        onMouseDown: () => {
          setBkCustomerId(c.id);
          setBkCustomerName(c.full_name);
          setBkPersonMode("customer");
          if (c.user_id) {
            setBkMemberId(c.user_id);
            setBkMemberName(c.full_name);
          }
          setBkMemberQuery("");
          setBkMemberResults([]);
          setBkCustomerResults([]);
          setBkCourtyclubResults([]);
        }
      },
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)" } }, c.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, c.phone || c.email || "")),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: "#0891B2", borderRadius: 5, padding: "2px 6px", flexShrink: 0, marginLeft: 8 } }, "M\xFC\u015Fteri")
    )), bkCourtyclubResults.map((p) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: "cc-" + p.id,
        style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" },
        onMouseDown: () => {
          setBkMemberId(p.id);
          setBkMemberName(p.full_name);
          setBkPersonMode("member");
          setBkMemberQuery("");
          setBkMemberResults([]);
          setBkCustomerResults([]);
          setBkCourtyclubResults([]);
        }
      },
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)" } }, p.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, p.phone || p.email || "")),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: "#22C55E", borderRadius: 5, padding: "2px 6px", flexShrink: 0, marginLeft: 8 } }, "CourtyClub \xDCyesi")
    ))))), bkForm.courtId && (() => {
      const court = courts.find((c) => c.id === bkForm.courtId);
      const [sh, sm] = (bkForm.startTime || "0:0").split(":").map(Number);
      const [eh, em] = (bkForm.endTime || "0:0").split(":").map(Number);
      const dh = (eh * 60 + em - sh * 60 - sm) / 60;
      const calcAmt = Math.round((court?.hourly_rate || 0) * dh * 100) / 100;
      const fmtD = (d) => d === 0.75 ? "45 dk" : d === 1.5 ? "1,5 saat" : `${d} saat`;
      return /* @__PURE__ */ React.createElement("div", { style: { background: "#F8FAFC", borderRadius: 14, padding: "16px 18px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 12, letterSpacing: 0.4 } }, "REZERVASYON \xD6ZET\u0130"), [
        { label: "Tarih", value: (/* @__PURE__ */ new Date((bkForm.date || "") + "T12:00:00")).toLocaleDateString("tr-TR") },
        { label: "Saat", value: `${bkForm.startTime} \u2013 ${bkForm.endTime}` },
        { label: "S\xFCre", value: fmtD(bkForm.duration || 1) },
        { label: "Kort", value: `Kort ${court?.court_number}` },
        ...bkMemberName || bkCustomerName ? [{ label: "Oyuncu", value: bkMemberName || bkCustomerName }] : []
      ].map(({ label, value }) => /* @__PURE__ */ React.createElement("div", { key: label, style: { display: "flex", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-2)" } }, label, ":"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--text-1)" } }, value))), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--text-1)" } }, "Kort \xDCcreti (\u20BA):"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          min: "0",
          step: "0.01",
          value: bkPriceOverride,
          onChange: (e) => setBkPriceOverride(e.target.value),
          placeholder: calcAmt.toFixed(2),
          style: { width: 130, border: "1.5px solid var(--border)", borderRadius: 8, padding: "5px 10px", fontSize: 16, fontWeight: 800, color: "var(--brand-navy)", textAlign: "right", background: "#fff", outline: "none" }
        }
      )), bkPriceOverride && parseFloat(bkPriceOverride) !== calcAmt && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, fontSize: 11, color: "var(--text-2)", textAlign: "right" } }, "Saatlik \xFCcret: \u20BA", calcAmt.toFixed(2)));
    })()), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, padding: "12px 20px", borderTop: "1px solid var(--border)", flexShrink: 0 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setBkModalVisible(false),
        disabled: bkSaving,
        style: { flex: 1, padding: "13px", borderRadius: 14, border: "1.5px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--text-2)" }
      },
      "\u0130ptal"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: saveBkBooking,
        disabled: !bkForm.courtId || bkSaving || bkCourtsLoading,
        style: { flex: 2, padding: "13px", borderRadius: 14, border: "none", cursor: !bkForm.courtId || bkSaving || bkCourtsLoading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, color: "#fff", background: !bkForm.courtId || bkSaving || bkCourtsLoading ? "#94a3b8" : "var(--brand-navy)" }
      },
      bkSaving ? "Kaydediliyor..." : "Rezervasyon Olu\u015Ftur"
    )))
  ), lessonModal && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: (e) => {
        if (e.target === e.currentTarget) setLessonModal(null);
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 20, width: "min(480px,95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", gap: 0, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 17, fontWeight: 800, color: "var(--text-1)" } }, lessonModal.type === "edit" ? "Dersi D\xFCzenle" : "Ders Ekle"), /* @__PURE__ */ React.createElement("button", { style: { background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }, onClick: () => setLessonModal(null) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 22, color: "var(--text-2)" } }, "close"))), /* @__PURE__ */ React.createElement("div", { style: { overflowY: "auto", flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "ANTREN\xD6R"), coaches.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 16, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--border)", textAlign: "center", color: "var(--text-2)", fontSize: 13, marginBottom: 16 } }, "Hen\xFCz antren\xF6r eklenmemi\u015F.") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 } }, coaches.map((c) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: c.id,
        style: { display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, border: lessonForm.coach_id === c.id ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)", background: lessonForm.coach_id === c.id ? "#EEF2FF" : "var(--bg)", cursor: "pointer" },
        onClick: () => setLessonForm({ ...lessonForm, coach_id: c.id })
      },
      /* @__PURE__ */ React.createElement("div", { style: { width: 34, height: 34, borderRadius: 17, background: "rgba(0,51,153,0.12)", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--brand-navy)" } }, c.full_name.charAt(0).toUpperCase())),
      /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 14, color: "var(--text-1)", fontWeight: lessonForm.coach_id === c.id ? 700 : 500 } }, c.full_name),
      lessonForm.coach_id === c.id && /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: "var(--brand-navy)" } }, "check_circle")
    ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4, marginTop: 4 } }, "TAR\u0130H VE SAAT"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 0 } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        style: { flex: 2, border: "1.5px solid var(--border)", borderRadius: 12, padding: "11px 12px", fontSize: 15, color: "var(--text-1)", background: "var(--bg)", boxSizing: "border-box" },
        value: lessonForm.date || "",
        onChange: (e) => setLessonForm({ ...lessonForm, date: e.target.value })
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        style: { flex: 1, border: "1.5px solid var(--border)", borderRadius: 12, padding: "11px 8px", fontSize: 14, color: "var(--text-1)", background: "var(--bg)", boxSizing: "border-box" },
        placeholder: "Ba\u015Flang\u0131\xE7",
        value: lessonForm.start_time || "",
        onChange: (e) => setLessonForm({ ...lessonForm, start_time: e.target.value })
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        style: { flex: 1, border: "1.5px solid var(--border)", borderRadius: 12, padding: "11px 8px", fontSize: 14, color: "var(--text-1)", background: "var(--bg)", boxSizing: "border-box" },
        placeholder: "Biti\u015F",
        value: lessonForm.end_time || "",
        onChange: (e) => {
          const [eh, em] = (e.target.value || "").split(":").map(Number);
          const [sh, sm] = (lessonForm.start_time || "").split(":").map(Number);
          let dur = lessonForm.duration;
          if (![eh, em, sh, sm].some(isNaN)) {
            const diff = eh * 60 + em - (sh * 60 + sm);
            if (diff > 0) dur = diff / 60;
          }
          setLessonForm({ ...lessonForm, end_time: e.target.value, duration: dur });
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4, marginTop: 14 } }, "S\xDCRE (opsiyonel \u2014 biti\u015F saatini otomatik doldurur)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 } }, [{ label: "30 dk", value: 0.5 }, { label: "45 dk", value: 0.75 }, { label: "1 saat", value: 1 }, { label: "1.5 saat", value: 1.5 }, { label: "2 saat", value: 2 }].map((d) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: d.value,
        style: { display: "flex", alignItems: "center", gap: 5, padding: "10px 14px", borderRadius: 12, border: lessonForm.duration === d.value ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)", background: lessonForm.duration === d.value ? "#EEF2FF" : "var(--bg)", cursor: "pointer" },
        onClick: () => setLessonForm({ ...lessonForm, duration: lessonForm.duration === d.value ? null : d.value })
      },
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: lessonForm.duration === d.value ? "var(--brand-navy)" : "var(--text-2)", fontWeight: lessonForm.duration === d.value ? 700 : 500 } }, d.label)
    ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "OYUNCU"), lessonSelectedPlayer || lessonSelectedCustomer ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", border: "1.5px solid var(--brand-navy)", borderRadius: 12, padding: "11px 12px", marginBottom: 16, background: "#EEF2FF" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--brand-navy)" } }, lessonSelectedCustomer?.full_name || lessonSelectedPlayer?.full_name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: lessonSelectedCustomer && !lessonSelectedPlayer ? "#0891B2" : "var(--brand-navy)", borderRadius: 5, padding: "2px 6px" } }, lessonSelectedCustomer && !lessonSelectedPlayer ? "M\xFC\u015Fteri" : "\xDCye")), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { background: "none", border: "none", cursor: "pointer", padding: 4 },
        onClick: () => {
          setLessonSelectedPlayer(null);
          setLessonSelectedCustomer(null);
          setLessonPlayerSearch("");
          setLessonPlayerResults([]);
          setLessonCustomerResults([]);
          setLessonCourtyclubResults([]);
          setLessonForm((prev) => ({ ...prev, student_name: "", player_id: null }));
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: "var(--text-2)" } }, "close")
    )) : quickAddCust === "lesson" ? /* @__PURE__ */ React.createElement("div", { style: { border: "1.5px solid var(--brand-navy)", borderRadius: 12, padding: "12px 14px", background: "#F0F4FF", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--brand-navy)", marginBottom: 10 } }, "H\u0131zl\u0131 M\xFC\u015Fteri Ekle"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement(
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
    )))) : /* @__PURE__ */ React.createElement("div", { style: { position: "relative", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        style: { flex: 1, border: "1.5px solid var(--border)", borderRadius: 12, padding: "11px 12px", fontSize: 14, color: "var(--text-1)", background: "var(--bg)", boxSizing: "border-box" },
        placeholder: "Ad, telefon veya e-posta ile ara...",
        value: lessonPlayerSearch,
        onChange: (e) => searchLessonPerson(e.target.value)
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
    )), (lessonPlayerResults.length > 0 || lessonCustomerResults.length > 0 || lessonCourtyclubResults.length > 0) && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden", marginTop: 4 } }, lessonPlayerResults.map((p) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: "m-" + p.id,
        style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" },
        onMouseDown: () => {
          setLessonSelectedPlayer(p);
          setLessonForm((prev) => ({ ...prev, student_name: p.full_name, player_id: p.id }));
          setLessonPlayerSearch("");
          setLessonPlayerResults([]);
          setLessonCustomerResults([]);
          setLessonCourtyclubResults([]);
        }
      },
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)" } }, p.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, p.email)),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: "var(--brand-navy)", borderRadius: 5, padding: "2px 6px", flexShrink: 0, marginLeft: 8 } }, "\xDCye")
    )), lessonCustomerResults.map((c) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: "c-" + c.id,
        style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" },
        onMouseDown: () => {
          setLessonSelectedCustomer(c);
          setLessonForm((prev) => ({ ...prev, student_name: c.full_name, player_id: c.user_id || null }));
          setLessonPlayerSearch("");
          setLessonPlayerResults([]);
          setLessonCustomerResults([]);
          setLessonCourtyclubResults([]);
          if (c.user_id) setLessonSelectedPlayer({ id: c.user_id, full_name: c.full_name, email: c.email });
        }
      },
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)" } }, c.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, c.phone || c.email || "")),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: "#0891B2", borderRadius: 5, padding: "2px 6px", flexShrink: 0, marginLeft: 8 } }, "M\xFC\u015Fteri")
    )), lessonCourtyclubResults.map((p) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: "cc-" + p.id,
        style: { padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" },
        onMouseDown: () => {
          setLessonSelectedPlayer(p);
          setLessonForm((prev) => ({ ...prev, student_name: p.full_name, player_id: p.id }));
          setLessonPlayerSearch("");
          setLessonPlayerResults([]);
          setLessonCustomerResults([]);
          setLessonCourtyclubResults([]);
        }
      },
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-1)" } }, p.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, p.phone || p.email || "")),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: "#22C55E", borderRadius: 5, padding: "2px 6px", flexShrink: 0, marginLeft: 8 } }, "CourtyClub \xDCyesi")
    )))), (lessonSelectedPlayer || lessonSelectedCustomer) && lessonForm.coach_id && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, lessonLoadingPackages ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", padding: "8px 0" } }, "Paketler y\xFCkleniyor...") : lessonPackages.length > 0 ? /* @__PURE__ */ React.createElement("div", { style: { border: "1.5px solid var(--border)", borderRadius: 12, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: lessonUsePackage ? "#EEF2FF" : "var(--bg)", borderBottom: lessonUsePackage ? "1.5px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: lessonUsePackage ? "var(--brand-navy)" : "var(--text-2)" } }, "inventory_2"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: lessonUsePackage ? "var(--brand-navy)" : "var(--text-1)" } }, "Paketten Kullan"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, lessonPackages.length, " aktif paket mevcut"))), /* @__PURE__ */ React.createElement(
      "div",
      {
        style: { width: 44, height: 24, borderRadius: 12, background: lessonUsePackage ? "var(--brand-navy)" : "#CBD5E1", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 },
        onClick: () => {
          const next = !lessonUsePackage;
          setLessonUsePackage(next);
          if (next) {
            setLessonForm((prev) => ({ ...prev, amount: "0", payment_status: "paid" }));
          } else {
            setLessonForm((prev) => ({ ...prev, amount: "", payment_status: "unpaid" }));
          }
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { width: 18, height: 18, borderRadius: 9, background: "#fff", position: "absolute", top: 3, left: lessonUsePackage ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" } })
    )), lessonUsePackage && /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 14px", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 8 } }, lessonPackages.map((pkg) => {
      const remaining = (pkg.total_lessons || 0) - (pkg.used_lessons || 0);
      const isSelected = lessonSelectedPackageId === pkg.id;
      const expiry = pkg.expiry_date ? new Date(pkg.expiry_date).toLocaleDateString("tr-TR") : null;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: pkg.id,
          onClick: () => setLessonSelectedPackageId(pkg.id),
          style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, border: isSelected ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)", background: isSelected ? "#EEF2FF" : "var(--bg)", cursor: "pointer" }
        },
        /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: isSelected ? "var(--brand-navy)" : "var(--text-1)" } }, pkg.package_name || "Ders Paketi"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, remaining, " ders kald\u0131", expiry ? ` \xB7 Son: ${expiry}` : "")),
        isSelected && /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 18, color: "var(--brand-navy)" } }, "check_circle")
      );
    }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#059669", fontWeight: 600, paddingTop: 4 } }, "Ders \xFCcreti 0 \u20BA olarak kaydedilecek, \xF6demesi paket sat\u0131\u015F\u0131nda al\u0131nd\u0131."))) : null), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "KORT"), lessonCourts.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 16, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--border)", textAlign: "center", color: "var(--text-2)", fontSize: 13, marginBottom: 16 } }, "Hen\xFCz kort eklenmemi\u015F.") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 } }, lessonCourts.map((c) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: c.id,
        style: { display: "flex", alignItems: "center", gap: 5, padding: "10px 14px", borderRadius: 12, border: lessonForm.court_id === c.id ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)", background: lessonForm.court_id === c.id ? "#EEF2FF" : "var(--bg)", cursor: "pointer" },
        onClick: () => setLessonForm({ ...lessonForm, court_id: c.id })
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: lessonForm.court_id === c.id ? "var(--brand-navy)" : "var(--text-2)" } }, "sports_tennis"),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: lessonForm.court_id === c.id ? "var(--brand-navy)" : "var(--text-2)", fontWeight: lessonForm.court_id === c.id ? 700 : 500 } }, "Kort ", c.court_number),
      lessonForm.court_id === c.id && /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: "var(--brand-navy)" } }, "check")
    ))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "NOT (opsiyonel)"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        style: { width: "100%", border: "1.5px solid var(--border)", borderRadius: 12, padding: "11px 12px", fontSize: 15, color: "var(--text-1)", background: "var(--bg)", boxSizing: "border-box", minHeight: 72, resize: "vertical", marginBottom: 16 },
        placeholder: "Ders hakk\u0131nda not...",
        value: lessonForm.notes || "",
        onChange: (e) => setLessonForm({ ...lessonForm, notes: e.target.value })
      }
    ), !lessonUsePackage && lessonPriceMode === "normal" ? /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 6, letterSpacing: 0.4 } }, "HOCA HAKED\u0130\u015E\u0130 (\u20BA)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 12, background: "var(--bg)", paddingLeft: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--text-2)", marginRight: 3 } }, "\u20BA"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "0",
        step: "0.01",
        style: { flex: 1, border: "none", background: "transparent", padding: "11px 8px 11px 0", fontSize: 14, color: "var(--text-1)", outline: "none" },
        placeholder: "0,00",
        value: lessonCoachAmountInput,
        onChange: (e) => setLessonCoachAmountInput(e.target.value)
      }
    ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 6, letterSpacing: 0.4 } }, "KUL\xDCP PAYI (\u20BA)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 12, background: "var(--bg)", paddingLeft: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--text-2)", marginRight: 3 } }, "\u20BA"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "0",
        step: "0.01",
        style: { flex: 1, border: "none", background: "transparent", padding: "11px 8px 11px 0", fontSize: 14, color: "var(--text-1)", outline: "none" },
        placeholder: "0,00",
        value: lessonClubAmountInput,
        onChange: (e) => setLessonClubAmountInput(e.target.value)
      }
    )))), (() => {
      const total_ = (parseFloat(lessonCoachAmountInput) || 0) + (parseFloat(lessonClubAmountInput) || 0);
      if (total_ <= 0) return null;
      return /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--text-2)", textAlign: "right" } }, "Toplam: ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-1)", fontWeight: 800 } }, "\u20BA", total_.toLocaleString("tr-TR", { minimumFractionDigits: 2 })));
    })()) : !lessonUsePackage ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "DERS \xDCCRET\u0130 (opsiyonel)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 12, background: "var(--bg)", paddingLeft: 12, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, fontWeight: 700, color: "var(--text-2)", marginRight: 4 } }, "\u20BA"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "0",
        step: "0.01",
        style: { flex: 1, border: "none", background: "transparent", padding: "11px 12px 11px 0", fontSize: 15, color: "var(--text-1)", outline: "none" },
        placeholder: "0,00",
        value: lessonForm.amount || "",
        onChange: (e) => setLessonForm({ ...lessonForm, amount: e.target.value })
      }
    ))) : null, !lessonUsePackage && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "\xD6DEME MODEL\u0130"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { flex: 1, padding: "9px", borderRadius: 10, border: lessonPriceMode === "normal" ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)", background: lessonPriceMode === "normal" ? "#EEF2FF" : "var(--bg)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: lessonPriceMode === "normal" ? "var(--brand-navy)" : "var(--text-2)" },
        onClick: () => {
          setLessonPriceMode("normal");
          setLessonForm((prev) => ({ ...prev, payment_status: "unpaid" }));
        }
      },
      "\xD6zel Fiyat"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { flex: 1, padding: "9px", borderRadius: 10, border: lessonPriceMode === "split" ? "1.5px solid #7C3AED" : "1.5px solid var(--border)", background: lessonPriceMode === "split" ? "#F5F3FF" : "var(--bg)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: lessonPriceMode === "split" ? "#7C3AED" : "var(--text-2)" },
        onClick: () => setLessonPriceMode("split")
      },
      "Pay Modeli"
    )), lessonPriceMode === "split" && (() => {
      const coachRec = !lessonForm.use_manual_coach ? coaches.find((c) => c.id === lessonForm.coach_id) : null;
      const payRate = coachRec?.coach_pay_rate ?? 0;
      const totalAmt = lessonForm.amount ? parseFloat(String(lessonForm.amount).replace(",", ".")) : 0;
      const coachEarning = payRate > 0 ? Math.round(totalAmt * (payRate / 100) * 100) / 100 : 0;
      const clubEarning = payRate > 0 ? Math.round((totalAmt - coachEarning) * 100) / 100 : 0;
      return /* @__PURE__ */ React.createElement("div", { style: { borderRadius: 12, border: "1.5px solid #DDD6FE", background: "#F5F3FF", padding: "12px 14px", marginBottom: 12 } }, !coachRec ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#7C3AED" } }, "Listeden bir hoca se\xE7in.") : payRate === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#7C3AED" } }, "Bu hocan\u0131n pay oran\u0131 tan\u0131ml\u0131 de\u011Fil. Ekip y\xF6netiminden pay oran\u0131 girin.") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#7C3AED", marginBottom: 6 } }, coachRec.full_name, " \xB7 Pay Oran\u0131 %", payRate), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, background: "#fff", borderRadius: 8, padding: "8px 10px", border: "1px solid #DDD6FE" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text-2)", fontWeight: 600 } }, "HOCA HAKED\u0130\u015E\u0130"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, color: "#7C3AED" } }, "\u20BA", coachEarning.toLocaleString("tr-TR"))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, background: "#fff", borderRadius: 8, padding: "8px 10px", border: "1px solid #DDD6FE" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text-2)", fontWeight: 600 } }, "KUL\xDCP PAYI"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 800, color: "var(--brand-navy)" } }, "\u20BA", clubEarning.toLocaleString("tr-TR")))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#059669", fontWeight: 600, marginTop: 8 } }, "Kay\u0131t an\u0131nda otomatik ayr\u0131\u015Ft\u0131r\u0131l\u0131r, kort \xFCcreti eklenmez.")));
    })()), !lessonUsePackage && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, letterSpacing: 0.4 } }, "\xD6DEME DURUMU"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 20 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", borderRadius: 12, border: (lessonForm.payment_status || "unpaid") === "unpaid" ? "1.5px solid #F59E0B" : "1.5px solid var(--border)", background: (lessonForm.payment_status || "unpaid") === "unpaid" ? "#FEF3C7" : "var(--bg)", cursor: "pointer" },
        onClick: () => setLessonForm({ ...lessonForm, payment_status: "unpaid" })
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: (lessonForm.payment_status || "unpaid") === "unpaid" ? "#F59E0B" : "var(--text-2)" } }, "schedule"),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: (lessonForm.payment_status || "unpaid") === "unpaid" ? "#F59E0B" : "var(--text-2)" } }, "\xD6denmedi")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", borderRadius: 12, border: lessonForm.payment_status === "paid" ? "1.5px solid #22C55E" : "1.5px solid var(--border)", background: lessonForm.payment_status === "paid" ? "#DCFCE7" : "var(--bg)", cursor: "pointer" },
        onClick: () => setLessonForm({ ...lessonForm, payment_status: "paid" })
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: lessonForm.payment_status === "paid" ? "#22C55E" : "var(--text-2)" } }, "check_circle"),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: lessonForm.payment_status === "paid" ? "#22C55E" : "var(--text-2)" } }, "\xD6dendi")
    ))), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { width: "100%", background: "var(--brand-navy)", color: "#fff", border: "none", borderRadius: 14, padding: "15px", fontSize: 15, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 },
        onClick: saveLesson,
        disabled: saving
      },
      saving ? "Kaydediliyor..." : "Dersi Kaydet"
    )))
  ));
}
function CourtsScreen({ clubId, setScreen }) {
  const { useState, useEffect } = React;
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [slotData, setSlotData] = useState({});
  const [slotDate, setSlotDate] = useState(todayISO());
  const [closureModal, setClosureModal] = useState(null);
  const [closureForm, setClosureForm] = useState({});
  const [closureCoaches, setClosureCoaches] = useState([]);
  const [closureGroups, setClosureGroups] = useState([]);
  const [courtClosures, setCourtClosures] = useState([]);
  const [slotClickInfo, setSlotClickInfo] = useState(null);
  const [slotTypeModal, setSlotTypeModal] = useState(false);
  const [use15Min, setUse15Min] = useState(false);
  const [conflictWarning, setConflictWarning] = useState("");
  useEffect(() => {
    if (clubId) loadCourts();
  }, [clubId]);
  const loadCourts = async () => {
    setLoading(true);
    const { data } = await sb.from("courts").select("*").eq("club_id", clubId).order("court_number");
    setCourts(data || []);
    setLoading(false);
  };
  const loadSlots = async (courtId) => {
    const start = slotDate + "T00:00:00";
    const end = slotDate + "T23:59:59";
    const [{ data: bk }, { data: cl }] = await Promise.all([
      sb.from("bookings").select("start_time,end_time,status,booking_players!booking_players_booking_id_fkey(profiles!booking_players_player_id_fkey(full_name))").eq("court_id", courtId).neq("status", "cancelled").gte("start_time", start).lte("start_time", end),
      sb.from("court_closures").select("*, coach:club_coaches(id,full_name), group:club_groups(id,name)").eq("court_id", courtId).eq("is_active", true).or(`and(closure_type.eq.one_time,start_date.lte.${slotDate},end_date.gte.${slotDate}),and(closure_type.eq.recurring_weekly,day_of_week.eq.${(/* @__PURE__ */ new Date(slotDate + "T12:00")).getDay()})`)
    ]);
    setSlotData((prev) => ({ ...prev, [courtId]: { bookings: bk || [], closures: cl || [] } }));
  };
  const toggleExpand = async (courtId) => {
    if (expanded === courtId) {
      setExpanded(null);
      return;
    }
    setExpanded(courtId);
    await loadSlots(courtId);
  };
  const openAdd = () => {
    setForm({ court_number: "", court_type: "clay", surface: "clay", hourly_rate: "", is_active: true, is_indoor: false, campaign_enabled: false, campaign_price: "", campaign_start_hour: 9, campaign_end_hour: 12, price_2_players: "", price_3_players: "", price_4_players: "" });
    setModal({ type: "add" });
  };
  const openEdit = (court) => {
    setForm({
      ...court,
      campaign_enabled: court.campaign_price != null,
      campaign_price: court.campaign_price != null ? String(court.campaign_price) : "",
      campaign_start_hour: court.campaign_start_hour ?? 9,
      campaign_end_hour: court.campaign_end_hour ?? 12,
      price_2_players: court.price_2_players != null ? String(court.price_2_players) : "",
      price_3_players: court.price_3_players != null ? String(court.price_3_players) : "",
      price_4_players: court.price_4_players != null ? String(court.price_4_players) : ""
    });
    setModal({ type: "edit", court });
  };
  const saveCourt = async () => {
    setSaving(true);
    try {
      const payload = {
        club_id: clubId,
        court_number: form.court_number,
        court_type: form.court_type,
        surface: form.surface,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
        is_active: form.is_active !== false,
        is_indoor: !!form.is_indoor,
        campaign_price: form.campaign_enabled && form.campaign_price ? Number(form.campaign_price) : null,
        campaign_start_hour: form.campaign_enabled ? form.campaign_start_hour ?? 9 : null,
        campaign_end_hour: form.campaign_enabled ? form.campaign_end_hour ?? 12 : null,
        price_2_players: form.price_2_players ? Number(form.price_2_players) : null,
        price_3_players: form.price_3_players ? Number(form.price_3_players) : null,
        price_4_players: form.price_4_players ? Number(form.price_4_players) : null
      };
      if (modal.type === "add") {
        await sb.from("courts").insert(payload);
      } else {
        await sb.from("courts").update(payload).eq("id", form.id);
      }
      setModal(null);
      loadCourts();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const toggleActive = async (court) => {
    await sb.from("courts").update({ is_active: !court.is_active }).eq("id", court.id);
    loadCourts();
  };
  const deleteCourt = async (id) => {
    if (!confirm("Bu kortu silmek istedi\u011Finize emin misiniz?")) return;
    await sb.from("courts").delete().eq("id", id);
    loadCourts();
  };
  const SESSION_TYPE_LABELS = { training: "Grup Antrenman\u0131", maintenance: "Bak\u0131m & Onar\u0131m", other: "Di\u011Fer" };
  const loadClosureCoaches = async () => {
    const { data } = await sb.from("club_coaches").select("id,full_name").eq("club_id", clubId).eq("is_active", true);
    setClosureCoaches(data || []);
  };
  const loadClosureGroups = async () => {
    const { data } = await sb.from("club_groups").select("id,name,coach_id").eq("club_id", clubId).eq("is_active", true);
    setClosureGroups(data || []);
  };
  const loadCourtClosures = async (courtId) => {
    const { data } = await sb.from("court_closures").select("*, coach:club_coaches(id,full_name), group:club_groups(id,name)").eq("court_id", courtId).order("created_at", { ascending: false });
    setCourtClosures(data || []);
  };
  const deleteClosure = async (id) => {
    if (!confirm("Bu kapatmay\u0131 silmek istedi\u011Finize emin misiniz?")) return;
    await sb.from("court_closures").delete().eq("id", id);
    loadCourtClosures(closureModal.courtId);
    if (expanded === closureModal.courtId) loadSlots(closureModal.courtId);
  };
  const toggleClosure = async (closure) => {
    await sb.from("court_closures").update({ is_active: !closure.is_active }).eq("id", closure.id);
    loadCourtClosures(closureModal.courtId);
    if (expanded === closureModal.courtId) loadSlots(closureModal.courtId);
  };
  const saveClosure = async () => {
    setSaving(true);
    setConflictWarning("");
    try {
      const startH = closureForm.start_hour ?? 9;
      const startM = closureForm.start_minute ?? 0;
      const endH = closureForm.end_hour ?? 10;
      const endM = closureForm.end_minute ?? 0;
      const startTime = startH + startM / 60;
      const endTime = endH + endM / 60;
      if (startTime >= endTime) {
        alert("Biti\u015F saati ba\u015Flang\u0131\xE7 saatinden b\xFCy\xFCk olmal\u0131");
        setSaving(false);
        return;
      }
      const autoReason = (closureForm.reason || "").trim() || SESSION_TYPE_LABELS[closureForm.session_type || "other"];
      let effectiveCoachId = closureForm.coach_id || null;
      const selectedGroup = closureForm.group_id ? closureGroups.find((g) => g.id === closureForm.group_id) : null;
      if (selectedGroup?.coach_id && !effectiveCoachId) effectiveCoachId = selectedGroup.coach_id;
      if (effectiveCoachId) {
        const closureType = closureForm.closure_type || "recurring_weekly";
        let conflictQuery = sb.from("court_closures").select("id, start_hour, start_minute, end_hour, end_minute, reason, court_id").eq("coach_id", effectiveCoachId).eq("is_active", true);
        if (closureType === "recurring_weekly") {
          conflictQuery = conflictQuery.eq("closure_type", "recurring_weekly").eq("day_of_week", closureForm.day_of_week ?? 1);
        } else {
          conflictQuery = conflictQuery.eq("closure_type", "one_time").lte("start_date", closureForm.end_date).gte("end_date", closureForm.start_date);
        }
        const { data: conflicts } = await conflictQuery;
        const overlapping = (conflicts || []).filter((c) => {
          const cStart = c.start_hour + (c.start_minute ?? 0) / 60;
          const cEnd = c.end_hour + (c.end_minute ?? 0) / 60;
          return startTime < cEnd && endTime > cStart;
        });
        if (overlapping.length > 0) {
          const coachName = closureCoaches.find((c) => c.id === effectiveCoachId)?.full_name || "Antren\xF6r";
          setSaving(false);
          setConflictWarning(`\u26A0\uFE0F ${coachName} bu saatte ba\u015Fka bir programa atanm\u0131\u015F (${overlapping[0].reason || "Ders"}). Yine de kaydetmek i\xE7in tekrar t\u0131klay\u0131n.`);
          return;
        }
      }
      {
        const chkType = closureForm.closure_type || "recurring_weekly";
        const chkCourtId = closureModal.courtId;
        let bkQuery = sb.from("bookings").select("id, start_time, end_time").eq("court_id", chkCourtId).in("status", ["pending", "confirmed"]).gte("start_time", localTimeToDb((/* @__PURE__ */ new Date()).toISOString()));
        if (chkType === "one_time" && closureForm.start_date && closureForm.end_date) {
          bkQuery = bkQuery.lte("start_time", localTimeToDb(`${closureForm.end_date}T23:59:59`));
        }
        const { data: upcomingBk } = await bkQuery;
        const conflictingBk = (upcomingBk || []).filter((b) => {
          const localStart = new Date(dbTimeToLocal(b.start_time));
          const localEnd = new Date(dbTimeToLocal(b.end_time));
          if (chkType === "recurring_weekly" && localStart.getDay() !== (closureForm.day_of_week ?? 1)) return false;
          const bsh = localStart.getHours() + localStart.getMinutes() / 60;
          const beh = localEnd.getHours() + localEnd.getMinutes() / 60;
          return startTime < beh && endTime > bsh;
        });
        if (conflictingBk.length > 0) {
          const ok = confirm(
            `\u26A0\uFE0F Bu saatte ${conflictingBk.length} aktif rezervasyon var. Kort kapat\u0131l\u0131rsa bu rezervasyonlar etkilenecek. Yine de devam etmek istiyor musunuz?`
          );
          if (!ok) {
            setSaving(false);
            return;
          }
        }
      }
      const payload = {
        court_id: closureModal.courtId,
        closure_type: closureForm.closure_type || "recurring_weekly",
        start_hour: startH,
        start_minute: startM,
        end_hour: endH,
        end_minute: endM,
        reason: autoReason,
        coach_id: effectiveCoachId || null,
        group_id: closureForm.group_id || null,
        is_active: true
      };
      if ((closureForm.closure_type || "recurring_weekly") === "recurring_weekly") {
        payload.day_of_week = closureForm.day_of_week ?? 1;
        if (closureForm.start_date) payload.start_date = closureForm.start_date;
        if (closureForm.end_date) payload.end_date = closureForm.end_date;
      } else {
        if (!closureForm.start_date || !closureForm.end_date) {
          alert("Tek seferlik kapatma i\xE7in ba\u015Flang\u0131\xE7 ve biti\u015F tarihi gereklidir");
          setSaving(false);
          return;
        }
        payload.start_date = closureForm.start_date;
        payload.end_date = closureForm.end_date;
      }
      await sb.from("court_closures").insert(payload);
      setConflictWarning("");
      loadCourtClosures(closureModal.courtId);
      setClosureForm({ closure_type: "recurring_weekly", session_type: "training", day_of_week: 1, start_hour: 9, start_minute: 0, end_hour: 10, end_minute: 0, start_date: "", end_date: "", reason: "", coach_id: "", group_id: "" });
      if (expanded === closureModal.courtId) loadSlots(closureModal.courtId);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const handleSlotClick = (courtId, hour) => {
    if (getSlotStatus(courtId, hour) !== "empty") return;
    setSlotClickInfo({ courtId, hour });
    setSlotTypeModal(true);
  };
  const applySlotPrefill = (type) => {
    const { courtId, hour } = slotClickInfo;
    const startStr = `${String(hour).padStart(2, "0")}:00`;
    const endStr = `${String(hour + 1).padStart(2, "0")}:00`;
    setSlotTypeModal(false);
    setSlotClickInfo(null);
    if (type === "closure") {
      setClosureForm({ closure_type: "one_time", session_type: "maintenance", reason: "Kapal\u0131", day_of_week: (/* @__PURE__ */ new Date(slotDate + "T12:00")).getDay(), start_hour: hour, start_minute: 0, end_hour: hour + 1, end_minute: 0, start_date: slotDate, end_date: slotDate, coach_id: "", group_id: "" });
      loadClosureCoaches();
      loadClosureGroups();
      loadCourtClosures(courtId);
      setConflictWarning("");
      setClosureModal({ courtId });
    } else if (type === "group") {
      setClosureForm({ closure_type: "one_time", session_type: "training", reason: "Grup Dersi", day_of_week: (/* @__PURE__ */ new Date(slotDate + "T12:00")).getDay(), start_hour: hour, start_minute: 0, end_hour: hour + 1, end_minute: 0, start_date: slotDate, end_date: slotDate, coach_id: "", group_id: "" });
      loadClosureCoaches();
      loadClosureGroups();
      loadCourtClosures(courtId);
      setClosureModal({ courtId });
    } else {
      window.__slotPrefill = { type, court_id: courtId, date: slotDate, start_time: startStr, end_time: endStr };
      setScreen("reservations");
    }
  };
  const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
  const getSlotStatus = (courtId, h) => {
    const d = slotData[courtId];
    if (!d) return "empty";
    const hStart = /* @__PURE__ */ new Date(slotDate + `T${String(h).padStart(2, "0")}:00:00`);
    const hEnd = /* @__PURE__ */ new Date(slotDate + `T${String(h + 1).padStart(2, "0")}:00:00`);
    for (const b of d.bookings) {
      const bs = new Date(b.start_time), be = new Date(b.end_time);
      if (bs < hEnd && be > hStart) return b.status === "cancelled" ? "empty" : "booked";
    }
    for (const c of d.closures) {
      if (c.start_hour != null && c.end_hour != null) {
        if (h < c.end_hour && h + 1 > c.start_hour) return "closed";
      }
    }
    return "empty";
  };
  const slotLabel = (courtId, h, status) => {
    if (status === "empty") return "";
    const d = slotData[courtId];
    if (!d) return "";
    const hStart = /* @__PURE__ */ new Date(slotDate + `T${String(h).padStart(2, "0")}:00:00`);
    const hEnd = /* @__PURE__ */ new Date(slotDate + `T${String(h + 1).padStart(2, "0")}:00:00`);
    if (status === "booked" || status === "pending") {
      const b = d.bookings.find((b2) => new Date(b2.start_time) < hEnd && new Date(b2.end_time) > hStart);
      return b?.booking_players?.[0]?.profiles?.full_name?.split(" ")[0] || "\u25CF";
    }
    return "Kapal\u0131";
  };
  if (loading) return /* @__PURE__ */ React.createElement(Spinner, null);
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Kortlar"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, courts.length, " kort kay\u0131tl\u0131")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: openAdd }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), "Kort Ekle")), courts.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "sports_tennis", title: "Hen\xFCz kort yok", sub: "\u0130lk kortunuzu ekleyin." }) : courts.map((court) => /* @__PURE__ */ React.createElement("div", { key: court.id, className: "card tight", style: { overflow: "visible" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" } }, /* @__PURE__ */ React.createElement("div", { className: "av av-sq av-1", style: { width: 40, height: 40, fontSize: 14, borderRadius: 10 } }, court.court_number), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700 } }, "Kort ", court.court_number), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", display: "flex", gap: 8, marginTop: 2 } }, /* @__PURE__ */ React.createElement(Badge, { cls: courtTypeClass(court.court_type) }, courtTypeLabel(court.court_type)), court.is_indoor && /* @__PURE__ */ React.createElement(Badge, { cls: "b-purple" }, "Kapal\u0131"), court.hourly_rate && /* @__PURE__ */ React.createElement("span", null, fmtMoney(court.hourly_rate), "/saat"), court.price_2_players && /* @__PURE__ */ React.createElement("span", null, "\u{1F465}2: ", fmtMoney(court.price_2_players)), court.price_3_players && /* @__PURE__ */ React.createElement("span", null, "\u{1F465}3: ", fmtMoney(court.price_3_players)), court.price_4_players && /* @__PURE__ */ React.createElement("span", null, "\u{1F465}4: ", fmtMoney(court.price_4_players)))), /* @__PURE__ */ React.createElement(Switch, { on: court.is_active, onChange: () => toggleActive(court), label: court.is_active ? "Aktif" : "Pasif" }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", title: "D\xFCzenle", onClick: () => openEdit(court) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "edit")), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-ghost btn-sm btn-icon",
      title: "Sabit Program",
      onClick: () => {
        setClosureForm({ closure_type: "recurring_weekly", session_type: "training", day_of_week: 1, start_hour: 9, start_minute: 0, end_hour: 10, end_minute: 0, start_date: "", end_date: "", reason: "", coach_id: "", group_id: "" });
        loadClosureCoaches();
        loadClosureGroups();
        loadCourtClosures(court.id);
        setConflictWarning("");
        setClosureModal({ courtId: court.id });
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "block")
  ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", title: "Sil", onClick: () => deleteCourt(court.id) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "delete")), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Program G\xF6r", onClick: () => toggleExpand(court.id) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, expanded === court.id ? "expand_less" : "expand_more"))), expanded === court.id && /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px solid var(--border)", padding: "14px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: "var(--text-2)" } }, "Tarih:"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: slotDate,
      onChange: (e) => {
        setSlotDate(e.target.value);
        setTimeout(() => loadSlots(court.id), 0);
      },
      style: { border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 12, outline: 0 }
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => loadSlots(court.id) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "refresh"))), /* @__PURE__ */ React.createElement("div", { className: "court-grid-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "court-time-grid", style: { gridTemplateColumns: `50px repeat(${HOURS.length}, 1fr)` } }, /* @__PURE__ */ React.createElement("div", { className: "hour-label", style: { background: "var(--bg)" } }, "Saat"), HOURS.map((h) => /* @__PURE__ */ React.createElement("div", { key: h, className: "hour-label" }, String(h).padStart(2, "0"), ":00")), /* @__PURE__ */ React.createElement("div", { className: "hour-label", style: { background: "var(--surface)" } }, "Durum"), HOURS.map((h) => {
    const st = getSlotStatus(court.id, h);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: h,
        className: `court-slot ${st}`,
        title: st === "empty" ? "T\u0131kla: ekle" : void 0,
        onClick: () => handleSlotClick(court.id, h),
        style: { cursor: st === "empty" ? "pointer" : "default" }
      },
      slotLabel(court.id, h, st)
    );
  }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "var(--text-2)" } }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--brand-navy-soft)", marginRight: 4 } }), "Rezerveli"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#FEF2F2", marginRight: 4 } }), "Kapal\u0131"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--surface)", border: "1px solid var(--border)", marginRight: 4 } }), "Bo\u015F"))))), modal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: modal.type === "add" ? "Kort Ekle" : "Kort D\xFCzenle",
      onClose: () => setModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: saveCourt, disabled: saving }, saving ? "Kaydediliyor\u2026" : "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Kort Numaras\u0131" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 1,
        value: form.court_number || "",
        placeholder: "1",
        onChange: (e) => setForm({ ...form, court_number: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Saatlik \xDCcret (\u20BA)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        value: form.hourly_rate || "",
        placeholder: "0",
        onChange: (e) => setForm({ ...form, hourly_rate: e.target.value })
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Zemin Tipi" }, /* @__PURE__ */ React.createElement("select", { value: form.court_type || "clay", onChange: (e) => setForm({ ...form, court_type: e.target.value, surface: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "clay" }, "Toprak (Clay)"), /* @__PURE__ */ React.createElement("option", { value: "hard" }, "Sert (Hard)"), /* @__PURE__ */ React.createElement("option", { value: "grass" }, "\xC7im (Grass)"), /* @__PURE__ */ React.createElement("option", { value: "artificial_grass" }, "Yapay \xC7im"))), /* @__PURE__ */ React.createElement(Field, { label: "Kapal\u0131 Kort" }, /* @__PURE__ */ React.createElement("select", { value: form.is_indoor ? "true" : "false", onChange: (e) => setForm({ ...form, is_indoor: e.target.value === "true" }) }, /* @__PURE__ */ React.createElement("option", { value: "false" }, "A\xE7\u0131k Hava"), /* @__PURE__ */ React.createElement("option", { value: "true" }, "Kapal\u0131 Alan")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(Switch, { on: form.is_active !== false, onChange: (v) => setForm({ ...form, is_active: v }), label: "Aktif" })), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 12, color: "var(--text-2)", letterSpacing: 0.5, textTransform: "uppercase", marginTop: 4 } }, "Oyuncu Say\u0131s\u0131na G\xF6re \xDCcret (\u20BA)"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "2 Oyuncu (\u20BA)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        value: form.price_2_players || "",
        placeholder: "0",
        onChange: (e) => setForm({ ...form, price_2_players: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "3 Oyuncu (\u20BA)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        value: form.price_3_players || "",
        placeholder: "0",
        onChange: (e) => setForm({ ...form, price_3_players: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "4 Oyuncu (\u20BA)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        value: form.price_4_players || "",
        placeholder: "0",
        onChange: (e) => setForm({ ...form, price_4_players: e.target.value })
      }
    ))), /* @__PURE__ */ React.createElement(
      Switch,
      {
        on: !!form.campaign_enabled,
        onChange: (v) => setForm({ ...form, campaign_enabled: v, campaign_price: v ? form.campaign_price : "", campaign_start_hour: form.campaign_start_hour ?? 9, campaign_end_hour: form.campaign_end_hour ?? 12 }),
        label: "Kampanya Fiyat\u0131 Aktif"
      }
    ), form.campaign_enabled && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "Kampanya Fiyat\u0131 (\u20BA)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        value: form.campaign_price || "",
        placeholder: "0",
        onChange: (e) => setForm({ ...form, campaign_price: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Kampanya Saat Aral\u0131\u011F\u0131" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-sm btn-icon",
        onClick: () => setForm((f) => ({ ...f, campaign_start_hour: Math.max(0, (f.campaign_start_hour ?? 9) - 1) }))
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "remove")
    ), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14, minWidth: 36, textAlign: "center" } }, String(form.campaign_start_hour ?? 9).padStart(2, "0"), ":00"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-sm btn-icon",
        onClick: () => setForm((f) => ({ ...f, campaign_start_hour: Math.min(22, (f.campaign_start_hour ?? 9) + 1) }))
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "add")
    )), /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--text-2)", fontSize: 16 } }, "arrow_forward"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-sm btn-icon",
        onClick: () => setForm((f) => ({ ...f, campaign_end_hour: Math.max(1, (f.campaign_end_hour ?? 12) - 1) }))
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "remove")
    ), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14, minWidth: 36, textAlign: "center" } }, String(form.campaign_end_hour ?? 12).padStart(2, "0"), ":00"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-sm btn-icon",
        onClick: () => setForm((f) => ({ ...f, campaign_end_hour: Math.min(23, (f.campaign_end_hour ?? 12) + 1) }))
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "add")
    ))))))
  ), slotTypeModal && slotClickInfo && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" },
      onClick: (e) => {
        if (e.target === e.currentTarget) {
          setSlotTypeModal(false);
          setSlotClickInfo(null);
        }
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 20, padding: 24, width: 320, display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 17, color: "var(--text-1)", marginBottom: 4 } }, String(slotClickInfo.hour).padStart(2, "0"), ":00 \u2013 ", String(slotClickInfo.hour + 1).padStart(2, "0"), ":00"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", marginBottom: 8 } }, "Ne yapmak istersiniz?"), [
      { type: "reservation", icon: "event", label: "Rezervasyon", color: "#003399" },
      { type: "lesson", icon: "school", label: "\xD6zel Ders", color: "#7C3AED" },
      { type: "group", icon: "groups", label: "Grup Dersi", color: "#0891B2" },
      { type: "closure", icon: "lock", label: "Kapatma", color: "#DC2626" }
    ].map(({ type, icon, label, color }) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: type,
        style: { display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 14, border: `1.5px solid ${color}20`, background: `${color}08`, cursor: "pointer", fontSize: 14, fontWeight: 700, color },
        onClick: () => applySlotPrefill(type)
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 20, color } }, icon),
      label
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: { marginTop: 4, padding: "10px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", fontSize: 13, color: "var(--text-2)", fontWeight: 600 },
        onClick: () => {
          setSlotTypeModal(false);
          setSlotClickInfo(null);
        }
      },
      "\u0130ptal"
    ))
  ), closureModal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: `Sabit Program \u2014 Kort ${courts.find((c) => c.id === closureModal.courtId)?.court_number ?? ""}`,
      wide: true,
      onClose: () => setClosureModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setClosureModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: saveClosure, disabled: saving }, saving ? "Kaydediliyor\u2026" : "Program Ekle"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, courtClosures.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow", style: { marginBottom: 8 } }, "MEVCUT PROGRAMLAR"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, courtClosures.map((cl) => /* @__PURE__ */ React.createElement("div", { key: cl.id, style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      borderRadius: 10,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      opacity: cl.is_active ? 1 : 0.5
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: 4,
      alignSelf: "stretch",
      borderRadius: 2,
      flexShrink: 0,
      background: cl.reason?.includes("Bak\u0131m") ? "#F59E0B" : "#8B5CF6"
    } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, cl.reason || "Kapal\u0131"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2 } }, cl.closure_type === "recurring_weekly" ? `Her ${["Pazar", "Pazartesi", "Sal\u0131", "\xC7ar\u015Famba", "Per\u015Fembe", "Cuma", "Cumartesi"][cl.day_of_week ?? 0]}` : `${cl.start_date} \u2013 ${cl.end_date}`, " \xB7 ", String(cl.start_hour).padStart(2, "0"), ":", String(cl.start_minute ?? 0).padStart(2, "0"), " \u2013 ", String(cl.end_hour).padStart(2, "0"), ":", String(cl.end_minute ?? 0).padStart(2, "0")), cl.group?.name && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, "\u{1F465} ", cl.group.name), cl.coach?.full_name && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, "\u{1F464} ", cl.coach.full_name)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn btn-ghost btn-sm btn-icon",
        title: cl.is_active ? "Duraklat" : "Aktifle\u015Ftir",
        style: { background: cl.is_active ? "#FEF2F2" : "#F0FDF4", border: "none" },
        onClick: () => toggleClosure(cl)
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: cl.is_active ? "#EF4444" : "#22C55E" } }, cl.is_active ? "pause" : "play_arrow")
    ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", title: "Sil", onClick: () => deleteClosure(cl.id) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "delete_outline")))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, margin: "14px 0 0" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 1, background: "var(--border)" } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", letterSpacing: 1 } }, "YEN\u0130 EKLE"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 1, background: "var(--border)" } }))), /* @__PURE__ */ React.createElement(Field, { label: "ETK\u0130NL\u0130K T\xDCR\xDC" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, [
      { value: "training", label: "\u{1F3BE} Grup Antrenman\u0131" },
      { value: "maintenance", label: "\u{1F527} Bak\u0131m & Onar\u0131m" },
      { value: "other", label: "\u{1F4CC} Di\u011Fer" }
    ].map((opt) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.value,
        type: "button",
        className: "btn btn-sm " + (closureForm.session_type === opt.value ? "btn-pri" : "btn-ghost"),
        onClick: () => setClosureForm({ ...closureForm, session_type: opt.value })
      },
      opt.label
    )))), /* @__PURE__ */ React.createElement(Field, { label: "ETK\u0130NL\u0130K ADI (iste\u011Fe ba\u011Fl\u0131)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: closureForm.reason || "",
        placeholder: "\xD6rn: Pazartesi Sabah Grubu",
        onChange: (e) => setClosureForm({ ...closureForm, reason: e.target.value })
      }
    )), closureForm.session_type === "training" && /* @__PURE__ */ React.createElement(Field, { label: "GRUP (iste\u011Fe ba\u011Fl\u0131)" }, closureGroups.length === 0 ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-2)" } }, "Aktif grup bulunamad\u0131") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-sm " + (!closureForm.group_id ? "btn-pri" : "btn-ghost"),
        onClick: () => setClosureForm({ ...closureForm, group_id: "", coach_id: "" })
      },
      "Yok"
    ), closureGroups.map((g) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: g.id,
        type: "button",
        className: "btn btn-sm " + (closureForm.group_id === g.id ? "btn-pri" : "btn-ghost"),
        onClick: () => setClosureForm({ ...closureForm, group_id: g.id, coach_id: g.coach_id || "" })
      },
      g.name
    )))), closureForm.session_type === "training" && /* @__PURE__ */ React.createElement(Field, { label: "ANTREN\xD6R" }, closureCoaches.length === 0 ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-2)" } }, "Aktif antren\xF6r bulunamad\u0131") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-sm " + (!closureForm.coach_id ? "btn-pri" : "btn-ghost"),
        onClick: () => setClosureForm({ ...closureForm, coach_id: "" })
      },
      "Yok"
    ), closureCoaches.map((c) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: c.id,
        type: "button",
        className: "btn btn-sm " + (closureForm.coach_id === c.id ? "btn-pri" : "btn-ghost"),
        onClick: () => setClosureForm({ ...closureForm, coach_id: c.id })
      },
      c.full_name
    )))), /* @__PURE__ */ React.createElement(Field, { label: "TEKRAR" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" } }, [
      { value: "recurring_weekly", label: "\u{1F504} Haftal\u0131k Tekrar" },
      { value: "one_time", label: "\u{1F4C5} Tek Seferlik" }
    ].map((opt) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.value,
        type: "button",
        style: {
          flex: 1,
          padding: "8px 12px",
          fontSize: 13,
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          background: closureForm.closure_type === opt.value ? "var(--brand-navy, #003399)" : "transparent",
          color: closureForm.closure_type === opt.value ? "#fff" : "var(--text-1)"
        },
        onClick: () => setClosureForm({ ...closureForm, closure_type: opt.value })
      },
      opt.label
    )))), (closureForm.closure_type || "recurring_weekly") === "recurring_weekly" && /* @__PURE__ */ React.createElement(Field, { label: "G\xDCN" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, ["Paz", "Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt"].map((day, idx) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: day,
        type: "button",
        className: "btn btn-sm " + ((closureForm.day_of_week ?? 1) === idx ? "btn-pri" : "btn-ghost"),
        style: { minWidth: 44 },
        onClick: () => setClosureForm({ ...closureForm, day_of_week: idx })
      },
      day
    )))), closureForm.closure_type === "one_time" && /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "BA\u015ELANGI\xC7" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        value: closureForm.start_date || "",
        onChange: (e) => setClosureForm({ ...closureForm, start_date: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "B\u0130T\u0130\u015E" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        value: closureForm.end_date || "",
        onChange: (e) => setClosureForm({ ...closureForm, end_date: e.target.value })
      }
    ))), /* @__PURE__ */ React.createElement(Field, { label: "SAAT ARALI\u011EI" }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 8 } }, /* @__PURE__ */ React.createElement(Switch, { on: use15Min, onChange: setUse15Min, label: "15 dakika hassasiyeti" })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-sm btn-icon",
        onClick: () => setClosureForm((f) => {
          const h = f.start_hour ?? 9, m = f.start_minute ?? 0;
          if (use15Min) {
            return m > 0 ? { ...f, start_minute: m - 15 } : { ...f, start_hour: Math.max(0, h - 1), start_minute: 45 };
          }
          return { ...f, start_hour: Math.max(0, h - 1) };
        })
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "remove")
    ), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 15, minWidth: 44, textAlign: "center" } }, String(closureForm.start_hour ?? 9).padStart(2, "0"), ":", String(closureForm.start_minute ?? 0).padStart(2, "0")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-sm btn-icon",
        onClick: () => setClosureForm((f) => {
          const h = f.start_hour ?? 9, m = f.start_minute ?? 0;
          if (use15Min) {
            return m < 45 ? { ...f, start_minute: m + 15 } : { ...f, start_hour: Math.min(22, h + 1), start_minute: 0 };
          }
          return { ...f, start_hour: Math.min(22, h + 1) };
        })
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "add")
    )), /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--text-2)" } }, "arrow_forward"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-sm btn-icon",
        onClick: () => setClosureForm((f) => {
          const h = f.end_hour ?? 10, m = f.end_minute ?? 0;
          if (use15Min) {
            return m > 0 ? { ...f, end_minute: m - 15 } : { ...f, end_hour: Math.max(1, h - 1), end_minute: 45 };
          }
          return { ...f, end_hour: Math.max(1, h - 1) };
        })
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "remove")
    ), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 15, minWidth: 44, textAlign: "center" } }, String(closureForm.end_hour ?? 10).padStart(2, "0"), ":", String(closureForm.end_minute ?? 0).padStart(2, "0")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-sm btn-icon",
        onClick: () => setClosureForm((f) => {
          const h = f.end_hour ?? 10, m = f.end_minute ?? 0;
          if (use15Min) {
            return m < 45 ? { ...f, end_minute: m + 15 } : { ...f, end_hour: Math.min(23, h + 1), end_minute: 0 };
          }
          return { ...f, end_hour: Math.min(23, h + 1) };
        })
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "add")
    )))), conflictWarning && /* @__PURE__ */ React.createElement("div", { style: { background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "#D97706", fontSize: 18, marginTop: 1 } }, "warning"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#92400E" } }, conflictWarning), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-sm",
        style: { marginTop: 8, background: "#D97706", color: "#fff", border: "none" },
        onClick: async () => {
          setConflictWarning("");
          const startH = closureForm.start_hour ?? 9, startM = closureForm.start_minute ?? 0;
          const endH = closureForm.end_hour ?? 10, endM = closureForm.end_minute ?? 0;
          const autoReason = (closureForm.reason || "").trim() || SESSION_TYPE_LABELS[closureForm.session_type || "other"];
          let effectiveCoachId = closureForm.coach_id || null;
          const selectedGroup = closureForm.group_id ? closureGroups.find((g) => g.id === closureForm.group_id) : null;
          if (selectedGroup?.coach_id && !effectiveCoachId) effectiveCoachId = selectedGroup.coach_id;
          const payload = {
            court_id: closureModal.courtId,
            closure_type: closureForm.closure_type || "recurring_weekly",
            start_hour: startH,
            start_minute: startM,
            end_hour: endH,
            end_minute: endM,
            reason: autoReason,
            coach_id: effectiveCoachId || null,
            group_id: closureForm.group_id || null,
            is_active: true
          };
          if ((closureForm.closure_type || "recurring_weekly") === "recurring_weekly") {
            payload.day_of_week = closureForm.day_of_week ?? 1;
            if (closureForm.start_date) payload.start_date = closureForm.start_date;
            if (closureForm.end_date) payload.end_date = closureForm.end_date;
          } else {
            payload.start_date = closureForm.start_date;
            payload.end_date = closureForm.end_date;
          }
          try {
            await sb.from("court_closures").insert(payload);
            loadCourtClosures(closureModal.courtId);
            setClosureForm({ closure_type: "recurring_weekly", session_type: "training", day_of_week: 1, start_hour: 9, start_minute: 0, end_hour: 10, end_minute: 0, start_date: "", end_date: "", reason: "", coach_id: "", group_id: "" });
            if (expanded === closureModal.courtId) loadSlots(closureModal.courtId);
          } catch (e) {
            alert(e.message);
          }
        }
      },
      "Yine de Ekle"
    ))))
  ));
}

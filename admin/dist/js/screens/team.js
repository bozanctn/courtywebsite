const SPECIALIZATIONS = [
  "Ba\u015Flang\u0131\xE7",
  "Orta Seviye",
  "\u0130leri Seviye",
  "\xC7ocuk Antren\xF6r\xFC",
  "Yeti\u015Fkin Antren\xF6r\xFC",
  "Turnuva Haz\u0131rl\u0131\u011F\u0131",
  "Fitness & Kondisyon",
  "Taktik & Strateji"
];
function CoachesScreen({ clubId }) {
  const { useState, useEffect, useMemo } = React;
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [payMode, setPayMode] = useState("hourly");
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState([]);
  const [inviteSearched, setInviteSearched] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSending, setInviteSending] = useState(null);
  const [inviteMap, setInviteMap] = useState({});
  const [scheduleCoach, setScheduleCoach] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekLessons, setWeekLessons] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  useEffect(() => {
    if (clubId) {
      loadCoaches();
      loadInvitations();
    }
  }, [clubId]);
  const loadCoaches = async () => {
    setLoading(true);
    const { data } = await sb.from("club_coaches").select("*").eq("club_id", clubId).order("created_at", { ascending: false });
    setCoaches(data || []);
    setLoading(false);
  };
  const stats = useMemo(() => {
    const total = coaches.length;
    const active = coaches.filter((c) => c.is_active).length;
    const avgRate = total > 0 ? Math.round(coaches.reduce((s, c) => s + (c.hourly_rate || 0), 0) / total) : 0;
    return { total, active, avgRate };
  }, [coaches]);
  const filtered = coaches.filter((c) => showInactive || c.is_active);
  const openAdd = () => {
    setForm({ is_active: true, full_name: "", email: "", phone: "", hourly_rate: "", coach_pay_rate: "", experience_years: "", specialization: "", bio: "", day_off: null });
    setPayMode("hourly");
    setModal("add");
  };
  const openEdit = (coach) => {
    setForm({ ...coach, hourly_rate: String(coach.hourly_rate || ""), experience_years: String(coach.experience_years || "") });
    setPayMode(coach.coach_pay_rate > 0 ? "percentage" : "hourly");
    setModal("edit");
  };
  const save = async () => {
    if (!form.full_name?.trim()) {
      alert("Hoca ad\u0131 gereklidir.");
      return;
    }
    if (!form.email?.trim()) {
      alert("E-posta adresi gereklidir.");
      return;
    }
    if (payMode === "hourly" && !form.hourly_rate) {
      alert("Saatlik \xFCcret girin.");
      return;
    }
    if (payMode === "percentage" && !form.coach_pay_rate) {
      alert("Hoca pay\u0131 (%) girin.");
      return;
    }
    setSaving(true);
    try {
      const email = form.email.trim();
      if (modal === "add") {
        const { data: existing, error: checkErr } = await sb.from("club_coaches").select("id").eq("club_id", clubId).eq("email", email).maybeSingle();
        if (checkErr) throw checkErr;
        if (existing) throw new Error("Bu email adresi ile zaten bir hoca mevcut");
      } else {
        const { data: existing, error: checkErr } = await sb.from("club_coaches").select("id").eq("club_id", clubId).eq("email", email).neq("id", form.id).maybeSingle();
        if (checkErr) throw checkErr;
        if (existing) throw new Error("Bu email adresi ile zaten bir hoca mevcut");
      }
      if (form.coach_pay_rate) {
        const pr = Number(form.coach_pay_rate);
        if (pr < 0) {
          alert("Hoca pay\u0131 negatif olamaz.");
          return;
        }
        if (pr > 100) {
          alert("Hoca pay\u0131 %100'den b\xFCy\xFCk olamaz.");
          return;
        }
      }
      const payload = {
        club_id: clubId,
        full_name: form.full_name.trim(),
        email,
        phone: form.phone?.trim() || null,
        hourly_rate: payMode === "hourly" ? Number(form.hourly_rate) : 0,
        coach_pay_rate: payMode === "percentage" ? Number(form.coach_pay_rate) : null,
        experience_years: Number(form.experience_years) || 0,
        specialization: form.specialization || null,
        bio: form.bio?.trim() || null,
        is_active: form.is_active !== false,
        day_off: form.day_off != null ? Number(form.day_off) : null
      };
      if (modal === "add") {
        const { error } = await sb.from("club_coaches").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await sb.from("club_coaches").update(payload).eq("id", form.id);
        if (error) throw error;
      }
      setModal(null);
      loadCoaches();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const del = async (coach) => {
    if (!confirm(`${coach.full_name} adl\u0131 hocay\u0131 silmek istedi\u011Finize emin misiniz?`)) return;
    const { error } = await sb.from("club_coaches").delete().eq("id", coach.id);
    if (error) {
      alert(error.message);
      return;
    }
    loadCoaches();
  };
  const toggleStatus = async (coach) => {
    const { error } = await sb.from("club_coaches").update({ is_active: !coach.is_active }).eq("id", coach.id);
    if (error) {
      alert(error.message);
      return;
    }
    loadCoaches();
  };
  const loadInvitations = async () => {
    const { data } = await sb.from("coach_invitations").select("coach_id,status").eq("club_id", clubId);
    const map = {};
    (data || []).forEach((inv) => {
      if (inv.status === "pending" || inv.status === "accepted") map[inv.coach_id] = inv.status;
    });
    setInviteMap(map);
  };
  const closeInviteModal = () => {
    setModal(null);
    setInviteQuery("");
    setInviteResults([]);
    setInviteSearched(false);
  };
  const handleInviteSearch = async () => {
    const q = inviteQuery.trim();
    if (q.length < 3) {
      alert("Arama yapmak i\xE7in en az 3 karakter giriniz.");
      return;
    }
    setInviteLoading(true);
    setInviteSearched(true);
    try {
      const { data, error } = await sb.from("profiles").select("id,full_name,email").eq("user_type", "coach").or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).limit(20);
      if (error) throw error;
      const { data: clubCoachProfiles } = await sb.from("coach_profiles").select("id").eq("coach_type", "club");
      const clubCoachIds = new Set((clubCoachProfiles || []).map((c) => c.id));
      setInviteResults((data || []).filter((c) => !clubCoachIds.has(c.id)));
    } catch (e) {
      alert(e.message);
    } finally {
      setInviteLoading(false);
    }
  };
  const handleSendInvite = async (user) => {
    setInviteSending(user.id);
    try {
      const { data: existing, error: checkErr } = await sb.from("coach_invitations").select("id").eq("club_id", clubId).eq("coach_id", user.id).maybeSingle();
      if (checkErr) throw checkErr;
      if (existing) throw new Error("Bu hocaya zaten davet g\xF6nderilmi\u015F");
      const { error } = await sb.from("coach_invitations").insert({ club_id: clubId, coach_id: user.id });
      if (error) throw error;
      setInviteMap((prev) => ({ ...prev, [user.id]: "pending" }));
    } catch (e) {
      alert(e.message);
    } finally {
      setInviteSending(null);
    }
  };
  const getWeekBounds = (offset) => {
    const now = /* @__PURE__ */ new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  };
  const getWeekDays = (offset) => {
    const { monday } = getWeekBounds(offset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };
  const fmtWeekDate = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const fetchSchedule = async (coach, offset) => {
    setScheduleLoading(true);
    try {
      const { monday, sunday } = getWeekBounds(offset);
      const start = monday.toISOString();
      const end = sunday.toISOString();
      const startDate = monday.toISOString().slice(0, 10);
      const endDate = sunday.toISOString().slice(0, 10);
      const [lessonsRes, manualRes, groupRes] = await Promise.all([
        sb.from("lessons").select("id, start_time, end_time, student_name, location, notes, payment_status, amount").eq("club_coach_id", coach.id).gte("start_time", start).lte("start_time", end),
        sb.from("club_manual_lessons").select("id, date, start_time, end_time, student_name, location, notes, payment_status, amount").eq("coach_id", coach.id).gte("date", startDate).lte("date", endDate),
        sb.from("court_closures").select("id, start_hour, start_minute, end_hour, end_minute, start_date, end_date, day_of_week, closure_type, reason, club_groups(name)").eq("coach_id", coach.id).eq("is_active", true)
      ]);
      const days = getWeekDays(offset);
      const dowToIdx = (dow) => dow === 0 ? 6 : dow - 1;
      const groupItems = [];
      for (const g of groupRes.data || []) {
        const groupName = g.club_groups?.name || g.reason || "Grup Dersi";
        if (g.closure_type === "recurring_weekly") {
          const idx = dowToIdx(g.day_of_week);
          const sm = g.start_minute ?? 0;
          const em = g.end_minute ?? 0;
          const d = new Date(days[idx]);
          d.setHours(g.start_hour, sm, 0, 0);
          groupItems.push({
            id: g.id,
            _date: days[idx].toISOString().split("T")[0],
            _displayStart: `${String(g.start_hour).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
            _displayEnd: `${String(g.end_hour).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
            _sortMs: d.getTime(),
            student_name: groupName,
            location: null,
            notes: null,
            amount: null,
            payment_status: null,
            source: "group"
          });
        } else if (g.closure_type === "one_time" && g.start_date >= startDate && g.start_date <= endDate) {
          const sm = g.start_minute ?? 0;
          const em = g.end_minute ?? 0;
          const d = /* @__PURE__ */ new Date(g.start_date + "T00:00:00");
          d.setHours(g.start_hour, sm, 0, 0);
          groupItems.push({
            id: g.id,
            _date: g.start_date,
            _displayStart: `${String(g.start_hour).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
            _displayEnd: `${String(g.end_hour).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
            _sortMs: d.getTime(),
            student_name: groupName,
            location: null,
            notes: null,
            amount: null,
            payment_status: null,
            source: "group"
          });
        }
      }
      const lessonItems = (lessonsRes.data || []).map((l) => ({
        ...l,
        _date: new Date(l.start_time).toISOString().split("T")[0],
        _displayStart: new Date(l.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        _displayEnd: new Date(l.end_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        _sortMs: new Date(l.start_time).getTime(),
        source: "lesson"
      }));
      const manualItems = (manualRes.data || []).map((m) => ({
        ...m,
        _date: m.date,
        _displayStart: (m.start_time || "").slice(0, 5),
        _displayEnd: (m.end_time || "").slice(0, 5),
        _sortMs: (/* @__PURE__ */ new Date(m.date + "T" + m.start_time)).getTime(),
        source: "manual"
      }));
      const seenGroups = /* @__PURE__ */ new Set();
      const uniqueGroupItems = groupItems.filter((item) => {
        const key = `${item._date}_${item._displayStart}_${item._displayEnd}_${item.student_name}`;
        if (seenGroups.has(key)) return false;
        seenGroups.add(key);
        return true;
      });
      const all = [...lessonItems, ...manualItems, ...uniqueGroupItems].sort((a, b) => a._sortMs - b._sortMs);
      setWeekLessons(all);
    } catch (e) {
      console.error(e);
    } finally {
      setScheduleLoading(false);
    }
  };
  const openSchedule = (coach) => {
    setScheduleCoach(coach);
    setWeekOffset(0);
    setWeekLessons([]);
    setModal("schedule");
    fetchSchedule(coach, 0);
  };
  const changeWeek = (delta) => {
    const next = weekOffset + delta;
    setWeekOffset(next);
    fetchSchedule(scheduleCoach, next);
  };
  const DAY_NAMES = ["Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt", "Paz"];
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Ko\xE7lar"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, coaches.length, " ko\xE7 kay\u0131tl\u0131")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => {
    setInviteQuery("");
    setInviteResults([]);
    setInviteSearched(false);
    setModal("invite");
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "send"), " Hoca Davet Et"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: openAdd }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), " Manuel Ekle"))), /* @__PURE__ */ React.createElement("div", { className: "stats" }, /* @__PURE__ */ React.createElement(StatCard, { icon: "people", n: stats.total, label: "Toplam Ko\xE7" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "check_circle", n: stats.active, label: "Aktif Ko\xE7", tint: "green" }), /* @__PURE__ */ React.createElement(StatCard, { icon: "payments", n: stats.avgRate > 0 ? `${fmtMoney(stats.avgRate)}/saat` : "\u2014", label: "Ortalama \xDCcret", tint: "navy" })), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Switch, { on: showInactive, onChange: setShowInactive, label: "Pasif ko\xE7lar\u0131 g\xF6ster" })), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : filtered.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "person", title: "Ko\xE7 bulunamad\u0131", sub: "\u0130lk ko\xE7unuzu ekleyin." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 } }, filtered.map((c) => /* @__PURE__ */ React.createElement("div", { key: c.id, className: "card", style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 } }, /* @__PURE__ */ React.createElement(Av, { name: c.full_name }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 15 } }, c.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, c.email), c.phone && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, c.phone)), /* @__PURE__ */ React.createElement(
    "button",
    {
      style: { background: "none", border: "none", cursor: "pointer", padding: "4px 10px", borderRadius: 20, backgroundColor: c.is_active ? "#DCFCE7" : "#FEF3C7", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: c.is_active ? "#22C55E" : "#F59E0B", whiteSpace: "nowrap", flexShrink: 0 },
      onClick: () => toggleStatus(c),
      title: "Durumu de\u011Fi\u015Ftirmek i\xE7in t\u0131klay\u0131n"
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, c.is_active ? "check_circle" : "pause_circle"),
    c.is_active ? "Aktif" : "Pasif"
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, c.experience_years > 0 && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-2)", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 9px" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "schedule"), " ", c.experience_years, " y\u0131l"), c.hourly_rate > 0 && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-2)", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 9px" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "payments"), " ", fmtMoney(c.hourly_rate), "/saat"), c.coach_pay_rate > 0 && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#16A34A", background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 8, padding: "4px 9px", fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "account_balance_wallet"), " Pay: %", c.coach_pay_rate), c.specialization && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--brand-navy)", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, padding: "4px 9px", fontWeight: 600 } }, c.specialization), c.day_off != null && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "4px 9px", fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "beach_access"), ["Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt", "Paz"][c.day_off], " \u0130zin")), c.bio && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.5 } }, c.bio), /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "var(--border)" } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { flex: 1, color: "#22C55E" }, onClick: () => openSchedule(c) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "calendar_today"), " Program"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { flex: 1 }, onClick: () => openEdit(c) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "edit"), " D\xFCzenle"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", onClick: () => del(c) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "delete")))))), modal === "invite" && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "Hoca Davet Et",
      sub: "Uygulamaya kay\u0131tl\u0131 hocalar\u0131 aray\u0131n ve davet g\xF6nderin",
      wide: true,
      onClose: closeInviteModal,
      footer: /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: closeInviteModal }, "Kapat")
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 14px", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16, color: "#3B82F6" } }, "info"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "#3B82F6", lineHeight: 1.5 } }, "Hoca daveti kabul etti\u011Finde \xE7izelgeleriniz ortak g\xF6r\xFCnt\xFClenebilir hale gelir.")),
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, position: "relative" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-2)", fontSize: 18, pointerEvents: "none" } }, "search"), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: inviteQuery,
        placeholder: "Hoca ad\u0131 veya e-posta...",
        onChange: (e) => setInviteQuery(e.target.value),
        onKeyDown: (e) => e.key === "Enter" && handleInviteSearch(),
        style: { paddingLeft: 36 }
      }
    )), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: handleInviteSearch, disabled: inviteLoading, style: { flexShrink: 0 } }, inviteLoading ? "Aran\u0131yor\u2026" : "Ara")),
    inviteLoading ? /* @__PURE__ */ React.createElement(Spinner, null) : !inviteSearched ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "search", title: "Hoca aray\u0131n", sub: "En az 3 karakter girerek uygulamaya kay\u0131tl\u0131 hocalar\u0131 bulun" }) : inviteResults.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "person_search", title: "Hoca bulunamad\u0131", sub: "Farkl\u0131 bir isim veya e-posta ile tekrar aray\u0131n" }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, inviteResults.map((u) => {
      const status = inviteMap[u.id];
      const alreadySent = status === "pending" || status === "accepted";
      return /* @__PURE__ */ React.createElement("div", { key: u.id, style: { display: "flex", alignItems: "center", gap: 12, background: "var(--bg)", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(Av, { name: u.full_name || "?" }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, u.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, u.email)), alreadySent ? /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, background: status === "accepted" ? "#DCFCE7" : "#FEF3C7", color: status === "accepted" ? "#22C55E" : "#F59E0B", borderRadius: 999, padding: "5px 11px", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, status === "accepted" ? "check_circle" : "schedule"), status === "accepted" ? "Kabul Edildi" : "Beklemede") : /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: () => handleSendInvite(u), disabled: inviteSending === u.id, style: { flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "send"), inviteSending === u.id ? "G\xF6nderiliyor\u2026" : "Davet Et"));
    }))
  ), (modal === "add" || modal === "edit") && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: modal === "add" ? "Yeni Ko\xE7 Ekle" : "Ko\xE7 D\xFCzenle",
      wide: true,
      onClose: () => setModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: save, disabled: saving }, saving ? "Kaydediliyor\u2026" : modal === "add" ? "Kaydet" : "G\xFCncelle"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Field, { label: "Hoca Ad\u0131 *" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: form.full_name || "",
        placeholder: "Hoca ad\u0131n\u0131 girin",
        onChange: (e) => setForm({ ...form, full_name: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "E-posta *" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "email",
        value: form.email || "",
        placeholder: "eposta@\xF6rnek.com",
        onChange: (e) => setForm({ ...form, email: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Telefon" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "tel",
        value: form.phone || "",
        placeholder: "0500 000 00 00",
        onChange: (e) => setForm({ ...form, phone: e.target.value })
      }
    ))), /* @__PURE__ */ React.createElement(Field, { label: "\xDCcretlendirme (biri)" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setPayMode("hourly");
          setForm((f) => ({ ...f, coach_pay_rate: "" }));
        },
        style: {
          flex: 1,
          padding: "9px 0",
          borderRadius: 10,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          border: payMode === "hourly" ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)",
          background: payMode === "hourly" ? "#EEF2FF" : "var(--bg)",
          color: payMode === "hourly" ? "var(--brand-navy)" : "var(--text-2)"
        }
      },
      "Saatlik \xDCcret (\u20BA)"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setPayMode("percentage");
          setForm((f) => ({ ...f, hourly_rate: "" }));
        },
        style: {
          flex: 1,
          padding: "9px 0",
          borderRadius: 10,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          border: payMode === "percentage" ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)",
          background: payMode === "percentage" ? "#EEF2FF" : "var(--bg)",
          color: payMode === "percentage" ? "var(--brand-navy)" : "var(--text-2)"
        }
      },
      "Y\xFCzde Pay (%)"
    ))), payMode === "hourly" ? /* @__PURE__ */ React.createElement(Field, { label: "Saatlik \xDCcret (\u20BA)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        value: form.hourly_rate || "",
        placeholder: "0",
        onChange: (e) => setForm({ ...form, hourly_rate: e.target.value })
      }
    )) : /* @__PURE__ */ React.createElement(Field, { label: "Hoca Pay\u0131 (%)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        max: 100,
        value: form.coach_pay_rate || "",
        placeholder: "0",
        onChange: (e) => setForm({ ...form, coach_pay_rate: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Deneyim (Y\u0131l)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        value: form.experience_years || "",
        placeholder: "0",
        onChange: (e) => setForm({ ...form, experience_years: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement("div", null)), /* @__PURE__ */ React.createElement(Field, { label: "Uzmanl\u0131k Alan\u0131" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 } }, SPECIALIZATIONS.map((spec) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: spec,
        type: "button",
        style: { padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: form.specialization === spec ? 700 : 500, border: "1.5px solid", borderColor: form.specialization === spec ? "var(--brand-navy)" : "var(--border)", background: form.specialization === spec ? "var(--brand-navy)" : "var(--bg)", color: form.specialization === spec ? "#fff" : "var(--text-2)", cursor: "pointer" },
        onClick: () => setForm({ ...form, specialization: form.specialization === spec ? "" : spec })
      },
      spec
    )))), /* @__PURE__ */ React.createElement(Field, { label: "\u0130zin G\xFCn\xFC" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 } }, ["Pazartesi", "Sal\u0131", "\xC7ar\u015Famba", "Per\u015Fembe", "Cuma", "Cumartesi", "Pazar"].map((d, i) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: i,
        type: "button",
        style: { padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: form.day_off === i ? 700 : 500, border: "1.5px solid", borderColor: form.day_off === i ? "var(--brand-navy)" : "var(--border)", background: form.day_off === i ? "var(--brand-navy)" : "var(--bg)", color: form.day_off === i ? "#fff" : "var(--text-2)", cursor: "pointer" },
        onClick: () => setForm({ ...form, day_off: form.day_off === i ? null : i })
      },
      d
    )))), /* @__PURE__ */ React.createElement(Field, { label: "Biyografi" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: 3,
        value: form.bio || "",
        placeholder: "Hoca hakk\u0131nda k\u0131sa bilgi\u2026",
        onChange: (e) => setForm({ ...form, bio: e.target.value }),
        style: { resize: "vertical" }
      }
    )), /* @__PURE__ */ React.createElement(Switch, { on: form.is_active !== false, onChange: (v) => setForm({ ...form, is_active: v }), label: "Aktif Ko\xE7" }))
  ), modal === "schedule" && scheduleCoach && (() => {
    const { monday, sunday } = getWeekBounds(weekOffset);
    const days = getWeekDays(weekOffset);
    return /* @__PURE__ */ React.createElement(
      Modal,
      {
        title: `${scheduleCoach.full_name} \u2014 Haftal\u0131k Program`,
        wide: true,
        onClose: () => setModal(null),
        footer: /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setModal(null) }, "Kapat")
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 16px", borderBottom: "1px solid var(--border)", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => changeWeek(-1) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_left")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, fmtWeekDate(monday), " \u2013 ", fmtWeekDate(sunday)), weekOffset === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--brand-navy)", fontWeight: 600, marginTop: 2 } }, "Bu Hafta")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => changeWeek(1) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_right"))),
      scheduleLoading ? /* @__PURE__ */ React.createElement(Spinner, null) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, days.map((day, idx) => {
        const dateStr = day.toISOString().split("T")[0];
        const dayItems = weekLessons.filter((l) => l._date === dateStr);
        const isToday = isSameDay(day, /* @__PURE__ */ new Date());
        return /* @__PURE__ */ React.createElement("div", { key: idx }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, paddingBottom: 6, borderBottom: `1.5px solid ${isToday ? "var(--brand-navy)" : "var(--border)"}`, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: isToday ? "var(--brand-navy)" : "var(--text-2)", width: 32 } }, DAY_NAMES[idx]), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: isToday ? "var(--brand-navy)" : "var(--text-2)", fontWeight: isToday ? 700 : 400 } }, fmtWeekDate(day)), dayItems.length > 0 && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", background: "var(--brand-navy)", color: "#fff", borderRadius: 10, minWidth: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px", fontSize: 11, fontWeight: 700 } }, dayItems.length)), idx === scheduleCoach.day_off && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "6px 12px", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14, color: "#DC2626" } }, "beach_access"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#DC2626" } }, "\u0130zin")), dayItems.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 36, fontSize: 15, color: "var(--text-2)", fontStyle: "italic", paddingBottom: 4 } }, "Ders yok") : dayItems.map((lesson) => {
          const isGroup = lesson.source === "group";
          const isPaid = lesson.payment_status === "paid";
          return /* @__PURE__ */ React.createElement("div", { key: lesson.id, style: { display: "flex", gap: 10, background: isGroup ? "#FFFBEB" : "#fff", borderRadius: 10, padding: 14, marginBottom: 6, border: `1px solid ${isGroup ? "#FDE68A" : "var(--border)"}` } }, /* @__PURE__ */ React.createElement("div", { style: { width: 4, borderRadius: 2, background: isGroup ? "#F59E0B" : "var(--brand-navy)", alignSelf: "stretch", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: isGroup ? "#F59E0B" : "var(--brand-navy)" } }, lesson._displayStart, " \u2013 ", lesson._displayEnd), isGroup ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, background: "#FEF3C7", color: "#F59E0B", borderRadius: 20, padding: "3px 10px" } }, "Grup") : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, background: isPaid ? "#DCFCE7" : "#FEF3C7", color: isPaid ? "#22C55E" : "#F59E0B", borderRadius: 20, padding: "3px 10px" } }, isPaid ? "\xD6dendi" : "Bekliyor")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 17, fontWeight: 700, color: "var(--text-1)", marginTop: 4 } }, lesson.student_name || "\u0130simsiz \xD6\u011Frenci"), lesson.location && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 14, color: "var(--text-2)", marginTop: 5 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "location_on"), lesson.location), lesson.amount > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: "#22C55E", marginTop: 5 } }, fmtMoney(lesson.amount)), lesson.notes && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "var(--text-2)", marginTop: 5, fontStyle: "italic" } }, lesson.notes)));
        }));
      }))
    );
  })());
}
function LessonsScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [lessons, setLessons] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("today");
  useEffect(() => {
    if (clubId) loadAll();
  }, [clubId]);
  const loadAll = async () => {
    setLoading(true);
    try {
      const today = /* @__PURE__ */ new Date();
      const fromStr = new Date(today.getTime() - 30 * 864e5).toISOString().split("T")[0];
      const toStr = new Date(today.getTime() + 60 * 864e5).toISOString().split("T")[0];
      const { data: myCoachRows } = await sb.from("club_coaches").select("id, full_name").eq("club_id", clubId);
      const myCoachIds = (myCoachRows || []).map((c) => c.id);
      const coachMap = new Map((myCoachRows || []).map((c) => [c.id, c.full_name]));
      setCoaches(myCoachRows || []);
      const combined = [];
      if (myCoachIds.length > 0) {
        const { data: bookings } = await sb.from("bookings").select("id, start_time, end_time, club_coach_id, payment_status, total_amount, courts!bookings_court_id_fkey(court_number, club_id)").not("club_coach_id", "is", null).in("club_coach_id", myCoachIds).gte("start_time", `${fromStr}T00:00:00`).lte("start_time", `${toStr}T23:59:59`);
        (bookings || []).forEach((b) => {
          const court = Array.isArray(b.courts) ? b.courts[0] : b.courts;
          if (court?.club_id && court.club_id !== clubId) return;
          const start = new Date(b.start_time);
          const end = new Date(b.end_time);
          combined.push({
            id: b.id,
            date: start.toISOString().split("T")[0],
            start_time: start.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
            end_time: end.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
            student_name: null,
            coach_name: coachMap.get(b.club_coach_id) || "Ko\xE7",
            location: court?.court_number ? `Kort ${court.court_number}` : "\u2014",
            payment_status: b.payment_status === "paid" ? "paid" : "unpaid",
            amount: b.total_amount || null,
            source: "booking"
          });
        });
      }
      const { data: manual } = await sb.from("club_manual_lessons").select("*, club_coaches(full_name)").eq("club_id", clubId).gte("date", fromStr).lte("date", toStr).order("date", { ascending: true }).order("start_time", { ascending: true });
      (manual || []).forEach((m) => {
        combined.push({
          id: m.id,
          date: m.date,
          start_time: (m.start_time || "").slice(0, 5),
          end_time: (m.end_time || "").slice(0, 5),
          student_name: m.student_name || null,
          coach_name: m.coach_name || m.club_coaches?.full_name || "Ko\xE7",
          location: m.location || "\u2014",
          notes: m.notes || null,
          payment_status: m.payment_status || "unpaid",
          amount: m.amount || null,
          source: "manual"
        });
      });
      if (myCoachIds.length > 0) {
        const { data: directLessons } = await sb.from("lessons").select("id, start_time, end_time, student_name, club_coach_id, amount, payment_status, notes, courts(court_number)").in("club_coach_id", myCoachIds).neq("status", "cancelled").gte("start_time", `${fromStr}T00:00:00`).lte("start_time", `${toStr}T23:59:59`);
        (directLessons || []).forEach((l) => {
          const start = new Date(l.start_time);
          const end = new Date(l.end_time);
          const court = Array.isArray(l.courts) ? l.courts[0] : l.courts;
          combined.push({
            id: l.id,
            date: start.toISOString().split("T")[0],
            start_time: start.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
            end_time: end.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
            student_name: l.student_name || null,
            coach_name: coachMap.get(l.club_coach_id) || "Ko\xE7",
            location: court?.court_number ? `Kort ${court.court_number}` : "\u2014",
            notes: l.notes || null,
            payment_status: l.payment_status === "paid" ? "paid" : "unpaid",
            amount: l.amount || null,
            source: "lesson"
          });
        });
      }
      combined.sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
      setLessons(combined);
      const { data: courtData } = await sb.from("courts").select("id, court_number").eq("club_id", clubId).eq("is_active", true);
      setCourts(courtData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 864e5).toISOString().split("T")[0];
  const tabItems = [
    { key: "today", label: "Bug\xFCn" },
    { key: "upcoming", label: "Yakla\u015Fan" },
    { key: "past", label: "Ge\xE7mi\u015F" }
  ];
  const filtered = lessons.filter((l) => {
    if (tab === "today") return l.date === todayStr;
    if (tab === "upcoming") return l.date >= tomorrowStr;
    return l.date < todayStr;
  });
  const saveLesson = async () => {
    if (!form.date) {
      alert("Tarih se\xE7in.");
      return;
    }
    if (!form.start_time) {
      alert("Ba\u015Flang\u0131\xE7 saati girin.");
      return;
    }
    if (!form.end_time) {
      alert("Biti\u015F saati girin.");
      return;
    }
    {
      const dateStr = form.date;
      const startHH = (form.start_time || "").slice(0, 5);
      const endHH = (form.end_time || "").slice(0, 5);
      if (form.court_id) {
        const startDb = localTimeToDb(`${dateStr}T${startHH}`);
        const endDb = localTimeToDb(`${dateStr}T${endHH}`);
        const [{ data: bConflict }, { data: mConflict }, { data: closures }] = await Promise.all([
          sb.from("bookings").select("id").eq("court_id", form.court_id).in("status", ["pending", "confirmed"]).lt("start_time", endDb).gt("end_time", startDb),
          sb.from("club_manual_lessons").select("id, start_time, end_time").eq("court_id", form.court_id).eq("date", dateStr),
          sb.from("court_closures").select("*").eq("court_id", form.court_id).eq("is_active", true)
        ]);
        if (bConflict?.length > 0) {
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
        const closureBlock = (closures || []).some((cl) => {
          const cs = String(cl.start_hour ?? 0).padStart(2, "0") + ":" + String(cl.start_minute ?? 0).padStart(2, "0");
          const ce = String(cl.end_hour ?? 0).padStart(2, "0") + ":" + String(cl.end_minute ?? 0).padStart(2, "0");
          if (!(cs < endHH && ce > startHH)) return false;
          if (cl.closure_type === "recurring_weekly") return cl.day_of_week === dow;
          return (!cl.start_date || cl.start_date <= dateStr) && (!cl.end_date || cl.end_date >= dateStr);
        });
        if (closureBlock) {
          const proceed = confirm("Bu kort se\xE7ilen saatte kapal\u0131 olarak i\u015Faretlenmi\u015F. Yine de ders olu\u015Fturulsun mu?");
          if (!proceed) return;
        }
      }
      const coachId = !form.use_manual_coach ? form.coach_id || null : null;
      if (coachId) {
        const startDb = localTimeToDb(`${dateStr}T${startHH}`);
        const endDb = localTimeToDb(`${dateStr}T${endHH}`);
        const { data: coachConflict } = await sb.from("club_manual_lessons").select("id, start_time, end_time").eq("coach_id", coachId).eq("date", dateStr);
        const hasCoachConflict = (coachConflict || []).some((l) => {
          const ls = (l.start_time || "").slice(0, 5);
          const le = (l.end_time || "").slice(0, 5);
          return ls < endHH && le > startHH;
        });
        if (hasCoachConflict) {
          alert("Bu antren\xF6r\xFCn se\xE7ilen saatte ba\u015Fka bir dersi var.");
          return;
        }
        const { data: lessonCoachConflict } = await sb.from("lessons").select("id").or(`coach_id.eq.${coachId},club_coach_id.eq.${coachId}`).neq("status", "cancelled").lt("start_time", endDb).gt("end_time", startDb);
        if (lessonCoachConflict?.length > 0) {
          alert("Bu antren\xF6r\xFCn se\xE7ilen saatte ba\u015Fka bir dersi var.");
          return;
        }
      }
    }
    setSaving(true);
    try {
      const courtNum = form.court_id ? courts.find((c) => c.id === form.court_id)?.court_number : null;
      const payload = {
        club_id: clubId,
        coach_id: form.use_manual_coach ? null : form.coach_id || null,
        coach_name: form.use_manual_coach ? form.coach_name_manual?.trim() || null : null,
        student_name: form.student_name?.trim() || null,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        court_id: form.court_id || null,
        location: courtNum ? `Kort ${courtNum}` : form.location?.trim() || null,
        notes: form.notes?.trim() || null,
        payment_status: form.payment_status || "unpaid",
        amount: form.amount ? Number(form.amount) : null
      };
      await sb.from("club_manual_lessons").insert(payload);
      if (form.court_id) {
        const startHH = (form.start_time || "").slice(0, 5);
        const endHH = (form.end_time || "").slice(0, 5);
        const [sh, sm] = startHH.split(":").map(Number);
        const [eh, em] = endHH.split(":").map(Number);
        const durationHours = (eh * 60 + em - sh * 60 - sm) / 60;
        let bookingUserId = clubId;
        if (!form.use_manual_coach && form.coach_id) {
          const { data: cc } = await sb.from("club_coaches").select("individual_coach_id").eq("id", form.coach_id).single();
          if (cc?.individual_coach_id) bookingUserId = cc.individual_coach_id;
        }
        const { error: bkErr } = await sb.from("bookings").insert({
          court_id: form.court_id,
          user_id: bookingUserId,
          start_time: `${form.date}T${startHH}:00+03:00`,
          end_time: `${form.date}T${endHH}:00+03:00`,
          status: "confirmed",
          is_solo_booking: false,
          duration_hours: durationHours,
          total_amount: form.amount ? Number(form.amount) : 0,
          club_coach_id: form.coach_id || null
        });
        if (bkErr) alert("Ders kaydedildi ancak kort takvime eklenemedi: " + bkErr.message);
      }
      setModal(null);
      loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const markPaid = async (lesson) => {
    if (!confirm(`Bu ders i\xE7in \xF6deme al\u0131nd\u0131 m\u0131?${lesson.amount ? ` (${fmtMoney(lesson.amount)})` : ""}`)) return;
    try {
      if (lesson.source === "booking") {
        await sb.from("bookings").update({ payment_status: "paid" }).eq("id", lesson.id);
      } else if (lesson.source === "lesson") {
        await sb.from("lessons").update({ payment_status: "paid" }).eq("id", lesson.id);
        if (lesson.amount > 0) {
          await sb.from("club_finances").insert({ club_id: clubId, type: "income", category: "Ders Geliri", amount: lesson.amount, description: `${lesson.coach_name}${lesson.student_name ? ` - ${lesson.student_name}` : ""} - Ders \xF6demesi`, date: lesson.date });
        }
      } else {
        await sb.from("club_manual_lessons").update({ payment_status: "paid" }).eq("id", lesson.id);
        if (lesson.amount > 0) {
          await sb.from("club_finances").insert({ club_id: clubId, type: "income", category: "Ders Geliri", amount: lesson.amount, description: `${lesson.coach_name}${lesson.student_name ? ` - ${lesson.student_name}` : ""} - Ders \xF6demesi`, date: lesson.date });
        }
      }
      loadAll();
    } catch (e) {
      alert(e.message);
    }
  };
  const deleteLesson = async (lesson) => {
    if (lesson.source === "booking") {
      alert("Rezervasyon kaynakl\u0131 dersler buradan silinemez.");
      return;
    }
    if (!confirm("Bu dersi silmek istedi\u011Finize emin misiniz?")) return;
    const table = lesson.source === "lesson" ? "lessons" : "club_manual_lessons";
    await sb.from(table).delete().eq("id", lesson.id);
    loadAll();
  };
  const srcBadge = (src) => {
    if (src === "booking") return /* @__PURE__ */ React.createElement(Badge, { cls: "b-info" }, "Rezervasyon");
    if (src === "lesson") return /* @__PURE__ */ React.createElement(Badge, { cls: "b-success" }, "Ders");
    return /* @__PURE__ */ React.createElement(Badge, { cls: "b-warning" }, "Manuel");
  };
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Dersler"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, lessons.length, " ders kay\u0131tl\u0131")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: () => {
    setForm({ date: todayISO(), start_time: "09:00", end_time: "10:00", payment_status: "unpaid", use_manual_coach: false });
    setModal({ type: "add" });
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), " Ders Ekle")), /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "table-toolbar" }, /* @__PURE__ */ React.createElement(Tabs, { items: tabItems, active: tab, onChange: setTab })), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : filtered.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "school",
      title: tab === "today" ? "Bug\xFCn ders yok" : tab === "upcoming" ? "Yakla\u015Fan ders yok" : "Ge\xE7mi\u015F ders yok"
    }
  ) : /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Tarih"), /* @__PURE__ */ React.createElement("th", null, "Saat"), /* @__PURE__ */ React.createElement("th", null, "\xD6\u011Frenci"), /* @__PURE__ */ React.createElement("th", null, "Ko\xE7"), /* @__PURE__ */ React.createElement("th", null, "Konum"), /* @__PURE__ */ React.createElement("th", null, "Kaynak"), /* @__PURE__ */ React.createElement("th", null, "\xD6deme"), /* @__PURE__ */ React.createElement("th", { className: "c-r" }, "\u0130\u015Flem"))), /* @__PURE__ */ React.createElement("tbody", null, filtered.map((l) => /* @__PURE__ */ React.createElement("tr", { key: `${l.source}-${l.id}` }, /* @__PURE__ */ React.createElement("td", { className: "c-strong" }, fmtDate(l.date)), /* @__PURE__ */ React.createElement("td", null, l.start_time, " \u2013 ", l.end_time), /* @__PURE__ */ React.createElement("td", null, l.student_name || /* @__PURE__ */ React.createElement("span", { className: "c-muted" }, "\u2014")), /* @__PURE__ */ React.createElement("td", null, l.coach_name), /* @__PURE__ */ React.createElement("td", { className: "c-muted" }, l.location), /* @__PURE__ */ React.createElement("td", null, srcBadge(l.source)), /* @__PURE__ */ React.createElement("td", null, l.payment_status === "paid" ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement(Badge, { cls: "b-success" }, "\xD6dendi"), l.amount > 0 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#22C55E", fontWeight: 700 } }, fmtMoney(l.amount))) : /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { fontSize: 11 }, onClick: () => markPaid(l) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "payments"), "\xD6deme Al", l.amount ? ` \xB7 ${fmtMoney(l.amount)}` : "")), /* @__PURE__ */ React.createElement("td", { className: "c-r" }, l.source !== "booking" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", onClick: () => deleteLesson(l) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "delete")))))))), modal?.type === "add" && /* @__PURE__ */ React.createElement(Modal, { title: "Ders Ekle", wide: true, onClose: () => setModal(null), footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: saveLesson, disabled: saving }, saving ? "Kaydediliyor\u2026" : "Kaydet")) }, /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Field, { label: "Antren\xF6r" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 8 } }, [{ key: false, label: "Listeden Se\xE7" }, { key: true, label: "Manuel Giri\u015F" }].map((opt) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: String(opt.key),
      type: "button",
      style: { flex: 1, padding: "8px", borderRadius: 10, border: "1.5px solid", borderColor: !!form.use_manual_coach === opt.key ? "var(--brand-navy)" : "var(--border)", background: !!form.use_manual_coach === opt.key ? "#EEF2FF" : "var(--bg)", fontWeight: 600, fontSize: 13, color: !!form.use_manual_coach === opt.key ? "var(--brand-navy)" : "var(--text-2)", cursor: "pointer" },
      onClick: () => setForm({ ...form, use_manual_coach: opt.key })
    },
    opt.label
  ))), form.use_manual_coach ? /* @__PURE__ */ React.createElement(
    "input",
    {
      value: form.coach_name_manual || "",
      placeholder: "Antren\xF6r ad\u0131",
      onChange: (e) => setForm({ ...form, coach_name_manual: e.target.value })
    }
  ) : /* @__PURE__ */ React.createElement("select", { value: form.coach_id || "", onChange: (e) => setForm({ ...form, coach_id: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Se\xE7in\u2026"), coaches.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.full_name)))), /* @__PURE__ */ React.createElement(Field, { label: "\xD6\u011Frenci Ad\u0131 (opsiyonel)" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: form.student_name || "",
      placeholder: "\xD6\u011Frenci ad\u0131 veya bo\u015F b\u0131rak\u0131n",
      onChange: (e) => setForm({ ...form, student_name: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement(Field, { label: "Tarih" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: form.date || "", onChange: (e) => setForm({ ...form, date: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Ba\u015Flang\u0131\xE7" }, /* @__PURE__ */ React.createElement("input", { type: "time", value: form.start_time || "", onChange: (e) => setForm({ ...form, start_time: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Biti\u015F" }, /* @__PURE__ */ React.createElement("input", { type: "time", value: form.end_time || "", onChange: (e) => setForm({ ...form, end_time: e.target.value }) }))), /* @__PURE__ */ React.createElement(Field, { label: "Kort" }, /* @__PURE__ */ React.createElement("select", { value: form.court_id || "", onChange: (e) => setForm({ ...form, court_id: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Se\xE7in\u2026"), courts.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, "Kort ", c.court_number)))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Ders \xDCcreti (\u20BA)" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      value: form.amount || "",
      placeholder: "0",
      onChange: (e) => setForm({ ...form, amount: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement(Field, { label: "\xD6deme Durumu" }, /* @__PURE__ */ React.createElement("select", { value: form.payment_status || "unpaid", onChange: (e) => setForm({ ...form, payment_status: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "unpaid" }, "\xD6denmedi"), /* @__PURE__ */ React.createElement("option", { value: "paid" }, "\xD6dendi")))), /* @__PURE__ */ React.createElement(Field, { label: "Not (opsiyonel)" }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 2,
      value: form.notes || "",
      placeholder: "Ders hakk\u0131nda not\u2026",
      onChange: (e) => setForm({ ...form, notes: e.target.value }),
      style: { resize: "vertical" }
    }
  )))));
}

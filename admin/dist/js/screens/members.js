const STATUS_LABELS = { pending: "Bekliyor", active: "Aktif", cancelled: "\u0130ptal", expired: "S\xFCresi Doldu" };
const STATUS_CLS = { pending: "b-warning", active: "b-success", cancelled: "b-danger", expired: "b-muted" };
const GENDER_LABELS = { male: "Erkek", female: "Kad\u0131n", other: "Di\u011Fer" };
function displayName(m) {
  if (m.profile?.full_name) return m.profile.full_name;
  if (m.member_name) return m.member_name;
  return "\u0130simsiz \xDCye";
}
function pkgMeta(pkg) {
  if (!pkg) return "Paketsiz";
  const parts = [];
  if (pkg.price != null) {
    const period = pkg.price_period === "monthly" ? "ay" : pkg.price_period === "yearly" ? "y\u0131l" : "tek";
    parts.push(`\u20BA${pkg.price}/${period}`);
  }
  parts.push(`${pkg.duration_days} g\xFCn`);
  if (pkg.court_extra_fee) parts.push(`+\u20BA${pkg.court_extra_fee}/rezervasyon`);
  if (pkg.weekly_court_hours_limit) parts.push(`Hft ${pkg.weekly_court_hours_limit}s`);
  if (pkg.cancellation_limit) parts.push(`${pkg.cancellation_limit} iptal`);
  if (pkg.penalty_no_reservation || pkg.penalty_full_price) parts.push("Yapt\u0131r\u0131ml\u0131");
  return parts.join(" \xB7 ");
}
function MemberProfileModal({ member, clubId, packages, onClose, onUpdated }) {
  const { useState, useEffect } = React;
  const [bookings, setBookings] = useState([]);
  const [loadingBk, setLoadingBk] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [loadingLs, setLoadingLs] = useState(true);
  const [playerGender, setPlayerGender] = useState(null);
  const [profileBirth, setProfileBirth] = useState(null);
  const [curPkgId, setCurPkgId] = useState(member.package_id || "");
  const [savingPkg, setSavingPkg] = useState(false);
  useEffect(() => {
    if (!member?.user_id) {
      setLoadingBk(false);
      return;
    }
    (async () => {
      setLoadingBk(true);
      try {
        const [courtIds, ppRes, profileRes] = await Promise.all([
          getClubCourtIds(clubId),
          sb.from("player_profiles").select("gender").eq("id", member.user_id).maybeSingle(),
          sb.from("profiles").select("birth_date").eq("id", member.user_id).maybeSingle()
        ]);
        setPlayerGender(ppRes.data?.gender ?? null);
        setProfileBirth(profileRes.data?.birth_date ?? null);
        if (courtIds.length === 0) {
          setLoadingBk(false);
          return;
        }
        const { data } = await sb.from("bookings").select("id, start_time, end_time, status, payment_status, total_amount, court:courts!bookings_court_id_fkey(court_number, court_type)").eq("user_id", member.user_id).in("court_id", courtIds).order("start_time", { ascending: false }).limit(20);
        setBookings(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingBk(false);
      }
    })();
  }, [member?.user_id, clubId]);
  useEffect(() => {
    const memberName = member.profile?.full_name || member.member_name || "";
    if (!member?.user_id && !memberName.trim()) {
      setLoadingLs(false);
      return;
    }
    (async () => {
      setLoadingLs(true);
      try {
        const ls = await CustomerSvc.getCustomerLessons(member.user_id || null, clubId, memberName, null);
        setLessons(ls || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingLs(false);
      }
    })();
  }, [member?.user_id, clubId]);
  const name = member.profile?.full_name || member.member_name || "\u0130simsiz \xDCye";
  const pkg = packages.find((p) => p.id === curPkgId);
  const STATUS_CLS2 = { confirmed: "b-success", completed: "b-muted", cancelled: "b-danger", pending: "b-warning" };
  const changePackage = async (newId) => {
    setSavingPkg(true);
    try {
      const { error } = await sb.from("club_memberships").update({ package_id: newId || null }).eq("id", member.id);
      if (error) throw error;
      setCurPkgId(newId);
      onUpdated && onUpdated();
    } catch (e) {
      alert(e.message || "Paket g\xFCncellenemedi.");
    } finally {
      setSavingPkg(false);
    }
  };
  return /* @__PURE__ */ React.createElement(Modal, { title: "\xDCye Profili", wide: true, onClose, footer: /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: onClose }, "Kapat") }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement(Av, { name, size: 56 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 18 } }, name), (member.member_email || member.profile?.email) && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)" } }, member.member_email || member.profile?.email), member.member_phone && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)" } }, member.member_phone))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { gap: 0, padding: 0, overflow: "hidden" } }, [
    { label: "Durum", value: STATUS_LABELS[member.status] || member.status },
    { label: "\xDCyelik Paketi", pkg: true },
    { label: "Kat\u0131l\u0131m Tarihi", value: member.join_date ? fmtDate(member.join_date) : "\u2014" },
    { label: "Cinsiyet", value: GENDER_LABELS[playerGender || member.gender] || "\u2014" },
    { label: "Do\u011Fum Tarihi", value: profileBirth || member.birth_date ? fmtDate(profileBirth || member.birth_date) : "\u2014" }
  ].map((row, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-2)" } }, row.label), row.pkg ? /* @__PURE__ */ React.createElement(
    "select",
    {
      value: curPkgId,
      onChange: (e) => changePackage(e.target.value),
      disabled: savingPkg,
      style: { fontSize: 13, fontWeight: 600, padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 6, background: "#fff", cursor: savingPkg ? "wait" : "pointer", maxWidth: 220 }
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Paketsiz"),
    packages.map((p) => /* @__PURE__ */ React.createElement("option", { key: p.id, value: p.id }, p.name))
  ) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600 } }, row.value))), pkg && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 14px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 } }, "PAKET DETAYLARI"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", display: "flex", flexDirection: "column", gap: 2 } }, pkg.price != null && /* @__PURE__ */ React.createElement("span", null, "Fiyat: ", fmtMoney(pkg.price), " / ", pkg.price_period === "monthly" ? "ay" : pkg.price_period === "yearly" ? "y\u0131l" : "tek seferlik"), pkg.duration_days && /* @__PURE__ */ React.createElement("span", null, "S\xFCre: ", pkg.duration_days, " g\xFCn"), pkg.weekly_court_hours_limit && /* @__PURE__ */ React.createElement("span", null, "Haftal\u0131k kort limiti: ", pkg.weekly_court_hours_limit, " saat"), pkg.cancellation_limit && /* @__PURE__ */ React.createElement("span", null, "Ayl\u0131k iptal limiti: ", pkg.cancellation_limit), pkg.court_extra_fee && /* @__PURE__ */ React.createElement("span", null, "Rezervasyon ek \xFCcreti: ", fmtMoney(pkg.court_extra_fee))))), member.user_id && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, marginBottom: 8 } }, "Son Rezervasyonlar"), loadingBk ? /* @__PURE__ */ React.createElement(Spinner, null) : bookings.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", textAlign: "center", padding: "12px 0" } }, "Hen\xFCz rezervasyon yok.") : /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, bookings.map((b, i) => {
    const start = b.start_time ? new Date(b.start_time) : null;
    return /* @__PURE__ */ React.createElement("div", { key: b.id, style: { display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, borderBottom: i < bookings.length - 1 ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, "Kort ", b.court?.court_number || "?", " \u2014 ", b.court?.court_type || ""), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, start ? start.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "\u2014", start ? ` ${start.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}` : "")), /* @__PURE__ */ React.createElement(Badge, { cls: STATUS_CLS2[b.status] || "b-muted" }, b.status === "confirmed" ? "Onayl\u0131" : b.status === "completed" ? "Tamamland\u0131" : b.status === "cancelled" ? "\u0130ptal" : b.status), b.total_amount != null && /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 13 } }, fmtMoney(b.total_amount)));
  }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, marginBottom: 8 } }, "Son Dersler"), loadingLs ? /* @__PURE__ */ React.createElement(Spinner, null) : lessons.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", textAlign: "center", padding: "12px 0" } }, "Hen\xFCz ders yok.") : /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, lessons.map((l, i) => {
    const start = l.start_time ? new Date(l.start_time) : null;
    const paid = l.payment_status === "paid";
    return /* @__PURE__ */ React.createElement("div", { key: l.id, style: { display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, borderBottom: i < lessons.length - 1 ? "1px solid var(--border)" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, l.coach_name || "Antren\xF6r", l.location ? ` \u2014 ${l.location}` : ""), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, start ? start.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "\u2014", start ? ` ${start.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}` : "", l.is_package_lesson ? " \xB7 Paket" : "")), /* @__PURE__ */ React.createElement(Badge, { cls: paid ? "b-success" : "b-warning" }, paid ? "\xD6dendi" : "\xD6denmedi"), l.amount != null && Number(l.amount) > 0 && /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 13 } }, fmtMoney(l.amount)));
  })))));
}
function MembersScreen({ clubId }) {
  const { useState, useEffect, useCallback } = React;
  const [members, setMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("members");
  const [approvingId, setApprovingId] = useState(null);
  const [profileMember, setProfileMember] = useState(null);
  const [addVisible, setAddVisible] = useState(false);
  const [addMode, setAddMode] = useState("manual");
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualBirth, setManualBirth] = useState("");
  const [manualGender, setManualGender] = useState("");
  const [manualPkgId, setManualPkgId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pkgVisible, setPkgVisible] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [pkgForm, setPkgForm] = useState({});
  const [savingPkg, setSavingPkg] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const loadData = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      try {
        await sb.rpc("expire_past_memberships");
      } catch {
      }
      const [memRes, pkgRes] = await Promise.all([
        sb.from("club_memberships").select("*, package:club_membership_packages(*), profile:profiles(id, full_name, profile_photo_url)").eq("club_id", clubId).order("created_at", { ascending: false }),
        sb.from("club_membership_packages").select("*").eq("club_id", clubId).order("created_at", { ascending: true })
      ]);
      setMembers(memRes.data || []);
      setPackages(pkgRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [clubId]);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const approveM = async (m) => {
    setApprovingId(m.id);
    try {
      await sb.from("club_memberships").update({ status: "active" }).eq("id", m.id);
      if (m.profile?.id || m.user_id) {
        const uid = m.profile?.id || m.user_id;
        const { data: club } = await sb.from("club_profiles").select("club_name").eq("id", clubId).single();
        await sb.from("notifications").insert({
          user_id: uid,
          type: "membership_approved",
          title: "\xDCyelik Onayland\u0131",
          message: `${club?.club_name ?? "Kul\xFCp"} kul\xFCb\xFCne \xFCyeli\u011Finiz onayland\u0131.`,
          is_read: false
        });
      }
      loadData();
    } catch (e) {
      alert(e.message);
    } finally {
      setApprovingId(null);
    }
  };
  const rejectM = async (m) => {
    if (!confirm("Bu \xFCyeyi iptal etmek istedi\u011Finize emin misiniz?")) return;
    try {
      await sb.from("club_memberships").update({ status: "cancelled" }).eq("id", m.id);
      if (m.profile?.id || m.user_id) {
        const uid = m.profile?.id || m.user_id;
        const { data: club } = await sb.from("club_profiles").select("club_name").eq("id", clubId).single();
        await sb.from("notifications").insert({
          user_id: uid,
          type: "membership_rejected",
          title: "\xDCyelik Reddedildi",
          message: `${club?.club_name ?? "Kul\xFCp"} kul\xFCb\xFCne \xFCyelik ba\u015Fvurunuz reddedildi.`,
          is_read: false
        });
      }
      loadData();
    } catch (e) {
      alert(e.message);
    }
  };
  const [searchError, setSearchError] = useState("");
  const handleSearch = async (q) => {
    setSearchQuery(q);
    setSearchError("");
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const safe = q.replace(/[,()]/g, " ").trim();
      const { data, error } = await sb.from("profiles").select("id, full_name, profile_photo_url, phone, email, birth_date").or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`).eq("user_type", "player").limit(10);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (e) {
      console.error("Search error:", e);
      setSearchError(e.message || "Arama s\u0131ras\u0131nda hata olu\u015Ftu");
      setSearchResults([]);
    }
    setSearching(false);
  };
  const resetAddForm = () => {
    setManualName("");
    setManualPhone("");
    setManualEmail("");
    setManualBirth("");
    setManualGender("");
    setManualPkgId("");
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    setAddMode("manual");
  };
  const handleAddManual = async () => {
    if (!manualName.trim()) {
      alert("\u0130sim zorunludur.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await sb.from("club_memberships").insert({
        club_id: clubId,
        package_id: manualPkgId || null,
        user_id: null,
        member_name: manualName.trim(),
        member_phone: manualPhone.trim() || null,
        member_email: manualEmail.trim() || null,
        gender: manualGender || null,
        birth_date: manualBirth.trim() || null,
        status: "active",
        join_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      });
      if (error) throw error;
      setAddVisible(false);
      resetAddForm();
      loadData();
    } catch (e) {
      const msg = e.message ?? "";
      alert(msg.includes("uq_club_user_membership") ? "Bu ki\u015Fi kul\xFCb\xFCn\xFCze zaten kay\u0131tl\u0131." : msg || "\xDCye eklenemedi.");
    } finally {
      setSaving(false);
    }
  };
  const handleAddFromSearch = async (profile) => {
    setSaving(true);
    try {
      let gender = null;
      try {
        const { data: pp } = await sb.from("player_profiles").select("gender").eq("id", profile.id).maybeSingle();
        gender = pp?.gender || null;
      } catch (_) {
      }
      const { error } = await sb.from("club_memberships").insert({
        club_id: clubId,
        package_id: manualPkgId || null,
        user_id: profile.id,
        member_name: profile.full_name,
        member_phone: profile.phone || null,
        member_email: profile.email || null,
        birth_date: profile.birth_date || null,
        gender,
        status: "active",
        join_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      });
      if (error) throw error;
      try {
        const { data: club } = await sb.from("club_profiles").select("club_name").eq("id", clubId).single();
        await sb.from("notifications").insert({
          user_id: profile.id,
          type: "membership_approved",
          title: "Kul\xFCp \xDCyeli\u011Fi",
          message: `${club?.club_name || "Bir kul\xFCp"} sizi \xFCye olarak ekledi. Bir sorun varsa kul\xFCple ileti\u015Fime ge\xE7in.`,
          is_read: false
        });
      } catch (_) {
      }
      setAddVisible(false);
      resetAddForm();
      loadData();
    } catch (e) {
      const msg = e.message ?? "";
      alert(msg.includes("uq_club_user_membership") ? "Bu ki\u015Fi kul\xFCb\xFCn\xFCze zaten kay\u0131tl\u0131." : msg || "\xDCye eklenemedi.");
    } finally {
      setSaving(false);
    }
  };
  const openNewPkg = () => {
    setEditPkg(null);
    setPkgForm({
      price_period: "monthly",
      duration_days: 30,
      allow_guest: true,
      valid_days: "all",
      penalty_no_reservation: false,
      penalty_full_price: false,
      is_active: true
    });
    setPkgVisible(true);
  };
  const openEditPkg = (pkg) => {
    setEditPkg(pkg);
    setPkgForm({ ...pkg });
    setPkgVisible(true);
  };
  const handleSavePkg = async () => {
    if (!pkgForm.name?.trim()) {
      alert("Paket ad\u0131 zorunludur.");
      return;
    }
    if (pkgForm.penalty_no_reservation && !pkgForm.penalty_duration_days) {
      alert("Rezervasyon yapamamas\u0131 yapt\u0131r\u0131m\u0131 i\xE7in ka\xE7 g\xFCn oldu\u011Funu belirtin.");
      return;
    }
    setSavingPkg(true);
    try {
      const noPenalty = !pkgForm.penalty_no_reservation && !pkgForm.penalty_full_price;
      const payload = {
        name: pkgForm.name.trim(),
        description: pkgForm.description?.trim() || null,
        price: pkgForm.price ? parseFloat(pkgForm.price) : null,
        price_period: pkgForm.price_period || "monthly",
        duration_days: parseInt(pkgForm.duration_days) || 30,
        court_extra_fee: pkgForm.court_extra_fee ? parseFloat(pkgForm.court_extra_fee) : null,
        weekly_court_hours_limit: pkgForm.weekly_court_hours_limit ? parseFloat(pkgForm.weekly_court_hours_limit) : null,
        cancellation_limit: pkgForm.cancellation_limit ? parseInt(pkgForm.cancellation_limit) : null,
        penalty_no_reservation: noPenalty ? false : !!pkgForm.penalty_no_reservation,
        penalty_full_price: noPenalty ? false : !!pkgForm.penalty_full_price,
        penalty_duration_days: pkgForm.penalty_no_reservation && pkgForm.penalty_duration_days ? parseInt(pkgForm.penalty_duration_days) : null,
        allow_guest: pkgForm.allow_guest !== false,
        guest_primetime_only: !!(pkgForm.allow_guest && pkgForm.guest_primetime_start && pkgForm.guest_primetime_end),
        guest_primetime_start: pkgForm.allow_guest && pkgForm.guest_primetime_start ? pkgForm.guest_primetime_start : null,
        guest_primetime_end: pkgForm.allow_guest && pkgForm.guest_primetime_end ? pkgForm.guest_primetime_end : null,
        guest_fee: pkgForm.allow_guest && pkgForm.guest_fee ? parseFloat(pkgForm.guest_fee) : null,
        valid_days: pkgForm.valid_days || "all",
        is_active: pkgForm.is_active !== false
      };
      if (editPkg) {
        await sb.from("club_membership_packages").update(payload).eq("id", editPkg.id);
      } else {
        await sb.from("club_membership_packages").insert({ club_id: clubId, ...payload });
      }
      setPkgVisible(false);
      loadData();
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingPkg(false);
    }
  };
  const togglePkg = async (pkg) => {
    if (!confirm(`"${pkg.name}" paketini ${pkg.is_active ? "pasifle\u015Ftirmek" : "aktifle\u015Ftirmek"} istedi\u011Finizden emin misiniz?`)) return;
    await sb.from("club_membership_packages").update({ is_active: !pkg.is_active }).eq("id", pkg.id);
    loadData();
  };
  const filtered = members.filter((m) => {
    if (filter !== "all" && m.status !== filter) return false;
    if (search) {
      const q = search.toLocaleLowerCase("tr-TR");
      return displayName(m).toLocaleLowerCase("tr-TR").includes(q) || (m.member_email || m.profile?.email || "").toLocaleLowerCase("tr-TR").includes(q);
    }
    return true;
  });
  const pendingCount = members.filter((m) => m.status === "pending").length;
  const TAB_ITEMS = [
    { key: "all", label: "T\xFCm\xFC", count: members.length },
    { key: "active", label: "Aktif", count: members.filter((m) => m.status === "active").length },
    { key: "pending", label: "Bekliyor", count: pendingCount },
    { key: "cancelled", label: "\u0130ptal", count: members.filter((m) => m.status === "cancelled").length },
    { key: "expired", label: "S\xFCresi Doldu", count: members.filter((m) => m.status === "expired").length }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "\xDCyeler"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, members.length, " \xFCye kay\u0131tl\u0131", pendingCount > 0 ? ` \xB7 ${pendingCount} bekliyor` : "")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "tabs" }, /* @__PURE__ */ React.createElement("button", { className: view === "members" ? "active" : "", onClick: () => setView("members") }, "\xDCyeler"), /* @__PURE__ */ React.createElement("button", { className: view === "packages" ? "active" : "", onClick: () => setView("packages") }, "Paketler")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => setBroadcastOpen(true), title: "Toplu bildirim g\xF6nder" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "campaign"), " Toplu Bildirim"), view === "members" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: () => {
    resetAddForm();
    setAddVisible(true);
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "person_add"), " \xDCye Ekle"), view === "packages" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: openNewPkg }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), " Paket Ekle"))), view === "members" && /* @__PURE__ */ React.createElement("div", { className: "table-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "table-toolbar" }, /* @__PURE__ */ React.createElement("div", { className: "search" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "search"), /* @__PURE__ */ React.createElement("input", { placeholder: "\u0130sim veya e-posta ara\u2026", value: search, onChange: (e) => setSearch(e.target.value) })), /* @__PURE__ */ React.createElement(Tabs, { items: TAB_ITEMS, active: filter, onChange: setFilter })), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : filtered.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "group", title: "\xDCye bulunamad\u0131", sub: "\xDCye eklemek i\xE7in + butonunu kullan\u0131n." }) : /* @__PURE__ */ React.createElement("div", null, filtered.map((m) => /* @__PURE__ */ React.createElement("div", { key: m.id, className: "member-card" }, /* @__PURE__ */ React.createElement(Av, { name: displayName(m) }), /* @__PURE__ */ React.createElement("div", { className: "info" }, /* @__PURE__ */ React.createElement("div", { className: "n" }, displayName(m)), /* @__PURE__ */ React.createElement("div", { className: "s" }, m.package?.name ?? "Paketsiz", m.join_date ? ` \xB7 ${fmtDate(m.join_date)}` : "", m.member_phone || m.member_email ? ` \xB7 ${m.member_phone || m.member_email}` : "")), /* @__PURE__ */ React.createElement(Badge, { cls: STATUS_CLS[m.status] || "" }, STATUS_LABELS[m.status] || m.status), /* @__PURE__ */ React.createElement("div", { className: "actions" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", title: "Profil Detay\u0131", onClick: () => setProfileMember(m) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "person")), m.status === "pending" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-success btn-sm",
      onClick: () => approveM(m),
      disabled: approvingId === m.id
    },
    approvingId === m.id ? /* @__PURE__ */ React.createElement(Spinner, { size: 14 }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "check"), " Onayla")
  ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", onClick: () => rejectM(m) }, "Reddet")), m.status === "active" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => rejectM(m) }, "\u0130ptal Et")))))), view === "packages" && /* @__PURE__ */ React.createElement("div", null, loading ? /* @__PURE__ */ React.createElement(Spinner, null) : packages.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "card_membership", title: "Hen\xFCz paket yok", sub: "\u0130lk \xFCyelik paketinizi olu\u015Fturun." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 } }, packages.map((pkg) => /* @__PURE__ */ React.createElement("div", { key: pkg.id, className: "card", style: { opacity: pkg.is_active ? 1 : 0.6 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 17 } }, pkg.name), pkg.price != null && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 800, color: "var(--brand-navy)", marginTop: 4 } }, fmtMoney(pkg.price), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 500, color: "var(--text-2)", marginLeft: 4 } }, "/", pkg.price_period === "monthly" ? "ay" : pkg.price_period === "yearly" ? "y\u0131l" : "tek")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2 } }, pkg.duration_days, " g\xFCn")), /* @__PURE__ */ React.createElement(Badge, { cls: pkg.is_active ? "b-success" : "b-muted" }, pkg.is_active ? "Aktif" : "Pasif")), pkg.description && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--text-2)", marginBottom: 10 } }, pkg.description), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 } }, pkg.weekly_court_hours_limit && /* @__PURE__ */ React.createElement("span", null, "Haftal\u0131k kort limiti: ", pkg.weekly_court_hours_limit, " saat"), pkg.court_extra_fee && /* @__PURE__ */ React.createElement("span", null, "Rezervasyon ek \xFCcreti: ", fmtMoney(pkg.court_extra_fee)), pkg.cancellation_limit && /* @__PURE__ */ React.createElement("span", null, "Ayl\u0131k iptal limiti: ", pkg.cancellation_limit), pkg.valid_days && pkg.valid_days !== "all" && /* @__PURE__ */ React.createElement("span", null, "Ge\xE7erli: ", pkg.valid_days === "weekdays" ? "Hafta i\xE7i" : "Hafta sonu"), pkg.allow_guest === false && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--danger)" } }, "Misafir yasak"), pkg.guest_fee && /* @__PURE__ */ React.createElement("span", null, "Misafir \xFCcreti: ", fmtMoney(pkg.guest_fee)), (pkg.penalty_no_reservation || pkg.penalty_full_price) && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--warning)" } }, "Yapt\u0131r\u0131m uygulan\u0131r")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { flex: 1 }, onClick: () => openEditPkg(pkg) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "edit"), " D\xFCzenle"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => togglePkg(pkg) }, pkg.is_active ? "Pasifle\u015Ftir" : "Aktifle\u015Ftir")))))), addVisible && /* @__PURE__ */ React.createElement(Modal, { title: "\xDCye Ekle", wide: true, onClose: () => {
    setAddVisible(false);
    resetAddForm();
  }, footer: addMode === "manual" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => {
    setAddVisible(false);
    resetAddForm();
  } }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: handleAddManual, disabled: saving }, saving ? "Ekleniyor\u2026" : "Kaydet")) : null }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", borderRadius: 10, overflow: "hidden", border: "1.5px solid var(--border)", marginBottom: 18 } }, ["manual", "search"].map((m) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: m,
      style: {
        flex: 1,
        padding: "9px 0",
        fontWeight: 600,
        fontSize: 13,
        border: "none",
        cursor: "pointer",
        background: addMode === m ? "var(--brand-navy)" : "transparent",
        color: addMode === m ? "#fff" : "var(--text-2)"
      },
      onClick: () => setAddMode(m)
    },
    m === "manual" ? "Manuel" : "Kullan\u0131c\u0131 Ara"
  ))), addMode === "manual" ? /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "\u0130sim Soyisim *" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Ad Soyad", value: manualName, onChange: (e) => setManualName(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Telefon" }, /* @__PURE__ */ React.createElement("input", { placeholder: "05XX XXX XX XX", value: manualPhone, onChange: (e) => setManualPhone(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "E-posta" }, /* @__PURE__ */ React.createElement("input", { type: "email", placeholder: "ornek@mail.com", value: manualEmail, onChange: (e) => setManualEmail(e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Do\u011Fum Tarihi" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: manualBirth, onChange: (e) => setManualBirth(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Cinsiyet" }, /* @__PURE__ */ React.createElement("select", { value: manualGender, onChange: (e) => setManualGender(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Se\xE7in\u2026"), /* @__PURE__ */ React.createElement("option", { value: "male" }, "Erkek"), /* @__PURE__ */ React.createElement("option", { value: "female" }, "Kad\u0131n"), /* @__PURE__ */ React.createElement("option", { value: "other" }, "Di\u011Fer")))), /* @__PURE__ */ React.createElement(Field, { label: "\xDCyelik Paketi" }, /* @__PURE__ */ React.createElement("select", { value: manualPkgId, onChange: (e) => setManualPkgId(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Paketsiz"), packages.filter((p) => p.is_active).map((p) => /* @__PURE__ */ React.createElement("option", { key: p.id, value: p.id }, p.name, p.price != null ? ` \u2014 ${fmtMoney(p.price)}` : ""))))) : /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "search", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "search"), /* @__PURE__ */ React.createElement(
    "input",
    {
      placeholder: "\u0130simle kullan\u0131c\u0131 ara\u2026",
      value: searchQuery,
      onChange: (e) => handleSearch(e.target.value),
      autoComplete: "off"
    }
  )), searching && /* @__PURE__ */ React.createElement(Spinner, { size: 24 }), searchError && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--danger)", fontSize: 13, padding: "8px 12px", background: "#FEF2F2", borderRadius: 8 } }, searchError), searchResults.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" } }, searchResults.map((p) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: p.id,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        cursor: saving ? "default" : "pointer",
        opacity: saving ? 0.7 : 1,
        borderBottom: "1px solid var(--border)"
      },
      onClick: () => !saving && handleAddFromSearch(p)
    },
    /* @__PURE__ */ React.createElement("div", { style: {
      width: 36,
      height: 36,
      borderRadius: 18,
      flexShrink: 0,
      background: "rgba(0,51,153,0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    } }, p.profile_photo_url ? /* @__PURE__ */ React.createElement("img", { src: p.profile_photo_url, alt: p.full_name, style: { width: 36, height: 36, borderRadius: 18, objectFit: "cover" } }) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: "#003399" } }, (p.full_name || "?").charAt(0).toUpperCase())),
    /* @__PURE__ */ React.createElement("div", { style: { flex: 1, fontWeight: 600, fontSize: 13 } }, p.full_name),
    saving && /* @__PURE__ */ React.createElement(Spinner, { size: 14 })
  ))), searchQuery.length >= 2 && searchResults.length === 0 && !searching && !searchError && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text-2)", fontSize: 13, textAlign: "center", padding: "12px 0" } }, "Kullan\u0131c\u0131 bulunamad\u0131"), /* @__PURE__ */ React.createElement(Field, { label: "\xDCyelik Paketi" }, /* @__PURE__ */ React.createElement("select", { value: manualPkgId, onChange: (e) => setManualPkgId(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Paketsiz"), packages.filter((p) => p.is_active).map((p) => /* @__PURE__ */ React.createElement("option", { key: p.id, value: p.id }, p.name, p.price != null ? ` \u2014 ${fmtMoney(p.price)}` : "")))))), profileMember && /* @__PURE__ */ React.createElement(
    MemberProfileModal,
    {
      member: profileMember,
      clubId,
      packages,
      onClose: () => setProfileMember(null),
      onUpdated: loadData
    }
  ), pkgVisible && /* @__PURE__ */ React.createElement(Modal, { title: editPkg ? "Paketi D\xFCzenle" : "Yeni Paket", wide: true, onClose: () => setPkgVisible(false), footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setPkgVisible(false) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: handleSavePkg, disabled: savingPkg }, savingPkg ? "Kaydediliyor\u2026" : "Kaydet")) }, /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Field, { label: "Paket Ad\u0131 *" }, /* @__PURE__ */ React.createElement("input", { placeholder: "\xD6rn: Ayl\u0131k \xDCyelik", value: pkgForm.name || "", onChange: (e) => setPkgForm({ ...pkgForm, name: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "A\xE7\u0131klama" }, /* @__PURE__ */ React.createElement("textarea", { rows: 2, placeholder: "Paket a\xE7\u0131klamas\u0131\u2026", value: pkgForm.description || "", onChange: (e) => setPkgForm({ ...pkgForm, description: e.target.value }), style: { resize: "vertical" } })), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Fiyat (\u20BA)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 0, placeholder: "0", value: pkgForm.price ?? "", onChange: (e) => setPkgForm({ ...pkgForm, price: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Fiyatland\u0131rma D\xF6nemi" }, /* @__PURE__ */ React.createElement("select", { value: pkgForm.price_period || "monthly", onChange: (e) => setPkgForm({ ...pkgForm, price_period: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "monthly" }, "Ayl\u0131k"), /* @__PURE__ */ React.createElement("option", { value: "yearly" }, "Y\u0131ll\u0131k"), /* @__PURE__ */ React.createElement("option", { value: "once" }, "Tek Seferlik")))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "S\xFCre (g\xFCn)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 1, placeholder: "30", value: pkgForm.duration_days || "", onChange: (e) => setPkgForm({ ...pkgForm, duration_days: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Ge\xE7erli G\xFCnler" }, /* @__PURE__ */ React.createElement("select", { value: pkgForm.valid_days || "all", onChange: (e) => setPkgForm({ ...pkgForm, valid_days: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "Her G\xFCn"), /* @__PURE__ */ React.createElement("option", { value: "weekdays" }, "Hafta \u0130\xE7i"), /* @__PURE__ */ React.createElement("option", { value: "weekends" }, "Hafta Sonu")))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Rezervasyon Ek \xDCcreti (\u20BA)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 0, placeholder: "Yok", value: pkgForm.court_extra_fee ?? "", onChange: (e) => setPkgForm({ ...pkgForm, court_extra_fee: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Haftal\u0131k Kort Limiti (saat)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 0, placeholder: "S\u0131n\u0131rs\u0131z", value: pkgForm.weekly_court_hours_limit ?? "", onChange: (e) => setPkgForm({ ...pkgForm, weekly_court_hours_limit: e.target.value }) }))), /* @__PURE__ */ React.createElement(Field, { label: "Ayl\u0131k \u0130ptal Limiti" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 0, placeholder: "S\u0131n\u0131rs\u0131z", value: pkgForm.cancellation_limit ?? "", onChange: (e) => setPkgForm({ ...pkgForm, cancellation_limit: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg)", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--text-2)", marginBottom: 2 } }, "\xDCye Olmayan ile Oynama"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, [true, false].map((v) => /* @__PURE__ */ React.createElement("label", { key: String(v), style: { display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 14 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "radio",
      checked: pkgForm.allow_guest !== false ? v === true : v === false,
      onChange: () => setPkgForm({
        ...pkgForm,
        allow_guest: v,
        guest_primetime_start: v ? pkgForm.guest_primetime_start : "",
        guest_primetime_end: v ? pkgForm.guest_primetime_end : "",
        guest_fee: v ? pkgForm.guest_fee : ""
      })
    }
  ), v ? "\u0130zinli" : "Yasak"))), pkgForm.allow_guest !== false && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "Misafir \xDCcreti (\u20BA/rezervasyon)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 0, placeholder: "\xDCcretsiz", value: pkgForm.guest_fee ?? "", onChange: (e) => setPkgForm({ ...pkgForm, guest_fee: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginBottom: 4 } }, "Primetime saatleri (bu saatlerde misafir yasak \u2014 bo\u015F b\u0131rak\u0131rsan\u0131z k\u0131s\u0131tlama yok)"), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Ba\u015Flang\u0131\xE7" }, /* @__PURE__ */ React.createElement("input", { type: "time", value: pkgForm.guest_primetime_start || "", onChange: (e) => setPkgForm({ ...pkgForm, guest_primetime_start: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Biti\u015F" }, /* @__PURE__ */ React.createElement("input", { type: "time", value: pkgForm.guest_primetime_end || "", onChange: (e) => setPkgForm({ ...pkgForm, guest_primetime_end: e.target.value }) }))))), pkgForm.cancellation_limit && /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg)", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--text-2)", marginBottom: 2 } }, "Limit A\u015F\u0131l\u0131nca Yapt\u0131r\u0131m"), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: !!pkgForm.penalty_no_reservation,
      onChange: (e) => setPkgForm({ ...pkgForm, penalty_no_reservation: e.target.checked, penalty_full_price: e.target.checked ? false : pkgForm.penalty_full_price })
    }
  ), "Rezervasyon yapamamas\u0131"), pkgForm.penalty_no_reservation && /* @__PURE__ */ React.createElement(Field, { label: "Ka\xE7 g\xFCn?" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 1, placeholder: "G\xFCn say\u0131s\u0131", value: pkgForm.penalty_duration_days || "", onChange: (e) => setPkgForm({ ...pkgForm, penalty_duration_days: e.target.value }) })), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: !!pkgForm.penalty_full_price,
      onChange: (e) => setPkgForm({ ...pkgForm, penalty_full_price: e.target.checked, penalty_no_reservation: e.target.checked ? false : pkgForm.penalty_no_reservation })
    }
  ), "O haftaki rezervasyonlar\u0131 normal \xFCcretle")), /* @__PURE__ */ React.createElement(Switch, { on: pkgForm.is_active !== false, onChange: (v) => setPkgForm({ ...pkgForm, is_active: v }), label: "Aktif Paket" }))), broadcastOpen && /* @__PURE__ */ React.createElement(ClubBroadcastModal, { clubId, initialAudience: "members", onClose: () => setBroadcastOpen(false) }));
}

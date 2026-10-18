function ClubProfileScreen({ clubId, clubProfile: initialProfile }) {
  const { useState, useEffect } = React;
  const [profile, setProfile] = useState(initialProfile || {});
  const [loading, setLoading] = useState(!initialProfile);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState(false);
  useEffect(() => {
    if (clubId && !initialProfile) load();
  }, [clubId]);
  const load = async () => {
    setLoading(true);
    const { data } = await sb.from("club_profiles").select("*").eq("id", clubId).maybeSingle();
    if (data) {
      if (!data.contact_email) {
        const { data: { user } } = await sb.auth.getUser();
        if (user?.email) data.contact_email = user.email;
      }
      setProfile(data);
    }
    setLoading(false);
  };
  const extractCoords = (link) => {
    try {
      const atMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) return { lat: atMatch[1], lng: atMatch[2] };
      const qMatch = link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) return { lat: qMatch[1], lng: qMatch[2] };
      const placeMatch = link.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (placeMatch) return { lat: placeMatch[1], lng: placeMatch[2] };
    } catch {
    }
    return null;
  };
  const openEdit = () => {
    const oh = typeof profile.opening_hours === "object" && profile.opening_hours ? profile.opening_hours : { open: "09:00", close: "22:00" };
    const lh = typeof profile.light_hours === "object" && profile.light_hours ? profile.light_hours : { open: "18:00", close: "22:00" };
    const am = Array.isArray(profile.amenities) ? profile.amenities : (profile.amenities || "").split(",").map((s) => s.trim()).filter(Boolean);
    setForm({
      ...profile,
      opening_hours: oh,
      light_hours: lh,
      amenities: am,
      is_visible: profile.is_visible !== false,
      requires_booking_approval: profile.requires_booking_approval === true,
      has_membership_system: profile.has_membership_system !== false,
      has_cafe_system: profile.has_cafe_system !== false,
      has_employee_system: profile.has_employee_system !== false,
      max_reservation_duration: profile.max_reservation_duration || 120,
      booking_open_hour: profile.booking_open_hour ?? 0
    });
    setModal("edit");
  };
  const [logoBusy, setLogoBusy] = useState(false);
  const uploadLogo = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("L\xFCtfen bir g\xF6rsel dosyas\u0131 se\xE7in.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Logo 5 MB\u2019tan k\xFC\xE7\xFCk olmal\u0131.");
      return;
    }
    setLogoBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `club-logos/${clubId}/${Date.now()}.${ext}`;
      const { error } = await sb.storage.from("club-photos").upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = sb.storage.from("club-photos").getPublicUrl(path);
      setForm((prev) => ({ ...prev, logo_url: data.publicUrl }));
    } catch (e) {
      alert("Logo y\xFCklenemedi: " + e.message);
    } finally {
      setLogoBusy(false);
    }
  };
  const [secQuery, setSecQuery] = useState("");
  const [secOpenMap, setSecOpenMap] = useState({});
  const secToggle = (t) => setSecOpenMap((prev) => ({ ...prev, [t]: !prev[t] }));
  const SEC_KEYWORDS = {
    "Temel Bilgiler": "isim ad logo a\xE7\u0131klama \u015Fehir adres telefon eposta website",
    "Konum": "harita koordinat enlem boylam google maps",
    "Tesis Detaylar\u0131": "kort say\u0131s\u0131 \u0131\u015F\u0131k \xFCcret \xE7al\u0131\u015Fma saati a\xE7\u0131l\u0131\u015F kapan\u0131\u015F",
    "Sistem Ayarlar\u0131": "\xFCyelik kafe market \xE7al\u0131\u015Fan personel",
    "Rezervasyon Ayarlar\u0131": "s\xFCre ka\xE7 g\xFCn \xF6nce a\xE7\u0131l\u0131\u015F haftal\u0131k primetime iptal limiti onay",
    "Hoca \u0130zinleri": "antren\xF6r ders ekleme paket zorunlu slot kilidi",
    "Ders \u0130ptal Politikas\u0131": "ge\xE7 iptal yap\u0131ld\u0131 say\u0131l\u0131r saat e\u015Fik ceza",
    "Ders Paketi Kurallar\u0131": "whatsapp mesaj \u015Fablon paket kurallar\u0131",
    "Hocalara Haftal\u0131k Ders A\xE7\u0131l\u0131\u015F\u0131": "pencere a\xE7\u0131l\u0131\u015F g\xFCn\xFC saat seri tekrarlayan",
    "Olanaklar": "amenity du\u015F otopark kafeterya \xF6zellik"
  };
  const _sq = trFold(secQuery.trim());
  const secVisible = (t) => !_sq || trFold(`${t} ${SEC_KEYWORDS[t] || ""}`).includes(_sq);
  const secOpen = (t) => _sq ? true : !!secOpenMap[t];
  const saveProfile = async () => {
    setSaving(true);
    try {
      const clampInt = (raw, min, max, fallback) => {
        const n = parseInt(raw, 10);
        if (isNaN(n)) return fallback;
        return Math.min(max, Math.max(min, n));
      };
      const payload = {
        club_name: form.club_name,
        description: form.description || null,
        // city FORMDA VARDI AMA KAYDEDİLMİYORDU — kullanıcı yazıyor, kayboluyordu
        city: form.city || null,
        logo_url: form.logo_url || null,
        address: form.address || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        website: form.website || null,
        google_maps_link: form.google_maps_link || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        number_of_courts: form.number_of_courts ? Number(form.number_of_courts) : null,
        light_fee: form.light_fee ? Number(form.light_fee) : null,
        opening_hours: form.opening_hours || null,
        light_hours: form.light_hours || null,
        amenities: Array.isArray(form.amenities) ? form.amenities : [],
        is_visible: form.is_visible !== false,
        requires_booking_approval: form.requires_booking_approval === true,
        has_membership_system: form.has_membership_system !== false,
        has_cafe_system: form.has_cafe_system !== false,
        has_employee_system: form.has_employee_system !== false,
        max_reservation_duration: form.max_reservation_duration ? Number(form.max_reservation_duration) : 120,
        max_advance_booking_days: form.max_advance_booking_days ? Number(form.max_advance_booking_days) : null,
        booking_open_hour: form.booking_open_hour != null ? Number(form.booking_open_hour) : 0,
        primetime_start: form.primetime_start || null,
        primetime_end: form.primetime_end || null,
        non_member_cancellation_limit: form.non_member_cancellation_limit ? Number(form.non_member_cancellation_limit) : null,
        non_member_cancellation_penalty_days: form.non_member_cancellation_penalty_days ? Number(form.non_member_cancellation_penalty_days) : null,
        // ── Mobille eşitlenen ayarlar ──────────────────────────────────────
        // İzin verilen süreler: boş bırakılamaz (oyuncuya hiç seçenek kalmaz)
        allowed_reservation_durations: Array.isArray(form.allowed_reservation_durations) && form.allowed_reservation_durations.length > 0 ? form.allowed_reservation_durations : [60, 90, 120],
        // Haftalık rezervasyon açılışı (oyuncu)
        booking_weekly_release: form.booking_weekly_release === true,
        booking_release_day_of_week: form.booking_release_day_of_week != null ? Number(form.booking_release_day_of_week) : 1,
        booking_release_hour: clampInt(form.booking_release_hour, 0, 23, 8),
        // Hoca izinleri. NULL = slot kilidi kapalı (mobildeki semantiğin aynısı)
        coaches_can_add_lessons: form.coaches_can_add_lessons !== false,
        coaches_require_lesson_package: form.coaches_require_lesson_package === true,
        coaches_must_use_package: form.coaches_must_use_package === true,
        coach_cancel_slot_lock_minutes: form.coach_cancel_slot_lock_minutes ? clampInt(form.coach_cancel_slot_lock_minutes, 1, 10080, 60) : null,
        // Ders iptal politikası. Saatler kural kapalıyken de kaydedilir →
        // kulüp ayarını kaybetmez (mobildeki kalıp).
        late_cancel_charge_enabled: form.late_cancel_charge_enabled === true,
        late_cancel_threshold_hour: clampInt(form.late_cancel_threshold_hour, 0, 23, 12),
        late_cancel_hours_before_threshold: clampInt(form.late_cancel_hours_before_threshold, 1, 168, 12),
        late_cancel_hours_after_threshold: clampInt(form.late_cancel_hours_after_threshold, 1, 168, 8),
        // Hocalara haftalık ders açılışı
        coach_booking_window_enabled: form.coach_booking_window_enabled === true,
        coach_release_day_of_week: form.coach_release_day_of_week != null ? Number(form.coach_release_day_of_week) : 6,
        coach_release_hour: clampInt(form.coach_release_hour, 0, 23, 9),
        coach_weekly_window_days: clampInt(form.coach_weekly_window_days, 1, 60, 7),
        // Paket kuralları WhatsApp mesajı. Metin toggle kapalıyken de
        // kaydedilir → kulüp yazdığını kaybetmez.
        package_rules_whatsapp_enabled: form.package_rules_whatsapp_enabled === true,
        package_rules_message: (form.package_rules_message || "").trim() || null
      };
      const { error } = await sb.from("club_profiles").update(payload).eq("id", clubId);
      if (error) throw error;
      const { error: profErr } = await sb.from("profiles").update({
        full_name: form.club_name,
        phone: form.contact_phone || null,
        city: form.city || null
      }).eq("id", clubId);
      if (profErr) console.warn("profiles g\xFCncellenemedi:", profErr.message);
      setProfile({ ...profile, ...payload });
      setModal(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const changePassword = async () => {
    setPwError("");
    if (pwForm.new1 !== pwForm.new2) {
      setPwError("Yeni \u015Fifreler e\u015Fle\u015Fmiyor.");
      return;
    }
    if ((pwForm.new1 || "").length < 6) {
      setPwError("\u015Eifre en az 6 karakter olmal\u0131.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await sb.auth.updateUser({ password: pwForm.new1 });
      if (error) throw error;
      setPwOk(true);
      setPwForm({});
      setTimeout(() => {
        setPwOk(false);
        setModal(null);
      }, 1500);
    } catch (e) {
      setPwError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const fmtHours = (h) => {
    if (!h) return "\u2014";
    if (typeof h === "object") return `${h.open || "?"} \u2013 ${h.close || "?"}`;
    return h;
  };
  const displayAmenities = Array.isArray(profile.amenities) ? profile.amenities : (profile.amenities || "").split(",").map((s) => s.trim()).filter(Boolean);
  const AMENITIES_LIST = ["Parking", "Showers", "Locker Rooms", "Pro Shop", "Cafe", "Restaurant", "WiFi", "Tennis Academy", "Fitness Center", "Swimming Pool", "Yaz Okulu", "K\u0131\u015F Okulu"];
  const formAmenities = Array.isArray(form.amenities) ? form.amenities : [];
  const toggleAmenity = (a) => {
    const cur = formAmenities.includes(a) ? formAmenities.filter((x) => x !== a) : [...formAmenities, a];
    setForm((prev) => ({ ...prev, amenities: cur }));
  };
  if (loading) return /* @__PURE__ */ React.createElement(Spinner, null);
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Kul\xFCp Profili"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, "Kul\xFCp bilgilerini y\xF6netin")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost", onClick: () => {
    setPwForm({});
    setPwError("");
    setPwOk(false);
    setModal("password");
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "lock"), " \u015Eifre De\u011Fi\u015Ftir"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: openEdit }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "edit"), " D\xFCzenle"))), /* @__PURE__ */ React.createElement("div", { className: "row2" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20 } }, profile.logo_url ? /* @__PURE__ */ React.createElement("img", { src: profile.logo_url, alt: "logo", style: { width: 64, height: 64, borderRadius: 32, objectFit: "cover", border: "2px solid var(--brand-navy)", flexShrink: 0 } }) : /* @__PURE__ */ React.createElement("div", { className: "av av-xl av-1" }, initials(profile.club_name)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 22 } }, profile.club_name || "\u2014"), /* @__PURE__ */ React.createElement(Badge, { cls: profile.is_visible === false ? "b-muted" : "b-success" }, profile.is_visible === false ? "Gizli" : "G\xF6r\xFCn\xFCr")), profile.city && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text-2)", fontSize: 14 } }, profile.city), profile.description && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--text-2)", marginTop: 6, maxWidth: 400 } }, profile.description))), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Adres"), /* @__PURE__ */ React.createElement("span", { className: "v" }, profile.address || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Telefon"), /* @__PURE__ */ React.createElement("span", { className: "v" }, profile.contact_phone || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "E-posta"), /* @__PURE__ */ React.createElement("span", { className: "v" }, profile.contact_email || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Web sitesi"), /* @__PURE__ */ React.createElement("span", { className: "v" }, profile.website || "\u2014")), profile.google_maps_link && /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Google Maps"), /* @__PURE__ */ React.createElement("a", { href: profile.google_maps_link, target: "_blank", rel: "noopener", style: { color: "var(--brand-navy)", fontWeight: 600, fontSize: 13 } }, "Haritada G\xF6r")))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, marginBottom: 12 } }, "Tesis Bilgileri"), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Kortlar"), /* @__PURE__ */ React.createElement("span", { className: "v" }, profile.number_of_courts > 0 ? profile.number_of_courts + " kort" : "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "A\xE7\u0131l\u0131\u015F Saatleri"), /* @__PURE__ */ React.createElement("span", { className: "v" }, fmtHours(profile.opening_hours))), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "I\u015F\u0131k Saatleri"), /* @__PURE__ */ React.createElement("span", { className: "v" }, fmtHours(profile.light_hours))), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "I\u015F\u0131k \xDCcreti"), /* @__PURE__ */ React.createElement("span", { className: "v" }, profile.light_fee > 0 ? fmtMoney(profile.light_fee) + "/saat" : "\u2014")), displayAmenities.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "kv", style: { flexWrap: "wrap", gap: 6, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("span", { className: "k", style: { flexShrink: 0, paddingTop: 2 } }, "Olanaklar"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, displayAmenities.map((a) => /* @__PURE__ */ React.createElement(Badge, { key: a, cls: "b-info" }, a))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, marginBottom: 12 } }, "Rezervasyon Ayarlar\u0131"), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Maks. S\xFCre"), /* @__PURE__ */ React.createElement("span", { className: "v" }, profile.max_reservation_duration || 120, " dk")), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "\xD6nceden Rezervasyon"), /* @__PURE__ */ React.createElement("span", { className: "v" }, profile.max_advance_booking_days ? profile.max_advance_booking_days + " g\xFCn" : "K\u0131s\u0131ts\u0131z")), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Rezervasyon A\xE7\u0131l\u0131\u015F\u0131"), /* @__PURE__ */ React.createElement("span", { className: "v" }, profile.booking_open_hour ? profile.booking_open_hour + ":00" : "K\u0131s\u0131ts\u0131z")), profile.primetime_start && /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Primetime"), /* @__PURE__ */ React.createElement("span", { className: "v" }, profile.primetime_start, " \u2013 ", profile.primetime_end || "?")), profile.non_member_cancellation_limit > 0 && /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "\xDCye Olmayan \u0130ptal"), /* @__PURE__ */ React.createElement("span", { className: "v" }, "Ayl\u0131k ", profile.non_member_cancellation_limit, " iptal, ", profile.non_member_cancellation_penalty_days || "?", " g\xFCn yapt\u0131r\u0131m")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, marginBottom: 12 } }, "Hesap Bilgileri"), /* @__PURE__ */ React.createElement("div", { className: "kv" }, /* @__PURE__ */ React.createElement("span", { className: "k" }, "Kul\xFCp ID"), /* @__PURE__ */ React.createElement("span", { className: "v", style: { fontFamily: "monospace", fontSize: 11 } }, clubId?.slice(0, 8), "\u2026"))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { background: "var(--accent-red-bg)", border: "1px solid rgba(239,68,68,0.2)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: "var(--error)", marginBottom: 8 } }, "Tehlikeli B\xF6lge"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--error)", opacity: 0.8, marginBottom: 12 } }, "Hesab\u0131n\u0131z\u0131 silmek t\xFCm verilerinizi kal\u0131c\u0131 olarak kald\u0131r\u0131r."), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-danger btn-sm",
      onClick: () => {
        if (confirm("Hesab\u0131 silmek istedi\u011Finize emin misiniz? Bu i\u015Flem geri al\u0131namaz.")) {
          alert("Hesap silme i\u015Flemi i\xE7in destek ekibiyle ileti\u015Fime ge\xE7in.");
        }
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "delete_forever"),
    " Hesab\u0131 Sil"
  )))), modal === "edit" && /* @__PURE__ */ React.createElement(Modal, { title: "Profili D\xFCzenle", wide: true, onClose: () => setModal(null), footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: saveProfile, disabled: saving }, saving ? "Kaydediliyor\u2026" : "Kaydet")) }, /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "8px 12px",
    background: "var(--bg)"
  } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-2)", fontSize: 14 } }, "\u{1F50D}"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: secQuery,
      onChange: (e) => setSecQuery(e.target.value),
      placeholder: "Ayar ara (\xF6r. iptal, paket, hoca, whatsapp)",
      style: { flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14 }
    }
  ), secQuery && /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => setSecQuery("") }, "Temizle")), /* @__PURE__ */ React.createElement("div", { style: { background: form.is_visible !== false ? "var(--success-soft, #f0fdf4)" : "var(--accent-red-bg)", borderRadius: 10, padding: "12px 14px", border: `1px solid ${form.is_visible !== false ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` } }, /* @__PURE__ */ React.createElement(Switch, { on: form.is_visible !== false, onChange: (v) => setForm({ ...form, is_visible: v }), label: "Kul\xFCb\xFC Listelemelerde G\xF6ster" }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "6px 0 0 0" } }, form.is_visible !== false ? 'Kul\xFCb\xFCn\xFCz "Rezervasyon Bul" gibi ekranlarda g\xF6r\xFCn\xFCyor.' : "Kul\xFCb\xFCn\xFCz oyunculara g\xF6r\xFCnm\xFCyor.")), secVisible("Temel Bilgiler") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => secToggle("Temel Bilgiler"),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        fontWeight: 700,
        fontSize: 12,
        color: "var(--text-2)",
        textTransform: "uppercase",
        letterSpacing: ".5px",
        borderBottom: "1px solid var(--border)",
        paddingBottom: 6
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, "Temel Bilgiler"),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, secOpen("Temel Bilgiler") ? "\u2212" : "+")
  ), secOpen("Temel Bilgiler") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "Kul\xFCp Logosu", hint: "Oyuncu uygulamas\u0131nda kul\xFCp kart\u0131n\u0131zda g\xF6r\xFCn\xFCr." }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, form.logo_url ? /* @__PURE__ */ React.createElement("img", { src: form.logo_url, alt: "logo", style: { width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: "1px solid var(--border)" } }) : /* @__PURE__ */ React.createElement("div", { style: { width: 56, height: 56, borderRadius: 10, border: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--text-2)" } }, "Logo"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "file",
      accept: "image/*",
      disabled: logoBusy,
      onChange: (e) => {
        uploadLogo(e.target.files?.[0]);
        e.target.value = "";
      }
    }
  ), logoBusy && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)" } }, "Y\xFCkleniyor\u2026"), form.logo_url && !logoBusy && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-ghost btn-sm",
      style: { alignSelf: "flex-start" },
      onClick: () => setForm({ ...form, logo_url: "" })
    },
    "Logoyu kald\u0131r"
  )))), /* @__PURE__ */ React.createElement(Field, { label: "Kul\xFCp Ad\u0131" }, /* @__PURE__ */ React.createElement("input", { value: form.club_name || "", onChange: (e) => setForm({ ...form, club_name: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "A\xE7\u0131klama" }, /* @__PURE__ */ React.createElement("textarea", { rows: 2, value: form.description || "", onChange: (e) => setForm({ ...form, description: e.target.value }), style: { resize: "vertical" } })), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "\u015Eehir" }, /* @__PURE__ */ React.createElement("input", { value: form.city || "", onChange: (e) => setForm({ ...form, city: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Telefon" }, /* @__PURE__ */ React.createElement("input", { value: form.contact_phone || "", onChange: (e) => setForm({ ...form, contact_phone: e.target.value }) }))), /* @__PURE__ */ React.createElement(Field, { label: "Adres" }, /* @__PURE__ */ React.createElement("input", { value: form.address || "", onChange: (e) => setForm({ ...form, address: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "E-posta" }, /* @__PURE__ */ React.createElement("input", { type: "email", value: form.contact_email || "", onChange: (e) => setForm({ ...form, contact_email: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Web Sitesi" }, /* @__PURE__ */ React.createElement("input", { type: "url", value: form.website || "", placeholder: "https://\u2026", onChange: (e) => setForm({ ...form, website: e.target.value }) }))))), secVisible("Konum") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => secToggle("Konum"),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        fontWeight: 700,
        fontSize: 12,
        color: "var(--text-2)",
        textTransform: "uppercase",
        letterSpacing: ".5px",
        borderBottom: "1px solid var(--border)",
        paddingBottom: 6
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, "Konum"),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, secOpen("Konum") ? "\u2212" : "+")
  ), secOpen("Konum") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "Google Maps Linki", hint: "Enlem/boylam koordinatlar\u0131 linkten otomatik \xE7\u0131kar\u0131l\u0131r." }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: form.google_maps_link || "",
      placeholder: "https://maps.google.com/\u2026",
      onChange: (e) => {
        const val = e.target.value;
        const c = extractCoords(val);
        setForm((prev) => ({ ...prev, google_maps_link: val, ...c ? { latitude: c.lat, longitude: c.lng } : {} }));
      }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Enlem (Otomatik)" }, /* @__PURE__ */ React.createElement("input", { value: form.latitude || "", readOnly: true, style: { color: "var(--text-2)" }, placeholder: "Otomatik \xE7\u0131kar\u0131l\u0131r" })), /* @__PURE__ */ React.createElement(Field, { label: "Boylam (Otomatik)" }, /* @__PURE__ */ React.createElement("input", { value: form.longitude || "", readOnly: true, style: { color: "var(--text-2)" }, placeholder: "Otomatik \xE7\u0131kar\u0131l\u0131r" }))))), secVisible("Tesis Detaylar\u0131") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => secToggle("Tesis Detaylar\u0131"),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        fontWeight: 700,
        fontSize: 12,
        color: "var(--text-2)",
        textTransform: "uppercase",
        letterSpacing: ".5px",
        borderBottom: "1px solid var(--border)",
        paddingBottom: 6
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, "Tesis Detaylar\u0131"),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, secOpen("Tesis Detaylar\u0131") ? "\u2212" : "+")
  ), secOpen("Tesis Detaylar\u0131") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Kort Say\u0131s\u0131" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 1, value: form.number_of_courts || "", onChange: (e) => setForm({ ...form, number_of_courts: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "I\u015F\u0131k \xDCcreti (\u20BA/saat)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 0, value: form.light_fee || "", onChange: (e) => setForm({ ...form, light_fee: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "A\xE7\u0131l\u0131\u015F" }, /* @__PURE__ */ React.createElement("input", { type: "time", value: form.opening_hours?.open || "09:00", onChange: (e) => setForm({ ...form, opening_hours: { ...form.opening_hours || {}, open: e.target.value } }) })), /* @__PURE__ */ React.createElement(Field, { label: "Kapan\u0131\u015F" }, /* @__PURE__ */ React.createElement("input", { type: "time", value: form.opening_hours?.close || "22:00", onChange: (e) => setForm({ ...form, opening_hours: { ...form.opening_hours || {}, close: e.target.value } }) }))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "I\u015F\u0131k A\xE7\u0131l\u0131\u015F" }, /* @__PURE__ */ React.createElement("input", { type: "time", value: form.light_hours?.open || "18:00", onChange: (e) => setForm({ ...form, light_hours: { ...form.light_hours || {}, open: e.target.value } }) })), /* @__PURE__ */ React.createElement(Field, { label: "I\u015F\u0131k Kapan\u0131\u015F" }, /* @__PURE__ */ React.createElement("input", { type: "time", value: form.light_hours?.close || "22:00", onChange: (e) => setForm({ ...form, light_hours: { ...form.light_hours || {}, close: e.target.value } }) }))))), secVisible("Sistem Ayarlar\u0131") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => secToggle("Sistem Ayarlar\u0131"),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        fontWeight: 700,
        fontSize: 12,
        color: "var(--text-2)",
        textTransform: "uppercase",
        letterSpacing: ".5px",
        borderBottom: "1px solid var(--border)",
        paddingBottom: 6
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, "Sistem Ayarlar\u0131"),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, secOpen("Sistem Ayarlar\u0131") ? "\u2212" : "+")
  ), secOpen("Sistem Ayarlar\u0131") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { background: form.has_membership_system !== false ? "#F0FDF4" : "#FEF2F2", borderRadius: 10, padding: "12px 14px", border: `1px solid ${form.has_membership_system !== false ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` } }, /* @__PURE__ */ React.createElement(Switch, { on: form.has_membership_system !== false, onChange: (v) => setForm({ ...form, has_membership_system: v }), label: "\xDCyelik Sistemi" }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "6px 0 0 0" } }, form.has_membership_system !== false ? "\xDCyeler sekmesi aktif, \xFCyelik paketleri kullan\u0131labilir." : "\xDCyeler sekmesi gizlenir, sistem tamamen m\xFC\u015Fteriler \xFCzerinden \xE7al\u0131\u015F\u0131r.")), /* @__PURE__ */ React.createElement("div", { style: { background: form.has_cafe_system !== false ? "#F0FDF4" : "#FEF2F2", borderRadius: 10, padding: "12px 14px", border: `1px solid ${form.has_cafe_system !== false ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` } }, /* @__PURE__ */ React.createElement(Switch, { on: form.has_cafe_system !== false, onChange: (v) => setForm({ ...form, has_cafe_system: v }), label: "Kafe / Market" }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "6px 0 0 0" } }, form.has_cafe_system !== false ? "Kafe / Market sekmesi aktif, kafetarya gelir kategorisi g\xF6r\xFCn\xFCr." : "Kafe / Market sekmesi gizlenir, finans ekran\u0131ndan kafetarya kategorisi kald\u0131r\u0131l\u0131r.")), /* @__PURE__ */ React.createElement("div", { style: { background: form.has_employee_system !== false ? "#F0FDF4" : "#FEF2F2", borderRadius: 10, padding: "12px 14px", border: `1px solid ${form.has_employee_system !== false ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` } }, /* @__PURE__ */ React.createElement(Switch, { on: form.has_employee_system !== false, onChange: (v) => setForm({ ...form, has_employee_system: v }), label: "\xC7al\u0131\u015Fan Sistemi" }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "6px 0 0 0" } }, form.has_employee_system !== false ? "\xC7al\u0131\u015Fanlar sekmesi aktif." : "\xC7al\u0131\u015Fanlar sekmesi gizlenir.")))), secVisible("Rezervasyon Ayarlar\u0131") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => secToggle("Rezervasyon Ayarlar\u0131"),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        fontWeight: 700,
        fontSize: 12,
        color: "var(--text-2)",
        textTransform: "uppercase",
        letterSpacing: ".5px",
        borderBottom: "1px solid var(--border)",
        paddingBottom: 6
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, "Rezervasyon Ayarlar\u0131"),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, secOpen("Rezervasyon Ayarlar\u0131") ? "\u2212" : "+")
  ), secOpen("Rezervasyon Ayarlar\u0131") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { background: form.requires_booking_approval ? "#FEFCE8" : "#F0FDF4", borderRadius: 10, padding: "12px 14px", border: `1px solid ${form.requires_booking_approval ? "#FDE68A" : "rgba(34,197,94,0.2)"}` } }, /* @__PURE__ */ React.createElement(Switch, { on: form.requires_booking_approval === true, onChange: (v) => setForm({ ...form, requires_booking_approval: v }), label: "Kul\xFCp Onay\u0131 Gereksin" }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "6px 0 0 0" } }, form.requires_booking_approval ? "Yeni rezervasyonlar siz onaylayana kadar beklemede kal\u0131r." : "Yeni rezervasyonlar otomatik olarak onaylan\u0131r.")), /* @__PURE__ */ React.createElement(Field, { label: "Maksimum Rezervasyon S\xFCresi", hint: "Bu s\xFCreden uzun se\xE7enekler oyunculara g\xF6sterilmez." }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 4 } }, [60, 90, 120].map((m) => /* @__PURE__ */ React.createElement("div", { key: m, className: `chip${form.max_reservation_duration == m ? " active" : ""}`, onClick: () => setForm({ ...form, max_reservation_duration: m }), style: { cursor: "pointer" } }, m, " dk")))), /* @__PURE__ */ React.createElement(Field, { label: "Ka\xE7 G\xFCn \xD6nceden Rezervasyon Al\u0131n\u0131r?", hint: "Bo\u015F b\u0131rak\u0131rsan\u0131z k\u0131s\u0131ts\u0131z olur." }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 0, value: form.max_advance_booking_days || "", placeholder: "K\u0131s\u0131ts\u0131z (bo\u015F b\u0131rak\u0131n)", onChange: (e) => setForm({ ...form, max_advance_booking_days: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "En \u0130leri G\xFCn\xFCn Rezervasyonu Ne Zaman A\xE7\u0131l\u0131r?", hint: "K\u0131s\u0131ts\u0131z = her zaman a\xE7\u0131k" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 } }, [{ v: 0, l: "K\u0131s\u0131ts\u0131z" }, { v: 8, l: "08:00" }, { v: 12, l: "12:00" }, { v: 22, l: "22:00" }].map((o) => /* @__PURE__ */ React.createElement("div", { key: o.v, className: `chip${form.booking_open_hour == o.v ? " active" : ""}`, onClick: () => setForm({ ...form, booking_open_hour: o.v }), style: { cursor: "pointer" } }, o.l)))), /* @__PURE__ */ React.createElement(Field, { label: "\u0130zin Verilen Rezervasyon S\xFCreleri", hint: "Oyunculara yaln\u0131z se\xE7tikleriniz g\xF6sterilir. En az bir s\xFCre se\xE7ili olmal\u0131." }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 4 } }, [60, 90, 120].map((m) => {
    const list = Array.isArray(form.allowed_reservation_durations) ? form.allowed_reservation_durations : [60, 90, 120];
    const on = list.includes(m);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: m,
        className: `chip${on ? " active" : ""}`,
        style: { cursor: "pointer" },
        onClick: () => {
          const next = on ? list.filter((x) => x !== m) : [...list, m].sort((a, b) => a - b);
          if (next.length === 0) return;
          setForm({ ...form, allowed_reservation_durations: next });
        }
      },
      m,
      " dk"
    );
  }))), /* @__PURE__ */ React.createElement("div", { style: { background: form.booking_weekly_release ? "#EEF2FF" : "var(--surface-2, #F8FAFC)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(Switch, { on: form.booking_weekly_release === true, onChange: (v) => setForm({ ...form, booking_weekly_release: v }), label: "Haftal\u0131k Rezervasyon A\xE7\u0131l\u0131\u015F\u0131" }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "6px 0 0 0" } }, form.booking_weekly_release ? "Se\xE7ti\u011Finiz g\xFCn ve saatte 1 haftal\u0131k pencere blok olarak a\xE7\u0131l\u0131r. Yukar\u0131daki g\xFCn say\u0131s\u0131 ve a\xE7\u0131l\u0131\u015F saati kullan\u0131lmaz." : "Kapal\u0131: pencere her g\xFCn bir g\xFCn ileri kayar."), form.booking_weekly_release && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, marginBottom: 6 } }, "A\xE7\u0131l\u0131\u015F G\xFCn\xFC"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, ["Paz", "Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt"].map((l, i) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: i,
      className: `chip${form.booking_release_day_of_week == i ? " active" : ""}`,
      style: { cursor: "pointer" },
      onClick: () => setForm({ ...form, booking_release_day_of_week: i })
    },
    l
  )))), /* @__PURE__ */ React.createElement(Field, { label: "A\xE7\u0131l\u0131\u015F Saati" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      max: 23,
      value: form.booking_release_hour ?? 8,
      onChange: (e) => setForm({ ...form, booking_release_hour: e.target.value })
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Primetime Ba\u015Flang\u0131\xE7" }, /* @__PURE__ */ React.createElement("input", { type: "time", value: form.primetime_start || "", onChange: (e) => setForm({ ...form, primetime_start: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Primetime Biti\u015F" }, /* @__PURE__ */ React.createElement("input", { type: "time", value: form.primetime_end || "", onChange: (e) => setForm({ ...form, primetime_end: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "\xDCye Olmayan \u0130ptal Limiti", hint: "Ayl\u0131k iptal say\u0131s\u0131" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 0, value: form.non_member_cancellation_limit || "", placeholder: "\xF6rn. 3", onChange: (e) => setForm({ ...form, non_member_cancellation_limit: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Yapt\u0131r\u0131m S\xFCresi (g\xFCn)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 0, value: form.non_member_cancellation_penalty_days || "", placeholder: "\xF6rn. 7", onChange: (e) => setForm({ ...form, non_member_cancellation_penalty_days: e.target.value }) }))))), secVisible("Hoca \u0130zinleri") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => secToggle("Hoca \u0130zinleri"),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        fontWeight: 700,
        fontSize: 12,
        color: "var(--text-2)",
        textTransform: "uppercase",
        letterSpacing: ".5px",
        borderBottom: "1px solid var(--border)",
        paddingBottom: 6
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, "Hoca \u0130zinleri"),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, secOpen("Hoca \u0130zinleri") ? "\u2212" : "+")
  ), secOpen("Hoca \u0130zinleri") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { background: form.coaches_can_add_lessons !== false ? "#F0FDF4" : "#FEF2F2", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(Switch, { on: form.coaches_can_add_lessons !== false, onChange: (v) => setForm({ ...form, coaches_can_add_lessons: v }), label: "Hocalar Ders Ekleyebilir" }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "6px 0 0 0" } }, form.coaches_can_add_lessons !== false ? "Hocalar kendi takvimlerinden ders ekleyebilir." : "Dersleri yaln\u0131z siz ve \xE7al\u0131\u015Fanlar\u0131n\u0131z ekleyebilir.")), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface-2, #F8FAFC)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border)", opacity: form.coaches_can_add_lessons === false ? 0.5 : 1 } }, /* @__PURE__ */ React.createElement(Switch, { on: form.coaches_require_lesson_package === true, onChange: (v) => setForm({ ...form, coaches_require_lesson_package: v }), label: "Paketsiz \xD6\u011Frenciye Ders Yasa\u011F\u0131" }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "6px 0 0 0" } }, "Hocalar yaln\u0131zca kullan\u0131labilir ders paketi olan \xF6\u011Frencilere ders yazabilir. Siz ve \xE7al\u0131\u015Fanlar\u0131n\u0131z muafs\u0131n\u0131z.")), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface-2, #F8FAFC)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border)", opacity: form.coaches_can_add_lessons === false ? 0.5 : 1 } }, /* @__PURE__ */ React.createElement(Switch, { on: form.coaches_must_use_package === true, onChange: (v) => setForm({ ...form, coaches_must_use_package: v }), label: "Paket D\u0131\u015F\u0131 Ders Yasa\u011F\u0131" }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "6px 0 0 0" } }, "Paketi olan \xF6\u011Frenciye yaln\u0131z paketten d\xFC\u015Fen ders yaz\u0131labilir; hoca \u201CPaketten D\xFC\u015F\u201D se\xE7ene\u011Fini kapatamaz.")), /* @__PURE__ */ React.createElement(Field, { label: "\u0130ptal Sonras\u0131 Slot Kilidi (dakika)", hint: "Hoca kendi dersini iptal ederse ayn\u0131 kort ve saate bu s\xFCre boyunca yeni ders ekleyemez. Bo\u015F = kapal\u0131." }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      value: form.coach_cancel_slot_lock_minutes || "",
      placeholder: "Kapal\u0131 (bo\u015F b\u0131rak\u0131n)",
      onChange: (e) => setForm({ ...form, coach_cancel_slot_lock_minutes: e.target.value })
    }
  )))), secVisible("Ders \u0130ptal Politikas\u0131") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => secToggle("Ders \u0130ptal Politikas\u0131"),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        fontWeight: 700,
        fontSize: 12,
        color: "var(--text-2)",
        textTransform: "uppercase",
        letterSpacing: ".5px",
        borderBottom: "1px solid var(--border)",
        paddingBottom: 6
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, "Ders \u0130ptal Politikas\u0131"),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, secOpen("Ders \u0130ptal Politikas\u0131") ? "\u2212" : "+")
  ), secOpen("Ders \u0130ptal Politikas\u0131") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { background: form.late_cancel_charge_enabled ? "#FEF2F2" : "var(--surface-2, #F8FAFC)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(Switch, { on: form.late_cancel_charge_enabled === true, onChange: (v) => setForm({ ...form, late_cancel_charge_enabled: v }), label: "Ge\xE7 \u0130ptal = Ders Yap\u0131ld\u0131 Say\u0131l\u0131r" }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "6px 0 0 0" } }, form.late_cancel_charge_enabled ? "Son iptal saatinden sonra iptal edilen ders yap\u0131lm\u0131\u015F say\u0131l\u0131r; \xF6demesi tahsilat listenize d\xFC\u015Fer, paket seans\u0131 iade edilmez. Hem hocalar\u0131 hem oyuncular\u0131 kapsar; siz ve \xE7al\u0131\u015Fanlar\u0131n\u0131z muafs\u0131n\u0131z." : "Dersler her an bedelsiz iptal edilebilir."), form.late_cancel_charge_enabled && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement(Field, { label: "\xD6\u011Fleden \xD6nce / Sonra E\u015Fi\u011Fi (saat)", hint: "Bu saatten \xF6nce ba\u015Flayan dersler ilk limite, bu saatte/sonra ba\u015Flayanlar ikinci limite tabidir." }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      max: 23,
      value: form.late_cancel_threshold_hour ?? 12,
      onChange: (e) => setForm({ ...form, late_cancel_threshold_hour: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "E\u015Fikten \xD6nce (saat \xF6nce)" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 1,
      max: 168,
      value: form.late_cancel_hours_before_threshold ?? 12,
      onChange: (e) => setForm({ ...form, late_cancel_hours_before_threshold: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement(Field, { label: "E\u015Fikte / Sonra (saat \xF6nce)" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 1,
      max: 168,
      value: form.late_cancel_hours_after_threshold ?? 8,
      onChange: (e) => setForm({ ...form, late_cancel_hours_after_threshold: e.target.value })
    }
  ))))))), secVisible("Ders Paketi Kurallar\u0131") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => secToggle("Ders Paketi Kurallar\u0131"),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        fontWeight: 700,
        fontSize: 12,
        color: "var(--text-2)",
        textTransform: "uppercase",
        letterSpacing: ".5px",
        borderBottom: "1px solid var(--border)",
        paddingBottom: 6
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, "Ders Paketi Kurallar\u0131"),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, secOpen("Ders Paketi Kurallar\u0131") ? "\u2212" : "+")
  ), secOpen("Ders Paketi Kurallar\u0131") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { background: form.package_rules_whatsapp_enabled ? "#F0FDF4" : "var(--surface-2, #F8FAFC)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(Switch, { on: form.package_rules_whatsapp_enabled === true, onChange: (v) => setForm({ ...form, package_rules_whatsapp_enabled: v }), label: "Paket Kurallar\u0131n\u0131 WhatsApp'tan G\xF6nder" }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "6px 0 0 0" } }, form.package_rules_whatsapp_enabled ? 'Bir m\xFC\u015Fteriye paket tan\u0131mlad\u0131ktan sonra WhatsApp haz\u0131r mesajla a\xE7\u0131l\u0131r; size yaln\u0131z "G\xF6nder"e basmak kal\u0131r.' : "Kapal\u0131: paket tan\u0131mland\u0131ktan sonra hi\xE7bir \u015Fey sorulmaz."), form.package_rules_whatsapp_enabled && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700 } }, "Mesaj"), !(form.package_rules_message || "").trim() && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-ghost btn-sm",
      onClick: () => setForm({ ...form, package_rules_message: PACKAGE_RULES_SAMPLE })
    },
    "\xD6rnek metni doldur"
  )), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 12,
      style: { width: "100%", boxSizing: "border-box", resize: "vertical" },
      value: form.package_rules_message || "",
      placeholder: "Merhaba {ogrenci}, ... paketiniz tan\u0131mlanm\u0131\u015Ft\u0131r.",
      onChange: (e) => setForm({ ...form, package_rules_message: e.target.value })
    }
  ), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "8px 0 6px 0" } }, "Kullanabilece\u011Finiz de\u011Fi\u015Fkenler \u2014 g\xF6nderim an\u0131nda otomatik dolar:"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, ["{ogrenci}", "{paket}", "{ders}", "{gecerlilik}", "{ucret}", "{hoca}", "{kulup}"].map((v) => /* @__PURE__ */ React.createElement("div", { key: v, className: "chip", style: { cursor: "default" } }, v))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "10px 0 0 0" } }, "Mesaj bo\u015F b\u0131rak\u0131l\u0131rsa g\xF6nderim \xF6nerilmez. M\xFC\u015Fterinin telefonu kay\u0131tl\u0131 de\u011Filse de hi\xE7bir \u015Fey sorulmaz \u2014 paket normal \u015Fekilde kaydedilir."))))), secVisible("Hocalara Haftal\u0131k Ders A\xE7\u0131l\u0131\u015F\u0131") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => secToggle("Hocalara Haftal\u0131k Ders A\xE7\u0131l\u0131\u015F\u0131"),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        fontWeight: 700,
        fontSize: 12,
        color: "var(--text-2)",
        textTransform: "uppercase",
        letterSpacing: ".5px",
        borderBottom: "1px solid var(--border)",
        paddingBottom: 6
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, "Hocalara Haftal\u0131k Ders A\xE7\u0131l\u0131\u015F\u0131"),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, secOpen("Hocalara Haftal\u0131k Ders A\xE7\u0131l\u0131\u015F\u0131") ? "\u2212" : "+")
  ), secOpen("Hocalara Haftal\u0131k Ders A\xE7\u0131l\u0131\u015F\u0131") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { background: form.coach_booking_window_enabled ? "#EEF2FF" : "var(--surface-2, #F8FAFC)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(Switch, { on: form.coach_booking_window_enabled === true, onChange: (v) => setForm({ ...form, coach_booking_window_enabled: v }), label: "Hocalara Haftal\u0131k Ders A\xE7\u0131l\u0131\u015F\u0131" }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: "6px 0 0 0" } }, form.coach_booking_window_enabled ? "Hocalar yaln\u0131z a\xE7\u0131lan pencere i\xE7ine ders yazabilir ve tekrarlayan (seri) ders ekleyemez. Siz ve \xE7al\u0131\u015Fanlar\u0131n\u0131z etkilenmezsiniz." : "Hocalar istedikleri kadar ileriye ders yazabilir ve seri ders ekleyebilir."), form.coach_booking_window_enabled && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, marginBottom: 6 } }, "A\xE7\u0131l\u0131\u015F G\xFCn\xFC"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, ["Paz", "Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt"].map((l, i) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: i,
      className: `chip${form.coach_release_day_of_week == i ? " active" : ""}`,
      style: { cursor: "pointer" },
      onClick: () => setForm({ ...form, coach_release_day_of_week: i })
    },
    l
  )))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "A\xE7\u0131l\u0131\u015F Saati" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      max: 23,
      value: form.coach_release_hour ?? 9,
      onChange: (e) => setForm({ ...form, coach_release_hour: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement(Field, { label: "A\xE7\u0131lan Pencere (g\xFCn)" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 1,
      max: 60,
      value: form.coach_weekly_window_days ?? 7,
      onChange: (e) => setForm({ ...form, coach_weekly_window_days: e.target.value })
    }
  ))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 11, color: "var(--text-2)", margin: 0 } }, `\xD6rn. ${["Pazar", "Pazartesi", "Sal\u0131", "\xC7ar\u015Famba", "Per\u015Fembe", "Cuma", "Cumartesi"][form.coach_release_day_of_week ?? 6]} ${form.coach_release_hour ?? 9}:00 + ${form.coach_weekly_window_days ?? 7} g\xFCn: hocalar her hafta o g\xFCn ve saatte, sonraki ${form.coach_weekly_window_days ?? 7} g\xFCn\xFCn derslerini yazabilir.`))))), secVisible("Olanaklar") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => secToggle("Olanaklar"),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        fontWeight: 700,
        fontSize: 12,
        color: "var(--text-2)",
        textTransform: "uppercase",
        letterSpacing: ".5px",
        borderBottom: "1px solid var(--border)",
        paddingBottom: 6
      }
    },
    /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, "Olanaklar"),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, secOpen("Olanaklar") ? "\u2212" : "+")
  ), secOpen("Olanaklar") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, AMENITIES_LIST.map((a) => /* @__PURE__ */ React.createElement("div", { key: a, className: `chip${formAmenities.includes(a) ? " active" : ""}`, onClick: () => toggleAmenity(a), style: { cursor: "pointer" } }, a))))), "          ")), modal === "password" && /* @__PURE__ */ React.createElement(Modal, { title: "\u015Eifre De\u011Fi\u015Ftir", onClose: () => setModal(null), footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: changePassword, disabled: saving }, saving ? "De\u011Fi\u015Ftiriliyor\u2026" : "\u015Eifreyi De\u011Fi\u015Ftir")) }, /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, pwError && /* @__PURE__ */ React.createElement("div", { style: { background: "var(--accent-red-bg)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#B91C1C" } }, pwError), pwOk && /* @__PURE__ */ React.createElement("div", { style: { background: "#f0fdf4", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#166534" } }, "\u015Eifre ba\u015Far\u0131yla de\u011Fi\u015Ftirildi!"), /* @__PURE__ */ React.createElement(Field, { label: "Yeni \u015Eifre" }, /* @__PURE__ */ React.createElement("input", { type: "password", value: pwForm.new1 || "", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", onChange: (e) => setPwForm({ ...pwForm, new1: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Yeni \u015Eifre (Tekrar)" }, /* @__PURE__ */ React.createElement("input", { type: "password", value: pwForm.new2 || "", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", onChange: (e) => setPwForm({ ...pwForm, new2: e.target.value }) })))));
}

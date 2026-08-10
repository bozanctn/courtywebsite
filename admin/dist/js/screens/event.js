const T_SPORTS = [
  { value: "padel", label: "Padel", emoji: "\u{1F3BE}" },
  { value: "tennis", label: "Tenis", emoji: "\u{1F3BE}" },
  { value: "pickleball", label: "Pickleball", emoji: "\u{1F3D3}" }
];
const T_TYPES = [
  { value: "americano_teams", label: "Americano - Tak\u0131mlar", emoji: "\u{1F504}", desc: "Partner rotasyonlu 2v2. Her turda e\u015Fler de\u011Fi\u015Fir.", scoringType: "points" },
  { value: "americano_singles", label: "Americano - Bireysel", emoji: "\u{1F504}", desc: "Partner rotasyonlu 1v1. Her turda rakip de\u011Fi\u015Fir.", scoringType: "points" },
  { value: "singles_knockout", label: "Tekler Eleme", emoji: "\u26A1", desc: "1v1 eleme. Kazananlar bir sonraki tura ge\xE7er (set bazl\u0131).", scoringType: "sets" },
  { value: "doubles_knockout", label: "\xC7iftler Eleme", emoji: "\u26A1", desc: "2v2 eleme. Kazananlar bir sonraki tura ge\xE7er (set bazl\u0131).", scoringType: "sets" },
  { value: "singles_league", label: "Tekler Lig", emoji: "\u{1F3C6}", desc: "1v1 lig. Herkes herkesle oynar, G=3 B=1 M=0 puan.", scoringType: "sets" },
  { value: "doubles_league", label: "\xC7iftler Lig", emoji: "\u{1F3C6}", desc: "2v2 lig. Herkes herkesle oynar, G=3 B=1 M=0 puan.", scoringType: "sets" }
];
const T_GENDERS = [
  { value: "mixed", label: "Karma" },
  { value: "male", label: "Erkekler" },
  { value: "female", label: "Kad\u0131nlar" }
];
const T_TYPE_LABEL_MAP = {
  americano_teams: "Americano - Tak\u0131mlar",
  americano_singles: "Americano - Bireysel",
  singles_knockout: "Tekler Eleme",
  doubles_knockout: "\xC7iftler Eleme",
  singles_league: "Tekler Lig",
  doubles_league: "\xC7iftler Lig"
};
const T_GENDER_LABEL_MAP = { mixed: "Karma", male: "Erkekler", female: "Kad\u0131nlar" };
const T_SPORT_EMOJI = { padel: "\u{1F3BE}", tennis: "\u{1F3BE}", pickleball: "\u{1F3D3}" };
function TournamentsScreen({ clubId, userType }) {
  const { useState, useEffect, useMemo } = React;
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [detailId, setDetailId] = useState(null);
  useEffect(() => {
    if (clubId) load();
  }, [clubId]);
  const load = async () => {
    setLoading(true);
    const { data } = await sb.from("tournaments").select("*").eq("club_id", clubId).order("start_date", { ascending: false });
    setTournaments(data || []);
    setLoading(false);
  };
  const openCreate = () => {
    setForm({
      title: "",
      description: "",
      sport: "padel",
      tournament_type: "americano_teams",
      scoring_type: "points",
      gender: "mixed",
      level_min: "1.0",
      level_max: "3.0",
      max_players: "8",
      rounds_count: "3",
      courts_count: "2",
      total_score: "24",
      entry_fee: "0",
      start_date: "",
      end_date: "",
      registration_deadline: "",
      is_public: true,
      status: "upcoming",
      prize_1: "",
      prize_2: "",
      prize_3: ""
    });
    setModal({ type: "add" });
  };
  const openEdit = (t) => {
    setForm({
      ...t,
      level_min: String(t.level_min ?? "1.0"),
      level_max: String(t.level_max ?? "3.0"),
      max_players: String(t.max_players ?? "8"),
      rounds_count: String(t.rounds_count ?? "3"),
      courts_count: String(t.courts_count ?? "2"),
      total_score: String(t.total_score ?? "24"),
      entry_fee: String(t.entry_fee ?? "0"),
      start_date: t.start_date ? t.start_date.slice(0, 16) : "",
      end_date: t.end_date ? t.end_date.slice(0, 16) : "",
      registration_deadline: t.registration_deadline ? t.registration_deadline.slice(0, 16) : "",
      prize_1: t.prizes?.[0]?.description ?? "",
      prize_2: t.prizes?.[1]?.description ?? "",
      prize_3: t.prizes?.[2]?.description ?? ""
    });
    setModal({ type: "edit" });
  };
  const pickType = (typeVal) => {
    const found = T_TYPES.find((t) => t.value === typeVal);
    setForm((f) => ({ ...f, tournament_type: typeVal, scoring_type: found?.scoringType ?? f.scoring_type }));
  };
  const save = async () => {
    if (!form.title?.trim()) {
      alert("Turnuva ba\u015Fl\u0131\u011F\u0131 bo\u015F olamaz.");
      return;
    }
    if (!form.start_date) {
      alert("Ba\u015Flang\u0131\xE7 tarihi zorunludur.");
      return;
    }
    if (!form.end_date) {
      alert("Biti\u015F tarihi zorunludur.");
      return;
    }
    if (form.start_date >= form.end_date) {
      alert("Ba\u015Flang\u0131\xE7 tarihi biti\u015F tarihinden \xF6nce olmal\u0131d\u0131r.");
      return;
    }
    const n = parseInt(form.max_players) || 8;
    if ((form.tournament_type === "singles_knockout" || form.tournament_type === "doubles_knockout") && (n & n - 1) !== 0) {
      alert("Eleme format\u0131 i\xE7in oyuncu say\u0131s\u0131 2'nin kuvveti olmal\u0131d\u0131r (4, 8, 16, 32\u2026).");
      return;
    }
    setSaving(true);
    try {
      const prizes = ["prize_1", "prize_2", "prize_3"].map((k, i) => ({ rank: i + 1, description: form[k] || "" })).filter((p) => p.description.trim());
      const payload = {
        club_id: clubId,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        sport: form.sport || "padel",
        tournament_type: form.tournament_type || "americano_teams",
        scoring_type: form.scoring_type || "points",
        gender: form.gender || "mixed",
        level_min: parseFloat(form.level_min) || 1,
        level_max: parseFloat(form.level_max) || 3,
        max_players: n,
        rounds_count: parseInt(form.rounds_count) || 3,
        courts_count: parseInt(form.courts_count) || 2,
        total_score: parseInt(form.total_score) || 24,
        entry_fee: parseFloat(form.entry_fee) || 0,
        prizes: prizes.length > 0 ? prizes : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        registration_deadline: form.registration_deadline || null,
        is_public: form.is_public !== false,
        status: form.status || "upcoming"
      };
      if (modal.type === "add") {
        payload.current_players = 0;
        await sb.from("tournaments").insert(payload);
      } else {
        await sb.from("tournaments").update(payload).eq("id", form.id);
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
    if (!confirm("Bu turnuvay\u0131 silmek istedi\u011Finize emin misiniz?")) return;
    await sb.from("tournaments").delete().eq("id", id);
    load();
  };
  const filtered = useMemo(() => tournaments.filter((t) => {
    if (activeTab === "upcoming") return t.status === "upcoming";
    if (activeTab === "ongoing") return t.status === "ongoing" || t.status === "active";
    return t.status === "completed" || t.status === "cancelled";
  }), [tournaments, activeTab]);
  const tBadge = (t) => {
    const s = t.status;
    if (s === "upcoming") return { label: "YAKLA\u015EAN", bg: "#EEF2FF", color: "var(--brand-navy)" };
    if (s === "ongoing" || s === "active") return { label: "DEVAM ED\u0130YOR", bg: "#DCFCE7", color: "#22C55E" };
    if (s === "completed") return { label: "TAMAMLANDI", bg: "#F1F5F9", color: "var(--text-2)" };
    return { label: "\u0130PTAL", bg: "#FEF2F2", color: "#EF4444" };
  };
  if (detailId) {
    return /* @__PURE__ */ React.createElement(ManageTournamentScreen, { tournamentId: detailId, onBack: () => {
      setDetailId(null);
      load();
    } });
  }
  const tabItems = [
    { key: "upcoming", label: "Yakla\u015Fan" },
    { key: "ongoing", label: "Devam Eden" },
    { key: "completed", label: "Ge\xE7mi\u015F" }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Turnuvalar"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, tournaments.length, " turnuva")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: openCreate }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), " Turnuva Olu\u015Ftur")), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement(Tabs, { items: tabItems, active: activeTab, onChange: setActiveTab })), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : filtered.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "emoji_events",
      title: activeTab === "upcoming" ? "Yakla\u015Fan turnuva yok" : activeTab === "ongoing" ? "Devam eden turnuva yok" : "Ge\xE7mi\u015F turnuva yok",
      sub: activeTab === "upcoming" ? "\u0130lk turnuvan\u0131z\u0131 olu\u015Fturun." : ""
    }
  ) : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 } }, filtered.map((t) => {
    const badge = tBadge(t);
    return /* @__PURE__ */ React.createElement("div", { key: t.id, className: "card", style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 15, flex: 1 } }, T_SPORT_EMOJI[t.sport] ?? "\u{1F3BE}", " ", t.title || /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-2)", fontStyle: "italic", fontWeight: 400 } }, "\u0130simsiz")), /* @__PURE__ */ React.createElement("span", { style: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0, background: badge.bg, color: badge.color } }, badge.label)), t.description && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--text-2)", margin: 0 } }, t.description), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--text-2)" } }, t.tournament_type && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "format_list_bulleted"), T_TYPE_LABEL_MAP[t.tournament_type] || t.tournament_type), t.start_date && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "event"), fmtDate(t.start_date), t.end_date ? ` \u2014 ${fmtDate(t.end_date)}` : ""), /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "people"), t.current_players ?? 0, "/", t.max_players, " oyuncu", t.gender ? ` \xB7 ${T_GENDER_LABEL_MAP[t.gender] || t.gender}` : ""), (t.level_min != null || t.level_max != null) && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "bar_chart"), "Seviye ", t.level_min ?? "?", "\u2013", t.level_max ?? "?"), t.entry_fee > 0 && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "payments"), fmtMoney(t.entry_fee), " giri\u015F \xFCcreti")), /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "var(--border)" } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", style: { flex: 1 }, onClick: () => setDetailId(t.id) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "sports_tennis"), " Y\xF6net"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => openEdit(t) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "edit")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", onClick: () => del(t.id) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "delete"))));
  })), modal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: modal.type === "add" ? "Turnuva Olu\u015Ftur" : "Turnuva D\xFCzenle",
      wide: true,
      onClose: () => setModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: save, disabled: saving }, saving ? "Kaydediliyor\u2026" : "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Field, { label: "Turnuva Ba\u015Fl\u0131\u011F\u0131 *" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: form.title || "",
        placeholder: "\xF6rn. Yaz Padel Turnuvas\u0131 2025",
        onChange: (e) => setForm({ ...form, title: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "A\xE7\u0131klama" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: 2,
        value: form.description || "",
        placeholder: "Turnuva hakk\u0131nda k\u0131sa a\xE7\u0131klama\u2026",
        onChange: (e) => setForm({ ...form, description: e.target.value }),
        style: { resize: "vertical" }
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "SPOR" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, T_SPORTS.map((s) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: s.value,
        type: "button",
        className: "btn btn-sm " + (form.sport === s.value ? "btn-pri" : "btn-ghost"),
        style: { flex: 1 },
        onClick: () => setForm({ ...form, sport: s.value })
      },
      s.emoji,
      " ",
      s.label
    )))), /* @__PURE__ */ React.createElement(Field, { label: "TURNUVA FORMATI" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, T_TYPES.map((t) => {
      const sel = form.tournament_type === t.value;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: t.value,
          onClick: () => pickType(t.value),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            borderRadius: 12,
            cursor: "pointer",
            userSelect: "none",
            border: `1.5px solid ${sel ? "var(--brand-navy)" : "var(--border)"}`,
            background: sel ? "#EEF2FF" : "transparent"
          }
        },
        /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20, flexShrink: 0, width: 30, textAlign: "center" } }, t.emoji),
        /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: sel ? "var(--brand-navy)" : "var(--text-1)" } }, t.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2 } }, t.desc)),
        sel && /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--brand-navy)", fontSize: 18 } }, "check_circle")
      );
    }))), /* @__PURE__ */ React.createElement(Field, { label: "C\u0130NS\u0130YET" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, T_GENDERS.map((g) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: g.value,
        type: "button",
        className: "btn btn-sm " + (form.gender === g.value ? "btn-pri" : "btn-ghost"),
        style: { flex: 1 },
        onClick: () => setForm({ ...form, gender: g.value })
      },
      g.label
    )))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Min Seviye" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        max: 10,
        step: 0.5,
        value: form.level_min ?? "1.0",
        placeholder: "1.0",
        onChange: (e) => setForm({ ...form, level_min: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Max Seviye" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        max: 10,
        step: 0.5,
        value: form.level_max ?? "3.0",
        placeholder: "3.0",
        onChange: (e) => setForm({ ...form, level_max: e.target.value })
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Oyuncu Say\u0131s\u0131" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 2,
        value: form.max_players ?? "8",
        placeholder: "8",
        onChange: (e) => setForm({ ...form, max_players: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Kort Say\u0131s\u0131" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 1,
        value: form.courts_count ?? "2",
        placeholder: "2",
        onChange: (e) => setForm({ ...form, courts_count: e.target.value })
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, (form.tournament_type === "americano_teams" || form.tournament_type === "americano_singles") && /* @__PURE__ */ React.createElement(Field, { label: "Tur Say\u0131s\u0131" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 1,
        value: form.rounds_count ?? "3",
        placeholder: "3",
        onChange: (e) => setForm({ ...form, rounds_count: e.target.value })
      }
    )), form.scoring_type === "points" && /* @__PURE__ */ React.createElement(Field, { label: "Toplam Skor" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 1,
        value: form.total_score ?? "24",
        placeholder: "24",
        onChange: (e) => setForm({ ...form, total_score: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Kat\u0131l\u0131m \xDCcreti (\u20BA)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        step: 1,
        value: form.entry_fee ?? "0",
        placeholder: "0",
        onChange: (e) => setForm({ ...form, entry_fee: e.target.value })
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Ba\u015Flang\u0131\xE7 Tarihi *" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "datetime-local",
        value: form.start_date || "",
        onChange: (e) => setForm({ ...form, start_date: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Biti\u015F Tarihi *" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "datetime-local",
        value: form.end_date || "",
        onChange: (e) => setForm({ ...form, end_date: e.target.value })
      }
    ))), /* @__PURE__ */ React.createElement(Field, { label: "Son Kay\u0131t Tarihi (iste\u011Fe ba\u011Fl\u0131)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "datetime-local",
        value: form.registration_deadline || "",
        onChange: (e) => setForm({ ...form, registration_deadline: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "G\xD6R\xDCN\xDCRL\xDCK" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-sm " + (form.is_public !== false ? "btn-pri" : "btn-ghost"),
        style: { flex: 1 },
        onClick: () => setForm({ ...form, is_public: true })
      },
      "\u{1F310} Herkese A\xE7\u0131k"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-sm " + (form.is_public === false ? "btn-pri" : "btn-ghost"),
        style: { flex: 1 },
        onClick: () => setForm({ ...form, is_public: false })
      },
      "\u{1F512} Sadece \xDCyeler"
    ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" } }, "\xD6d\xFCller (iste\u011Fe ba\u011Fl\u0131)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, [["prize_1", "\u{1F947} 1. S\u0131ra"], ["prize_2", "\u{1F948} 2. S\u0131ra"], ["prize_3", "\u{1F949} 3. S\u0131ra"]].map(([key, label]) => /* @__PURE__ */ React.createElement("div", { key, style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)", minWidth: 74 } }, label), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: form[key] || "",
        placeholder: "\xD6d\xFCl a\xE7\u0131klamas\u0131\u2026",
        onChange: (e) => setForm({ ...form, [key]: e.target.value }),
        style: { flex: 1, fontSize: 13 }
      }
    ))))), modal.type === "edit" && /* @__PURE__ */ React.createElement(Field, { label: "DURUM" }, /* @__PURE__ */ React.createElement("select", { value: form.status || "upcoming", onChange: (e) => setForm({ ...form, status: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "upcoming" }, "Yakla\u015Fan"), /* @__PURE__ */ React.createElement("option", { value: "ongoing" }, "Devam Ediyor"), /* @__PURE__ */ React.createElement("option", { value: "completed" }, "Tamamland\u0131"), /* @__PURE__ */ React.createElement("option", { value: "cancelled" }, "\u0130ptal"))))
  ));
}
const MONTH_NAMES_TR = ["Ocak", "\u015Eubat", "Mart", "Nisan", "May\u0131s", "Haziran", "Temmuz", "A\u011Fustos", "Eyl\xFCl", "Ekim", "Kas\u0131m", "Aral\u0131k"];
const DAY_LABELS = ["Paz", "Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt"];
const DAY_NAMES_FULL = ["Pazar", "Pazartesi", "Sal\u0131", "\xC7ar\u015Famba", "Per\u015Fembe", "Cuma", "Cumartesi"];
const formatH = (h, use15) => {
  const whole = Math.floor(h);
  const frac = h % 1;
  let min;
  if (use15) {
    min = frac >= 0.875 ? "45" : frac >= 0.625 ? "30" : frac >= 0.375 ? "15" : frac >= 0.125 ? "00" : "00";
    if (frac >= 0.875) min = "45";
    else if (frac >= 0.625) min = "30";
    else if (frac >= 0.375) min = "15";
    else min = "00";
  } else {
    min = frac >= 0.5 ? "30" : "00";
  }
  return String(whole).padStart(2, "0") + ":" + min;
};
function HourStepper({ value, onChange, min = 0, max = 23.5, step = 0.5 }) {
  const fmt = formatH(value, step === 0.25);
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => onChange(Math.max(min, Math.round((value - step) * 100) / 100)) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "remove")), /* @__PURE__ */ React.createElement("span", { style: { minWidth: 52, textAlign: "center", fontWeight: 700, fontSize: 14 } }, fmt), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => onChange(Math.min(max, Math.round((value + step) * 100) / 100)) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "add")));
}
const makeSlot = () => ({ courts: [], start: 9, end: 11 });
function PerDayScheduleSection({
  schedCourts,
  coaches,
  schedSelDays,
  setSchedSelDays,
  daySettings,
  setDaySettings,
  schedSelCoaches,
  setSchedSelCoaches,
  diffCoachPerDay,
  setDiffCoachPerDay,
  dayCoachIds,
  setDayCoachIds,
  schedConflicts,
  schedChecking,
  compact,
  use15Min,
  setUse15Min
}) {
  const step = use15Min ? 0.25 : 0.5;
  const toggleDay = (i) => {
    if (schedSelDays.includes(i)) {
      setSchedSelDays((prev) => prev.filter((x) => x !== i));
      setDaySettings((ds) => {
        const n = { ...ds };
        delete n[i];
        return n;
      });
      setDayCoachIds((dc) => {
        const n = { ...dc };
        delete n[i];
        return n;
      });
    } else {
      setSchedSelDays((prev) => [...prev, i].sort((a, b) => a - b));
      setDaySettings((ds) => ({ ...ds, [i]: ds[i] ?? [makeSlot()] }));
    }
  };
  const updateSlot = (dayIdx, slotIdx, patch) => {
    setDaySettings((prev) => {
      const slots = [...prev[dayIdx] ?? [makeSlot()]];
      slots[slotIdx] = { ...slots[slotIdx], ...patch };
      return { ...prev, [dayIdx]: slots };
    });
  };
  const toggleSlotCourt = (dayIdx, slotIdx, courtId) => {
    setDaySettings((prev) => {
      const slots = [...prev[dayIdx] ?? [makeSlot()]];
      const cur = slots[slotIdx].courts ?? [];
      slots[slotIdx] = { ...slots[slotIdx], courts: cur.includes(courtId) ? cur.filter((x) => x !== courtId) : [...cur, courtId] };
      return { ...prev, [dayIdx]: slots };
    });
  };
  const addSlot = (dayIdx) => {
    setDaySettings((prev) => {
      const slots = prev[dayIdx] ?? [makeSlot()];
      const last = slots[slots.length - 1];
      return { ...prev, [dayIdx]: [...slots, { courts: [...last.courts], start: last.end, end: Math.min(23, last.end + 2) }] };
    });
  };
  const removeSlot = (dayIdx, slotIdx) => {
    setDaySettings((prev) => {
      const slots = (prev[dayIdx] ?? [makeSlot()]).filter((_, i) => i !== slotIdx);
      return { ...prev, [dayIdx]: slots.length ? slots : [makeSlot()] };
    });
  };
  const toggleDayCoach = (dayIdx, coachId) => {
    setDayCoachIds((prev) => {
      const cur = prev[dayIdx] || [];
      const next = cur.includes(coachId) ? cur.filter((x) => x !== coachId) : [...cur, coachId];
      return { ...prev, [dayIdx]: next };
    });
  };
  const sortedDays = [...schedSelDays].sort((a, b) => a - b);
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14, ...compact ? { borderTop: "1px solid var(--border)", paddingTop: 14 } : {} } }, compact && /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "event_repeat"), "Haftal\u0131k Program (iste\u011Fe ba\u011Fl\u0131)"), setUse15Min && /* @__PURE__ */ React.createElement(
    Switch,
    {
      on: !!use15Min,
      onChange: setUse15Min,
      label: "15 Dakikal\u0131k Art\u0131\u015F (22:15 gibi saatler)"
    }
  ), /* @__PURE__ */ React.createElement(Field, { label: "G\xDCNLER" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, DAY_LABELS.map((d, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: d,
      type: "button",
      className: "btn btn-sm " + (schedSelDays.includes(i) ? "btn-pri" : "btn-ghost"),
      style: { flex: 1, minWidth: 40 },
      onClick: () => toggleDay(i)
    },
    d
  )))), schedSelDays.length > 0 && coaches.length > 0 && /* @__PURE__ */ React.createElement(Field, { label: "ANTREN\xD6RLER" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 } }, !diffCoachPerDay && coaches.map((c) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: c.id,
      type: "button",
      className: "btn btn-sm " + (schedSelCoaches.includes(c.id) ? "btn-pri" : "btn-ghost"),
      onClick: () => setSchedSelCoaches(
        (prev) => prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
      )
    },
    c.full_name
  )), diffCoachPerDay && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)" } }, "Antren\xF6rler g\xFCn baz\u0131nda atan\u0131yor")), schedSelDays.length > 1 && /* @__PURE__ */ React.createElement(
    Switch,
    {
      on: diffCoachPerDay,
      onChange: (v) => setDiffCoachPerDay(v),
      label: "Her g\xFCn farkl\u0131 antren\xF6r"
    }
  )), sortedDays.map((dayIdx) => {
    const slots = daySettings[dayIdx] ?? [makeSlot()];
    return /* @__PURE__ */ React.createElement("div", { key: dayIdx, style: {
      background: "var(--bg)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 12
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--brand-navy)", display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "calendar_today"), DAY_NAMES_FULL[dayIdx]), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-ghost btn-sm",
        style: { fontSize: 12, color: "#0D9488" },
        onClick: () => addSlot(dayIdx)
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "add"),
      " Seans Ekle"
    )), diffCoachPerDay && coaches.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" } }, "Antren\xF6r"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, coaches.map((c) => {
      const sel = (dayCoachIds[dayIdx] || []).includes(c.id);
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: c.id,
          type: "button",
          className: "btn btn-sm " + (sel ? "btn-pri" : "btn-ghost"),
          onClick: () => toggleDayCoach(dayIdx, c.id)
        },
        c.full_name
      );
    }))), slots.map((sl, slotIdx) => {
      const timeError = sl.start >= sl.end;
      return /* @__PURE__ */ React.createElement("div", { key: slotIdx, style: {
        background: slotIdx === 0 ? "transparent" : "var(--surface, #fff)",
        border: slots.length > 1 ? "1px dashed var(--border)" : "none",
        borderRadius: 10,
        padding: slots.length > 1 ? "10px 12px" : 0,
        display: "flex",
        flexDirection: "column",
        gap: 10
      } }, slots.length > 1 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-2)" } }, "Seans ", slotIdx + 1), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "btn btn-danger btn-sm btn-icon",
          onClick: () => removeSlot(dayIdx, slotIdx),
          title: "Bu seans\u0131 kald\u0131r"
        },
        /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "close")
      )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" } }, "Kort"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, schedCourts.map((c) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: c.id,
          type: "button",
          className: "btn btn-sm " + ((sl.courts ?? []).includes(c.id) ? "btn-pri" : "btn-ghost"),
          onClick: () => toggleSlotCourt(dayIdx, slotIdx, c.id)
        },
        "Kort ",
        c.court_number
      )), schedCourts.length === 0 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)" } }, "Aktif kort yok"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" } }, "Saat Aral\u0131\u011F\u0131"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(HourStepper, { value: sl.start, onChange: (v) => updateSlot(dayIdx, slotIdx, { start: v }), min: 0, max: 22.5, step }), /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "var(--text-2)", fontSize: 18 } }, "arrow_forward"), /* @__PURE__ */ React.createElement(HourStepper, { value: sl.end, onChange: (v) => updateSlot(dayIdx, slotIdx, { end: v }), min: 0.5, max: 23, step })), timeError && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, color: "#EF4444", fontSize: 12, display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "error_outline"), "Biti\u015F saati ba\u015Flang\u0131\xE7tan b\xFCy\xFCk olmal\u0131")));
    }));
  }), schedSelDays.length > 0 && /* @__PURE__ */ React.createElement("div", null, schedChecking ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, color: "var(--text-2)", fontSize: 13 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "refresh"), "\xC7ak\u0131\u015Fma kontrol\xFC yap\u0131l\u0131yor\u2026") : schedConflicts.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: 10,
    padding: "9px 12px"
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "#22C55E", fontSize: 16 } }, "check_circle"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "#22C55E", fontWeight: 600 } }, "\xC7ak\u0131\u015Fma yok")) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: "#F59E0B", fontSize: 15 } }, "warning"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#F59E0B" } }, schedConflicts.length, " \xE7ak\u0131\u015Fma \u2014 program kaydedilemez")), schedConflicts.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 8,
    padding: "7px 10px",
    marginBottom: 4,
    background: c.type === "court" ? "#FEF2F2" : "#FFFBEB",
    border: `1px solid ${c.type === "court" ? "#FECACA" : "#FDE68A"}`
  } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: {
    fontSize: 13,
    marginTop: 1,
    color: c.type === "court" ? "#EF4444" : "#F59E0B"
  } }, c.type === "court" ? "sports_tennis" : "person"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12 } }, c.msg))))));
}
function GroupsScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [groups, setGroups] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupModal, setGroupModal] = useState(null);
  const [form, setForm] = useState({});
  const [newMembers, setNewMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedCoachIds, setSelectedCoachIds] = useState([]);
  const [coachShares, setCoachShares] = useState({});
  const [splitType, setSplitType] = useState("percentage");
  const [coachFixedAmounts, setCoachFixedAmounts] = useState({});
  const [use15Min, setUse15Min] = useState(false);
  const [membersModal, setMembersModal] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [addMemberForm, setAddMemberForm] = useState({});
  const [memberSaving, setMemberSaving] = useState(false);
  const [editMemberRow, setEditMemberRow] = useState(null);
  const [duesModal, setDuesModal] = useState(null);
  const [duesYear, setDuesYear] = useState((/* @__PURE__ */ new Date()).getFullYear());
  const [duesMonth, setDuesMonth] = useState((/* @__PURE__ */ new Date()).getMonth() + 1);
  const [dues, setDues] = useState([]);
  const [duesPost, setDuesPost] = useState(null);
  const [duesLoading, setDuesLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [schedModal, setSchedModal] = useState(null);
  const [schedCourts, setSchedCourts] = useState([]);
  const [schedSelDays, setSchedSelDays] = useState([]);
  const [schedSelCoaches, setSchedSelCoaches] = useState([]);
  const [daySettings, setDaySettings] = useState({});
  const [diffCoachPerDay, setDiffCoachPerDay] = useState(false);
  const [dayCoachIds, setDayCoachIds] = useState({});
  const [schedConflicts, setSchedConflicts] = useState([]);
  const [schedChecking, setSchedChecking] = useState(false);
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedDebounce, setSchedDebounce] = useState(null);
  useEffect(() => {
    if (clubId) {
      loadGroups();
      loadCoaches();
    }
  }, [clubId]);
  const loadGroups = async () => {
    setLoading(true);
    const { data } = await sb.from("club_groups").select("*, coach:club_coaches(id, full_name), members:club_group_members(*)").eq("club_id", clubId).order("created_at", { ascending: false });
    const groupIds = (data || []).map((g) => g.id);
    let schedMap = {};
    if (groupIds.length > 0) {
      const { data: closures } = await sb.from("court_closures").select("group_id, day_of_week, start_hour, start_minute, end_hour, end_minute, courts(court_number)").in("group_id", groupIds).eq("is_active", true);
      const DAY_SHORT = ["Paz", "Pzt", "Sal", "\xC7ar", "Per", "Cum", "Cmt"];
      for (const c of closures ?? []) {
        if (!schedMap[c.group_id]) schedMap[c.group_id] = [];
        schedMap[c.group_id].push(c);
      }
      for (const gid of Object.keys(schedMap)) {
        const rows = schedMap[gid];
        const seenDays = /* @__PURE__ */ new Set();
        const dayLabels = [];
        for (const r of rows) {
          const dk = `${r.day_of_week}_${r.start_hour}_${r.start_minute ?? 0}_${r.end_hour}_${r.end_minute ?? 0}`;
          if (seenDays.has(dk)) continue;
          seenDays.add(dk);
          const sh = String(r.start_hour).padStart(2, "0") + ":" + String(r.start_minute ?? 0).padStart(2, "0");
          const eh = String(r.end_hour).padStart(2, "0") + ":" + String(r.end_minute ?? 0).padStart(2, "0");
          dayLabels.push(`${DAY_SHORT[r.day_of_week]} ${sh}\u2013${eh}`);
        }
        schedMap[gid] = dayLabels.join(" \xB7 ");
      }
    }
    setGroups((data || []).map((g) => ({
      ...g,
      member_count: g.members?.length ?? 0,
      _schedule: schedMap[g.id] || null
    })));
    setLoading(false);
  };
  const loadCoaches = async () => {
    const { data } = await sb.from("club_coaches").select("id,full_name").eq("club_id", clubId).eq("is_active", true);
    setCoaches(data || []);
  };
  const buildPerDayState = (existing, fallbackCoachId) => {
    const days = [...new Set(existing.map((c) => c.day_of_week))];
    const newDaySettings = {};
    const newDayCoachIds = {};
    for (const day of days) {
      const dc = existing.filter((c) => c.day_of_week === day);
      const slotMap = {};
      for (const c of dc) {
        const key = `${c.start_hour}_${c.start_minute ?? 0}_${c.end_hour}_${c.end_minute ?? 0}`;
        if (!slotMap[key]) {
          slotMap[key] = {
            courts: [],
            start: c.start_hour + (c.start_minute ?? 0) / 60,
            end: c.end_hour + (c.end_minute ?? 0) / 60
          };
        }
        if (c.court_id && !slotMap[key].courts.includes(c.court_id)) {
          slotMap[key].courts.push(c.court_id);
        }
      }
      newDaySettings[day] = Object.values(slotMap);
      if (newDaySettings[day].length === 0) newDaySettings[day] = [{ courts: [], start: 9, end: 11 }];
      const cIds = [...new Set(dc.filter((c) => c.coach_id).map((c) => c.coach_id))];
      if (cIds.length > 0) newDayCoachIds[day] = cIds;
    }
    const allCoachIds = [...new Set(existing.filter((c) => c.coach_id).map((c) => c.coach_id))];
    const globalCoachIds = allCoachIds.length > 0 ? allCoachIds : fallbackCoachId ? [fallbackCoachId] : [];
    const hasDiff = days.length > 1 && Object.keys(newDayCoachIds).length > 0 && days.some((d) => {
      const a = (newDayCoachIds[days[0]] || []).slice().sort().join(",");
      const b = (newDayCoachIds[d] || []).slice().sort().join(",");
      return a !== b;
    });
    return { days, newDaySettings, newDayCoachIds, globalCoachIds, hasDiff };
  };
  const openSchedule = async (group) => {
    const { data: courtData } = await sb.from("courts").select("id, court_number, court_type").eq("club_id", clubId).eq("is_active", true).order("court_number");
    setSchedCourts(courtData ?? []);
    const existing = await GroupScheduleSvc.getGroupSchedule(group.id);
    const { days, newDaySettings, newDayCoachIds, globalCoachIds, hasDiff } = buildPerDayState(existing, group.coach_id);
    setSchedSelDays(days);
    setDaySettings(newDaySettings);
    setDayCoachIds(newDayCoachIds);
    setSchedSelCoaches(globalCoachIds);
    setDiffCoachPerDay(hasDiff);
    setSchedConflicts([]);
    setUse15Min(false);
    setSchedModal({ group });
  };
  useEffect(() => {
    if (!schedModal && !groupModal) return;
    if (schedSelDays.length === 0) {
      setSchedConflicts([]);
      return;
    }
    if (schedDebounce) clearTimeout(schedDebounce);
    const activeGroupId = schedModal?.group?.id ?? form?.id ?? null;
    const t = setTimeout(async () => {
      setSchedChecking(true);
      try {
        const conflicts = await GroupScheduleSvc.checkConflictsPerDay(
          activeGroupId,
          daySettings,
          schedSelDays,
          coaches,
          schedSelCoaches,
          diffCoachPerDay,
          dayCoachIds
        );
        setSchedConflicts(conflicts);
      } catch (e) {
        console.error(e);
      }
      setSchedChecking(false);
    }, 400);
    setSchedDebounce(t);
  }, [schedSelDays, daySettings, schedSelCoaches, diffCoachPerDay, dayCoachIds, schedModal, groupModal]);
  const saveSchedule = async () => {
    if (!schedSelDays.length) {
      alert("En az bir g\xFCn se\xE7in");
      return;
    }
    for (const d of schedSelDays) {
      const slots = daySettings[d] ?? [];
      if (!slots.length || slots.every((sl) => !sl.courts?.length)) {
        alert(`${DAY_NAMES_FULL[d]} i\xE7in en az bir seansa kort se\xE7in`);
        return;
      }
      for (const sl of slots) {
        if ((sl.start ?? 9) >= (sl.end ?? 11)) {
          alert(`${DAY_NAMES_FULL[d]}: Biti\u015F saati ba\u015Flang\u0131\xE7tan b\xFCy\xFCk olmal\u0131`);
          return;
        }
      }
    }
    if (schedConflicts.length) {
      alert("\xC7ak\u0131\u015Fmalar giderilmeden kaydedilemez");
      return;
    }
    setSchedSaving(true);
    try {
      await GroupScheduleSvc.saveGroupSchedulePerDay(
        schedModal.group.id,
        schedModal.group.name,
        daySettings,
        schedSelDays,
        schedSelCoaches,
        diffCoachPerDay,
        dayCoachIds
      );
      setSchedModal(null);
      loadGroups();
    } catch (e) {
      alert(e.message);
    } finally {
      setSchedSaving(false);
    }
  };
  const clearSchedule = async () => {
    if (!confirm("Bu grubun program\u0131 silinsin mi?")) return;
    await sb.from("court_closures").delete().eq("group_id", schedModal.group.id);
    setSchedModal(null);
    loadGroups();
  };
  const openCreate = async () => {
    setForm({ name: "", description: "", monthly_fee: "", club_percentage: 100, is_active: true });
    setNewMembers([
      { member_name: "", contact_number: "", contact_person: "", custom_fee: "" },
      { member_name: "", contact_number: "", contact_person: "", custom_fee: "" }
    ]);
    setSelectedCoachIds([]);
    setCoachShares({});
    setSplitType("percentage");
    setCoachFixedAmounts({});
    setUse15Min(false);
    const { data: courtData } = await sb.from("courts").select("id, court_number, court_type").eq("club_id", clubId).eq("is_active", true).order("court_number");
    setSchedCourts(courtData ?? []);
    setSchedSelDays([]);
    setSchedSelCoaches([]);
    setDaySettings({});
    setDiffCoachPerDay(false);
    setDayCoachIds({});
    setSchedConflicts([]);
    setUse15Min(false);
    setGroupModal({ type: "add" });
  };
  const openEdit = async (g) => {
    setForm({
      id: g.id,
      name: g.name,
      description: g.description || "",
      monthly_fee: g.monthly_fee ?? "",
      club_percentage: g.club_percentage ?? 100,
      is_active: g.is_active,
      split_type: g.split_type || "percentage"
    });
    const groupCoaches = g.coaches && g.coaches.length > 0 ? g.coaches : [];
    const ids = groupCoaches.map((c) => c.id);
    setSelectedCoachIds(ids);
    setSplitType(g.split_type || "percentage");
    const shares = {};
    const fixedAmts = {};
    groupCoaches.forEach((c) => {
      shares[c.id] = String(c.share_percentage ?? "");
      fixedAmts[c.id] = c.fixed_amount != null ? String(c.fixed_amount) : "";
    });
    setCoachShares(shares);
    setCoachFixedAmounts(fixedAmts);
    setUse15Min(false);
    const { data: courtData } = await sb.from("courts").select("id, court_number, court_type").eq("club_id", clubId).eq("is_active", true).order("court_number");
    setSchedCourts(courtData ?? []);
    const existing = await GroupScheduleSvc.getGroupSchedule(g.id);
    const { days, newDaySettings, newDayCoachIds, globalCoachIds, hasDiff } = buildPerDayState(existing, g.coach_id);
    setSchedSelDays(days);
    setDaySettings(newDaySettings);
    setDayCoachIds(newDayCoachIds);
    setSchedSelCoaches(globalCoachIds);
    setDiffCoachPerDay(hasDiff);
    setSchedConflicts([]);
    setGroupModal({ type: "edit", group: g });
  };
  const updateNewMember = (idx, field, val) => {
    setNewMembers((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };
  const addNewMemberRow = () => {
    setNewMembers((prev) => [...prev, { member_name: "", contact_number: "", contact_person: "", custom_fee: "" }]);
  };
  const removeNewMemberRow = (idx) => {
    setNewMembers((prev) => prev.filter((_, i) => i !== idx));
  };
  const saveGroup = async () => {
    if (!form.name?.trim()) {
      alert("Grup ad\u0131 zorunludur.");
      return;
    }
    if (groupModal.type === "add") {
      const valid = newMembers.filter((m) => m.member_name.trim());
      if (valid.length < 2) {
        alert("Grup olu\u015Fturmak i\xE7in en az 2 \xFCye gereklidir.");
        return;
      }
    }
    if (schedConflicts.length) {
      alert("Program \xE7ak\u0131\u015Fmalar\u0131 giderilmeden kaydedilemez.");
      return;
    }
    for (const d of schedSelDays) {
      const slots = daySettings[d] ?? [{ start: 9, end: 11 }];
      for (const sl of slots) {
        if ((sl.start ?? 9) >= (sl.end ?? 11)) {
          alert(`${DAY_NAMES_FULL[d]}: Biti\u015F saati ba\u015Flang\u0131\xE7tan b\xFCy\xFCk olmal\u0131.`);
          return;
        }
      }
    }
    const clubPct = Number(form.club_percentage);
    if (splitType === "percentage" && !isNaN(clubPct) && form.club_percentage !== "" && (clubPct < 0 || clubPct > 100)) {
      alert("Kul\xFCp y\xFCzdesi 0-100 aras\u0131nda olmal\u0131d\u0131r.");
      return;
    }
    if (splitType === "percentage" && selectedCoachIds.length > 1) {
      const total = selectedCoachIds.reduce((s, id) => s + (parseFloat(coachShares[id]) || 0), 0);
      if (Math.abs(total - 100) > 0.1) {
        alert(`Antren\xF6r paylar\u0131 toplam\u0131 %100 olmal\u0131 (\u015Fu an: %${total.toFixed(1)})`);
        return;
      }
    }
    setSaving(true);
    try {
      const primaryCoachId = selectedCoachIds[0] || null;
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        monthly_fee: form.monthly_fee !== "" ? Number(form.monthly_fee) : 0,
        club_percentage: splitType === "percentage" ? Number(form.club_percentage) || 100 : 100,
        split_type: splitType,
        coach_id: primaryCoachId,
        is_active: form.is_active !== false
      };
      const coachRows = selectedCoachIds.map((coachId, i) => {
        const equalShare = parseFloat((100 / selectedCoachIds.length).toFixed(2));
        return {
          coach_id: coachId,
          share_percentage: selectedCoachIds.length === 1 ? 100 : i === selectedCoachIds.length - 1 ? parseFloat((100 - equalShare * (selectedCoachIds.length - 1)).toFixed(2)) : parseFloat(coachShares[coachId]) || equalShare,
          fixed_amount: splitType === "fixed_amount" ? parseFloat(coachFixedAmounts[coachId] ?? "") || null : null
        };
      });
      let savedGroupId = form.id;
      if (groupModal.type === "add") {
        const validMembers = newMembers.filter((m) => m.member_name.trim()).map((m) => ({
          member_name: m.member_name.trim(),
          contact_number: m.contact_number?.trim() || null,
          contact_person: m.contact_person?.trim() || null,
          custom_fee: m.custom_fee?.trim() ? parseFloat(m.custom_fee) : null
        }));
        const created = await GroupSvc.createGroup(clubId, payload, validMembers, coachRows);
        savedGroupId = created?.id ?? savedGroupId;
      } else {
        await GroupSvc.updateGroup(form.id, payload, coachRows);
      }
      if (savedGroupId && schedSelDays.length > 0) {
        await GroupScheduleSvc.saveGroupSchedulePerDay(
          savedGroupId,
          form.name.trim(),
          daySettings,
          schedSelDays,
          schedSelCoaches,
          diffCoachPerDay,
          dayCoachIds
        );
      }
      setGroupModal(null);
      loadGroups();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const deleteGroup = async (g) => {
    if (!confirm(`"${g.name}" grubunu ve t\xFCm \xFCye/aidat kay\u0131tlar\u0131n\u0131 silmek istedi\u011Finize emin misiniz?`)) return;
    try {
      await GroupSvc.deleteGroup(g.id);
      loadGroups();
    } catch (e) {
      alert(e.message);
    }
  };
  const toggleStatus = async (g) => {
    try {
      await GroupSvc.toggleGroupStatus(g.id);
      loadGroups();
    } catch (e) {
      alert(e.message);
    }
  };
  const openMembers = (g) => {
    setMembersModal({ group: g });
    setGroupMembers(g.members || []);
    setAddMemberForm({ member_name: "", contact_number: "", contact_person: "", custom_fee: "" });
    setEditMemberRow(null);
  };
  const addMember = async () => {
    if (!addMemberForm.member_name?.trim()) {
      alert("\xDCye ad\u0131 zorunludur.");
      return;
    }
    setMemberSaving(true);
    try {
      const cfStr = addMemberForm.custom_fee?.trim();
      const m = await GroupSvc.addMember(membersModal.group.id, {
        member_name: addMemberForm.member_name.trim(),
        contact_number: addMemberForm.contact_number?.trim() || null,
        contact_person: addMemberForm.contact_person?.trim() || null,
        custom_fee: cfStr ? parseFloat(cfStr) : null
      });
      setGroupMembers((prev) => [...prev, m]);
      setAddMemberForm({ member_name: "", contact_number: "", contact_person: "", custom_fee: "" });
      loadGroups();
    } catch (e) {
      alert(e.message);
    } finally {
      setMemberSaving(false);
    }
  };
  const removeMember = async (memberId) => {
    if (!confirm("Bu \xFCyeyi gruptan \xE7\u0131karmak istedi\u011Finize emin misiniz?")) return;
    try {
      await GroupSvc.removeMember(memberId);
      setGroupMembers((prev) => prev.filter((m) => m.id !== memberId));
      loadGroups();
    } catch (e) {
      alert(e.message);
    }
  };
  const saveEditMember = async (memberId, updated) => {
    if (!updated.member_name?.trim()) {
      alert("\xDCye ad\u0131 zorunludur.");
      return;
    }
    try {
      const cfStr = updated.custom_fee?.trim();
      const m = await GroupSvc.updateMember(memberId, {
        member_name: updated.member_name.trim(),
        contact_number: updated.contact_number?.trim() || null,
        contact_person: updated.contact_person?.trim() || null,
        custom_fee: cfStr ? parseFloat(cfStr) : null
      });
      setGroupMembers((prev) => prev.map((x) => x.id === memberId ? m : x));
      setEditMemberRow(null);
      loadGroups();
    } catch (e) {
      alert(e.message);
    }
  };
  const openDues = async (g) => {
    const now = /* @__PURE__ */ new Date();
    const y = now.getFullYear(), mo = now.getMonth() + 1;
    setDuesModal({ group: g });
    setDuesYear(y);
    setDuesMonth(mo);
    await loadDues(g, y, mo);
  };
  const loadDues = async (g, year, month) => {
    setDuesLoading(true);
    try {
      const [duesData, postData] = await Promise.all([
        GroupDuesSvc.getOrCreateDues(g.id, year, month, g.monthly_fee || 0),
        GroupDuesSvc.getDuesPost(g.id, year, month)
      ]);
      setDues(duesData);
      setDuesPost(postData);
    } catch (e) {
      console.error(e);
    } finally {
      setDuesLoading(false);
    }
  };
  const changeMonth = async (delta) => {
    let m = duesMonth + delta, y = duesYear;
    if (m > 12) {
      m = 1;
      y++;
    }
    if (m < 1) {
      m = 12;
      y--;
    }
    setDuesMonth(m);
    setDuesYear(y);
    await loadDues(duesModal.group, y, m);
  };
  const toggleDuePaid = async (due) => {
    if (duesPost) return;
    try {
      const updated = await GroupDuesSvc.toggleDuePaid(due.id, !due.is_paid);
      setDues((prev) => prev.map((d) => d.id === due.id ? updated : d));
    } catch (e) {
      alert(e.message);
    }
  };
  const postToFinance = async () => {
    if (!confirm("Bu ay\u0131n aidatlar\u0131n\u0131 finanslara i\u015Flemek istedi\u011Finize emin misiniz?")) return;
    setPosting(true);
    try {
      const g = duesModal.group;
      await GroupDuesSvc.postDuesToFinance(
        g.id,
        g.name,
        duesYear,
        duesMonth,
        dues,
        g.club_percentage ?? 100,
        g.split_type || "percentage",
        g.coaches || []
      );
      await loadDues(g, duesYear, duesMonth);
    } catch (e) {
      alert(e.message);
    } finally {
      setPosting(false);
    }
  };
  const paidCount = dues.filter((d) => d.is_paid).length;
  const totalDues = dues.reduce((s, d) => s + (d.amount || 0), 0);
  const paidAmount = dues.filter((d) => d.is_paid).reduce((s, d) => s + (d.amount || 0), 0);
  const coachPct = duesModal ? 100 - (duesModal.group.club_percentage ?? 100) : 0;
  const calcClubAmount = () => {
    if (!duesModal) return 0;
    const g = duesModal.group;
    if ((g.split_type || "percentage") === "fixed_amount" && g.coaches?.length > 0) {
      const totalFixed = g.coaches.reduce((s, c) => s + (c.fixed_amount ?? 0), 0);
      return Math.max(0, totalDues - Math.min(totalFixed, totalDues));
    }
    return Math.round(totalDues * ((g.club_percentage ?? 100) / 100) * 100) / 100;
  };
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Gruplar"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, groups.length, " grup kay\u0131tl\u0131")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: openCreate }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), " Grup Olu\u015Ftur")), loading ? /* @__PURE__ */ React.createElement(Spinner, null) : groups.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "groups", title: "Hen\xFCz grup yok", sub: "\u0130lk grubunuzu olu\u015Fturun." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 } }, groups.map((g) => {
    const coachShare = 100 - (g.club_percentage ?? 100);
    return /* @__PURE__ */ React.createElement("div", { key: g.id, className: "card", style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 16 } }, g.name), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "3px 10px",
          borderRadius: 20,
          backgroundColor: g.is_active ? "#DCFCE7" : "#FEF3C7",
          color: g.is_active ? "#22C55E" : "#F59E0B",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0
        },
        onClick: () => toggleStatus(g),
        title: "Durumu de\u011Fi\u015Ftir"
      },
      g.is_active ? "Aktif" : "Pasif"
    )), g.description && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--text-2)", margin: 0 } }, g.description), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 9px", display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "group"), g.member_count, " \xFCye"), g.monthly_fee > 0 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 9px", display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13 } }, "payments"), fmtMoney(g.monthly_fee), "/ay"), (g.coaches && g.coaches.length > 0 ? g.coaches : g.coach ? [{ id: g.coach.id, full_name: g.coach.full_name, share_percentage: 100 }] : []).map((c) => /* @__PURE__ */ React.createElement("span", { key: c.id, style: { fontSize: 12, color: "var(--brand-navy)", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, padding: "4px 9px", fontWeight: 600 } }, c.full_name)), coachShare > 0 && (!g.coaches || g.coaches.length === 0) && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#8B5CF6", background: "#F3E8FF", border: "1px solid #DDD6FE", borderRadius: 8, padding: "4px 9px" } }, "Ko\xE7 %", coachShare)), g._schedule && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#0D9488", display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 12 } }, "event_repeat"), g._schedule), /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "var(--border)" } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { flex: 1, color: "#0D9488" }, onClick: () => openSchedule(g) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "event_repeat"), " Program"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { flex: 1, color: "#8B5CF6" }, onClick: () => openDues(g) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "payments"), " Aidat"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", style: { flex: 1 }, onClick: () => openMembers(g) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "manage_accounts"), " \xDCyeler"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", title: "D\xFCzenle", onClick: () => openEdit(g) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "edit")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", title: "Sil", onClick: () => deleteGroup(g) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "delete"))));
  })), groupModal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: groupModal.type === "add" ? "Grup Olu\u015Ftur" : "Grubu D\xFCzenle",
      wide: true,
      onClose: () => setGroupModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setGroupModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: saveGroup, disabled: saving }, saving ? "Kaydediliyor\u2026" : groupModal.type === "add" ? "Olu\u015Ftur" : "G\xFCncelle"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Field, { label: "Grup Ad\u0131 *" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: form.name || "",
        placeholder: "\xD6rn: Pazartesi Ba\u015Flang\u0131\xE7 Grubu",
        onChange: (e) => setForm({ ...form, name: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "A\xE7\u0131klama" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: 2,
        value: form.description || "",
        placeholder: "Grup hakk\u0131nda k\u0131sa bilgi\u2026",
        onChange: (e) => setForm({ ...form, description: e.target.value }),
        style: { resize: "vertical" }
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Ayl\u0131k \xDCcret (\u20BA)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        placeholder: "0",
        value: form.monthly_fee ?? "",
        onChange: (e) => setForm({ ...form, monthly_fee: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "ANTREN\xD6RLER (birden fazla se\xE7ilebilir)" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 } }, coaches.length === 0 ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)" } }, "Aktif antren\xF6r bulunamad\u0131") : coaches.map((c) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: c.id,
        type: "button",
        className: "btn btn-sm " + (selectedCoachIds.includes(c.id) ? "btn-pri" : "btn-ghost"),
        onClick: () => {
          const next = selectedCoachIds.includes(c.id) ? selectedCoachIds.filter((id) => id !== c.id) : [...selectedCoachIds, c.id];
          setSelectedCoachIds(next);
          if (next.length > 0) {
            const equal = parseFloat((100 / next.length).toFixed(2));
            const s = {};
            next.forEach((id, i) => {
              s[id] = i === next.length - 1 ? (100 - equal * (next.length - 1)).toFixed(2) : equal.toFixed(2);
            });
            setCoachShares(s);
          } else {
            setCoachShares({});
          }
        }
      },
      c.full_name
    )))), selectedCoachIds.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "PAY MODEL\u0130" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-sm " + (splitType === "percentage" ? "btn-pri" : "btn-ghost"),
        style: { flex: 1 },
        onClick: () => setSplitType("percentage")
      },
      "% Y\xFCzde"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-sm " + (splitType === "fixed_amount" ? "btn-pri" : "btn-ghost"),
        style: { flex: 1 },
        onClick: () => setSplitType("fixed_amount")
      },
      "\u20BA Sabit Tutar"
    ))), splitType === "percentage" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "Kul\xFCp Pay\u0131 (%)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        max: 100,
        placeholder: "100",
        value: form.club_percentage ?? 100,
        onChange: (e) => setForm({ ...form, club_percentage: e.target.value })
      }
    )), Number(form.club_percentage) < 100 && /* @__PURE__ */ React.createElement("div", { style: { background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#7C3AED" } }, "Antren\xF6r pay\u0131: %", 100 - Number(form.club_percentage || 0)), selectedCoachIds.length > 1 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", null, "ANTREN\xD6R PAYLARI (toplam %100)"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        style: { fontSize: 11, color: "var(--brand-navy)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 },
        onClick: () => {
          const equal = parseFloat((100 / selectedCoachIds.length).toFixed(2));
          const s = {};
          selectedCoachIds.forEach((id, i) => {
            s[id] = i === selectedCoachIds.length - 1 ? (100 - equal * (selectedCoachIds.length - 1)).toFixed(2) : equal.toFixed(2);
          });
          setCoachShares(s);
        }
      },
      "= E\u015Fit B\xF6l"
    )), selectedCoachIds.map((id) => {
      const coach = coaches.find((c) => c.id === id);
      return /* @__PURE__ */ React.createElement("div", { key: id, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 13 } }, coach?.full_name), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          min: 0,
          max: 100,
          placeholder: "0",
          value: coachShares[id] ?? "",
          onChange: (e) => setCoachShares((p) => ({ ...p, [id]: e.target.value })),
          style: { width: 70, textAlign: "center", fontSize: 13 }
        }
      ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-2)" } }, "%"));
    }), (() => {
      const total = selectedCoachIds.reduce((s, id) => s + (parseFloat(coachShares[id]) || 0), 0);
      const ok = Math.abs(total - 100) < 0.1;
      return /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: ok ? "#22C55E" : "#EF4444" } }, "Toplam: %", total.toFixed(1), " ", ok ? "\u2713" : "\u2717 (100 olmal\u0131)");
    })())), splitType === "fixed_amount" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" } }, "Antren\xF6r Sabit Tutarlar\u0131 (\u20BA)"), selectedCoachIds.map((id) => {
      const coach = coaches.find((c) => c.id === id);
      return /* @__PURE__ */ React.createElement("div", { key: id, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontSize: 13 } }, coach?.full_name), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          min: 0,
          placeholder: "0",
          value: coachFixedAmounts[id] ?? "",
          onChange: (e) => setCoachFixedAmounts((p) => ({ ...p, [id]: e.target.value })),
          style: { width: 100, fontSize: 13 }
        }
      ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--text-2)" } }, "\u20BA"));
    }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 4 } }, "Girilen tutarlar toplam\u0131 hocalara da\u011F\u0131t\u0131l\u0131r, geri kalan kul\xFCbe gider"))), selectedCoachIds.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, "Antren\xF6r se\xE7ilmezse t\xFCm aidat kul\xFCbe gider"), /* @__PURE__ */ React.createElement(Switch, { on: form.is_active !== false, onChange: (v) => setForm({ ...form, is_active: v }), label: "Aktif Grup" }), groupModal.type === "add" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--text-2)" } }, "\xDCyeler ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--danger)" } }, "*"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, marginLeft: 6, fontSize: 12 } }, "(en az 2)")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: addNewMemberRow }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "add"), " \xDCye Ekle")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, newMembers.map((m, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, style: { display: "grid", gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr auto", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: `\xDCye ${idx + 1} ad\u0131 *`,
        value: m.member_name,
        onChange: (e) => updateNewMember(idx, "member_name", e.target.value),
        style: { fontSize: 13 }
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "Telefon",
        value: m.contact_number,
        onChange: (e) => updateNewMember(idx, "contact_number", e.target.value),
        style: { fontSize: 13 }
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "Veli / \u0130leti\u015Fim",
        value: m.contact_person,
        onChange: (e) => updateNewMember(idx, "contact_person", e.target.value),
        style: { fontSize: 13 }
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        placeholder: `\xD6zel \xFCcret (\u20BA)`,
        value: m.custom_fee ?? "",
        onChange: (e) => updateNewMember(idx, "custom_fee", e.target.value),
        style: { fontSize: 13 },
        title: "Bo\u015F b\u0131rak\u0131l\u0131rsa grup aidat\u0131 uygulan\u0131r"
      }
    ), newMembers.length > 2 && /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", onClick: () => removeNewMemberRow(idx) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "remove")))))), /* @__PURE__ */ React.createElement(
      PerDayScheduleSection,
      {
        schedCourts,
        coaches,
        schedSelDays,
        setSchedSelDays,
        daySettings,
        setDaySettings,
        schedSelCoaches,
        setSchedSelCoaches,
        diffCoachPerDay,
        setDiffCoachPerDay,
        dayCoachIds,
        setDayCoachIds,
        schedConflicts,
        schedChecking,
        use15Min,
        setUse15Min,
        compact: true
      }
    ))
  ), membersModal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: `${membersModal.group.name} \u2014 \xDCyeler`,
      wide: true,
      onClose: () => setMembersModal(null),
      footer: /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setMembersModal(null) }, "Kapat")
    },
    groupMembers.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "var(--text-2)", fontSize: 13, padding: "20px 0" } }, "Hen\xFCz \xFCye yok") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 } }, groupMembers.map((m) => /* @__PURE__ */ React.createElement("div", { key: m.id }, editMemberRow === m.id ? /* @__PURE__ */ React.createElement(EditMemberRow, { member: m, onSave: saveEditMember, onCancel: () => setEditMemberRow(null) }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, background: "var(--bg)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(Av, { name: m.member_name, size: "sm" }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, m.member_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap" } }, m.contact_number && /* @__PURE__ */ React.createElement("span", null, "\u{1F4DE} ", m.contact_number), m.contact_person && /* @__PURE__ */ React.createElement("span", null, "\u{1F464} ", m.contact_person), m.custom_fee != null && /* @__PURE__ */ React.createElement("span", { style: { color: "#7C3AED", fontWeight: 600 } }, "\u{1F4B0} ", fmtMoney(m.custom_fee), "/ay"))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", title: "D\xFCzenle", onClick: () => setEditMemberRow(m.id) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "edit")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", title: "\xC7\u0131kar", onClick: () => removeMember(m.id) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "person_remove")))))),
    /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px solid var(--border)", paddingTop: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--text-2)", marginBottom: 8 } }, "Yeni \xDCye Ekle"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "\xDCye ad\u0131 soyad\u0131 *",
        value: addMemberForm.member_name || "",
        onChange: (e) => setAddMemberForm({ ...addMemberForm, member_name: e.target.value }),
        style: { fontSize: 13 }
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "Telefon numaras\u0131",
        value: addMemberForm.contact_number || "",
        onChange: (e) => setAddMemberForm({ ...addMemberForm, contact_number: e.target.value }),
        style: { fontSize: 13 }
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "Veli / \u0130leti\u015Fim ki\u015Fisi",
        value: addMemberForm.contact_person || "",
        onChange: (e) => setAddMemberForm({ ...addMemberForm, contact_person: e.target.value }),
        style: { fontSize: 13 }
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        placeholder: "\xD6zel \xFCcret (\u20BA)",
        value: addMemberForm.custom_fee || "",
        onChange: (e) => setAddMemberForm({ ...addMemberForm, custom_fee: e.target.value }),
        style: { fontSize: 13 },
        title: "Bo\u015F b\u0131rak\u0131l\u0131rsa grup aidat\u0131 uygulan\u0131r"
      }
    )), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: addMember, disabled: memberSaving }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "person_add"), memberSaving ? "Ekleniyor\u2026" : "\xDCye Ekle"))
  ), duesModal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: `${duesModal.group.name} \u2014 Aidat Y\xF6netimi`,
      wide: true,
      onClose: () => setDuesModal(null),
      footer: /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setDuesModal(null) }, "Kapat")
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 16px", borderBottom: "1px solid var(--border)", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => changeMonth(-1) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_left")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 15 } }, MONTH_NAMES_TR[duesMonth - 1], " ", duesYear), duesPost && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#22C55E", fontWeight: 700, marginTop: 2 } }, "\u2713 Finanslara i\u015Flendi")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => changeMonth(1) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_right"))),
    duesLoading ? /* @__PURE__ */ React.createElement(Spinner, null) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg)", borderRadius: 10, padding: "10px 12px", textAlign: "center", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, color: "var(--brand-navy)" } }, paidCount, "/", dues.length), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2 } }, "\xD6deyen")), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg)", borderRadius: 10, padding: "10px 12px", textAlign: "center", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, color: "#22C55E" } }, fmtMoney(paidAmount)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2 } }, "Toplanan")), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg)", borderRadius: 10, padding: "10px 12px", textAlign: "center", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800 } }, fmtMoney(totalDues)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2 } }, "Toplam Beklenen"))), dues.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "payments", title: "Bu ay i\xE7in \xFCye bulunamad\u0131", sub: "Gruba \xFCye eklendi\u011Finde burada g\xF6r\xFCn\xFCr." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 } }, dues.map((due) => /* @__PURE__ */ React.createElement("div", { key: due.id, style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: due.is_paid ? "#F0FDF4" : "var(--bg)",
      borderRadius: 10,
      padding: "10px 14px",
      border: `1px solid ${due.is_paid ? "#BBF7D0" : "var(--border)"}`
    } }, /* @__PURE__ */ React.createElement(Av, { name: due.member_name, size: "sm" }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, due.member_name), due.amount > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, fmtMoney(due.amount))), due.is_paid && due.paid_at && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#22C55E" } }, new Date(due.paid_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })), /* @__PURE__ */ React.createElement(
      "button",
      {
        style: {
          padding: "5px 14px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          border: "none",
          cursor: duesPost ? "default" : "pointer",
          background: due.is_paid ? "#DCFCE7" : "#FEF3C7",
          color: due.is_paid ? "#22C55E" : "#F59E0B",
          opacity: duesPost ? 0.7 : 1
        },
        onClick: () => toggleDuePaid(due),
        disabled: !!duesPost,
        title: duesPost ? "Finanslara i\u015Flendi, de\u011Fi\u015Ftirilemiyor" : ""
      },
      due.is_paid ? "\u2713 \xD6dedi" : "\xD6demedi"
    )))), !duesPost && dues.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 14 } }, (duesModal.group.coaches?.length > 0 || coachPct > 0) && (() => {
      const g = duesModal.group;
      const clubAmt = calcClubAmount();
      const coachAmt = Math.round((totalDues - clubAmt) * 100) / 100;
      return /* @__PURE__ */ React.createElement("div", { style: { background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#7C3AED" } }, /* @__PURE__ */ React.createElement("div", null, "Finanslara aktar\u0131ld\u0131\u011F\u0131nda: Kul\xFCp ", /* @__PURE__ */ React.createElement("strong", null, fmtMoney(clubAmt)), coachAmt > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 Antren\xF6r(ler) ", /* @__PURE__ */ React.createElement("strong", null, fmtMoney(coachAmt)))), g.coaches?.length > 1 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, display: "flex", flexDirection: "column", gap: 2 } }, g.coaches.map((c) => {
        let amt;
        if ((g.split_type || "percentage") === "fixed_amount") {
          amt = c.fixed_amount ?? 0;
        } else {
          amt = Math.round(coachAmt * ((c.share_percentage ?? 100) / 100) * 100) / 100;
        }
        return /* @__PURE__ */ React.createElement("span", { key: c.id }, c.full_name, ": ", /* @__PURE__ */ React.createElement("strong", null, fmtMoney(amt)));
      })));
    })(), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "btn btn-pri",
        style: { alignSelf: "flex-start" },
        onClick: postToFinance,
        disabled: posting || paidCount < dues.length,
        title: paidCount < dues.length ? `Aktarmak i\xE7in ${dues.length - paidCount} \xFCyenin daha \xF6demesi gerekiyor` : ""
      },
      /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 16 } }, "account_balance_wallet"),
      posting ? "\u0130\u015Fleniyor\u2026" : `Finanslara Aktar \xB7 ${fmtMoney(totalDues)}`
    ), paidCount < dues.length && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 13, verticalAlign: "middle", marginRight: 4 } }, "lock"), "T\xFCm \xFCyeler \xF6denince aktar\u0131labilir (", dues.length - paidCount, " eksik)")), duesPost && /* @__PURE__ */ React.createElement("div", { style: { background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#22C55E" } }, /* @__PURE__ */ React.createElement("strong", null, "\u2713 Bu ay finanslara i\u015Flendi."), " ", "Kul\xFCp: ", /* @__PURE__ */ React.createElement("strong", null, fmtMoney(duesPost.club_amount)), duesPost.coach_amount > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 Ko\xE7: ", /* @__PURE__ */ React.createElement("strong", null, fmtMoney(duesPost.coach_amount)))))
  ), schedModal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: `${schedModal.group.name} \u2014 Program Atama`,
      wide: true,
      onClose: () => setSchedModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: clearSchedule }, "Program\u0131 Temizle"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setSchedModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn btn-sm",
          style: {
            background: schedConflicts.length ? "#EF4444" : schedSaving ? "#9CA3AF" : "#0D9488",
            color: "#fff",
            border: "none"
          },
          onClick: saveSchedule,
          disabled: schedSaving || !!schedConflicts.length || schedChecking || !schedSelDays.length
        },
        schedSaving ? "Kaydediliyor\u2026" : schedConflicts.length ? "\xC7ak\u0131\u015Fma Var \u2014 Kaydedilemez" : "Program\u0131 Kaydet"
      ))
    },
    /* @__PURE__ */ React.createElement(
      PerDayScheduleSection,
      {
        schedCourts,
        coaches,
        schedSelDays,
        setSchedSelDays,
        daySettings,
        setDaySettings,
        schedSelCoaches,
        setSchedSelCoaches,
        diffCoachPerDay,
        setDiffCoachPerDay,
        dayCoachIds,
        setDayCoachIds,
        schedConflicts,
        schedChecking,
        use15Min,
        setUse15Min
      }
    )
  ));
}
function LessonPackagesScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [tab, setTab] = useState("packages");
  const [packages, setPackages] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerPkgs, setPlayerPkgs] = useState([]);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [pkgModal, setPkgModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [enrollModal, setEnrollModal] = useState(null);
  const [enrollMode, setEnrollMode] = useState("search");
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollResults, setEnrollResults] = useState([]);
  const [enrollSearching, setEnrollSearching] = useState(false);
  const [enrollSelected, setEnrollSelected] = useState(null);
  const [enrollName, setEnrollName] = useState("");
  const [enrollPhone, setEnrollPhone] = useState("");
  const [enrollCoachId, setEnrollCoachId] = useState("");
  const [enrollUsed, setEnrollUsed] = useState("0");
  const [enrollPayStatus, setEnrollPayStatus] = useState("pending");
  const [enrollPaid, setEnrollPaid] = useState("");
  const [enrollNotes, setEnrollNotes] = useState("");
  const [enrollSaving, setEnrollSaving] = useState(false);
  useEffect(() => {
    if (clubId) {
      loadPackages();
      loadCoaches();
      loadStats();
    }
  }, [clubId]);
  useEffect(() => {
    if (clubId && tab !== "packages") loadPlayerPackages();
  }, [tab, clubId]);
  const loadPackages = async () => {
    setLoading(true);
    const data = await LessonPackageSvc.getClubPackages(clubId);
    setPackages(data);
    setLoading(false);
  };
  const loadCoaches = async () => {
    const { data } = await sb.from("club_coaches").select("id,full_name,individual_coach_id,coach_pay_rate").eq("club_id", clubId).eq("is_active", true);
    setCoaches(data || []);
  };
  const loadPlayerPackages = async () => {
    setPlayerLoading(true);
    const data = await LessonPackageSvc.getPlayerPackages(clubId);
    setPlayerPkgs(data);
    setPlayerLoading(false);
  };
  const loadStats = async () => {
    const s = await LessonPackageSvc.getPackageStats(clubId);
    setStats(s);
  };
  const openCreate = () => {
    setForm({ name: "", description: "", total_lessons: 10, price: "", validity_days: 90, coach_id: "", is_active: true, coach_payout_mode: "upfront", coach_percentage: "" });
    setPkgModal({ type: "add" });
  };
  const openEdit = (pkg) => {
    const clubCoach = coaches.find((c) => c.individual_coach_id === pkg.coach_id || c.id === pkg.coach_id);
    setForm({ ...pkg, coach_id: clubCoach?.id || "" });
    setPkgModal({ type: "edit", pkg });
  };
  const savePkg = async () => {
    if (!form.name?.trim()) {
      alert("Paket ad\u0131 zorunludur.");
      return;
    }
    if (!form.total_lessons || Number(form.total_lessons) < 1) {
      alert("Ders say\u0131s\u0131 en az 1 olmal\u0131.");
      return;
    }
    if (form.price === "" || form.price === null) {
      alert("Fiyat zorunludur.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        total_lessons: Number(form.total_lessons),
        price: Number(form.price),
        validity_days: Number(form.validity_days) || 90,
        coach_id: coachProfileId(form.coach_id) || null,
        is_active: form.is_active !== false,
        coach_payout_mode: form.coach_payout_mode === "per_session" ? "per_session" : "upfront",
        coach_percentage: form.coach_percentage === "" || form.coach_percentage == null ? null : Number(form.coach_percentage)
      };
      if (pkgModal.type === "add") {
        await LessonPackageSvc.createPackage(clubId, payload);
      } else {
        await LessonPackageSvc.updatePackage(form.id, payload);
      }
      setPkgModal(null);
      loadPackages();
      loadStats();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  const toggleActive = async (pkg) => {
    try {
      await LessonPackageSvc.toggleActive(pkg.id, !pkg.is_active);
      loadPackages();
    } catch (e) {
      alert(e.message);
    }
  };
  const deletePkg = async (pkg) => {
    if (!confirm(`"${pkg.name}" paketini silmek istedi\u011Finize emin misiniz?`)) return;
    try {
      await LessonPackageSvc.deletePackage(pkg.id);
      loadPackages();
      loadStats();
    } catch (e) {
      alert(e.message);
    }
  };
  const doConfirmPayment = async () => {
    const pp = confirmModal.playerPkg;
    const pkg = pp.package;
    const coachRec = coaches.find((c) => c.individual_coach_id === pp.coach_id);
    const pkgPct = pkg?.coach_percentage ?? pp.custom_coach_pct;
    const coachPayRate = Number(pkgPct) > 0 ? Number(pkgPct) : coachRec?.coach_pay_rate || 0;
    const payoutMode = pp.coach_payout_mode || pkg?.coach_payout_mode || "upfront";
    if (payoutMode === "upfront" && coachRec && coachPayRate <= 0) {
      if (!confirm("Bu paket i\xE7in hoca pay oran\u0131 tan\u0131ml\u0131 de\u011Fil; hocaya hakedi\u015F olu\u015Fmayacak. Yine de onaylans\u0131n m\u0131?")) return;
    }
    const price = pkg?.price ?? (pp.custom_price != null && Number(pp.custom_price) > 0 ? Number(pp.custom_price) : null) ?? (Number(pp.total_paid) > 0 ? Number(pp.total_paid) : 0);
    if (!(price > 0)) {
      if (!confirm("Bu paket i\xE7in tutar 0 g\xF6r\xFCn\xFCyor; gelir ve hoca hakedi\u015Fi OLU\u015EMAYACAK. Yine de onaylans\u0131n m\u0131?")) return;
    }
    setConfirming(true);
    try {
      await LessonPackageSvc.confirmPayment(
        pp.id,
        pkg?.validity_days,
        price,
        pp._customerName || pp.player?.full_name || pp.manual_player_name || "\xD6\u011Frenci",
        pkg?.name || "Ders Paketi",
        clubId,
        coachRec ? { clubCoachId: coachRec.id, coachName: coachRec.full_name, coachPayRate, individualCoachId: pp.coach_id || null } : null,
        payoutMode
      );
      setConfirmModal(null);
      loadPlayerPackages();
      loadStats();
    } catch (e) {
      alert(e.message);
    } finally {
      setConfirming(false);
    }
  };
  const openEnrollModal = (pkg) => {
    setEnrollModal({ pkg });
    setEnrollMode("search");
    setEnrollSearch("");
    setEnrollResults([]);
    setEnrollSelected(null);
    setEnrollName("");
    setEnrollPhone("");
    setEnrollCoachId(coachProfileId(coaches.find((c) => c.individual_coach_id === pkg.coach_id || c.id === pkg.coach_id)?.id || "") || "");
    setEnrollUsed("0");
    setEnrollPayStatus("pending");
    setEnrollPaid(String(pkg.price));
    setEnrollNotes("");
  };
  const handleEnrollSearch = async (q) => {
    setEnrollSearch(q);
    setEnrollSelected(null);
    if (q.trim().length < 2) {
      setEnrollResults([]);
      return;
    }
    setEnrollSearching(true);
    try {
      const [players, custRes] = await Promise.all([
        LessonPackageSvc.searchPlayers(q),
        sb.from("club_customers").select("id, full_name, phone, email, user_id").eq("club_id", clubId).eq("is_active", true).or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`).limit(8)
      ]);
      const appList = players || [];
      const custList = custRes.data || [];
      const matchedAppIds = /* @__PURE__ */ new Set();
      const merged = custList.map((c) => {
        const appMatch = appList.find((p) => p.id === c.user_id);
        if (appMatch) {
          matchedAppIds.add(appMatch.id);
          return { ...c, _type: "both" };
        }
        return { ...c, _type: "customer" };
      });
      appList.forEach((p) => {
        if (!matchedAppIds.has(p.id)) merged.push({ ...p, _type: "app" });
      });
      setEnrollResults(merged);
    } catch {
      setEnrollResults([]);
    } finally {
      setEnrollSearching(false);
    }
  };
  const doEnroll = async () => {
    if (!enrollModal) return;
    const pkg = enrollModal.pkg;
    if (enrollMode === "search" && !enrollSelected) {
      alert("Bir ki\u015Fi se\xE7in.");
      return;
    }
    if (enrollMode === "manual" && !enrollName.trim()) {
      alert("Ad Soyad zorunludur.");
      return;
    }
    const used = parseInt(enrollUsed, 10) || 0;
    if (used >= pkg.total_lessons) {
      alert(`Tamamlanan ders say\u0131s\u0131 ${pkg.total_lessons - 1} veya daha az olmal\u0131.`);
      return;
    }
    const enrollCoachRec = enrollCoachId ? coaches.find((c) => c.id === enrollCoachId) : null;
    setEnrollSaving(true);
    try {
      const sel = enrollSelected;
      const isCust = sel?._type === "customer";
      const isBoth = sel?._type === "both";
      let clubCustomerId = null;
      if (enrollMode === "manual") {
        const nm = enrollName.trim();
        const ph = enrollPhone.trim();
        if (ph) {
          const matches = await CustomerSvc.findCustomersByPhone(ph, clubId);
          const similar = matches.find((m) => namesLookSimilar(m.full_name, nm));
          if (similar && confirm(`"${similar.full_name}" ile ayn\u0131 telefon numaras\u0131 kullan\u0131yor. Ayn\u0131 ki\u015Fi mi?

Tamam: mevcut m\xFC\u015Fteriye ba\u011Flan\u0131r.
\u0130ptal: yeni m\xFC\u015Fteri olu\u015Fturulur.`)) {
            clubCustomerId = similar.id;
          }
        } else {
          const matches = await CustomerSvc.findSimilarCustomersByName(nm, clubId);
          const similar = matches[0];
          if (similar && confirm(`"${similar.full_name}" zaten kay\u0131tl\u0131. Ayn\u0131 ki\u015Fi mi?

Tamam: mevcut kayda ba\u011Flan\u0131r.
\u0130ptal: yeni m\xFC\u015Fteri olu\u015Fturulur.`)) {
            clubCustomerId = similar.id;
          }
        }
        if (!clubCustomerId) {
          try {
            const created = await CustomerSvc.createCustomer(clubId, { full_name: nm, phone: ph });
            clubCustomerId = created.id;
            if (ph) {
              const accounts = await CustomerSvc.findAccountsByPhone(ph);
              if (accounts.length === 1) {
                try {
                  await CustomerSvc.linkToProfile(created.id, accounts[0].id);
                } catch (_) {
                }
              }
            }
          } catch (e) {
            if (/uq_club_customer_name/.test(e?.message || "")) {
              const dup = ph ? await CustomerSvc.findCustomerByPhone(ph, clubId) : (await CustomerSvc.findSimilarCustomersByName(nm, clubId))[0];
              if (dup) clubCustomerId = dup.id;
              else throw e;
            } else {
              throw e;
            }
          }
        }
      } else if (enrollMode === "search" && (sel?._type === "customer" || sel?._type === "both")) {
        clubCustomerId = sel.id;
      }
      await LessonPackageSvc.manualEnrollPlayer({
        package_id: pkg.id,
        club_id: clubId,
        coach_id: enrollCoachId ? coachProfileId(enrollCoachId) : null,
        coach_db_id: enrollCoachRec?.id || null,
        coach_name: enrollCoachRec?.full_name || null,
        coach_pay_rate: enrollCoachRec?.coach_pay_rate || 0,
        player_id: enrollMode === "search" ? isBoth ? sel.user_id : isCust ? sel.user_id || null : sel.id : null,
        player_name: enrollMode === "search" ? sel.full_name : null,
        manual_player_name: enrollMode === "manual" ? enrollName.trim() : isCust && !sel.user_id ? sel.full_name : null,
        manual_player_phone: enrollMode === "manual" ? enrollPhone.trim() || null : isCust && !sel.user_id ? sel.phone || null : null,
        club_customer_id: clubCustomerId,
        used_lessons: used,
        payment_status: enrollPayStatus,
        total_paid: parseFloat(enrollPaid) || pkg.price,
        notes: enrollNotes.trim() || null
      });
      setEnrollModal(null);
      loadPlayerPackages();
      loadStats();
    } catch (e) {
      alert(e.message);
    } finally {
      setEnrollSaving(false);
    }
  };
  const cancelPlayerPackage = async (pp) => {
    const name = pp._customerName || pp.player?.full_name || pp.manual_player_name || "Bu \xF6\u011Frenci";
    if (!confirm(`${name} i\xE7in paketi iptal etmek istedi\u011Finize emin misiniz?`)) return;
    let opts = null;
    const total = pp.total_lessons ?? pp.package?.total_lessons ?? 0;
    const used = pp.used_lessons ?? 0;
    const remaining = Math.max(0, total - used);
    if (pp.payment_status === "paid" && remaining > 0) {
      const paid = Number(pp.total_paid ?? pp.package?.price ?? 0);
      const perLesson2 = total > 0 ? paid / total : 0;
      const amount = Math.round(perLesson2 * remaining * 100) / 100;
      const mode = pp.coach_payout_mode || pp.package?.coach_payout_mode || "upfront";
      const coachAffected = mode === "upfront" && !!pp.coach_id;
      let msg = `Kullan\u0131lmayan ${remaining} dersin \xFCcretini (\u20BA${amount.toLocaleString("tr-TR")}) iade etmek istiyor musunuz?

Evet derseniz bu tutar gider olarak yaz\u0131l\u0131r.`;
      if (coachAffected) msg += `

Not: Hoca bu paketten toplu \xF6dendi\u011Fi i\xE7in, kullan\u0131lmayan derslere d\xFC\u015Fen hoca pay\u0131 da hocan\u0131n hakedi\u015Finden d\xFC\u015F\xFClecek.`;
      if (amount > 0 && confirm(msg)) {
        const packageName = pp.package?.name || pp.custom_name || "Ders Paketi";
        opts = { refund: { amount, clubId, packageName, playerName: name, remaining } };
        if (coachAffected) {
          opts.coachClawback = {
            clubId,
            individualCoachId: pp.coach_id,
            packageName,
            playerName: name,
            remaining,
            totalLessons: total,
            totalPaid: paid,
            packageCoachPct: pp.package?.coach_percentage ?? null
          };
        }
      }
    }
    try {
      await LessonPackageSvc.cancelPlayerPackage(pp.id, opts);
      loadPlayerPackages();
      loadStats();
    } catch (e) {
      alert(e.message);
    }
  };
  const displayName = (pp) => pp._customerName || pp.player?.full_name || pp.manual_player_name || "\u2014";
  const activeStudents = playerPkgs.filter((p) => p.payment_status === "paid" && p.status !== "cancelled");
  const pendingStudents = playerPkgs.filter((p) => p.payment_status === "pending" && p.status !== "cancelled");
  const perLesson = (pkg) => pkg.total_lessons > 0 ? pkg.price / pkg.total_lessons : 0;
  const coachName = (coachId) => {
    if (!coachId) return null;
    const c = coaches.find((c2) => c2.individual_coach_id === coachId || c2.id === coachId);
    return c?.full_name ?? null;
  };
  const coachProfileId = (id) => {
    if (!id) return null;
    const byClub = coaches.find((c) => c.id === id);
    if (byClub) return byClub.individual_coach_id ?? null;
    const byProfile = coaches.find((c) => c.individual_coach_id === id);
    if (byProfile) return id;
    return null;
  };
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "Ders Paketleri"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, packages.length, " paket tan\u0131m\u0131")), tab === "packages" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: openCreate }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "add"), " Paket Olu\u015Ftur")), stats && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 16 } }, [
    { label: "Toplam Gelir", value: fmtMoney(stats.totalRevenue), icon: "account_balance_wallet", color: "#22C55E" },
    { label: "Aktif Paket", value: stats.activeCount, icon: "school", color: "#003399" },
    { label: "Bekleyen", value: stats.pendingCount, icon: "pending", color: "#F59E0B" },
    { label: "Tamamlanan", value: stats.completedCount, icon: "check_circle", color: "#9CA3AF" }
  ].map((s) => /* @__PURE__ */ React.createElement("div", { key: s.label, className: "card", style: { padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { color: s.color, fontSize: 22 } }, s.icon), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 16 } }, s.value), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, s.label))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 16 } }, [
    { key: "packages", label: "Paketler", icon: "inventory_2" },
    { key: "students", label: "\xD6\u011Frenciler", icon: "school" },
    { key: "pending", label: `Bekleyen${pendingStudents.length ? ` (${pendingStudents.length})` : ""}`, icon: "pending" }
  ].map((t) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: t.key,
      className: "btn btn-sm " + (tab === t.key ? "btn-pri" : "btn-ghost"),
      onClick: () => setTab(t.key)
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, t.icon),
    t.label
  ))), tab === "packages" && (loading ? /* @__PURE__ */ React.createElement(Spinner, null) : packages.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "inventory_2", title: "Hen\xFCz paket yok", sub: "\u0130lk ders paketini olu\u015Fturun." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 } }, packages.map((pkg) => /* @__PURE__ */ React.createElement("div", { key: pkg.id, className: "card", style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 16 } }, pkg.name), /* @__PURE__ */ React.createElement(
    "button",
    {
      style: {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "3px 10px",
        borderRadius: 20,
        backgroundColor: pkg.is_active ? "#DCFCE7" : "#FEF3C7",
        color: pkg.is_active ? "#22C55E" : "#F59E0B",
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0
      },
      onClick: () => toggleActive(pkg)
    },
    pkg.is_active ? "Aktif" : "Pasif"
  )), pkg.description && /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--text-2)", margin: 0 } }, pkg.description), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, background: "#EEF2FF", color: "var(--brand-navy)", border: "1px solid #C7D2FE", borderRadius: 8, padding: "4px 9px", fontWeight: 700 } }, pkg.total_lessons, " ders"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, background: "#F0FDF4", color: "#22C55E", border: "1px solid #BBF7D0", borderRadius: 8, padding: "4px 9px", fontWeight: 700 } }, fmtMoney(pkg.price)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, background: "var(--bg)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 9px" } }, pkg.validity_days, " g\xFCn ge\xE7erli"), coachName(pkg.coach_id) && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, background: "#EEF2FF", color: "var(--brand-navy)", border: "1px solid #C7D2FE", borderRadius: 8, padding: "4px 9px", fontWeight: 600 } }, coachName(pkg.coach_id)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, background: "#FFF7ED", color: "#EA580C", border: "1px solid #FED7AA", borderRadius: 8, padding: "4px 9px", fontWeight: 600 } }, pkg.coach_payout_mode === "per_session" ? "Hoca pay\u0131: ders ba\u015F\u0131na" : "Hoca pay\u0131: toptan", Number(pkg.coach_percentage) > 0 ? ` \xB7 %${pkg.coach_percentage}` : "")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, "Ders ba\u015F\u0131: ", /* @__PURE__ */ React.createElement("strong", null, fmtMoney(perLesson(pkg)))), /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "var(--border)" } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", title: "M\xFC\u015Fteri Kaydet", onClick: () => openEnrollModal(pkg) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "person_add"), " M\xFC\u015Fteri Kaydet"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", title: "D\xFCzenle", onClick: () => openEdit(pkg) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "edit")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", title: "Sil", onClick: () => deletePkg(pkg) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "delete"))))))), tab === "students" && (playerLoading ? /* @__PURE__ */ React.createElement(Spinner, null) : activeStudents.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "school", title: "Aktif \xF6\u011Frenci paketi yok", sub: "\xD6\u011Frenciler ders paketi sat\u0131n ald\u0131\u011F\u0131nda burada g\xF6r\xFCn\xFCr." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, activeStudents.map((pp) => {
    const pkg = pp.package;
    const used = pp.used_lessons ?? 0;
    const total = pp.total_lessons ?? pkg?.total_lessons ?? 0;
    const pct = total > 0 ? Math.round(used / total * 100) : 0;
    const expired = pp.expiry_date && new Date(pp.expiry_date) < /* @__PURE__ */ new Date();
    const completed = pp.status === "completed";
    const name = displayName(pp);
    return /* @__PURE__ */ React.createElement("div", { key: pp.id, className: "card", style: { display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement(Av, { name, size: "md" }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, name, pp.manual_player_name && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)", marginLeft: 6 } }, "(manuel)")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2 } }, pkg?.name || "\u2014"), pp.coach_name && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, "Antren\xF6r: ", pp.coach_name), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-2)", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", null, used, " / ", total, " ders kullan\u0131ld\u0131"), /* @__PURE__ */ React.createElement("span", null, pct, "%")), /* @__PURE__ */ React.createElement("div", { style: { height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
      height: "100%",
      width: `${pct}%`,
      borderRadius: 3,
      transition: "width 0.3s",
      background: completed ? "#9CA3AF" : expired ? "#F59E0B" : "var(--brand-navy)"
    } })))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 10px",
      borderRadius: 20,
      background: completed ? "#F3F4F6" : expired ? "#FEF3C7" : "#DCFCE7",
      color: completed ? "#6B7280" : expired ? "#F59E0B" : "#22C55E"
    } }, completed ? "Tamamland\u0131" : expired ? "S\xFCresi Doldu" : "Aktif"), pp.expiry_date && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--text-2)" } }, "Son: ", fmtDate(pp.expiry_date)), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", title: "Paketi \u0130ptal Et", onClick: () => cancelPlayerPackage(pp) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "cancel"))));
  }))), tab === "pending" && (playerLoading ? /* @__PURE__ */ React.createElement(Spinner, null) : pendingStudents.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "pending", title: "Bekleyen \xF6deme yok", sub: "Yeni paket sat\u0131n al\u0131mlar\u0131 burada g\xF6r\xFCn\xFCr." }) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, pendingStudents.map((pp) => {
    const pkg = pp.package;
    return /* @__PURE__ */ React.createElement("div", { key: pp.id, className: "card", style: { display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement(Av, { name: displayName(pp), size: "md" }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, displayName(pp)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2 } }, pkg?.name || "\u2014", " \xB7 ", pkg?.total_lessons, " ders"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)", marginTop: 2 } }, "Sat\u0131n al\u0131m: ", fmtDate(pp.purchase_date || pp.created_at))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 800, fontSize: 18, color: "#22C55E" } }, fmtMoney(pp.total_paid ?? pkg?.price)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: () => setConfirmModal({ playerPkg: pp }) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "check_circle"), "\xD6demeyi Onayla"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", title: "Sil", onClick: () => cancelPlayerPackage(pp) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "delete")))));
  }))), enrollModal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: `M\xFC\u015Fteri Kaydet \u2014 ${enrollModal.pkg.name}`,
      wide: true,
      onClose: () => setEnrollModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setEnrollModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: doEnroll, disabled: enrollSaving }, enrollSaving ? "Kaydediliyor\u2026" : "Kaydet"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [{ key: "search", label: "Oyuncu Ara" }, { key: "manual", label: "Manuel" }].map((m) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: m.key,
        className: "btn btn-sm " + (enrollMode === m.key ? "btn-pri" : "btn-ghost"),
        onClick: () => {
          setEnrollMode(m.key);
          setEnrollSearch("");
          setEnrollResults([]);
          setEnrollSelected(null);
          setEnrollName("");
          setEnrollPhone("");
        }
      },
      m.label
    ))), enrollMode === "search" && /* @__PURE__ */ React.createElement(Field, { label: "Ki\u015Fi Ara *" }, enrollSelected ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#EEF2FF", borderRadius: 8, border: "1px solid #C7D2FE" } }, /* @__PURE__ */ React.createElement("span", { style: { flex: 1, fontWeight: 600 } }, enrollSelected.full_name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)" } }, enrollSelected.email || enrollSelected.phone || ""), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, (enrollSelected._type === "customer" || enrollSelected._type === "both") && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, background: "#E0F7FA", color: "#00796B", padding: "1px 6px", borderRadius: 20 } }, "M\xFC\u015Fteri"), (enrollSelected._type === "app" || enrollSelected._type === "both") && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, background: "#EEF2FF", color: "var(--brand-navy)", padding: "1px 6px", borderRadius: 20 } }, "CourtyCLUB Kullan\u0131c\u0131s\u0131")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => {
      setEnrollSelected(null);
      setEnrollSearch("");
    } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "close"))) : /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        placeholder: "\u0130sim, telefon veya e-posta (en az 2 karakter)",
        value: enrollSearch,
        onChange: (e) => handleEnrollSearch(e.target.value)
      }
    ), (enrollSearching || enrollResults.length > 0) && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: 8, zIndex: 50, maxHeight: 220, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,.1)" } }, enrollSearching && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 14px", color: "var(--text-2)", fontSize: 13 } }, "Aran\u0131yor\u2026"), !enrollSearching && enrollResults.length === 0 && enrollSearch.trim().length >= 2 && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 14px", color: "var(--text-2)", fontSize: 13 } }, "Sonu\xE7 bulunamad\u0131"), enrollResults.map((r) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: r._type + r.id,
        style: { padding: "10px 14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2, borderBottom: "1px solid var(--border)" },
        onMouseDown: () => {
          setEnrollSelected(r);
          setEnrollSearch(r.full_name);
          setEnrollResults([]);
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, fontSize: 14 } }, r.full_name), (r._type === "customer" || r._type === "both") && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, background: "#E0F7FA", color: "#00796B", padding: "1px 6px", borderRadius: 20 } }, "M\xFC\u015Fteri"), (r._type === "app" || r._type === "both") && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, background: "#EEF2FF", color: "var(--brand-navy)", padding: "1px 6px", borderRadius: 20 } }, "CourtyCLUB Kullan\u0131c\u0131s\u0131")),
      /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--text-2)" } }, r.email || r.phone || "")
    ))))), enrollMode === "manual" && /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Ad Soyad *" }, /* @__PURE__ */ React.createElement("input", { placeholder: "M\xFC\u015Fteri ad\u0131", value: enrollName, onChange: (e) => setEnrollName(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Telefon (iste\u011Fe ba\u011Fl\u0131)" }, /* @__PURE__ */ React.createElement("input", { placeholder: "05xx xxx xx xx", value: enrollPhone, onChange: (e) => setEnrollPhone(e.target.value) }))), /* @__PURE__ */ React.createElement(Field, { label: "Antren\xF6r (opsiyonel \u2014 bo\u015F b\u0131rak\u0131l\u0131rsa t\xFCm antren\xF6rlerde ge\xE7erli)" }, /* @__PURE__ */ React.createElement("select", { value: enrollCoachId, onChange: (e) => setEnrollCoachId(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "T\xFCm antren\xF6rler"), coaches.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.full_name)))), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Kullan\u0131lm\u0131\u015F Ders Say\u0131s\u0131" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        max: enrollModal.pkg.total_lessons - 1,
        value: enrollUsed,
        onChange: (e) => setEnrollUsed(e.target.value)
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "\xD6deme Durumu" }, /* @__PURE__ */ React.createElement("select", { value: enrollPayStatus, onChange: (e) => setEnrollPayStatus(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "paid" }, "\xD6dendi"), /* @__PURE__ */ React.createElement("option", { value: "pending" }, "Bekliyor")))), /* @__PURE__ */ React.createElement(Field, { label: enrollPayStatus === "paid" ? "Tahsil Edilen Tutar (\u20BA)" : "Tahsil Edilecek Tutar (\u20BA)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 0, value: enrollPaid, onChange: (e) => setEnrollPaid(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Notlar (iste\u011Fe ba\u011Fl\u0131)" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: 2,
        value: enrollNotes,
        onChange: (e) => setEnrollNotes(e.target.value),
        placeholder: "Varsa eklemek istedi\u011Finiz notlar\u2026",
        style: { resize: "vertical" }
      }
    )))
  ), pkgModal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: pkgModal.type === "add" ? "Paket Olu\u015Ftur" : "Paketi D\xFCzenle",
      wide: true,
      onClose: () => setPkgModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setPkgModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: savePkg, disabled: saving }, saving ? "Kaydediliyor\u2026" : pkgModal.type === "add" ? "Olu\u015Ftur" : "G\xFCncelle"))
    },
    /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Field, { label: "Paket Ad\u0131 *" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: form.name || "",
        placeholder: "\xD6rn: 10 Ders Paketi",
        onChange: (e) => setForm({ ...form, name: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "A\xE7\u0131klama" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: 2,
        value: form.description || "",
        placeholder: "Paket hakk\u0131nda k\u0131sa bilgi\u2026",
        onChange: (e) => setForm({ ...form, description: e.target.value }),
        style: { resize: "vertical" }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "fields-2" }, /* @__PURE__ */ React.createElement(Field, { label: "Ders Say\u0131s\u0131 *" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 1,
        placeholder: "10",
        value: form.total_lessons ?? "",
        onChange: (e) => setForm({ ...form, total_lessons: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Fiyat (\u20BA) *" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        placeholder: "0",
        value: form.price ?? "",
        onChange: (e) => setForm({ ...form, price: e.target.value })
      }
    ))), /* @__PURE__ */ React.createElement(Field, { label: "Ge\xE7erlilik S\xFCresi (g\xFCn)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 1,
        placeholder: "90",
        value: form.validity_days ?? "",
        onChange: (e) => setForm({ ...form, validity_days: e.target.value })
      }
    )), Number(form.total_lessons) > 0 && Number(form.price) > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#7C3AED" } }, "Ders ba\u015F\u0131: ", fmtMoney(Number(form.price) / Number(form.total_lessons))), /* @__PURE__ */ React.createElement(Field, { label: "Hoca Pay\u0131 (%)" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: 0,
        max: 100,
        placeholder: "\xD6rn: 50",
        value: form.coach_percentage ?? "",
        onChange: (e) => setForm({ ...form, coach_percentage: e.target.value })
      }
    )), /* @__PURE__ */ React.createElement(Field, { label: "Hoca Pay\u0131 Tahsilat Bi\xE7imi" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [{ v: "upfront", l: "Toptan (pe\u015Fin)" }, { v: "per_session", l: "Ders ba\u015F\u0131na" }].map((o) => {
      const sel = (form.coach_payout_mode || "upfront") === o.v;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: o.v,
          type: "button",
          onClick: () => setForm({ ...form, coach_payout_mode: o.v }),
          style: {
            flex: 1,
            padding: "10px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: sel ? 700 : 500,
            cursor: "pointer",
            border: sel ? "1.5px solid var(--brand-navy)" : "1.5px solid var(--border)",
            background: sel ? "#EEF2FF" : "var(--bg)",
            color: sel ? "var(--brand-navy)" : "var(--text-2)"
          }
        },
        o.l
      );
    })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 6 } }, (form.coach_payout_mode || "upfront") === "per_session" ? "Sat\u0131\u015Fta kul\xFCp yaln\u0131z kendi pay\u0131n\u0131 (net) al\u0131r; hocan\u0131n pay\u0131 paketten ders i\u015Flendik\xE7e hakedi\u015Fine yaz\u0131l\u0131r." : "Toptan: sat\u0131\u015Fta kul\xFCp pay\u0131 kul\xFCbe, hoca pay\u0131 da bir kerede hocan\u0131n hakedi\u015Fine yaz\u0131l\u0131r.")), /* @__PURE__ */ React.createElement(Switch, { on: form.is_active !== false, onChange: (v) => setForm({ ...form, is_active: v }), label: "Aktif Paket" }))
  ), confirmModal && /* @__PURE__ */ React.createElement(
    Modal,
    {
      title: "\xD6demeyi Onayla",
      onClose: () => setConfirmModal(null),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setConfirmModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: doConfirmPayment, disabled: confirming }, confirming ? "\u0130\u015Fleniyor\u2026" : "\xD6demeyi Onayla"))
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg)", borderRadius: 10, padding: "12px 16px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15 } }, displayName(confirmModal.playerPkg)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)", marginTop: 4 } }, confirmModal.playerPkg.package?.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)" } }, confirmModal.playerPkg.package?.total_lessons, " ders \xB7 ", confirmModal.playerPkg.package?.validity_days, " g\xFCn ge\xE7erli")), /* @__PURE__ */ React.createElement("div", { style: { background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#22C55E", fontWeight: 600 } }, "Tahsil edilecek tutar"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 26, fontWeight: 800, color: "#22C55E" } }, fmtMoney(confirmModal.playerPkg.total_paid ?? confirmModal.playerPkg.package?.price))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-2)" } }, 'Onaylad\u0131\u011F\u0131n\u0131zda bu tutar finanslara "Ders Paketi Geliri" olarak kaydedilecek ve \xF6\u011Frencinin paketi aktif hale gelecektir.'))
  ));
}
function EditMemberRow({ member, onSave, onCancel }) {
  const { useState } = React;
  const [vals, setVals] = useState({
    member_name: member.member_name || "",
    contact_number: member.contact_number || "",
    contact_person: member.contact_person || "",
    custom_fee: member.custom_fee != null ? String(member.custom_fee) : ""
  });
  return /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr auto auto", gap: 6, alignItems: "center", background: "#EEF2FF", borderRadius: 10, padding: "8px 10px", border: "1px solid #C7D2FE" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: vals.member_name,
      placeholder: "\xDCye ad\u0131 *",
      onChange: (e) => setVals({ ...vals, member_name: e.target.value }),
      style: { fontSize: 13 }
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: vals.contact_number,
      placeholder: "Telefon",
      onChange: (e) => setVals({ ...vals, contact_number: e.target.value }),
      style: { fontSize: 13 }
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: vals.contact_person,
      placeholder: "Veli / \u0130leti\u015Fim",
      onChange: (e) => setVals({ ...vals, contact_person: e.target.value }),
      style: { fontSize: 13 }
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: 0,
      value: vals.custom_fee,
      placeholder: "\xD6zel \xFCcret (\u20BA)",
      onChange: (e) => setVals({ ...vals, custom_fee: e.target.value }),
      style: { fontSize: 13 },
      title: "Bo\u015F b\u0131rak\u0131l\u0131rsa grup aidat\u0131 uygulan\u0131r"
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "btn btn-success btn-sm btn-icon", onClick: () => onSave(member.id, vals) }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "check")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: onCancel }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "close")));
}

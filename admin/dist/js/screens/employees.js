function EmployeesScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(null);
  const [inviteMsg, setInviteMsg] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (clubId) loadLists();
  }, [clubId]);
  const loadLists = async () => {
    setLoading(true);
    try {
      const [invRes, empRes] = await Promise.all([
        sb.from("club_employee_invitations").select("*, profiles!club_employee_invitations_employee_id_fkey(full_name, email)").eq("club_id", clubId).order("created_at", { ascending: false }),
        sb.from("club_employees").select("*, profiles!club_employees_employee_id_fkey(full_name, email)").eq("club_id", clubId).order("created_at", { ascending: false })
      ]);
      setInvitations(invRes.data || []);
      setEmployees(empRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = async () => {
    const q = query.trim();
    if (q.length < 3) {
      alert("Arama i\xE7in en az 3 karakter giriniz.");
      return;
    }
    setSearching(true);
    setSearched(true);
    try {
      const { data, error } = await sb.from("profiles").select("id, full_name, email").eq("user_type", "employee").or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).limit(20);
      if (error) throw error;
      setResults(data || []);
    } catch (e) {
      alert(e.message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };
  const sendInvite = async () => {
    if (!inviteModal) return;
    setSending(true);
    try {
      const { error } = await sb.from("club_employee_invitations").insert({
        club_id: clubId,
        employee_id: inviteModal.id,
        message: inviteMsg.trim() || null,
        status: "pending"
      });
      if (error) {
        if (error.code === "23505") throw new Error("Bu \xE7al\u0131\u015Fana zaten davet g\xF6nderilmi\u015F.");
        throw error;
      }
      setInviteModal(null);
      await loadLists();
      alert(`${inviteModal.full_name} ki\u015Fisine davet g\xF6nderildi.`);
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };
  const cancelInvitation = async (id, name) => {
    if (!confirm(`${name} davetini iptal etmek istiyor musunuz?`)) return;
    const { error } = await sb.from("club_employee_invitations").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    loadLists();
  };
  const removeEmployee = async (empId, name) => {
    if (!confirm(`${name} adl\u0131 \xE7al\u0131\u015Fan\u0131 kul\xFCpten \xE7\u0131karmak istiyor musunuz?`)) return;
    try {
      const { error: e1 } = await sb.from("club_employees").delete().eq("club_id", clubId).eq("employee_id", empId);
      if (e1) throw e1;
      await sb.from("club_employee_invitations").delete().eq("club_id", clubId).eq("employee_id", empId);
      loadLists();
    } catch (e) {
      alert(e.message);
    }
  };
  const statusCls = (s) => ({ pending: "b-info", accepted: "b-success", rejected: "b-muted" })[s] || "b-muted";
  const statusLbl = (s) => ({ pending: "Beklemede", accepted: "Kabul Edildi", rejected: "Reddedildi" })[s] || s;
  const pendingSet = new Set(invitations.filter((i) => i.status === "pending").map((i) => i.employee_id));
  const empIdSet = new Set(employees.map((e) => e.employee_id));
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", null, "\xC7al\u0131\u015Fanlar"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, employees.length, " aktif \xE7al\u0131\u015Fan"))), /* @__PURE__ */ React.createElement(Tabs, { items: [
    { key: "search", label: "Ara" },
    { key: "invitations", label: "Davetler", count: invitations.length },
    { key: "employees", label: "\xC7al\u0131\u015Fanlar", count: employees.length }
  ], active: tab, onChange: setTab }), tab === "search" && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, position: "relative" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-2)", fontSize: 18, pointerEvents: "none" } }, "search"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: query,
      onChange: (e) => setQuery(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && handleSearch(),
      placeholder: "Ad veya e-posta ile ara (min 3 karakter)",
      style: { paddingLeft: 40, width: "100%", boxSizing: "border-box" }
    }
  )), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri", onClick: handleSearch, disabled: searching }, searching ? "\u2026" : "Ara"))), searching && /* @__PURE__ */ React.createElement(Spinner, { size: 28 }), !searching && !searched && /* @__PURE__ */ React.createElement(EmptyState, { icon: "manage_search", title: "\xC7al\u0131\u015Fan aramak i\xE7in en az 3 karakter girin", sub: "Kul\xFCbe davet etmek istedi\u011Finiz \xE7al\u0131\u015Fan\u0131 aray\u0131n." }), !searching && searched && results.length === 0 && /* @__PURE__ */ React.createElement(EmptyState, { icon: "person_search", title: "\xC7al\u0131\u015Fan hesab\u0131 bulunamad\u0131", sub: "Farkl\u0131 bir arama terimi deneyin." }), !searching && results.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, results.map((u) => {
    const alreadySent = pendingSet.has(u.id);
    const isEmp = empIdSet.has(u.id);
    return /* @__PURE__ */ React.createElement("div", { key: u.id, className: "card", style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement(Av, { name: u.full_name, size: "sm" }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, u.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, u.email)), isEmp ? /* @__PURE__ */ React.createElement(Badge, { cls: "b-success" }, "\xC7al\u0131\u015Fan") : alreadySent ? /* @__PURE__ */ React.createElement(Badge, { cls: "b-info" }, "G\xF6nderildi") : /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: () => {
      setInviteModal(u);
      setInviteMsg("");
    } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 14 } }, "send"), " Davet Et"));
  }))), tab === "invitations" && (loading ? /* @__PURE__ */ React.createElement(Spinner, null) : invitations.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement(EmptyState, { icon: "mail_outline", title: "Hen\xFCz davet g\xF6nderilmedi", sub: "Arama sekmesinden \xE7al\u0131\u015Fan aray\u0131p davet edebilirsiniz." })) : /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16, display: "flex", flexDirection: "column", gap: 8 } }, invitations.map((inv) => {
    const name = inv.profiles?.full_name || "\u2014";
    const email = inv.profiles?.email || "";
    return /* @__PURE__ */ React.createElement("div", { key: inv.id, className: "card", style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement(Av, { name, size: "sm" }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, email), inv.message && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)", marginTop: 2, fontStyle: "italic" } }, '"', inv.message, '"')), /* @__PURE__ */ React.createElement(Badge, { cls: statusCls(inv.status) }, statusLbl(inv.status)), inv.status === "pending" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => cancelInvitation(inv.id, name), title: "\u0130ptal et" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15, color: "var(--error)" } }, "close")));
  }))), tab === "employees" && (loading ? /* @__PURE__ */ React.createElement(Spinner, null) : employees.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement(EmptyState, { icon: "badge", title: "Kul\xFCb\xFCn\xFCzde hen\xFCz \xE7al\u0131\u015Fan yok", sub: "Davetler sekmesinden g\xF6nderilen davetleri kabul eden \xE7al\u0131\u015Fanlar burada g\xF6r\xFCn\xFCr." })) : /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16, display: "flex", flexDirection: "column", gap: 8 } }, employees.map((emp) => {
    const name = emp.profiles?.full_name || "\u2014";
    const email = emp.profiles?.email || "";
    return /* @__PURE__ */ React.createElement("div", { key: emp.id, className: "card", style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 40, borderRadius: 20, background: "#DCFCE7", display: "grid", placeItems: "center", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 20, color: "#166534" } }, "badge")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, email)), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm btn-icon", onClick: () => removeEmployee(emp.employee_id, name), title: "\xC7al\u0131\u015Fan\u0131 \xE7\u0131kar" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 15 } }, "person_remove")));
  }))), inviteModal && /* @__PURE__ */ React.createElement(Modal, { title: "Davet G\xF6nder", onClose: () => setInviteModal(null), footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setInviteModal(null) }, "Vazge\xE7"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-pri btn-sm", onClick: sendInvite, disabled: sending }, sending ? "G\xF6nderiliyor\u2026" : "Davet G\xF6nder")) }, /* @__PURE__ */ React.createElement("div", { className: "fields", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, background: "#EFF6FF", borderRadius: 10, padding: "12px 14px" } }, /* @__PURE__ */ React.createElement(Av, { name: inviteModal.full_name, size: "sm" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700 } }, inviteModal.full_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--text-2)" } }, inviteModal.email))), /* @__PURE__ */ React.createElement(Field, { label: "Mesaj (opsiyonel)" }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 3,
      value: inviteMsg,
      onChange: (e) => setInviteMsg(e.target.value),
      placeholder: "\xC7al\u0131\u015Fana iletmek istedi\u011Finiz mesaj\u0131 yaz\u0131n...",
      style: { resize: "vertical" }
    }
  )))));
}

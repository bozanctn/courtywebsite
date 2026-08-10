const { useState, useEffect, useCallback } = React;
const ALL_NAV_ITEMS = [
  { key: "dashboard", icon: "dashboard", label: "Dashboard", section: "GENEL", employeeOk: true },
  { key: "program", icon: "calendar_today", label: "Program", section: "Y\xD6NET\u0130M", employeeOk: true },
  { key: "reservations", icon: "event_available", label: "Rezervasyonlar", section: null, employeeOk: true },
  { key: "courts", icon: "sports_tennis", label: "Kortlar", section: null, employeeOk: true },
  { key: "members", icon: "group", label: "\xDCyeler", section: null, employeeOk: true },
  { key: "coaches", icon: "person", label: "Antren\xF6rler", section: null, employeeOk: true },
  { key: "employees", icon: "badge", label: "\xC7al\u0131\u015Fanlar", section: null, employeeOk: false },
  { key: "customers", icon: "people_alt", label: "M\xFC\u015Fteriler", section: null, employeeOk: false },
  { key: "cafe", icon: "local_cafe", label: "Kafe / Market", section: null, employeeOk: true },
  { key: "groups", icon: "groups", label: "Gruplar", section: "GRUP DERSLER\u0130", employeeOk: true },
  { key: "group_players", icon: "sports_tennis", label: "Grup Oyuncular\u0131", section: null, employeeOk: true },
  { key: "lesson_requests", icon: "mark_email_unread", label: "Ders Talepleri", section: "\xD6ZEL DERS", employeeOk: true },
  { key: "packages", icon: "inventory_2", label: "Ders Paketleri", section: null, employeeOk: true },
  { key: "tournaments", icon: "emoji_events", label: "Turnuvalar", section: "ETK\u0130NL\u0130KLER", employeeOk: true },
  { key: "finance", icon: "account_balance_wallet", label: "Finans", section: "ANAL\u0130Z", employeeOk: false },
  { key: "analytics", icon: "bar_chart", label: "Analitik", section: null, employeeOk: false },
  { key: "chat", icon: "chat", label: "Sohbet", section: "\u0130LET\u0130\u015E\u0130M", employeeOk: true },
  { key: "notifications", icon: "notifications", label: "Bildirimler", section: null, employeeOk: true },
  { key: "reviews", icon: "star", label: "Yorumlar", section: null, employeeOk: false },
  { key: "profile", icon: "business", label: "Kul\xFCp Profili", section: "AYARLAR", employeeOk: false },
  { key: "notif_prefs", icon: "tune", label: "Bildirim Tercihleri", section: null, employeeOk: true }
];
function Sidebar({ screen, setScreen, clubProfile, employeeProfile, userType, unread, pendingMembers, collapsed, onToggle }) {
  const isEmployee = userType === "employee";
  const name = isEmployee ? employeeProfile?.full_name || "\xC7al\u0131\u015Fan" : clubProfile?.club_name || "Kul\xFCb\xFCm";
  const abbr = initials(name);
  const hasMembership = clubProfile?.has_membership_system !== false;
  const hasCafe = clubProfile?.has_cafe_system !== false;
  const hasEmployee = clubProfile?.has_employee_system !== false;
  const NAV_ITEMS = ALL_NAV_ITEMS.filter((i) => !isEmployee || i.employeeOk).filter((i) => hasMembership || i.key !== "members").filter((i) => hasCafe || i.key !== "cafe").filter((i) => hasEmployee || i.key !== "employees");
  return /* @__PURE__ */ React.createElement("aside", { className: `side${collapsed ? " side-collapsed" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "side-brand" }, /* @__PURE__ */ React.createElement("img", { src: "../Courty_Logo.png", alt: "CourtyCLUB" }), !collapsed && /* @__PURE__ */ React.createElement("div", { className: "name" }, "Courty", /* @__PURE__ */ React.createElement("em", null, "CLUB")), /* @__PURE__ */ React.createElement("button", { className: "side-toggle", onClick: onToggle, title: collapsed ? "Men\xFCy\xFC A\xE7" : "Men\xFCy\xFC Kapat" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, collapsed ? "chevron_right" : "chevron_left"))), !collapsed && /* @__PURE__ */ React.createElement("div", { className: "side-clubcard" }, /* @__PURE__ */ React.createElement("div", { className: "av av-sq", style: { background: isEmployee ? "#0D9488" : "var(--brand-navy)", color: "#fff", width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 } }, abbr), /* @__PURE__ */ React.createElement("div", { className: "who" }, /* @__PURE__ */ React.createElement("div", { className: "n" }, name), /* @__PURE__ */ React.createElement("div", { className: "r" }, isEmployee ? "\xC7al\u0131\u015Fan" : "Kul\xFCp Y\xF6neticisi")), /* @__PURE__ */ React.createElement("div", { className: "dot" })), /* @__PURE__ */ React.createElement("nav", { className: "side-nav" }, NAV_ITEMS.map((item) => {
    if (item.section) {
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: item.key }, !collapsed && /* @__PURE__ */ React.createElement("div", { className: "side-section" }, item.section), /* @__PURE__ */ React.createElement(
        SideItem,
        {
          item,
          active: screen === item.key,
          setScreen,
          badge: item.key === "notifications" ? unread : item.key === "members" ? pendingMembers : 0,
          collapsed
        }
      ));
    }
    return /* @__PURE__ */ React.createElement(
      SideItem,
      {
        key: item.key,
        item,
        active: screen === item.key,
        setScreen,
        badge: item.key === "notifications" ? unread : item.key === "members" ? pendingMembers : 0,
        collapsed
      }
    );
  })), /* @__PURE__ */ React.createElement("div", { className: "side-foot" }, /* @__PURE__ */ React.createElement("button", { onClick: authSignOut, title: "\xC7\u0131k\u0131\u015F" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "logout"), !collapsed && "\xC7\u0131k\u0131\u015F")));
}
function SideItem({ item, active, setScreen, badge, collapsed }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `side-item${active ? " active" : ""}${collapsed ? " side-item-collapsed" : ""}`,
      onClick: () => setScreen(item.key),
      title: collapsed ? item.label : ""
    },
    /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, item.icon),
    !collapsed && item.label,
    badge > 0 && /* @__PURE__ */ React.createElement("span", { className: "ct" }, badge)
  );
}
function Topbar({ screen, clubProfile, setScreen, unread }) {
  const screenLabel = ALL_NAV_ITEMS.find((n) => n.key === screen)?.label || screen;
  const name = clubProfile?.club_name || "";
  return /* @__PURE__ */ React.createElement("div", { className: "topbar" }, /* @__PURE__ */ React.createElement("div", { className: "crumbs" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "home"), /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chevron_right"), /* @__PURE__ */ React.createElement("b", null, screenLabel)), /* @__PURE__ */ React.createElement("div", { className: "spread" }), /* @__PURE__ */ React.createElement("div", { className: "actions" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => setScreen("chat"), title: "Mesajlar", style: { position: "relative" } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "chat")), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => setScreen("notifications"), title: "Bildirimler" }, /* @__PURE__ */ React.createElement("span", { className: "material-icons" }, "notifications"), unread > 0 && /* @__PURE__ */ React.createElement("span", { className: "dot" }))));
}
function AccessDenied() {
  return /* @__PURE__ */ React.createElement("div", { className: "page fade-in", style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "material-icons", style: { fontSize: 48, color: "var(--text-2)" } }, "lock"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 18, color: "var(--text-1)" } }, "Bu sayfaya eri\u015Fim yetkiniz yok"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "var(--text-2)" } }, "Kul\xFCp y\xF6neticisi hesab\u0131yla giri\u015F yapman\u0131z gerekiyor."));
}
const EMPLOYEE_BLOCKED = /* @__PURE__ */ new Set(["employees", "customers", "finance", "wallet", "analytics", "reviews", "profile"]);
function ScreenRouter({ screen, setScreen, clubId, clubProfile, userType }) {
  const ctx = { clubId, clubProfile, setScreen, userType };
  if (userType === "employee" && EMPLOYEE_BLOCKED.has(screen)) {
    return /* @__PURE__ */ React.createElement(AccessDenied, null);
  }
  switch (screen) {
    case "dashboard":
      return /* @__PURE__ */ React.createElement(DashboardScreen, { ...ctx });
    case "reservations":
      return /* @__PURE__ */ React.createElement(ReservationsScreen, { ...ctx });
    case "courts":
      return /* @__PURE__ */ React.createElement(CourtsScreen, { ...ctx });
    case "members":
      return clubProfile?.has_membership_system === false ? /* @__PURE__ */ React.createElement(CustomersScreen, { ...ctx }) : /* @__PURE__ */ React.createElement(MembersScreen, { ...ctx });
    case "coaches":
      return /* @__PURE__ */ React.createElement(CoachesScreen, { ...ctx });
    case "employees":
      return /* @__PURE__ */ React.createElement(EmployeesScreen, { ...ctx });
    case "customers":
      return /* @__PURE__ */ React.createElement(CustomersScreen, { ...ctx });
    case "lesson_requests":
      return /* @__PURE__ */ React.createElement(LessonRequestsScreen, { ...ctx });
    case "packages":
      return /* @__PURE__ */ React.createElement(LessonPackagesScreen, { ...ctx });
    case "student_notes":
      return /* @__PURE__ */ React.createElement(StudentNotesScreen, { ...ctx });
    case "tournaments":
      return /* @__PURE__ */ React.createElement(TournamentsScreen, { ...ctx });
    case "groups":
      return /* @__PURE__ */ React.createElement(GroupsScreen, { ...ctx });
    case "group_players":
      return /* @__PURE__ */ React.createElement(GroupPlayersScreen, { ...ctx });
    case "program":
      return /* @__PURE__ */ React.createElement(MyProgramScreen, { ...ctx });
    case "cafe":
      return /* @__PURE__ */ React.createElement(CafeScreen, { ...ctx });
    case "finance":
      return /* @__PURE__ */ React.createElement(FinanceScreen, { ...ctx });
    case "analytics":
      return /* @__PURE__ */ React.createElement(AnalyticsScreen, { ...ctx });
    case "reviews":
      return /* @__PURE__ */ React.createElement(ClubReviewsScreen, { ...ctx });
    case "chat":
      return /* @__PURE__ */ React.createElement(ChatScreen, { ...ctx });
    case "notifications":
      return /* @__PURE__ */ React.createElement(NotificationsScreen, { ...ctx });
    case "notif_prefs":
      return /* @__PURE__ */ React.createElement(NotificationPreferencesScreen, { ...ctx });
    case "profile":
      return /* @__PURE__ */ React.createElement(ClubProfileScreen, { ...ctx });
    default:
      return /* @__PURE__ */ React.createElement(DashboardScreen, { ...ctx });
  }
}
function App() {
  const [session, setSession] = useState(null);
  const [clubProfile, setClubProfile] = useState(null);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [userType, setUserType] = useState(null);
  const [screen, setScreen] = useState("program");
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [pendingMembers, setPendingMembers] = useState(0);
  const [sideCollapsed, setSideCollapsed] = useState(() => localStorage.getItem("sideCollapsed") === "true");
  const toggleSide = useCallback(() => {
    setSideCollapsed((v) => {
      const next = !v;
      localStorage.setItem("sideCollapsed", next);
      return next;
    });
  }, []);
  useEffect(() => {
    const init = async () => {
      const sess = await authGetSession();
      if (!sess) {
        window.location.href = "login.html";
        return;
      }
      setSession(sess);
      try {
        const profile = await getClubProfile(sess.user.id);
        if (profile) {
          setClubProfile({ ...profile, email: profile.email || sess.user.email });
          setUserType("club");
          fetchBadgeCounts(profile.id, sess.user.id);
          setLoading(false);
          return;
        }
        const uType = await getUserType(sess.user.id);
        if (uType === "employee") {
          const empData = await getEmployeeData(sess.user.id);
          if (!empData?.club_id) {
            await sb.auth.signOut();
            window.location.href = "login.html";
            return;
          }
          const clubProf = await getClubProfile(empData.club_id);
          setClubProfile(clubProf);
          setEmployeeProfile({ full_name: empData.profiles?.full_name, email: empData.profiles?.email });
          setUserType("employee");
          fetchBadgeCounts(empData.club_id, sess.user.id);
        } else {
          await sb.auth.signOut();
          window.location.href = "login.html";
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, sess) => {
      if (event === "SIGNED_OUT") window.location.href = "login.html";
    });
    return () => subscription.unsubscribe();
  }, []);
  const fetchBadgeCounts = async (clubId, userId) => {
    try {
      const [{ count: unreadCnt }, { count: pendingCnt }] = await Promise.all([
        sb.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false),
        sb.from("club_memberships").select("*", { count: "exact", head: true }).eq("club_id", clubId).eq("status", "pending")
      ]);
      setUnread(unreadCnt ?? 0);
      setPendingMembers(pendingCnt ?? 0);
    } catch {
    }
  };
  useEffect(() => {
    const defaults = window.__tweakDefaults || {};
    const shell = document.querySelector(".shell");
    if (shell) {
      shell.dataset.side = defaults.sideTheme || "navy";
      shell.dataset.density = defaults.density || "compact";
    }
  }, [loading]);
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "spinner", style: { width: 48, height: 48 } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "var(--text-2)" } }, "Y\xFCkleniyor\u2026")));
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "shell",
      "data-side": "navy",
      "data-density": "compact",
      style: { "--side-w": sideCollapsed ? "64px" : "248px" }
    },
    /* @__PURE__ */ React.createElement(
      Sidebar,
      {
        screen,
        setScreen,
        clubProfile,
        employeeProfile,
        userType,
        unread,
        pendingMembers,
        collapsed: sideCollapsed,
        onToggle: toggleSide
      }
    ),
    /* @__PURE__ */ React.createElement("div", { className: "main" }, /* @__PURE__ */ React.createElement(
      Topbar,
      {
        screen,
        clubProfile,
        setScreen,
        unread
      }
    ), /* @__PURE__ */ React.createElement(
      ScreenRouter,
      {
        screen,
        setScreen,
        clubId: clubProfile?.id,
        clubProfile,
        userType
      }
    )),
    /* @__PURE__ */ React.createElement("div", { className: "tweaks-host" })
  );
}

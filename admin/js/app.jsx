// ── Kök uygulama: Auth kontrolü + Shell + Navigasyon ───────────

const { useState, useEffect, useCallback } = React;

// ── Navigasyon tanımları ───────────────────────────────────────
const ALL_NAV_ITEMS = [
  { key: 'dashboard',      icon: 'dashboard',              label: 'Dashboard',          section: 'GENEL',      employeeOk: true  },
  { key: 'reservations',   icon: 'event_available',        label: 'Rezervasyonlar',     section: 'YÖNETİM',    employeeOk: true  },
  { key: 'courts',         icon: 'sports_tennis',          label: 'Kortlar',            section: null,         employeeOk: true  },
  { key: 'members',        icon: 'group',                  label: 'Üyeler',             section: null,         employeeOk: true  },
  { key: 'coaches',        icon: 'person',                 label: 'Koçlar',             section: null,         employeeOk: true  },
  { key: 'employees',      icon: 'badge',                  label: 'Çalışanlar',         section: null,         employeeOk: false },
  { key: 'lesson_requests',icon: 'mark_email_unread',      label: 'Ders Talepleri',     section: null,         employeeOk: true  },
  { key: 'packages',       icon: 'inventory_2',            label: 'Ders Paketleri',     section: null,         employeeOk: true  },
  { key: 'student_notes',  icon: 'sticky_note_2',          label: 'Öğrenci Notları',    section: null,         employeeOk: true  },
  { key: 'tournaments',    icon: 'emoji_events',           label: 'Turnuvalar',         section: 'ETKİNLİKLER',employeeOk: true  },
  { key: 'groups',         icon: 'groups',                 label: 'Gruplar',            section: null,         employeeOk: true  },
  { key: 'program',        icon: 'calendar_today',         label: 'Program',            section: null,         employeeOk: true  },
  { key: 'cafe',           icon: 'local_cafe',             label: 'Kafe / Market',      section: null,         employeeOk: true  },
  { key: 'finance',        icon: 'account_balance_wallet', label: 'Finans',             section: 'ANALİZ',     employeeOk: false },
  { key: 'analytics',      icon: 'bar_chart',              label: 'Analitik',           section: null,         employeeOk: false },
  { key: 'reviews',        icon: 'star',                   label: 'Yorumlar',           section: null,         employeeOk: false },
  { key: 'chat',           icon: 'chat',                   label: 'Sohbet',             section: 'İLETİŞİM',   employeeOk: true  },
  { key: 'notifications',  icon: 'notifications',          label: 'Bildirimler',        section: null,         employeeOk: true  },
  { key: 'notif_prefs',    icon: 'tune',                   label: 'Bildirim Tercihleri',section: null,         employeeOk: true  },
  { key: 'profile',        icon: 'business',               label: 'Kulüp Profili',      section: 'AYARLAR',    employeeOk: false },
];

// ── Sidebar ────────────────────────────────────────────────────
function Sidebar({ screen, setScreen, clubProfile, employeeProfile, userType, unread, pendingMembers }) {
  const isEmployee = userType === 'employee';
  const name = isEmployee
    ? (employeeProfile?.full_name || 'Çalışan')
    : (clubProfile?.club_name || 'Kulübüm');
  const abbr = initials(name);
  const NAV_ITEMS = isEmployee
    ? ALL_NAV_ITEMS.filter(i => i.employeeOk)
    : ALL_NAV_ITEMS;

  return (
    <aside className="side">
      <div className="side-brand">
        <img src="../Courty_Logo.png" alt="CourtyCLUB" />
        <div className="name">Courty<em>CLUB</em></div>
      </div>

      <div className="side-clubcard">
        <div className="av av-sq" style={{ background: isEmployee ? '#0D9488' : 'var(--brand-navy)', color: '#fff', width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
          {abbr}
        </div>
        <div className="who">
          <div className="n">{name}</div>
          <div className="r">{isEmployee ? 'Çalışan' : 'Kulüp Yöneticisi'}</div>
        </div>
        <div className="dot" />
      </div>

      <nav className="side-nav">
        {NAV_ITEMS.map(item => {
          if (item.section) {
            return (
              <React.Fragment key={item.key}>
                <div className="side-section">{item.section}</div>
                <SideItem item={item} active={screen === item.key} setScreen={setScreen}
                  badge={item.key === 'notifications' ? unread : item.key === 'members' ? pendingMembers : 0} />
              </React.Fragment>
            );
          }
          return (
            <SideItem key={item.key} item={item} active={screen === item.key} setScreen={setScreen}
              badge={item.key === 'notifications' ? unread : item.key === 'members' ? pendingMembers : 0} />
          );
        })}
      </nav>

      <div className="side-foot">
        <button onClick={authSignOut}>
          <span className="material-icons">logout</span>
          Çıkış
        </button>
      </div>
    </aside>
  );
}

function SideItem({ item, active, setScreen, badge }) {
  return (
    <div className={`side-item${active ? ' active' : ''}`} onClick={() => setScreen(item.key)}>
      <span className="material-icons">{item.icon}</span>
      {item.label}
      {badge > 0 && <span className="ct">{badge}</span>}
    </div>
  );
}

// ── Topbar ─────────────────────────────────────────────────────
function Topbar({ screen, clubProfile, setScreen, unread }) {
  const screenLabel = ALL_NAV_ITEMS.find(n => n.key === screen)?.label || screen;
  const name = clubProfile?.club_name || '';

  return (
    <div className="topbar">
      <div className="crumbs">
        <span className="material-icons">home</span>
        <span className="material-icons">chevron_right</span>
        <b>{screenLabel}</b>
      </div>
      <div className="spread" />
      <div className="actions">
        <button className="icon-btn" onClick={() => setScreen('notifications')} title="Bildirimler">
          <span className="material-icons">notifications</span>
          {unread > 0 && <span className="dot" />}
        </button>
      </div>
    </div>
  );
}

// ── Erişim reddedildi ──────────────────────────────────────────
function AccessDenied() {
  return (
    <div className="page fade-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:12 }}>
      <span className="material-icons" style={{ fontSize:48, color:'var(--text-2)' }}>lock</span>
      <div style={{ fontWeight:700, fontSize:18, color:'var(--text-1)' }}>Bu sayfaya erişim yetkiniz yok</div>
      <div style={{ fontSize:14, color:'var(--text-2)' }}>Kulüp yöneticisi hesabıyla giriş yapmanız gerekiyor.</div>
    </div>
  );
}

// ── Ekran yönlendirici ─────────────────────────────────────────
const EMPLOYEE_BLOCKED = new Set(['employees', 'finance', 'wallet', 'analytics', 'reviews', 'profile']);

function ScreenRouter({ screen, setScreen, clubId, clubProfile, userType }) {
  const ctx = { clubId, clubProfile, setScreen, userType };

  if (userType === 'employee' && EMPLOYEE_BLOCKED.has(screen)) {
    return <AccessDenied />;
  }

  switch (screen) {
    case 'dashboard':       return <DashboardScreen            {...ctx} />;
    case 'reservations':    return <ReservationsScreen         {...ctx} />;
    case 'courts':          return <CourtsScreen               {...ctx} />;
    case 'members':         return <MembersScreen              {...ctx} />;
    case 'coaches':         return <CoachesScreen              {...ctx} />;
    case 'employees':       return <EmployeesScreen            {...ctx} />;
    case 'lesson_requests': return <LessonRequestsScreen       {...ctx} />;
    case 'packages':        return <LessonPackagesScreen       {...ctx} />;
    case 'student_notes':   return <StudentNotesScreen         {...ctx} />;
    case 'tournaments':     return <TournamentsScreen          {...ctx} />;
    case 'groups':          return <GroupsScreen               {...ctx} />;
    case 'program':         return <MyProgramScreen            {...ctx} />;
    case 'cafe':            return <CafeScreen                 {...ctx} />;
    case 'finance':         return <FinanceScreen              {...ctx} />;
    case 'analytics':       return <AnalyticsScreen            {...ctx} />;
    case 'reviews':         return <ClubReviewsScreen          {...ctx} />;
    case 'chat':            return <ChatScreen                 {...ctx} />;
    case 'notifications':   return <NotificationsScreen        {...ctx} />;
    case 'notif_prefs':     return <NotificationPreferencesScreen {...ctx} />;
    case 'profile':         return <ClubProfileScreen          {...ctx} />;
    default:                return <DashboardScreen            {...ctx} />;
  }
}

// ── Kök App ────────────────────────────────────────────────────
function App() {
  const [session,         setSession]         = useState(null);
  const [clubProfile,     setClubProfile]     = useState(null);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [userType,        setUserType]        = useState(null); // 'club' | 'employee'
  const [screen,          setScreen]          = useState('dashboard');
  const [loading,         setLoading]         = useState(true);
  const [unread,          setUnread]          = useState(0);
  const [pendingMembers,  setPendingMembers]  = useState(0);

  // Oturum kontrolü
  useEffect(() => {
    const init = async () => {
      const sess = await authGetSession();
      if (!sess) { window.location.href = 'login.html'; return; }
      setSession(sess);

      try {
        // Kulüp hesabı mı?
        const profile = await getClubProfile(sess.user.id);
        if (profile) {
          setClubProfile({ ...profile, email: profile.email || sess.user.email });
          setUserType('club');
          fetchBadgeCounts(profile.id, sess.user.id);
          setLoading(false);
          return;
        }

        // Çalışan mı?
        const uType = await getUserType(sess.user.id);
        if (uType === 'employee') {
          const empData = await getEmployeeData(sess.user.id);
          if (!empData?.club_id) { await sb.auth.signOut(); window.location.href = 'login.html'; return; }
          const clubProf = await getClubProfile(empData.club_id);
          setClubProfile(clubProf);
          setEmployeeProfile({ full_name: empData.profiles?.full_name, email: empData.profiles?.email });
          setUserType('employee');
          fetchBadgeCounts(empData.club_id, sess.user.id);
        } else {
          await sb.auth.signOut();
          window.location.href = 'login.html';
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, sess) => {
      if (event === 'SIGNED_OUT') window.location.href = 'login.html';
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchBadgeCounts = async (clubId, userId) => {
    try {
      // notifications.user_id = auth.users.id (club_id kolonu yok)
      // club_memberships.club_id = club_profiles.id
      const [{ count: unreadCnt }, { count: pendingCnt }] = await Promise.all([
        sb.from('notifications').select('*', { count: 'exact', head: true })
          .eq('user_id', userId).eq('is_read', false),
        sb.from('club_memberships').select('*', { count: 'exact', head: true })
          .eq('club_id', clubId).eq('status', 'pending'),
      ]);
      setUnread(unreadCnt ?? 0);
      setPendingMembers(pendingCnt ?? 0);
    } catch {}
  };

  // Tweaks'tan gelen tema tercihleri
  useEffect(() => {
    const defaults = window.__tweakDefaults || {};
    const shell = document.querySelector('.shell');
    if (shell) {
      shell.dataset.side    = defaults.sideTheme  || 'navy';
      shell.dataset.density = defaults.density    || 'compact';
      shell.style.setProperty('--side-w', (defaults.sideWidth || 248) + 'px');
    }
  }, [loading]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" style={{ width: 48, height: 48 }} />
          <span style={{ fontSize: 14, color: 'var(--text-2)' }}>Yükleniyor…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="shell" data-side="navy" data-density="compact">
      <Sidebar
        screen={screen}
        setScreen={setScreen}
        clubProfile={clubProfile}
        employeeProfile={employeeProfile}
        userType={userType}
        unread={unread}
        pendingMembers={pendingMembers}
      />
      <div className="main">
        <Topbar
          screen={screen}
          clubProfile={clubProfile}
          setScreen={setScreen}
          unread={unread}
        />
        <ScreenRouter
          screen={screen}
          setScreen={setScreen}
          clubId={clubProfile?.id}
          clubProfile={clubProfile}
          userType={userType}
        />
      </div>
      <div className="tweaks-host" />
    </div>
  );
}

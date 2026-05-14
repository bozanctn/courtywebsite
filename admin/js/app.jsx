// ── Kök uygulama: Auth kontrolü + Shell + Navigasyon ───────────

const { useState, useEffect, useCallback } = React;

// ── Navigasyon tanımları ───────────────────────────────────────
const NAV_ITEMS = [
  { key: 'dashboard',    icon: 'dashboard',              label: 'Dashboard',     section: 'GENEL' },
  { key: 'reservations', icon: 'event_available',        label: 'Rezervasyonlar',section: 'YÖNETİM' },
  { key: 'courts',       icon: 'sports_tennis',          label: 'Kortlar',       section: null },
  { key: 'members',      icon: 'group',                  label: 'Üyeler',        section: null },
  { key: 'coaches',      icon: 'person',                 label: 'Koçlar',        section: null },
  { key: 'employees',    icon: 'badge',                  label: 'Çalışanlar',    section: null },
  { key: 'lessons',      icon: 'school',                 label: 'Dersler',       section: null },
  { key: 'tournaments',  icon: 'emoji_events',           label: 'Turnuvalar',    section: 'ETKİNLİKLER' },
  { key: 'groups',       icon: 'groups',                 label: 'Gruplar',       section: null },
  { key: 'finance',      icon: 'account_balance_wallet', label: 'Finans',        section: 'ANALİZ' },
  { key: 'analytics',    icon: 'bar_chart',              label: 'Analitik',      section: null },
  { key: 'chat',         icon: 'chat',                   label: 'Sohbet',        section: 'İLETİŞİM' },
  { key: 'notifications',icon: 'notifications',          label: 'Bildirimler',   section: null },
  { key: 'profile',      icon: 'business',               label: 'Kulüp Profili', section: 'AYARLAR' },
];

// ── Sidebar ────────────────────────────────────────────────────
function Sidebar({ screen, setScreen, clubProfile, unread, pendingMembers }) {
  const name = clubProfile?.club_name || 'Kulübüm';
  const abbr = initials(name);

  return (
    <aside className="side">
      <div className="side-brand">
        <img src="../Courty_Logo.png" alt="CourtyCLUB" />
        <div className="name">Courty<em>CLUB</em></div>
      </div>

      <div className="side-clubcard">
        <div className="av av-sq" style={{ background: 'var(--brand-navy)', color: '#fff', width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
          {abbr}
        </div>
        <div className="who">
          <div className="n">{name}</div>
          <div className="r">Kulüp Yöneticisi</div>
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
  const screenLabel = NAV_ITEMS.find(n => n.key === screen)?.label || screen;
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
        <div className="me">
          <div className="av">{initials(name)}</div>
          <span className="n">{name || 'Kulüp'}</span>
          <span className="material-icons">keyboard_arrow_down</span>
        </div>
      </div>
    </div>
  );
}

// ── Ekran yönlendirici ─────────────────────────────────────────
function ScreenRouter({ screen, setScreen, clubId, clubProfile }) {
  const ctx = { clubId, clubProfile, setScreen };

  switch (screen) {
    case 'dashboard':     return <DashboardScreen    {...ctx} />;
    case 'reservations':  return <ReservationsScreen {...ctx} />;
    case 'courts':        return <CourtsScreen        {...ctx} />;
    case 'members':       return <MembersScreen       {...ctx} />;
    case 'coaches':       return <CoachesScreen        {...ctx} />;
    case 'employees':     return <EmployeesScreen      {...ctx} />;
    case 'lessons':       return <LessonsScreen        {...ctx} />;
    case 'tournaments':   return <TournamentsScreen    {...ctx} />;
    case 'groups':        return <GroupsScreen          {...ctx} />;
    case 'finance':       return <FinanceScreen         {...ctx} />;
    case 'analytics':     return <AnalyticsScreen       {...ctx} />;
    case 'chat':          return <ChatScreen             {...ctx} />;
    case 'notifications': return <NotificationsScreen   {...ctx} />;
    case 'profile':       return <ClubProfileScreen     {...ctx} />;
    default:              return <DashboardScreen       {...ctx} />;
  }
}

// ── Kök App ────────────────────────────────────────────────────
function App() {
  const [session,       setSession]       = useState(null);
  const [clubProfile,   setClubProfile]   = useState(null);
  const [screen,        setScreen]        = useState('dashboard');
  const [loading,       setLoading]       = useState(true);
  const [unread,        setUnread]        = useState(0);
  const [pendingMembers,setPendingMembers]= useState(0);

  // Oturum kontrolü
  useEffect(() => {
    const init = async () => {
      const sess = await authGetSession();
      if (!sess) { window.location.href = 'login.html'; return; }
      setSession(sess);

      try {
        const profile = await getClubProfile(sess.user.id);
        if (!profile) { await sb.auth.signOut(); window.location.href = 'login.html'; return; }
        setClubProfile(profile);
        // profile.id === sess.user.id (club_profiles.id = auth.users.id)
        fetchBadgeCounts(profile.id, sess.user.id);
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
        />
      </div>
      <div className="tweaks-host" />
    </div>
  );
}

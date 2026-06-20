// ── Dashboard, Rezervasyonlar, Kortlar ─────────────────────────

// Rezervasyon formunda üye arama ve limit kontrolü için bileşen
function MemberLimitSearch({ clubId, value, onChange }) {
  const { useState, useEffect } = React;
  const [query,   setQuery]   = React.useState('');
  const [results, setResults] = React.useState([]);
  const [chosen,  setChosen]  = React.useState(null);
  const [limWarn, setLimWarn] = React.useState([]);

  const search = async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const { data } = await sb.from('club_memberships')
      .select('user_id, member_name, profile:profiles!club_memberships_user_id_fkey(id, full_name)')
      .eq('club_id', clubId).eq('status', 'active')
      .limit(8);
    const filtered = (data || []).filter(m => {
      const name = m.profile?.full_name || m.member_name || '';
      return name.toLowerCase().includes(q.toLowerCase());
    });
    setResults(filtered);
  };

  const select = (m) => {
    const name = m.profile?.full_name || m.member_name || '';
    setChosen({ id: m.user_id || m.id, name });
    setResults([]);
    setQuery('');
    onChange(m.user_id || m.id);
  };

  const clear = () => {
    setChosen(null);
    setLimWarn([]);
    onChange(null);
  };

  if (chosen) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:8, background:'#EEF2FF', borderRadius:8, padding:'8px 12px' }}>
        <span className="material-icons" style={{ color:'var(--brand-navy)', fontSize:16 }}>person</span>
        <span style={{ flex:1, fontWeight:600, fontSize:13 }}>{chosen.name}</span>
        <button type="button" onClick={clear}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)', padding:0 }}>
          <span className="material-icons" style={{ fontSize:16 }}>close</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ position:'relative' }}>
      <input placeholder="Üye adı ara…" value={query} onChange={e => search(e.target.value)}
        style={{ width:'100%' }} />
      {results.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:20, background:'#fff', border:'1px solid var(--border)', borderRadius:8, boxShadow:'0 4px 12px rgba(0,0,0,0.1)', overflow:'hidden' }}>
          {results.map(m => {
            const name = m.profile?.full_name || m.member_name || '';
            return (
              <div key={m.user_id || m.id}
                style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:500 }}
                onMouseDown={() => select(m)}>
                {name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function DashboardScreen({ clubId, clubProfile, setScreen }) {
  const { useState, useEffect } = React;
  const [loading,     setLoading]     = useState(true);
  const [todayCount,  setTodayCount]  = useState(0);
  const [pendingPay,  setPendingPay]  = useState(0);
  const [pendingMem,  setPendingMem]  = useState(0);
  const [courtCount,  setCourtCount]  = useState(0);
  const [bookings,    setBookings]    = useState([]);
  const [courts,      setCourts]      = useState([]);

  useEffect(() => { if (clubId) load(); }, [clubId]);

  const load = async () => {
    setLoading(true);
    try {
      // DB'de saatler yerel saat olarak UTC'de saklandığından +3 saat ekleyerek aralık oluşturuyoruz
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);
      const dbStart = localTimeToDb(todayStart.toISOString());
      const dbEnd   = localTimeToDb(todayEnd.toISOString());

      // bookings tablosunda club_id yok — önce court ID'lerini al
      const courtIds = await getClubCourtIds(clubId);

      const [bRes, pendMemRes, courtRes] = await Promise.all([
        courtIds.length > 0
          ? sb.from('bookings')
              .select('*, courts!bookings_court_id_fkey(court_number,court_type), booking_players!booking_players_booking_id_fkey(player_id,is_primary_player, profiles!booking_players_player_id_fkey(id,full_name,email))')
              .in('court_id', courtIds)
              .neq('status', 'cancelled')
              .gte('start_time', dbStart)
              .lte('start_time', dbEnd)
              .order('start_time', { ascending: true })
              .limit(8)
          : Promise.resolve({ data: [] }),
        sb.from('club_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', clubId)
          .eq('status', 'pending'),
        sb.from('courts')
          .select('id,court_number,court_type,hourly_rate,is_indoor,is_active')
          .eq('club_id', clubId)
          .eq('is_active', true)
          .order('court_number'),
      ]);

      const rows = (bRes.data || []).map(b => ({
        ...b,
        start_time: dbTimeToLocal(b.start_time),
        end_time:   dbTimeToLocal(b.end_time),
      }));
      const courtList = courtRes.data || [];
      setBookings(rows);
      setCourts(courtList);
      setTodayCount(rows.length);
      // payment_status filtresi JS tarafında (DB'de alan var ama opsiyonel)
      setPendingPay(rows.filter(b => b.payment_status !== 'paid').length);
      setPendingMem(pendMemRes.count ?? 0);
      setCourtCount(courtList.length);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const TILES = [
    { icon: 'event_available', label: 'Rezervasyonlar', screen: 'reservations', color: '#003399' },
    { icon: 'calendar_today',  label: 'Program',         screen: 'program',      color: '#6366F1' },
    { icon: 'sports_tennis',   label: 'Kortlar',          screen: 'courts',       color: '#0891B2' },
    { icon: 'bar_chart',       label: 'Analitik',         screen: 'analytics',    color: '#8B5CF6' },
    { icon: 'person',          label: 'Koçlar',           screen: 'coaches',      color: '#0D9488' },
    { icon: 'emoji_events',    label: 'Turnuvalar',       screen: 'tournaments',  color: '#F97316' },
    { icon: 'groups',          label: 'Gruplar',          screen: 'groups',       color: '#0EA5E9' },
    { icon: 'sports_tennis',   label: 'Grup Oyuncuları',  screen: 'group_players', color: '#0F766E' },
    { icon: 'group',           label: 'Üyeler',           screen: 'members',      color: '#22C55E' },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">{new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>
        </div>
        <button className="btn btn-pri" onClick={load}>
          <span className="material-icons">refresh</span>
          Yenile
        </button>
      </div>

      {/* İstatistik kartları */}
      <div className="stats">
        <StatCard icon="event_available"        n={todayCount}  label="Bugünkü Rezervasyonlar" tint="" />
        <StatCard icon="account_balance_wallet" n={pendingPay}  label="Bekleyen Ödeme"         tint={pendingPay > 0 ? 'purple' : ''} />
        <StatCard icon="group"                  n={pendingMem}  label="Bekleyen Üye"           tint={pendingMem > 0 ? '' : ''} />
        <StatCard icon="sports_tennis"          n={courtCount}  label="Aktif Kort"             tint="green" />
      </div>

      {/* Hızlı aksiyonlar */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Hızlı Erişim</div>
        <div className="tiles">
          {TILES.map(t => (
            <div key={t.screen} className="tile" style={{ background: t.color }} onClick={() => setScreen(t.screen)}>
              <span className="material-icons">{t.icon}</span>
              <span className="l">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bugünkü rezervasyonlar + Program kısayolu */}
      <div className="row2">
        <div className="card tight">
          <div className="card-h">
            <h3>Bugünkü Rezervasyonlar</h3>
            <div className="right">
              <a onClick={() => setScreen('reservations')} style={{ cursor: 'pointer' }}>Tümünü Gör</a>
            </div>
          </div>
          {bookings.length === 0
            ? <EmptyState icon="event_available" title="Bugün rezervasyon yok" />
            : bookings.map(b => <BookingRow key={b.id} booking={b} onClick={() => setScreen('reservations')} />)
          }
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Program kısayolu */}
          <div className="card" style={{ cursor: 'pointer', border: '1.5px solid #6366F122' }} onClick={() => setScreen('program')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF2FF', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <span className="material-icons" style={{ color: '#6366F1', fontSize: 22 }}>calendar_today</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Program</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Günlük kort takvimini görüntüle</div>
              </div>
              <span className="material-icons" style={{ color: 'var(--text-3, #cbd5e1)', fontSize: 18 }}>chevron_right</span>
            </div>
          </div>

          {/* Kulüp Bilgileri */}
          <div className="card">
            <div className="row between" style={{ marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Kulüp Bilgileri</span>
              <button className="btn btn-soft btn-sm" onClick={() => setScreen('profile')}>
                <span className="material-icons">edit</span> Düzenle
              </button>
            </div>
            {clubProfile && (
              <div>
                <div className="kv"><span className="k">Adres</span><span className="v">{clubProfile.address || '—'}</span></div>
                <div className="kv"><span className="k">Telefon</span><span className="v">{clubProfile.contact_phone || '—'}</span></div>
                <div className="kv"><span className="k">E-posta</span><span className="v">{clubProfile.email || '—'}</span></div>
                <div className="kv"><span className="k">Kortlar</span><span className="v">{courtCount} kort</span></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kortlar Önizleme */}
      {courts.length > 0 && (
        <div className="card tight" style={{ marginTop: 0 }}>
          <div className="card-h">
            <h3>Kortlar</h3>
            <div className="right">
              <a onClick={() => setScreen('courts')} style={{ cursor: 'pointer' }}>Tümünü Gör</a>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, padding: '12px 16px 16px' }}>
            {courts.map(c => {
              const todayBkCount = bookings.filter(b => b.court_id === c.id).length;
              const typeLabel = c.court_type === 'clay' ? 'Toprak' : c.court_type === 'hard' ? 'Sert' : c.court_type === 'grass' ? 'Çim' : c.court_type === 'indoor' ? 'Kapalı' : c.court_type || '—';
              return (
                <div key={c.id}
                  onClick={() => setScreen('courts')}
                  style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>Kort {c.court_number}</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: todayBkCount > 0 ? '#EF4444' : '#22C55E' }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>
                    {typeLabel}{c.is_indoor ? ' · Kapalı' : ' · Açık'}
                  </div>
                  {c.hourly_rate > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>₺{c.hourly_rate}/saat</div>
                  )}
                  <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: todayBkCount > 0 ? '#DC2626' : '#16A34A' }}>
                    {todayBkCount > 0 ? `${todayBkCount} rezervasyon` : 'Müsait'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function lesson_court_row(lesson, courts) {
  if (lesson.court_id) return courts.find(c => c.id === lesson.court_id);
  const m = (lesson.location || '').match(/Kort\s*(\d+)/i);
  return m ? courts.find(c => c.court_number === parseInt(m[1])) : null;
}

// ═══════════════════════════════════════════════════════════════
// REZERVASYONLAR
// ═══════════════════════════════════════════════════════════════
function ReservationsScreen({ clubId, setScreen, clubProfile }) {
  const { useState, useEffect } = React;
  const [mainTab,   setMainTab]   = useState('bookings'); // 'bookings' | 'lessons'
  const [selDate,   setSelDate]   = useState(todayISO());
  const [bookings,  setBookings]  = useState([]);
  const [courts,    setCourts]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [dotDates,  setDotDates]  = useState([]);
  const [modal,     setModal]     = useState(null);
  const [form,      setForm]      = useState({});
  const [saving,    setSaving]    = useState(false);

  // Yeni rezervasyon bottom-sheet modalı
  const [requiresApproval, setRequiresApproval] = useState(false);

  const [bkModalVisible,  setBkModalVisible]  = useState(false);
  const [bkForm,          setBkForm]          = useState({});
  const [bkAvailCourts,   setBkAvailCourts]   = useState([]);
  const [bkCourtsLoading, setBkCourtsLoading] = useState(false);
  const [bkSaving,        setBkSaving]        = useState(false);
  const [bkMemberId,      setBkMemberId]      = useState(null);
  const [bkMemberName,    setBkMemberName]    = useState('');
  const [bkMemberQuery,   setBkMemberQuery]   = useState('');
  const [bkMemberResults, setBkMemberResults] = useState([]);
  const [bkMemberLoading, setBkMemberLoading] = useState(false);

  // Müşteri (CRM) arama state'leri
  const [bkCustomerId,      setBkCustomerId]      = useState(null);
  const [bkCustomerName,    setBkCustomerName]    = useState('');
  const [bkCustomerQuery,   setBkCustomerQuery]   = useState('');
  const [bkCustomerResults, setBkCustomerResults] = useState([]);
  const hasMembership = clubProfile?.has_membership_system !== false;
  const [bkPersonMode,      setBkPersonMode]      = useState('member'); // 'member' | 'customer' | 'guest'
  const [bkGuestName,       setBkGuestName]       = useState('');
  const [bkPriceOverride,   setBkPriceOverride]   = useState('');

  // Misafir → müşteri ekleme prompt
  const [guestCustModal,  setGuestCustModal]  = useState(null); // null | { bookingId, name, phone }
  const [guestCustSaving, setGuestCustSaving] = useState(false);

  // Özel dersler state
  const [lessons,      setLessons]      = useState([]);
  const [coaches,      setCoaches]      = useState([]);
  const [lessonCourts, setLessonCourts] = useState([]);
  const [loadingL,     setLoadingL]     = useState(false);
  const [lessonModal,  setLessonModal]  = useState(null);
  const [lessonForm,   setLessonForm]   = useState({});
  const [lessonMarkingId,    setLessonMarkingId]    = useState(null);
  const [lessonPlayerSearch,   setLessonPlayerSearch]   = useState('');
  const [lessonPlayerResults,  setLessonPlayerResults]  = useState([]);
  const [lessonSelectedPlayer, setLessonSelectedPlayer] = useState(null);
  const [lessonPackages,          setLessonPackages]          = useState([]);
  const [lessonUsePackage,        setLessonUsePackage]        = useState(false);
  const [lessonSelectedPackageId, setLessonSelectedPackageId] = useState(null);
  const [lessonLoadingPackages,   setLessonLoadingPackages]   = useState(false);
  const [lessonPriceMode,         setLessonPriceMode]         = useState('dual'); // 'dual' | 'split'
  const [lessonCoachAmountInput,  setLessonCoachAmountInput]  = useState('');
  const [lessonClubAmountInput,   setLessonClubAmountInput]   = useState('');

  useEffect(() => {
    if (!clubId) return;
    loadCourts(); loadDotDates();
    sb.from('club_profiles').select('requires_booking_approval').eq('id', clubId).maybeSingle()
      .then(({ data }) => setRequiresApproval(data?.requires_booking_approval === true));
  }, [clubId]);
  useEffect(() => { if (clubId) loadDay(); }, [clubId, selDate, requiresApproval]);
  useEffect(() => { if (clubId && mainTab === 'lessons') loadLessons(); }, [clubId, mainTab, selDate]);

  // Kortlar ekranından slot tıklayarak gelen rezervasyon prefill
  useEffect(() => {
    const p = window.__slotPrefill;
    if (!p) return;
    if (p.type === 'reservation') {
      window.__slotPrefill = null;
      const [sh, sm] = p.start_time.split(':').map(Number);
      const [eh, em] = p.end_time.split(':').map(Number);
      const dMins = (eh * 60 + em) - (sh * 60 + sm);
      const dur = [0.75, 1.0, 1.5, 2.0].reduce((prev, cur) =>
        Math.abs(cur * 60 - dMins) < Math.abs(prev * 60 - dMins) ? cur : prev
      );
      setBkForm({ courtId: p.court_id, date: p.date, startTime: p.start_time, endTime: p.end_time, duration: dur, status: 'confirmed' });
      setBkMemberId(null); setBkMemberName(''); setBkMemberQuery(''); setBkMemberResults([]);
      setBkModalVisible(true);
      // Courts henüz yüklenmemişse önce yükle
      if (courts.length > 0) {
        loadBkAvailCourts(p.date, p.start_time, p.end_time);
      } else {
        sb.from('courts').select('id,court_number,court_type,hourly_rate,is_indoor').eq('club_id', clubId).eq('is_active', true).order('court_number')
          .then(({ data }) => {
            const list = data || [];
            setCourts(list);
            loadBkAvailCourts(p.date, p.start_time, p.end_time, list);
          });
      }
    } else if (p.type === 'lesson') {
      // Özel ders: coaches yüklendikten sonra açılacak — loadLessons içinde handle ediliyor
      setMainTab('lessons');
    }

    // Müşteri ekranından gelen prefill
    const cp = window.__customerPrefill;
    if (cp) {
      window.__customerPrefill = null;
      setBkCustomerId(cp.customerId);
      setBkCustomerName(cp.customerName);
      if (cp.userId) { setBkMemberId(cp.userId); setBkMemberName(cp.customerName); }
      setBkPersonMode('customer');
      setBkMemberId(cp.userId || null);
      setBkMemberName(cp.userId ? cp.customerName : '');
      const todayStr = todayISO();
      setBkForm({ courtId: '', date: todayStr, startTime: '09:00', endTime: '10:00', duration: 1.0, status: 'confirmed' });
      setBkMemberQuery(''); setBkMemberResults([]);
      setBkCustomerQuery(''); setBkCustomerResults([]);
      setBkModalVisible(true);
      sb.from('courts').select('id,court_number,court_type,hourly_rate,is_indoor')
        .eq('club_id', clubId).eq('is_active', true).order('court_number')
        .then(({ data }) => {
          const list = data || [];
          setCourts(list);
          setBkForm(prev => ({ ...prev, courtId: list[0]?.id || '' }));
          loadBkAvailCourts(todayStr, '09:00', '10:00', list);
        });
    }
  }, []);

  // Süre seçilince bitiş saatini otomatik hesapla (mobil ile aynı)
  useEffect(() => {
    if (!lessonForm.duration || !lessonForm.start_time || lessonForm.start_time.length < 5) return;
    const [sh, sm] = lessonForm.start_time.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm)) return;
    const totalMin = sh * 60 + sm + Math.round(lessonForm.duration * 60);
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    const newEnd = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
    setLessonForm(prev => ({ ...prev, end_time: newEnd }));
  }, [lessonForm.duration, lessonForm.start_time]);

  const loadCourts = async () => {
    const { data } = await sb.from('courts').select('id,court_number,court_type,hourly_rate,is_indoor').eq('club_id', clubId).eq('is_active', true);
    setCourts(data || []);
  };

  const loadDotDates = async () => {
    const from = new Date(); from.setDate(1);
    const to   = new Date(from.getFullYear(), from.getMonth() + 2, 0);
    const courtIds = await getClubCourtIds(clubId);
    if (courtIds.length === 0) return;
    const { data } = await sb.from('bookings')
      .select('start_time')
      .in('court_id', courtIds)
      .neq('status', 'cancelled')
      .gte('start_time', from.toISOString())
      .lte('start_time', to.toISOString());
    const dates = [...new Set((data || []).map(b => b.start_time.split('T')[0]))];
    setDotDates(dates);
  };

  const loadDay = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      // Yerel saat gece yarısı / gün sonu → UTC'ye çevir
      const startDt = new Date(selDate + 'T00:00:00');
      const endDt   = new Date(selDate + 'T23:59:59');
      const courtIds = await getClubCourtIds(clubId);
      if (courtIds.length === 0) { setBookings([]); return; }
      const startDb = localTimeToDb(startDt.toISOString());
      const endDb   = localTimeToDb(endDt.toISOString());
      const { data, error } = await sb
        .from('bookings')
        .select('*, courts!bookings_court_id_fkey(court_number,court_type), booking_players!booking_players_booking_id_fkey(player_id, is_primary_player, profiles!booking_players_player_id_fkey(id,full_name,email))')
        .in('court_id', courtIds)
        .neq('status', 'cancelled')
        .is('lesson_id', null)
        .gte('start_time', startDb)
        .lte('start_time', endDb)
        .order('start_time', { ascending: true });
      if (error) { console.error('loadDay error:', error); setBookings([]); return; }

      // Müşteri adlarını ayrı sorguyla çek (FK constraint olmayabilir)
      const customerIds = [...new Set((data || []).map(b => b.club_customer_id).filter(Boolean))];
      const custNameMap = new Map();
      if (customerIds.length > 0) {
        const { data: custData } = await sb.from('club_customers').select('id,full_name').in('id', customerIds);
        (custData || []).forEach(c => custNameMap.set(c.id, c.full_name));
      }

      // Pending bookingleri otomatik onayla — sadece onay gerektirmeyen kulüplerde
      if (!requiresApproval) {
        const pendingIds = (data || []).filter(b => b.status === 'pending').map(b => b.id);
        if (pendingIds.length > 0) {
          sb.from('bookings').update({ status: 'confirmed' }).in('id', pendingIds)
            .then(() => {}).catch(e => console.warn('Auto-confirm error:', e));
        }
      }
      setBookings((data || []).map(b => ({
        ...b,
        _customerName: custNameMap.get(b.club_customer_id) || null,
        status:     (!requiresApproval && b.status === 'pending') ? 'confirmed' : b.status,
        start_time: dbTimeToLocal(b.start_time),
        end_time:   dbTimeToLocal(b.end_time),
      })));
    } catch (e) {
      console.error('loadDay exception:', e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, booking) => {
    try {
      if (status === 'cancelled') {
        if (!confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?')) return;
        const { error } = await sb.from('bookings').update({ status }).eq('id', id);
        if (error) throw error;
        if (booking?.user_id) {
          sb.from('notifications').insert({
            user_id: booking.user_id,
            title:   'Rezervasyon İptal Edildi',
            message: 'Rezervasyonunuz kulüp tarafından iptal edildi.',
            type:    'reservation_cancelled',
            data:    { booking_id: id },
          }).then(() => {}).catch(e => console.warn('Bildirim gönderilemedi:', e));
        }
      } else {
        const { error } = await sb.from('bookings').update({ status }).eq('id', id);
        if (error) throw error;
        if (status === 'confirmed' && booking?.user_id) {
          sb.from('notifications').insert({
            user_id: booking.user_id,
            title:   'Rezervasyon Onaylandı',
            message: 'Rezervasyonunuz kulüp tarafından onaylandı.',
            type:    'reservation_confirmed',
            data:    { booking_id: id },
          }).then(() => {}).catch(e => console.warn('Bildirim gönderilemedi:', e));
        }
      }
    } catch (e) { alert(e.message); return; }
    loadDay();
  };

  const markBookingPaid = async (booking) => {
    const amount = Number(booking.total_amount) || 0;
    const amtStr = amount > 0 ? `\n\nTutar: ₺${amount.toLocaleString('tr-TR')}` : '';
    if (!confirm(`Bu rezervasyon için ödeme alındı mı?${amtStr}`)) return;
    try {
      const { error } = await sb.from('bookings').update({ payment_status: 'paid' }).eq('id', booking.id);
      if (error) throw error;
      if (amount > 0) {
        const playerName = booking.player_name
          || booking.booking_players?.find(p => p.is_primary_player)?.profiles?.full_name
          || booking.booking_players?.[0]?.profiles?.full_name
          || booking._customerName
          || 'Misafir';
        await sb.from('club_finances').insert({
          club_id:     clubId,
          type:        'income',
          category:    'Rezervasyon Geliri',
          amount,
          description: `${playerName} - Kort ${booking.courts?.court_number || '?'} rezervasyon ödemesi`,
          date:        booking.start_time?.slice(0, 10) || todayISO(),
        });
      }
      loadDay();
    } catch (e) { alert(e.message); }
  };

  const openAdd = () => {
    const startTime = '09:00';
    const endTime   = '10:00';
    setBkForm({ courtId: courts[0]?.id || '', date: selDate, startTime, endTime, duration: 1.0, status: 'confirmed' });
    setBkMemberId(null); setBkMemberName(''); setBkMemberQuery(''); setBkMemberResults([]);
    setBkCustomerId(null); setBkCustomerName(''); setBkCustomerQuery(''); setBkCustomerResults([]);
    setBkPersonMode(hasMembership ? 'member' : 'customer');
    setBkGuestName('');
    setBkPriceOverride('');
    loadBkAvailCourts(selDate, startTime, endTime);
    setBkModalVisible(true);
  };

  // ── Yeni Rezervasyon Modal Fonksiyonları ────────────────────
  const loadBkAvailCourts = async (date, startTime, endTime, courtList) => {
    const list = courtList ?? courts;
    if (!date || !startTime || !endTime || list.length === 0) {
      setBkAvailCourts([...list]); return;
    }
    setBkCourtsLoading(true);
    try {
      const startDb = localTimeToDb(`${date}T${startTime}`);
      const endDb   = localTimeToDb(`${date}T${endTime}`);
      const allIds  = list.map(c => c.id);
      const blocked = new Set();
      const [bRes, lRes, mlRes, clRes] = await Promise.all([
        sb.from('bookings').select('court_id').in('court_id', allIds)
          .in('status',['pending','confirmed']).lt('start_time', endDb).gt('end_time', startDb),
        sb.from('lessons').select('court_id').in('court_id', allIds)
          .neq('status','cancelled').lt('start_time', endDb).gt('end_time', startDb).not('court_id','is',null),
        sb.from('club_manual_lessons').select('court_id, start_time, end_time')
          .in('court_id', allIds).eq('date', date).not('court_id','is',null),
        sb.from('court_closures').select('court_id, closure_type, day_of_week, start_hour, start_minute, end_hour, end_minute, start_date, end_date')
          .in('court_id', allIds).eq('is_active', true),
      ]);
      (bRes.data  || []).forEach(r => blocked.add(r.court_id));
      (lRes.data  || []).forEach(r => blocked.add(r.court_id));
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const newStart = sh * 60 + sm;
      const newEnd   = eh * 60 + em;
      for (const ml of mlRes.data || []) {
        const [msh, msm] = ml.start_time.split(':').map(Number);
        const [meh, mem] = ml.end_time.split(':').map(Number);
        if (newStart < meh * 60 + mem && newEnd > msh * 60 + msm) blocked.add(ml.court_id);
      }
      const dow = new Date(date + 'T12:00:00').getDay();
      for (const cl of clRes.data || []) {
        const clStart = (cl.start_hour||0) * 60 + (cl.start_minute||0);
        const clEnd   = (cl.end_hour||0) * 60 + (cl.end_minute||0);
        if (newStart >= clEnd || newEnd <= clStart) continue;
        if (cl.closure_type === 'recurring_weekly' && cl.day_of_week === dow) blocked.add(cl.court_id);
        else if (cl.closure_type === 'one_time') {
          if ((!cl.start_date || cl.start_date <= date) && (!cl.end_date || cl.end_date >= date)) blocked.add(cl.court_id);
        }
      }
      setBkAvailCourts(list.filter(c => !blocked.has(c.id)));
    } catch(e) {
      console.error(e);
      // Müsaitlik kontrolü başarısız olursa tüm kortları kapalı göster — fail-open yerine fail-closed
      setBkAvailCourts([]);
    }
    finally { setBkCourtsLoading(false); }
  };

  const handleBkDuration = (d) => {
    const [sh, sm] = (bkForm.startTime || '09:00').split(':').map(Number);
    const totalMin = sh * 60 + sm + Math.round(d * 60);
    const eh = Math.floor(totalMin / 60) % 24;
    const em = totalMin % 60;
    const newEnd = `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`;
    const newForm = { ...bkForm, duration: d, endTime: newEnd };
    setBkForm(newForm);
    loadBkAvailCourts(newForm.date, newForm.startTime, newEnd);
  };

  const searchBkMembers = async (q) => {
    setBkMemberQuery(q);
    if (q.length < 2) { setBkMemberResults([]); return; }
    setBkMemberLoading(true);
    try {
      const { data } = await sb.from('profiles')
        .select('id, full_name, email')
        .ilike('full_name', `%${q}%`)
        .limit(8);
      setBkMemberResults(data || []);
    } catch(e) { console.error(e); }
    finally { setBkMemberLoading(false); }
  };

  const searchBkCustomers = async (q) => {
    setBkCustomerQuery(q);
    if (q.length < 2) { setBkCustomerResults([]); return; }
    try {
      const { data } = await sb.from('club_customers')
        .select('id, full_name, phone, email, user_id')
        .eq('club_id', clubId).eq('is_active', true)
        .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(8);
      setBkCustomerResults(data || []);
    } catch(e) { console.error(e); }
  };

  const saveBkBooking = async () => {
    const { courtId, date, startTime, endTime, duration, status } = bkForm;
    if (!courtId)   { alert('Lütfen bir kort seçin.'); return; }
    if (!startTime) { alert('Başlangıç saati eksik.');  return; }

    // Üyelik limit kontrolü
    if (bkMemberId) {
      const startDT = `${date}T${startTime}`;
      const warnings = await checkMembershipLimits(bkMemberId, startDT);
      if (warnings.length > 0) {
        const ok = confirm('⚠️ Üyelik Uyarısı:\n\n' + warnings.join('\n') + '\n\nYine de rezervasyon oluşturulsun mu?');
        if (!ok) return;
      }
    }

    const startDb = localTimeToDb(`${date}T${startTime}`);
    const endDb   = localTimeToDb(`${date}T${endTime}`);

    if (new Date(startDb) < new Date()) {
      const ok = confirm('Geçmiş bir saate rezervasyon oluşturulsun mu?');
      if (!ok) return;
    }

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const newStart = sh * 60 + sm;
    const newEnd   = eh * 60 + em;
    const dow      = new Date(date + 'T12:00:00').getDay();

    setBkSaving(true);
    try {
      const [bConflict, mConflict, closures, lConflict] = await Promise.all([
        sb.from('bookings').select('id').eq('court_id', courtId)
          .in('status',['pending','confirmed']).lt('start_time', endDb).gt('end_time', startDb),
        sb.from('club_manual_lessons').select('id, start_time, end_time')
          .eq('court_id', courtId).eq('date', date),
        sb.from('court_closures').select('*').eq('court_id', courtId).eq('is_active', true),
        // startDb/endDb localTimeToDb ile oluşturuldu — lessons da aynı offset konvansiyonunu kullanıyor
        sb.from('lessons').select('id').eq('court_id', courtId)
          .neq('status','cancelled').lt('start_time', endDb).gt('end_time', startDb).not('court_id','is',null),
      ]);
      if ((bConflict.data || []).length > 0) {
        alert('Bu kort seçilen saatte zaten rezerve edilmiş.'); return;
      }
      if ((lConflict.data || []).length > 0) {
        alert('Bu kort seçilen saatte planlanmış bir özel ders var.'); return;
      }
      const hasManualConflict = (mConflict.data || []).some(l => {
        const [lsh, lsm] = l.start_time.split(':').map(Number);
        const [leh, lem] = l.end_time.split(':').map(Number);
        return newStart < leh * 60 + lem && newEnd > lsh * 60 + lsm;
      });
      if (hasManualConflict) { alert('Bu kort seçilen saatte planlanmış bir ders var.'); return; }
      const closureBlock = (closures.data || []).some(cl => {
        const clStart = (cl.start_hour||0) * 60 + (cl.start_minute||0);
        const clEnd   = (cl.end_hour||0) * 60 + (cl.end_minute||0);
        if (newStart >= clEnd || newEnd <= clStart) return false;
        if (cl.closure_type === 'recurring_weekly') return cl.day_of_week === dow;
        return (!cl.start_date || cl.start_date <= date) && (!cl.end_date || cl.end_date >= date);
      });
      if (closureBlock) { alert('Bu kort seçilen saatte kapalı (bakım veya etkinlik).'); return; }

      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı.');

      const court = courts.find(c => c.id === courtId);
      const durationHours    = (newEnd - newStart) / 60;
      const calculatedAmount = Math.round((court?.hourly_rate || 0) * durationHours * 100) / 100;
      const parsedOverride   = parseFloat((bkPriceOverride || '').replace(',', '.'));
      const totalAmount      = (!isNaN(parsedOverride) && parsedOverride !== calculatedAmount) ? parsedOverride : calculatedAmount;

      const { data: bk, error: bkErr } = await sb.from('bookings').insert({
        court_id:          courtId,
        user_id:           user.id,
        start_time:        startDb,
        end_time:          endDb,
        status:            status || 'confirmed',
        is_solo_booking:   !bkMemberId && !bkCustomerId,
        duration_hours:    durationHours,
        total_amount:      totalAmount,
        calculated_amount: calculatedAmount,
        club_customer_id:  bkCustomerId || null,
        player_name:       bkMemberName || bkCustomerName || bkGuestName.trim() || null,
      }).select('id').single();
      if (bkErr) throw bkErr;

      const playerIdToLink = bkMemberId || null;
      const insertedBkId = bk?.id ?? null;
      if (playerIdToLink && insertedBkId) {
        await sb.from('booking_players').insert({
          booking_id:        insertedBkId,
          player_id:         playerIdToLink,
          is_primary_player: true,
          status:            'confirmed',
        });
      }

      // Misafir modunda isim varsa → müşteri ekleme promptu göster
      if (bkPersonMode === 'guest' && bkGuestName.trim()) {
        let bookingId = insertedBkId;
        if (!bookingId) {
          const { data: found } = await sb.from('bookings').select('id')
            .eq('court_id', courtId).eq('start_time', startDb).eq('user_id', user.id)
            .order('created_at', { ascending: false }).limit(1).maybeSingle();
          bookingId = found?.id ?? null;
        }
        setBkModalVisible(false);
        loadDay();
        loadDotDates();
        setGuestCustModal({ bookingId, name: bkGuestName.trim(), phone: '' });
        return;
      }

      setBkModalVisible(false);
      loadDay();
      loadDotDates();
      alert('Rezervasyon başarıyla oluşturuldu.');
    } catch(e) { alert('Hata: ' + e.message); }
    finally { setBkSaving(false); }
  };

  // ── Üyelik limit kontrolü ───────────────────────────────────
  const checkMembershipLimits = async (memberId, startTime) => {
    const warnings = [];
    try {
      const { data: membership } = await sb.from('club_memberships')
        .select('*, package:club_membership_packages(*)')
        .eq('user_id', memberId).eq('club_id', clubId).eq('status', 'active').maybeSingle();

      if (!membership?.package) return warnings;
      const pkg = membership.package;

      // Geçerli günler kontrolü
      if (pkg.valid_days && pkg.valid_days !== 'all') {
        const day = new Date(startTime).getDay(); // 0=Paz, 6=Cmt
        const isWeekend = day === 0 || day === 6;
        if (pkg.valid_days === 'weekdays' && isWeekend)
          warnings.push('Bu üyenin paketi sadece hafta içi geçerli. Hafta sonu rezervasyon kısıtlı!');
        if (pkg.valid_days === 'weekends' && !isWeekend)
          warnings.push('Bu üyenin paketi sadece hafta sonu geçerli. Hafta içi rezervasyon kısıtlı!');
      }

      // Yaptırım kontrolü
      if (pkg.penalty_no_reservation && pkg.penalty_duration_days) {
        const { data: lastCancelled } = await sb.from('bookings')
          .select('updated_at')
          .in('court_id', await getClubCourtIds(clubId))
          .eq('status', 'cancelled')
          .order('updated_at', { ascending: false })
          .limit(1);
        // Basit kontrol: son iptali bulduk muyuz?
        if (lastCancelled?.length > 0) {
          const since = new Date(lastCancelled[0].updated_at);
          const cutoff = new Date(since);
          cutoff.setDate(cutoff.getDate() + pkg.penalty_duration_days);
          if (new Date() < cutoff)
            warnings.push(`Bu üye yaptırım cezası altında — ${cutoff.toLocaleDateString('tr-TR')} tarihine kadar rezervasyon yapamaz.`);
        }
      }

      // Haftalık saat limiti kontrolü
      if (pkg.weekly_court_hours_limit) {
        const weekStart = new Date(startTime);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const courtIds = await getClubCourtIds(clubId);
        if (courtIds.length > 0) {
          const { data: weekBks } = await sb.from('booking_players')
            .select('booking:bookings!booking_players_booking_id_fkey(start_time, end_time, status)')
            .eq('player_id', memberId)
            .not('booking.status', 'eq', 'cancelled');

          let usedHours = 0;
          (weekBks || []).forEach(bp => {
            const b = bp.booking;
            if (!b?.start_time) return;
            const bs = new Date(b.start_time);
            if (bs >= weekStart && bs < weekEnd) {
              const be = new Date(b.end_time);
              usedHours += (be - bs) / 3600000;
            }
          });

          const remaining = pkg.weekly_court_hours_limit - usedHours;
          if (remaining <= 0) {
            warnings.push(`Bu üye haftalık kort limitini (${pkg.weekly_court_hours_limit} saat) doldurmuş!`);
          } else if (remaining < 1) {
            warnings.push(`Bu üyenin bu hafta sadece ${(remaining * 60).toFixed(0)} dakika hakkı kaldı.`);
          }
        }
      }
    } catch (e) { console.error('checkMembershipLimits:', e); }
    return warnings;
  };

  const saveBooking = async () => {
    // Üye seçildiyse limit kontrolü yap
    if (form.member_id) {
      const warnings = await checkMembershipLimits(form.member_id, form.start_time);
      if (warnings.length > 0) {
        const proceed = confirm('⚠️ Üyelik Uyarısı:\n\n' + warnings.join('\n') + '\n\nYine de rezervasyon oluşturulsun mu?');
        if (!proceed) return;
      }
    }
    // ── Geçmiş tarih kontrolü ───────────────────────────────────
    if (new Date(form.start_time) < new Date()) {
      alert('Geçmiş bir tarihe rezervasyon oluşturamazsınız.');
      return;
    }

    // ── Double booking kontrolü ──────────────────────────────────
    if (form.court_id) {
      const startDb = localTimeToDb(form.start_time);
      const endDb   = localTimeToDb(form.end_time);
      const dateStr = form.start_time.slice(0, 10);
      const startHH = form.start_time.slice(11, 16);
      const endHH   = form.end_time.slice(11, 16);

      const [{ data: bConflict }, { data: mConflict }, { data: lConflict }, { data: closures }] = await Promise.all([
        sb.from('bookings').select('id').eq('court_id', form.court_id)
          .in('status', ['pending', 'confirmed']).lt('start_time', endDb).gt('end_time', startDb),
        sb.from('club_manual_lessons').select('id, start_time, end_time')
          .eq('court_id', form.court_id).eq('date', dateStr),
        sb.from('lessons').select('id').eq('court_id', form.court_id)
          .neq('status', 'cancelled').lt('start_time', endDb).gt('end_time', startDb),
        sb.from('court_closures').select('*').eq('court_id', form.court_id).eq('is_active', true),
      ]);

      if (bConflict?.length > 0 || lConflict?.length > 0) { alert('Bu kort seçilen saatte zaten rezerve edilmiş.'); return; }

      const hasManualConflict = (mConflict || []).some(l => {
        const ls = (l.start_time || '').slice(0, 5);
        const le = (l.end_time   || '').slice(0, 5);
        return ls < endHH && le > startHH;
      });
      if (hasManualConflict) { alert('Bu kort seçilen saatte planlanmış bir ders var.'); return; }

      const dow = new Date(dateStr + 'T12:00:00').getDay();
      const closureBlock = (closures || []).some(cl => {
        const cs = String(cl.start_hour ?? 0).padStart(2,'0') + ':' + String(cl.start_minute ?? 0).padStart(2,'0');
        const ce = String(cl.end_hour   ?? 0).padStart(2,'0') + ':' + String(cl.end_minute   ?? 0).padStart(2,'0');
        if (!(cs < endHH && ce > startHH)) return false;
        if (cl.closure_type === 'recurring_weekly') return cl.day_of_week === dow;
        return (!cl.start_date || cl.start_date <= dateStr) && (!cl.end_date || cl.end_date >= dateStr);
      });
      if (closureBlock) { alert('Bu kort seçilen saatte kapalı (bakım veya etkinlik).'); return; }
    }
    if (!form.start_time || !form.end_time) { alert('Başlangıç ve bitiş saati zorunludur.'); return; }
    if (!form.court_id) { alert('Kort seçimi zorunludur.'); return; }
    const startDb = localTimeToDb(form.start_time);
    const endDb   = localTimeToDb(form.end_time);
    const durationHours = Math.round((new Date(endDb) - new Date(startDb)) / 3600000 * 100) / 100;
    if (!(durationHours > 0)) { alert('Bitiş saati başlangıç saatinden sonra olmalıdır.'); return; }

    setSaving(true);
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı.');

      const court = courts.find(c => c.id === form.court_id);
      const totalAmount = Math.round((court?.hourly_rate || 0) * durationHours * 100) / 100;

      const { data: bk, error: bkErr } = await sb.from('bookings').insert({
        court_id:        form.court_id,
        user_id:         user.id,
        start_time:      startDb,
        end_time:        endDb,
        status:          form.status || 'confirmed',
        is_solo_booking: !form.member_id,
        duration_hours:  durationHours,
        total_amount:    totalAmount,
      }).select().single();
      if (bkErr) throw bkErr;

      // Üye seçildiyse booking_players'a ekle
      if (form.member_id && bk?.id) {
        await sb.from('booking_players').insert({
          booking_id:        bk.id,
          player_id:         form.member_id,
          is_primary_player: true,
          status:            'confirmed',
        });
      }

      setModal(null);
      loadDay();
    } catch (e) {
      if (e.message?.includes('no_overlapping_bookings') || e.code === '23P01') {
        alert('Bu kort seçilen saatte zaten dolu. Lütfen farklı bir saat veya kort seçin.');
      } else {
        alert(e.message);
      }
    }
    finally { setSaving(false); }
  };

  useEffect(() => {
    if (!lessonModal) {
      setLessonSelectedPlayer(null);
      setLessonPlayerSearch('');
      setLessonPlayerResults([]);
      setLessonPackages([]);
      setLessonUsePackage(false);
      setLessonSelectedPackageId(null);
    }
  }, [lessonModal]);

  // Öğrenci veya antrenör değişince paketleri yükle
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
        // club_coaches.individual_coach_id = koçun kendi auth user ID'si
        const coachRec = coaches.find(c => c.id === coachClubId);
        const individualCoachId = coachRec?.individual_coach_id;
        if (!individualCoachId) { setLessonPackages([]); return; }
        const now = new Date().toISOString();
        const { data } = await sb.from('player_lesson_packages')
          .select('*, lesson_packages(name, total_lessons, price, validity_days, coach_percentage)')
          .eq('player_id', playerId)
          .eq('coach_id', individualCoachId)
          .eq('payment_status', 'paid')
          .eq('status', 'active')
          .or(`expiry_date.is.null,expiry_date.gt.${now}`)
          .order('created_at', { ascending: false });
        const pkgs = (data || []).map(r => ({
          ...r,
          package_name: r.lesson_packages?.name || r.custom_name || 'Özel Paket',
          remaining: (r.total_lessons || 0) - (r.used_lessons || 0),
        }));
        setLessonPackages(pkgs);
        if (pkgs.length > 0) {
          setLessonSelectedPackageId(pkgs[0].id);
        } else {
          setLessonUsePackage(false);
          setLessonSelectedPackageId(null);
        }
      } catch (e) { console.error('package load:', e); }
      finally { setLessonLoadingPackages(false); }
    })();
  }, [lessonSelectedPlayer?.id, lessonForm.coach_id, lessonForm.use_manual_coach]);

  // ── Özel ders fonksiyonları ──────────────────────────────────
  const searchPlayers = async (q) => {
    if (q.length < 2) { setLessonPlayerResults([]); return; }
    const { data } = await sb.from('profiles').select('id,full_name,email')
      .eq('user_type', 'player')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(8);
    setLessonPlayerResults(data || []);
  };

  const loadLessons = async () => {
    setLoadingL(true);
    try {
      const d = selDate;
      const dbStart = new Date(d + 'T00:00:00').toISOString();
      const dbEnd   = new Date(d + 'T23:59:59').toISOString();

      // Kulübün koçlarını al
      const [coachRes, courtRes] = await Promise.all([
        sb.from('club_coaches').select('id, full_name, hourly_rate, individual_coach_id, coach_pay_rate').eq('club_id', clubId),
        sb.from('courts').select('id, court_number, hourly_rate').eq('club_id', clubId).eq('is_active', true),
      ]);
      const allClubCoaches = coachRes.data || [];
      const myCoachIds = allClubCoaches.map(c => c.id);
      const coachMap = new Map(allClubCoaches.map(c => [c.id, c.full_name]));
      setCoaches(allClubCoaches);
      setLessonCourts(courtRes.data || []);

      // Kortlar ekranından slot tıklayarak gelen ders prefill (coaches yüklendikten sonra)
      const p = window.__slotPrefill;
      if (p?.type === 'lesson') {
        window.__slotPrefill = null;
        setLessonForm({ use_manual_coach: false, coach_id: '', manual_coach_name: '', date: p.date, start_time: p.start_time, end_time: p.end_time, duration: 1, student_name: '', player_id: null, court_id: p.court_id, notes: '', amount: '', payment_status: 'unpaid' });
        setLessonModal({ type: 'add' });
      }

      const combined = [];

      // club_coaches.id → individual_coach_id haritası (paket eşleştirmesi için)
      const coachToIndividual = new Map(allClubCoaches.map(c => [c.id, c.individual_coach_id]));

      // 1) club_manual_lessons tablosu — kulüp yöneticisinin eklediği manuel dersler
      const { data: manual } = await sb.from('club_manual_lessons')
        .select('*, club_coaches(full_name)')
        .eq('club_id', clubId)
        .eq('date', d)
        .order('start_time', { ascending: true });

      // Manuel dersler için paket seans bilgisi — lesson_id IS NULL + session_date eşleşmesiyle
      const individualIds = allClubCoaches.map(c => c.individual_coach_id).filter(Boolean);
      let manualPkgMap = new Map(); // individual_coach_id → { session_id, player_package_id }
      if (individualIds.length > 0) {
        const { data: manualSessions } = await sb.from('lesson_package_sessions')
          .select('id, player_package_id, coach_id')
          .eq('session_date', d)
          .is('lesson_id', null)
          .in('coach_id', individualIds);
        (manualSessions || []).forEach(s => manualPkgMap.set(s.coach_id, { session_id: s.id, player_package_id: s.player_package_id }));
      }

      (manual || []).forEach(m => {
        const individualId = coachToIndividual.get(m.coach_id);
        const pkgInfo = individualId ? manualPkgMap.get(individualId) : null;
        combined.push({
          id:               m.id,
          date:             m.date,
          start_time:       (m.start_time || '').slice(0, 5),
          end_time:         (m.end_time   || '').slice(0, 5),
          student_name:     m.student_name || null,
          coach_name:       m.coach_name || m.club_coaches?.full_name || 'Antrenör',
          coach_id:         m.coach_id || null,
          court_id:         m.court_id || null,
          court_fee:        m.court_fee || 0,
          location:         m.location || '—',
          source:           'manual',
          payment_status:   m.payment_status || 'unpaid',
          amount:           m.amount || 0,
          is_package_lesson: !!pkgInfo,
          pkg_session_id:   pkgInfo?.session_id || null,
          player_package_id: pkgInfo?.player_package_id || null,
          price_mode:       m.price_mode || 'normal',
          coach_amount:     m.coach_amount ?? null,
        });
      });

      // 3) lessons tablosu — koçların oluşturduğu dersler
      if (myCoachIds.length > 0) {
        const { data: directLessons } = await sb.from('lessons')
          .select('id, start_time, end_time, student_name, club_coach_id, court_id, amount, coach_amount, payment_status, price_mode, courts(court_number)')
          .in('club_coach_id', myCoachIds)
          .neq('status', 'cancelled')
          .gte('start_time', dbStart)
          .lte('start_time', dbEnd);

        const lessonIds = (directLessons || []).map(l => l.id);
        let pkgSessionMap = new Map(); // lesson_id → { session_id, player_package_id }
        if (lessonIds.length > 0) {
          const { data: pkgSessions } = await sb.from('lesson_package_sessions')
            .select('id, lesson_id, player_package_id').in('lesson_id', lessonIds);
          (pkgSessions || []).forEach(s => pkgSessionMap.set(s.lesson_id, { session_id: s.id, player_package_id: s.player_package_id }));
        }

        (directLessons || []).forEach(l => {
          const start = new Date(l.start_time);
          const end   = new Date(l.end_time);
          const court = Array.isArray(l.courts) ? l.courts[0] : l.courts;
          const pkgInfo = pkgSessionMap.get(l.id);
          combined.push({
            id:               l.id,
            date:             start.toISOString().split('T')[0],
            start_time:       start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            end_time:         end.toLocaleTimeString('tr-TR',   { hour: '2-digit', minute: '2-digit' }),
            student_name:     l.student_name || null,
            coach_name:       l.club_coach_id ? (coachMap.get(l.club_coach_id) || 'Antrenör') : 'Antrenör',
            coach_id:         l.club_coach_id || null,
            court_id:         l.court_id || null,
            location:         court?.court_number ? `Kort ${court.court_number}` : '—',
            source:           'lesson',
            payment_status:   l.payment_status === 'paid' ? 'paid' : 'unpaid',
            amount:           l.amount || null,
            is_package_lesson: !!pkgInfo,
            pkg_session_id:   pkgInfo?.session_id || null,
            player_package_id: pkgInfo?.player_package_id || null,
            price_mode:       l.price_mode || 'normal',
            coach_amount:     l.coach_amount ?? null,
          });
        });
      }

      combined.sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
      setLessons(combined);
    } catch (e) { console.error(e); }
    finally { setLoadingL(false); }
  };

  const saveLesson = async () => {
    const isNew = !lessonModal?.id;

    // Zorunlu alan kontrolü
    if (!lessonForm.date || !lessonForm.start_time || !lessonForm.end_time) {
      alert('Tarih, başlangıç ve bitiş saati zorunludur.'); return;
    }
    if (!lessonForm.court_id) {
      alert('Lütfen kort seçin.'); return;
    }
    const coachOk = lessonForm.use_manual_coach ? !!lessonForm.manual_coach_name?.trim() : !!lessonForm.coach_id;
    if (!coachOk) { alert('Lütfen bir antrenör seçin veya antrenör adını girin.'); return; }
    if (lessonForm.start_time >= lessonForm.end_time) {
      alert('Bitiş saati başlangıç saatinden sonra olmalıdır.'); return;
    }

    // Geçmiş tarih kontrolü (yalnızca yeni ders)
    if (isNew) {
      if (new Date(`${lessonForm.date}T${lessonForm.start_time}`) < new Date()) {
        alert('Geçmiş bir tarihe ders ekleyemezsiniz.'); return;
      }
    }

    // Double booking kontrolü (yalnızca yeni ders)
    if (isNew) {
      const dateStr  = lessonForm.date;
      const startHH  = lessonForm.start_time.slice(0, 5);
      const endHH    = lessonForm.end_time.slice(0, 5);
      const startDb  = localTimeToDb(`${dateStr}T${startHH}`);
      const endDb    = localTimeToDb(`${dateStr}T${endHH}`);
      const courtRow0 = lessonCourts.find(c => c.id === lessonForm.court_id);
      const locationStr = courtRow0 ? `Kort ${courtRow0.court_number}` : '';

      const [{ data: bConflict }, { data: mConflict }, { data: lConflict }, { data: closures }] = await Promise.all([
        sb.from('bookings').select('id').eq('court_id', lessonForm.court_id)
          .neq('status', 'cancelled').lt('start_time', endDb).gt('end_time', startDb),
        sb.from('club_manual_lessons').select('id,start_time,end_time,court_id,location')
          .eq('club_id', clubId).eq('date', dateStr),
        sb.from('lessons').select('id').eq('court_id', lessonForm.court_id)
          .neq('status', 'cancelled').lt('start_time', endDb).gt('end_time', startDb),
        sb.from('court_closures').select('*').eq('court_id', lessonForm.court_id).eq('is_active', true),
      ]);

      if (bConflict?.length > 0 || lConflict?.length > 0) { alert('Bu kort seçilen saatte zaten rezerve edilmiş.'); return; }

      const hasManualConflict = (mConflict || [])
        .filter(l => l.court_id ? l.court_id === lessonForm.court_id : l.location === locationStr)
        .some(l => {
          const ls = (l.start_time || '').slice(0, 5);
          const le = (l.end_time   || '').slice(0, 5);
          return ls < endHH && le > startHH;
        });
      if (hasManualConflict) { alert('Bu kort seçilen saatte zaten dolu. Lütfen farklı bir saat veya kort seçin.'); return; }

      const dow = new Date(dateStr + 'T12:00:00').getDay();
      const closureBlock = (closures || []).some(cl => {
        const cs = String(cl.start_hour ?? 0).padStart(2,'0') + ':' + String(cl.start_minute ?? 0).padStart(2,'0');
        const ce = String(cl.end_hour   ?? 0).padStart(2,'0') + ':' + String(cl.end_minute   ?? 0).padStart(2,'0');
        if (!(cs < endHH && ce > startHH)) return false;
        if (cl.closure_type === 'recurring_weekly') return cl.day_of_week === dow;
        return (!cl.start_date || cl.start_date <= dateStr) && (!cl.end_date || cl.end_date >= dateStr);
      });
      if (closureBlock) {
        if (!confirm('Bu kort seçilen saatte kapalı olarak işaretlenmiş. Yine de ders oluşturulsun mu?')) return;
      }

      if (!lessonForm.use_manual_coach && lessonForm.coach_id) {
        const [sh, sm] = startHH.split(':').map(Number);
        const [eh, em] = endHH.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin   = eh * 60 + em;
        const lessonDow = new Date(dateStr + 'T12:00:00').getDay();
        const coachLabel = coaches.find(c => c.id === lessonForm.coach_id)?.full_name || 'Antrenör';

        // Manuel ders çakışması
        const { data: coachConflict } = await sb.from('club_manual_lessons')
          .select('id,start_time,end_time').eq('coach_id', lessonForm.coach_id).eq('date', dateStr);
        const hasCoachConflict = (coachConflict || []).some(l => {
          const ls = (l.start_time || '').slice(0, 5);
          const le = (l.end_time   || '').slice(0, 5);
          return ls < endHH && le > startHH;
        });
        if (hasCoachConflict) { alert('Bu antrenörün seçilen saatte başka bir dersi var.'); return; }

        // lessons tablosunda hoca çakışması (mobil app'ten eklenen dersler)
        const { data: lessonCoachConflict } = await sb.from('lessons')
          .select('id')
          .or(`coach_id.eq.${lessonForm.coach_id},club_coach_id.eq.${lessonForm.coach_id}`)
          .neq('status', 'cancelled')
          .lt('start_time', endDb)
          .gt('end_time', startDb);
        if (lessonCoachConflict?.length > 0) { alert('Bu antrenörün seçilen saatte başka bir dersi var.'); return; }

        // Grup dersi / program bloğu çakışması (court_closures.coach_id) — mobil ile aynı
        const { data: coachClosures } = await sb.from('court_closures')
          .select('closure_type, day_of_week, start_hour, end_hour, start_date, end_date, reason')
          .eq('coach_id', lessonForm.coach_id)
          .eq('is_active', true);

        const conflicts = [];
        for (const cl of coachClosures || []) {
          const clStart = (cl.start_hour || 0) * 60 + (cl.start_minute || 0);
          const clEnd   = (cl.end_hour   || 0) * 60 + (cl.end_minute   || 0);
          if (startMin >= clEnd || endMin <= clStart) continue;
          if (cl.closure_type === 'recurring_weekly' && cl.day_of_week === lessonDow) {
            const clStartStr = String(cl.start_hour).padStart(2,'0') + ':' + String(cl.start_minute ?? 0).padStart(2,'0');
            const clEndStr   = String(cl.end_hour).padStart(2,'0')   + ':' + String(cl.end_minute   ?? 0).padStart(2,'0');
            conflicts.push(`Grup Programı: ${cl.reason || 'Antrenman'} · ${clStartStr}–${clEndStr}`);
          } else if (cl.closure_type === 'one_time' && cl.start_date && cl.end_date) {
            if (dateStr >= cl.start_date && dateStr <= cl.end_date) {
              conflicts.push(`Tek Seferlik Program: ${cl.reason || 'Kapalı'} · ${cl.start_date}–${cl.end_date}`);
            }
          }
        }
        if (conflicts.length > 0) {
          if (!confirm(`⚠️ Hoca Çakışması\n\n${coachLabel} adlı hocanın bu saatte başka programı var:\n\n${conflicts.join('\n')}\n\nYine de eklensin mi?`)) return;
        }
      }

      // Öğrenci müsaitlik kontrolü (yalnızca kayıtlı oyuncu seçiliyse)
      if (lessonForm.player_id) {
        const [{ data: ownBookings }, { data: allConflictBookings }, { data: studentLessons }] = await Promise.all([
          sb.from('bookings').select('id').eq('user_id', lessonForm.player_id)
            .in('status', ['pending', 'confirmed']).lt('start_time', endDb).gt('end_time', startDb),
          sb.from('bookings').select('id')
            .in('status', ['pending', 'confirmed']).lt('start_time', endDb).gt('end_time', startDb),
          sb.from('lessons').select('id').eq('student_id', lessonForm.player_id)
            .neq('status', 'cancelled').lt('start_time', `${dateStr}T${endHH}:00+03:00`).gt('end_time', `${dateStr}T${startHH}:00+03:00`),
        ]);

        const conflictBookingIds = (allConflictBookings || []).map(b => b.id);
        let isInvited = false;
        if (conflictBookingIds.length > 0) {
          const { data: invited } = await sb.from('booking_players').select('player_id')
            .eq('player_id', lessonForm.player_id).in('booking_id', conflictBookingIds);
          isInvited = (invited?.length ?? 0) > 0;
        }

        if ((ownBookings?.length ?? 0) > 0 || isInvited || (studentLessons?.length ?? 0) > 0) {
          alert(`${lessonSelectedPlayer?.full_name || 'Öğrenci'} adlı oyuncunun bu saatte başka bir rezervasyonu veya dersi bulunuyor.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const courtRow  = lessonCourts.find(c => c.id === lessonForm.court_id);
      const coachId   = !lessonForm.use_manual_coach ? (lessonForm.coach_id || null) : null;
      const coachName = lessonForm.use_manual_coach ? (lessonForm.manual_coach_name || null) : null;

      // Paketten kullan → ücret 0, ödeme durumu ödendi
      const usingPkg    = !!(lessonUsePackage && lessonSelectedPackageId);
      const coachAmt    = parseFloat(String(lessonCoachAmountInput).replace(',', '.')) || 0;
      const clubAmt     = parseFloat(String(lessonClubAmountInput).replace(',', '.'))  || 0;
      const dualTotal   = coachAmt + clubAmt;
      const isDual      = lessonPriceMode === 'dual';
      const amountVal   = usingPkg ? 0 : isDual ? (dualTotal || null) : (lessonForm.amount ? parseFloat(String(lessonForm.amount).replace(',', '.')) : null);
      const coachAmtVal = usingPkg ? null : isDual ? (coachAmt || null) : null;
      const payStatus   = usingPkg ? 'paid' : lessonPriceMode === 'split' ? 'paid' : (lessonForm.payment_status || 'unpaid');

      const payload = {
        club_id:        clubId,
        coach_id:       coachId,
        coach_name:     coachName,
        date:           lessonForm.date,
        start_time:     lessonForm.start_time.slice(0, 5),
        end_time:       lessonForm.end_time.slice(0, 5),
        student_name:   lessonForm.student_name || null,
        court_id:       lessonForm.court_id,
        location:       courtRow ? `Kort ${courtRow.court_number}` : '',
        notes:          lessonForm.notes?.trim() || null,
        payment_status: payStatus,
        amount:         amountVal,
        coach_amount:   coachAmtVal,
        price_mode:     lessonPriceMode,
      };

      if (lessonModal?.id) {
        await sb.from('club_manual_lessons').update(payload).eq('id', lessonModal.id);
      } else {
        const { data: inserted, error: insErr } = await sb.from('club_manual_lessons')
          .insert(payload).select('id').single();
        if (insErr) throw insErr;

        // Mobilden: kort takvimini bloke etmek için bookings tablosuna da yaz
        if (inserted?.id) {
          const { data: { user } } = await sb.auth.getUser();
          const bookingUserId = user?.id;
          if (bookingUserId && lessonForm.court_id) {
            const startDb = localTimeToDb(`${lessonForm.date}T${lessonForm.start_time.slice(0,5)}`);
            const endDb   = localTimeToDb(`${lessonForm.date}T${lessonForm.end_time.slice(0,5)}`);
            const durH    = Math.round((new Date(endDb) - new Date(startDb)) / 3600000 * 100) / 100;
            const { error: bErr } = await sb.from('bookings').insert({
              court_id:        lessonForm.court_id,
              user_id:         bookingUserId,
              start_time:      startDb,
              end_time:        endDb,
              status:          'confirmed',
              is_solo_booking: false,
              duration_hours:  durH,
              total_amount:    amountVal || 0,
              club_coach_id:   coachId,
            });
            if (bErr) console.warn('Kort takvim bloğu eklenemedi:', bErr.message);
          }

          // Paketten seans düş (mobil ile aynı mantık)
          if (usingPkg) {
            try {
              const pkg = lessonPackages.find(p => p.id === lessonSelectedPackageId);
              if (pkg) {
                const remaining = (pkg.total_lessons || 0) - (pkg.used_lessons || 0);
                if (remaining <= 0) throw new Error('Bu pakette kalan ders yok');

                const newUsed = (pkg.used_lessons || 0) + 1;
                const isCompleted = newUsed >= (pkg.total_lessons || 0);

                // 1. Session kaydı oluştur (lesson_id null — web manual_lessons tablosuna yazıyor)
                const { error: sessErr } = await sb.from('lesson_package_sessions').insert({
                  player_package_id: lessonSelectedPackageId,
                  lesson_id:         null,
                  coach_id:          coaches.find(c => c.id === coachId)?.individual_coach_id || null,
                  session_date:      lessonForm.date,
                  notes:             lessonForm.notes?.trim() || null,
                });
                if (sessErr) throw sessErr;

                // 2. used_lessons güncelle
                const { error: updErr } = await sb.from('player_lesson_packages').update({
                  used_lessons: newUsed,
                  status:       isCompleted ? 'completed' : 'active',
                  updated_at:   new Date().toISOString(),
                }).eq('id', lessonSelectedPackageId);
                if (updErr) throw updErr;

                // 3. Earnings / finans kayıtları (paket fiyatından per-session hesapla)
                const pkgDef = pkg.lesson_packages || {};
                const perSessionTotal = (pkgDef.price ?? pkg.custom_price ?? 0) / (pkgDef.total_lessons || pkg.total_lessons || 1);
                const coachPct = pkgDef.coach_percentage ?? pkg.custom_coach_pct ?? 70;
                const coachEarning = perSessionTotal * (coachPct / 100);
                const clubEarning  = perSessionTotal - coachEarning;

                const coachRec = coaches.find(c => c.id === coachId);
                const earningPromises = [];
                if (coachRec && coachEarning > 0) {
                  earningPromises.push(sb.from('coach_earnings').insert({
                    club_id:        clubId,
                    coach_id:       coachId,
                    coach_name:     coachRec.full_name,
                    student_name:   lessonForm.student_name || null,
                    lesson_id:      inserted.id,
                    booking_id:     null,
                    amount:         Math.round(coachEarning * 100) / 100,
                    court_fee:      0,
                    date:           lessonForm.date,
                    description:    'Ders Paketi Oturumu',
                    payment_status: 'unpaid',
                  }));
                }
                if (clubEarning > 0) {
                  earningPromises.push(sb.from('club_finances').insert({
                    club_id:     clubId,
                    type:        'income',
                    category:    'Ders Paketi Geliri',
                    amount:      Math.round(clubEarning * 100) / 100,
                    description: `${coachRec?.full_name || 'Antrenör'} - ${lessonForm.student_name || 'Öğrenci'} - Ders Paketi Oturumu`,
                    date:        lessonForm.date,
                  }));
                }
                await Promise.all(earningPromises);
              }
            } catch (pkgErr) {
              alert(`Ders kaydedildi ancak paketten düşülemedi: ${pkgErr.message}`);
            }
          }

          // Pay modeli: komisyon kaydını ders eklendiği anda oluştur
          if (!usingPkg && lessonPriceMode === 'split' && coachId && amountVal > 0) {
            const coachRec = coaches.find(c => c.id === coachId);
            const payRate  = coachRec?.coach_pay_rate ?? 0;
            if (payRate > 0) {
              const coachEarning = Math.round(amountVal * (payRate / 100) * 100) / 100;
              const clubEarning  = Math.round((amountVal - coachEarning) * 100) / 100;
              try {
                const splitPromises = [];
                if (coachEarning > 0) {
                  splitPromises.push(sb.from('coach_earnings').insert({
                    club_id:            clubId,
                    coach_id:           coachId,
                    individual_coach_id: coachRec.individual_coach_id || null,
                    manual_lesson_id:   inserted.id,
                    coach_name:         coachRec.full_name,
                    student_name:       lessonForm.student_name || null,
                    amount:             coachEarning,
                    court_fee:          0,
                    date:               lessonForm.date,
                    description:        `Özel ders (pay) - ${lessonForm.student_name || 'Öğrenci'} - ${lessonForm.start_time.slice(0,5)}`,
                    payment_status:     'unpaid',
                    collected_by_coach: false,
                    court_fee_settled:  false,
                  }));
                }
                if (clubEarning > 0) {
                  splitPromises.push(sb.from('club_finances').insert({
                    club_id:     clubId,
                    type:        'income',
                    category:    'Özel Ders Geliri',
                    amount:      clubEarning,
                    description: `${coachRec.full_name} - ${lessonForm.student_name || 'Öğrenci'} - Özel Ders`,
                    date:        lessonForm.date,
                  }));
                }
                await Promise.all(splitPromises);
              } catch (splitErr) {
                console.warn('Pay kaydı oluşturulamadı:', splitErr.message);
              }
            }
          }
        }
      }

      setLessonModal(null);
      loadLessons();
    } catch (e) {
      if (e.message?.includes('no_overlapping_bookings') || e.code === '23P01') {
        alert('Bu kort seçilen saatte zaten dolu. Lütfen farklı bir saat veya kort seçin.');
      } else {
        alert(e.message);
      }
    }
    finally { setSaving(false); }
  };

  // ── Misafiri müşteri olarak kaydet ────────────────────────────
  const saveGuestAsCustomer = async () => {
    if (!guestCustModal?.phone?.trim()) { alert('Telefon numarası zorunludur.'); return; }
    if (!guestCustModal?.bookingId)    { alert('Rezervasyon ID bulunamadı.');   return; }
    setGuestCustSaving(true);
    try {
      const { data: customer, error: ce } = await sb.from('club_customers')
        .insert({ club_id: clubId, full_name: guestCustModal.name, phone: guestCustModal.phone.trim() })
        .select('id').single();
      if (ce) throw ce;
      await sb.from('bookings').update({ club_customer_id: customer.id }).eq('id', guestCustModal.bookingId);
      setGuestCustModal(null);
      alert('Rezervasyon oluşturuldu ve müşteri kaydedildi.');
    } catch(e) { alert('Hata: ' + e.message); }
    finally { setGuestCustSaving(false); }
  };

  const cancelLesson = async (lesson) => {
    if (lesson.source === 'booking') { alert('Rezervasyon kaynaklı dersler buradan iptal edilemez.'); return; }
    const msg = lesson.is_package_lesson
      ? 'Bu dersi silmek istediğinizden emin misiniz? Paketten düşülmüşse kredi geri yüklenir.'
      : 'Bu dersi iptal etmek istediğinize emin misiniz?';
    if (!confirm(msg)) return;
    try {
      // Paket seans geri yükle — mobil LessonPackageService.restoreSession ile aynı mantık
      if (lesson.pkg_session_id && lesson.player_package_id) {
        const { data: plp } = await sb.from('player_lesson_packages')
          .select('used_lessons').eq('id', lesson.player_package_id).single();
        if (plp) {
          await Promise.all([
            sb.from('player_lesson_packages').update({
              used_lessons: Math.max(0, (plp.used_lessons || 0) - 1),
              status:       'active',
              updated_at:   new Date().toISOString(),
            }).eq('id', lesson.player_package_id),
            sb.from('lesson_package_sessions').delete().eq('id', lesson.pkg_session_id),
          ]);
        }
      }

      if (lesson.source === 'lesson') {
        await sb.from('lessons').update({ status: 'cancelled' }).eq('id', lesson.id);
      } else {
        await sb.from('club_manual_lessons').delete().eq('id', lesson.id);
        if (lesson.court_id) {
          const startDb = localTimeToDb(`${lesson.date}T${lesson.start_time}`);
          const endDb   = localTimeToDb(`${lesson.date}T${lesson.end_time}`);
          await sb.from('bookings').update({ status: 'cancelled' })
            .eq('court_id', lesson.court_id).eq('start_time', startDb).eq('end_time', endDb);
        }
      }
    } catch (e) { console.warn('Ders iptal hatası:', e.message); }
    loadLessons();
  };

  const markLessonPaid = async (lesson) => {
    // ── Mobil ReservationsScreen handleLessonPayment ile birebir aynı mantık ──
    // Kort ücreti: kortun saatlik ücreti × süre (saat)
    const locationMatch = (lesson.location || '').match(/Kort\s*(\d+)/i);
    const courtNum      = locationMatch ? parseInt(locationMatch[1]) : null;
    const courtRow      = courtNum != null ? lessonCourts.find(c => c.court_number === courtNum) : null;
    const [sh, sm]      = (lesson.start_time || '00:00').split(':').map(Number);
    const [eh, em]      = (lesson.end_time   || '00:00').split(':').map(Number);
    const durationH     = Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
    const courtFee      = Math.round((courtRow?.hourly_rate || 0) * durationH * 100) / 100;
    const coachAmount   = Math.round((Number(lesson.amount) || 0) * 100) / 100;
    const total         = Math.round((courtFee + coachAmount) * 100) / 100;

    // Kaynak 'booking' ise sadece ödeme durumunu güncelle (rezervasyon ödemesi, koru bölünmez)
    if (lesson.source === 'booking') {
      if (!confirm('Bu rezervasyon için ödeme alındı mı?')) return;
      setLessonMarkingId(lesson.id);
      try {
        const { error } = await sb.from('bookings').update({ payment_status: 'paid' }).eq('id', lesson.id);
        if (error) throw error;
        loadLessons();
      } catch (e) { alert(e.message); }
      finally { setLessonMarkingId(null); }
      return;
    }

    const isDual = lesson.price_mode === 'dual';
    const isSplit = lesson.price_mode === 'split';

    // Dual mod: coach_amount ve (amount - coach_amount) ayrı ayrı kayıtlı
    if (isDual) {
      const dualCoachAmt = Math.round((Number(lesson.coach_amount) || 0) * 100) / 100;
      const dualClubAmt  = Math.round((coachAmount - dualCoachAmt) * 100) / 100;
      const lines = [
        `Hoca Hakedişi: ₺${dualCoachAmt.toLocaleString('tr-TR')}`,
        `Kulüp Payı:    ₺${dualClubAmt.toLocaleString('tr-TR')}`,
        `─────────────────────`,
        `Toplam:        ₺${coachAmount.toLocaleString('tr-TR')}`,
      ].join('\n');
      if (!confirm(`Ödeme Al\n\n${lines}\n\nÖdeme alındı olarak işaretlensin mi?`)) return;
      setLessonMarkingId(lesson.id);
      try {
        if (lesson.source === 'lesson') {
          const { error } = await sb.from('lessons').update({ payment_status: 'paid' }).eq('id', lesson.id);
          if (error) throw error;
        } else {
          const { error } = await sb.from('club_manual_lessons').update({ payment_status: 'paid' }).eq('id', lesson.id);
          if (error) throw error;
        }
        if (dualCoachAmt > 0) {
          const { error } = await sb.from('coach_earnings').insert({
            club_id:        clubId,
            coach_id:       lesson.coach_id || null,
            ...(lesson.source === 'manual' ? { manual_lesson_id: lesson.id } : { lesson_id: lesson.id }),
            coach_name:     lesson.coach_name,
            student_name:   lesson.student_name || null,
            amount:         dualCoachAmt,
            court_fee:      0,
            date:           lesson.date,
            description:    `Özel ders - ${lesson.student_name || 'Öğrenci'} - ${lesson.start_time}`,
            payment_status: 'unpaid',
          });
          if (error) throw error;
        }
        if (dualClubAmt > 0) {
          const { error } = await sb.from('club_finances').insert({
            club_id:     clubId,
            type:        'income',
            category:    'Özel Ders Geliri',
            amount:      dualClubAmt,
            description: `${lesson.coach_name} - ${lesson.student_name || 'Öğrenci'} - Özel Ders`,
            date:        lesson.date,
          });
          if (error) throw error;
        }
        loadLessons();
      } catch (e) { alert(e.message); }
      finally { setLessonMarkingId(null); }
      return;
    }

    // Ders kaynağı (manual / lesson) → detaylı özet göster + böl
    const lines = [
      `Hoca Hakedişi: ₺${coachAmount.toLocaleString('tr-TR')}`,
      `Kort Ücreti:   ₺${courtFee.toLocaleString('tr-TR')}`,
      `─────────────────────`,
      `Toplam:        ₺${total.toLocaleString('tr-TR')}`,
    ].join('\n');
    if (!confirm(`Ödeme Al\n\n${lines}\n\nÖdeme alındı olarak işaretlensin mi?`)) return;

    setLessonMarkingId(lesson.id);
    try {
      // 1) Ders ödeme durumunu güncelle
      if (lesson.source === 'lesson') {
        const { error } = await sb.from('lessons').update({ payment_status: 'paid' }).eq('id', lesson.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('club_manual_lessons').update({ payment_status: 'paid' }).eq('id', lesson.id);
        if (error) throw error;
      }

      // 2) Kort ücreti → club_finances (Rezervasyon Geliri) — mobil ile aynı kategori
      if (courtFee > 0) {
        const { error } = await sb.from('club_finances').insert({
          club_id:     clubId,
          type:        'income',
          category:    'Rezervasyon Geliri',
          amount:      courtFee,
          description: `${lesson.coach_name} - ${lesson.student_name || 'Öğrenci'} - Özel ders kort ücreti`,
          date:        lesson.date,
        });
        if (error) throw error;
      }

      // 3) Hoca hakedişi → coach_earnings — mobil CoachEarningsService.createEarning ile aynı
      if (coachAmount > 0) {
        const { error } = await sb.from('coach_earnings').insert({
          club_id:        clubId,
          coach_id:       lesson.coach_id || null,
          lesson_id:      lesson.source === 'lesson' ? (lesson.id || null) : null,
          coach_name:     lesson.coach_name,
          student_name:   lesson.student_name || null,
          amount:         coachAmount,
          court_fee:      courtFee,
          date:           lesson.date,
          description:    `Özel ders - ${lesson.student_name || 'Öğrenci'} - ${lesson.start_time}`,
          payment_status: 'unpaid',
        });
        if (error) throw error;
      }

      loadLessons();
    } catch (e) { alert(e.message); }
    finally { setLessonMarkingId(null); }
  };


  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Rezervasyonlar</h1>
          <div className="sub">
            {selDate && new Date(selDate + 'T12:00').toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' })}
          </div>
        </div>
        {mainTab === 'bookings'
          ? <button className="btn btn-pri" onClick={openAdd}><span className="material-icons">add</span> Yeni Rezervasyon</button>
          : <button className="btn btn-pri" onClick={() => { setLessonForm({ date: selDate, start_time:'09:00', end_time:'10:00', payment_status:'unpaid', use_manual_coach: false }); setLessonPriceMode('dual'); setLessonCoachAmountInput(''); setLessonClubAmountInput(''); setLessonModal({ type:'add' }); }}>
              <span className="material-icons">add</span> Ders Ekle
            </button>
        }
      </div>

      {/* Ana sekmeler */}
      <div className="tabs" style={{ marginBottom: 18 }}>
        <button className={mainTab === 'bookings' ? 'active' : ''} onClick={() => setMainTab('bookings')}>
          <span className="material-icons" style={{ fontSize:16, verticalAlign:'middle', marginRight:4 }}>event_available</span>
          Kort Rezervasyonları
        </button>
        <button className={mainTab === 'lessons' ? 'active' : ''} onClick={() => setMainTab('lessons')}>
          <span className="material-icons" style={{ fontSize:16, verticalAlign:'middle', marginRight:4 }}>school</span>
          Özel Dersler
        </button>
      </div>

      {/* ── Rezervasyonlar sekmesi ── */}
      {mainTab === 'bookings' && (
        <div className="row2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? <Spinner size={28} /> : (
              bookings.length === 0
                ? <EmptyState icon="event_available" title="Bu tarihte rezervasyon yok" sub="Yeni rezervasyon eklemek için + butonunu kullanın." />
                : bookings.map(b => (
                  <div key={b.id} className="card tight">
                    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px' }}>
                      <TimeBubble start={b.start_time} end={b.end_time} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>
                          {b.player_name ||
                           b.booking_players?.find(p => p.is_primary_player)?.profiles?.full_name ||
                           b.booking_players?.[0]?.profiles?.full_name ||
                           b._customerName ||
                           'Misafir'}
                          {(b.booking_players?.length || 0) > 1 && ` +${b.booking_players.length - 1}`}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                          Kort {b.courts?.court_number || '—'} · {courtTypeLabel(b.courts?.court_type)}
                        </div>
                        {b.notes && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{b.notes}</div>}
                      </div>
                      <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap' }}>
                        {/* Ödeme Al / Ödendi rozeti */}
                        {b.payment_status !== 'paid' && b.status !== 'cancelled' ? (
                          <button className="btn btn-success btn-sm" style={{ fontSize:11, padding:'4px 10px', display:'flex', alignItems:'center', gap:4 }}
                            onClick={() => markBookingPaid(b)}>
                            <span className="material-icons" style={{fontSize:13}}>payments</span>
                            Ödeme Al{b.total_amount > 0 ? ` · ₺${Number(b.total_amount).toLocaleString('tr-TR')}` : ''}
                          </button>
                        ) : b.status !== 'cancelled' ? (
                          <Badge cls={paymentClass(b.payment_status)}>{paymentLabel(b.payment_status)}</Badge>
                        ) : null}
                        {/* Onay gerektiren kulüp: pending → Onayla / Reddet */}
                        {requiresApproval && b.status === 'pending' && (
                          <>
                            <button className="btn btn-pri btn-sm" style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}
                              onClick={() => updateStatus(b.id, 'confirmed', b)}>
                              <span className="material-icons" style={{fontSize:13}}>check</span>
                              Onayla
                            </button>
                            <button className="btn btn-danger btn-sm" style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}
                              onClick={() => updateStatus(b.id, 'cancelled', b)}>
                              <span className="material-icons" style={{fontSize:13}}>close</span>
                              Reddet
                            </button>
                          </>
                        )}
                        {/* Tamamlandı — confirmed durumda her iki kulüp tipi için */}
                        {b.status === 'confirmed' && (
                          <button className="btn btn-ghost btn-sm btn-icon" title="Tamamlandı" onClick={() => updateStatus(b.id, 'completed', b)}>
                            <span className="material-icons" style={{fontSize:15}}>done_all</span>
                          </button>
                        )}
                        {/* İptal */}
                        {b.status !== 'cancelled' && b.status !== 'completed' && b.status !== 'pending' && (
                          <button className="btn btn-danger btn-sm" style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}
                            onClick={() => updateStatus(b.id, 'cancelled', b)}>
                            <span className="material-icons" style={{fontSize:13}}>close</span>
                            İptal Et
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
          <MiniCalendar selected={selDate} onSelect={setSelDate} dotDates={dotDates} />
        </div>
      )}

      {/* ── Özel Dersler sekmesi ── */}
      {mainTab === 'lessons' && (
        <div className="row2">
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {loadingL ? <Spinner size={28} /> : lessons.length === 0 ? (
              <EmptyState icon="school" title="Bu tarihte ders yok" sub="Ders eklemek için + butonunu kullanın." />
            ) : (
              lessons.map(l => {
                const isToday = l.date === todayISO();
                return (
                  <div key={`${l.source}-${l.id}`} style={{
                    background:'var(--bg)', borderRadius:12, padding:12, display:'flex', flexDirection:'column', gap:10,
                    border:'1px solid var(--border)', boxShadow:'0 1px 3px rgba(0,0,0,0.06)'
                  }}>
                    {/* Üst satır: ikon + başlık + durum etiketi */}
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:'#EEF2FF', display:'grid', placeItems:'center', flexShrink:0 }}>
                        <span className="material-icons" style={{ fontSize:18, color:'var(--brand-navy)' }}>school</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:14, color:'var(--text-1)' }}>
                          {l.student_name ? `${l.student_name} · Ders` : 'Tenis Dersi'}
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-2)', marginTop:1 }}>
                          {l.start_time} – {l.end_time}
                        </div>
                      </div>
                      <div style={{
                        display:'flex', alignItems:'center', gap:4,
                        padding:'4px 8px', borderRadius:999, flexShrink:0,
                        background: isToday ? '#DCFCE7' : '#FEF3C7'
                      }}>
                        <div style={{ width:6, height:6, borderRadius:3, background: isToday ? '#22C55E' : '#F59E0B' }} />
                        <span style={{ fontSize:11, fontWeight:700, color: isToday ? '#22C55E' : '#F59E0B' }}>
                          {isToday ? 'Bugün' : 'Yaklaşan'}
                        </span>
                      </div>
                    </div>
                    {/* Chip satırı */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      <span style={{ display:'flex', alignItems:'center', gap:4, background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'4px 8px', fontSize:12, color:'var(--text-2)' }}>
                        <span className="material-icons" style={{fontSize:13}}>person</span>{l.coach_name}
                      </span>
                      {l.location && l.location !== '—' && (
                        <span style={{ display:'flex', alignItems:'center', gap:4, background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'4px 8px', fontSize:12, color:'var(--text-2)' }}>
                          <span className="material-icons" style={{fontSize:13}}>location_on</span>{l.location}
                        </span>
                      )}
                      {l.source === 'manual' && (
                        <span style={{ display:'flex', alignItems:'center', gap:4, background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:8, padding:'4px 8px', fontSize:12, color:'#F59E0B' }}>
                          <span className="material-icons" style={{fontSize:13}}>edit_note</span>Manuel
                        </span>
                      )}
                      {l.is_package_lesson && (
                        <span style={{ display:'flex', alignItems:'center', gap:4, background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:8, padding:'4px 8px', fontSize:12, color:'#6366F1' }}>
                          <span className="material-icons" style={{fontSize:13}}>inventory</span>Paket
                        </span>
                      )}
                      {(() => {
                        const totalAmt     = Math.round((Number(l.amount) || 0) * 100) / 100;
                        const isDualBadge  = l.price_mode === 'dual';
                        const isSplitBadge = l.price_mode === 'split';
                        if (isDualBadge) {
                          const dualCoach = Math.round((Number(l.coach_amount) || 0) * 100) / 100;
                          const dualClub  = Math.round((totalAmt - dualCoach) * 100) / 100;
                          return (
                            <>
                              {dualCoach > 0 && (
                                <span style={{ display:'flex', alignItems:'center', gap:4, background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:8, padding:'4px 8px', fontSize:12, color:'var(--brand-navy)' }}>
                                  <span className="material-icons" style={{fontSize:13}}>person</span>Hoca: ₺{dualCoach.toLocaleString('tr-TR')}
                                </span>
                              )}
                              {dualClub > 0 && (
                                <span style={{ display:'flex', alignItems:'center', gap:4, background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'4px 8px', fontSize:12, color:'#16A34A' }}>
                                  <span className="material-icons" style={{fontSize:13}}>account_balance</span>Kulüp: ₺{dualClub.toLocaleString('tr-TR')}
                                </span>
                              )}
                            </>
                          );
                        }
                        if (isSplitBadge) {
                          return totalAmt > 0 ? (
                            <span style={{ display:'flex', alignItems:'center', gap:4, background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:8, padding:'4px 8px', fontSize:12, color:'#7C3AED' }}>
                              <span className="material-icons" style={{fontSize:13}}>account_balance_wallet</span>Toplam: ₺{totalAmt.toLocaleString('tr-TR')}
                            </span>
                          ) : null;
                        }
                        const cr = lesson_court_row(l, lessonCourts);
                        const [sh2, sm2] = (l.start_time || '0:0').split(':').map(Number);
                        const [eh2, em2] = (l.end_time   || '0:0').split(':').map(Number);
                        const dur = Math.max(0, ((eh2 * 60 + em2) - (sh2 * 60 + sm2)) / 60);
                        const courtFee = Math.round((cr?.hourly_rate || 0) * dur * 100) / 100;
                        const coachFee = totalAmt;
                        return (
                          <>
                            {coachFee > 0 && (
                              <span style={{ display:'flex', alignItems:'center', gap:4, background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:8, padding:'4px 8px', fontSize:12, color:'var(--brand-navy)' }}>
                                <span className="material-icons" style={{fontSize:13}}>person</span>Hoca: ₺{coachFee.toLocaleString('tr-TR')}
                              </span>
                            )}
                            {courtFee > 0 && (
                              <span style={{ display:'flex', alignItems:'center', gap:4, background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'4px 8px', fontSize:12, color:'#16A34A' }}>
                                <span className="material-icons" style={{fontSize:13}}>sports_tennis</span>Kort: ₺{courtFee.toLocaleString('tr-TR')}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    {l.notes && <div style={{ fontSize:12, color:'var(--text-2)', fontStyle:'italic', paddingLeft:2 }}>{l.notes}</div>}
                    {/* Ayraç */}
                    <div style={{ height:1, background:'var(--border)' }} />
                    {/* Ödeme + aksiyon satırı */}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {l.is_package_lesson ? (
                        <div style={{ flex:1, display:'flex', alignItems:'center', gap:5, padding:'7px 10px', borderRadius:10, background:'#EEF2FF' }}>
                          <span className="material-icons" style={{fontSize:14, color:'#6366F1'}}>inventory</span>
                          <span style={{ fontSize:13, fontWeight:700, color:'#6366F1' }}>Paketten Düşüldü</span>
                        </div>
                      ) : l.payment_status === 'paid' ? (
                        <div style={{ flex:1, display:'flex', alignItems:'center', gap:5, padding:'7px 10px', borderRadius:10, background:'#DCFCE7' }}>
                          <span className="material-icons" style={{fontSize:14, color:'#22C55E'}}>check_circle</span>
                          <span style={{ fontSize:13, fontWeight:700, color:'#22C55E' }}>Ödendi</span>
                          {l.amount > 0 && <span style={{ fontSize:12, fontWeight:600, color:'#22C55E' }}>· ₺{Number(l.amount).toLocaleString('tr-TR')}</span>}
                        </div>
                      ) : (
                        <button
                          style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px', borderRadius:10, background:'#22C55E', border:'none', cursor: lessonMarkingId === l.id ? 'not-allowed' : 'pointer', opacity: lessonMarkingId === l.id ? 0.5 : 1 }}
                          onClick={() => markLessonPaid(l)}
                          disabled={lessonMarkingId === l.id}
                        >
                          <span className="material-icons" style={{fontSize:15, color:'#fff'}}>payments</span>
                          <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>
                            {(() => {
                              if (lessonMarkingId === l.id) return 'İşleniyor...';
                              if (l.source === 'booking') return `Ödeme Al${l.amount > 0 ? ` · ₺${Number(l.amount).toLocaleString('tr-TR')}` : ''}`;
                              if (l.price_mode === 'dual') return `Ödeme Al${l.amount > 0 ? ` · ₺${Number(l.amount).toLocaleString('tr-TR')}` : ''}`;
                              const lm = (l.location||'').match(/Kort\s*(\d+)/i);
                              const cr = lm ? lessonCourts.find(c => c.court_number === parseInt(lm[1])) : null;
                              const [sh2,sm2] = (l.start_time||'0:0').split(':').map(Number);
                              const [eh2,em2] = (l.end_time||'0:0').split(':').map(Number);
                              const dur2 = Math.max(0,((eh2*60+em2)-(sh2*60+sm2))/60);
                              const cf2 = Math.round((cr?.hourly_rate||0)*dur2*100)/100;
                              const tot2 = Math.round((cf2 + (Number(l.amount)||0))*100)/100;
                              return `Ödeme Al${tot2 > 0 ? ` · ₺${tot2.toLocaleString('tr-TR')}` : ''}`;
                            })()}
                          </span>
                        </button>
                      )}
                      {l.source !== 'booking' && (
                        <button
                          style={{ width:36, height:36, borderRadius:10, background:'#FEE2E2', border:'none', display:'grid', placeItems:'center', cursor:'pointer' }}
                          title="İptal Et" onClick={() => cancelLesson(l)}
                        >
                          <span className="material-icons" style={{fontSize:15, color:'#EF4444'}}>cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <MiniCalendar selected={selDate} onSelect={setSelDate} dotDates={dotDates} />
        </div>
      )}

      {/* ── Yeni Rezervasyon Bottom-Sheet ── */}
      {bkModalVisible && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if (e.target === e.currentTarget && !bkSaving) { setBkModalVisible(false); } }}>
          <div style={{ background:'#fff', borderRadius:20, width:'min(480px,95vw)', maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontSize:17, fontWeight:800, color:'var(--text-1)' }}>Yeni Rezervasyon</span>
              <button onClick={() => setBkModalVisible(false)} disabled={bkSaving}
                style={{ background:'none', border:'none', cursor:'pointer', display:'grid', placeItems:'center' }}>
                <span className="material-icons" style={{ fontSize:24, color:'var(--text-2)' }}>close</span>
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY:'auto', flex:1, padding:'16px 20px', display:'flex', flexDirection:'column', gap:16 }}>

              {/* Seçim özeti */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'#EEF2FF', borderRadius:10, padding:'6px 12px' }}>
                  <span className="material-icons" style={{ fontSize:15, color:'#6366F1' }}>calendar_today</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#4338CA' }}>
                    {new Date((bkForm.date||'') + 'T12:00:00').toLocaleDateString('tr-TR', { weekday:'short', day:'numeric', month:'short' })}
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'#EEF2FF', borderRadius:10, padding:'6px 12px' }}>
                  <span className="material-icons" style={{ fontSize:15, color:'#6366F1' }}>schedule</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#4338CA' }}>{bkForm.startTime} – {bkForm.endTime}</span>
                </div>
                {/* Tarih değiştirme */}
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg)', border:'1.5px solid var(--border)', borderRadius:10, padding:'5px 10px' }}>
                  <span className="material-icons" style={{ fontSize:15, color:'var(--text-2)' }}>edit_calendar</span>
                  <input type="date" value={bkForm.date || ''} min={todayISO()}
                    onChange={e => {
                      const newForm = { ...bkForm, date: e.target.value };
                      setBkForm(newForm);
                      loadBkAvailCourts(e.target.value, newForm.startTime, newForm.endTime);
                    }}
                    style={{ border:'none', background:'transparent', fontSize:13, fontWeight:600, color:'var(--text-2)', cursor:'pointer', outline:'none' }} />
                </div>
              </div>

              {/* Süre */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:10, letterSpacing:0.4 }}>SÜRE</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {[{d:0.75,l:'45 dk'},{d:1.0,l:'1 saat'},{d:1.5,l:'1,5 saat'},{d:2.0,l:'2 saat'}].map(({d,l}) => {
                    const sel = bkForm.duration === d;
                    return (
                      <button key={d} onClick={() => handleBkDuration(d)}
                        style={{ padding:'9px 18px', borderRadius:12, border: sel ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)', background: sel ? '#EEF2FF' : 'var(--bg)', cursor:'pointer', fontSize:13, fontWeight: sel ? 700 : 500, color: sel ? 'var(--brand-navy)' : 'var(--text-2)' }}>
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saat düzenleme */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:10, letterSpacing:0.4 }}>SAAT</div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <input type="time" value={bkForm.startTime || ''} step="900"
                    onChange={e => {
                      const [sh, sm] = e.target.value.split(':').map(Number);
                      const totalMin = sh * 60 + sm + Math.round((bkForm.duration || 1) * 60);
                      const eh = Math.floor(totalMin / 60) % 24;
                      const em = totalMin % 60;
                      const newEnd = `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`;
                      const newForm = { ...bkForm, startTime: e.target.value, endTime: newEnd };
                      setBkForm(newForm);
                      loadBkAvailCourts(newForm.date, e.target.value, newEnd);
                    }}
                    style={{ flex:1, border:'1.5px solid var(--border)', borderRadius:12, padding:'10px 12px', fontSize:15, color:'var(--text-1)', background:'var(--bg)' }} />
                  <span style={{ color:'var(--text-2)', fontWeight:600 }}>–</span>
                  <input type="time" value={bkForm.endTime || ''} step="900"
                    onChange={e => {
                      const newForm = { ...bkForm, endTime: e.target.value };
                      setBkForm(newForm);
                      loadBkAvailCourts(newForm.date, newForm.startTime, e.target.value);
                    }}
                    style={{ flex:1, border:'1.5px solid var(--border)', borderRadius:12, padding:'10px 12px', fontSize:15, color:'var(--text-1)', background:'var(--bg)' }} />
                </div>
              </div>

              {/* Kort Seçimi */}
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', letterSpacing:0.4 }}>KORT</div>
                  {bkCourtsLoading && (
                    <span style={{ fontSize:11, color:'var(--text-2)', display:'flex', alignItems:'center', gap:4 }}>
                      <span className="material-icons" style={{ fontSize:13 }}>hourglass_empty</span>
                      Müsaitlik kontrol ediliyor...
                    </span>
                  )}
                </div>
                {courts.length === 0 ? (
                  <div style={{ padding:16, borderRadius:12, background:'var(--bg)', border:'1px solid var(--border)', textAlign:'center', color:'var(--text-2)', fontSize:13 }}>Kort bulunamadı.</div>
                ) : (
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    {courts.map(court => {
                      const avail = !bkCourtsLoading && bkAvailCourts.some(c => c.id === court.id);
                      const sel   = bkForm.courtId === court.id;
                      return (
                        <div key={court.id}
                          onClick={() => !bkCourtsLoading && avail && setBkForm(f => ({...f, courtId: court.id}))}
                          style={{
                            padding:'12px 16px', borderRadius:14, minWidth:100, transition:'all 0.12s',
                            border: sel ? '2px solid var(--brand-navy)' : `1.5px solid ${avail ? 'var(--border)' : '#FEE2E2'}`,
                            background: sel ? '#EEF2FF' : avail ? 'var(--bg)' : '#FEF2F2',
                            cursor: (!bkCourtsLoading && avail) ? 'pointer' : 'not-allowed',
                            opacity: bkCourtsLoading ? 0.5 : 1,
                          }}>
                          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                            <div style={{ width:6, height:6, borderRadius:'50%', background: avail ? '#22C55E' : '#EF4444', flexShrink:0 }} />
                            <span style={{ fontSize:10, fontWeight:700, color: avail ? '#16A34A' : '#DC2626', letterSpacing:0.3 }}>
                              {bkCourtsLoading ? '...' : avail ? 'MÜSAİT' : 'DOLU'}
                            </span>
                          </div>
                          <div style={{ fontSize:14, fontWeight:700, color: sel ? 'var(--brand-navy)' : 'var(--text-1)' }}>Kort {court.court_number}</div>
                          <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2 }}>{court.court_type} · {court.hourly_rate||'—'}₺/sa</div>
                          {court.is_indoor !== undefined && (
                            <div style={{ fontSize:10, color:'var(--text-2)', marginTop:1 }}>{court.is_indoor ? 'Kapalı' : 'Açık'}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Kişi seçimi (Üye, Müşteri veya Misafir) */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:10, letterSpacing:0.4 }}>KİŞİ (OPSİYONEL)</div>
                {/* Toggle */}
                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  {[{ key:'member', icon:'group', label:'Üye' }, { key:'customer', icon:'people_alt', label:'Müşteri' }, { key:'guest', icon:'person_outline', label:'Misafir' }].filter(t => hasMembership || t.key !== 'member').map(t => (
                    <button key={t.key} type="button"
                      style={{ flex:1, padding:'9px 0', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                        border: bkPersonMode === t.key ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)',
                        background: bkPersonMode === t.key ? '#EEF2FF' : 'var(--bg)',
                        color: bkPersonMode === t.key ? 'var(--brand-navy)' : 'var(--text-2)' }}
                      onClick={() => {
                        setBkPersonMode(t.key);
                        setBkMemberId(null); setBkMemberName(''); setBkMemberQuery(''); setBkMemberResults([]);
                        setBkCustomerId(null); setBkCustomerName(''); setBkCustomerQuery(''); setBkCustomerResults([]);
                        if (t.key !== 'guest') setBkGuestName('');
                      }}>
                      <span className="material-icons" style={{ fontSize:14 }}>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Üye arama */}
                {bkPersonMode === 'member' && (bkMemberId ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'#EEF2FF', borderRadius:12, padding:'10px 14px' }}>
                    <span className="material-icons" style={{ color:'var(--brand-navy)', fontSize:16 }}>person</span>
                    <span style={{ flex:1, fontWeight:600, fontSize:13, color:'var(--text-1)' }}>{bkMemberName}</span>
                    <button type="button" onClick={() => { setBkMemberId(null); setBkMemberName(''); setBkMemberQuery(''); setBkMemberResults([]); }}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)', padding:0, display:'grid', placeItems:'center' }}>
                      <span className="material-icons" style={{ fontSize:16 }}>close</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'relative' }}>
                      <input placeholder="Üye adı ara..." value={bkMemberQuery}
                        onChange={e => searchBkMembers(e.target.value)}
                        style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'10px 12px 10px 36px', fontSize:14, boxSizing:'border-box', color:'var(--text-1)', background:'var(--bg)' }} />
                      <span className="material-icons" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:16, color:'var(--text-2)', pointerEvents:'none' }}>search</span>
                    </div>
                    {bkMemberResults.length > 0 && (
                      <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:10, background:'#fff', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 4px 16px rgba(0,0,0,0.12)', overflow:'hidden', marginTop:4 }}>
                        {bkMemberResults.map((m, idx) => (
                          <div key={m.id}
                            style={{ padding:'10px 14px', cursor:'pointer', borderBottom: idx < bkMemberResults.length-1 ? '1px solid var(--border)' : 'none', fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:8 }}
                            onMouseDown={() => { setBkMemberId(m.id); setBkMemberName(m.full_name); setBkMemberQuery(''); setBkMemberResults([]); }}>
                            <span className="material-icons" style={{ fontSize:15, color:'var(--brand-navy)' }}>person</span>
                            <span style={{ flex:1 }}>{m.full_name}</span>
                            {m.email && <span style={{ fontSize:11, color:'var(--text-2)' }}>{m.email}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Müşteri arama */}
                {bkPersonMode === 'customer' && (bkCustomerId ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'#EEF2FF', borderRadius:12, padding:'10px 14px' }}>
                    <span className="material-icons" style={{ color:'var(--brand-navy)', fontSize:16 }}>people_alt</span>
                    <span style={{ flex:1, fontWeight:600, fontSize:13, color:'var(--text-1)' }}>{bkCustomerName}</span>
                    <button type="button"
                      onClick={() => { setBkCustomerId(null); setBkCustomerName(''); setBkCustomerQuery(''); setBkCustomerResults([]); setBkMemberId(null); setBkMemberName(''); }}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)', padding:0, display:'grid', placeItems:'center' }}>
                      <span className="material-icons" style={{ fontSize:16 }}>close</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'relative' }}>
                      <input placeholder="Müşteri adı veya telefon ara..." value={bkCustomerQuery}
                        onChange={e => searchBkCustomers(e.target.value)}
                        style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'10px 12px 10px 36px', fontSize:14, boxSizing:'border-box', color:'var(--text-1)', background:'var(--bg)' }} />
                      <span className="material-icons" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:16, color:'var(--text-2)', pointerEvents:'none' }}>search</span>
                    </div>
                    {bkCustomerResults.length > 0 && (
                      <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:10, background:'#fff', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 4px 16px rgba(0,0,0,0.12)', overflow:'hidden', marginTop:4 }}>
                        {bkCustomerResults.map((c, idx) => (
                          <div key={c.id}
                            style={{ padding:'10px 14px', cursor:'pointer', borderBottom: idx < bkCustomerResults.length-1 ? '1px solid var(--border)' : 'none', fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:8 }}
                            onMouseDown={() => {
                              setBkCustomerId(c.id); setBkCustomerName(c.full_name);
                              setBkCustomerQuery(''); setBkCustomerResults([]);
                              if (c.user_id) { setBkMemberId(c.user_id); setBkMemberName(c.full_name); }
                            }}>
                            <span className="material-icons" style={{ fontSize:15, color:'var(--brand-navy)' }}>people_alt</span>
                            <span style={{ flex:1 }}>{c.full_name}</span>
                            <span style={{ fontSize:11, color:'var(--text-2)' }}>{c.phone}</span>
                            {c.user_id && <span style={{ fontSize:10, fontWeight:700, background:'#EEF2FF', color:'var(--brand-navy)', padding:'1px 6px', borderRadius:20 }}>CC</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Misafir — serbest metin */}
                {bkPersonMode === 'guest' && (
                  <div style={{ position:'relative' }}>
                    <span className="material-icons" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:16, color:'var(--text-2)', pointerEvents:'none' }}>person_outline</span>
                    <input
                      placeholder="Misafir adı yazın..."
                      value={bkGuestName}
                      onChange={e => setBkGuestName(e.target.value)}
                      style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'10px 12px 10px 36px', fontSize:14, boxSizing:'border-box', color:'var(--text-1)', background:'var(--bg)' }}
                    />
                  </div>
                )}
              </div>

              {/* Özet */}
              {bkForm.courtId && (() => {
                const court = courts.find(c => c.id === bkForm.courtId);
                const [sh, sm] = (bkForm.startTime || '0:0').split(':').map(Number);
                const [eh, em] = (bkForm.endTime   || '0:0').split(':').map(Number);
                const dh      = (eh * 60 + em - sh * 60 - sm) / 60;
                const calcAmt = Math.round((court?.hourly_rate || 0) * dh * 100) / 100;
                const fmtD    = d => d === 0.75 ? '45 dk' : d === 1.5 ? '1,5 saat' : `${d} saat`;
                return (
                  <div style={{ background:'#F8FAFC', borderRadius:14, padding:'16px 18px', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:12, letterSpacing:0.4 }}>REZERVASYON ÖZETİ</div>
                    {[
                      { label:'Tarih', value: new Date((bkForm.date||'') + 'T12:00:00').toLocaleDateString('tr-TR') },
                      { label:'Saat',  value: `${bkForm.startTime} – ${bkForm.endTime}` },
                      { label:'Süre',  value: fmtD(bkForm.duration || 1) },
                      { label:'Kort',  value: `Kort ${court?.court_number}` },
                      ...(bkPersonMode === 'member' && bkMemberName ? [{ label:'Üye', value: bkMemberName }] : []),
                      ...(bkPersonMode === 'customer' && bkCustomerName ? [{ label:'Müşteri', value: bkCustomerName }] : []),
                      ...(bkPersonMode === 'guest' && bkGuestName.trim() ? [{ label:'Misafir', value: bkGuestName.trim() }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ fontSize:13, color:'var(--text-2)' }}>{label}:</span>
                        <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ borderTop:'1px solid var(--border)', paddingTop:10, marginTop:4, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--text-1)' }}>Kort Ücreti (₺):</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={bkPriceOverride}
                        onChange={e => setBkPriceOverride(e.target.value)}
                        placeholder={calcAmt.toFixed(2)}
                        style={{ width:130, border:'1.5px solid var(--border)', borderRadius:8, padding:'5px 10px', fontSize:16, fontWeight:800, color:'var(--brand-navy)', textAlign:'right', background:'#fff', outline:'none' }}
                      />
                    </div>
                    {bkPriceOverride && parseFloat(bkPriceOverride) !== calcAmt && (
                      <div style={{ marginTop:6, fontSize:11, color:'var(--text-2)', textAlign:'right' }}>
                        Saatlik ücret: ₺{calcAmt.toFixed(2)}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>{/* end scrollable body */}

            {/* Footer */}
            <div style={{ display:'flex', gap:10, padding:'12px 20px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
              <button onClick={() => setBkModalVisible(false)} disabled={bkSaving}
                style={{ flex:1, padding:'13px', borderRadius:14, border:'1.5px solid var(--border)', background:'var(--bg)', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--text-2)' }}>
                İptal
              </button>
              <button onClick={saveBkBooking}
                disabled={!bkForm.courtId || bkSaving || bkCourtsLoading}
                style={{ flex:2, padding:'13px', borderRadius:14, border:'none', cursor:(!bkForm.courtId || bkSaving || bkCourtsLoading) ? 'not-allowed' : 'pointer', fontSize:14, fontWeight:700, color:'#fff', background:(!bkForm.courtId || bkSaving || bkCourtsLoading) ? '#94a3b8' : 'var(--brand-navy)' }}>
                {bkSaving ? 'Kaydediliyor...' : 'Rezervasyon Oluştur'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Özel Ders Ekle / Düzenle Modalı — Mobil ile birebir aynı */}
      {lessonModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if (e.target === e.currentTarget) setLessonModal(null); }}>
          <div style={{ background:'#fff', borderRadius:20, width:'min(480px,95vw)', maxHeight:'85vh', display:'flex', flexDirection:'column', gap:0, boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontSize:17, fontWeight:800, color:'var(--text-1)' }}>
                {lessonModal.type === 'edit' ? 'Dersi Düzenle' : 'Ders Ekle'}
              </span>
              <button style={{ background:'none', border:'none', cursor:'pointer', display:'grid', placeItems:'center' }} onClick={() => setLessonModal(null)}>
                <span className="material-icons" style={{ fontSize:22, color:'var(--text-2)' }}>close</span>
              </button>
            </div>

            <div style={{ overflowY:'auto', flex:1, padding:'16px 20px', display:'flex', flexDirection:'column', gap:0 }}>
              {/* ── Antrenör ─────────────────────────────────── */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>ANTRENÖR</div>
              {/* Toggle butonları */}
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                <button
                  style={{ flex:1, padding:'9px', borderRadius:10, border: !lessonForm.use_manual_coach ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)', background: !lessonForm.use_manual_coach ? '#EEF2FF' : 'var(--bg)', cursor:'pointer', fontSize:13, fontWeight:600, color: !lessonForm.use_manual_coach ? 'var(--brand-navy)' : 'var(--text-2)' }}
                  onClick={() => setLessonForm({...lessonForm, use_manual_coach: false, manual_coach_name:''})}
                >
                  Listeden Seç
                </button>
                <button
                  style={{ flex:1, padding:'9px', borderRadius:10, border: lessonForm.use_manual_coach ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)', background: lessonForm.use_manual_coach ? '#EEF2FF' : 'var(--bg)', cursor:'pointer', fontSize:13, fontWeight:600, color: lessonForm.use_manual_coach ? 'var(--brand-navy)' : 'var(--text-2)' }}
                  onClick={() => setLessonForm({...lessonForm, use_manual_coach: true, coach_id:''})}
                >
                  Manuel Giriş
                </button>
              </div>
              {lessonForm.use_manual_coach ? (
                <input style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'11px 12px', fontSize:15, color:'var(--text-1)', background:'var(--bg)', boxSizing:'border-box', marginBottom:16 }}
                  placeholder="Antrenör adı" value={lessonForm.manual_coach_name || ''}
                  onChange={e => setLessonForm({...lessonForm, manual_coach_name: e.target.value})} />
              ) : coaches.length === 0 ? (
                <div style={{ padding:16, borderRadius:12, background:'var(--bg)', border:'1px solid var(--border)', textAlign:'center', color:'var(--text-2)', fontSize:13, marginBottom:16 }}>Henüz antrenör eklenmemiş.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                  {coaches.map(c => (
                    <div key={c.id}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:10, borderRadius:12, border: lessonForm.coach_id === c.id ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)', background: lessonForm.coach_id === c.id ? '#EEF2FF' : 'var(--bg)', cursor:'pointer' }}
                      onClick={() => setLessonForm({...lessonForm, coach_id: c.id})}
                    >
                      <div style={{ width:34, height:34, borderRadius:17, background:'rgba(0,51,153,0.12)', display:'grid', placeItems:'center', flexShrink:0 }}>
                        <span style={{ fontSize:14, fontWeight:700, color:'var(--brand-navy)' }}>{c.full_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span style={{ flex:1, fontSize:14, color:'var(--text-1)', fontWeight: lessonForm.coach_id === c.id ? 700 : 500 }}>{c.full_name}</span>
                      {lessonForm.coach_id === c.id && <span className="material-icons" style={{fontSize:18, color:'var(--brand-navy)'}}>check_circle</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Tarih ve Saat ─────────────────────────────── */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4, marginTop:4 }}>TARİH VE SAAT</div>
              <div style={{ display:'flex', gap:8, marginBottom:0 }}>
                <input type="date" style={{ flex:2, border:'1.5px solid var(--border)', borderRadius:12, padding:'11px 12px', fontSize:15, color:'var(--text-1)', background:'var(--bg)', boxSizing:'border-box' }}
                  value={lessonForm.date || ''} onChange={e => setLessonForm({...lessonForm, date: e.target.value})} />
                <input type="time" style={{ flex:1, border:'1.5px solid var(--border)', borderRadius:12, padding:'11px 8px', fontSize:14, color:'var(--text-1)', background:'var(--bg)', boxSizing:'border-box' }}
                  placeholder="Başlangıç" value={lessonForm.start_time || ''} onChange={e => setLessonForm({...lessonForm, start_time: e.target.value})} />
                <input type="time" style={{ flex:1, border:'1.5px solid var(--border)', borderRadius:12, padding:'11px 8px', fontSize:14, color:'var(--text-1)', background:'var(--bg)', boxSizing:'border-box' }}
                  placeholder="Bitiş" value={lessonForm.end_time || ''} onChange={e => setLessonForm({...lessonForm, end_time: e.target.value})} />
              </div>

              {/* ── Süre hızlı seçim ─────────────────────────── */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4, marginTop:14 }}>SÜRE (opsiyonel — bitiş saatini otomatik doldurur)</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
                {[{label:'30 dk', value:0.5}, {label:'45 dk', value:0.75}, {label:'1 saat', value:1}, {label:'1.5 saat', value:1.5}, {label:'2 saat', value:2}].map(d => (
                  <div key={d.value}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'10px 14px', borderRadius:12, border: lessonForm.duration === d.value ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)', background: lessonForm.duration === d.value ? '#EEF2FF' : 'var(--bg)', cursor:'pointer' }}
                    onClick={() => setLessonForm({...lessonForm, duration: lessonForm.duration === d.value ? null : d.value})}
                  >
                    <span style={{ fontSize:13, color: lessonForm.duration === d.value ? 'var(--brand-navy)' : 'var(--text-2)', fontWeight: lessonForm.duration === d.value ? 700 : 500 }}>{d.label}</span>
                  </div>
                ))}
              </div>

              {/* ── Öğrenci ───────────────────────────────────── */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>ÖĞRENCİ (opsiyonel)</div>
              {lessonSelectedPlayer ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', border:'1.5px solid var(--brand-navy)', borderRadius:12, padding:'11px 12px', marginBottom:16, background:'#EEF2FF' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--brand-navy)' }}>{lessonSelectedPlayer.full_name}</div>
                    <div style={{ fontSize:12, color:'var(--text-2)' }}>{lessonSelectedPlayer.email}</div>
                  </div>
                  <button style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}
                    onClick={() => { setLessonSelectedPlayer(null); setLessonPlayerSearch(''); setLessonPlayerResults([]); setLessonForm(prev => ({ ...prev, student_name: '', player_id: null })); }}>
                    <span className="material-icons" style={{ fontSize:18, color:'var(--text-2)' }}>close</span>
                  </button>
                </div>
              ) : (
                <div style={{ position:'relative', marginBottom:16 }}>
                  <input style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'11px 12px', fontSize:15, color:'var(--text-1)', background:'var(--bg)', boxSizing:'border-box' }}
                    placeholder="Öğrenci adı yazın veya ara..." value={lessonPlayerSearch}
                    onChange={e => { const v = e.target.value; setLessonPlayerSearch(v); setLessonForm(prev => ({ ...prev, student_name: v, player_id: null })); searchPlayers(v); }} />
                  {lessonPlayerResults.length > 0 && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:999, background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:12, boxShadow:'0 4px 16px rgba(0,0,0,0.12)', overflow:'hidden' }}>
                      {lessonPlayerResults.map(p => (
                        <div key={p.id} style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)' }}
                          onMouseDown={() => { setLessonSelectedPlayer(p); setLessonForm(prev => ({ ...prev, student_name: p.full_name, player_id: p.id })); setLessonPlayerSearch(p.full_name); setLessonPlayerResults([]); }}>
                          <div style={{ fontSize:14, fontWeight:600, color:'var(--text-1)' }}>{p.full_name}</div>
                          <div style={{ fontSize:12, color:'var(--text-2)' }}>{p.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Paket Kullanımı ──────────────────────────── */}
              {lessonSelectedPlayer && !lessonForm.use_manual_coach && lessonForm.coach_id && (
                <div style={{ marginBottom:16 }}>
                  {lessonLoadingPackages ? (
                    <div style={{ fontSize:13, color:'var(--text-2)', padding:'8px 0' }}>Paketler yükleniyor...</div>
                  ) : lessonPackages.length > 0 ? (
                    <div style={{ border:'1.5px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                      {/* Toggle satırı */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background: lessonUsePackage ? '#EEF2FF' : 'var(--bg)', borderBottom: lessonUsePackage ? '1.5px solid var(--border)' : 'none' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span className="material-icons" style={{ fontSize:18, color: lessonUsePackage ? 'var(--brand-navy)' : 'var(--text-2)' }}>inventory_2</span>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color: lessonUsePackage ? 'var(--brand-navy)' : 'var(--text-1)' }}>Paketten Kullan</div>
                            <div style={{ fontSize:11, color:'var(--text-2)' }}>{lessonPackages.length} aktif paket mevcut</div>
                          </div>
                        </div>
                        <div style={{ width:44, height:24, borderRadius:12, background: lessonUsePackage ? 'var(--brand-navy)' : '#CBD5E1', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}
                          onClick={() => {
                            const next = !lessonUsePackage;
                            setLessonUsePackage(next);
                            if (next) {
                              setLessonForm(prev => ({ ...prev, amount: '0', payment_status: 'paid' }));
                            } else {
                              setLessonForm(prev => ({ ...prev, amount: '', payment_status: 'unpaid' }));
                            }
                          }}>
                          <div style={{ width:18, height:18, borderRadius:9, background:'#fff', position:'absolute', top:3, left: lessonUsePackage ? 23 : 3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
                        </div>
                      </div>
                      {/* Paket seçimi */}
                      {lessonUsePackage && (
                        <div style={{ padding:'12px 14px', background:'var(--surface)', display:'flex', flexDirection:'column', gap:8 }}>
                          {lessonPackages.map(pkg => {
                            const remaining = (pkg.total_lessons || 0) - (pkg.used_lessons || 0);
                            const isSelected = lessonSelectedPackageId === pkg.id;
                            const expiry = pkg.expiry_date ? new Date(pkg.expiry_date).toLocaleDateString('tr-TR') : null;
                            return (
                              <div key={pkg.id}
                                onClick={() => setLessonSelectedPackageId(pkg.id)}
                                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:10, border: isSelected ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)', background: isSelected ? '#EEF2FF' : 'var(--bg)', cursor:'pointer' }}>
                                <div>
                                  <div style={{ fontSize:13, fontWeight:700, color: isSelected ? 'var(--brand-navy)' : 'var(--text-1)' }}>{pkg.package_name || 'Ders Paketi'}</div>
                                  <div style={{ fontSize:11, color:'var(--text-2)' }}>
                                    {remaining} ders kaldı{expiry ? ` · Son: ${expiry}` : ''}
                                  </div>
                                </div>
                                {isSelected && <span className="material-icons" style={{ fontSize:18, color:'var(--brand-navy)' }}>check_circle</span>}
                              </div>
                            );
                          })}
                          <div style={{ fontSize:11, color:'#059669', fontWeight:600, paddingTop:4 }}>
                            Ders ücreti 0 ₺ olarak kaydedilecek, ödemesi paket satışında alındı.
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* ── Kort ─────────────────────────────────────── */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>KORT</div>
              {lessonCourts.length === 0 ? (
                <div style={{ padding:16, borderRadius:12, background:'var(--bg)', border:'1px solid var(--border)', textAlign:'center', color:'var(--text-2)', fontSize:13, marginBottom:16 }}>Henüz kort eklenmemiş.</div>
              ) : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
                  {lessonCourts.map(c => (
                    <div key={c.id}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'10px 14px', borderRadius:12, border: lessonForm.court_id === c.id ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)', background: lessonForm.court_id === c.id ? '#EEF2FF' : 'var(--bg)', cursor:'pointer' }}
                      onClick={() => setLessonForm({...lessonForm, court_id: c.id})}
                    >
                      <span className="material-icons" style={{fontSize:14, color: lessonForm.court_id === c.id ? 'var(--brand-navy)' : 'var(--text-2)'}}>sports_tennis</span>
                      <span style={{ fontSize:13, color: lessonForm.court_id === c.id ? 'var(--brand-navy)' : 'var(--text-2)', fontWeight: lessonForm.court_id === c.id ? 700 : 500 }}>Kort {c.court_number}</span>
                      {lessonForm.court_id === c.id && <span className="material-icons" style={{fontSize:14, color:'var(--brand-navy)'}}>check</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Not ──────────────────────────────────────── */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>NOT (opsiyonel)</div>
              <textarea style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'11px 12px', fontSize:15, color:'var(--text-1)', background:'var(--bg)', boxSizing:'border-box', minHeight:72, resize:'vertical', marginBottom:16 }}
                placeholder="Ders hakkında not..." value={lessonForm.notes || ''}
                onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />

              {/* ── Ders Ücreti (dual) ───────────────────────── */}
              {!lessonUsePackage && lessonPriceMode === 'dual' && (() => {
                const coachAmt_ = parseFloat(String(lessonCoachAmountInput).replace(',', '.')) || 0;
                const clubAmt_  = parseFloat(String(lessonClubAmountInput).replace(',', '.'))  || 0;
                const total_    = coachAmt_ + clubAmt_;
                return (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:4 }}>HOCA HAKEDİŞİ (₺)</div>
                        <input type="number" min="0" step="0.01"
                          style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 12px', fontSize:14, color:'var(--text-1)', background:'var(--bg)', boxSizing:'border-box', outline:'none' }}
                          placeholder="0" value={lessonCoachAmountInput}
                          onChange={e => setLessonCoachAmountInput(e.target.value)} />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:4 }}>KULÜP PAYI (₺)</div>
                        <input type="number" min="0" step="0.01"
                          style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 12px', fontSize:14, color:'var(--text-1)', background:'var(--bg)', boxSizing:'border-box', outline:'none' }}
                          placeholder="0" value={lessonClubAmountInput}
                          onChange={e => setLessonClubAmountInput(e.target.value)} />
                      </div>
                    </div>
                    {total_ > 0 && (
                      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                        <div style={{ flex:1, background:'#F0FDF4', borderRadius:10, padding:'8px 12px', border:'1px solid #BBF7D0' }}>
                          <div style={{ fontSize:10, color:'var(--text-2)', fontWeight:600 }}>HOCA HAKEDİŞİ</div>
                          <div style={{ fontSize:15, fontWeight:800, color:'#16A34A' }}>₺{coachAmt_.toLocaleString('tr-TR')}</div>
                        </div>
                        <div style={{ flex:1, background:'#EEF2FF', borderRadius:10, padding:'8px 12px', border:'1px solid #C7D2FE' }}>
                          <div style={{ fontSize:10, color:'var(--text-2)', fontWeight:600 }}>KULÜP PAYI</div>
                          <div style={{ fontSize:15, fontWeight:800, color:'var(--brand-navy)' }}>₺{clubAmt_.toLocaleString('tr-TR')}</div>
                        </div>
                      </div>
                    )}
                    {total_ > 0 && (
                      <div style={{ background:'var(--bg-2,#F3F4F6)', borderRadius:10, padding:'8px 12px', textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'var(--text-2)', fontWeight:600 }}>TOPLAM</div>
                        <div style={{ fontSize:18, fontWeight:800, color:'var(--text-1)' }}>₺{total_.toLocaleString('tr-TR')}</div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Ödeme Modeli ─────────────────────────────── */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>ÖDEME MODELİ</div>
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                <button
                  style={{ flex:1, padding:'9px', borderRadius:10, border: lessonPriceMode === 'dual' ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)', background: lessonPriceMode === 'dual' ? '#EEF2FF' : 'var(--bg)', cursor:'pointer', fontSize:13, fontWeight:600, color: lessonPriceMode === 'dual' ? 'var(--brand-navy)' : 'var(--text-2)' }}
                  onClick={() => { setLessonPriceMode('dual'); setLessonForm(prev => ({...prev, payment_status:'unpaid'})); }}
                >Özel Fiyat</button>
                <button
                  style={{ flex:1, padding:'9px', borderRadius:10, border: lessonPriceMode === 'split' ? '1.5px solid #7C3AED' : '1.5px solid var(--border)', background: lessonPriceMode === 'split' ? '#F5F3FF' : 'var(--bg)', cursor:'pointer', fontSize:13, fontWeight:600, color: lessonPriceMode === 'split' ? '#7C3AED' : 'var(--text-2)' }}
                  onClick={() => setLessonPriceMode('split')}
                >Pay Modeli</button>
              </div>
              {lessonPriceMode === 'split' && (() => {
                const coachRec = !lessonForm.use_manual_coach ? coaches.find(c => c.id === lessonForm.coach_id) : null;
                const payRate  = coachRec?.coach_pay_rate ?? 0;
                const totalAmt = lessonForm.amount ? parseFloat(String(lessonForm.amount).replace(',', '.')) : 0;
                const coachEarning = payRate > 0 ? Math.round(totalAmt * (payRate / 100) * 100) / 100 : 0;
                const clubEarning  = payRate > 0 ? Math.round((totalAmt - coachEarning) * 100) / 100 : 0;
                return (
                  <div style={{ borderRadius:12, border:'1.5px solid #DDD6FE', background:'#F5F3FF', padding:'12px 14px', marginBottom:12 }}>
                    {!coachRec ? (
                      <div style={{ fontSize:12, color:'#7C3AED' }}>Listeden bir hoca seçin.</div>
                    ) : payRate === 0 ? (
                      <div style={{ fontSize:12, color:'#7C3AED' }}>Bu hocanın pay oranı tanımlı değil. Ekip yönetiminden pay oranı girin.</div>
                    ) : (
                      <>
                        <div style={{ fontSize:12, fontWeight:700, color:'#7C3AED', marginBottom:6 }}>{coachRec.full_name} · Pay Oranı %{payRate}</div>
                        <div style={{ display:'flex', gap:8 }}>
                          <div style={{ flex:1, background:'#fff', borderRadius:8, padding:'8px 10px', border:'1px solid #DDD6FE' }}>
                            <div style={{ fontSize:10, color:'var(--text-2)', fontWeight:600 }}>HOCA HAKEDİŞİ</div>
                            <div style={{ fontSize:15, fontWeight:800, color:'#7C3AED' }}>₺{coachEarning.toLocaleString('tr-TR')}</div>
                          </div>
                          <div style={{ flex:1, background:'#fff', borderRadius:8, padding:'8px 10px', border:'1px solid #DDD6FE' }}>
                            <div style={{ fontSize:10, color:'var(--text-2)', fontWeight:600 }}>KULÜP PAYI</div>
                            <div style={{ fontSize:15, fontWeight:800, color:'var(--brand-navy)' }}>₺{clubEarning.toLocaleString('tr-TR')}</div>
                          </div>
                        </div>
                        <div style={{ fontSize:11, color:'#059669', fontWeight:600, marginTop:8 }}>Kayıt anında otomatik ayrıştırılır, kort ücreti eklenmez.</div>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* ── Ödeme Durumu ─────────────────────────────── */}
              {lessonPriceMode === 'dual' && <>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>ÖDEME DURUMU</div>
              <div style={{ display:'flex', gap:10, marginBottom:20, opacity: lessonUsePackage ? 0.6 : 1, pointerEvents: lessonUsePackage ? 'none' : 'auto' }}>
                <button
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'11px', borderRadius:12, border: (lessonForm.payment_status||'unpaid') === 'unpaid' ? '1.5px solid #F59E0B' : '1.5px solid var(--border)', background: (lessonForm.payment_status||'unpaid') === 'unpaid' ? '#FEF3C7' : 'var(--bg)', cursor:'pointer' }}
                  onClick={() => setLessonForm({...lessonForm, payment_status:'unpaid'})}
                >
                  <span className="material-icons" style={{fontSize:16, color:(lessonForm.payment_status||'unpaid')==='unpaid'?'#F59E0B':'var(--text-2)'}}>schedule</span>
                  <span style={{ fontSize:13, fontWeight:600, color:(lessonForm.payment_status||'unpaid')==='unpaid'?'#F59E0B':'var(--text-2)' }}>Ödenmedi</span>
                </button>
                <button
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'11px', borderRadius:12, border: lessonForm.payment_status === 'paid' ? '1.5px solid #22C55E' : '1.5px solid var(--border)', background: lessonForm.payment_status === 'paid' ? '#DCFCE7' : 'var(--bg)', cursor:'pointer' }}
                  onClick={() => setLessonForm({...lessonForm, payment_status:'paid'})}
                >
                  <span className="material-icons" style={{fontSize:16, color:lessonForm.payment_status==='paid'?'#22C55E':'var(--text-2)'}}>check_circle</span>
                  <span style={{ fontSize:13, fontWeight:600, color:lessonForm.payment_status==='paid'?'#22C55E':'var(--text-2)' }}>Ödendi</span>
                </button>
              </div>
              </>}

              {/* ── Kaydet butonu ─────────────────────────────── */}
              <button
                style={{ width:'100%', background:'var(--brand-navy)', color:'#fff', border:'none', borderRadius:14, padding:'15px', fontSize:15, fontWeight:800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
                onClick={saveLesson} disabled={saving}
              >
                {saving ? 'Kaydediliyor...' : 'Dersi Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Misafir → Müşteri Ekleme Modalı ─────────────────────── */}
      {guestCustModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:420, padding:28, boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <span className="material-icons" style={{ fontSize:24, color:'#D97706' }}>person_add</span>
              <span style={{ fontSize:18, fontWeight:800, color:'var(--text-1)' }}>Müşteri Olarak Ekle?</span>
            </div>
            <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:20, lineHeight:1.5 }}>
              <strong>{guestCustModal.name}</strong> adlı misafiri müşteri olarak kaydetmek ister misiniz?
              Kaydedilirse bu rezervasyon müşteri profiline bağlanır.
            </p>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', display:'block', marginBottom:6 }}>AD SOYAD</label>
              <input
                type="text"
                value={guestCustModal.name}
                onChange={e => setGuestCustModal(prev => ({ ...prev, name: e.target.value }))}
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid var(--border)', fontSize:14, background:'var(--bg)', boxSizing:'border-box' }}
              />
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', display:'block', marginBottom:6 }}>TELEFON <span style={{ color:'#EF4444' }}>*</span></label>
              <input
                type="tel"
                placeholder="05XX XXX XX XX"
                value={guestCustModal.phone}
                onChange={e => setGuestCustModal(prev => ({ ...prev, phone: e.target.value }))}
                autoFocus
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid var(--border)', fontSize:14, background:'var(--bg)', boxSizing:'border-box' }}
              />
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={() => { setGuestCustModal(null); alert('Rezervasyon başarıyla oluşturuldu.'); }}
                disabled={guestCustSaving}
                style={{ flex:1, padding:'12px', borderRadius:12, border:'1.5px solid var(--border)', background:'var(--bg)', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--text-2)' }}
              >
                Hayır, Geç
              </button>
              <button
                onClick={saveGuestAsCustomer}
                disabled={guestCustSaving}
                style={{ flex:2, padding:'12px', borderRadius:12, border:'none', background:'#D97706', color:'#fff', cursor: guestCustSaving ? 'not-allowed' : 'pointer', fontSize:14, fontWeight:800, opacity: guestCustSaving ? 0.7 : 1 }}
              >
                {guestCustSaving ? 'Kaydediliyor...' : 'Evet, Müşteri Olarak Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KORTLAR
// ═══════════════════════════════════════════════════════════════
function CourtsScreen({ clubId, setScreen }) {
  const { useState, useEffect } = React;
  const [courts,    setCourts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null); // null | {type:'add'|'edit', court?}
  const [form,      setForm]      = useState({});
  const [saving,    setSaving]    = useState(false);
  const [expanded,  setExpanded]  = useState(null);
  const [slotData,  setSlotData]  = useState({}); // courtId -> {date, bookings}
  const [slotDate,  setSlotDate]  = useState(todayISO());
  const [closureModal,   setClosureModal]   = useState(null);
  const [closureForm,    setClosureForm]    = useState({});
  const [closureCoaches, setClosureCoaches] = useState([]);
  const [closureGroups,  setClosureGroups]  = useState([]);
  const [courtClosures,  setCourtClosures]  = useState([]);
  const [slotClickInfo,  setSlotClickInfo]  = useState(null); // { courtId, hour }
  const [slotTypeModal,  setSlotTypeModal]  = useState(false);
  const [use15Min,       setUse15Min]       = useState(false);
  const [conflictWarning, setConflictWarning] = useState('');

  useEffect(() => { if (clubId) loadCourts(); }, [clubId]);

  const loadCourts = async () => {
    setLoading(true);
    const { data } = await sb.from('courts').select('*').eq('club_id', clubId).order('court_number');
    setCourts(data || []);
    setLoading(false);
  };

  const loadSlots = async (courtId) => {
    const start = slotDate + 'T00:00:00';
    const end   = slotDate + 'T23:59:59';
    const [{ data: bk }, { data: cl }] = await Promise.all([
      sb.from('bookings').select('start_time,end_time,status,booking_players!booking_players_booking_id_fkey(profiles!booking_players_player_id_fkey(full_name))')
        .eq('court_id', courtId).neq('status', 'cancelled').gte('start_time', start).lte('start_time', end),
      sb.from('court_closures').select('*, coach:club_coaches(id,full_name), group:club_groups(id,name)')
        .eq('court_id', courtId)
        .eq('is_active', true)
        .or(`and(closure_type.eq.one_time,start_date.lte.${slotDate},end_date.gte.${slotDate}),and(closure_type.eq.recurring_weekly,day_of_week.eq.${new Date(slotDate+'T12:00').getDay()})`),
    ]);
    setSlotData(prev => ({ ...prev, [courtId]: { bookings: bk || [], closures: cl || [] } }));
  };

  const toggleExpand = async (courtId) => {
    if (expanded === courtId) { setExpanded(null); return; }
    setExpanded(courtId);
    await loadSlots(courtId);
  };

  const openAdd = () => {
    setForm({ court_number: '', court_type: 'clay', surface: 'clay', hourly_rate: '', is_active: true, is_indoor: false, campaign_enabled: false, campaign_price: '', campaign_start_hour: 9, campaign_end_hour: 12, price_2_players: '', price_3_players: '', price_4_players: '' });
    setModal({ type: 'add' });
  };

  const openEdit = (court) => {
    setForm({
      ...court,
      campaign_enabled:    court.campaign_price != null,
      campaign_price:      court.campaign_price != null ? String(court.campaign_price) : '',
      campaign_start_hour: court.campaign_start_hour ?? 9,
      campaign_end_hour:   court.campaign_end_hour   ?? 12,
      price_2_players:     court.price_2_players != null ? String(court.price_2_players) : '',
      price_3_players:     court.price_3_players != null ? String(court.price_3_players) : '',
      price_4_players:     court.price_4_players != null ? String(court.price_4_players) : '',
    });
    setModal({ type: 'edit', court });
  };

  const saveCourt = async () => {
    setSaving(true);
    try {
      const payload = {
        club_id:              clubId,
        court_number:         form.court_number,
        court_type:           form.court_type,
        surface:              form.surface,
        hourly_rate:          form.hourly_rate ? Number(form.hourly_rate) : null,
        is_active:            form.is_active !== false,
        is_indoor:            !!form.is_indoor,
        campaign_price:       form.campaign_enabled && form.campaign_price ? Number(form.campaign_price) : null,
        campaign_start_hour:  form.campaign_enabled ? (form.campaign_start_hour ?? 9)  : null,
        campaign_end_hour:    form.campaign_enabled ? (form.campaign_end_hour   ?? 12) : null,
        price_2_players:      form.price_2_players ? Number(form.price_2_players) : null,
        price_3_players:      form.price_3_players ? Number(form.price_3_players) : null,
        price_4_players:      form.price_4_players ? Number(form.price_4_players) : null,
      };
      if (modal.type === 'add') {
        await sb.from('courts').insert(payload);
      } else {
        await sb.from('courts').update(payload).eq('id', form.id);
      }
      setModal(null);
      loadCourts();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (court) => {
    await sb.from('courts').update({ is_active: !court.is_active }).eq('id', court.id);
    loadCourts();
  };

  const deleteCourt = async (id) => {
    if (!confirm('Bu kortu silmek istediğinize emin misiniz?')) return;
    await sb.from('courts').delete().eq('id', id);
    loadCourts();
  };

  const SESSION_TYPE_LABELS = { training: 'Grup Antrenmanı', maintenance: 'Bakım & Onarım', other: 'Diğer' };

  const loadClosureCoaches = async () => {
    const { data } = await sb.from('club_coaches').select('id,full_name').eq('club_id', clubId).eq('is_active', true);
    setClosureCoaches(data || []);
  };

  const loadClosureGroups = async () => {
    const { data } = await sb.from('club_groups').select('id,name,coach_id').eq('club_id', clubId).eq('is_active', true);
    setClosureGroups(data || []);
  };

  const loadCourtClosures = async (courtId) => {
    const { data } = await sb.from('court_closures')
      .select('*, coach:club_coaches(id,full_name), group:club_groups(id,name)')
      .eq('court_id', courtId)
      .order('created_at', { ascending: false });
    setCourtClosures(data || []);
  };

  const deleteClosure = async (id) => {
    if (!confirm('Bu kapatmayı silmek istediğinize emin misiniz?')) return;
    await sb.from('court_closures').delete().eq('id', id);
    loadCourtClosures(closureModal.courtId);
    if (expanded === closureModal.courtId) loadSlots(closureModal.courtId);
  };

  const toggleClosure = async (closure) => {
    await sb.from('court_closures').update({ is_active: !closure.is_active }).eq('id', closure.id);
    loadCourtClosures(closureModal.courtId);
    if (expanded === closureModal.courtId) loadSlots(closureModal.courtId);
  };

  const saveClosure = async () => {
    setSaving(true);
    setConflictWarning('');
    try {
      const startH = closureForm.start_hour ?? 9;
      const startM = closureForm.start_minute ?? 0;
      const endH   = closureForm.end_hour ?? 10;
      const endM   = closureForm.end_minute ?? 0;
      const startTime = startH + startM / 60;
      const endTime   = endH   + endM   / 60;
      if (startTime >= endTime) {
        alert('Bitiş saati başlangıç saatinden büyük olmalı');
        setSaving(false);
        return;
      }
      const autoReason = (closureForm.reason || '').trim() || SESSION_TYPE_LABELS[closureForm.session_type || 'other'];
      let effectiveCoachId = closureForm.coach_id || null;
      const selectedGroup = closureForm.group_id ? closureGroups.find(g => g.id === closureForm.group_id) : null;
      if (selectedGroup?.coach_id && !effectiveCoachId) effectiveCoachId = selectedGroup.coach_id;

      // Coach conflict check
      if (effectiveCoachId) {
        const closureType = closureForm.closure_type || 'recurring_weekly';
        let conflictQuery = sb.from('court_closures')
          .select('id, start_hour, start_minute, end_hour, end_minute, reason, court_id')
          .eq('coach_id', effectiveCoachId)
          .eq('is_active', true);
        if (closureType === 'recurring_weekly') {
          conflictQuery = conflictQuery.eq('closure_type', 'recurring_weekly').eq('day_of_week', closureForm.day_of_week ?? 1);
        } else {
          conflictQuery = conflictQuery.eq('closure_type', 'one_time').lte('start_date', closureForm.end_date).gte('end_date', closureForm.start_date);
        }
        const { data: conflicts } = await conflictQuery;
        const overlapping = (conflicts || []).filter(c => {
          const cStart = c.start_hour + (c.start_minute ?? 0) / 60;
          const cEnd   = c.end_hour   + (c.end_minute   ?? 0) / 60;
          return startTime < cEnd && endTime > cStart;
        });
        if (overlapping.length > 0) {
          const coachName = closureCoaches.find(c => c.id === effectiveCoachId)?.full_name || 'Antrenör';
          setSaving(false);
          setConflictWarning(`⚠️ ${coachName} bu saatte başka bir programa atanmış (${overlapping[0].reason || 'Ders'}). Yine de kaydetmek için tekrar tıklayın.`);
          return;
        }
      }

      // Mevcut rezervasyon çakışması kontrolü (TR saati için dbTimeToLocal uygulanıyor)
      {
        const chkType    = closureForm.closure_type || 'recurring_weekly';
        const chkCourtId = closureModal.courtId;
        let bkQuery = sb.from('bookings')
          .select('id, start_time, end_time')
          .eq('court_id', chkCourtId)
          .in('status', ['pending', 'confirmed'])
          .gte('start_time', localTimeToDb(new Date().toISOString()));
        if (chkType === 'one_time' && closureForm.start_date && closureForm.end_date) {
          bkQuery = bkQuery
            .lte('start_time', localTimeToDb(`${closureForm.end_date}T23:59:59`));
        }
        const { data: upcomingBk } = await bkQuery;
        const conflictingBk = (upcomingBk || []).filter(b => {
          const localStart = new Date(dbTimeToLocal(b.start_time));
          const localEnd   = new Date(dbTimeToLocal(b.end_time));
          if (chkType === 'recurring_weekly' && localStart.getDay() !== (closureForm.day_of_week ?? 1)) return false;
          const bsh = localStart.getHours() + localStart.getMinutes() / 60;
          const beh = localEnd.getHours()   + localEnd.getMinutes()   / 60;
          return startTime < beh && endTime > bsh;
        });
        if (conflictingBk.length > 0) {
          const ok = confirm(
            `⚠️ Bu saatte ${conflictingBk.length} aktif rezervasyon var. ` +
            `Kort kapatılırsa bu rezervasyonlar etkilenecek. Yine de devam etmek istiyor musunuz?`
          );
          if (!ok) { setSaving(false); return; }
        }
      }

      const payload = {
        court_id:       closureModal.courtId,
        closure_type:   closureForm.closure_type || 'recurring_weekly',
        start_hour:     startH,
        start_minute:   startM,
        end_hour:       endH,
        end_minute:     endM,
        reason:         autoReason,
        coach_id:       effectiveCoachId || null,
        group_id:       closureForm.group_id || null,
        is_active:      true,
      };
      if ((closureForm.closure_type || 'recurring_weekly') === 'recurring_weekly') {
        payload.day_of_week = closureForm.day_of_week ?? 1;
        if (closureForm.start_date) payload.start_date = closureForm.start_date;
        if (closureForm.end_date)   payload.end_date   = closureForm.end_date;
      } else {
        if (!closureForm.start_date || !closureForm.end_date) {
          alert('Tek seferlik kapatma için başlangıç ve bitiş tarihi gereklidir');
          setSaving(false);
          return;
        }
        payload.start_date = closureForm.start_date;
        payload.end_date   = closureForm.end_date;
      }
      await sb.from('court_closures').insert(payload);
      setConflictWarning('');
      loadCourtClosures(closureModal.courtId);
      setClosureForm({ closure_type:'recurring_weekly', session_type:'training', day_of_week:1, start_hour:9, start_minute:0, end_hour:10, end_minute:0, start_date:'', end_date:'', reason:'', coach_id:'', group_id:'' });
      if (expanded === closureModal.courtId) loadSlots(closureModal.courtId);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleSlotClick = (courtId, hour) => {
    if (getSlotStatus(courtId, hour) !== 'empty') return;
    setSlotClickInfo({ courtId, hour });
    setSlotTypeModal(true);
  };

  const applySlotPrefill = (type) => {
    const { courtId, hour } = slotClickInfo;
    const startStr = `${String(hour).padStart(2,'0')}:00`;
    const endStr   = `${String(hour+1).padStart(2,'0')}:00`;
    setSlotTypeModal(false);
    setSlotClickInfo(null);

    if (type === 'closure') {
      setClosureForm({ closure_type:'one_time', session_type:'maintenance', reason:'Kapalı', day_of_week:new Date(slotDate+'T12:00').getDay(), start_hour:hour, start_minute:0, end_hour:hour+1, end_minute:0, start_date:slotDate, end_date:slotDate, coach_id:'', group_id:'' });
      loadClosureCoaches();
      loadClosureGroups();
      loadCourtClosures(courtId);
      setConflictWarning('');
      setClosureModal({ courtId });
    } else if (type === 'group') {
      setClosureForm({ closure_type:'one_time', session_type:'training', reason:'Grup Dersi', day_of_week:new Date(slotDate+'T12:00').getDay(), start_hour:hour, start_minute:0, end_hour:hour+1, end_minute:0, start_date:slotDate, end_date:slotDate, coach_id:'', group_id:'' });
      loadClosureCoaches();
      loadClosureGroups();
      loadCourtClosures(courtId);
      setClosureModal({ courtId });
    } else {
      // 'reservation' veya 'lesson' → ReservationsScreen'e yönlendir
      window.__slotPrefill = { type, court_id: courtId, date: slotDate, start_time: startStr, end_time: endStr };
      setScreen('reservations');
    }
  };

  // Saat dilimi slot oluşturucu (06:00 – 22:00)
  const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

  const getSlotStatus = (courtId, h) => {
    const d = slotData[courtId];
    if (!d) return 'empty';
    const hStart = new Date(slotDate + `T${String(h).padStart(2,'0')}:00:00`);
    const hEnd   = new Date(slotDate + `T${String(h+1).padStart(2,'0')}:00:00`);
    for (const b of d.bookings) {
      const bs = new Date(b.start_time), be = new Date(b.end_time);
      if (bs < hEnd && be > hStart) return b.status === 'cancelled' ? 'empty' : 'booked';
    }
    for (const c of d.closures) {
      if (c.start_hour != null && c.end_hour != null) {
        if (h < c.end_hour && (h + 1) > c.start_hour) return 'closed';
      }
    }
    return 'empty';
  };

  const slotLabel = (courtId, h, status) => {
    if (status === 'empty') return '';
    const d = slotData[courtId];
    if (!d) return '';
    const hStart = new Date(slotDate + `T${String(h).padStart(2,'0')}:00:00`);
    const hEnd   = new Date(slotDate + `T${String(h+1).padStart(2,'0')}:00:00`);
    if (status === 'booked' || status === 'pending') {
      const b = d.bookings.find(b => new Date(b.start_time) < hEnd && new Date(b.end_time) > hStart);
      return b?.booking_players?.[0]?.profiles?.full_name?.split(' ')[0] || '●';
    }
    return 'Kapalı';
  };

  if (loading) return <Spinner />;

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Kortlar</h1>
          <div className="sub">{courts.length} kort kayıtlı</div>
        </div>
        <button className="btn btn-pri" onClick={openAdd}>
          <span className="material-icons">add</span>
          Kort Ekle
        </button>
      </div>

      {courts.length === 0
        ? <EmptyState icon="sports_tennis" title="Henüz kort yok" sub="İlk kortunuzu ekleyin." />
        : courts.map(court => (
          <div key={court.id} className="card tight" style={{ overflow: 'visible' }}>
            {/* Kort başlık */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px' }}>
              <div className="av av-sq av-1" style={{ width:40, height:40, fontSize:14, borderRadius:10 }}>
                {court.court_number}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>Kort {court.court_number}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', display:'flex', gap:8, marginTop:2 }}>
                  <Badge cls={courtTypeClass(court.court_type)}>{courtTypeLabel(court.court_type)}</Badge>
                  {court.is_indoor && <Badge cls="b-purple">Kapalı</Badge>}
                  {court.hourly_rate && <span>{fmtMoney(court.hourly_rate)}/saat</span>}
                  {court.price_2_players && <span>👥2: {fmtMoney(court.price_2_players)}</span>}
                  {court.price_3_players && <span>👥3: {fmtMoney(court.price_3_players)}</span>}
                  {court.price_4_players && <span>👥4: {fmtMoney(court.price_4_players)}</span>}
                </div>
              </div>
              <Switch on={court.is_active} onChange={() => toggleActive(court)} label={court.is_active ? 'Aktif' : 'Pasif'} />
              <button className="btn btn-ghost btn-sm btn-icon" title="Düzenle" onClick={() => openEdit(court)}>
                <span className="material-icons" style={{fontSize:16}}>edit</span>
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" title="Sabit Program"
                onClick={() => {
                  setClosureForm({ closure_type:'recurring_weekly', session_type:'training', day_of_week:1, start_hour:9, start_minute:0, end_hour:10, end_minute:0, start_date:'', end_date:'', reason:'', coach_id:'', group_id:'' });
                  loadClosureCoaches();
                  loadClosureGroups();
                  loadCourtClosures(court.id);
                  setConflictWarning('');
                  setClosureModal({ courtId: court.id });
                }}>
                <span className="material-icons" style={{fontSize:16}}>block</span>
              </button>
              <button className="btn btn-danger btn-sm btn-icon" title="Sil" onClick={() => deleteCourt(court.id)}>
                <span className="material-icons" style={{fontSize:16}}>delete</span>
              </button>
              <button className="icon-btn" title="Program Gör" onClick={() => toggleExpand(court.id)}>
                <span className="material-icons">{expanded === court.id ? 'expand_less' : 'expand_more'}</span>
              </button>
            </div>

            {/* Genişletilmiş: saat dilimi ızgarası */}
            {expanded === court.id && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--text-2)' }}>Tarih:</span>
                  <input type="date" value={slotDate}
                    onChange={e => { setSlotDate(e.target.value); setTimeout(() => loadSlots(court.id), 0); }}
                    style={{ border:'1px solid var(--border)', borderRadius:8, padding:'4px 10px', fontSize:12, outline:0 }} />
                  <button className="btn btn-ghost btn-sm" onClick={() => loadSlots(court.id)}>
                    <span className="material-icons" style={{fontSize:14}}>refresh</span>
                  </button>
                </div>
                <div className="court-grid-wrap">
                  <div className="court-time-grid" style={{ gridTemplateColumns: `50px repeat(${HOURS.length}, 1fr)` }}>
                    <div className="hour-label" style={{ background:'var(--bg)' }}>Saat</div>
                    {HOURS.map(h => (
                      <div key={h} className="hour-label">{String(h).padStart(2,'0')}:00</div>
                    ))}
                    <div className="hour-label" style={{ background:'var(--surface)' }}>Durum</div>
                    {HOURS.map(h => {
                      const st = getSlotStatus(court.id, h);
                      return (
                        <div key={h} className={`court-slot ${st}`}
                          title={st === 'empty' ? 'Tıkla: ekle' : undefined}
                          onClick={() => handleSlotClick(court.id, h)}
                          style={{ cursor: st === 'empty' ? 'pointer' : 'default' }}
                        >
                          {slotLabel(court.id, h, st)}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display:'flex', gap:12, marginTop:10, fontSize:11, color:'var(--text-2)' }}>
                  <span><span style={{ display:'inline-block',width:10,height:10,borderRadius:2,background:'var(--brand-navy-soft)',marginRight:4 }}/>Rezerveli</span>
                  <span><span style={{ display:'inline-block',width:10,height:10,borderRadius:2,background:'#FEF2F2',marginRight:4 }}/>Kapalı</span>
                  <span><span style={{ display:'inline-block',width:10,height:10,borderRadius:2,background:'var(--surface)',border:'1px solid var(--border)',marginRight:4 }}/>Boş</span>
                </div>
              </div>
            )}
          </div>
        ))
      }

      {/* Kort Ekle/Düzenle Modalı */}
      {modal && (
        <Modal
          title={modal.type === 'add' ? 'Kort Ekle' : 'Kort Düzenle'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={saveCourt} disabled={saving}>
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </>
          }
        >
          <div className="fields" style={{ gap: 14 }}>
            <div className="fields-2">
              <Field label="Kort Numarası">
                <input type="number" min={1} value={form.court_number || ''} placeholder="1"
                  onChange={e => setForm({...form, court_number: e.target.value})} />
              </Field>
              <Field label="Saatlik Ücret (₺)">
                <input type="number" min={0} value={form.hourly_rate || ''} placeholder="0"
                  onChange={e => setForm({...form, hourly_rate: e.target.value})} />
              </Field>
            </div>
            <div className="fields-2">
              <Field label="Zemin Tipi">
                <select value={form.court_type || 'clay'} onChange={e => setForm({...form, court_type: e.target.value, surface: e.target.value})}>
                  <option value="clay">Toprak (Clay)</option>
                  <option value="hard">Sert (Hard)</option>
                  <option value="grass">Çim (Grass)</option>
                  <option value="artificial_grass">Yapay Çim</option>
                </select>
              </Field>
              <Field label="Kapalı Kort">
                <select value={form.is_indoor ? 'true' : 'false'} onChange={e => setForm({...form, is_indoor: e.target.value === 'true'})}>
                  <option value="false">Açık Hava</option>
                  <option value="true">Kapalı Alan</option>
                </select>
              </Field>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Switch on={form.is_active !== false} onChange={v => setForm({...form, is_active: v})} label="Aktif" />
            </div>
            {/* Oyuncu sayısına göre fiyatlar */}
            <div style={{ fontWeight:700, fontSize:12, color:'var(--text-2)', letterSpacing:0.5, textTransform:'uppercase', marginTop:4 }}>Oyuncu Sayısına Göre Ücret (₺)</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <Field label="2 Oyuncu (₺)">
                <input type="number" min={0} value={form.price_2_players || ''} placeholder="0"
                  onChange={e => setForm({...form, price_2_players: e.target.value})} />
              </Field>
              <Field label="3 Oyuncu (₺)">
                <input type="number" min={0} value={form.price_3_players || ''} placeholder="0"
                  onChange={e => setForm({...form, price_3_players: e.target.value})} />
              </Field>
              <Field label="4 Oyuncu (₺)">
                <input type="number" min={0} value={form.price_4_players || ''} placeholder="0"
                  onChange={e => setForm({...form, price_4_players: e.target.value})} />
              </Field>
            </div>
            <Switch on={!!form.campaign_enabled}
              onChange={v => setForm({...form, campaign_enabled: v, campaign_price: v ? form.campaign_price : '', campaign_start_hour: form.campaign_start_hour ?? 9, campaign_end_hour: form.campaign_end_hour ?? 12 })}
              label="Kampanya Fiyatı Aktif" />
            {form.campaign_enabled && (
              <>
                <Field label="Kampanya Fiyatı (₺)">
                  <input type="number" min={0} value={form.campaign_price || ''} placeholder="0"
                    onChange={e => setForm({...form, campaign_price: e.target.value})} />
                </Field>
                <Field label="Kampanya Saat Aralığı">
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                      <button type="button" className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => setForm(f => ({...f, campaign_start_hour: Math.max(0, (f.campaign_start_hour ?? 9) - 1)}))}>
                        <span className="material-icons" style={{fontSize:14}}>remove</span>
                      </button>
                      <span style={{ fontWeight:700, fontSize:14, minWidth:36, textAlign:'center' }}>
                        {String(form.campaign_start_hour ?? 9).padStart(2,'0')}:00
                      </span>
                      <button type="button" className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => setForm(f => ({...f, campaign_start_hour: Math.min(22, (f.campaign_start_hour ?? 9) + 1)}))}>
                        <span className="material-icons" style={{fontSize:14}}>add</span>
                      </button>
                    </div>
                    <span className="material-icons" style={{ color:'var(--text-2)', fontSize:16 }}>arrow_forward</span>
                    <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                      <button type="button" className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => setForm(f => ({...f, campaign_end_hour: Math.max(1, (f.campaign_end_hour ?? 12) - 1)}))}>
                        <span className="material-icons" style={{fontSize:14}}>remove</span>
                      </button>
                      <span style={{ fontWeight:700, fontSize:14, minWidth:36, textAlign:'center' }}>
                        {String(form.campaign_end_hour ?? 12).padStart(2,'0')}:00
                      </span>
                      <button type="button" className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => setForm(f => ({...f, campaign_end_hour: Math.min(23, (f.campaign_end_hour ?? 12) + 1)}))}>
                        <span className="material-icons" style={{fontSize:14}}>add</span>
                      </button>
                    </div>
                  </div>
                </Field>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Slot Tip Seçim Modalı */}
      {slotTypeModal && slotClickInfo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if (e.target === e.currentTarget) { setSlotTypeModal(false); setSlotClickInfo(null); } }}>
          <div style={{ background:'#fff', borderRadius:20, padding:24, width:320, display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontWeight:800, fontSize:17, color:'var(--text-1)', marginBottom:4 }}>
              {String(slotClickInfo.hour).padStart(2,'0')}:00 – {String(slotClickInfo.hour+1).padStart(2,'0')}:00
            </div>
            <div style={{ fontSize:13, color:'var(--text-2)', marginBottom:8 }}>Ne yapmak istersiniz?</div>
            {[
              { type:'reservation', icon:'event', label:'Rezervasyon', color:'#003399' },
              { type:'lesson',      icon:'school', label:'Özel Ders',   color:'#7C3AED' },
              { type:'group',       icon:'groups', label:'Grup Dersi',  color:'#0891B2' },
              { type:'closure',     icon:'lock',   label:'Kapatma',     color:'#DC2626' },
            ].map(({ type, icon, label, color }) => (
              <button key={type}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderRadius:14, border:`1.5px solid ${color}20`, background:`${color}08`, cursor:'pointer', fontSize:14, fontWeight:700, color }}
                onClick={() => applySlotPrefill(type)}
              >
                <span className="material-icons" style={{ fontSize:20, color }}>{icon}</span>
                {label}
              </button>
            ))}
            <button style={{ marginTop:4, padding:'10px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)', cursor:'pointer', fontSize:13, color:'var(--text-2)', fontWeight:600 }}
              onClick={() => { setSlotTypeModal(false); setSlotClickInfo(null); }}>
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Sabit Program Modalı */}
      {closureModal && (
        <Modal
          title={`Sabit Program — Kort ${courts.find(c => c.id === closureModal.courtId)?.court_number ?? ''}`}
          wide
          onClose={() => setClosureModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setClosureModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={saveClosure} disabled={saving}>
                {saving ? 'Kaydediliyor…' : 'Program Ekle'}
              </button>
            </>
          }
        >
          <div className="fields" style={{ gap: 14 }}>
            {/* Mevcut programlar */}
            {courtClosures.length > 0 && (
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>MEVCUT PROGRAMLAR</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {courtClosures.map(cl => (
                    <div key={cl.id} style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'10px 12px', borderRadius:10,
                      background:'var(--surface)', border:'1px solid var(--border)',
                      opacity: cl.is_active ? 1 : 0.5
                    }}>
                      <div style={{ width:4, alignSelf:'stretch', borderRadius:2, flexShrink:0,
                        background: cl.reason?.includes('Bakım') ? '#F59E0B' : '#8B5CF6' }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{cl.reason || 'Kapalı'}</div>
                        <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2 }}>
                          {cl.closure_type === 'recurring_weekly'
                            ? `Her ${['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'][cl.day_of_week ?? 0]}`
                            : `${cl.start_date} – ${cl.end_date}`}
                          {' · '}
                          {String(cl.start_hour).padStart(2,'0')}:{String(cl.start_minute ?? 0).padStart(2,'0')} – {String(cl.end_hour).padStart(2,'0')}:{String(cl.end_minute ?? 0).padStart(2,'0')}
                        </div>
                        {cl.group?.name    && <div style={{ fontSize:11, color:'var(--text-2)' }}>👥 {cl.group.name}</div>}
                        {cl.coach?.full_name && <div style={{ fontSize:11, color:'var(--text-2)' }}>👤 {cl.coach.full_name}</div>}
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-ghost btn-sm btn-icon"
                          title={cl.is_active ? 'Duraklat' : 'Aktifleştir'}
                          style={{ background: cl.is_active ? '#FEF2F2' : '#F0FDF4', border:'none' }}
                          onClick={() => toggleClosure(cl)}>
                          <span className="material-icons" style={{ fontSize:15, color: cl.is_active ? '#EF4444' : '#22C55E' }}>
                            {cl.is_active ? 'pause' : 'play_arrow'}
                          </span>
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" title="Sil" onClick={() => deleteClosure(cl.id)}>
                          <span className="material-icons" style={{ fontSize:15 }}>delete_outline</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, margin:'14px 0 0' }}>
                  <div style={{ flex:1, height:1, background:'var(--border)' }} />
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', letterSpacing:1 }}>YENİ EKLE</span>
                  <div style={{ flex:1, height:1, background:'var(--border)' }} />
                </div>
              </div>
            )}

            {/* ETKİNLİK TÜRÜ */}
            <Field label="ETKİNLİK TÜRÜ">
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {[
                  { value:'training',    label:'🎾 Grup Antrenmanı' },
                  { value:'maintenance', label:'🔧 Bakım & Onarım' },
                  { value:'other',       label:'📌 Diğer' },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    className={'btn btn-sm ' + (closureForm.session_type === opt.value ? 'btn-pri' : 'btn-ghost')}
                    onClick={() => setClosureForm({ ...closureForm, session_type: opt.value })}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* ETKİNLİK ADI */}
            <Field label="ETKİNLİK ADI (isteğe bağlı)">
              <input type="text" value={closureForm.reason || ''} placeholder="Örn: Pazartesi Sabah Grubu"
                onChange={e => setClosureForm({ ...closureForm, reason: e.target.value })} />
            </Field>

            {/* GRUP (sadece training) */}
            {closureForm.session_type === 'training' && (
              <Field label="GRUP (isteğe bağlı)">
                {closureGroups.length === 0
                  ? <span style={{ fontSize:13, color:'var(--text-2)' }}>Aktif grup bulunamadı</span>
                  : (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      <button type="button"
                        className={'btn btn-sm ' + (!closureForm.group_id ? 'btn-pri' : 'btn-ghost')}
                        onClick={() => setClosureForm({ ...closureForm, group_id:'', coach_id:'' })}>
                        Yok
                      </button>
                      {closureGroups.map(g => (
                        <button key={g.id} type="button"
                          className={'btn btn-sm ' + (closureForm.group_id === g.id ? 'btn-pri' : 'btn-ghost')}
                          onClick={() => setClosureForm({ ...closureForm, group_id: g.id, coach_id: g.coach_id || '' })}>
                          {g.name}
                        </button>
                      ))}
                    </div>
                  )
                }
              </Field>
            )}

            {/* ANTRENÖR (sadece training) */}
            {closureForm.session_type === 'training' && (
              <Field label="ANTRENÖR">
                {closureCoaches.length === 0
                  ? <span style={{ fontSize:13, color:'var(--text-2)' }}>Aktif antrenör bulunamadı</span>
                  : (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      <button type="button"
                        className={'btn btn-sm ' + (!closureForm.coach_id ? 'btn-pri' : 'btn-ghost')}
                        onClick={() => setClosureForm({ ...closureForm, coach_id:'' })}>
                        Yok
                      </button>
                      {closureCoaches.map(c => (
                        <button key={c.id} type="button"
                          className={'btn btn-sm ' + (closureForm.coach_id === c.id ? 'btn-pri' : 'btn-ghost')}
                          onClick={() => setClosureForm({ ...closureForm, coach_id: c.id })}>
                          {c.full_name}
                        </button>
                      ))}
                    </div>
                  )
                }
              </Field>
            )}

            {/* TEKRAR toggle */}
            <Field label="TEKRAR">
              <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid var(--border)' }}>
                {[
                  { value:'recurring_weekly', label:'🔄 Haftalık Tekrar' },
                  { value:'one_time',         label:'📅 Tek Seferlik' },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    style={{
                      flex:1, padding:'8px 12px', fontSize:13, fontWeight:600, border:'none', cursor:'pointer',
                      background: closureForm.closure_type === opt.value ? 'var(--brand-navy, #003399)' : 'transparent',
                      color: closureForm.closure_type === opt.value ? '#fff' : 'var(--text-1)',
                    }}
                    onClick={() => setClosureForm({ ...closureForm, closure_type: opt.value })}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* GÜN (recurring_weekly) */}
            {(closureForm.closure_type || 'recurring_weekly') === 'recurring_weekly' && (
              <Field label="GÜN">
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'].map((day, idx) => (
                    <button key={day} type="button"
                      className={'btn btn-sm ' + ((closureForm.day_of_week ?? 1) === idx ? 'btn-pri' : 'btn-ghost')}
                      style={{ minWidth:44 }}
                      onClick={() => setClosureForm({ ...closureForm, day_of_week: idx })}>
                      {day}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            {/* Tarih aralığı (one_time) */}
            {closureForm.closure_type === 'one_time' && (
              <div className="fields-2">
                <Field label="BAŞLANGIÇ">
                  <input type="date" value={closureForm.start_date || ''}
                    onChange={e => setClosureForm({ ...closureForm, start_date: e.target.value })} />
                </Field>
                <Field label="BİTİŞ">
                  <input type="date" value={closureForm.end_date || ''}
                    onChange={e => setClosureForm({ ...closureForm, end_date: e.target.value })} />
                </Field>
              </div>
            )}

            {/* SAAT ARALIĞI – stepper */}
            <Field label="SAAT ARALIĞI">
              <div style={{ marginBottom:8 }}>
                <Switch on={use15Min} onChange={setUse15Min} label="15 dakika hassasiyeti" />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px' }}>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => setClosureForm(f => {
                      const h = f.start_hour ?? 9, m = f.start_minute ?? 0;
                      if (use15Min) { return m > 0 ? { ...f, start_minute: m - 15 } : { ...f, start_hour: Math.max(0, h - 1), start_minute: 45 }; }
                      return { ...f, start_hour: Math.max(0, h - 1) };
                    })}>
                    <span className="material-icons" style={{ fontSize:16 }}>remove</span>
                  </button>
                  <span style={{ fontWeight:700, fontSize:15, minWidth:44, textAlign:'center' }}>
                    {String(closureForm.start_hour ?? 9).padStart(2,'0')}:{String(closureForm.start_minute ?? 0).padStart(2,'0')}
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => setClosureForm(f => {
                      const h = f.start_hour ?? 9, m = f.start_minute ?? 0;
                      if (use15Min) { return m < 45 ? { ...f, start_minute: m + 15 } : { ...f, start_hour: Math.min(22, h + 1), start_minute: 0 }; }
                      return { ...f, start_hour: Math.min(22, h + 1) };
                    })}>
                    <span className="material-icons" style={{ fontSize:16 }}>add</span>
                  </button>
                </div>
                <span className="material-icons" style={{ color:'var(--text-2)' }}>arrow_forward</span>
                <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px' }}>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => setClosureForm(f => {
                      const h = f.end_hour ?? 10, m = f.end_minute ?? 0;
                      if (use15Min) { return m > 0 ? { ...f, end_minute: m - 15 } : { ...f, end_hour: Math.max(1, h - 1), end_minute: 45 }; }
                      return { ...f, end_hour: Math.max(1, h - 1) };
                    })}>
                    <span className="material-icons" style={{ fontSize:16 }}>remove</span>
                  </button>
                  <span style={{ fontWeight:700, fontSize:15, minWidth:44, textAlign:'center' }}>
                    {String(closureForm.end_hour ?? 10).padStart(2,'0')}:{String(closureForm.end_minute ?? 0).padStart(2,'0')}
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => setClosureForm(f => {
                      const h = f.end_hour ?? 10, m = f.end_minute ?? 0;
                      if (use15Min) { return m < 45 ? { ...f, end_minute: m + 15 } : { ...f, end_hour: Math.min(23, h + 1), end_minute: 0 }; }
                      return { ...f, end_hour: Math.min(23, h + 1) };
                    })}>
                    <span className="material-icons" style={{ fontSize:16 }}>add</span>
                  </button>
                </div>
              </div>
            </Field>

            {/* Çakışma uyarısı */}
            {conflictWarning && (
              <div style={{ background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'flex-start', gap:8 }}>
                <span className="material-icons" style={{ color:'#D97706', fontSize:18, marginTop:1 }}>warning</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#92400E' }}>{conflictWarning}</div>
                  <button type="button" className="btn btn-sm" style={{ marginTop:8, background:'#D97706', color:'#fff', border:'none' }}
                    onClick={async () => {
                      setConflictWarning('');
                      const startH = closureForm.start_hour ?? 9, startM = closureForm.start_minute ?? 0;
                      const endH = closureForm.end_hour ?? 10, endM = closureForm.end_minute ?? 0;
                      const autoReason = (closureForm.reason || '').trim() || SESSION_TYPE_LABELS[closureForm.session_type || 'other'];
                      let effectiveCoachId = closureForm.coach_id || null;
                      const selectedGroup = closureForm.group_id ? closureGroups.find(g => g.id === closureForm.group_id) : null;
                      if (selectedGroup?.coach_id && !effectiveCoachId) effectiveCoachId = selectedGroup.coach_id;
                      const payload = {
                        court_id: closureModal.courtId, closure_type: closureForm.closure_type || 'recurring_weekly',
                        start_hour: startH, start_minute: startM, end_hour: endH, end_minute: endM,
                        reason: autoReason, coach_id: effectiveCoachId || null, group_id: closureForm.group_id || null, is_active: true,
                      };
                      if ((closureForm.closure_type || 'recurring_weekly') === 'recurring_weekly') {
                        payload.day_of_week = closureForm.day_of_week ?? 1;
                        if (closureForm.start_date) payload.start_date = closureForm.start_date;
                        if (closureForm.end_date)   payload.end_date   = closureForm.end_date;
                      } else {
                        payload.start_date = closureForm.start_date;
                        payload.end_date   = closureForm.end_date;
                      }
                      try {
                        await sb.from('court_closures').insert(payload);
                        loadCourtClosures(closureModal.courtId);
                        setClosureForm({ closure_type:'recurring_weekly', session_type:'training', day_of_week:1, start_hour:9, start_minute:0, end_hour:10, end_minute:0, start_date:'', end_date:'', reason:'', coach_id:'', group_id:'' });
                        if (expanded === closureModal.courtId) loadSlots(closureModal.courtId);
                      } catch (e) { alert(e.message); }
                    }}>
                    Yine de Ekle
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Dashboard, Rezervasyonlar, Kortlar ─────────────────────────

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
          .select('*', { count: 'exact', head: true })
          .eq('club_id', clubId)
          .eq('is_active', true),
      ]);

      const rows = (bRes.data || []).map(b => ({
        ...b,
        start_time: dbTimeToLocal(b.start_time),
        end_time:   dbTimeToLocal(b.end_time),
      }));
      setBookings(rows);
      setTodayCount(rows.length);
      // payment_status filtresi JS tarafında (DB'de alan var ama opsiyonel)
      setPendingPay(rows.filter(b => b.payment_status !== 'paid').length);
      setPendingMem(pendMemRes.count ?? 0);
      setCourtCount(courtRes.count ?? 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const TILES = [
    { icon: 'event_available', label: 'Rezervasyonlar', screen: 'reservations', color: '#003399' },
    { icon: 'bar_chart',       label: 'Analitik',        screen: 'analytics',    color: '#8B5CF6' },
    { icon: 'person',          label: 'Koçlar',           screen: 'coaches',      color: '#0D9488' },
    { icon: 'emoji_events',    label: 'Turnuvalar',       screen: 'tournaments',  color: '#F97316' },
    { icon: 'groups',          label: 'Gruplar',          screen: 'groups',       color: '#0EA5E9' },
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

      {/* Bugünkü rezervasyonlar */}
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REZERVASYONLAR
// ═══════════════════════════════════════════════════════════════
function ReservationsScreen({ clubId }) {
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

  // Özel dersler state
  const [lessons,      setLessons]      = useState([]);
  const [coaches,      setCoaches]      = useState([]);
  const [lessonCourts, setLessonCourts] = useState([]);
  const [loadingL,     setLoadingL]     = useState(false);
  const [lessonModal,  setLessonModal]  = useState(null);
  const [lessonForm,   setLessonForm]   = useState({});

  useEffect(() => { if (clubId) { loadCourts(); loadDotDates(); } }, [clubId]);
  useEffect(() => { if (clubId) loadDay(); }, [clubId, selDate]);
  useEffect(() => { if (clubId && mainTab === 'lessons') loadLessons(); }, [clubId, mainTab, selDate]);

  const loadCourts = async () => {
    const { data } = await sb.from('courts').select('id,court_number,court_type').eq('club_id', clubId).eq('is_active', true);
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
      const { data, error } = await sb
        .from('bookings')
        .select('*, courts!bookings_court_id_fkey(court_number,court_type), booking_players!booking_players_booking_id_fkey(player_id, is_primary_player, profiles!booking_players_player_id_fkey(id,full_name,email))')
        .in('court_id', courtIds)
        .gte('start_time', startDt.toISOString())
        .lte('start_time', endDt.toISOString())
        .order('start_time', { ascending: true });
      if (error) { console.error('loadDay error:', error); setBookings([]); return; }
      setBookings((data || []).map(b => ({
        ...b,
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

  const updateStatus = async (id, status) => {
    await sb.from('bookings').update({ status }).eq('id', id);
    loadDay();
  };

  const openAdd = () => {
    const dt = selDate + 'T09:00';
    setForm({ start_time: dt, end_time: selDate + 'T10:00', court_id: courts[0]?.id || '', status: 'confirmed', notes: '' });
    setModal({ type: 'add' });
  };

  const saveBooking = async () => {
    setSaving(true);
    try {
      await sb.from('bookings').insert({
        court_id:   form.court_id,
        start_time: localTimeToDb(form.start_time),
        end_time:   localTimeToDb(form.end_time),
        status:     form.status || 'confirmed',
        notes:      form.notes || null,
      });
      setModal(null);
      loadDay();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  // ── Özel ders fonksiyonları ──────────────────────────────────
  const loadLessons = async () => {
    setLoadingL(true);
    try {
      const d = selDate;
      const dbStart = `${d}T00:00:00`;
      const dbEnd   = `${d}T23:59:59`;

      // Kulübün koçlarını al
      const [coachRes, courtRes] = await Promise.all([
        sb.from('club_coaches').select('id, full_name').eq('club_id', clubId),
        sb.from('courts').select('id, court_number').eq('club_id', clubId).eq('is_active', true),
      ]);
      const allClubCoaches = coachRes.data || [];
      const myCoachIds = allClubCoaches.map(c => c.id);
      const coachMap = new Map(allClubCoaches.map(c => [c.id, c.full_name]));
      setCoaches(allClubCoaches);
      setLessonCourts(courtRes.data || []);

      const combined = [];

      // 1) bookings tablosu — club_coach_id olan rezervasyonlar
      if (myCoachIds.length > 0) {
        const { data: bookings } = await sb.from('bookings')
          .select('id, start_time, end_time, club_coach_id, payment_status, total_amount, courts!bookings_court_id_fkey(court_number)')
          .not('club_coach_id', 'is', null)
          .in('club_coach_id', myCoachIds)
          .gte('start_time', dbStart)
          .lte('start_time', dbEnd)
          .order('start_time', { ascending: true });

        (bookings || []).forEach(b => {
          const court = Array.isArray(b.courts) ? b.courts[0] : b.courts;
          const start = new Date(b.start_time);
          const end   = new Date(b.end_time);
          combined.push({
            id:             b.id,
            date:           start.toISOString().split('T')[0],
            start_time:     start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            end_time:       end.toLocaleTimeString('tr-TR',   { hour: '2-digit', minute: '2-digit' }),
            coach_name:     coachMap.get(b.club_coach_id) || 'Antrenör',
            coach_id:       b.club_coach_id,
            location:       court?.court_number ? `Kort ${court.court_number}` : '—',
            source:         'booking',
            payment_status: b.payment_status === 'paid' ? 'paid' : 'unpaid',
            amount:         b.total_amount || null,
          });
        });
      }

      // 2) club_manual_lessons tablosu — kulüp yöneticisinin eklediği manuel dersler
      const { data: manual } = await sb.from('club_manual_lessons')
        .select('*, club_coaches(full_name), courts(court_number)')
        .eq('club_id', clubId)
        .eq('date', d)
        .order('start_time', { ascending: true });

      (manual || []).forEach(m => {
        combined.push({
          id:             m.id,
          date:           m.date,
          start_time:     (m.start_time || '').slice(0, 5),
          end_time:       (m.end_time   || '').slice(0, 5),
          student_name:   m.student_name || null,
          coach_name:     m.coach_name || m.club_coaches?.full_name || 'Antrenör',
          coach_id:       m.coach_id || null,
          location:       m.location || (m.courts?.court_number ? `Kort ${m.courts.court_number}` : '—'),
          notes:          m.notes || null,
          source:         'manual',
          payment_status: m.payment_status || 'unpaid',
          amount:         m.amount || null,
        });
      });

      // 3) lessons tablosu — koçların oluşturduğu dersler
      if (myCoachIds.length > 0) {
        const { data: directLessons } = await sb.from('lessons')
          .select('id, start_time, end_time, student_name, club_coach_id, amount, payment_status, notes, courts(court_number)')
          .in('club_coach_id', myCoachIds)
          .neq('status', 'cancelled')
          .gte('start_time', dbStart)
          .lte('start_time', dbEnd);

        (directLessons || []).forEach(l => {
          const start = new Date(l.start_time);
          const end   = new Date(l.end_time);
          const court = Array.isArray(l.courts) ? l.courts[0] : l.courts;
          combined.push({
            id:             l.id,
            date:           start.toISOString().split('T')[0],
            start_time:     start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            end_time:       end.toLocaleTimeString('tr-TR',   { hour: '2-digit', minute: '2-digit' }),
            student_name:   l.student_name || null,
            coach_name:     l.club_coach_id ? (coachMap.get(l.club_coach_id) || 'Antrenör') : 'Antrenör',
            coach_id:       l.club_coach_id || null,
            location:       court?.court_number ? `Kort ${court.court_number}` : '—',
            notes:          l.notes || null,
            source:         'lesson',
            payment_status: l.payment_status === 'paid' ? 'paid' : 'unpaid',
            amount:         l.amount || null,
          });
        });
      }

      combined.sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
      setLessons(combined);
    } catch (e) { console.error(e); }
    finally { setLoadingL(false); }
  };

  const saveLesson = async () => {
    setSaving(true);
    try {
      const courtRow = lessonCourts.find(c => c.id === lessonForm.court_id);
      const payload = {
        club_id:        clubId,
        coach_id:       lessonForm.coach_id || null,
        coach_name:     null,
        court_id:       lessonForm.court_id || null,
        date:           lessonForm.date,
        start_time:     lessonForm.start_time,
        end_time:       lessonForm.end_time,
        student_name:   lessonForm.student_name || null,
        location:       courtRow ? `Kort ${courtRow.court_number}` : null,
        notes:          lessonForm.notes || null,
        payment_status: lessonForm.payment_status || 'unpaid',
        amount:         lessonForm.amount ? parseFloat(String(lessonForm.amount).replace(',', '.')) : null,
      };
      if (lessonModal?.id) {
        await sb.from('club_manual_lessons').update(payload).eq('id', lessonModal.id);
      } else {
        await sb.from('club_manual_lessons').insert(payload);
      }
      setLessonModal(null);
      loadLessons();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const deleteLesson = async (lesson) => {
    if (lesson.source === 'booking') { alert('Rezervasyon kaynaklı dersler buradan silinemez.'); return; }
    if (!confirm('Bu dersi silmek istediğinize emin misiniz?')) return;
    const table = lesson.source === 'lesson' ? 'lessons' : 'club_manual_lessons';
    await sb.from(table).delete().eq('id', lesson.id);
    loadLessons();
  };

  const markLessonPaid = async (lesson) => {
    const amtStr = lesson.amount ? ` · ₺${Number(lesson.amount).toLocaleString('tr-TR')}` : '';
    if (!confirm(`Bu ders için ödeme alındı olarak işaretlensin mi?${amtStr}`)) return;
    try {
      if (lesson.source === 'booking') {
        await sb.from('bookings').update({ payment_status: 'paid' }).eq('id', lesson.id);
      } else if (lesson.source === 'lesson') {
        await sb.from('lessons').update({ payment_status: 'paid' }).eq('id', lesson.id);
        if (lesson.amount > 0) {
          await sb.from('club_finances').insert({
            club_id: clubId, type: 'income', category: 'Ders Geliri',
            amount: lesson.amount,
            description: `${lesson.coach_name}${lesson.student_name ? ' - ' + lesson.student_name : ''} - Ders ödemesi`,
            date: lesson.date,
          });
        }
      } else {
        await sb.from('club_manual_lessons').update({ payment_status: 'paid' }).eq('id', lesson.id);
        if (lesson.amount > 0) {
          await sb.from('club_finances').insert({
            club_id: clubId, type: 'income', category: 'Ders Geliri',
            amount: lesson.amount,
            description: `${lesson.coach_name}${lesson.student_name ? ' - ' + lesson.student_name : ''} - Ders ödemesi`,
            date: lesson.date,
          });
        }
      }
      loadLessons();
    } catch (e) { alert(e.message); }
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
          : <button className="btn btn-pri" onClick={() => { setLessonForm({ date: selDate, start_time:'09:00', end_time:'10:00' }); setLessonModal({ type:'add' }); }}>
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
                          {b.booking_players?.find(p => p.is_primary_player)?.profiles?.full_name ||
                           b.booking_players?.[0]?.profiles?.full_name || 'Misafir'}
                          {(b.booking_players?.length || 0) > 1 && ` +${b.booking_players.length - 1}`}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                          Kort {b.courts?.court_number || '—'} · {courtTypeLabel(b.courts?.court_type)}
                        </div>
                        {b.notes && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{b.notes}</div>}
                      </div>
                      <Badge cls={paymentClass(b.payment_status)}>{paymentLabel(b.payment_status)}</Badge>
                      <div style={{ display:'flex', gap:4 }}>
                        {b.status === 'confirmed' && (
                          <button className="btn btn-ghost btn-sm btn-icon" title="Tamamlandı" onClick={() => updateStatus(b.id, 'completed')}>
                            <span className="material-icons" style={{fontSize:15}}>done_all</span>
                          </button>
                        )}
                        {['confirmed','completed'].includes(b.status) && (
                          <button className="btn btn-danger btn-sm btn-icon" title="İptal Et" onClick={() => updateStatus(b.id, 'cancelled')}>
                            <span className="material-icons" style={{fontSize:15}}>close</span>
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
              lessons.map(l => (
                <div key={`${l.source}-${l.id}`} className="card tight">
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px' }}>
                    <div className="time-bubble">
                      <b>{l.start_time}</b>
                      <b>{l.end_time}</b>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                        {l.student_name || <span style={{ color:'var(--text-2)', fontWeight:400 }}>Öğrenci belirtilmemiş</span>}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2, display:'flex', alignItems:'center', gap:8 }}>
                        <span><span className="material-icons" style={{fontSize:12,verticalAlign:'middle'}}>person</span> {l.coach_name || '—'}</span>
                        {l.location && l.location !== '—' && (
                          <span><span className="material-icons" style={{fontSize:12,verticalAlign:'middle'}}>sports_tennis</span> {l.location}</span>
                        )}
                      </div>
                      {l.notes && <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2 }}>{l.notes}</div>}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                      {l.source === 'booking' && <Badge cls="b-info">Rezervasyon</Badge>}
                      {l.source === 'manual'  && <Badge cls="b-warning">Manuel</Badge>}
                      {l.source === 'lesson'  && <Badge cls="">Koç</Badge>}
                      {l.payment_status === 'paid' ? (
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <Badge cls="b-success">Ödendi</Badge>
                          {l.amount > 0 && <span style={{ fontSize:11, color:'var(--text-2)' }}>₺{Number(l.amount).toLocaleString('tr-TR')}</span>}
                        </div>
                      ) : (
                        <button className="btn btn-success btn-sm" style={{ fontSize:11, padding:'3px 8px' }}
                          onClick={() => markLessonPaid(l)}>
                          <span className="material-icons" style={{fontSize:13}}>payments</span>
                          Ödeme Al{l.amount > 0 ? ` · ₺${Number(l.amount).toLocaleString('tr-TR')}` : ''}
                        </button>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:4 }}>
                      {l.source !== 'booking' && (
                        <button className="btn btn-ghost btn-sm btn-icon" title="Düzenle"
                          onClick={() => { setLessonForm({ ...l, payment_status: l.payment_status || 'unpaid' }); setLessonModal({ type:'edit', id: l.id }); }}>
                          <span className="material-icons" style={{fontSize:15}}>edit</span>
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm btn-icon" title="Sil" onClick={() => deleteLesson(l)}>
                        <span className="material-icons" style={{fontSize:15}}>delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <MiniCalendar selected={selDate} onSelect={setSelDate} dotDates={dotDates} />
        </div>
      )}

      {/* Rezervasyon Ekle Modalı */}
      {modal?.type === 'add' && (
        <Modal title="Yeni Rezervasyon" onClose={() => setModal(null)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Vazgeç</button>
            <button className="btn btn-pri btn-sm" onClick={saveBooking} disabled={saving}>
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </>
        }>
          <div className="fields" style={{ gap: 14 }}>
            <div className="fields-2">
              <Field label="Başlangıç">
                <input type="datetime-local" value={form.start_time || ''} onChange={e => setForm({...form, start_time: e.target.value})} />
              </Field>
              <Field label="Bitiş">
                <input type="datetime-local" value={form.end_time || ''} onChange={e => setForm({...form, end_time: e.target.value})} />
              </Field>
            </div>
            <Field label="Kort">
              <select value={form.court_id || ''} onChange={e => setForm({...form, court_id: e.target.value})}>
                {courts.map(c => <option key={c.id} value={c.id}>Kort {c.court_number} — {courtTypeLabel(c.court_type)}</option>)}
              </select>
            </Field>
            <Field label="Durum">
              <select value={form.status || 'confirmed'} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="confirmed">Rezerveli</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </Field>
            <Field label="Notlar">
              <textarea rows={2} value={form.notes || ''} placeholder="İsteğe bağlı not…"
                onChange={e => setForm({...form, notes: e.target.value})}
                style={{ resize: 'vertical' }} />
            </Field>
          </div>
        </Modal>
      )}

      {/* Özel Ders Ekle / Düzenle Modalı */}
      {lessonModal && (
        <Modal
          title={lessonModal.type === 'edit' ? 'Dersi Düzenle' : 'Yeni Özel Ders'}
          onClose={() => setLessonModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setLessonModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={saveLesson} disabled={saving}>
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </>
          }
        >
          <div className="fields" style={{ gap: 14 }}>
            <Field label="Tarih">
              <input type="date" value={lessonForm.date || ''} onChange={e => setLessonForm({...lessonForm, date: e.target.value})} />
            </Field>
            <div className="fields-2">
              <Field label="Başlangıç Saati">
                <input type="time" value={lessonForm.start_time || ''} onChange={e => setLessonForm({...lessonForm, start_time: e.target.value})} />
              </Field>
              <Field label="Bitiş Saati">
                <input type="time" value={lessonForm.end_time || ''} onChange={e => setLessonForm({...lessonForm, end_time: e.target.value})} />
              </Field>
            </div>
            <Field label="Öğrenci Adı">
              <input type="text" placeholder="Öğrenci adı soyadı…" value={lessonForm.student_name || ''} onChange={e => setLessonForm({...lessonForm, student_name: e.target.value})} />
            </Field>
            <Field label="Koç">
              <select value={lessonForm.coach_id || ''} onChange={e => setLessonForm({...lessonForm, coach_id: e.target.value})}>
                <option value="">Koç seçin…</option>
                {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </Field>
            <Field label="Kort">
              <select value={lessonForm.court_id || ''} onChange={e => setLessonForm({...lessonForm, court_id: e.target.value})}>
                <option value="">Kort seçin…</option>
                {lessonCourts.map(c => <option key={c.id} value={c.id}>Kort {c.court_number}</option>)}
              </select>
            </Field>
            <div className="fields-2">
              <Field label="Ders Ücreti (₺)">
                <input type="number" min="0" step="0.01" placeholder="0,00" value={lessonForm.amount || ''} onChange={e => setLessonForm({...lessonForm, amount: e.target.value})} />
              </Field>
              <Field label="Ödeme Durumu">
                <select value={lessonForm.payment_status || 'unpaid'} onChange={e => setLessonForm({...lessonForm, payment_status: e.target.value})}>
                  <option value="unpaid">Ödenmedi</option>
                  <option value="paid">Ödendi</option>
                </select>
              </Field>
            </div>
            <Field label="Notlar">
              <textarea rows={2} value={lessonForm.notes || ''} placeholder="İsteğe bağlı not…"
                onChange={e => setLessonForm({...lessonForm, notes: e.target.value})}
                style={{ resize: 'vertical' }} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KORTLAR
// ═══════════════════════════════════════════════════════════════
function CourtsScreen({ clubId }) {
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
        .eq('court_id', courtId).gte('start_time', start).lte('start_time', end),
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
    setForm({ court_number: '', court_type: 'clay', surface: 'clay', hourly_rate: '', is_active: true, is_indoor: false, campaign_enabled: false, campaign_price: '', campaign_start_hour: 9, campaign_end_hour: 12 });
    setModal({ type: 'add' });
  };

  const openEdit = (court) => {
    setForm({
      ...court,
      campaign_enabled:    court.campaign_price != null,
      campaign_price:      court.campaign_price != null ? String(court.campaign_price) : '',
      campaign_start_hour: court.campaign_start_hour ?? 9,
      campaign_end_hour:   court.campaign_end_hour   ?? 12,
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
    try {
      if ((closureForm.start_hour ?? 9) >= (closureForm.end_hour ?? 10)) {
        alert('Bitiş saati başlangıç saatinden büyük olmalı');
        setSaving(false);
        return;
      }
      const autoReason = (closureForm.reason || '').trim() || SESSION_TYPE_LABELS[closureForm.session_type || 'other'];
      let effectiveCoachId = closureForm.coach_id || null;
      const selectedGroup = closureForm.group_id ? closureGroups.find(g => g.id === closureForm.group_id) : null;
      if (selectedGroup?.coach_id && !effectiveCoachId) effectiveCoachId = selectedGroup.coach_id;

      const payload = {
        court_id:     closureModal.courtId,
        closure_type: closureForm.closure_type || 'recurring_weekly',
        start_hour:   closureForm.start_hour ?? 9,
        end_hour:     closureForm.end_hour   ?? 10,
        reason:       autoReason,
        coach_id:     effectiveCoachId || null,
        group_id:     closureForm.group_id || null,
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
      loadCourtClosures(closureModal.courtId);
      setClosureForm({ closure_type:'recurring_weekly', session_type:'training', day_of_week:1, start_hour:9, end_hour:10, start_date:'', end_date:'', reason:'', coach_id:'', group_id:'' });
      if (expanded === closureModal.courtId) loadSlots(closureModal.courtId);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
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
                </div>
              </div>
              <Switch on={court.is_active} onChange={() => toggleActive(court)} label={court.is_active ? 'Aktif' : 'Pasif'} />
              <button className="btn btn-ghost btn-sm btn-icon" title="Düzenle" onClick={() => openEdit(court)}>
                <span className="material-icons" style={{fontSize:16}}>edit</span>
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" title="Sabit Program"
                onClick={() => {
                  setClosureForm({ closure_type:'recurring_weekly', session_type:'training', day_of_week:1, start_hour:9, end_hour:10, start_date:'', end_date:'', reason:'', coach_id:'', group_id:'' });
                  loadClosureCoaches();
                  loadClosureGroups();
                  loadCourtClosures(court.id);
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
                        <div key={h} className={`court-slot ${st}`}>
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
                          {String(cl.start_hour).padStart(2,'0')}:00 – {String(cl.end_hour).padStart(2,'0')}:00
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
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px' }}>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => setClosureForm(f => ({ ...f, start_hour: Math.max(0, (f.start_hour ?? 9) - 1) }))}>
                    <span className="material-icons" style={{ fontSize:16 }}>remove</span>
                  </button>
                  <span style={{ fontWeight:700, fontSize:15, minWidth:40, textAlign:'center' }}>
                    {String(closureForm.start_hour ?? 9).padStart(2,'0')}:00
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => setClosureForm(f => ({ ...f, start_hour: Math.min(22, (f.start_hour ?? 9) + 1) }))}>
                    <span className="material-icons" style={{ fontSize:16 }}>add</span>
                  </button>
                </div>
                <span className="material-icons" style={{ color:'var(--text-2)' }}>arrow_forward</span>
                <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px' }}>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => setClosureForm(f => ({ ...f, end_hour: Math.max(1, (f.end_hour ?? 10) - 1) }))}>
                    <span className="material-icons" style={{ fontSize:16 }}>remove</span>
                  </button>
                  <span style={{ fontWeight:700, fontSize:15, minWidth:40, textAlign:'center' }}>
                    {String(closureForm.end_hour ?? 10).padStart(2,'0')}:00
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => setClosureForm(f => ({ ...f, end_hour: Math.min(23, (f.end_hour ?? 10) + 1) }))}>
                    <span className="material-icons" style={{ fontSize:16 }}>add</span>
                  </button>
                </div>
              </div>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

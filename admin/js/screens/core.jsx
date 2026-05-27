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

function lesson_court_row(lesson, courts) {
  if (lesson.court_id) return courts.find(c => c.id === lesson.court_id);
  const m = (lesson.location || '').match(/Kort\s*(\d+)/i);
  return m ? courts.find(c => c.court_number === parseInt(m[1])) : null;
}

// ═══════════════════════════════════════════════════════════════
// REZERVASYONLAR
// ═══════════════════════════════════════════════════════════════
function ReservationsScreen({ clubId, setScreen }) {
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
  const [lessonMarkingId,    setLessonMarkingId]    = useState(null);
  const [lessonPlayerSearch,   setLessonPlayerSearch]   = useState('');
  const [lessonPlayerResults,  setLessonPlayerResults]  = useState([]);
  const [lessonSelectedPlayer, setLessonSelectedPlayer] = useState(null);

  useEffect(() => { if (clubId) { loadCourts(); loadDotDates(); } }, [clubId]);
  useEffect(() => { if (clubId) loadDay(); }, [clubId, selDate]);
  useEffect(() => { if (clubId && mainTab === 'lessons') loadLessons(); }, [clubId, mainTab, selDate]);

  // Kortlar ekranından slot tıklayarak gelen rezervasyon prefill
  useEffect(() => {
    const p = window.__slotPrefill;
    if (!p) return;
    if (p.type === 'reservation') {
      window.__slotPrefill = null;
      setForm({ start_time: `${p.date}T${p.start_time}`, end_time: `${p.date}T${p.end_time}`, court_id: p.court_id, status: 'confirmed', notes: '' });
      setModal({ type: 'add' });
    } else if (p.type === 'lesson') {
      // Özel ders: coaches yüklendikten sonra açılacak — loadLessons içinde handle ediliyor
      setMainTab('lessons');
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
    const { data } = await sb.from('courts').select('id,court_number,court_type,hourly_rate').eq('club_id', clubId).eq('is_active', true);
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
      const startDb = localTimeToDb(startDt.toISOString());
      const endDb   = localTimeToDb(endDt.toISOString());
      const { data, error } = await sb
        .from('bookings')
        .select('*, courts!bookings_court_id_fkey(court_number,court_type), booking_players!booking_players_booking_id_fkey(player_id, is_primary_player, profiles!booking_players_player_id_fkey(id,full_name,email))')
        .in('court_id', courtIds)
        .neq('status', 'cancelled')
        .gte('start_time', startDb)
        .lte('start_time', endDb)
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

  const updateStatus = async (id, status, booking) => {
    try {
      if (status === 'cancelled') {
        if (!confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?')) return;
        const { error } = await sb.from('bookings').update({ status }).eq('id', id);
        if (error) throw error;
        if (booking?.user_id) {
          await sb.from('notifications').insert({
            user_id: booking.user_id,
            title:   'Rezervasyon İptal Edildi',
            message: 'Rezervasyonunuz kulüp tarafından iptal edildi.',
            type:    'reservation_cancelled',
            data:    { booking_id: id },
          });
        }
      } else {
        const { error } = await sb.from('bookings').update({ status }).eq('id', id);
        if (error) throw error;
        if (status === 'confirmed' && booking?.user_id) {
          await sb.from('notifications').insert({
            user_id: booking.user_id,
            title:   'Rezervasyon Onaylandı',
            message: 'Rezervasyonunuz kulüp tarafından onaylandı.',
            type:    'reservation_confirmed',
            data:    { booking_id: id },
          });
        }
      }
      loadDay();
    } catch (e) { alert(e.message); }
  };

  const markBookingPaid = async (booking) => {
    const amount = Number(booking.total_amount) || 0;
    const amtStr = amount > 0 ? `\n\nTutar: ₺${amount.toLocaleString('tr-TR')}` : '';
    if (!confirm(`Bu rezervasyon için ödeme alındı mı?${amtStr}`)) return;
    try {
      const { error } = await sb.from('bookings').update({ payment_status: 'paid' }).eq('id', booking.id);
      if (error) throw error;
      if (amount > 0) {
        const playerName = booking.booking_players?.find(p => p.is_primary_player)?.profiles?.full_name
          || booking.booking_players?.[0]?.profiles?.full_name || 'Misafir';
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
    const dt = selDate + 'T09:00';
    setForm({ start_time: dt, end_time: selDate + 'T10:00', court_id: courts[0]?.id || '', status: 'confirmed', notes: '' });
    setModal({ type: 'add' });
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

      const [{ data: bConflict }, { data: mConflict }, { data: closures }] = await Promise.all([
        sb.from('bookings').select('id').eq('court_id', form.court_id)
          .in('status', ['pending', 'confirmed']).lt('start_time', endDb).gt('end_time', startDb),
        sb.from('club_manual_lessons').select('id, start_time, end_time')
          .eq('court_id', form.court_id).eq('date', dateStr),
        sb.from('court_closures').select('*').eq('court_id', form.court_id).eq('is_active', true),
      ]);

      if (bConflict?.length > 0) { alert('Bu kort seçilen saatte zaten rezerve edilmiş.'); return; }

      const hasManualConflict = (mConflict || []).some(l => {
        const ls = (l.start_time || '').slice(0, 5);
        const le = (l.end_time   || '').slice(0, 5);
        return ls < endHH && le > startHH;
      });
      if (hasManualConflict) { alert('Bu kort seçilen saatte planlanmış bir ders var.'); return; }

      const dow = new Date(dateStr + 'T12:00:00').getDay();
      const closureBlock = (closures || []).some(cl => {
        const cs = String(cl.start_hour ?? 0).padStart(2,'0') + ':00';
        const ce = String(cl.end_hour   ?? 0).padStart(2,'0') + ':00';
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
    }
  }, [lessonModal]);

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
        sb.from('club_coaches').select('id, full_name, hourly_rate').eq('club_id', clubId),
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

      // 1) club_manual_lessons tablosu — kulüp yöneticisinin eklediği manuel dersler
      const { data: manual } = await sb.from('club_manual_lessons')
        .select('*, club_coaches(full_name)')
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
          court_id:       m.court_id || null,
          court_fee:      m.court_fee || 0,
          location:       m.location || '—',
          source:         'manual',
          payment_status: m.payment_status || 'unpaid',
          amount:         m.amount || 0,
        });
      });

      // 3) lessons tablosu — koçların oluşturduğu dersler
      if (myCoachIds.length > 0) {
        const { data: directLessons } = await sb.from('lessons')
          .select('id, start_time, end_time, student_name, club_coach_id, amount, payment_status, courts(court_number)')
          .in('club_coach_id', myCoachIds)
          .neq('status', 'cancelled')
          .gte('start_time', dbStart)
          .lte('start_time', dbEnd);

        const lessonIds = (directLessons || []).map(l => l.id);
        let pkgLessonIds = new Set();
        if (lessonIds.length > 0) {
          const { data: pkgSessions } = await sb.from('lesson_package_sessions')
            .select('lesson_id').in('lesson_id', lessonIds);
          pkgLessonIds = new Set((pkgSessions || []).map(s => s.lesson_id));
        }

        (directLessons || []).forEach(l => {
          const start = new Date(l.start_time);
          const end   = new Date(l.end_time);
          const court = Array.isArray(l.courts) ? l.courts[0] : l.courts;
          combined.push({
            id:               l.id,
            date:             start.toISOString().split('T')[0],
            start_time:       start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            end_time:         end.toLocaleTimeString('tr-TR',   { hour: '2-digit', minute: '2-digit' }),
            student_name:     l.student_name || null,
            coach_name:       l.club_coach_id ? (coachMap.get(l.club_coach_id) || 'Antrenör') : 'Antrenör',
            coach_id:         l.club_coach_id || null,
            location:         court?.court_number ? `Kort ${court.court_number}` : '—',
            source:           'lesson',
            payment_status:   l.payment_status === 'paid' ? 'paid' : 'unpaid',
            amount:           l.amount || null,
            is_package_lesson: pkgLessonIds.has(l.id),
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

      const [{ data: bConflict }, { data: mConflict }, { data: closures }] = await Promise.all([
        sb.from('bookings').select('id').eq('court_id', lessonForm.court_id)
          .neq('status', 'cancelled').lt('start_time', endDb).gt('end_time', startDb),
        sb.from('club_manual_lessons').select('id,start_time,end_time,court_id,location')
          .eq('club_id', clubId).eq('date', dateStr),
        sb.from('court_closures').select('*').eq('court_id', lessonForm.court_id).eq('is_active', true),
      ]);

      if (bConflict?.length > 0) { alert('Bu kort seçilen saatte zaten rezerve edilmiş.'); return; }

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
        const cs = String(cl.start_hour ?? 0).padStart(2,'0') + ':00';
        const ce = String(cl.end_hour   ?? 0).padStart(2,'0') + ':00';
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

        // Grup dersi / program bloğu çakışması (court_closures.coach_id) — mobil ile aynı
        const { data: coachClosures } = await sb.from('court_closures')
          .select('closure_type, day_of_week, start_hour, end_hour, start_date, end_date, reason')
          .eq('coach_id', lessonForm.coach_id)
          .eq('is_active', true);

        const conflicts = [];
        for (const cl of coachClosures || []) {
          const clStart = (cl.start_hour || 0) * 60;
          const clEnd   = (cl.end_hour   || 0) * 60;
          if (startMin >= clEnd || endMin <= clStart) continue;
          if (cl.closure_type === 'recurring_weekly' && cl.day_of_week === lessonDow) {
            conflicts.push(`Grup Programı: ${cl.reason || 'Antrenman'} · ${String(cl.start_hour).padStart(2,'0')}:00–${String(cl.end_hour).padStart(2,'0')}:00`);
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
            .neq('status', 'cancelled').lt('start_time', endDb).gt('end_time', startDb),
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
      const amountVal = lessonForm.amount ? parseFloat(String(lessonForm.amount).replace(',', '.')) : null;

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
        payment_status: lessonForm.payment_status || 'unpaid',
        amount:         amountVal,
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

  const cancelLesson = async (lesson) => {
    if (lesson.source === 'booking') { alert('Rezervasyon kaynaklı dersler buradan iptal edilemez.'); return; }
    if (!confirm('Bu dersi iptal etmek istediğinize emin misiniz?')) return;
    try {
      if (lesson.source === 'lesson') {
        if (lesson.package_session_id) {
          const { data: pkgSession } = await sb.from('lesson_package_sessions')
            .select('package_id').eq('id', lesson.package_session_id).single();
          if (pkgSession?.package_id) {
            const { data: pkg } = await sb.from('player_lesson_packages')
              .select('remaining_sessions').eq('id', pkgSession.package_id).single();
            if (pkg) {
              await sb.from('player_lesson_packages')
                .update({ remaining_sessions: (pkg.remaining_sessions || 0) + 1 })
                .eq('id', pkgSession.package_id);
            }
            await sb.from('lesson_package_sessions').delete().eq('id', lesson.package_session_id);
          }
        }
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
          : <button className="btn btn-pri" onClick={() => { setLessonForm({ date: selDate, start_time:'09:00', end_time:'10:00', payment_status:'unpaid', use_manual_coach: false }); setLessonModal({ type:'add' }); }}>
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
                      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                        {b.payment_status !== 'paid' && ['confirmed','completed'].includes(b.status) ? (
                          <button className="btn btn-success btn-sm" style={{ fontSize:11, padding:'4px 10px', display:'flex', alignItems:'center', gap:4 }}
                            onClick={() => markBookingPaid(b)}>
                            <span className="material-icons" style={{fontSize:13}}>payments</span>
                            Ödeme Al{b.total_amount > 0 ? ` · ₺${Number(b.total_amount).toLocaleString('tr-TR')}` : ''}
                          </button>
                        ) : (
                          <Badge cls={paymentClass(b.payment_status)}>{paymentLabel(b.payment_status)}</Badge>
                        )}
                        {b.status === 'confirmed' && (
                          <button className="btn btn-ghost btn-sm btn-icon" title="Tamamlandı" onClick={() => updateStatus(b.id, 'completed', b)}>
                            <span className="material-icons" style={{fontSize:15}}>done_all</span>
                          </button>
                        )}
                        {['confirmed','completed'].includes(b.status) && (
                          <button className="btn btn-danger btn-sm btn-icon" title="İptal Et" onClick={() => updateStatus(b.id, 'cancelled', b)}>
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
                        const cr = lesson_court_row(l, lessonCourts);
                        const [sh2, sm2] = (l.start_time || '0:0').split(':').map(Number);
                        const [eh2, em2] = (l.end_time   || '0:0').split(':').map(Number);
                        const dur = Math.max(0, ((eh2 * 60 + em2) - (sh2 * 60 + sm2)) / 60);
                        const courtFee = Math.round((cr?.hourly_rate || 0) * dur * 100) / 100;
                        const coachFee = Math.round((Number(l.amount) || 0) * 100) / 100;
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
            <Field label="Üye Seç (İsteğe Bağlı — Limit Kontrolü İçin)">
              <MemberLimitSearch clubId={clubId} value={form.member_id} onChange={mid => setForm({...form, member_id: mid})} />
            </Field>
            <Field label="Durum">
              <select value={form.status || 'confirmed'} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="confirmed">Rezerveli</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </Field>
          </div>
        </Modal>
      )}

      {/* Özel Ders Ekle / Düzenle Modalı — Mobil ile birebir aynı */}
      {lessonModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setLessonModal(null); }}>
          <div style={{ background:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, maxHeight:'92vh', display:'flex', flexDirection:'column', gap:0 }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <span style={{ fontSize:18, fontWeight:800, color:'var(--text-1)' }}>
                {lessonModal.type === 'edit' ? 'Dersi Düzenle' : 'Ders Ekle'}
              </span>
              <button style={{ background:'none', border:'none', cursor:'pointer', display:'grid', placeItems:'center' }} onClick={() => setLessonModal(null)}>
                <span className="material-icons" style={{ fontSize:24, color:'var(--text-2)' }}>close</span>
              </button>
            </div>

            <div style={{ overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:0 }}>
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

              {/* ── Ders Ücreti ──────────────────────────────── */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>DERS ÜCRETİ (opsiyonel)</div>
              <div style={{ display:'flex', alignItems:'center', border:'1.5px solid var(--border)', borderRadius:12, background:'var(--bg)', paddingLeft:12, marginBottom:16 }}>
                <span style={{ fontSize:16, fontWeight:700, color:'var(--text-2)', marginRight:4 }}>₺</span>
                <input type="number" min="0" step="0.01" style={{ flex:1, border:'none', background:'transparent', padding:'11px 12px 11px 0', fontSize:15, color:'var(--text-1)', outline:'none' }}
                  placeholder="0,00" value={lessonForm.amount || ''}
                  onChange={e => setLessonForm({...lessonForm, amount: e.target.value})} />
              </div>

              {/* ── Ödeme Durumu ─────────────────────────────── */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>ÖDEME DURUMU</div>
              <div style={{ display:'flex', gap:10, marginBottom:20 }}>
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
        is_active:    true,
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
      setClosureForm({ closure_type:'one_time', session_type:'maintenance', reason:'Kapalı', day_of_week:new Date(slotDate+'T12:00').getDay(), start_hour:hour, end_hour:hour+1, start_date:slotDate, end_date:slotDate, coach_id:'', group_id:'' });
      loadClosureCoaches();
      loadClosureGroups();
      loadCourtClosures(courtId);
      setClosureModal({ courtId });
    } else if (type === 'group') {
      setClosureForm({ closure_type:'one_time', session_type:'training', reason:'Grup Dersi', day_of_week:new Date(slotDate+'T12:00').getDay(), start_hour:hour, end_hour:hour+1, start_date:slotDate, end_date:slotDate, coach_id:'', group_id:'' });
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

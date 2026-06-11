// ── Ek Ekranlar: Yorumlar, Ders Talepleri, Cüzdan, Notlar, Program, Kafe, Pratik Maç, Bildirim Tercihleri ──

// ═══════════════════════════════════════════════════════════════
// KULÜP YORUMLARI
// ═══════════════════════════════════════════════════════════════
function ClubReviewsScreen({ clubId }) {
  const { useState, useEffect, useMemo } = React;
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [reply,    setReply]    = useState(null); // { reviewId, text }

  useEffect(() => { if (clubId) load(); }, [clubId]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await sb.from('club_reviews')
        .select('*, reviewer:profiles!club_reviews_reviewer_id_fkey(id, full_name, profile_photo_url)')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      setReviews(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const stats = useMemo(() => {
    if (!reviews.length) return { avg: 0, dist: { 5:0, 4:0, 3:0, 2:0, 1:0 }, total: 0 };
    const dist = { 5:0, 4:0, 3:0, 2:0, 1:0 };
    let sum = 0;
    reviews.forEach(r => {
      const star = Math.round(r.rating || 0);
      if (star >= 1 && star <= 5) dist[star]++;
      sum += r.rating || 0;
    });
    return { avg: sum / reviews.length, dist, total: reviews.length };
  }, [reviews]);

  const Stars = ({ rating, size = 16 }) => {
    const full  = Math.floor(rating);
    const half  = rating - full >= 0.5;
    return (
      <span style={{ display:'inline-flex', gap:1 }}>
        {[1,2,3,4,5].map(i => (
          <span key={i} className="material-icons"
            style={{ fontSize:size, color: i <= full ? '#F59E0B' : (i === full+1 && half) ? '#F59E0B' : '#D1D5DB' }}>
            {i <= full ? 'star' : (i === full+1 && half) ? 'star_half' : 'star_outline'}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Kulüp Yorumları</h1>
          <div className="sub">{stats.total} yorum · Ortalama {stats.avg.toFixed(1)} puan</div>
        </div>
        <button className="btn btn-ghost" onClick={load}>
          <span className="material-icons">refresh</span>
        </button>
      </div>

      {/* Puan özeti */}
      {stats.total > 0 && (
        <div className="card" style={{ display:'flex', gap:24, alignItems:'center', marginBottom:14, flexWrap:'wrap' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:80 }}>
            <div style={{ fontSize:48, fontWeight:900, color:'var(--brand-navy)', lineHeight:1 }}>{stats.avg.toFixed(1)}</div>
            <Stars rating={stats.avg} size={18} />
            <div style={{ fontSize:12, color:'var(--text-2)', marginTop:4 }}>{stats.total} yorum</div>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6, minWidth:160 }}>
            {[5,4,3,2,1].map(star => {
              const pct = stats.total > 0 ? (stats.dist[star] / stats.total) * 100 : 0;
              return (
                <div key={star} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', width:14, textAlign:'right' }}>{star}</span>
                  <span className="material-icons" style={{ fontSize:14, color:'#F59E0B' }}>star</span>
                  <div style={{ flex:1, height:8, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:'#F59E0B', borderRadius:4, transition:'width 400ms' }} />
                  </div>
                  <span style={{ fontSize:11, color:'var(--text-2)', width:20 }}>{stats.dist[star]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Yorum listesi */}
      <div className="table-wrap">
        {loading ? <Spinner /> : reviews.length === 0 ? (
          <EmptyState icon="star_outline" title="Henüz yorum yok" sub="Kulübünüze yapılan yorumlar burada görünecek." />
        ) : (
          <div>
            {reviews.map((r, i) => {
              const name = r.reviewer?.full_name || 'Anonim';
              const date = r.created_at ? new Date(r.created_at).toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric' }) : '';
              return (
                <div key={r.id} style={{ padding:'16px', borderBottom: i < reviews.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <Av name={name} size={36} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:700, fontSize:14 }}>{name}</span>
                        <Stars rating={r.rating || 0} size={14} />
                        <span style={{ fontSize:11, color:'var(--text-2)', marginLeft:'auto' }}>{date}</span>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize:13, color:'var(--text-1)', margin:'6px 0 0', lineHeight:1.5 }}>{r.comment}</p>
                      )}
                      {r.club_reply && (
                        <div style={{ background:'var(--bg)', borderRadius:8, padding:'8px 12px', marginTop:8, borderLeft:'3px solid var(--brand-navy)' }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'var(--brand-navy)', marginBottom:4 }}>Kulüp Yanıtı</div>
                          <p style={{ fontSize:13, color:'var(--text-1)', margin:0 }}>{r.club_reply}</p>
                        </div>
                      )}
                      {!r.club_reply && (
                        <button className="btn btn-ghost btn-sm" style={{ marginTop:8 }}
                          onClick={() => setReply({ reviewId: r.id, text: '' })}>
                          <span className="material-icons" style={{ fontSize:13 }}>reply</span> Yanıtla
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Yanıt Modalı */}
      {reply && (
        <Modal title="Yoruma Yanıt Ver" onClose={() => setReply(null)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setReply(null)}>Vazgeç</button>
            <button className="btn btn-pri btn-sm" onClick={async () => {
              if (!reply.text.trim()) { alert('Yanıt metni boş olamaz.'); return; }
              await sb.from('club_reviews').update({ club_reply: reply.text.trim() }).eq('id', reply.reviewId);
              setReply(null);
              load();
            }}>Gönder</button>
          </>
        }>
          <Field label="Yanıtınız">
            <textarea rows={4} placeholder="Yoruma yanıtınızı yazın…"
              value={reply.text} onChange={e => setReply({ ...reply, text: e.target.value })}
              style={{ resize:'vertical' }} />
          </Field>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DERS TALEPLERİ
// ═══════════════════════════════════════════════════════════════
function LessonRequestsScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('pending');
  const [coaches,  setCoaches]  = useState([]);

  useEffect(() => { if (clubId) load(); }, [clubId]);

  const load = async () => {
    setLoading(true);
    try {
      const [coachRes, courtIds] = await Promise.all([
        sb.from('club_coaches').select('id, full_name').eq('club_id', clubId).eq('is_active', true),
        getClubCourtIds(clubId),
      ]);
      setCoaches(coachRes.data || []);

      // Kulüpteki tüm antrenörlerin talepleri
      const coachIds = (coachRes.data || []).map(c => c.id);
      if (coachIds.length === 0) { setRequests([]); setLoading(false); return; }

      const { data } = await sb.from('lesson_requests')
        .select('*, player:profiles!lesson_requests_player_id_fkey(id, full_name, email, profile_photo_url), coach:club_coaches!lesson_requests_coach_id_fkey(id, full_name)')
        .in('coach_id', coachIds)
        .order('created_at', { ascending: false });
      setRequests(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    const labels = { accepted: 'kabul edilsin', rejected: 'reddedilsin', completed: 'tamamlandı olarak işaretlensin' };
    if (!confirm(`Bu talep ${labels[status] || status} mi?`)) return;
    try {
      await sb.from('lesson_requests').update({ status }).eq('id', id);
      load();
    } catch (e) { alert(e.message); }
  };

  const STATUS_LABELS = { pending: 'Bekliyor', accepted: 'Kabul', rejected: 'Red', completed: 'Tamamlandı' };
  const STATUS_CLS    = { pending: 'b-warning', accepted: 'b-success', rejected: 'b-danger', completed: 'b-muted' };

  const TAB_ITEMS = [
    { key: 'pending',   label: 'Bekliyor',    count: requests.filter(r => r.status === 'pending').length },
    { key: 'accepted',  label: 'Kabul Edilen',count: requests.filter(r => r.status === 'accepted').length },
    { key: 'completed', label: 'Tamamlanan',  count: requests.filter(r => r.status === 'completed').length },
    { key: 'rejected',  label: 'Reddedilen',  count: requests.filter(r => r.status === 'rejected').length },
    { key: 'all',       label: 'Tümü',        count: requests.length },
  ];

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Ders Talepleri</h1>
          <div className="sub">{requests.filter(r => r.status === 'pending').length} bekleyen talep</div>
        </div>
        <button className="btn btn-ghost" onClick={load}>
          <span className="material-icons">refresh</span>
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <Tabs items={TAB_ITEMS} active={filter} onChange={setFilter} />
        </div>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="school" title="Talep bulunamadı" sub="Bu kategoride ders talebi yok." />
        ) : (
          <div>
            {filtered.map((r, i) => {
              const playerName = r.player?.full_name || 'Bilinmiyor';
              const coachName  = r.coach?.full_name  || 'Antrenör atanmamış';
              const date = r.requested_date
                ? new Date(r.requested_date).toLocaleDateString('tr-TR', { weekday:'short', day:'2-digit', month:'short' })
                : 'Tarih belirtilmemiş';
              return (
                <div key={r.id} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <Av name={playerName} size={38} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontWeight:700, fontSize:14 }}>{playerName}</span>
                      <Badge cls={STATUS_CLS[r.status] || ''}>{STATUS_LABELS[r.status] || r.status}</Badge>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-2)', marginTop:4, display:'flex', gap:10, flexWrap:'wrap' }}>
                      <span><span className="material-icons" style={{ fontSize:12, verticalAlign:'middle' }}>person</span> {coachName}</span>
                      <span><span className="material-icons" style={{ fontSize:12, verticalAlign:'middle' }}>calendar_today</span> {date}</span>
                      {r.duration_minutes && <span>{r.duration_minutes} dk</span>}
                    </div>
                    {r.notes && <p style={{ fontSize:12, color:'var(--text-2)', margin:'6px 0 0' }}>"{r.notes}"</p>}
                  </div>
                  {r.status === 'pending' && (
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button className="btn btn-success btn-sm" onClick={() => updateStatus(r.id, 'accepted')}>
                        <span className="material-icons" style={{ fontSize:13 }}>check</span> Kabul
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => updateStatus(r.id, 'rejected')}>Red</button>
                    </div>
                  )}
                  {r.status === 'accepted' && (
                    <button className="btn btn-ghost btn-sm" style={{ flexShrink:0 }} onClick={() => updateStatus(r.id, 'completed')}>
                      <span className="material-icons" style={{ fontSize:13 }}>done_all</span> Tamamla
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KULÜP CÜZDANI
// ═══════════════════════════════════════════════════════════════
function ClubWalletScreen({ clubId }) {
  const { useState, useEffect, useMemo } = React;
  const [finances,   setFinances]   = useState([]);
  const [bookings,   setBookings]   = useState([]);
  const [earnings,   setEarnings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [period,     setPeriod]     = useState('month'); // week | month | year | all

  useEffect(() => { if (clubId) load(); }, [clubId]);

  const load = async () => {
    setLoading(true);
    try {
      const courtIds = await getClubCourtIds(clubId);
      const [finRes, bkRes, earnRes] = await Promise.all([
        sb.from('club_finances').select('*').eq('club_id', clubId).order('created_at', { ascending: false }),
        courtIds.length > 0
          ? sb.from('bookings').select('id,total_amount,payment_status,status,start_time').in('court_id', courtIds)
          : Promise.resolve({ data: [] }),
        sb.from('coach_earnings').select('*').eq('club_id', clubId),
      ]);
      setFinances(finRes.data || []);
      setBookings(bkRes.data || []);
      setEarnings(earnRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filterDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (period === 'week')  { const ago = new Date(now); ago.setDate(now.getDate()-7); return d >= ago; }
    if (period === 'month') { const ago = new Date(now); ago.setMonth(now.getMonth()-1); return d >= ago; }
    if (period === 'year')  { const ago = new Date(now); ago.setFullYear(now.getFullYear()-1); return d >= ago; }
    return true;
  };

  const stats = useMemo(() => {
    const fin = finances.filter(f => filterDate(f.date || f.created_at));
    const bk  = bookings.filter(b => filterDate(b.start_time));
    const earn = earnings.filter(e => filterDate(e.date || e.created_at));

    const totalIncome   = fin.filter(f => f.type === 'income').reduce((s, f) => s + (f.amount||0), 0);
    const totalExpenses = fin.filter(f => f.type === 'expense').reduce((s, f) => s + (f.amount||0), 0);
    const pendingBk     = bk.filter(b => b.payment_status !== 'paid' && b.status === 'confirmed');
    const pendingRevenue= pendingBk.reduce((s, b) => s + (b.total_amount||0), 0);
    const unpaidEarnings= earn.filter(e => e.payment_status === 'unpaid').reduce((s, e) => s + (e.amount||0), 0);

    return {
      totalIncome, totalExpenses,
      netProfit:      totalIncome - totalExpenses,
      pendingRevenue, pendingCount: pendingBk.length,
      unpaidEarnings,
    };
  }, [finances, bookings, earnings, period]);

  const PERIOD_OPTS = [
    { v:'week',  l:'Bu Hafta' },
    { v:'month', l:'Bu Ay'    },
    { v:'year',  l:'Bu Yıl'   },
    { v:'all',   l:'Tümü'     },
  ];

  const netPos = stats.netProfit >= 0;

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Kulüp Cüzdanı</h1>
          <div className="sub">Gelir, gider ve bekleyen ödemelerin özeti</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {PERIOD_OPTS.map(o => (
            <button key={o.v} className={`btn btn-sm ${period === o.v ? 'btn-pri' : 'btn-ghost'}`}
              onClick={() => setPeriod(o.v)}>{o.l}</button>
          ))}
        </div>
      </div>

      {/* Net kâr banner */}
      <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)', borderRadius:16, padding:'20px 24px', marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:1 }}>NET KAR / ZARAR</div>
        <div style={{ fontSize:36, fontWeight:900, color:'#fff', marginTop:4 }}>{fmtMoney(Math.abs(stats.netProfit))}</div>
        <span style={{ background: netPos ? '#22C55E' : '#EF4444', color:'#fff', borderRadius:999, padding:'4px 12px', fontSize:11, fontWeight:700 }}>
          {netPos ? '↑ KAR' : '↓ ZARAR'}
        </span>
      </div>

      {/* Stat grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10, marginBottom:14 }}>
        {[
          { icon:'trending_up',           color:'#22C55E', bg:'#F0FDF4', label:'Toplam Gelir',          val: fmtMoney(stats.totalIncome)   },
          { icon:'trending_down',         color:'#EF4444', bg:'#FEF2F2', label:'Toplam Gider',          val: fmtMoney(stats.totalExpenses) },
          { icon:'account_balance_wallet',color:'#3B82F6', bg:'#EFF6FF', label:`Tahsil Edilecek (${stats.pendingCount})`, val: fmtMoney(stats.pendingRevenue) },
          { icon:'school',                color:'#F97316', bg:'#FFF7ED', label:'Bekleyen Hoca Hakedişi', val: fmtMoney(stats.unpaidEarnings) },
        ].map((s, i) => (
          <div key={i} className="card" style={{ gap:6, borderLeft:`3px solid ${s.color}` }}>
            <div style={{ width:32, height:32, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-icons" style={{ color:s.color, fontSize:17 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--text-2)', letterSpacing:0.3 }}>{s.label}</div>
            <div style={{ fontSize:17, fontWeight:800, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Son işlemler */}
      <div className="table-wrap">
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontWeight:700, fontSize:15 }}>Son İşlemler</div>
        {loading ? <Spinner /> : finances.filter(f => filterDate(f.date || f.created_at)).length === 0 ? (
          <EmptyState icon="receipt_long" title="İşlem bulunamadı" sub="Seçilen dönem için kayıt yok." />
        ) : (
          <div>
            {finances.filter(f => filterDate(f.date || f.created_at)).slice(0, 20).map((r, i, arr) => {
              const isIncome = r.type === 'income';
              return (
                <div key={r.id} style={{ display:'flex', alignItems:'center', padding:'12px 16px', gap:12, borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background: isIncome ? '#DCFCE7' : '#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span className="material-icons" style={{ color: isIncome ? '#22C55E' : '#EF4444', fontSize:18 }}>
                      {isIncome ? 'trending_up' : 'trending_down'}
                    </span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{r.category}</div>
                    <div style={{ fontSize:11, color:'var(--text-2)' }}>{fmtDate(r.date || r.created_at?.split('T')[0])}</div>
                  </div>
                  <div style={{ fontWeight:700, fontSize:14, color: isIncome ? '#22C55E' : '#EF4444' }}>
                    {isIncome ? '+' : '–'}{fmtMoney(r.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ÖĞRENCİ NOTLARI
// ═══════════════════════════════════════════════════════════════
function StudentNotesScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [notes,    setNotes]    = useState([]);
  const [coaches,  setCoaches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [coachFilter, setCoachFilter] = useState('');

  useEffect(() => { if (clubId) load(); }, [clubId]);

  const load = async () => {
    setLoading(true);
    try {
      const [noteRes, coachRes] = await Promise.all([
        sb.from('student_notes')
          .select('*, coach:club_coaches!student_notes_coach_id_fkey(id, full_name)')
          .eq('club_id', clubId)
          .order('created_at', { ascending: false }),
        sb.from('club_coaches').select('id, full_name').eq('club_id', clubId).eq('is_active', true),
      ]);
      setNotes(noteRes.data || []);
      setCoaches(coachRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.student_name?.trim()) { alert('Öğrenci adı zorunludur.'); return; }
    if (!form.note?.trim())         { alert('Not içeriği zorunludur.'); return; }
    setSaving(true);
    try {
      if (form.id) {
        await sb.from('student_notes').update({ student_name: form.student_name.trim(), note: form.note.trim(), coach_id: form.coach_id || null }).eq('id', form.id);
      } else {
        await sb.from('student_notes').insert({ club_id: clubId, student_name: form.student_name.trim(), note: form.note.trim(), coach_id: form.coach_id || null });
      }
      setModal(null);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
    await sb.from('student_notes').delete().eq('id', id);
    load();
  };

  const filtered = notes.filter(n => {
    if (coachFilter && n.coach_id !== coachFilter) return false;
    if (search && !n.student_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Öğrenci Notları</h1>
          <div className="sub">{notes.length} not kaydı</div>
        </div>
        <button className="btn btn-pri" onClick={() => { setForm({}); setModal('add'); }}>
          <span className="material-icons">add</span> Not Ekle
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <div className="search" style={{ flex:1, minWidth:160 }}>
            <span className="material-icons">search</span>
            <input placeholder="Öğrenci adı ara…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={coachFilter} onChange={e => setCoachFilter(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:8, border:'1.5px solid var(--border)', fontSize:13, background:'var(--bg)', color:'var(--text-1)' }}>
            <option value="">Tüm Antrenörler</option>
            {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="sticky_note_2" title="Not bulunamadı" sub="Öğrenci notları eklemek için + butonunu kullanın." />
        ) : (
          <div>
            {filtered.map((n, i) => (
              <div key={n.id} style={{ padding:'14px 16px', borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span className="material-icons" style={{ color:'var(--brand-navy)', fontSize:18 }}>person</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                      <span style={{ fontWeight:700, fontSize:14 }}>{n.student_name}</span>
                      {n.coach && <span style={{ fontSize:11, color:'var(--text-2)' }}>— {n.coach.full_name}</span>}
                      <span style={{ fontSize:11, color:'var(--text-2)', marginLeft:'auto' }}>{fmtDate(n.created_at?.split('T')[0])}</span>
                    </div>
                    <p style={{ fontSize:13, color:'var(--text-1)', margin:'6px 0 0', lineHeight:1.5 }}>{n.note}</p>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setForm({ ...n }); setModal('edit'); }}>
                      <span className="material-icons" style={{ fontSize:14 }}>edit</span>
                    </button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => del(n.id)}>
                      <span className="material-icons" style={{ fontSize:14 }}>delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'edit' ? 'Notu Düzenle' : 'Yeni Not Ekle'} wide
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={save} disabled={saving}>
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </>
          }>
          <div className="fields" style={{ gap:14 }}>
            <Field label="Öğrenci Adı *">
              <input placeholder="Ad Soyad" value={form.student_name || ''} onChange={e => setForm({...form, student_name: e.target.value})} />
            </Field>
            <Field label="Antrenör">
              <select value={form.coach_id || ''} onChange={e => setForm({...form, coach_id: e.target.value})}>
                <option value="">Antrenör seçin (isteğe bağlı)</option>
                {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </Field>
            <Field label="Not İçeriği *">
              <textarea rows={5} placeholder="Öğrenci hakkında notunuzu yazın…"
                value={form.note || ''} onChange={e => setForm({...form, note: e.target.value})}
                style={{ resize:'vertical' }} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROGRAM — Google Calendar benzeri günlük takvim
// Mobil MyProgramScreen.tsx yapısının birebir kopyası:
// Tüm veriler tek seferde çekilir, tarih filtresi JS'de useMemo ile yapılır.
// ═══════════════════════════════════════════════════════════════
function MyProgramScreen({ clubId, setScreen }) {
  const { useState, useEffect, useMemo } = React;
  const [selDate,    setSelDate]    = useState(todayISO());
  const [courts,     setCourts]     = useState([]);
  const [selCourtId, setSelCourtId] = useState(null);
  const [loading,    setLoading]    = useState(true);

  // Slot tıklama / sürükleme state
  const [slotClickInfo,  setSlotClickInfo]  = useState(null); // { courtId, startHour, endHour }
  const [slotTypeModal,  setSlotTypeModal]  = useState(false);
  const [closureGroups,  setClosureGroups]  = useState([]);
  const [closureType,    setClosureType]    = useState(null); // 'closure' | 'group'
  const [selectedGroup,  setSelectedGroup]  = useState('');
  const [slotSaving,     setSlotSaving]     = useState(false);
  const [dragState,      setDragState]      = useState(null); // { courtId, startHour, currentHour }

  // Inline rezervasyon modalı
  const [bookingModal,         setBookingModal]         = useState(false);
  const [bookingForm,          setBookingForm]          = useState({});
  const [bookingAvailCourts,   setBookingAvailCourts]   = useState([]);
  const [bookingCourtsLoading, setBookingCourtsLoading] = useState(false);
  const [bookingSaving,        setBookingSaving]        = useState(false);
  const [bookingMemberId,      setBookingMemberId]      = useState(null);
  const [bookingMemberName,    setBookingMemberName]    = useState('');
  const [bookingMemberQuery,   setBookingMemberQuery]   = useState('');
  const [bookingMemberResults, setBookingMemberResults] = useState([]);
  const [bookingMemberLoading, setBookingMemberLoading] = useState(false);

  // Müşteri (CRM) arama — program ekranı
  const [bookingCustomerId,      setBookingCustomerId]      = useState(null);
  const [bookingCustomerName,    setBookingCustomerName]    = useState('');
  const [bookingCustomerQuery,   setBookingCustomerQuery]   = useState('');
  const [bookingCustomerResults, setBookingCustomerResults] = useState([]);
  const [bookingPersonMode,      setBookingPersonMode]      = useState('member'); // 'member' | 'customer'

  // Ham veri — sorgu yok, useMemo'da filtre var
  const [allBookings,       setAllBookings]       = useState([]);
  const [allLessons,        setAllLessons]        = useState([]);
  const [allManualLessons,  setAllManualLessons]  = useState([]);
  const [allClosureEvents,  setAllClosureEvents]  = useState([]);
  const [coachMap,          setCoachMap]          = useState(new Map());
  const [bkPlayerMap,       setBkPlayerMap]       = useState(new Map()); // bookingId → playerName

  // Rezervasyon detay / aksiyon modalı
  const [bkDetail,       setBkDetail]       = useState(null); // seçilen event objesi
  const [bkDetailSaving, setBkDetailSaving] = useState(false);

  // Ders detay / ödeme modalı
  const [lsDetail,       setLsDetail]       = useState(null);
  const [lsDetailSaving, setLsDetailSaving] = useState(false);

  // Blok / kapatma detay modalı
  const [clDetail,       setClDetail]       = useState(null);
  const [clDetailSaving, setClDetailSaving] = useState(false);
  const [clEditMode,     setClEditMode]     = useState(false);
  const [clEditForm,     setClEditForm]     = useState({ start_time: '', end_time: '' });

  // Yeni ders ekleme modalı (inline — ayrı ekrana yönlendirme yok)
  const [coachesList,       setCoachesList]       = useState([]);
  const [lsModal,           setLsModal]           = useState(null);
  const [lsForm,            setLsForm]            = useState({});
  const [lsSelectedPlayer,  setLsSelectedPlayer]  = useState(null);
  const [lsPlayerSearch,    setLsPlayerSearch]    = useState('');
  const [lsPlayerResults,   setLsPlayerResults]   = useState([]);
  const [lsPackages,        setLsPackages]        = useState([]);
  const [lsLoadingPkgs,     setLsLoadingPkgs]     = useState(false);
  const [lsUsePkg,          setLsUsePkg]          = useState(false);
  const [lsSelectedPkgId,   setLsSelectedPkgId]   = useState(null);
  const [lsSaving,          setLsSaving]          = useState(false);
  const [lsPersonMode,      setLsPersonMode]      = useState('member'); // 'member' | 'customer'
  const [lsSelectedCustomer,setLsSelectedCustomer]= useState(null);
  const [lsCustomerSearch,  setLsCustomerSearch]  = useState('');
  const [lsCustomerResults, setLsCustomerResults] = useState([]);
  const [lsAutoCoachLoading,setLsAutoCoachLoading]= useState(false);

  // Grup dersi ekleme modalı (inline)
  const [grpModal,           setGrpModal]           = useState(null); // null | { type: 'add' }
  const [grpGroups,          setGrpGroups]          = useState([]);
  const [grpSelectedId,      setGrpSelectedId]      = useState('');
  const [grpSaving,          setGrpSaving]          = useState(false);
  const [grpIsRecurring,     setGrpIsRecurring]     = useState(false);
  const [grpMembers,         setGrpMembers]         = useState([]);
  const [grpGroupCoaches,    setGrpGroupCoaches]    = useState([]);
  const [grpSelectedMembers, setGrpSelectedMembers] = useState(new Set());
  const [grpSelectedCoaches, setGrpSelectedCoaches] = useState(new Set());
  const [grpLoadingDetails,  setGrpLoadingDetails]  = useState(false);

  const SLOT_H  = 64;
  const START_H = 7;
  const END_H   = 24;

  // clubId değişince veya ekrana her gelindiğinde yükle (window focus)
  useEffect(() => { if (clubId) load(); }, [clubId]);
  React.useEffect(() => {
    const onFocus = () => { if (clubId && !document.hidden) load(); };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [clubId]);

  // Paket yükleme — öğrenci + koç seçilince
  React.useEffect(() => {
    const playerId  = lsSelectedPlayer?.id;
    const coachClubId = lsForm.coach_id;
    if (!playerId || !coachClubId || lsForm.use_manual_coach) {
      setLsPackages([]); setLsUsePkg(false); setLsSelectedPkgId(null); return;
    }
    (async () => {
      setLsLoadingPkgs(true);
      try {
        const coachRec = coachesList.find(c => c.id === coachClubId);
        const individualCoachId = coachRec?.individual_coach_id;
        if (!individualCoachId) { setLsPackages([]); return; }
        const now = new Date().toISOString();
        const { data } = await sb.from('player_lesson_packages')
          .select('*, lesson_packages(name, total_lessons, price, validity_days, coach_percentage)')
          .eq('player_id', playerId).eq('coach_id', individualCoachId)
          .eq('payment_status', 'paid').eq('status', 'active')
          .or(`expiry_date.is.null,expiry_date.gt.${now}`)
          .order('created_at', { ascending: false });
        const pkgs = (data || []).map(r => ({
          ...r, package_name: r.lesson_packages?.name ?? '',
          remaining: (r.total_lessons || 0) - (r.used_lessons || 0),
        }));
        setLsPackages(pkgs);
        if (pkgs.length > 0) { setLsSelectedPkgId(pkgs[0].id); setLsUsePkg(true); setLsForm(prev => ({ ...prev, amount: '0', payment_status: 'paid' })); }
        else { setLsUsePkg(false); setLsSelectedPkgId(null); }
      } catch (e) { console.error('ls package load:', e); }
      finally { setLsLoadingPkgs(false); }
    })();
  }, [lsSelectedPlayer, lsForm.coach_id, lsForm.use_manual_coach]);

  // Grup seçilince üye + hoca listesini yükle
  React.useEffect(() => {
    if (!grpSelectedId) {
      setGrpMembers([]); setGrpGroupCoaches([]);
      setGrpSelectedMembers(new Set()); setGrpSelectedCoaches(new Set());
      return;
    }
    (async () => {
      setGrpLoadingDetails(true);
      try {
        const [{ data: membersData }, { data: coachesData }] = await Promise.all([
          sb.from('club_group_members').select('id,member_name').eq('group_id', grpSelectedId),
          sb.from('club_group_coaches').select('coach_id,club_coaches(id,full_name)').eq('group_id', grpSelectedId),
        ]);
        const members  = membersData || [];
        const coaches_ = (coachesData || []).map(gc => ({
          coach_id:   gc.coach_id,
          full_name:  gc.club_coaches?.full_name ?? 'Hoca',
        }));
        setGrpMembers(members);
        setGrpGroupCoaches(coaches_);
        setGrpSelectedMembers(new Set(members.map(m => m.id)));
        setGrpSelectedCoaches(new Set(coaches_.map(c => c.coach_id)));
      } catch (e) { console.error('grp detail load:', e); }
      finally { setGrpLoadingDetails(false); }
    })();
  }, [grpSelectedId]);

  const load = async () => {
    setLoading(true);
    try {
      // 1. Kortlar ve koçlar
      const [courtRes, coachRes] = await Promise.all([
        sb.from('courts').select('id,court_number,court_type,hourly_rate,is_indoor').eq('club_id', clubId).eq('is_active', true).order('court_number'),
        sb.from('club_coaches').select('id,full_name,individual_coach_id').eq('club_id', clubId),
      ]);
      const courts_ = courtRes.data || [];
      const coaches_ = coachRes.data || [];
      const coachMap_ = new Map(coaches_.map(c => [c.id, c.full_name]));
      setCourts(courts_);
      setCoachMap(coachMap_);
      setCoachesList(coaches_);
      const courtIds = courts_.map(c => c.id);
      if (courtIds.length === 0) { setLoading(false); return; }

      // 2. Tüm veriler paralel — tarih filtresi YOK, FK join YOK (FK adı hatalarını önler)
      const [bkRes, lessonRes, manualRes, closureRes] = await Promise.all([
        sb.from('bookings')
          .select('id,start_time,end_time,status,payment_status,total_amount,user_id,court_id')
          .in('court_id', courtIds)
          .neq('status', 'cancelled')
          .is('lesson_id', null),

        sb.from('lessons')
          .select('id,start_time,end_time,student_name,status,payment_status,amount,court_id,club_coach_id')
          .in('court_id', courtIds)
          .neq('status', 'cancelled'),

        sb.from('club_manual_lessons')
          .select('*, club_coaches(full_name)')
          .eq('club_id', clubId),

        sb.from('court_closures')
          .select('*,coach:club_coaches(id,full_name),group:club_groups(id,name)')
          .in('court_id', courtIds)
          .eq('is_active', true),
      ]);

      if (bkRes.error)     console.error('bookings error:',       bkRes.error);
      if (lessonRes.error) console.error('lessons error:',        lessonRes.error);
      if (manualRes.error) console.error('manual_lessons error:', manualRes.error);
      if (closureRes.error)console.error('closures error:',       closureRes.error);

      // 3. Kapatmaları ±90 günlük aralıkta olaya dönüştür
      const today_ = new Date();
      const closureEvents = [];
      (closureRes.data || []).forEach(cl => {
        for (let offset = -90; offset <= 90; offset++) {
          const d = new Date(today_);
          d.setDate(d.getDate() + offset);
          // Yerel tarih (YYYY-MM-DD) olarak al
          const yr  = d.getFullYear();
          const mo  = String(d.getMonth() + 1).padStart(2, '0');
          const dy  = String(d.getDate()).padStart(2, '0');
          const dateStr = `${yr}-${mo}-${dy}`;
          const dow = d.getDay();
          let applies = false;
          if (cl.closure_type === 'recurring_weekly') {
            applies = cl.day_of_week === dow;
            if (applies && cl.start_date && cl.start_date > dateStr) applies = false;
            if (applies && cl.end_date   && cl.end_date   < dateStr) applies = false;
          } else {
            applies = (!cl.start_date || cl.start_date <= dateStr) && (!cl.end_date || cl.end_date >= dateStr);
          }
          if (applies) closureEvents.push({ ...cl, _date: dateStr });
        }
      });

      // 4. Rezervasyon oyuncu adları (ayrı sorgu — FK adı sorunlarını önler)
      const bookingIds = (bkRes.data || []).map(b => b.id);
      const playerMap_ = new Map();
      if (bookingIds.length > 0) {
        const { data: bpData } = await sb.from('booking_players')
          .select('booking_id,is_primary_player,profiles(full_name)')
          .in('booking_id', bookingIds);
        (bpData || []).forEach(bp => {
          if (!playerMap_.has(bp.booking_id) || bp.is_primary_player)
            playerMap_.set(bp.booking_id, bp.profiles?.full_name || null);
        });
      }

      // Paket seans eşleştirmesi — hangi dersler paket kapsamında?
      const lessonIds = (lessonRes.data || []).map(l => l.id);
      const pkgSessionMap = new Map(); // lessonId → { sessionId, packageId }
      if (lessonIds.length > 0) {
        const { data: pkgSessions } = await sb.from('lesson_package_sessions')
          .select('id, lesson_id, player_package_id').in('lesson_id', lessonIds).not('lesson_id', 'is', null);
        (pkgSessions || []).forEach(s => pkgSessionMap.set(s.lesson_id, { sessionId: s.id, packageId: s.player_package_id }));
      }
      const lessonsWithPkg = (lessonRes.data || []).map(l => ({
        ...l,
        is_package_lesson:  pkgSessionMap.has(l.id),
        pkg_session_id:     pkgSessionMap.get(l.id)?.sessionId || null,
        player_package_id:  pkgSessionMap.get(l.id)?.packageId || null,
      }));

      // Pending bookingleri otomatik onayla
      const bkData = (bkRes.data || []);
      const pendingIds = bkData.filter(b => b.status === 'pending').map(b => b.id);
      if (pendingIds.length > 0) {
        sb.from('bookings').update({ status: 'confirmed' }).in('id', pendingIds)
          .then(() => {}).catch(e => console.warn('Auto-confirm error:', e));
      }
      setAllBookings(bkData.map(b => b.status === 'pending' ? { ...b, status: 'confirmed' } : b));
      setAllLessons(lessonsWithPkg);

      // Manuel dersler için paket seans bilgisi — core.jsx ile aynı mantık:
      // lesson_id IS NULL + session_date + individual coach_id eşleşmesi
      const manualData = manualRes.data || [];
      const individualIds_ = coaches_.map(c => c.individual_coach_id).filter(Boolean);
      const coachToIndividual_ = new Map(coaches_.map(c => [c.id, c.individual_coach_id]));
      let manualPkgMap = new Map(); // `${individualCoachId}_${sessionDate}` → { session_id, player_package_id }
      if (individualIds_.length > 0) {
        const { data: manualSessions } = await sb.from('lesson_package_sessions')
          .select('id, player_package_id, coach_id, session_date')
          .is('lesson_id', null)
          .in('coach_id', individualIds_);
        (manualSessions || []).forEach(s => {
          manualPkgMap.set(`${s.coach_id}_${s.session_date}`, { session_id: s.id, player_package_id: s.player_package_id });
        });
      }
      const manualWithPkg = manualData.map(m => {
        const indId = coachToIndividual_.get(m.coach_id);
        const pkgInfo = indId ? manualPkgMap.get(`${indId}_${m.date}`) : null;
        return { ...m, is_package_lesson: !!pkgInfo, pkg_session_id: pkgInfo?.session_id || null, player_package_id: pkgInfo?.player_package_id || null };
      });
      setAllManualLessons(manualWithPkg);
      setAllClosureEvents(closureEvents);
      setBkPlayerMap(playerMap_);
    } catch (e) { console.error('Program load error:', e); }
    finally { setLoading(false); }
  };

  // ── Seçilen güne göre olayları türet (sorgu değil, filtre) ────
  const parseHM = (str) => {
    if (!str) return [0, 0];
    const [h, m] = str.slice(0, 5).split(':').map(Number);
    return [h || 0, m || 0];
  };

  const dayEvents = useMemo(() => {
    const all = [];

    // DB timestamp → [date, time] (Türkiye yerel saati)
    // Hem mobil hem de web tarayıcısı UTC+3 ortamında çalıştığından,
    // zaman DB'ye yerel saat olarak yazılır (ör. 09:00 → T09:00Z).
    // dbTimeToLocal uygulamak yanlışlıkla 3 saat geri kaydırır; doğrudan dilimle.
    const extractDateTime = (isoOrStr) => {
      if (!isoOrStr) return [null, null];
      return [isoOrStr.slice(0, 10), isoOrStr.slice(11, 16)];
    };

    // Rezervasyonlar
    allBookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const [dateStr, startHM] = extractDateTime(b.start_time);
      const [, endHM]          = extractDateTime(b.end_time);
      if (dateStr !== selDate) return;
      const [sh, sm] = parseHM(startHM);
      const [eh, em] = parseHM(endHM);
      const courtNum  = courts.find(c => c.id === b.court_id)?.court_number;
      const playerName = bkPlayerMap.get(b.id) || null;
      all.push({ id: b.id, type: 'booking', courtId: b.court_id, courtNum,
        label: playerName || 'Rezervasyon', sh, sm, eh, em, color: '#22C55E',
        status: b.status, paymentStatus: b.payment_status,
        totalAmount: b.total_amount, userId: b.user_id, playerName });
    });

    // Koç dersleri
    allLessons.forEach(l => {
      if (l.status === 'cancelled') return;
      const startDate = new Date(l.start_time);
      const endDate   = new Date(l.end_time);
      const dateStr   = startDate.toLocaleDateString('sv-SE'); // YYYY-MM-DD in local TZ
      if (dateStr !== selDate) return;
      const sh = startDate.getHours();
      const sm = startDate.getMinutes();
      const eh = endDate.getHours();
      const em = endDate.getMinutes();
      const coachName = (l.club_coach_id && coachMap.get(l.club_coach_id)) || 'Antrenör';
      const courtNum  = courts.find(c => c.id === l.court_id)?.court_number;
      all.push({ id: 'ls_' + l.id, type: 'lesson', courtId: l.court_id, courtNum,
        label: `${l.student_name || 'Öğrenci'} · ${coachName}`, sh, sm, eh, em, color: '#8B5CF6',
        paymentStatus: l.payment_status, amount: l.amount, coachName,
        studentName: l.student_name, source: 'lesson', rawId: l.id,
        lessonDate: dateStr, coachId: l.club_coach_id, isPackageLesson: !!l.is_package_lesson,
        pkgSessionId: l.pkg_session_id || null, playerPackageId: l.player_package_id || null });
    });

    // Manuel dersler — `date` alanı YYYY-MM-DD, start_time/end_time HH:MM
    allManualLessons.forEach(m => {
      if (m.status === 'cancelled') return;
      if (m.date !== selDate) return;
      const [sh, sm] = parseHM(m.start_time);
      const [eh, em] = parseHM(m.end_time);
      const coachName = m.club_coaches?.full_name || m.coach_name || 'Antrenör';
      const courtNum  = courts.find(c => c.id === m.court_id)?.court_number;
      all.push({ id: 'ml_' + m.id, type: 'lesson', courtId: m.court_id, courtNum,
        label: `${m.student_name || 'Öğrenci'} · ${coachName}`, sh, sm, eh, em, color: '#8B5CF6',
        paymentStatus: m.payment_status, amount: m.amount, coachName,
        studentName: m.student_name, source: 'manual', rawId: m.id,
        lessonDate: m.date, coachId: m.coach_id });
    });

    // Kapatmalar — aynı grup + saat + kort için hoca listesini tek event'ta birleştir
    const groupedClosures = new Map();
    allClosureEvents.forEach(cl => {
      if (cl._date !== selDate) return;
      const coachName = cl.coach?.full_name;
      const groupName = cl.group?.name;
      if (cl.group_id) {
        const key = `${cl.group_id}|${cl.court_id}|${cl.start_hour}|${cl.start_minute ?? 0}|${cl.end_hour}|${cl.end_minute ?? 0}`;
        if (groupedClosures.has(key)) {
          const ev = groupedClosures.get(key);
          if (coachName && !ev.coaches.includes(coachName)) ev.coaches.push(coachName);
        } else {
          groupedClosures.set(key, {
            id: `cl_grp_${cl.group_id}_${cl._date}_${cl.court_id}`,
            type: 'block', courtId: cl.court_id,
            courtNum: courts.find(c => c.id === cl.court_id)?.court_number,
            label: groupName || cl.reason || 'Kapalı',
            coaches: coachName ? [coachName] : [],
            sh: cl.start_hour ?? 8, sm: cl.start_minute ?? 0,
            eh: cl.end_hour ?? 9, em: cl.end_minute ?? 0, color: '#F97316',
            groupId: cl.group_id, closureType: cl.closure_type, closureDate: cl._date,
          });
        }
      } else {
        all.push({ id: `cl_${cl.id}_${cl._date}`, type: 'block', courtId: cl.court_id,
          courtNum: courts.find(c => c.id === cl.court_id)?.court_number,
          label: groupName || cl.reason || 'Kapalı',
          coaches: coachName ? [coachName] : [],
          sh: cl.start_hour ?? 8, sm: cl.start_minute ?? 0,
          eh: cl.end_hour ?? 9, em: cl.end_minute ?? 0, color: '#F97316',
          rawId: cl.id, closureType: cl.closure_type, closureDate: cl._date });
      }
    });
    groupedClosures.forEach(ev => all.push(ev));

    // Manuel derslerle (web'den eklenen) aynı kort+saatte örtüşen booking'leri çıkar
    // (web'den ders eklenince bookings tablosuna da yazılır; burada çift blok oluşmasın)
    const manualLessonEvents = all.filter(e => e.type === 'lesson' && e.source === 'manual');
    return all.filter(e => {
      if (e.type !== 'booking') return true;
      return !manualLessonEvents.some(m =>
        m.courtId === e.courtId &&
        (m.sh * 60 + m.sm) < (e.eh * 60 + e.em) &&
        (m.eh * 60 + m.em) > (e.sh * 60 + e.sm)
      );
    });
  }, [selDate, allBookings, allLessons, allManualLessons, allClosureEvents, courts, coachMap, bkPlayerMap]);

  const displayCourts = useMemo(() =>
    selCourtId ? courts.filter(c => c.id === selCourtId) : courts,
    [courts, selCourtId]);

  const occupiedCourtIds = useMemo(() =>
    new Set(dayEvents.map(e => e.courtId).filter(Boolean)), [dayEvents]);

  const noCourtLessons = useMemo(() =>
    dayEvents.filter(e => !e.courtId && e.type === 'lesson'), [dayEvents]);

  const isSlotOccupied = (courtId, hour) =>
    dayEvents.some(e => e.courtId === courtId &&
      (e.sh * 60 + e.sm) < (hour + 1) * 60 &&
      (e.eh * 60 + e.em) > hour * 60
    );

  // 15dk slot yardımcıları — slot = (hour - START_H) * 4 + quarter (0-3)
  const slotToHM = (slot) => ({ h: START_H + Math.floor(slot / 4), m: (slot % 4) * 15 });
  const isSlot15Occupied = (courtId, slot) => {
    const sm = slotToHM(slot); const startMins = sm.h * 60 + sm.m;
    return dayEvents.some(e => e.courtId === courtId &&
      (e.sh * 60 + e.sm) < startMins + 15 && (e.eh * 60 + e.em) > startMins
    );
  };

  // Sürükleme state — courtIdx: displayCourts içindeki indeks
  const { useRef } = React;
  const dragStateRef = useRef(null);

  // Dikdörtgendeki tüm 15dk slotlar boş mu?
  const rectAllEmpty = (minCIdx, maxCIdx, minS, maxS, dcourts) => {
    for (let ci = minCIdx; ci <= maxCIdx; ci++) {
      const cId = dcourts[ci]?.id;
      if (!cId) return false;
      for (let s = minS; s <= maxS; s++) {
        if (isSlot15Occupied(cId, s)) return false;
      }
    }
    return true;
  };

  const commitDrag = (ds, dcourts) => {
    if (!ds) return;
    const minSlot  = Math.min(ds.startSlot, ds.currentSlot);
    const maxSlot  = Math.max(ds.startSlot, ds.currentSlot);
    const minCIdx  = Math.min(ds.startCIdx, ds.currentCIdx);
    const maxCIdx  = Math.max(ds.startCIdx, ds.currentCIdx);
    const courtIds = (dcourts || []).slice(minCIdx, maxCIdx + 1).map(c => c.id);
    const { h: startHour, m: startMinute } = slotToHM(minSlot);
    const { h: endHour,   m: endMinute   } = slotToHM(maxSlot + 1);
    setDragState(null);
    dragStateRef.current = null;
    setSlotClickInfo({ courtIds, startHour, startMinute, endHour, endMinute });
    setClosureType(null);
    setSelectedGroup('');
    setSlotTypeModal(true);
  };

  // displayCourts'u ref'te tut — global mouseup closure'unda güncel değer olsun
  const displayCourtsRef = useRef([]);

  // Global mouseup — fare ekran dışına taşsa da sürükleme biter
  React.useEffect(() => {
    const onUp = () => {
      if (dragStateRef.current) commitDrag(dragStateRef.current, displayCourtsRef.current);
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const handleMouseDown = (courtIdx, courtId, slot) => {
    if (isSlot15Occupied(courtId, slot)) return;
    const ds = { startCIdx: courtIdx, currentCIdx: courtIdx, startSlot: slot, currentSlot: slot };
    dragStateRef.current = ds;
    setDragState(ds);
  };

  const handleMouseEnter = (courtIdx, courtId, slot) => {
    const cur = dragStateRef.current;
    if (!cur) return;
    const minCIdx = Math.min(cur.startCIdx, courtIdx);
    const maxCIdx = Math.max(cur.startCIdx, courtIdx);
    const minS    = Math.min(cur.startSlot, slot);
    const maxS    = Math.max(cur.startSlot, slot);
    if (!rectAllEmpty(minCIdx, maxCIdx, minS, maxS, displayCourtsRef.current)) return;
    const ds = { ...cur, currentCIdx: courtIdx, currentSlot: slot };
    dragStateRef.current = ds;
    setDragState(ds);
  };

  const applySlotPrefill = async (type) => {
    const { courtIds, startHour, startMinute, endHour, endMinute } = slotClickInfo;
    const startStr = `${String(startHour).padStart(2,'0')}:${String(startMinute||0).padStart(2,'0')}`;
    const endStr   = `${String(endHour).padStart(2,'0')}:${String(endMinute||0).padStart(2,'0')}`;

    if (type === 'reservation') {
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);
      const durationMins = (eh * 60 + em) - (sh * 60 + sm);
      const duration = [0.75, 1.0, 1.5, 2.0].reduce((prev, cur) =>
        Math.abs(cur * 60 - durationMins) < Math.abs(prev * 60 - durationMins) ? cur : prev
      );
      setBookingForm({ courtId: courtIds[0], date: selDate, startTime: startStr, endTime: endStr, duration, status: 'confirmed' });
      setBookingMemberId(null); setBookingMemberName(''); setBookingMemberQuery(''); setBookingMemberResults([]);
      setBookingCustomerId(null); setBookingCustomerName(''); setBookingCustomerQuery(''); setBookingCustomerResults([]);
      setBookingPersonMode('member');
      setSlotTypeModal(false);
      loadBookingAvailCourts(selDate, startStr, endStr);
      setBookingModal(true);
    } else if (type === 'lesson') {
      setLsForm({
        use_manual_coach: false, coach_id: '', manual_coach_name: '',
        date: selDate, start_time: startStr, end_time: endStr,
        duration: null, student_name: '', player_id: null,
        court_id: courtIds[0], notes: '', amount: '', payment_status: 'unpaid',
      });
      setLsSelectedPlayer(null); setLsPlayerSearch(''); setLsPlayerResults([]);
      setLsSelectedCustomer(null); setLsCustomerSearch(''); setLsCustomerResults([]);
      setLsPersonMode('member');
      setLsUsePkg(false); setLsSelectedPkgId(null); setLsPackages([]);
      setLsModal({ type: 'add' });
      setSlotTypeModal(false);
      setSlotClickInfo(null);
    } else if (type === 'group') {
      if (grpGroups.length === 0) {
        const { data } = await sb.from('club_groups').select('id,name,coach_id').eq('club_id', clubId).eq('is_active', true);
        setGrpGroups(data || []);
      }
      setGrpSelectedId('');
      setGrpIsRecurring(false);
      setGrpMembers([]); setGrpGroupCoaches([]);
      setGrpSelectedMembers(new Set()); setGrpSelectedCoaches(new Set());
      setGrpModal({ type: 'add' });
      setSlotTypeModal(false);
    } else {
      setClosureType(type);
    }
  };

  const saveInlineClosure = async () => {
    if (!slotClickInfo) return;
    setSlotSaving(true);
    try {
      // Grup dersi → seçili grubun hocası varsa müsaitlik kontrolü
      if (closureType === 'group' && selectedGroup) {
        const group = closureGroups.find(g => g.id === selectedGroup);
        const coachId = group?.coach_id;
        if (coachId) {
          const startISO = `${selDate}T${String(slotClickInfo.startHour).padStart(2,'0')}:${String(slotClickInfo.startMinute||0).padStart(2,'0')}:00`;
          const endISO   = `${selDate}T${String(slotClickInfo.endHour).padStart(2,'0')}:${String(slotClickInfo.endMinute||0).padStart(2,'0')}:00`;
          // Hoca bu saatlerde başka ders/rezervasyonun var mı?
          const [{ data: lessonConflict }, { data: manualConflict }, { data: closureConflict }] = await Promise.all([
            sb.from('lessons')
              .select('id')
              .eq('club_coach_id', coachId)
              .neq('status', 'cancelled')
              .lt('start_time', endISO)
              .gt('end_time', startISO),
            sb.from('club_manual_lessons')
              .select('id, start_time, end_time')
              .eq('coach_id', coachId)
              .eq('date', selDate),
            sb.from('court_closures')
              .select('id, coach_id, start_hour, end_hour, start_date, end_date, closure_type, day_of_week')
              .eq('coach_id', coachId)
              .eq('is_active', true),
          ]);

          if (lessonConflict?.length > 0) {
            const ok = confirm('⚠️ Bu saatte hocanın başka bir dersi var. Yine de eklensin mi?');
            if (!ok) { setSlotSaving(false); return; }
          } else {
            const sh = String(slotClickInfo.startHour).padStart(2,'0') + ':' + String(slotClickInfo.startMinute||0).padStart(2,'0');
            const eh = String(slotClickInfo.endHour).padStart(2,'0') + ':' + String(slotClickInfo.endMinute||0).padStart(2,'0');
            const manualOk = !(manualConflict || []).some(l =>
              (l.start_time || '').slice(0,5) < eh && (l.end_time || '').slice(0,5) > sh
            );
            const dow = new Date(selDate + 'T12:00:00').getDay();
            const closureOk = !(closureConflict || []).some(cl => {
              const cs = String(cl.start_hour ?? 0).padStart(2,'0') + ':00';
              const ce = String(cl.end_hour   ?? 0).padStart(2,'0') + ':00';
              if (!(cs < eh && ce > sh)) return false;
              if (cl.closure_type === 'recurring_weekly') return cl.day_of_week === dow;
              return (!cl.start_date || cl.start_date <= selDate) && (!cl.end_date || cl.end_date >= selDate);
            });
            if (!manualOk || !closureOk) {
              const ok = confirm('⚠️ Bu saatte hocanın başka bir programı var. Yine de eklensin mi?');
              if (!ok) { setSlotSaving(false); return; }
            }
          }
        }
      }

      // Her kort için ayrı kayıt
      const rows = slotClickInfo.courtIds.map(cId => ({
        court_id:     cId,
        closure_type: 'one_time',
        reason:       closureType === 'group' ? 'Grup Dersi' : 'Kapalı',
        start_hour:   slotClickInfo.startHour,
        start_minute: slotClickInfo.startMinute || 0,
        end_hour:     slotClickInfo.endHour,
        end_minute:   slotClickInfo.endMinute || 0,
        start_date:   selDate,
        end_date:     selDate,
        is_active:    true,
        group_id:     selectedGroup || null,
      }));
      const { error } = await sb.from('court_closures').insert(rows);
      if (error) throw error;
      setSlotTypeModal(false);
      setSlotClickInfo(null);
      setClosureType(null);
      await load();
    } catch (e) { alert('Hata: ' + e.message); }
    finally { setSlotSaving(false); }
  };

  // ── Grup Dersi Ekleme (inline modal) ─────────────────────────
  const saveGroupLesson = async () => {
    if (!grpSelectedId) { alert('Lütfen bir grup seçin'); return; }
    setGrpSaving(true);
    try {
      const group = grpGroups.find(g => g.id === grpSelectedId);
      if (!group) throw new Error('Grup bulunamadı');

      const { courtIds, startHour, startMinute, endHour, endMinute } = slotClickInfo;
      const startH   = startHour + (startMinute || 0) / 60;
      const endH     = endHour   + (endMinute   || 0) / 60;
      const startStr = `${String(startHour).padStart(2,'0')}:${String(startMinute||0).padStart(2,'0')}`;
      const endStr   = `${String(endHour).padStart(2,'0')}:${String(endMinute||0).padStart(2,'0')}`;
      const dow      = new Date(selDate + 'T12:00:00').getDay();

      const conflictMsgs = [];

      // 1. Kort çakışma kontrolü
      const { data: courtClosures } = await sb.from('court_closures')
        .select('id,court_id,closure_type,day_of_week,start_hour,start_minute,end_hour,end_minute,start_date,end_date,reason,group_id,courts(court_number)')
        .in('court_id', courtIds).eq('is_active', true);

      for (const row of (courtClosures || [])) {
        if (row.group_id === grpSelectedId) continue;
        const cs = (row.start_hour || 0) + (row.start_minute || 0) / 60;
        const ce = (row.end_hour   || 0) + (row.end_minute   || 0) / 60;
        if (!(startH < ce && endH > cs)) continue;
        let applies = false;
        if (row.closure_type === 'recurring_weekly') {
          applies = row.day_of_week === dow;
          if (applies && row.start_date && row.start_date > selDate) applies = false;
          if (applies && row.end_date   && row.end_date   < selDate) applies = false;
        } else {
          applies = (!row.start_date || row.start_date <= selDate) && (!row.end_date || row.end_date >= selDate);
        }
        if (applies) {
          const label = row.reason ? ` (${row.reason})` : '';
          conflictMsgs.push(`Kort ${row.courts?.court_number ?? '?'} · ${startStr}–${endStr} dolu${label}`);
        }
      }

      // 2. Seçili hocalar için çakışma kontrolü
      const coachIdsToCheck = grpGroupCoaches
        .filter(gc => grpSelectedCoaches.has(gc.coach_id))
        .map(gc => gc.coach_id);

      for (const coachId of coachIdsToCheck) {
        const coachName = grpGroupCoaches.find(gc => gc.coach_id === coachId)?.full_name ?? 'Hoca';

        const { data: coachClosures } = await sb.from('court_closures')
          .select('*, courts(court_number)').eq('coach_id', coachId).eq('is_active', true);
        for (const cl of (coachClosures || [])) {
          if (cl.group_id === grpSelectedId) continue;
          const cs = (cl.start_hour || 0) + (cl.start_minute || 0) / 60;
          const ce = (cl.end_hour   || 0) + (cl.end_minute   || 0) / 60;
          if (!(startH < ce && endH > cs)) continue;
          let applies = false;
          if (cl.closure_type === 'recurring_weekly') {
            applies = cl.day_of_week === dow;
            if (applies && cl.start_date && cl.start_date > selDate) applies = false;
            if (applies && cl.end_date   && cl.end_date   < selDate) applies = false;
          } else {
            applies = (!cl.start_date || cl.start_date <= selDate) && (!cl.end_date || cl.end_date >= selDate);
          }
          if (applies) conflictMsgs.push(`${coachName} · ${startStr}–${endStr} başka programı var`);
        }

        const { data: manualLessons } = await sb.from('club_manual_lessons')
          .select('id,date,start_time,end_time').eq('coach_id', coachId).eq('date', selDate);
        for (const ml of (manualLessons || [])) {
          const [lsh, lsm] = (ml.start_time || '0:0').split(':').map(Number);
          const [leh, lem] = (ml.end_time   || '0:0').split(':').map(Number);
          const lStart = lsh + lsm / 60;
          const lEnd   = leh + lem / 60;
          if (startH < lEnd && endH > lStart) {
            conflictMsgs.push(`${coachName} · ${startStr}–${endStr} manuel dersi var`);
            break;
          }
        }
      }

      if (conflictMsgs.length > 0) {
        const ok = confirm('⚠️ Çakışma Var!\n\n' + conflictMsgs.join('\n') + '\n\nYine de eklensin mi?');
        if (!ok) { setGrpSaving(false); return; }
      }

      // court_closures satırları — seçili koç sayısı kadar
      const selectedCoachArr = [...grpSelectedCoaches];
      const closureRows = [];
      for (const cId of courtIds) {
        const base = {
          court_id:     cId,
          closure_type: grpIsRecurring ? 'recurring_weekly' : 'one_time',
          reason:       `Grup Dersi – ${group.name}`,
          start_hour:   startHour,
          start_minute: startMinute || 0,
          end_hour:     endHour,
          end_minute:   endMinute || 0,
          start_date:   selDate,
          is_active:    true,
          group_id:     grpSelectedId,
        };
        if (grpIsRecurring) {
          base.day_of_week = dow;
        } else {
          base.end_date = selDate;
        }
        if (selectedCoachArr.length === 0) {
          closureRows.push(base);
        } else {
          selectedCoachArr.forEach(cid => closureRows.push({ ...base, coach_id: cid }));
        }
      }

      const { error } = await sb.from('court_closures').insert(closureRows);
      if (error) throw error;

      // Devamsızlık kaydı — tüm üyeler için (seçili = present, seçilmemiş = absent)
      if (grpMembers.length > 0) {
        const primaryCoachId = selectedCoachArr[0] || null;
        const attendanceRows = grpMembers.map(m => ({
          group_id:     grpSelectedId,
          member_id:    m.id,
          session_date: selDate,
          start_hour:   startHour,
          end_hour:     endHour,
          status:       grpSelectedMembers.has(m.id) ? 'present' : 'absent',
          coach_id:     primaryCoachId,
        }));
        const { error: attErr } = await sb.from('group_attendance').insert(attendanceRows);
        if (attErr) console.warn('Devamsızlık kaydı hatası:', attErr.message);
      }

      setGrpModal(null);
      setGrpSelectedId('');
      setSlotClickInfo(null);
      await load();
    } catch (e) { alert('Hata: ' + e.message); }
    finally { setGrpSaving(false); }
  };

  // ── Rezervasyon Detay Aksiyonları (Program Ekranı) ────────────
  const handleBkDetailCancel = async () => {
    if (!bkDetail) return;
    if (!confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?')) return;
    setBkDetailSaving(true);
    try {
      const { error } = await sb.from('bookings').update({ status: 'cancelled' }).eq('id', bkDetail.id);
      if (error) throw error;
      if (bkDetail.userId) {
        await sb.from('notifications').insert({
          user_id: bkDetail.userId,
          title:   'Rezervasyon İptal Edildi',
          message: 'Rezervasyonunuz kulüp tarafından iptal edildi.',
          type:    'reservation_cancelled',
          data:    { booking_id: bkDetail.id },
        });
      }
      setBkDetail(null);
      load();
    } catch (e) { alert(e.message); }
    finally { setBkDetailSaving(false); }
  };

  const handleBkDetailComplete = async () => {
    if (!bkDetail) return;
    setBkDetailSaving(true);
    try {
      const { error } = await sb.from('bookings').update({ status: 'completed' }).eq('id', bkDetail.id);
      if (error) throw error;
      setBkDetail(null);
      load();
    } catch (e) { alert(e.message); }
    finally { setBkDetailSaving(false); }
  };

  const handleBkDetailPaid = async () => {
    if (!bkDetail) return;
    const amount = Number(bkDetail.totalAmount) || 0;
    const amtStr = amount > 0 ? `\n\nTutar: ₺${amount.toLocaleString('tr-TR')}` : '';
    if (!confirm(`Bu rezervasyon için ödeme alındı mı?${amtStr}`)) return;
    setBkDetailSaving(true);
    try {
      const { error } = await sb.from('bookings').update({ payment_status: 'paid' }).eq('id', bkDetail.id);
      if (error) throw error;
      if (amount > 0) {
        await sb.from('club_finances').insert({
          club_id:     clubId,
          type:        'income',
          category:    'Rezervasyon Geliri',
          amount,
          description: `${bkDetail.playerName || 'Misafir'} - Kort ${bkDetail.courtNum || '?'} rezervasyon ödemesi`,
          date:        selDate,
        });
      }
      setBkDetail(null);
      load();
    } catch (e) { alert(e.message); }
    finally { setBkDetailSaving(false); }
  };

  // ── Ders Detay Aksiyonları (Program Ekranı) ────────────────────
  const handleLsDetailPaid = async () => {
    if (!lsDetail) return;
    const court     = courts.find(c => c.id === lsDetail.courtId);
    const durationH = Math.max(0, ((lsDetail.eh * 60 + lsDetail.em) - (lsDetail.sh * 60 + lsDetail.sm)) / 60);
    const courtFee  = Math.round((court?.hourly_rate || 0) * durationH * 100) / 100;
    const coachAmt  = Math.round((Number(lsDetail.amount) || 0) * 100) / 100;
    const total     = Math.round((courtFee + coachAmt) * 100) / 100;
    const lines = [
      `Hoca Hakedişi: ₺${coachAmt.toLocaleString('tr-TR')}`,
      `Kort Ücreti:   ₺${courtFee.toLocaleString('tr-TR')}`,
      `─────────────────────`,
      `Toplam:        ₺${total.toLocaleString('tr-TR')}`,
    ].join('\n');
    if (!confirm(`Ödeme Al\n\n${lines}\n\nÖdeme alındı olarak işaretlensin mi?`)) return;
    setLsDetailSaving(true);
    try {
      if (lsDetail.source === 'lesson') {
        const { error } = await sb.from('lessons').update({ payment_status: 'paid' }).eq('id', lsDetail.rawId);
        if (error) throw error;
      } else {
        const { error } = await sb.from('club_manual_lessons').update({ payment_status: 'paid' }).eq('id', lsDetail.rawId);
        if (error) throw error;
      }
      if (courtFee > 0) {
        await sb.from('club_finances').insert({
          club_id:     clubId, type: 'income', category: 'Rezervasyon Geliri',
          amount:      courtFee,
          description: `${lsDetail.coachName} - ${lsDetail.studentName || 'Öğrenci'} - Özel ders kort ücreti`,
          date:        lsDetail.lessonDate,
        });
      }
      if (coachAmt > 0) {
        await sb.from('coach_earnings').insert({
          club_id:        clubId,
          coach_id:       lsDetail.coachId || null,
          lesson_id:      lsDetail.source === 'lesson' ? lsDetail.rawId : null,
          coach_name:     lsDetail.coachName,
          student_name:   lsDetail.studentName || null,
          amount:         coachAmt,
          court_fee:      courtFee,
          date:           lsDetail.lessonDate,
          description:    `Özel ders - ${lsDetail.studentName || 'Öğrenci'} - ${String(lsDetail.sh).padStart(2,'0')}:${String(lsDetail.sm).padStart(2,'0')}`,
          payment_status: 'unpaid',
        });
      }
      setLsDetail(null);
      load();
    } catch (e) { alert(e.message); }
    finally { setLsDetailSaving(false); }
  };

  const handleLsDetailCancel = async () => {
    if (!lsDetail) return;

    // İptal anında canlı olarak paket seans sorgula (önbelleğe güvenme)
    let pkgSessionId = null, playerPackageId = null;
    if (lsDetail.source === 'manual' && lsDetail.coachId && lsDetail.lessonDate) {
      const coachRec = coachesList.find(c => c.id === lsDetail.coachId);
      const indCoachId = coachRec?.individual_coach_id;
      if (indCoachId) {
        const { data: sess } = await sb.from('lesson_package_sessions')
          .select('id, player_package_id')
          .eq('session_date', lsDetail.lessonDate)
          .eq('coach_id', indCoachId)
          .is('lesson_id', null)
          .limit(1);
        if (sess?.length > 0) { pkgSessionId = sess[0].id; playerPackageId = sess[0].player_package_id; }
      }
    } else if (lsDetail.source === 'lesson') {
      const { data: sess } = await sb.from('lesson_package_sessions')
        .select('id, player_package_id')
        .eq('lesson_id', lsDetail.rawId)
        .limit(1);
      if (sess?.length > 0) { pkgSessionId = sess[0].id; playerPackageId = sess[0].player_package_id; }
    }

    const isPackage = !!(pkgSessionId && playerPackageId);
    const msg = isPackage
      ? 'Bu dersi silmek istediğinizden emin misiniz? Paketten düşülmüşse kredi geri yüklenir.'
      : 'Bu dersi iptal etmek istediğinize emin misiniz?';
    if (!confirm(msg)) return;

    setLsDetailSaving(true);
    try {
      // Paket seans geri yükle — core.jsx cancelLesson ile birebir aynı mantık
      if (pkgSessionId && playerPackageId) {
        const { data: plp } = await sb.from('player_lesson_packages')
          .select('used_lessons').eq('id', playerPackageId).single();
        if (plp) {
          await Promise.all([
            sb.from('player_lesson_packages').update({
              used_lessons: Math.max(0, (plp.used_lessons || 0) - 1),
              status:       'active',
              updated_at:   new Date().toISOString(),
            }).eq('id', playerPackageId),
            sb.from('lesson_package_sessions').delete().eq('id', pkgSessionId),
          ]);
        }
      }
      if (lsDetail.source === 'manual') {
        await sb.from('club_manual_lessons').delete().eq('id', lsDetail.rawId);
        if (lsDetail.courtId) {
          const sh = String(lsDetail.sh).padStart(2,'0'), sm_ = String(lsDetail.sm).padStart(2,'0');
          const eh = String(lsDetail.eh).padStart(2,'0'), em_ = String(lsDetail.em).padStart(2,'0');
          const startDb = localTimeToDb(`${lsDetail.lessonDate}T${sh}:${sm_}`);
          const endDb   = localTimeToDb(`${lsDetail.lessonDate}T${eh}:${em_}`);
          await sb.from('bookings').update({ status: 'cancelled' })
            .eq('court_id', lsDetail.courtId).eq('start_time', startDb).eq('end_time', endDb);
        }
      } else {
        await sb.from('lessons').update({ status: 'cancelled' }).eq('id', lsDetail.rawId);
      }
      setLsDetail(null);
      load();
    } catch (e) { console.warn('Ders iptal hatası:', e.message); alert(e.message); }
    finally { setLsDetailSaving(false); }
  };

  // ── Blok / Kapatma Detay Aksiyonları ─────────────────────────
  const deleteBlockClosure = async () => {
    if (!clDetail) return;
    const label = clDetail.groupId ? `"${clDetail.label}" grup dersini` : 'bu kapatmayı';
    if (!confirm(`${label} silmek istediğinize emin misiniz?`)) return;
    setClDetailSaving(true);
    try {
      if (clDetail.groupId && clDetail.closureType === 'one_time') {
        const { error } = await sb.from('court_closures')
          .delete()
          .eq('group_id', clDetail.groupId)
          .eq('start_date', clDetail.closureDate)
          .eq('end_date',   clDetail.closureDate)
          .eq('start_hour', clDetail.sh);
        if (error) throw error;
        await sb.from('group_attendance')
          .delete()
          .eq('group_id',     clDetail.groupId)
          .eq('session_date', clDetail.closureDate)
          .eq('start_hour',   clDetail.sh);
      } else if (clDetail.rawId) {
        const { error } = await sb.from('court_closures').delete().eq('id', clDetail.rawId);
        if (error) throw error;
      }
      setClDetail(null);
      await load();
    } catch (e) { alert('Hata: ' + e.message); }
    finally { setClDetailSaving(false); }
  };

  const updateBlockClosure = async () => {
    if (!clDetail) return;
    const [sh, sm] = clEditForm.start_time.split(':').map(Number);
    const [eh, em] = clEditForm.end_time.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) { alert('Bitiş saati başlangıçtan büyük olmalı'); return; }
    setClDetailSaving(true);
    try {
      if (clDetail.groupId && clDetail.closureType === 'one_time') {
        const { error } = await sb.from('court_closures')
          .update({ start_hour: sh, start_minute: sm, end_hour: eh, end_minute: em })
          .eq('group_id',   clDetail.groupId)
          .eq('start_date', clDetail.closureDate)
          .eq('end_date',   clDetail.closureDate)
          .eq('start_hour', clDetail.sh);
        if (error) throw error;
        await sb.from('group_attendance')
          .update({ start_hour: sh, end_hour: eh })
          .eq('group_id',     clDetail.groupId)
          .eq('session_date', clDetail.closureDate)
          .eq('start_hour',   clDetail.sh);
      } else if (clDetail.rawId) {
        const { error } = await sb.from('court_closures')
          .update({ start_hour: sh, start_minute: sm, end_hour: eh, end_minute: em })
          .eq('id', clDetail.rawId);
        if (error) throw error;
      }
      setClDetail(null);
      setClEditMode(false);
      await load();
    } catch (e) { alert('Hata: ' + e.message); }
    finally { setClDetailSaving(false); }
  };

  // ── Yeni Ders Ekleme (Inline) ──────────────────────────────────
  const searchLsPlayers = async (query) => {
    if (!query || query.length < 2) { setLsPlayerResults([]); return; }
    const { data } = await sb.from('profiles').select('id,full_name,email')
      .eq('user_type', 'player')
      .ilike('full_name', `%${query}%`).limit(8);
    setLsPlayerResults(data || []);
  };

  const searchLsCustomers = async (query) => {
    if (!query || query.length < 2) { setLsCustomerResults([]); return; }
    try {
      const { data } = await sb.from('club_customers')
        .select('id, full_name, phone, email, user_id')
        .eq('club_id', clubId).eq('is_active', true)
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(8);
      setLsCustomerResults(data || []);
    } catch(e) { console.error(e); }
  };

  // Birleşik arama — üye + müşteri aynı anda
  const searchLsPerson = async (query) => {
    setLsPlayerSearch(query);
    setLsForm(prev => ({ ...prev, student_name: query, player_id: null }));
    if (!query || query.length < 2) { setLsPlayerResults([]); setLsCustomerResults([]); return; }
    const [{ data: players }, { data: customers }] = await Promise.all([
      sb.from('profiles').select('id,full_name,email').eq('user_type','player').ilike('full_name',`%${query}%`).limit(6),
      sb.from('club_customers').select('id,full_name,phone,email,user_id').eq('club_id',clubId).eq('is_active',true)
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`).limit(6),
    ]);
    setLsPlayerResults((players || []).map(p => ({ ...p, _kind: 'member' })));
    setLsCustomerResults((customers || []).map(c => ({ ...c, _kind: 'customer' })));
  };

  // Öğrenci seçilince aktif paketi varsa hocanın otomatik seçilmesi
  React.useEffect(() => {
    const playerId = lsSelectedPlayer?.id;
    if (!playerId || lsForm.use_manual_coach || coachesList.length === 0) return;
    let cancelled = false;
    (async () => {
      setLsAutoCoachLoading(true);
      try {
        const now = new Date().toISOString();
        const { data } = await sb.from('player_lesson_packages')
          .select('coach_id')
          .eq('player_id', playerId)
          .eq('payment_status', 'paid').eq('status', 'active')
          .or(`expiry_date.is.null,expiry_date.gt.${now}`)
          .order('created_at', { ascending: false })
          .limit(1);
        if (!cancelled && data?.length > 0) {
          const matchedCoach = coachesList.find(c => c.individual_coach_id === data[0].coach_id);
          if (matchedCoach) setLsForm(prev => ({ ...prev, coach_id: matchedCoach.id }));
        }
      } catch(e) { console.error('auto coach:', e); }
      finally { if (!cancelled) setLsAutoCoachLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [lsSelectedPlayer, coachesList.length, lsForm.use_manual_coach]);

  const saveNewLesson = async () => {
    // Zorunlu alan kontrolü
    if (!lsForm.date || !lsForm.start_time || !lsForm.end_time) {
      alert('Tarih, başlangıç ve bitiş saati zorunludur.'); return;
    }
    if (!lsForm.court_id) { alert('Lütfen kort seçin.'); return; }
    const coachOk = lsForm.use_manual_coach ? !!lsForm.manual_coach_name?.trim() : !!lsForm.coach_id;
    if (!coachOk) { alert('Lütfen bir antrenör seçin veya antrenör adını girin.'); return; }
    if (lsForm.start_time >= lsForm.end_time) {
      alert('Bitiş saati başlangıç saatinden sonra olmalıdır.'); return;
    }

    const dateStr = lsForm.date;
    const startHH = lsForm.start_time.slice(0, 5);
    const endHH   = lsForm.end_time.slice(0, 5);
    const startDb = localTimeToDb(`${dateStr}T${startHH}`);
    const endDb   = localTimeToDb(`${dateStr}T${endHH}`);

    // Çakışma kontrolleri
    const [{ data: bConflict }, { data: mConflict }, { data: closures }] = await Promise.all([
      sb.from('bookings').select('id').eq('court_id', lsForm.court_id)
        .neq('status', 'cancelled').lt('start_time', endDb).gt('end_time', startDb),
      sb.from('club_manual_lessons').select('id,start_time,end_time,court_id')
        .eq('club_id', clubId).eq('date', dateStr),
      sb.from('court_closures').select('*').eq('court_id', lsForm.court_id).eq('is_active', true),
    ]);

    if (bConflict?.length > 0) { alert('Bu kort seçilen saatte zaten rezerve edilmiş.'); return; }

    const courtRow0 = courts.find(c => c.id === lsForm.court_id);
    const locationStr = courtRow0 ? `Kort ${courtRow0.court_number}` : '';
    const hasManualConflict = (mConflict || [])
      .filter(l => l.court_id ? l.court_id === lsForm.court_id : l.location === locationStr)
      .some(l => {
        const ls = (l.start_time || '').slice(0, 5);
        const le = (l.end_time   || '').slice(0, 5);
        return ls < endHH && le > startHH;
      });
    if (hasManualConflict) { alert('Bu kort seçilen saatte zaten dolu.'); return; }

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

    if (!lsForm.use_manual_coach && lsForm.coach_id) {
      const [sh, sm] = startHH.split(':').map(Number);
      const [eh, em] = endHH.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin   = eh * 60 + em;
      const lessonDow = new Date(dateStr + 'T12:00:00').getDay();
      const coachLabel = coachesList.find(c => c.id === lsForm.coach_id)?.full_name || 'Antrenör';

      const { data: coachConflict } = await sb.from('club_manual_lessons')
        .select('id,start_time,end_time').eq('coach_id', lsForm.coach_id).eq('date', dateStr);
      const hasCoachConflict = (coachConflict || []).some(l => {
        const ls = (l.start_time || '').slice(0, 5);
        const le = (l.end_time   || '').slice(0, 5);
        return ls < endHH && le > startHH;
      });
      if (hasCoachConflict) { alert('Bu antrenörün seçilen saatte başka bir dersi var.'); return; }

      const { data: coachClosures } = await sb.from('court_closures')
        .select('closure_type,day_of_week,start_hour,end_hour,start_date,end_date,reason')
        .eq('coach_id', lsForm.coach_id).eq('is_active', true);
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

    if (lsForm.player_id) {
      const [{ data: ownBk }, { data: allConflictBk }, { data: stuLessons }] = await Promise.all([
        sb.from('bookings').select('id').eq('user_id', lsForm.player_id)
          .in('status', ['pending','confirmed']).lt('start_time', endDb).gt('end_time', startDb),
        sb.from('bookings').select('id')
          .in('status', ['pending','confirmed']).lt('start_time', endDb).gt('end_time', startDb),
        sb.from('lessons').select('id').eq('student_id', lsForm.player_id)
          .neq('status', 'cancelled').lt('start_time', endDb).gt('end_time', startDb),
      ]);
      const conflictBkIds = (allConflictBk || []).map(b => b.id);
      let isInvited = false;
      if (conflictBkIds.length > 0) {
        const { data: invited } = await sb.from('booking_players').select('player_id')
          .eq('player_id', lsForm.player_id).in('booking_id', conflictBkIds);
        isInvited = (invited?.length ?? 0) > 0;
      }
      if ((ownBk?.length ?? 0) > 0 || isInvited || (stuLessons?.length ?? 0) > 0) {
        alert(`${lsSelectedPlayer?.full_name || 'Öğrenci'} adlı oyuncunun bu saatte başka bir rezervasyonu veya dersi bulunuyor.`);
        return;
      }
    }

    setLsSaving(true);
    try {
      const courtRow  = courts.find(c => c.id === lsForm.court_id);
      const coachId   = !lsForm.use_manual_coach ? (lsForm.coach_id || null) : null;
      const coachName = lsForm.use_manual_coach ? (lsForm.manual_coach_name || null) : null;
      const usingPkg  = !!(lsUsePkg && lsSelectedPkgId);
      const amountVal = usingPkg ? 0 : (lsForm.amount ? parseFloat(String(lsForm.amount).replace(',', '.')) : null);
      const payStatus = usingPkg ? 'paid' : (lsForm.payment_status || 'unpaid');

      const payload = {
        club_id:        clubId,
        coach_id:       coachId,
        coach_name:     coachName,
        date:           lsForm.date,
        start_time:     startHH,
        end_time:       endHH,
        student_name:   lsForm.student_name || null,
        court_id:       lsForm.court_id,
        location:       courtRow ? `Kort ${courtRow.court_number}` : '',
        notes:          lsForm.notes?.trim() || null,
        payment_status: payStatus,
        amount:         amountVal,
      };

      const { data: inserted, error: insErr } = await sb.from('club_manual_lessons')
        .insert(payload).select('id').single();
      if (insErr) throw insErr;

      // Kort takvimini bloke et
      if (inserted?.id) {
        const { data: { user } } = await sb.auth.getUser();
        if (user?.id && lsForm.court_id) {
          const durH = Math.round((new Date(endDb) - new Date(startDb)) / 3600000 * 100) / 100;
          await sb.from('bookings').insert({
            court_id: lsForm.court_id, user_id: user.id,
            start_time: startDb, end_time: endDb,
            status: 'confirmed', is_solo_booking: false,
            duration_hours: durH, total_amount: amountVal || 0,
            club_coach_id: coachId,
          }).then(() => {}).catch(e => console.warn('Kort blok eklenemedi:', e.message));
        }

        if (usingPkg) {
          try {
            const pkg = lsPackages.find(p => p.id === lsSelectedPkgId);
            if (pkg) {
              const remaining = (pkg.total_lessons || 0) - (pkg.used_lessons || 0);
              if (remaining <= 0) throw new Error('Bu pakette kalan ders yok');
              const newUsed = (pkg.used_lessons || 0) + 1;
              const isCompleted = newUsed >= (pkg.total_lessons || 0);
              const { error: sessErr } = await sb.from('lesson_package_sessions').insert({
                player_package_id: lsSelectedPkgId, lesson_id: null,
                coach_id: coachesList.find(c => c.id === coachId)?.individual_coach_id || null,
                session_date: lsForm.date, notes: lsForm.notes?.trim() || null,
              });
              if (sessErr) throw sessErr;
              const { error: updErr } = await sb.from('player_lesson_packages').update({
                used_lessons: newUsed, status: isCompleted ? 'completed' : 'active',
                updated_at: new Date().toISOString(),
              }).eq('id', lsSelectedPkgId);
              if (updErr) throw updErr;
              const pkgDef = pkg.lesson_packages || {};
              const perSessionTotal = (pkgDef.price || 0) / (pkgDef.total_lessons || 1);
              const coachPct     = pkgDef.coach_percentage ?? 70;
              const coachEarning = perSessionTotal * (coachPct / 100);
              const clubEarning  = perSessionTotal - coachEarning;
              const coachRec = coachesList.find(c => c.id === coachId);
              const earningPromises = [];
              if (coachRec && coachEarning > 0) {
                earningPromises.push(sb.from('coach_earnings').insert({
                  club_id: clubId, coach_id: coachId, coach_name: coachRec.full_name,
                  student_name: lsForm.student_name || null, lesson_id: inserted.id,
                  amount: Math.round(coachEarning * 100) / 100, court_fee: 0,
                  date: lsForm.date, description: 'Ders Paketi Oturumu', payment_status: 'unpaid',
                }));
              }
              if (clubEarning > 0) {
                earningPromises.push(sb.from('club_finances').insert({
                  club_id: clubId, type: 'income', category: 'Ders Paketi Geliri',
                  amount: Math.round(clubEarning * 100) / 100,
                  description: `${coachRec?.full_name || 'Antrenör'} - ${lsForm.student_name || 'Öğrenci'} - Ders Paketi Oturumu`,
                  date: lsForm.date,
                }));
              }
              await Promise.all(earningPromises);
            }
          } catch (pkgErr) {
            alert(`Ders kaydedildi ancak paketten düşülemedi: ${pkgErr.message}`);
          }
        }
      }
      setLsModal(null);
      setLsSelectedPlayer(null); setLsPlayerSearch(''); setLsPlayerResults([]);
      setLsSelectedCustomer(null); setLsCustomerSearch(''); setLsCustomerResults([]);
      setLsPersonMode('member');
      setLsUsePkg(false); setLsSelectedPkgId(null); setLsPackages([]);
      load();
    } catch (e) {
      if (e.message?.includes('no_overlapping_bookings') || e.code === '23P01') {
        alert('Bu kort seçilen saatte zaten dolu. Lütfen farklı bir saat veya kort seçin.');
      } else { alert(e.message); }
    } finally { setLsSaving(false); }
  };

  // ── Inline Rezervasyon ────────────────────────────────────────
  const loadBookingAvailCourts = async (date, startTime, endTime) => {
    if (!date || !startTime || !endTime || courts.length === 0) {
      setBookingAvailCourts([...courts]);
      return;
    }
    setBookingCourtsLoading(true);
    try {
      const startDb = localTimeToDb(`${date}T${startTime}`);
      const endDb   = localTimeToDb(`${date}T${endTime}`);
      const allIds  = courts.map(c => c.id);
      const blocked = new Set();

      const [bRes, lRes, mlRes, clRes] = await Promise.all([
        sb.from('bookings').select('court_id').in('court_id', allIds)
          .in('status', ['pending','confirmed']).lt('start_time', endDb).gt('end_time', startDb),
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

      setBookingAvailCourts(courts.filter(c => !blocked.has(c.id)));
    } catch(e) { console.error(e); setBookingAvailCourts([...courts]); }
    finally { setBookingCourtsLoading(false); }
  };

  const handleBookingDuration = (d) => {
    const [sh, sm] = (bookingForm.startTime || '09:00').split(':').map(Number);
    const totalMin = sh * 60 + sm + Math.round(d * 60);
    const eh = Math.floor(totalMin / 60) % 24;
    const em = totalMin % 60;
    const newEnd = `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`;
    const newForm = { ...bookingForm, duration: d, endTime: newEnd };
    setBookingForm(newForm);
    loadBookingAvailCourts(newForm.date, newForm.startTime, newEnd);
  };

  const searchBookingMembers = async (q) => {
    setBookingMemberQuery(q);
    if (q.length < 2) { setBookingMemberResults([]); return; }
    setBookingMemberLoading(true);
    try {
      const { data } = await sb.from('profiles')
        .select('id, full_name, email')
        .ilike('full_name', `%${q}%`)
        .limit(8);
      setBookingMemberResults(data || []);
    } catch(e) { console.error(e); }
    finally { setBookingMemberLoading(false); }
  };

  const searchBookingCustomers = async (q) => {
    setBookingCustomerQuery(q);
    if (q.length < 2) { setBookingCustomerResults([]); return; }
    try {
      const { data } = await sb.from('club_customers')
        .select('id, full_name, phone, email, user_id')
        .eq('club_id', clubId).eq('is_active', true)
        .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(8);
      setBookingCustomerResults(data || []);
    } catch(e) { console.error(e); }
  };

  const searchBookingPerson = async (q) => {
    setBookingMemberQuery(q);
    if (q.length < 2) { setBookingMemberResults([]); setBookingCustomerResults([]); return; }
    setBookingMemberLoading(true);
    try {
      const [{ data: players }, { data: customers }] = await Promise.all([
        sb.from('profiles').select('id, full_name, email').eq('user_type', 'player').ilike('full_name', `%${q}%`).limit(6),
        sb.from('club_customers').select('id, full_name, phone, email, user_id').eq('club_id', clubId).eq('is_active', true)
          .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`).limit(6),
      ]);
      setBookingMemberResults(players || []);
      setBookingCustomerResults(customers || []);
    } catch(e) { console.error(e); }
    finally { setBookingMemberLoading(false); }
  };

  const saveInlineBooking = async () => {
    const { courtId, date, startTime, endTime, duration, status } = bookingForm;
    if (!courtId)   { alert('Lütfen bir kort seçin.'); return; }
    if (!startTime) { alert('Başlangıç saati eksik.');  return; }

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

    setBookingSaving(true);
    try {
      const [bConflict, mConflict, closures] = await Promise.all([
        sb.from('bookings').select('id').eq('court_id', courtId)
          .in('status',['pending','confirmed']).lt('start_time', endDb).gt('end_time', startDb),
        sb.from('club_manual_lessons').select('id, start_time, end_time')
          .eq('court_id', courtId).eq('date', date),
        sb.from('court_closures').select('*').eq('court_id', courtId).eq('is_active', true),
      ]);

      if ((bConflict.data || []).length > 0) {
        alert('Bu kort seçilen saatte zaten rezerve edilmiş.'); return;
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
      const durationHours = (newEnd - newStart) / 60;
      const totalAmount   = Math.round((court?.hourly_rate || 0) * durationHours * 100) / 100;

      const { data: bk, error: bkErr } = await sb.from('bookings').insert({
        court_id:         courtId,
        user_id:          user.id,
        start_time:       startDb,
        end_time:         endDb,
        status:           status || 'confirmed',
        is_solo_booking:  !bookingMemberId && !bookingCustomerId,
        duration_hours:   durationHours,
        total_amount:     totalAmount,
        club_customer_id: bookingCustomerId || null,
      }).select().single();
      if (bkErr) throw bkErr;

      const playerIdToLink = bookingMemberId || null;
      if (playerIdToLink && bk?.id) {
        await sb.from('booking_players').insert({
          booking_id:        bk.id,
          player_id:         playerIdToLink,
          is_primary_player: true,
          status:            'confirmed',
        });
      }

      setBookingModal(false);
      setSlotClickInfo(null);
      setBookingCustomerId(null); setBookingCustomerName('');
      setBookingCustomerQuery(''); setBookingCustomerResults([]);
      setBookingPersonMode('member');
      await load();
      alert('Rezervasyon başarıyla oluşturuldu.');
    } catch(e) { alert('Hata: ' + e.message); }
    finally { setBookingSaving(false); }
  };

  // displayCourts değişince ref'i güncelle (global mouseup için)
  React.useEffect(() => { displayCourtsRef.current = displayCourts; }, [displayCourts]);

  const prevDay = () => {
    const d = new Date(selDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelDate(d.toISOString().split('T')[0]);
  };
  const nextDay = () => {
    const d = new Date(selDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSelDate(d.toISOString().split('T')[0]);
  };

  const dateLabel = new Date(selDate + 'T12:00:00').toLocaleDateString('tr-TR',
    { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const isToday = selDate === todayISO();

  const EventBlock = ({ ev, col, totalCols }) => {
    const startMins = ev.sh * 60 + ev.sm;
    const endMins   = ev.eh * 60 + ev.em;
    const top    = (startMins - START_H * 60) / 60 * SLOT_H + 36;
    const height = Math.max((endMins - startMins) / 60 * SLOT_H, 22);
    if (endMins <= START_H * 60 || startMins >= END_H * 60 || endMins <= startMins) return null;
    const timeStr  = `${String(ev.sh).padStart(2,'0')}:${String(ev.sm).padStart(2,'0')}–${String(ev.eh).padStart(2,'0')}:${String(ev.em).padStart(2,'0')}`;
    const widthPct = 100 / totalCols;
    const isBooking   = ev.type === 'booking';
    const isLesson    = ev.type === 'lesson';
    const isBlock     = ev.type === 'block';
    const isClickable = isBooking || isLesson || isBlock;
    const isPaid      = ev.paymentStatus === 'paid';
    const handleEvClick = isClickable ? (e) => {
      e.stopPropagation();
      if (isBooking) setBkDetail(ev);
      else if (isLesson) setLsDetail(ev);
      else if (isBlock) {
        const sh = ev.sh, sm = ev.sm, eh = ev.eh, em = ev.em;
        setClDetail(ev);
        setClEditMode(false);
        setClEditForm({
          start_time: `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`,
          end_time:   `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`,
        });
      }
    } : undefined;
    return (
      <div
        onMouseDown={handleEvClick}
        style={{
          position:'absolute',
          top: top+'px',
          left: `calc(${col * widthPct}% + 2px)`,
          width: `calc(${widthPct}% - 4px)`,
          height: height+'px',
          background: ev.color + '22', borderLeft:`3px solid ${ev.color}`,
          borderRadius:'0 6px 6px 0', padding:'2px 6px', overflow:'hidden', zIndex:1,
          cursor: isClickable ? 'pointer' : 'default',
        }}>
        <div style={{ fontSize:9, fontWeight:700, color:ev.color, lineHeight:1.4, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>{timeStr}</span>
          {(isBooking || isLesson) && height >= 22 && (
            <span style={{ fontSize:8, background: isPaid ? '#22C55E22' : '#F59E0B22', color: isPaid ? '#16A34A' : '#D97706', borderRadius:3, padding:'1px 3px', fontWeight:700 }}>
              {isPaid ? '✓' : '₺'}
            </span>
          )}
          {isBlock && height >= 22 && (
            <span className="material-icons" style={{ fontSize:10, color: ev.color, opacity:0.7 }}>touch_app</span>
          )}
        </div>
        {height >= 30 && (
          <>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.label}</div>
            {ev.coaches && ev.coaches.length > 0 && (
              <div style={{ fontSize:9, color:'var(--text-2)', lineHeight:1.4, overflowWrap:'break-word' }}>
                {ev.coaches.join(', ')}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const CourtColumn = ({ courtId, courtIdx, label }) => {
    const evs = courtId ? dayEvents.filter(e => e.courtId === courtId) : noCourtLessons;

    // Çakışan event'ları yan yana yerleştirme algoritması
    const evLayout = React.useMemo(() => {
      const sorted = [...evs].sort((a, b) => (a.sh * 60 + a.sm) - (b.sh * 60 + b.sm));
      const colEnds = []; // her sütundaki son event'in bitiş dakikası
      const result = new Map(); // id -> { col, startMins, endMins }
      sorted.forEach(ev => {
        const startMins = ev.sh * 60 + ev.sm;
        const endMins   = ev.eh * 60 + ev.em;
        let col = colEnds.findIndex(end => end <= startMins);
        if (col === -1) { col = colEnds.length; colEnds.push(endMins); }
        else colEnds[col] = endMins;
        result.set(ev.id, { col, startMins, endMins });
      });
      // Her event için kendi zaman dilimiyle çakışan event sayısına göre totalCols hesapla
      result.forEach((val, id) => {
        let maxCol = 0;
        result.forEach(other => {
          if (other.startMins < val.endMins && other.endMins > val.startMins)
            maxCol = Math.max(maxCol, other.col);
        });
        result.set(id, { ...val, totalCols: maxCol + 1 });
      });
      return result;
    }, [evs]);

    return (
      <div style={{ flex:1, minWidth:120, borderLeft:'1px solid var(--border)', position:'relative' }}>
        <div style={{ height:36, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700,
          fontSize:12, color:'var(--text-2)', borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
          {label}
          {courtId && (
            <div style={{ width:7, height:7, borderRadius:'50%', marginLeft:5,
              background: occupiedCourtIds.has(courtId) ? '#EF4444' : '#22C55E' }} />
          )}
        </div>
        {Array.from({ length: (END_H - START_H) * 4 }, (_, i) => {
          const slot = i;
          const { h, m } = slotToHM(slot);
          const isHour = m === 45;
          const occupied = courtId ? isSlot15Occupied(courtId, slot) : true;
          const inDrag = dragState && courtId != null &&
            courtIdx >= Math.min(dragState.startCIdx, dragState.currentCIdx) &&
            courtIdx <= Math.max(dragState.startCIdx, dragState.currentCIdx) &&
            slot >= Math.min(dragState.startSlot, dragState.currentSlot) &&
            slot <= Math.max(dragState.startSlot, dragState.currentSlot);
          return (
            <div key={i}
              onMouseDown={() => courtId != null && !occupied && handleMouseDown(courtIdx, courtId, slot)}
              onMouseEnter={() => courtId != null && handleMouseEnter(courtIdx, courtId, slot)}
              title={courtId != null && !occupied ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} – sürükleyerek seç` : undefined}
              style={{
                height: SLOT_H / 4,
                borderBottom: isHour ? '1px solid #cbd5e1' : '1px solid #f1f5f9',
                cursor: courtId != null && !occupied ? 'crosshair' : 'default',
                background: inDrag ? '#EEF2FF' : '',
                outline: inDrag ? '2px solid #6366F1' : 'none',
                outlineOffset: '-1px',
                userSelect: 'none',
                transition: 'background 0.05s',
              }}
            />
          );
        })}
        {evs.map((ev, idx) => {
          const lay = evLayout.get(ev.id) || { col: 0, totalCols: 1 };
          return <EventBlock key={ev.id || idx} ev={ev} col={lay.col} totalCols={lay.totalCols} />;
        })}
      </div>
    );
  };

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Program</h1>
          <div className="sub">{dateLabel}</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <button className="btn btn-ghost btn-icon" onClick={prevDay}><span className="material-icons">chevron_left</span></button>
          <button className={`btn btn-sm ${isToday ? 'btn-pri' : 'btn-ghost'}`} onClick={() => setSelDate(todayISO())}>Bugün</button>
          <button className="btn btn-ghost btn-icon" onClick={nextDay}><span className="material-icons">chevron_right</span></button>
          <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
            style={{ border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', fontSize:13, cursor:'pointer' }} />
          <button className="btn btn-ghost btn-icon" onClick={load} title="Yenile">
            <span className="material-icons">refresh</span>
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
        <button onClick={() => setSelCourtId(null)}
          className={`btn btn-sm ${!selCourtId ? 'btn-pri' : 'btn-ghost'}`}>
          <span className="material-icons" style={{fontSize:13}}>sports_tennis</span>&nbsp;Tüm Kortlar
        </button>
        {courts.map(c => (
          <button key={c.id} onClick={() => setSelCourtId(c.id)}
            className={`btn btn-sm ${selCourtId === c.id ? 'btn-pri' : 'btn-ghost'}`}
            style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%',
              background: occupiedCourtIds.has(c.id) ? '#EF4444' : '#22C55E' }} />
            Kort {c.court_number}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', gap:14, marginBottom:12, flexWrap:'wrap' }}>
        {[{color:'#22C55E',label:'Rezervasyon'},{color:'#8B5CF6',label:'Ders'},{color:'#F97316',label:'Kapalı / Blok'}].map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:l.color }} />
            <span style={{ color:'var(--text-2)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div style={{ background:'var(--bg-card,#fff)', borderRadius:12, border:'1px solid var(--border)', overflow:'auto' }}>
          <div style={{ display:'flex', minWidth: (displayCourts.length * 160 + 52) + 'px' }}>
            <div style={{ width:52, flexShrink:0, borderRight:'1px solid var(--border)' }}>
              <div style={{ height:36, borderBottom:'1px solid var(--border)' }} />
              {Array.from({ length: END_H - START_H }, (_, i) => (
                <div key={i} style={{ height:SLOT_H, borderBottom:'1px solid #cbd5e1', position:'relative' }}>
                  {[0, 15, 30, 45].map(min => (
                    <div key={min} style={{
                      position:'absolute',
                      top: `${(min / 60) * 100}%`,
                      right:8,
                      transform:'translateY(2px)',
                      fontSize: min === 0 ? 11 : min === 30 ? 10 : 9,
                      color: min === 0 ? 'var(--text-2)' : 'var(--text-3,#94a3b8)',
                      fontWeight: min === 0 ? 500 : 400,
                      lineHeight:1,
                      whiteSpace:'nowrap',
                    }}>
                      {String(START_H + i).padStart(2,'0')}:{String(min).padStart(2,'0')}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {displayCourts.map((c, idx) => (
              <CourtColumn key={c.id} courtId={c.id} courtIdx={idx} label={`Kort ${c.court_number}`} />
            ))}
            {!selCourtId && noCourtLessons.length > 0 && (
              <CourtColumn courtId={null} label="Genel" />
            )}
          </div>
        </div>
      )}

      {/* Slot Tip Seçim Modalı */}
      {slotTypeModal && slotClickInfo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if (e.target === e.currentTarget) { setSlotTypeModal(false); setSlotClickInfo(null); setClosureType(null); } }}>
          <div style={{ background:'#fff', borderRadius:20, padding:24, width:340, display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontWeight:800, fontSize:17, color:'var(--text-1)', marginBottom:2 }}>
              {slotClickInfo.courtIds.map(id => { const c = courts.find(x => x.id === id); return c ? `Kort ${c.court_number}` : ''; }).join(', ')}
              {' · '}{String(slotClickInfo.startHour).padStart(2,'0')}:{String(slotClickInfo.startMinute||0).padStart(2,'0')} – {String(slotClickInfo.endHour).padStart(2,'0')}:{String(slotClickInfo.endMinute||0).padStart(2,'0')}
            </div>
            {slotClickInfo.courtIds.length > 1 && (
              <div style={{ fontSize:11, color:'#6366F1', background:'#EEF2FF', borderRadius:8, padding:'4px 10px', marginBottom:4 }}>
                {slotClickInfo.courtIds.length} kort seçildi — Rezervasyon/Ders için yalnızca ilk kort kullanılır
              </div>
            )}

            {!closureType ? (
              <>
                <div style={{ fontSize:13, color:'var(--text-2)', marginBottom:4 }}>Ne yapmak istersiniz?</div>
                {[
                  { type:'reservation', icon:'event',  label:'Rezervasyon', color:'#003399' },
                  { type:'lesson',      icon:'school', label:'Özel Ders',   color:'#7C3AED' },
                  { type:'group',       icon:'groups', label:'Grup Dersi',  color:'#0891B2' },
                  { type:'closure',     icon:'lock',   label:'Kapatma',     color:'#DC2626' },
                ].map(({ type, icon, label, color }) => (
                  <button key={type}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderRadius:14, border:`1.5px solid ${color}20`, background:`${color}08`, cursor:'pointer', fontSize:14, fontWeight:700, color, textAlign:'left' }}
                    onClick={() => applySlotPrefill(type)}
                  >
                    <span className="material-icons" style={{ fontSize:20, color }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </>
            ) : (
              <>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', marginBottom:4 }}>
                  {closureType === 'group' ? 'Grup seçin (opsiyonel)' : 'Kapatma Onayı'}
                </div>
                {closureType === 'group' && (
                  <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
                    style={{ border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 12px', fontSize:14 }}>
                    <option value="">— Grup seçin (opsiyonel)</option>
                    {closureGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                )}
                <button
                  style={{ padding:'13px', borderRadius:14, background: closureType==='group' ? '#0891B2' : '#DC2626', border:'none', color:'#fff', fontWeight:700, fontSize:14, cursor: slotSaving ? 'not-allowed' : 'pointer', opacity: slotSaving ? 0.6 : 1 }}
                  onClick={saveInlineClosure} disabled={slotSaving}>
                  {slotSaving ? 'Kaydediliyor…' : closureType === 'group' ? 'Grup Dersi Ekle' : 'Kapat'}
                </button>
                <button style={{ padding:'10px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)', cursor:'pointer', fontSize:13, color:'var(--text-2)', fontWeight:600 }}
                  onClick={() => setClosureType(null)}>
                  ← Geri
                </button>
              </>
            )}

            <button style={{ marginTop:2, padding:'10px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)', cursor:'pointer', fontSize:13, color:'var(--text-2)', fontWeight:600 }}
              onClick={() => { setSlotTypeModal(false); setSlotClickInfo(null); setClosureType(null); }}>
              İptal
            </button>
          </div>
        </div>
      )}

      {/* ── Rezervasyon Detay / Aksiyon Modalı ── */}
      {bkDetail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1300, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if (e.target === e.currentTarget && !bkDetailSaving) setBkDetail(null); }}>
          <div style={{ background:'#fff', borderRadius:20, width:'min(480px,95vw)', maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px 8px' }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:'var(--text-1)' }}>
                  {bkDetail.playerName || 'Misafir'}
                </div>
                <div style={{ fontSize:13, color:'var(--text-2)', marginTop:2 }}>
                  Kort {bkDetail.courtNum} · {String(bkDetail.sh).padStart(2,'0')}:{String(bkDetail.sm).padStart(2,'0')}–{String(bkDetail.eh).padStart(2,'0')}:{String(bkDetail.em).padStart(2,'0')}
                </div>
              </div>
              <button onClick={() => setBkDetail(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:8 }}>
                <span className="material-icons" style={{ color:'var(--text-2)' }}>close</span>
              </button>
            </div>

            {/* Status + Payment chips */}
            <div style={{ display:'flex', gap:8, padding:'0 20px 16px', flexWrap:'wrap' }}>
              {(() => {
                const s = bkDetail.status;
                const cfg = (s === 'confirmed' || s === 'pending')
                          ? { bg:'#DBEAFE', color:'#1D4ED8', label:'Onaylı' }
                          : s === 'completed'
                          ? { bg:'#DCFCE7', color:'#16A34A', label:'Tamamlandı' }
                          : { bg:'#FEE2E2', color:'#DC2626', label:'İptal Edildi' };
                return <span style={{ fontSize:12, fontWeight:700, borderRadius:20, padding:'4px 10px', background:cfg.bg, color:cfg.color }}>{cfg.label}</span>;
              })()}
              {(() => {
                const p = bkDetail.paymentStatus;
                const cfg = p === 'paid' ? { bg:'#DCFCE7', color:'#16A34A', label:'Ödendi' } : { bg:'#FEF3C7', color:'#D97706', label:'Ödenmedi' };
                return <span style={{ fontSize:12, fontWeight:700, borderRadius:20, padding:'4px 10px', background:cfg.bg, color:cfg.color }}>{cfg.label}</span>;
              })()}
              {bkDetail.totalAmount > 0 && (
                <span style={{ fontSize:12, fontWeight:700, borderRadius:20, padding:'4px 10px', background:'#F8FAFC', color:'var(--text-2)' }}>
                  ₺{Number(bkDetail.totalAmount).toLocaleString('tr-TR')}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display:'flex', gap:10, padding:'0 20px 28px', flexWrap:'wrap' }}>
              {bkDetail.paymentStatus !== 'paid' && ['pending','confirmed','completed'].includes(bkDetail.status) && (
                <button
                  onClick={handleBkDetailPaid}
                  disabled={bkDetailSaving}
                  style={{ flex:1, minWidth:120, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'13px', borderRadius:14, border:'none', cursor:bkDetailSaving?'not-allowed':'pointer', background:'#22C55E', color:'#fff', fontSize:14, fontWeight:700 }}>
                  <span className="material-icons" style={{fontSize:18}}>payments</span>
                  Ödeme Al{bkDetail.totalAmount > 0 ? ` · ₺${Number(bkDetail.totalAmount).toLocaleString('tr-TR')}` : ''}
                </button>
              )}
              {['pending','confirmed'].includes(bkDetail.status) && (
                <button
                  onClick={handleBkDetailComplete}
                  disabled={bkDetailSaving}
                  style={{ flex:1, minWidth:100, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'13px', borderRadius:14, border:'1.5px solid #22C55E', cursor:bkDetailSaving?'not-allowed':'pointer', background:'#fff', color:'#16A34A', fontSize:14, fontWeight:700 }}>
                  <span className="material-icons" style={{fontSize:18}}>done_all</span>
                  Tamamlandı
                </button>
              )}
              {['pending','confirmed'].includes(bkDetail.status) && (
                <button
                  onClick={handleBkDetailCancel}
                  disabled={bkDetailSaving}
                  style={{ flex:1, minWidth:80, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'13px', borderRadius:14, border:'none', cursor:bkDetailSaving?'not-allowed':'pointer', background:'#EF4444', color:'#fff', fontSize:14, fontWeight:700 }}>
                  <span className="material-icons" style={{fontSize:18}}>close</span>
                  İptal Et
                </button>
              )}
              {!['pending','confirmed','completed'].includes(bkDetail.status) && (
                <div style={{ flex:1, textAlign:'center', color:'var(--text-2)', fontSize:13, padding:'13px' }}>
                  Bu rezervasyon zaten iptal edilmiş.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Ders Detay / Ödeme Modalı ── */}
      {lsDetail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1300, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if (e.target === e.currentTarget && !lsDetailSaving) setLsDetail(null); }}>
          <div style={{ background:'#fff', borderRadius:20, width:'min(480px,95vw)', maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px 8px' }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:'var(--text-1)' }}>
                  {lsDetail.studentName || 'Öğrenci'}
                </div>
                <div style={{ fontSize:13, color:'var(--text-2)', marginTop:2 }}>
                  Kort {lsDetail.courtNum} · {String(lsDetail.sh).padStart(2,'0')}:{String(lsDetail.sm).padStart(2,'0')}–{String(lsDetail.eh).padStart(2,'0')}:{String(lsDetail.em).padStart(2,'0')}
                </div>
                <div style={{ fontSize:12, color:'var(--text-2)', marginTop:1 }}>{lsDetail.coachName}</div>
              </div>
              <button onClick={() => setLsDetail(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:8 }}>
                <span className="material-icons" style={{ color:'var(--text-2)' }}>close</span>
              </button>
            </div>
            {/* Ödeme chip + tutar */}
            <div style={{ display:'flex', gap:8, padding:'0 20px 16px', flexWrap:'wrap' }}>
              {lsDetail.isPackageLesson ? (
                <span style={{ fontSize:12, fontWeight:700, borderRadius:20, padding:'4px 10px', background:'#EEF2FF', color:'#6366F1', display:'flex', alignItems:'center', gap:4 }}>
                  <span className="material-icons" style={{fontSize:13}}>inventory</span>Paket
                </span>
              ) : (() => {
                const p = lsDetail.paymentStatus;
                const cfg = p === 'paid' ? { bg:'#DCFCE7', color:'#16A34A', label:'Ödendi' } : { bg:'#FEF3C7', color:'#D97706', label:'Ödenmedi' };
                return <span style={{ fontSize:12, fontWeight:700, borderRadius:20, padding:'4px 10px', background:cfg.bg, color:cfg.color }}>{cfg.label}</span>;
              })()}
              {!lsDetail.isPackageLesson && (() => {
                const court = courts.find(c => c.id === lsDetail.courtId);
                const dh = Math.max(0, ((lsDetail.eh * 60 + lsDetail.em) - (lsDetail.sh * 60 + lsDetail.sm)) / 60);
                const cf = Math.round((court?.hourly_rate || 0) * dh * 100) / 100;
                const ca = Math.round((Number(lsDetail.amount) || 0) * 100) / 100;
                const total = Math.round((cf + ca) * 100) / 100;
                if (total <= 0) return null;
                return (
                  <span style={{ fontSize:12, fontWeight:700, borderRadius:20, padding:'4px 10px', background:'#F8FAFC', color:'var(--text-2)' }}>
                    ₺{total.toLocaleString('tr-TR')}
                  </span>
                );
              })()}
            </div>
            {/* Aksiyon */}
            <div style={{ display:'flex', gap:10, padding:'0 20px 28px' }}>
              {lsDetail.isPackageLesson ? (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'13px', borderRadius:14, background:'#EEF2FF', color:'#6366F1', fontSize:14, fontWeight:700 }}>
                  <span className="material-icons" style={{fontSize:18}}>inventory</span>
                  Paketten Düşüldü
                </div>
              ) : lsDetail.paymentStatus !== 'paid' ? (
                <button
                  onClick={handleLsDetailPaid}
                  disabled={lsDetailSaving}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'13px', borderRadius:14, border:'none', cursor:lsDetailSaving?'not-allowed':'pointer', background:'#22C55E', color:'#fff', fontSize:14, fontWeight:700 }}>
                  <span className="material-icons" style={{fontSize:18}}>payments</span>
                  {(() => {
                    const court = courts.find(c => c.id === lsDetail.courtId);
                    const dh = Math.max(0, ((lsDetail.eh * 60 + lsDetail.em) - (lsDetail.sh * 60 + lsDetail.sm)) / 60);
                    const cf = Math.round((court?.hourly_rate || 0) * dh * 100) / 100;
                    const ca = Math.round((Number(lsDetail.amount) || 0) * 100) / 100;
                    const total = Math.round((cf + ca) * 100) / 100;
                    return `Ödeme Al${total > 0 ? ` · ₺${total.toLocaleString('tr-TR')}` : ''}`;
                  })()}
                </button>
              ) : (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'13px', borderRadius:14, background:'#DCFCE7', color:'#16A34A', fontSize:14, fontWeight:700 }}>
                  <span className="material-icons" style={{fontSize:18}}>check_circle</span>
                  Ödendi
                </div>
              )}
              <button
                onClick={handleLsDetailCancel}
                disabled={lsDetailSaving}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'13px 16px', borderRadius:14, border:'1.5px solid #EF4444', background:'#FEF2F2', cursor: lsDetailSaving ? 'not-allowed' : 'pointer', fontSize:14, fontWeight:700, color:'#EF4444', opacity: lsDetailSaving ? 0.6 : 1, flexShrink:0 }}>
                <span className="material-icons" style={{fontSize:18}}>cancel</span>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Blok / Kapatma Detay Modalı ── */}
      {clDetail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1300, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if (e.target === e.currentTarget && !clDetailSaving) { setClDetail(null); setClEditMode(false); } }}>
          <div style={{ background:'#fff', borderRadius:20, width:'min(480px,95vw)', maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px 16px' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:34, height:34, borderRadius:10, background:'#FFF7ED', display:'grid', placeItems:'center' }}>
                    <span className="material-icons" style={{ fontSize:18, color:'#F97316' }}>
                      {clDetail.groupId ? 'groups' : 'lock'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize:16, fontWeight:800, color:'var(--text-1)' }}>{clDetail.label}</div>
                    <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2 }}>
                      Kort {clDetail.courtNum} · {String(clDetail.sh).padStart(2,'0')}:{String(clDetail.sm).padStart(2,'0')}–{String(clDetail.eh).padStart(2,'0')}:{String(clDetail.em).padStart(2,'0')}
                      {' · '}{new Date((clDetail.closureDate || selDate) + 'T12:00:00').toLocaleDateString('tr-TR', { weekday:'short', day:'numeric', month:'short' })}
                    </div>
                  </div>
                </div>
                {/* Tür chip */}
                <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, fontWeight:700, borderRadius:20, padding:'3px 10px',
                    background: clDetail.closureType === 'one_time' ? '#FFF7ED' : '#EFF6FF',
                    color:      clDetail.closureType === 'one_time' ? '#EA580C'  : '#2563EB' }}>
                    {clDetail.closureType === 'one_time' ? 'Tek Seferlik' : 'Haftalık Tekrar'}
                  </span>
                  {clDetail.groupId && (
                    <span style={{ fontSize:11, fontWeight:700, borderRadius:20, padding:'3px 10px', background:'#F0FDFA', color:'#0891B2' }}>
                      Grup Dersi
                    </span>
                  )}
                </div>
                {clDetail.coaches && clDetail.coaches.length > 0 && (
                  <div style={{ fontSize:12, color:'var(--text-2)', marginTop:8 }}>
                    <span className="material-icons" style={{fontSize:13, verticalAlign:'middle', marginRight:4}}>person</span>
                    {clDetail.coaches.join(' · ')}
                  </div>
                )}
              </div>
              <button onClick={() => { setClDetail(null); setClEditMode(false); }} disabled={clDetailSaving}
                style={{ background:'none', border:'none', cursor:'pointer', padding:8, alignSelf:'flex-start' }}>
                <span className="material-icons" style={{ color:'var(--text-2)' }}>close</span>
              </button>
            </div>

            {/* Haftalık tekrar uyarısı */}
            {clDetail.closureType === 'recurring_weekly' && (
              <div style={{ margin:'0 20px 12px', padding:'10px 14px', borderRadius:10, background:'#EFF6FF', border:'1px solid #BFDBFE', fontSize:12, color:'#1E40AF', display:'flex', gap:8, alignItems:'flex-start' }}>
                <span className="material-icons" style={{ fontSize:15, flexShrink:0, marginTop:1 }}>info</span>
                <span>Bu haftalık tekrarlayan bir kapatma. Düzenleme veya silme <b>tüm haftaları</b> etkiler.</span>
              </div>
            )}

            {/* Edit form */}
            {clEditMode && (
              <div style={{ padding:'0 20px 16px', display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', letterSpacing:0.4 }}>SAATI DÜZENLE</div>
                <div style={{ display:'flex', gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:'var(--text-2)', marginBottom:4 }}>Başlangıç</div>
                    <input type="time" value={clEditForm.start_time}
                      onChange={e => setClEditForm(f => ({ ...f, start_time: e.target.value }))}
                      style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:10, padding:'9px 12px', fontSize:14, boxSizing:'border-box' }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:'var(--text-2)', marginBottom:4 }}>Bitiş</div>
                    <input type="time" value={clEditForm.end_time}
                      onChange={e => setClEditForm(f => ({ ...f, end_time: e.target.value }))}
                      style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:10, padding:'9px 12px', fontSize:14, boxSizing:'border-box' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', gap:10, padding:'0 20px 28px', flexWrap:'wrap' }}>
              {!clEditMode ? (
                <>
                  {(clDetail.closureType === 'one_time' || clDetail.rawId) && (
                    <button onClick={() => setClEditMode(true)}
                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'13px', borderRadius:14, border:'1.5px solid #0891B2', background:'#F0FDFA', cursor:'pointer', fontSize:14, fontWeight:700, color:'#0E7490' }}>
                      <span className="material-icons" style={{fontSize:18}}>edit</span>
                      Düzenle
                    </button>
                  )}
                  <button onClick={deleteBlockClosure} disabled={clDetailSaving}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'13px', borderRadius:14, border:'none', background:'#EF4444', cursor:clDetailSaving?'not-allowed':'pointer', fontSize:14, fontWeight:700, color:'#fff' }}>
                    <span className="material-icons" style={{fontSize:18}}>delete</span>
                    {clDetailSaving ? 'Siliniyor...' : 'Sil'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setClEditMode(false)} disabled={clDetailSaving}
                    style={{ flex:1, padding:'13px', borderRadius:14, border:'1.5px solid var(--border)', background:'var(--bg)', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--text-2)' }}>
                    İptal
                  </button>
                  <button onClick={updateBlockClosure} disabled={clDetailSaving}
                    style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'13px', borderRadius:14, border:'none', background: clDetailSaving ? '#94a3b8' : '#0891B2', cursor:clDetailSaving?'not-allowed':'pointer', fontSize:14, fontWeight:800, color:'#fff' }}>
                    <span className="material-icons" style={{fontSize:18}}>save</span>
                    {clDetailSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Ders Modalı ── */}
      {lsModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1250, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if (e.target === e.currentTarget && !lsSaving) setLsModal(null); }}>
          <div style={{ background:'#fff', borderRadius:20, width:'min(480px,95vw)', maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:17, fontWeight:800, color:'var(--text-1)' }}>Özel Ders Ekle</span>
                <button style={{ background:'none', border:'none', cursor:'pointer', display:'grid', placeItems:'center' }} onClick={() => setLsModal(null)}>
                  <span className="material-icons" style={{ fontSize:22, color:'var(--text-2)' }}>close</span>
                </button>
              </div>
              {/* Read-only zaman + kort bilgisi */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#EEF2FF', color:'var(--brand-navy)', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700 }}>
                  <span className="material-icons" style={{ fontSize:13 }}>schedule</span>
                  {lsForm.start_time} – {lsForm.end_time}
                </span>
                {lsForm.court_id && courts.find(c => c.id === lsForm.court_id) && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#EEF2FF', color:'var(--brand-navy)', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700 }}>
                    <span className="material-icons" style={{ fontSize:13 }}>sports_tennis</span>
                    Kort {courts.find(c => c.id === lsForm.court_id).court_number}
                  </span>
                )}
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#F1F5F9', color:'var(--text-2)', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:600 }}>
                  <span className="material-icons" style={{ fontSize:13 }}>calendar_today</span>
                  {new Date(lsForm.date + 'T12:00:00').toLocaleDateString('tr-TR', { day:'numeric', month:'short', year:'numeric' })}
                </span>
              </div>
            </div>
            <div style={{ overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:0, padding:'16px 20px' }}>

              {/* ÖĞRENCİ / MÜŞTERİ */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>OYUNCU</div>
              {(lsSelectedPlayer || lsSelectedCustomer) ? (
                /* Seçili kişi kartı */
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', border:'1.5px solid var(--brand-navy)', borderRadius:12, padding:'11px 12px', marginBottom:12, background:'#EEF2FF' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--brand-navy)' }}>{lsSelectedCustomer?.full_name || lsSelectedPlayer?.full_name}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:'#fff', background: lsSelectedCustomer && !lsSelectedCustomer._kind?.includes('member') ? '#0891B2' : 'var(--brand-navy)', borderRadius:5, padding:'2px 6px', letterSpacing:0.2 }}>
                        {lsSelectedCustomer && !lsSelectedPlayer ? 'Müşteri' : 'Üye'}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-2)', marginTop:1 }}>{lsSelectedPlayer?.email || lsSelectedCustomer?.phone || lsSelectedCustomer?.email || ''}</div>
                    {lsAutoCoachLoading && <div style={{ fontSize:11, color:'var(--brand-navy)', marginTop:2 }}>Paket kontrol ediliyor...</div>}
                  </div>
                  <button style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}
                    onClick={() => {
                      setLsSelectedPlayer(null); setLsPlayerSearch(''); setLsPlayerResults([]);
                      setLsSelectedCustomer(null); setLsCustomerSearch(''); setLsCustomerResults([]);
                      setLsForm(prev => ({...prev, student_name:'', player_id:null}));
                      setLsPackages([]); setLsUsePkg(false); setLsSelectedPkgId(null);
                    }}>
                    <span className="material-icons" style={{ fontSize:18, color:'var(--text-2)' }}>close</span>
                  </button>
                </div>
              ) : (
                /* Birleşik arama kutusu */
                <div style={{ position:'relative', marginBottom:12 }}>
                  <input style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'11px 12px', fontSize:14, color:'var(--text-1)', background:'var(--bg)', boxSizing:'border-box' }}
                    placeholder="Ad, telefon veya e-posta ile ara..." value={lsPlayerSearch}
                    onChange={e => searchLsPerson(e.target.value)} />
                  {(lsPlayerResults.length > 0 || lsCustomerResults.length > 0) && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:999, background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:12, boxShadow:'0 4px 16px rgba(0,0,0,0.12)', overflow:'hidden' }}>
                      {lsPlayerResults.map((p, i) => (
                        <div key={'m-'+p.id}
                          style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}
                          onMouseDown={() => {
                            setLsSelectedPlayer(p);
                            setLsForm(prev=>({...prev, student_name:p.full_name, player_id:p.id}));
                            setLsPlayerSearch(''); setLsPlayerResults([]); setLsCustomerResults([]);
                          }}>
                          <div>
                            <div style={{ fontSize:14, fontWeight:600, color:'var(--text-1)' }}>{p.full_name}</div>
                            <div style={{ fontSize:12, color:'var(--text-2)' }}>{p.email}</div>
                          </div>
                          <span style={{ fontSize:10, fontWeight:700, color:'#fff', background:'var(--brand-navy)', borderRadius:5, padding:'2px 6px', flexShrink:0, marginLeft:8 }}>Üye</span>
                        </div>
                      ))}
                      {lsCustomerResults.map((c) => (
                        <div key={'c-'+c.id}
                          style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}
                          onMouseDown={() => {
                            setLsSelectedCustomer(c);
                            setLsForm(prev=>({...prev, student_name:c.full_name, player_id: c.user_id || null}));
                            setLsPlayerSearch(''); setLsPlayerResults([]); setLsCustomerResults([]);
                            if (c.user_id) setLsSelectedPlayer({ id: c.user_id, full_name: c.full_name, email: c.email });
                          }}>
                          <div>
                            <div style={{ fontSize:14, fontWeight:600, color:'var(--text-1)' }}>{c.full_name}</div>
                            <div style={{ fontSize:12, color:'var(--text-2)' }}>{c.phone || c.email || ''}</div>
                          </div>
                          <span style={{ fontSize:10, fontWeight:700, color:'#fff', background:'#0891B2', borderRadius:5, padding:'2px 6px', flexShrink:0, marginLeft:8 }}>Müşteri</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ANTRENÖR */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>ANTRENÖR</div>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <button style={{ flex:1, padding:'9px', borderRadius:10, border: !lsForm.use_manual_coach ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)', background: !lsForm.use_manual_coach ? '#EEF2FF' : 'var(--bg)', cursor:'pointer', fontSize:13, fontWeight:600, color: !lsForm.use_manual_coach ? 'var(--brand-navy)' : 'var(--text-2)' }}
                  onClick={() => setLsForm({...lsForm, use_manual_coach:false, manual_coach_name:''})}>Listeden Seç</button>
                <button style={{ flex:1, padding:'9px', borderRadius:10, border: lsForm.use_manual_coach ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)', background: lsForm.use_manual_coach ? '#EEF2FF' : 'var(--bg)', cursor:'pointer', fontSize:13, fontWeight:600, color: lsForm.use_manual_coach ? 'var(--brand-navy)' : 'var(--text-2)' }}
                  onClick={() => setLsForm({...lsForm, use_manual_coach:true, coach_id:''})}>Manuel Giriş</button>
              </div>
              {lsForm.use_manual_coach ? (
                <input style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'11px 12px', fontSize:14, color:'var(--text-1)', background:'var(--bg)', boxSizing:'border-box', marginBottom:14 }}
                  placeholder="Antrenör adı" value={lsForm.manual_coach_name || ''}
                  onChange={e => setLsForm({...lsForm, manual_coach_name:e.target.value})} />
              ) : coachesList.length === 0 ? (
                <div style={{ padding:14, borderRadius:12, background:'var(--bg)', border:'1px solid var(--border)', textAlign:'center', color:'var(--text-2)', fontSize:13, marginBottom:14 }}>Henüz antrenör eklenmemiş.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                  {coachesList.map(c => {
                    const isAuto = lsAutoCoachLoading && !lsForm.coach_id;
                    return (
                      <div key={c.id}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:12, border: lsForm.coach_id === c.id ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)', background: lsForm.coach_id === c.id ? '#EEF2FF' : 'var(--bg)', cursor:'pointer', opacity: isAuto ? 0.6 : 1 }}
                        onClick={() => setLsForm({...lsForm, coach_id:c.id})}>
                        <div style={{ width:32, height:32, borderRadius:16, background:'rgba(0,51,153,0.12)', display:'grid', placeItems:'center', flexShrink:0 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'var(--brand-navy)' }}>{c.full_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span style={{ flex:1, fontSize:13, color:'var(--text-1)', fontWeight: lsForm.coach_id === c.id ? 700 : 500 }}>{c.full_name}</span>
                        {lsForm.coach_id === c.id && <span className="material-icons" style={{fontSize:16, color:'var(--brand-navy)'}}>check_circle</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PAKET */}
              {(lsSelectedPlayer) && !lsForm.use_manual_coach && lsForm.coach_id && (
                <div style={{ marginBottom:14 }}>
                  {lsLoadingPkgs ? (
                    <div style={{ fontSize:13, color:'var(--text-2)', padding:'6px 0' }}>Paketler yükleniyor...</div>
                  ) : lsPackages.length > 0 ? (
                    <div style={{ border:'1.5px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', background: lsUsePkg ? '#EEF2FF' : 'var(--bg)', borderBottom: lsUsePkg ? '1.5px solid var(--border)' : 'none' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span className="material-icons" style={{ fontSize:17, color: lsUsePkg ? 'var(--brand-navy)' : 'var(--text-2)' }}>inventory_2</span>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color: lsUsePkg ? 'var(--brand-navy)' : 'var(--text-1)' }}>Paketten Kullan</div>
                            <div style={{ fontSize:11, color:'var(--text-2)' }}>{lsPackages.length} aktif paket mevcut</div>
                          </div>
                        </div>
                        <div style={{ width:44, height:24, borderRadius:12, background: lsUsePkg ? 'var(--brand-navy)' : '#CBD5E1', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}
                          onClick={() => { const next=!lsUsePkg; setLsUsePkg(next); setLsForm(prev=>({...prev, amount: next?'0':'', payment_status: next?'paid':'unpaid'})); }}>
                          <div style={{ width:18, height:18, borderRadius:9, background:'#fff', position:'absolute', top:3, left: lsUsePkg ? 23 : 3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
                        </div>
                      </div>
                      {lsUsePkg && (
                        <div style={{ padding:'12px 14px', background:'var(--surface)', display:'flex', flexDirection:'column', gap:8 }}>
                          {lsPackages.map(pkg => {
                            const remaining = (pkg.total_lessons||0) - (pkg.used_lessons||0);
                            const isSelected = lsSelectedPkgId === pkg.id;
                            const expiry = pkg.expiry_date ? new Date(pkg.expiry_date).toLocaleDateString('tr-TR') : null;
                            return (
                              <div key={pkg.id} onClick={() => setLsSelectedPkgId(pkg.id)}
                                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:10, border: isSelected ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)', background: isSelected ? '#EEF2FF' : 'var(--bg)', cursor:'pointer' }}>
                                <div>
                                  <div style={{ fontSize:13, fontWeight:700, color: isSelected ? 'var(--brand-navy)' : 'var(--text-1)' }}>{pkg.package_name || 'Ders Paketi'}</div>
                                  <div style={{ fontSize:11, color:'var(--text-2)' }}>{remaining} ders kaldı{expiry ? ` · Son: ${expiry}` : ''}</div>
                                </div>
                                {isSelected && <span className="material-icons" style={{ fontSize:18, color:'var(--brand-navy)' }}>check_circle</span>}
                              </div>
                            );
                          })}
                          <div style={{ fontSize:11, color:'#059669', fontWeight:600, paddingTop:4 }}>Ders ücreti 0 ₺ olarak kaydedilecek, ödemesi paket satışında alındı.</div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* NOT */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>NOT (opsiyonel)</div>
              <textarea style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'11px 12px', fontSize:15, color:'var(--text-1)', background:'var(--bg)', boxSizing:'border-box', minHeight:72, resize:'vertical', marginBottom:16 }}
                placeholder="Ders hakkında not..." value={lsForm.notes || ''}
                onChange={e => setLsForm({...lsForm, notes:e.target.value})} />

              {/* DERS ÜCRETİ */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>DERS ÜCRETİ (opsiyonel)</div>
              <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${lsUsePkg ? '#86EFAC' : 'var(--border)'}`, borderRadius:12, background: lsUsePkg ? '#F0FDF4' : 'var(--bg)', paddingLeft:12, marginBottom:16, opacity: lsUsePkg ? 0.7 : 1 }}>
                <span style={{ fontSize:16, fontWeight:700, color:'var(--text-2)', marginRight:4 }}>₺</span>
                <input type="number" min="0" step="0.01" style={{ flex:1, border:'none', background:'transparent', padding:'11px 12px 11px 0', fontSize:15, color:'var(--text-1)', outline:'none' }}
                  placeholder="0,00" value={lsForm.amount || ''} disabled={lsUsePkg}
                  onChange={e => setLsForm({...lsForm, amount:e.target.value})} />
                {lsUsePkg && <span className="material-icons" style={{ fontSize:16, color:'#059669', marginRight:10 }}>inventory_2</span>}
              </div>

              {/* ÖDEME DURUMU */}
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>ÖDEME DURUMU</div>
              <div style={{ display:'flex', gap:10, marginBottom:20, opacity: lsUsePkg ? 0.6 : 1, pointerEvents: lsUsePkg ? 'none' : 'auto' }}>
                <button style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'11px', borderRadius:12, border: (lsForm.payment_status||'unpaid') === 'unpaid' ? '1.5px solid #F59E0B' : '1.5px solid var(--border)', background: (lsForm.payment_status||'unpaid') === 'unpaid' ? '#FEF3C7' : 'var(--bg)', cursor:'pointer' }}
                  onClick={() => setLsForm({...lsForm, payment_status:'unpaid'})}>
                  <span className="material-icons" style={{fontSize:16, color:(lsForm.payment_status||'unpaid')==='unpaid'?'#F59E0B':'var(--text-2)'}}>schedule</span>
                  <span style={{ fontSize:13, fontWeight:600, color:(lsForm.payment_status||'unpaid')==='unpaid'?'#F59E0B':'var(--text-2)' }}>Ödenmedi</span>
                </button>
                <button style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'11px', borderRadius:12, border: lsForm.payment_status === 'paid' ? '1.5px solid #22C55E' : '1.5px solid var(--border)', background: lsForm.payment_status === 'paid' ? '#DCFCE7' : 'var(--bg)', cursor:'pointer' }}
                  onClick={() => setLsForm({...lsForm, payment_status:'paid'})}>
                  <span className="material-icons" style={{fontSize:16, color:lsForm.payment_status==='paid'?'#22C55E':'var(--text-2)'}}>check_circle</span>
                  <span style={{ fontSize:13, fontWeight:600, color:lsForm.payment_status==='paid'?'#22C55E':'var(--text-2)' }}>Ödendi</span>
                </button>
              </div>

              <button
                style={{ width:'100%', background:'var(--brand-navy)', color:'#fff', border:'none', borderRadius:14, padding:'15px', fontSize:15, fontWeight:800, cursor: lsSaving ? 'not-allowed' : 'pointer', opacity: lsSaving ? 0.6 : 1 }}
                onClick={saveNewLesson} disabled={lsSaving}>
                {lsSaving ? 'Kaydediliyor...' : 'Dersi Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Grup Dersi Ekleme Modalı ── */}
      {grpModal && slotClickInfo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1250, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if (e.target === e.currentTarget && !grpSaving) { setGrpModal(null); setSlotClickInfo(null); } }}>
          <div style={{ background:'#fff', borderRadius:20, width:'min(480px,95vw)', maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:'var(--text-1)' }}>Grup Dersi Ekle</div>
                <div style={{ fontSize:13, color:'var(--text-2)', marginTop:2 }}>
                  {slotClickInfo.courtIds.map(id => { const c = courts.find(x => x.id === id); return c ? `Kort ${c.court_number}` : ''; }).join(', ')}
                  {' · '}{String(slotClickInfo.startHour).padStart(2,'0')}:{String(slotClickInfo.startMinute||0).padStart(2,'0')} – {String(slotClickInfo.endHour).padStart(2,'0')}:{String(slotClickInfo.endMinute||0).padStart(2,'0')}
                  {' · '}{new Date(selDate + 'T12:00:00').toLocaleDateString('tr-TR', { weekday:'short', day:'numeric', month:'short' })}
                </div>
              </div>
              <button onClick={() => { setGrpModal(null); setSlotClickInfo(null); }} disabled={grpSaving}
                style={{ background:'none', border:'none', cursor:'pointer', padding:8 }}>
                <span className="material-icons" style={{ color:'var(--text-2)' }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY:'auto', flex:1, padding:'20px', display:'flex', flexDirection:'column', gap:20 }}>

              {/* Kalıcı / Bu Seferlik toggle */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:10, letterSpacing:0.4 }}>EKLEME TÜRÜ</div>
                <div style={{ display:'flex', gap:8 }}>
                  {[{v:false,label:'Bu Seferlik',icon:'today',desc:'Sadece bu tarih için'},{v:true,label:'Kalıcı',icon:'repeat',desc:'Her hafta tekrarlanır'}].map(({v,label,icon,desc}) => {
                    const sel = grpIsRecurring === v;
                    return (
                      <div key={String(v)} onClick={() => setGrpIsRecurring(v)}
                        style={{ flex:1, padding:'12px 14px', borderRadius:14, border: sel ? '2px solid #0891B2' : '1.5px solid var(--border)', background: sel ? '#E0F7FA' : 'var(--bg)', cursor:'pointer', transition:'all 0.12s' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                          <span className="material-icons" style={{ fontSize:17, color: sel ? '#0891B2' : 'var(--text-2)' }}>{icon}</span>
                          <span style={{ fontSize:13, fontWeight:700, color: sel ? '#0E7490' : 'var(--text-1)' }}>{label}</span>
                        </div>
                        <div style={{ fontSize:11, color:'var(--text-2)' }}>{desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grup seçimi */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:10, letterSpacing:0.4 }}>GRUP</div>
                {grpGroups.length === 0 ? (
                  <div style={{ padding:20, textAlign:'center', color:'var(--text-2)', fontSize:13 }}>Aktif grup bulunamadı.</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {grpGroups.map(g => {
                      const sel   = grpSelectedId === g.id;
                      const coach = coachesList.find(c => c.id === g.coach_id);
                      return (
                        <div key={g.id} onClick={() => setGrpSelectedId(sel ? '' : g.id)}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:14, border: sel ? '2px solid #0891B2' : '1.5px solid var(--border)', background: sel ? '#E0F7FA' : 'var(--bg)', cursor:'pointer', transition:'all 0.12s' }}>
                          <div style={{ width:36, height:36, borderRadius:10, background: sel ? '#0891B2' : '#E2E8F0', display:'grid', placeItems:'center', flexShrink:0 }}>
                            <span className="material-icons" style={{ fontSize:18, color: sel ? '#fff' : 'var(--text-2)' }}>groups</span>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, fontWeight:700, color: sel ? '#0E7490' : 'var(--text-1)' }}>{g.name}</div>
                            {coach && <div style={{ fontSize:12, color:'var(--text-2)', marginTop:1 }}>{coach.full_name}</div>}
                          </div>
                          {sel && <span className="material-icons" style={{ color:'#0891B2', fontSize:20 }}>check_circle</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seçili grubun hocaları */}
              {grpSelectedId && (
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:10, letterSpacing:0.4 }}>
                    DERSE GİRECEK HOCALAR
                    {grpLoadingDetails && <span style={{ fontWeight:400, marginLeft:8 }}>yükleniyor…</span>}
                  </div>
                  {!grpLoadingDetails && grpGroupCoaches.length === 0 && (
                    <div style={{ fontSize:13, color:'var(--text-2)' }}>Bu gruba tanımlı hoca yok.</div>
                  )}
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {grpGroupCoaches.map(gc => {
                      const checked = grpSelectedCoaches.has(gc.coach_id);
                      return (
                        <div key={gc.coach_id}
                          onClick={() => {
                            setGrpSelectedCoaches(prev => {
                              const next = new Set(prev);
                              checked ? next.delete(gc.coach_id) : next.add(gc.coach_id);
                              return next;
                            });
                          }}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:12, border:'1.5px solid var(--border)', background: checked ? '#F0FDF4' : 'var(--bg)', cursor:'pointer', transition:'all 0.1s' }}>
                          <div style={{ width:32, height:32, borderRadius:50, background: checked ? '#16A34A' : '#E2E8F0', display:'grid', placeItems:'center', flexShrink:0 }}>
                            <span className="material-icons" style={{ fontSize:16, color: checked ? '#fff' : 'var(--text-2)' }}>person</span>
                          </div>
                          <span style={{ flex:1, fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{gc.full_name}</span>
                          <span className="material-icons" style={{ fontSize:20, color: checked ? '#16A34A' : '#CBD5E1' }}>
                            {checked ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seçili grubun üyeleri */}
              {grpSelectedId && (
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:6, letterSpacing:0.4 }}>
                    DERSE GELECEKLEr (KATILIM)
                    {grpLoadingDetails && <span style={{ fontWeight:400, marginLeft:8 }}>yükleniyor…</span>}
                  </div>
                  {!grpLoadingDetails && grpMembers.length > 0 && (
                    <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                      <button onClick={() => setGrpSelectedMembers(new Set(grpMembers.map(m => m.id)))}
                        style={{ fontSize:12, fontWeight:600, color:'#16A34A', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'4px 10px', cursor:'pointer' }}>
                        Tümünü Seç
                      </button>
                      <button onClick={() => setGrpSelectedMembers(new Set())}
                        style={{ fontSize:12, fontWeight:600, color:'#DC2626', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'4px 10px', cursor:'pointer' }}>
                        Temizle
                      </button>
                    </div>
                  )}
                  {!grpLoadingDetails && grpMembers.length === 0 && (
                    <div style={{ fontSize:13, color:'var(--text-2)' }}>Bu grupta üye yok.</div>
                  )}
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {grpMembers.map(m => {
                      const checked = grpSelectedMembers.has(m.id);
                      return (
                        <div key={m.id}
                          onClick={() => {
                            setGrpSelectedMembers(prev => {
                              const next = new Set(prev);
                              checked ? next.delete(m.id) : next.add(m.id);
                              return next;
                            });
                          }}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:12, border:'1.5px solid var(--border)', background: checked ? '#F0FDF4' : '#FEF2F2', cursor:'pointer', transition:'all 0.1s' }}>
                          <div style={{ width:32, height:32, borderRadius:50, background: checked ? '#16A34A' : '#FCA5A5', display:'grid', placeItems:'center', flexShrink:0 }}>
                            <span style={{ fontSize:12, fontWeight:800, color:'#fff' }}>
                              {(m.member_name||'').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                            </span>
                          </div>
                          <span style={{ flex:1, fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{m.member_name}</span>
                          <span className="material-icons" style={{ fontSize:20, color: checked ? '#16A34A' : '#CBD5E1' }}>
                            {checked ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div style={{ display:'flex', gap:10, padding:'16px 20px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
              <button onClick={() => { setGrpModal(null); setSlotClickInfo(null); }} disabled={grpSaving}
                style={{ flex:1, padding:'13px', borderRadius:14, border:'1.5px solid var(--border)', background:'var(--bg)', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--text-2)' }}>
                İptal
              </button>
              <button onClick={saveGroupLesson} disabled={!grpSelectedId || grpSaving || grpLoadingDetails}
                style={{ flex:2, padding:'13px', borderRadius:14, border:'none', cursor:(!grpSelectedId || grpSaving || grpLoadingDetails) ? 'not-allowed' : 'pointer', fontSize:14, fontWeight:800, color:'#fff', background:(!grpSelectedId || grpSaving || grpLoadingDetails) ? '#94a3b8' : '#0891B2' }}>
                {grpSaving ? 'Kaydediliyor...' : grpIsRecurring ? 'Kalıcı Ekle' : 'Bu Seferlik Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inline Rezervasyon Modalı ── */}
      {bookingModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if (e.target === e.currentTarget && !bookingSaving) { setBookingModal(false); setSlotClickInfo(null); } }}>
          <div style={{ background:'#fff', borderRadius:20, width:'min(480px,95vw)', maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>

            {/* Header */}
            <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:17, fontWeight:800, color:'var(--text-1)' }}>Yeni Rezervasyon</span>
                <button onClick={() => { setBookingModal(false); setSlotClickInfo(null); }} disabled={bookingSaving}
                  style={{ background:'none', border:'none', cursor:'pointer', display:'grid', placeItems:'center' }}>
                  <span className="material-icons" style={{ fontSize:22, color:'var(--text-2)' }}>close</span>
                </button>
              </div>
              {/* Read-only özet: saat + kort + tarih */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#EEF2FF', color:'var(--brand-navy)', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700 }}>
                  <span className="material-icons" style={{ fontSize:13 }}>schedule</span>
                  {bookingForm.startTime} – {bookingForm.endTime}
                </span>
                {bookingForm.courtId && courts.find(c => c.id === bookingForm.courtId) && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#EEF2FF', color:'var(--brand-navy)', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700 }}>
                    <span className="material-icons" style={{ fontSize:13 }}>sports_tennis</span>
                    Kort {courts.find(c => c.id === bookingForm.courtId).court_number}
                  </span>
                )}
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#F1F5F9', color:'var(--text-2)', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:600 }}>
                  <span className="material-icons" style={{ fontSize:13 }}>calendar_today</span>
                  {new Date((bookingForm.date||'') + 'T12:00:00').toLocaleDateString('tr-TR', { day:'numeric', month:'short', year:'numeric' })}
                </span>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY:'auto', flex:1, padding:'16px 20px', display:'flex', flexDirection:'column', gap:16 }}>

              {/* Kişi seçimi — birleşik arama */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:0.4 }}>KİŞİ (OPSİYONEL)</div>
                {(bookingMemberId || bookingCustomerId) ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', border:'1.5px solid var(--brand-navy)', borderRadius:12, padding:'10px 12px', background:'#EEF2FF' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--brand-navy)' }}>{bookingMemberName || bookingCustomerName}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:'#fff', background: bookingCustomerId && !bookingMemberId ? '#0891B2' : 'var(--brand-navy)', borderRadius:5, padding:'2px 6px' }}>
                        {bookingCustomerId && !bookingMemberId ? 'Müşteri' : 'Oyuncu'}
                      </span>
                    </div>
                    <button type="button"
                      onClick={() => { setBookingMemberId(null); setBookingMemberName(''); setBookingMemberQuery(''); setBookingMemberResults([]); setBookingCustomerId(null); setBookingCustomerName(''); setBookingCustomerQuery(''); setBookingCustomerResults([]); }}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:4, display:'grid', placeItems:'center' }}>
                      <span className="material-icons" style={{ fontSize:18, color:'var(--text-2)' }}>close</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ position:'relative' }}>
                    <input placeholder="Ad, telefon veya e-posta ile ara..."
                      value={bookingMemberQuery}
                      onChange={e => searchBookingPerson(e.target.value)}
                      style={{ width:'100%', border:'1.5px solid var(--border)', borderRadius:12, padding:'10px 12px', fontSize:14, boxSizing:'border-box', color:'var(--text-1)', background:'var(--bg)' }} />
                    {(bookingMemberResults.length > 0 || bookingCustomerResults.length > 0) && (
                      <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:10, background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:12, boxShadow:'0 4px 16px rgba(0,0,0,0.12)', overflow:'hidden', marginTop:4 }}>
                        {bookingMemberResults.map(m => (
                          <div key={'p-'+m.id}
                            style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}
                            onMouseDown={() => { setBookingMemberId(m.id); setBookingMemberName(m.full_name); setBookingPersonMode('member'); setBookingMemberQuery(''); setBookingMemberResults([]); setBookingCustomerResults([]); }}>
                            <div>
                              <div style={{ fontSize:14, fontWeight:600, color:'var(--text-1)' }}>{m.full_name}</div>
                              <div style={{ fontSize:12, color:'var(--text-2)' }}>{m.email}</div>
                            </div>
                            <span style={{ fontSize:10, fontWeight:700, color:'#fff', background:'var(--brand-navy)', borderRadius:5, padding:'2px 6px', flexShrink:0, marginLeft:8 }}>Oyuncu</span>
                          </div>
                        ))}
                        {bookingCustomerResults.map(c => (
                          <div key={'c-'+c.id}
                            style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}
                            onMouseDown={() => {
                              setBookingCustomerId(c.id); setBookingCustomerName(c.full_name); setBookingPersonMode('customer');
                              if (c.user_id) { setBookingMemberId(c.user_id); setBookingMemberName(c.full_name); }
                              setBookingMemberQuery(''); setBookingMemberResults([]); setBookingCustomerResults([]);
                            }}>
                            <div>
                              <div style={{ fontSize:14, fontWeight:600, color:'var(--text-1)' }}>{c.full_name}</div>
                              <div style={{ fontSize:12, color:'var(--text-2)' }}>{c.phone || c.email || ''}</div>
                            </div>
                            <span style={{ fontSize:10, fontWeight:700, color:'#fff', background:'#0891B2', borderRadius:5, padding:'2px 6px', flexShrink:0, marginLeft:8 }}>Müşteri</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Özet */}
              {bookingForm.courtId && (() => {
                const court = courts.find(c => c.id === bookingForm.courtId);
                const dh    = (bookingForm.duration || 1);
                const total = Math.round((court?.hourly_rate || 0) * dh * 100) / 100;
                const fmtD  = d => d === 0.75 ? '45 dk' : d === 1.5 ? '1,5 saat' : `${d} saat`;
                return (
                  <div style={{ background:'#F8FAFC', borderRadius:14, padding:'16px 18px', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:12, letterSpacing:0.4 }}>REZERVASYON ÖZETİ</div>
                    {[
                      { label:'Tarih', value: new Date((bookingForm.date||'') + 'T12:00:00').toLocaleDateString('tr-TR') },
                      { label:'Saat',  value: `${bookingForm.startTime} – ${bookingForm.endTime}` },
                      { label:'Süre',  value: fmtD(dh) },
                      { label:'Kort',  value: `Kort ${court?.court_number}` },
                      ...(bookingPersonMode === 'member' && bookingMemberName ? [{ label:'Üye', value: bookingMemberName }] : []),
                      ...(bookingPersonMode === 'customer' && bookingCustomerName ? [{ label:'Müşteri', value: bookingCustomerName }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ fontSize:13, color:'var(--text-2)' }}>{label}:</span>
                        <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ borderTop:'1px solid var(--border)', paddingTop:10, marginTop:4, display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--text-1)' }}>Toplam:</span>
                      <span style={{ fontSize:16, fontWeight:800, color:'var(--brand-navy)' }}>₺{total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

            </div>{/* end scrollable body */}

            {/* Footer */}
            <div style={{ display:'flex', gap:10, padding:'16px 24px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
              <button onClick={() => { setBookingModal(false); setSlotClickInfo(null); }} disabled={bookingSaving}
                style={{ flex:1, padding:'13px', borderRadius:14, border:'1.5px solid var(--border)', background:'var(--bg)', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--text-2)' }}>
                İptal
              </button>
              <button onClick={saveInlineBooking}
                disabled={!bookingForm.courtId || bookingSaving || bookingCourtsLoading}
                style={{ flex:2, padding:'13px', borderRadius:14, border:'none', cursor:(!bookingForm.courtId || bookingSaving || bookingCourtsLoading) ? 'not-allowed' : 'pointer', fontSize:14, fontWeight:700, color:'#fff', background:(!bookingForm.courtId || bookingSaving || bookingCourtsLoading) ? '#94a3b8' : 'var(--brand-navy)' }}>
                {bookingSaving ? 'Kaydediliyor...' : 'Rezervasyon Oluştur'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// KAFE YÖNETİMİ
// ═══════════════════════════════════════════════════════════════
const CAFE_CATEGORIES = ['İçecek', 'Yiyecek', 'Sporcu Ürünü', 'Ekipman', 'Diğer'];

function CafeScreen({ clubId }) {
  const { useState, useEffect, useMemo } = React;
  const [tab,      setTab]      = useState('products'); // 'products' | 'sales'
  const [items,    setItems]    = useState([]);
  const [sales,    setSales]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [loadingS, setLoadingS] = useState(false);
  const [modal,    setModal]    = useState(null); // null | 'add_product' | 'edit_product' | 'sale'
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);
  const [catFilter,setCatFilter]= useState('all');
  // Sepet: { [productId]: qty }
  const [cart,     setCart]     = useState({});
  const [saleNote, setSaleNote] = useState('');

  useEffect(() => { if (clubId) loadProducts(); }, [clubId]);
  useEffect(() => { if (clubId && tab === 'sales') loadSales(); }, [clubId, tab]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await sb.from('cafe_products')
        .select('*').eq('club_id', clubId)
        .order('category').order('name');
      setItems(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadSales = async () => {
    setLoadingS(true);
    try {
      const { data } = await sb.from('cafe_sales')
        .select('*, items:cafe_sale_items(*)')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })
        .limit(100);
      setSales(data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingS(false); }
  };

  // ── Ürün CRUD ───────────────────────────────────────────────
  const saveProduct = async () => {
    if (!form.name?.trim()) { alert('Ürün adı zorunludur.'); return; }
    if (form.price === '' || form.price == null) { alert('Fiyat zorunludur.'); return; }
    setSaving(true);
    try {
      const payload = {
        name:           form.name.trim(),
        category:       form.category || 'Diğer',
        price:          parseFloat(form.price) || 0,
        is_available:   form.is_available !== false,
        stock_quantity: form.stock_quantity !== '' && form.stock_quantity != null ? parseInt(form.stock_quantity) : null,
      };
      if (form.id) {
        await sb.from('cafe_products').update(payload).eq('id', form.id);
      } else {
        await sb.from('cafe_products').insert({ club_id: clubId, ...payload });
      }
      setModal(null);
      loadProducts();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const delProduct = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    await sb.from('cafe_products').delete().eq('id', id);
    loadProducts();
  };

  const toggleAvail = async (item) => {
    await sb.from('cafe_products').update({ is_available: !item.is_available }).eq('id', item.id);
    loadProducts();
  };

  // ── Satış akışı ─────────────────────────────────────────────
  const cartItems = useMemo(() =>
    Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const p = items.find(i => i.id === id);
        return p ? { product: p, qty, subtotal: p.price * qty } : null;
      }).filter(Boolean),
    [cart, items]
  );

  const cartTotal = useMemo(() => cartItems.reduce((s, ci) => s + ci.subtotal, 0), [cartItems]);

  const setQty = (productId, delta) => {
    setCart(prev => {
      const cur = prev[productId] || 0;
      const next = Math.max(0, cur + delta);
      const product = items.find(i => i.id === productId);
      // stok sınırı kontrolü
      if (delta > 0 && product?.stock_quantity != null && next > product.stock_quantity) return prev;
      return { ...prev, [productId]: next };
    });
  };

  const completeSale = async () => {
    if (cartItems.length === 0) { alert('Sepet boş.'); return; }
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1) cafe_sales kaydı
      const { data: sale, error: sErr } = await sb.from('cafe_sales').insert({
        club_id:      clubId,
        total_amount: cartTotal,
        notes:        saleNote.trim() || null,
        sale_date:    today,
      }).select().single();
      if (sErr) throw sErr;

      // 2) cafe_sale_items kalemleri
      const saleItems = cartItems.map(ci => ({
        sale_id:      sale.id,
        product_id:   ci.product.id,
        product_name: ci.product.name,
        unit_price:   ci.product.price,
        quantity:     ci.qty,
        subtotal:     ci.subtotal,
      }));
      const { error: iErr } = await sb.from('cafe_sale_items').insert(saleItems);
      if (iErr) throw iErr;

      // 3) club_finances'a gelir kaydı
      await sb.from('club_finances').insert({
        club_id:     clubId,
        type:        'income',
        category:    'Kafe Geliri',
        amount:      cartTotal,
        description: saleNote.trim() ? `Kafe Satışı — ${saleNote.trim()}` : 'Kafe Satışı',
        date:        today,
      });

      // 4) Stok düşümü — stok_quantity olan ürünler için
      await Promise.all(
        cartItems
          .filter(ci => ci.product.stock_quantity != null)
          .map(ci =>
            sb.from('cafe_products')
              .update({ stock_quantity: Math.max(0, ci.product.stock_quantity - ci.qty) })
              .eq('id', ci.product.id)
          )
      );

      setModal(null);
      setCart({});
      setSaleNote('');
      loadProducts();
      if (tab === 'sales') loadSales();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const categories = useMemo(() => ['all', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))], [items]);
  const filtered   = catFilter === 'all' ? items : items.filter(i => i.category === catFilter);

  const availableForSale = useMemo(() => items.filter(i => i.is_available), [items]);

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Kafe / Market</h1>
          <div className="sub">{items.length} ürün · {items.filter(i => i.is_available).length} satışta</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost" onClick={() => { setCart({}); setSaleNote(''); setModal('sale'); }}>
            <span className="material-icons">point_of_sale</span> Satış Yap
          </button>
          <button className="btn btn-pri" onClick={() => { setForm({ is_available: true, category: 'İçecek' }); setModal('add_product'); }}>
            <span className="material-icons">add</span> Ürün Ekle
          </button>
        </div>
      </div>

      {/* Sekmeler */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
        {[{ key:'products', label:'Ürünler' }, { key:'sales', label:'Satış Geçmişi' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'8px 18px', fontWeight:600, fontSize:13, background:'none', border:'none', cursor:'pointer',
              borderBottom: tab === t.key ? '2px solid var(--brand-navy)' : '2px solid transparent',
              color: tab === t.key ? 'var(--brand-navy)' : 'var(--text-2)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ÜRÜNLER SEKMESİ ── */}
      {tab === 'products' && (
        <>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
            {categories.map(cat => (
              <button key={cat} className={`btn btn-sm ${catFilter === cat ? 'btn-pri' : 'btn-ghost'}`}
                onClick={() => setCatFilter(cat)}>
                {cat === 'all' ? 'Tümü' : cat}
              </button>
            ))}
          </div>

          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState icon="local_cafe" title="Ürün bulunamadı" sub="Kafe & market ürünlerinizi ekleyin." />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
              {filtered.map(item => {
                const lowStock = item.stock_quantity != null && item.stock_quantity <= 3;
                return (
                  <div key={item.id} className="card" style={{ opacity: item.is_available ? 1 : 0.55 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15 }}>{item.name}</div>
                        <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2 }}>{item.category}</div>
                      </div>
                      <div style={{ fontWeight:800, fontSize:18, color:'var(--brand-navy)' }}>{fmtMoney(item.price)}</div>
                    </div>
                    {item.stock_quantity != null && (
                      <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
                        <span className="material-icons" style={{ fontSize:14, color: lowStock ? '#EF4444' : '#22C55E' }}>inventory_2</span>
                        <span style={{ fontSize:12, fontWeight:600, color: lowStock ? '#EF4444' : 'var(--text-2)' }}>
                          Stok: {item.stock_quantity} {lowStock ? '(Az kaldı!)' : ''}
                        </span>
                      </div>
                    )}
                    <div style={{ display:'flex', gap:6, marginTop:12 }}>
                      <button className="btn btn-ghost btn-sm" style={{ flex:1 }}
                        onClick={() => { setForm({ ...item, stock_quantity: item.stock_quantity ?? '' }); setModal('edit_product'); }}>
                        <span className="material-icons" style={{ fontSize:13 }}>edit</span>
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => toggleAvail(item)}>
                        {item.is_available ? 'Durdur' : 'Aktif Et'}
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => delProduct(item.id)}>
                        <span className="material-icons" style={{ fontSize:14 }}>delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── SATIŞ GEÇMİŞİ SEKMESİ ── */}
      {tab === 'sales' && (
        loadingS ? <Spinner /> : sales.length === 0 ? (
          <EmptyState icon="receipt_long" title="Satış kaydı yok" sub="Satış yaptıkça burada görünür." />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {sales.map(sale => (
              <div key={sale.id} className="card" style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div>
                    <span style={{ fontWeight:700, fontSize:14 }}>{sale.sale_date}</span>
                    {sale.notes && <span style={{ fontSize:12, color:'var(--text-2)', marginLeft:10 }}>{sale.notes}</span>}
                  </div>
                  <span style={{ fontWeight:800, fontSize:16, color:'var(--brand-navy)' }}>{fmtMoney(sale.total_amount)}</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {(sale.items || []).map((it, idx) => (
                    <span key={idx} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:6, padding:'3px 8px', fontSize:12 }}>
                      {it.product_name} × {it.quantity} — {fmtMoney(it.subtotal)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── ÜRÜN EKLE / DÜZENLE MODALİ ── */}
      {(modal === 'add_product' || modal === 'edit_product') && (
        <Modal title={modal === 'edit_product' ? 'Ürünü Düzenle' : 'Yeni Ürün'} wide
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={saveProduct} disabled={saving}>
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </>
          }>
          <div className="fields" style={{ gap:14 }}>
            <Field label="Ürün Adı *">
              <input placeholder="Örn: Su, Enerji İçeceği" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
            </Field>
            <div className="fields-2">
              <Field label="Kategori">
                <select value={form.category || 'Diğer'} onChange={e => setForm({...form, category: e.target.value})}>
                  {CAFE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Fiyat (₺) *">
                <input type="number" min={0} step={0.5} placeholder="0.00" value={form.price ?? ''} onChange={e => setForm({...form, price: e.target.value})} />
              </Field>
            </div>
            <Field label="Başlangıç Stoğu">
              <input type="number" min={0} placeholder="Boş bırakılırsa sınırsız" value={form.stock_quantity ?? ''} onChange={e => setForm({...form, stock_quantity: e.target.value})} />
            </Field>
            <Switch on={form.is_available !== false} onChange={v => setForm({...form, is_available: v})} label="Satışta" />
          </div>
        </Modal>
      )}

      {/* ── SATIŞ YAPMA MODALİ ── */}
      {modal === 'sale' && (
        <Modal title="Satış Yap" wide onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={completeSale} disabled={saving || cartItems.length === 0}>
                {saving ? 'Kaydediliyor…' : `Tamamla — ${fmtMoney(cartTotal)}`}
              </button>
            </>
          }>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {availableForSale.length === 0 ? (
              <p style={{ color:'var(--text-2)', textAlign:'center', padding:20 }}>Satışta ürün yok.</p>
            ) : availableForSale.map(item => {
              const qty = cart[item.id] || 0;
              const outOfStock = item.stock_quantity != null && item.stock_quantity === 0;
              return (
                <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                  background: outOfStock ? '#FEF2F2' : qty > 0 ? '#F0FDF4' : 'var(--bg)',
                  borderRadius:10, border:`1px solid ${qty > 0 ? '#22C55E' : 'var(--border)'}` }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{item.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-2)' }}>
                      {fmtMoney(item.price)}
                      {item.stock_quantity != null && ` · Stok: ${item.stock_quantity}`}
                      {outOfStock && <span style={{ color:'#EF4444', marginLeft:6 }}>Tükendi</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button onClick={() => setQty(item.id, -1)} disabled={qty === 0}
                      style={{ width:28, height:28, borderRadius:8, border:'1px solid var(--border)', background:'#fff', cursor: qty>0?'pointer':'not-allowed', fontSize:16, display:'grid', placeItems:'center' }}>−</button>
                    <span style={{ width:24, textAlign:'center', fontWeight:700, fontSize:15 }}>{qty}</span>
                    <button onClick={() => setQty(item.id, 1)} disabled={outOfStock}
                      style={{ width:28, height:28, borderRadius:8, border:'1px solid var(--border)', background:'#fff', cursor: outOfStock?'not-allowed':'pointer', fontSize:16, display:'grid', placeItems:'center' }}>+</button>
                  </div>
                  {qty > 0 && (
                    <div style={{ width:64, textAlign:'right', fontWeight:700, fontSize:13, color:'var(--brand-navy)' }}>
                      {fmtMoney(item.price * qty)}
                    </div>
                  )}
                </div>
              );
            })}

            {cartItems.length > 0 && (
              <div style={{ marginTop:12, borderTop:'2px solid var(--border)', paddingTop:12 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>
                  Toplam: <span style={{ color:'var(--brand-navy)' }}>{fmtMoney(cartTotal)}</span>
                  <span style={{ fontWeight:400, fontSize:12, color:'var(--text-2)', marginLeft:8 }}>{cartItems.length} kalem</span>
                </div>
                <input placeholder="Not (isteğe bağlı)…" value={saleNote} onChange={e => setSaleNote(e.target.value)}
                  style={{ width:'100%' }} />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRATİK MAÇ YÖNETİMİ
// ═══════════════════════════════════════════════════════════════
function PracticeMatchesScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [matches,  setMatches]  = useState([]);
  const [courts,   setCourts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');

  useEffect(() => { if (clubId) load(); }, [clubId]);

  const load = async () => {
    setLoading(true);
    try {
      const courtIds = await getClubCourtIds(clubId);
      const [mRes, cRes] = await Promise.all([
        sb.from('practice_matches')
          .select('*')
          .eq('club_id', clubId)
          .order('match_date', { ascending: false }),
        sb.from('courts').select('id, court_number, court_type').eq('club_id', clubId).eq('is_active', true),
      ]);
      setMatches(mRes.data || []);
      setCourts(cRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.player1_name?.trim()) { alert('Oyuncu 1 adı zorunludur.'); return; }
    if (!form.player2_name?.trim()) { alert('Oyuncu 2 adı zorunludur.'); return; }
    if (!form.match_date)           { alert('Tarih zorunludur.'); return; }
    setSaving(true);
    try {
      const payload = {
        player1_name:   form.player1_name.trim(),
        player2_name:   form.player2_name.trim(),
        player3_name:   form.player3_name?.trim() || null,
        player4_name:   form.player4_name?.trim() || null,
        match_date:     form.match_date,
        start_time:     form.start_time || null,
        court_id:       form.court_id   || null,
        score:          form.score?.trim() || null,
        match_type:     form.match_type || 'singles',
        notes:          form.notes?.trim() || null,
        status:         form.status || 'scheduled',
      };
      if (form.id) {
        await sb.from('practice_matches').update(payload).eq('id', form.id);
      } else {
        await sb.from('practice_matches').insert({ club_id: clubId, ...payload });
      }
      setModal(false);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Bu maçı silmek istediğinize emin misiniz?')) return;
    await sb.from('practice_matches').delete().eq('id', id);
    load();
  };

  const STATUS_LABELS = { scheduled:'Planlandı', ongoing:'Devam Ediyor', completed:'Tamamlandı', cancelled:'İptal' };
  const STATUS_CLS    = { scheduled:'b-info', ongoing:'b-success', completed:'b-muted', cancelled:'b-danger' };

  const filtered = search
    ? matches.filter(m =>
        m.player1_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.player2_name?.toLowerCase().includes(search.toLowerCase()))
    : matches;

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Pratik Maçlar</h1>
          <div className="sub">{matches.length} kayıtlı maç</div>
        </div>
        <button className="btn btn-pri" onClick={() => { setForm({ match_type:'singles', status:'scheduled', match_date: todayISO() }); setModal(true); }}>
          <span className="material-icons">add</span> Maç Ekle
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="search">
            <span className="material-icons">search</span>
            <input placeholder="Oyuncu ara…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="sports_tennis" title="Maç bulunamadı" sub="Pratik maç kaydetmek için + butonunu kullanın." />
        ) : (
          <div>
            {filtered.map((m, i) => {
              const court = courts.find(c => c.id === m.court_id);
              const isDoubles = m.match_type === 'doubles';
              return (
                <div key={m.id} style={{ padding:'14px 16px', borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span className="material-icons" style={{ color:'var(--brand-navy)', fontSize:20 }}>sports_tennis</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:700, fontSize:14 }}>
                          {isDoubles
                            ? `${m.player1_name}/${m.player3_name || '?'} vs ${m.player2_name}/${m.player4_name || '?'}`
                            : `${m.player1_name} vs ${m.player2_name}`}
                        </span>
                        <Badge cls={STATUS_CLS[m.status] || ''}>{STATUS_LABELS[m.status] || m.status}</Badge>
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-2)', marginTop:4, display:'flex', gap:10, flexWrap:'wrap' }}>
                        <span><span className="material-icons" style={{ fontSize:12, verticalAlign:'middle' }}>calendar_today</span> {fmtDate(m.match_date)}</span>
                        {m.start_time && <span>{m.start_time.slice(0,5)}</span>}
                        {court && <span>Kort {court.court_number}</span>}
                        {m.score && <span style={{ fontWeight:700, color:'var(--brand-navy)' }}>{m.score}</span>}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setForm({ ...m }); setModal(true); }}>
                        <span className="material-icons" style={{ fontSize:14 }}>edit</span>
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => del(m.id)}>
                        <span className="material-icons" style={{ fontSize:14 }}>delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={form.id ? 'Maçı Düzenle' : 'Pratik Maç Ekle'} wide
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={save} disabled={saving}>
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </>
          }>
          <div className="fields" style={{ gap:14 }}>
            <Field label="Maç Türü">
              <div style={{ display:'flex', gap:8 }}>
                {['singles', 'doubles'].map(t => (
                  <button key={t} type="button"
                    style={{ flex:1, padding:'9px', borderRadius:10, border:'1.5px solid', fontWeight:600, fontSize:13, cursor:'pointer',
                      borderColor: form.match_type === t ? 'var(--brand-navy)' : 'var(--border)',
                      background:  form.match_type === t ? 'var(--brand-navy)' : 'var(--bg)',
                      color:       form.match_type === t ? '#fff' : 'var(--text-2)' }}
                    onClick={() => setForm({...form, match_type: t})}>
                    {t === 'singles' ? 'Tekler' : 'Çiftler'}
                  </button>
                ))}
              </div>
            </Field>
            <div className="fields-2">
              <Field label="Oyuncu 1 *">
                <input placeholder="Ad Soyad" value={form.player1_name || ''} onChange={e => setForm({...form, player1_name: e.target.value})} />
              </Field>
              <Field label="Oyuncu 2 *">
                <input placeholder="Ad Soyad" value={form.player2_name || ''} onChange={e => setForm({...form, player2_name: e.target.value})} />
              </Field>
            </div>
            {form.match_type === 'doubles' && (
              <div className="fields-2">
                <Field label="Oyuncu 3 (1. takım eşi)">
                  <input placeholder="Ad Soyad" value={form.player3_name || ''} onChange={e => setForm({...form, player3_name: e.target.value})} />
                </Field>
                <Field label="Oyuncu 4 (2. takım eşi)">
                  <input placeholder="Ad Soyad" value={form.player4_name || ''} onChange={e => setForm({...form, player4_name: e.target.value})} />
                </Field>
              </div>
            )}
            <div className="fields-2">
              <Field label="Tarih *">
                <input type="date" value={form.match_date || ''} onChange={e => setForm({...form, match_date: e.target.value})} />
              </Field>
              <Field label="Saat">
                <input type="time" value={form.start_time || ''} onChange={e => setForm({...form, start_time: e.target.value})} />
              </Field>
            </div>
            <div className="fields-2">
              <Field label="Kort">
                <select value={form.court_id || ''} onChange={e => setForm({...form, court_id: e.target.value})}>
                  <option value="">Kort seçin</option>
                  {courts.map(c => <option key={c.id} value={c.id}>Kort {c.court_number} ({c.court_type})</option>)}
                </select>
              </Field>
              <Field label="Durum">
                <select value={form.status || 'scheduled'} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="scheduled">Planlandı</option>
                  <option value="ongoing">Devam Ediyor</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal</option>
                </select>
              </Field>
            </div>
            <Field label="Skor (örn: 6-4, 7-5)">
              <input placeholder="Skor girin" value={form.score || ''} onChange={e => setForm({...form, score: e.target.value})} />
            </Field>
            <Field label="Notlar">
              <textarea rows={2} placeholder="İsteğe bağlı notlar…" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} style={{ resize:'vertical' }} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BİLDİRİM TERCİHLERİ
// ═══════════════════════════════════════════════════════════════
const NOTIF_TYPES = [
  { key:'booking_created',    label:'Rezervasyon Oluşturuldu',   icon:'calendar_today',    desc:'Yeni bir rezervasyon oluşturulduğunda' },
  { key:'booking_confirmed',  label:'Rezervasyon Onaylandı',     icon:'check_circle',      desc:'Rezervasyon onaylandığında' },
  { key:'booking_cancelled',  label:'Rezervasyon İptal Edildi',  icon:'cancel',            desc:'Rezervasyon iptal edildiğinde' },
  { key:'payment_success',    label:'Ödeme Alındı',              icon:'payments',          desc:'Başarılı ödeme alındığında' },
  { key:'membership_request', label:'Üyelik Başvurusu',          icon:'person_add',        desc:'Yeni üyelik başvurusu geldiğinde' },
  { key:'membership_accepted',label:'Üyelik Onaylandı',          icon:'how_to_reg',        desc:'Üyelik başvurusu onaylandığında' },
  { key:'lesson_created',     label:'Ders Oluşturuldu',          icon:'school',            desc:'Yeni ders eklendiğinde' },
  { key:'lesson_reminder',    label:'Ders Hatırlatıcısı',        icon:'alarm',             desc:'Ders başlamadan önce hatırlatma' },
  { key:'message',            label:'Yeni Mesaj',                icon:'chat',              desc:'Yeni mesaj alındığında' },
  { key:'review',             label:'Yeni Yorum',                icon:'star',              desc:'Yeni kulüp yorumu geldiğinde' },
  { key:'lesson_request',     label:'Ders Talebi',               icon:'school',            desc:'Yeni ders talebi geldiğinde' },
];

function NotificationPreferencesScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [prefs,   setPrefs]   = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('notification_preferences')
        .select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        const p = {};
        NOTIF_TYPES.forEach(t => { p[t.key] = data[t.key] !== false; });
        setPrefs(p);
      } else {
        const p = {};
        NOTIF_TYPES.forEach(t => { p[t.key] = true; });
        setPrefs(p);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const payload = { user_id: user.id, ...prefs };
      await sb.from('notification_preferences').upsert(payload, { onConflict: 'user_id' });
      alert('Bildirim tercihleri kaydedildi.');
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const toggleAll = (val) => {
    const p = {};
    NOTIF_TYPES.forEach(t => { p[t.key] = val; });
    setPrefs(p);
  };

  const enabledCount = NOTIF_TYPES.filter(t => prefs[t.key] !== false).length;

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Bildirim Tercihleri</h1>
          <div className="sub">{enabledCount} / {NOTIF_TYPES.length} bildirim türü aktif</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => toggleAll(true)}>Tümünü Aç</button>
          <button className="btn btn-ghost btn-sm" onClick={() => toggleAll(false)}>Tümünü Kapat</button>
          <button className="btn btn-pri btn-sm" onClick={save} disabled={saving}>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {NOTIF_TYPES.map((t, i) => {
            const enabled = prefs[t.key] !== false;
            return (
              <div key={t.key}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderBottom: i < NOTIF_TYPES.length-1 ? '1px solid var(--border)' : 'none', cursor:'pointer' }}
                onClick={() => setPrefs({ ...prefs, [t.key]: !enabled })}>
                <div style={{ width:40, height:40, borderRadius:12, background: enabled ? '#EEF2FF' : 'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span className="material-icons" style={{ color: enabled ? 'var(--brand-navy)' : 'var(--text-2)', fontSize:20 }}>{t.icon}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color: enabled ? 'var(--text-1)' : 'var(--text-2)' }}>{t.label}</div>
                  <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2 }}>{t.desc}</div>
                </div>
                {/* Toggle switch */}
                <div style={{ width:44, height:24, borderRadius:12, background: enabled ? 'var(--brand-navy)' : 'var(--border)', position:'relative', flexShrink:0, transition:'background 200ms' }}>
                  <div style={{ width:18, height:18, borderRadius:9, background:'#fff', position:'absolute', top:3, left: enabled ? 23 : 3, transition:'left 200ms', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GELİŞMİŞ ANALİTİK — İçgörüler Bölümü (AnalyticsScreen'e ek)
// ═══════════════════════════════════════════════════════════════
function AnalyticsInsightsPanel({ clubId }) {
  const { useState, useEffect, useMemo } = React;
  const [loading,  setLoading]  = useState(true);
  const [members,  setMembers]  = useState([]);
  const [bookings, setBookings] = useState([]);
  const [finances, setFinances] = useState([]);

  useEffect(() => { if (clubId) load(); }, [clubId]);

  const load = async () => {
    setLoading(true);
    try {
      const threeAgo = new Date(); threeAgo.setMonth(threeAgo.getMonth() - 3);
      const courtIds = await getClubCourtIds(clubId);
      const [memRes, bkRes, finRes] = await Promise.all([
        sb.from('club_memberships').select('id,status,join_date,package_id').eq('club_id', clubId),
        courtIds.length > 0
          ? sb.from('bookings').select('id,start_time,status,payment_status,total_amount,court_id').in('court_id', courtIds).gte('start_time', threeAgo.toISOString())
          : Promise.resolve({ data: [] }),
        sb.from('club_finances').select('type,amount,date,category').eq('club_id', clubId).gte('date', threeAgo.toISOString().split('T')[0]),
      ]);
      setMembers(memRes.data || []);
      setBookings(bkRes.data || []);
      setFinances(finRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const insights = useMemo(() => {
    const ins = [];
    if (!bookings.length && !members.length) return ins;

    // 1. En yoğun gün
    const dayCount = {};
    bookings.forEach(b => {
      const d = new Date(b.start_time).getDay();
      dayCount[d] = (dayCount[d] || 0) + 1;
    });
    const DAYS_TR = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
    const busyDay = Object.entries(dayCount).sort((a,b) => b[1]-a[1])[0];
    if (busyDay) ins.push({ icon:'trending_up', color:'#3B82F6', title:'En Yoğun Gün', body:`${DAYS_TR[busyDay[0]]} günleri en çok rezervasyon yapılan gün (${busyDay[1]} rezervasyon).` });

    // 2. Ödeme başarı oranı
    const paid = bookings.filter(b => b.payment_status === 'paid').length;
    const paidPct = bookings.length > 0 ? Math.round(paid / bookings.length * 100) : 0;
    if (paidPct < 70 && bookings.length > 5) {
      ins.push({ icon:'warning', color:'#F59E0B', title:'Düşük Ödeme Oranı', body:`Rezervasyonların sadece %${paidPct}'i ödendi. Ödeme takibini güçlendirmeyi düşünün.` });
    } else if (paidPct >= 90 && bookings.length > 5) {
      ins.push({ icon:'check_circle', color:'#22C55E', title:'Harika Ödeme Oranı', body:`Rezervasyonların %${paidPct}'i ödendi. Mükemmel bir tahsilat performansı!` });
    }

    // 3. Üye büyümesi
    const newMembers30 = members.filter(m => {
      if (!m.join_date) return false;
      const d = new Date(m.join_date);
      const ago = new Date(); ago.setDate(ago.getDate() - 30);
      return d >= ago;
    }).length;
    if (newMembers30 > 0) ins.push({ icon:'group_add', color:'#8B5CF6', title:'Yeni Üyeler', body:`Son 30 günde ${newMembers30} yeni üye katıldı.` });

    // 4. Gelir tahmini (son 3 ay trend)
    const monthlyInc = {};
    finances.filter(f => f.type === 'income').forEach(f => {
      const m = f.date.slice(0,7);
      monthlyInc[m] = (monthlyInc[m] || 0) + (f.amount || 0);
    });
    const monthVals = Object.values(monthlyInc);
    if (monthVals.length >= 2) {
      const last  = monthVals[monthVals.length - 1];
      const prev  = monthVals[monthVals.length - 2];
      const delta = last - prev;
      if (delta > 0) {
        ins.push({ icon:'show_chart', color:'#22C55E', title:'Gelir Artışı', body:`Bu ay geçen aya göre ${fmtMoney(delta)} fazla gelir elde edildi.` });
      } else if (delta < 0) {
        ins.push({ icon:'trending_down', color:'#EF4444', title:'Gelir Düşüşü', body:`Bu ay geçen aya göre ${fmtMoney(Math.abs(delta))} daha az gelir elde edildi.` });
      }
    }

    // 5. İptal oranı
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const cancelPct = bookings.length > 0 ? Math.round(cancelled / bookings.length * 100) : 0;
    if (cancelPct > 20 && bookings.length > 5) {
      ins.push({ icon:'cancel', color:'#EF4444', title:'Yüksek İptal Oranı', body:`Rezervasyonların %${cancelPct}'i iptal edildi. Politikanızı gözden geçirmenizi öneririz.` });
    }

    // 6. Üyelik paketi kullanımı
    const withPkg = members.filter(m => m.package_id && m.status === 'active').length;
    const total   = members.filter(m => m.status === 'active').length;
    if (total > 0) {
      const pct = Math.round(withPkg / total * 100);
      ins.push({ icon:'card_membership', color:'#F97316', title:'Paket Kullanımı', body:`Aktif üyelerin %${pct}'i (${withPkg}/${total}) bir üyelik paketine sahip.` });
    }

    return ins;
  }, [bookings, members, finances]);

  if (loading) return <Spinner />;
  if (insights.length === 0) return (
    <div className="card" style={{ textAlign:'center', padding:'24px 16px', color:'var(--text-2)' }}>
      <span className="material-icons" style={{ fontSize:40, marginBottom:8, display:'block' }}>insights</span>
      Yeterli veri olmadığı için içgörü üretilemedi.
    </div>
  );

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
      {insights.map((ins, i) => (
        <div key={i} className="card" style={{ borderLeft:`3px solid ${ins.color}`, gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background: ins.color + '18', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="material-icons" style={{ color:ins.color, fontSize:18 }}>{ins.icon}</span>
            </div>
            <div style={{ fontWeight:700, fontSize:14 }}>{ins.title}</div>
          </div>
          <p style={{ fontSize:13, color:'var(--text-2)', margin:0, lineHeight:1.5 }}>{ins.body}</p>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GRUPLAR
// ═══════════════════════════════════════════════════════════════

function ScheduleDisplay({ groupId, courts, coaches }) {
  const { useState, useEffect } = React;
  const [closures, setClosures] = useState([]);
  const DAY_NAMES = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const fmtH = (h, m) => `${String(h).padStart(2,'0')}:${String(m||0).padStart(2,'0')}`;

  useEffect(() => {
    if (!groupId) return;
    sb.from('court_closures')
      .select('*, courts(court_number)')
      .eq('group_id', groupId)
      .order('day_of_week')
      .then(({ data }) => setClosures(data || []));
  }, [groupId]);

  if (closures.length === 0) return (
    <EmptyState icon="calendar_today" title="Program tanımlanmamış" sub="Programı Düzenle butonundan program ekleyebilirsiniz." />
  );

  // Günlere göre grupla
  const byDay = {};
  closures.forEach(cl => {
    const d = cl.day_of_week;
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(cl);
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {Object.keys(byDay).sort((a,b)=>Number(a)-Number(b)).map(day => {
        const cls = byDay[day];
        // Aynı gün içinde farklı seans saatlerini ayrı slotlara grupla
        const slotMap = {};
        cls.forEach(cl => {
          const key = `${cl.start_hour}_${cl.start_minute||0}_${cl.end_hour}_${cl.end_minute||0}`;
          if (!slotMap[key]) slotMap[key] = [];
          slotMap[key].push(cl);
        });
        const slots = Object.values(slotMap);
        return slots.map((slotCls, si) => {
          const first = slotCls[0];
          const courtNums = [...new Set(slotCls.map(c => c.courts?.court_number).filter(Boolean))];
          const coachIds = [...new Set(slotCls.map(c => c.coach_id).filter(Boolean))];
          const coachNames = coachIds.map(id => coaches.find(c => c.id === id)?.full_name).filter(Boolean);
          return (
            <div key={`${day}_${si}`} style={{ display:'flex', gap:10, padding:'10px 14px', background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)', alignItems:'center' }}>
              <div style={{ width:4, alignSelf:'stretch', borderRadius:2, background:'#8B5CF6', flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>
                  {DAY_NAMES[Number(day)]} · {fmtH(first.start_hour, first.start_minute)}–{fmtH(first.end_hour, first.end_minute)}
                </div>
                <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2 }}>
                  {courtNums.length > 0 && `Kort ${courtNums.join(', ')}`}
                  {courtNums.length > 0 && coachNames.length > 0 && ' · '}
                  {coachNames.join(', ')}
                </div>
              </div>
            </div>
          );
        });
      })}
    </div>
  );
}

function GroupsScreen({ clubId, setScreen }) {
  const { useState, useEffect } = React;
  const PAGE_SIZE = 5;
  const DAYS = [['Pzt',1],['Sal',2],['Çar',3],['Per',4],['Cum',5],['Cmt',6],['Paz',0]];
  const DAY_NAMES = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

  const formatHour = (h) => {
    const w = Math.floor(h);
    const m = Math.round((h % 1) * 60);
    return `${String(w).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };
  const combineHour = (h, m) => h + (m || 0) / 60;
  const splitHour  = (h) => ({ hour: Math.floor(h), minute: Math.round((h % 1) * 60) });
  const makeMember = () => ({ key: Date.now() + Math.random(), name:'', phone:'', contact:'', fee:'', days:[] });
  const makeSlot   = () => ({ courts: [], start: 9, end: 11 });

  // ── List ─────────────────────────────────────────────────────
  const [groups,       setGroups]       = useState([]);
  const [totalGroups,  setTotalGroups]  = useState(0);
  const [currentPage,  setCurrentPage]  = useState(0);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [coaches,      setCoaches]      = useState([]);
  const [courts,       setCourts]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  // ── Create modal ─────────────────────────────────────────────
  const [createVisible,      setCreateVisible]      = useState(false);
  const [groupName,          setGroupName]          = useState('');
  const [groupDesc,          setGroupDesc]          = useState('');
  const [selectedCoachIds,   setSelectedCoachIds]   = useState([]);
  const [coachShares,        setCoachShares]        = useState({});
  const [coachFixedAmounts,  setCoachFixedAmounts]  = useState({});
  const [monthlyFee,         setMonthlyFee]         = useState('0');
  const [clubPercentage,     setClubPercentage]     = useState('100');
  const [splitType,          setSplitType]          = useState('percentage');
  const [selectedDays,       setSelectedDays]       = useState([]);
  const [daySettings,        setDaySettings]        = useState({});
  const [diffCoachesPerDay,  setDiffCoachesPerDay]  = useState(false);
  const [dayCoachIds,        setDayCoachIds]        = useState({});
  const [members,            setMembers]            = useState([makeMember(), makeMember()]);

  // ── Detail modal ─────────────────────────────────────────────
  const [detailGroup,    setDetailGroup]    = useState(null);
  const [detailVisible,  setDetailVisible]  = useState(false);
  const [detailGroupDays,setDetailGroupDays]= useState([]);
  const [detailGroupSlots,setDetailGroupSlots]= useState([]);
  const [detailTab,     setDetailTab]     = useState('members');

  // Add/edit member
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [newMember,        setNewMember]        = useState({ name:'', phone:'', contact:'', fee:'', days:[] });
  const [addingMember,     setAddingMember]     = useState(false);
  const [editMemberVisible,setEditMemberVisible]= useState(false);
  const [editingMember,    setEditingMember]    = useState(null);
  const [editMemberForm,   setEditMemberForm]   = useState({ name:'', phone:'', contact:'', fee:'', days:[] });

  // Edit schedule modal
  const [editSchedVisible,       setEditSchedVisible]       = useState(false);
  const [editSchedName,          setEditSchedName]          = useState('');
  const [editSchedDesc,          setEditSchedDesc]          = useState('');
  const [editSchedDays,          setEditSchedDays]          = useState([]);
  const [editSchedDaySettings,   setEditSchedDaySettings]   = useState({});
  const [editSchedCoachIds,      setEditSchedCoachIds]      = useState([]);
  const [editDiffCoachesPerDay,  setEditDiffCoachesPerDay]  = useState(false);
  const [editDayCoachIds,        setEditDayCoachIds]        = useState({});
  const [savingSched,            setSavingSched]            = useState(false);
  const [use15Min,               setUse15Min]               = useState(false);
  const [editSchedUse15Min,      setEditSchedUse15Min]      = useState(false);

  // Edit fee modal
  const [editFeeVisible,  setEditFeeVisible]  = useState(false);
  const [editFee,         setEditFee]         = useState('0');
  const [editPct,         setEditPct]         = useState('100');
  const [editSplitType,   setEditSplitType]   = useState('percentage');
  const [editCoachFixed,  setEditCoachFixed]  = useState({});
  const [savingFee,       setSavingFee]       = useState(false);

  // ── Payment / Dues ────────────────────────────────────────────
  const [paymentVisible,  setPaymentVisible]  = useState(false);
  const [paymentGroup,    setPaymentGroup]    = useState(null);
  const [payYear,         setPayYear]         = useState(new Date().getFullYear());
  const [payMonth,        setPayMonth]        = useState(new Date().getMonth() + 1);
  const [dues,            setDues]            = useState([]);
  const [duesPost,        setDuesPost]        = useState(null);
  const [loadingDues,     setLoadingDues]     = useState(false);
  const [postingFinance,  setPostingFinance]  = useState(false);

  // ── Init ─────────────────────────────────────────────────────
  useEffect(() => { if (clubId) init(); }, [clubId]);
  useEffect(() => { if (clubId) { setCurrentPage(0); loadGroups(0, searchQuery); } }, [searchQuery]);

  const init = async () => {
    setLoading(true);
    await Promise.all([loadGroups(0, ''), loadCoaches(), loadCourts()]);
    setLoading(false);
  };

  const loadGroups = async (page = currentPage, search = searchQuery) => {
    const from = page * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;
    let q = sb.from('club_groups')
      .select('*, coach:club_coaches(id,full_name), group_coaches:club_group_coaches(share_percentage,fixed_amount,club_coaches(id,full_name)), members:club_group_members(*)', { count:'exact' })
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (search.trim()) q = q.ilike('name', `%${search.trim()}%`);
    const { data, count } = await q;
    setGroups((data || []).map(g => ({
      ...g,
      member_count: g.members?.length ?? 0,
      coaches: ((g.group_coaches || []).map(gc => ({
        id: gc.club_coaches?.id,
        full_name: gc.club_coaches?.full_name,
        share_percentage: gc.share_percentage ?? 100,
        fixed_amount: gc.fixed_amount ?? null,
      })).filter(c => c.id)),
    })));
    setTotalGroups(count ?? 0);
  };

  const loadCoaches = async () => {
    const { data } = await sb.from('club_coaches').select('id,full_name,hourly_rate').eq('club_id', clubId).eq('is_active', true);
    setCoaches(data || []);
  };

  const loadCourts = async () => {
    const { data } = await sb.from('courts').select('id,court_number,court_type').eq('club_id', clubId).eq('is_active', true).order('court_number');
    setCourts(data || []);
  };

  const loadGroupDetail = async (groupId) => {
    const { data, error } = await sb.from('club_groups')
      .select('*, coach:club_coaches(id,full_name), group_coaches:club_group_coaches(share_percentage,fixed_amount,club_coaches(id,full_name)), members:club_group_members(*)')
      .eq('id', groupId).single();
    if (error) throw error;
    return {
      ...data,
      member_count: data.members?.length ?? 0,
      coaches: ((data.group_coaches || []).map(gc => ({
        id: gc.club_coaches?.id,
        full_name: gc.club_coaches?.full_name,
        share_percentage: gc.share_percentage ?? 100,
        fixed_amount: gc.fixed_amount ?? null,
      })).filter(c => c.id)),
    };
  };

  // ── Conflict check ────────────────────────────────────────────
  const checkConflicts = async (daySettingsMap, coachIds, excludeGroupId, perDayCoachIdsMap) => {
    const days = Object.keys(daySettingsMap).map(Number);
    if (days.length === 0) return [];
    const msgs = [];

    for (const day of days) {
      const slots = Array.isArray(daySettingsMap[day]) ? daySettingsMap[day] : [daySettingsMap[day] ?? makeSlot()];

      for (const { courts: courtIds, start, end } of slots) {
        // Kort çakışması
        if (courtIds.length > 0) {
          const { data: courtRows } = await sb.from('court_closures')
            .select('court_id,day_of_week,start_hour,start_minute,end_hour,end_minute,reason,group_id,courts(court_number)')
            .in('court_id', courtIds).eq('day_of_week', day).eq('is_active', true)
            .lt('start_hour', Math.ceil(end)).gt('end_hour', Math.floor(start));
          for (const row of (courtRows || [])) {
            if (excludeGroupId && row.group_id === excludeGroupId) continue;
            const rs = combineHour(row.start_hour, row.start_minute || 0);
            const re = combineHour(row.end_hour,   row.end_minute   || 0);
            if (start >= re || end <= rs) continue;
            const label = row.reason ? ` (${row.reason})` : '';
            msgs.push(`Kort ${row.courts?.court_number ?? '?'} · ${DAY_NAMES[day]} ${formatHour(rs)}–${formatHour(re)} dolu${label}`);
          }
        }

        // Hoca çakışması
        const effectiveCoachIds = (perDayCoachIdsMap?.[day] ?? coachIds);
        for (const coachId of effectiveCoachIds) {
          const coach = coaches.find(c => c.id === coachId);
          const coachName = coach?.full_name ?? 'Hoca';

          const { data: closureRows } = await sb.from('court_closures')
            .select('*, courts(court_number)').eq('coach_id', coachId).eq('is_active', true);
          for (const cl of (closureRows || [])) {
            if (excludeGroupId && cl.group_id === excludeGroupId) continue;
            const cs = combineHour(cl.start_hour, cl.start_minute || 0);
            const ce = combineHour(cl.end_hour,   cl.end_minute   || 0);
            if (!(start < ce && end > cs)) continue;
            if (cl.closure_type === 'recurring_weekly' && cl.day_of_week === day) {
              msgs.push(`${coachName} · Kort ${cl.courts?.court_number ?? ''}: ${DAY_NAMES[day]} ${formatHour(cs)}–${formatHour(ce)}`);
            }
          }

          // Manuel ders çakışması
          const { data: manualLessons } = await sb.from('club_manual_lessons')
            .select('id,date,start_time,end_time,student_name').eq('coach_id', coachId).gte('date', todayISO());
          const seen = new Set();
          for (const ml of (manualLessons || [])) {
            const lessonDate = new Date(ml.date + 'T12:00:00');
            if (lessonDate.getDay() !== day) continue;
            const [lsh, lsm] = (ml.start_time || '0:0').split(':').map(Number);
            const [leh, lem] = (ml.end_time   || '0:0').split(':').map(Number);
            const lStart = lsh + lsm / 60;
            const lEnd   = leh + lem / 60;
            if (start < lEnd && end > lStart) {
              const key = `${coachId}-${day}-${start}-${end}`;
              if (!seen.has(key)) {
                seen.add(key);
                msgs.push(`${coachName} · Manuel Ders: her ${DAY_NAMES[day]} ${formatHour(lStart)}–${formatHour(lEnd)}`);
              }
            }
          }
        }
      }
    }
    return msgs;
  };

  // ── Create group ──────────────────────────────────────────────
  const openCreate = () => {
    setGroupName(''); setGroupDesc(''); setSelectedCoachIds([]); setCoachShares({});
    setCoachFixedAmounts({}); setMonthlyFee('0'); setClubPercentage('100');
    setSplitType('percentage'); setSelectedDays([]); setDaySettings({});
    setDiffCoachesPerDay(false); setDayCoachIds({}); setUse15Min(false);
    setMembers([makeMember(), makeMember()]);
    setCreateVisible(true);
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) { alert('Grup adı boş olamaz'); return; }
    const validMembers = members.filter(m => m.name.trim());
    if (validMembers.length < 2) { alert('En az 2 üye eklemeniz gerekiyor'); return; }
    for (const day of selectedDays) {
      const slots = Array.isArray(daySettings[day]) ? daySettings[day] : [daySettings[day] ?? makeSlot()];
      for (const { start, end } of slots) {
        if (start >= end) { alert(`${DAY_NAMES[day]}: Bitiş saati başlangıç saatinden büyük olmalı`); return; }
      }
    }
    if (!diffCoachesPerDay && selectedCoachIds.length > 1) {
      const total = selectedCoachIds.reduce((s, id) => s + (parseFloat(coachShares[id]) || 0), 0);
      if (Math.abs(total - 100) > 0.1) { alert(`Antrenör payları toplamı %100 olmalı (şu an: %${total.toFixed(1)})`); return; }
    }
    const allCoachIds = diffCoachesPerDay
      ? [...new Set(selectedDays.flatMap(d => dayCoachIds[d] || []))]
      : selectedCoachIds;
    if (selectedDays.length > 0 && (selectedDays.some(d => { const slots = Array.isArray(daySettings[d]) ? daySettings[d] : [daySettings[d] ?? makeSlot()]; return slots.some(sl => sl.courts.length > 0); }) || allCoachIds.length > 0)) {
      const active = {};
      selectedDays.forEach(d => { active[d] = Array.isArray(daySettings[d]) ? daySettings[d] : [daySettings[d] ?? makeSlot()]; });
      const conflicts = await checkConflicts(active, selectedCoachIds, undefined, diffCoachesPerDay ? dayCoachIds : undefined);
      if (conflicts.length > 0) { alert('Çakışma Var!\n\nAşağıdaki saatler dolu:\n\n' + conflicts.join('\n')); return; }
    }
    setSaving(true);
    try {
      const fee = parseFloat(monthlyFee) || 0;
      const pct = Math.min(100, Math.max(0, parseFloat(clubPercentage) || 100));
      const primaryCoachId = allCoachIds[0] || null;
      const { data: group, error: groupErr } = await sb.from('club_groups')
        .insert([{ club_id:clubId, name:groupName.trim(), coach_id:primaryCoachId, description:groupDesc.trim()||null, monthly_fee:fee, club_percentage:pct, split_type:splitType }])
        .select().single();
      if (groupErr) throw groupErr;
      const { error: membErr } = await sb.from('club_group_members').insert(
        validMembers.map(m => ({
          group_id: group.id,
          member_name: m.name.trim(),
          contact_number: m.phone.trim() || null,
          contact_person: m.contact.trim() || null,
          custom_fee: m.fee.trim() && !isNaN(parseFloat(m.fee)) ? parseFloat(m.fee) : null,
          schedule_days: (m.days||[]).length === 0 ? selectedDays : m.days,
        }))
      );
      if (membErr) throw membErr;
      if (allCoachIds.length > 0) {
        const eq = parseFloat((100 / allCoachIds.length).toFixed(2));
        await sb.from('club_group_coaches').insert(
          allCoachIds.map((coachId, i) => ({
            group_id: group.id,
            coach_id: coachId,
            share_percentage: diffCoachesPerDay
              ? (i === allCoachIds.length-1 ? parseFloat((100-eq*(allCoachIds.length-1)).toFixed(2)) : eq)
              : (allCoachIds.length === 1 ? 100 : parseFloat(coachShares[coachId]) || eq),
            fixed_amount: splitType === 'fixed_amount' ? (parseFloat(coachFixedAmounts[coachId] ?? '') || null) : null,
          }))
        );
      }
      if (selectedDays.length > 0) {
        const rows = [];
        for (const day of selectedDays) {
          const slots = Array.isArray(daySettings[day]) ? daySettings[day] : [daySettings[day] ?? makeSlot()];
          const effDayCoachIds = diffCoachesPerDay ? (dayCoachIds[day] || []) : selectedCoachIds;
          for (const { courts: dayCourts, start: startH, end: endH, coachIds: slotCoachIds } of slots) {
            const ss = splitHour(startH), es = splitHour(endH);
            const effCoachIds = (slotCoachIds?.length) ? slotCoachIds : effDayCoachIds;
            for (const courtId of dayCourts) {
              const base = { court_id:courtId, closure_type:'recurring_weekly', day_of_week:day, start_hour:ss.hour, start_minute:ss.minute, end_hour:es.hour, end_minute:es.minute, reason:groupName.trim(), group_id:group.id, is_active:true };
              if (effCoachIds.length === 0) rows.push(base);
              else effCoachIds.forEach(cid => rows.push({ ...base, coach_id:cid }));
            }
          }
        }
        if (rows.length > 0) { const { error } = await sb.from('court_closures').insert(rows); if (error) throw error; }
      }
      setCreateVisible(false);
      setCurrentPage(0);
      await loadGroups(0, searchQuery);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  // ── Detail ────────────────────────────────────────────────────
  const openDetail = async (group) => {
    try {
      const [fresh, { data: closures }] = await Promise.all([
        loadGroupDetail(group.id),
        sb.from('court_closures').select('day_of_week,start_hour').eq('group_id', group.id).eq('is_active', true),
      ]);
      setDetailGroup(fresh);
      const slotMap = {};
      for (const c of (closures || [])) {
        if (c.day_of_week == null) continue;
        const key = `${c.day_of_week}_${c.start_hour||0}`;
        if (!slotMap[key]) slotMap[key] = { day: c.day_of_week, start_hour: c.start_hour||0 };
      }
      const slots = Object.values(slotMap).sort((a,b) => (a.day===0?7:a.day)-(b.day===0?7:b.day) || a.start_hour-b.start_hour);
      setDetailGroupDays([...new Set(slots.map(s => s.day))]);
      setDetailGroupSlots(slots);
      setDetailTab('members');
      setDetailVisible(true);
    } catch (e) { alert(e.message); }
  };

  const handleToggleGroup = async (groupId) => {
    try {
      const { data: cur } = await sb.from('club_groups').select('is_active').eq('id', groupId).single();
      if (cur.is_active) await sb.from('court_closures').delete().eq('group_id', groupId);
      await sb.from('club_groups').update({ is_active: !cur.is_active }).eq('id', groupId);
      await loadGroups(currentPage, searchQuery);
      if (detailGroup?.id === groupId) setDetailGroup(await loadGroupDetail(groupId));
    } catch (e) { alert(e.message); }
  };

  const handleDeleteGroup = async (group) => {
    if (!confirm(`"${group.name}" grubunu silmek istiyor musunuz? Bu işlem geri alınamaz.`)) return;
    try {
      await sb.from('court_closures').delete().eq('group_id', group.id);
      const { data: posts } = await sb.from('club_group_dues_posts').select('id,finance_record_id').eq('group_id', group.id);
      const fids = (posts || []).map(p => p.finance_record_id).filter(Boolean);
      if (fids.length > 0) await sb.from('club_finances').delete().in('id', fids);
      await sb.from('club_group_dues_posts').delete().eq('group_id', group.id);
      await sb.from('club_group_dues').delete().eq('group_id', group.id);
      await sb.from('club_group_members').delete().eq('group_id', group.id);
      await sb.from('club_group_coaches').delete().eq('group_id', group.id);
      await sb.from('club_groups').delete().eq('id', group.id);
      setDetailVisible(false);
      setCurrentPage(0);
      await loadGroups(0, searchQuery);
    } catch (e) { alert(e.message); }
  };

  // ── Member operations ─────────────────────────────────────────
  const handleRemoveMember = async (member) => {
    if ((detailGroup?.members?.length ?? 0) <= 2) { alert('Grupta en az 2 üye bulunmalıdır'); return; }
    if (!confirm(`"${member.member_name}" grubdan çıkarılsın mı?`)) return;
    try {
      await sb.from('club_group_members').delete().eq('id', member.id);
      setDetailGroup(await loadGroupDetail(detailGroup.id));
      await loadGroups(currentPage, searchQuery);
    } catch (e) { alert(e.message); }
  };

  const handleAddMember = async () => {
    if (!newMember.name.trim()) { alert('Üye adı boş olamaz'); return; }
    setAddingMember(true);
    try {
      const feeVal = newMember.fee.trim() && !isNaN(parseFloat(newMember.fee)) ? parseFloat(newMember.fee) : null;
      await sb.from('club_group_members').insert([{ group_id:detailGroup.id, member_name:newMember.name.trim(), contact_number:newMember.phone.trim()||null, contact_person:newMember.contact.trim()||null, custom_fee:feeVal, schedule_slots:newMember.schedule_slots }]);
      setNewMember({ name:'', phone:'', contact:'', fee:'', schedule_slots:[] });
      setAddMemberVisible(false);
      setDetailGroup(await loadGroupDetail(detailGroup.id));
      await loadGroups(currentPage, searchQuery);
    } catch (e) { alert(e.message); }
    finally { setAddingMember(false); }
  };

  const handleSaveEditMember = async () => {
    if (!editingMember || !editMemberForm.name.trim()) { alert('Üye adı boş olamaz'); return; }
    try {
      const feeVal = editMemberForm.fee.trim() && !isNaN(parseFloat(editMemberForm.fee)) ? parseFloat(editMemberForm.fee) : null;
      await sb.from('club_group_members').update({ member_name:editMemberForm.name.trim(), contact_number:editMemberForm.phone.trim()||null, contact_person:editMemberForm.contact.trim()||null, custom_fee:feeVal, schedule_slots:editMemberForm.schedule_slots }).eq('id', editingMember.id);
      setEditMemberVisible(false);
      setDetailGroup(await loadGroupDetail(detailGroup.id));
      await loadGroups(currentPage, searchQuery);
    } catch (e) { alert(e.message); }
  };

  // ── Edit schedule ─────────────────────────────────────────────
  const openEditSchedule = async (group) => {
    try {
      const [{ data: closures }, { data: groupCoaches }] = await Promise.all([
        sb.from('court_closures').select('court_id,day_of_week,start_hour,start_minute,end_hour,end_minute,coach_id').eq('group_id', group.id),
        sb.from('club_group_coaches').select('coach_id').eq('group_id', group.id),
      ]);
      const perDay = {};
      const perDayCoachMap = {};
      for (const c of (closures || [])) {
        const d = c.day_of_week;
        if (!perDay[d]) perDay[d] = [];
        const start = combineHour(c.start_hour, c.start_minute || 0);
        const end   = combineHour(c.end_hour,   c.end_minute   || 0);
        let slot = perDay[d].find(sl => sl.start === start && sl.end === end);
        if (!slot) { slot = { courts: [], start, end }; perDay[d].push(slot); }
        if (c.court_id && !slot.courts.includes(c.court_id)) slot.courts.push(c.court_id);
        if (c.coach_id) { if (!perDayCoachMap[d]) perDayCoachMap[d] = []; if (!perDayCoachMap[d].includes(c.coach_id)) perDayCoachMap[d].push(c.coach_id); }
      }
      const days = Object.keys(perDay).map(Number);
      const daySets = Object.values(perDayCoachMap).map(ids => [...ids].sort().join(','));
      const isDiffPerDay = daySets.length > 1 && !daySets.every(s => s === daySets[0]);
      const coachIdsFromClosures = [...new Set((closures||[]).filter(c=>c.coach_id).map(c=>c.coach_id))];
      const coachIdsFromGC = (groupCoaches||[]).map(gc=>gc.coach_id);
      setEditSchedName(group.name); setEditSchedDesc(group.description||'');
      setEditSchedDays(days); setEditSchedDaySettings(perDay);
      setEditSchedCoachIds(coachIdsFromClosures.length > 0 ? coachIdsFromClosures : coachIdsFromGC);
      setEditDiffCoachesPerDay(isDiffPerDay);
      setEditDayCoachIds(isDiffPerDay ? perDayCoachMap : {});
      setEditSchedUse15Min(false);
      setEditSchedVisible(true);
    } catch (e) { alert(e.message); }
  };

  const handleSaveSchedule = async () => {
    if (!detailGroup) return;
    if (!editSchedName.trim()) { alert('Grup adı boş olamaz'); return; }
    for (const day of editSchedDays) {
      const slots = Array.isArray(editSchedDaySettings[day]) ? editSchedDaySettings[day] : [editSchedDaySettings[day] ?? makeSlot()];
      for (const { start, end } of slots) {
        if (start >= end) { alert(`${DAY_NAMES[day]}: Bitiş saati başlangıç saatinden büyük olmalı`); return; }
      }
    }
    const editAllCoachIds = editDiffCoachesPerDay
      ? [...new Set(editSchedDays.flatMap(d => editDayCoachIds[d] || []))]
      : editSchedCoachIds;
    const hasCourts = editSchedDays.some(d => { const slots = Array.isArray(editSchedDaySettings[d]) ? editSchedDaySettings[d] : [editSchedDaySettings[d] ?? makeSlot()]; return slots.some(sl => sl.courts.length > 0); });
    if (editSchedDays.length > 0 && (hasCourts || editAllCoachIds.length > 0)) {
      const active = {};
      editSchedDays.forEach(d => { active[d] = Array.isArray(editSchedDaySettings[d]) ? editSchedDaySettings[d] : [editSchedDaySettings[d] ?? makeSlot()]; });
      const conflicts = await checkConflicts(active, editSchedCoachIds, detailGroup.id, editDiffCoachesPerDay ? editDayCoachIds : undefined);
      if (conflicts.length > 0) { alert('Çakışma Var!\n\nAşağıdaki saatler dolu:\n\n' + conflicts.join('\n')); return; }
    }
    setSavingSched(true);
    try {
      const primaryCoachId = editAllCoachIds[0] || null;
      await sb.from('club_groups').update({ name:editSchedName.trim(), description:editSchedDesc.trim()||null, coach_id:primaryCoachId }).eq('id', detailGroup.id);
      await sb.from('club_group_coaches').delete().eq('group_id', detailGroup.id);
      if (editAllCoachIds.length > 0) {
        const eq = parseFloat((100 / editAllCoachIds.length).toFixed(2));
        await sb.from('club_group_coaches').insert(
          editAllCoachIds.map((cid, i) => ({ group_id:detailGroup.id, coach_id:cid, share_percentage: i===editAllCoachIds.length-1 ? parseFloat((100-eq*(editAllCoachIds.length-1)).toFixed(2)) : eq }))
        );
      }
      await sb.from('court_closures').delete().eq('group_id', detailGroup.id);
      if (editSchedDays.length > 0) {
        const rows = [];
        for (const day of editSchedDays) {
          const slots = Array.isArray(editSchedDaySettings[day]) ? editSchedDaySettings[day] : [editSchedDaySettings[day] ?? makeSlot()];
          const effDayCoachIds = editDiffCoachesPerDay ? (editDayCoachIds[day] || []) : editSchedCoachIds;
          for (const { courts: dayCourts, start: startH, end: endH, coachIds: slotCoachIds } of slots) {
            const ss = splitHour(startH), es = splitHour(endH);
            const effCoachIds = (slotCoachIds?.length) ? slotCoachIds : effDayCoachIds;
            for (const courtId of dayCourts) {
              const base = { court_id:courtId, closure_type:'recurring_weekly', day_of_week:day, start_hour:ss.hour, start_minute:ss.minute, end_hour:es.hour, end_minute:es.minute, reason:editSchedName.trim(), group_id:detailGroup.id, is_active:true };
              if (effCoachIds.length === 0) rows.push(base);
              else effCoachIds.forEach(cid => rows.push({ ...base, coach_id:cid }));
            }
          }
        }
        if (rows.length > 0) { const { error } = await sb.from('court_closures').insert(rows); if (error) throw error; }
      }
      setEditSchedVisible(false);
      setDetailGroup(await loadGroupDetail(detailGroup.id));
      await loadGroups(currentPage, searchQuery);
    } catch (e) { alert(e.message); }
    finally { setSavingSched(false); }
  };

  // ── Edit fee ──────────────────────────────────────────────────
  const openEditFee = () => {
    setEditFee(String(detailGroup?.monthly_fee ?? 0));
    setEditPct(String(detailGroup?.club_percentage ?? 100));
    setEditSplitType(detailGroup?.split_type ?? 'percentage');
    const fm = {};
    (detailGroup?.coaches || []).forEach(c => { fm[c.id] = c.fixed_amount != null ? String(c.fixed_amount) : ''; });
    setEditCoachFixed(fm);
    setEditFeeVisible(true);
  };

  const handleSaveFee = async () => {
    setSavingFee(true);
    try {
      const fee = parseFloat(editFee) || 0;
      const pct = Math.min(100, Math.max(0, parseFloat(editPct) || 100));
      await sb.from('club_groups').update({ monthly_fee:fee, club_percentage:pct, split_type:editSplitType }).eq('id', detailGroup.id);
      for (const coach of (detailGroup?.coaches || [])) {
        const faStr = editCoachFixed[coach.id] ?? '';
        const fa = faStr.trim() && !isNaN(parseFloat(faStr)) ? parseFloat(faStr) : null;
        await sb.from('club_group_coaches').update({ fixed_amount: editSplitType === 'fixed_amount' ? fa : null }).eq('group_id', detailGroup.id).eq('coach_id', coach.id);
      }
      setEditFeeVisible(false);
      setDetailGroup(await loadGroupDetail(detailGroup.id));
      await loadGroups(currentPage, searchQuery);
    } catch (e) { alert(e.message); }
    finally { setSavingFee(false); }
  };

  // ── Dues / Payment ────────────────────────────────────────────
  const openPayment = async (group) => {
    setPaymentGroup(group);
    const now = new Date();
    const yr = now.getFullYear(), mo = now.getMonth() + 1;
    setPayYear(yr); setPayMonth(mo);
    setDues([]); setDuesPost(null);
    setPaymentVisible(true);
    await loadDues(group, yr, mo);
  };

  const loadDues = async (group, year, month) => {
    setLoadingDues(true);
    try {
      const { data: existing } = await sb.from('club_group_dues').select('*').eq('group_id', group.id).eq('year', year).eq('month', month).order('created_at');
      if (existing?.length > 0) {
        setDues(existing);
      } else {
        const { data: mbs } = await sb.from('club_group_members').select('id,member_name,custom_fee').eq('group_id', group.id);
        if (mbs && mbs.length > 0) {
          const { data: created } = await sb.from('club_group_dues').insert(
            mbs.map(m => ({ group_id:group.id, club_id:clubId, year, month, member_id:m.id, member_name:m.member_name, amount: m.custom_fee != null ? m.custom_fee : group.monthly_fee, is_paid:false }))
          ).select();
          setDues(created || []);
        } else { setDues([]); }
      }
      const { data: post } = await sb.from('club_group_dues_posts').select('*').eq('group_id', group.id).eq('year', year).eq('month', month).maybeSingle();
      setDuesPost(post);
    } catch (e) { alert(e.message); }
    finally { setLoadingDues(false); }
  };

  const navigatePayMonth = async (dir) => {
    if (!paymentGroup) return;
    let newMonth = payMonth + dir, newYear = payYear;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1)  { newMonth = 12; newYear--; }
    setPayMonth(newMonth); setPayYear(newYear);
    setDues([]); setDuesPost(null);
    await loadDues(paymentGroup, newYear, newMonth);
  };

  const handleToggleDuePaid = async (due) => {
    if (duesPost) return;
    try {
      const np = !due.is_paid;
      const { data } = await sb.from('club_group_dues').update({ is_paid:np, paid_at: np ? new Date().toISOString() : null }).eq('id', due.id).select().single();
      setDues(prev => prev.map(d => d.id === data.id ? data : d));
    } catch (e) { alert(e.message); }
  };

  const handlePostToFinance = async () => {
    if (!paymentGroup) return;
    if (!dues.every(d => d.is_paid)) { alert('Tüm üyeler ödemesini tamamlamadan finansa işleyemezsiniz'); return; }
    if (!confirm('Aidat finansa işlensin mi?')) return;
    setPostingFinance(true);
    try {
      const totalAmount = dues.reduce((s, d) => s + d.amount, 0);
      const description = `${paymentGroup.name} - ${MONTHS_TR[payMonth-1]} ${payYear} aidatı`;
      const today = todayISO();
      const { data: groupCoaches } = await sb.from('club_group_coaches')
        .select('coach_id,share_percentage,fixed_amount,club_coaches(full_name)').eq('group_id', paymentGroup.id);

      let clubAmount, coachAmount;
      if (groupCoaches && groupCoaches.length > 0) {
        if (paymentGroup.split_type === 'fixed_amount') {
          const totalCoachFixed = groupCoaches.reduce((s, gc) => s + (gc.fixed_amount || 0), 0);
          coachAmount = Math.round(Math.min(totalCoachFixed, totalAmount) * 100) / 100;
          clubAmount  = Math.round((totalAmount - coachAmount) * 100) / 100;
          for (const gc of groupCoaches) {
            const earning = Math.round(Math.min(gc.fixed_amount || 0, totalAmount) * 100) / 100;
            if (earning <= 0) continue;
            await sb.from('coach_earnings').insert({ club_id:clubId, coach_id:gc.coach_id, coach_name:gc.club_coaches?.full_name??'', student_name:null, lesson_id:null, booking_id:null, amount:earning, court_fee:0, date:today, description, payment_status:'unpaid' });
          }
        } else {
          clubAmount  = Math.round(totalAmount * ((paymentGroup.club_percentage || 100) / 100) * 100) / 100;
          coachAmount = Math.round((totalAmount - clubAmount) * 100) / 100;
          for (const gc of groupCoaches) {
            const earning = Math.round(coachAmount * (gc.share_percentage / 100) * 100) / 100;
            if (earning <= 0) continue;
            await sb.from('coach_earnings').insert({ club_id:clubId, coach_id:gc.coach_id, coach_name:gc.club_coaches?.full_name??'', student_name:null, lesson_id:null, booking_id:null, amount:earning, court_fee:0, date:today, description, payment_status:'unpaid' });
          }
        }
      } else {
        clubAmount  = Math.round(totalAmount * ((paymentGroup.club_percentage || 100) / 100) * 100) / 100;
        coachAmount = Math.round((totalAmount - clubAmount) * 100) / 100;
      }
      const { data: finRec } = await sb.from('club_finances').insert({ club_id:clubId, type:'income', category:'Grup Aidatı', amount:clubAmount, description, date:today }).select('id').single();
      await sb.from('club_group_dues_posts').insert({ group_id:paymentGroup.id, club_id:clubId, year:payYear, month:payMonth, total_amount:totalAmount, club_amount:clubAmount, coach_amount:coachAmount, finance_record_id:finRec?.id });
      const { data: post } = await sb.from('club_group_dues_posts').select('*').eq('group_id', paymentGroup.id).eq('year', payYear).eq('month', payMonth).maybeSingle();
      setDuesPost(post);
      alert('Aidat kulüp finans kaydına eklendi');
    } catch (e) { alert(e.message); }
    finally { setPostingFinance(false); }
  };

  // ── Computed ──────────────────────────────────────────────────
  const paidCount      = dues.filter(d => d.is_paid).length;
  const totalDuesAmt   = dues.reduce((s, d) => s + d.amount, 0);
  const allDuesPaid    = dues.length > 0 && paidCount === dues.length;

  // ── Day settings renderer (regular function, NOT a component — avoids unmount/remount on state change)
  const renderDayCards = (days, settingsState, setSettingsState, coachIdsState, setCoachIdsState, diffPerDay, use15MinStep, setUse15MinStep, globalCoachIds) => {
    if (!days || days.length === 0) return null;
    const getSlots = (p, idx) => Array.isArray(p[idx]) ? p[idx] : (p[idx] ? [p[idx]] : [makeSlot()]);
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:2 }}>
          <span style={{ fontSize:12, color:'var(--text-2)', fontWeight:600 }}>15 Dakikalık Artış</span>
          <button type="button" className={'btn btn-sm ' + (use15MinStep ? 'btn-pri' : 'btn-ghost')}
            onClick={() => setUse15MinStep(v => !v)}>
            {use15MinStep ? 'Açık' : 'Kapalı'}
          </button>
          {use15MinStep && <span style={{ fontSize:11, color:'var(--text-2)' }}>22:15 gibi saatler seçilebilir</span>}
        </div>
        {[...days].sort((a,b)=>a-b).map(idx => {
          const slots = getSlots(settingsState, idx);
          const step = use15MinStep ? 0.25 : 0.5;
          return (
            <div key={idx} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontWeight:700, fontSize:13, color:'var(--text-1)' }}>{DAY_NAMES[idx]}</span>
                <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize:12 }}
                  onClick={() => setSettingsState(p => {
                    const cur = getSlots(p, idx);
                    const last = cur[cur.length - 1];
                    return { ...p, [idx]: [...cur, { courts:[], start:last.end, end:Math.min(23.75, last.end + 2) }] };
                  })}>
                  <span className="material-icons" style={{fontSize:14,verticalAlign:'middle'}}>add</span> Seans Ekle
                </button>
              </div>
              {diffPerDay && coaches.length > 0 && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>ANTRENÖRLER</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {coaches.map(coach => {
                      const dayIds = coachIdsState[idx] || [];
                      return (
                        <button key={coach.id} type="button"
                          className={'btn btn-sm ' + (dayIds.includes(coach.id) ? 'btn-pri' : 'btn-ghost')}
                          onClick={() => setCoachIdsState(p => { const cur = p[idx]||[]; return {...p,[idx]: cur.includes(coach.id)?cur.filter(id=>id!==coach.id):[...cur,coach.id]}; })}>
                          {coach.full_name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {slots.map((s, si) => {
                const pool = diffPerDay ? (coachIdsState[idx] || []) : (globalCoachIds || []);
                const poolCoaches = coaches.filter(c => pool.includes(c.id));
                return (
                  <div key={si} style={{ border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', marginBottom: si < slots.length-1 ? 10 : 0 }}>
                    {slots.length > 1 && (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'var(--text-2)' }}>SEANS {si + 1}</span>
                        <button type="button" className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => setSettingsState(p => {
                            const cur = getSlots(p, idx);
                            if (cur.length <= 1) return p;
                            return { ...p, [idx]: cur.filter((_, i) => i !== si) };
                          })}>
                          <span className="material-icons" style={{fontSize:14,color:'#EF4444'}}>close</span>
                        </button>
                      </div>
                    )}
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>KORTLAR</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                      {courts.map(c => (
                        <button key={c.id} type="button"
                          className={'btn btn-sm ' + (s.courts.includes(c.id) ? 'btn-pri' : 'btn-ghost')}
                          onClick={() => setSettingsState(p => {
                            const cur = getSlots(p, idx).map((sl, i) => {
                              if (i !== si) return sl;
                              const nc = sl.courts.includes(c.id) ? sl.courts.filter(id=>id!==c.id) : [...sl.courts, c.id];
                              return { ...sl, courts: nc };
                            });
                            return { ...p, [idx]: cur };
                          })}>
                          Kort {c.court_number}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>SAAT ARALIĞI</div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: poolCoaches.length > 0 ? 10 : 0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                        <button type="button" className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => setSettingsState(p => {
                            const cur = getSlots(p, idx).map((sl, i) => i !== si ? sl : { ...sl, start: Math.max(0, parseFloat((sl.start - step).toFixed(2))) });
                            return { ...p, [idx]: cur };
                          })}><span className="material-icons" style={{fontSize:14}}>remove</span></button>
                        <span style={{ fontWeight:700, fontSize:14, minWidth:40, textAlign:'center' }}>{formatHour(s.start)}</span>
                        <button type="button" className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => setSettingsState(p => {
                            const cur = getSlots(p, idx).map((sl, i) => {
                              if (i !== si) return sl;
                              const ns = Math.min(23 - step, parseFloat((sl.start + step).toFixed(2)));
                              const gap = sl.end - sl.start;
                              return { ...sl, start: ns, end: Math.min(23.75, parseFloat((ns + gap).toFixed(2))) };
                            });
                            return { ...p, [idx]: cur };
                          })}><span className="material-icons" style={{fontSize:14}}>add</span></button>
                      </div>
                      <span className="material-icons" style={{ color:'var(--text-2)', fontSize:16 }}>arrow_forward</span>
                      <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                        <button type="button" className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => setSettingsState(p => {
                            const cur = getSlots(p, idx).map((sl, i) => i !== si ? sl : { ...sl, end: Math.max(step, parseFloat((sl.end - step).toFixed(2))) });
                            return { ...p, [idx]: cur };
                          })}><span className="material-icons" style={{fontSize:14}}>remove</span></button>
                        <span style={{ fontWeight:700, fontSize:14, minWidth:40, textAlign:'center' }}>{formatHour(s.end)}</span>
                        <button type="button" className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => setSettingsState(p => {
                            const cur = getSlots(p, idx).map((sl, i) => i !== si ? sl : { ...sl, end: Math.min(23.75, parseFloat((sl.end + step).toFixed(2))) });
                            return { ...p, [idx]: cur };
                          })}><span className="material-icons" style={{fontSize:14}}>add</span></button>
                      </div>
                    </div>
                    {poolCoaches.length > 0 && (
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>BU SEANSA GELECEK ANTRENÖRLER</div>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {poolCoaches.map(coach => {
                            const isActive = s.coachIds == null || s.coachIds.includes(coach.id);
                            return (
                              <button key={coach.id} type="button"
                                className={'btn btn-sm ' + (isActive ? 'btn-pri' : 'btn-ghost')}
                                onClick={() => setSettingsState(p => {
                                  const cur = getSlots(p, idx).map((sl, i) => {
                                    if (i !== si) return sl;
                                    const currentIds = sl.coachIds ?? pool;
                                    const nextIds = currentIds.includes(coach.id) ? currentIds.filter(id=>id!==coach.id) : [...currentIds, coach.id];
                                    return { ...sl, coachIds: (nextIds.length === 0 || nextIds.length === pool.length) ? undefined : nextIds };
                                  });
                                  return { ...p, [idx]: cur };
                                })}>
                                {coach.full_name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <Spinner />;

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Gruplar</h1>
          <div className="sub">{totalGroups} grup</div>
        </div>
        <button className="btn btn-pri" onClick={openCreate}>
          <span className="material-icons">add</span>
          Grup Ekle
        </button>
      </div>

      {/* Arama */}
      <div style={{ position:'relative', marginBottom:16 }}>
        <span className="material-icons" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-2)', fontSize:18, pointerEvents:'none' }}>search</span>
        <input style={{ width:'100%', paddingLeft:38, boxSizing:'border-box' }}
          placeholder="Grup ara..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {/* Grup listesi */}
      {groups.length === 0 ? (
        <EmptyState icon="groups" title={searchQuery ? 'Sonuç bulunamadı' : 'Henüz grup yok'}
          sub={searchQuery ? `"${searchQuery}" ile eşleşen grup yok` : 'Düzenli dersler için grup oluşturun ve kortlara atayın'} />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {groups.map(group => (
            <div key={group.id} className="card tight" style={{ cursor:'pointer' }} onClick={() => openDetail(group)}>
              <div style={{ display:'flex', alignItems:'stretch', gap:0 }}>
                <div style={{ width:4, borderRadius:'4px 0 0 4px', background: group.is_active ? '#0D9488' : 'var(--border)', flexShrink:0 }} />
                <div style={{ flex:1, padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{group.name}</div>
                    <Badge cls={group.is_active ? 'b-green' : ''}>{group.is_active ? 'Aktif' : 'Pasif'}</Badge>
                  </div>
                  {group.description && <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:6 }}>{group.description}</div>}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text-2)' }}>
                      <span className="material-icons" style={{fontSize:14}}>person_outline</span>{group.member_count ?? 0} üye
                    </span>
                    {(group.coaches?.length > 0 ? group.coaches : group.coach ? [group.coach] : []).map(c => (
                      <span key={c.id} style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#8B5CF6' }}>
                        <span className="material-icons" style={{fontSize:14}}>sports</span>{c.full_name}
                      </span>
                    ))}
                    {group.monthly_fee > 0 && (
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#0D9488' }}>
                        <span className="material-icons" style={{fontSize:14}}>payments</span>{group.monthly_fee} ₺/ay
                      </span>
                    )}
                  </div>
                  <button className="btn btn-pri btn-sm" style={{ marginTop:10, fontSize:12 }}
                    onClick={e => { e.stopPropagation(); openPayment(group); }}>
                    <span className="material-icons" style={{fontSize:14}}>account_balance_wallet</span>
                    Ödeme Al
                  </button>
                </div>
                <div style={{ display:'flex', alignItems:'center', paddingRight:8 }}>
                  <span className="material-icons" style={{ color:'var(--border)' }}>chevron_right</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sayfalama */}
      {totalGroups > PAGE_SIZE && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginTop:16 }}>
          <button className="btn btn-ghost btn-sm" disabled={currentPage===0}
            onClick={() => { const p=Math.max(0,currentPage-1); setCurrentPage(p); loadGroups(p, searchQuery); }}>
            <span className="material-icons">chevron_left</span> Önceki
          </button>
          <span style={{ fontSize:13, color:'var(--text-2)' }}>
            {currentPage*PAGE_SIZE+1}–{Math.min((currentPage+1)*PAGE_SIZE,totalGroups)} / {totalGroups}
          </span>
          <button className="btn btn-ghost btn-sm" disabled={(currentPage+1)*PAGE_SIZE>=totalGroups}
            onClick={() => { const p=currentPage+1; setCurrentPage(p); loadGroups(p, searchQuery); }}>
            Sonraki <span className="material-icons">chevron_right</span>
          </button>
        </div>
      )}

      {/* ══ Yeni Grup Modalı ══════════════════════════════════════ */}
      {createVisible && (
        <Modal title="Yeni Grup" wide onClose={() => setCreateVisible(false)}
          footer={<><button className="btn btn-ghost btn-sm" onClick={() => setCreateVisible(false)}>Vazgeç</button><button className="btn btn-pri btn-sm" onClick={handleSaveGroup} disabled={saving}>{saving?'Kaydediliyor…':'Kaydet'}</button></>}>
          <div className="fields" style={{ gap:14 }}>
            <div className="fields-2">
              <Field label="GRUP ADI *"><input placeholder="Pazartesi Sabah Grubu" value={groupName} onChange={e=>setGroupName(e.target.value)} /></Field>
              <Field label="AÇIKLAMA"><input placeholder="İsteğe bağlı not" value={groupDesc} onChange={e=>setGroupDesc(e.target.value)} /></Field>
            </div>
            <div className="fields-2">
              <Field label="AYLIK AİDAT (₺)"><input type="number" min="0" placeholder="0" value={monthlyFee} onChange={e=>setMonthlyFee(e.target.value)} /></Field>
              {selectedCoachIds.length > 0 && (
                <Field label="PAY MODELİ">
                  <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid var(--border)' }}>
                    {[{v:'percentage',l:'% Yüzde'},{v:'fixed_amount',l:'₺ Tutar'}].map(opt => (
                      <button key={opt.v} type="button"
                        style={{ flex:1, padding:'8px', fontSize:13, fontWeight:600, border:'none', cursor:'pointer', background:splitType===opt.v?'var(--brand-navy)':'transparent', color:splitType===opt.v?'#fff':'var(--text-1)' }}
                        onClick={() => setSplitType(opt.v)}>{opt.l}</button>
                    ))}
                  </div>
                </Field>
              )}
            </div>
            {selectedCoachIds.length > 0 && splitType === 'percentage' && (
              <Field label="KULÜP PAYI (%)">
                <input type="number" min="0" max="100" placeholder="100" value={clubPercentage} onChange={e=>setClubPercentage(e.target.value)} />
                {parseFloat(clubPercentage) < 100 && <div style={{ fontSize:12, color:'var(--text-2)', marginTop:4 }}>Hoca payı: %{Math.round((100-parseFloat(clubPercentage))*100)/100}</div>}
              </Field>
            )}
            {selectedCoachIds.length > 0 && splitType === 'fixed_amount' && (
              <Field label="HOCA TUTARLARI (₺)">
                {selectedCoachIds.map(id => { const c=coaches.find(c=>c.id===id); return (
                  <div key={id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ flex:1, fontSize:13 }}>{c?.full_name??'Hoca'}</span>
                    <input type="number" min="0" style={{ width:100 }} placeholder="0 ₺" value={coachFixedAmounts[id]??''} onChange={e=>setCoachFixedAmounts(p=>({...p,[id]:e.target.value}))} />
                  </div>
                ); })}
              </Field>
            )}
            {selectedCoachIds.length === 0 && <div style={{ fontSize:12, color:'var(--text-2)' }}>Hoca seçilmediğinde tüm aidat kulübe gider</div>}
            <Field label="ANTRENÖRLER (çoklu seçim, isteğe bağlı)">
              {coaches.length === 0 ? <div style={{ fontSize:13, color:'var(--text-2)' }}>Aktif antrenör bulunamadı</div> : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {coaches.map(c => (
                    <button key={c.id} type="button"
                      className={'btn btn-sm ' + (selectedCoachIds.includes(c.id) ? 'btn-pri' : 'btn-ghost')}
                      onClick={() => {
                        const next = selectedCoachIds.includes(c.id) ? selectedCoachIds.filter(id=>id!==c.id) : [...selectedCoachIds,c.id];
                        setSelectedCoachIds(next);
                        if (next.length > 0) {
                          const eq = parseFloat((100/next.length).toFixed(2));
                          const sh = {}; next.forEach((id,i)=>{ sh[id]=i===next.length-1?(100-eq*(next.length-1)).toFixed(2):eq.toFixed(2); }); setCoachShares(sh);
                        } else setCoachShares({});
                      }}>{c.full_name}</button>
                  ))}
                </div>
              )}
              {selectedCoachIds.length > 1 && (
                <div style={{ marginTop:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--text-2)' }}>PAYLAR (toplam %100)</span>
                    <button type="button" style={{ fontSize:12, color:'var(--brand-navy)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}
                      onClick={() => { const eq=parseFloat((100/selectedCoachIds.length).toFixed(2)); const sh={}; selectedCoachIds.forEach((id,i)=>{ sh[id]=i===selectedCoachIds.length-1?(100-eq*(selectedCoachIds.length-1)).toFixed(2):eq.toFixed(2); }); setCoachShares(sh); }}>= Eşit Böl</button>
                  </div>
                  {selectedCoachIds.map(id => { const c=coaches.find(c=>c.id===id); return (
                    <div key={id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ flex:1, fontSize:13 }}>{c?.full_name}</span>
                      <input type="number" min="0" max="100" style={{ width:70, textAlign:'center' }} value={coachShares[id]??''} onChange={e=>setCoachShares(p=>({...p,[id]:e.target.value}))} />
                      <span style={{ fontSize:13, color:'var(--text-2)' }}>%</span>
                    </div>
                  ); })}
                  {(() => { const total=selectedCoachIds.reduce((s,id)=>s+(parseFloat(coachShares[id])||0),0); const ok=Math.abs(total-100)<0.1; return <div style={{ fontSize:12, fontWeight:600, color:ok?'#22C55E':'#EF4444', marginTop:2 }}>Toplam: %{total.toFixed(1)} {ok?'✓':'✗ (100 olmalı)'}</div>; })()}
                </div>
              )}
            </Field>
            {coaches.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10 }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13 }}>Farklı günlere farklı hocalar</div>
                  <div style={{ fontSize:12, color:'var(--text-2)' }}>Her gün için ayrı antrenör seçin</div>
                </div>
                <Switch on={diffCoachesPerDay} onChange={v => {
                  setDiffCoachesPerDay(v);
                  if (v) { const init={}; selectedDays.forEach(d=>{init[d]=[...selectedCoachIds];}); setDayCoachIds(init); }
                }} />
              </div>
            )}
            {courts.length > 0 && (
              <Field label="PROGRAM (isteğe bağlı)">
                <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:8 }}>Her gün için farklı kortlar seçebilirsiniz. Seçilen kortlar otomatik kapatılır, hocanın takvimine eklenir.</div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>GÜNLER</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                  {DAYS.map(([label,idx]) => (
                    <button key={idx} type="button"
                      className={'btn btn-sm ' + (selectedDays.includes(idx)?'btn-pri':'btn-ghost')}
                      onClick={() => {
                        if (selectedDays.includes(idx)) {
                          setSelectedDays(p=>p.filter(d=>d!==idx));
                          setDaySettings(p=>{const n={...p};delete n[idx];return n;});
                          setDayCoachIds(p=>{const n={...p};delete n[idx];return n;});
                        } else {
                          setSelectedDays(p=>[...p,idx]);
                          setDaySettings(p=>({...p,[idx]:Array.isArray(p[idx])?p[idx]:(p[idx]?[p[idx]]:[makeSlot()])}));
                          if (diffCoachesPerDay) setDayCoachIds(p=>({...p,[idx]:p[idx]??[...selectedCoachIds]}));
                        }
                      }}>{label}</button>
                  ))}
                </div>
                {selectedDays.length > 0 && (() => {
                  const _days = [...selectedDays].sort((a,b)=>a-b);
                  const _step = use15Min ? 0.25 : 0.5;
                  const _getSlots = (idx) => {
                    const v = daySettings[idx];
                    return Array.isArray(v) ? (v.length > 0 ? v : [makeSlot()]) : (v ? [v] : [makeSlot()]);
                  };
                  return (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:2 }}>
                        <span style={{ fontSize:12, color:'var(--text-2)', fontWeight:600 }}>15 Dakikalık Artış</span>
                        <button type="button" className={'btn btn-sm ' + (use15Min ? 'btn-pri' : 'btn-ghost')}
                          onClick={() => setUse15Min(v => !v)}>
                          {use15Min ? 'Açık' : 'Kapalı'}
                        </button>
                        {use15Min && <span style={{ fontSize:11, color:'var(--text-2)' }}>22:15 gibi saatler seçilebilir</span>}
                      </div>
                      {_days.map(dayIdx => {
                        const _slots = _getSlots(dayIdx);
                        return (
                          <div key={dayIdx} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                              <span style={{ fontWeight:700, fontSize:13, color:'var(--text-1)' }}>{DAY_NAMES[dayIdx]}</span>
                              <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize:12 }}
                                onClick={() => {
                                  const cur = _getSlots(dayIdx);
                                  const last = cur[cur.length - 1];
                                  setDaySettings(p => ({ ...p, [dayIdx]: [...cur, { courts:[], start:last.end, end:Math.min(23.75, last.end + 2) }] }));
                                }}>
                                <span className="material-icons" style={{fontSize:14,verticalAlign:'middle'}}>add</span> Seans Ekle
                              </button>
                            </div>
                            {diffCoachesPerDay && coaches.length > 0 && (
                              <div style={{ marginBottom:10 }}>
                                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>ANTRENÖRLER</div>
                                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                  {coaches.map(coach => {
                                    const _dayIds = dayCoachIds[dayIdx] || [];
                                    return (
                                      <button key={coach.id} type="button"
                                        className={'btn btn-sm ' + (_dayIds.includes(coach.id) ? 'btn-pri' : 'btn-ghost')}
                                        onClick={() => setDayCoachIds(p => { const cur = p[dayIdx]||[]; return {...p,[dayIdx]: cur.includes(coach.id)?cur.filter(id=>id!==coach.id):[...cur,coach.id]}; })}>
                                        {coach.full_name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {_slots.map((s, si) => {
                              const _pool = diffCoachesPerDay ? (dayCoachIds[dayIdx] || []) : selectedCoachIds;
                              const _poolCoaches = coaches.filter(c => _pool.includes(c.id));
                              return (
                                <div key={si} style={{ border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', marginBottom: si < _slots.length-1 ? 10 : 0 }}>
                                  {_slots.length > 1 && (
                                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                                      <span style={{ fontSize:12, fontWeight:700, color:'var(--text-2)' }}>SEANS {si + 1}</span>
                                      <button type="button" className="btn btn-ghost btn-sm btn-icon"
                                        onClick={() => {
                                          const cur = _getSlots(dayIdx);
                                          if (cur.length <= 1) return;
                                          setDaySettings(p => ({ ...p, [dayIdx]: cur.filter((_,i) => i !== si) }));
                                        }}>
                                        <span className="material-icons" style={{fontSize:14,color:'#EF4444'}}>close</span>
                                      </button>
                                    </div>
                                  )}
                                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>KORTLAR</div>
                                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                                    {courts.map(c => (
                                      <button key={c.id} type="button"
                                        className={'btn btn-sm ' + (s.courts.includes(c.id) ? 'btn-pri' : 'btn-ghost')}
                                        onClick={() => {
                                          const cur = _getSlots(dayIdx);
                                          const next = cur.map((sl, i) => i !== si ? sl : { ...sl, courts: sl.courts.includes(c.id) ? sl.courts.filter(id=>id!==c.id) : [...sl.courts, c.id] });
                                          setDaySettings(p => ({ ...p, [dayIdx]: next }));
                                        }}>
                                        Kort {c.court_number}
                                      </button>
                                    ))}
                                  </div>
                                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>SAAT ARALIĞI</div>
                                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: _poolCoaches.length > 0 ? 10 : 0 }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                                      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => {
                                        const cur = _getSlots(dayIdx);
                                        setDaySettings(p => ({ ...p, [dayIdx]: cur.map((sl,i) => i!==si ? sl : {...sl, start:Math.max(0,parseFloat((sl.start-_step).toFixed(2)))}) }));
                                      }}><span className="material-icons" style={{fontSize:14}}>remove</span></button>
                                      <span style={{ fontWeight:700, fontSize:14, minWidth:40, textAlign:'center' }}>{formatHour(s.start)}</span>
                                      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => {
                                        const cur = _getSlots(dayIdx);
                                        setDaySettings(p => ({ ...p, [dayIdx]: cur.map((sl,i) => { if(i!==si) return sl; const ns=Math.min(23-_step,parseFloat((sl.start+_step).toFixed(2))); const gap=sl.end-sl.start; return {...sl,start:ns,end:Math.min(23.75,parseFloat((ns+gap).toFixed(2)))}; }) }));
                                      }}><span className="material-icons" style={{fontSize:14}}>add</span></button>
                                    </div>
                                    <span className="material-icons" style={{ color:'var(--text-2)', fontSize:16 }}>arrow_forward</span>
                                    <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                                      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => {
                                        const cur = _getSlots(dayIdx);
                                        setDaySettings(p => ({ ...p, [dayIdx]: cur.map((sl,i) => i!==si ? sl : {...sl, end:Math.max(_step,parseFloat((sl.end-_step).toFixed(2)))}) }));
                                      }}><span className="material-icons" style={{fontSize:14}}>remove</span></button>
                                      <span style={{ fontWeight:700, fontSize:14, minWidth:40, textAlign:'center' }}>{formatHour(s.end)}</span>
                                      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => {
                                        const cur = _getSlots(dayIdx);
                                        setDaySettings(p => ({ ...p, [dayIdx]: cur.map((sl,i) => i!==si ? sl : {...sl, end:Math.min(23.75,parseFloat((sl.end+_step).toFixed(2)))}) }));
                                      }}><span className="material-icons" style={{fontSize:14}}>add</span></button>
                                    </div>
                                  </div>
                                  {_poolCoaches.length > 0 && (
                                    <div>
                                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>BU SEANSA GELECEK ANTRENÖRLER</div>
                                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                        {_poolCoaches.map(coach => {
                                          const _isActive = s.coachIds == null || s.coachIds.includes(coach.id);
                                          return (
                                            <button key={coach.id} type="button"
                                              className={'btn btn-sm ' + (_isActive ? 'btn-pri' : 'btn-ghost')}
                                              onClick={() => {
                                                const cur = _getSlots(dayIdx);
                                                const next = cur.map((sl,i) => {
                                                  if(i!==si) return sl;
                                                  const cids = sl.coachIds ?? _pool;
                                                  const nids = cids.includes(coach.id) ? cids.filter(id=>id!==coach.id) : [...cids, coach.id];
                                                  return {...sl, coachIds: (nids.length===0||nids.length===_pool.length) ? undefined : nids};
                                                });
                                                setDaySettings(p => ({ ...p, [dayIdx]: next }));
                                              }}>
                                              {coach.full_name}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </Field>
            )}
            <Field label={`ÜYELER (${members.filter(m=>m.name.trim()).length}/${members.length}, en az 2 gerekli)`}>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {members.map((m, i) => (
                  <div key={m.key} style={{ display:'flex', gap:8, alignItems:'flex-start', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ width:22, height:22, borderRadius:11, background:'var(--brand-navy-soft,#EEF2FF)', display:'grid', placeItems:'center', flexShrink:0, marginTop:8 }}>
                      <span style={{ fontSize:11, fontWeight:800, color:'var(--brand-navy)' }}>{i+1}</span>
                    </div>
                    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                      <input placeholder="Ad Soyad *" value={m.name} onChange={e=>setMembers(p=>p.map(r=>r.key===m.key?{...r,name:e.target.value}:r))} />
                      <div style={{ display:'flex', gap:6 }}>
                        <input style={{ flex:1 }} placeholder="İletişim no" value={m.phone} onChange={e=>setMembers(p=>p.map(r=>r.key===m.key?{...r,phone:e.target.value}:r))} />
                        <input style={{ flex:1 }} placeholder="Kişi (veli vb.)" value={m.contact} onChange={e=>setMembers(p=>p.map(r=>r.key===m.key?{...r,contact:e.target.value}:r))} />
                      </div>
                      <input type="number" min="0" placeholder={`Özel Ücret ₺ (boş: ${monthlyFee||'0'} ₺)`} value={m.fee} onChange={e=>setMembers(p=>p.map(r=>r.key===m.key?{...r,fee:e.target.value}:r))} />
                      {selectedDays.length > 0 && (
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:2 }}>
                          {DAYS.filter(([,idx]) => selectedDays.includes(idx)).map(([label,idx]) => {
                            const effectiveDays = (m.days||[]).length === 0 ? selectedDays : m.days;
                            const active = effectiveDays.includes(idx);
                            return (
                              <button key={idx} type="button"
                                style={{ padding:'2px 7px', fontSize:10, fontWeight:700, borderRadius:5, border:'1px solid', cursor:'pointer',
                                  borderColor: active ? '#0D9488' : 'var(--border)',
                                  background: active ? '#0D948818' : 'var(--surface)',
                                  color: active ? '#0D9488' : 'var(--text-2)' }}
                                onClick={() => {
                                  const base = (m.days||[]).length === 0 ? [...selectedDays] : m.days;
                                  const next = active ? base.filter(d=>d!==idx) : [...base,idx];
                                  setMembers(p=>p.map(r=>r.key===m.key?{...r,days:next}:r));
                                }}>{label}</button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {members.length > 3 && (
                      <button type="button" style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', marginTop:6, padding:2 }}
                        onClick={() => setMembers(p=>p.filter(r=>r.key!==m.key))}>
                        <span className="material-icons" style={{fontSize:18}}>close</span>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm"
                  onClick={() => setMembers(p=>[...p,makeMember()])}>
                  <span className="material-icons" style={{fontSize:15}}>add</span> Üye Ekle
                </button>
              </div>
            </Field>
          </div>
        </Modal>
      )}

      {/* ══ Detay Modalı ══════════════════════════════════════════ */}
      {detailVisible && detailGroup && (
        <Modal title={detailGroup.name} wide onClose={() => setDetailVisible(false)}
          footer={
            <div style={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteGroup(detailGroup)}>Sil</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleToggleGroup(detailGroup.id)}>
                  {detailGroup.is_active ? 'Pasife Al' : 'Aktifleştir'}
                </button>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetailVisible(false)}>Kapat</button>
            </div>
          }>
          <div className="tabs" style={{ marginBottom:16 }}>
            {[{k:'members',l:'Üyeler'},{k:'schedule',l:'Program'},{k:'settings',l:'Ücret & Ayarlar'}].map(t => (
              <button key={t.k} className={detailTab===t.k?'active':''} onClick={()=>setDetailTab(t.k)}>{t.l}</button>
            ))}
          </div>

          {detailTab === 'members' && (
            <div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
                <button className="btn btn-pri btn-sm" onClick={() => { setNewMember({name:'',phone:'',contact:'',fee:'',schedule_slots:[...detailGroupSlots]}); setAddMemberVisible(true); }}>
                  <span className="material-icons" style={{fontSize:15}}>person_add</span> Üye Ekle
                </button>
              </div>
              {(detailGroup.members||[]).length === 0 ? <EmptyState icon="person" title="Üye yok" /> : (
                (detailGroup.members||[]).map(member => (
                  <div key={member.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:34, height:34, borderRadius:17, background:'#EEF2FF', display:'grid', placeItems:'center', flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--brand-navy)' }}>{member.member_name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{member.member_name}</div>
                      <div style={{ fontSize:11, color:'var(--text-2)' }}>
                        {[member.contact_number, member.contact_person].filter(Boolean).join(' · ')}
                      </div>
                      {member.custom_fee != null && <div style={{ fontSize:11, color:'#0D9488' }}>Özel: ₺{member.custom_fee}/ay</div>}
                      {(member.schedule_slots||[]).length > 0 && (
                        <div style={{ fontSize:11, color:'#0D9488', fontWeight:600, marginTop:1 }}>
                          {(member.schedule_slots||[]).slice().sort((a,b) => (a.day===0?7:a.day)-(b.day===0?7:b.day) || a.start_hour-b.start_hour).map(s => `${['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'][s.day]} ${String(s.start_hour).padStart(2,'0')}:00`).join(' · ')}
                        </div>
                      )}
                    </div>
                    <button className="btn btn-ghost btn-sm btn-icon" title="Düzenle"
                      onClick={() => {
                        setEditingMember(member);
                        const currentSlots = (member.schedule_slots?.length ?? 0) > 0 ? member.schedule_slots : [...detailGroupSlots];
                        setEditMemberForm({name:member.member_name,phone:member.contact_number||'',contact:member.contact_person||'',fee:member.custom_fee!=null?String(member.custom_fee):'',schedule_slots:currentSlots});
                        setEditMemberVisible(true);
                      }}>
                      <span className="material-icons" style={{fontSize:15}}>edit</span>
                    </button>
                    <button className="btn btn-danger btn-sm btn-icon" title="Çıkar" onClick={() => handleRemoveMember(member)}>
                      <span className="material-icons" style={{fontSize:15}}>person_remove</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {detailTab === 'schedule' && (
            <div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
                <button className="btn btn-pri btn-sm" onClick={() => openEditSchedule(detailGroup)}>
                  <span className="material-icons" style={{fontSize:15}}>edit</span> Programı Düzenle
                </button>
              </div>
              <ScheduleDisplay groupId={detailGroup.id} courts={courts} coaches={coaches} />
            </div>
          )}

          {detailTab === 'settings' && (
            <div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
                <button className="btn btn-pri btn-sm" onClick={openEditFee}>
                  <span className="material-icons" style={{fontSize:15}}>edit</span> Düzenle
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <div className="kv"><span className="k">Aylık Aidat</span><span className="v">₺{detailGroup.monthly_fee ?? 0}/ay</span></div>
                <div className="kv"><span className="k">Kulüp Payı</span><span className="v">%{detailGroup.club_percentage ?? 100}</span></div>
                <div className="kv"><span className="k">Pay Modeli</span><span className="v">{detailGroup.split_type === 'fixed_amount' ? '₺ Sabit Tutar' : '% Yüzde'}</span></div>
                {(detailGroup.coaches||[]).length > 0 && (
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>Antrenörler</div>
                    {(detailGroup.coaches||[]).map(c => (
                      <div key={c.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                        <span>{c.full_name}</span>
                        <span style={{ color:'var(--text-2)' }}>{detailGroup.split_type==='fixed_amount'?`₺${c.fixed_amount??0}`:`%${c.share_percentage}`}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Üye Ekle Modalı */}
      {addMemberVisible && (
        <Modal title="Üye Ekle" onClose={() => setAddMemberVisible(false)}
          footer={<><button className="btn btn-ghost btn-sm" onClick={() => setAddMemberVisible(false)}>Vazgeç</button><button className="btn btn-pri btn-sm" onClick={handleAddMember} disabled={addingMember}>{addingMember?'Ekleniyor…':'Ekle'}</button></>}>
          <div className="fields" style={{ gap:10 }}>
            <Field label="AD SOYAD *"><input placeholder="Ad Soyad" value={newMember.name} onChange={e=>setNewMember({...newMember,name:e.target.value})} /></Field>
            <div className="fields-2">
              <Field label="TELEFON"><input placeholder="İletişim no" value={newMember.phone} onChange={e=>setNewMember({...newMember,phone:e.target.value})} /></Field>
              <Field label="KİŞİ"><input placeholder="Veli adı vb." value={newMember.contact} onChange={e=>setNewMember({...newMember,contact:e.target.value})} /></Field>
            </div>
            <Field label="ÖZEL ÜCRET (₺)"><input type="number" min="0" placeholder={`Boş: ${detailGroup?.monthly_fee??0} ₺`} value={newMember.fee} onChange={e=>setNewMember({...newMember,fee:e.target.value})} /></Field>
            {detailGroupSlots.length > 0 && (
              <Field label="SEANSLAR">
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {detailGroupSlots.map((slot, si) => {
                    const active = (newMember.schedule_slots||[]).some(s => s.day===slot.day && s.start_hour===slot.start_hour);
                    const lbl = `${['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'][slot.day]} ${String(slot.start_hour).padStart(2,'0')}:00`;
                    return (
                      <button key={si} type="button"
                        style={{ padding:'3px 9px', fontSize:11, fontWeight:700, borderRadius:6, border:'1px solid', cursor:'pointer',
                          borderColor: active ? '#0D9488' : 'var(--border)',
                          background: active ? '#0D948818' : 'var(--surface)',
                          color: active ? '#0D9488' : 'var(--text-2)' }}
                        onClick={() => setNewMember(p => {
                          const cur = p.schedule_slots||[];
                          return { ...p, schedule_slots: active ? cur.filter(s => !(s.day===slot.day && s.start_hour===slot.start_hour)) : [...cur, slot] };
                        })}>
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}
          </div>
        </Modal>
      )}

      {/* Üye Düzenle Modalı */}
      {editMemberVisible && editingMember && (
        <Modal title="Üyeyi Düzenle" onClose={() => setEditMemberVisible(false)}
          footer={<><button className="btn btn-ghost btn-sm" onClick={() => setEditMemberVisible(false)}>Vazgeç</button><button className="btn btn-pri btn-sm" onClick={handleSaveEditMember}>Kaydet</button></>}>
          <div className="fields" style={{ gap:10 }}>
            <Field label="AD SOYAD *"><input placeholder="Ad Soyad" value={editMemberForm.name} onChange={e=>setEditMemberForm({...editMemberForm,name:e.target.value})} /></Field>
            <div className="fields-2">
              <Field label="TELEFON"><input placeholder="İletişim no" value={editMemberForm.phone} onChange={e=>setEditMemberForm({...editMemberForm,phone:e.target.value})} /></Field>
              <Field label="KİŞİ"><input placeholder="Veli adı vb." value={editMemberForm.contact} onChange={e=>setEditMemberForm({...editMemberForm,contact:e.target.value})} /></Field>
            </div>
            <Field label="ÖZEL ÜCRET (₺)"><input type="number" min="0" placeholder="Boş: grup aidatı" value={editMemberForm.fee} onChange={e=>setEditMemberForm({...editMemberForm,fee:e.target.value})} /></Field>
            {detailGroupSlots.length > 0 && (
              <Field label="SEANSLAR">
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {detailGroupSlots.map((slot, si) => {
                    const active = (editMemberForm.schedule_slots||[]).some(s => s.day===slot.day && s.start_hour===slot.start_hour);
                    const lbl = `${['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'][slot.day]} ${String(slot.start_hour).padStart(2,'0')}:00`;
                    return (
                      <button key={si} type="button"
                        style={{ padding:'3px 9px', fontSize:11, fontWeight:700, borderRadius:6, border:'1px solid', cursor:'pointer',
                          borderColor: active ? '#0D9488' : 'var(--border)',
                          background: active ? '#0D948818' : 'var(--surface)',
                          color: active ? '#0D9488' : 'var(--text-2)' }}
                        onClick={() => setEditMemberForm(p => {
                          const cur = p.schedule_slots||[];
                          return { ...p, schedule_slots: active ? cur.filter(s => !(s.day===slot.day && s.start_hour===slot.start_hour)) : [...cur, slot] };
                        })}>
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}
          </div>
        </Modal>
      )}

      {/* ══ Program Düzenle Modalı ════════════════════════════════ */}
      {editSchedVisible && (
        <Modal title="Programı Düzenle" wide onClose={() => setEditSchedVisible(false)}
          footer={<><button className="btn btn-ghost btn-sm" onClick={() => setEditSchedVisible(false)}>Vazgeç</button><button className="btn btn-pri btn-sm" onClick={handleSaveSchedule} disabled={savingSched}>{savingSched?'Kaydediliyor…':'Kaydet'}</button></>}>
          <div className="fields" style={{ gap:14 }}>
            <div className="fields-2">
              <Field label="GRUP ADI"><input value={editSchedName} onChange={e=>setEditSchedName(e.target.value)} /></Field>
              <Field label="AÇIKLAMA"><input placeholder="İsteğe bağlı" value={editSchedDesc} onChange={e=>setEditSchedDesc(e.target.value)} /></Field>
            </div>
            {coaches.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10 }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13 }}>Farklı günlere farklı hocalar</div>
                </div>
                <Switch on={editDiffCoachesPerDay} onChange={v => { setEditDiffCoachesPerDay(v); if (!v) setEditDayCoachIds({}); }} />
              </div>
            )}
            {!editDiffCoachesPerDay && (
              <Field label="ANTRENÖRLER">
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {coaches.map(c => (
                    <button key={c.id} type="button"
                      className={'btn btn-sm ' + (editSchedCoachIds.includes(c.id)?'btn-pri':'btn-ghost')}
                      onClick={() => setEditSchedCoachIds(p=>p.includes(c.id)?p.filter(id=>id!==c.id):[...p,c.id])}>
                      {c.full_name}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            {courts.length > 0 && (
              <Field label="GÜNLER">
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                  {DAYS.map(([label,idx]) => (
                    <button key={idx} type="button"
                      className={'btn btn-sm ' + (editSchedDays.includes(idx)?'btn-pri':'btn-ghost')}
                      onClick={() => {
                        if (editSchedDays.includes(idx)) {
                          setEditSchedDays(p=>p.filter(d=>d!==idx));
                          setEditSchedDaySettings(p=>{const n={...p};delete n[idx];return n;});
                          setEditDayCoachIds(p=>{const n={...p};delete n[idx];return n;});
                        } else {
                          setEditSchedDays(p=>[...p,idx]);
                          setEditSchedDaySettings(p=>({...p,[idx]:Array.isArray(p[idx])?p[idx]:(p[idx]?[p[idx]]:[makeSlot()])}));
                          if (editDiffCoachesPerDay) setEditDayCoachIds(p=>({...p,[idx]:p[idx]??[...editSchedCoachIds]}));
                        }
                      }}>{label}</button>
                  ))}
                </div>
                {editSchedDays.length > 0 && (() => {
                  const _days = [...editSchedDays].sort((a,b)=>a-b);
                  const _step = editSchedUse15Min ? 0.25 : 0.5;
                  const _getSlots = (idx) => {
                    const v = editSchedDaySettings[idx];
                    return Array.isArray(v) ? (v.length > 0 ? v : [makeSlot()]) : (v ? [v] : [makeSlot()]);
                  };
                  return (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:2 }}>
                        <span style={{ fontSize:12, color:'var(--text-2)', fontWeight:600 }}>15 Dakikalık Artış</span>
                        <button type="button" className={'btn btn-sm ' + (editSchedUse15Min ? 'btn-pri' : 'btn-ghost')}
                          onClick={() => setEditSchedUse15Min(v => !v)}>
                          {editSchedUse15Min ? 'Açık' : 'Kapalı'}
                        </button>
                        {editSchedUse15Min && <span style={{ fontSize:11, color:'var(--text-2)' }}>22:15 gibi saatler seçilebilir</span>}
                      </div>
                      {_days.map(dayIdx => {
                        const _slots = _getSlots(dayIdx);
                        return (
                          <div key={dayIdx} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                              <span style={{ fontWeight:700, fontSize:13, color:'var(--text-1)' }}>{DAY_NAMES[dayIdx]}</span>
                              <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize:12 }}
                                onClick={() => {
                                  const cur = _getSlots(dayIdx);
                                  const last = cur[cur.length - 1];
                                  setEditSchedDaySettings(p => ({ ...p, [dayIdx]: [...cur, { courts:[], start:last.end, end:Math.min(23.75, last.end + 2) }] }));
                                }}>
                                <span className="material-icons" style={{fontSize:14,verticalAlign:'middle'}}>add</span> Seans Ekle
                              </button>
                            </div>
                            {editDiffCoachesPerDay && coaches.length > 0 && (
                              <div style={{ marginBottom:10 }}>
                                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>ANTRENÖRLER</div>
                                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                  {coaches.map(coach => {
                                    const _dayIds = editDayCoachIds[dayIdx] || [];
                                    return (
                                      <button key={coach.id} type="button"
                                        className={'btn btn-sm ' + (_dayIds.includes(coach.id) ? 'btn-pri' : 'btn-ghost')}
                                        onClick={() => setEditDayCoachIds(p => { const cur = p[dayIdx]||[]; return {...p,[dayIdx]: cur.includes(coach.id)?cur.filter(id=>id!==coach.id):[...cur,coach.id]}; })}>
                                        {coach.full_name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {_slots.map((s, si) => {
                              const _pool = editDiffCoachesPerDay ? (editDayCoachIds[dayIdx] || []) : editSchedCoachIds;
                              const _poolCoaches = coaches.filter(c => _pool.includes(c.id));
                              return (
                                <div key={si} style={{ border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', marginBottom: si < _slots.length-1 ? 10 : 0 }}>
                                  {_slots.length > 1 && (
                                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                                      <span style={{ fontSize:12, fontWeight:700, color:'var(--text-2)' }}>SEANS {si + 1}</span>
                                      <button type="button" className="btn btn-ghost btn-sm btn-icon"
                                        onClick={() => {
                                          const cur = _getSlots(dayIdx);
                                          if (cur.length <= 1) return;
                                          setEditSchedDaySettings(p => ({ ...p, [dayIdx]: cur.filter((_,i) => i !== si) }));
                                        }}>
                                        <span className="material-icons" style={{fontSize:14,color:'#EF4444'}}>close</span>
                                      </button>
                                    </div>
                                  )}
                                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>KORTLAR</div>
                                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                                    {courts.map(c => (
                                      <button key={c.id} type="button"
                                        className={'btn btn-sm ' + (s.courts.includes(c.id) ? 'btn-pri' : 'btn-ghost')}
                                        onClick={() => {
                                          const cur = _getSlots(dayIdx);
                                          const next = cur.map((sl, i) => i !== si ? sl : { ...sl, courts: sl.courts.includes(c.id) ? sl.courts.filter(id=>id!==c.id) : [...sl.courts, c.id] });
                                          setEditSchedDaySettings(p => ({ ...p, [dayIdx]: next }));
                                        }}>
                                        Kort {c.court_number}
                                      </button>
                                    ))}
                                  </div>
                                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>SAAT ARALIĞI</div>
                                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: _poolCoaches.length > 0 ? 10 : 0 }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                                      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => {
                                        const cur = _getSlots(dayIdx);
                                        setEditSchedDaySettings(p => ({ ...p, [dayIdx]: cur.map((sl,i) => i!==si ? sl : {...sl, start:Math.max(0,parseFloat((sl.start-_step).toFixed(2)))}) }));
                                      }}><span className="material-icons" style={{fontSize:14}}>remove</span></button>
                                      <span style={{ fontWeight:700, fontSize:14, minWidth:40, textAlign:'center' }}>{formatHour(s.start)}</span>
                                      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => {
                                        const cur = _getSlots(dayIdx);
                                        setEditSchedDaySettings(p => ({ ...p, [dayIdx]: cur.map((sl,i) => { if(i!==si) return sl; const ns=Math.min(23-_step,parseFloat((sl.start+_step).toFixed(2))); const gap=sl.end-sl.start; return {...sl,start:ns,end:Math.min(23.75,parseFloat((ns+gap).toFixed(2)))}; }) }));
                                      }}><span className="material-icons" style={{fontSize:14}}>add</span></button>
                                    </div>
                                    <span className="material-icons" style={{ color:'var(--text-2)', fontSize:16 }}>arrow_forward</span>
                                    <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'4px 8px' }}>
                                      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => {
                                        const cur = _getSlots(dayIdx);
                                        setEditSchedDaySettings(p => ({ ...p, [dayIdx]: cur.map((sl,i) => i!==si ? sl : {...sl, end:Math.max(_step,parseFloat((sl.end-_step).toFixed(2)))}) }));
                                      }}><span className="material-icons" style={{fontSize:14}}>remove</span></button>
                                      <span style={{ fontWeight:700, fontSize:14, minWidth:40, textAlign:'center' }}>{formatHour(s.end)}</span>
                                      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => {
                                        const cur = _getSlots(dayIdx);
                                        setEditSchedDaySettings(p => ({ ...p, [dayIdx]: cur.map((sl,i) => i!==si ? sl : {...sl, end:Math.min(23.75,parseFloat((sl.end+_step).toFixed(2)))}) }));
                                      }}><span className="material-icons" style={{fontSize:14}}>add</span></button>
                                    </div>
                                  </div>
                                  {_poolCoaches.length > 0 && (
                                    <div>
                                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>BU SEANSA GELECEK ANTRENÖRLER</div>
                                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                        {_poolCoaches.map(coach => {
                                          const _isActive = s.coachIds == null || s.coachIds.includes(coach.id);
                                          return (
                                            <button key={coach.id} type="button"
                                              className={'btn btn-sm ' + (_isActive ? 'btn-pri' : 'btn-ghost')}
                                              onClick={() => {
                                                const cur = _getSlots(dayIdx);
                                                const next = cur.map((sl,i) => {
                                                  if(i!==si) return sl;
                                                  const cids = sl.coachIds ?? _pool;
                                                  const nids = cids.includes(coach.id) ? cids.filter(id=>id!==coach.id) : [...cids, coach.id];
                                                  return {...sl, coachIds: (nids.length===0||nids.length===_pool.length) ? undefined : nids};
                                                });
                                                setEditSchedDaySettings(p => ({ ...p, [dayIdx]: next }));
                                              }}>
                                              {coach.full_name}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </Field>
            )}
          </div>
        </Modal>
      )}

      {/* ══ Ücret & Pay Ayarları Modalı ══════════════════════════ */}
      {editFeeVisible && detailGroup && (
        <Modal title="Ücret & Pay Ayarları" onClose={() => setEditFeeVisible(false)}
          footer={<><button className="btn btn-ghost btn-sm" onClick={() => setEditFeeVisible(false)}>Vazgeç</button><button className="btn btn-pri btn-sm" onClick={handleSaveFee} disabled={savingFee}>{savingFee?'Kaydediliyor…':'Kaydet'}</button></>}>
          <div className="fields" style={{ gap:12 }}>
            <Field label="AYLIK AİDAT (₺)"><input type="number" min="0" value={editFee} onChange={e=>setEditFee(e.target.value)} /></Field>
            {(detailGroup.coaches||[]).length > 0 && (
              <Field label="PAY MODELİ">
                <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid var(--border)' }}>
                  {[{v:'percentage',l:'% Yüzde'},{v:'fixed_amount',l:'₺ Tutar'}].map(opt => (
                    <button key={opt.v} type="button"
                      style={{ flex:1, padding:'8px', fontSize:13, fontWeight:600, border:'none', cursor:'pointer', background:editSplitType===opt.v?'var(--brand-navy)':'transparent', color:editSplitType===opt.v?'#fff':'var(--text-1)' }}
                      onClick={() => setEditSplitType(opt.v)}>{opt.l}</button>
                  ))}
                </div>
              </Field>
            )}
            {(detailGroup.coaches||[]).length > 0 && editSplitType === 'percentage' && (
              <Field label="KULÜP PAYI (%)">
                <input type="number" min="0" max="100" value={editPct} onChange={e=>setEditPct(e.target.value)} />
                {parseFloat(editPct) < 100 && <div style={{ fontSize:12, color:'var(--text-2)', marginTop:4 }}>Hoca payı: %{Math.round((100-parseFloat(editPct))*100)/100}</div>}
              </Field>
            )}
            {(detailGroup.coaches||[]).length > 0 && editSplitType === 'fixed_amount' && (
              <Field label="HOCA TUTARLARI (₺)">
                {(detailGroup.coaches||[]).map(c => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ flex:1, fontSize:13 }}>{c.full_name}</span>
                    <input type="number" min="0" style={{ width:100 }} placeholder="0 ₺" value={editCoachFixed[c.id]??''} onChange={e=>setEditCoachFixed(p=>({...p,[c.id]:e.target.value}))} />
                  </div>
                ))}
              </Field>
            )}
          </div>
        </Modal>
      )}

      {/* ══ Aidat Takip Modalı ════════════════════════════════════ */}
      {paymentVisible && paymentGroup && (
        <Modal title={`${paymentGroup.name} — Aidat Takibi`} wide onClose={() => setPaymentVisible(false)}
          footer={<button className="btn btn-ghost btn-sm" onClick={() => setPaymentVisible(false)}>Kapat</button>}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, padding:'10px 14px', background:'var(--bg)', borderRadius:10 }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigatePayMonth(-1)}>
              <span className="material-icons">chevron_left</span>
            </button>
            <span style={{ fontWeight:700, fontSize:15 }}>{MONTHS_TR[payMonth-1]} {payYear}</span>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigatePayMonth(1)}>
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
          {loadingDues ? <Spinner size={28} /> : (
            <div>
              <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                <div style={{ flex:1, padding:'10px 14px', background:'var(--bg)', borderRadius:10, textAlign:'center' }}>
                  <div style={{ fontWeight:800, fontSize:20, color:'#22C55E' }}>{paidCount}/{dues.length}</div>
                  <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2 }}>Ödedi</div>
                </div>
                <div style={{ flex:1, padding:'10px 14px', background:'var(--bg)', borderRadius:10, textAlign:'center' }}>
                  <div style={{ fontWeight:800, fontSize:20, color:'var(--brand-navy)' }}>₺{totalDuesAmt.toLocaleString('tr-TR')}</div>
                  <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2 }}>Toplam Aidat</div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                {dues.map(due => (
                  <div key={due.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--bg)', borderRadius:10, border:`1px solid ${due.is_paid?'#BBF7D0':'var(--border)'}` }}>
                    <div style={{ width:34, height:34, borderRadius:17, background:due.is_paid?'#DCFCE7':'#EEF2FF', display:'grid', placeItems:'center', flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:due.is_paid?'#22C55E':'var(--brand-navy)' }}>{due.member_name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{due.member_name}</div>
                      <div style={{ fontSize:12, color:'var(--text-2)' }}>₺{due.amount} / ay</div>
                    </div>
                    {duesPost ? (
                      <Badge cls={due.is_paid?'b-green':''}>{due.is_paid?'Ödendi':'Bekliyor'}</Badge>
                    ) : (
                      <button
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', background:due.is_paid?'#DCFCE7':'#EEF2FF', color:due.is_paid?'#22C55E':'var(--brand-navy)', fontWeight:600, fontSize:12 }}
                        onClick={() => handleToggleDuePaid(due)}>
                        <span className="material-icons" style={{fontSize:14}}>{due.is_paid?'check_circle':'radio_button_unchecked'}</span>
                        {due.is_paid ? 'Ödendi' : 'İşaretle'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {!duesPost ? (
                <button
                  style={{ width:'100%', padding:'13px', borderRadius:12, border:'none', cursor:allDuesPaid?'pointer':'not-allowed', background:allDuesPaid?'#22C55E':'var(--border)', color:allDuesPaid?'#fff':'var(--text-2)', fontWeight:700, fontSize:14, opacity:postingFinance?0.6:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                  onClick={handlePostToFinance} disabled={!allDuesPaid||postingFinance}>
                  <span className="material-icons" style={{fontSize:16}}>account_balance_wallet</span>
                  {postingFinance ? 'İşleniyor...' : allDuesPaid ? 'Finansa İşle' : `${dues.length-paidCount} üye ödeme bekliyor`}
                </button>
              ) : (
                <div style={{ padding:'13px', borderRadius:12, background:'#DCFCE7', textAlign:'center' }}>
                  <span className="material-icons" style={{ color:'#22C55E', fontSize:20, verticalAlign:'middle', marginRight:6 }}>check_circle</span>
                  <span style={{ color:'#22C55E', fontWeight:700, fontSize:14 }}>Finansa işlendi</span>
                  <div style={{ fontSize:12, color:'#16A34A', marginTop:4 }}>Kulüp: ₺{duesPost.club_amount?.toLocaleString('tr-TR')} · Hoca: ₺{duesPost.coach_amount?.toLocaleString('tr-TR')}</div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GRUP OYUNCUSU PROFİLİ (sub-screen)
// ═══════════════════════════════════════════════════════════════
function MemberProfileView({ member, onBack, clubId }) {
  const { useState, useEffect, useCallback } = React;
  const DAY_NAMES   = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const DAY_LABELS  = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
  const MONTHS_TR   = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const NOTE_TABS   = [
    { type:'weekly_training', label:'Antrenman',  icon:'fitness_center',   color:'#003399', bg:'#EEF2FF' },
    { type:'match_summary',   label:'Maç',        icon:'emoji_events',     color:'#F59E0B', bg:'#FEF3C7' },
    { type:'private_lesson',  label:'Özel Ders',  icon:'person',           color:'#0D9488', bg:'#CCFBF1' },
    { type:'general',         label:'Genel',      icon:'notes',            color:'#F97316', bg:'#FFEDD5' },
  ];

  const [attendance,        setAttendance]        = useState([]);
  const [notes,             setNotes]             = useState([]);
  const [activeTab,         setActiveTab]         = useState('weekly_training');
  const [loading,           setLoading]           = useState(true);
  const [coachId,           setCoachId]           = useState(null);

  // Memberships
  const [allMemberships,    setAllMemberships]    = useState([]);
  const [membershipClosures,setMembershipClosures]= useState({});

  // Edit membership modal
  const [editMemModal,      setEditMemModal]      = useState(false);
  const [editingMem,        setEditingMem]        = useState(null);
  const [editMemForm,       setEditMemForm]       = useState({ custom_fee:'', schedule_slots:[], groupSlots:[] });
  const [savingMem,         setSavingMem]         = useState(false);

  // Add to group modal
  const [addGroupModal,     setAddGroupModal]     = useState(false);
  const [availableGroups,   setAvailableGroups]   = useState([]);
  const [addForm,           setAddForm]           = useState({ groupId:'', groupName:'', custom_fee:'', schedule_slots:[], groupSlots:[] });
  const [addGroupClosures,  setAddGroupClosures]  = useState([]);
  const [conflictWarnings,  setConflictWarnings]  = useState([]);
  const [savingAdd,         setSavingAdd]         = useState(false);

  // Note form modal
  const [noteModal,         setNoteModal]         = useState(false);
  const [editingNote,       setEditingNote]       = useState(null);
  const [saving,            setSaving]            = useState(false);
  const [noteForm,          setNoteForm]          = useState({ note_type:'weekly_training', title:'', content:'', session_date: new Date().toISOString().slice(0,10) });

  const avatarColor = (name) => {
    const COLORS = ['#003399','#0D9488','#22C55E','#8B5CF6','#EC4899','#F59E0B','#EF4444'];
    return COLORS[(name||'').charCodeAt(0) % COLORS.length];
  };
  const inits = (name) => (name||'').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const color = avatarColor(member.member_name || '');
  const fmtH  = (h, m) => `${String(h).padStart(2,'0')}:${String(m??0).padStart(2,'0')}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await sb.auth.getUser();
      const [{ data: attendRows }, { data: noteRows }, { data: coachRow }, { data: membershipsData }] = await Promise.all([
        sb.from('group_attendance').select('status, session_date')
          .eq('group_id', member.groupId).eq('member_id', member.id)
          .order('session_date', { ascending: false }),
        sb.from('student_coach_notes').select('*')
          .eq('member_id', member.id)
          .order('session_date', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false }),
        clubId ? sb.from('club_coaches').select('id').eq('club_id', clubId).limit(1).maybeSingle() : Promise.resolve({ data: null }),
        sb.from('club_group_members')
          .select('id, group_id, custom_fee, schedule_days, schedule_slots, club_groups!inner(id, name, club_id, is_active)')
          .eq('member_name', member.member_name)
          .eq('club_groups.club_id', clubId)
          .eq('club_groups.is_active', true),
      ]);

      setCoachId(coachRow?.id ?? null);
      setNotes(noteRows || []);

      const memberships = (membershipsData || []).map(r => ({
        id: r.id,
        groupId: r.group_id,
        groupName: r.club_groups?.name ?? '',
        custom_fee: r.custom_fee ?? null,
        schedule_days: r.schedule_days ?? [],
        schedule_slots: r.schedule_slots ?? [],
      }));
      setAllMemberships(memberships);

      if (memberships.length > 0) {
        const gIds = memberships.map(m => m.groupId);
        const { data: allClosures } = await sb.from('court_closures')
          .select('group_id, day_of_week, start_hour, start_minute, end_hour, end_minute, coach:club_coaches(full_name), courts(court_number)')
          .in('group_id', gIds)
          .eq('is_active', true);
        const closureMap = {};
        for (const c of allClosures || []) {
          if (!closureMap[c.group_id]) closureMap[c.group_id] = [];
          closureMap[c.group_id].push({
            day_of_week: c.day_of_week, start_hour: c.start_hour, start_minute: c.start_minute,
            end_hour: c.end_hour, end_minute: c.end_minute,
            coachName: c.coach?.full_name, courtNumber: c.courts?.court_number,
          });
        }
        setMembershipClosures(closureMap);
      }

      const monthMap = {};
      for (const row of (attendRows || [])) {
        const d = new Date(row.session_date + 'T12:00:00');
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (!monthMap[key]) monthMap[key] = { present:0, total:0, year:d.getFullYear(), month:d.getMonth() };
        monthMap[key].total += 1;
        if (row.status === 'present') monthMap[key].present += 1;
      }
      const list = Object.entries(monthMap)
        .sort(([a],[b]) => b.localeCompare(a))
        .map(([key, val]) => ({ key, label:`${MONTHS_TR[val.month]} ${val.year}`, present:val.present, total:val.total }));
      setAttendance(list);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [member.id, member.groupId, member.member_name, clubId]);

  useEffect(() => { load(); }, [load]);

  // ── Edit membership ───────────────────────────────────────────────────────
  const openEditMem = async (mem) => {
    const { data: gc } = await sb.from('court_closures').select('day_of_week,start_hour').eq('group_id', mem.groupId).eq('is_active', true);
    const slotMap = {};
    for (const c of (gc||[])) { const k=`${c.day_of_week}_${c.start_hour||0}`; if (!slotMap[k]) slotMap[k]={day:c.day_of_week,start_hour:c.start_hour||0}; }
    const groupSlots = Object.values(slotMap).sort((a,b)=>(a.day===0?7:a.day)-(b.day===0?7:b.day)||a.start_hour-b.start_hour);
    const currentSlots = (mem.schedule_slots?.length??0) > 0 ? mem.schedule_slots : groupSlots;
    setEditingMem(mem);
    setEditMemForm({ custom_fee: mem.custom_fee != null ? String(mem.custom_fee) : '', schedule_slots: currentSlots, groupSlots });
    setEditMemModal(true);
  };
  const saveEditMem = async () => {
    setSavingMem(true);
    try {
      const fee = editMemForm.custom_fee.trim() !== '' ? parseFloat(editMemForm.custom_fee) : null;
      await sb.from('club_group_members').update({ custom_fee: fee, schedule_slots: editMemForm.schedule_slots }).eq('id', editingMem.id);
      setEditMemModal(false);
      await load();
    } catch(e) { console.error(e); alert('Üyelik güncellenemedi.'); }
    finally { setSavingMem(false); }
  };

  // ── Add to group ─────────────────────────────────────────────────────────
  const checkConflicts = (newClosures, selectedDays, currentMemberships, currentClosureMap) => {
    const warnings = [];
    for (const day of selectedDays) {
      const newForDay = newClosures.filter(c => c.day_of_week === day);
      for (const nc of newForDay) {
        const newStart = nc.start_hour + (nc.start_minute ?? 0) / 60;
        const newEnd   = nc.end_hour   + (nc.end_minute   ?? 0) / 60;
        for (const mem of currentMemberships) {
          const existing = (currentClosureMap[mem.groupId] || []).filter(c => c.day_of_week === day);
          for (const ec of existing) {
            const exStart = ec.start_hour + (ec.start_minute ?? 0) / 60;
            const exEnd   = ec.end_hour   + (ec.end_minute   ?? 0) / 60;
            if (newStart < exEnd && newEnd > exStart) {
              warnings.push(`${DAY_NAMES[day]} günü ${fmtH(nc.start_hour, nc.start_minute)}–${fmtH(nc.end_hour, nc.end_minute)} saatinde "${mem.groupName}" grubunda çakışma var`);
            }
          }
        }
      }
    }
    return warnings;
  };
  const openAddGroup = async () => {
    const existingIds = allMemberships.map(m => m.groupId);
    const { data } = await sb.from('club_groups').select('id, name').eq('club_id', clubId).eq('is_active', true).order('name');
    setAvailableGroups((data||[]).filter(g => !existingIds.includes(g.id)));
    setAddForm({ groupId:'', groupName:'', custom_fee:'', schedule_slots:[], groupSlots:[] });
    setAddGroupClosures([]);
    setConflictWarnings([]);
    setAddGroupModal(true);
  };
  const selectGroup = async (g) => {
    const { data: gc } = await sb.from('court_closures')
      .select('day_of_week, start_hour, start_minute, end_hour, end_minute')
      .eq('group_id', g.id).eq('is_active', true);
    const closures = gc || [];
    const slotMap = {};
    for (const c of closures) { const k=`${c.day_of_week}_${c.start_hour||0}`; if (!slotMap[k]) slotMap[k]={day:c.day_of_week,start_hour:c.start_hour||0}; }
    const groupSlots = Object.values(slotMap).sort((a,b)=>(a.day===0?7:a.day)-(b.day===0?7:b.day)||a.start_hour-b.start_hour);
    const groupDays = [...new Set(groupSlots.map(s => s.day))];
    setAddGroupClosures(closures);
    setAddForm(prev => ({ ...prev, groupId: g.id, groupName: g.name, schedule_slots: [...groupSlots], groupSlots }));
    setConflictWarnings(checkConflicts(closures, groupDays, allMemberships, membershipClosures));
  };
  const toggleAddSlot = (slot) => {
    const active = addForm.schedule_slots.some(s => s.day===slot.day && s.start_hour===slot.start_hour);
    const next = active ? addForm.schedule_slots.filter(s=>!(s.day===slot.day&&s.start_hour===slot.start_hour)) : [...addForm.schedule_slots, slot];
    setAddForm(prev => ({ ...prev, schedule_slots: next }));
    const nextDays = [...new Set(next.map(s => s.day))];
    setConflictWarnings(checkConflicts(addGroupClosures, nextDays, allMemberships, membershipClosures));
  };
  const doAddToGroup = async () => {
    if (!addForm.groupId) return alert('Lütfen bir grup seçin.');
    setSavingAdd(true);
    try {
      const fee = addForm.custom_fee.trim() !== '' ? parseFloat(addForm.custom_fee) : null;
      await sb.from('club_group_members').insert({
        group_id: addForm.groupId, member_name: member.member_name,
        contact_number: member.contact_number || null,
        contact_person: member.contact_person || null,
        custom_fee: fee, schedule_slots: addForm.schedule_slots,
      });
      setAddGroupModal(false);
      await load();
    } catch(e) { console.error(e); alert('Gruba eklenemedi.'); }
    finally { setSavingAdd(false); }
  };

  // ── Notes ─────────────────────────────────────────────────────────────────
  const openNewNote = () => {
    setEditingNote(null);
    setNoteForm({ note_type: activeTab, title:'', content:'', session_date: new Date().toISOString().slice(0,10) });
    setNoteModal(true);
  };
  const openEditNote = (note) => {
    setEditingNote(note);
    setNoteForm({ note_type: note.note_type, title: note.title||'', content: note.content, session_date: note.session_date || new Date().toISOString().slice(0,10) });
    setNoteModal(true);
  };
  const saveNote = async () => {
    if (!noteForm.content.trim()) return alert('Not içeriği boş olamaz.');
    setSaving(true);
    try {
      if (editingNote) {
        await sb.from('student_coach_notes').update({ note_type:noteForm.note_type, title:noteForm.title.trim()||null, content:noteForm.content.trim(), session_date:noteForm.session_date||null, updated_at: new Date().toISOString() }).eq('id', editingNote.id);
      } else {
        if (!coachId) return alert('Kulübe kayıtlı antrenör bulunamadı. Not ekleyebilmek için önce kulübe en az bir antrenör ekleyin.');
        await sb.from('student_coach_notes').insert({ member_id:member.id, coach_id:coachId, note_type:noteForm.note_type, title:noteForm.title.trim()||null, content:noteForm.content.trim(), session_date:noteForm.session_date||null });
      }
      setNoteModal(false);
      await load();
    } catch(e) { console.error(e); alert('Not kaydedilemedi.'); }
    finally { setSaving(false); }
  };
  const deleteNote = async (note) => {
    if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) return;
    try {
      await sb.from('student_coach_notes').delete().eq('id', note.id);
      setNotes(prev => prev.filter(n => n.id !== note.id));
    } catch(e) { console.error(e); alert('Not silinemedi.'); }
  };

  const filteredNotes = notes.filter(n => n.note_type === activeTab);
  const activeTabMeta = NOTE_TABS.find(t => t.type === activeTab);

  const formatDate = (str) => {
    if (!str) return '';
    const d = new Date(str + 'T12:00:00');
    return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Build per-group schedule sections
  const scheduleSections = allMemberships.map(mem => {
    const closures = membershipClosures[mem.groupId] || [];
    let relevant;
    if (mem.schedule_slots.length > 0) {
      relevant = closures.filter(c => mem.schedule_slots.some(s => s.day === c.day_of_week && s.start_hour === c.start_hour));
    } else if (mem.schedule_days.length > 0) {
      relevant = closures.filter(c => mem.schedule_days.includes(c.day_of_week));
    } else {
      relevant = closures;
    }
    const slotMap = {};
    for (const c of relevant) {
      const key = `${c.day_of_week}_${c.start_hour}_${c.start_minute||0}_${c.end_hour}_${c.end_minute||0}`;
      if (!slotMap[key]) slotMap[key] = { day_of_week: c.day_of_week, start_hour: c.start_hour, start_minute: c.start_minute, end_hour: c.end_hour, end_minute: c.end_minute, coachNames:[], courtNums:[] };
      if (c.coachName && !slotMap[key].coachNames.includes(c.coachName)) slotMap[key].coachNames.push(c.coachName);
      if (c.courtNumber != null && !slotMap[key].courtNums.includes(c.courtNumber)) slotMap[key].courtNums.push(c.courtNumber);
    }
    const days = Object.values(slotMap).sort((a,b) => (a.day_of_week===0?7:a.day_of_week)-(b.day_of_week===0?7:b.day_of_week) || a.start_hour-b.start_hour);
    return { mem, days };
  }).filter(s => s.days.length > 0);

  return (
    <div className="page fade-in">
      {/* Header */}
      <div className="page-head" style={{ marginBottom:20 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span className="material-icons" style={{fontSize:18}}>arrow_back</span> Geri
        </button>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0 }}>{member.member_name}</h1>
          <div className="sub">{member.groupName}</div>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Profile card */}
          <div className="card" style={{ display:'flex', alignItems:'flex-start', gap:18, marginBottom:18, flexWrap:'wrap' }}>
            {/* Avatar + basic info */}
            <div style={{ display:'flex', gap:14, flex:'0 0 auto', alignItems:'flex-start' }}>
              <div style={{ width:64, height:64, borderRadius:32, background:color+'22', display:'grid', placeItems:'center', flexShrink:0 }}>
                <span style={{ fontSize:22, fontWeight:800, color }}>{inits(member.member_name)}</span>
              </div>
              <div style={{ minWidth:160 }}>
                <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{member.member_name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span className="material-icons" style={{fontSize:14, color:'#0D9488'}}>groups</span>
                  <span style={{ fontSize:13, color:'#0D9488', fontWeight:600 }}>{member.groupName}</span>
                </div>
                {member.contact_number && (
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-2)', marginBottom:2 }}>
                    <span className="material-icons" style={{fontSize:13}}>phone</span>{member.contact_number}
                  </div>
                )}
                {member.contact_person && (
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-2)', marginBottom:2 }}>
                    <span className="material-icons" style={{fontSize:13}}>person_outline</span>{member.contact_person}
                  </div>
                )}
              </div>
            </div>

            {/* GRUPLAR block */}
            {allMemberships.length > 0 && (
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:'0.05em' }}>GRUPLAR</div>
                {allMemberships.map(mem => {
                  const dayLabels = mem.schedule_slots.length > 0
                    ? mem.schedule_slots.slice().sort((a,b)=>(a.day===0?7:a.day)-(b.day===0?7:b.day)||a.start_hour-b.start_hour).map(s => {
                        const cl = (membershipClosures[mem.groupId]||[]).find(c => c.day_of_week===s.day && c.start_hour===s.start_hour);
                        const min = s.start_minute ?? cl?.start_minute ?? 0;
                        return `${DAY_LABELS[s.day]} ${String(s.start_hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
                      }).join(', ')
                    : mem.schedule_days.length > 0 ? mem.schedule_days.map(d => DAY_LABELS[d]).join(', ') : 'Tüm seanslar';
                  return (
                    <div key={mem.id}
                      onClick={() => openEditMem(mem)}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
                      <span className="material-icons" style={{fontSize:14, color:'#0D9488'}}>groups</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600 }}>{mem.groupName}</div>
                        <div style={{ fontSize:11, color:'var(--text-2)' }}>
                          {dayLabels}{mem.custom_fee != null ? `  ·  ₺${mem.custom_fee}` : ''}
                        </div>
                      </div>
                      <span className="material-icons" style={{fontSize:15, color:'var(--text-2)'}}>edit</span>
                    </div>
                  );
                })}
                <button onClick={openAddGroup}
                  style={{ display:'flex', alignItems:'center', gap:5, marginTop:10, padding:'7px 14px', borderRadius:8, border:'1px solid #003399', background:'#00339912', color:'#003399', cursor:'pointer', fontWeight:600, fontSize:12 }}>
                  <span className="material-icons" style={{fontSize:15}}>group_add</span>
                  Gruba Ekle
                </button>
              </div>
            )}

            {/* PROGRAM block — all memberships */}
            {scheduleSections.length > 0 && (
              <div style={{ minWidth:200, flex:1 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:'0.05em' }}>PROGRAM</div>
                {scheduleSections.map(({ mem, days }, si) => (
                  <div key={mem.id} style={{ marginBottom: si < scheduleSections.length-1 ? 12 : 0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#0D9488', marginBottom:4, letterSpacing:'0.03em' }}>{mem.groupName}</div>
                    {days.map((s, i) => (
                      <div key={s.day_of_week} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom: i < days.length-1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width:3, alignSelf:'stretch', borderRadius:2, background:'#8B5CF6', flexShrink:0 }} />
                        <div>
                          <div style={{ fontSize:13, fontWeight:600 }}>
                            {DAY_NAMES[s.day_of_week]}  ·  {fmtH(s.start_hour, s.start_minute)}–{fmtH(s.end_hour, s.end_minute)}
                          </div>
                          {(s.courtNums.length > 0 || s.coachNames.length > 0) && (
                            <div style={{ fontSize:11, color:'var(--text-2)', marginTop:1 }}>
                              {[s.courtNums.length > 0 && `Kort ${s.courtNums.join(', ')}`, ...s.coachNames].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Attendance block */}
            {attendance.length > 0 && (
              <div style={{ minWidth:200, flex:1 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:8, letterSpacing:'0.05em' }}>DEVAM</div>
                {attendance.map(m => {
                  const pct = m.total > 0 ? Math.round((m.present/m.total)*100) : 0;
                  const barColor = pct >= 75 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444';
                  return (
                    <div key={m.key} style={{ marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                        <span style={{ fontWeight:600 }}>{m.label}</span>
                        <span style={{ color:barColor, fontWeight:700 }}>{m.present}/{m.total} antrenman</span>
                      </div>
                      <div style={{ height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:barColor, borderRadius:3, transition:'width 0.4s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes section */}
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:10, letterSpacing:'0.05em' }}>NOTLAR</div>

          {/* Tab pills */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
            {NOTE_TABS.map(tab => {
              const active = tab.type === activeTab;
              const count  = notes.filter(n => n.note_type === tab.type).length;
              return (
                <button key={tab.type}
                  onClick={() => setActiveTab(tab.type)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:20, border:'1px solid', cursor:'pointer', fontWeight:600, fontSize:12, transition:'all 0.15s',
                    borderColor: active ? tab.color : 'var(--border)',
                    background:  active ? tab.color : 'var(--surface)',
                    color:       active ? '#fff'    : 'var(--text-2)' }}>
                  <span className="material-icons" style={{fontSize:13}}>{tab.icon}</span>
                  {tab.label}
                  {count > 0 && (
                    <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10,
                      background: active ? 'rgba(255,255,255,0.25)' : tab.color+'22',
                      color:      active ? '#fff' : tab.color }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Add note button */}
          <button onClick={openNewNote}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:13, marginBottom:14,
              background: activeTabMeta.color, color:'#fff' }}>
            <span className="material-icons" style={{fontSize:16}}>add</span>
            {activeTabMeta.label} Notu Ekle
          </button>

          {/* Notes list */}
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-2)', fontSize:13 }}>
              Henüz {activeTabMeta.label.toLowerCase()} notu yok
            </div>
          ) : (
            filteredNotes.map(note => (
              <div key={note.id} style={{ background:'var(--surface)', borderRadius:10, padding:'12px 14px', marginBottom:10, borderLeft:`3px solid ${activeTabMeta.color}` }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
                  <div>
                    {note.title && <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{note.title}</div>}
                    <div style={{ fontSize:11, color:'var(--text-2)' }}>{formatDate(note.session_date || note.created_at)}</div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button onClick={() => openEditNote(note)}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:activeTabMeta.color, display:'flex', alignItems:'center' }}>
                      <span className="material-icons" style={{fontSize:16}}>edit</span>
                    </button>
                    <button onClick={() => deleteNote(note)}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#EF4444', display:'flex', alignItems:'center' }}>
                      <span className="material-icons" style={{fontSize:16}}>delete_outline</span>
                    </button>
                  </div>
                </div>
                <div style={{ fontSize:13, color:'var(--text-1)', lineHeight:1.6 }}>{note.content}</div>
              </div>
            ))
          )}
        </>
      )}

      {/* Edit membership modal */}
      {editMemModal && editingMem && (
        <Modal title={editingMem.groupName} onClose={() => setEditMemModal(false)}
          footer={<><button className="btn btn-ghost btn-sm" onClick={() => setEditMemModal(false)}>Vazgeç</button><button className="btn btn-pri btn-sm" onClick={saveEditMem} disabled={savingMem}>{savingMem ? 'Kaydediliyor…' : 'Kaydet'}</button></>}>
          <div className="fields" style={{ gap:12 }}>
            <Field label="ÖZEL ÜCRET (₺)">
              <input type="number" placeholder="Varsayılan ücret" value={editMemForm.custom_fee}
                onChange={e => setEditMemForm(p=>({...p, custom_fee:e.target.value}))} />
            </Field>
            {editMemForm.groupSlots.length > 0 && (
              <Field label="SEANSLAR">
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {editMemForm.groupSlots.map((slot, si) => {
                    const sel = (editMemForm.schedule_slots||[]).some(s => s.day===slot.day && s.start_hour===slot.start_hour);
                    const lbl = `${DAY_LABELS[slot.day]} ${String(slot.start_hour).padStart(2,'0')}:00`;
                    return (
                      <button key={si} type="button"
                        onClick={() => setEditMemForm(p => {
                          const cur = p.schedule_slots||[];
                          return { ...p, schedule_slots: sel ? cur.filter(s=>!(s.day===slot.day&&s.start_hour===slot.start_hour)) : [...cur, slot] };
                        })}
                        style={{ padding:'4px 12px', borderRadius:8, border:'1px solid', cursor:'pointer', fontSize:12, fontWeight:600,
                          borderColor: sel ? '#0D9488' : 'var(--border)',
                          background:  sel ? '#0D9488' : 'var(--surface)',
                          color:       sel ? '#fff'   : 'var(--text-2)' }}>
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}
          </div>
        </Modal>
      )}

      {/* Add to group modal */}
      {addGroupModal && (
        <Modal title="Gruba Ekle" onClose={() => setAddGroupModal(false)}
          footer={<>
            <button className="btn btn-ghost btn-sm" onClick={() => setAddGroupModal(false)}>Vazgeç</button>
            <button className="btn btn-pri btn-sm" onClick={doAddToGroup} disabled={savingAdd || !addForm.groupId}
              style={{ background: conflictWarnings.length > 0 ? '#F59E0B' : undefined }}>
              {savingAdd ? 'Ekleniyor…' : conflictWarnings.length > 0 ? 'Yine de Ekle' : 'Ekle'}
            </button>
          </>}>
          <div className="fields" style={{ gap:12 }}>
            <Field label="GRUP SEÇ">
              {availableGroups.length === 0
                ? <span style={{ fontSize:13, color:'var(--text-2)' }}>Eklenebilecek başka grup yok.</span>
                : (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {availableGroups.map(g => {
                      const sel = addForm.groupId === g.id;
                      return (
                        <button key={g.id} type="button" onClick={() => selectGroup(g)}
                          style={{ padding:'4px 12px', borderRadius:8, border:'1px solid', cursor:'pointer', fontSize:12, fontWeight:600,
                            borderColor: sel ? '#003399' : 'var(--border)',
                            background:  sel ? '#003399' : 'var(--surface)',
                            color:       sel ? '#fff'   : 'var(--text-2)' }}>
                          {g.name}
                        </button>
                      );
                    })}
                  </div>
                )}
            </Field>
            {addForm.groupId && (
              <>
                {conflictWarnings.length > 0 && (
                  <div style={{ background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, fontWeight:700, fontSize:12, color:'#92400E', marginBottom:4 }}>
                      <span className="material-icons" style={{fontSize:14}}>warning</span>
                      Program Çakışması
                    </div>
                    {conflictWarnings.map((w,i) => (
                      <div key={i} style={{ fontSize:12, color:'#78350F', lineHeight:1.6 }}>• {w}</div>
                    ))}
                  </div>
                )}
                <Field label="ÖZEL ÜCRET (₺)">
                  <input type="number" placeholder="Varsayılan ücret" value={addForm.custom_fee}
                    onChange={e => setAddForm(p=>({...p, custom_fee:e.target.value}))} />
                </Field>
                {addForm.groupSlots.length > 0 && (
                  <Field label="SEANSLAR">
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {addForm.groupSlots.map((slot, si) => {
                        const sel = addForm.schedule_slots.some(s => s.day===slot.day && s.start_hour===slot.start_hour);
                        const lbl = `${DAY_LABELS[slot.day]} ${String(slot.start_hour).padStart(2,'0')}:00`;
                        return (
                          <button key={si} type="button" onClick={() => toggleAddSlot(slot)}
                            style={{ padding:'4px 12px', borderRadius:8, border:'1px solid', cursor:'pointer', fontSize:12, fontWeight:600,
                              borderColor: sel ? '#003399' : 'var(--border)',
                              background:  sel ? '#003399' : 'var(--surface)',
                              color:       sel ? '#fff'   : 'var(--text-2)' }}>
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                )}
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Note add/edit modal */}
      {noteModal && (
        <Modal title={editingNote ? 'Notu Düzenle' : `${activeTabMeta.label} Notu`} onClose={() => setNoteModal(false)}
          footer={<><button className="btn btn-ghost btn-sm" onClick={() => setNoteModal(false)}>Vazgeç</button><button className="btn btn-pri btn-sm" onClick={saveNote} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button></>}>
          <div className="fields" style={{ gap:12 }}>
            <Field label="NOT TÜRÜ">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {NOTE_TABS.map(tab => {
                  const sel = tab.type === noteForm.note_type;
                  return (
                    <button key={tab.type} type="button" onClick={() => setNoteForm(p=>({...p, note_type:tab.type}))}
                      style={{ padding:'4px 12px', borderRadius:8, border:'1px solid', cursor:'pointer', fontSize:12, fontWeight:600,
                        borderColor: sel ? tab.color : 'var(--border)',
                        background:  sel ? tab.color : 'var(--surface)',
                        color:       sel ? '#fff'   : 'var(--text-2)' }}>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="TARİH">
              <input type="date" value={noteForm.session_date} onChange={e => setNoteForm(p=>({...p, session_date:e.target.value}))} />
            </Field>
            <Field label="BAŞLIK (opsiyonel)">
              <input placeholder="Not başlığı..." value={noteForm.title} onChange={e => setNoteForm(p=>({...p, title:e.target.value}))} />
            </Field>
            <Field label="NOT *">
              <textarea rows={5} placeholder="Notunuzu yazın..." value={noteForm.content}
                onChange={e => setNoteForm(p=>({...p, content:e.target.value}))}
                style={{ width:'100%', resize:'vertical', padding:'8px 10px', borderRadius:8, border:'1px solid var(--border)', fontSize:13, fontFamily:'inherit' }} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GRUP OYUNCULARI
// ═══════════════════════════════════════════════════════════════
function GroupPlayersScreen({ clubId }) {
  const { useState, useEffect, useCallback, useRef } = React;
  const PAGE_SIZE = 5;
  const DAY_LABELS = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

  const [groups,         setGroups]         = useState([]);
  const [totalGroups,    setTotalGroups]    = useState(0);
  const [page,           setPage]           = useState(0);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [loading,        setLoading]        = useState(true);
  const [selectedMember, setSelectedMember] = useState(null); // { ...member, groupId, groupName }

  const isFirst = useRef(true);

  const fetchGroups = useCallback(async (p, search) => {
    if (!clubId) return;
    try {
      let matchingGroupIds = [];
      if (search.trim()) {
        const { data: memberRows } = await sb
          .from('club_group_members')
          .select('group_id')
          .ilike('member_name', `%${search.trim()}%`);
        matchingGroupIds = [...new Set((memberRows || []).map(r => r.group_id))];
      }

      let query = sb
        .from('club_groups')
        .select('id, name, members:club_group_members(id, member_name, contact_number, contact_person, schedule_days, schedule_slots), closures:court_closures(day_of_week, start_hour, start_minute)', { count: 'exact' })
        .eq('club_id', clubId)
        .eq('is_active', true)
        .order('name')
        .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        let orFilter = `name.ilike.%${search.trim()}%`;
        if (matchingGroupIds.length > 0) orFilter += `,id.in.(${matchingGroupIds.join(',')})`;
        query = query.or(orFilter);
      }

      const { data, count } = await query;
      setGroups((data || []).filter(g => (g.members || []).length > 0));
      setTotalGroups(count ?? 0);
    } catch (e) {
      console.error('GroupPlayersScreen fetchGroups error:', e);
    }
  }, [clubId]);

  useEffect(() => {
    setLoading(true);
    fetchGroups(0, '').finally(() => setLoading(false));
  }, [fetchGroups]);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    setPage(0);
    fetchGroups(0, searchQuery);
  }, [searchQuery]);

  const avatarColor = (name) => {
    const COLORS = ['#003399','#0D9488','#22C55E','#8B5CF6','#EC4899','#F59E0B','#EF4444'];
    return COLORS[(name || '').charCodeAt(0) % COLORS.length];
  };
  const inits = (name) => (name || '').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();

  // Show member profile sub-screen
  if (selectedMember) {
    return <MemberProfileView member={selectedMember} clubId={clubId} onBack={() => setSelectedMember(null)} />;
  }

  const totalPlayers = groups.reduce((s, g) => s + (g.members || []).length, 0);

  if (loading) return <Spinner />;

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Grup Oyuncuları</h1>
          <div className="sub">{totalPlayers > 0 ? `${totalPlayers} oyuncu` : 'Aktif gruplardaki tüm üyeler'}</div>
        </div>
      </div>

      <div style={{ position:'relative', marginBottom:14 }}>
        <span className="material-icons" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-2)', fontSize:18 }}>search</span>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Oyuncu veya grup ara…"
          style={{ paddingLeft:36, paddingRight: searchQuery ? 32 : 10 }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}
            style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-2)', display:'flex', alignItems:'center', padding:0 }}>
            <span className="material-icons" style={{ fontSize:16 }}>close</span>
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={searchQuery ? 'search_off' : 'groups'}
          title={searchQuery ? 'Sonuç bulunamadı' : 'Henüz grup oyuncusu yok'}
          subtitle={searchQuery ? `"${searchQuery}" ile eşleşen oyuncu veya grup bulunamadı` : 'Aktif gruplara üye eklendikçe burada görünür.'} />
      ) : (
        <>
          {groups.map(group => (
            <div key={group.id} className="card tight" style={{ marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'#0D94880a', borderRadius:'10px 10px 0 0' }}>
                <span className="material-icons" style={{ fontSize:15, color:'#0D9488' }}>groups</span>
                <span style={{ flex:1, fontSize:13, fontWeight:700, color:'var(--text-1)' }}>{group.name}</span>
                <span style={{ fontSize:11, fontWeight:600, color:'#0D9488', background:'#0D948820', padding:'2px 8px', borderRadius:999 }}>
                  {(group.members||[]).length} oyuncu
                </span>
              </div>
              {(group.members||[]).map((member, idx) => {
                const color = avatarColor(member.member_name || '');
                const slots = (member.schedule_slots || []).slice().sort((a,b)=>(a.day===0?7:a.day)-(b.day===0?7:b.day)||a.start_hour-b.start_hour);
                const days  = slots.length === 0 ? (member.schedule_days || []).filter(d=>typeof d==='number'&&d>=0&&d<=6).slice().sort((a,b)=>(a===0?7:a)-(b===0?7:b)) : [];
                return (
                  <div key={member.id}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderBottom: idx < group.members.length-1 ? '1px solid var(--border)' : 'none', cursor:'pointer', transition:'background 0.15s' }}
                    onClick={() => setSelectedMember({ ...member, groupId: group.id, groupName: group.name })}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background=''}
                  >
                    <div style={{ width:38, height:38, borderRadius:19, background:color+'22', display:'grid', placeItems:'center', flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:800, color }}>{inits(member.member_name)}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{member.member_name}</div>
                      {(member.contact_number || member.contact_person) && (
                        <div style={{ fontSize:11, color:'var(--text-2)', marginTop:1 }}>
                          {[member.contact_number, member.contact_person].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      {(slots.length > 0 || days.length > 0) && (
                        <div style={{ fontSize:11, color:'#0D9488', fontWeight:600, marginTop:1 }}>
                          {slots.length > 0
                            ? slots.map(s => {
                                const cl = (group.closures||[]).find(c => c.day_of_week===s.day && c.start_hour===s.start_hour);
                                const min = s.start_minute ?? cl?.start_minute ?? 0;
                                return `${DAY_LABELS[s.day]} ${String(s.start_hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
                              }).join(' · ')
                            : days.map(d => DAY_LABELS[d]).join(' · ')}
                        </div>
                      )}
                    </div>
                    <span className="material-icons" style={{ fontSize:18, color:'var(--text-2)' }}>chevron_right</span>
                  </div>
                );
              })}
            </div>
          ))}

          {totalGroups > PAGE_SIZE && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8, paddingTop:8 }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 0}
                onClick={() => { const n = page-1; setPage(n); fetchGroups(n, searchQuery); }}>
                <span className="material-icons" style={{fontSize:16}}>chevron_left</span> Önceki
              </button>
              <span style={{ fontSize:12, color:'var(--text-2)' }}>
                {page*PAGE_SIZE+1}–{Math.min((page+1)*PAGE_SIZE, totalGroups)} / {totalGroups} grup
              </span>
              <button className="btn btn-ghost btn-sm" disabled={(page+1)*PAGE_SIZE >= totalGroups}
                onClick={() => { const n = page+1; setPage(n); fetchGroups(n, searchQuery); }}>
                Sonraki <span className="material-icons" style={{fontSize:16}}>chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

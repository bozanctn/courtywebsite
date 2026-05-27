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

  // Ham veri — sorgu yok, useMemo'da filtre var
  const [allBookings,       setAllBookings]       = useState([]);
  const [allLessons,        setAllLessons]        = useState([]);
  const [allManualLessons,  setAllManualLessons]  = useState([]);
  const [allClosureEvents,  setAllClosureEvents]  = useState([]);
  const [coachMap,          setCoachMap]          = useState(new Map());

  const SLOT_H  = 64;
  const START_H = 6;
  const END_H   = 23;

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

  const load = async () => {
    setLoading(true);
    try {
      // 1. Kortlar ve koçlar
      const [courtRes, coachRes] = await Promise.all([
        sb.from('courts').select('id,court_number,court_type').eq('club_id', clubId).eq('is_active', true).order('court_number'),
        sb.from('club_coaches').select('id,full_name').eq('club_id', clubId),
      ]);
      const courts_ = courtRes.data || [];
      const coachMap_ = new Map((coachRes.data || []).map(c => [c.id, c.full_name]));
      setCourts(courts_);
      setCoachMap(coachMap_);
      const courtIds = courts_.map(c => c.id);
      if (courtIds.length === 0) { setLoading(false); return; }

      // 2. Tüm veriler paralel — tarih filtresi YOK, FK join YOK (FK adı hatalarını önler)
      const [bkRes, lessonRes, manualRes, closureRes] = await Promise.all([
        sb.from('bookings')
          .select('id,start_time,end_time,status,court_id')
          .in('court_id', courtIds)
          .neq('status', 'cancelled'),

        sb.from('lessons')
          .select('id,start_time,end_time,student_name,status,court_id,club_coach_id')
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

      setAllBookings(bkRes.data || []);
      setAllLessons(lessonRes.data || []);
      setAllManualLessons(manualRes.data || []);
      setAllClosureEvents(closureEvents);
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
    // dbTimeToLocal ile tüm ekranlarla tutarlı çeviri yapılır.
    const extractDateTime = (isoOrStr) => {
      if (!isoOrStr) return [null, null];
      const local = dbTimeToLocal(isoOrStr);
      if (!local) return [null, null];
      return [local.slice(0, 10), local.slice(11, 16)];
    };

    // Rezervasyonlar
    allBookings.forEach(b => {
      const [dateStr, startHM] = extractDateTime(b.start_time);
      const [, endHM]          = extractDateTime(b.end_time);
      if (dateStr !== selDate) return;
      const [sh, sm] = parseHM(startHM);
      const [eh, em] = parseHM(endHM);
      const courtNum = courts.find(c => c.id === b.court_id)?.court_number;
      all.push({ id: b.id, type: 'booking', courtId: b.court_id, courtNum,
        label: 'Rezervasyon', sh, sm, eh, em, color: '#22C55E' });
    });

    // Koç dersleri
    allLessons.forEach(l => {
      const [dateStr, startHM] = extractDateTime(l.start_time);
      const [, endHM]          = extractDateTime(l.end_time);
      if (dateStr !== selDate) return;
      const [sh, sm] = parseHM(startHM);
      const [eh, em] = parseHM(endHM);
      const coachName = (l.club_coach_id && coachMap.get(l.club_coach_id)) || 'Antrenör';
      const courtNum  = courts.find(c => c.id === l.court_id)?.court_number;
      all.push({ id: 'ls_' + l.id, type: 'lesson', courtId: l.court_id, courtNum,
        label: `${l.student_name || 'Öğrenci'} · ${coachName}`, sh, sm, eh, em, color: '#8B5CF6' });
    });

    // Manuel dersler — `date` alanı YYYY-MM-DD, start_time/end_time HH:MM
    allManualLessons.forEach(m => {
      if (m.date !== selDate) return;
      const [sh, sm] = parseHM(m.start_time);
      const [eh, em] = parseHM(m.end_time);
      const coachName = m.club_coaches?.full_name || m.coach_name || 'Antrenör';
      const courtNum  = courts.find(c => c.id === m.court_id)?.court_number;
      all.push({ id: 'ml_' + m.id, type: 'lesson', courtId: m.court_id, courtNum,
        label: `${m.student_name || 'Öğrenci'} · ${coachName}`, sh, sm, eh, em, color: '#8B5CF6' });
    });

    // Kapatmalar
    allClosureEvents.forEach(cl => {
      if (cl._date !== selDate) return;
      const coachName = cl.coach?.full_name;
      const groupName = cl.group?.name;
      const label     = [cl.reason || 'Kapalı', groupName, coachName].filter(Boolean).join(' · ');
      all.push({ id: 'cl_' + cl.id + '_' + cl._date, type: 'block', courtId: cl.court_id,
        courtNum: courts.find(c => c.id === cl.court_id)?.court_number,
        label, sh: cl.start_hour ?? 8, sm: 0, eh: cl.end_hour ?? 9, em: 0, color: '#F97316' });
    });

    return all;
  }, [selDate, allBookings, allLessons, allManualLessons, allClosureEvents, courts, coachMap]);

  const displayCourts = useMemo(() =>
    selCourtId ? courts.filter(c => c.id === selCourtId) : courts,
    [courts, selCourtId]);

  const occupiedCourtIds = useMemo(() =>
    new Set(dayEvents.map(e => e.courtId).filter(Boolean)), [dayEvents]);

  const noCourtLessons = useMemo(() =>
    dayEvents.filter(e => !e.courtId && e.type === 'lesson'), [dayEvents]);

  const isSlotOccupied = (courtId, hour) =>
    dayEvents.some(e => e.courtId === courtId && e.sh <= hour && e.eh > hour);

  // Sürükleme state — courtIdx: displayCourts içindeki indeks
  const { useRef } = React;
  const dragStateRef = useRef(null);

  // Dikdörtgendeki tüm slotlar boş mu?
  const rectAllEmpty = (minCIdx, maxCIdx, minH, maxH, dcourts) => {
    for (let ci = minCIdx; ci <= maxCIdx; ci++) {
      const cId = dcourts[ci]?.id;
      if (!cId) return false;
      for (let h = minH; h <= maxH; h++) {
        if (isSlotOccupied(cId, h)) return false;
      }
    }
    return true;
  };

  const commitDrag = (ds, dcourts) => {
    if (!ds) return;
    const startHour  = Math.min(ds.startHour,   ds.currentHour);
    const endHour    = Math.max(ds.startHour,   ds.currentHour) + 1;
    const minCIdx    = Math.min(ds.startCIdx,   ds.currentCIdx);
    const maxCIdx    = Math.max(ds.startCIdx,   ds.currentCIdx);
    const courtIds   = (dcourts || []).slice(minCIdx, maxCIdx + 1).map(c => c.id);
    setDragState(null);
    dragStateRef.current = null;
    setSlotClickInfo({ courtIds, startHour, endHour });
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

  const handleMouseDown = (courtIdx, courtId, hour) => {
    if (isSlotOccupied(courtId, hour)) return;
    const ds = { startCIdx: courtIdx, currentCIdx: courtIdx, startHour: hour, currentHour: hour };
    dragStateRef.current = ds;
    setDragState(ds);
  };

  const handleMouseEnter = (courtIdx, courtId, hour) => {
    const cur = dragStateRef.current;
    if (!cur) return;
    const minCIdx = Math.min(cur.startCIdx, courtIdx);
    const maxCIdx = Math.max(cur.startCIdx, courtIdx);
    const minH    = Math.min(cur.startHour, hour);
    const maxH    = Math.max(cur.startHour, hour);
    if (!rectAllEmpty(minCIdx, maxCIdx, minH, maxH, displayCourtsRef.current)) return;
    const ds = { ...cur, currentCIdx: courtIdx, currentHour: hour };
    dragStateRef.current = ds;
    setDragState(ds);
  };

  const applySlotPrefill = async (type) => {
    const { courtIds, startHour, endHour } = slotClickInfo;
    const startStr = `${String(startHour).padStart(2,'0')}:00`;
    const endStr   = `${String(endHour).padStart(2,'0')}:00`;

    if (type === 'reservation' || type === 'lesson') {
      // Tek kort — çoklu seçimde ilk kortu kullan
      window.__slotPrefill = { type, court_id: courtIds[0], date: selDate, start_time: startStr, end_time: endStr };
      setSlotTypeModal(false);
      setSlotClickInfo(null);
      setScreen('reservations');
    } else {
      if (type === 'group' && closureGroups.length === 0) {
        const { data } = await sb.from('club_groups').select('id,name,coach_id').eq('club_id', clubId).eq('is_active', true);
        setClosureGroups(data || []);
      }
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
          const startISO = `${selDate}T${String(slotClickInfo.startHour).padStart(2,'0')}:00:00`;
          const endISO   = `${selDate}T${String(slotClickInfo.endHour).padStart(2,'0')}:00:00`;
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
            const sh = String(slotClickInfo.startHour).padStart(2,'0') + ':00';
            const eh = String(slotClickInfo.endHour).padStart(2,'0') + ':00';
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
        end_hour:     slotClickInfo.endHour,
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

  const EventBlock = ({ ev }) => {
    const startMins = ev.sh * 60 + ev.sm;
    const endMins   = ev.eh * 60 + ev.em;
    const top    = (startMins - START_H * 60) / 60 * SLOT_H + 36;
    const height = Math.max((endMins - startMins) / 60 * SLOT_H, 22);
    if (endMins <= START_H * 60 || startMins >= END_H * 60 || endMins <= startMins) return null;
    const timeStr = `${String(ev.sh).padStart(2,'0')}:${String(ev.sm).padStart(2,'0')}–${String(ev.eh).padStart(2,'0')}:${String(ev.em).padStart(2,'0')}`;
    return (
      <div style={{
        position:'absolute', top:top+'px', left:2, right:2, height:height+'px',
        background: ev.color + '25', borderLeft:`3px solid ${ev.color}`,
        borderRadius:'0 6px 6px 0', padding:'2px 6px', overflow:'hidden', zIndex:1,
      }}>
        <div style={{ fontSize:9, fontWeight:700, color:ev.color, lineHeight:1.4 }}>{timeStr}</div>
        {height >= 30 && (
          <div style={{ fontSize:10, fontWeight:600, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.label}</div>
        )}
      </div>
    );
  };

  const CourtColumn = ({ courtId, courtIdx, label }) => {
    const evs = courtId ? dayEvents.filter(e => e.courtId === courtId) : noCourtLessons;
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
        {Array.from({ length: END_H - START_H }, (_, i) => {
          const hour = START_H + i;
          const occupied = courtId ? isSlotOccupied(courtId, hour) : true;
          const inDrag = dragState && courtId != null &&
            courtIdx >= Math.min(dragState.startCIdx, dragState.currentCIdx) &&
            courtIdx <= Math.max(dragState.startCIdx, dragState.currentCIdx) &&
            hour >= Math.min(dragState.startHour, dragState.currentHour) &&
            hour <= Math.max(dragState.startHour, dragState.currentHour);
          return (
            <div key={i}
              onMouseDown={() => courtId != null && !occupied && handleMouseDown(courtIdx, courtId, hour)}
              onMouseEnter={() => courtId != null && handleMouseEnter(courtIdx, courtId, hour)}
              title={courtId != null && !occupied ? `${String(hour).padStart(2,'0')}:00 – sürükleyerek seç` : undefined}
              style={{
                height: SLOT_H,
                borderBottom: '1px solid var(--border,#f1f5f9)',
                cursor: courtId != null && !occupied ? 'crosshair' : 'default',
                background: inDrag ? '#EEF2FF' : '',
                outline: inDrag ? '2px solid #6366F1' : 'none',
                outlineOffset: '-2px',
                userSelect: 'none',
                transition: 'background 0.05s',
              }}
            />
          );
        })}
        {evs.map((ev, idx) => <EventBlock key={ev.id || idx} ev={ev} />)}
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
                <div key={i} style={{ height:SLOT_H, display:'flex', alignItems:'flex-start',
                  justifyContent:'flex-end', paddingRight:8, paddingTop:3, fontSize:11,
                  color:'var(--text-2)', fontWeight:500, borderBottom:'1px solid var(--border,#f1f5f9)' }}>
                  {String(START_H + i).padStart(2,'0')}:00
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
              {' · '}{String(slotClickInfo.startHour).padStart(2,'0')}:00 – {String(slotClickInfo.endHour).padStart(2,'0')}:00
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

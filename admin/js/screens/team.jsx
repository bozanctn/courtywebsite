// ── Koçlar & Dersler ────────────────────────────────────────────

const SPECIALIZATIONS = [
  'Başlangıç', 'Orta Seviye', 'İleri Seviye', 'Çocuk Antrenörü',
  'Yetişkin Antrenörü', 'Turnuva Hazırlığı', 'Fitness & Kondisyon', 'Taktik & Strateji',
];

// ═══════════════════════════════════════════════════════════════
// KOÇLAR
// ═══════════════════════════════════════════════════════════════
function CoachesScreen({ clubId }) {
  const { useState, useEffect, useMemo } = React;
  const [coaches,         setCoaches]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [modal,           setModal]           = useState(null); // null | 'add' | 'edit' | 'schedule'
  const [form,            setForm]            = useState({});
  const [saving,          setSaving]          = useState(false);
  const [showInactive,    setShowInactive]    = useState(false);

  // Invite modal
  const [inviteQuery,    setInviteQuery]    = useState('');
  const [inviteResults,  setInviteResults]  = useState([]);
  const [inviteSearched, setInviteSearched] = useState(false);
  const [inviteLoading,  setInviteLoading]  = useState(false);
  const [inviteSending,  setInviteSending]  = useState(null);
  const [inviteMap,      setInviteMap]      = useState({});

  // Schedule modal
  const [scheduleCoach,   setScheduleCoach]   = useState(null);
  const [weekOffset,      setWeekOffset]      = useState(0);
  const [weekLessons,     setWeekLessons]     = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  useEffect(() => { if (clubId) { loadCoaches(); loadInvitations(); } }, [clubId]);

  const loadCoaches = async () => {
    setLoading(true);
    const { data } = await sb.from('club_coaches').select('*').eq('club_id', clubId).order('created_at', { ascending: false });
    setCoaches(data || []);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const total   = coaches.length;
    const active  = coaches.filter(c => c.is_active).length;
    const avgRate = total > 0 ? Math.round(coaches.reduce((s, c) => s + (c.hourly_rate || 0), 0) / total) : 0;
    return { total, active, avgRate };
  }, [coaches]);

  const filtered = coaches.filter(c => showInactive || c.is_active);

  const openAdd = () => {
    setForm({ is_active: true, full_name: '', email: '', phone: '', hourly_rate: '', experience_years: '', specialization: '', bio: '' });
    setModal('add');
  };

  const openEdit = (coach) => {
    setForm({ ...coach, hourly_rate: String(coach.hourly_rate || ''), experience_years: String(coach.experience_years || '') });
    setModal('edit');
  };

  const save = async () => {
    if (!form.full_name?.trim()) { alert('Hoca adı gereklidir.'); return; }
    if (!form.email?.trim())     { alert('E-posta adresi gereklidir.'); return; }
    if (!form.hourly_rate)       { alert('Saatlik ücret gereklidir.'); return; }
    setSaving(true);
    try {
      const email = form.email.trim();

      // Duplicate email check (same as mobile ClubCoachService)
      if (modal === 'add') {
        const { data: existing, error: checkErr } = await sb.from('club_coaches')
          .select('id').eq('club_id', clubId).eq('email', email).maybeSingle();
        if (checkErr) throw checkErr;
        if (existing) throw new Error('Bu email adresi ile zaten bir hoca mevcut');
      } else {
        const { data: existing, error: checkErr } = await sb.from('club_coaches')
          .select('id').eq('club_id', clubId).eq('email', email).neq('id', form.id).maybeSingle();
        if (checkErr) throw checkErr;
        if (existing) throw new Error('Bu email adresi ile zaten bir hoca mevcut');
      }

      const payload = {
        club_id:          clubId,
        full_name:        form.full_name.trim(),
        email:            email,
        phone:            form.phone?.trim() || null,
        hourly_rate:      Number(form.hourly_rate),
        experience_years: Number(form.experience_years) || 0,
        specialization:   form.specialization || null,
        bio:              form.bio?.trim() || null,
        is_active:        form.is_active !== false,
      };
      if (modal === 'add') {
        const { error } = await sb.from('club_coaches').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await sb.from('club_coaches').update(payload).eq('id', form.id);
        if (error) throw error;
      }
      setModal(null);
      loadCoaches();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (coach) => {
    if (!confirm(`${coach.full_name} adlı hocayı silmek istediğinize emin misiniz?`)) return;
    const { error } = await sb.from('club_coaches').delete().eq('id', coach.id);
    if (error) { alert(error.message); return; }
    loadCoaches();
  };

  const toggleStatus = async (coach) => {
    const { error } = await sb.from('club_coaches').update({ is_active: !coach.is_active }).eq('id', coach.id);
    if (error) { alert(error.message); return; }
    loadCoaches();
  };

  const loadInvitations = async () => {
    const { data } = await sb.from('coach_invitations').select('coach_id,status').eq('club_id', clubId);
    const map = {};
    (data || []).forEach(inv => {
      if (inv.status === 'pending' || inv.status === 'accepted') map[inv.coach_id] = inv.status;
    });
    setInviteMap(map);
  };

  const closeInviteModal = () => {
    setModal(null);
    setInviteQuery('');
    setInviteResults([]);
    setInviteSearched(false);
  };

  const handleInviteSearch = async () => {
    const q = inviteQuery.trim();
    if (q.length < 3) { alert('Arama yapmak için en az 3 karakter giriniz.'); return; }
    setInviteLoading(true);
    setInviteSearched(true);
    try {
      const { data, error } = await sb.from('profiles')
        .select('id,full_name,email')
        .eq('user_type', 'coach')
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(20);
      if (error) throw error;
      const { data: clubCoachProfiles } = await sb.from('coach_profiles').select('id').eq('coach_type', 'club');
      const clubCoachIds = new Set((clubCoachProfiles || []).map(c => c.id));
      setInviteResults((data || []).filter(c => !clubCoachIds.has(c.id)));
    } catch (e) { alert(e.message); }
    finally { setInviteLoading(false); }
  };

  const handleSendInvite = async (user) => {
    setInviteSending(user.id);
    try {
      const { data: existing, error: checkErr } = await sb.from('coach_invitations')
        .select('id').eq('club_id', clubId).eq('coach_id', user.id).maybeSingle();
      if (checkErr) throw checkErr;
      if (existing) throw new Error('Bu hocaya zaten davet gönderilmiş');
      const { error } = await sb.from('coach_invitations').insert({ club_id: clubId, coach_id: user.id });
      if (error) throw error;
      setInviteMap(prev => ({ ...prev, [user.id]: 'pending' }));
    } catch (e) { alert(e.message); }
    finally { setInviteSending(null); }
  };

  // ── Schedule helpers ──────────────────────────────────────
  const getWeekBounds = (offset) => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  };

  const getWeekDays = (offset) => {
    const { monday } = getWeekBounds(offset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const fmtWeekDate = (d) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const isSameDay   = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const fetchSchedule = async (coach, offset) => {
    setScheduleLoading(true);
    try {
      const { monday, sunday } = getWeekBounds(offset);
      const start     = monday.toISOString();
      const end       = sunday.toISOString();
      const startDate = monday.toISOString().slice(0, 10);
      const endDate   = sunday.toISOString().slice(0, 10);

      const [lessonsRes, manualRes, groupRes] = await Promise.all([
        sb.from('lessons')
          .select('id, start_time, end_time, student_name, location, notes, payment_status, amount')
          .eq('club_coach_id', coach.id)
          .gte('start_time', start)
          .lte('start_time', end),
        sb.from('club_manual_lessons')
          .select('id, date, start_time, end_time, student_name, location, notes, payment_status, amount')
          .eq('coach_id', coach.id)
          .gte('date', startDate)
          .lte('date', endDate),
        sb.from('court_closures')
          .select('id, start_hour, end_hour, start_date, end_date, day_of_week, closure_type, reason, club_groups(name)')
          .eq('coach_id', coach.id)
          .eq('is_active', true),
      ]);

      const days       = getWeekDays(offset);
      const dowToIdx   = (dow) => (dow === 0 ? 6 : dow - 1);
      const groupItems = [];

      for (const g of (groupRes.data || [])) {
        const groupName = g.club_groups?.name || g.reason || 'Grup Dersi';
        if (g.closure_type === 'recurring_weekly') {
          const idx = dowToIdx(g.day_of_week);
          const d = new Date(days[idx]); d.setHours(g.start_hour, 0, 0, 0);
          groupItems.push({
            id: g.id,
            _date:         days[idx].toISOString().split('T')[0],
            _displayStart: `${String(g.start_hour).padStart(2, '0')}:00`,
            _displayEnd:   `${String(g.end_hour).padStart(2, '0')}:00`,
            _sortMs:       d.getTime(),
            student_name:  groupName,
            location:      null, notes: null, amount: null,
            payment_status: null,
            source:        'group',
          });
        } else if (g.closure_type === 'one_time' && g.start_date >= startDate && g.start_date <= endDate) {
          const d = new Date(g.start_date + 'T00:00:00'); d.setHours(g.start_hour, 0, 0, 0);
          groupItems.push({
            id: g.id,
            _date:         g.start_date,
            _displayStart: `${String(g.start_hour).padStart(2, '0')}:00`,
            _displayEnd:   `${String(g.end_hour).padStart(2, '0')}:00`,
            _sortMs:       d.getTime(),
            student_name:  groupName,
            location:      null, notes: null, amount: null,
            payment_status: null,
            source:        'group',
          });
        }
      }

      const lessonItems = (lessonsRes.data || []).map(l => ({
        ...l,
        _date:         new Date(l.start_time).toISOString().split('T')[0],
        _displayStart: new Date(l.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        _displayEnd:   new Date(l.end_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        _sortMs:       new Date(l.start_time).getTime(),
        source:        'lesson',
      }));

      const manualItems = (manualRes.data || []).map(m => ({
        ...m,
        _date:         m.date,
        _displayStart: (m.start_time || '').slice(0, 5),
        _displayEnd:   (m.end_time || '').slice(0, 5),
        _sortMs:       new Date(m.date + 'T' + m.start_time).getTime(),
        source:        'manual',
      }));

      const all = [...lessonItems, ...manualItems, ...groupItems].sort((a, b) => a._sortMs - b._sortMs);
      setWeekLessons(all);
    } catch (e) { console.error(e); }
    finally { setScheduleLoading(false); }
  };

  const openSchedule = (coach) => {
    setScheduleCoach(coach);
    setWeekOffset(0);
    setWeekLessons([]);
    setModal('schedule');
    fetchSchedule(coach, 0);
  };

  const changeWeek = (delta) => {
    const next = weekOffset + delta;
    setWeekOffset(next);
    fetchSchedule(scheduleCoach, next);
  };

  const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Koçlar</h1>
          <div className="sub">{coaches.length} koç kayıtlı</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost" onClick={() => { setInviteQuery(''); setInviteResults([]); setInviteSearched(false); setModal('invite'); }}>
            <span className="material-icons">send</span> Hoca Davet Et
          </button>
          <button className="btn btn-pri" onClick={openAdd}>
            <span className="material-icons">add</span> Manuel Ekle
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats">
        <StatCard icon="people"   n={stats.total}  label="Toplam Koç" />
        <StatCard icon="check_circle" n={stats.active} label="Aktif Koç" tint="green" />
        <StatCard icon="payments" n={stats.avgRate > 0 ? `${fmtMoney(stats.avgRate)}/saat` : '—'} label="Ortalama Ücret" tint="navy" />
      </div>

      {/* Filter toggle */}
      <div style={{ marginBottom: 14 }}>
        <Switch on={showInactive} onChange={setShowInactive} label="Pasif koçları göster" />
      </div>

      {/* Cards */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="person" title="Koç bulunamadı" sub="İlk koçunuzu ekleyin." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
          {filtered.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Av name={c.full_name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{c.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.email}</div>
                  {c.phone && <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.phone}</div>}
                </div>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 20, backgroundColor: c.is_active ? '#DCFCE7' : '#FEF3C7', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: c.is_active ? '#22C55E' : '#F59E0B', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={() => toggleStatus(c)}
                  title="Durumu değiştirmek için tıklayın"
                >
                  <span className="material-icons" style={{ fontSize: 13 }}>{c.is_active ? 'check_circle' : 'pause_circle'}</span>
                  {c.is_active ? 'Aktif' : 'Pasif'}
                </button>
              </div>

              {/* Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {c.experience_years > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 9px' }}>
                    <span className="material-icons" style={{ fontSize: 13 }}>schedule</span> {c.experience_years} yıl
                  </span>
                )}
                {c.hourly_rate > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 9px' }}>
                    <span className="material-icons" style={{ fontSize: 13 }}>payments</span> {fmtMoney(c.hourly_rate)}/saat
                  </span>
                )}
                {c.specialization && (
                  <span style={{ fontSize: 12, color: 'var(--brand-navy)', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: '4px 9px', fontWeight: 600 }}>
                    {c.specialization}
                  </span>
                )}
              </div>

              {c.bio && <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>{c.bio}</p>}

              <div style={{ height: 1, background: 'var(--border)' }} />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, color: '#22C55E' }} onClick={() => openSchedule(c)}>
                  <span className="material-icons" style={{ fontSize: 15 }}>calendar_today</span> Program
                </button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(c)}>
                  <span className="material-icons" style={{ fontSize: 15 }}>edit</span> Düzenle
                </button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(c)}>
                  <span className="material-icons" style={{ fontSize: 15 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Invite Modal ── */}
      {modal === 'invite' && (
        <Modal
          title="Hoca Davet Et"
          sub="Uygulamaya kayıtlı hocaları arayın ve davet gönderin"
          wide
          onClose={closeInviteModal}
          footer={<button className="btn btn-ghost btn-sm" onClick={closeInviteModal}>Kapat</button>}
        >
          {/* Info banner */}
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
            <span className="material-icons" style={{ fontSize:16, color:'#3B82F6' }}>info</span>
            <span style={{ fontSize:13, color:'#3B82F6', lineHeight:1.5 }}>Hoca daveti kabul ettiğinde çizelgeleriniz ortak görüntülenebilir hale gelir.</span>
          </div>

          {/* Search row */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <div style={{ flex:1, position:'relative' }}>
              <span className="material-icons" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-2)', fontSize:18, pointerEvents:'none' }}>search</span>
              <input
                value={inviteQuery}
                placeholder="Hoca adı veya e-posta..."
                onChange={e => setInviteQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInviteSearch()}
                style={{ paddingLeft:36 }}
              />
            </div>
            <button className="btn btn-pri" onClick={handleInviteSearch} disabled={inviteLoading} style={{ flexShrink:0 }}>
              {inviteLoading ? 'Aranıyor…' : 'Ara'}
            </button>
          </div>

          {/* Results */}
          {inviteLoading ? <Spinner /> : !inviteSearched ? (
            <EmptyState icon="search" title="Hoca arayın" sub="En az 3 karakter girerek uygulamaya kayıtlı hocaları bulun" />
          ) : inviteResults.length === 0 ? (
            <EmptyState icon="person_search" title="Hoca bulunamadı" sub="Farklı bir isim veya e-posta ile tekrar arayın" />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {inviteResults.map(u => {
                const status = inviteMap[u.id];
                const alreadySent = status === 'pending' || status === 'accepted';
                return (
                  <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, background:'var(--bg)', borderRadius:12, padding:'12px 14px', border:'1px solid var(--border)' }}>
                    <Av name={u.full_name || '?'} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{u.full_name}</div>
                      <div style={{ fontSize:12, color:'var(--text-2)' }}>{u.email}</div>
                    </div>
                    {alreadySent ? (
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700, background: status === 'accepted' ? '#DCFCE7' : '#FEF3C7', color: status === 'accepted' ? '#22C55E' : '#F59E0B', borderRadius:999, padding:'5px 11px', flexShrink:0 }}>
                        <span className="material-icons" style={{ fontSize:13 }}>{status === 'accepted' ? 'check_circle' : 'schedule'}</span>
                        {status === 'accepted' ? 'Kabul Edildi' : 'Beklemede'}
                      </span>
                    ) : (
                      <button className="btn btn-pri btn-sm" onClick={() => handleSendInvite(u)} disabled={inviteSending === u.id} style={{ flexShrink:0 }}>
                        <span className="material-icons" style={{ fontSize:14 }}>send</span>
                        {inviteSending === u.id ? 'Gönderiliyor…' : 'Davet Et'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {/* ── Add / Edit Modal ── */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal
          title={modal === 'add' ? 'Yeni Koç Ekle' : 'Koç Düzenle'}
          wide
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={save} disabled={saving}>
                {saving ? 'Kaydediliyor…' : (modal === 'add' ? 'Kaydet' : 'Güncelle')}
              </button>
            </>
          }
        >
          <div className="fields" style={{ gap: 14 }}>
            <Field label="Hoca Adı *">
              <input value={form.full_name || ''} placeholder="Hoca adını girin"
                onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </Field>
            <div className="fields-2">
              <Field label="E-posta *">
                <input type="email" value={form.email || ''} placeholder="eposta@örnek.com"
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Telefon">
                <input type="tel" value={form.phone || ''} placeholder="0500 000 00 00"
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>
            <div className="fields-2">
              <Field label="Saatlik Ücret (₺) *">
                <input type="number" min={0} value={form.hourly_rate || ''} placeholder="0"
                  onChange={e => setForm({ ...form, hourly_rate: e.target.value })} />
              </Field>
              <Field label="Deneyim (Yıl)">
                <input type="number" min={0} value={form.experience_years || ''} placeholder="0"
                  onChange={e => setForm({ ...form, experience_years: e.target.value })} />
              </Field>
            </div>
            <Field label="Uzmanlık Alanı">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {SPECIALIZATIONS.map(spec => (
                  <button key={spec} type="button"
                    style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: form.specialization === spec ? 700 : 500, border: '1.5px solid', borderColor: form.specialization === spec ? 'var(--brand-navy)' : 'var(--border)', background: form.specialization === spec ? 'var(--brand-navy)' : 'var(--bg)', color: form.specialization === spec ? '#fff' : 'var(--text-2)', cursor: 'pointer' }}
                    onClick={() => setForm({ ...form, specialization: form.specialization === spec ? '' : spec })}
                  >{spec}</button>
                ))}
              </div>
            </Field>
            <Field label="Biyografi">
              <textarea rows={3} value={form.bio || ''} placeholder="Hoca hakkında kısa bilgi…"
                onChange={e => setForm({ ...form, bio: e.target.value })} style={{ resize: 'vertical' }} />
            </Field>
            <Switch on={form.is_active !== false} onChange={v => setForm({ ...form, is_active: v })} label="Aktif Koç" />
          </div>
        </Modal>
      )}

      {/* ── Schedule Modal ── */}
      {modal === 'schedule' && scheduleCoach && (() => {
        const { monday, sunday } = getWeekBounds(weekOffset);
        const days = getWeekDays(weekOffset);
        return (
          <Modal
            title={`${scheduleCoach.full_name} — Haftalık Program`}
            wide
            onClose={() => setModal(null)}
            footer={<button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Kapat</button>}
          >
            {/* Week navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => changeWeek(-1)}>
                <span className="material-icons">chevron_left</span>
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtWeekDate(monday)} – {fmtWeekDate(sunday)}</div>
                {weekOffset === 0 && <div style={{ fontSize: 11, color: 'var(--brand-navy)', fontWeight: 600, marginTop: 2 }}>Bu Hafta</div>}
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => changeWeek(1)}>
                <span className="material-icons">chevron_right</span>
              </button>
            </div>

            {scheduleLoading ? <Spinner /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {days.map((day, idx) => {
                  const dateStr  = day.toISOString().split('T')[0];
                  const dayItems = weekLessons.filter(l => l._date === dateStr);
                  const isToday  = isSameDay(day, new Date());
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 6, borderBottom: `1.5px solid ${isToday ? 'var(--brand-navy)' : 'var(--border)'}`, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isToday ? 'var(--brand-navy)' : 'var(--text-2)', width: 28 }}>{DAY_NAMES[idx]}</span>
                        <span style={{ fontSize: 12, color: isToday ? 'var(--brand-navy)' : 'var(--text-2)', fontWeight: isToday ? 700 : 400 }}>{fmtWeekDate(day)}</span>
                        {dayItems.length > 0 && (
                          <span style={{ marginLeft: 'auto', background: 'var(--brand-navy)', color: '#fff', borderRadius: 10, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', fontSize: 11, fontWeight: 700 }}>{dayItems.length}</span>
                        )}
                      </div>
                      {dayItems.length === 0 ? (
                        <div style={{ paddingLeft: 36, fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic', paddingBottom: 4 }}>Ders yok</div>
                      ) : dayItems.map(lesson => {
                        const isGroup = lesson.source === 'group';
                        const isPaid  = lesson.payment_status === 'paid';
                        return (
                          <div key={lesson.id} style={{ display: 'flex', gap: 10, background: isGroup ? '#FFFBEB' : '#fff', borderRadius: 10, padding: 10, marginBottom: 6, border: `1px solid ${isGroup ? '#FDE68A' : 'var(--border)'}` }}>
                            <div style={{ width: 3, borderRadius: 2, background: isGroup ? '#F59E0B' : 'var(--brand-navy)', alignSelf: 'stretch', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: isGroup ? '#F59E0B' : 'var(--brand-navy)' }}>
                                  {lesson._displayStart} – {lesson._displayEnd}
                                </span>
                                {isGroup ? (
                                  <span style={{ fontSize: 11, fontWeight: 700, background: '#FEF3C7', color: '#F59E0B', borderRadius: 20, padding: '2px 8px' }}>Grup</span>
                                ) : (
                                  <span style={{ fontSize: 11, fontWeight: 700, background: isPaid ? '#DCFCE7' : '#FEF3C7', color: isPaid ? '#22C55E' : '#F59E0B', borderRadius: 20, padding: '2px 8px' }}>
                                    {isPaid ? 'Ödendi' : 'Bekliyor'}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginTop: 2 }}>
                                {lesson.student_name || 'İsimsiz Öğrenci'}
                              </div>
                              {lesson.location && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                                  <span className="material-icons" style={{ fontSize: 12 }}>location_on</span>
                                  {lesson.location}
                                </div>
                              )}
                              {lesson.amount > 0 && <div style={{ fontSize: 13, fontWeight: 700, color: '#22C55E', marginTop: 4 }}>{fmtMoney(lesson.amount)}</div>}
                              {lesson.notes && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, fontStyle: 'italic' }}>{lesson.notes}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DERSLER
// ═══════════════════════════════════════════════════════════════
function LessonsScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [lessons,  setLessons]  = useState([]);
  const [coaches,  setCoaches]  = useState([]);
  const [courts,   setCourts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);
  const [tab,      setTab]      = useState('today');

  useEffect(() => { if (clubId) loadAll(); }, [clubId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const today   = new Date();
      const fromStr = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0];
      const toStr   = new Date(today.getTime() + 60 * 86400000).toISOString().split('T')[0];

      // Kulübün koçlarını al
      const { data: myCoachRows } = await sb.from('club_coaches').select('id, full_name').eq('club_id', clubId);
      const myCoachIds = (myCoachRows || []).map(c => c.id);
      const coachMap   = new Map((myCoachRows || []).map(c => [c.id, c.full_name]));
      setCoaches(myCoachRows || []);

      const combined = [];

      // 1) bookings — club_coach_id'si benim koçlarımdan olan
      if (myCoachIds.length > 0) {
        const { data: bookings } = await sb.from('bookings')
          .select('id, start_time, end_time, club_coach_id, payment_status, total_amount, courts!bookings_court_id_fkey(court_number, club_id)')
          .not('club_coach_id', 'is', null)
          .in('club_coach_id', myCoachIds)
          .gte('start_time', `${fromStr}T00:00:00`)
          .lte('start_time', `${toStr}T23:59:59`);

        (bookings || []).forEach(b => {
          const court = Array.isArray(b.courts) ? b.courts[0] : b.courts;
          if (court?.club_id && court.club_id !== clubId) return;
          const start = new Date(b.start_time);
          const end   = new Date(b.end_time);
          combined.push({
            id:             b.id,
            date:           start.toISOString().split('T')[0],
            start_time:     start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            end_time:       end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            student_name:   null,
            coach_name:     coachMap.get(b.club_coach_id) || 'Koç',
            location:       court?.court_number ? `Kort ${court.court_number}` : '—',
            payment_status: b.payment_status === 'paid' ? 'paid' : 'unpaid',
            amount:         b.total_amount || null,
            source:         'booking',
          });
        });
      }

      // 2) club_manual_lessons — club_id'ye göre
      const { data: manual } = await sb.from('club_manual_lessons')
        .select('*, club_coaches(full_name)')
        .eq('club_id', clubId)
        .gte('date', fromStr)
        .lte('date', toStr)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      (manual || []).forEach(m => {
        combined.push({
          id:             m.id,
          date:           m.date,
          start_time:     (m.start_time || '').slice(0, 5),
          end_time:       (m.end_time || '').slice(0, 5),
          student_name:   m.student_name || null,
          coach_name:     m.coach_name || m.club_coaches?.full_name || 'Koç',
          location:       m.location || '—',
          notes:          m.notes || null,
          payment_status: m.payment_status || 'unpaid',
          amount:         m.amount || null,
          source:         'manual',
        });
      });

      // 3) lessons — club_coach_id'si benim koçlarımdan olan
      if (myCoachIds.length > 0) {
        const { data: directLessons } = await sb.from('lessons')
          .select('id, start_time, end_time, student_name, club_coach_id, amount, payment_status, notes, courts(court_number)')
          .in('club_coach_id', myCoachIds)
          .neq('status', 'cancelled')
          .gte('start_time', `${fromStr}T00:00:00`)
          .lte('start_time', `${toStr}T23:59:59`);

        (directLessons || []).forEach(l => {
          const start = new Date(l.start_time);
          const end   = new Date(l.end_time);
          const court = Array.isArray(l.courts) ? l.courts[0] : l.courts;
          combined.push({
            id:             l.id,
            date:           start.toISOString().split('T')[0],
            start_time:     start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            end_time:       end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            student_name:   l.student_name || null,
            coach_name:     coachMap.get(l.club_coach_id) || 'Koç',
            location:       court?.court_number ? `Kort ${court.court_number}` : '—',
            notes:          l.notes || null,
            payment_status: l.payment_status === 'paid' ? 'paid' : 'unpaid',
            amount:         l.amount || null,
            source:         'lesson',
          });
        });
      }

      combined.sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
      setLessons(combined);

      // Kort listesi (ders ekleme modalı için)
      const { data: courtData } = await sb.from('courts').select('id, court_number').eq('club_id', clubId).eq('is_active', true);
      setCourts(courtData || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const todayStr    = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const tabItems = [
    { key: 'today',    label: 'Bugün' },
    { key: 'upcoming', label: 'Yaklaşan' },
    { key: 'past',     label: 'Geçmiş' },
  ];

  const filtered = lessons.filter(l => {
    if (tab === 'today')    return l.date === todayStr;
    if (tab === 'upcoming') return l.date >= tomorrowStr;
    return l.date < todayStr;
  });

  const saveLesson = async () => {
    if (!form.date)       { alert('Tarih seçin.'); return; }
    if (!form.start_time) { alert('Başlangıç saati girin.'); return; }
    if (!form.end_time)   { alert('Bitiş saati girin.'); return; }

    // ── Double booking kontrolü ──────────────────────────────────
    {
      const dateStr = form.date;
      const startHH = (form.start_time || '').slice(0, 5);
      const endHH   = (form.end_time   || '').slice(0, 5);

      // Kort çakışması — yalnızca kort seçildiyse
      if (form.court_id) {
        const startDb = localTimeToDb(`${dateStr}T${startHH}`);
        const endDb   = localTimeToDb(`${dateStr}T${endHH}`);

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
        if (closureBlock) {
          const proceed = confirm('Bu kort seçilen saatte kapalı olarak işaretlenmiş. Yine de ders oluşturulsun mu?');
          if (!proceed) return;
        }
      }

      // Koç çakışması — yalnızca sistem koçu seçildiyse (kort seçiminden bağımsız)
      const coachId = !form.use_manual_coach ? (form.coach_id || null) : null;
      if (coachId) {
        const { data: coachConflict } = await sb.from('club_manual_lessons')
          .select('id, start_time, end_time')
          .eq('coach_id', coachId)
          .eq('date', dateStr);
        const hasCoachConflict = (coachConflict || []).some(l => {
          const ls = (l.start_time || '').slice(0, 5);
          const le = (l.end_time   || '').slice(0, 5);
          return ls < endHH && le > startHH;
        });
        if (hasCoachConflict) { alert('Bu antrenörün seçilen saatte başka bir dersi var.'); return; }
      }
    }
    setSaving(true);
    try {
      const courtNum = form.court_id ? courts.find(c => c.id === form.court_id)?.court_number : null;
      const payload = {
        club_id:        clubId,
        coach_id:       form.use_manual_coach ? null : (form.coach_id || null),
        coach_name:     form.use_manual_coach ? (form.coach_name_manual?.trim() || null) : null,
        student_name:   form.student_name?.trim() || null,
        date:           form.date,
        start_time:     form.start_time,
        end_time:       form.end_time,
        location:       courtNum ? `Kort ${courtNum}` : (form.location?.trim() || null),
        notes:          form.notes?.trim() || null,
        payment_status: form.payment_status || 'unpaid',
        amount:         form.amount ? Number(form.amount) : null,
      };
      await sb.from('club_manual_lessons').insert(payload);
      setModal(null);
      loadAll();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const markPaid = async (lesson) => {
    if (!confirm(`Bu ders için ödeme alındı mı?${lesson.amount ? ` (${fmtMoney(lesson.amount)})` : ''}`)) return;
    try {
      if (lesson.source === 'booking') {
        await sb.from('bookings').update({ payment_status: 'paid' }).eq('id', lesson.id);
      } else if (lesson.source === 'lesson') {
        await sb.from('lessons').update({ payment_status: 'paid' }).eq('id', lesson.id);
        if (lesson.amount > 0) {
          await sb.from('club_finances').insert({ club_id: clubId, type: 'income', category: 'Ders Geliri', amount: lesson.amount, description: `${lesson.coach_name}${lesson.student_name ? ` - ${lesson.student_name}` : ''} - Ders ödemesi`, date: lesson.date });
        }
      } else {
        await sb.from('club_manual_lessons').update({ payment_status: 'paid' }).eq('id', lesson.id);
        if (lesson.amount > 0) {
          await sb.from('club_finances').insert({ club_id: clubId, type: 'income', category: 'Ders Geliri', amount: lesson.amount, description: `${lesson.coach_name}${lesson.student_name ? ` - ${lesson.student_name}` : ''} - Ders ödemesi`, date: lesson.date });
        }
      }
      loadAll();
    } catch (e) { alert(e.message); }
  };

  const deleteLesson = async (lesson) => {
    if (lesson.source === 'booking') { alert('Rezervasyon kaynaklı dersler buradan silinemez.'); return; }
    if (!confirm('Bu dersi silmek istediğinize emin misiniz?')) return;
    const table = lesson.source === 'lesson' ? 'lessons' : 'club_manual_lessons';
    await sb.from(table).delete().eq('id', lesson.id);
    loadAll();
  };

  const srcBadge = (src) => {
    if (src === 'booking') return <Badge cls="b-info">Rezervasyon</Badge>;
    if (src === 'lesson')  return <Badge cls="b-success">Ders</Badge>;
    return <Badge cls="b-warning">Manuel</Badge>;
  };

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Dersler</h1>
          <div className="sub">{lessons.length} ders kayıtlı</div>
        </div>
        <button className="btn btn-pri" onClick={() => {
          setForm({ date: todayISO(), start_time: '09:00', end_time: '10:00', payment_status: 'unpaid', use_manual_coach: false });
          setModal({ type: 'add' });
        }}>
          <span className="material-icons">add</span> Ders Ekle
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <Tabs items={tabItems} active={tab} onChange={setTab} />
        </div>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="school"
            title={tab === 'today' ? 'Bugün ders yok' : tab === 'upcoming' ? 'Yaklaşan ders yok' : 'Geçmiş ders yok'} />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Saat</th>
                <th>Öğrenci</th>
                <th>Koç</th>
                <th>Konum</th>
                <th>Kaynak</th>
                <th>Ödeme</th>
                <th className="c-r">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={`${l.source}-${l.id}`}>
                  <td className="c-strong">{fmtDate(l.date)}</td>
                  <td>{l.start_time} – {l.end_time}</td>
                  <td>{l.student_name || <span className="c-muted">—</span>}</td>
                  <td>{l.coach_name}</td>
                  <td className="c-muted">{l.location}</td>
                  <td>{srcBadge(l.source)}</td>
                  <td>
                    {l.payment_status === 'paid' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Badge cls="b-success">Ödendi</Badge>
                        {l.amount > 0 && <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 700 }}>{fmtMoney(l.amount)}</span>}
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => markPaid(l)}>
                        <span className="material-icons" style={{ fontSize: 13 }}>payments</span>
                        Ödeme Al{l.amount ? ` · ${fmtMoney(l.amount)}` : ''}
                      </button>
                    )}
                  </td>
                  <td className="c-r">
                    {l.source !== 'booking' && (
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteLesson(l)}>
                        <span className="material-icons" style={{ fontSize: 14 }}>delete</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add Lesson Modal ── */}
      {modal?.type === 'add' && (
        <Modal title="Ders Ekle" wide onClose={() => setModal(null)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Vazgeç</button>
            <button className="btn btn-pri btn-sm" onClick={saveLesson} disabled={saving}>
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </>
        }>
          <div className="fields" style={{ gap: 14 }}>
            {/* Antrenör */}
            <Field label="Antrenör">
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {[{ key: false, label: 'Listeden Seç' }, { key: true, label: 'Manuel Giriş' }].map(opt => (
                  <button key={String(opt.key)} type="button"
                    style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1.5px solid', borderColor: !!form.use_manual_coach === opt.key ? 'var(--brand-navy)' : 'var(--border)', background: !!form.use_manual_coach === opt.key ? '#EEF2FF' : 'var(--bg)', fontWeight: 600, fontSize: 13, color: !!form.use_manual_coach === opt.key ? 'var(--brand-navy)' : 'var(--text-2)', cursor: 'pointer' }}
                    onClick={() => setForm({ ...form, use_manual_coach: opt.key })}
                  >{opt.label}</button>
                ))}
              </div>
              {form.use_manual_coach ? (
                <input value={form.coach_name_manual || ''} placeholder="Antrenör adı"
                  onChange={e => setForm({ ...form, coach_name_manual: e.target.value })} />
              ) : (
                <select value={form.coach_id || ''} onChange={e => setForm({ ...form, coach_id: e.target.value })}>
                  <option value="">Seçin…</option>
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              )}
            </Field>

            <Field label="Öğrenci Adı (opsiyonel)">
              <input value={form.student_name || ''} placeholder="Öğrenci adı veya boş bırakın"
                onChange={e => setForm({ ...form, student_name: e.target.value })} />
            </Field>

            <Field label="Tarih">
              <input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
            </Field>

            <div className="fields-2">
              <Field label="Başlangıç"><input type="time" value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} /></Field>
              <Field label="Bitiş"><input type="time" value={form.end_time || ''} onChange={e => setForm({ ...form, end_time: e.target.value })} /></Field>
            </div>

            <Field label="Kort">
              <select value={form.court_id || ''} onChange={e => setForm({ ...form, court_id: e.target.value })}>
                <option value="">Seçin…</option>
                {courts.map(c => <option key={c.id} value={c.id}>Kort {c.court_number}</option>)}
              </select>
            </Field>

            <div className="fields-2">
              <Field label="Ders Ücreti (₺)">
                <input type="number" min={0} value={form.amount || ''} placeholder="0"
                  onChange={e => setForm({ ...form, amount: e.target.value })} />
              </Field>
              <Field label="Ödeme Durumu">
                <select value={form.payment_status || 'unpaid'} onChange={e => setForm({ ...form, payment_status: e.target.value })}>
                  <option value="unpaid">Ödenmedi</option>
                  <option value="paid">Ödendi</option>
                </select>
              </Field>
            </div>

            <Field label="Not (opsiyonel)">
              <textarea rows={2} value={form.notes || ''} placeholder="Ders hakkında not…"
                onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical' }} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

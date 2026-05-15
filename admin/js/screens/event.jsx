// ── Turnuvalar & Gruplar ────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// TURNUVALAR
// ═══════════════════════════════════════════════════════════════
function TournamentsScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [tournaments, setTournaments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState({});
  const [saving,      setSaving]      = useState(false);
  const [detailId,    setDetailId]    = useState(null);

  useEffect(() => { if (clubId) load(); }, [clubId]);

  const load = async () => {
    setLoading(true);
    const { data } = await sb.from('tournaments')
      .select('*')
      .eq('club_id', clubId)
      .order('start_date', { ascending: false });
    setTournaments(data || []);
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        club_id:      clubId,
        title:        form.title,
        description:  form.description || null,
        start_date:   form.start_date || null,
        end_date:     form.end_date   || null,
        max_players:  form.max_players ? Number(form.max_players) : null,
        entry_fee:    form.entry_fee   ? Number(form.entry_fee)   : null,
        court_type:   form.court_type  || null,
        status:       form.status      || 'upcoming',
      };
      if (modal?.type === 'add') {
        await sb.from('tournaments').insert(payload);
      } else {
        await sb.from('tournaments').update(payload).eq('id', form.id);
      }
      setModal(null);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Bu turnuvayı silmek istediğinize emin misiniz?')) return;
    await sb.from('tournaments').delete().eq('id', id);
    load();
  };

  const tStatus = (t) => {
    const now = new Date();
    if (t.status) return t.status;
    if (!t.start_date) return 'upcoming';
    const s = new Date(t.start_date), e = t.end_date ? new Date(t.end_date) : null;
    if (now < s) return 'upcoming';
    if (!e || now <= e) return 'active';
    return 'completed';
  };

  const tStatusCls = (s) => {
    if (s === 'active')    return 'b-success';
    if (s === 'upcoming')  return 'b-info';
    if (s === 'completed') return 'b-muted';
    return 'b-muted';
  };
  const tStatusLbl = (s) => ({ upcoming:'Yaklaşan', active:'Devam Ediyor', completed:'Tamamlandı', cancelled:'İptal' }[s] || s);

  if (detailId) {
    return <ManageTournamentScreen tournamentId={detailId} onBack={() => { setDetailId(null); load(); }} />;
  }

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Turnuvalar</h1>
          <div className="sub">{tournaments.length} turnuva</div>
        </div>
        <button className="btn btn-pri" onClick={() => { setForm({ status:'upcoming', court_type:'clay' }); setModal({ type:'add' }); }}>
          <span className="material-icons">add</span> Turnuva Oluştur
        </button>
      </div>

      {loading ? <Spinner /> : tournaments.length === 0 ? (
        <EmptyState icon="emoji_events" title="Henüz turnuva yok" sub="İlk turnuvanızı oluşturun." />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {tournaments.map(t => {
            const st = tStatus(t);
            return (
              <div key={t.id} className="card" style={{ position:'relative' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ fontWeight:800, fontSize:16 }}>{t.title || <span style={{ color:'var(--text-2)', fontStyle:'italic', fontWeight:400 }}>İsimsiz Turnuva</span>}</div>
                  <Badge cls={tStatusCls(st)}>{tStatusLbl(st)}</Badge>
                </div>
                {t.description && <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:10 }}>{t.description}</p>}
                <div style={{ display:'flex', flexDirection:'column', gap:5, fontSize:12, color:'var(--text-2)', marginBottom:14 }}>
                  {t.start_date && <span>📅 {fmtDate(t.start_date)}{t.end_date ? ` — ${fmtDate(t.end_date)}` : ''}</span>}
                  {t.max_players > 0 && <span>👥 Maks. {t.max_players} oyuncu</span>}
                  {t.entry_fee > 0 && <span>💰 Kayıt ücreti: {fmtMoney(t.entry_fee)}</span>}
                  {t.court_type && <span>🎾 {courtTypeLabel(t.court_type)}</span>}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-pri btn-sm" style={{ flex:1 }}
                    onClick={() => setDetailId(t.id)}>
                    <span className="material-icons" style={{fontSize:14}}>sports_tennis</span> Yönet
                  </button>
                  <button className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => { setForm({...t}); setModal({ type:'edit' }); }}>
                    <span className="material-icons" style={{fontSize:15}}>edit</span>
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(t.id)}>
                    <span className="material-icons" style={{fontSize:15}}>delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.type === 'add' ? 'Turnuva Oluştur' : 'Turnuva Düzenle'}
          wide
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={save} disabled={saving}>
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </>
          }
        >
          <div className="fields" style={{ gap:14 }}>
            <Field label="Turnuva Adı">
              <input value={form.title || ''} placeholder="Yaz Turnuvası 2025…"
                onChange={e => setForm({...form, title: e.target.value})} />
            </Field>
            <Field label="Açıklama">
              <textarea rows={2} value={form.description || ''} placeholder="Turnuva hakkında…"
                onChange={e => setForm({...form, description: e.target.value})} style={{ resize:'vertical' }} />
            </Field>
            <div className="fields-2">
              <Field label="Başlangıç Tarihi"><input type="date" value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} /></Field>
              <Field label="Bitiş Tarihi"><input type="date" value={form.end_date || ''} onChange={e => setForm({...form, end_date: e.target.value})} /></Field>
            </div>
            <div className="fields-2">
              <Field label="Maks. Oyuncu">
                <input type="number" min={2} value={form.max_players || ''} placeholder="32"
                  onChange={e => setForm({...form, max_players: e.target.value})} />
              </Field>
              <Field label="Kayıt Ücreti (₺)">
                <input type="number" min={0} value={form.entry_fee || ''} placeholder="0"
                  onChange={e => setForm({...form, entry_fee: e.target.value})} />
              </Field>
            </div>
            <div className="fields-2">
              <Field label="Kort Tipi">
                <select value={form.court_type || 'clay'} onChange={e => setForm({...form, court_type: e.target.value})}>
                  <option value="clay">Toprak</option>
                  <option value="hard">Sert</option>
                  <option value="grass">Çim</option>
                </select>
              </Field>
              <Field label="Durum">
                <select value={form.status || 'upcoming'} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="upcoming">Yaklaşan</option>
                  <option value="active">Devam Ediyor</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal</option>
                </select>
              </Field>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GRUPLAR
// ═══════════════════════════════════════════════════════════════
const MONTH_NAMES_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function GroupsScreen({ clubId }) {
  const { useState, useEffect } = React;

  // ── Ana liste ─────────────────────────────────────────────────
  const [groups,   setGroups]   = useState([]);
  const [coaches,  setCoaches]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  // ── Grup oluştur / düzenle modalı ────────────────────────────
  const [groupModal,  setGroupModal]  = useState(null); // null | {type:'add'|'edit', group?}
  const [form,        setForm]        = useState({});
  const [newMembers,  setNewMembers]  = useState([]);   // sadece 'add' modunda
  const [saving,      setSaving]      = useState(false);

  // ── Üye yönetim modalı ───────────────────────────────────────
  const [membersModal,    setMembersModal]    = useState(null); // null | {group}
  const [groupMembers,    setGroupMembers]    = useState([]);
  const [addMemberForm,   setAddMemberForm]   = useState({});
  const [memberSaving,    setMemberSaving]    = useState(false);
  const [editMemberRow,   setEditMemberRow]   = useState(null); // memberId being edited

  // ── Aidat yönetim modalı ─────────────────────────────────────
  const [duesModal,   setDuesModal]   = useState(null); // null | {group}
  const [duesYear,    setDuesYear]    = useState(new Date().getFullYear());
  const [duesMonth,   setDuesMonth]   = useState(new Date().getMonth() + 1);
  const [dues,        setDues]        = useState([]);
  const [duesPost,    setDuesPost]    = useState(null);
  const [duesLoading, setDuesLoading] = useState(false);
  const [posting,     setPosting]     = useState(false);

  useEffect(() => { if (clubId) { loadGroups(); loadCoaches(); } }, [clubId]);

  // ── Veri yükleme ─────────────────────────────────────────────
  const loadGroups = async () => {
    setLoading(true);
    const { data } = await sb
      .from('club_groups')
      .select('*, coach:club_coaches(id, full_name), members:club_group_members(*)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    setGroups((data || []).map(g => ({ ...g, member_count: g.members?.length ?? 0 })));
    setLoading(false);
  };

  const loadCoaches = async () => {
    const { data } = await sb.from('club_coaches').select('id,full_name').eq('club_id', clubId).eq('is_active', true);
    setCoaches(data || []);
  };

  // ── Grup oluştur ─────────────────────────────────────────────
  const openCreate = () => {
    setForm({ name: '', description: '', monthly_fee: '', club_percentage: 100, coach_id: '', is_active: true });
    setNewMembers([
      { member_name: '', contact_number: '', contact_person: '' },
      { member_name: '', contact_number: '', contact_person: '' },
      { member_name: '', contact_number: '', contact_person: '' },
    ]);
    setGroupModal({ type: 'add' });
  };

  const openEdit = (g) => {
    setForm({
      id: g.id, name: g.name, description: g.description || '',
      monthly_fee: g.monthly_fee ?? '', club_percentage: g.club_percentage ?? 100,
      coach_id: g.coach_id || '', is_active: g.is_active,
    });
    setGroupModal({ type: 'edit', group: g });
  };

  const updateNewMember = (idx, field, val) => {
    setNewMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  const addNewMemberRow = () => {
    setNewMembers(prev => [...prev, { member_name: '', contact_number: '', contact_person: '' }]);
  };

  const removeNewMemberRow = (idx) => {
    setNewMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const saveGroup = async () => {
    if (!form.name?.trim()) { alert('Grup adı zorunludur.'); return; }
    if (groupModal.type === 'add') {
      const valid = newMembers.filter(m => m.member_name.trim());
      if (valid.length < 3) { alert('Grup oluşturmak için en az 3 üye gereklidir.'); return; }
    }
    setSaving(true);
    try {
      const payload = {
        name:            form.name.trim(),
        description:     form.description?.trim() || null,
        monthly_fee:     form.monthly_fee !== '' ? Number(form.monthly_fee) : 0,
        club_percentage: Number(form.club_percentage) || 100,
        coach_id:        form.coach_id || null,
        is_active:       form.is_active !== false,
      };
      if (groupModal.type === 'add') {
        const validMembers = newMembers
          .filter(m => m.member_name.trim())
          .map(m => ({ member_name: m.member_name.trim(), contact_number: m.contact_number?.trim() || null, contact_person: m.contact_person?.trim() || null }));
        await GroupSvc.createGroup(clubId, payload, validMembers);
      } else {
        await GroupSvc.updateGroup(form.id, payload);
      }
      setGroupModal(null);
      loadGroups();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  // ── Grup sil (cascade) ───────────────────────────────────────
  const deleteGroup = async (g) => {
    if (!confirm(`"${g.name}" grubunu ve tüm üye/aidat kayıtlarını silmek istediğinize emin misiniz?`)) return;
    try {
      await GroupSvc.deleteGroup(g.id);
      loadGroups();
    } catch (e) { alert(e.message); }
  };

  // ── Durum toggle ─────────────────────────────────────────────
  const toggleStatus = async (g) => {
    try {
      await GroupSvc.toggleGroupStatus(g.id);
      loadGroups();
    } catch (e) { alert(e.message); }
  };

  // ── Üye yönetim modalı ───────────────────────────────────────
  const openMembers = (g) => {
    setMembersModal({ group: g });
    setGroupMembers(g.members || []);
    setAddMemberForm({ member_name: '', contact_number: '', contact_person: '' });
    setEditMemberRow(null);
  };

  const addMember = async () => {
    if (!addMemberForm.member_name?.trim()) { alert('Üye adı zorunludur.'); return; }
    setMemberSaving(true);
    try {
      const m = await GroupSvc.addMember(membersModal.group.id, {
        member_name:    addMemberForm.member_name.trim(),
        contact_number: addMemberForm.contact_number?.trim() || null,
        contact_person: addMemberForm.contact_person?.trim() || null,
      });
      setGroupMembers(prev => [...prev, m]);
      setAddMemberForm({ member_name: '', contact_number: '', contact_person: '' });
      loadGroups();
    } catch (e) { alert(e.message); }
    finally { setMemberSaving(false); }
  };

  const removeMember = async (memberId) => {
    if (!confirm('Bu üyeyi gruptan çıkarmak istediğinize emin misiniz?')) return;
    try {
      await GroupSvc.removeMember(memberId);
      setGroupMembers(prev => prev.filter(m => m.id !== memberId));
      loadGroups();
    } catch (e) { alert(e.message); }
  };

  const saveEditMember = async (memberId, updated) => {
    if (!updated.member_name?.trim()) { alert('Üye adı zorunludur.'); return; }
    try {
      const m = await GroupSvc.updateMember(memberId, {
        member_name:    updated.member_name.trim(),
        contact_number: updated.contact_number?.trim() || null,
        contact_person: updated.contact_person?.trim() || null,
      });
      setGroupMembers(prev => prev.map(x => x.id === memberId ? m : x));
      setEditMemberRow(null);
    } catch (e) { alert(e.message); }
  };

  // ── Aidat yönetim modalı ─────────────────────────────────────
  const openDues = async (g) => {
    const now = new Date();
    const y = now.getFullYear(), mo = now.getMonth() + 1;
    setDuesModal({ group: g });
    setDuesYear(y);
    setDuesMonth(mo);
    await loadDues(g, y, mo);
  };

  const loadDues = async (g, year, month) => {
    setDuesLoading(true);
    try {
      const [duesData, postData] = await Promise.all([
        GroupDuesSvc.getOrCreateDues(g.id, year, month, g.monthly_fee || 0),
        GroupDuesSvc.getDuesPost(g.id, year, month),
      ]);
      setDues(duesData);
      setDuesPost(postData);
    } catch (e) { console.error(e); }
    finally { setDuesLoading(false); }
  };

  const changeMonth = async (delta) => {
    let m = duesMonth + delta, y = duesYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1)  { m = 12; y--; }
    setDuesMonth(m);
    setDuesYear(y);
    await loadDues(duesModal.group, y, m);
  };

  const toggleDuePaid = async (due) => {
    if (duesPost) return;
    try {
      const updated = await GroupDuesSvc.toggleDuePaid(due.id, !due.is_paid);
      setDues(prev => prev.map(d => d.id === due.id ? updated : d));
    } catch (e) { alert(e.message); }
  };

  const postToFinance = async () => {
    if (!confirm('Bu ayın aidatlarını finanslara işlemek istediğinize emin misiniz?')) return;
    setPosting(true);
    try {
      await GroupDuesSvc.postDuesToFinance(
        duesModal.group.id, duesModal.group.name,
        duesYear, duesMonth, dues,
        duesModal.group.club_percentage ?? 100,
        duesModal.group.coach_id || null,
      );
      await loadDues(duesModal.group, duesYear, duesMonth);
    } catch (e) { alert(e.message); }
    finally { setPosting(false); }
  };

  // ── Hesaplamalar ─────────────────────────────────────────────
  const paidCount   = dues.filter(d => d.is_paid).length;
  const totalDues   = dues.reduce((s, d) => s + (d.amount || 0), 0);
  const paidAmount  = dues.filter(d => d.is_paid).reduce((s, d) => s + (d.amount || 0), 0);
  const coachPct    = duesModal ? 100 - (duesModal.group.club_percentage ?? 100) : 0;

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Gruplar</h1>
          <div className="sub">{groups.length} grup kayıtlı</div>
        </div>
        <button className="btn btn-pri" onClick={openCreate}>
          <span className="material-icons">add</span> Grup Oluştur
        </button>
      </div>

      {loading ? <Spinner /> : groups.length === 0 ? (
        <EmptyState icon="groups" title="Henüz grup yok" sub="İlk grubunuzu oluşturun." />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {groups.map(g => {
            const coachShare = 100 - (g.club_percentage ?? 100);
            return (
              <div key={g.id} className="card" style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {/* Başlık satırı */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ fontWeight:800, fontSize:16 }}>{g.name}</div>
                  <button
                    style={{ background:'none', border:'none', cursor:'pointer', padding:'3px 10px', borderRadius:20,
                      backgroundColor: g.is_active ? '#DCFCE7' : '#FEF3C7',
                      color: g.is_active ? '#22C55E' : '#F59E0B', fontSize:11, fontWeight:700, flexShrink:0 }}
                    onClick={() => toggleStatus(g)}
                    title="Durumu değiştir"
                  >
                    {g.is_active ? 'Aktif' : 'Pasif'}
                  </button>
                </div>

                {g.description && <p style={{ fontSize:13, color:'var(--text-2)', margin:0 }}>{g.description}</p>}

                {/* Bilgi chip'leri */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  <span style={{ fontSize:12, color:'var(--text-2)', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'4px 9px', display:'flex', alignItems:'center', gap:4 }}>
                    <span className="material-icons" style={{fontSize:13}}>group</span>
                    {g.member_count} üye
                  </span>
                  {g.monthly_fee > 0 && (
                    <span style={{ fontSize:12, color:'var(--text-2)', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'4px 9px', display:'flex', alignItems:'center', gap:4 }}>
                      <span className="material-icons" style={{fontSize:13}}>payments</span>
                      {fmtMoney(g.monthly_fee)}/ay
                    </span>
                  )}
                  {coachShare > 0 && (
                    <span style={{ fontSize:12, color:'#8B5CF6', background:'#F3E8FF', border:'1px solid #DDD6FE', borderRadius:8, padding:'4px 9px' }}>
                      Koç %{coachShare}
                    </span>
                  )}
                  {g.coach?.full_name && (
                    <span style={{ fontSize:12, color:'var(--brand-navy)', background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:8, padding:'4px 9px', fontWeight:600 }}>
                      {g.coach.full_name}
                    </span>
                  )}
                </div>

                <div style={{ height:1, background:'var(--border)' }} />

                {/* Aksiyon butonları */}
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex:1, color:'#8B5CF6' }} onClick={() => openDues(g)}>
                    <span className="material-icons" style={{fontSize:14}}>payments</span> Aidat
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => openMembers(g)}>
                    <span className="material-icons" style={{fontSize:14}}>manage_accounts</span> Üyeler
                  </button>
                  <button className="btn btn-ghost btn-sm btn-icon" title="Düzenle" onClick={() => openEdit(g)}>
                    <span className="material-icons" style={{fontSize:15}}>edit</span>
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon" title="Sil" onClick={() => deleteGroup(g)}>
                    <span className="material-icons" style={{fontSize:15}}>delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ GRUP OLUŞTUR / DÜZENLE MODALI ══ */}
      {groupModal && (
        <Modal
          title={groupModal.type === 'add' ? 'Grup Oluştur' : 'Grubu Düzenle'}
          wide
          onClose={() => setGroupModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setGroupModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={saveGroup} disabled={saving}>
                {saving ? 'Kaydediliyor…' : (groupModal.type === 'add' ? 'Oluştur' : 'Güncelle')}
              </button>
            </>
          }
        >
          <div className="fields" style={{ gap:14 }}>
            <Field label="Grup Adı *">
              <input value={form.name || ''} placeholder="Örn: Pazartesi Başlangıç Grubu"
                onChange={e => setForm({...form, name: e.target.value})} />
            </Field>
            <Field label="Açıklama">
              <textarea rows={2} value={form.description || ''} placeholder="Grup hakkında kısa bilgi…"
                onChange={e => setForm({...form, description: e.target.value})} style={{ resize:'vertical' }} />
            </Field>

            <div className="fields-2">
              <Field label="Aylık Ücret (₺)">
                <input type="number" min={0} placeholder="0" value={form.monthly_fee ?? ''}
                  onChange={e => setForm({...form, monthly_fee: e.target.value})} />
              </Field>
              <Field label="Kulüp Payı (%)">
                <input type="number" min={0} max={100} placeholder="100" value={form.club_percentage ?? 100}
                  onChange={e => setForm({...form, club_percentage: e.target.value})} />
              </Field>
            </div>

            {Number(form.club_percentage) < 100 && (
              <div style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#7C3AED' }}>
                Koç payı: %{100 - Number(form.club_percentage || 0)}
                {form.monthly_fee > 0 && ` · ${fmtMoney(Number(form.monthly_fee) * (1 - (form.club_percentage || 0) / 100))}/üye`}
              </div>
            )}

            <Field label="Antrenör">
              <select value={form.coach_id || ''} onChange={e => setForm({...form, coach_id: e.target.value})}>
                <option value="">Antrenör seçin…</option>
                {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </Field>

            <Switch on={form.is_active !== false} onChange={v => setForm({...form, is_active: v})} label="Aktif Grup" />

            {/* Üyeler — sadece oluşturma modunda */}
            {groupModal.type === 'add' && (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:'var(--text-2)' }}>
                    Üyeler <span style={{ color:'var(--danger)' }}>*</span>
                    <span style={{ fontWeight:400, marginLeft:6, fontSize:12 }}>(en az 3)</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={addNewMemberRow}>
                    <span className="material-icons" style={{fontSize:14}}>add</span> Üye Ekle
                  </button>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {newMembers.map((m, idx) => (
                    <div key={idx} style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1.5fr auto', gap:6, alignItems:'center' }}>
                      <input placeholder={`Üye ${idx+1} adı *`} value={m.member_name}
                        onChange={e => updateNewMember(idx, 'member_name', e.target.value)}
                        style={{ fontSize:13 }} />
                      <input placeholder="Telefon" value={m.contact_number}
                        onChange={e => updateNewMember(idx, 'contact_number', e.target.value)}
                        style={{ fontSize:13 }} />
                      <input placeholder="Veli / İletişim" value={m.contact_person}
                        onChange={e => updateNewMember(idx, 'contact_person', e.target.value)}
                        style={{ fontSize:13 }} />
                      {newMembers.length > 3 && (
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeNewMemberRow(idx)}>
                          <span className="material-icons" style={{fontSize:14}}>remove</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ══ ÜYE YÖNETİM MODALI ══ */}
      {membersModal && (
        <Modal
          title={`${membersModal.group.name} — Üyeler`}
          wide
          onClose={() => setMembersModal(null)}
          footer={<button className="btn btn-ghost btn-sm" onClick={() => setMembersModal(null)}>Kapat</button>}
        >
          {/* Mevcut üyeler */}
          {groupMembers.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--text-2)', fontSize:13, padding:'20px 0' }}>Henüz üye yok</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
              {groupMembers.map(m => (
                <div key={m.id}>
                  {editMemberRow === m.id ? (
                    <EditMemberRow member={m} onSave={saveEditMember} onCancel={() => setEditMemberRow(null)} />
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:10, background:'var(--bg)', borderRadius:10, padding:'10px 12px', border:'1px solid var(--border)' }}>
                      <Av name={m.member_name} size="sm" />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{m.member_name}</div>
                        <div style={{ fontSize:11, color:'var(--text-2)', display:'flex', gap:8, marginTop:2 }}>
                          {m.contact_number && <span>📞 {m.contact_number}</span>}
                          {m.contact_person && <span>👤 {m.contact_person}</span>}
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Düzenle" onClick={() => setEditMemberRow(m.id)}>
                        <span className="material-icons" style={{fontSize:14}}>edit</span>
                      </button>
                      <button className="btn btn-danger btn-sm btn-icon" title="Çıkar" onClick={() => removeMember(m.id)}>
                        <span className="material-icons" style={{fontSize:14}}>person_remove</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Yeni üye ekle */}
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:14 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'var(--text-2)', marginBottom:8 }}>Yeni Üye Ekle</div>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1.5fr', gap:8, marginBottom:10 }}>
              <input placeholder="Üye adı soyadı *" value={addMemberForm.member_name || ''}
                onChange={e => setAddMemberForm({...addMemberForm, member_name: e.target.value})}
                style={{ fontSize:13 }} />
              <input placeholder="Telefon numarası" value={addMemberForm.contact_number || ''}
                onChange={e => setAddMemberForm({...addMemberForm, contact_number: e.target.value})}
                style={{ fontSize:13 }} />
              <input placeholder="Veli / İletişim kişisi" value={addMemberForm.contact_person || ''}
                onChange={e => setAddMemberForm({...addMemberForm, contact_person: e.target.value})}
                style={{ fontSize:13 }} />
            </div>
            <button className="btn btn-pri btn-sm" onClick={addMember} disabled={memberSaving}>
              <span className="material-icons" style={{fontSize:14}}>person_add</span>
              {memberSaving ? 'Ekleniyor…' : 'Üye Ekle'}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ AİDAT YÖNETİM MODALI ══ */}
      {duesModal && (
        <Modal
          title={`${duesModal.group.name} — Aidat Yönetimi`}
          wide
          onClose={() => setDuesModal(null)}
          footer={<button className="btn btn-ghost btn-sm" onClick={() => setDuesModal(null)}>Kapat</button>}
        >
          {/* Ay navigasyonu */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0 16px', borderBottom:'1px solid var(--border)', marginBottom:16 }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => changeMonth(-1)}>
              <span className="material-icons">chevron_left</span>
            </button>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontWeight:800, fontSize:15 }}>{MONTH_NAMES_TR[duesMonth-1]} {duesYear}</div>
              {duesPost && (
                <div style={{ fontSize:11, color:'#22C55E', fontWeight:700, marginTop:2 }}>
                  ✓ Finanslara işlendi
                </div>
              )}
            </div>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => changeMonth(1)}>
              <span className="material-icons">chevron_right</span>
            </button>
          </div>

          {duesLoading ? <Spinner /> : (
            <>
              {/* Özet */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                <div style={{ background:'var(--bg)', borderRadius:10, padding:'10px 12px', textAlign:'center', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:'var(--brand-navy)' }}>{paidCount}/{dues.length}</div>
                  <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2 }}>Ödeyen</div>
                </div>
                <div style={{ background:'var(--bg)', borderRadius:10, padding:'10px 12px', textAlign:'center', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:'#22C55E' }}>{fmtMoney(paidAmount)}</div>
                  <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2 }}>Toplanan</div>
                </div>
                <div style={{ background:'var(--bg)', borderRadius:10, padding:'10px 12px', textAlign:'center', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:20, fontWeight:800 }}>{fmtMoney(totalDues)}</div>
                  <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2 }}>Toplam Beklenen</div>
                </div>
              </div>

              {/* Üye aidat listesi */}
              {dues.length === 0 ? (
                <EmptyState icon="payments" title="Bu ay için üye bulunamadı" sub="Gruba üye eklendiğinde burada görünür." />
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
                  {dues.map(due => (
                    <div key={due.id} style={{
                      display:'flex', alignItems:'center', gap:10,
                      background: due.is_paid ? '#F0FDF4' : 'var(--bg)',
                      borderRadius:10, padding:'10px 14px',
                      border: `1px solid ${due.is_paid ? '#BBF7D0' : 'var(--border)'}`,
                    }}>
                      <Av name={due.member_name} size="sm" />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{due.member_name}</div>
                        {due.amount > 0 && <div style={{ fontSize:11, color:'var(--text-2)' }}>{fmtMoney(due.amount)}</div>}
                      </div>
                      {due.is_paid && due.paid_at && (
                        <div style={{ fontSize:11, color:'#22C55E' }}>
                          {new Date(due.paid_at).toLocaleDateString('tr-TR', { day:'numeric', month:'short' })}
                        </div>
                      )}
                      <button
                        style={{
                          padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, border:'none', cursor: duesPost ? 'default' : 'pointer',
                          background: due.is_paid ? '#DCFCE7' : '#FEF3C7',
                          color:      due.is_paid ? '#22C55E' : '#F59E0B',
                          opacity: duesPost ? 0.7 : 1,
                        }}
                        onClick={() => toggleDuePaid(due)}
                        disabled={!!duesPost}
                        title={duesPost ? 'Finanslara işlendi, değiştirilemiyor' : ''}
                      >
                        {due.is_paid ? '✓ Ödedi' : 'Ödemedi'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Finansa aktar */}
              {!duesPost && dues.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:8, borderTop:'1px solid var(--border)', paddingTop:14 }}>
                  {coachPct > 0 && (
                    <div style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#7C3AED' }}>
                      Finanslara aktarıldığında: Kulüp <strong>{fmtMoney(totalDues * (duesModal.group.club_percentage ?? 100) / 100)}</strong>
                      {' · '}Koç <strong>{fmtMoney(totalDues * coachPct / 100)}</strong>
                    </div>
                  )}
                  <button
                    className="btn btn-pri"
                    style={{ alignSelf:'flex-start' }}
                    onClick={postToFinance}
                    disabled={posting || paidCount < dues.length}
                    title={paidCount < dues.length ? `Aktarmak için ${dues.length - paidCount} üyenin daha ödemesi gerekiyor` : ''}
                  >
                    <span className="material-icons" style={{fontSize:16}}>account_balance_wallet</span>
                    {posting ? 'İşleniyor…' : `Finanslara Aktar · ${fmtMoney(totalDues)}`}
                  </button>
                  {paidCount < dues.length && (
                    <div style={{ fontSize:12, color:'var(--text-2)' }}>
                      <span className="material-icons" style={{ fontSize:13, verticalAlign:'middle', marginRight:4 }}>lock</span>
                      Tüm üyeler ödenince aktarılabilir ({dues.length - paidCount} eksik)
                    </div>
                  )}
                </div>
              )}

              {duesPost && (
                <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#22C55E' }}>
                  <strong>✓ Bu ay finanslara işlendi.</strong>
                  {' '}Kulüp: <strong>{fmtMoney(duesPost.club_amount)}</strong>
                  {duesPost.coach_amount > 0 && <> · Koç: <strong>{fmtMoney(duesPost.coach_amount)}</strong></>}
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

// Satır içi üye düzenleme yardımcı bileşeni
function EditMemberRow({ member, onSave, onCancel }) {
  const { useState } = React;
  const [vals, setVals] = useState({
    member_name:    member.member_name    || '',
    contact_number: member.contact_number || '',
    contact_person: member.contact_person || '',
  });
  return (
    <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1.5fr auto auto', gap:6, alignItems:'center', background:'#EEF2FF', borderRadius:10, padding:'8px 10px', border:'1px solid #C7D2FE' }}>
      <input value={vals.member_name} placeholder="Üye adı *"
        onChange={e => setVals({...vals, member_name: e.target.value})} style={{ fontSize:13 }} />
      <input value={vals.contact_number} placeholder="Telefon"
        onChange={e => setVals({...vals, contact_number: e.target.value})} style={{ fontSize:13 }} />
      <input value={vals.contact_person} placeholder="Veli / İletişim"
        onChange={e => setVals({...vals, contact_person: e.target.value})} style={{ fontSize:13 }} />
      <button className="btn btn-success btn-sm btn-icon" onClick={() => onSave(member.id, vals)}>
        <span className="material-icons" style={{fontSize:14}}>check</span>
      </button>
      <button className="btn btn-ghost btn-sm btn-icon" onClick={onCancel}>
        <span className="material-icons" style={{fontSize:14}}>close</span>
      </button>
    </div>
  );
}

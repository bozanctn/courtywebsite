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
function GroupsScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [groups,  setGroups]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);

  useEffect(() => { if (clubId) load(); }, [clubId]);

  const load = async () => {
    setLoading(true);
    const { data } = await sb
      .from('club_groups')
      .select('*, club_coaches(profiles(full_name))')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    setGroups(data || []);
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        club_id:     clubId,
        name:        form.name,
        description: form.description || null,
        max_members: form.max_members ? Number(form.max_members) : null,
        coach_id:    form.coach_id    || null,
        is_active:   form.is_active !== false,
      };
      if (modal?.type === 'add') {
        await sb.from('club_groups').insert(payload);
      } else {
        await sb.from('club_groups').update(payload).eq('id', form.id);
      }
      setModal(null);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Bu grubu silmek istediğinize emin misiniz?')) return;
    await sb.from('club_groups').delete().eq('id', id);
    load();
  };

  const [coaches, setCoaches] = useState([]);
  useEffect(() => {
    if (!clubId) return;
    sb.from('club_coaches').select('id,full_name').eq('club_id', clubId).eq('is_active', true)
      .then(({ data }) => setCoaches(data || []));
  }, [clubId]);

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Gruplar</h1>
          <div className="sub">{groups.length} grup</div>
        </div>
        <button className="btn btn-pri" onClick={() => { setForm({ is_active:true }); setModal({ type:'add' }); }}>
          <span className="material-icons">add</span> Grup Oluştur
        </button>
      </div>

      {loading ? <Spinner /> : groups.length === 0 ? (
        <EmptyState icon="groups" title="Henüz grup yok" sub="İlk grubunuzu oluşturun." />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {groups.map(g => (
            <div key={g.id} className="card" style={{ position:'relative' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ fontWeight:800, fontSize:16 }}>{g.name}</div>
                <Badge cls={g.is_active ? 'b-success' : 'b-muted'}>{g.is_active ? 'Aktif' : 'Pasif'}</Badge>
              </div>
              {g.description && <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:10 }}>{g.description}</p>}
              <div style={{ fontSize:12, color:'var(--text-2)', display:'flex', flexDirection:'column', gap:4, marginBottom:14 }}>
                {g.club_coaches?.profiles?.full_name && <span>👤 Koç: {g.club_coaches.profiles.full_name}</span>}
                {g.max_members && <span>👥 Maks. {g.max_members} üye</span>}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex:1 }}
                  onClick={() => { setForm({...g}); setModal({ type:'edit' }); }}>Düzenle</button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(g.id)}>
                  <span className="material-icons" style={{fontSize:15}}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.type === 'add' ? 'Grup Oluştur' : 'Grubu Düzenle'}
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
            <Field label="Grup Adı">
              <input value={form.name || ''} placeholder="Örn: Başlangıç Grubu"
                onChange={e => setForm({...form, name: e.target.value})} />
            </Field>
            <Field label="Açıklama">
              <textarea rows={2} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} style={{ resize:'vertical' }} />
            </Field>
            <div className="fields-2">
              <Field label="Maks. Üye">
                <input type="number" min={1} value={form.max_members || ''} placeholder="Sınırsız"
                  onChange={e => setForm({...form, max_members: e.target.value})} />
              </Field>
              <Field label="Koç">
                <select value={form.coach_id || ''} onChange={e => setForm({...form, coach_id: e.target.value})}>
                  <option value="">Seçin…</option>
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </Field>
            </div>
            <Switch on={form.is_active !== false} onChange={v => setForm({...form, is_active: v})} label="Aktif Grup" />
          </div>
        </Modal>
      )}
    </div>
  );
}

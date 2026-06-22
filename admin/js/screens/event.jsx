// ── Turnuvalar & Gruplar ────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// TURNUVALAR
// ═══════════════════════════════════════════════════════════════
const T_SPORTS = [
  { value: 'padel',      label: 'Padel',      emoji: '🎾' },
  { value: 'tennis',     label: 'Tenis',       emoji: '🎾' },
  { value: 'pickleball', label: 'Pickleball',  emoji: '🏓' },
];
const T_TYPES = [
  { value: 'americano_teams',   label: 'Americano - Takımlar',  emoji: '🔄', desc: 'Partner rotasyonlu 2v2. Her turda eşler değişir.',           scoringType: 'points' },
  { value: 'americano_singles', label: 'Americano - Bireysel',  emoji: '🔄', desc: 'Partner rotasyonlu 1v1. Her turda rakip değişir.',            scoringType: 'points' },
  { value: 'singles_knockout',  label: 'Tekler Eleme',          emoji: '⚡', desc: '1v1 eleme. Kazananlar bir sonraki tura geçer (set bazlı).',  scoringType: 'sets'   },
  { value: 'doubles_knockout',  label: 'Çiftler Eleme',         emoji: '⚡', desc: '2v2 eleme. Kazananlar bir sonraki tura geçer (set bazlı).',  scoringType: 'sets'   },
  { value: 'singles_league',    label: 'Tekler Lig',            emoji: '🏆', desc: '1v1 lig. Herkes herkesle oynar, G=3 B=1 M=0 puan.',         scoringType: 'sets'   },
  { value: 'doubles_league',    label: 'Çiftler Lig',           emoji: '🏆', desc: '2v2 lig. Herkes herkesle oynar, G=3 B=1 M=0 puan.',         scoringType: 'sets'   },
];
const T_GENDERS = [
  { value: 'mixed',  label: 'Karma' },
  { value: 'male',   label: 'Erkekler' },
  { value: 'female', label: 'Kadınlar' },
];
const T_TYPE_LABEL_MAP = {
  americano_teams:   'Americano - Takımlar',
  americano_singles: 'Americano - Bireysel',
  singles_knockout:  'Tekler Eleme',
  doubles_knockout:  'Çiftler Eleme',
  singles_league:    'Tekler Lig',
  doubles_league:    'Çiftler Lig',
};
const T_GENDER_LABEL_MAP = { mixed: 'Karma', male: 'Erkekler', female: 'Kadınlar' };
const T_SPORT_EMOJI = { padel: '🎾', tennis: '🎾', pickleball: '🏓' };

function TournamentsScreen({ clubId, userType }) {
  const { useState, useEffect, useMemo } = React;

  const [tournaments, setTournaments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('upcoming');
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

  const openCreate = () => {
    setForm({
      title: '', description: '', sport: 'padel',
      tournament_type: 'americano_teams', scoring_type: 'points',
      gender: 'mixed', level_min: '1.0', level_max: '3.0',
      max_players: '8', rounds_count: '3', courts_count: '2',
      total_score: '24', entry_fee: '0',
      start_date: '', end_date: '', registration_deadline: '',
      is_public: true, status: 'upcoming',
      prize_1: '', prize_2: '', prize_3: '',
    });
    setModal({ type: 'add' });
  };

  const openEdit = (t) => {
    setForm({
      ...t,
      level_min:   String(t.level_min   ?? '1.0'),
      level_max:   String(t.level_max   ?? '3.0'),
      max_players: String(t.max_players ?? '8'),
      rounds_count: String(t.rounds_count ?? '3'),
      courts_count: String(t.courts_count ?? '2'),
      total_score:  String(t.total_score  ?? '24'),
      entry_fee:    String(t.entry_fee    ?? '0'),
      start_date:            t.start_date            ? t.start_date.slice(0, 16)            : '',
      end_date:              t.end_date              ? t.end_date.slice(0, 16)              : '',
      registration_deadline: t.registration_deadline ? t.registration_deadline.slice(0, 16) : '',
      prize_1: t.prizes?.[0]?.description ?? '',
      prize_2: t.prizes?.[1]?.description ?? '',
      prize_3: t.prizes?.[2]?.description ?? '',
    });
    setModal({ type: 'edit' });
  };

  const pickType = (typeVal) => {
    const found = T_TYPES.find(t => t.value === typeVal);
    setForm(f => ({ ...f, tournament_type: typeVal, scoring_type: found?.scoringType ?? f.scoring_type }));
  };

  const save = async () => {
    if (!form.title?.trim()) { alert('Turnuva başlığı boş olamaz.'); return; }
    if (!form.start_date)    { alert('Başlangıç tarihi zorunludur.'); return; }
    if (!form.end_date)      { alert('Bitiş tarihi zorunludur.'); return; }
    if (form.start_date >= form.end_date) { alert('Başlangıç tarihi bitiş tarihinden önce olmalıdır.'); return; }
    const n = parseInt(form.max_players) || 8;
    if ((form.tournament_type === 'singles_knockout' || form.tournament_type === 'doubles_knockout') && (n & (n - 1)) !== 0) {
      alert('Eleme formatı için oyuncu sayısı 2\'nin kuvveti olmalıdır (4, 8, 16, 32…).');
      return;
    }
    setSaving(true);
    try {
      const prizes = ['prize_1','prize_2','prize_3']
        .map((k, i) => ({ rank: i + 1, description: form[k] || '' }))
        .filter(p => p.description.trim());
      const payload = {
        club_id:               clubId,
        title:                 form.title.trim(),
        description:           form.description?.trim() || null,
        sport:                 form.sport      || 'padel',
        tournament_type:       form.tournament_type || 'americano_teams',
        scoring_type:          form.scoring_type    || 'points',
        gender:                form.gender     || 'mixed',
        level_min:             parseFloat(form.level_min)   || 1.0,
        level_max:             parseFloat(form.level_max)   || 3.0,
        max_players:           n,
        rounds_count:          parseInt(form.rounds_count)  || 3,
        courts_count:          parseInt(form.courts_count)  || 2,
        total_score:           parseInt(form.total_score)   || 24,
        entry_fee:             parseFloat(form.entry_fee)   || 0,
        prizes:                prizes.length > 0 ? prizes : null,
        start_date:            form.start_date            || null,
        end_date:              form.end_date              || null,
        registration_deadline: form.registration_deadline || null,
        is_public:             form.is_public !== false,
        status:                form.status || 'upcoming',
      };
      if (modal.type === 'add') {
        payload.current_players = 0;
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

  const filtered = useMemo(() => tournaments.filter(t => {
    if (activeTab === 'upcoming')  return t.status === 'upcoming';
    if (activeTab === 'ongoing')   return t.status === 'ongoing' || t.status === 'active';
    return t.status === 'completed' || t.status === 'cancelled';
  }), [tournaments, activeTab]);

  const tBadge = (t) => {
    const s = t.status;
    if (s === 'upcoming')               return { label: 'YAKLAŞAN',     bg: '#EEF2FF', color: 'var(--brand-navy)' };
    if (s === 'ongoing' || s === 'active') return { label: 'DEVAM EDİYOR', bg: '#DCFCE7', color: '#22C55E' };
    if (s === 'completed')              return { label: 'TAMAMLANDI',   bg: '#F1F5F9', color: 'var(--text-2)' };
    return                                     { label: 'İPTAL',        bg: '#FEF2F2', color: '#EF4444' };
  };

  if (detailId) {
    return <ManageTournamentScreen tournamentId={detailId} onBack={() => { setDetailId(null); load(); }} />;
  }

  const tabItems = [
    { key: 'upcoming',  label: 'Yaklaşan' },
    { key: 'ongoing',   label: 'Devam Eden' },
    { key: 'completed', label: 'Geçmiş' },
  ];

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Turnuvalar</h1>
          <div className="sub">{tournaments.length} turnuva</div>
        </div>
        <button className="btn btn-pri" onClick={openCreate}>
          <span className="material-icons">add</span> Turnuva Oluştur
        </button>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom:16 }}>
        <Tabs items={tabItems} active={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="emoji_events"
          title={activeTab === 'upcoming' ? 'Yaklaşan turnuva yok' : activeTab === 'ongoing' ? 'Devam eden turnuva yok' : 'Geçmiş turnuva yok'}
          sub={activeTab === 'upcoming' ? 'İlk turnuvanızı oluşturun.' : ''}
        />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {filtered.map(t => {
            const badge = tBadge(t);
            return (
              <div key={t.id} className="card" style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {/* Başlık + badge */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div style={{ fontWeight:800, fontSize:15, flex:1 }}>
                    {T_SPORT_EMOJI[t.sport] ?? '🎾'} {t.title || <span style={{ color:'var(--text-2)', fontStyle:'italic', fontWeight:400 }}>İsimsiz</span>}
                  </div>
                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0, background:badge.bg, color:badge.color }}>
                    {badge.label}
                  </span>
                </div>

                {t.description && <p style={{ fontSize:13, color:'var(--text-2)', margin:0 }}>{t.description}</p>}

                {/* Bilgi satırları */}
                <div style={{ display:'flex', flexDirection:'column', gap:4, fontSize:12, color:'var(--text-2)' }}>
                  {t.tournament_type && (
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <span className="material-icons" style={{fontSize:13}}>format_list_bulleted</span>
                      {T_TYPE_LABEL_MAP[t.tournament_type] || t.tournament_type}
                    </span>
                  )}
                  {t.start_date && (
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <span className="material-icons" style={{fontSize:13}}>event</span>
                      {fmtDate(t.start_date)}{t.end_date ? ` — ${fmtDate(t.end_date)}` : ''}
                    </span>
                  )}
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span className="material-icons" style={{fontSize:13}}>people</span>
                    {t.current_players ?? 0}/{t.max_players} oyuncu
                    {t.gender ? ` · ${T_GENDER_LABEL_MAP[t.gender] || t.gender}` : ''}
                  </span>
                  {(t.level_min != null || t.level_max != null) && (
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <span className="material-icons" style={{fontSize:13}}>bar_chart</span>
                      Seviye {t.level_min ?? '?'}–{t.level_max ?? '?'}
                    </span>
                  )}
                  {t.entry_fee > 0 && (
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <span className="material-icons" style={{fontSize:13}}>payments</span>
                      {fmtMoney(t.entry_fee)} giriş ücreti
                    </span>
                  )}
                </div>

                <div style={{ height:1, background:'var(--border)' }} />

                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-pri btn-sm" style={{ flex:1 }} onClick={() => setDetailId(t.id)}>
                    <span className="material-icons" style={{fontSize:14}}>sports_tennis</span> Yönet
                  </button>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(t)}>
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

      {/* ══ TURNUVA OLUŞTUR / DÜZENLE MODALI ══ */}
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
          <div className="fields" style={{ gap:16 }}>

            {/* Temel Bilgiler */}
            <Field label="Turnuva Başlığı *">
              <input value={form.title || ''} placeholder="örn. Yaz Padel Turnuvası 2025"
                onChange={e => setForm({...form, title: e.target.value})} />
            </Field>
            <Field label="Açıklama">
              <textarea rows={2} value={form.description || ''} placeholder="Turnuva hakkında kısa açıklama…"
                onChange={e => setForm({...form, description: e.target.value})} style={{ resize:'vertical' }} />
            </Field>

            {/* Spor */}
            <Field label="SPOR">
              <div style={{ display:'flex', gap:8 }}>
                {T_SPORTS.map(s => (
                  <button key={s.value} type="button"
                    className={'btn btn-sm ' + (form.sport === s.value ? 'btn-pri' : 'btn-ghost')}
                    style={{ flex:1 }}
                    onClick={() => setForm({...form, sport: s.value})}>
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Format */}
            <Field label="TURNUVA FORMATI">
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {T_TYPES.map(t => {
                  const sel = form.tournament_type === t.value;
                  return (
                    <div key={t.value} onClick={() => pickType(t.value)}
                      style={{
                        display:'flex', alignItems:'center', gap:12,
                        padding:'10px 14px', borderRadius:12, cursor:'pointer', userSelect:'none',
                        border:`1.5px solid ${sel ? 'var(--brand-navy)' : 'var(--border)'}`,
                        background: sel ? '#EEF2FF' : 'transparent',
                      }}>
                      <span style={{ fontSize:20, flexShrink:0, width:30, textAlign:'center' }}>{t.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color: sel ? 'var(--brand-navy)' : 'var(--text-1)' }}>{t.label}</div>
                        <div style={{ fontSize:11, color:'var(--text-2)', marginTop:2 }}>{t.desc}</div>
                      </div>
                      {sel && <span className="material-icons" style={{ color:'var(--brand-navy)', fontSize:18 }}>check_circle</span>}
                    </div>
                  );
                })}
              </div>
            </Field>

            {/* Cinsiyet */}
            <Field label="CİNSİYET">
              <div style={{ display:'flex', gap:8 }}>
                {T_GENDERS.map(g => (
                  <button key={g.value} type="button"
                    className={'btn btn-sm ' + (form.gender === g.value ? 'btn-pri' : 'btn-ghost')}
                    style={{ flex:1 }}
                    onClick={() => setForm({...form, gender: g.value})}>
                    {g.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Seviye & Oyuncu */}
            <div className="fields-2">
              <Field label="Min Seviye">
                <input type="number" min={0} max={10} step={0.5} value={form.level_min ?? '1.0'} placeholder="1.0"
                  onChange={e => setForm({...form, level_min: e.target.value})} />
              </Field>
              <Field label="Max Seviye">
                <input type="number" min={0} max={10} step={0.5} value={form.level_max ?? '3.0'} placeholder="3.0"
                  onChange={e => setForm({...form, level_max: e.target.value})} />
              </Field>
            </div>
            <div className="fields-2">
              <Field label="Oyuncu Sayısı">
                <input type="number" min={2} value={form.max_players ?? '8'} placeholder="8"
                  onChange={e => setForm({...form, max_players: e.target.value})} />
              </Field>
              <Field label="Kort Sayısı">
                <input type="number" min={1} value={form.courts_count ?? '2'} placeholder="2"
                  onChange={e => setForm({...form, courts_count: e.target.value})} />
              </Field>
            </div>
            <div className="fields-2">
              {(form.tournament_type === 'americano_teams' || form.tournament_type === 'americano_singles') && (
                <Field label="Tur Sayısı">
                  <input type="number" min={1} value={form.rounds_count ?? '3'} placeholder="3"
                    onChange={e => setForm({...form, rounds_count: e.target.value})} />
                </Field>
              )}
              {form.scoring_type === 'points' && (
                <Field label="Toplam Skor">
                  <input type="number" min={1} value={form.total_score ?? '24'} placeholder="24"
                    onChange={e => setForm({...form, total_score: e.target.value})} />
                </Field>
              )}
              <Field label="Katılım Ücreti (₺)">
                <input type="number" min={0} step={1} value={form.entry_fee ?? '0'} placeholder="0"
                  onChange={e => setForm({...form, entry_fee: e.target.value})} />
              </Field>
            </div>

            {/* Tarihler */}
            <div className="fields-2">
              <Field label="Başlangıç Tarihi *">
                <input type="datetime-local" value={form.start_date || ''}
                  onChange={e => setForm({...form, start_date: e.target.value})} />
              </Field>
              <Field label="Bitiş Tarihi *">
                <input type="datetime-local" value={form.end_date || ''}
                  onChange={e => setForm({...form, end_date: e.target.value})} />
              </Field>
            </div>
            <Field label="Son Kayıt Tarihi (isteğe bağlı)">
              <input type="datetime-local" value={form.registration_deadline || ''}
                onChange={e => setForm({...form, registration_deadline: e.target.value})} />
            </Field>

            {/* Görünürlük */}
            <Field label="GÖRÜNÜRLÜK">
              <div style={{ display:'flex', gap:8 }}>
                <button type="button"
                  className={'btn btn-sm ' + (form.is_public !== false ? 'btn-pri' : 'btn-ghost')}
                  style={{ flex:1 }}
                  onClick={() => setForm({...form, is_public: true})}>
                  🌐 Herkese Açık
                </button>
                <button type="button"
                  className={'btn btn-sm ' + (form.is_public === false ? 'btn-pri' : 'btn-ghost')}
                  style={{ flex:1 }}
                  onClick={() => setForm({...form, is_public: false})}>
                  🔒 Sadece Üyeler
                </button>
              </div>
            </Field>

            {/* Ödüller */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                Ödüller (isteğe bağlı)
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[['prize_1','🥇 1. Sıra'], ['prize_2','🥈 2. Sıra'], ['prize_3','🥉 3. Sıra']].map(([key, label]) => (
                  <div key={key} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:12, color:'var(--text-2)', minWidth:74 }}>{label}</span>
                    <input value={form[key] || ''} placeholder="Ödül açıklaması…"
                      onChange={e => setForm({...form, [key]: e.target.value})}
                      style={{ flex:1, fontSize:13 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Durum — sadece düzenleme modunda */}
            {modal.type === 'edit' && (
              <Field label="DURUM">
                <select value={form.status || 'upcoming'} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="upcoming">Yaklaşan</option>
                  <option value="ongoing">Devam Ediyor</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal</option>
                </select>
              </Field>
            )}
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
const DAY_LABELS = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
const DAY_NAMES_FULL = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const formatH = (h, use15) => {
  const whole = Math.floor(h);
  const frac  = h % 1;
  let min;
  if (use15) {
    min = frac >= 0.875 ? '45' : frac >= 0.625 ? '30' : frac >= 0.375 ? '15' : frac >= 0.125 ? '00' : '00';
    if (frac >= 0.875) min = '45';
    else if (frac >= 0.625) min = '30';
    else if (frac >= 0.375) min = '15';
    else min = '00';
  } else {
    min = frac >= 0.5 ? '30' : '00';
  }
  return String(whole).padStart(2,'0') + ':' + min;
};

function HourStepper({ value, onChange, min = 0, max = 23.5, step = 0.5 }) {
  const fmt = formatH(value, step === 0.25);
  return (
    <div style={{ display:'flex', alignItems:'center', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onChange(Math.max(min, Math.round((value - step) * 100) / 100))}>
        <span className="material-icons" style={{fontSize:16}}>remove</span>
      </button>
      <span style={{ minWidth:52, textAlign:'center', fontWeight:700, fontSize:14 }}>{fmt}</span>
      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onChange(Math.min(max, Math.round((value + step) * 100) / 100))}>
        <span className="material-icons" style={{fontSize:16}}>add</span>
      </button>
    </div>
  );
}

// daySettings format: { [dayIdx]: { courts: string[], start: number, end: number }[] }
const makeSlot = () => ({ courts: [], start: 9, end: 11 });

function PerDayScheduleSection({
  schedCourts, coaches,
  schedSelDays, setSchedSelDays,
  daySettings, setDaySettings,
  schedSelCoaches, setSchedSelCoaches,
  diffCoachPerDay, setDiffCoachPerDay,
  dayCoachIds, setDayCoachIds,
  schedConflicts, schedChecking, compact,
  use15Min, setUse15Min,
}) {
  const step = use15Min ? 0.25 : 0.5;

  const toggleDay = (i) => {
    if (schedSelDays.includes(i)) {
      setSchedSelDays(prev => prev.filter(x => x !== i));
      setDaySettings(ds => { const n = {...ds}; delete n[i]; return n; });
      setDayCoachIds(dc => { const n = {...dc}; delete n[i]; return n; });
    } else {
      setSchedSelDays(prev => [...prev, i].sort((a, b) => a - b));
      setDaySettings(ds => ({ ...ds, [i]: ds[i] ?? [makeSlot()] }));
    }
  };

  const updateSlot = (dayIdx, slotIdx, patch) => {
    setDaySettings(prev => {
      const slots = [...(prev[dayIdx] ?? [makeSlot()])];
      slots[slotIdx] = { ...slots[slotIdx], ...patch };
      return { ...prev, [dayIdx]: slots };
    });
  };

  const toggleSlotCourt = (dayIdx, slotIdx, courtId) => {
    setDaySettings(prev => {
      const slots = [...(prev[dayIdx] ?? [makeSlot()])];
      const cur = slots[slotIdx].courts ?? [];
      slots[slotIdx] = { ...slots[slotIdx], courts: cur.includes(courtId) ? cur.filter(x => x !== courtId) : [...cur, courtId] };
      return { ...prev, [dayIdx]: slots };
    });
  };

  const addSlot = (dayIdx) => {
    setDaySettings(prev => {
      const slots = prev[dayIdx] ?? [makeSlot()];
      const last = slots[slots.length - 1];
      return { ...prev, [dayIdx]: [...slots, { courts: [...last.courts], start: last.end, end: Math.min(23, last.end + 2) }] };
    });
  };

  const removeSlot = (dayIdx, slotIdx) => {
    setDaySettings(prev => {
      const slots = (prev[dayIdx] ?? [makeSlot()]).filter((_, i) => i !== slotIdx);
      return { ...prev, [dayIdx]: slots.length ? slots : [makeSlot()] };
    });
  };

  const toggleDayCoach = (dayIdx, coachId) => {
    setDayCoachIds(prev => {
      const cur = prev[dayIdx] || [];
      const next = cur.includes(coachId) ? cur.filter(x => x !== coachId) : [...cur, coachId];
      return { ...prev, [dayIdx]: next };
    });
  };

  const sortedDays = [...schedSelDays].sort((a, b) => a - b);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, ...(compact ? { borderTop:'1px solid var(--border)', paddingTop:14 } : {}) }}>
      {compact && (
        <div style={{ fontWeight:700, fontSize:13, color:'var(--text-2)', display:'flex', alignItems:'center', gap:6 }}>
          <span className="material-icons" style={{fontSize:15}}>event_repeat</span>
          Haftalık Program (isteğe bağlı)
        </div>
      )}

      {/* 15 dakika toggle */}
      {setUse15Min && (
        <Switch
          on={!!use15Min}
          onChange={setUse15Min}
          label="15 Dakikalık Artış (22:15 gibi saatler)"
        />
      )}

      {/* Gün seçimi */}
      <Field label="GÜNLER">
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {DAY_LABELS.map((d, i) => (
            <button key={d} type="button"
              className={'btn btn-sm ' + (schedSelDays.includes(i) ? 'btn-pri' : 'btn-ghost')}
              style={{ flex:1, minWidth:40 }}
              onClick={() => toggleDay(i)}>
              {d}
            </button>
          ))}
        </div>
      </Field>

      {/* Global antrenör (unless diffCoachPerDay) */}
      {schedSelDays.length > 0 && coaches.length > 0 && (
        <Field label="ANTRENÖRLER">
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:6 }}>
            {!diffCoachPerDay && coaches.map(c => (
              <button key={c.id} type="button"
                className={'btn btn-sm ' + (schedSelCoaches.includes(c.id) ? 'btn-pri' : 'btn-ghost')}
                onClick={() => setSchedSelCoaches(prev =>
                  prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id]
                )}>
                {c.full_name}
              </button>
            ))}
            {diffCoachPerDay && <span style={{ fontSize:12, color:'var(--text-2)' }}>Antrenörler gün bazında atanıyor</span>}
          </div>
          {schedSelDays.length > 1 && (
            <Switch
              on={diffCoachPerDay}
              onChange={v => setDiffCoachPerDay(v)}
              label="Her gün farklı antrenör"
            />
          )}
        </Field>
      )}

      {/* Per-day cards */}
      {sortedDays.map(dayIdx => {
        const slots = daySettings[dayIdx] ?? [makeSlot()];
        return (
          <div key={dayIdx} style={{
            background:'var(--bg)', border:'1px solid var(--border)', borderRadius:12,
            padding:'12px 14px', display:'flex', flexDirection:'column', gap:12
          }}>
            {/* Gün başlığı + seans ekle */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700, fontSize:13, color:'var(--brand-navy)', display:'flex', alignItems:'center', gap:6 }}>
                <span className="material-icons" style={{fontSize:14}}>calendar_today</span>
                {DAY_NAMES_FULL[dayIdx]}
              </div>
              <button type="button" className="btn btn-ghost btn-sm"
                style={{ fontSize:12, color:'#0D9488' }}
                onClick={() => addSlot(dayIdx)}>
                <span className="material-icons" style={{fontSize:14}}>add</span> Seans Ekle
              </button>
            </div>

            {/* Per-day antrenörler */}
            {diffCoachPerDay && coaches.length > 0 && (
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>Antrenör</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {coaches.map(c => {
                    const sel = (dayCoachIds[dayIdx] || []).includes(c.id);
                    return (
                      <button key={c.id} type="button"
                        className={'btn btn-sm ' + (sel ? 'btn-pri' : 'btn-ghost')}
                        onClick={() => toggleDayCoach(dayIdx, c.id)}>
                        {c.full_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Slot listesi */}
            {slots.map((sl, slotIdx) => {
              const timeError = sl.start >= sl.end;
              return (
                <div key={slotIdx} style={{
                  background: slotIdx === 0 ? 'transparent' : 'var(--surface, #fff)',
                  border: slots.length > 1 ? '1px dashed var(--border)' : 'none',
                  borderRadius: 10, padding: slots.length > 1 ? '10px 12px' : 0,
                  display:'flex', flexDirection:'column', gap:10,
                }}>
                  {/* Seans başlığı (birden fazlaysa) */}
                  {slots.length > 1 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--text-2)' }}>Seans {slotIdx + 1}</span>
                      <button type="button" className="btn btn-danger btn-sm btn-icon"
                        onClick={() => removeSlot(dayIdx, slotIdx)}
                        title="Bu seansı kaldır">
                        <span className="material-icons" style={{fontSize:14}}>close</span>
                      </button>
                    </div>
                  )}

                  {/* Kortlar */}
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>Kort</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {schedCourts.map(c => (
                        <button key={c.id} type="button"
                          className={'btn btn-sm ' + ((sl.courts ?? []).includes(c.id) ? 'btn-pri' : 'btn-ghost')}
                          onClick={() => toggleSlotCourt(dayIdx, slotIdx, c.id)}>
                          Kort {c.court_number}
                        </button>
                      ))}
                      {schedCourts.length === 0 && <span style={{ fontSize:12, color:'var(--text-2)' }}>Aktif kort yok</span>}
                    </div>
                  </div>

                  {/* Saat */}
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>Saat Aralığı</div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <HourStepper value={sl.start} onChange={v => updateSlot(dayIdx, slotIdx, { start: v })} min={0} max={22.5} step={step} />
                      <span className="material-icons" style={{color:'var(--text-2)', fontSize:18}}>arrow_forward</span>
                      <HourStepper value={sl.end} onChange={v => updateSlot(dayIdx, slotIdx, { end: v })} min={0.5} max={23} step={step} />
                    </div>
                    {timeError && (
                      <div style={{ marginTop:6, color:'#EF4444', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                        <span className="material-icons" style={{fontSize:13}}>error_outline</span>
                        Bitiş saati başlangıçtan büyük olmalı
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Çakışma durumu */}
      {schedSelDays.length > 0 && (
        <div>
          {schedChecking ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--text-2)', fontSize:13 }}>
              <span className="material-icons" style={{fontSize:16}}>refresh</span>
              Çakışma kontrolü yapılıyor…
            </div>
          ) : schedConflicts.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:6,
              background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'9px 12px' }}>
              <span className="material-icons" style={{color:'#22C55E', fontSize:16}}>check_circle</span>
              <span style={{ fontSize:13, color:'#22C55E', fontWeight:600 }}>Çakışma yok</span>
            </div>
          ) : (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <span className="material-icons" style={{color:'#F59E0B', fontSize:15}}>warning</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#F59E0B' }}>
                  {schedConflicts.length} çakışma — program kaydedilemez
                </span>
              </div>
              {schedConflicts.map((c, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'flex-start', gap:8, borderRadius:8,
                  padding:'7px 10px', marginBottom:4,
                  background: c.type === 'court' ? '#FEF2F2' : '#FFFBEB',
                  border: `1px solid ${c.type === 'court' ? '#FECACA' : '#FDE68A'}`,
                }}>
                  <span className="material-icons" style={{ fontSize:13, marginTop:1,
                    color: c.type === 'court' ? '#EF4444' : '#F59E0B' }}>
                    {c.type === 'court' ? 'sports_tennis' : 'person'}
                  </span>
                  <span style={{ fontSize:12 }}>{c.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GroupsScreen({ clubId }) {
  const { useState, useEffect } = React;

  // ── Ana liste ─────────────────────────────────────────────────
  const [groups,   setGroups]   = useState([]);
  const [coaches,  setCoaches]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  // ── Grup oluştur / düzenle modalı ────────────────────────────
  const [groupModal,       setGroupModal]       = useState(null); // null | {type:'add'|'edit', group?}
  const [form,             setForm]             = useState({});
  const [newMembers,       setNewMembers]       = useState([]);   // sadece 'add' modunda
  const [saving,           setSaving]           = useState(false);
  const [selectedCoachIds, setSelectedCoachIds] = useState([]);
  const [coachShares,      setCoachShares]      = useState({});   // {coachId: '50'}
  const [splitType,        setSplitType]        = useState('percentage');
  const [coachFixedAmounts,setCoachFixedAmounts]= useState({});   // {coachId: '500'}
  const [use15Min,         setUse15Min]         = useState(false);

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

  // ── Program atama modalı ─────────────────────────────────────
  const [schedModal,      setSchedModal]      = useState(null);
  const [schedCourts,     setSchedCourts]     = useState([]);
  const [schedSelDays,    setSchedSelDays]    = useState([]);
  const [schedSelCoaches, setSchedSelCoaches] = useState([]);
  const [daySettings,     setDaySettings]     = useState({}); // {[dayIdx]: {courts:[], start:number, end:number}}
  const [diffCoachPerDay, setDiffCoachPerDay] = useState(false);
  const [dayCoachIds,     setDayCoachIds]     = useState({}); // {[dayIdx]: string[]}
  const [schedConflicts,  setSchedConflicts]  = useState([]);
  const [schedChecking,   setSchedChecking]   = useState(false);
  const [schedSaving,     setSchedSaving]     = useState(false);
  const [schedDebounce,   setSchedDebounce]   = useState(null);

  useEffect(() => { if (clubId) { loadGroups(); loadCoaches(); } }, [clubId]);

  // ── Veri yükleme ─────────────────────────────────────────────
  const loadGroups = async () => {
    setLoading(true);
    const { data } = await sb
      .from('club_groups')
      .select('*, coach:club_coaches(id, full_name), members:club_group_members(*)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });

    const groupIds = (data || []).map(g => g.id);
    let schedMap = {};
    if (groupIds.length > 0) {
      const { data: closures } = await sb
        .from('court_closures')
        .select('group_id, day_of_week, start_hour, start_minute, end_hour, end_minute, courts(court_number)')
        .in('group_id', groupIds)
        .eq('is_active', true);
      const DAY_SHORT = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
      for (const c of closures ?? []) {
        if (!schedMap[c.group_id]) schedMap[c.group_id] = [];
        schedMap[c.group_id].push(c);
      }
      // Her grup için benzersiz gün+saat kombinasyonlarını özetle
      for (const gid of Object.keys(schedMap)) {
        const rows = schedMap[gid];
        const seenDays = new Set();
        const dayLabels = [];
        for (const r of rows) {
          const dk = `${r.day_of_week}_${r.start_hour}_${r.start_minute ?? 0}_${r.end_hour}_${r.end_minute ?? 0}`;
          if (seenDays.has(dk)) continue;
          seenDays.add(dk);
          const sh = String(r.start_hour).padStart(2,'0') + ':' + String(r.start_minute ?? 0).padStart(2,'0');
          const eh = String(r.end_hour).padStart(2,'0')   + ':' + String(r.end_minute   ?? 0).padStart(2,'0');
          dayLabels.push(`${DAY_SHORT[r.day_of_week]} ${sh}–${eh}`);
        }
        schedMap[gid] = dayLabels.join(' · ');
      }
    }

    setGroups((data || []).map(g => ({
      ...g,
      member_count: g.members?.length ?? 0,
      _schedule: schedMap[g.id] || null,
    })));
    setLoading(false);
  };

  const loadCoaches = async () => {
    const { data } = await sb.from('club_coaches').select('id,full_name').eq('club_id', clubId).eq('is_active', true);
    setCoaches(data || []);
  };

  // ── Program atama ─────────────────────────────────────────────
  const buildPerDayState = (existing, fallbackCoachId) => {
    const days = [...new Set(existing.map(c => c.day_of_week))];
    const newDaySettings = {}; // { [day]: slot[] }
    const newDayCoachIds = {};
    for (const day of days) {
      const dc = existing.filter(c => c.day_of_week === day);
      // Group by unique (start_hour, start_minute, end_hour, end_minute) → one slot per time range
      const slotMap = {};
      for (const c of dc) {
        const key = `${c.start_hour}_${c.start_minute ?? 0}_${c.end_hour}_${c.end_minute ?? 0}`;
        if (!slotMap[key]) {
          slotMap[key] = {
            courts: [],
            start: c.start_hour + (c.start_minute ?? 0) / 60,
            end:   c.end_hour   + (c.end_minute   ?? 0) / 60,
          };
        }
        if (c.court_id && !slotMap[key].courts.includes(c.court_id)) {
          slotMap[key].courts.push(c.court_id);
        }
      }
      newDaySettings[day] = Object.values(slotMap);
      if (newDaySettings[day].length === 0) newDaySettings[day] = [{ courts: [], start: 9, end: 11 }];
      const cIds = [...new Set(dc.filter(c => c.coach_id).map(c => c.coach_id))];
      if (cIds.length > 0) newDayCoachIds[day] = cIds;
    }
    const allCoachIds = [...new Set(existing.filter(c => c.coach_id).map(c => c.coach_id))];
    const globalCoachIds = allCoachIds.length > 0 ? allCoachIds : (fallbackCoachId ? [fallbackCoachId] : []);
    const hasDiff = days.length > 1 && Object.keys(newDayCoachIds).length > 0 && days.some(d => {
      const a = (newDayCoachIds[days[0]] || []).slice().sort().join(',');
      const b = (newDayCoachIds[d] || []).slice().sort().join(',');
      return a !== b;
    });
    return { days, newDaySettings, newDayCoachIds, globalCoachIds, hasDiff };
  };

  const openSchedule = async (group) => {
    const { data: courtData } = await sb.from('courts')
      .select('id, court_number, court_type')
      .eq('club_id', clubId).eq('is_active', true).order('court_number');
    setSchedCourts(courtData ?? []);

    const existing = await GroupScheduleSvc.getGroupSchedule(group.id);
    const { days, newDaySettings, newDayCoachIds, globalCoachIds, hasDiff } = buildPerDayState(existing, group.coach_id);
    setSchedSelDays(days);
    setDaySettings(newDaySettings);
    setDayCoachIds(newDayCoachIds);
    setSchedSelCoaches(globalCoachIds);
    setDiffCoachPerDay(hasDiff);
    setSchedConflicts([]);
    setUse15Min(false);
    setSchedModal({ group });
  };

  useEffect(() => {
    if (!schedModal && !groupModal) return;
    if (schedSelDays.length === 0) { setSchedConflicts([]); return; }
    if (schedDebounce) clearTimeout(schedDebounce);
    const activeGroupId = schedModal?.group?.id ?? form?.id ?? null;
    const t = setTimeout(async () => {
      setSchedChecking(true);
      try {
        const conflicts = await GroupScheduleSvc.checkConflictsPerDay(
          activeGroupId, daySettings, schedSelDays,
          coaches, schedSelCoaches, diffCoachPerDay, dayCoachIds
        );
        setSchedConflicts(conflicts);
      } catch (e) { console.error(e); }
      setSchedChecking(false);
    }, 400);
    setSchedDebounce(t);
  }, [schedSelDays, daySettings, schedSelCoaches, diffCoachPerDay, dayCoachIds, schedModal, groupModal]);

  const saveSchedule = async () => {
    if (!schedSelDays.length) { alert('En az bir gün seçin'); return; }
    for (const d of schedSelDays) {
      const slots = daySettings[d] ?? [];
      if (!slots.length || slots.every(sl => !sl.courts?.length)) { alert(`${DAY_NAMES_FULL[d]} için en az bir seansa kort seçin`); return; }
      for (const sl of slots) {
        if ((sl.start ?? 9) >= (sl.end ?? 11)) { alert(`${DAY_NAMES_FULL[d]}: Bitiş saati başlangıçtan büyük olmalı`); return; }
      }
    }
    if (schedConflicts.length)  { alert('Çakışmalar giderilmeden kaydedilemez'); return; }
    setSchedSaving(true);
    try {
      await GroupScheduleSvc.saveGroupSchedulePerDay(
        schedModal.group.id, schedModal.group.name,
        daySettings, schedSelDays, schedSelCoaches,
        diffCoachPerDay, dayCoachIds
      );
      setSchedModal(null);
      loadGroups();
    } catch (e) { alert(e.message); }
    finally { setSchedSaving(false); }
  };

  const clearSchedule = async () => {
    if (!confirm('Bu grubun programı silinsin mi?')) return;
    await sb.from('court_closures').delete().eq('group_id', schedModal.group.id);
    setSchedModal(null);
    loadGroups();
  };

  // ── Grup oluştur ─────────────────────────────────────────────
  const openCreate = async () => {
    setForm({ name: '', description: '', monthly_fee: '', club_percentage: 100, is_active: true });
    setNewMembers([
      { member_name: '', contact_number: '', contact_person: '', custom_fee: '' },
      { member_name: '', contact_number: '', contact_person: '', custom_fee: '' },
    ]);
    setSelectedCoachIds([]); setCoachShares({}); setSplitType('percentage'); setCoachFixedAmounts({});
    setUse15Min(false);
    const { data: courtData } = await sb.from('courts')
      .select('id, court_number, court_type')
      .eq('club_id', clubId).eq('is_active', true).order('court_number');
    setSchedCourts(courtData ?? []);
    setSchedSelDays([]); setSchedSelCoaches([]);
    setDaySettings({}); setDiffCoachPerDay(false); setDayCoachIds({});
    setSchedConflicts([]); setUse15Min(false);
    setGroupModal({ type: 'add' });
  };

  const openEdit = async (g) => {
    setForm({
      id: g.id, name: g.name, description: g.description || '',
      monthly_fee: g.monthly_fee ?? '', club_percentage: g.club_percentage ?? 100,
      is_active: g.is_active, split_type: g.split_type || 'percentage',
    });
    // Load coaches from club_group_coaches
    const groupCoaches = g.coaches && g.coaches.length > 0 ? g.coaches : [];
    const ids = groupCoaches.map(c => c.id);
    setSelectedCoachIds(ids);
    setSplitType(g.split_type || 'percentage');
    const shares = {}; const fixedAmts = {};
    groupCoaches.forEach(c => {
      shares[c.id] = String(c.share_percentage ?? '');
      fixedAmts[c.id] = c.fixed_amount != null ? String(c.fixed_amount) : '';
    });
    setCoachShares(shares);
    setCoachFixedAmounts(fixedAmts);
    setUse15Min(false);
    const { data: courtData } = await sb.from('courts')
      .select('id, court_number, court_type')
      .eq('club_id', clubId).eq('is_active', true).order('court_number');
    setSchedCourts(courtData ?? []);
    const existing = await GroupScheduleSvc.getGroupSchedule(g.id);
    const { days, newDaySettings, newDayCoachIds, globalCoachIds, hasDiff } = buildPerDayState(existing, g.coach_id);
    setSchedSelDays(days);
    setDaySettings(newDaySettings);
    setDayCoachIds(newDayCoachIds);
    setSchedSelCoaches(globalCoachIds);
    setDiffCoachPerDay(hasDiff);
    setSchedConflicts([]);
    setGroupModal({ type: 'edit', group: g });
  };

  const updateNewMember = (idx, field, val) => {
    setNewMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  const addNewMemberRow = () => {
    setNewMembers(prev => [...prev, { member_name: '', contact_number: '', contact_person: '', custom_fee: '' }]);
  };

  const removeNewMemberRow = (idx) => {
    setNewMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const saveGroup = async () => {
    if (!form.name?.trim()) { alert('Grup adı zorunludur.'); return; }
    if (groupModal.type === 'add') {
      const valid = newMembers.filter(m => m.member_name.trim());
      if (valid.length < 2) { alert('Grup oluşturmak için en az 2 üye gereklidir.'); return; }
    }
    if (schedConflicts.length) { alert('Program çakışmaları giderilmeden kaydedilemez.'); return; }
    for (const d of schedSelDays) {
      const slots = daySettings[d] ?? [{ start: 9, end: 11 }];
      for (const sl of slots) {
        if ((sl.start ?? 9) >= (sl.end ?? 11)) {
          alert(`${DAY_NAMES_FULL[d]}: Bitiş saati başlangıçtan büyük olmalı.`); return;
        }
      }
    }
    const clubPct = Number(form.club_percentage);
    if (splitType === 'percentage' && !isNaN(clubPct) && form.club_percentage !== '' && (clubPct < 0 || clubPct > 100)) {
      alert('Kulüp yüzdesi 0-100 arasında olmalıdır.'); return;
    }
    // Validate coach shares sum to 100 for percentage mode
    if (splitType === 'percentage' && selectedCoachIds.length > 1) {
      const total = selectedCoachIds.reduce((s, id) => s + (parseFloat(coachShares[id]) || 0), 0);
      if (Math.abs(total - 100) > 0.1) {
        alert(`Antrenör payları toplamı %100 olmalı (şu an: %${total.toFixed(1)})`); return;
      }
    }
    setSaving(true);
    try {
      const primaryCoachId = selectedCoachIds[0] || null;
      const payload = {
        name:            form.name.trim(),
        description:     form.description?.trim() || null,
        monthly_fee:     form.monthly_fee !== '' ? Number(form.monthly_fee) : 0,
        club_percentage: splitType === 'percentage' ? (Number(form.club_percentage) || 100) : 100,
        split_type:      splitType,
        coach_id:        primaryCoachId,
        is_active:       form.is_active !== false,
      };

      // Build club_group_coaches rows
      const coachRows = selectedCoachIds.map((coachId, i) => {
        const equalShare = parseFloat((100 / selectedCoachIds.length).toFixed(2));
        return {
          coach_id: coachId,
          share_percentage: selectedCoachIds.length === 1 ? 100
            : (i === selectedCoachIds.length - 1
              ? parseFloat((100 - equalShare * (selectedCoachIds.length - 1)).toFixed(2))
              : parseFloat(coachShares[coachId]) || equalShare),
          fixed_amount: splitType === 'fixed_amount'
            ? (parseFloat(coachFixedAmounts[coachId] ?? '') || null)
            : null,
        };
      });

      let savedGroupId = form.id;
      if (groupModal.type === 'add') {
        const validMembers = newMembers
          .filter(m => m.member_name.trim())
          .map(m => ({
            member_name:    m.member_name.trim(),
            contact_number: m.contact_number?.trim() || null,
            contact_person: m.contact_person?.trim() || null,
            custom_fee:     m.custom_fee?.trim() ? parseFloat(m.custom_fee) : null,
          }));
        const created = await GroupSvc.createGroup(clubId, payload, validMembers, coachRows);
        savedGroupId = created?.id ?? savedGroupId;
      } else {
        await GroupSvc.updateGroup(form.id, payload, coachRows);
      }
      if (savedGroupId && schedSelDays.length > 0) {
        await GroupScheduleSvc.saveGroupSchedulePerDay(
          savedGroupId, form.name.trim(),
          daySettings, schedSelDays, schedSelCoaches,
          diffCoachPerDay, dayCoachIds
        );
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
    setAddMemberForm({ member_name: '', contact_number: '', contact_person: '', custom_fee: '' });
    setEditMemberRow(null);
  };

  const addMember = async () => {
    if (!addMemberForm.member_name?.trim()) { alert('Üye adı zorunludur.'); return; }
    setMemberSaving(true);
    try {
      const cfStr = addMemberForm.custom_fee?.trim();
      const m = await GroupSvc.addMember(membersModal.group.id, {
        member_name:    addMemberForm.member_name.trim(),
        contact_number: addMemberForm.contact_number?.trim() || null,
        contact_person: addMemberForm.contact_person?.trim() || null,
        custom_fee:     cfStr ? parseFloat(cfStr) : null,
      });
      setGroupMembers(prev => [...prev, m]);
      setAddMemberForm({ member_name: '', contact_number: '', contact_person: '', custom_fee: '' });
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
      const cfStr = updated.custom_fee?.trim();
      const m = await GroupSvc.updateMember(memberId, {
        member_name:    updated.member_name.trim(),
        contact_number: updated.contact_number?.trim() || null,
        contact_person: updated.contact_person?.trim() || null,
        custom_fee:     cfStr ? parseFloat(cfStr) : null,
      });
      setGroupMembers(prev => prev.map(x => x.id === memberId ? m : x));
      setEditMemberRow(null);
      loadGroups();
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
      const g = duesModal.group;
      await GroupDuesSvc.postDuesToFinance(
        g.id, g.name,
        duesYear, duesMonth, dues,
        g.club_percentage ?? 100,
        g.split_type || 'percentage',
        g.coaches || [],
      );
      await loadDues(g, duesYear, duesMonth);
    } catch (e) { alert(e.message); }
    finally { setPosting(false); }
  };

  // ── Hesaplamalar ─────────────────────────────────────────────
  const paidCount   = dues.filter(d => d.is_paid).length;
  const totalDues   = dues.reduce((s, d) => s + (d.amount || 0), 0);
  const paidAmount  = dues.filter(d => d.is_paid).reduce((s, d) => s + (d.amount || 0), 0);
  const coachPct    = duesModal ? 100 - (duesModal.group.club_percentage ?? 100) : 0;
  const calcClubAmount = () => {
    if (!duesModal) return 0;
    const g = duesModal.group;
    if ((g.split_type || 'percentage') === 'fixed_amount' && g.coaches?.length > 0) {
      const totalFixed = g.coaches.reduce((s, c) => s + (c.fixed_amount ?? 0), 0);
      return Math.max(0, totalDues - Math.min(totalFixed, totalDues));
    }
    return Math.round(totalDues * ((g.club_percentage ?? 100) / 100) * 100) / 100;
  };

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
                  {(g.coaches && g.coaches.length > 0
                    ? g.coaches
                    : g.coach ? [{ id: g.coach.id, full_name: g.coach.full_name, share_percentage: 100 }] : []
                  ).map(c => (
                    <span key={c.id} style={{ fontSize:12, color:'var(--brand-navy)', background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:8, padding:'4px 9px', fontWeight:600 }}>
                      {c.full_name}
                    </span>
                  ))}
                  {coachShare > 0 && (!g.coaches || g.coaches.length === 0) && (
                    <span style={{ fontSize:12, color:'#8B5CF6', background:'#F3E8FF', border:'1px solid #DDD6FE', borderRadius:8, padding:'4px 9px' }}>
                      Koç %{coachShare}
                    </span>
                  )}
                </div>

                {g._schedule && (
                  <div style={{ fontSize:11, color:'#0D9488', display:'flex', alignItems:'center', gap:4 }}>
                    <span className="material-icons" style={{fontSize:12}}>event_repeat</span>
                    {g._schedule}
                  </div>
                )}

                <div style={{ height:1, background:'var(--border)' }} />

                {/* Aksiyon butonları */}
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex:1, color:'#0D9488' }} onClick={() => openSchedule(g)}>
                    <span className="material-icons" style={{fontSize:14}}>event_repeat</span> Program
                  </button>
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

            <Field label="Aylık Ücret (₺)">
              <input type="number" min={0} placeholder="0" value={form.monthly_fee ?? ''}
                onChange={e => setForm({...form, monthly_fee: e.target.value})} />
            </Field>

            {/* Antrenörler — çoklu seçim */}
            <Field label="ANTRENÖRLER (birden fazla seçilebilir)">
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                {coaches.length === 0
                  ? <span style={{ fontSize:12, color:'var(--text-2)' }}>Aktif antrenör bulunamadı</span>
                  : coaches.map(c => (
                    <button key={c.id} type="button"
                      className={'btn btn-sm ' + (selectedCoachIds.includes(c.id) ? 'btn-pri' : 'btn-ghost')}
                      onClick={() => {
                        const next = selectedCoachIds.includes(c.id)
                          ? selectedCoachIds.filter(id => id !== c.id)
                          : [...selectedCoachIds, c.id];
                        setSelectedCoachIds(next);
                        if (next.length > 0) {
                          const equal = parseFloat((100 / next.length).toFixed(2));
                          const s = {};
                          next.forEach((id, i) => { s[id] = i === next.length - 1 ? (100 - equal * (next.length - 1)).toFixed(2) : equal.toFixed(2); });
                          setCoachShares(s);
                        } else { setCoachShares({}); }
                      }}>
                      {c.full_name}
                    </button>
                  ))
                }
              </div>
            </Field>

            {/* Pay Modeli — sadece antrenör seçiliyse */}
            {selectedCoachIds.length > 0 && (
              <>
                <Field label="PAY MODELİ">
                  <div style={{ display:'flex', gap:8 }}>
                    <button type="button"
                      className={'btn btn-sm ' + (splitType === 'percentage' ? 'btn-pri' : 'btn-ghost')}
                      style={{ flex:1 }}
                      onClick={() => setSplitType('percentage')}>% Yüzde</button>
                    <button type="button"
                      className={'btn btn-sm ' + (splitType === 'fixed_amount' ? 'btn-pri' : 'btn-ghost')}
                      style={{ flex:1 }}
                      onClick={() => setSplitType('fixed_amount')}>₺ Sabit Tutar</button>
                  </div>
                </Field>

                {splitType === 'percentage' && (
                  <>
                    <Field label="Kulüp Payı (%)">
                      <input type="number" min={0} max={100} placeholder="100" value={form.club_percentage ?? 100}
                        onChange={e => setForm({...form, club_percentage: e.target.value})} />
                    </Field>
                    {Number(form.club_percentage) < 100 && (
                      <div style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#7C3AED' }}>
                        Antrenör payı: %{100 - Number(form.club_percentage || 0)}
                      </div>
                    )}
                    {selectedCoachIds.length > 1 && (
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span>ANTRENÖR PAYLARI (toplam %100)</span>
                          <button type="button" style={{ fontSize:11, color:'var(--brand-navy)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}
                            onClick={() => {
                              const equal = parseFloat((100 / selectedCoachIds.length).toFixed(2));
                              const s = {};
                              selectedCoachIds.forEach((id, i) => { s[id] = i === selectedCoachIds.length - 1 ? (100 - equal * (selectedCoachIds.length - 1)).toFixed(2) : equal.toFixed(2); });
                              setCoachShares(s);
                            }}>= Eşit Böl</button>
                        </div>
                        {selectedCoachIds.map(id => {
                          const coach = coaches.find(c => c.id === id);
                          return (
                            <div key={id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                              <span style={{ flex:1, fontSize:13 }}>{coach?.full_name}</span>
                              <input type="number" min={0} max={100} placeholder="0"
                                value={coachShares[id] ?? ''}
                                onChange={e => setCoachShares(p => ({...p, [id]: e.target.value}))}
                                style={{ width:70, textAlign:'center', fontSize:13 }} />
                              <span style={{ fontSize:13, color:'var(--text-2)' }}>%</span>
                            </div>
                          );
                        })}
                        {(() => {
                          const total = selectedCoachIds.reduce((s, id) => s + (parseFloat(coachShares[id]) || 0), 0);
                          const ok = Math.abs(total - 100) < 0.1;
                          return <div style={{ fontSize:12, fontWeight:700, color: ok ? '#22C55E' : '#EF4444' }}>Toplam: %{total.toFixed(1)} {ok ? '✓' : '✗ (100 olmalı)'}</div>;
                        })()}
                      </div>
                    )}
                  </>
                )}

                {splitType === 'fixed_amount' && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      Antrenör Sabit Tutarları (₺)
                    </div>
                    {selectedCoachIds.map(id => {
                      const coach = coaches.find(c => c.id === id);
                      return (
                        <div key={id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <span style={{ flex:1, fontSize:13 }}>{coach?.full_name}</span>
                          <input type="number" min={0} placeholder="0"
                            value={coachFixedAmounts[id] ?? ''}
                            onChange={e => setCoachFixedAmounts(p => ({...p, [id]: e.target.value}))}
                            style={{ width:100, fontSize:13 }} />
                          <span style={{ fontSize:13, color:'var(--text-2)' }}>₺</span>
                        </div>
                      );
                    })}
                    <div style={{ fontSize:12, color:'var(--text-2)', marginTop:4 }}>Girilen tutarlar toplamı hocalara dağıtılır, geri kalan kulübe gider</div>
                  </div>
                )}
              </>
            )}
            {selectedCoachIds.length === 0 && (
              <div style={{ fontSize:12, color:'var(--text-2)' }}>Antrenör seçilmezse tüm aidat kulübe gider</div>
            )}

            <Switch on={form.is_active !== false} onChange={v => setForm({...form, is_active: v})} label="Aktif Grup" />

            {/* Üyeler — sadece oluşturma modunda */}
            {groupModal.type === 'add' && (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:'var(--text-2)' }}>
                    Üyeler <span style={{ color:'var(--danger)' }}>*</span>
                    <span style={{ fontWeight:400, marginLeft:6, fontSize:12 }}>(en az 2)</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={addNewMemberRow}>
                    <span className="material-icons" style={{fontSize:14}}>add</span> Üye Ekle
                  </button>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {newMembers.map((m, idx) => (
                    <div key={idx} style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1.2fr 1fr auto', gap:6, alignItems:'center' }}>
                      <input placeholder={`Üye ${idx+1} adı *`} value={m.member_name}
                        onChange={e => updateNewMember(idx, 'member_name', e.target.value)}
                        style={{ fontSize:13 }} />
                      <input placeholder="Telefon" value={m.contact_number}
                        onChange={e => updateNewMember(idx, 'contact_number', e.target.value)}
                        style={{ fontSize:13 }} />
                      <input placeholder="Veli / İletişim" value={m.contact_person}
                        onChange={e => updateNewMember(idx, 'contact_person', e.target.value)}
                        style={{ fontSize:13 }} />
                      <input type="number" min={0} placeholder={`Özel ücret (₺)`} value={m.custom_fee ?? ''}
                        onChange={e => updateNewMember(idx, 'custom_fee', e.target.value)}
                        style={{ fontSize:13 }} title="Boş bırakılırsa grup aidatı uygulanır" />
                      {newMembers.length > 2 && (
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeNewMemberRow(idx)}>
                          <span className="material-icons" style={{fontSize:14}}>remove</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Program Atama ── */}
            <PerDayScheduleSection
              schedCourts={schedCourts}
              coaches={coaches}
              schedSelDays={schedSelDays}
              setSchedSelDays={setSchedSelDays}
              daySettings={daySettings}
              setDaySettings={setDaySettings}
              schedSelCoaches={schedSelCoaches}
              setSchedSelCoaches={setSchedSelCoaches}
              diffCoachPerDay={diffCoachPerDay}
              setDiffCoachPerDay={setDiffCoachPerDay}
              dayCoachIds={dayCoachIds}
              setDayCoachIds={setDayCoachIds}
              schedConflicts={schedConflicts}
              schedChecking={schedChecking}
              use15Min={use15Min}
              setUse15Min={setUse15Min}
              compact
            />
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
                        <div style={{ fontSize:11, color:'var(--text-2)', display:'flex', gap:8, marginTop:2, flexWrap:'wrap' }}>
                          {m.contact_number && <span>📞 {m.contact_number}</span>}
                          {m.contact_person && <span>👤 {m.contact_person}</span>}
                          {m.custom_fee != null && <span style={{ color:'#7C3AED', fontWeight:600 }}>💰 {fmtMoney(m.custom_fee)}/ay</span>}
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
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1.2fr 1fr', gap:8, marginBottom:10 }}>
              <input placeholder="Üye adı soyadı *" value={addMemberForm.member_name || ''}
                onChange={e => setAddMemberForm({...addMemberForm, member_name: e.target.value})}
                style={{ fontSize:13 }} />
              <input placeholder="Telefon numarası" value={addMemberForm.contact_number || ''}
                onChange={e => setAddMemberForm({...addMemberForm, contact_number: e.target.value})}
                style={{ fontSize:13 }} />
              <input placeholder="Veli / İletişim kişisi" value={addMemberForm.contact_person || ''}
                onChange={e => setAddMemberForm({...addMemberForm, contact_person: e.target.value})}
                style={{ fontSize:13 }} />
              <input type="number" min={0} placeholder="Özel ücret (₺)" value={addMemberForm.custom_fee || ''}
                onChange={e => setAddMemberForm({...addMemberForm, custom_fee: e.target.value})}
                style={{ fontSize:13 }} title="Boş bırakılırsa grup aidatı uygulanır" />
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
                  {(duesModal.group.coaches?.length > 0 || coachPct > 0) && (() => {
                    const g = duesModal.group;
                    const clubAmt = calcClubAmount();
                    const coachAmt = Math.round((totalDues - clubAmt) * 100) / 100;
                    return (
                      <div style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#7C3AED' }}>
                        <div>Finanslara aktarıldığında: Kulüp <strong>{fmtMoney(clubAmt)}</strong>
                          {coachAmt > 0 && <> · Antrenör(ler) <strong>{fmtMoney(coachAmt)}</strong></>}
                        </div>
                        {g.coaches?.length > 1 && (
                          <div style={{ marginTop:6, display:'flex', flexDirection:'column', gap:2 }}>
                            {g.coaches.map(c => {
                              let amt;
                              if ((g.split_type || 'percentage') === 'fixed_amount') {
                                amt = c.fixed_amount ?? 0;
                              } else {
                                amt = Math.round(coachAmt * ((c.share_percentage ?? 100) / 100) * 100) / 100;
                              }
                              return <span key={c.id}>{c.full_name}: <strong>{fmtMoney(amt)}</strong></span>;
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
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

      {/* ══ PROGRAM ATAMA MODALI ══ */}
      {schedModal && (
        <Modal
          title={`${schedModal.group.name} — Program Atama`}
          wide
          onClose={() => setSchedModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={clearSchedule}>Programı Temizle</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSchedModal(null)}>Vazgeç</button>
              <button
                className="btn btn-sm"
                style={{
                  background: schedConflicts.length ? '#EF4444' : schedSaving ? '#9CA3AF' : '#0D9488',
                  color: '#fff', border: 'none'
                }}
                onClick={saveSchedule}
                disabled={schedSaving || !!schedConflicts.length || schedChecking || !schedSelDays.length}
              >
                {schedSaving ? 'Kaydediliyor…'
                 : schedConflicts.length ? 'Çakışma Var — Kaydedilemez'
                 : 'Programı Kaydet'}
              </button>
            </>
          }
        >
          <PerDayScheduleSection
            schedCourts={schedCourts}
            coaches={coaches}
            schedSelDays={schedSelDays}
            setSchedSelDays={setSchedSelDays}
            daySettings={daySettings}
            setDaySettings={setDaySettings}
            schedSelCoaches={schedSelCoaches}
            setSchedSelCoaches={setSchedSelCoaches}
            diffCoachPerDay={diffCoachPerDay}
            setDiffCoachPerDay={setDiffCoachPerDay}
            dayCoachIds={dayCoachIds}
            setDayCoachIds={setDayCoachIds}
            schedConflicts={schedConflicts}
            schedChecking={schedChecking}
            use15Min={use15Min}
            setUse15Min={setUse15Min}
          />
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DERS PAKETLERİ
// ═══════════════════════════════════════════════════════════════
function LessonPackagesScreen({ clubId }) {
  const { useState, useEffect } = React;

  const [tab,           setTab]          = useState('packages');
  const [packages,      setPackages]     = useState([]);
  const [coaches,       setCoaches]      = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [playerPkgs,    setPlayerPkgs]   = useState([]);
  const [playerLoading, setPlayerLoading]= useState(false);
  const [stats,         setStats]        = useState(null);

  // Paket oluştur/düzenle
  const [pkgModal,  setPkgModal]  = useState(null);
  const [form,      setForm]      = useState({});
  const [saving,    setSaving]    = useState(false);

  // Ödeme onay modalı
  const [confirmModal, setConfirmModal] = useState(null);
  const [confirming,   setConfirming]   = useState(false);

  // Üye kayıt modalı
  const [enrollModal,    setEnrollModal]    = useState(null); // { pkg }
  const [enrollMode,     setEnrollMode]     = useState('search'); // 'search' | 'manual'
  const [enrollSearch,   setEnrollSearch]   = useState('');
  const [enrollResults,  setEnrollResults]  = useState([]);
  const [enrollSearching,setEnrollSearching]= useState(false);
  const [enrollSelected, setEnrollSelected] = useState(null); // { ...data, _type: 'app'|'customer' }
  const [enrollName,     setEnrollName]     = useState('');
  const [enrollPhone,    setEnrollPhone]    = useState('');
  const [enrollCoachId,  setEnrollCoachId]  = useState('');
  const [enrollUsed,     setEnrollUsed]     = useState('0');
  const [enrollPayStatus,setEnrollPayStatus]= useState('pending');
  const [enrollPaid,     setEnrollPaid]     = useState('');
  const [enrollNotes,    setEnrollNotes]    = useState('');
  const [enrollSaving,   setEnrollSaving]   = useState(false);

  useEffect(() => { if (clubId) { loadPackages(); loadCoaches(); loadStats(); } }, [clubId]);
  useEffect(() => { if (clubId && tab !== 'packages') loadPlayerPackages(); }, [tab, clubId]);

  const loadPackages = async () => {
    setLoading(true);
    const data = await LessonPackageSvc.getClubPackages(clubId);
    setPackages(data);
    setLoading(false);
  };

  const loadCoaches = async () => {
    const { data } = await sb.from('club_coaches').select('id,full_name,individual_coach_id,coach_pay_rate').eq('club_id', clubId).eq('is_active', true);
    setCoaches(data || []);
  };

  const loadPlayerPackages = async () => {
    setPlayerLoading(true);
    const data = await LessonPackageSvc.getPlayerPackages(clubId);
    setPlayerPkgs(data);
    setPlayerLoading(false);
  };

  const loadStats = async () => {
    const s = await LessonPackageSvc.getPackageStats(clubId);
    setStats(s);
  };

  const openCreate = () => {
    setForm({ name: '', description: '', total_lessons: 10, price: '', validity_days: 90, coach_id: '', is_active: true });
    setPkgModal({ type: 'add' });
  };

  const openEdit = (pkg) => {
    // coach_id = profiles.id — dropdownda club_coaches.id gösteriyoruz, eşleştir
    const clubCoach = coaches.find(c => c.individual_coach_id === pkg.coach_id || c.id === pkg.coach_id);
    setForm({ ...pkg, coach_id: clubCoach?.id || '' });
    setPkgModal({ type: 'edit', pkg });
  };

  const savePkg = async () => {
    if (!form.name?.trim()) { alert('Paket adı zorunludur.'); return; }
    if (!form.total_lessons || Number(form.total_lessons) < 1) { alert('Ders sayısı en az 1 olmalı.'); return; }
    if (form.price === '' || form.price === null) { alert('Fiyat zorunludur.'); return; }
    setSaving(true);
    try {
      const payload = {
        name:             form.name.trim(),
        description:      form.description?.trim() || null,
        total_lessons:    Number(form.total_lessons),
        price:            Number(form.price),
        validity_days:    Number(form.validity_days) || 90,
        coach_id:         coachProfileId(form.coach_id) || null,
        is_active:        form.is_active !== false,
      };
      if (pkgModal.type === 'add') {
        await LessonPackageSvc.createPackage(clubId, payload);
      } else {
        await LessonPackageSvc.updatePackage(form.id, payload);
      }
      setPkgModal(null);
      loadPackages(); loadStats();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (pkg) => {
    try { await LessonPackageSvc.toggleActive(pkg.id, !pkg.is_active); loadPackages(); }
    catch (e) { alert(e.message); }
  };

  const deletePkg = async (pkg) => {
    if (!confirm(`"${pkg.name}" paketini silmek istediğinize emin misiniz?`)) return;
    try { await LessonPackageSvc.deletePackage(pkg.id); loadPackages(); loadStats(); }
    catch (e) { alert(e.message); }
  };

  const doConfirmPayment = async () => {
    const pp  = confirmModal.playerPkg;
    const pkg = pp.package;
    const coachRec = coaches.find(c => c.individual_coach_id === pp.coach_id);
    const coachPayRate = coachRec?.coach_pay_rate || 0;
    setConfirming(true);
    try {
      await LessonPackageSvc.confirmPayment(
        pp.id, pkg?.validity_days, pp.total_paid ?? pkg?.price,
        pp.player?.full_name || pp.manual_player_name || 'Öğrenci', pkg?.name || 'Ders Paketi', clubId,
        coachRec ? { clubCoachId: coachRec.id, coachName: coachRec.full_name, coachPayRate } : null
      );
      setConfirmModal(null);
      loadPlayerPackages(); loadStats();
    } catch (e) { alert(e.message); }
    finally { setConfirming(false); }
  };

  const openEnrollModal = (pkg) => {
    setEnrollModal({ pkg });
    setEnrollMode('search');
    setEnrollSearch(''); setEnrollResults([]); setEnrollSelected(null);
    setEnrollName(''); setEnrollPhone('');
    setEnrollCoachId(coachProfileId(coaches.find(c => c.individual_coach_id === pkg.coach_id || c.id === pkg.coach_id)?.id || '') || '');
    setEnrollUsed('0');
    setEnrollPayStatus('pending');
    setEnrollPaid(String(pkg.price));
    setEnrollNotes('');
  };

  const handleEnrollSearch = async (q) => {
    setEnrollSearch(q);
    setEnrollSelected(null);
    if (q.trim().length < 2) { setEnrollResults([]); return; }
    setEnrollSearching(true);
    try {
      const [players, custRes] = await Promise.all([
        LessonPackageSvc.searchPlayers(q),
        sb.from('club_customers')
          .select('id, full_name, phone, email, user_id')
          .eq('club_id', clubId).eq('is_active', true)
          .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(8),
      ]);
      const appList  = players || [];
      const custList = custRes.data || [];
      const matchedAppIds = new Set();
      const merged = custList.map(c => {
        const appMatch = appList.find(p => p.id === c.user_id);
        if (appMatch) { matchedAppIds.add(appMatch.id); return { ...c, _type: 'both' }; }
        return { ...c, _type: 'customer' };
      });
      appList.forEach(p => { if (!matchedAppIds.has(p.id)) merged.push({ ...p, _type: 'app' }); });
      setEnrollResults(merged);
    } catch { setEnrollResults([]); }
    finally { setEnrollSearching(false); }
  };

  const doEnroll = async () => {
    if (!enrollModal) return;
    const pkg = enrollModal.pkg;
    if (enrollMode === 'search' && !enrollSelected)   { alert('Bir kişi seçin.'); return; }
    if (enrollMode === 'manual' && !enrollName.trim()) { alert('Ad Soyad zorunludur.'); return; }
    const used = parseInt(enrollUsed, 10) || 0;
    if (used >= pkg.total_lessons) { alert(`Tamamlanan ders sayısı ${pkg.total_lessons - 1} veya daha az olmalı.`); return; }
    const enrollCoachRec = enrollCoachId ? coaches.find(c => c.id === enrollCoachId) : null;
    setEnrollSaving(true);
    try {
      const sel    = enrollSelected;
      const isCust = sel?._type === 'customer';
      const isBoth = sel?._type === 'both';
      await LessonPackageSvc.manualEnrollPlayer({
        package_id:          pkg.id,
        club_id:             clubId,
        coach_id:            enrollCoachId ? coachProfileId(enrollCoachId) : null,
        coach_db_id:         enrollCoachRec?.id || null,
        coach_name:          enrollCoachRec?.full_name || null,
        coach_pay_rate:      enrollCoachRec?.coach_pay_rate || 0,
        player_id:           enrollMode === 'search'
                               ? (isBoth ? sel.user_id : isCust ? (sel.user_id || null) : sel.id)
                               : null,
        player_name:         enrollMode === 'search' ? sel.full_name : null,
        manual_player_name:  enrollMode === 'manual' ? enrollName.trim()
                           : (isCust && !sel.user_id) ? sel.full_name
                           : null,
        manual_player_phone: enrollMode === 'manual' ? (enrollPhone.trim() || null)
                           : (isCust && !sel.user_id) ? (sel.phone || null)
                           : null,
        used_lessons:        used,
        payment_status:      enrollPayStatus,
        total_paid:          parseFloat(enrollPaid) || pkg.price,
        notes:               enrollNotes.trim() || null,
      });
      setEnrollModal(null);
      loadPlayerPackages(); loadStats();
    } catch (e) { alert(e.message); }
    finally { setEnrollSaving(false); }
  };

  const cancelPlayerPackage = async (pp) => {
    const name = pp.player?.full_name || pp.manual_player_name || 'Bu öğrenci';
    if (!confirm(`${name} için paketi iptal etmek istediğinize emin misiniz?`)) return;
    try { await LessonPackageSvc.cancelPlayerPackage(pp.id); loadPlayerPackages(); loadStats(); }
    catch (e) { alert(e.message); }
  };

  const displayName = (pp) => pp.player?.full_name || pp.manual_player_name || '—';

  const activeStudents  = playerPkgs.filter(p => p.payment_status === 'paid' && p.status !== 'cancelled');
  const pendingStudents = playerPkgs.filter(p => p.payment_status === 'pending');
  const perLesson = (pkg) => pkg.total_lessons > 0 ? pkg.price / pkg.total_lessons : 0;
  // lesson_packages.coach_id = profiles.id = club_coaches.individual_coach_id
  const coachName = (coachId) => {
    if (!coachId) return null;
    const c = coaches.find(c => c.individual_coach_id === coachId || c.id === coachId);
    return c?.full_name ?? null;
  };
  // Kaydetme için: club_coaches.id → individual_coach_id (profiles.id)
  const coachProfileId = (clubCoachId) => {
    if (!clubCoachId) return null;
    const c = coaches.find(c => c.id === clubCoachId);
    return c?.individual_coach_id ?? clubCoachId;
  };

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Ders Paketleri</h1>
          <div className="sub">{packages.length} paket tanımı</div>
        </div>
        {tab === 'packages' && (
          <button className="btn btn-pri" onClick={openCreate}>
            <span className="material-icons">add</span> Paket Oluştur
          </button>
        )}
      </div>

      {/* İstatistik kartları */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10, marginBottom:16 }}>
          {[
            { label:'Toplam Gelir',   value: fmtMoney(stats.totalRevenue), icon:'account_balance_wallet', color:'#22C55E' },
            { label:'Aktif Paket',    value: stats.activeCount,            icon:'school',                 color:'#003399' },
            { label:'Bekleyen',       value: stats.pendingCount,           icon:'pending',                color:'#F59E0B' },
            { label:'Tamamlanan',     value: stats.completedCount,         icon:'check_circle',           color:'#9CA3AF' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <span className="material-icons" style={{ color: s.color, fontSize:22 }}>{s.icon}</span>
              <div>
                <div style={{ fontWeight:800, fontSize:16 }}>{s.value}</div>
                <div style={{ fontSize:11, color:'var(--text-2)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sekmeler */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[
          { key:'packages', label:'Paketler',    icon:'inventory_2' },
          { key:'students', label:'Öğrenciler',  icon:'school' },
          { key:'pending',  label:`Bekleyen${pendingStudents.length ? ` (${pendingStudents.length})` : ''}`, icon:'pending' },
        ].map(t => (
          <button key={t.key}
            className={'btn btn-sm ' + (tab === t.key ? 'btn-pri' : 'btn-ghost')}
            onClick={() => setTab(t.key)}>
            <span className="material-icons" style={{fontSize:15}}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PAKETLER SEKMESİ ── */}
      {tab === 'packages' && (
        loading ? <Spinner /> : packages.length === 0 ? (
          <EmptyState icon="inventory_2" title="Henüz paket yok" sub="İlk ders paketini oluşturun." />
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
            {packages.map(pkg => (
              <div key={pkg.id} className="card" style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ fontWeight:800, fontSize:16 }}>{pkg.name}</div>
                  <button
                    style={{ background:'none', border:'none', cursor:'pointer', padding:'3px 10px', borderRadius:20,
                      backgroundColor: pkg.is_active ? '#DCFCE7' : '#FEF3C7',
                      color: pkg.is_active ? '#22C55E' : '#F59E0B', fontSize:11, fontWeight:700, flexShrink:0 }}
                    onClick={() => toggleActive(pkg)}>
                    {pkg.is_active ? 'Aktif' : 'Pasif'}
                  </button>
                </div>

                {pkg.description && <p style={{ fontSize:13, color:'var(--text-2)', margin:0 }}>{pkg.description}</p>}

                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  <span style={{ fontSize:12, background:'#EEF2FF', color:'var(--brand-navy)', border:'1px solid #C7D2FE', borderRadius:8, padding:'4px 9px', fontWeight:700 }}>
                    {pkg.total_lessons} ders
                  </span>
                  <span style={{ fontSize:12, background:'#F0FDF4', color:'#22C55E', border:'1px solid #BBF7D0', borderRadius:8, padding:'4px 9px', fontWeight:700 }}>
                    {fmtMoney(pkg.price)}
                  </span>
                  <span style={{ fontSize:12, background:'var(--bg)', color:'var(--text-2)', border:'1px solid var(--border)', borderRadius:8, padding:'4px 9px' }}>
                    {pkg.validity_days} gün geçerli
                  </span>
                  {coachName(pkg.coach_id) && (
                    <span style={{ fontSize:12, background:'#EEF2FF', color:'var(--brand-navy)', border:'1px solid #C7D2FE', borderRadius:8, padding:'4px 9px', fontWeight:600 }}>
                      {coachName(pkg.coach_id)}
                    </span>
                  )}
                </div>

                <div style={{ fontSize:12, color:'var(--text-2)' }}>
                  Ders başı: <strong>{fmtMoney(perLesson(pkg))}</strong>
                </div>

                <div style={{ height:1, background:'var(--border)' }} />

                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-pri btn-sm" title="Müşteri Kaydet" onClick={() => openEnrollModal(pkg)}>
                    <span className="material-icons" style={{fontSize:15}}>person_add</span> Müşteri Kaydet
                  </button>
                  <button className="btn btn-ghost btn-sm btn-icon" title="Düzenle" onClick={() => openEdit(pkg)}>
                    <span className="material-icons" style={{fontSize:15}}>edit</span>
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon" title="Sil" onClick={() => deletePkg(pkg)}>
                    <span className="material-icons" style={{fontSize:15}}>delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── ÖĞRENCİLER SEKMESİ ── */}
      {tab === 'students' && (
        playerLoading ? <Spinner /> : activeStudents.length === 0 ? (
          <EmptyState icon="school" title="Aktif öğrenci paketi yok" sub="Öğrenciler ders paketi satın aldığında burada görünür." />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {activeStudents.map(pp => {
              const pkg       = pp.package;
              const used      = pp.used_lessons ?? 0;
              const total     = pp.total_lessons ?? pkg?.total_lessons ?? 0;
              const pct       = total > 0 ? Math.round(used / total * 100) : 0;
              const expired   = pp.expiry_date && new Date(pp.expiry_date) < new Date();
              const completed = pp.status === 'completed';
              const name      = displayName(pp);
              return (
                <div key={pp.id} className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <Av name={name} size="md" />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>
                      {name}
                      {pp.manual_player_name && <span style={{ fontSize:11, color:'var(--text-2)', marginLeft:6 }}>(manuel)</span>}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2 }}>{pkg?.name || '—'}</div>
                    {pp.coach_name && <div style={{ fontSize:11, color:'var(--text-2)' }}>Antrenör: {pp.coach_name}</div>}
                    <div style={{ marginTop:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-2)', marginBottom:4 }}>
                        <span>{used} / {total} ders kullanıldı</span>
                        <span>{pct}%</span>
                      </div>
                      <div style={{ height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, borderRadius:3, transition:'width 0.3s',
                          background: completed ? '#9CA3AF' : expired ? '#F59E0B' : 'var(--brand-navy)' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                      background: completed ? '#F3F4F6' : expired ? '#FEF3C7' : '#DCFCE7',
                      color:      completed ? '#6B7280' : expired ? '#F59E0B' : '#22C55E' }}>
                      {completed ? 'Tamamlandı' : expired ? 'Süresi Doldu' : 'Aktif'}
                    </span>
                    {pp.expiry_date && (
                      <span style={{ fontSize:11, color:'var(--text-2)' }}>Son: {fmtDate(pp.expiry_date)}</span>
                    )}
                    <button className="btn btn-danger btn-sm btn-icon" title="Paketi İptal Et" onClick={() => cancelPlayerPackage(pp)}>
                      <span className="material-icons" style={{fontSize:14}}>cancel</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── BEKLEYEN SEKMESİ ── */}
      {tab === 'pending' && (
        playerLoading ? <Spinner /> : pendingStudents.length === 0 ? (
          <EmptyState icon="pending" title="Bekleyen ödeme yok" sub="Yeni paket satın alımları burada görünür." />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {pendingStudents.map(pp => {
              const pkg = pp.package;
              return (
                <div key={pp.id} className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <Av name={displayName(pp)} size="md" />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{displayName(pp)}</div>
                    <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2 }}>
                      {pkg?.name || '—'} · {pkg?.total_lessons} ders
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2 }}>
                      Satın alım: {fmtDate(pp.purchase_date || pp.created_at)}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
                    <div style={{ fontWeight:800, fontSize:18, color:'#22C55E' }}>{fmtMoney(pp.total_paid ?? pkg?.price)}</div>
                    <button className="btn btn-pri btn-sm" onClick={() => setConfirmModal({ playerPkg: pp })}>
                      <span className="material-icons" style={{fontSize:14}}>check_circle</span>
                      Ödemeyi Onayla
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ══ ÜYE KAYIT MODALI ══ */}
      {enrollModal && (
        <Modal
          title={`Müşteri Kaydet — ${enrollModal.pkg.name}`}
          wide
          onClose={() => setEnrollModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setEnrollModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={doEnroll} disabled={enrollSaving}>
                {enrollSaving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </>
          }
        >
          <div className="fields" style={{ gap:14 }}>
            {/* Mod seçimi */}
            <div style={{ display:'flex', gap:8 }}>
              {[{key:'search',label:'Oyuncu Ara'},{key:'manual',label:'Manuel'}].map(m => (
                <button key={m.key}
                  className={'btn btn-sm ' + (enrollMode === m.key ? 'btn-pri' : 'btn-ghost')}
                  onClick={() => {
                    setEnrollMode(m.key);
                    setEnrollSearch(''); setEnrollResults([]); setEnrollSelected(null);
                    setEnrollName(''); setEnrollPhone('');
                  }}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Birleşik üye + müşteri arama */}
            {enrollMode === 'search' && (
              <Field label="Kişi Ara *">
                {enrollSelected ? (
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#EEF2FF', borderRadius:8, border:'1px solid #C7D2FE' }}>
                    <span style={{ flex:1, fontWeight:600 }}>{enrollSelected.full_name}</span>
                    <span style={{ fontSize:12, color:'var(--text-2)' }}>{enrollSelected.email || enrollSelected.phone || ''}</span>
                    <div style={{ display:'flex', gap:4 }}>
                      {(enrollSelected._type === 'customer' || enrollSelected._type === 'both') && (
                        <span style={{ fontSize:10, fontWeight:700, background:'#E0F7FA', color:'#00796B', padding:'1px 6px', borderRadius:20 }}>Müşteri</span>
                      )}
                      {(enrollSelected._type === 'app' || enrollSelected._type === 'both') && (
                        <span style={{ fontSize:10, fontWeight:700, background:'#EEF2FF', color:'var(--brand-navy)', padding:'1px 6px', borderRadius:20 }}>CourtyCLUB Kullanıcısı</span>
                      )}
                    </div>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEnrollSelected(null); setEnrollSearch(''); }}>
                      <span className="material-icons" style={{fontSize:14}}>close</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ position:'relative' }}>
                    <input
                      placeholder="İsim, telefon veya e-posta (en az 2 karakter)"
                      value={enrollSearch}
                      onChange={e => handleEnrollSearch(e.target.value)}
                    />
                    {(enrollSearching || enrollResults.length > 0) && (
                      <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid var(--border)', borderRadius:8, zIndex:50, maxHeight:220, overflowY:'auto', boxShadow:'0 4px 12px rgba(0,0,0,.1)' }}>
                        {enrollSearching && <div style={{ padding:'10px 14px', color:'var(--text-2)', fontSize:13 }}>Aranıyor…</div>}
                        {!enrollSearching && enrollResults.length === 0 && enrollSearch.trim().length >= 2 && (
                          <div style={{ padding:'10px 14px', color:'var(--text-2)', fontSize:13 }}>Sonuç bulunamadı</div>
                        )}
                        {enrollResults.map(r => (
                          <div key={r._type + r.id}
                            style={{ padding:'10px 14px', cursor:'pointer', display:'flex', flexDirection:'column', gap:2, borderBottom:'1px solid var(--border)' }}
                            onMouseDown={() => { setEnrollSelected(r); setEnrollSearch(r.full_name); setEnrollResults([]); }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontWeight:600, fontSize:14 }}>{r.full_name}</span>
                              {(r._type === 'customer' || r._type === 'both') && (
                                <span style={{ fontSize:10, fontWeight:700, background:'#E0F7FA', color:'#00796B', padding:'1px 6px', borderRadius:20 }}>Müşteri</span>
                              )}
                              {(r._type === 'app' || r._type === 'both') && (
                                <span style={{ fontSize:10, fontWeight:700, background:'#EEF2FF', color:'var(--brand-navy)', padding:'1px 6px', borderRadius:20 }}>CourtyCLUB Kullanıcısı</span>
                              )}
                            </div>
                            <span style={{ fontSize:12, color:'var(--text-2)' }}>{r.email || r.phone || ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Field>
            )}

            {/* Manuel kayıt */}
            {enrollMode === 'manual' && (
              <div className="fields-2">
                <Field label="Ad Soyad *">
                  <input placeholder="Müşteri adı" value={enrollName} onChange={e => setEnrollName(e.target.value)} />
                </Field>
                <Field label="Telefon (isteğe bağlı)">
                  <input placeholder="05xx xxx xx xx" value={enrollPhone} onChange={e => setEnrollPhone(e.target.value)} />
                </Field>
              </div>
            )}

            {/* Ortak alanlar */}
            <Field label="Antrenör (opsiyonel — boş bırakılırsa tüm antrenörlerde geçerli)">
              <select value={enrollCoachId} onChange={e => setEnrollCoachId(e.target.value)}>
                <option value="">Tüm antrenörler</option>
                {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </Field>

            <div className="fields-2">
              <Field label="Kullanılmış Ders Sayısı">
                <input type="number" min={0} max={enrollModal.pkg.total_lessons - 1} value={enrollUsed}
                  onChange={e => setEnrollUsed(e.target.value)} />
              </Field>
              <Field label="Ödeme Durumu">
                <select value={enrollPayStatus} onChange={e => setEnrollPayStatus(e.target.value)}>
                  <option value="paid">Ödendi</option>
                  <option value="pending">Bekliyor</option>
                </select>
              </Field>
            </div>

            <Field label={enrollPayStatus === 'paid' ? 'Tahsil Edilen Tutar (₺)' : 'Tahsil Edilecek Tutar (₺)'}>
              <input type="number" min={0} value={enrollPaid} onChange={e => setEnrollPaid(e.target.value)} />
            </Field>

            <Field label="Notlar (isteğe bağlı)">
              <textarea rows={2} value={enrollNotes} onChange={e => setEnrollNotes(e.target.value)}
                placeholder="Varsa eklemek istediğiniz notlar…" style={{ resize:'vertical' }} />
            </Field>
          </div>
        </Modal>
      )}

      {/* ══ PAKET OLUŞTUR / DÜZENLE MODALI ══ */}
      {pkgModal && (
        <Modal
          title={pkgModal.type === 'add' ? 'Paket Oluştur' : 'Paketi Düzenle'}
          wide
          onClose={() => setPkgModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setPkgModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={savePkg} disabled={saving}>
                {saving ? 'Kaydediliyor…' : (pkgModal.type === 'add' ? 'Oluştur' : 'Güncelle')}
              </button>
            </>
          }
        >
          <div className="fields" style={{ gap:14 }}>
            <Field label="Paket Adı *">
              <input value={form.name || ''} placeholder="Örn: 10 Ders Paketi"
                onChange={e => setForm({...form, name: e.target.value})} />
            </Field>
            <Field label="Açıklama">
              <textarea rows={2} value={form.description || ''} placeholder="Paket hakkında kısa bilgi…"
                onChange={e => setForm({...form, description: e.target.value})} style={{ resize:'vertical' }} />
            </Field>

            <div className="fields-2">
              <Field label="Ders Sayısı *">
                <input type="number" min={1} placeholder="10" value={form.total_lessons ?? ''}
                  onChange={e => setForm({...form, total_lessons: e.target.value})} />
              </Field>
              <Field label="Fiyat (₺) *">
                <input type="number" min={0} placeholder="0" value={form.price ?? ''}
                  onChange={e => setForm({...form, price: e.target.value})} />
              </Field>
            </div>

            <Field label="Geçerlilik Süresi (gün)">
              <input type="number" min={1} placeholder="90" value={form.validity_days ?? ''}
                onChange={e => setForm({...form, validity_days: e.target.value})} />
            </Field>

            {Number(form.total_lessons) > 0 && Number(form.price) > 0 && (
              <div style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#7C3AED' }}>
                Ders başı: {fmtMoney(Number(form.price) / Number(form.total_lessons))}
              </div>
            )}

            <Switch on={form.is_active !== false} onChange={v => setForm({...form, is_active: v})} label="Aktif Paket" />
          </div>
        </Modal>
      )}

      {/* ══ ÖDEME ONAY MODALI ══ */}
      {confirmModal && (
        <Modal
          title="Ödemeyi Onayla"
          onClose={() => setConfirmModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={doConfirmPayment} disabled={confirming}>
                {confirming ? 'İşleniyor…' : 'Ödemeyi Onayla'}
              </button>
            </>
          }
        >
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:'var(--bg)', borderRadius:10, padding:'12px 16px', border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:700, fontSize:15 }}>{confirmModal.playerPkg.player?.full_name || '—'}</div>
              <div style={{ fontSize:13, color:'var(--text-2)', marginTop:4 }}>{confirmModal.playerPkg.package?.name}</div>
              <div style={{ fontSize:13, color:'var(--text-2)' }}>{confirmModal.playerPkg.package?.total_lessons} ders · {confirmModal.playerPkg.package?.validity_days} gün geçerli</div>
            </div>
            <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'12px 16px' }}>
              <div style={{ fontSize:13, color:'#22C55E', fontWeight:600 }}>Tahsil edilecek tutar</div>
              <div style={{ fontSize:26, fontWeight:800, color:'#22C55E' }}>{fmtMoney(confirmModal.playerPkg.total_paid ?? confirmModal.playerPkg.package?.price)}</div>
            </div>
            <div style={{ fontSize:13, color:'var(--text-2)' }}>
              Onayladığınızda bu tutar finanslara "Ders Paketi Geliri" olarak kaydedilecek ve öğrencinin paketi aktif hale gelecektir.
            </div>
          </div>
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
    custom_fee:     member.custom_fee != null ? String(member.custom_fee) : '',
  });
  return (
    <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1.2fr 1fr auto auto', gap:6, alignItems:'center', background:'#EEF2FF', borderRadius:10, padding:'8px 10px', border:'1px solid #C7D2FE' }}>
      <input value={vals.member_name} placeholder="Üye adı *"
        onChange={e => setVals({...vals, member_name: e.target.value})} style={{ fontSize:13 }} />
      <input value={vals.contact_number} placeholder="Telefon"
        onChange={e => setVals({...vals, contact_number: e.target.value})} style={{ fontSize:13 }} />
      <input value={vals.contact_person} placeholder="Veli / İletişim"
        onChange={e => setVals({...vals, contact_person: e.target.value})} style={{ fontSize:13 }} />
      <input type="number" min={0} value={vals.custom_fee} placeholder="Özel ücret (₺)"
        onChange={e => setVals({...vals, custom_fee: e.target.value})} style={{ fontSize:13 }} title="Boş bırakılırsa grup aidatı uygulanır" />
      <button className="btn btn-success btn-sm btn-icon" onClick={() => onSave(member.id, vals)}>
        <span className="material-icons" style={{fontSize:14}}>check</span>
      </button>
      <button className="btn btn-ghost btn-sm btn-icon" onClick={onCancel}>
        <span className="material-icons" style={{fontSize:14}}>close</span>
      </button>
    </div>
  );
}

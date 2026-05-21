// ── Üyeler & Üyelik Paketleri ───────────────────────────────────

const STATUS_LABELS = { pending: 'Bekliyor', active: 'Aktif', cancelled: 'İptal', expired: 'Süresi Doldu' };
const STATUS_CLS    = { pending: 'b-warning', active: 'b-success', cancelled: 'b-danger', expired: 'b-muted' };
const GENDER_LABELS = { male: 'Erkek', female: 'Kadın', other: 'Diğer' };

function displayName(m) {
  if (m.profile?.full_name) return m.profile.full_name;
  if (m.member_name)        return m.member_name;
  return 'İsimsiz Üye';
}

function pkgMeta(pkg) {
  if (!pkg) return 'Paketsiz';
  const parts = [];
  if (pkg.price != null) {
    const period = pkg.price_period === 'monthly' ? 'ay' : pkg.price_period === 'yearly' ? 'yıl' : 'tek';
    parts.push(`₺${pkg.price}/${period}`);
  }
  parts.push(`${pkg.duration_days} gün`);
  if (pkg.court_extra_fee)            parts.push(`+₺${pkg.court_extra_fee}/rezervasyon`);
  if (pkg.weekly_court_hours_limit)   parts.push(`Hft ${pkg.weekly_court_hours_limit}s`);
  if (pkg.cancellation_limit)         parts.push(`${pkg.cancellation_limit} iptal`);
  if (pkg.penalty_no_reservation || pkg.penalty_full_price) parts.push('Yaptırımlı');
  return parts.join(' · ');
}

function MemberProfileModal({ member, clubId, packages, onClose }) {
  const { useState, useEffect } = React;
  const [bookings,  setBookings]  = useState([]);
  const [loadingBk, setLoadingBk] = useState(true);

  useEffect(() => {
    if (!member?.user_id) { setLoadingBk(false); return; }
    (async () => {
      setLoadingBk(true);
      try {
        const courtIds = await getClubCourtIds(clubId);
        if (courtIds.length === 0) { setLoadingBk(false); return; }
        const { data } = await sb.from('booking_players')
          .select('booking:bookings!booking_players_booking_id_fkey(id,start_time,end_time,status,payment_status,total_amount,court:courts!bookings_court_id_fkey(court_number,court_type))')
          .eq('player_id', member.user_id)
          .in('booking.court_id', courtIds)
          .order('booking(start_time)', { ascending: false })
          .limit(10);
        setBookings((data || []).map(d => d.booking).filter(Boolean));
      } catch (e) { console.error(e); }
      finally { setLoadingBk(false); }
    })();
  }, [member?.user_id, clubId]);

  const name  = member.profile?.full_name || member.member_name || 'İsimsiz Üye';
  const pkg   = packages.find(p => p.id === member.package_id);
  const STATUS_CLS = { confirmed:'b-success', completed:'b-muted', cancelled:'b-danger', pending:'b-warning' };

  return (
    <Modal title="Üye Profili" wide onClose={onClose} footer={
      <button className="btn btn-ghost btn-sm" onClick={onClose}>Kapat</button>
    }>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {/* Üst bilgi */}
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Av name={name} size={56} />
          <div>
            <div style={{ fontWeight:800, fontSize:18 }}>{name}</div>
            {(member.member_email || member.profile?.email) && (
              <div style={{ fontSize:13, color:'var(--text-2)' }}>{member.member_email || member.profile?.email}</div>
            )}
            {member.member_phone && <div style={{ fontSize:13, color:'var(--text-2)' }}>{member.member_phone}</div>}
          </div>
        </div>

        {/* Detaylar */}
        <div className="card" style={{ gap:0, padding:0, overflow:'hidden' }}>
          {[
            { label:'Durum',         value: STATUS_LABELS[member.status] || member.status },
            { label:'Üyelik Paketi', value: pkg?.name || 'Paketsiz' },
            { label:'Katılım Tarihi',value: member.join_date ? fmtDate(member.join_date) : '—' },
            { label:'Cinsiyet',      value: GENDER_LABELS[member.gender] || '—' },
            { label:'Doğum Tarihi',  value: member.birth_date ? fmtDate(member.birth_date) : '—' },
          ].map((row, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:13, color:'var(--text-2)' }}>{row.label}</span>
              <span style={{ fontSize:13, fontWeight:600 }}>{row.value}</span>
            </div>
          ))}
          {pkg && (
            <div style={{ padding:'10px 14px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>PAKET DETAYLARI</div>
              <div style={{ fontSize:12, color:'var(--text-2)', display:'flex', flexDirection:'column', gap:2 }}>
                {pkg.price != null && <span>Fiyat: {fmtMoney(pkg.price)} / {pkg.price_period === 'monthly' ? 'ay' : pkg.price_period === 'yearly' ? 'yıl' : 'tek seferlik'}</span>}
                {pkg.duration_days && <span>Süre: {pkg.duration_days} gün</span>}
                {pkg.weekly_court_hours_limit && <span>Haftalık kort limiti: {pkg.weekly_court_hours_limit} saat</span>}
                {pkg.cancellation_limit && <span>Aylık iptal limiti: {pkg.cancellation_limit}</span>}
                {pkg.court_extra_fee && <span>Rezervasyon ek ücreti: {fmtMoney(pkg.court_extra_fee)}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Rezervasyon geçmişi */}
        {member.user_id && (
          <div>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>Son Rezervasyonlar</div>
            {loadingBk ? <Spinner /> : bookings.length === 0 ? (
              <div style={{ fontSize:13, color:'var(--text-2)', textAlign:'center', padding:'12px 0' }}>Henüz rezervasyon yok.</div>
            ) : (
              <div className="table-wrap">
                {bookings.map((b, i) => {
                  const start = b.start_time ? new Date(b.start_time) : null;
                  return (
                    <div key={b.id} style={{ display:'flex', alignItems:'center', padding:'10px 14px', gap:10, borderBottom: i < bookings.length-1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>Kort {b.court?.court_number || '?'} — {b.court?.court_type || ''}</div>
                        <div style={{ fontSize:11, color:'var(--text-2)' }}>
                          {start ? start.toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                          {start ? ` ${start.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })}` : ''}
                        </div>
                      </div>
                      <Badge cls={STATUS_CLS[b.status] || 'b-muted'}>{b.status === 'confirmed' ? 'Onaylı' : b.status === 'completed' ? 'Tamamlandı' : b.status === 'cancelled' ? 'İptal' : b.status}</Badge>
                      {b.total_amount != null && (
                        <span style={{ fontWeight:700, fontSize:13 }}>{fmtMoney(b.total_amount)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function MembersScreen({ clubId }) {
  const { useState, useEffect, useCallback } = React;

  // Liste state
  const [members,      setMembers]      = useState([]);
  const [packages,     setPackages]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [view,         setView]         = useState('members');
  const [approvingId,  setApprovingId]  = useState(null);
  const [profileMember, setProfileMember] = useState(null);

  // Üye ekle modal
  const [addVisible,      setAddVisible]      = useState(false);
  const [addMode,         setAddMode]         = useState('manual'); // 'manual' | 'search'
  const [manualName,      setManualName]      = useState('');
  const [manualPhone,     setManualPhone]     = useState('');
  const [manualEmail,     setManualEmail]     = useState('');
  const [manualBirth,     setManualBirth]     = useState('');
  const [manualGender,    setManualGender]    = useState('');
  const [manualPkgId,     setManualPkgId]     = useState('');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [searchResults,   setSearchResults]   = useState([]);
  const [searching,       setSearching]       = useState(false);
  const [saving,          setSaving]          = useState(false);

  // Paket modal
  const [pkgVisible,      setPkgVisible]      = useState(false);
  const [editPkg,         setEditPkg]         = useState(null);
  const [pkgForm,         setPkgForm]         = useState({});
  const [savingPkg,       setSavingPkg]       = useState(false);

  // ── Veri yükleme ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      // Süresi dolmuş üyelikleri güncelle (hata olursa devam et)
      try { await sb.rpc('expire_past_memberships'); } catch {}

      const [memRes, pkgRes] = await Promise.all([
        sb.from('club_memberships')
          .select('*, package:club_membership_packages(*), profile:profiles(id, full_name, profile_photo_url)')
          .eq('club_id', clubId)
          .order('created_at', { ascending: false }),
        sb.from('club_membership_packages')
          .select('*')
          .eq('club_id', clubId)
          .order('created_at', { ascending: true }),
      ]);
      setMembers(memRes.data || []);
      setPackages(pkgRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clubId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Onay / Red ───────────────────────────────────────────────
  const approveM = async (m) => {
    setApprovingId(m.id);
    try {
      await sb.from('club_memberships').update({ status: 'active' }).eq('id', m.id);
      // Üyeye bildirim gönder
      if (m.profile?.id || m.user_id) {
        const uid = m.profile?.id || m.user_id;
        const { data: club } = await sb.from('club_profiles').select('club_name').eq('id', clubId).single();
        await sb.from('notifications').insert({
          user_id: uid, type: 'membership_accepted',
          title: 'Üyelik Onaylandı',
          message: `${club?.club_name ?? 'Kulüp'} kulübüne üyeliğiniz onaylandı.`,
          is_read: false,
        });
      }
      loadData();
    } catch (e) { alert(e.message); }
    finally { setApprovingId(null); }
  };

  const rejectM = async (m) => {
    if (!confirm('Bu üyeyi iptal etmek istediğinize emin misiniz?')) return;
    try {
      await sb.from('club_memberships').update({ status: 'cancelled' }).eq('id', m.id);
      if (m.profile?.id || m.user_id) {
        const uid = m.profile?.id || m.user_id;
        const { data: club } = await sb.from('club_profiles').select('club_name').eq('id', clubId).single();
        await sb.from('notifications').insert({
          user_id: uid, type: 'membership_rejected',
          title: 'Üyelik Reddedildi',
          message: `${club?.club_name ?? 'Kulüp'} kulübüne üyelik başvurunuz reddedildi.`,
          is_read: false,
        });
      }
      loadData();
    } catch (e) { alert(e.message); }
  };

  // ── Kullanıcı arama ──────────────────────────────────────────
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (q) => {
    setSearchQuery(q);
    setSearchError('');
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data, error } = await sb.from('profiles')
        .select('id, full_name, profile_photo_url')
        .ilike('full_name', `%${q}%`)
        .eq('user_type', 'player')
        .limit(10);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (e) {
      console.error('Search error:', e);
      setSearchError(e.message || 'Arama sırasında hata oluştu');
      setSearchResults([]);
    }
    setSearching(false);
  };

  const resetAddForm = () => {
    setManualName(''); setManualPhone(''); setManualEmail('');
    setManualBirth(''); setManualGender(''); setManualPkgId('');
    setSearchQuery(''); setSearchResults([]); setSearchError(''); setAddMode('manual');
  };

  // ── Üye ekle (manuel) ────────────────────────────────────────
  const handleAddManual = async () => {
    if (!manualName.trim()) { alert('İsim zorunludur.'); return; }
    setSaving(true);
    try {
      const { error } = await sb.from('club_memberships').insert({
        club_id:      clubId,
        package_id:   manualPkgId || null,
        user_id:      null,
        member_name:  manualName.trim(),
        member_phone: manualPhone.trim() || null,
        member_email: manualEmail.trim() || null,
        gender:       manualGender || null,
        birth_date:   manualBirth.trim() || null,
        status:       'active',
        join_date:    new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
      setAddVisible(false);
      resetAddForm();
      loadData();
    } catch (e) { alert(e.message ?? 'Üye eklenemedi.'); }
    finally { setSaving(false); }
  };

  // ── Üye ekle (aramadan) ──────────────────────────────────────
  const handleAddFromSearch = async (profile) => {
    setSaving(true);
    try {
      const { error } = await sb.from('club_memberships').insert({
        club_id:     clubId,
        package_id:  manualPkgId || null,
        user_id:     profile.id,
        member_name: profile.full_name,
        status:      'active',
        join_date:   new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
      setAddVisible(false);
      resetAddForm();
      loadData();
    } catch (e) { alert(e.message ?? 'Üye eklenemedi.'); }
    finally { setSaving(false); }
  };

  // ── Paket kaydet ─────────────────────────────────────────────
  const openNewPkg = () => {
    setEditPkg(null);
    setPkgForm({ price_period: 'monthly', duration_days: 30, allow_guest: true, valid_days: 'all',
      penalty_no_reservation: false, penalty_full_price: false, is_active: true });
    setPkgVisible(true);
  };

  const openEditPkg = (pkg) => {
    setEditPkg(pkg);
    setPkgForm({ ...pkg });
    setPkgVisible(true);
  };

  const handleSavePkg = async () => {
    if (!pkgForm.name?.trim()) { alert('Paket adı zorunludur.'); return; }
    if (pkgForm.penalty_no_reservation && !pkgForm.penalty_duration_days) {
      alert('Rezervasyon yapamaması yaptırımı için kaç gün olduğunu belirtin.'); return;
    }
    setSavingPkg(true);
    try {
      const noPenalty = !pkgForm.penalty_no_reservation && !pkgForm.penalty_full_price;
      const payload = {
        name:                       pkgForm.name.trim(),
        description:                pkgForm.description?.trim() || null,
        price:                      pkgForm.price ? parseFloat(pkgForm.price) : null,
        price_period:               pkgForm.price_period || 'monthly',
        duration_days:              parseInt(pkgForm.duration_days) || 30,
        court_extra_fee:            pkgForm.court_extra_fee ? parseFloat(pkgForm.court_extra_fee) : null,
        weekly_court_hours_limit:   pkgForm.weekly_court_hours_limit ? parseFloat(pkgForm.weekly_court_hours_limit) : null,
        cancellation_limit:         pkgForm.cancellation_limit ? parseInt(pkgForm.cancellation_limit) : null,
        penalty_no_reservation:     noPenalty ? false : !!pkgForm.penalty_no_reservation,
        penalty_full_price:         noPenalty ? false : !!pkgForm.penalty_full_price,
        penalty_duration_days:      (pkgForm.penalty_no_reservation && pkgForm.penalty_duration_days) ? parseInt(pkgForm.penalty_duration_days) : null,
        allow_guest:                pkgForm.allow_guest !== false,
        guest_primetime_only:       !!(pkgForm.allow_guest && pkgForm.guest_primetime_start && pkgForm.guest_primetime_end),
        guest_primetime_start:      (pkgForm.allow_guest && pkgForm.guest_primetime_start) ? pkgForm.guest_primetime_start : null,
        guest_primetime_end:        (pkgForm.allow_guest && pkgForm.guest_primetime_end) ? pkgForm.guest_primetime_end : null,
        guest_fee:                  (pkgForm.allow_guest && pkgForm.guest_fee) ? parseFloat(pkgForm.guest_fee) : null,
        valid_days:                 pkgForm.valid_days || 'all',
        is_active:                  pkgForm.is_active !== false,
      };
      if (editPkg) {
        await sb.from('club_membership_packages').update(payload).eq('id', editPkg.id);
      } else {
        await sb.from('club_membership_packages').insert({ club_id: clubId, ...payload });
      }
      setPkgVisible(false);
      loadData();
    } catch (e) { alert(e.message); }
    finally { setSavingPkg(false); }
  };

  const togglePkg = async (pkg) => {
    if (!confirm(`"${pkg.name}" paketini ${pkg.is_active ? 'pasifleştirmek' : 'aktifleştirmek'} istediğinizden emin misiniz?`)) return;
    await sb.from('club_membership_packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id);
    loadData();
  };

  // ── Filtre & arama ───────────────────────────────────────────
  const filtered = members.filter(m => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return displayName(m).toLowerCase().includes(q) ||
             (m.member_email || m.profile?.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  const pendingCount = members.filter(m => m.status === 'pending').length;

  const TAB_ITEMS = [
    { key: 'all',       label: 'Tümü',         count: members.length },
    { key: 'active',    label: 'Aktif',         count: members.filter(m => m.status === 'active').length },
    { key: 'pending',   label: 'Bekliyor',      count: pendingCount },
    { key: 'cancelled', label: 'İptal',         count: members.filter(m => m.status === 'cancelled').length },
    { key: 'expired',   label: 'Süresi Doldu',  count: members.filter(m => m.status === 'expired').length },
  ];

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Üyeler</h1>
          <div className="sub">
            {members.length} üye kayıtlı{pendingCount > 0 ? ` · ${pendingCount} bekliyor` : ''}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div className="tabs">
            <button className={view === 'members'  ? 'active' : ''} onClick={() => setView('members')}>Üyeler</button>
            <button className={view === 'packages' ? 'active' : ''} onClick={() => setView('packages')}>Paketler</button>
          </div>
          {view === 'members' && (
            <button className="btn btn-pri" onClick={() => { resetAddForm(); setAddVisible(true); }}>
              <span className="material-icons">person_add</span> Üye Ekle
            </button>
          )}
          {view === 'packages' && (
            <button className="btn btn-pri" onClick={openNewPkg}>
              <span className="material-icons">add</span> Paket Ekle
            </button>
          )}
        </div>
      </div>

      {/* ── Üyeler listesi ── */}
      {view === 'members' && (
        <div className="table-wrap">
          <div className="table-toolbar">
            <div className="search">
              <span className="material-icons">search</span>
              <input placeholder="İsim veya e-posta ara…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Tabs items={TAB_ITEMS} active={filter} onChange={setFilter} />
          </div>
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState icon="group" title="Üye bulunamadı" sub="Üye eklemek için + butonunu kullanın." />
          ) : (
            <div>
              {filtered.map(m => (
                <div key={m.id} className="member-card">
                  <Av name={displayName(m)} />
                  <div className="info">
                    <div className="n">{displayName(m)}</div>
                    <div className="s">
                      {m.package?.name ?? 'Paketsiz'}
                      {m.join_date ? ` · ${fmtDate(m.join_date)}` : ''}
                      {(m.member_phone || m.member_email) ? ` · ${m.member_phone || m.member_email}` : ''}
                    </div>
                  </div>
                  <Badge cls={STATUS_CLS[m.status] || ''}>{STATUS_LABELS[m.status] || m.status}</Badge>
                  <div className="actions">
                    <button className="btn btn-ghost btn-sm btn-icon" title="Profil Detayı" onClick={() => setProfileMember(m)}>
                      <span className="material-icons" style={{fontSize:16}}>person</span>
                    </button>
                    {m.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => approveM(m)}
                          disabled={approvingId === m.id}
                        >
                          {approvingId === m.id
                            ? <Spinner size={14} />
                            : <><span className="material-icons" style={{fontSize:14}}>check</span> Onayla</>}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => rejectM(m)}>Reddet</button>
                      </>
                    )}
                    {m.status === 'active' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => rejectM(m)}>İptal Et</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Paketler ── */}
      {view === 'packages' && (
        <div>
          {loading ? <Spinner /> : packages.length === 0 ? (
            <EmptyState icon="card_membership" title="Henüz paket yok" sub="İlk üyelik paketinizi oluşturun." />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
              {packages.map(pkg => (
                <div key={pkg.id} className="card" style={{ opacity: pkg.is_active ? 1 : 0.6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:17 }}>{pkg.name}</div>
                      {pkg.price != null && (
                        <div style={{ fontSize:22, fontWeight:800, color:'var(--brand-navy)', marginTop:4 }}>
                          {fmtMoney(pkg.price)}
                          <span style={{ fontSize:12, fontWeight:500, color:'var(--text-2)', marginLeft:4 }}>
                            /{pkg.price_period === 'monthly' ? 'ay' : pkg.price_period === 'yearly' ? 'yıl' : 'tek'}
                          </span>
                        </div>
                      )}
                      <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2 }}>{pkg.duration_days} gün</div>
                    </div>
                    <Badge cls={pkg.is_active ? 'b-success' : 'b-muted'}>{pkg.is_active ? 'Aktif' : 'Pasif'}</Badge>
                  </div>
                  {pkg.description && <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:10 }}>{pkg.description}</p>}
                  <div style={{ fontSize:12, color:'var(--text-2)', display:'flex', flexDirection:'column', gap:3, marginBottom:12 }}>
                    {pkg.weekly_court_hours_limit && <span>Haftalık kort limiti: {pkg.weekly_court_hours_limit} saat</span>}
                    {pkg.court_extra_fee  && <span>Rezervasyon ek ücreti: {fmtMoney(pkg.court_extra_fee)}</span>}
                    {pkg.cancellation_limit && <span>Aylık iptal limiti: {pkg.cancellation_limit}</span>}
                    {pkg.valid_days && pkg.valid_days !== 'all' && <span>Geçerli: {pkg.valid_days === 'weekdays' ? 'Hafta içi' : 'Hafta sonu'}</span>}
                    {pkg.allow_guest === false && <span style={{ color:'var(--danger)' }}>Misafir yasak</span>}
                    {pkg.guest_fee && <span>Misafir ücreti: {fmtMoney(pkg.guest_fee)}</span>}
                    {(pkg.penalty_no_reservation || pkg.penalty_full_price) && <span style={{ color:'var(--warning)' }}>Yaptırım uygulanır</span>}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => openEditPkg(pkg)}>
                      <span className="material-icons" style={{fontSize:14}}>edit</span> Düzenle
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => togglePkg(pkg)}>
                      {pkg.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Üye Ekle Modalı ── */}
      {addVisible && (
        <Modal title="Üye Ekle" wide onClose={() => { setAddVisible(false); resetAddForm(); }} footer={
          addMode === 'manual' ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAddVisible(false); resetAddForm(); }}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={handleAddManual} disabled={saving}>
                {saving ? 'Ekleniyor…' : 'Kaydet'}
              </button>
            </>
          ) : null
        }>
          {/* Mod seçici */}
          <div style={{ display:'flex', borderRadius:10, overflow:'hidden', border:'1.5px solid var(--border)', marginBottom:18 }}>
            {['manual', 'search'].map(m => (
              <button key={m}
                style={{ flex:1, padding:'9px 0', fontWeight:600, fontSize:13, border:'none', cursor:'pointer',
                  background: addMode === m ? 'var(--brand-navy)' : 'transparent',
                  color: addMode === m ? '#fff' : 'var(--text-2)' }}
                onClick={() => setAddMode(m)}>
                {m === 'manual' ? 'Manuel' : 'Kullanıcı Ara'}
              </button>
            ))}
          </div>

          {addMode === 'manual' ? (
            <div className="fields" style={{ gap:12 }}>
              <Field label="İsim Soyisim *">
                <input placeholder="Ad Soyad" value={manualName} onChange={e => setManualName(e.target.value)} />
              </Field>
              <div className="fields-2">
                <Field label="Telefon">
                  <input placeholder="05XX XXX XX XX" value={manualPhone} onChange={e => setManualPhone(e.target.value)} />
                </Field>
                <Field label="E-posta">
                  <input type="email" placeholder="ornek@mail.com" value={manualEmail} onChange={e => setManualEmail(e.target.value)} />
                </Field>
              </div>
              <div className="fields-2">
                <Field label="Doğum Tarihi">
                  <input type="date" value={manualBirth} onChange={e => setManualBirth(e.target.value)} />
                </Field>
                <Field label="Cinsiyet">
                  <select value={manualGender} onChange={e => setManualGender(e.target.value)}>
                    <option value="">Seçin…</option>
                    <option value="male">Erkek</option>
                    <option value="female">Kadın</option>
                    <option value="other">Diğer</option>
                  </select>
                </Field>
              </div>
              <Field label="Üyelik Paketi">
                <select value={manualPkgId} onChange={e => setManualPkgId(e.target.value)}>
                  <option value="">Paketsiz</option>
                  {packages.filter(p => p.is_active).map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.price != null ? ` — ${fmtMoney(p.price)}` : ''}</option>
                  ))}
                </select>
              </Field>
            </div>
          ) : (
            <div className="fields" style={{ gap:12 }}>
              <div className="search" style={{ marginBottom:0 }}>
                <span className="material-icons">search</span>
                <input
                  placeholder="İsimle kullanıcı ara…"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  autoComplete="off"
                />
              </div>
              {searching && <Spinner size={24} />}
              {searchError && (
                <div style={{ color:'var(--danger)', fontSize:13, padding:'8px 12px', background:'#FEF2F2', borderRadius:8 }}>
                  {searchError}
                </div>
              )}
              {searchResults.length > 0 && (
                <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
                  {searchResults.map(p => (
                    <div key={p.id}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor: saving ? 'default' : 'pointer',
                        opacity: saving ? 0.7 : 1, borderBottom:'1px solid var(--border)' }}
                      onClick={() => !saving && handleAddFromSearch(p)}>
                      <div style={{
                        width:36, height:36, borderRadius:18, flexShrink:0,
                        background:'rgba(0,51,153,0.1)', display:'flex', alignItems:'center', justifyContent:'center'
                      }}>
                        {p.profile_photo_url
                          ? <img src={p.profile_photo_url} alt={p.full_name} style={{ width:36, height:36, borderRadius:18, objectFit:'cover' }} />
                          : <span style={{ fontSize:15, fontWeight:700, color:'#003399' }}>
                              {(p.full_name || '?').charAt(0).toUpperCase()}
                            </span>
                        }
                      </div>
                      <div style={{ flex:1, fontWeight:600, fontSize:13 }}>{p.full_name}</div>
                      {saving && <Spinner size={14} />}
                    </div>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && !searching && !searchError && (
                <div style={{ color:'var(--text-2)', fontSize:13, textAlign:'center', padding:'12px 0' }}>Kullanıcı bulunamadı</div>
              )}
              <Field label="Üyelik Paketi">
                <select value={manualPkgId} onChange={e => setManualPkgId(e.target.value)}>
                  <option value="">Paketsiz</option>
                  {packages.filter(p => p.is_active).map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.price != null ? ` — ${fmtMoney(p.price)}` : ''}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </Modal>
      )}

      {/* ── Üye Profil Modalı ── */}
      {profileMember && (
        <MemberProfileModal
          member={profileMember}
          clubId={clubId}
          packages={packages}
          onClose={() => setProfileMember(null)}
        />
      )}

      {/* ── Paket Ekle/Düzenle Modalı ── */}
      {pkgVisible && (
        <Modal title={editPkg ? 'Paketi Düzenle' : 'Yeni Paket'} wide onClose={() => setPkgVisible(false)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setPkgVisible(false)}>Vazgeç</button>
            <button className="btn btn-pri btn-sm" onClick={handleSavePkg} disabled={savingPkg}>
              {savingPkg ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </>
        }>
          <div className="fields" style={{ gap:14 }}>
            <Field label="Paket Adı *">
              <input placeholder="Örn: Aylık Üyelik" value={pkgForm.name || ''} onChange={e => setPkgForm({...pkgForm, name: e.target.value})} />
            </Field>
            <Field label="Açıklama">
              <textarea rows={2} placeholder="Paket açıklaması…" value={pkgForm.description || ''} onChange={e => setPkgForm({...pkgForm, description: e.target.value})} style={{ resize:'vertical' }} />
            </Field>

            <div className="fields-2">
              <Field label="Fiyat (₺)">
                <input type="number" min={0} placeholder="0" value={pkgForm.price ?? ''} onChange={e => setPkgForm({...pkgForm, price: e.target.value})} />
              </Field>
              <Field label="Fiyatlandırma Dönemi">
                <select value={pkgForm.price_period || 'monthly'} onChange={e => setPkgForm({...pkgForm, price_period: e.target.value})}>
                  <option value="monthly">Aylık</option>
                  <option value="yearly">Yıllık</option>
                  <option value="once">Tek Seferlik</option>
                </select>
              </Field>
            </div>

            <div className="fields-2">
              <Field label="Süre (gün)">
                <input type="number" min={1} placeholder="30" value={pkgForm.duration_days || ''} onChange={e => setPkgForm({...pkgForm, duration_days: e.target.value})} />
              </Field>
              <Field label="Geçerli Günler">
                <select value={pkgForm.valid_days || 'all'} onChange={e => setPkgForm({...pkgForm, valid_days: e.target.value})}>
                  <option value="all">Her Gün</option>
                  <option value="weekdays">Hafta İçi</option>
                  <option value="weekends">Hafta Sonu</option>
                </select>
              </Field>
            </div>

            <div className="fields-2">
              <Field label="Rezervasyon Ek Ücreti (₺)">
                <input type="number" min={0} placeholder="Yok" value={pkgForm.court_extra_fee ?? ''} onChange={e => setPkgForm({...pkgForm, court_extra_fee: e.target.value})} />
              </Field>
              <Field label="Haftalık Kort Limiti (saat)">
                <input type="number" min={0} placeholder="Sınırsız" value={pkgForm.weekly_court_hours_limit ?? ''} onChange={e => setPkgForm({...pkgForm, weekly_court_hours_limit: e.target.value})} />
              </Field>
            </div>

            <Field label="Aylık İptal Limiti">
              <input type="number" min={0} placeholder="Sınırsız" value={pkgForm.cancellation_limit ?? ''} onChange={e => setPkgForm({...pkgForm, cancellation_limit: e.target.value})} />
            </Field>

            {/* Misafir */}
            <div style={{ background:'var(--bg)', borderRadius:10, padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'var(--text-2)', marginBottom:2 }}>Üye Olmayan ile Oynama</div>
              <div style={{ display:'flex', gap:10 }}>
                {[true, false].map(v => (
                  <label key={String(v)} style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', fontSize:14 }}>
                    <input type="radio" checked={pkgForm.allow_guest !== false ? v === true : v === false}
                      onChange={() => setPkgForm({...pkgForm, allow_guest: v,
                        guest_primetime_start: v ? pkgForm.guest_primetime_start : '',
                        guest_primetime_end:   v ? pkgForm.guest_primetime_end   : '',
                        guest_fee:             v ? pkgForm.guest_fee             : '' })} />
                    {v ? 'İzinli' : 'Yasak'}
                  </label>
                ))}
              </div>
              {pkgForm.allow_guest !== false && (
                <>
                  <Field label="Misafir Ücreti (₺/rezervasyon)">
                    <input type="number" min={0} placeholder="Ücretsiz" value={pkgForm.guest_fee ?? ''} onChange={e => setPkgForm({...pkgForm, guest_fee: e.target.value})} />
                  </Field>
                  <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:4 }}>Primetime saatleri (bu saatlerde misafir yasak — boş bırakırsanız kısıtlama yok)</div>
                  <div className="fields-2">
                    <Field label="Başlangıç">
                      <input type="time" value={pkgForm.guest_primetime_start || ''} onChange={e => setPkgForm({...pkgForm, guest_primetime_start: e.target.value})} />
                    </Field>
                    <Field label="Bitiş">
                      <input type="time" value={pkgForm.guest_primetime_end || ''} onChange={e => setPkgForm({...pkgForm, guest_primetime_end: e.target.value})} />
                    </Field>
                  </div>
                </>
              )}
            </div>

            {/* Yaptırım — sadece iptal limiti varsa göster */}
            {pkgForm.cancellation_limit && (
              <div style={{ background:'var(--bg)', borderRadius:10, padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'var(--text-2)', marginBottom:2 }}>Limit Aşılınca Yaptırım</div>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14 }}>
                  <input type="checkbox" checked={!!pkgForm.penalty_no_reservation}
                    onChange={e => setPkgForm({...pkgForm, penalty_no_reservation: e.target.checked, penalty_full_price: e.target.checked ? false : pkgForm.penalty_full_price})} />
                  Rezervasyon yapamaması
                </label>
                {pkgForm.penalty_no_reservation && (
                  <Field label="Kaç gün?">
                    <input type="number" min={1} placeholder="Gün sayısı" value={pkgForm.penalty_duration_days || ''} onChange={e => setPkgForm({...pkgForm, penalty_duration_days: e.target.value})} />
                  </Field>
                )}
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14 }}>
                  <input type="checkbox" checked={!!pkgForm.penalty_full_price}
                    onChange={e => setPkgForm({...pkgForm, penalty_full_price: e.target.checked, penalty_no_reservation: e.target.checked ? false : pkgForm.penalty_no_reservation})} />
                  O haftaki rezervasyonları normal ücretle
                </label>
              </div>
            )}

            <Switch on={pkgForm.is_active !== false} onChange={v => setPkgForm({...pkgForm, is_active: v})} label="Aktif Paket" />
          </div>
        </Modal>
      )}
    </div>
  );
}

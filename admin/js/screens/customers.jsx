// ── Müşteriler (CRM) ────────────────────────────────────────────

const GENDER_LABELS_C = { male: 'Erkek', female: 'Kadın', other: 'Diğer' };

// ── Detay Modalı ──────────────────────────────────────────────
function CustomerDetailModal({ customer, clubId, onClose, onReservation, onLinked }) {
  const { useState, useEffect } = React;
  const [tab,        setTab]        = useState('bookings');
  const [stats,      setStats]      = useState(null);
  const [bookings,   setBookings]   = useState([]);
  const [packages,   setPackages]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Eşleştir akışı
  const [linkStep,    setLinkStep]    = useState('idle'); // 'idle' | 'search' | 'confirm'
  const [linkQuery,   setLinkQuery]   = useState('');
  const [linkResults, setLinkResults] = useState([]);
  const [linkTarget,  setLinkTarget]  = useState(null);
  const [linkSaving,  setLinkSaving]  = useState(false);

  useEffect(() => {
    load();
  }, [customer.id]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, b, p] = await Promise.all([
        CustomerSvc.getCustomerStats(customer.id, clubId, customer.user_id),
        CustomerSvc.getCustomerBookings(customer.id, clubId, customer.user_id),
        CustomerSvc.getCustomerLessonPackages(customer.id, clubId, customer.user_id, customer.full_name),
      ]);
      setStats(s);
      setBookings(b);
      setPackages(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const searchProfiles = async (q) => {
    setLinkQuery(q);
    if (q.length < 2) { setLinkResults([]); return; }
    const { data } = await sb.from('profiles')
      .select('id, full_name, email')
      .ilike('full_name', `%${q}%`)
      .eq('user_type', 'player')
      .limit(8);
    setLinkResults(data || []);
  };

  const confirmLink = async () => {
    if (!linkTarget) return;
    setLinkSaving(true);
    try {
      await CustomerSvc.linkToProfile(customer.id, linkTarget.id);
      setLinkStep('idle');
      setLinkTarget(null);
      setLinkQuery('');
      setLinkResults([]);
      onLinked();
    } catch (e) { alert(e.message); }
    finally { setLinkSaving(false); }
  };

  const tabItems = [
    { key: 'bookings', label: `Rezervasyonlar (${bookings.length})` },
    { key: 'packages', label: `Ders Paketleri (${packages.length})` },
  ];

  const bkStatusColor = { confirmed: '#22C55E', completed: '#6366F1', cancelled: '#EF4444', pending: '#F59E0B' };
  const pkgStatusColor = { active: '#22C55E', completed: '#6366F1', expired: '#F59E0B', cancelled: '#EF4444' };

  return (
    <Modal
      title={customer.full_name}
      wide
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Kapat</button>
          <button className="btn btn-pri btn-sm" onClick={() => onReservation(customer)}>
            <span className="material-icons" style={{ fontSize: 15 }}>event_available</span>
            Rezervasyon Oluştur
          </button>
        </>
      }
    >
      {/* Profil bilgileri */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <Av name={customer.full_name} size={52} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{customer.full_name}</span>
            {customer.user_id
              ? <span style={{ background: '#EEF2FF', color: 'var(--brand-navy)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>CourtyCLUB</span>
              : <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '2px 10px', height: 'auto' }}
                  onClick={() => setLinkStep('search')}>
                  <span className="material-icons" style={{ fontSize: 12 }}>link</span> Eşleştir
                </button>
            }
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--text-2)' }}>
            <span><span className="material-icons" style={{ fontSize: 12, verticalAlign: 'middle' }}>phone</span> {customer.phone}</span>
            {customer.email && <span><span className="material-icons" style={{ fontSize: 12, verticalAlign: 'middle' }}>email</span> {customer.email}</span>}
            {customer.gender && <span>{GENDER_LABELS_C[customer.gender]}</span>}
            {customer.birth_date && <span><span className="material-icons" style={{ fontSize: 12, verticalAlign: 'middle' }}>cake</span> {fmtDate(customer.birth_date)}</span>}
          </div>
          {customer.notes && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic', background: 'var(--bg)', borderRadius: 8, padding: '5px 10px' }}>
              {customer.notes}
            </div>
          )}
        </div>
      </div>

      {/* Eşleştir akışı */}
      {linkStep === 'search' && (
        <div style={{ marginBottom: 16, padding: 14, background: '#EEF2FF', borderRadius: 12, border: '1px solid #C7D2FE' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--brand-navy)' }}>CourtyCLUB Hesabı Ara</div>
          <div style={{ position: 'relative' }}>
            <input placeholder="Oyuncu adı ara..." value={linkQuery}
              onChange={e => searchProfiles(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }} />
            {linkResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: 4 }}>
                {linkResults.map(p => (
                  <div key={p.id}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseDown={() => { setLinkTarget(p); setLinkStep('confirm'); setLinkResults([]); }}>
                    <span className="material-icons" style={{ fontSize: 14, color: 'var(--brand-navy)' }}>person</span>
                    <span style={{ flex: 1, fontWeight: 600 }}>{p.full_name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{p.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => { setLinkStep('idle'); setLinkQuery(''); setLinkResults([]); }}>
            Vazgeç
          </button>
        </div>
      )}

      {linkStep === 'confirm' && linkTarget && (
        <div style={{ marginBottom: 16, padding: 14, background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#92400E' }}>
            <span className="material-icons" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>warning</span>
            Eşleştirmeyi Onayla
          </div>
          <div style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-1)' }}>
            <strong>{customer.full_name}</strong> müşterisi ile <strong>{linkTarget.full_name}</strong> ({linkTarget.email}) hesabını eşleştirmek istediğinize emin misiniz?
            Eski rezervasyonlar da bu hesaba bağlanacak.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setLinkStep('idle'); setLinkTarget(null); }}>Vazgeç</button>
            <button className="btn btn-pri btn-sm" onClick={confirmLink} disabled={linkSaving}>
              {linkSaving ? 'Eşleştiriliyor…' : 'Evet, Eşleştir'}
            </button>
          </div>
        </div>
      )}

      {/* İstatistikler */}
      {stats && (
        <div className="stats" style={{ marginBottom: 16 }}>
          <StatCard icon="account_balance_wallet" n={fmtMoney(stats.totalSpent)} label="Toplam Harcama" tint="navy" />
          <StatCard icon="event_available"        n={stats.bookingCount}          label="Rezervasyon" />
          <StatCard icon="inventory_2"            n={stats.packageCount}          label="Ders Paketi" />
        </div>
      )}

      {/* Sekmeler */}
      <Tabs items={tabItems} active={tab} onChange={setTab} />
      <div style={{ marginTop: 12 }}>
        {loading ? <Spinner /> : tab === 'bookings' ? (
          bookings.length === 0
            ? <EmptyState icon="event_available" title="Henüz rezervasyon yok" />
            : bookings.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    Kort {b.court?.court_number ?? '?'} · {fmtDateTime(b.start_time)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                    {statusLabel(b.status)} · {paymentLabel(b.payment_status)}
                    {b.total_amount > 0 && ` · ${fmtMoney(b.total_amount)}`}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                  background: (bkStatusColor[b.status] || '#6B7280') + '22',
                  color: bkStatusColor[b.status] || '#6B7280' }}>
                  {statusLabel(b.status)}
                </span>
              </div>
            ))
        ) : (
          packages.length === 0
            ? <EmptyState icon="inventory_2" title="Ders paketi yok" sub="Müşteri CourtyCLUB hesabına bağlı değilse paketler görüntülenemez." />
            : packages.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.package?.name ?? 'Paket'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                    {p.used_lessons}/{p.total_lessons} ders
                    {p.total_paid > 0 && ` · ${fmtMoney(p.total_paid)}`}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                  background: (pkgStatusColor[p.status] || '#6B7280') + '22',
                  color: pkgStatusColor[p.status] || '#6B7280' }}>
                  {statusLabel(p.status)}
                </span>
              </div>
            ))
        )}
      </div>
    </Modal>
  );
}

// ── Ana Ekran ─────────────────────────────────────────────────
function CustomersScreen({ clubId, setScreen }) {
  const { useState, useEffect, useMemo } = React;

  const [customers,     setCustomers]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [modal,         setModal]         = useState(null); // null | 'add' | 'edit' | 'detail'
  const [selectedCust,  setSelectedCust]  = useState(null);
  const [form,          setForm]          = useState({});
  const [saving,        setSaving]        = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Email ile CourtyCLUB eşleşme kontrolü (add modunda)
  const [emailMatch,      setEmailMatch]      = useState(null);  // null | { id, full_name, email }
  const [emailChecking,   setEmailChecking]   = useState(false);
  const [emailDebounce,   setEmailDebounce]   = useState(null);

  // Manuel CourtyCLUB üye arama (add + edit modunda)
  const [ccQuery,         setCcQuery]         = useState('');
  const [ccResults,       setCcResults]       = useState([]);
  const [ccSelected,      setCcSelected]      = useState(null); // { id, full_name, email }

  useEffect(() => { if (clubId) load(); }, [clubId]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await CustomerSvc.getClubCustomers(clubId);
      setCustomers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const openAdd = () => {
    setForm({ full_name: '', phone: '', email: '', gender: '', birth_date: '', notes: '' });
    setEmailMatch(null);
    setCcQuery(''); setCcResults([]); setCcSelected(null);
    setModal('add');
  };

  const openEdit = (c) => {
    setForm({
      id:               c.id,
      full_name:        c.full_name,
      phone:            c.phone,
      email:            c.email      || '',
      gender:           c.gender     || '',
      birth_date:       c.birth_date || '',
      notes:            c.notes      || '',
      user_id_original: c.user_id    || null, // mevcut bağlantıyı takip et
    });
    setEmailMatch(null);
    setCcQuery(''); setCcResults([]);
    setCcSelected(c.user_id ? { id: c.user_id, full_name: c.full_name, email: c.email } : null);
    setModal('edit');
  };

  const openDetail = (c) => {
    setSelectedCust(c);
    setModal('detail');
  };

  const save = async () => {
    if (!form.full_name?.trim()) { alert('Ad soyad zorunludur.'); return; }
    if (!form.phone?.trim())     { alert('Telefon numarası zorunludur.'); return; }
    setSaving(true);
    try {
      // Hangi CourtyCLUB profili bağlanacak: manuel seçim öncelikli, yoksa email eşleşmesi
      // alreadyLinkedTo varsa o eşleşmeyi kullanma
      const profileToLink = ccSelected || (emailMatch?.alreadyLinkedTo ? null : emailMatch);

      if (modal === 'add') {
        const created = await CustomerSvc.createCustomer(clubId, form);
        if (profileToLink && created?.id) {
          await CustomerSvc.linkToProfile(created.id, profileToLink.id);
        }
      } else {
        await CustomerSvc.updateCustomer(form.id, form);
        // Edit modunda yeni bir profil seçildiyse ve öncekinden farklıysa linkle
        if (ccSelected && ccSelected.id !== form.user_id_original) {
          await CustomerSvc.linkToProfile(form.id, ccSelected.id);
        }
      }
      setModal(null);
      setEmailMatch(null);
      setCcSelected(null); setCcQuery(''); setCcResults([]);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  // Email değişince debounce ile CourtyCLUB profil kontrolü
  const handleEmailChange = (val) => {
    formField('email', val);
    setEmailMatch(null);
    if (emailDebounce) clearTimeout(emailDebounce);
    const trimmed = val.trim();
    if (!trimmed || modal !== 'add') return;
    const t = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const { data: profile } = await sb.from('profiles')
          .select('id, full_name, email')
          .eq('email', trimmed)
          .eq('user_type', 'player')
          .maybeSingle();

        if (!profile) { setEmailMatch(null); return; }

        // Bu profil bu kulüpte başka bir müşteriye bağlı mı?
        const excludeId = form.user_id_original || null;
        const { data: alreadyLinked } = await sb.from('club_customers')
          .select('id, full_name')
          .eq('club_id', clubId)
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .neq('id', form.id || '00000000-0000-0000-0000-000000000000')
          .maybeSingle();

        if (alreadyLinked) {
          // Başka müşteriye bağlı — uyarı ver, eşleştirme yapma
          setEmailMatch({ ...profile, alreadyLinkedTo: alreadyLinked.full_name });
        } else {
          setEmailMatch(profile);
        }
      } catch (e) { /* sessizce geç */ }
      finally { setEmailChecking(false); }
    }, 500);
    setEmailDebounce(t);
  };

  const softDelete = async (id) => {
    try {
      await CustomerSvc.deleteCustomer(id);
      setConfirmDelete(null);
      load();
    } catch (e) { alert(e.message); }
  };

  const openReservationForCustomer = (c) => {
    window.__customerPrefill = {
      customerId:   c.id,
      customerName: c.full_name,
      userId:       c.user_id || null,
    };
    setScreen('reservations');
  };

  const formField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const searchCcProfiles = async (q) => {
    setCcQuery(q);
    if (q.length < 2) { setCcResults([]); return; }
    try {
      // Bu kulüpte zaten başka müşterilere bağlı user_id'leri al
      const { data: linked } = await sb.from('club_customers')
        .select('user_id')
        .eq('club_id', clubId)
        .eq('is_active', true)
        .not('user_id', 'is', null);

      // Düzenlenen müşterinin mevcut bağlantısını hariç tut (değiştirilmesine izin ver)
      const excludeId = form.user_id_original || null;
      const linkedIds = (linked || []).map(c => c.user_id).filter(id => id !== excludeId);

      const { data } = await sb.from('profiles')
        .select('id, full_name, email')
        .ilike('full_name', `%${q}%`)
        .eq('user_type', 'player')
        .limit(20);

      // Zaten bağlı olanları filtrele
      const filtered = (data || []).filter(p => !linkedIds.includes(p.id));
      setCcResults(filtered.slice(0, 8));
    } catch (e) { /* sessizce geç */ }
  };

  return (
    <div className="page fade-in">
      {/* Başlık */}
      <div className="page-head">
        <div>
          <h1>Müşteriler</h1>
          <div className="sub">{customers.length} müşteri kayıtlı</div>
        </div>
        <button className="btn btn-pri" onClick={openAdd}>
          <span className="material-icons">person_add</span> Müşteri Ekle
        </button>
      </div>

      {/* Arama */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <input
            placeholder="Ad, telefon veya e-posta ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: 36, boxSizing: 'border-box' }}
          />
          <span className="material-icons" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-2)', pointerEvents: 'none' }}>search</span>
        </div>
      </div>

      {/* Liste */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState
          icon="people_alt"
          title={searchQuery ? 'Eşleşen müşteri bulunamadı' : 'Henüz müşteri yok'}
          sub={searchQuery ? 'Farklı bir arama terimi deneyin.' : 'İlk müşterinizi ekleyin.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(c => (
            <div key={c.id} className="card tight" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <Av name={c.full_name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{c.full_name}</span>
                  {c.user_id && (
                    <span style={{ background: '#EEF2FF', color: 'var(--brand-navy)', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>
                      CourtyCLUB
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span className="material-icons" style={{ fontSize: 12 }}>phone</span>
                    {c.phone}
                  </span>
                  {c.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span className="material-icons" style={{ fontSize: 12 }}>email</span>
                      {c.email}
                    </span>
                  )}
                </div>
                {c.notes && (
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2, fontStyle: 'italic',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                    {c.notes}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm btn-icon" title="Rezervasyon Oluştur"
                  onClick={() => openReservationForCustomer(c)}>
                  <span className="material-icons" style={{ fontSize: 16 }}>event_available</span>
                </button>
                <button className="btn btn-ghost btn-sm btn-icon" title="Düzenle"
                  onClick={() => openEdit(c)}>
                  <span className="material-icons" style={{ fontSize: 16 }}>edit</span>
                </button>
                <button className="btn btn-ghost btn-sm btn-icon" title="Profil / Geçmiş"
                  onClick={() => openDetail(c)}>
                  <span className="material-icons" style={{ fontSize: 16 }}>open_in_new</span>
                </button>
                <button className="btn btn-danger btn-sm btn-icon" title="Sil"
                  onClick={() => setConfirmDelete(c)}>
                  <span className="material-icons" style={{ fontSize: 16 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ekle / Düzenle Modalı */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal
          title={modal === 'add' ? 'Müşteri Ekle' : 'Müşteri Düzenle'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Vazgeç</button>
              <button className="btn btn-pri btn-sm" onClick={save} disabled={saving}>
                {saving ? 'Kaydediliyor…'
                  : (ccSelected || emailMatch) && modal === 'add' ? 'Kaydet & Eşleştir'
                  : ccSelected && ccSelected.id !== form.user_id_original ? 'Kaydet & Eşleştir'
                  : 'Kaydet'}
              </button>
            </>
          }
        >
          <div className="fields" style={{ gap: 14 }}>
            <Field label="Ad Soyad *">
              <input value={form.full_name || ''} placeholder="Örn: Ahmet Yılmaz"
                onChange={e => formField('full_name', e.target.value)} />
            </Field>
            <Field label="Telefon *">
              <input type="tel" value={form.phone || ''} placeholder="0532 000 00 00"
                onChange={e => formField('phone', e.target.value)} />
            </Field>
            <Field label="E-posta">
              <div style={{ position: 'relative' }}>
                <input type="email" value={form.email || ''} placeholder="ornek@email.com"
                  onChange={e => handleEmailChange(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', paddingRight: emailChecking ? 32 : undefined }} />
                {emailChecking && (
                  <span className="material-icons" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-2)', animation: 'spin 1s linear infinite' }}>refresh</span>
                )}
              </div>
              {emailMatch && !ccSelected && (
                emailMatch.alreadyLinkedTo ? (
                  <div style={{ marginTop: 8, padding: '10px 12px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-icons" style={{ fontSize: 16, color: '#EF4444', flexShrink: 0 }}>warning</span>
                    <div style={{ flex: 1, fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: '#EF4444' }}>Bu email zaten başka bir müşteriye bağlı</div>
                      <div style={{ color: 'var(--text-2)', marginTop: 1 }}>"{emailMatch.alreadyLinkedTo}" müşterisi bu CourtyCLUB hesabını kullanıyor. Eşleştirme yapılmayacak.</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 8, padding: '10px 12px', background: '#EEF2FF', borderRadius: 10, border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-icons" style={{ fontSize: 16, color: 'var(--brand-navy)', flexShrink: 0 }}>link</span>
                    <div style={{ flex: 1, fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>CourtyCLUB hesabı bulundu: {emailMatch.full_name}</div>
                      <div style={{ color: 'var(--text-2)', marginTop: 1 }}>Kayıt bu hesapla otomatik eşleştirilecek. Geçmiş rezervasyonlar da görünecek.</div>
                    </div>
                  </div>
                )
              )}
            </Field>
            <div className="fields-2">
              <Field label="Cinsiyet">
                <select value={form.gender || ''} onChange={e => formField('gender', e.target.value)}>
                  <option value="">Belirtilmemiş</option>
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                  <option value="other">Diğer</option>
                </select>
              </Field>
              <Field label="Doğum Tarihi">
                <input type="date" value={form.birth_date || ''}
                  onChange={e => formField('birth_date', e.target.value)} />
              </Field>
            </div>
            <Field label="Notlar">
              <textarea rows={3} value={form.notes || ''} placeholder="Müşteri hakkında notlar…"
                onChange={e => formField('notes', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>

            {/* CourtyCLUB Hesabı Bağla */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CourtyCLUB Hesabı (opsiyonel)
              </div>
              {ccSelected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EEF2FF', borderRadius: 10, padding: '10px 12px', border: '1px solid #C7D2FE' }}>
                  <span className="material-icons" style={{ color: 'var(--brand-navy)', fontSize: 16 }}>verified_user</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--brand-navy)' }}>{ccSelected.full_name}</div>
                    {ccSelected.email && <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{ccSelected.email}</div>}
                  </div>
                  {/* Edit modunda mevcut bağlantıysa silinemez, yeni seçimse silinebilir */}
                  {ccSelected.id !== form.user_id_original && (
                    <button type="button" onClick={() => { setCcSelected(null); setCcQuery(''); setCcResults([]); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 0 }}>
                      <span className="material-icons" style={{ fontSize: 16 }}>close</span>
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <input placeholder="CourtyCLUB'da üye ara (ad ile)…"
                      value={ccQuery}
                      onChange={e => searchCcProfiles(e.target.value)}
                      style={{ width: '100%', paddingLeft: 34, boxSizing: 'border-box' }} />
                    <span className="material-icons" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--text-2)', pointerEvents: 'none' }}>search</span>
                  </div>
                  {ccResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: 4 }}>
                      {ccResults.map((p, idx) => (
                        <div key={p.id}
                          style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: idx < ccResults.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
                          onMouseDown={() => {
                            setCcSelected(p);
                            setCcQuery('');
                            setCcResults([]);
                            // Email alanı boşsa otomatik doldur
                            if (!form.email?.trim() && p.email) formField('email', p.email);
                          }}>
                          <span className="material-icons" style={{ fontSize: 15, color: 'var(--brand-navy)' }}>person</span>
                          <span style={{ flex: 1, fontWeight: 600 }}>{p.full_name}</span>
                          {p.email && <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{p.email}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 5 }}>
                    Bağlanırsa geçmiş rezervasyonlar da bu müşteride görünür.
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Detay Modalı */}
      {modal === 'detail' && selectedCust && (
        <CustomerDetailModal
          customer={selectedCust}
          clubId={clubId}
          onClose={() => { setModal(null); setSelectedCust(null); }}
          onReservation={(c) => { setModal(null); openReservationForCustomer(c); }}
          onLinked={() => {
            load();
            // selectedCust güncelle
            CustomerSvc.getClubCustomers(clubId).then(data => {
              const updated = data.find(x => x.id === selectedCust.id);
              if (updated) setSelectedCust(updated);
            });
          }}
        />
      )}

      {/* Silme Onayı */}
      {confirmDelete && (
        <Modal
          title="Müşteriyi Sil"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>Vazgeç</button>
              <button className="btn btn-danger btn-sm" onClick={() => softDelete(confirmDelete.id)}>Sil</button>
            </>
          }
        >
          <p style={{ fontSize: 14, color: 'var(--text-1)' }}>
            <strong>{confirmDelete.full_name}</strong> müşterisini silmek istediğinize emin misiniz?
            Rezervasyon geçmişi korunur, müşteri listeden kaldırılır.
          </p>
        </Modal>
      )}
    </div>
  );
}

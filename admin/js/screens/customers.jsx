// ── Müşteriler (CRM) ────────────────────────────────────────────

const GENDER_LABELS_C = { male: 'Erkek', female: 'Kadın', other: 'Diğer' };

// ── Detay Modalı ──────────────────────────────────────────────
function CustomerDetailModal({ customer, clubId, onClose, onReservation, onLinked }) {
  const { useState, useEffect } = React;
  const [tab,        setTab]        = useState('activities');
  const [stats,      setStats]      = useState(null);
  const [bookings,   setBookings]   = useState([]);
  const [lessons,    setLessons]    = useState([]);
  const [packages,   setPackages]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [addPkgOpen, setAddPkgOpen] = useState(false);

  // Eşleştir akışı
  const [linkStep,    setLinkStep]    = useState('idle'); // 'idle' | 'search' | 'confirm'
  const [linkQuery,   setLinkQuery]   = useState('');
  const [linkResults, setLinkResults] = useState([]);
  const [linkTarget,  setLinkTarget]  = useState(null);
  const [linkSaving,  setLinkSaving]  = useState(false);
  const [accountLink, setAccountLink] = useState(null); // rıza durumu (pending/confirmed)
  const [revertBusy,  setRevertBusy]  = useState(false);
  const [suggestedProfile, setSuggestedProfile] = useState(null); // telefon-eşleşme önerisi
  const [suggestBusy,      setSuggestBusy]      = useState(false);
  const [membership,       setMembership]       = useState(null); // aktif üyelik paketi rozeti

  useEffect(() => {
    load();
  }, [customer.id]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, b, l, p] = await Promise.all([
        CustomerSvc.getCustomerStats(customer.id, clubId, customer.user_id, customer.full_name),
        CustomerSvc.getCustomerBookings(customer.id, clubId, customer.user_id),
        CustomerSvc.getCustomerLessons(customer.user_id, clubId, customer.full_name, customer.id),
        CustomerSvc.getCustomerLessonPackages(customer.id, clubId, customer.user_id, customer.full_name),
      ]);
      setStats(s);
      setBookings(b);
      setLessons(l);
      setPackages(p);
      setAccountLink(await CustomerSvc.getAccountLink(customer.id));
      if (customer.suggested_user_id && !customer.user_id) {
        setSuggestedProfile(await CustomerSvc.getProfileBrief(customer.suggested_user_id));
      } else {
        setSuggestedProfile(null);
      }
      setMembership(await CustomerSvc.getCustomerMembership(clubId, customer.user_id, customer.full_name, customer.phone));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const searchProfiles = async (q) => {
    setLinkQuery(q);
    if (q.length < 2) { setLinkResults([]); return; }
    const safe = q.replace(/[,()]/g, ' ').trim();
    const { data } = await sb.from('profiles')
      .select('id, full_name, email')
      .or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`)
      .eq('user_type', 'player')
      .limit(8);
    setLinkResults(data || []);
  };

  const confirmLink = async () => {
    if (!linkTarget) return;
    setLinkSaving(true);
    try {
      await CustomerSvc.requestAccountLink(customer.id, linkTarget.id);
      setLinkStep('idle');
      setLinkTarget(null);
      setLinkQuery('');
      setLinkResults([]);
      onLinked();
      load();
      alert('Davet gönderildi. Hesap sahibi mobil uygulamadan kabul edince geçmiş kayıtlar birleşir ve bilgiler güncellenir.');
    } catch (e) {
      alert((e.message || '').includes('pending_exists')
        ? 'Bu müşteri için bekleyen bir eşleme daveti zaten var.' : e.message);
    }
    finally { setLinkSaving(false); }
  };

  const handleRevert = async () => {
    if (!accountLink) return;
    if (!confirm('Hesap eşlemesi geri alınacak: müşteri bilgileri eski hâline döner, birleştirilen ders/rezervasyon/gruplar ayrılır. Eşlemeden sonraki yeni işlemler etkilenmez. Emin misiniz?')) return;
    setRevertBusy(true);
    try {
      await CustomerSvc.revertAccountLink(accountLink.id);
      onLinked();
      load();
      alert('Eşleme geri alındı, müşteri eski hâline döndü.');
    } catch (e) { alert(e.message); }
    finally { setRevertBusy(false); }
  };

  const acceptSuggestion = async () => {
    if (!customer.suggested_user_id) return;
    if (!confirm('Hesap sahibine eşleme daveti gönderilecek. Kabul edince geçmiş kayıtlar birleşir ve bilgiler güncellenir. Gönderilsin mi?')) return;
    setSuggestBusy(true);
    try {
      await CustomerSvc.requestAccountLink(customer.id, customer.suggested_user_id);
      await CustomerSvc.dismissSuggestion(customer.id);
      onLinked();
      load();
      alert('Davet gönderildi. Hesap sahibi mobilden kabul edince eşleşme tamamlanır.');
    } catch (e) {
      alert((e.message || '').includes('pending_exists')
        ? 'Bu müşteri için bekleyen bir eşleme daveti zaten var.' : e.message);
    }
    finally { setSuggestBusy(false); }
  };

  const rejectSuggestion = async () => {
    setSuggestBusy(true);
    try {
      await CustomerSvc.dismissSuggestion(customer.id);
      setSuggestedProfile(null);
      onLinked();
    } catch (e) { alert(e.message); }
    finally { setSuggestBusy(false); }
  };

  const tabItems = [
    { key: 'activities', label: `Aktiviteler (${bookings.length + lessons.length})` },
    { key: 'packages',   label: `Ders Paketleri (${packages.length})` },
  ];

  const bkStatusColor  = { confirmed: '#22C55E', completed: '#6366F1', cancelled: '#EF4444', pending: '#F59E0B' };
  const pkgStatusColor = { active: '#22C55E', completed: '#6366F1', expired: '#F59E0B', cancelled: '#EF4444' };
  const lsPayColor     = { paid: '#22C55E', pending: '#F59E0B', waived: '#6366F1' };

  return (
    <>
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
            {customer.user_id ? (
              <>
                <span style={{ background: '#EEF2FF', color: 'var(--brand-navy)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>CourtyCLUB</span>
                {accountLink && accountLink.status === 'confirmed' && (
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '2px 10px', height: 'auto', color: '#DC2626' }}
                    onClick={handleRevert} disabled={revertBusy}>
                    <span className="material-icons" style={{ fontSize: 12 }}>link_off</span> {revertBusy ? 'Geri alınıyor…' : 'Eşlemeyi Geri Al'}
                  </button>
                )}
              </>
            ) : accountLink && accountLink.status === 'pending' ? (
              <span style={{ background: '#FFFBEB', color: '#92400E', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span className="material-icons" style={{ fontSize: 12 }}>schedule</span> Eşleme daveti bekliyor
              </span>
            ) : (
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '2px 10px', height: 'auto' }}
                onClick={() => setLinkStep('search')}>
                <span className="material-icons" style={{ fontSize: 12 }}>link</span> Eşleştir
              </button>
            )}
            {membership && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#F3EEFF', color: '#7C3AED', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                <span className="material-icons" style={{ fontSize: 12 }}>card_membership</span>
                {membership.packageName || 'Üye'}{membership.status === 'pending' ? ' (bekliyor)' : ''}
              </span>
            )}
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

      {/* Otomatik telefon-eşleşme önerisi */}
      {!customer.user_id && !accountLink && suggestedProfile && (
        <div style={{ marginBottom: 16, padding: 14, background: '#EEF2FF', borderRadius: 12, border: '1px solid #C7D2FE' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span className="material-icons" style={{ fontSize: 18, color: 'var(--brand-navy)' }}>person_search</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--brand-navy)' }}>Telefon bir hesapla eşleşti</div>
              <div style={{ fontSize: 13, color: 'var(--text-1)', marginTop: 2 }}>
                <strong>{suggestedProfile.full_name}</strong>{suggestedProfile.email ? ` (${suggestedProfile.email})` : ''} — bu müşteriyle aynı numarayı kullanıyor. Eşleme daveti gönderilsin mi?
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={rejectSuggestion} disabled={suggestBusy}>Yoksay</button>
            <button className="btn btn-pri btn-sm" onClick={acceptSuggestion} disabled={suggestBusy}>
              <span className="material-icons" style={{ fontSize: 14 }}>link</span> {suggestBusy ? 'Gönderiliyor…' : 'Davet Gönder'}
            </button>
          </div>
        </div>
      )}

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
            <strong>{customer.full_name}</strong> müşterisi ile <strong>{linkTarget.full_name}</strong> ({linkTarget.email}) hesabını eşlemek için <strong>davet</strong> gönderilecek.
            Hesap sahibi mobil uygulamadan kabul edince geçmiş ders/rezervasyon/gruplar bu hesaba bağlanır ve hesabın bilgileri (isim, e-posta, doğum, cinsiyet) müşteri kaydının üstüne yazılır.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setLinkStep('idle'); setLinkTarget(null); }}>Vazgeç</button>
            <button className="btn btn-pri btn-sm" onClick={confirmLink} disabled={linkSaving}>
              {linkSaving ? 'Gönderiliyor…' : 'Davet Gönder'}
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
        {loading ? <Spinner /> : tab === 'activities' ? (() => {
          const items = [
            ...bookings.map(b => ({ kind: 'booking', data: b })),
            ...lessons.map(l => ({ kind: 'lesson',  data: l })),
          ].sort((a, b) => new Date(b.data.start_time) - new Date(a.data.start_time));

          if (items.length === 0) return <EmptyState icon="event_available" title="Henüz aktivite yok" />;

          return items.map(item => {
            if (item.kind === 'booking') {
              const b = item.data;
              const color = bkStatusColor[b.status] || '#6B7280';
              return (
                <div key={`bk-${b.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: '4px 7px', minWidth: 42, flexShrink: 0 }}>
                    <span className="material-icons" style={{ fontSize: 13, color: 'var(--brand-navy)' }}>sports_tennis</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand-navy)' }}>Rez</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      Kort {b.court?.court_number ?? '?'} · {fmtDateTime(b.start_time)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                      {paymentLabel(b.payment_status)}{b.total_amount > 0 ? ` · ${fmtMoney(b.total_amount)}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                    background: color + '22', color }}>
                    {statusLabel(b.status)}
                  </span>
                </div>
              );
            } else {
              const l = item.data;
              const color = lsPayColor[l.payment_status] || '#6B7280';
              const payLbl = l.payment_status === 'paid' ? 'Ödendi' : l.payment_status === 'waived' ? 'Muaf' : 'Bekliyor';
              return (
                <div key={`ls-${l.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '4px 7px', minWidth: 42, flexShrink: 0 }}>
                    <span className="material-icons" style={{ fontSize: 13, color: '#EA580C' }}>school</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#EA580C' }}>Ders</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {l.coach_name ? `${l.coach_name} · ` : ''}{fmtDateTime(l.start_time)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                      {l.is_package_lesson ? 'Paketten · ' : ''}{l.amount > 0 ? fmtMoney(l.amount) : 'Ücretsiz'}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                    background: color + '22', color }}>
                    {payLbl}
                  </span>
                </div>
              );
            }
          });
        })() : (<>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button className="btn btn-pri btn-sm" onClick={() => setAddPkgOpen(true)}>
              <span className="material-icons" style={{ fontSize: 14 }}>add</span>
              Ders Paketi Ekle
            </button>
          </div>
          {packages.length === 0
            ? <EmptyState icon="inventory_2" title="Ders paketi yok" sub="Yukarıdaki butona tıklayarak paket ekleyebilirsiniz." />
            : packages.map(p => {
              const isCustom = !p.package_id;
              const pkgName  = p.package?.name || p.custom_name || 'Özel Paket';
              const stColor  = pkgStatusColor[p.status] || '#6B7280';
              const psColor  = p.payment_status === 'paid' ? '#22C55E' : '#F59E0B';
              const psLabel  = p.payment_status === 'paid' ? 'Ödendi' : 'Bekliyor';
              const progress = p.total_lessons > 0 ? (p.used_lessons / p.total_lessons) : 0;
              return (
                <div key={p.id} style={{ background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{pkgName}</span>
                    {isCustom && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>Özel</span>
                    )}
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: '100%', width: `${Math.round(progress * 100)}%`, background: 'var(--brand-navy)', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 10 }}>
                    {p.used_lessons}/{p.total_lessons} ders kullanıldı
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: stColor + '22', color: stColor }}>
                      {statusLabel(p.status)}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: psColor + '22', color: psColor }}>
                      {psLabel}
                    </span>
                    {p.total_paid > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'var(--border)', color: 'var(--text-2)' }}>
                        {fmtMoney(p.total_paid)}
                      </span>
                    )}
                    {p.expiry_date && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'var(--border)', color: 'var(--text-2)' }}>
                        Son: {fmtDate(p.expiry_date)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          }
        </>)}
      </div>
    </Modal>
    {addPkgOpen && (
      <AddPackageModal
        customer={customer}
        clubId={clubId}
        onClose={() => setAddPkgOpen(false)}
        onSaved={load}
      />
    )}
    </>
  );
}

// ── Ders Paketi Ekle Modalı ──────────────────────────────────
function AddPackageModal({ customer, clubId, onClose, onSaved }) {
  const { useState, useEffect } = React;
  const [mode,        setMode]        = useState('predefined');
  const [clubPkgs,    setClubPkgs]    = useState([]);
  const [coaches,     setCoaches]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);

  const [selectedPkg, setSelectedPkg] = useState(null);

  const [customName,     setCustomName]     = useState('');
  const [customLessons,  setCustomLessons]  = useState('');
  const [customPrice,    setCustomPrice]    = useState('');
  const [customCoachPct, setCustomCoachPct] = useState('70');
  const [customValidity, setCustomValidity] = useState('90');

  const [coachId,        setCoachId]        = useState('');
  const [paymentStatus,  setPaymentStatus]  = useState('paid');
  const [totalPaid,      setTotalPaid]      = useState('');
  const [notes,          setNotes]          = useState('');

  useEffect(() => {
    (async () => {
      const [pkgs, coachs] = await Promise.all([
        LessonPackageSvc.getClubPackages(clubId),
        CoachSvc.getActiveClubCoaches(clubId),
      ]);
      setClubPkgs((pkgs || []).filter(p => p.is_active));
      setCoaches(coachs || []);
      setLoading(false);
    })();
  }, []);

  const handlePkgSelect = (p) => {
    setSelectedPkg(p);
    setTotalPaid(String(p.price || ''));
  };

  const handleSave = async () => {
    if (mode === 'predefined' && !selectedPkg) { alert('Lütfen bir paket seçin.'); return; }
    if (mode === 'custom') {
      if (!customName.trim())                { alert('Paket adı giriniz.'); return; }
      if (!customLessons || +customLessons <= 0) { alert('Ders sayısı giriniz.'); return; }
    }
    if (paymentStatus === 'paid' && (!totalPaid || +totalPaid < 0)) {
      alert('Ödenen tutarı giriniz.'); return;
    }
    setSaving(true);
    try {
      await LessonPackageSvc.enrollCustomerPackage({
        clubId,
        customerUserId: customer.user_id || null,
        customerName:   customer.full_name,
        packageId:      mode === 'predefined' ? selectedPkg.id : null,
        packageName:    mode === 'predefined' ? selectedPkg.name : customName.trim(),
        totalLessons:   mode === 'predefined' ? selectedPkg.total_lessons : +customLessons,
        customPrice:    mode === 'custom' ? +customPrice : null,
        customCoachPct: mode === 'custom' ? +customCoachPct : null,
        validityDays:   mode === 'predefined' ? (selectedPkg.validity_days || 90) : +customValidity,
        coachId:        coachId || null,
        paymentStatus,
        totalPaid:      +totalPaid,
        notes:          notes.trim() || null,
      });
      onSaved();
      onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const inputStyle = { width: '100%', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 5, letterSpacing: 0.4 };
  const tabBtn = (key, label) => (
    <button key={key} type="button"
      style={{ flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
        border:      mode === key ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)',
        background:  mode === key ? '#EEF2FF' : 'var(--bg)',
        color:       mode === key ? 'var(--brand-navy)' : 'var(--text-2)' }}
      onClick={() => setMode(key)}>
      {label}
    </button>
  );
  const payBtn = (key, label) => (
    <button key={key} type="button"
      style={{ flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
        border:      paymentStatus === key ? '1.5px solid var(--brand-navy)' : '1.5px solid var(--border)',
        background:  paymentStatus === key ? '#EEF2FF' : 'var(--bg)',
        color:       paymentStatus === key ? 'var(--brand-navy)' : 'var(--text-2)' }}
      onClick={() => setPaymentStatus(key)}>
      {label}
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, width: 'min(480px,95vw)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-icons" style={{ color: 'var(--brand-navy)', fontSize: 20 }}>inventory_2</span>
          <span style={{ fontWeight: 800, fontSize: 17, flex: 1 }}>Ders Paketi Ekle</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'grid', placeItems: 'center' }}>
            <span className="material-icons" style={{ fontSize: 20, color: 'var(--text-2)' }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? <Spinner /> : <>
            {/* Mod seçimi */}
            <div style={{ display: 'flex', gap: 8 }}>
              {tabBtn('predefined', 'Tanımlı Paket')}
              {tabBtn('custom', 'Özel Paket')}
            </div>

            {/* Tanımlı paket listesi */}
            {mode === 'predefined' && (
              <div>
                <label style={labelStyle}>PAKET SEÇ</label>
                {clubPkgs.length === 0
                  ? <EmptyState icon="inventory_2" title="Aktif paket yok" sub="Ders paketleri ekranından önce paket oluşturun." />
                  : clubPkgs.map(p => (
                    <div key={p.id} onClick={() => handlePkgSelect(p)}
                      style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 8, cursor: 'pointer',
                        border:      selectedPkg?.id === p.id ? '2px solid var(--brand-navy)' : '1.5px solid var(--border)',
                        background:  selectedPkg?.id === p.id ? '#EEF2FF' : 'var(--bg)' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
                        {p.total_lessons} ders · {fmtMoney(p.price)}
                        {p.validity_days ? ` · ${p.validity_days} gün geçerli` : ''}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* Özel paket alanları */}
            {mode === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>PAKET ADI</label>
                  <input value={customName} onChange={e => setCustomName(e.target.value)}
                    placeholder="Örn: 10 Seans Özel Paket" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>TOPLAM DERS</label>
                    <input type="number" min="1" value={customLessons}
                      onChange={e => setCustomLessons(e.target.value)}
                      placeholder="10" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>TOPLAM FİYAT (₺)</label>
                    <input type="number" min="0" value={customPrice}
                      onChange={e => { setCustomPrice(e.target.value); setTotalPaid(e.target.value); }}
                      placeholder="2000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>HOCA PAYI (%)</label>
                    <input type="number" min="0" max="100" value={customCoachPct}
                      onChange={e => setCustomCoachPct(e.target.value)}
                      placeholder="70" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>GEÇERLİLİK (gün)</label>
                    <input type="number" min="1" value={customValidity}
                      onChange={e => setCustomValidity(e.target.value)}
                      placeholder="90" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>HOCA (opsiyonel — boş bırakılırsa tüm hoçalarda geçerli)</label>
                  <select value={coachId} onChange={e => setCoachId(e.target.value)} style={inputStyle}>
                    <option value="">Tüm antrenörler</option>
                    {coaches.map(c => (
                      <option key={c.id} value={c.individual_coach_id || ''}>{c.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Ödeme durumu */}
            <div>
              <label style={labelStyle}>ÖDEME DURUMU</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: paymentStatus === 'paid' ? 10 : 0 }}>
                {payBtn('paid', 'Ödendi')}
                {payBtn('pending', 'Bekliyor')}
              </div>
              {paymentStatus === 'paid' && (
                <div>
                  <label style={labelStyle}>ÖDENEN TUTAR (₺)</label>
                  <input type="number" min="0" value={totalPaid}
                    onChange={e => setTotalPaid(e.target.value)}
                    placeholder="2000" style={inputStyle} />
                </div>
              )}
            </div>

            {/* Notlar */}
            <div>
              <label style={labelStyle}>NOTLAR (opsiyonel)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Not ekleyin..." rows={2}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </>}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Vazgeç</button>
          <button className="btn btn-pri btn-sm" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Kaydediliyor…' : 'Paketi Ekle'}
          </button>
        </div>
      </div>
    </div>
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
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  // Email ile CourtyCLUB eşleşme kontrolü (add modunda)
  const [emailMatch,      setEmailMatch]      = useState(null);  // null | { id, full_name, email }
  const [emailChecking,   setEmailChecking]   = useState(false);
  const [emailDebounce,   setEmailDebounce]   = useState(null);

  // Manuel CourtyCLUB üye arama (add + edit modunda)
  const [ccQuery,         setCcQuery]         = useState('');
  const [ccResults,       setCcResults]       = useState([]);
  const [ccSelected,      setCcSelected]      = useState(null); // { id, full_name, email }

  // Telefon-otoriter dedup (add modunda) — mobil CustomersScreen ile birebir
  const [dupCustomer,     setDupCustomer]     = useState(null);  // aynı numaralı mevcut müşteri (sert engel)
  const [lockedMatch,     setLockedMatch]     = useState(null);  // telefon→tek hesap: kilitli eşleşme
  const [phoneMatches,    setPhoneMatches]    = useState([]);    // telefon→çok hesap: seçim listesi
  const [phoneChecking,   setPhoneChecking]   = useState(false);
  const [phoneDebounce,   setPhoneDebounce]   = useState(null);

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
    setDupCustomer(null); setLockedMatch(null); setPhoneMatches([]);
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
    setDupCustomer(null); setLockedMatch(null); setPhoneMatches([]);
    setModal('edit');
  };

  const openDetail = (c) => {
    setSelectedCust(c);
    setModal('detail');
  };

  const save = async () => {
    if (!form.full_name?.trim()) { alert('Ad soyad zorunludur.'); return; }
    if (!form.phone?.trim())     { alert('Telefon numarası zorunludur.'); return; }
    // Aynı numaralı müşteri varsa ikinci kayıt engellenir (mobil ile birebir).
    if (dupCustomer) {
      alert(`"${dupCustomer.full_name}" bu telefon numarasıyla zaten müşteri. Aynı numarayla ikinci kayıt oluşturulamaz.`);
      return;
    }
    setSaving(true);
    try {
      // Bağ önceliği (mobil ile aynı): telefon-kilitli eşleşme > manuel seçim > email eşleşmesi.
      // alreadyLinkedTo varsa o email eşleşmesini kullanma.
      const emailLink = emailMatch && !emailMatch.alreadyLinkedTo ? emailMatch : null;
      const profileToLink = lockedMatch || ccSelected || emailLink;

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
      setDupCustomer(null); setLockedMatch(null); setPhoneMatches([]);
      load();
    } catch (e) {
      const msg = e?.message || '';
      alert(/uq_club_customer_name/.test(msg)
        ? 'Bu ad ve telefona sahip aktif bir müşteri zaten var. Aynı kişiyse mevcut kaydı düzenleyin.'
        : msg);
    }
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
      } catch (e) { setEmailChecking(false); alert('E-posta kontrolü sırasında hata oluştu. Lütfen tekrar deneyin.'); return; }
      finally { setEmailChecking(false); }
    }, 500);
    setEmailDebounce(t);
  };

  // Eşleşen hesabı uygula: ad + e-posta otomatik dolar, alanlar kilitlenir, bağ zorunlu olur.
  const applyPhoneMatch = (acc) => {
    setForm(f => ({ ...f, full_name: acc.full_name, email: acc.email || f.email }));
    setLockedMatch(acc);
    setPhoneMatches([]);
    setDupCustomer(null);
    setEmailMatch(null);
  };
  // Eşleşmeyi/formu sıfırla (bağsız, tamamen manuel eklemek için baştan başla)
  const resetPhoneMatch = () => {
    if (phoneDebounce) clearTimeout(phoneDebounce);
    setLockedMatch(null);
    setPhoneMatches([]);
    setDupCustomer(null);
    setForm(f => ({ ...f, full_name: '', phone: '', email: '' }));
  };

  // Telefon değişince debounce ile (mobil ile birebir):
  // 1) Bu numara zaten bir müşteride mi? → dupCustomer (kaydetmeyi engeller)
  // 2) Bu numara bir oyuncu hesabına ait mi? → tek: kilitli eşleşme, çok: seçim listesi
  const handlePhoneChange = (val) => {
    formField('phone', val);
    // Kilitli / mevcut bağlı / elle seçili iken telefon araması yapma
    if (lockedMatch || form.user_id_original || ccSelected) return;
    if (phoneDebounce) clearTimeout(phoneDebounce);
    setDupCustomer(null); setPhoneMatches([]);
    if (val.replace(/\D/g, '').length < 7) return;
    const t = setTimeout(async () => {
      setPhoneChecking(true);
      try {
        const dup = await CustomerSvc.findCustomerByPhone(val, clubId, form.id || null);
        if (dup) { setDupCustomer(dup); return; }
        const accounts = await CustomerSvc.findAccountsByPhone(val);
        if (accounts.length === 1) applyPhoneMatch(accounts[0]);
        else if (accounts.length > 1) setPhoneMatches(accounts);
      } catch (_) { /* sessizce geç — telefon kontrolü kaydı engellemesin */ }
      finally { setPhoneChecking(false); }
    }, 500);
    setPhoneDebounce(t);
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
    } catch (e) { console.error('Profil arama hatası:', e); setCcResults([]); }
  };

  return (
    <div className="page fade-in">
      {/* Başlık */}
      <div className="page-head">
        <div>
          <h1>Müşteriler</h1>
          <div className="sub">{customers.length} müşteri kayıtlı</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setBroadcastOpen(true)} title="Toplu bildirim gönder">
            <span className="material-icons">campaign</span> Toplu Bildirim
          </button>
          <button className="btn btn-pri" onClick={openAdd}>
            <span className="material-icons">person_add</span> Müşteri Ekle
          </button>
        </div>
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
                  <span className="material-icons" style={{ fontSize: 16 }}>account_circle</span>
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
                  : (lockedMatch || ccSelected || (emailMatch && !emailMatch.alreadyLinkedTo)) && modal === 'add' ? 'Kaydet & Eşleştir'
                  : ccSelected && ccSelected.id !== form.user_id_original ? 'Kaydet & Eşleştir'
                  : 'Kaydet'}
              </button>
            </>
          }
        >
          <div className="fields" style={{ gap: 14 }}>
            <Field label="Ad Soyad *">
              <input value={form.full_name || ''} placeholder="Örn: Ahmet Yılmaz" disabled={!!lockedMatch}
                onChange={e => formField('full_name', e.target.value)}
                style={lockedMatch ? { background: '#F1F5F9', color: 'var(--text-2)' } : undefined} />
            </Field>
            <Field label="Telefon *">
              <div style={{ position: 'relative' }}>
                <input type="tel" value={form.phone || ''} placeholder="0532 000 00 00" disabled={!!lockedMatch}
                  onChange={e => handlePhoneChange(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', paddingRight: phoneChecking ? 32 : undefined, ...(lockedMatch ? { background: '#F1F5F9', color: 'var(--text-2)' } : {}) }} />
                {phoneChecking && (
                  <span className="material-icons" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-2)', animation: 'spin 1s linear infinite' }}>refresh</span>
                )}
              </div>
              {/* Telefon→tek hesap: kilitli eşleşme (mobil applyMatch) */}
              {lockedMatch && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: '#EEF2FF', borderRadius: 10, border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-icons" style={{ fontSize: 16, color: 'var(--brand-navy)', flexShrink: 0 }}>verified_user</span>
                  <div style={{ flex: 1, fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>Hesap eşleşti: {lockedMatch.full_name}</div>
                    <div style={{ color: 'var(--text-2)', marginTop: 1 }}>Bu numaraya ait CourtyCLUB hesabı. Ad/e-posta hesaptan alındı; kayıt bu hesapla eşleştirilecek.</div>
                  </div>
                  <button type="button" onClick={resetPhoneMatch}
                    style={{ background: 'none', border: '1px solid #C7D2FE', borderRadius: 8, cursor: 'pointer', color: 'var(--brand-navy)', fontSize: 11, fontWeight: 700, padding: '4px 8px', whiteSpace: 'nowrap' }}>
                    Farklı kişi
                  </button>
                </div>
              )}
              {/* Aynı numaralı mevcut müşteri: sert engel (kaydedilemez) */}
              {dupCustomer && !lockedMatch && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-icons" style={{ fontSize: 16, color: '#EF4444', flexShrink: 0 }}>block</span>
                  <div style={{ flex: 1, fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: '#EF4444' }}>Bu numara zaten kayıtlı: {dupCustomer.full_name}</div>
                    <div style={{ color: 'var(--text-2)', marginTop: 1 }}>Aynı numarayla ikinci müşteri oluşturulamaz. Aynı kişiyse mevcut kaydı düzenleyin.</div>
                  </div>
                </div>
              )}
              {/* Telefon→çok hesap: seçim listesi (mobil phoneMatches) */}
              {phoneMatches.length > 1 && !lockedMatch && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: '#F1F5F9', borderRadius: 10, border: '1px solid #CBD5E1' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>Bu numarayla {phoneMatches.length} hesap eşleşti — doğru kişiyi seçin</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {phoneMatches.map(acc => (
                      <button key={acc.id} type="button" onClick={() => applyPhoneMatch(acc)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', background: '#fff', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: '8px 10px' }}>
                        <span className="material-icons" style={{ fontSize: 15, color: 'var(--brand-navy)' }}>person</span>
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{acc.full_name}</span>
                        {acc.email && <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{acc.email}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Field>
            <Field label="E-posta">
              <div style={{ position: 'relative' }}>
                <input type="email" value={form.email || ''} placeholder="ornek@email.com" disabled={!!lockedMatch}
                  onChange={e => handleEmailChange(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', paddingRight: emailChecking ? 32 : undefined, ...(lockedMatch ? { background: '#F1F5F9', color: 'var(--text-2)' } : {}) }} />
                {emailChecking && (
                  <span className="material-icons" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-2)', animation: 'spin 1s linear infinite' }}>refresh</span>
                )}
              </div>
              {emailMatch && !ccSelected && !lockedMatch && (
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

            {/* CourtyCLUB Hesabı Bağla — telefon-kilitli eşleşme varken gizli (mobil ile birebir) */}
            {!lockedMatch && (
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
            )}
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

      {/* Toplu Bildirim */}
      {broadcastOpen && (
        <ClubBroadcastModal clubId={clubId} initialAudience="customers" onClose={() => setBroadcastOpen(false)} />
      )}
    </div>
  );
}

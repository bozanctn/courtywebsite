// ── Finans & Analitik ───────────────────────────────────────────

const INCOME_CATEGORIES = [
  'Rezervasyon Geliri', 'Ders Geliri', 'Ekipman Satışı',
  'Üyelik Geliri', 'Kafetarya Geliri', 'Aidat Geliri', 'Diğer Gelir',
];
const EXPENSE_CATEGORIES = [
  'Elektrik Faturası', 'Su Faturası', 'Personel Maaşı',
  'Ekipman Alımı', 'Bakım Onarım', 'Temizlik', 'Diğer Gider',
];
const MONTH_NAMES = [
  'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık',
];

// ═══════════════════════════════════════════════════════════════
// FİNANS
// ═══════════════════════════════════════════════════════════════
function FinanceScreen({ clubId }) {
  const { useState, useEffect, useMemo } = React;
  const [records,        setRecords]        = useState([]);
  const [coachEarnings,  setCoachEarnings]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState('records'); // records | earnings
  const [showFilters,    setShowFilters]    = useState(false);
  const [addModal,       setAddModal]       = useState(false);
  const [detailRecord,   setDetailRecord]   = useState(null);
  const [coachFilter,    setCoachFilter]    = useState(null);
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [pendingCount,   setPendingCount]   = useState(0);

  const [filters, setFilters] = useState({
    type:          'all',
    category:      'all',
    dateRange:     'month',
    specificYear:  new Date().getFullYear(),
    specificMonth: new Date().getMonth(),
  });

  const [form, setForm] = useState({
    type: 'income', category: '', amount: '', description: '',
  });

  useEffect(() => { if (clubId) loadAll(); }, [clubId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const courtIds = await getClubCourtIds(clubId);

      const [recRes, earnRes] = await Promise.all([
        sb.from('club_finances').select('*').eq('club_id', clubId).order('created_at', { ascending: false }),
        sb.from('coach_earnings').select('*').eq('club_id', clubId).order('date', { ascending: false }),
      ]);
      setRecords(recRes.data || []);
      setCoachEarnings(earnRes.data || []);

      if (courtIds.length > 0) {
        const { data: pending } = await sb.from('bookings')
          .select('id, total_amount')
          .in('court_id', courtIds)
          .eq('status', 'confirmed')
          .eq('payment_status', 'pending');
        const rows = pending || [];
        setPendingRevenue(rows.reduce((s, b) => s + (b.total_amount || 0), 0));
        setPendingCount(rows.length);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const applyFilters = (recs) => recs.filter(r => {
    if (filters.type !== 'all' && r.type !== filters.type) return false;
    if (filters.category !== 'all' && r.category !== filters.category) return false;
    if (filters.dateRange !== 'all') {
      const rDate = new Date(r.date);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (filters.dateRange === 'today') {
        const rd = new Date(rDate); rd.setHours(0, 0, 0, 0);
        if (rd.getTime() !== today.getTime()) return false;
      } else if (filters.dateRange === 'week') {
        const ago = new Date(today); ago.setDate(today.getDate() - 7);
        if (rDate < ago) return false;
      } else if (filters.dateRange === 'month') {
        const ago = new Date(today); ago.setMonth(today.getMonth() - 1);
        if (rDate < ago) return false;
      } else if (filters.dateRange === 'specificMonth') {
        if (rDate.getMonth() !== filters.specificMonth || rDate.getFullYear() !== filters.specificYear) return false;
      }
    }
    return true;
  });

  const filteredRecords = useMemo(() => applyFilters(records), [records, filters]);

  const stats = useMemo(() => {
    const totalIncome   = filteredRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const totalExpenses = filteredRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    return { totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses };
  }, [filteredRecords]);

  const earningsSummary = useMemo(() => ({
    totalUnpaid: coachEarnings.filter(e => e.payment_status === 'unpaid').reduce((s, e) => s + e.amount, 0),
    unpaidCount: coachEarnings.filter(e => e.payment_status === 'unpaid').length,
  }), [coachEarnings]);

  const uniqueCoaches  = useMemo(() => Array.from(new Set(coachEarnings.map(e => e.coach_name))).sort(), [coachEarnings]);
  const filteredEarnings = coachFilter ? coachEarnings.filter(e => e.coach_name === coachFilter) : coachEarnings;

  const getPeriodLabel = () => {
    const dr = filters.dateRange;
    if (dr === 'today')  return 'Bugün';
    if (dr === 'week')   return 'Bu Hafta';
    if (dr === 'month')  return 'Bu Ay';
    if (dr === 'specificMonth') return `${MONTH_NAMES[filters.specificMonth].slice(0,3)} ${filters.specificYear}`;
    return 'Toplam';
  };

  const getPeriodText = () => {
    const now = new Date();
    const dr  = filters.dateRange;
    if (dr === 'today') return `Bugün (${now.toLocaleDateString('tr-TR')})`;
    if (dr === 'week') {
      const w = new Date(now); w.setDate(now.getDate() - 7);
      return `Son 7 Gün (${w.toLocaleDateString('tr-TR')} – ${now.toLocaleDateString('tr-TR')})`;
    }
    if (dr === 'month')         return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
    if (dr === 'specificMonth') return `${MONTH_NAMES[filters.specificMonth]} ${filters.specificYear}`;
    return 'Tüm Zamanlar';
  };

  const getActiveFilterCount = () => {
    return (filters.type !== 'all' ? 1 : 0) +
           (filters.category !== 'all' ? 1 : 0) +
           (filters.dateRange !== 'all' ? 1 : 0);
  };

  const addRecord = async () => {
    if (!form.category)    { alert('Kategori seçin.'); return; }
    if (!form.amount)      { alert('Tutar girin.'); return; }
    if (!form.description) { alert('Açıklama girin.'); return; }
    setSaving(true);
    try {
      await sb.from('club_finances').insert({
        club_id:     clubId,
        type:        form.type,
        category:    form.category,
        amount:      parseFloat(form.amount),
        description: form.description,
        date:        todayISO(),
      });
      setAddModal(false);
      setForm({ type: 'income', category: '', amount: '', description: '' });
      loadAll();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const markEarningPaid = async (id) => {
    if (!confirm('Bu hakedişi ödendi olarak işaretle?')) return;
    await sb.from('coach_earnings').update({ payment_status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
    loadAll();
  };

  const markAllEarningsPaid = async (coachName) => {
    const unpaid = coachEarnings.filter(e => e.coach_name === coachName && e.payment_status === 'unpaid');
    if (unpaid.length === 0) { alert('Bu hocanın bekleyen hakedişi yok.'); return; }
    const total = unpaid.reduce((s, e) => s + e.amount, 0);
    if (!confirm(`${coachName} adlı hocanın ${unpaid.length} hakedişi toplam ${fmtMoney(total)} ödendi olarak işaretlensin mi?`)) return;
    await sb.from('coach_earnings')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
      .eq('club_id', clubId).eq('coach_name', coachName).eq('payment_status', 'unpaid');
    loadAll();
  };

  const netPositive = stats.netProfit >= 0;

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Finansal Yönetim</h1>
          <div className="sub">Gelir &amp; gider takibi</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ position: 'relative' }} onClick={() => setShowFilters(v => !v)}>
            <span className="material-icons">tune</span> Filtrele
            {getActiveFilterCount() > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, background: '#EF4444' }} />
            )}
          </button>
          <button className="btn btn-ghost" onClick={loadAll}>
            <span className="material-icons">refresh</span>
          </button>
        </div>
      </div>

      {/* ── Hero Card ── */}
      <div style={{ background: '#0f172a', borderRadius: 16, padding: '20px 24px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>PERFORMANS ÖZETİ</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{getPeriodText()}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', flex: 1 }}>{fmtMoney(Math.abs(stats.netProfit))}</div>
          <span style={{ background: netPositive ? '#22C55E' : '#EF4444', color: '#fff', borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
            {netPositive ? 'NET KAR' : 'NET ZARAR'}
          </span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
        <div className="card" style={{ borderLeft: '3px solid #3B82F6', gap: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-icons" style={{ color: '#3B82F6', fontSize: 18 }}>account_balance_wallet</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-2)', letterSpacing: 0.3 }}>Alınacak Para</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#3B82F6' }}>{fmtMoney(pendingRevenue)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-2)' }}>{pendingCount} rezervasyon</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid #22C55E', gap: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-icons" style={{ color: '#22C55E', fontSize: 18 }}>trending_up</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-2)', letterSpacing: 0.3 }}>{getPeriodLabel()} Gelir</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#22C55E' }}>{fmtMoney(stats.totalIncome)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-2)' }}>{getPeriodLabel()}</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid #EF4444', gap: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-icons" style={{ color: '#EF4444', fontSize: 18 }}>trending_down</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-2)', letterSpacing: 0.3 }}>{getPeriodLabel()} Gider</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#EF4444' }}>{fmtMoney(stats.totalExpenses)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-2)' }}>{getPeriodLabel()}</div>
        </div>
      </div>

      {/* ── Filters Panel ── */}
      {showFilters && (
        <div className="card" style={{ marginBottom: 14, gap: 16 }}>
          {/* Type */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', letterSpacing: 0.8, marginBottom: 8 }}>TÜR</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: 'all', l: 'Tümü' }, { v: 'income', l: 'Gelir' }, { v: 'expense', l: 'Gider' }].map(o => (
                <button key={o.v} type="button"
                  style={{ flex: 1, padding: '9px', borderRadius: 999, border: '1.5px solid', borderColor: filters.type === o.v ? 'var(--brand-navy)' : 'var(--border)', background: filters.type === o.v ? 'var(--brand-navy)' : 'var(--bg)', color: filters.type === o.v ? '#fff' : 'var(--text-2)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                  onClick={() => setFilters({ ...filters, type: o.v })}
                >{o.l}</button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', letterSpacing: 0.8, marginBottom: 8 }}>ZAMAN ARALIĞI</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[{ v: 'all', l: 'Tüm Tarihler' }, { v: 'today', l: 'Bugün' }, { v: 'week', l: 'Bu Hafta' }, { v: 'month', l: 'Bu Ay' }].map(o => (
                <button key={o.v} type="button"
                  style={{ padding: '7px 14px', borderRadius: 999, border: '1.5px solid', borderColor: filters.dateRange === o.v ? 'var(--brand-navy)' : 'var(--border)', background: filters.dateRange === o.v ? 'var(--brand-navy)' : 'var(--bg)', color: filters.dateRange === o.v ? '#fff' : 'var(--text-2)', fontWeight: filters.dateRange === o.v ? 700 : 500, fontSize: 13, cursor: 'pointer' }}
                  onClick={() => setFilters({ ...filters, dateRange: o.v })}
                >{o.l}</button>
              ))}
            </div>
          </div>

          {/* Month Picker */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', letterSpacing: 0.8, marginBottom: 8 }}>AY SEÇ</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', borderRadius: 10, border: '1.5px solid var(--border)', padding: '4px 8px', marginBottom: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setFilters(f => ({ ...f, specificYear: f.specificYear - 1, dateRange: 'specificMonth' }))}>
                <span className="material-icons">chevron_left</span>
              </button>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{filters.specificYear}</span>
              <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setFilters(f => ({ ...f, specificYear: f.specificYear + 1, dateRange: 'specificMonth' }))}>
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {MONTH_NAMES.map((name, idx) => {
                const sel = filters.dateRange === 'specificMonth' && filters.specificMonth === idx;
                return (
                  <button key={idx} type="button"
                    style={{ padding: '9px 4px', borderRadius: 10, border: '1.5px solid', borderColor: sel ? 'var(--brand-navy)' : 'var(--border)', background: sel ? 'var(--brand-navy)' : 'var(--bg)', color: sel ? '#fff' : 'var(--text-2)', fontWeight: sel ? 700 : 600, fontSize: 12, cursor: 'pointer' }}
                    onClick={() => setFilters(f => ({ ...f, dateRange: 'specificMonth', specificMonth: idx }))}
                  >{name.slice(0, 3)}</button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setFilters({ type: 'all', category: 'all', dateRange: 'month', specificYear: new Date().getFullYear(), specificMonth: new Date().getMonth() })}>Temizle</button>
            <button className="btn btn-pri btn-sm" style={{ flex: 2 }} onClick={() => setShowFilters(false)}>Uygula</button>
          </div>
        </div>
      )}

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', background: '#fff', borderRadius: 14, padding: 4, gap: 4, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {[
          { k: 'records',  icon: 'receipt_long', l: 'Kayıtlar' },
          { k: 'earnings', icon: 'school',        l: 'Hoca Hakedişleri' },
        ].map(t => (
          <button key={t.k} type="button"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, border: 'none', background: activeTab === t.k ? '#EEF2FF' : 'transparent', color: activeTab === t.k ? 'var(--brand-navy)' : 'var(--text-2)', fontWeight: activeTab === t.k ? 700 : 600, fontSize: 13, cursor: 'pointer', position: 'relative' }}
            onClick={() => setActiveTab(t.k)}
          >
            <span className="material-icons" style={{ fontSize: 16 }}>{t.icon}</span>
            {t.l}
            {t.k === 'earnings' && earningsSummary.unpaidCount > 0 && (
              <span style={{ background: '#F97316', color: '#fff', borderRadius: 9, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', fontSize: 10, fontWeight: 700 }}>
                {earningsSummary.unpaidCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'records' ? (
        <div className="table-wrap">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Finansal Kayıtlar</div>
            <button className="btn btn-pri btn-sm" onClick={() => { setForm({ type: 'income', category: '', amount: '', description: '' }); setAddModal(true); }}>
              <span className="material-icons" style={{ fontSize: 15 }}>add</span> Yeni Kayıt
            </button>
          </div>
          {loading ? <Spinner /> : filteredRecords.length === 0 ? (
            <EmptyState icon="account_balance_wallet"
              title={records.length === 0 ? 'Henüz kayıt yok' : 'Kayıt bulunamadı'}
              sub={records.length === 0 ? 'İlk kaydı eklemek için Yeni Kayıt butonuna tıklayın' : 'Filtreleri değiştirmeyi deneyin'} />
          ) : (
            <div>
              {filteredRecords.map((r, i) => {
                const isIncome  = r.type === 'income';
                const isBooking = r.category === 'Rezervasyon Geliri';
                return (
                  <div key={r.id}
                    style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12, borderBottom: i < filteredRecords.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                    onClick={() => setDetailRecord(r)}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: isIncome ? '#DCFCE7' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-icons" style={{ color: isIncome ? '#22C55E' : '#EF4444', fontSize: 20 }}>
                        {isBooking ? 'calendar_today' : isIncome ? 'trending_up' : 'trending_down'}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{r.category}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                        {fmtDate(r.date)}{r.receipt_category ? ` • ${r.receipt_category}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isIncome ? '#22C55E' : '#EF4444' }}>
                        {isIncome ? '+' : '–'} {fmtMoney(r.amount)}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 999, background: isIncome ? '#DCFCE7' : '#FEE2E2', color: isIncome ? '#22C55E' : '#EF4444' }}>
                        {isBooking ? 'OTOMATİK' : isIncome ? 'ONAYLANDI' : 'FATURA'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Hoca Hakedişleri</div>
            {earningsSummary.unpaidCount > 0 && (
              <span style={{ background: '#FFF7ED', border: '1px solid #FDBA74', color: '#F97316', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                Bekleyen: {fmtMoney(earningsSummary.totalUnpaid)}
              </span>
            )}
          </div>
          {loading ? <Spinner /> : coachEarnings.length === 0 ? (
            <EmptyState icon="school" title="Henüz hakediş kaydı yok" sub="Hocaya atanmış rezervasyonlar ödendiğinde hakedişler otomatik oluşur" />
          ) : (
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Coach filter dropdown */}
              <div style={{ position: 'relative' }}>
                <button type="button"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontSize: 14, fontWeight: coachFilter ? 700 : 600, color: coachFilter ? 'var(--brand-navy)' : 'var(--text-2)' }}
                  onClick={() => setDropdownOpen(v => !v)}
                >
                  <span className="material-icons" style={{ fontSize: 16, color: coachFilter ? 'var(--brand-navy)' : 'var(--text-2)' }}>person_search</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{coachFilter || 'Tüm Hocalar'}</span>
                  <span className="material-icons" style={{ fontSize: 20, color: 'var(--text-2)' }}>{dropdownOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
                </button>
                {dropdownOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {[null, ...uniqueCoaches].map(name => (
                      <div key={name || '_all'}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: coachFilter === name ? '#EEF2FF' : 'transparent', fontSize: 14, fontWeight: coachFilter === name ? 700 : 500, color: coachFilter === name ? 'var(--brand-navy)' : 'var(--text-1)' }}
                        onClick={() => { setCoachFilter(name); setDropdownOpen(false); }}
                      >
                        {name || 'Tüm Hocalar'}
                        {coachFilter === name && <span className="material-icons" style={{ fontSize: 16, color: 'var(--brand-navy)' }}>check</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bulk pay */}
              {coachFilter && (() => {
                const unpaid = filteredEarnings.filter(e => e.payment_status === 'unpaid');
                if (unpaid.length === 0) return null;
                const total = unpaid.reduce((s, e) => s + e.amount, 0);
                return (
                  <button className="btn btn-sm" style={{ background: '#22C55E', color: '#fff', border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '11px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                    onClick={() => markAllEarningsPaid(coachFilter)}
                  >
                    <span className="material-icons" style={{ fontSize: 16 }}>payments</span>
                    Toplu Öde · {fmtMoney(total)} ({unpaid.length} hakediş)
                  </button>
                );
              })()}

              {/* Earnings list */}
              {filteredEarnings.map((e, i) => {
                const isPaid = e.payment_status === 'paid';
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < filteredEarnings.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: isPaid ? '#DCFCE7' : '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-icons" style={{ color: isPaid ? '#22C55E' : '#F97316', fontSize: 20 }}>school</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{e.coach_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                        {fmtDate(e.date)}{e.student_name ? ` • ${e.student_name}` : ''}
                      </div>
                      {e.court_fee != null && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>Kort: {fmtMoney(e.court_fee)}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#F97316' }}>{fmtMoney(e.amount)}</div>
                      {isPaid ? (
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 999, background: '#DCFCE7', color: '#22C55E' }}>ÖDENDİ</span>
                      ) : (
                        <button type="button"
                          style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 999, background: '#FFF7ED', color: '#F97316', border: 'none', cursor: 'pointer' }}
                          onClick={() => markEarningPaid(e.id)}
                        >ÖDENDİ Mİ?</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Add Record Modal ── */}
      {addModal && (
        <Modal title="Yeni Kayıt Ekle" wide onClose={() => setAddModal(false)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setAddModal(false)}>Vazgeç</button>
            <button className="btn btn-pri btn-sm" onClick={addRecord} disabled={saving}>
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </>
        }>
          <div className="fields" style={{ gap: 16 }}>
            {/* Type toggle */}
            <Field label="TÜR">
              <div style={{ display: 'flex', gap: 4, background: 'var(--border)', borderRadius: 12, padding: 4 }}>
                <button type="button"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 9, border: 'none', background: form.type === 'income' ? '#22C55E' : 'transparent', color: form.type === 'income' ? '#fff' : 'var(--text-2)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                  onClick={() => setForm({ ...form, type: 'income', category: '' })}
                >
                  <span className="material-icons" style={{ fontSize: 15 }}>trending_up</span> Gelir
                </button>
                <button type="button"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 9, border: 'none', background: form.type === 'expense' ? '#EF4444' : 'transparent', color: form.type === 'expense' ? '#fff' : 'var(--text-2)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                  onClick={() => setForm({ ...form, type: 'expense', category: '' })}
                >
                  <span className="material-icons" style={{ fontSize: 15 }}>trending_down</span> Gider
                </button>
              </div>
            </Field>

            {/* Category chips */}
            <Field label="KATEGORİ">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                  <button key={cat} type="button"
                    style={{ padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: form.category === cat ? 700 : 500, border: '1.5px solid', borderColor: form.category === cat ? 'var(--brand-navy)' : 'var(--border)', background: form.category === cat ? 'var(--brand-navy)' : 'var(--bg)', color: form.category === cat ? '#fff' : 'var(--text-2)', cursor: 'pointer' }}
                    onClick={() => setForm({ ...form, category: cat })}
                  >{cat}</button>
                ))}
              </div>
            </Field>

            {/* Amount */}
            <Field label="TUTAR">
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 12, paddingLeft: 14 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginRight: 6 }}>₺</span>
                <input type="number" min={0} value={form.amount} placeholder="0,00"
                  style={{ border: 'none', background: 'transparent', fontSize: 18, fontWeight: 700, outline: 'none', paddingTop: 12, paddingBottom: 12, flex: 1, color: 'var(--text-1)' }}
                  onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
            </Field>

            {/* Description */}
            <Field label="AÇIKLAMA">
              <textarea rows={3} value={form.description} placeholder="Kayıt açıklaması…"
                onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
            </Field>
          </div>
        </Modal>
      )}

      {/* ── Detail Modal ── */}
      {detailRecord && (() => {
        const r = detailRecord;
        const isIncome  = r.type === 'income';
        const isBooking = r.category === 'Rezervasyon Geliri';
        return (
          <Modal title="İşlem Detayı" onClose={() => setDetailRecord(null)} footer={
            <button className="btn btn-ghost btn-sm" onClick={() => setDetailRecord(null)}>Kapat</button>
          }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: isIncome ? '#DCFCE7' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-icons" style={{ color: isIncome ? '#22C55E' : '#EF4444', fontSize: 28 }}>
                    {isBooking ? 'calendar_today' : isIncome ? 'trending_up' : 'trending_down'}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', letterSpacing: 1 }}>İŞLEM TUTARI</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: isIncome ? '#22C55E' : '#EF4444' }}>
                  {isIncome ? '+' : '–'} {fmtMoney(r.amount)}
                </div>
                {isBooking && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1.5px solid #22C55E', borderRadius: 999, padding: '4px 12px' }}>
                    <span className="material-icons" style={{ fontSize: 12, color: '#22C55E' }}>auto_awesome</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', letterSpacing: 0.5 }}>OTOMATİK KAYIT</span>
                  </div>
                )}
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: 'category', label: 'KATEGORİ', value: r.category },
                  { icon: 'event',    label: 'TARİH',    value: fmtDate(r.date) },
                  r.receipt_category ? { icon: 'receipt', label: 'FİŞ TÜRÜ', value: r.receipt_category } : null,
                ].filter(Boolean).map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-icons" style={{ color: 'var(--brand-navy)', fontSize: 16 }}>{row.icon}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)', letterSpacing: 0.5 }}>{row.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginTop: 2 }}>{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              {r.description && (
                <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)', letterSpacing: 0.5, marginBottom: 6 }}>AÇIKLAMA</div>
                  <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.5 }}>{r.description}</div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ANALİTİK
// ═══════════════════════════════════════════════════════════════
function AnalyticsScreen({ clubId }) {
  const { useState, useEffect } = React;
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState({});
  const [monthly,  setMonthly]  = useState([]);
  const [hourly,   setHourly]   = useState([]);

  useEffect(() => { if (clubId) load(); }, [clubId]);

  const load = async () => {
    setLoading(true);
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const courtIds = await getClubCourtIds(clubId);

      const [bkAll, memAll] = await Promise.all([
        courtIds.length > 0
          ? sb.from('bookings').select('id,start_time,status').in('court_id', courtIds).gte('start_time', sixMonthsAgo.toISOString())
          : Promise.resolve({ data: [] }),
        sb.from('club_memberships').select('id,status,created_at').eq('club_id', clubId),
      ]);

      const bookings = bkAll.data || [];
      const members  = memAll.data || [];

      const monthMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const key = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
        monthMap[key] = 0;
      }
      bookings.forEach(b => {
        const d   = new Date(b.start_time);
        const key = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
        if (monthMap[key] !== undefined) monthMap[key]++;
      });
      setMonthly(Object.entries(monthMap).map(([m, n]) => ({ m, n })));

      const hMap = {};
      for (let h = 6; h <= 21; h++) hMap[h] = 0;
      bookings.forEach(b => { const h = new Date(b.start_time).getHours(); if (hMap[h] !== undefined) hMap[h]++; });
      setHourly(Object.entries(hMap).map(([h, n]) => ({ h: Number(h), n })));

      setStats({
        totalBookings:  bookings.length,
        confirmedRate:  bookings.length > 0 ? Math.round(bookings.filter(b => ['confirmed','completed'].includes(b.status)).length / bookings.length * 100) : 0,
        activeMembers:  members.filter(m => m.status === 'active').length,
        totalMembers:   members.length,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const maxMonthly = Math.max(...monthly.map(m => m.n), 1);
  const maxHourly  = Math.max(...hourly.map(h => h.n), 1);

  if (loading) return <Spinner />;

  return (
    <div className="page fade-in">
      <div className="page-head">
        <h1>Analitik</h1>
        <button className="btn btn-ghost" onClick={load}><span className="material-icons">refresh</span></button>
      </div>

      <div className="stats">
        <StatCard icon="event_available" n={stats.totalBookings}        label="6 Aylık Rezervasyon" />
        <StatCard icon="percent"         n={`%${stats.confirmedRate}`}  label="Onay Oranı"          tint="green" />
        <StatCard icon="group"           n={stats.activeMembers}        label="Aktif Üye"            tint="navy" />
        <StatCard icon="people"          n={stats.totalMembers}         label="Toplam Üye" />
      </div>

      <div className="row2">
        <div className="chart-card">
          <div className="h"><h4>Aylık Rezervasyon (Son 6 Ay)</h4></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160, paddingBottom: 28 }}>
            {monthly.map((m, i) => {
              const pct = maxMonthly > 0 ? (m.n / maxMonthly) * 100 : 0;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 600 }}>{m.n}</div>
                  <div style={{ width: '100%', background: 'var(--brand-navy)', height: `${Math.max(pct, 3)}%`, borderRadius: '4px 4px 0 0', minHeight: 4, transition: 'height 300ms' }} title={`${m.m}: ${m.n} rezervasyon`} />
                  <div style={{ fontSize: 9, color: 'var(--text-2)' }}>{m.m}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-card">
          <div className="h"><h4>Saat Dağılımı</h4></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {hourly.map(({ h, n }) => {
              const pct = maxHourly > 0 ? n / maxHourly : 0;
              const bg  = `rgba(0,51,153,${0.08 + pct * 0.7})`;
              return (
                <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>
                    {String(h).padStart(2, '0')}:00
                  </div>
                  <div style={{ flex: 1, height: 18, background: bg, borderRadius: 4, position: 'relative' }}>
                    {n > 0 && (
                      <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: pct > 0.5 ? '#fff' : 'var(--brand-navy)', fontWeight: 700 }}>{n}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

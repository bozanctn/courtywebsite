// ── Tekrarlayan Ders Modalı (Recurring) ─────────────────────────
// Mobil CreateBookingModal 'recurring' modu ile SİSTEMSEL OLARAK BİREBİR.
// • lessons tablosuna GERÇEK-UTC (+03:00) yazar (mobil ile aynı tablo/biçim) — gölge-booking YOK.
// • Hafta sayısı: Aylık=4, 3 Aylık=12. Seçili haftanın günlerine göre tarih üretir.
// • Çakışan tarihleri atlar; paket seçiliyse seansı paketten düşer (useSession = mobil birebir).
// Kaynak: src/components/CreateBookingModal.tsx (handleRecurringSubmit / _createRecurringLessons)

const REC_DAY_INDEX = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
const REC_DAYS = [
  { key: 'monday', label: 'Pzt' }, { key: 'tuesday', label: 'Sal' }, { key: 'wednesday', label: 'Çar' },
  { key: 'thursday', label: 'Per' }, { key: 'friday', label: 'Cum' }, { key: 'saturday', label: 'Cmt' }, { key: 'sunday', label: 'Paz' },
];
const recLocalDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

window.RecurringLessonModal = function RecurringLessonModal({ clubId, onClose, onCreated }) {
  const { useState, useEffect } = React;

  // ── Kaynak veriler ──
  const [coaches, setCoaches] = useState([]);
  const [courts,  setCourts]  = useState([]);

  // ── Form state (mobil rec* ile birebir) ──
  const [recCoach, setRecCoach]             = useState(null);
  const [recTitle, setRecTitle]             = useState('');
  const [recStartTime, setRecStartTime]     = useState('09:00');
  const [recEndTime, setRecEndTime]         = useState('10:00');
  const [recSelectedDays, setRecSelectedDays] = useState([]);
  const [recNotes, setRecNotes]             = useState('');
  const [recPrice, setRecPrice]             = useState('');
  const [recDurationType, setRecDurationType] = useState('monthly'); // 'monthly' | '3months'
  const [recSelectedCourt, setRecSelectedCourt] = useState(null);
  const [submitting, setSubmitting]         = useState(false);

  // Öğrenci — 3 mod
  const [recStudentMode, setRecStudentMode] = useState('member'); // member | customer | guest
  const [recStudent, setRecStudent]         = useState(null);     // { id, full_name } (auth hesabı)
  const [recStudentDisplayName, setRecStudentDisplayName] = useState('');
  const [recCustomerId, setRecCustomerId]   = useState(null);
  const [recGuestName, setRecGuestName]     = useState('');
  const [recSearchQuery, setRecSearchQuery] = useState('');
  const [recSearchResults, setRecSearchResults] = useState([]);
  const [recSearchLoading, setRecSearchLoading] = useState(false);
  const [recCustomerSearch, setRecCustomerSearch] = useState('');
  const [recCustomerResults, setRecCustomerResults] = useState([]);

  // Paket
  const [recUsePackage, setRecUsePackage]   = useState(false);
  const [recAvailablePackages, setRecAvailablePackages] = useState([]);
  const [recSelectedPackageId, setRecSelectedPackageId] = useState(null);
  const [recLoadingPackages, setRecLoadingPackages] = useState(false);

  // ── Kaynakları yükle ──
  useEffect(() => {
    (async () => {
      const [cRes, ctRes] = await Promise.all([
        sb.from('club_coaches').select('id, full_name, hourly_rate, individual_coach_id, coach_pay_rate')
          .eq('club_id', clubId).eq('is_active', true).order('full_name'),
        sb.from('courts').select('id, court_number, court_type, hourly_rate')
          .eq('club_id', clubId).eq('is_active', true).order('court_number'),
      ]);
      setCoaches(cRes.data || []);
      setCourts(ctRes.data || []);
    })();
  }, [clubId]);

  // ── Öğrenci/müşteri arama (mobil searchRecStudents/searchRecCustomers birebir) ──
  const searchStudents = async (q) => {
    if (q.trim().length < 2) { setRecSearchResults([]); return; }
    setRecSearchLoading(true);
    try {
      const { data } = await sb.from('profiles').select('id, full_name')
        .eq('user_type', 'player').ilike('full_name', `%${q.trim()}%`).limit(6);
      setRecSearchResults(data || []);
    } catch { setRecSearchResults([]); }
    finally { setRecSearchLoading(false); }
  };
  const searchCustomers = async (q) => {
    if (q.trim().length < 2) { setRecCustomerResults([]); return; }
    try {
      const { data } = await sb.from('club_customers').select('id, full_name, phone, user_id')
        .eq('club_id', clubId).eq('is_active', true)
        .or(`full_name.ilike.%${q.trim()}%,phone.ilike.%${q.trim()}%`).limit(8);
      setRecCustomerResults(data || []);
    } catch { setRecCustomerResults([]); }
  };

  const resetStudent = () => {
    setRecStudent(null); setRecSearchQuery(''); setRecSearchResults([]);
    setRecCustomerSearch(''); setRecCustomerResults([]);
    setRecGuestName(''); setRecStudentDisplayName(''); setRecCustomerId(null);
  };

  // ── Öğrenci+hoca seçilince paketleri yükle (mobil ile birebir) ──
  useEffect(() => {
    const hasStudent = recStudent?.id || recStudentDisplayName;
    if (!hasStudent) { setRecAvailablePackages([]); setRecSelectedPackageId(null); setRecUsePackage(false); return; }
    (async () => {
      setRecLoadingPackages(true);
      try {
        const now = new Date().toISOString();
        const coachAuthId = recCoach?.individual_coach_id;
        const clubCoachId = recCoach?.id;
        const sel = '*, lesson_packages(name, total_lessons, price, validity_days)';
        const baseFilters = (q) => q
          .eq('club_id', clubId).in('payment_status', ['paid', 'pending']).eq('status', 'active')
          .or(`expiry_date.is.null,expiry_date.gt.${now}`).order('created_at', { ascending: false });
        const applyCoachFilter = (q) => {
          if (!coachAuthId && !clubCoachId) return q;
          const filters = [];
          if (coachAuthId) filters.push(`coach_id.eq.${coachAuthId}`);
          if (clubCoachId && clubCoachId !== coachAuthId) filters.push(`coach_id.eq.${clubCoachId}`);
          return q.or(filters.join(','));
        };
        const queries = [];
        if (recStudent?.id) {
          let q = sb.from('player_lesson_packages').select(sel).eq('player_id', recStudent.id);
          q = baseFilters(q); if (coachAuthId || clubCoachId) q = applyCoachFilter(q);
          queries.push(q);
        }
        if (recStudentDisplayName) {
          let q = sb.from('player_lesson_packages').select(sel).is('player_id', null).eq('manual_player_name', recStudentDisplayName);
          q = baseFilters(q); if (coachAuthId || clubCoachId) q = applyCoachFilter(q);
          queries.push(q);
        }
        const results = await Promise.all(queries);
        const seen = new Set(); const merged = [];
        for (const { data } of results) for (const row of (data || [])) if (!seen.has(row.id)) { seen.add(row.id); merged.push(row); }
        const pkgs = merged.map(d => ({ ...d, package_name: d.lesson_packages?.name ?? d.custom_name ?? 'Ders Paketi' }));
        setRecAvailablePackages(pkgs);
        setRecSelectedPackageId(pkgs.length > 0 ? pkgs[0].id : null);
        if (pkgs.length === 0) setRecUsePackage(false);
      } catch (e) { console.error(e); }
      finally { setRecLoadingPackages(false); }
    })();
  }, [recStudent?.id, recStudentDisplayName, recCoach?.individual_coach_id, clubId]);

  // ── Paketten seans düş (mobil LessonPackageService.useSession birebir) ──
  const useSession = async (playerPackageId, coachAuthId, sessionDate, lessonId, notes) => {
    const { data: plp, error: fErr } = await sb.from('player_lesson_packages')
      .select('*, lesson_packages(price, total_lessons, coach_percentage, coach_payout_mode, club_id)')
      .eq('id', playerPackageId).single();
    if (fErr) throw fErr;
    const remaining = plp.total_lessons - plp.used_lessons;
    if (remaining <= 0) throw new Error('Bu pakette kalan ders yok');
    if (plp.status !== 'active') throw new Error('Bu paket aktif değil');
    // Ödeme onayı bekleyen (pending) paketlerden de ders düşülebilir — tahsilat programdan bağımsız.
    const newUsed = plp.used_lessons + 1;
    const isCompleted = newUsed >= plp.total_lessons;
    const { error: sErr } = await sb.from('lesson_package_sessions').insert({
      player_package_id: playerPackageId, lesson_id: lessonId ?? null,
      coach_id: coachAuthId, session_date: sessionDate, notes: notes ?? null,
    });
    if (sErr) throw sErr;
    const { error: uErr } = await sb.from('player_lesson_packages').update({
      used_lessons: newUsed, status: isCompleted ? 'completed' : 'active', updated_at: new Date().toISOString(),
    }).eq('id', playerPackageId);
    if (uErr) throw uErr;
    // Earnings — per_session ise yalnız hoca payı; upfront ise hiçbir kayıt
    const pkg = plp.lesson_packages;
    const isCustom = !pkg && (plp.custom_price != null);
    const payoutMode = plp.coach_payout_mode ?? pkg?.coach_payout_mode ?? 'upfront';
    if (payoutMode === 'per_session' && (pkg || isCustom)) {
      const totalPrice = isCustom ? (plp.custom_price ?? 0) : (pkg.price ?? 0);
      const totalLessons = plp.total_lessons;
      const perSessionTotal = totalLessons > 0 ? totalPrice / totalLessons : 0;
      const cid = isCustom ? plp.club_id : pkg.club_id;
      const [ccRes, plRes] = await Promise.all([
        sb.from('club_coaches').select('id, full_name, coach_pay_rate').eq('individual_coach_id', coachAuthId).maybeSingle(),
        sb.from('profiles').select('full_name').eq('id', plp.player_id).maybeSingle(),
      ]);
      const pkgPct = isCustom ? plp.custom_coach_pct : pkg?.coach_percentage;
      const coachPct = Number(pkgPct) > 0 ? Number(pkgPct) : (ccRes.data?.coach_pay_rate ?? 0);
      const coachAmount = Math.round(perSessionTotal * (coachPct / 100) * 100) / 100;
      if (ccRes.data && coachAmount > 0) {
        const { error: seErr } = await sb.from('coach_earnings').insert({
          coach_id: ccRes.data.id, club_id: cid, coach_name: ccRes.data.full_name ?? 'Antrenör',
          student_name: plRes.data?.full_name ?? 'Öğrenci', amount: coachAmount, date: sessionDate,
          description: 'Ders Paketi Oturumu', payment_status: 'unpaid',
        });
        if (seErr) throw new Error(`Seans işlendi ancak hoca hakediş kaydı yazılamadı: ${seErr.message}`);
      }
    }
  };

  // ── Gönder: önce çakışma tara, sonra oluştur (mobil handleRecurringSubmit birebir) ──
  const handleSubmit = async () => {
    if (!recTitle.trim()) { alert('Lütfen ders başlığı girin.'); return; }
    if (!recCoach) { alert('Lütfen bir hoca seçin.'); return; }
    const studentLabel =
      recStudentMode === 'guest' ? recGuestName.trim() :
      recStudentMode === 'customer' ? recStudentDisplayName :
      (recStudent?.full_name ?? recSearchQuery.trim());
    if (!studentLabel) { alert('Lütfen öğrenci bilgisi girin.'); return; }
    if (recSelectedDays.length === 0) { alert('Lütfen en az bir gün seçin.'); return; }
    const [sh, sm] = recStartTime.split(':').map(Number);
    const [eh, em] = recEndTime.split(':').map(Number);
    if (isNaN(sh) || isNaN(eh) || eh * 60 + em <= sh * 60 + sm) { alert('Geçerli bir başlangıç ve bitiş saati girin.'); return; }

    const { data: { user } } = await sb.auth.getUser();
    const coachAuthId = recCoach?.individual_coach_id ?? user?.id;

    // ── Çakışma taraması ──
    const conflictWarnings = [];
    const today = new Date();
    const weekCountForCheck = recDurationType === '3months' ? 12 : 4;
    for (let week = 0; week < weekCountForCheck; week++) {
      for (const dayKey of recSelectedDays) {
        const dayIndex = REC_DAY_INDEX[dayKey] ?? 1;
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + (week * 7) + (dayIndex - today.getDay() + 7) % 7);
        if (checkDate < today) continue;
        const dateStr = recLocalDateStr(checkDate);
        const startIso = `${dateStr}T${recStartTime}:00+03:00`;
        const endIso   = `${dateStr}T${recEndTime}:00+03:00`;

        if (coachAuthId) {
          const { data: coachLessons } = await sb.from('lessons').select('id')
            .eq('coach_id', coachAuthId).neq('status', 'cancelled')
            .lt('start_time', endIso).gt('end_time', startIso);
          if (coachLessons && coachLessons.length > 0) {
            const msg = `${dateStr}: Dersiniz var (${recStartTime}–${recEndTime})`;
            if (!conflictWarnings.includes(msg)) conflictWarnings.push(msg);
          }
        }
        if (recStudent?.id) {
          const [bRes, lRes] = await Promise.all([
            sb.from('bookings').select('id').eq('user_id', recStudent.id).neq('status', 'cancelled').lt('start_time', endIso).gt('end_time', startIso),
            sb.from('lessons').select('id').eq('student_id', recStudent.id).neq('status', 'cancelled').lt('start_time', endIso).gt('end_time', startIso),
          ]);
          if ((bRes.data && bRes.data.length > 0) || (lRes.data && lRes.data.length > 0)) {
            const msg = `${dateStr}: Öğrenci bu saatte meşgul`;
            if (!conflictWarnings.includes(msg)) conflictWarnings.push(msg);
          }
        }
        if (recSelectedCourt) {
          const [cbRes, clRes] = await Promise.all([
            sb.from('bookings').select('id').eq('court_id', recSelectedCourt.id).neq('status', 'cancelled').lt('start_time', endIso).gt('end_time', startIso),
            sb.from('lessons').select('id').eq('court_id', recSelectedCourt.id).neq('status', 'cancelled').lt('start_time', endIso).gt('end_time', startIso),
          ]);
          if ((cbRes.data && cbRes.data.length > 0) || (clRes.data && clRes.data.length > 0)) {
            const msg = `${dateStr}: Kort ${recSelectedCourt.court_number} bu saatte dolu`;
            if (!conflictWarnings.includes(msg)) conflictWarnings.push(msg);
          }
        }
      }
    }

    if (conflictWarnings.length > 0) {
      const body = `${conflictWarnings.slice(0, 6).join('\n')}${conflictWarnings.length > 6 ? `\n...ve ${conflictWarnings.length - 6} çakışma daha` : ''}`;
      if (!confirm(`⚠️ Çakışmalar Tespit Edildi\n\n${body}\n\nYine de ders oluşturulsun mu?`)) return;
    }
    await createLessons(coachAuthId, studentLabel);
  };

  const createLessons = async (coachAuthId, studentLabel) => {
    setSubmitting(true);
    try {
      const studentId = recStudent?.id;
      const startDate = new Date();
      const lessonsCreated = [];
      const normalPriceLessons = [];
      const skippedDates = [];
      const [rSH, rSM] = recStartTime.split(':').map(Number);
      const [rEH, rEM] = recEndTime.split(':').map(Number);
      const durationHours = Math.max(0.5, (rEH * 60 + rEM - rSH * 60 - rSM) / 60);
      const weekCount = recDurationType === '3months' ? 12 : 4;

      let packageSessionsLeft = 0;
      if (recUsePackage && recSelectedPackageId) {
        const pkg = recAvailablePackages.find(p => p.id === recSelectedPackageId);
        if (pkg) packageSessionsLeft = Math.max(0, pkg.total_lessons - pkg.used_lessons);
      }

      for (let week = 0; week < weekCount; week++) {
        for (const dayKey of recSelectedDays) {
          const dayIndex = REC_DAY_INDEX[dayKey] ?? 1;
          const lessonDate = new Date(startDate);
          lessonDate.setDate(startDate.getDate() + (week * 7) + (dayIndex - startDate.getDay() + 7) % 7);
          if (lessonDate < new Date()) continue;

          const dateStr = recLocalDateStr(lessonDate);
          const startIso = `${dateStr}T${recStartTime}:00+03:00`;
          const endIso   = `${dateStr}T${recEndTime}:00+03:00`;

          // Çakışma varsa bu tarihi atla (hocanın dersi)
          if (coachAuthId) {
            const { data: existingConflict } = await sb.from('lessons').select('id')
              .eq('coach_id', coachAuthId).neq('status', 'cancelled')
              .lt('start_time', endIso).gt('end_time', startIso).limit(1);
            if (existingConflict && existingConflict.length > 0) { skippedDates.push(dateStr); continue; }
          }

          const usePackageForThis = recUsePackage && recSelectedPackageId && packageSessionsLeft > 0;
          const normalPrice = recPrice ? parseInt(recPrice.replace(',', '.')) : 0;

          const lessonData = {
            coach_id:         coachAuthId ?? null,
            club_coach_id:    recCoach?.id ?? null,
            student_name:     studentLabel,
            student_id:       studentId ?? null,
            club_customer_id: recCustomerId,
            title:            recTitle.trim(),
            start_time:       startIso,
            end_time:         endIso,
            date:             dateStr,
            duration_hours:   durationHours,
            location:         recSelectedCourt ? `Kort ${recSelectedCourt.court_number}` : 'Kulüp',
            amount:           usePackageForThis ? 0 : normalPrice,
            notes:            recNotes.trim() || null,
            lesson_type:      'manual',
            status:           'confirmed',
            payment_status:   usePackageForThis ? 'paid' : 'unpaid',
          };
          if (recSelectedCourt) lessonData.court_id = recSelectedCourt.id;

          let createdId = null;
          try {
            const { data: inserted, error } = await sb.from('lessons').insert(lessonData).select('id').single();
            if (error) throw error;
            createdId = inserted?.id ?? null;
            lessonsCreated.push({ id: createdId, date: dateStr });
          } catch (lessonErr) {
            console.warn(`Recurring lesson skipped for ${dateStr}:`, lessonErr?.message);
            skippedDates.push(dateStr);
            continue;
          }

          if (usePackageForThis && studentId && createdId && coachAuthId) {
            try {
              await useSession(recSelectedPackageId, coachAuthId, dateStr, createdId, recNotes.trim() || undefined);
              packageSessionsLeft--;
            } catch {
              packageSessionsLeft = 0;
              normalPriceLessons.push(dateStr);
              await sb.from('lessons').update({ payment_status: 'unpaid', amount: normalPrice }).eq('id', createdId);
            }
          } else if (recUsePackage && !usePackageForThis) {
            normalPriceLessons.push(dateStr);
          }
        }
      }

      if (lessonsCreated.length === 0) {
        alert(`Hiçbir ders oluşturulamadı. Seçilen tüm tarihler (${skippedDates.length} adet) mevcut derslerle çakışıyor.`);
        return;
      }

      const packagedCount = lessonsCreated.length - normalPriceLessons.length;
      let successMsg = `${lessonsCreated.length} adet tekrarlayan ders oluşturuldu!`;
      if (recUsePackage && normalPriceLessons.length > 0 && packagedCount > 0) {
        successMsg += `\n\n${packagedCount} ders paketten karşılandı. Paket bittiği için ${normalPriceLessons.length} ders normal fiyatla eklendi.`;
      } else if (recUsePackage && normalPriceLessons.length > 0 && packagedCount === 0) {
        successMsg += `\n\nPakette kalan ders olmadığı için tüm dersler normal fiyatla eklendi.`;
      }
      if (skippedDates.length > 0) successMsg += `\n\n${skippedDates.length} tarih çakışma nedeniyle atlandı.`;

      onCreated?.();
      onClose?.();
      alert(successMsg);
    } catch (e) {
      alert(e?.message ?? 'Tekrarlayan dersler oluşturulurken bir hata oluştu.');
    } finally { setSubmitting(false); }
  };

  const selectedStudentName = recStudentDisplayName || recStudent?.full_name;
  const canSubmit = !submitting && recSelectedDays.length > 0 && recTitle.trim() && recCoach;

  return (
    <Modal
      title="Tekrarlayan Ders"
      sub="Seçilen günlere, ay boyunca otomatik ders oluştur"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Vazgeç</button>
          <button className="btn btn-pri btn-sm" onClick={handleSubmit} disabled={!canSubmit}>
            <span className="material-icons" style={{ fontSize: 16 }}>repeat</span>
            {submitting ? ' Oluşturuluyor…' : ' Oluştur'}
          </button>
        </>
      }
    >
      <div className="fields" style={{ gap: 14 }}>
        {/* Hoca */}
        <Field label="Hoca">
          {coaches.length === 0 ? (
            <div style={{ color: 'var(--text-2)', fontSize: 13 }}>Kulübe kayıtlı aktif hoca bulunamadı.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {coaches.map(c => {
                const active = recCoach?.id === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => setRecCoach(active ? null : c)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      border: `1px solid ${active ? 'var(--brand-navy)' : 'var(--border)'}`, background: active ? 'var(--brand-navy)' : '#fff', color: active ? '#fff' : 'var(--text-1)' }}>
                    <span className="material-icons" style={{ fontSize: 15, color: active ? '#fff' : 'var(--brand-navy)' }}>person</span>
                    {c.full_name}
                    {active && <span className="material-icons" style={{ fontSize: 15 }}>check_circle</span>}
                  </button>
                );
              })}
            </div>
          )}
        </Field>

        {/* Ders başlığı */}
        <Field label="Ders Başlığı">
          <input value={recTitle} placeholder="Örn: Tenis Dersi" onChange={e => setRecTitle(e.target.value)} />
        </Field>

        {/* Öğrenci */}
        <Field label="Öğrenci">
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 8 }}>
            {[{ v: 'member', l: 'Üye' }, { v: 'customer', l: 'Müşteri' }, { v: 'guest', l: 'Misafir' }].map(m => (
              <button key={m.v} type="button" onClick={() => { setRecStudentMode(m.v); resetStudent(); }}
                style={{ flex: 1, padding: '8px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: recStudentMode === m.v ? 'var(--brand-navy)' : 'transparent', color: recStudentMode === m.v ? '#fff' : 'var(--text-1)' }}>
                {m.l}
              </button>
            ))}
          </div>

          {(selectedStudentName && recStudentMode !== 'guest') ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EEF2FF', borderRadius: 10, padding: '9px 12px', border: '1px solid #C7D2FE' }}>
              <span className="material-icons" style={{ color: 'var(--brand-navy)', fontSize: 16 }}>verified_user</span>
              <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: 'var(--brand-navy)' }}>{selectedStudentName}</span>
              <button type="button" onClick={resetStudent} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 0 }}>
                <span className="material-icons" style={{ fontSize: 16 }}>close</span>
              </button>
            </div>
          ) : recStudentMode === 'guest' ? (
            <input value={recGuestName} placeholder="Misafir adı yazın" onChange={e => setRecGuestName(e.target.value)} />
          ) : recStudentMode === 'member' ? (
            <div style={{ position: 'relative' }}>
              <input value={recSearchQuery} placeholder="CourtyCLUB üyesi ara…"
                onChange={e => { setRecSearchQuery(e.target.value); searchStudents(e.target.value); }} />
              {recSearchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: 4 }}>
                  {recSearchResults.map((st, idx) => (
                    <div key={st.id} onMouseDown={() => { setRecStudent({ id: st.id, full_name: st.full_name }); setRecStudentDisplayName(st.full_name); setRecCustomerId(null); setRecSearchQuery(''); setRecSearchResults([]); }}
                      style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: idx < recSearchResults.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span className="material-icons" style={{ fontSize: 15, color: 'var(--brand-navy)' }}>person</span>
                      <span style={{ flex: 1, fontWeight: 600 }}>{st.full_name}</span>
                      <span className="material-icons" style={{ fontSize: 14, color: '#22C55E' }}>verified</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input value={recCustomerSearch} placeholder="Müşteri adı veya telefon ara…"
                onChange={e => { setRecCustomerSearch(e.target.value); searchCustomers(e.target.value); }} />
              {recCustomerResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: 4 }}>
                  {recCustomerResults.map((c, idx) => (
                    <div key={c.id} onMouseDown={() => { setRecStudentDisplayName(c.full_name); setRecCustomerId(c.id); setRecCustomerSearch(''); setRecCustomerResults([]); if (c.user_id) setRecStudent({ id: c.user_id, full_name: c.full_name }); }}
                      style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: idx < recCustomerResults.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span className="material-icons" style={{ fontSize: 15, color: 'var(--brand-navy)' }}>person</span>
                      <span style={{ flex: 1, fontWeight: 600 }}>{c.full_name}</span>
                      {c.phone && <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{c.phone}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Field>

        {/* Paket */}
        {recStudent && recAvailablePackages.length > 0 && (
          <Field label="Paketten Düş" hint="Bu dersleri öğrencinin aktif paketinden say">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={recUsePackage} onChange={e => setRecUsePackage(e.target.checked)} />
              Aktif paketten düş
            </label>
            {recUsePackage && (recLoadingPackages ? (
              <div style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 6 }}>Paketler yükleniyor…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {recAvailablePackages.map(pkg => {
                  const remaining = pkg.total_lessons - pkg.used_lessons;
                  const sel = recSelectedPackageId === pkg.id;
                  return (
                    <button key={pkg.id} type="button" onClick={() => setRecSelectedPackageId(pkg.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                        border: `1px solid ${sel ? 'var(--brand-navy)' : 'var(--border)'}`, background: sel ? '#EEF2FF' : '#fff' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: sel ? 'var(--brand-navy)' : 'var(--text-1)' }}>{pkg.package_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{remaining} ders kaldı</div>
                      </div>
                      {sel && <span className="material-icons" style={{ fontSize: 16, color: 'var(--brand-navy)' }}>check_circle</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </Field>
        )}

        {/* Saat */}
        <div className="fields-2">
          <Field label="Başlangıç"><input type="time" value={recStartTime} onChange={e => setRecStartTime(e.target.value)} /></Field>
          <Field label="Bitiş"><input type="time" value={recEndTime} onChange={e => setRecEndTime(e.target.value)} /></Field>
        </div>

        {/* Günler */}
        <Field label="Hangi Günler?">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {REC_DAYS.map(day => {
              const active = recSelectedDays.includes(day.key);
              return (
                <button key={day.key} type="button"
                  onClick={() => setRecSelectedDays(prev => active ? prev.filter(d => d !== day.key) : [...prev, day.key])}
                  style={{ minWidth: 44, padding: '8px 10px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    border: `1px solid ${active ? 'var(--brand-navy)' : 'var(--border)'}`, background: active ? 'var(--brand-navy)' : '#fff', color: active ? '#fff' : 'var(--text-1)' }}>
                  {day.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Ücret */}
        <Field label="Ders Ücreti (₺)">
          <input type="number" min="0" placeholder={(recUsePackage && recSelectedPackageId) ? 'Paketten karşılanıyor' : '0'}
            disabled={!!(recUsePackage && recSelectedPackageId)}
            value={(recUsePackage && recSelectedPackageId) ? '' : recPrice}
            onChange={e => setRecPrice(e.target.value)}
            style={(recUsePackage && recSelectedPackageId) ? { background: '#F1F5F9', color: 'var(--text-2)' } : undefined} />
        </Field>

        {/* Süre */}
        <Field label="Süre">
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ v: 'monthly', l: 'Aylık (4 hafta)', i: 'date_range' }, { v: '3months', l: '3 Aylık (12 hafta)', i: 'event_repeat' }].map(opt => {
              const active = recDurationType === opt.v;
              return (
                <button key={opt.v} type="button" onClick={() => setRecDurationType(opt.v)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    border: `1px solid ${active ? 'var(--brand-navy)' : 'var(--border)'}`, background: active ? 'var(--brand-navy)' : '#fff', color: active ? '#fff' : 'var(--text-1)' }}>
                  <span className="material-icons" style={{ fontSize: 16, color: active ? '#fff' : 'var(--text-2)' }}>{opt.i}</span>
                  {opt.l}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Notlar */}
        <Field label="Notlar (Opsiyonel)">
          <textarea rows={2} value={recNotes} placeholder="Ders hakkında notlar…" onChange={e => setRecNotes(e.target.value)} style={{ resize: 'vertical' }} />
        </Field>

        {/* Kort */}
        {courts.length > 0 && (
          <Field label="Kort Seçimi (Opsiyonel)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {courts.map(court => {
                const active = recSelectedCourt?.id === court.id;
                return (
                  <button key={court.id} type="button" onClick={() => setRecSelectedCourt(active ? null : court)}
                    style={{ padding: '8px 11px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                      border: `1px solid ${active ? 'var(--brand-navy)' : 'var(--border)'}`, background: active ? 'var(--brand-navy)' : '#fff', color: active ? '#fff' : 'var(--text-1)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Kort {court.court_number}</div>
                    <div style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.8)' : 'var(--text-2)' }}>{court.court_type} · {court.hourly_rate}₺/sa</div>
                  </button>
                );
              })}
            </div>
          </Field>
        )}
      </div>
    </Modal>
  );
};

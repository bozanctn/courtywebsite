// ── Kulüp Profili ───────────────────────────────────────────────

function ClubProfileScreen({ clubId, clubProfile: initialProfile }) {
  const { useState, useEffect } = React;
  const [profile, setProfile] = useState(initialProfile || {});
  const [loading, setLoading] = useState(!initialProfile);
  const [modal,   setModal]   = useState(null); // 'edit' | 'password'
  const [form,    setForm]    = useState({});
  const [pwForm,  setPwForm]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwOk,    setPwOk]    = useState(false);

  useEffect(() => { if (clubId && !initialProfile) load(); }, [clubId]);

  const load = async () => {
    setLoading(true);
    const { data } = await sb.from('club_profiles').select('*').eq('id', clubId).maybeSingle();
    if (data) {
      if (!data.contact_email) {
        const { data: { user } } = await sb.auth.getUser();
        if (user?.email) data.contact_email = user.email;
      }
      setProfile(data);
    }
    setLoading(false);
  };

  // Koordinatları Google Maps linkinden çıkar
  const extractCoords = (link) => {
    try {
      const atMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) return { lat: atMatch[1], lng: atMatch[2] };
      const qMatch = link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) return { lat: qMatch[1], lng: qMatch[2] };
      const placeMatch = link.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (placeMatch) return { lat: placeMatch[1], lng: placeMatch[2] };
    } catch {}
    return null;
  };

  const openEdit = () => {
    const oh = (typeof profile.opening_hours === 'object' && profile.opening_hours)
      ? profile.opening_hours : { open: '09:00', close: '22:00' };
    const lh = (typeof profile.light_hours === 'object' && profile.light_hours)
      ? profile.light_hours : { open: '18:00', close: '22:00' };
    const am = Array.isArray(profile.amenities) ? profile.amenities
      : (profile.amenities || '').split(',').map(s => s.trim()).filter(Boolean);
    setForm({
      ...profile,
      opening_hours: oh, light_hours: lh, amenities: am,
      is_visible: profile.is_visible !== false,
      requires_booking_approval: profile.requires_booking_approval === true,
      has_membership_system: profile.has_membership_system !== false,
      has_cafe_system:       profile.has_cafe_system !== false,
      has_employee_system:   profile.has_employee_system !== false,
      max_reservation_duration: profile.max_reservation_duration || 120,
      booking_open_hour: profile.booking_open_hour ?? 0,
    });
    setModal('edit');
  };

  // Logo yükleme — mobil ile AYNI bucket ve yol şeması (club-photos/club-logos/<id>/)
  const [logoBusy, setLogoBusy] = useState(false);
  const uploadLogo = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Lütfen bir görsel dosyası seçin.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Logo 5 MB’tan küçük olmalı.'); return; }
    setLogoBusy(true);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `club-logos/${clubId}/${Date.now()}.${ext}`;
      const { error } = await sb.storage.from('club-photos')
        .upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = sb.storage.from('club-photos').getPublicUrl(path);
      setForm(prev => ({ ...prev, logo_url: data.publicUrl }));
    } catch (e) {
      alert('Logo yüklenemedi: ' + e.message);
    } finally { setLogoBusy(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      // Sayıyı DB CHECK sınırlarına sıkıştır; boş/geçersiz girişte varsayılana dön
      const clampInt = (raw, min, max, fallback) => {
        const n = parseInt(raw, 10);
        if (isNaN(n)) return fallback;
        return Math.min(max, Math.max(min, n));
      };

      const payload = {
        club_name:        form.club_name,
        description:      form.description      || null,
        // city FORMDA VARDI AMA KAYDEDİLMİYORDU — kullanıcı yazıyor, kayboluyordu
        city:             form.city             || null,
        logo_url:         form.logo_url         || null,
        address:          form.address          || null,
        contact_phone:    form.contact_phone    || null,
        contact_email:    form.contact_email    || null,
        website:          form.website          || null,
        google_maps_link: form.google_maps_link || null,
        latitude:         form.latitude  ? parseFloat(form.latitude)  : null,
        longitude:        form.longitude ? parseFloat(form.longitude) : null,
        number_of_courts: form.number_of_courts ? Number(form.number_of_courts) : null,
        light_fee:        form.light_fee ? Number(form.light_fee) : null,
        opening_hours:    form.opening_hours || null,
        light_hours:      form.light_hours   || null,
        amenities:        Array.isArray(form.amenities) ? form.amenities : [],
        is_visible:                form.is_visible !== false,
        requires_booking_approval: form.requires_booking_approval === true,
        has_membership_system:     form.has_membership_system !== false,
        has_cafe_system:           form.has_cafe_system !== false,
        has_employee_system:       form.has_employee_system !== false,
        max_reservation_duration:            form.max_reservation_duration ? Number(form.max_reservation_duration) : 120,
        max_advance_booking_days:            form.max_advance_booking_days ? Number(form.max_advance_booking_days) : null,
        booking_open_hour:                   form.booking_open_hour != null ? Number(form.booking_open_hour) : 0,
        primetime_start:                     form.primetime_start || null,
        primetime_end:                       form.primetime_end   || null,
        non_member_cancellation_limit:       form.non_member_cancellation_limit ? Number(form.non_member_cancellation_limit) : null,
        non_member_cancellation_penalty_days: form.non_member_cancellation_penalty_days ? Number(form.non_member_cancellation_penalty_days) : null,

        // ── Mobille eşitlenen ayarlar ──────────────────────────────────────
        // İzin verilen süreler: boş bırakılamaz (oyuncuya hiç seçenek kalmaz)
        allowed_reservation_durations: (Array.isArray(form.allowed_reservation_durations) && form.allowed_reservation_durations.length > 0)
          ? form.allowed_reservation_durations : [60, 90, 120],

        // Haftalık rezervasyon açılışı (oyuncu)
        booking_weekly_release:       form.booking_weekly_release === true,
        booking_release_day_of_week:  form.booking_release_day_of_week != null ? Number(form.booking_release_day_of_week) : 1,
        booking_release_hour:         clampInt(form.booking_release_hour, 0, 23, 8),

        // Hoca izinleri. NULL = slot kilidi kapalı (mobildeki semantiğin aynısı)
        coaches_can_add_lessons:        form.coaches_can_add_lessons !== false,
        coaches_require_lesson_package: form.coaches_require_lesson_package === true,
        coaches_must_use_package:       form.coaches_must_use_package === true,
        coach_cancel_slot_lock_minutes: form.coach_cancel_slot_lock_minutes
          ? clampInt(form.coach_cancel_slot_lock_minutes, 1, 10080, 60) : null,

        // Ders iptal politikası. Saatler kural kapalıyken de kaydedilir →
        // kulüp ayarını kaybetmez (mobildeki kalıp).
        late_cancel_charge_enabled:         form.late_cancel_charge_enabled === true,
        late_cancel_threshold_hour:         clampInt(form.late_cancel_threshold_hour, 0, 23, 12),
        late_cancel_hours_before_threshold: clampInt(form.late_cancel_hours_before_threshold, 1, 168, 12),
        late_cancel_hours_after_threshold:  clampInt(form.late_cancel_hours_after_threshold, 1, 168, 8),

        // Hocalara haftalık ders açılışı
        coach_booking_window_enabled: form.coach_booking_window_enabled === true,
        coach_release_day_of_week:    form.coach_release_day_of_week != null ? Number(form.coach_release_day_of_week) : 6,
        coach_release_hour:           clampInt(form.coach_release_hour, 0, 23, 9),
        coach_weekly_window_days:     clampInt(form.coach_weekly_window_days, 1, 60, 7),
      };
      const { error } = await sb.from('club_profiles').update(payload).eq('id', clubId);
      if (error) throw error;

      // Mobil ile aynı: kulüp adı/telefon/şehir profiles tablosuna da yazılır,
      // yoksa iki tablo birbirinden ayrışır. E-posta BİLEREK yazılmaz —
      // auth e-postası değişmez, unique constraint hatası verir.
      const { error: profErr } = await sb.from('profiles').update({
        full_name: form.club_name,
        phone:     form.contact_phone || null,
        city:      form.city || null,
      }).eq('id', clubId);
      if (profErr) console.warn('profiles güncellenemedi:', profErr.message);
      setProfile({ ...profile, ...payload });
      setModal(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    setPwError('');
    if (pwForm.new1 !== pwForm.new2) { setPwError('Yeni şifreler eşleşmiyor.'); return; }
    if ((pwForm.new1 || '').length < 6) { setPwError('Şifre en az 6 karakter olmalı.'); return; }
    setSaving(true);
    try {
      const { error } = await sb.auth.updateUser({ password: pwForm.new1 });
      if (error) throw error;
      setPwOk(true); setPwForm({});
      setTimeout(() => { setPwOk(false); setModal(null); }, 1500);
    } catch (e) { setPwError(e.message); }
    finally { setSaving(false); }
  };

  // Güvenli görüntüleme yardımcıları
  const fmtHours = (h) => {
    if (!h) return '—';
    if (typeof h === 'object') return `${h.open || '?'} – ${h.close || '?'}`;
    return h;
  };

  const displayAmenities = Array.isArray(profile.amenities)
    ? profile.amenities
    : (profile.amenities || '').split(',').map(s => s.trim()).filter(Boolean);

  const AMENITIES_LIST = ['Parking', 'Showers', 'Locker Rooms', 'Pro Shop', 'Cafe', 'Restaurant', 'WiFi', 'Tennis Academy', 'Fitness Center', 'Swimming Pool', 'Yaz Okulu', 'Kış Okulu'];

  const formAmenities = Array.isArray(form.amenities) ? form.amenities : [];
  const toggleAmenity = (a) => {
    const cur = formAmenities.includes(a) ? formAmenities.filter(x => x !== a) : [...formAmenities, a];
    setForm(prev => ({ ...prev, amenities: cur }));
  };

  if (loading) return <Spinner />;

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div>
          <h1>Kulüp Profili</h1>
          <div className="sub">Kulüp bilgilerini yönetin</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost" onClick={() => { setPwForm({}); setPwError(''); setPwOk(false); setModal('password'); }}>
            <span className="material-icons">lock</span> Şifre Değiştir
          </button>
          <button className="btn btn-pri" onClick={openEdit}>
            <span className="material-icons">edit</span> Düzenle
          </button>
        </div>
      </div>

      <div className="row2">
        {/* Sol */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
              {profile.logo_url
                ? <img src={profile.logo_url} alt="logo" style={{ width:64, height:64, borderRadius:32, objectFit:'cover', border:'2px solid var(--brand-navy)', flexShrink:0 }} />
                : <div className="av av-xl av-1">{initials(profile.club_name)}</div>
              }
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <div style={{ fontWeight:800, fontSize:22 }}>{profile.club_name || '—'}</div>
                  <Badge cls={profile.is_visible === false ? 'b-muted' : 'b-success'}>{profile.is_visible === false ? 'Gizli' : 'Görünür'}</Badge>
                </div>
                {profile.city && <div style={{ color:'var(--text-2)', fontSize:14 }}>{profile.city}</div>}
                {profile.description && <p style={{ fontSize:13, color:'var(--text-2)', marginTop:6, maxWidth:400 }}>{profile.description}</p>}
              </div>
            </div>
            <div className="divider" />
            <div style={{ marginTop:12 }}>
              <div className="kv"><span className="k">Adres</span><span className="v">{profile.address || '—'}</span></div>
              <div className="kv"><span className="k">Telefon</span><span className="v">{profile.contact_phone || '—'}</span></div>
              <div className="kv"><span className="k">E-posta</span><span className="v">{profile.contact_email || '—'}</span></div>
              <div className="kv"><span className="k">Web sitesi</span><span className="v">{profile.website || '—'}</span></div>
              {profile.google_maps_link && (
                <div className="kv"><span className="k">Google Maps</span>
                  <a href={profile.google_maps_link} target="_blank" rel="noopener" style={{ color:'var(--brand-navy)', fontWeight:600, fontSize:13 }}>Haritada Gör</a>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>Tesis Bilgileri</div>
            <div className="kv"><span className="k">Kortlar</span><span className="v">{profile.number_of_courts > 0 ? profile.number_of_courts + ' kort' : '—'}</span></div>
            <div className="kv"><span className="k">Açılış Saatleri</span><span className="v">{fmtHours(profile.opening_hours)}</span></div>
            <div className="kv"><span className="k">Işık Saatleri</span><span className="v">{fmtHours(profile.light_hours)}</span></div>
            <div className="kv"><span className="k">Işık Ücreti</span><span className="v">{profile.light_fee > 0 ? fmtMoney(profile.light_fee) + '/saat' : '—'}</span></div>
            {displayAmenities.length > 0 && (
              <div className="kv" style={{ flexWrap:'wrap', gap:6, alignItems:'flex-start' }}>
                <span className="k" style={{ flexShrink:0, paddingTop:2 }}>Olanaklar</span>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {displayAmenities.map(a => <Badge key={a} cls="b-info">{a}</Badge>)}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>Rezervasyon Ayarları</div>
            <div className="kv"><span className="k">Maks. Süre</span><span className="v">{profile.max_reservation_duration || 120} dk</span></div>
            <div className="kv"><span className="k">Önceden Rezervasyon</span><span className="v">{profile.max_advance_booking_days ? profile.max_advance_booking_days + ' gün' : 'Kısıtsız'}</span></div>
            <div className="kv"><span className="k">Rezervasyon Açılışı</span><span className="v">{profile.booking_open_hour ? profile.booking_open_hour + ':00' : 'Kısıtsız'}</span></div>
            {profile.primetime_start && <div className="kv"><span className="k">Primetime</span><span className="v">{profile.primetime_start} – {profile.primetime_end || '?'}</span></div>}
            {profile.non_member_cancellation_limit > 0 && (
              <div className="kv"><span className="k">Üye Olmayan İptal</span><span className="v">Aylık {profile.non_member_cancellation_limit} iptal, {profile.non_member_cancellation_penalty_days || '?'} gün yaptırım</span></div>
            )}
          </div>
        </div>

        {/* Sağ */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card">
            <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>Hesap Bilgileri</div>
            <div className="kv"><span className="k">Kulüp ID</span><span className="v" style={{ fontFamily:'monospace', fontSize:11 }}>{clubId?.slice(0,8)}…</span></div>
          </div>
          <div className="card" style={{ background:'var(--accent-red-bg)', border:'1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'var(--error)', marginBottom:8 }}>Tehlikeli Bölge</div>
            <p style={{ fontSize:13, color:'var(--error)', opacity:0.8, marginBottom:12 }}>Hesabınızı silmek tüm verilerinizi kalıcı olarak kaldırır.</p>
            <button className="btn btn-danger btn-sm"
              onClick={() => { if (confirm('Hesabı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) { alert('Hesap silme işlemi için destek ekibiyle iletişime geçin.'); } }}>
              <span className="material-icons">delete_forever</span> Hesabı Sil
            </button>
          </div>
        </div>
      </div>

      {/* ── Profil Düzenle Modalı ── */}
      {modal === 'edit' && (
        <Modal title="Profili Düzenle" wide onClose={() => setModal(null)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Vazgeç</button>
            <button className="btn btn-pri btn-sm" onClick={saveProfile} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </>
        }>
          <div className="fields" style={{ gap:16 }}>

            {/* Görünürlük */}
            <div style={{ background: form.is_visible !== false ? 'var(--success-soft, #f0fdf4)' : 'var(--accent-red-bg)', borderRadius:10, padding:'12px 14px', border: `1px solid ${form.is_visible !== false ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <Switch on={form.is_visible !== false} onChange={v => setForm({...form, is_visible: v})} label="Kulübü Listelemelerde Göster" />
              <p style={{ fontSize:11, color:'var(--text-2)', margin:'6px 0 0 0' }}>
                {form.is_visible !== false ? 'Kulübünüz "Rezervasyon Bul" gibi ekranlarda görünüyor.' : 'Kulübünüz oyunculara görünmüyor.'}
              </p>
            </div>

            <div style={{ fontWeight:700, fontSize:12, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--border)', paddingBottom:6 }}>Temel Bilgiler</div>
            <Field label="Kulüp Logosu" hint="Oyuncu uygulamasında kulüp kartınızda görünür.">
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {form.logo_url
                  ? <img src={form.logo_url} alt="logo" style={{ width:56, height:56, borderRadius:10, objectFit:'cover', border:'1px solid var(--border)' }} />
                  : <div style={{ width:56, height:56, borderRadius:10, border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--text-2)' }}>Logo</div>}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <input type="file" accept="image/*" disabled={logoBusy}
                    onChange={e => { uploadLogo(e.target.files?.[0]); e.target.value = ''; }} />
                  {logoBusy && <span style={{ fontSize:11, color:'var(--text-2)' }}>Yükleniyor…</span>}
                  {form.logo_url && !logoBusy && (
                    <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start' }}
                      onClick={() => setForm({...form, logo_url: ''})}>Logoyu kaldır</button>
                  )}
                </div>
              </div>
            </Field>
            <Field label="Kulüp Adı">
              <input value={form.club_name || ''} onChange={e => setForm({...form, club_name: e.target.value})} />
            </Field>
            <Field label="Açıklama">
              <textarea rows={2} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} style={{ resize:'vertical' }} />
            </Field>
            <div className="fields-2">
              <Field label="Şehir"><input value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} /></Field>
              <Field label="Telefon"><input value={form.contact_phone || ''} onChange={e => setForm({...form, contact_phone: e.target.value})} /></Field>
            </div>
            <Field label="Adres">
              <input value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
            </Field>
            <div className="fields-2">
              <Field label="E-posta"><input type="email" value={form.contact_email || ''} onChange={e => setForm({...form, contact_email: e.target.value})} /></Field>
              <Field label="Web Sitesi"><input type="url" value={form.website || ''} placeholder="https://…" onChange={e => setForm({...form, website: e.target.value})} /></Field>
            </div>

            <div style={{ fontWeight:700, fontSize:12, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--border)', paddingBottom:6 }}>Konum</div>
            <Field label="Google Maps Linki" hint="Enlem/boylam koordinatları linkten otomatik çıkarılır.">
              <input value={form.google_maps_link || ''} placeholder="https://maps.google.com/…"
                onChange={e => {
                  const val = e.target.value;
                  const c = extractCoords(val);
                  setForm(prev => ({ ...prev, google_maps_link: val, ...(c ? { latitude: c.lat, longitude: c.lng } : {}) }));
                }} />
            </Field>
            <div className="fields-2">
              <Field label="Enlem (Otomatik)"><input value={form.latitude || ''} readOnly style={{ color:'var(--text-2)' }} placeholder="Otomatik çıkarılır" /></Field>
              <Field label="Boylam (Otomatik)"><input value={form.longitude || ''} readOnly style={{ color:'var(--text-2)' }} placeholder="Otomatik çıkarılır" /></Field>
            </div>

            <div style={{ fontWeight:700, fontSize:12, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--border)', paddingBottom:6 }}>Tesis Detayları</div>
            <div className="fields-2">
              <Field label="Kort Sayısı"><input type="number" min={1} value={form.number_of_courts || ''} onChange={e => setForm({...form, number_of_courts: e.target.value})} /></Field>
              <Field label="Işık Ücreti (₺/saat)"><input type="number" min={0} value={form.light_fee || ''} onChange={e => setForm({...form, light_fee: e.target.value})} /></Field>
            </div>
            <div className="fields-2">
              <Field label="Açılış">
                <input type="time" value={form.opening_hours?.open || '09:00'} onChange={e => setForm({...form, opening_hours: {...(form.opening_hours || {}), open: e.target.value}})} />
              </Field>
              <Field label="Kapanış">
                <input type="time" value={form.opening_hours?.close || '22:00'} onChange={e => setForm({...form, opening_hours: {...(form.opening_hours || {}), close: e.target.value}})} />
              </Field>
            </div>
            <div className="fields-2">
              <Field label="Işık Açılış">
                <input type="time" value={form.light_hours?.open || '18:00'} onChange={e => setForm({...form, light_hours: {...(form.light_hours || {}), open: e.target.value}})} />
              </Field>
              <Field label="Işık Kapanış">
                <input type="time" value={form.light_hours?.close || '22:00'} onChange={e => setForm({...form, light_hours: {...(form.light_hours || {}), close: e.target.value}})} />
              </Field>
            </div>

            <div style={{ fontWeight:700, fontSize:12, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--border)', paddingBottom:6 }}>Sistem Ayarları</div>

            <div style={{ background: form.has_membership_system !== false ? '#F0FDF4' : '#FEF2F2', borderRadius:10, padding:'12px 14px', border: `1px solid ${form.has_membership_system !== false ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <Switch on={form.has_membership_system !== false} onChange={v => setForm({...form, has_membership_system: v})} label="Üyelik Sistemi" />
              <p style={{ fontSize:11, color:'var(--text-2)', margin:'6px 0 0 0' }}>
                {form.has_membership_system !== false
                  ? 'Üyeler sekmesi aktif, üyelik paketleri kullanılabilir.'
                  : 'Üyeler sekmesi gizlenir, sistem tamamen müşteriler üzerinden çalışır.'}
              </p>
            </div>

            <div style={{ background: form.has_cafe_system !== false ? '#F0FDF4' : '#FEF2F2', borderRadius:10, padding:'12px 14px', border: `1px solid ${form.has_cafe_system !== false ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <Switch on={form.has_cafe_system !== false} onChange={v => setForm({...form, has_cafe_system: v})} label="Kafe / Market" />
              <p style={{ fontSize:11, color:'var(--text-2)', margin:'6px 0 0 0' }}>
                {form.has_cafe_system !== false
                  ? 'Kafe / Market sekmesi aktif, kafetarya gelir kategorisi görünür.'
                  : 'Kafe / Market sekmesi gizlenir, finans ekranından kafetarya kategorisi kaldırılır.'}
              </p>
            </div>

            <div style={{ background: form.has_employee_system !== false ? '#F0FDF4' : '#FEF2F2', borderRadius:10, padding:'12px 14px', border: `1px solid ${form.has_employee_system !== false ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <Switch on={form.has_employee_system !== false} onChange={v => setForm({...form, has_employee_system: v})} label="Çalışan Sistemi" />
              <p style={{ fontSize:11, color:'var(--text-2)', margin:'6px 0 0 0' }}>
                {form.has_employee_system !== false
                  ? 'Çalışanlar sekmesi aktif.'
                  : 'Çalışanlar sekmesi gizlenir.'}
              </p>
            </div>

            <div style={{ fontWeight:700, fontSize:12, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--border)', paddingBottom:6 }}>Rezervasyon Ayarları</div>

            {/* Rezervasyon Onayı */}
            <div style={{ background: form.requires_booking_approval ? '#FEFCE8' : '#F0FDF4', borderRadius:10, padding:'12px 14px', border: `1px solid ${form.requires_booking_approval ? '#FDE68A' : 'rgba(34,197,94,0.2)'}` }}>
              <Switch on={form.requires_booking_approval === true} onChange={v => setForm({...form, requires_booking_approval: v})} label="Kulüp Onayı Gereksin" />
              <p style={{ fontSize:11, color:'var(--text-2)', margin:'6px 0 0 0' }}>
                {form.requires_booking_approval
                  ? 'Yeni rezervasyonlar siz onaylayana kadar beklemede kalır.'
                  : 'Yeni rezervasyonlar otomatik olarak onaylanır.'}
              </p>
            </div>
            <Field label="Maksimum Rezervasyon Süresi" hint="Bu süreden uzun seçenekler oyunculara gösterilmez.">
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                {[60, 90, 120].map(m => (
                  <div key={m} className={`chip${form.max_reservation_duration == m ? ' active' : ''}`} onClick={() => setForm({...form, max_reservation_duration: m})} style={{ cursor:'pointer' }}>{m} dk</div>
                ))}
              </div>
            </Field>
            <Field label="Kaç Gün Önceden Rezervasyon Alınır?" hint="Boş bırakırsanız kısıtsız olur.">
              <input type="number" min={0} value={form.max_advance_booking_days || ''} placeholder="Kısıtsız (boş bırakın)" onChange={e => setForm({...form, max_advance_booking_days: e.target.value})} />
            </Field>
            <Field label="En İleri Günün Rezervasyonu Ne Zaman Açılır?" hint="Kısıtsız = her zaman açık">
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                {[{ v:0, l:'Kısıtsız' }, { v:8, l:'08:00' }, { v:12, l:'12:00' }, { v:22, l:'22:00' }].map(o => (
                  <div key={o.v} className={`chip${form.booking_open_hour == o.v ? ' active' : ''}`} onClick={() => setForm({...form, booking_open_hour: o.v})} style={{ cursor:'pointer' }}>{o.l}</div>
                ))}
              </div>
            </Field>
            <Field label="İzin Verilen Rezervasyon Süreleri" hint="Oyunculara yalnız seçtikleriniz gösterilir. En az bir süre seçili olmalı.">
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                {[60, 90, 120].map(m => {
                  const list = Array.isArray(form.allowed_reservation_durations) ? form.allowed_reservation_durations : [60, 90, 120];
                  const on = list.includes(m);
                  return (
                    <div key={m} className={`chip${on ? ' active' : ''}`} style={{ cursor:'pointer' }}
                      onClick={() => {
                        const next = on ? list.filter(x => x !== m) : [...list, m].sort((a, b) => a - b);
                        if (next.length === 0) return;   // hepsini kapatmaya izin yok
                        setForm({...form, allowed_reservation_durations: next});
                      }}>{m} dk</div>
                  );
                })}
              </div>
            </Field>

            {/* Haftalık rezervasyon açılışı */}
            <div style={{ background: form.booking_weekly_release ? '#EEF2FF' : 'var(--surface-2, #F8FAFC)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border)' }}>
              <Switch on={form.booking_weekly_release === true} onChange={v => setForm({...form, booking_weekly_release: v})} label="Haftalık Rezervasyon Açılışı" />
              <p style={{ fontSize:11, color:'var(--text-2)', margin:'6px 0 0 0' }}>
                {form.booking_weekly_release
                  ? 'Seçtiğiniz gün ve saatte 1 haftalık pencere blok olarak açılır. Yukarıdaki gün sayısı ve açılış saati kullanılmaz.'
                  : 'Kapalı: pencere her gün bir gün ileri kayar.'}
              </p>
              {form.booking_weekly_release && (
                <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:10 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>Açılış Günü</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'].map((l, i) => (
                        <div key={i} className={`chip${form.booking_release_day_of_week == i ? ' active' : ''}`}
                          style={{ cursor:'pointer' }}
                          onClick={() => setForm({...form, booking_release_day_of_week: i})}>{l}</div>
                      ))}
                    </div>
                  </div>
                  <Field label="Açılış Saati">
                    <input type="number" min={0} max={23} value={form.booking_release_hour ?? 8}
                      onChange={e => setForm({...form, booking_release_hour: e.target.value})} />
                  </Field>
                </div>
              )}
            </div>

            <div className="fields-2">
              <Field label="Primetime Başlangıç"><input type="time" value={form.primetime_start || ''} onChange={e => setForm({...form, primetime_start: e.target.value})} /></Field>
              <Field label="Primetime Bitiş"><input type="time" value={form.primetime_end || ''} onChange={e => setForm({...form, primetime_end: e.target.value})} /></Field>
            </div>
            <div className="fields-2">
              <Field label="Üye Olmayan İptal Limiti" hint="Aylık iptal sayısı">
                <input type="number" min={0} value={form.non_member_cancellation_limit || ''} placeholder="örn. 3" onChange={e => setForm({...form, non_member_cancellation_limit: e.target.value})} />
              </Field>
              <Field label="Yaptırım Süresi (gün)">
                <input type="number" min={0} value={form.non_member_cancellation_penalty_days || ''} placeholder="örn. 7" onChange={e => setForm({...form, non_member_cancellation_penalty_days: e.target.value})} />
              </Field>
            </div>

            <div style={{ fontWeight:700, fontSize:12, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--border)', paddingBottom:6 }}>Hoca İzinleri</div>

            <div style={{ background: form.coaches_can_add_lessons !== false ? '#F0FDF4' : '#FEF2F2', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border)' }}>
              <Switch on={form.coaches_can_add_lessons !== false} onChange={v => setForm({...form, coaches_can_add_lessons: v})} label="Hocalar Ders Ekleyebilir" />
              <p style={{ fontSize:11, color:'var(--text-2)', margin:'6px 0 0 0' }}>
                {form.coaches_can_add_lessons !== false
                  ? 'Hocalar kendi takvimlerinden ders ekleyebilir.'
                  : 'Dersleri yalnız siz ve çalışanlarınız ekleyebilir.'}
              </p>
            </div>

            <div style={{ background:'var(--surface-2, #F8FAFC)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border)', opacity: form.coaches_can_add_lessons === false ? 0.5 : 1 }}>
              <Switch on={form.coaches_require_lesson_package === true} onChange={v => setForm({...form, coaches_require_lesson_package: v})} label="Paketsiz Öğrenciye Ders Yasağı" />
              <p style={{ fontSize:11, color:'var(--text-2)', margin:'6px 0 0 0' }}>
                Hocalar yalnızca kullanılabilir ders paketi olan öğrencilere ders yazabilir. Siz ve çalışanlarınız muafsınız.
              </p>
            </div>

            <div style={{ background:'var(--surface-2, #F8FAFC)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border)', opacity: form.coaches_can_add_lessons === false ? 0.5 : 1 }}>
              <Switch on={form.coaches_must_use_package === true} onChange={v => setForm({...form, coaches_must_use_package: v})} label="Paket Dışı Ders Yasağı" />
              <p style={{ fontSize:11, color:'var(--text-2)', margin:'6px 0 0 0' }}>
                Paketi olan öğrenciye yalnız paketten düşen ders yazılabilir; hoca “Paketten Düş” seçeneğini kapatamaz.
              </p>
            </div>

            <Field label="İptal Sonrası Slot Kilidi (dakika)" hint="Hoca kendi dersini iptal ederse aynı kort ve saate bu süre boyunca yeni ders ekleyemez. Boş = kapalı.">
              <input type="number" min={0} value={form.coach_cancel_slot_lock_minutes || ''} placeholder="Kapalı (boş bırakın)"
                onChange={e => setForm({...form, coach_cancel_slot_lock_minutes: e.target.value})} />
            </Field>

            <div style={{ fontWeight:700, fontSize:12, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--border)', paddingBottom:6 }}>Ders İptal Politikası</div>

            <div style={{ background: form.late_cancel_charge_enabled ? '#FEF2F2' : 'var(--surface-2, #F8FAFC)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border)' }}>
              <Switch on={form.late_cancel_charge_enabled === true} onChange={v => setForm({...form, late_cancel_charge_enabled: v})} label="Geç İptal = Ders Yapıldı Sayılır" />
              <p style={{ fontSize:11, color:'var(--text-2)', margin:'6px 0 0 0' }}>
                {form.late_cancel_charge_enabled
                  ? 'Son iptal saatinden sonra iptal edilen ders yapılmış sayılır; ödemesi tahsilat listenize düşer, paket seansı iade edilmez. Hem hocaları hem oyuncuları kapsar; siz ve çalışanlarınız muafsınız.'
                  : 'Dersler her an bedelsiz iptal edilebilir.'}
              </p>
              {form.late_cancel_charge_enabled && (
                <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:10 }}>
                  <Field label="Öğleden Önce / Sonra Eşiği (saat)" hint="Bu saatten önce başlayan dersler ilk limite, bu saatte/sonra başlayanlar ikinci limite tabidir.">
                    <input type="number" min={0} max={23} value={form.late_cancel_threshold_hour ?? 12}
                      onChange={e => setForm({...form, late_cancel_threshold_hour: e.target.value})} />
                  </Field>
                  <div className="fields-2">
                    <Field label="Eşikten Önce (saat önce)">
                      <input type="number" min={1} max={168} value={form.late_cancel_hours_before_threshold ?? 12}
                        onChange={e => setForm({...form, late_cancel_hours_before_threshold: e.target.value})} />
                    </Field>
                    <Field label="Eşikte / Sonra (saat önce)">
                      <input type="number" min={1} max={168} value={form.late_cancel_hours_after_threshold ?? 8}
                        onChange={e => setForm({...form, late_cancel_hours_after_threshold: e.target.value})} />
                    </Field>
                  </div>
                </div>
              )}
            </div>

            <div style={{ fontWeight:700, fontSize:12, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--border)', paddingBottom:6 }}>Hocalara Haftalık Ders Açılışı</div>

            <div style={{ background: form.coach_booking_window_enabled ? '#EEF2FF' : 'var(--surface-2, #F8FAFC)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border)' }}>
              <Switch on={form.coach_booking_window_enabled === true} onChange={v => setForm({...form, coach_booking_window_enabled: v})} label="Hocalara Haftalık Ders Açılışı" />
              <p style={{ fontSize:11, color:'var(--text-2)', margin:'6px 0 0 0' }}>
                {form.coach_booking_window_enabled
                  ? 'Hocalar yalnız açılan pencere içine ders yazabilir ve tekrarlayan (seri) ders ekleyemez. Siz ve çalışanlarınız etkilenmezsiniz.'
                  : 'Hocalar istedikleri kadar ileriye ders yazabilir ve seri ders ekleyebilir.'}
              </p>
              {form.coach_booking_window_enabled && (
                <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:10 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>Açılış Günü</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'].map((l, i) => (
                        <div key={i} className={`chip${form.coach_release_day_of_week == i ? ' active' : ''}`}
                          style={{ cursor:'pointer' }}
                          onClick={() => setForm({...form, coach_release_day_of_week: i})}>{l}</div>
                      ))}
                    </div>
                  </div>
                  <div className="fields-2">
                    <Field label="Açılış Saati">
                      <input type="number" min={0} max={23} value={form.coach_release_hour ?? 9}
                        onChange={e => setForm({...form, coach_release_hour: e.target.value})} />
                    </Field>
                    <Field label="Açılan Pencere (gün)">
                      <input type="number" min={1} max={60} value={form.coach_weekly_window_days ?? 7}
                        onChange={e => setForm({...form, coach_weekly_window_days: e.target.value})} />
                    </Field>
                  </div>
                  <p style={{ fontSize:11, color:'var(--text-2)', margin:0 }}>
                    {`Örn. ${['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'][form.coach_release_day_of_week ?? 6]} ${form.coach_release_hour ?? 9}:00 + ${form.coach_weekly_window_days ?? 7} gün: hocalar her hafta o gün ve saatte, sonraki ${form.coach_weekly_window_days ?? 7} günün derslerini yazabilir.`}
                  </p>
                </div>
              )}
            </div>

            <div style={{ fontWeight:700, fontSize:12, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--border)', paddingBottom:6 }}>Olanaklar</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {AMENITIES_LIST.map(a => (
                <div key={a} className={`chip${formAmenities.includes(a) ? ' active' : ''}`} onClick={() => toggleAmenity(a)} style={{ cursor:'pointer' }}>{a}</div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Şifre Değiştir Modalı ── */}
      {modal === 'password' && (
        <Modal title="Şifre Değiştir" onClose={() => setModal(null)} footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Vazgeç</button>
            <button className="btn btn-pri btn-sm" onClick={changePassword} disabled={saving}>{saving ? 'Değiştiriliyor…' : 'Şifreyi Değiştir'}</button>
          </>
        }>
          <div className="fields" style={{ gap:14 }}>
            {pwError && <div style={{ background:'var(--accent-red-bg)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#B91C1C' }}>{pwError}</div>}
            {pwOk   && <div style={{ background:'#f0fdf4', border:'1px solid rgba(34,197,94,0.2)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#166534' }}>Şifre başarıyla değiştirildi!</div>}
            <Field label="Yeni Şifre"><input type="password" value={pwForm.new1 || ''} placeholder="••••••••" onChange={e => setPwForm({...pwForm, new1: e.target.value})} /></Field>
            <Field label="Yeni Şifre (Tekrar)"><input type="password" value={pwForm.new2 || ''} placeholder="••••••••" onChange={e => setPwForm({...pwForm, new2: e.target.value})} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

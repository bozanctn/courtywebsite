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
      max_reservation_duration: profile.max_reservation_duration || 120,
      booking_open_hour: profile.booking_open_hour ?? 0,
    });
    setModal('edit');
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        club_name:        form.club_name,
        description:      form.description      || null,
        address:          form.address          || null,
        city:             form.city             || null,
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
        max_reservation_duration:            form.max_reservation_duration ? Number(form.max_reservation_duration) : 120,
        max_advance_booking_days:            form.max_advance_booking_days ? Number(form.max_advance_booking_days) : null,
        booking_open_hour:                   form.booking_open_hour != null ? Number(form.booking_open_hour) : 0,
        primetime_start:                     form.primetime_start || null,
        primetime_end:                       form.primetime_end   || null,
        non_member_cancellation_limit:       form.non_member_cancellation_limit ? Number(form.non_member_cancellation_limit) : null,
        non_member_cancellation_penalty_days: form.non_member_cancellation_penalty_days ? Number(form.non_member_cancellation_penalty_days) : null,
      };
      const { error } = await sb.from('club_profiles').update(payload).eq('id', clubId);
      if (error) throw error;
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

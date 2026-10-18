// ── Supabase istemcisi ──────────────────────────────────────────
const SUPABASE_URL = 'https://xpvmkbntbvckojmzhijt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwdm1rYm50YnZja29qbXpoaWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTExNjEsImV4cCI6MjA2NTY2NzE2MX0.5e0LLsXEmN6Eliq17VPx0ynm1PDn5-O7JpVm0ZZHEl4';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Türkçe duyarlı arama katlaması (fold) ───────────────────────
// .toLowerCase() locale-bağımsızdır ve Türkçe'yi bozar:
//   'İ'.toLowerCase() → 'i' + U+0307 (GÖRÜNMEZ birleşik nokta, 2 karakter!)
//   'I'.toLowerCase() → 'i'          (Türkçe'de 'ı' olmalı)
// Bu yüzden "ismail" yazınca "İSMAİL", "ışıl" yazınca "Işıl" bulunamıyordu.
// Dönüşüm DB'deki public.tr_fold() ve mobildeki src/utils/trSearch.ts ile
// BİREBİR AYNI olmalıdır: İ/I/ı→i, Ş/ş→s, Ğ/ğ→g, Ü/ü→u, Ö/ö→o, Ç/ç→c.
// Sonuç tamamen ASCII olduğu için büyük/küçük harf VE diakritik duyarsızdır.
const TR_FOLD_MAP = {
  'İ': 'i', 'I': 'i', 'ı': 'i',
  'Ş': 's', 'ş': 's',
  'Ğ': 'g', 'ğ': 'g',
  'Ü': 'u', 'ü': 'u',
  'Ö': 'o', 'ö': 'o',
  'Ç': 'c', 'ç': 'c',
};
function trFold(s) {
  return (s == null ? '' : String(s)).replace(/[İIıŞşĞğÜüÖöÇç]/g, ch => TR_FOLD_MAP[ch]).toLowerCase();
}

// ── Auth yardımcıları ───────────────────────────────────────────
async function authSignIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function authSignOut() {
  await sb.auth.signOut();
  window.location.href = 'login.html';
}

async function authGetSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

// ── Kulüp ID çözümleme ─────────────────────────────────────────
// club_profiles.id = auth.users.id (ayrı user_id kolonu yok)
async function getClubProfile(userId) {
  const { data, error } = await sb
    .from('club_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ── Kullanıcı tipi sorgulama ───────────────────────────────────
// profiles.user_type: 'player' | 'coach' | 'club' | 'employee'
async function getUserType(userId) {
  const { data } = await sb
    .from('profiles')
    .select('user_type')
    .eq('id', userId)
    .maybeSingle();
  return data?.user_type ?? null;
}

// ── Durum yardımcıları ─────────────────────────────────────────
function statusLabel(s) {
  const m = {
    confirmed: 'Rezerveli', completed: 'Tamamlandı',
    cancelled: 'İptal', active: 'Aktif', expired: 'Süresi Doldu',
    approved: 'Onaylı', rejected: 'Reddedildi',
  };
  return m[s] || s;
}

function statusClass(s) {
  if (['confirmed','active','approved'].includes(s)) return 'b-info';
  if (['completed'].includes(s)) return 'b-success';
  if (['cancelled','rejected','expired'].includes(s)) return 'b-error';
  return 'b-muted';
}

function paymentLabel(s) {
  return s === 'paid' ? 'Ödendi' : 'Ödenmedi';
}

function paymentClass(s) {
  return s === 'paid' ? 'b-success' : 'b-warning';
}

// ── Tarih / zaman yardımcıları ─────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

function todayISO() {
  // UTC+3 (Türkiye) yerel tarihini döndürür — UTC değil
  const d = new Date();
  d.setUTCHours(d.getUTCHours() + 3);
  return d.toISOString().slice(0, 10);
}

function isoToLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toISOString().slice(0, 16);
}

// ── Avatar baş harfi ───────────────────────────────────────────
function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ── Avatar renk sınıfı ─────────────────────────────────────────
function avColor(str) {
  if (!str) return 'av-1';
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return 'av-' + ((Math.abs(h) % 8) + 1);
}

// ── Para birimi ────────────────────────────────────────────────
function fmtMoney(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('tr-TR', { style:'currency', currency:'TRY', maximumFractionDigits:0 });
}

// ── Kort tipi ─────────────────────────────────────────────────
function courtTypeLabel(t) {
  const m = { clay:'Toprak', hard:'Sert', grass:'Çim', artificial_grass:'Yapay Çim', indoor:'Kapalı' };
  return m[t] || t || '—';
}
function courtTypeClass(t) {
  const m = { clay:'b-orange', hard:'b-info', grass:'b-success', artificial_grass:'b-teal', indoor:'b-purple' };
  return m[t] || 'b-muted';
}

// ── Çalışan verisi ────────────────────────────────────────────
async function getEmployeeData(userId) {
  const { data } = await sb
    .from('club_employees')
    .select('club_id, profiles!club_employees_employee_id_fkey(full_name, email)')
    .eq('employee_id', userId)
    .maybeSingle();
  return data ?? null; // { club_id, profiles: { full_name, email } }
}

// ── Kulüp kortlarını çek (bookings için ara adım) ──────────────
// bookings tablosunda club_id kolonu YOK — courts.club_id üzerinden geçilmeli
async function getClubCourtIds(clubId) {
  const { data } = await sb.from('courts').select('id').eq('club_id', clubId);
  return (data || []).map(c => c.id);
}

// ── Boş veri ───────────────────────────────────────────────────
window._sb = sb; // hata ayıklama için erişilebilir

// ── WhatsApp: hazır mesajla yönlendirme ─────────────────────────
// Mesajı panel GÖNDERMEZ; WhatsApp Web açılır, metin kutuda hazır gelir.
// Arka planda gönderim WhatsApp Business API gerektirir (onaylı şablon,
// aylık ücret, numara doğrulama) — bu akış onu gerektirmeden aynı işi görür.
//
// Kurallar mobildeki src/utils/whatsapp.ts ile BİREBİR AYNI olmalı; ikisi
// ayrışırsa aynı müşteriye iki farklı numara/metin üretilir.

/** Telefonu wa.me biçimine çevirir (ülke kodu + numara). Çözülemezse null. */
function waNormalizePhone(raw) {
  const d = String(raw ?? '').replace(/\D/g, '');
  if (!d) return null;
  if (d.length === 11 && d.startsWith('0')) return '90' + d.slice(1);   // 0532…
  if (d.length === 10 && d.startsWith('5')) return '90' + d;            // 532…
  if (d.length === 12 && d.startsWith('90')) return d;                  // 90532…
  if (d.length === 13 && d.startsWith('0')) return d.slice(1);          // 0090532…
  return d.length >= 10 ? d : null;   // ülke koduyla girilmiş yabancı numara
}

/** 905321234567 → +90 532 *** ** 67 */
function waMaskPhone(p) {
  if (!p || p.length < 6) return p || '';
  return `+${p.slice(0, p.length - 6)} *** ** ${p.slice(-2)}`;
}

/** {anahtar} doldurur; tanınmayan {...} OLDUĞU GİBİ kalır. */
function waFillTemplate(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, (m, k) =>
    (vars[k] === undefined || vars[k] === null) ? m : String(vars[k]));
}

/** Kulübün paket kuralları ayarını GÖNDERİM ANINDA okur. Kapalı/boşsa null. */
async function waGetPackageRules(clubId) {
  if (!clubId) return null;
  try {
    const { data, error } = await sb.from('club_profiles')
      .select('package_rules_whatsapp_enabled, package_rules_message, club_name')
      .eq('id', clubId).maybeSingle();
    if (error) throw error;
    if (!data?.package_rules_whatsapp_enabled) return null;
    const tpl = (data.package_rules_message || '').trim();
    if (!tpl) return null;
    return { template: tpl, clubName: data.club_name || '' };
  } catch (e) {
    console.warn('waGetPackageRules:', e.message);
    return null;   // sessiz geç: paket zaten kaydedildi
  }
}

/**
 * Paket kaydedildikten SONRA çağrılır. Ayar kapalı / şablon boş / telefon yok
 * → sessizce hiçbir şey olmaz. Paket kaydını hiçbir koşulda etkilemez.
 */
async function waOfferPackageRules({ clubId, phone, studentName, packageName,
                                     totalLessons, validityDays, price, coachName }) {
  const cfg = await waGetPackageRules(clubId);
  if (!cfg) return;

  const p = waNormalizePhone(phone);
  if (!p) return;

  const text = waFillTemplate(cfg.template, {
    ogrenci:    studentName || 'Öğrenci',
    paket:      packageName,
    ders:       String(totalLessons),
    gecerlilik: validityDays ? `${validityDays} gün` : 'süresiz',
    ucret:      (price !== null && price !== undefined) ? `${price} TL` : '-',
    hoca:       coachName || '-',
    kulup:      cfg.clubName,
  });

  const ok = confirm(
    `${studentName || 'Müşteri'} · ${waMaskPhone(p)}\n\n` +
    'Paket kurallarını WhatsApp\'tan göndermek ister misiniz?\n' +
    'Mesaj hazır gelecek, yalnız "Gönder"e basmanız yeterli.'
  );
  if (!ok) return;

  window.open(`https://wa.me/${p}?text=${encodeURIComponent(text)}`, '_blank');
}

/** Ayar ekranındaki "Örnek metni doldur" taslağı (mobil ile aynı metin) */
const PACKAGE_RULES_SAMPLE =
  'Merhaba {ogrenci} 👋\n\n' +
  '{kulup} olarak "{paket}" paketiniz tanımlanmıştır.\n\n' +
  '• Ders sayısı: {ders}\n' +
  '• Geçerlilik: {gecerlilik}\n' +
  '• Ücret: {ucret}\n' +
  '• Antrenör: {hoca}\n\n' +
  'Paket kuralları:\n' +
  '1) Dersler paket geçerlilik süresi içinde kullanılmalıdır.\n' +
  '2) İptal için en geç ders saatinden belirtilen süre önce haber verilmelidir; ' +
  'geç iptal edilen dersler yapılmış sayılır.\n' +
  '3) Kullanılmayan dersler süre sonunda iade edilmez.\n\n' +
  'Sorularınız için bize yazabilirsiniz. İyi antrenmanlar! 🎾';

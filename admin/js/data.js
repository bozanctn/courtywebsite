// ── Supabase istemcisi ──────────────────────────────────────────
const SUPABASE_URL = 'https://xpvmkbntbvckojmzhijt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwdm1rYm50YnZja29qbXpoaWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTExNjEsImV4cCI6MjA2NTY2NzE2MX0.5e0LLsXEmN6Eliq17VPx0ynm1PDn5-O7JpVm0ZZHEl4';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

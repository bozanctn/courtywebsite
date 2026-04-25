const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM
const passwordForm   = document.getElementById('new-password-form');
const passwordSuccess = document.getElementById('password-success');
const globalError    = document.getElementById('global-error');
const formSection    = document.getElementById('password-form');

// Supabase v2: hash'teki token'ları otomatik okur ve bu event'i tetikler
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        showForm();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Fallback: eski Supabase format — query string'de token varsa
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));

    const accessToken  = params.get('access_token')  || hashParams.get('access_token');
    const refreshToken = params.get('refresh_token') || hashParams.get('refresh_token');
    const type         = params.get('type')          || hashParams.get('type');

    if (type === 'recovery' && accessToken) {
        supabaseClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || '' })
            .then(({ error }) => {
                if (error) {
                    showGlobalError('Geçersiz veya süresi dolmuş bağlantı. Lütfen uygulamadan yeni bir link isteyin.');
                }
                // onAuthStateChange zaten form'u açacak
            })
            .catch(() => showGlobalError('Oturum kurulurken bir hata oluştu.'));
    }

    setupEventListeners();
});

// Form göster
function showForm() {
    formSection.classList.add('active');
    globalError.classList.remove('show');
}

// Event listeners
function setupEventListeners() {
    passwordForm.addEventListener('submit', handlePasswordSubmit);

    const newPw  = document.getElementById('new-password');
    const confPw = document.getElementById('confirm-password');

    newPw.addEventListener('input', () => { validatePassword(); checkPasswordMatch(); });
    confPw.addEventListener('input', checkPasswordMatch);
}

// Şifre güncelle
async function handlePasswordSubmit(e) {
    e.preventDefault();

    const newPassword  = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const submitBtn    = passwordForm.querySelector('button[type="submit"]');

    if (!isValidPassword(newPassword)) {
        showError('password-error', 'Şifre gereksinimlerini karşılamıyor.');
        return;
    }
    if (newPassword !== confirmPassword) {
        showError('confirm-error', 'Şifreler eşleşmiyor.');
        return;
    }

    setLoadingState(submitBtn, true);
    hideAllErrors();

    try {
        const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
        if (error) throw error;
        showPasswordSuccess();
    } catch (err) {
        console.error('Password update error:', err);
        showGlobalError('Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        setLoadingState(submitBtn, false);
    }
}

// Şifre doğrulama
function isValidPassword(password) {
    return (
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password)
    );
}

function validatePassword() {
    const password = document.getElementById('new-password').value;
    const map = {
        length:    { el: document.getElementById('length-req'),    ok: password.length >= 8 },
        uppercase: { el: document.getElementById('uppercase-req'), ok: /[A-Z]/.test(password) },
        lowercase: { el: document.getElementById('lowercase-req'), ok: /[a-z]/.test(password) },
        number:    { el: document.getElementById('number-req'),    ok: /\d/.test(password) },
    };

    Object.values(map).forEach(({ el, ok }) => {
        el.classList.toggle('met', ok);
        el.querySelector('.requirement-icon').textContent = ok ? '✓' : '✗';
    });
}

function checkPasswordMatch() {
    const pw   = document.getElementById('new-password').value;
    const conf = document.getElementById('confirm-password').value;
    if (conf && pw !== conf) {
        showError('confirm-error', 'Şifreler eşleşmiyor.');
    } else {
        hideError('confirm-error');
    }
}

// Başarı durumu
function showPasswordSuccess() {
    passwordSuccess.style.display = 'block';
    passwordForm.style.display    = 'none';
}

// Loading state
function setLoadingState(button, isLoading) {
    button.querySelector('.btn-text').style.display    = isLoading ? 'none' : 'inline';
    button.querySelector('.btn-loading').style.display = isLoading ? 'flex'  : 'none';
    button.disabled = isLoading;
}

// Hata yönetimi
function showError(id, message) {
    const el = document.getElementById(id);
    if (el) { el.textContent = message; el.classList.add('show'); }
}

function hideError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
}

function hideAllErrors() {
    hideError('password-error');
    hideError('confirm-error');
    globalError.classList.remove('show');
}

function showGlobalError(message) {
    document.getElementById('global-error-text').textContent = message;
    globalError.classList.add('show');
}

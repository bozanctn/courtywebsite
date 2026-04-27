const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM
const loadingSection = document.getElementById('loading-section');
const successSection = document.getElementById('success-section');
const errorSection   = document.getElementById('error-section');

// Supabase v2: fires after exchangeCodeForSession / verifyOtp / setSession succeed
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        showSuccess();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const params     = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));

    const code        = params.get('code')       || hashParams.get('code');
    const tokenHash   = params.get('token_hash') || hashParams.get('token_hash');
    const type        = params.get('type')       || hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    // PKCE flow — "code" param
    if (code) {
        supabaseClient.auth.exchangeCodeForSession(code)
            .then(({ error }) => { if (error) showError(); })
            .catch(() => showError());
        return;
    }

    // OTP flow — "token_hash" param (Supabase email confirmation default)
    if (tokenHash && type) {
        supabaseClient.auth.verifyOtp({ token_hash: tokenHash, type })
            .then(({ error }) => { if (error) showError(); })
            .catch(() => showError());
        return;
    }

    // Implicit flow fallback — hash fragment #access_token=...
    if (accessToken) {
        supabaseClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || '' })
            .then(({ error }) => { if (error) showError(); })
            .catch(() => showError());
        return;
    }

    showError();
});

function showSection(section) {
    [loadingSection, successSection, errorSection].forEach(s => s.classList.remove('active'));
    section.classList.add('active');
}

function showSuccess() { showSection(successSection); }
function showError()   { showSection(errorSection); }

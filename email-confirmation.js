// Supabase Configuration from config.js
const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

// Supabase client initialization
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loadingSection = document.getElementById('loading-section');
const successSection = document.getElementById('success-section');
const errorSection = document.getElementById('error-section');
const resendForm = document.getElementById('resend-form');

// URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
const refreshToken = urlParams.get('refresh_token');
const type = urlParams.get('type');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check if this is an email confirmation callback
    if (type === 'signup' && accessToken) {
        handleEmailConfirmation();
    } else {
        // Show error if accessed directly without proper parameters
        showError();
    }
});

// Handle Email Confirmation
async function handleEmailConfirmation() {
    try {
        // Show loading state
        showLoading();
        
        // Set the session with the tokens from the URL
        const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        });
        
        if (error) {
            console.error('Email confirmation error:', error);
            throw error;
        }
        
        // Check if the user's email is confirmed
        if (data.user && data.user.email_confirmed_at) {
            // Email is already confirmed, show success
            showSuccess();
        } else {
            // Try to confirm the email
            const { error: confirmError } = await supabase.auth.verifyOtp({
                token_hash: accessToken,
                type: 'signup'
            });
            
            if (confirmError) {
                throw confirmError;
            }
            
            // Show success
            showSuccess();
        }
        
    } catch (error) {
        console.error('Email confirmation failed:', error);
        showError();
    }
}

// Show Loading State
function showLoading() {
    hideAllSections();
    loadingSection.classList.add('active');
}

// Show Success State
function showSuccess() {
    hideAllSections();
    successSection.classList.add('active');
    
    // Auto-redirect after 5 seconds
    setTimeout(() => {
        redirectToApp();
    }, 5000);
}

// Show Error State
function showError() {
    hideAllSections();
    errorSection.classList.add('active');
}

// Hide All Sections
function hideAllSections() {
    loadingSection.classList.remove('active');
    successSection.classList.remove('active');
    errorSection.classList.remove('active');
}

// Redirect to App
function redirectToApp() {
    // Try to redirect to the app, if it fails, close the window
    try {
        // You can modify this URL to match your app's deep link or web URL
        window.location.href = `${CONFIG.DEEP_LINK_SCHEME}://${CONFIG.DEEP_LINK_HOST}`;
    } catch (error) {
        // If deep link fails, try to close the window
        window.close();
    }
}

// Request New Confirmation Email
async function requestNewConfirmation() {
    const email = prompt('E-posta adresinizi girin:');
    
    if (!email) {
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Lütfen geçerli bir e-posta adresi girin.');
        return;
    }
    
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email
        });
        
        if (error) {
            throw error;
        }
        
        alert('Yeni doğrulama e-postası gönderildi. E-postanızı kontrol edin.');
        
    } catch (error) {
        console.error('Resend confirmation error:', error);
        alert('E-posta gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
}

// Email Validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle Form Submission for Resend
resendForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('resend-email').value.trim();
    
    if (!isValidEmail(email)) {
        alert('Lütfen geçerli bir e-posta adresi girin.');
        return;
    }
    
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email
        });
        
        if (error) {
            throw error;
        }
        
        alert('Yeni doğrulama e-postası gönderildi. E-postanızı kontrol edin.');
        resendForm.style.display = 'none';
        
    } catch (error) {
        console.error('Resend confirmation error:', error);
        alert('E-posta gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
});

// Handle URL hash changes (for some Supabase flows)
window.addEventListener('hashchange', function() {
    const hash = window.location.hash;
    if (hash.includes('access_token') && hash.includes('type=signup')) {
        // Handle hash-based confirmation
        handleEmailConfirmation();
    }
});

// Check if we have hash-based parameters
if (window.location.hash.includes('access_token')) {
    // Extract parameters from hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashAccessToken = hashParams.get('access_token');
    const hashRefreshToken = hashParams.get('refresh_token');
    const hashType = hashParams.get('type');
    
    if (hashType === 'signup' && hashAccessToken) {
        // Update URL parameters and handle confirmation
        window.history.replaceState({}, document.title, 
            `${window.location.pathname}?access_token=${hashAccessToken}&refresh_token=${hashRefreshToken}&type=${hashType}`);
        
        handleEmailConfirmation();
    }
}

// Export functions for global access
window.redirectToApp = redirectToApp;
window.requestNewConfirmation = requestNewConfirmation;

// Add some debugging information
console.log('Email confirmation page loaded');
console.log('URL parameters:', {
    accessToken: accessToken ? 'Present' : 'Missing',
    refreshToken: refreshToken ? 'Present' : 'Missing',
    type: type || 'Missing'
});

// Handle page visibility change (user might have switched tabs)
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && type === 'signup' && accessToken) {
        // Re-check confirmation status when user returns to the page
        setTimeout(() => {
            handleEmailConfirmation();
        }, 1000);
    }
});

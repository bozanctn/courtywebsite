// Supabase Configuration from config.js
const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

// Supabase client initialization
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const passwordForm = document.getElementById('new-password-form');
const passwordSuccess = document.getElementById('password-success');
const globalError = document.getElementById('global-error');

// URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
const refreshToken = urlParams.get('refresh_token');
const type = urlParams.get('type');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check if this is a password reset callback
    if (type === 'recovery' && accessToken) {
        setupPasswordValidation();
        setupEventListeners();
        handleAuthCallback();
    } else {
        // Show error if accessed directly without proper parameters
        showGlobalError('Bu sayfaya sadece e-postanızdaki şifre sıfırlama bağlantısından erişebilirsiniz.');
    }
});

// Event Listeners
function setupEventListeners() {
    // Password form submission
    passwordForm.addEventListener('submit', handlePasswordSubmit);
    
    // Real-time password validation
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', validatePassword);
        newPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
}

// Hide All Sections
function hideAllSections() {
    passwordSuccess.style.display = 'none';
    globalError.style.display = 'none';
}

// Email validation function removed - not needed anymore

// Handle Password Form Submission
async function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const submitBtn = passwordForm.querySelector('button[type="submit"]');
    
    // Validation
    if (!isValidPassword(newPassword)) {
        showError('password-error', 'Şifre gereksinimlerini karşılamıyor.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError('confirm-error', 'Şifreler eşleşmiyor.');
        return;
    }
    
    // Show loading state
    setLoadingState(submitBtn, true);
    hideAllErrors();
    
    try {
        // If we have access token, update password directly
        if (accessToken) {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            
            if (error) {
                throw error;
            }
            
            // Show success
            showPasswordSuccess();
        } else {
            throw new Error('Geçersiz şifre sıfırlama bağlantısı.');
        }
        
    } catch (error) {
        console.error('Password update error:', error);
        showGlobalError('Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        setLoadingState(submitBtn, false);
    }
}

// Email validation function removed - not needed anymore

// Password Validation
function isValidPassword(password) {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return minLength && hasUppercase && hasLowercase && hasNumber;
}

// Real-time Password Validation
function validatePassword() {
    const password = document.getElementById('new-password').value;
    const requirements = {
        length: document.getElementById('length-req'),
        uppercase: document.getElementById('uppercase-req'),
        lowercase: document.getElementById('lowercase-req'),
        number: document.getElementById('number-req')
    };
    
    // Check each requirement
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password)
    };
    
    // Update UI
    Object.keys(checks).forEach(key => {
        const requirement = requirements[key];
        const met = checks[key];
        
        if (met) {
            requirement.classList.add('met');
            requirement.querySelector('.requirement-icon').textContent = '✓';
        } else {
            requirement.classList.remove('met');
            requirement.querySelector('.requirement-icon').textContent = '✗';
        }
    });
    
    // Update password strength indicator
    updatePasswordStrength(password);
}

// Check Password Match
function checkPasswordMatch() {
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (confirmPassword && password !== confirmPassword) {
        showError('confirm-error', 'Şifreler eşleşmiyor.');
    } else {
        hideError('confirm-error');
    }
}

// Update Password Strength
function updatePasswordStrength(password) {
    let strength = 0;
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /\d/.test(password),
        /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ];
    
    strength = checks.filter(Boolean).length;
    
    // You can add a password strength indicator here if needed
}

// Setup Password Validation
function setupPasswordValidation() {
    const newPasswordInput = document.getElementById('new-password');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', validatePassword);
    }
}

// Show Password Success
function showPasswordSuccess() {
    passwordSuccess.style.display = 'block';
    passwordForm.style.display = 'none';
}

// Loading State Management
function setLoadingState(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        button.disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        button.disabled = false;
    }
}

// Error Management
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

function hideAllErrors() {
    hideError('password-error');
    hideError('confirm-error');
    hideError('global-error');
}

function showGlobalError(message) {
    document.getElementById('global-error-text').textContent = message;
    globalError.style.display = 'flex';
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle URL parameters and session
async function handleAuthCallback() {
    if (type === 'recovery' && accessToken) {
        try {
            const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });
            
            if (error) {
                console.error('Auth callback error:', error);
                showGlobalError('Geçersiz şifre sıfırlama bağlantısı. Lütfen yeni bir bağlantı isteyin.');
                return;
            }
            
            // Session is set, user can now reset password
            console.log('Auth session established');
            
        } catch (error) {
            console.error('Session error:', error);
            showGlobalError('Oturum kurulurken bir hata oluştu.');
        }
    }
}

// Initialize auth callback handling - already handled in main DOMContentLoaded

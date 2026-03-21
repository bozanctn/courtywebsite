// Configuration file for Courty website
// This file contains environment variables and configuration settings

const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://xpvmkbntbvckojmzhijt.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwdm1rYm50YnZja29qbXpoaWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTExNjEsImV4cCI6MjA2NTY2NzE2MX0.5e0LLsXEmN6Eliq17VPx0ynm1PDn5-O7JpVm0ZZHEl4',
    
    // Application URLs
    PASSWORD_RESET_URL: 'https://bozanctn.github.io/courtywebsite/password-reset.html',
    EMAIL_CONFIRMATION_URL: 'https://bozanctn.github.io/courtywebsite/email-confirmation.html',
    
    // Contact Information
    CONTACT_EMAIL: 'info.courty@gmail.com',
    
    // App Configuration
    APP_NAME: 'Courty',
    APP_DESCRIPTION: 'Tenis kortu rezervasyonu ve antrenör bulma platformu',
    
    // Security Settings
    PASSWORD_MIN_LENGTH: 8,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    
    // Feature Flags
    ENABLE_ANALYTICS: false,
    ENABLE_ERROR_REPORTING: true,
    
    // API Endpoints
    API_BASE_URL: 'https://xpvmkbntbvckojmzhijt.supabase.co/rest/v1',
    
    // Deep Link Configuration
    DEEP_LINK_SCHEME: 'courty',
    DEEP_LINK_HOST: 'email-confirmed'
};

// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}

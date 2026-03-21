// Configuration example file for Courty website
// Copy this file to config.js and update with your actual values

const CONFIG = {
    // Supabase Configuration
    // Get these values from your Supabase project settings
    SUPABASE_URL: 'https://your-project-id.supabase.co',
    SUPABASE_ANON_KEY: 'your-supabase-anon-key-here',
    
    // Application URLs
    // Update these with your actual domain
    PASSWORD_RESET_URL: 'https://yourdomain.com/password-reset.html',
    EMAIL_CONFIRMATION_URL: 'https://yourdomain.com/email-confirmation.html',
    
    // Contact Information
    CONTACT_EMAIL: 'your-email@domain.com',
    
    // App Configuration
    APP_NAME: 'Your App Name',
    APP_DESCRIPTION: 'Your app description',
    
    // Security Settings
    PASSWORD_MIN_LENGTH: 8,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    
    // Feature Flags
    ENABLE_ANALYTICS: false,
    ENABLE_ERROR_REPORTING: true,
    
    // API Endpoints
    API_BASE_URL: 'https://your-project-id.supabase.co/rest/v1',
    
    // Deep Link Configuration
    DEEP_LINK_SCHEME: 'yourapp',
    DEEP_LINK_HOST: 'email-confirmed'
};

// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}

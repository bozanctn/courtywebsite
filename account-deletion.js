// Simple account deletion page - only instructions, no actual deletion
document.addEventListener('DOMContentLoaded', function() {
    console.log('Account deletion instructions page loaded');
});

// Cancel deletion
function cancelDeletion() {
    window.location.href = 'index.html';
}

// Export functions for global access
window.cancelDeletion = cancelDeletion;

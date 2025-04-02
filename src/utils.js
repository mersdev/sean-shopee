// Utility functions module

// Format Excel date for display
export function formatExcelDate(excelDate) {
    if (!excelDate) return '-';
    const date = new Date(excelDate);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show loading indicator
export function showLoading() {
    const loadingIndicator = document.getElementById('loading');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
}

// Hide loading indicator
export function hideLoading() {
    const loadingIndicator = document.getElementById('loading');
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
}
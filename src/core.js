// Core module for initialization and state management

// Global state
let activeFeeTab = 'shipping';
let currentPage = 1;
let filteredData = [];
let currentFilter = 'all';

// DOM Elements
const elements = {
    feeTabContent: document.getElementById('feeTabContent'),
    fileUpload: document.getElementById('fileUpload'),
    dataTable: document.getElementById('dataTable'),
    tableBody: document.getElementById('tableBody'),
    loadingIndicator: document.getElementById('loading'),
    filterButton: document.getElementById('filterButton'),
    filterDropdown: document.getElementById('filterDropdown'),
    currentFilterText: document.getElementById('currentFilter'),
    searchInput: document.getElementById('searchInput'),
    entriesPerPage: document.getElementById('entriesPerPage'),
    prevPageBtn: document.getElementById('prevPage'),
    nextPageBtn: document.getElementById('nextPage'),
    currentPageSpan: document.getElementById('currentPage'),
    totalPagesSpan: document.getElementById('totalPages')
};

// Initialize core functionality
function initializeCore() {
    // Initialize shipping tab as active
    const shippingTab = document.querySelector('.fee-tab[data-tab="shipping"]');
    if (shippingTab) {
        shippingTab.classList.remove('border-transparent', 'text-gray-500');
        shippingTab.classList.add('border-blue-500', 'text-blue-600');
    }
}

// Export state and elements for use in other modules
export {
    activeFeeTab,
    currentPage,
    filteredData,
    currentFilter,
    elements,
    initializeCore
};
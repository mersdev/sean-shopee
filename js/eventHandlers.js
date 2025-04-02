// Event handlers and UI interactions

import { processExcelFile, filterData } from './dataProcessor.js';
import { displayData } from './tableRenderer.js';

export function initializeEventHandlers() {
    const fileUpload = document.getElementById('fileUpload');
    const filterButton = document.getElementById('filterButton');
    const filterDropdown = document.getElementById('filterDropdown');
    const searchInput = document.getElementById('searchInput');
    const entriesPerPage = document.getElementById('entriesPerPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    let currentPage = 1;
    let currentFilter = 'all';
    window.jsonData = null;

    // File upload handler
    fileUpload.addEventListener('change', handleFileUpload);

    // Filter dropdown handlers
    filterButton.addEventListener('click', () => {
        filterDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (event) => {
        if (!filterButton.contains(event.target)) {
            filterDropdown.classList.add('hidden');
        }
    });

    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', () => handleFilterSelection(option));
    });

    // Search and pagination handlers
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        displayData(window.jsonData, currentFilter, searchInput, currentPage, entriesPerPage);
    });

    entriesPerPage.addEventListener('change', () => {
        currentPage = 1;
        displayData(window.jsonData, currentFilter, searchInput, currentPage, entriesPerPage);
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayData(window.jsonData, currentFilter, searchInput, currentPage, entriesPerPage);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const filteredData = filterData(window.jsonData, currentFilter, searchInput.value);
        const totalPages = entriesPerPage.value === 'all' ? 1 : Math.ceil(filteredData.length / parseInt(entriesPerPage.value));
        if (currentPage < totalPages) {
            currentPage++;
            displayData(window.jsonData, currentFilter, searchInput, currentPage, entriesPerPage);
        }
    });

    // Check for existing data.xlsx
    checkExistingData();
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    showLoading();
    const reader = new FileReader();

    reader.onload = function(e) {
        window.jsonData = processExcelFile(e.target.result);
        displayData(window.jsonData, 'all', document.getElementById('searchInput'), 1, document.getElementById('entriesPerPage'));
        hideLoading();
    };

    reader.readAsArrayBuffer(file);
}

function handleFilterSelection(option) {
    const filterType = option.getAttribute('data-filter');
    const currentFilterText = document.getElementById('currentFilter');
    window.currentFilter = filterType;
    currentFilterText.textContent = option.textContent;
    document.getElementById('filterDropdown').classList.add('hidden');
    
    if (window.jsonData) {
        displayData(window.jsonData, filterType, document.getElementById('searchInput'), 1, document.getElementById('entriesPerPage'));
    }
}

function checkExistingData() {
    fetch('data.xlsx')
        .then(response => {
            if (!response.ok) {
                throw new Error('Data file not found');
            }
            return response.blob();
        })
        .then(blob => {
            const reader = new FileReader();
            reader.onload = function(e) {
                window.jsonData = processExcelFile(e.target.result);
                displayData(window.jsonData, 'all', document.getElementById('searchInput'), 1, document.getElementById('entriesPerPage'));
            };
            reader.readAsArrayBuffer(blob);
        })
        .catch(error => {
            document.getElementById('dataTable').style.display = 'none';
            showToast('Please upload the data.xlsx file to proceed', 'error');
        });
}

function showLoading() {
    const loadingIndicator = document.getElementById('loading');
    if (loadingIndicator) loadingIndicator.style.display = 'block';
}

function hideLoading() {
    const loadingIndicator = document.getElementById('loading');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md shadow-lg ${type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}
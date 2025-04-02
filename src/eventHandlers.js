// Event handlers module
import { elements, activeFeeTab, currentPage, currentFilter, filteredData } from './core.js';
import { displayData } from './dataDisplay.js';
import { updateFeeTable } from './feeTable.js';
import { processExcelFile } from './dataProcessor.js';
import { showLoading } from './utils.js';

// Fee tab click handler
export function initializeFeeTabHandlers() {
    document.querySelectorAll('.fee-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab styling
            document.querySelectorAll('.fee-tab').forEach(t => {
                t.classList.remove('border-blue-500', 'text-blue-600');
                t.classList.add('border-transparent', 'text-gray-500');
            });
            tab.classList.remove('border-transparent', 'text-gray-500');
            tab.classList.add('border-blue-500', 'text-blue-600');

            // Update content
            activeFeeTab = tab.getAttribute('data-tab');
            updateFeeTable(window.jsonData || []);
        });
    });
}

// Filter dropdown handlers
export function initializeFilterHandlers() {
    elements.filterButton.addEventListener('click', () => {
        elements.filterDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (event) => {
        if (!elements.filterButton.contains(event.target)) {
            elements.filterDropdown.classList.add('hidden');
        }
    });

    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', () => {
            const filterType = option.getAttribute('data-filter');
            currentFilter = filterType;
            elements.currentFilterText.textContent = option.textContent;
            elements.filterDropdown.classList.add('hidden');
            
            if (window.jsonData) {
                displayData(window.jsonData);
            }
        });
    });
}

// File upload handlers
export function initializeFileHandlers() {
    elements.fileUpload.addEventListener('change', handleFileUpload);

    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        showLoading();
        const reader = new FileReader();

        reader.onload = function(e) {
            processExcelFile(e.target.result);
        };

        reader.readAsArrayBuffer(file);
    }
}

// Pagination handlers
export function initializePaginationHandlers() {
    elements.searchInput.addEventListener('input', () => {
        currentPage = 1;
        displayData(window.jsonData);
    });

    elements.entriesPerPage.addEventListener('change', () => {
        currentPage = 1;
        displayData(window.jsonData);
    });

    elements.prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayData(window.jsonData);
        }
    });

    elements.nextPageBtn.addEventListener('click', () => {
        const totalPages = elements.entriesPerPage.value === 'all' ? 1 : Math.ceil(filteredData.length / parseInt(elements.entriesPerPage.value));
        if (currentPage < totalPages) {
            currentPage++;
            displayData(window.jsonData);
        }
    });
}

// Initialize all handlers
export function initializeAllHandlers() {
    initializeFeeTabHandlers();
    initializeFilterHandlers();
    initializeFileHandlers();
    initializePaginationHandlers();
}
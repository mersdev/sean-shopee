// Event handlers and UI interactions

import { processOrderFile, processIncomeFile, processWalletFile, filterData, processRawData } from './dataProcessor.js';
import { displayData } from './tableRenderer.js';

export function initializeEventHandlers() {
    const orderFileUpload = document.getElementById('orderFileUpload');
    const incomeFileUpload = document.getElementById('incomeFileUpload');
    const walletFileUpload = document.getElementById('walletFileUpload');
    const filterButton = document.getElementById('filterButton');
    const filterDropdown = document.getElementById('filterDropdown');
    const searchInput = document.getElementById('searchInput');
    const entriesPerPage = document.getElementById('entriesPerPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    let currentPage = 1;
    let currentFilter = 'all';
    window.jsonData = null;
    window.uploadStatus = {
        order: false,
        income: false,
        wallet: false
    };
    window.fileData = {
        order: null,
        income: null,
        wallet: null
    };

    // Check for existing data.xlsx
    checkExistingData();
    // File upload handlers
    orderFileUpload.addEventListener('change', handleOrderFileUpload);
    incomeFileUpload.addEventListener('change', handleIncomeFileUpload);
    walletFileUpload.addEventListener('change', handleWalletFileUpload);

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
        option.addEventListener('click', () => {
            currentPage = 1;
            handleFilterSelection(option);
        });
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
            displayData(window.jsonData, window.currentFilter || 'all', searchInput, currentPage, entriesPerPage);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const filteredData = filterData(window.jsonData, window.currentFilter || 'all', searchInput.value);
        const totalPages = entriesPerPage.value === 'all' ? 1 : Math.ceil(filteredData.length / parseInt(entriesPerPage.value));
        if (currentPage < totalPages) {
            currentPage++;
            displayData(window.jsonData, window.currentFilter || 'all', searchInput, currentPage, entriesPerPage);
        }
    });

}

function handleOrderFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const dropZone = document.getElementById('orderDropZone');
    const progressBar = document.getElementById('orderProgress');
    const progressFill = progressBar.querySelector('div');
    const dropContent = document.getElementById('orderDropContent');
    
    dropZone.classList.add('border-green-500', 'bg-green-50');
    dropContent.classList.add('opacity-50');
    progressBar.classList.remove('hidden');
    progressFill.style.width = '0%';
    
    showLoading();
    const reader = new FileReader();

    reader.onprogress = (e) => {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            progressFill.style.width = `${percent}%`;
        }
    };

    reader.onload = function(e) {
        window.fileData.order = processOrderFile(e.target.result);
        window.uploadStatus.order = true;
        progressFill.style.width = '100%';
        dropZone.classList.remove('border-green-500', 'bg-green-50');
        dropZone.classList.add('border-green-300', 'bg-green-100');
        dropContent.classList.remove('opacity-50');
        setTimeout(() => progressBar.classList.add('hidden'), 1000);
        checkAllFilesUploaded();
    };

    reader.onerror = () => {
        dropZone.classList.remove('border-green-500', 'bg-green-50');
        dropZone.classList.add('border-red-500', 'bg-red-100');
        dropContent.classList.remove('opacity-50');
        progressBar.classList.add('hidden');
        showToast('Error processing order file', 'error');
    };

    reader.readAsArrayBuffer(file);
}

function handleIncomeFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const dropZone = document.getElementById('incomeDropZone');
    const progressBar = document.getElementById('incomeProgress');
    const progressFill = progressBar.querySelector('div');
    const dropContent = document.getElementById('incomeDropContent');
    
    dropZone.classList.add('border-green-500', 'bg-green-50');
    dropContent.classList.add('opacity-50');
    progressBar.classList.remove('hidden');
    progressFill.style.width = '0%';
    
    showLoading();
    const reader = new FileReader();

    reader.onprogress = (e) => {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            progressFill.style.width = `${percent}%`;
        }
    };

    reader.onload = function(e) {
        window.fileData.income = processIncomeFile(e.target.result);
        window.uploadStatus.income = true;
        progressFill.style.width = '100%';
        dropZone.classList.remove('border-green-500', 'bg-green-50');
        dropZone.classList.add('border-green-300', 'bg-green-100');
        dropContent.classList.remove('opacity-50');
        setTimeout(() => progressBar.classList.add('hidden'), 1000);
        checkAllFilesUploaded();
    };

    reader.onerror = () => {
        dropZone.classList.remove('border-green-500', 'bg-green-50');
        dropZone.classList.add('border-red-500', 'bg-red-100');
        dropContent.classList.remove('opacity-50');
        progressBar.classList.add('hidden');
        showToast('Error processing income file', 'error');
    };

    reader.readAsArrayBuffer(file);
}

function handleWalletFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const dropZone = document.getElementById('walletDropZone');
    const progressBar = document.getElementById('walletProgress');
    const progressFill = progressBar.querySelector('div');
    const dropContent = document.getElementById('walletDropContent');
    
    dropZone.classList.add('border-green-500', 'bg-green-50');
    dropContent.classList.add('opacity-50');
    progressBar.classList.remove('hidden');
    progressFill.style.width = '0%';
    
    showLoading();
    const reader = new FileReader();

    reader.onprogress = (e) => {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            progressFill.style.width = `${percent}%`;
        }
    };

    reader.onload = function(e) {
        window.fileData.wallet = processWalletFile(e.target.result);
        window.uploadStatus.wallet = true;
        progressFill.style.width = '100%';
        dropZone.classList.remove('border-green-500', 'bg-green-50');
        dropZone.classList.add('border-green-300', 'bg-green-100');
        dropContent.classList.remove('opacity-50');
        setTimeout(() => progressBar.classList.add('hidden'), 1000);
        checkAllFilesUploaded();
    };

    reader.onerror = () => {
        dropZone.classList.remove('border-green-500', 'bg-green-50');
        dropZone.classList.add('border-red-500', 'bg-red-100');
        dropContent.classList.remove('opacity-50');
        progressBar.classList.add('hidden');
        showToast('Error processing wallet file', 'error');
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
    const files = ['income2.xlsx', 'order.xlsx', 'wallet.xlsx'];
    const promises = files.map(file => 
        fetch(`data/${file}`)
            .then(response => {
                if (!response.ok) throw new Error(`${file} not found`);
                return response.blob();
            })
            .then(blob => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = e => resolve({file, data: e.target.result});
                reader.readAsArrayBuffer(blob);
            }))
    );

    Promise.all(promises)
        .then(results => {
            const processedData = results.reduce((acc, {file, data}) => {
                if (file === 'order.xlsx') {
                    acc.order = processOrderFile(data);
                    window.uploadStatus.order = true;
                }
                if (file === 'income.xlsx' || file === 'income2.xlsx') {
                    acc.income = processIncomeFile(data);
                    window.uploadStatus.income = true;
                }
                if (file === 'wallet.xlsx') {
                    acc.wallet = processWalletFile(data);
                    window.uploadStatus.wallet = true;
                }
                return acc;
            }, {});
            window.fileData.order = processedData.order;
            window.fileData.income = processedData.income;
            window.fileData.wallet = processedData.wallet;
            checkAllFilesUploaded();
        })
        .catch(error => {
            document.getElementById('dataTable').style.display = 'none';
            showToast(`Error loading data files: ${error.message}`, 'error');
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

function checkAllFilesUploaded() {
    // Fee calculation utilities
    const FEE_RATES = {
        COMMISSION: 0.0756,
        SERVICE: 0.0378,
        TRANSACTION: 0.0378
    };
    document.querySelector('.commission-text').textContent = (FEE_RATES.COMMISSION * 100).toFixed(2) + '%';
    document.querySelector('.service-fee').textContent = (FEE_RATES.SERVICE * 100).toFixed(2) + '%';
    document.querySelector('.transactions-fee').textContent = (FEE_RATES.TRANSACTION * 100).toFixed(2) + '%';

    if (window.uploadStatus.order && window.uploadStatus.income && window.uploadStatus.wallet) {
        window.jsonData = processRawData(FEE_RATES);
        displayData(window.jsonData, 'all', document.getElementById('searchInput'), 1, document.getElementById('entriesPerPage'));
        hideLoading();
        showToast('All files processed successfully!', 'success');
        
        // Hide upload sections and show toggle button
        document.querySelectorAll('[id$="DropZone"]').forEach(el => el.classList.add('hidden'));
        document.getElementById('uploadToggle').classList.remove('hidden');
    }
}
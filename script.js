document.addEventListener('DOMContentLoaded', () => {
    const fileUpload = document.getElementById('fileUpload');
    const dataTable = document.getElementById('dataTable');
    const tableBody = document.getElementById('tableBody');
    const loadingIndicator = document.getElementById('loading');
    const filterButton = document.getElementById('filterButton');
    const filterDropdown = document.getElementById('filterDropdown');
    const currentFilterText = document.getElementById('currentFilter');
    const searchInput = document.getElementById('searchInput');
    const entriesPerPage = document.getElementById('entriesPerPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');

    let currentPage = 1;
    let filteredData = [];

    // Toggle dropdown
    filterButton.addEventListener('click', () => {
        filterDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!filterButton.contains(event.target)) {
            filterDropdown.classList.add('hidden');
        }
    });

    // Handle filter selection
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', () => {
            const filterType = option.getAttribute('data-filter');
            currentFilter = filterType;
            currentFilterText.textContent = option.textContent;
            filterDropdown.classList.add('hidden');
            
            // If data is already loaded, update the display
            const existingData = document.querySelector('#dataTable').style.display !== 'none';
            if (existingData) {
                fetch('data.xlsx')
                    .then(response => response.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const data = new Uint8Array(e.target.result);
                            const workbook = XLSX.read(data, { type: 'array' });
                            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                            displayData(jsonData);
                        };
                        reader.readAsArrayBuffer(blob);
                    });
            }
        });
    });

    // Check if data.xlsx exists
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
                processExcelFile(e.target.result);
            };
            reader.readAsArrayBuffer(blob);
        })
        .catch(error => {
            dataTable.style.display = 'none';
            const uploadMessage = document.createElement('div');
            uploadMessage.className = 'upload-message';
            uploadMessage.innerHTML = 'Please upload the data.xlsx file to proceed';
            document.querySelector('#result').prepend(uploadMessage);
        });

    fileUpload.addEventListener('change', handleFileUpload);

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

    function processExcelFile(arrayBuffer) {
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet (ORDER)
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        displayData(jsonData);
        hideLoading();
    }

    let currentFilter = 'all';

    function filterData(data, filterType, searchQuery = '') {
        let filteredResults = data.filter(row => row['Order Status'] === 'Completed');
        
        // Apply filter type
        switch(filterType) {
            case 'no-refund':
                filteredResults = filteredResults.filter(row => !row['Return / Refund Status']);
                break;
            case 'refund':
                filteredResults = filteredResults.filter(row => row['Return / Refund Status'] === 'Request Approved');
                break;
        }

        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredResults = filteredResults.filter(row => {
                return row['Order ID']?.toString().toLowerCase().includes(query) ||
                       row['Return / Refund Status']?.toString().toLowerCase().includes(query) ||
                       row['Deal Price']?.toString().toLowerCase().includes(query);
            });
        }

        return filteredResults;
    }

    // Add search input handler
    searchInput.addEventListener('input', (e) => {
        currentPage = 1;
        displayData(window.jsonData);
    });

    // Add entries per page handler
    entriesPerPage.addEventListener('change', () => {
        currentPage = 1;
        displayData(window.jsonData);
    });

    // Add pagination handlers
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayData(window.jsonData);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / parseInt(entriesPerPage.value));
        if (currentPage < totalPages) {
            currentPage++;
            displayData(window.jsonData);
        }
    });

    function displayData(jsonData) {
        if (!jsonData) return;
        window.jsonData = jsonData;
        
        tableBody.innerHTML = '';
        filteredData = filterData(jsonData, currentFilter, searchInput.value);

        const pageSize = parseInt(entriesPerPage.value);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        // Update pagination UI
        const totalPages = Math.ceil(filteredData.length / pageSize);
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = totalPages;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;

        // Update data summary information
        const startEntry = startIndex + 1;
        const endEntry = Math.min(startIndex + pageSize, filteredData.length);
        const totalEntries = filteredData.length;
        const dataSummary = document.getElementById('dataSummary');
        dataSummary.textContent = `Showing ${startEntry} to ${endEntry} of ${totalEntries} entries`;

        paginatedData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row['Order ID'] || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatExcelDate(row['Order Complete Time']) || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row['Transaction Fee'] || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row['Commission Fee'] || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row['Service Fee'] || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row['Deal Price'] || ''}</td>
            `;
            tableBody.appendChild(tr);
        });

        dataTable.style.display = 'table';
    }

    function formatExcelDate(serialDate) {
        if (!serialDate) return '';
        
        // Excel's date system starts from December 30, 1899
        const date = new Date((serialDate - 25569) * 86400 * 1000);
        
        // Format to DD/MM/YYYY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }

    function showLoading() {
        if (loadingIndicator) loadingIndicator.style.display = 'block';
    }

    function hideLoading() {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
});
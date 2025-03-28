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
        
        // Get both sheets (ORDER and TRANSACTION)
        const orderSheet = workbook.Sheets[workbook.SheetNames[0]];
        const transactionSheet = workbook.Sheets[workbook.SheetNames[1]];
        const transactionSheet1 = workbook.Sheets[workbook.SheetNames[2]];
        const walletSheet = workbook.Sheets[workbook.SheetNames[3]]; // Assuming the wallet sheet is at index 3
        
        // Convert sheets to JSON
        const orderData = XLSX.utils.sheet_to_json(orderSheet);
        const transactionData = [...XLSX.utils.sheet_to_json(transactionSheet), ...XLSX.utils.sheet_to_json(transactionSheet1)];
        const walletData = XLSX.utils.sheet_to_json(walletSheet); // Assuming the wallet sheet is at index 3

        let filteredResults = orderData.filter(row => row['Order Status'] === 'Completed');

        // Merge data from both sheets with proper null checks
        const jsonData = filteredResults.map(order => {
            const transaction = transactionData.find(t => t['Order ID'] === order['Order ID']) || {};
            const amount = walletData.find(w => w['Order ID'] === order['Order ID']) || {};
            return {
                ...order,
                'Received Shipping Fee': transaction?.['Shipping Fee Paid by Buyer'] || transaction?.['Shipping Fee Paid by Buyer (excl. SST)'] || '',
                'Received Commission Fee': transaction?.['Commission Fee (incl. SST)'] || transaction?.['Commision Fee (Incl. SST)'] || '',
                'Received Service Fee': transaction?.['Service Fee'] || transaction?.['Service Fee (Incl. SST)']   || '',
                'Received Transaction Fee': transaction?.['Transaction Fee'] || transaction?.['Transaction Fee (Incl. SST)'] || '',
                'Received Seller Voucher': transaction?.['Voucher'] || transaction?.['Voucher Sponsored by Seller'] || '',
                'AMS Commission Fee': transaction?.['AMS Commission Fee'] || '',
                'Free Return Fee': transaction?.['Saver Programme Fee (Incl. SST)'] || transaction?.['Free Returns Fee'] || '',
                'Total Released Amount (RM)': transaction?.['Total Released Amount (RM)'] || '',
                'Amount Received': amount?.['Payment'] || 0,
            };
        });

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
        const totalPages = entriesPerPage.value === 'all' ? 1 : Math.ceil(filteredData.length / parseInt(entriesPerPage.value));
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

        const pageSize = entriesPerPage.value === 'all' ? filteredData.length : parseInt(entriesPerPage.value);
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
            const finalPrice = Math.abs(parseFloat(row['Deal Price'])) + Math.abs(parseFloat(row['Estimated Shipping Fee'] || 0)) - Math.abs(parseFloat(row['Transaction Fee'] || 0)) - Math.abs(parseFloat(row['Commission Fee'] || 0)) - Math.abs(parseFloat(row['Service Fee'] || 0)) - Math.abs(parseFloat(row['Seller Voucher'] || 0)) - Math.abs(parseFloat(row['Free Return Fee'] || 0)) - Math.abs(parseFloat(row['AMS Commission Fee'] || 0));

            // Calculate differences
            const shippingDiff = Math.abs(parseFloat(row['Estimated Shipping Fee'] || 0)) - Math.abs(parseFloat(row['Received Shipping Fee'] || 0));
            const transactionDiff = Math.abs(parseFloat(row['Transaction Fee'] || 0)) - Math.abs(parseFloat(row['Received Transaction Fee'] || 0));
            const commissionDiff = Math.abs(parseFloat(row['Commission Fee'] || 0)) - Math.abs(parseFloat(row['Received Commission Fee'] || 0));
            const serviceDiff = Math.abs(parseFloat(row['Service Fee'] || 0)) - Math.abs(parseFloat(row['Received Service Fee'] || 0));
            const voucherDiff = Math.abs(parseFloat(row['Seller Voucher'] || 0)) - Math.abs(parseFloat(row['Received Seller Voucher'] || 0));
            const EPSILON = 0.01; // Threshold for floating point comparison
            const finalDiff = Math.abs(finalPrice) - Math.abs(parseFloat(row['Amount Received'] || 0));

            const remarks = []; // Array to store remarks for each erro

            const differences = [
                { value: shippingDiff, remark: 'Shipping fee difference' },
                { value: transactionDiff, remark: 'Transaction fee difference' },
                { value: commissionDiff, remark: 'Commission fee difference' },
                { value: serviceDiff, remark: 'Service fee difference' },
                { value: voucherDiff, remark: 'Voucher amount difference' },
                { value: finalDiff, remark: 'Final amount difference' }
            ];
            
            // Add background color if any difference is found
            let hasError = false;
            differences.forEach(diff => {
                if (Math.abs(diff.value) > EPSILON) {
                    hasError = true;
                    tr.classList.add('bg-red-100');
                    remarks.push(diff.remark);
                }
            });
            bgclass = hasError ? 'bg-red-100' : 'bg-white';

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-0 z-10 border-r border-gray-200 ${bgclass}">${row['Order ID'] || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatExcelDate(row['Order Complete Time']) || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${row['Deal Price'].toFixed(2) || ''}</td>

                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Estimated Shipping Fee'] || 0)).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Received Shipping Fee'] || 0)).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${(Math.abs(parseFloat(row['Estimated Shipping Fee'] || 0)) - Math.abs(parseFloat(row['Received Shipping Fee'] || 0))).toFixed(2)}</td>
         
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Transaction Fee'] || 0)).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Received Transaction Fee'] || 0)).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${(Math.abs(parseFloat(row['Transaction Fee'] || 0)) - Math.abs(parseFloat(row['Received Transaction Fee'] || 0))).toFixed(2)}</td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Commission Fee'] || 0)).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Received Commission Fee'] || 0)).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${(Math.abs(parseFloat(row['Commission Fee'] || 0)) - Math.abs(parseFloat(row['Received Commission Fee'] || 0))).toFixed(2)}</td>

                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Service Fee'] || 0)).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Received Service Fee'] || 0)).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${(Math.abs(parseFloat(row['Service Fee'] || 0)) - Math.abs(parseFloat(row['Received Service Fee'] || 0))).toFixed(2)}</td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Seller Voucher'] || 0)).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Received Seller Voucher'] || 0)).toFixed(2)}</td>  
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${(Math.abs(parseFloat(row['Seller Voucher'] || 0)) - Math.abs(parseFloat(row['Received Seller Voucher'] || 0))).toFixed(2)}</td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['AMS Commission Fee'] || 0)).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Free Return Fee'] || 0)).toFixed(2)}</td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(finalPrice).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${row['Amount Received'] || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${(Math.abs(finalPrice) - Math.abs(parseFloat(row['Amount Received'] || 0))).toFixed(2)}</td>

                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${remarks.join(', ') || ''}</td>
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
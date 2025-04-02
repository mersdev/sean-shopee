// Data display module for handling main table display and pagination
import { elements, currentPage, currentFilter } from './core.js';
import { filterData } from './dataProcessor.js';

// Display data in the main table with pagination
export function displayData(jsonData) {
    if (!jsonData) return;
    window.jsonData = jsonData;
    
    // Show the data table when data is available
    elements.dataTable.style.display = 'table';
    
    elements.tableBody.innerHTML = '';
    const filteredData = filterData(jsonData, currentFilter, elements.searchInput.value);

    const pageSize = elements.entriesPerPage.value === 'all' ? filteredData.length : parseInt(elements.entriesPerPage.value);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Update pagination UI
    const totalPages = Math.ceil(filteredData.length / pageSize);
    elements.currentPageSpan.textContent = currentPage;
    elements.totalPagesSpan.textContent = totalPages;
    elements.prevPageBtn.disabled = currentPage === 1;
    elements.nextPageBtn.disabled = currentPage === totalPages;

    // Update data summary information
    const startEntry = startIndex + 1;
    const endEntry = Math.min(startIndex + pageSize, filteredData.length);
    const totalEntries = filteredData.length;
    const dataSummary = document.getElementById('dataSummary');
    dataSummary.textContent = `Showing ${startEntry} to ${endEntry} of ${totalEntries} entries`;

    paginatedData.forEach(row => {
        const tr = document.createElement('tr');
        const finalPrice = calculateFinalPrice(row);

        // Calculate differences
        const differences = calculateDifferences(row, finalPrice);
        
        // Add background color if any difference is found
        const { hasError, remarks } = processErrors(differences);
        if (hasError) {
            tr.classList.add('bg-red-100');
        }

        // Create table row content
        tr.innerHTML = createTableRowContent(row, finalPrice, remarks);
        elements.tableBody.appendChild(tr);
    });
}

// Helper function to calculate final price
function calculateFinalPrice(row) {
    return Math.abs(parseFloat(row['Deal Price'])) + 
           Math.abs(parseFloat(row['Estimated Shipping Fee'] || 0)) - 
           Math.abs(parseFloat(row['Transaction Fee'] || 0)) - 
           Math.abs(parseFloat(row['Commission Fee'] || 0)) - 
           Math.abs(parseFloat(row['Service Fee'] || 0)) - 
           Math.abs(parseFloat(row['Seller Voucher'] || 0)) - 
           Math.abs(parseFloat(row['Free Return Fee'] || 0)) - 
           Math.abs(parseFloat(row['AMS Commission Fee'] || 0));
}

// Helper function to calculate differences
function calculateDifferences(row, finalPrice) {
    const EPSILON = 0.01; // Threshold for floating point comparison
    return [
        { 
            value: Math.abs(parseFloat(row['Estimated Shipping Fee'] || 0)) - 
                   Math.abs(parseFloat(row['Received Shipping Fee'] || 0)),
            remark: 'Shipping fee difference'
        },
        {
            value: Math.abs(parseFloat(row['Transaction Fee'] || 0)) - 
                   Math.abs(parseFloat(row['Received Transaction Fee'] || 0)),
            remark: 'Transaction fee difference'
        },
        {
            value: Math.abs(parseFloat(row['Commission Fee'] || 0)) - 
                   Math.abs(parseFloat(row['Received Commission Fee'] || 0)),
            remark: 'Commission fee difference'
        },
        {
            value: Math.abs(parseFloat(row['Service Fee'] || 0)) - 
                   Math.abs(parseFloat(row['Received Service Fee'] || 0)),
            remark: 'Service fee difference'
        },
        {
            value: Math.abs(parseFloat(row['Seller Voucher'] || 0)) - 
                   Math.abs(parseFloat(row['Received Seller Voucher'] || 0)),
            remark: 'Voucher amount difference'
        },
        {
            value: Math.abs(finalPrice) - Math.abs(parseFloat(row['Amount Received'] || 0)),
            remark: 'Final amount difference'
        }
    ];
}

// Helper function to process errors and generate remarks
function processErrors(differences) {
    const EPSILON = 0.01;
    let hasError = false;
    const remarks = [];

    differences.forEach(diff => {
        if (Math.abs(diff.value) > EPSILON) {
            hasError = true;
            remarks.push(diff.remark);
        }
    });

    return { hasError, remarks };
}

// Helper function to create table row content
function createTableRowContent(row, finalPrice, remarks) {
    return `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${row['Order ID']}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${row['Order Complete Time']}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${row['Return / Refund Status'] || '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${Math.abs(parseFloat(row['Deal Price'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${Math.abs(parseFloat(row['Estimated Shipping Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${Math.abs(parseFloat(row['Transaction Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${Math.abs(parseFloat(row['Commission Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${Math.abs(parseFloat(row['Service Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${Math.abs(parseFloat(row['Seller Voucher'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${Math.abs(parseFloat(row['Free Return Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${Math.abs(parseFloat(row['AMS Commission Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${finalPrice.toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${remarks.join(', ') || '-'}</td>
    `;
}
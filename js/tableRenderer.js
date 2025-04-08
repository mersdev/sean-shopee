// Table rendering and display functions
import { filterData } from './dataProcessor.js';

export function displayData(jsonData, currentFilter, searchInput, currentPage, entriesPerPage) {
    if (!jsonData) return;
    
    const tableBody = document.getElementById('tableBody');
    const dataTable = document.getElementById('dataTable');
    
    tableBody.innerHTML = '';
    const filteredData = filterData(jsonData, currentFilter, searchInput.value);

    const pageSize = entriesPerPage.value === 'all' || currentFilter === 'error' ? filteredData.length : parseInt(entriesPerPage.value);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    updatePaginationUI(filteredData.length, pageSize, currentPage);
    updateDataSummary(startIndex, pageSize, filteredData.length);

    paginatedData.forEach(row => renderTableRow(row, tableBody));
    dataTable.style.display = 'table';
    
    return filteredData;
}

function updatePaginationUI(totalItems, pageSize, currentPage) {
    const totalPages = Math.ceil(totalItems / pageSize);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function updateDataSummary(startIndex, pageSize, totalItems) {
    const startEntry = startIndex + 1;
    const endEntry = Math.min(startIndex + pageSize, totalItems);
    document.getElementById('dataSummary').textContent = 
        `Showing ${startEntry} to ${endEntry} of ${totalItems} entries`;
}

function renderTableRow(row, tableBody) {
    const tr = document.createElement('tr');
    const finalPrice = calculateFinalPrice(row);
    const differences = calculateDifferences(row, finalPrice);
    const { hasError, remarks } = processErrors(differences);
    
    const bgclass = hasError ? 'bg-red-200 hover:bg-red-300' : 'bg-white hover:bg-gray-50';
    tr.className = bgclass;
    tr.innerHTML = generateTableRowHTML(row, finalPrice, differences, bgclass, remarks);
    tableBody.appendChild(tr);
}

function calculateFinalPrice(row) {
    return Math.abs(parseFloat(row['Deal Price'])) +
           Math.abs(parseFloat(row['Estimated Shipping Fee'] || 0)) -
           Math.abs(parseFloat(row['Transaction Fee'] || 0)) -
           Math.abs(parseFloat(row['Commission Fee'] || 0)) -
           Math.abs(parseFloat(row['Service Fee'] || 0)) -
           Math.abs(parseFloat(row['Seller Voucher'] || 0)) -
           Math.abs(parseFloat(row['Saver Programme Fee'] || 0)) -
           Math.abs(parseFloat(row['AMS Commission Fee'] || 0));
}

function calculateDifferences(row, finalPrice) {
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

function generateTableRowHTML(row, finalPrice, differences, bgclass, remarks) {
    return `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-0 z-10 border-r border-gray-200 ${bgclass}">${row['Order ID'] || ''}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatExcelDate(row['Order Complete Time']) || ''}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${row['Deal Price'].toFixed(2) || ''}</td>

        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Estimated Shipping Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(parseFloat(row['Received Shipping Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${differences[0].value.toFixed(2)}</td>

        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">-${Math.abs(parseFloat(row['Transaction Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">-${Math.abs(parseFloat(row['Received Transaction Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${differences[1].value.toFixed(2)}</td>

        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">-${Math.abs(parseFloat(row['Commission Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">-${Math.abs(parseFloat(row['Received Commission Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${differences[2].value.toFixed(2)}</td>

        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">-${Math.abs(parseFloat(row['Service Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">-${Math.abs(parseFloat(row['Received Service Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${differences[3].value.toFixed(2)}</td>

        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">-${Math.abs(parseFloat(row['Seller Voucher'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">-${Math.abs(parseFloat(row['Received Seller Voucher'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${differences[4].value.toFixed(2)}</td>

        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">-${Math.abs(parseFloat(row['AMS Commission Fee'] || 0)).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">-${Math.abs(parseFloat(row['Saver Programme Fee'] || 0)).toFixed(2)}</td>

        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${Math.abs(finalPrice).toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${row['Amount Received'] || ''}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${differences[5].value.toFixed(2)}</td>

        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200 hover:bg-gray-50">${remarks.join(', ') || ''}</td>
    `;
}

function formatExcelDate(serialDate) {
    if (!serialDate) return '';
    
    const date = new Date((serialDate - 25569) * 86400 * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
}
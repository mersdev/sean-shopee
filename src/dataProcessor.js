// Data processor module for handling Excel file operations
import { displayData } from './dataDisplay.js';
import { updateFeeTable } from './feeTable.js';
import { hideLoading } from './utils.js';

// Process Excel file data
export function processExcelFile(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    
    // Get sheets
    const orderSheet = workbook.Sheets[workbook.SheetNames[0]];
    const transactionSheet = workbook.Sheets[workbook.SheetNames[1]];
    const transactionSheet1 = workbook.Sheets[workbook.SheetNames[2]];
    const walletSheet = workbook.Sheets[workbook.SheetNames[3]];
    
    // Convert sheets to JSON
    const orderData = XLSX.utils.sheet_to_json(orderSheet);
    const transactionData = [...XLSX.utils.sheet_to_json(transactionSheet), ...XLSX.utils.sheet_to_json(transactionSheet1)];
    const walletData = XLSX.utils.sheet_to_json(walletSheet);

    let filteredResults = orderData.filter(row => row['Order Status'] === 'Completed');

    // Merge data from all sheets
    const jsonData = filteredResults.map(order => {
        const transaction = transactionData.find(t => t['Order ID'] === order['Order ID']) || {};
        const amount = walletData.find(w => w['Order ID'] === order['Order ID']) || {};
        return {
            ...order,
            'Received Shipping Fee': transaction?.['Shipping Fee Paid by Buyer'] || transaction?.['Shipping Fee Paid by Buyer (excl. SST)'] || '',
            'Received Commission Fee': transaction?.['Commission Fee (incl. SST)'] || transaction?.['Commision Fee (Incl. SST)'] || '',
            'Received Service Fee': transaction?.['Service Fee'] || transaction?.['Service Fee (Incl. SST)'] || '',
            'Received Transaction Fee': transaction?.['Transaction Fee'] || transaction?.['Transaction Fee (Incl. SST)'] || '',
            'Received Seller Voucher': transaction?.['Voucher'] || transaction?.['Voucher Sponsored by Seller'] || '',
            'AMS Commission Fee': transaction?.['AMS Commission Fee'] || '',
            'Free Return Fee': transaction?.['Saver Programme Fee (Incl. SST)'] || transaction?.['Free Returns Fee'] || '',
            'Total Released Amount (RM)': transaction?.['Total Released Amount (RM)'] || '',
            'Amount Received': amount?.['Payment'] || 0,
        };
    });

    displayData(jsonData);
    updateFeeTable(window.jsonData || []);
    hideLoading();
}

// Filter data based on criteria
export function filterData(data, filterType, searchQuery = '') {
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
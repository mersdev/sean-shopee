export function processOrderFile(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    return jsonData;
}

export function processIncomeFile(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[2]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, {range:2});
    return jsonData;
}

export function processWalletFile(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, {range:17});
    return jsonData;
}

import { calculateAllFees } from './feeCalculator.js';

export function processRawData(feeRates) {
    const orderData = window.fileData.order;
    const transactionData = window.fileData.income;
    const walletData = window.fileData.wallet;
  
    if (!orderData.length) return [];
    
    let filteredResults = orderData.filter(row => row['Order Status'] === 'Completed');

    return filteredResults.map(order => {
        const transaction = transactionData.find(t => t['Order ID'] === order['Order ID']) || {};
        const amount = walletData.find(w => w['Order ID'] === order['Order ID']) || {};
        const dealPrice = Math.abs(parseFloat(order['Deal Price'] || 0));
        const calculatedFees = calculateAllFees(dealPrice, feeRates);
        
        return {
            ...order,
            'Received Shipping Fee': transaction?.['Shipping Fee Paid by Buyer'] || transaction?.['Shipping Fee Paid by Buyer (excl. SST)'] || '',
            'Received Commission Fee': calculatedFees.commission || 0,
            'Received Service Fee': calculatedFees.service || 0,
            'Received Transaction Fee': calculatedFees.transaction || 0,
            'Received Seller Voucher': transaction?.['Voucher'] || transaction?.['Voucher Sponsored by Seller'] || '',
            'AMS Commission Fee': transaction?.['AMS Commission Fee'] || '',
            'Saver Programme Fee': transaction?.['Saver Programme Fee (Incl. SST)'] || transaction?.['Free Returns Fee'] || '',
            'Total Released Amount (RM)': transaction?.['Total Released Amount (RM)'] || '',
            'Amount Received': amount?.['Amount'] || 0,
        };
    });
}

export function filterData(data, filterType, searchQuery = '') {
    let filteredResults = data.filter(row => row['Order Status'] === 'Completed');
    
    // Apply filter type
    switch(filterType) {
        case 'error':
            filteredResults = filteredResults.filter(row => {
                const differences = calculateDifferences(row, calculateFinalPrice(row));
                return processErrors(differences).hasError;
            });
            break;
        case 'valid':
            filteredResults = filteredResults.filter(row => {
                const differences = calculateDifferences(row, calculateFinalPrice(row));
                return !processErrors(differences).hasError;
            });
            break;
    }

    // Apply search query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredResults = filteredResults.filter(row => {
            return row['Order ID']?.toString().toLowerCase().includes(query);
        });
    }

    return filteredResults;
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
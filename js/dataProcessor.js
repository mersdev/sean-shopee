// Data processing functions for Excel files

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

    // Merge data from sheets
    return filteredResults.map(order => {
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
           Math.abs(parseFloat(row['Free Return Fee'] || 0)) -
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
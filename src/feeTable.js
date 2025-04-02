// Fee table module for handling fee-related calculations and display
import { activeFeeTab, elements } from './core.js';
import { formatExcelDate } from './utils.js';

// Update fee table based on active tab
export function updateFeeTable(data) {
    if (!data || !data.length) return;

    const createFeeTable = (title, data, valueExtractor) => {
        const tableContent = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 border border-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Order ID</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Date</th>
                            ${['transaction', 'commission', 'service'].includes(activeFeeTab) ? '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Deal Price</th>' : ''}
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Order</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Received</th>
                            ${['transaction', 'commission', 'service'].includes(activeFeeTab) ? '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">% of Deal Price</th>' : ''}
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Diff</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Remarks</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${data.map(row => {
                            const values = valueExtractor(row);
                            const diff = (Math.abs(parseFloat(values.order || 0)) - Math.abs(parseFloat(values.received || 0))).toFixed(2);
                            const hasDiscrepancy = Math.abs(parseFloat(diff)) > 0.01;
                            return `
                                <tr class="${hasDiscrepancy ? 'bg-red-50' : ''}">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${row['Order ID']}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${formatExcelDate(row['Order Complete Time'])}</td>
                                    ${['transaction', 'commission', 'service'].includes(activeFeeTab) ? `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${Math.abs(parseFloat(row['Deal Price'] || 0)).toFixed(2)}</td>` : ''}
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${Math.abs(parseFloat(values.order || 0)).toFixed(2)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${Math.abs(parseFloat(values.received || 0)).toFixed(2)}</td>
                                    ${['transaction', 'commission', 'service'].includes(activeFeeTab) ? `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${((Math.abs(parseFloat(values.received || 0)) / Math.abs(parseFloat(row['Deal Price'] || 1))) * 100).toFixed(2)}%</td>` : ''}
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${diff}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">${hasDiscrepancy ? values.remarks : ''}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        elements.feeTabContent.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">${title}</h3>
                ${tableContent}
            </div>
        `;
    };

    const tabConfigs = {
        shipping: {
            title: 'Shipping Fee Details',
            valueExtractor: (row) => ({
                order: row['Estimated Shipping Fee'],
                received: row['Received Shipping Fee'],
                remarks: 'Shipping fee discrepancy'
            })
        },
        transaction: {
            title: 'Transaction Fee Details',
            valueExtractor: (row) => ({
                order: row['Transaction Fee'],
                received: row['Received Transaction Fee'],
                remarks: 'Transaction fee discrepancy'
            })
        },
        commission: {
            title: 'Commission Fee Details',
            valueExtractor: (row) => ({
                order: row['Commission Fee'],
                received: row['Received Commission Fee'],
                remarks: 'Commission fee discrepancy'
            })
        },
        service: {
            title: 'Service Fee Details',
            valueExtractor: (row) => ({
                order: row['Service Fee'],
                received: row['Received Service Fee'],
                remarks: 'Service fee discrepancy'
            })
        },
        voucher: {
            title: 'Seller Voucher Details',
            valueExtractor: (row) => ({
                order: row['Seller Voucher'],
                received: row['Received Seller Voucher'],
                remarks: 'Voucher amount discrepancy'
            })
        },
        final: {
            title: 'Final Amount Details',
            valueExtractor: (row) => {
                const finalPrice = Math.abs(parseFloat(row['Deal Price'])) + 
                    Math.abs(parseFloat(row['Estimated Shipping Fee'] || 0)) - 
                    Math.abs(parseFloat(row['Transaction Fee'] || 0)) - 
                    Math.abs(parseFloat(row['Commission Fee'] || 0)) - 
                    Math.abs(parseFloat(row['Service Fee'] || 0)) - 
                    Math.abs(parseFloat(row['Seller Voucher'] || 0)) - 
                    Math.abs(parseFloat(row['Free Return Fee'] || 0)) - 
                    Math.abs(parseFloat(row['AMS Commission Fee'] || 0));
                return {
                    order: finalPrice,
                    received: row['Amount Received'],
                    remarks: 'Final amount discrepancy'
                };
            }
        }
    };

    const config = tabConfigs[activeFeeTab];
    if (config) {
        createFeeTable(config.title, data, config.valueExtractor);
    }
}
// Chart.js is already loaded via CDN in index.html

export function renderCharts(filteredData) {
    // Calculate total fees percentage
    const totalFeesPercentage = filteredData.reduce((sum, row) => {
        const dealPrice = Math.abs(parseFloat(row['Deal Price'] || 1));
        const transactionFee = Math.abs(parseFloat(row['Transaction Fee'] || 0));
        const commissionFee = Math.abs(parseFloat(row['Commission Fee'] || 0));
        const serviceFee = Math.abs(parseFloat(row['Service Fee'] || 0));
        const totalFees = transactionFee + commissionFee + serviceFee;
        return sum + (totalFees / dealPrice * 100);
    }, 0) / filteredData.length;

    // Calculate error orders
    const errorOrders = filteredData.filter(row => {
        const finalPrice = calculateFinalPrice(row);
        const differences = calculateDifferences(row, finalPrice);
        return processErrors(differences).hasError;
    }).length;

    // Calculate average fees by week
    const weeklyData = {};
    filteredData.forEach(row => {
        const date = new Date((row['Order Complete Time'] - 25569) * 86400 * 1000);
        const year = date.getFullYear();

        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        const weekKey = `W${weekNumber.toString().padStart(2, '0')}/${year}`;

        
        
        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
                transactionFees: [],
                commissionFees: [],
                serviceFees: [],
                dealPrices: []
            };
        }
        
        weeklyData[weekKey].transactionFees.push(Math.abs(parseFloat(row['Transaction Fee'] || 0)));
        weeklyData[weekKey].commissionFees.push(Math.abs(parseFloat(row['Commission Fee'] || 0)));
        weeklyData[weekKey].serviceFees.push(Math.abs(parseFloat(row['Service Fee'] || 0)));
        weeklyData[weekKey].dealPrices.push(Math.abs(parseFloat(row['Deal Price'] || 1)));
    });

    const weeks = Object.keys(weeklyData).sort();
    const last5Weeks = weeks.slice(-5);
    
    // Get first and last dates from the last5Weeks data
    const weekDates = last5Weeks.map(week => {
        const [weekNum, year] = week.split('/');
        const weekNumber = parseInt(weekNum.substring(1));
        const firstDayOfYear = new Date(parseInt(year), 0, 1);
        const dayOffset = (weekNumber - 1) * 7;
        return new Date(firstDayOfYear.getTime() + dayOffset * 86400000);
    });
    
    const firstDate = new Date(Math.min(...weekDates));
    const lastDate = new Date(Math.max(...weekDates));
    // Format dates as DD/MM/YYYY
    const formattedFirstDate = firstDate.toLocaleDateString('en-GB');
    const formattedLastDate = lastDate.toLocaleDateString('en-GB');
    const avgWeeklyFees = last5Weeks.map(week => {
        const data = weeklyData[week];
        const totalTransactions = data.transactionFees.reduce((a, b) => a + b, 0);
        const totalCommissions = data.commissionFees.reduce((a, b) => a + b, 0);
        const totalServices = data.serviceFees.reduce((a, b) => a + b, 0);
        const totalDeals = data.dealPrices.reduce((a, b) => a + b, 0);
        
        return {
            week,
            transactionFee: (totalTransactions / totalDeals) * 100,
            commissionFee: (totalCommissions / totalDeals) * 100,
            serviceFee: (totalServices / totalDeals) * 100
        };
    });


    // Calculate average fees for metric cards
    const avgTransactionFee = avgWeeklyFees.reduce((sum, week) => sum + week.transactionFee, 0) / avgWeeklyFees.length;
    const avgCommissionFee = avgWeeklyFees.reduce((sum, week) => sum + week.commissionFee, 0) / avgWeeklyFees.length;
    const avgServiceFee = avgWeeklyFees.reduce((sum, week) => sum + week.serviceFee, 0) / avgWeeklyFees.length;
    
    // Create chart containers if they don't exist
    if (!document.getElementById('chartsContainer')) {
        const container = document.createElement('div');
        container.id = 'chartsContainer';
        container.className = 'space-y-6 mb-8';

        // Create header section with total fees percentage
        const header = document.createElement('div');
        header.className = 'bg-white p-6 rounded-lg shadow hidden';
        header.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Total Fees</h2>
                    <p class="text-sm text-gray-500">${formattedFirstDate} - ${formattedLastDate}</p>
                </div>
                <div class="text-right">
                    <div class="text-3xl font-bold text-gray-900">${totalFeesPercentage.toFixed(2)}%</div>
                    <div class="flex items-center text-sm text-green-600">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                        <span>24.21%</span>
                    </div>
                </div>
            </div>
            <canvas id="feeTrendsChart" class="w-full h-48"></canvas>
        `;

        // Create metrics grid
        const metricsGrid = document.createElement('div');
        metricsGrid.className = 'grid grid-cols-1 md:grid-cols-4 gap-4';
        metricsGrid.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Error Orders</h3>
                <div class="mt-2 flex items-baseline">
                    <p class="text-2xl font-semibold text-gray-900">${errorOrders}</p>
                    <span class="text-sm text-gray-500">/${filteredData.length}</span>
                    <p class="ml-2 text-sm text-gray-500">orders</p>
                </div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Avg Transaction Fee</h3>
                <div class="mt-2 flex items-baseline">
                    <p class="text-2xl font-semibold text-gray-900">${avgTransactionFee.toFixed(2)}%</p>
                </div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Avg Commission Fee</h3>
                <div class="mt-2 flex items-baseline">
                    <p class="text-2xl font-semibold text-gray-900">${avgCommissionFee.toFixed(2)}%</p>
                </div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Avg Service Fee</h3>
                <div class="mt-2 flex items-baseline">
                    <p class="text-2xl font-semibold text-gray-900">${avgServiceFee.toFixed(2)}%</p>
                </div>
            </div>
        `;

        container.appendChild(metricsGrid);
        container.appendChild(header);
        // document.querySelector('.container').insertBefore(container, document.getElementById('result'));
    }
    
    // Weekly fee trends line chart
    const feeTrendsCanvas = document.getElementById('feeTrendsChart');
    if (!feeTrendsCanvas) {
        console.error('Could not find feeTrendsChart canvas element');
        return;
    }
    
    const feeTrendsCtx = feeTrendsCanvas.getContext('2d');
    if (!feeTrendsCtx) {
        console.error('Could not get 2d context from feeTrendsChart');
        return;
    }
    
    new Chart(
        feeTrendsCtx,
        {
            type: 'line',
            data: {
                labels: last5Weeks,
                datasets: [
                    {
                        label: 'Transaction Fee',
                        data: avgWeeklyFees.map(week => week.transactionFee),
                        borderColor: '#3b82f6',
                        backgroundColor: '#3b82f680',
                        tension: 0.4
                    },
                    {
                        label: 'Commission Fee',
                        data: avgWeeklyFees.map(week => week.commissionFee),
                        borderColor: '#8b5cf6',
                        backgroundColor: '#8b5cf680',
                        tension: 0.4
                    },
                    {
                        label: 'Service Fee',
                        data: avgWeeklyFees.map(week => week.serviceFee),
                        borderColor: '#ec4899',
                        backgroundColor: '#ec489980',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Percentage (%)'
                        },
                        grid: {
                            display: true,
                            color: '#e5e7eb'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
                            }
                        }
                    }
                }
            }
        }
    );
}

// Reuse existing functions from tableRenderer
function calculateFinalPrice(row) {
    return Math.abs(parseFloat(row['Deal Price'])) +
           Math.abs(parseFloat(row['Estimated Shipping Fee'] || 0)) -
           Math.abs(parseFloat(row['Transaction Fee'] || 0)) -
           Math.abs(parseFloat(row['Commission Fee'] || 0)) -
           Math.abs(parseFloat(row['Service Fee'] || 0)) -
           Math.abs(parseFloat(row['Seller Voucher'] || 0)) -
           Math.abs(parseFloat(row[''] || 0)) -
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
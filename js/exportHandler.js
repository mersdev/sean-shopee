// Export functionality for Shopee Dealer Dashboard
import { displayData } from './tableRenderer.js';

export function setupExportHandler() {
    document.getElementById('exportButton').addEventListener('click', () => {
        // Save current pagination state
        const entriesPerPage = document.getElementById('entriesPerPage');
        const currentPage = document.getElementById('currentPage').textContent;
        const currentFilter = window.currentFilter || 'all';
        const searchInput = document.getElementById('searchInput');
        const originalValue = entriesPerPage.value;
        
        // Temporarily show all data for export
        entriesPerPage.value = 'all';
        displayData(window.jsonData, currentFilter, searchInput, 1, entriesPerPage);
        
        const table = document.getElementById('dataTable');
        if (!table) return;
        
        // Create a new table with all data rows
        const tableClone = document.createElement('table');
        tableClone.className = table.className;
        
        // Clone table header
        const thead = document.createElement('thead');
        thead.innerHTML = table.querySelector('thead').innerHTML;
        tableClone.appendChild(thead);
        
        // Create new tbody with all data rows
        const tbody = document.createElement('tbody');
        const allRows = document.querySelectorAll('#tableBody tr');
        allRows.forEach(row => {
            const dateValue = row.querySelectorAll('td')[1].innerHTML;
            if(/^\d{2}-\d{2}-\d{4}$/.test(dateValue)){
                const [day, month, year] = dateValue.split('-');
                row.querySelectorAll('td')[1].innerHTML = `${year}-${month}-${day}`;
            }
            tbody.appendChild(row.cloneNode(true));
        });
        tableClone.appendChild(tbody);

        const ws = XLSX.utils.table_to_sheet(tableClone, {dateNF: 'dd-mm-yyyy', cellDates: true, dense: true}); // Use the cloned table for the worksheet
        
        // Create workbook and add worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Orders');
        
        // Generate Excel file with timestamp and trigger download
        const now = new Date();
        const timestamp = `${now.getDate().toString().padStart(2, '0')}_${(now.getMonth()+1).toString().padStart(2, '0')}_${now.getFullYear().toString().slice(-2)}_${now.getHours().toString().padStart(2, '0')}_${now.getMinutes().toString().padStart(2, '0')}`;
        XLSX.writeFile(wb, `shopee_order_${timestamp}.xlsx`);
        
        // Restore original pagination
        entriesPerPage.value = originalValue;
        displayData(window.jsonData, currentFilter, searchInput, currentPage, entriesPerPage);
    });
}
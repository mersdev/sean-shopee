import { processOrderFile, processIncomeFile, processWalletFile, filterData, processRawData } from './dataProcessor.js';
import { displayData } from './tableRenderer.js';

export function setupFeeDialog() {
    const editFeesBtn = document.getElementById('editFeesBtn');
    const feeEditDialog = document.getElementById('feeEditDialog');
    const closeFeeDialog = document.getElementById('closeFeeDialog');
    const cancelFeeEdit = document.getElementById('cancelFeeEdit');
    const saveFeeEdit = document.getElementById('saveFeeEdit');
    
    const commissionInput = document.getElementById('commissionFeeInput');
    const serviceInput = document.getElementById('serviceFeeInput');
    const transactionInput = document.getElementById('transactionFeeInput');
    
    // Open dialog
    editFeesBtn.addEventListener('click', () => {
        commissionInput.value = document.querySelector('.commission-text').textContent.replace('%','');
        serviceInput.value = document.querySelector('.service-fee').textContent.replace('%','');
        transactionInput.value = document.querySelector('.transactions-fee').textContent.replace('%','');
        feeEditDialog.classList.remove('hidden');
    });
    
    // Close dialog
    [closeFeeDialog, cancelFeeEdit].forEach(btn => {
        btn.addEventListener('click', () => feeEditDialog.classList.add('hidden'));
    });
    
    // Save changes
    saveFeeEdit.addEventListener('click', () => {
        document.querySelector('.commission-text').textContent = commissionInput.value + '%';
        document.querySelector('.service-fee').textContent = serviceInput.value + '%';
        document.querySelector('.transactions-fee').textContent = transactionInput.value + '%';
        const feeRates = {
            COMMISSION: parseFloat(commissionInput.value) / 100,
            SERVICE: parseFloat(serviceInput.value) / 100,
            TRANSACTION: parseFloat(transactionInput.value) / 100
        };

        const processedData = processRawData(feeRates);
        window.jsonData = processedData;
        displayData(window.jsonData, currentFilter, searchInput, 1, entriesPerPage);
        
        feeEditDialog.classList.add('hidden');
    });
}
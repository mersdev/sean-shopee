// Main entry point for the application
import { initializeCore } from './core.js';
import { initializeAllHandlers } from './eventHandlers.js';
import { showLoading, hideLoading } from './utils.js';
import { processExcelFile } from './dataProcessor.js';

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize core functionality
    initializeCore();

    // Initialize all event handlers
    initializeAllHandlers();

    // Check if data.xlsx exists and load it
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
            const dataTable = document.getElementById('dataTable');
            dataTable.style.display = 'none';
            const uploadMessage = document.createElement('div');
            uploadMessage.className = 'upload-message';
            uploadMessage.innerHTML = 'Please upload the data.xlsx file to proceed';
            document.querySelector('#result').prepend(uploadMessage);
        });
});
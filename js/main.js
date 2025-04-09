import { initializeEventHandlers } from './eventHandlers.js';
import { setupExportHandler } from './exportHandler.js';
import { setupFeeDialog } from './feeDialogHandler.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize event handlers and UI components
    initializeEventHandlers();
    setupExportHandler();
    setupFeeDialog();
});
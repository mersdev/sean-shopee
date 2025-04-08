import { initializeEventHandlers } from './eventHandlers.js';
import { setupExportHandler } from './exportHandler.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize event handlers and UI components
    initializeEventHandlers();
    setupExportHandler();
});
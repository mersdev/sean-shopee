// Main application entry point

import { initializeEventHandlers } from './eventHandlers.js';
import { renderCharts } from './charts.js';
import { setupExportHandler } from './exportHandler.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize event handlers and UI components
    initializeEventHandlers();
    setupExportHandler();
    
    // Render charts when data is available
    const renderWhenReady = () => {
        if (window.jsonData) {
            renderCharts(window.jsonData);
        } else {
            setTimeout(renderWhenReady, 100);
        }
    };
    
    renderWhenReady();
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { logContainer } from '../dom';
import { logger } from '../logger';

/** Renders the log entries into the modal container. */
export function renderLog() {
    const entries = logger.getEntries();
    if (entries.length === 0) {
        logContainer.innerHTML = '<p class="text-gray-500">Log is empty.</p>';
        return;
    }
    logContainer.innerHTML = entries.map(entry => `
        <div class="log-entry log-${entry.type}">
            <div>
                <span class="log-timestamp">${entry.timestamp.toLocaleTimeString()}</span>
                <span class="log-message">${entry.message}</span>
            </div>
            ${entry.details ? `<div class="log-details">${entry.details}</div>` : ''}
        </div>
    `).join('');
}

/** Clears the log and re-renders the log view. */
export function handleClearLog() {
    logger.clear();
    renderLog();
}

/** Copies the entire log content to the clipboard. */
export function handleCopyLog() {
    const textToCopy = logger.getEntries().map(entry => 
        `[${entry.timestamp.toISOString()}] [${entry.type.toUpperCase()}] ${entry.message}` +
        (entry.details ? `\n---DETAILS---\n${entry.details}\n--------------` : '')
    ).join('\n\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
        logger.info('Log copied to clipboard.');
        renderLog(); // Show feedback in the log itself
    }).catch(err => {
        logger.error('Failed to copy log to clipboard.', err);
        renderLog();
    });
}

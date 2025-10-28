/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LogEntry {
    type: 'info' | 'warn' | 'error' | 'action';
    message: string;
    timestamp: Date;
    details?: string;
}

const entries: LogEntry[] = [];

function addEntry(type: LogEntry['type'], message: string, details?: string) {
    // Add to the beginning of the array to show newest entries first
    entries.unshift({
        type,
        message,
        timestamp: new Date(),
        details,
    });
    // Limit the log size to prevent memory issues over long sessions
    if (entries.length > 200) {
        entries.pop();
    }
}

/**
 * A simple singleton logger for capturing application events.
 */
export const logger = {
    info: (message: string) => addEntry('info', message),
    warn: (message: string) => addEntry('warn', message),
    error: (message: string, errorObj?: any) => {
        let details;
        if (errorObj) {
            // Provide more useful details for Error objects
            details = errorObj instanceof Error ? errorObj.stack : JSON.stringify(errorObj, null, 2);
        }
        addEntry('error', message, details);
    },
    action: (message: string) => addEntry('action', message),
    getEntries: (): readonly LogEntry[] => entries,
    clear: () => {
        entries.length = 0;
        logger.info('Log cleared.');
    },
};

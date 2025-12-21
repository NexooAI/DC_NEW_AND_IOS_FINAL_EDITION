/**
 * Debug Helper Utility
 * Use this to view error logs and debug crashes in production
 */

import { logger } from './logger';

/**
 * Print all error logs to console
 * Call this function when debugging crashes
 */
export const printErrorLog = () => {
  const errors = logger.getErrorLog();
  console.log('========== ERROR LOG ==========');
  console.log(`Total errors: ${errors.length}`);
  console.log('===============================');
  
  errors.forEach((errorEntry, index) => {
    console.log(`\n[${index + 1}] ${errorEntry.timestamp}`);
    console.log('Error:', errorEntry.error);
    if (errorEntry.context) {
      console.log('Context:', JSON.stringify(errorEntry.context, null, 2));
    }
    console.log('---');
  });
  
  console.log('===============================');
};

/**
 * Get error log as formatted string
 */
export const getErrorLogString = (): string => {
  const errors = logger.getErrorLog();
  if (errors.length === 0) {
    return 'No errors logged.';
  }
  
  let logString = `========== ERROR LOG (${errors.length} errors) ==========\n\n`;
  
  errors.forEach((errorEntry, index) => {
    logString += `[${index + 1}] ${errorEntry.timestamp}\n`;
    logString += `Error: ${JSON.stringify(errorEntry.error, null, 2)}\n`;
    if (errorEntry.context) {
      logString += `Context: ${JSON.stringify(errorEntry.context, null, 2)}\n`;
    }
    logString += '---\n\n';
  });
  
  logString += '==========================================\n';
  return logString;
};

/**
 * Clear all error logs
 */
export const clearErrorLog = () => {
  logger.clearErrorLog();
  console.log('Error log cleared.');
};

/**
 * Get the last N errors
 */
export const getLastErrors = (count: number = 5) => {
  const errors = logger.getErrorLog();
  return errors.slice(-count);
};

// Make functions available globally for debugging
if (typeof global !== 'undefined') {
  (global as any).printErrorLog = printErrorLog;
  (global as any).getErrorLogString = getErrorLogString;
  (global as any).clearErrorLog = clearErrorLog;
  (global as any).getLastErrors = getLastErrors;
}


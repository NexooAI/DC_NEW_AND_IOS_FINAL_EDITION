/**
 * Production-safe logger utility
 * Automatically disables logging in production builds
 * ERROR and CRASH logs always work in production for debugging
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const isDev = __DEV__;

// Store errors in memory for crash reporting (works in production)
const errorLog: Array<{ timestamp: string; error: any; context?: any }> = [];
const MAX_ERROR_LOG_SIZE = 50;

// Persistent log storage for critical events (survives crashes)
const PERSISTENT_LOG_KEY = '@app_crash_logs';
const MAX_PERSISTENT_LOGS = 100;

// Payment-specific persistent logs
const PAYMENT_LOG_KEY = '@payment_crash_logs';
const MAX_PAYMENT_LOGS = 50;

const addToErrorLog = (error: any, context?: any) => {
  errorLog.push({
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
    context,
  });
  // Keep only last N errors
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.shift();
  }
};

// Save log to persistent storage (async, non-blocking)
const savePersistentLog = async (level: string, message: string, data?: any) => {
  try {
    const existingLogs = await AsyncStorage.getItem(PERSISTENT_LOG_KEY);
    const logs: Array<{ timestamp: string; level: string; message: string; data?: string }> =
      existingLogs ? JSON.parse(existingLogs) : [];

    logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? safeStringify(data, 1000) : undefined,
    });

    // Keep only last N logs
    if (logs.length > MAX_PERSISTENT_LOGS) {
      logs.shift();
    }

    await AsyncStorage.setItem(PERSISTENT_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    // Silently fail - don't crash the app if logging fails
    console.error('Failed to save persistent log:', error);
  }
};

// Helper function to safely stringify data (handles undefined, circular refs, etc.)
const safeStringify = (data: any, maxLength: number = 2000): string => {
  try {
    if (data === null || data === undefined) {
      return '';
    }

    if (typeof data === 'string') {
      return data.substring(0, maxLength);
    }

    if (typeof data === 'object') {
      // Remove undefined values and handle circular references
      // Use a replacer function to convert undefined to null
      const stringified = JSON.stringify(data, (key, value) => {
        if (value === undefined) {
          return null; // Convert undefined to null
        }
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
          try {
            JSON.stringify(value);
          } catch {
            return '[Circular Reference]';
          }
        }
        return value;
      });
      return stringified ? stringified.substring(0, maxLength) : '';
    }

    return String(data).substring(0, maxLength);
  } catch (error) {
    // If stringification fails, return a safe string representation
    try {
      return String(data).substring(0, maxLength);
    } catch {
      return '[Unable to stringify data]';
    }
  }
};

// Save payment-specific log to persistent storage
const savePaymentLog = async (event: string, data?: any) => {
  try {
    const existingLogs = await AsyncStorage.getItem(PAYMENT_LOG_KEY);
    const logs: Array<{ timestamp: string; event: string; data?: string }> =
      existingLogs ? JSON.parse(existingLogs) : [];

    logs.push({
      timestamp: new Date().toISOString(),
      event,
      data: data ? safeStringify(data, 2000) : undefined,
    });

    // Keep only last N payment logs
    if (logs.length > MAX_PAYMENT_LOGS) {
      logs.shift();
    }

    await AsyncStorage.setItem(PAYMENT_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    // Silently fail - don't crash the app if logging fails
    console.error('Failed to save payment log:', error);
  }
};

export const logger = {
  log: isDev ? console.log : () => { },
  // ERROR always logs, even in production
  error: (message: string, ...args: any[]) => {
    const error = args.find(arg => arg instanceof Error) || args[0];
    addToErrorLog(error || message, { message, args });
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: isDev ? console.warn : () => { },
  info: isDev ? console.info : () => { },
  debug: isDev ? console.debug : () => { },

  // Special methods for different log levels
  api: isDev ? console.log : () => { },
  auth: isDev ? console.log : () => { },
  navigation: isDev ? console.log : () => { },
  performance: isDev ? console.log : () => { },

  // CRASH logging - always works in production
  crash: (error: Error | any, context?: any) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    addToErrorLog(errorObj, context);
    console.error(`[CRASH]`, errorObj, context);
    // Also log stack trace
    if (errorObj.stack) {
      console.error(`[CRASH STACK]`, errorObj.stack);
    }
    // Save to persistent storage (survives crashes)
    savePersistentLog('CRASH', errorObj.message || String(error), {
      error: errorObj.message,
      stack: errorObj.stack,
      context
    });
  },

  // Payment-specific logging (persists to AsyncStorage)
  payment: (event: string, data?: any) => {
    const logMessage = `💳 [Payment] ${event}`;
    if (isDev) {
      console.log(logMessage, data);
    }
    // Always save payment logs to persistent storage
    savePaymentLog(event, data);
  },

  // Get error log for debugging
  getErrorLog: () => [...errorLog],

  // Get persistent logs (survives crashes)
  getPersistentLogs: async () => {
    try {
      const logs = await AsyncStorage.getItem(PERSISTENT_LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to get persistent logs:', error);
      return [];
    }
  },

  // Get payment logs (survives crashes)
  getPaymentLogs: async () => {
    try {
      const logs = await AsyncStorage.getItem(PAYMENT_LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to get payment logs:', error);
      return [];
    }
  },

  // Clear error log
  clearErrorLog: () => {
    errorLog.length = 0;
  },

  // Clear persistent logs
  clearPersistentLogs: async () => {
    try {
      await AsyncStorage.removeItem(PERSISTENT_LOG_KEY);
      await AsyncStorage.removeItem(PAYMENT_LOG_KEY);
    } catch (error) {
      console.error('Failed to clear persistent logs:', error);
    }
  },

  // Grouped logging
  group: isDev ? console.group : () => { },
  groupEnd: isDev ? console.groupEnd : () => { },
  groupCollapsed: isDev ? console.groupCollapsed : () => { },

  // Table logging
  table: isDev ? console.table : () => { },

  // Trace logging
  trace: isDev ? console.trace : () => { },

  // Time logging
  time: isDev ? console.time : () => { },
  timeEnd: isDev ? console.timeEnd : () => { },
  timeLog: isDev ? console.timeLog : () => { },
};

// Export individual methods for convenience
export const { log, error, warn, info, debug, api, auth, navigation, performance } = logger;

export default logger;

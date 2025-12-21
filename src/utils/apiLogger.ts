import { apiLogger } from '@/services/api';
import { paymentLogger } from '@/services/payment.service';

import { logger } from '@/utils/logger';
export interface ApiLogEntry {
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  requestData?: any;
  responseData?: any;
  error?: any;
  service?: string;
  operation?: string;
}

export interface ApiSummary {
  totalRequests: number;
  successful: number;
  failed: number;
  averageResponseTime: number;
  endpoints: Record<string, { count: number; avgTime: number; errors: number }>;
  services: Record<string, { count: number; avgTime: number; errors: number }>;
}

/**
 * Safely parse JSON with error handling
 * @param data - The data to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed data or fallback value
 */
export const safeJsonParse = (data: any, fallback: any = null): any => {
  if (!data) return fallback;
  
  try {
    // If data is already an object, return it
    if (typeof data === 'object' && data !== null) {
      return data;
    }
    
    // If it's a string, try to parse it
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    
    // For other types, return the data as is
    return data;
  } catch (error) {
    logger.warn('JSON parse error:', error, 'Data:', data);
    return fallback;
  }
};

class ApiLogManager {
  private static instance: ApiLogManager;

  static getInstance(): ApiLogManager {
    if (!ApiLogManager.instance) {
      ApiLogManager.instance = new ApiLogManager();
    }
    return ApiLogManager.instance;
  }

  /**
   * Get all API logs from all services
   */
  getAllLogs(): ApiLogEntry[] {
    const mainLogs = apiLogger.getLogs().map(log => ({ ...log, service: 'main' }));
    const paymentLogs = paymentLogger.getLogs().map(log => ({ ...log, service: 'payment' }));

    return [...mainLogs, ...paymentLogs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Get logs for a specific service
   */
  getLogsByService(service: 'main' | 'payment' | 'apiService'): ApiLogEntry[] {
    switch (service) {
      case 'main':
        return apiLogger.getLogs().map(log => ({ ...log, service }));
      case 'payment':
        return paymentLogger.getLogs().map(log => ({ ...log, service }));
        case 'apiService':
          return paymentLogger.getLogs().map(log => ({ ...log, service }));
      default:
        return [];
    }
  }

  /**
   * Get logs for a specific endpoint
   */
  getLogsByEndpoint(endpoint: string): ApiLogEntry[] {
    return this.getAllLogs().filter(log => 
      log.url && log.url.includes(endpoint)
    );
  }

  /**
   * Get logs for a specific time range
   */
  getLogsByTimeRange(startTime: Date, endTime: Date): ApiLogEntry[] {
    return this.getAllLogs().filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= startTime && logTime <= endTime;
    });
  }

  /**
   * Get logs for failed requests only
   */
  getFailedLogs(): ApiLogEntry[] {
    return this.getAllLogs().filter(log => 
      log.error || (log.status && (log.status < 200 || log.status >= 300))
    );
  }

  /**
   * Get logs for successful requests only
   */
  getSuccessfulLogs(): ApiLogEntry[] {
    return this.getAllLogs().filter(log => 
      log.status && log.status >= 200 && log.status < 300
    );
  }

  /**
   * Get comprehensive API summary
   */
  getApiSummary(): ApiSummary {
    const allLogs = this.getAllLogs();
    
    const summary: ApiSummary = {
      totalRequests: allLogs.length,
      successful: allLogs.filter(log => log.status && log.status >= 200 && log.status < 300).length,
      failed: allLogs.filter(log => log.error || (log.status && (log.status < 200 || log.status >= 300))).length,
      averageResponseTime: 0,
      endpoints: {},
      services: {},
    };

    const successfulRequests = allLogs.filter(log => log.duration);
    if (successfulRequests.length > 0) {
      summary.averageResponseTime = successfulRequests.reduce((sum, log) => sum + (log.duration || 0), 0) / successfulRequests.length;
    }

    // Group by endpoint
    allLogs.forEach(log => {
      const endpoint = log.url || 'unknown';
      if (!summary.endpoints[endpoint]) {
        summary.endpoints[endpoint] = { count: 0, avgTime: 0, errors: 0 };
      }
      summary.endpoints[endpoint].count++;
      if (log.error) {
        summary.endpoints[endpoint].errors++;
      }
      if (log.duration) {
        summary.endpoints[endpoint].avgTime = 
          (summary.endpoints[endpoint].avgTime * (summary.endpoints[endpoint].count - 1) + log.duration) / summary.endpoints[endpoint].count;
      }
    });

    // Group by service
    allLogs.forEach(log => {
      const service = log.service || 'unknown';
      if (!summary.services[service]) {
        summary.services[service] = { count: 0, avgTime: 0, errors: 0 };
      }
      summary.services[service].count++;
      if (log.error) {
        summary.services[service].errors++;
      }
      if (log.duration) {
        summary.services[service].avgTime = 
          (summary.services[service].avgTime * (summary.services[service].count - 1) + log.duration) / summary.services[service].count;
      }
    });

    return summary;
  }

  /**
   * Clear all logs
   */
  clearAllLogs(): void {
    apiLogger.clearLogs();
    paymentLogger.clearLogs();
    logger.log('🗑️ All API logs cleared');
  }

  /**
   * Export all logs as JSON
   */
  exportLogs(): string {
    const allLogs = this.getAllLogs();
    const summary = this.getApiSummary();
    
    const exportData = {
      summary,
      logs: allLogs,
      exportTime: new Date().toISOString(),
      totalLogs: allLogs.length,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Print API summary to console
   */
  printSummary(): void {
    const summary = this.getApiSummary();
    
    logger.log('📊 API LOGS SUMMARY');
    logger.log('==================');
    logger.log(`Total Requests: ${summary.totalRequests}`);
    logger.log(`Successful: ${summary.successful}`);
    logger.log(`Failed: ${summary.failed}`);
    logger.log(`Success Rate: ${summary.totalRequests > 0 ? ((summary.successful / summary.totalRequests) * 100).toFixed(2) : 0}%`);
    logger.log(`Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);
    
    logger.log('\n📈 BY SERVICE:');
    Object.entries(summary.services).forEach(([service, stats]) => {
      logger.log(`  ${service}: ${stats.count} requests, ${stats.errors} errors, ${stats.avgTime.toFixed(2)}ms avg`);
    });
    
    logger.log('\n🔗 TOP ENDPOINTS:');
    const topEndpoints = Object.entries(summary.endpoints)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10);
    
    topEndpoints.forEach(([endpoint, stats]) => {
      logger.log(`  ${endpoint}: ${stats.count} requests, ${stats.errors} errors, ${stats.avgTime.toFixed(2)}ms avg`);
    });
  }

  /**
   * Print recent logs to console
   */
  printRecentLogs(limit: number = 10): void {
    const allLogs = this.getAllLogs();
    const recentLogs = allLogs.slice(-limit);
    
    logger.log(`📋 RECENT ${limit} API LOGS:`);
    logger.log('==================');
    
    recentLogs.forEach((log, index) => {
      const status = log.error ? '❌' : (log.status && log.status >= 200 && log.status < 300 ? '✅' : '⚠️');
      const duration = log.duration ? `${log.duration}ms` : 'N/A';
      const service = log.service || 'unknown';
      
      logger.log(`${index + 1}. ${status} ${log.method} ${log.url} (${service})`);
      logger.log(`   Status: ${log.status || 'N/A'} | Duration: ${duration} | Time: ${log.timestamp}`);
      if (log.error) {
        logger.log(`   Error: ${log.error.message || 'Unknown error'}`);
      }
      logger.log('');
    });
  }

  /**
   * Monitor API performance in real-time
   */
  startPerformanceMonitoring(intervalMs: number = 30000): NodeJS.Timeout {
    logger.log('🔍 Starting API performance monitoring...');
    
    return setInterval(() => {
      const summary = this.getApiSummary();
      const recentLogs = this.getLogsByTimeRange(
        new Date(Date.now() - intervalMs),
        new Date()
      );
      
      if (recentLogs.length > 0) {
        logger.log(`📊 Last ${intervalMs/1000}s: ${recentLogs.length} requests, ${recentLogs.filter(l => !l.error).length} successful`);
      }
    }, intervalMs);
  }

  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints(limit: number = 5): Array<{ endpoint: string; avgTime: number; count: number }> {
    const summary = this.getApiSummary();
    
    return Object.entries(summary.endpoints)
      .map(([endpoint, stats]) => ({ endpoint, avgTime: stats.avgTime, count: stats.count }))
      .filter(item => item.avgTime > 0)
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }

  /**
   * Get most error-prone endpoints
   */
  getErrorProneEndpoints(limit: number = 5): Array<{ endpoint: string; errorRate: number; count: number; errors: number }> {
    const summary = this.getApiSummary();
    
    return Object.entries(summary.endpoints)
      .map(([endpoint, stats]) => ({
        endpoint,
        errorRate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0,
        count: stats.count,
        errors: stats.errors
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit);
  }

  /**
   * Monitor specific API endpoint for continuous calls
   */
  monitorEndpoint(endpoint: string, intervalMs: number = 5000): NodeJS.Timeout {
    logger.log(`🔍 Starting monitoring for endpoint: ${endpoint}`);
    
    return setInterval(() => {
      const recentLogs = this.getLogsByTimeRange(
        new Date(Date.now() - intervalMs),
        new Date()
      );
      
      const endpointLogs = recentLogs.filter(log => 
        log.url && log.url.includes(endpoint)
      );
      
      if (endpointLogs.length > 0) {
        logger.log(`⚠️ ${endpointLogs.length} calls to ${endpoint} in last ${intervalMs/1000}s:`);
        endpointLogs.forEach((log, index) => {
          logger.log(`  ${index + 1}. ${log.method} ${log.url} - ${log.status || 'pending'} - ${log.timestamp}`);
        });
      }
    }, intervalMs);
  }

  /**
   * Get logs for a specific endpoint with time filtering
   */
  getEndpointLogs(endpoint: string, minutes: number = 5): ApiLogEntry[] {
    const cutoffTime = new Date(Date.now() - (minutes * 60 * 1000));
    return this.getAllLogs().filter(log => 
      log.url && log.url.includes(endpoint) && new Date(log.timestamp) >= cutoffTime
    );
  }

  /**
   * Check for continuous API calls (more than threshold in time window)
   */
  checkForContinuousCalls(endpoint: string, threshold: number = 3, minutes: number = 1): boolean {
    const logs = this.getEndpointLogs(endpoint, minutes);
    const isContinuous = logs.length >= threshold;
    
    if (isContinuous) {
      logger.log(`🚨 CONTINUOUS API CALLS DETECTED: ${logs.length} calls to ${endpoint} in ${minutes} minute(s)`);
      logs.forEach((log, index) => {
        logger.log(`  ${index + 1}. ${log.timestamp} - ${log.method} ${log.url}`);
      });
    }
    
    return isContinuous;
  }
}

// Export singleton instance
export const apiLogManager = ApiLogManager.getInstance();

// Export convenience functions
export const logApiSummary = () => apiLogManager.printSummary();
export const logRecentApiCalls = (limit?: number) => apiLogManager.printRecentLogs(limit);
export const clearApiLogs = () => apiLogManager.clearAllLogs();
export const exportApiLogs = () => apiLogManager.exportLogs();
export const getApiLogs = () => apiLogManager.getAllLogs();
export const getFailedApiLogs = () => apiLogManager.getFailedLogs();
export const getSlowestEndpoints = (limit?: number) => apiLogManager.getSlowestEndpoints(limit);
export const getErrorProneEndpoints = (limit?: number) => apiLogManager.getErrorProneEndpoints(limit);
export const monitorEndpoint = (endpoint: string, intervalMs?: number) => apiLogManager.monitorEndpoint(endpoint, intervalMs);
export const getEndpointLogs = (endpoint: string, minutes?: number) => apiLogManager.getEndpointLogs(endpoint, minutes);
export const checkForContinuousCalls = (endpoint: string, threshold?: number, minutes?: number) => apiLogManager.checkForContinuousCalls(endpoint, threshold, minutes); 
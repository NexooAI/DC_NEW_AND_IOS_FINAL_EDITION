import apiService from './api';
import { PaymentInitPayload, PaymentResponse, TransactionPayload, PaymentPayload } from '@/types/payment.types';

import { logger } from '@/utils/logger';
// Payment API Logger
class PaymentApiLogger {
  private logs: Array<{
    timestamp: string;
    method: string;
    url: string;
    status?: number;
    duration?: number;
    requestData?: any;
    responseData?: any;
    error?: any;
    operation: string;
  }> = [];

  logPaymentOperation(operation: string, config: any, startTime: number) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: config.method?.toUpperCase() || 'UNKNOWN',
      url: config.url || 'UNKNOWN',
      requestData: config.data,
      startTime,
      operation,
    };

    logger.log(`💳 PAYMENT ${operation.toUpperCase()}:`, {
      timestamp: logEntry.timestamp,
      method: logEntry.method,
      url: logEntry.url,
      data: logEntry.requestData,
    });

    this.logs.push(logEntry);
    return logEntry;
  }

  logPaymentResponse(operation: string, response: any, startTime: number) {
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: response.config?.method?.toUpperCase() || 'UNKNOWN',
      url: response.config?.url || 'UNKNOWN',
      status: response.status,
      duration,
      responseData: response.data,
      operation,
    };

    logger.log(`✅ PAYMENT ${operation.toUpperCase()} SUCCESS:`, {
      timestamp: logEntry.timestamp,
      method: logEntry.method,
      url: logEntry.url,
      status: logEntry.status,
      duration: `${duration}ms`,
      data: logEntry.responseData,
    });

    // Update the last log entry
    const lastLog = this.logs[this.logs.length - 1];
    if (lastLog && lastLog.url === logEntry.url && lastLog.operation === operation) {
      Object.assign(lastLog, logEntry);
    }

    return logEntry;
  }

  logPaymentError(operation: string, error: any, startTime: number) {
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
      url: error.config?.url || 'UNKNOWN',
      status: error.response?.status,
      duration,
      error: {
        message: error.message,
        code: error.code,
        responseData: error.response?.data,
      },
      operation,
    };

    logger.log(`❌ PAYMENT ${operation.toUpperCase()} ERROR:`, {
      timestamp: logEntry.timestamp,
      method: logEntry.method,
      url: logEntry.url,
      status: logEntry.status,
      duration: `${duration}ms`,
      error: logEntry.error,
    });

    // Update the last log entry
    const lastLog = this.logs[this.logs.length - 1];
    if (lastLog && lastLog.url === logEntry.url && lastLog.operation === operation) {
      Object.assign(lastLog, logEntry);
    }

    return logEntry;
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  getPaymentSummary() {
    const summary = {
      totalOperations: this.logs.length,
      successful: this.logs.filter(log => log.status && log.status >= 200 && log.status < 300).length,
      failed: this.logs.filter(log => log.error || (log.status && (log.status < 200 || log.status >= 300))).length,
      averageResponseTime: 0,
      operations: {} as Record<string, { count: number; avgTime: number; errors: number }>,
    };

    const successfulOperations = this.logs.filter(log => log.duration);
    if (successfulOperations.length > 0) {
      summary.averageResponseTime = successfulOperations.reduce((sum, log) => sum + (log.duration || 0), 0) / successfulOperations.length;
    }

    // Group by operation type
    this.logs.forEach(log => {
      const operation = log.operation || 'unknown';
      if (!summary.operations[operation]) {
        summary.operations[operation] = { count: 0, avgTime: 0, errors: 0 };
      }
      summary.operations[operation].count++;
      if (log.error) {
        summary.operations[operation].errors++;
      }
      if (log.duration) {
        summary.operations[operation].avgTime = 
          (summary.operations[operation].avgTime * (summary.operations[operation].count - 1) + log.duration) / summary.operations[operation].count;
      }
    });

    return summary;
  }
}

const paymentLogger = new PaymentApiLogger();

class PaymentService {
  async initiatePayment(payload: PaymentInitPayload): Promise<PaymentResponse> {
    const startTime = Date.now();
    
    try {
      const formBody = new URLSearchParams();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formBody.append(key, String(value));
        }
      });

      // Log the request
      paymentLogger.logPaymentOperation('initiate', {
        method: 'POST',
        url: '/payments/initiate',
        data: payload
      }, startTime);

      const response = await apiService.post("/payments/initiate", formBody.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // Log the response
      paymentLogger.logPaymentResponse('initiate', response, startTime);

      if (!response.data.success) {
        throw new Error('Payment initiation failed');
      }

      return response.data;
    } catch (error) {
      // Log the error
      paymentLogger.logPaymentError('initiate', error, startTime);
      
      logger.error('Error initiating payment:', error);
      throw error;
    }
  }

  async createTransaction(payload: TransactionPayload): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Log the request
      paymentLogger.logPaymentOperation('createTransaction', {
        method: 'POST',
        url: '/transactions',
        data: payload
      }, startTime);

      const response = await apiService.post("/transactions", payload);
      
      // Log the response
      paymentLogger.logPaymentResponse('createTransaction', response, startTime);
      
      return response.data;
    } catch (error) {
      // Log the error
      paymentLogger.logPaymentError('createTransaction', error, startTime);
      
      logger.error('Error creating transaction:', error);
      throw error;
    }
  }

  async createPayment(payload: PaymentPayload): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Log the request
      paymentLogger.logPaymentOperation('createPayment', {
        method: 'POST',
        url: '/payments',
        data: payload
      }, startTime);

      const response = await apiService.post("/payments", payload);
      
      // Log the response
      paymentLogger.logPaymentResponse('createPayment', response, startTime);
      
      return response.data;
    } catch (error) {
      // Log the error
      paymentLogger.logPaymentError('createPayment', error, startTime);
      
      logger.error('Error creating payment:', error);
      throw error;
    }
  }

  async getLiveRates(): Promise<{ data: { data: { gold_rate: string } } }> {
    const startTime = Date.now();
    
    try {
      // Log the request
      paymentLogger.logPaymentOperation('getLiveRates', {
        method: 'GET',
        url: '/rates/live',
        data: null
      }, startTime);

      const response = await apiService.get("/rates/live");
      
      // Log the response
      paymentLogger.logPaymentResponse('getLiveRates', response, startTime);
      
      return response.data;
    } catch (error) {
      // Log the error
      paymentLogger.logPaymentError('getLiveRates', error, startTime);
      
      logger.error('Error fetching live rates:', error);
      throw error;
    }
  }
}

export default new PaymentService();

// Export the logger for external access
export { paymentLogger }; 
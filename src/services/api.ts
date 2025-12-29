// services/api.ts - Unified API Service
import { theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosInstance } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import NetInfo from '@react-native-community/netinfo';
import { showToast } from './notification';
import { Alert } from 'react-native';
import LoadingService from './loadingServices';
import useGlobalStore from '@/store/global.store';

import { logger } from '@/utils/logger';
// ============================================================================
// API LOGGER CLASS
// ============================================================================

class ApiLogger {
  private static instance: ApiLogger;
  private logs: Array<{
    timestamp: string;
    method: string;
    url: string;
    status?: number;
    duration?: number;
    requestData?: any;
    responseData?: any;
    error?: any;
    userId?: string;
  }> = [];

  static getInstance(): ApiLogger {
    if (!ApiLogger.instance) {
      ApiLogger.instance = new ApiLogger();
    }
    return ApiLogger.instance;
  }

  logRequest(config: InternalAxiosRequestConfig, startTime: number) {
    const requestData = this.safeParseRequestData(config.data);

    const logEntry = {
      timestamp: new Date().toISOString(),
      method: config.method?.toUpperCase() || 'UNKNOWN',
      url: config.url || 'UNKNOWN',
      requestData,
      startTime,
    };

    logger.log('🚀 API REQUEST:', {
      timestamp: logEntry.timestamp,
      method: logEntry.method,
      url: logEntry.url,
      data: logEntry.requestData,
      headers: config.headers,
    });

    this.logs.push(logEntry);
    return logEntry;
  }

  private safeParseRequestData(data: any): any {
    if (!data) return undefined;

    try {
      if (typeof data === 'object') {
        return data;
      } else if (typeof data === 'string') {
        // Optimization: heuristics to check if it looks like JSON before trying to parse
        // This prevents SyntaxErrors for regular strings like "undefined" or plain text
        const trimmed = data.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          return JSON.parse(data);
        }
        // If it doesn't look like JSON (e.g. "undefined", "null", plain text), just return it
        return data;
      } else {
        return String(data);
      }
    } catch (parseError) {
      // If parsing fails despite looking like JSON, just return the string representation
      // We silence the warning to prevent log noise for inevitable edge cases
      return String(data);
    }
  }

  logResponse(response: AxiosResponse, startTime: number) {
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: response.config.method?.toUpperCase() || 'UNKNOWN',
      url: response.config.url || 'UNKNOWN',
      status: response.status,
      duration,
      responseData: response.data,
    };

    logger.log('✅ API RESPONSE:', {
      timestamp: logEntry.timestamp,
      method: logEntry.method,
      url: logEntry.url,
      status: logEntry.status,
      duration: `${duration}ms`,
      data: logEntry.responseData,
    });

    // Update the last log entry
    const lastLog = this.logs[this.logs.length - 1];
    if (lastLog && lastLog.url === logEntry.url) {
      Object.assign(lastLog, logEntry);
    }

    return logEntry;
  }

  logError(error: AxiosError, startTime: number) {
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
      url: error.config?.url || 'UNKNOWN',
      status: error.response?.status,
      duration,
      error: {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      },
    };

    logger.log('❌ API ERROR:', {
      timestamp: logEntry.timestamp,
      method: logEntry.method,
      url: logEntry.url,
      status: logEntry.status,
      duration: `${duration}ms`,
      error: logEntry.error,
    });

    // Update the last log entry
    const lastLog = this.logs[this.logs.length - 1];
    if (lastLog && lastLog.url === logEntry.url) {
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

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  getApiSummary() {
    const totalRequests = this.logs.length;
    const successfulRequests = this.logs.filter(log => log.status && log.status >= 200 && log.status < 300).length;
    const failedRequests = this.logs.filter(log => log.error).length;
    const averageDuration = this.logs.reduce((sum, log) => sum + (log.duration || 0), 0) / totalRequests || 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      averageDuration: Math.round(averageDuration),
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const checkNetworkState = async () => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    Alert.alert(
      'No Internet Connection',
      'Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

const isPublicEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;

  const publicEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/check-mobile',
    '/auth/verify-otp',
    '/auth/refresh-token',
    '/register/complete',
    '/version/verify-version'
  ];
  return publicEndpoints.some(endpoint => url.includes(endpoint));
};

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

const checkTokenValidity = async () => {
  try {
    let token = await SecureStore.getItem("token");
    if (!token) {
      token = await SecureStore.getItem("accessToken");
    }

    if (!token || typeof token !== 'string' || token.trim() === '') {
      logger.log('No valid token found, but not logging out automatically');
      // Don't automatically logout - let the user continue
      return null;
    }

    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      logger.error("Invalid token format - not a valid JWT, but not logging out");
      // Don't automatically logout for invalid token format
      return null;
    }

    try {
      const tokenData = JSON.parse(atob(tokenParts[1]));
      const expirationTime = tokenData.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      logger.log('🔍 Token analysis:', {
        currentTime: new Date(currentTime).toISOString(),
        expirationTime: new Date(expirationTime).toISOString(),
        timeUntilExpiry: `${Math.round(timeUntilExpiry / 1000)} seconds`,
        isExpired: currentTime >= expirationTime
      });

      if (currentTime >= expirationTime) {
        logger.log('🔄 Token expired, attempting refresh...');
        const refreshToken = await SecureStore.getItem("refreshToken");
        if (refreshToken) {
          try {
            logger.log('🔄 Token expired, attempting refresh...');
            const response = await apiClient.post('/auth/refresh-token', { refreshToken });
            const newToken = response.data.token;
            const newAccessToken = response.data.accessToken;
            const newRefreshToken = response.data.refreshtoken;

            await SecureStore.setItem("token", newToken);
            await SecureStore.setItem("accessToken", newAccessToken);
            await SecureStore.setItem("refreshToken", newRefreshToken);
            await SecureStore.setItem("authToken", newToken);

            logger.log('✅ Token refreshed successfully');
            return newToken;
          } catch (error) {
            logger.log('❌ Token refresh failed, initiating automatic logout');
            logger.error('Token refresh error details:', error);
            // Token refresh failed, initiate automatic logout
            await handleLogout();
            return null;
          }
        } else {
          logger.log('❌ No refresh token available, initiating automatic logout');
          // No refresh token available, initiate automatic logout
          await handleLogout();
          return null;
        }
      } else {
        logger.log('✅ Token is still valid according to client-side validation');
        // Return the current token - let the server decide if it's valid
        return token;
      }
    } catch (error) {
      logger.error("Error parsing token:", error);
      // Don't automatically logout on parsing error
      return null;
    }

    return token;
  } catch (error) {
    logger.error("Error checking token:", error);
    // Don't automatically logout on error
    return null;
  }
};

const handleLogout = async () => {
  try {
    logger.log('🚪 Initiating automatic logout and clearing storage...');

    // Use the global store's logout function
    const logout = useGlobalStore.getState().logout;
    if (logout) {
      logger.log('🔄 Calling global store logout...');
      await logout();
    } else {
      logger.log('⚠️ Global store logout not available, clearing storage manually...');
      // Fallback: clear storage manually
      await SecureStore.deleteItemAsync("authToken");
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      await AsyncStorage.removeItem("userData");
      await AsyncStorage.removeItem("fcmToken");
      await AsyncStorage.removeItem("lastSentFcmToken");
      await AsyncStorage.removeItem("expoPushToken");
      await AsyncStorage.removeItem("expoPushTokenPayload");

      logger.log('✅ Storage cleared successfully');

      // Redirect to login screen
      router.replace("/(auth)/login");
    }
  } catch (error) {
    logger.error("❌ Logout error:", error);
    // Even if there's an error, try to redirect to login
    try {
      router.replace("/(auth)/login");
    } catch (redirectError) {
      logger.error("❌ Redirect error:", redirectError);
    }
  }
};

// ============================================================================
// API CLIENT SETUP
// ============================================================================

const apiLogger = ApiLogger.getInstance();

const apiClient: AxiosInstance = axios.create({
  baseURL: theme.baseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const startTime = Date.now();

    // Log the request
    apiLogger.logRequest(config, startTime);

    // Only show loading if not explicitly skipped via config
    // Use (config as any).skipLoading to skip the global loading overlay
    const skipLoading = (config as any).skipLoading === true;
    if (!skipLoading) {
      LoadingService.show();
    }
    (config as any)._skipLoading = skipLoading; // Store for response interceptor

    // Store start time for response logging
    (config as any).startTime = startTime;

    // Add authentication token
    try {
      let token = await SecureStore.getItemAsync("token");
      logger.log('🔑 Token from SecureStore (token):', token);

      if (!token) {
        token = await SecureStore.getItemAsync("accessToken");
        logger.log('🔑 Token from SecureStore (accessToken):', token);
      }

      if (!token) {
        token = await SecureStore.getItemAsync("authToken");
        logger.log('🔑 Token from SecureStore (authToken):', token);
      }

      if (token) {
        config.headers = config.headers || new axios.AxiosHeaders();
        config.headers.Authorization = `Bearer ${token}`;
        logger.log('✅ Authorization header set:', config.headers.Authorization);
      } else {
        logger.log('❌ No token found in SecureStore');
      }
    } catch (error) {
      logger.error('Error setting authorization header:', error);
    }

    return config;
  },
  (error: AxiosError) => {
    LoadingService.hide();
    logger.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const startTime = (response.config as any).startTime || Date.now();
    apiLogger.logResponse(response, startTime);

    // Only hide loading if it was shown (not skipped)
    const skipLoading = (response.config as any)._skipLoading === true;
    if (!skipLoading) {
      LoadingService.hide();
    }
    return response;
  },
  async (error: AxiosError) => {
    const startTime = (error.config as any)?.startTime || Date.now();
    apiLogger.logError(error, startTime);

    // Only hide loading if it was shown (not skipped)
    const skipLoading = (error.config as any)?._skipLoading === true;
    if (!skipLoading) {
      LoadingService.hide();
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      logger.log('401 Unauthorized - attempting token refresh');

      // Check if this is a public endpoint that shouldn't trigger token refresh
      const url = error.config?.url || '';
      if (isPublicEndpoint(url)) {
        logger.log('⚠️ 401 on public endpoint, skipping token refresh');
        return Promise.reject(error);
      }

      // Check if this is already a retry attempt to prevent infinite loops
      const isRetry = error.config?.headers?.['X-Retry-Attempt'];
      if (isRetry) {
        logger.log('❌ Already retried once, stopping to prevent infinite loop');
        LoadingService.hide(); // Ensure loading is hidden
        await handleLogout();
        return Promise.reject(error);
      }

      try {
        logger.log('🔄 Starting token refresh process...');
        const refreshToken = await SecureStore.getItem("refreshToken");

        if (!refreshToken) {
          logger.log('❌ No refresh token available, initiating logout');
          LoadingService.hide(); // Ensure loading is hidden
          await handleLogout();
          return Promise.reject(error);
        }

        // Attempt to refresh the token with timeout
        const refreshPromise = apiClient.post('/auth/refresh-token', { refreshToken });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Token refresh timeout')), 10000)
        );

        const response = await Promise.race([refreshPromise, timeoutPromise]) as any;
        const newToken = response.data.token;
        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshtoken;

        // Store new tokens
        await SecureStore.setItem("token", newToken);
        await SecureStore.setItem("accessToken", newAccessToken);
        await SecureStore.setItem("refreshToken", newRefreshToken);
        await SecureStore.setItem("authToken", newToken);

        logger.log('✅ Token refreshed successfully, retrying original request');

        // Retry the original request with new token
        if (error.config) {
          error.config.headers.Authorization = `Bearer ${newToken}`;
          error.config.headers['X-Retry-Attempt'] = 'true';
          return apiClient.request(error.config);
        } else {
          return Promise.reject(error);
        }
      } catch (refreshError) {
        logger.error('❌ Error during token refresh:', refreshError);
        logger.log('❌ Token refresh failed, initiating logout');
        LoadingService.hide(); // Ensure loading is hidden
        await handleLogout();
        return Promise.reject(error);
      }
    }

    // Handle network errors
    if (!error.response) {
      const isConnected = await checkNetworkState();
      if (!isConnected) {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// API FUNCTIONS
// ============================================================================

// Authentication APIs
export const authAPI = {
  checkMobile: async (mobileNumber: string) => {
    return apiClient.post('/auth/check-mobile', { mobile_number: mobileNumber });
  },

  verifyOtp: async (mobileNumber: string, otp: string) => {
    return apiClient.post('/auth/verify-otp', { mobile_number: mobileNumber, otp });
  },

  refreshToken: async (refreshToken: string) => {
    return apiClient.post('/auth/refresh-token', { refreshToken });
  },

  logout: async () => {
    return apiClient.post('/auth/logout');
  }
};

// User APIs
export const userAPI = {
  getProfile: async () => {
    return apiClient.get('/user/profile');
  },

  updateProfile: async (userData: any) => {
    return apiClient.put('/user/profile', userData);
  },

  deactivateUser: async (userId: number | string) => {
    return apiClient.post(`/deactivateUser/${userId}`);
  },

  uploadProfileImage: async (userId: number | string, fileUri: string) => {
    try {
      // Extract file extension from URI
      const uriParts = fileUri.split('.');
      const fileExtension = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';

      // Determine MIME type based on extension
      let mimeType = 'image/jpeg';
      let fileName = 'profile.jpg';

      if (fileExtension === 'png') {
        mimeType = 'image/png';
        fileName = 'profile.png';
      } else if (fileExtension === 'gif') {
        mimeType = 'image/gif';
        fileName = 'profile.gif';
      } else if (fileExtension === 'webp') {
        mimeType = 'image/webp';
        fileName = 'profile.webp';
      }

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: fileName,
      } as any);
      formData.append('userId', userId.toString());

      logger.log('Uploading with formData:', {
        userId: userId.toString(),
        fileName,
        mimeType,
        uri: fileUri
      });

      return apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
    } catch (error) {
      logger.error('Error in uploadProfileImage:', error);
      throw error;
    }
  },

  updateFcmTokenWithCompleteData: async (payload: any, userId: number | string, deviceType: string) => {
    return apiClient.post('/notifications/token', {
      // ...payload,
      token: payload?.deviceToken,
      userId: userId,
      device_type: deviceType
    });
  },
  // Notifications API
  getNotifications: async (userId: number | string) => {
    return apiClient.get(`/notifications/${userId}`);
  },

  markNotificationAsRead: async (notificationId: string) => {
    return apiClient.put(`/notifications/${notificationId}`);
  },

  deleteNotification: async (notificationId: string) => {
    return apiClient.delete(`/notifications/${notificationId}`);
  },

  markAllNotificationsAsRead: async () => {
    return apiClient.put('/notifications/mark-all-read');
  }
};

// Investment APIs
export const investmentAPI = {
  getInvestmentsByUser: async (userId: number | string) => {
    return apiClient.get(`/investments/user/${userId}`);
  },

  getInvestmentDetails: async (investmentId: number | string) => {
    return apiClient.get(`/investments/${investmentId}`);
  },

  createInvestment: async (investmentData: any) => {
    return apiClient.post('/investments', investmentData);
  }
};

// Payment APIs
export const paymentAPI = {
  processPayment: async (amount: number | string) => {
    return apiClient.post('/payments/process', { amount });
  },

  getPaymentHistory: async () => {
    return apiClient.get('/payments/history');
  },

  getPaymentStatus: async (paymentId: string) => {
    return apiClient.get(`/payments/status/${paymentId}`);
  },

  generateInvoice: async (invoiceData: {
    transactionId: number | string;
  }) => {
    return apiClient.post('/payments/generate-invoice', invoiceData, {
      responseType: 'blob', // Important for file downloads
      timeout: 30000, // 30 second timeout for file generation
    });
  }
};

// Maintenance APIs
export const maintenanceAPI = {
  checkMaintenanceStatus: async () => {
    return apiClient.get('/maintenance/status');
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default apiClient;
export { apiLogger, checkTokenValidity, handleLogout, checkNetworkState };
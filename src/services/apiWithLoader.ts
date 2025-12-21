import api from './api';
import LoadingService from './loadingServices';

// Enhanced API wrapper that shows context-specific loading messages
export const apiWithLoader = {
  // Authentication APIs
  auth: {
    login: async (credentials: any) => {
      return LoadingService.withLoading(
        () => api.post('/auth/login', credentials),
        'Signing you in...'
      );
    },
    register: async (userData: any) => {
      return LoadingService.withLoading(
        () => api.post('/auth/register', userData),
        'Creating your account...'
      );
    },
    logout: async () => {
      return LoadingService.withLoading(
        () => api.post('/auth/logout'),
        'Signing out...'
      );
    },
    verifyMpin: async (mpin: string) => {
      return LoadingService.withLoading(
        () => api.post('/auth/verify-mpin', { mpin }),
        'Verifying MPIN...'
      );
    },
  },

  // Investment APIs
  investments: {
    getUserInvestments: async (userId: string) => {
      return LoadingService.withLoading(
        () => api.get(`/investments/user_investments/${userId}`),
        'Loading your investments...'
      );
    },
    createInvestment: async (investmentData: any) => {
      return LoadingService.withLoading(
        () => api.post('/investments', investmentData),
        'Creating your investment...'
      );
    },
    getInvestmentDetails: async (investmentId: string) => {
      return LoadingService.withLoading(
        () => api.get(`/investments/${investmentId}`),
        'Loading investment details...'
      );
    },
    checkPayment: async (payload: any) => {
      return LoadingService.withLoading(
        () => api.post('/investments/check-payment', payload),
        'Verifying payment status...'
      );
    },
  },

  // Payment APIs
  payments: {
    initiate: async (paymentData: any) => {
      return LoadingService.withLoading(
        () => api.post('/payments/initiate', paymentData),
        'Initiating payment...'
      );
    },
    createPayment: async (paymentData: any) => {
      return LoadingService.withLoading(
        () => api.post('/payments', paymentData),
        'Processing payment...'
      );
    },
    getPaymentHistory: async (userId: string) => {
      return LoadingService.withLoading(
        () => api.get(`/payments/history/${userId}`),
        'Loading payment history...'
      );
    },
  },

  // Scheme APIs
  schemes: {
    getActiveSchemes: async () => {
      return LoadingService.withLoading(
        () => api.get('/schemes/active'),
        'Loading savings schemes...'
      );
    },
    getSchemeDetails: async (schemeId: string) => {
      return LoadingService.withLoading(
        () => api.get(`/schemes/${schemeId}`),
        'Loading scheme details...'
      );
    },
  },

  // Gold Rate APIs
  rates: {
    getLiveRates: async () => {
      return LoadingService.withLoading(
        () => api.get('/rates/live'),
        'Updating gold rates...'
      );
    },
    getRateHistory: async (period: string) => {
      return LoadingService.withLoading(
        () => api.get(`/rates/history?period=${period}`),
        'Loading rate history...'
      );
    },
  },

  // Transaction APIs
  transactions: {
    createTransaction: async (transactionData: any) => {
      return LoadingService.withLoading(
        () => api.post('/transactions', transactionData),
        'Recording transaction...'
      );
    },
    getUserTransactions: async (userId: string) => {
      return LoadingService.withLoading(
        () => api.get(`/transactions/user/${userId}`),
        'Loading transactions...'
      );
    },
  },

  // User Profile APIs
  user: {
    getProfile: async () => {
      return LoadingService.withLoading(
        () => api.get('/users/profile'),
        'Loading your profile...'
      );
    },
    updateProfile: async (userId: number, userData: any) => {
      return LoadingService.withLoading(
        () => api.put(`/users/${userId}`, userData),
        'Updating your profile...'
      );
    },
    updateFcmToken: async (fcmToken: string, userId: number, deviceType: string) => {
      return LoadingService.withLoading(
        () => api.post('/notifications/token', { userId, token: fcmToken, device_type: deviceType }),
        'Updating notifications...'
      );
    },
  },

  // Content APIs
  content: {
    getNews: async () => {
      return LoadingService.withLoading(
        () => api.get('/news'),
        'Loading latest news...'
      );
    },
    getBanners: async () => {
      return LoadingService.withLoading(
        () => api.get('/banners'),
        'Loading banners...'
      );
    },
    getVideos: async () => {
      return LoadingService.withLoading(
        () => api.get('/videos/active'),
        'Loading featured video...'
      );
    },
    getPolicies: async (type: string) => {
      return LoadingService.withLoading(
        () => api.get(`/policies/${type}`),
        'Loading policy information...'
      );
    },
  },

  // KYC APIs
  kyc: {
    submitKyc: async (kycData: any) => {
      return LoadingService.withLoading(
        () => api.post('/kyc/submit', kycData),
        'Submitting KYC documents...'
      );
    },
    getKycStatus: async (userId: string) => {
      return LoadingService.withLoading(
        () => api.get(`/kyc/status/${userId}`),
        'Checking KYC status...'
      );
    },
  },

  // Generic API methods
  get: async (url: string, message?: string) => {
    return LoadingService.withLoading(
      () => api.get(url),
      message || 'Loading data...'
    );
  },

  post: async (url: string, data: any, message?: string) => {
    return LoadingService.withLoading(
      () => api.post(url, data),
      message || 'Saving data...'
    );
  },

  put: async (url: string, data: any, message?: string) => {
    return LoadingService.withLoading(
      () => api.put(url, data),
      message || 'Updating data...'
    );
  },

  delete: async (url: string, message?: string) => {
    return LoadingService.withLoading(
      () => api.delete(url),
      message || 'Deleting data...'
    );
  },
};

export default apiWithLoader; 
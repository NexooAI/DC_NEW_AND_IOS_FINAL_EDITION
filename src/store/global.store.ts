import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppLocale, changeLocale } from '@/i18n'; // Import changeLocale function instead of i18n
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { logger } from '@/utils/logger';

// Payment retry data interface
interface PaymentRetryData {
  // Payment payload data
  paymentData: {
    amount: number;
    userId: string | number;
    investmentId: string | number;
    schemeId: string | number;
    chitId: string | number;
    userEmail: string;
    userMobile: string;
    userName: string;
  };

  // Investment payload data
  investmentData: {
    userId: string | number;
    schemeId: string | number;
    chitId: string | number;
    accountName: string;
    accountNo: string;
    paymentAmount: number;
    investmentId: string | number;
  };

  // Transaction payload data
  transactionData: {
    userId: string | number;
    investmentId: string | number;
    schemeId: string | number;
    chitId: string | number;
    accountNumber: string;
    amount: number;
  };

  // UI/Display data
  displayData: {
    schemeName: string;
    accountHolder: string;
    accNo: string;
    totalPaid: string;
    monthsPaid: string;
    noOfIns: string;
    goldWeight: string;
    maturityDate: string;
  };

  // Metadata
  timestamp: string;
  source: string;
}

// Current payment session interface
interface PaymentSession {
  amount: number;
  userDetails: {
    accountname: string;
    accNo: string;
    name: string;
    mobile: string;
    email: string;
    userId: string | number;
    investmentId: string | number;
    chitId: string | number;
    schemeId: string | number;
    isRetryAttempt: boolean;
    originalPaymentTimestamp?: string;
    retryTimestamp?: string;
    source: string;
    retryData?: PaymentRetryData;
  };
  timestamp: string;
}

interface GlobalStore {
  isLoggedIn: boolean;
  token: string | null;
  user: {
    id?: string;
    name?: string;
    email?: string;
    mobile?: number;
    profileImage: string;
    idProof: string;
    referralCode: string;
    rewards: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    birth?: string;
    gender?: string;
  } | null;
  language: AppLocale;

  // Payment retry data
  paymentRetryData: PaymentRetryData | null;
  currentPaymentSession: PaymentSession | null;

  // Auth functions
  login: (token: string, user: any) => void;
  logout: () => void;
  setLanguage: (lang: AppLocale) => Promise<void>;
  updateUser: (user: any) => void;

  // Payment retry functions
  storePaymentRetryData: (data: PaymentRetryData) => void;
  storePaymentSession: (session: PaymentSession) => void;
  clearPaymentRetryData: () => void;
  clearPaymentSession: () => void;
  hasPaymentRetryData: () => boolean;
  getPaymentRetryData: () => PaymentRetryData | null;
  getCurrentPaymentSession: () => PaymentSession | null;

  // Tab visibility
  isTabVisible: boolean;
  setTabVisibility: (visible: boolean) => void;

  // Cache for rates and schemes
  cachedRates: {
    data: any;
    timestamp: number;
  } | null;
  cachedSchemes: {
    data: any[];
    timestamp: number;
  } | null;

  // Cache functions
  setCachedRates: (data: any) => void;
  setCachedSchemes: (data: any[]) => void;
  getCachedRates: () => { data: any; timestamp: number } | null;
  getCachedSchemes: () => { data: any[]; timestamp: number } | null;
  clearCachedRates: () => void;
  clearCachedSchemes: () => void;
  isRatesCacheValid: (maxAge?: number) => boolean;
  isSchemesCacheValid: (maxAge?: number) => boolean;


  // Debug function
  debugState: () => GlobalStore;
}

const useGlobalStore = create<GlobalStore>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      token: null,
      user: null,
      language: 'en',

      // Payment retry data
      paymentRetryData: null,
      currentPaymentSession: null,

      // Auth functions
      login: async (token, user) => {
        logger.auth('🔍 Global Store: Login called with token:', token ? 'present' : 'missing');
        logger.auth('🔍 Global Store: Login called with user:', user);
        await SecureStore.setItemAsync('authToken', token);
        const userWithDefaults = {
          idProof: "",
          referralCode: "",
          rewards: 0,
          ...user,
          // Handle profile_photo field from local storage
          profileImage: user.profile_photo || user.profileImage || ""
        };
        logger.auth('🔍 Global Store: Setting user with defaults:', userWithDefaults);
        set({ isLoggedIn: true, token, user: userWithDefaults })
      },
      logout: async () => {
        logger.auth('🔍 Global Store: Logout called');

        try {
          // Clear all authentication data from SecureStore
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('refreshToken');

          // Clear all FCM and notification data from AsyncStorage
          await AsyncStorage.removeItem('userData');
          await AsyncStorage.removeItem('fcmToken');
          await AsyncStorage.removeItem('lastSentFcmToken');
          await AsyncStorage.removeItem('expoPushToken');
          await AsyncStorage.removeItem('expoPushTokenPayload');

          // Note: user_mpin is no longer stored locally, it's on server
          set({
            isLoggedIn: false,
            token: null,
            user: null,
            // Clear payment data on logout
            paymentRetryData: null,
            currentPaymentSession: null,
          });

          logger.auth('✅ Global Store: Logout completed - all data cleared');

          // Redirect to login screen
          try {
            router.replace("/(auth)/login");
          } catch (redirectError) {
            logger.error('❌ Error redirecting to login:', redirectError);
          }
        } catch (error) {
          logger.error('❌ Error during global store logout:', error);
          // Even if there's an error, clear the state
          set({
            isLoggedIn: false,
            token: null,
            user: null,
            paymentRetryData: null,
            currentPaymentSession: null,
          });

          // Try to redirect to login even on error
          try {
            router.replace("/(auth)/login");
          } catch (redirectError) {
            logger.error('❌ Error redirecting to login:', redirectError);
          }
        }
      },
      setLanguage: async (lang) => {
        await changeLocale(lang);
        set({ language: lang });
      },
      updateUser: (user: any) => set((state) => ({
        user: {
          idProof: "",
          referralCode: "",
          rewards: 0,
          ...state.user,
          ...user,
          // Handle profile_photo field from local storage
          profileImage: user.profile_photo || user.profileImage || state.user?.profileImage || ""
        }
      })),

      // Payment retry functions
      storePaymentRetryData: (data: PaymentRetryData) => {
        //logger.log('Storing payment retry data in global store:', data);
        set({ paymentRetryData: data });
      },

      storePaymentSession: (session: PaymentSession) => {
        //logger.log('Storing payment session in global store:', session);
        set({ currentPaymentSession: session });
      },

      clearPaymentRetryData: () => {
        //logger.log('Clearing payment retry data from global store');
        set({ paymentRetryData: null });
      },

      clearPaymentSession: () => {
        //logger.log('Clearing payment session from global store');
        set({ currentPaymentSession: null });
      },

      hasPaymentRetryData: () => {
        const state = get();
        return state.paymentRetryData !== null;
      },

      getPaymentRetryData: () => {
        const state = get();
        return state.paymentRetryData;
      },

      getCurrentPaymentSession: () => {
        const state = get();
        return state.currentPaymentSession;
      },

      // Tab visibility
      isTabVisible: true,
      setTabVisibility: (visible: boolean) => set({ isTabVisible: visible }),

      // Cache for rates and schemes
      cachedRates: null,
      cachedSchemes: null,

      // Cache functions
      setCachedRates: (data: any) => {
        set({
          cachedRates: {
            data,
            timestamp: Date.now(),
          },
        });
        logger.log("📦 [Cache] Gold rates cached", { timestamp: Date.now() });
      },

      setCachedSchemes: (data: any[]) => {
        set({
          cachedSchemes: {
            data,
            timestamp: Date.now(),
          },
        });
        logger.log("📦 [Cache] Schemes cached", {
          count: data.length,
          timestamp: Date.now()
        });
      },

      getCachedRates: () => {
        const state = get();
        return state.cachedRates;
      },

      getCachedSchemes: () => {
        const state = get();
        return state.cachedSchemes;
      },

      clearCachedRates: () => {
        set({ cachedRates: null });
        logger.log("📦 [Cache] Gold rates cache cleared");
      },

      clearCachedSchemes: () => {
        set({ cachedSchemes: null });
        logger.log("📦 [Cache] Schemes cache cleared");
      },

      isRatesCacheValid: (maxAge: number = 5 * 60 * 1000) => {
        // Default 5 minutes cache for rates
        const state = get();
        if (!state.cachedRates) return false;
        const age = Date.now() - state.cachedRates.timestamp;
        return age < maxAge;
      },

      isSchemesCacheValid: (maxAge: number = 30 * 60 * 1000) => {
        // Default 30 minutes cache for schemes
        const state = get();
        if (!state.cachedSchemes) return false;
        const age = Date.now() - state.cachedSchemes.timestamp;
        return age < maxAge;
      },


      // Debug function to check current state
      debugState: () => {
        const state = get();
        logger.log('🔍 Global Store Debug State:');
        logger.log('  isLoggedIn:', state.isLoggedIn);
        logger.log('  token:', state.token ? 'present' : 'missing');
        logger.log('  user:', state.user);
        logger.log('  user.id:', state.user?.id);
        return state;
      },
    }),
    {
      name: 'global-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        language: state.language,
        user: state.user,
        // Persisting header config can lead to stale UI after restart; avoid persisting it
        // Don't persist payment data for security
        // paymentRetryData and currentPaymentSession will be lost on app restart
      })
    }
  )
);

export default useGlobalStore
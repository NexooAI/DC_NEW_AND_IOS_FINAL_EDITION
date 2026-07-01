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
    branch_id?: number | null;
    allow_multi_branch?: number | null;
    mpinStatus?: boolean;
    usertype?: string;
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

  // Cache for rates, schemes, and visibility
  cachedRates: {
    data: any;
    timestamp: number;
  } | null;
  cachedSchemes: {
    data: any[];
    timestamp: number;
  } | null;
  cachedVisibility: {
    data: any;
    timestamp: number;
  } | null;
  cachedBranches: {
    data: any[];
    timestamp: number;
  } | null;
  cachedAboutPage: {
    data: any;
    timestamp: number;
  } | null;

  // Cache functions
  setCachedRates: (data: any) => void;
  setCachedSchemes: (data: any[]) => void;
  setCachedVisibility: (data: any) => void;
  getCachedRates: () => { data: any; timestamp: number } | null;
  getCachedSchemes: () => { data: any[]; timestamp: number } | null;
  getCachedVisibility: () => { data: any; timestamp: number } | null;
  clearCachedRates: () => void;
  clearCachedSchemes: () => void;
  clearCachedVisibility: () => void;
  isRatesCacheValid: (maxAge?: number) => boolean;
  isSchemesCacheValid: (maxAge?: number) => boolean;
  isVisibilityCacheValid: (maxAge?: number) => boolean;
  setCachedBranches: (data: any[]) => void;
  setCachedAboutPage: (data: any) => void;
  getCachedBranches: () => { data: any[]; timestamp: number } | null;
  getCachedAboutPage: () => { data: any; timestamp: number } | null;
  clearCachedBranches: () => void;
  clearCachedAboutPage: () => void;
  isBranchesCacheValid: (maxAge?: number) => boolean;
  isAboutPageCacheValid: (maxAge?: number) => boolean;

  // Chat Support visibility
  isChatOpen: boolean;
  setChatOpen: (open: boolean) => void;

  // Unread Notifications Count
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: (count: number) => void;

  // Debug function
  debugState: () => GlobalStore;

  // App Config
  appConfig: any | null;
  setAppConfig: (config: any) => void;
  themeMode: 'light' | 'dark';
  toggleThemeMode: () => void;
}

const useGlobalStore = create<GlobalStore>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      token: null,
      user: null,
      language: 'en',
      appConfig: null,
      setAppConfig: (config: any) => set({ appConfig: config }),
      themeMode: 'light',
      toggleThemeMode: () => set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),

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
          await SecureStore.deleteItemAsync('user_mpin');
          await SecureStore.deleteItemAsync('user_biometric_mpin');

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
            // Clear payment data and caches on logout
            paymentRetryData: null,
            currentPaymentSession: null,
            cachedRates: null,
            cachedSchemes: null,
            cachedVisibility: null,
            cachedBranches: null,
            cachedAboutPage: null,
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

      // Cache for rates, schemes, and visibility
      cachedRates: null,
      cachedSchemes: null,
      cachedVisibility: null,
      cachedBranches: null,
      cachedAboutPage: null,

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

      setCachedVisibility: (data: any) => {
        set({
          cachedVisibility: {
            data,
            timestamp: Date.now(),
          },
        });
        logger.log("📦 [Cache] Visibility data cached", { timestamp: Date.now() });
      },

      getCachedRates: () => {
        const state = get();
        return state.cachedRates;
      },

      getCachedSchemes: () => {
        const state = get();
        return state.cachedSchemes;
      },

      getCachedVisibility: () => {
        const state = get();
        return state.cachedVisibility;
      },

      clearCachedRates: () => {
        set({ cachedRates: null });
        logger.log("📦 [Cache] Gold rates cache cleared");
      },

      clearCachedSchemes: () => {
        set({ cachedSchemes: null });
        logger.log("📦 [Cache] Schemes cache cleared");
      },

      clearCachedVisibility: () => {
        set({ cachedVisibility: null });
        logger.log("📦 [Cache] Visibility cache cleared");
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

      isVisibilityCacheValid: (maxAge: number = 15 * 60 * 1000) => {
        // Default 15 minutes cache for visibility config
        const state = get();
        if (!state.cachedVisibility) return false;
        const age = Date.now() - state.cachedVisibility.timestamp;
        return age < maxAge;
      },

      setCachedBranches: (data: any[]) => {
        set({
          cachedBranches: {
            data,
            timestamp: Date.now(),
          },
        });
        logger.log("📦 [Cache] Branches cached", {
          count: data.length,
          timestamp: Date.now()
        });
      },

      setCachedAboutPage: (data: any) => {
        set({
          cachedAboutPage: {
            data,
            timestamp: Date.now(),
          },
        });
        logger.log("📦 [Cache] About page cached", { timestamp: Date.now() });
      },

      getCachedBranches: () => {
        const state = get();
        return state.cachedBranches;
      },

      getCachedAboutPage: () => {
        const state = get();
        return state.cachedAboutPage;
      },

      clearCachedBranches: () => {
        set({ cachedBranches: null });
        logger.log("📦 [Cache] Branches cache cleared");
      },

      clearCachedAboutPage: () => {
        set({ cachedAboutPage: null });
        logger.log("📦 [Cache] About page cache cleared");
      },

      isBranchesCacheValid: (maxAge: number = 24 * 60 * 60 * 1000) => {
        // Default 24 hours cache for branches
        const state = get();
        if (!state.cachedBranches) return false;
        const age = Date.now() - state.cachedBranches.timestamp;
        return age < maxAge;
      },

      isAboutPageCacheValid: (maxAge: number = 12 * 60 * 60 * 1000) => {
        // Default 12 hours cache for about page
        const state = get();
        if (!state.cachedAboutPage) return false;
        const age = Date.now() - state.cachedAboutPage.timestamp;
        return age < maxAge;
      },

      // Chat Support visibility
      isChatOpen: false,
      setChatOpen: (open: boolean) => set({ isChatOpen: open }),

      // Unread Notifications Count
      unreadNotificationsCount: 0,
      setUnreadNotificationsCount: (count: number) => set({ unreadNotificationsCount: count }),

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
        themeMode: state.themeMode,
      })
    }
  )
);

export default useGlobalStore;

// Dynamic configuration helper (non-reactive)
import { theme, lightPalette, darkPalette } from '@/constants/theme';
import { useMemo } from 'react';

export const getAppConfig = () => {
  const storeConfig = useGlobalStore.getState().appConfig;
  const themeMode = useGlobalStore.getState().themeMode;
  const basePalette = themeMode === 'dark' ? darkPalette : lightPalette;
  
  if (storeConfig) {
    return {
      ...theme,
      colors: {
        ...basePalette,
        ...storeConfig.colors,
      },
      constants: {
        ...theme.constants,
        ...storeConfig.brand,
        ...storeConfig.features,
      },
      gradients: {
        ...basePalette,
        ...storeConfig.gradients,
      },
      youtubeUrl: storeConfig.brand?.youtubeUrl || theme.youtubeUrl,
      baseUrl: storeConfig.brand?.baseUrl || theme.baseUrl,
    };
  }
  return {
    ...theme,
    colors: basePalette,
  };
};

// Dynamic hook (reactive to store changes)
export const useAppTheme = () => {
  const appConfig = useGlobalStore((state) => state.appConfig);
  const themeMode = useGlobalStore((state) => state.themeMode);
  
  return useMemo(() => {
    const basePalette = themeMode === 'dark' ? darkPalette : lightPalette;
    if (appConfig) {
      return {
        ...theme,
        colors: {
          ...basePalette,
          ...appConfig.colors,
        },
        constants: {
          ...theme.constants,
          ...appConfig.brand,
          ...appConfig.features,
        },
        gradients: {
          ...basePalette,
          ...appConfig.gradients,
        },
        youtubeUrl: appConfig.brand?.youtubeUrl || theme.youtubeUrl,
        baseUrl: appConfig.brand?.baseUrl || theme.baseUrl,
      };
    }
    return {
      ...theme,
      colors: basePalette,
    };
  }, [appConfig, themeMode]);
};
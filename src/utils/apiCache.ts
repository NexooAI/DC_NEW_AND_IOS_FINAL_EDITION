import api from '@/services/api';
import useGlobalStore from '@/store/global.store';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  RATES: {
    MAX_AGE: 5 * 60 * 1000, // 5 minutes
    ENDPOINT: '/rates/current',
  },
  SCHEMES: {
    MAX_AGE: 30 * 60 * 1000, // 30 minutes
    ENDPOINT: '/schemes/active',
  },
  BRANCHES: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    ENDPOINT: '/branches',
  },
  ABOUT_PAGE: {
    MAX_AGE: 12 * 60 * 60 * 1000, // 12 hours
    ENDPOINT: '/about-page/latest',
  },
};

/**
 * Fetch gold rates with caching
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Promise with gold rate data
 */
export const fetchGoldRatesWithCache = async (forceRefresh: boolean = false) => {
  const store = useGlobalStore.getState();

  // Check cache first if not forcing refresh
  if (!forceRefresh && store.isRatesCacheValid(CACHE_CONFIG.RATES.MAX_AGE)) {
    const cached = store.getCachedRates();
    logger.log("📦 [Cache] Using cached gold rates", {
      age: Date.now() - (cached?.timestamp || 0),
      cached: !!cached,
    });
    return cached?.data;
  }

  try {
    logger.log("📡 [API] Fetching gold rates from API...");
    const response = await api.get(CACHE_CONFIG.RATES.ENDPOINT);
    
    if (response?.data?.data) {
      // Cache the response
      store.setCachedRates(response.data.data);
      logger.log("✅ [API] Gold rates fetched and cached", {
        gold_rate: response.data.data.gold_rate,
      });
      return response.data.data;
    }

    // If API fails but we have cached data, return it
    const cached = store.getCachedRates();
    if (cached) {
      logger.warn("⚠️ [API] API failed, using stale cached gold rates");
      return cached.data;
    }

    throw new Error("No gold rate data available");
  } catch (error) {
    logger.error("❌ [API] Error fetching gold rates:", error);
    
    // Return cached data even if expired as fallback
    const cached = store.getCachedRates();
    if (cached) {
      logger.warn("⚠️ [API] Using expired cached gold rates as fallback");
      return cached.data;
    }

    throw error;
  }
};

/**
 * Fetch schemes with caching
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Promise with schemes array
 */
export const fetchSchemesWithCache = async (forceRefresh: boolean = false) => {
  const store = useGlobalStore.getState();

  // Check cache first if not forcing refresh
  if (!forceRefresh && store.isSchemesCacheValid(CACHE_CONFIG.SCHEMES.MAX_AGE)) {
    const cached = store.getCachedSchemes();
    logger.log("📦 [Cache] Using cached schemes", {
      count: cached?.data?.length || 0,
      age: Date.now() - (cached?.timestamp || 0),
    });
    return cached?.data || [];
  }

  try {
    logger.log("📡 [API] Fetching schemes from API...");
    const response = await api.get(CACHE_CONFIG.SCHEMES.ENDPOINT);
    
    if (response?.data?.data && Array.isArray(response.data.data)) {
      // Cache the response
      store.setCachedSchemes(response.data.data);
      logger.log("✅ [API] Schemes fetched and cached", {
        count: response.data.data.length,
      });
      return response.data.data;
    }

    // If API fails but we have cached data, return it
    const cached = store.getCachedSchemes();
    if (cached && Array.isArray(cached.data)) {
      logger.warn("⚠️ [API] API failed, using stale cached schemes");
      return cached.data;
    }

    throw new Error("No schemes data available");
  } catch (error) {
    logger.error("❌ [API] Error fetching schemes:", error);
    
    // Return cached data even if expired as fallback
    const cached = store.getCachedSchemes();
    if (cached && Array.isArray(cached.data)) {
      logger.warn("⚠️ [API] Using expired cached schemes as fallback");
      return cached.data;
    }

    return []; // Return empty array on error
  }
};

/**
 * Fetch branches with caching
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Promise with branches data
 */
export const fetchBranchesWithCache = async (forceRefresh: boolean = false) => {
  const store = useGlobalStore.getState();

  // Check cache first if not forcing refresh
  if (!forceRefresh && store.isBranchesCacheValid(CACHE_CONFIG.BRANCHES.MAX_AGE)) {
    const cached = store.getCachedBranches();
    logger.log("📦 [Cache] Using cached branches", {
      age: Date.now() - (cached?.timestamp || 0),
      cached: !!cached,
    });
    return cached?.data;
  }

  try {
    logger.log("📡 [API] Fetching branches from API...");
    const response = await api.get(CACHE_CONFIG.BRANCHES.ENDPOINT);
    
    if (response?.data?.data) {
      // Cache the response
      store.setCachedBranches(response.data.data);
      logger.log("✅ [API] Branches fetched and cached", {
        count: response.data.data.length,
      });
      return response.data.data;
    }

    // If API fails but we have cached data, return it
    const cached = store.getCachedBranches();
    if (cached) {
      logger.warn("⚠️ [API] API failed, using stale cached branches");
      return cached.data;
    }

    throw new Error("No branches data available");
  } catch (error) {
    logger.error("❌ [API] Error fetching branches:", error);
    
    // Return cached data even if expired as fallback
    const cached = store.getCachedBranches();
    if (cached) {
      logger.warn("⚠️ [API] Using expired cached branches as fallback");
      return cached.data;
    }

    throw error;
  }
};

/**
 * Fetch about page with caching
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Promise with about page data
 */
export const fetchAboutPageWithCache = async (forceRefresh: boolean = false) => {
  const store = useGlobalStore.getState();

  // Check cache first if not forcing refresh
  if (!forceRefresh && store.isAboutPageCacheValid(CACHE_CONFIG.ABOUT_PAGE.MAX_AGE)) {
    const cached = store.getCachedAboutPage();
    logger.log("📦 [Cache] Using cached about page", {
      age: Date.now() - (cached?.timestamp || 0),
      cached: !!cached,
    });
    return cached?.data;
  }

  try {
    logger.log("📡 [API] Fetching about page from API...");
    const response = await api.get(CACHE_CONFIG.ABOUT_PAGE.ENDPOINT);
    
    if (response?.data?.data) {
      // Cache the response
      store.setCachedAboutPage(response.data.data);
      logger.log("✅ [API] About page fetched and cached");
      return response.data.data;
    }

    // If API fails but we have cached data, return it
    const cached = store.getCachedAboutPage();
    if (cached) {
      logger.warn("⚠️ [API] API failed, using stale cached about page");
      return cached.data;
    }

    throw new Error("No about page data available");
  } catch (error) {
    logger.error("❌ [API] Error fetching about page:", error);
    
    // Return cached data even if expired as fallback
    const cached = store.getCachedAboutPage();
    if (cached) {
      logger.warn("⚠️ [API] Using expired cached about page as fallback");
      return cached.data;
    }

    throw error;
  }
};

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
  const store = useGlobalStore.getState();
  store.clearCachedRates();
  store.clearCachedSchemes();
  store.clearCachedBranches();
  store.clearCachedAboutPage();
  logger.log("📦 [Cache] All caches cleared");
};

/**
 * Clear rates cache
 */
export const clearRatesCache = () => {
  const store = useGlobalStore.getState();
  store.clearCachedRates();
};

/**
 * Clear schemes cache
 */
export const clearSchemesCache = () => {
  const store = useGlobalStore.getState();
  store.clearCachedSchemes();
};

/**
 * Clear branches cache
 */
export const clearBranchesCache = () => {
  const store = useGlobalStore.getState();
  store.clearCachedBranches();
};

/**
 * Clear about page cache
 */
export const clearAboutPageCache = () => {
  const store = useGlobalStore.getState();
  store.clearCachedAboutPage();
};

/**
 * Fetch policies with caching (T&C, Privacy Policy, Advance Booking Terms, etc.)
 * @param type - The policy type (e.g. 'advance_booking_terms', 'our_policy', 'privacy_policy')
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Promise with policy data
 */
export const fetchPolicyWithCache = async (type: string, forceRefresh: boolean = false) => {
  const cacheKey = `@policy_cache_${type}`;
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  if (!forceRefresh) {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < maxAge) {
          logger.log(`📦 [Cache] Using cached policy: ${type}`, { age });
          return data;
        }
      }
    } catch (cacheErr) {
      logger.error(`Error reading policy cache for ${type}:`, cacheErr);
    }
  }

  try {
    logger.log(`📡 [API] Fetching policy from API: ${type}...`);
    const response = await api.get(`/policies/type/${type}`);
    if (response?.data?.data) {
      const cacheData = {
        data: response.data.data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      logger.log(`✅ [API] Policy fetched and cached: ${type}`);
      return response.data.data;
    }
  } catch (error) {
    logger.error(`❌ [API] Error fetching policy ${type}:`, error);
    // Fallback: try to return stale cache if available
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        logger.warn(`⚠️ [API] Using stale cached policy for ${type} as fallback`);
        return JSON.parse(cached).data;
      }
    } catch (e) {}
    throw error;
  }
};


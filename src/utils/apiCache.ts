import api from '@/services/api';
import useGlobalStore from '@/store/global.store';
import { logger } from '@/utils/logger';

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
    ENDPOINT: '/schemes',
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
 * Clear all caches
 */
export const clearAllCaches = () => {
  const store = useGlobalStore.getState();
  store.clearCachedRates();
  store.clearCachedSchemes();
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


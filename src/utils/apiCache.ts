import api from '@/services/api';
import useGlobalStore from '@/store/global.store';
import { logger } from '@/utils/logger';
import { APP_CONFIG } from '@/constants/appConfig';
import { themeConfig } from '@/constants/theme.config';

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
  APP_CONFIG: {
    MAX_AGE: 12 * 60 * 60 * 1000, // 12 hours
    ENDPOINT: '/config/settings',
  },
};

/**
 * Default fallback about page data constructed from tenant configuration
 */
export const getDefaultAboutPageData = () => {
  const storeName = APP_CONFIG.appName || themeConfig?.customerName || "Jeyabala Jewellery";
  const mobile = APP_CONFIG.mobile || themeConfig?.mobile || "+919486611921";
  const whatsapp = APP_CONFIG.whatsapp || themeConfig?.whatsapp || "+919486611921";
  const email = APP_CONFIG.email || themeConfig?.email || "jeyabalajb83@gmail.com";
  const address = APP_CONFIG.address || themeConfig?.address || "Vathiyar Street, Devakottai, Tamil Nadu 630302";
  const website = APP_CONFIG.website || themeConfig?.website || "https://jeyabalajewellery.com";
  const foundationYear = APP_CONFIG.foundationYear || themeConfig?.foundationYear || 1995;
  const lat = APP_CONFIG.latitude || themeConfig?.latitude || 9.9482;
  const lng = APP_CONFIG.longitude || themeConfig?.longitude || 78.8258;
  const youtubeUrl = APP_CONFIG.youtubeUrl || (themeConfig as any)?.youtubeUrl || "https://youtu.be/8RAhdn5b9Bw";

  return {
    id: 1,
    title: storeName,
    company_name: storeName,
    description: `Welcome to ${storeName}, Devakottai. We offer hallmarked 916 gold, silver jewellery, and flexible gold savings schemes built on trust and tradition.`,
    about_us: `Welcome to ${storeName}, Devakottai. We offer hallmarked 916 gold, silver jewellery, and flexible gold savings schemes built on trust and tradition.`,
    helpline: mobile,
    mobile: mobile,
    phone: mobile,
    whatsapp: whatsapp,
    whatsapp_number: whatsapp,
    email: email,
    support_email: email,
    address: address,
    shop_addr: address,
    shop_address: address,
    website: website,
    website_url: website,
    youtube_url: youtubeUrl,
    facebook_url: "https://facebook.com",
    instagram_url: "https://instagram.com",
    twitter_url: "https://twitter.com",
    foundation_year: foundationYear,
    latitude: lat,
    longitude: lng,
    map_url: `https://maps.google.com/?q=${lat},${lng}`,
    business_hours: "Mon - Sat: 9:30 AM - 8:30 PM, Sun: 10:00 AM - 2:00 PM",
    image_url: null,
  };
};

/**
 * Default fallback branch data constructed from tenant configuration
 */
export const getDefaultBranchesData = () => {
  const storeName = APP_CONFIG.appName || themeConfig?.customerName || "Jeyabala Jewellery";
  const mobile = APP_CONFIG.mobile || themeConfig?.mobile || "+919486611921";
  const email = APP_CONFIG.email || themeConfig?.email || "jeyabalajb83@gmail.com";
  const address = APP_CONFIG.address || themeConfig?.address || "Vathiyar Street, Devakottai, Tamil Nadu 630302";
  const lat = APP_CONFIG.latitude || themeConfig?.latitude || 9.9482;
  const lng = APP_CONFIG.longitude || themeConfig?.longitude || 78.8258;

  return [
    {
      id: 1,
      branch_name: `${storeName} - Head Office`,
      name: storeName,
      address: address,
      city: "Devakottai",
      state: "Tamil Nadu",
      pincode: "630302",
      phone: mobile,
      mobile: mobile,
      email: email,
      latitude: lat,
      longitude: lng,
      location: `https://maps.google.com/?q=${lat},${lng}`,
      location_url: `https://maps.google.com/?q=${lat},${lng}`,
      is_active: 1,
      is_main: 1,
    },
  ];
};

/**
 * In-flight promise tracker to deduplicate simultaneous requests
 */
const inFlightRequests = new Map<string, Promise<any>>();

export const dedupeRequest = <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
  if (inFlightRequests.has(key)) {
    logger.log(`⚡ [apiCache] Deduplicating in-flight call for key: ${key}`);
    return inFlightRequests.get(key) as Promise<T>;
  }

  const promise = fetcher().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
};

/**
 * Fetch gold rates with caching & in-flight deduplication
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

  return dedupeRequest('fetchGoldRates', async () => {
    const currentStore = useGlobalStore.getState();
    if (!forceRefresh && currentStore.isRatesCacheValid(CACHE_CONFIG.RATES.MAX_AGE)) {
      return currentStore.getCachedRates()?.data;
    }

    try {
      logger.log("📡 [API] Fetching gold rates from API...");
      const response = await api.get(CACHE_CONFIG.RATES.ENDPOINT);
      
      if (response?.data?.data) {
        currentStore.setCachedRates(response.data.data);
        logger.log("✅ [API] Gold rates fetched and cached", {
          gold_rate: response.data.data.gold_rate,
        });
        return response.data.data;
      }

      // If API fails but we have cached data, return it
      const cached = currentStore.getCachedRates();
      if (cached) {
        logger.warn("⚠️ [API] API failed, using stale cached gold rates");
        return cached.data;
      }

      logger.warn("⚠️ [API] No gold rate data available from API or cache");
      return null;
    } catch (error) {
      logger.error("❌ [API] Error fetching gold rates:", error);
      
      // Return cached data even if expired as fallback
      const cached = currentStore.getCachedRates();
      if (cached) {
        logger.warn("⚠️ [API] Using expired cached gold rates as fallback");
        return cached.data;
      }

      return null;
    }
  });
};

/**
 * Fetch schemes with caching & in-flight deduplication
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

  return dedupeRequest('fetchSchemes', async () => {
    const currentStore = useGlobalStore.getState();
    if (!forceRefresh && currentStore.isSchemesCacheValid(CACHE_CONFIG.SCHEMES.MAX_AGE)) {
      return currentStore.getCachedSchemes()?.data || [];
    }

    try {
      logger.log("📡 [API] Fetching schemes from API...");
      const response = await api.get(CACHE_CONFIG.SCHEMES.ENDPOINT);
      
      if (response?.data?.data && Array.isArray(response.data.data)) {
        currentStore.setCachedSchemes(response.data.data);
        logger.log("✅ [API] Schemes fetched and cached", {
          count: response.data.data.length,
        });
        return response.data.data;
      }

      // If API fails but we have cached data, return it
      const cached = currentStore.getCachedSchemes();
      if (cached && Array.isArray(cached.data)) {
        logger.warn("⚠️ [API] API failed, using stale cached schemes");
        return cached.data;
      }

      return []; // Return empty array on error
    } catch (error) {
      logger.error("❌ [API] Error fetching schemes:", error);
      
      // Return cached data even if expired as fallback
      const cached = currentStore.getCachedSchemes();
      if (cached && Array.isArray(cached.data)) {
        logger.warn("⚠️ [API] Using expired cached schemes as fallback");
        return cached.data;
      }

      return []; // Return empty array on error
    }
  });
};

/**
 * Fetch branches with caching & in-flight deduplication
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Promise with branches data
 */
export const fetchBranchesWithCache = async (forceRefresh: boolean = false) => {
  const store = useGlobalStore.getState();

  // Check cache first if not forcing refresh
  if (!forceRefresh && store.isBranchesCacheValid(CACHE_CONFIG.BRANCHES.MAX_AGE)) {
    const cached = store.getCachedBranches();
    if (cached?.data && Array.isArray(cached.data) && cached.data.length > 0) {
      logger.log("📦 [Cache] Using cached branches", {
        age: Date.now() - (cached?.timestamp || 0),
        cached: !!cached,
      });
      return cached.data;
    }
  }

  return dedupeRequest('fetchBranches', async () => {
    const currentStore = useGlobalStore.getState();
    if (!forceRefresh && currentStore.isBranchesCacheValid(CACHE_CONFIG.BRANCHES.MAX_AGE)) {
      const cached = currentStore.getCachedBranches();
      if (cached?.data && Array.isArray(cached.data) && cached.data.length > 0) {
        return cached.data;
      }
    }

    try {
      logger.log("📡 [API] Fetching branches from API...");
      const response = await api.get(CACHE_CONFIG.BRANCHES.ENDPOINT);
      
      if (response?.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        currentStore.setCachedBranches(response.data.data);
        logger.log("✅ [API] Branches fetched and cached", {
          count: response.data.data.length,
        });
        return response.data.data;
      }

      // If API fails or empty but we have cached data, return it
      const cached = currentStore.getCachedBranches();
      if (cached?.data && Array.isArray(cached.data) && cached.data.length > 0) {
        logger.warn("⚠️ [API] No branches in API response, using cached branches");
        return cached.data;
      }

      const defaultBranches = getDefaultBranchesData();
      currentStore.setCachedBranches(defaultBranches);
      return defaultBranches;
    } catch (error) {
      logger.warn("⚠️ [API] Error fetching branches, using fallback branches:", error);
      
      // Return cached data even if expired as fallback
      const cached = currentStore.getCachedBranches();
      if (cached?.data && Array.isArray(cached.data) && cached.data.length > 0) {
        logger.warn("⚠️ [API] Using expired cached branches as fallback");
        return cached.data;
      }

      return getDefaultBranchesData();
    }
  });
};

/**
 * Fetch about page with caching & in-flight deduplication
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Promise with about page data
 */
export const fetchAboutPageWithCache = async (forceRefresh: boolean = false) => {
  const store = useGlobalStore.getState();

  // Check cache first if not forcing refresh
  if (!forceRefresh && store.isAboutPageCacheValid(CACHE_CONFIG.ABOUT_PAGE.MAX_AGE)) {
    const cached = store.getCachedAboutPage();
    if (cached?.data) {
      logger.log("📦 [Cache] Using cached about page", {
        age: Date.now() - (cached?.timestamp || 0),
        cached: !!cached,
      });
      return cached.data;
    }
  }

  return dedupeRequest('fetchAboutPage', async () => {
    const currentStore = useGlobalStore.getState();
    if (!forceRefresh && currentStore.isAboutPageCacheValid(CACHE_CONFIG.ABOUT_PAGE.MAX_AGE)) {
      const cached = currentStore.getCachedAboutPage();
      if (cached?.data) {
        return cached.data;
      }
    }

    try {
      logger.log("📡 [API] Fetching about page from API...");
      const response = await api.get(CACHE_CONFIG.ABOUT_PAGE.ENDPOINT);
      
      if (response?.data?.data) {
        currentStore.setCachedAboutPage(response.data.data);
        logger.log("✅ [API] About page fetched and cached");
        return response.data.data;
      }

      // If API returns null/empty (e.g. data: null), use cached if available
      const cached = currentStore.getCachedAboutPage();
      if (cached?.data) {
        logger.warn("⚠️ [API] About page data empty in API, using cached about page");
        return cached.data;
      }

      // Fallback to default tenant themeConfig data
      logger.log("ℹ️ [API] About page not configured on server, using default store info");
      const defaultData = getDefaultAboutPageData();
      currentStore.setCachedAboutPage(defaultData);
      return defaultData;
    } catch (error) {
      logger.warn("⚠️ [API] Error fetching about page, falling back to default store info:", error);
      
      // Return cached data even if expired as fallback
      const cached = currentStore.getCachedAboutPage();
      if (cached?.data) {
        logger.warn("⚠️ [API] Using expired cached about page as fallback");
        return cached.data;
      }

      const defaultData = getDefaultAboutPageData();
      return defaultData;
    }
  });
};

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
  const store = useGlobalStore.getState();
  store?.clearCachedRates?.();
  store?.clearCachedSchemes?.();
  store?.clearCachedBranches?.();
  store?.clearCachedAboutPage?.();
  inFlightRequests.clear();
  logger.log("📦 [Cache] All caches cleared");
};

/**
 * Clear rates cache
 */
export const clearRatesCache = () => {
  const store = useGlobalStore.getState();
  store?.clearCachedRates?.();
  inFlightRequests.delete('fetchGoldRates');
};

/**
 * Clear schemes cache
 */
export const clearSchemesCache = () => {
  const store = useGlobalStore.getState();
  store?.clearCachedSchemes?.();
  inFlightRequests.delete('fetchSchemes');
};

/**
 * Clear branches cache
 */
export const clearBranchesCache = () => {
  const store = useGlobalStore.getState();
  store?.clearCachedBranches?.();
  inFlightRequests.delete('fetchBranches');
};

/**
 * Clear about page cache
 */
export const clearAboutPageCache = () => {
  const store = useGlobalStore.getState();
  store?.clearCachedAboutPage?.();
  inFlightRequests.delete('fetchAboutPage');
};

/**
 * Fetch dynamic app configuration from the backend
 */
export const fetchAppConfigWithCache = async (forceRefresh: boolean = false) => {
  const store = useGlobalStore.getState();

  return dedupeRequest('fetchAppConfig', async () => {
    try {
      const response = await api.get(CACHE_CONFIG.APP_CONFIG.ENDPOINT, { skipLoading: true } as any);
      if (response?.data?.success && response?.data?.data) {
        logger.log("✅ [Config] Syncing configuration from server success");
        store.setAppConfig(response.data.data);
        return response.data.data;
      }
    } catch (err) {
      logger.log("⚠️ [Config] Failed to fetch server config, using local fallbacks", err);
    }
    return null;
  });
};

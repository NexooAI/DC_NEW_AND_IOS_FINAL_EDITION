import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import APP_CONFIG from '../constants/appConfig';
import { logger } from '../utils/logger';

const CONFIG_CACHE_KEY = 'cached_app_remote_config';

export const fetchRemoteConfig = async (): Promise<typeof APP_CONFIG> => {
  try {
    logger.auth('🔄 Fetching remote app configuration...');
    // We try to request settings from the backend configuration endpoint
    const response = await apiClient.get('/config/settings', {
      skipLoading: true, // Do not flash global loading spinner on launch
      timeout: 5000,     // Short timeout so app launches quickly if offline
    } as any);

    if (response && response.data && response.data.success && response.data.data) {
      const remoteConfig = response.data.data;
      logger.auth('✅ Remote config fetched successfully. Saving to cache.');
      await AsyncStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(remoteConfig));

      // Apply the remote config values to APP_CONFIG in place
      if (remoteConfig.urls && remoteConfig.urls.baseUrl) {
        APP_CONFIG.urls.baseUrl = remoteConfig.urls.baseUrl;
      }
      if (remoteConfig.theme) {
        if (remoteConfig.theme.primaryColor) {
          APP_CONFIG.theme.colors.primary = remoteConfig.theme.primaryColor;
          APP_CONFIG.colors.primary = remoteConfig.theme.primaryColor;
        }
        if (remoteConfig.theme.secondaryColor) {
          APP_CONFIG.theme.colors.secondary = remoteConfig.theme.secondaryColor;
          APP_CONFIG.colors.secondary = remoteConfig.theme.secondaryColor;
        }
      }

      return APP_CONFIG;
    }
  } catch (error) {
    logger.error('⚠️ Failed to fetch remote config from server:', error);
  }

  // Fallback: load from cache or local defaults
  try {
    const cached = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
    if (cached) {
      logger.auth('ℹ️ Loaded app config from local cache.');
      const cachedConfig = JSON.parse(cached);

      // Apply the cached config values to APP_CONFIG in place
      if (cachedConfig.urls && cachedConfig.urls.baseUrl) {
        APP_CONFIG.urls.baseUrl = cachedConfig.urls.baseUrl;
      }
      if (cachedConfig.theme) {
        if (cachedConfig.theme.primaryColor) {
          APP_CONFIG.theme.colors.primary = cachedConfig.theme.primaryColor;
          APP_CONFIG.colors.primary = cachedConfig.theme.primaryColor;
        }
        if (cachedConfig.theme.secondaryColor) {
          APP_CONFIG.theme.colors.secondary = cachedConfig.theme.secondaryColor;
          APP_CONFIG.colors.secondary = cachedConfig.theme.secondaryColor;
        }
      }

      return APP_CONFIG;
    }
  } catch (cacheError) {
    logger.error('Error loading cached remote config:', cacheError);
  }

  logger.auth('ℹ️ Using default local appConfig.');
  return APP_CONFIG;
};

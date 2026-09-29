import * as FileSystem from 'expo-file-system/legacy';
import useGlobalStore from '@/store/global.store';
import { logger } from '@/utils/logger';

const POSTER_CACHE_DIR = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}posters_cache/`;

/**
 * Ensure poster cache directory exists
 */
const ensureCacheDirExists = async (): Promise<boolean> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(POSTER_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(POSTER_CACHE_DIR, { intermediates: true });
    }
    return true;
  } catch (error) {
    logger.error('❌ [MediaCache] Failed to create cache directory:', error);
    return false;
  }
};

/**
 * Generate a deterministic filename from URL
 */
const getFilenameFromUrl = (url: string): string => {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const cleanUrl = url.split('?')[0].split('#')[0];
  const parts = cleanUrl.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '') ? ext : 'jpg';
  return `poster_${Math.abs(hash)}.${safeExt}`;
};

/**
 * Cache a single remote image URL to local disk
 * @param remoteUrl Image URL to download and cache
 * @returns Local file URI if cached successfully, or original remoteUrl as fallback
 */
export const cacheRemoteImage = async (remoteUrl: string): Promise<string> => {
  if (!remoteUrl || typeof remoteUrl !== 'string') return remoteUrl;
  if (!remoteUrl.startsWith('http://') && !remoteUrl.startsWith('https://')) {
    return remoteUrl; // Already a local path or asset
  }

  try {
    const store = useGlobalStore.getState();
    const existingLocalUri = store.cachedPosterMap?.[remoteUrl];

    // If already in store, verify file still exists on disk
    if (existingLocalUri) {
      const fileInfo = await FileSystem.getInfoAsync(existingLocalUri);
      if (fileInfo.exists) {
        return existingLocalUri;
      }
    }

    const dirReady = await ensureCacheDirExists();
    if (!dirReady) return remoteUrl;

    const filename = getFilenameFromUrl(remoteUrl);
    const localUri = `${POSTER_CACHE_DIR}${filename}`;

    // Check if file is already on disk (e.g. from previous app session)
    const diskInfo = await FileSystem.getInfoAsync(localUri);
    if (diskInfo.exists) {
      store.setCachedPosterItem(remoteUrl, localUri);
      return localUri;
    }

    // Download to local cache
    logger.log(`📥 [MediaCache] Downloading poster to disk: ${filename}`);
    const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);

    if (downloadResult && downloadResult.status === 200) {
      store.setCachedPosterItem(remoteUrl, downloadResult.uri);
      logger.log(`✅ [MediaCache] Poster cached locally: ${downloadResult.uri}`);
      return downloadResult.uri;
    }

    return remoteUrl;
  } catch (error) {
    logger.warn(`⚠️ [MediaCache] Failed to cache image: ${remoteUrl}`, error);
    return remoteUrl;
  }
};

/**
 * Preload an array of poster/banner URLs in background
 */
export const preloadPosters = async (urls: (string | null | undefined)[]): Promise<void> => {
  const validUrls = urls.filter(
    (url): url is string => typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))
  );

  if (validUrls.length === 0) return;

  logger.log(`📦 [MediaCache] Preloading ${validUrls.length} banners in background...`);
  // Process in small batches so we don't overwhelm network/RAM
  const batchSize = 3;
  for (let i = 0; i < validUrls.length; i += batchSize) {
    const batch = validUrls.slice(i, i + batchSize);
    await Promise.allSettled(batch.map((url) => cacheRemoteImage(url)));
  }
  logger.log(`✅ [MediaCache] Preloading completed for ${validUrls.length} banners.`);
};

/**
 * Synchronously resolve the best image source object for React Native Image
 * Returns local file URI if cached, otherwise remote URL
 */
export const getCachedPosterSource = (imageSource: any): any => {
  if (!imageSource) return null;

  // Local require(...) number or already structured object
  if (typeof imageSource === 'number') {
    return imageSource;
  }
  if (typeof imageSource === 'object' && imageSource.uri) {
    imageSource = imageSource.uri;
  }

  if (typeof imageSource === 'string') {
    if (!imageSource.startsWith('http://') && !imageSource.startsWith('https://')) {
      return { uri: imageSource };
    }

    const cachedLocalUri = useGlobalStore.getState().cachedPosterMap?.[imageSource];
    if (cachedLocalUri) {
      return { uri: cachedLocalUri };
    }
    return { uri: imageSource };
  }

  return imageSource;
};

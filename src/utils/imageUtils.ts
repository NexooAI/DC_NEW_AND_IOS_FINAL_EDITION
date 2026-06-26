import { theme } from '@/constants/theme';

import { logger } from '@/utils/logger';
/**
 * Converts a relative image path to a full URL with base URL prefix
 * @param path - The relative image path
 * @returns The full image URL
 */
export const getFullImageUrl = (path: string): string => {
  if (!path) {
    logger.log("⚠️ getFullImageUrl: Empty path provided");
    return "";
  }
  if (path.startsWith("http")) {
    logger.log("🌐 getFullImageUrl: Already full URL:", path);
    return path;
  }
  // Remove trailing slash from baseUrl and leading slash from path
  const fullUrl = `${theme.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  logger.log("🔗 getFullImageUrl: Generated URL:", fullUrl, "from path:", path);
  return fullUrl;
};

/**
 * Creates an image source object for React Native Image component
 * @param path - The image path (can be relative, full URL, or require statement)
 * @returns Image source object or undefined
 */
export const getImageSource = (path: string | any) => {
  if (!path) return undefined;
  // If it's a local resource (require statement), return as is
  if (typeof path === 'number') return path;
  // If it's a string, use getFullImageUrl to get the URI
  if (typeof path === 'string') {
    const url = getFullImageUrl(path);
    return url ? { uri: url } : undefined;
  }
  return undefined;
};

/**
 * Formats gold weight with proper decimal formatting
 * Shows decimal only when weight is less than 1 gram
 * @param weight - The gold weight in grams
 * @returns Formatted gold weight string
 */
export const formatGoldWeight = (weight: any): string => {
  const parsedWeight = parseFloat(weight);
  if (isNaN(parsedWeight) || parsedWeight === 0) return "0.000 g";
  return `${parsedWeight.toFixed(3)} g`;
}; 
import { theme } from '@/constants/theme';

import { logger } from '@/utils/logger';
/**
 * Converts a relative image path to a full URL with base URL prefix
 * @param path - The relative image path
 * @returns The full image URL
 */
export const getFullImageUrl = (path: string): string => {
  if (!path) {
    return "";
  }
  if (path.startsWith("http")) {
    return path;
  }
  // Remove trailing slash from baseUrl and leading slash from path
  const fullUrl = `${theme.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
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
 * Universal Image Source Resolver:
 * - If string starts with http/https or data:, returns { uri: string }
 * - If string is a server relative path (e.g. /uploads/logo.png), converts to full URL -> { uri: string }
 * - If already a required number or object with uri, returns as is
 * - If invalid or relative local path (../../), returns fallback
 */
export const resolveImageSource = (source: any, fallback?: any) => {
  if (!source) return fallback;
  if (typeof source === 'number') return source;
  if (typeof source === 'object' && source?.uri) return source;
  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return { uri: trimmed };
    }
    if (!trimmed.startsWith('.') && !trimmed.startsWith('..') && trimmed.length > 0) {
      const fullUrl = getFullImageUrl(trimmed);
      return fullUrl ? { uri: fullUrl } : fallback;
    }
  }
  return fallback;
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
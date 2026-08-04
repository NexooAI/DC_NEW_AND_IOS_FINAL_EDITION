import { APP_CONFIG } from '@/constants';
import { logger } from '@/utils/logger';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

// Static mapping of local image files to static require calls.
// This prevents slow network requests when relative path strings are loaded via { uri: ... } in React Native.
const localImages: { [key: string]: any } = {
  "bg_login.jpg": require("../../assets/images/bg_login.jpg"),
  "bg_new.jpg": require("../../assets/images/bg_new.jpg"),
  "logo.png": require("../../assets/images/logo.png"),
  "logo_trans.png": require("../../assets/images/logo_trans.png"),
  "logo_trans_ta.png": require("../../assets/images/logo_trans_ta.png"),
  "logo_white.png": require("../../assets/images/logo_white.png"),
  "logo_white_ta.png": require("../../assets/images/logo_white_ta.png"),
  "splashscreen_logo.png": require("../../assets/images/splashscreen_logo.png"),
  "adaptive-icon.png": require("../../assets/images/adaptive-icon.png"),
  "menu_bg.png": require("../../assets/images/menu_bg.png"),
  "gold_pattern.jpg": require("../../assets/images/gold_pattern.jpg"),
  "cancel.png": require("../../assets/images/cancel.png"),
  "success.png": require("../../assets/images/success.png"),
  "no-data.png": require("../../assets/images/no-data.png"),
  "gold.png": require("../../assets/images/gold.png"),
  "silver.png": require("../../assets/images/silver.png"),
  "bar.png": require("../../assets/images/bar.png"),
  "scheme_card_bg.png": require("../../assets/images/scheme_card_bg.png"),
  "saveasmoneyproduct.png": require("../../assets/images/saveasmoneyproduct.png"),
  "savegold.png": require("../../assets/images/savegold.png"),
  "digigoldproduct.png": require("../../assets/images/digigoldproduct.png"),
  "rupee-bg.png": require("../../assets/images/rupee-bg.png"),
  "slider1.png": require("../../assets/images/slider1.png"),
  "banner.png": require("../../assets/images/banner.png"),
  "banner2.png": require("../../assets/images/banner2.png"),
  "flashbanner.png": require("../../assets/images/flashbanner.png"),
  "status1.jpg": require("../../assets/images/status1.jpg"),
  "scheme1.jpg": require("../../assets/images/scheme1.jpg"),
  "store.png": require("../../assets/images/store.png"),
  "shop.jpg": require("../../assets/images/shop.jpg"),
  "map-pin.png": require("../../assets/images/map-pin.png"),
  "center-location.png": require("../../assets/images/center-location.png"),
  "central-park.jpg": require("../../assets/images/central-park.jpg"),
  "empire-state.jpg": require("../../assets/images/empire-state.jpg"),
  "savingsbg.jpg": require("../../assets/images/savingsbg.jpg"),
  "saving_bg.png": require("../../assets/images/saving_bg.png"),
  "halmark1.jpg": require("../../assets/images/halmark1.jpg"),
  "halmark2.jpg": require("../../assets/images/halmark2.jpg"),
  "translate.png": require("../../assets/images/translate.png"),
  "eng.png": require("../../assets/images/translate/eng.png"),
  "mal.png": require("../../assets/images/translate/mal.png"),
  "ta.png": require("../../assets/images/translate/ta.png"),
  "intro_1.png": require("../../assets/images/intro_1.png"),
  "intro_2.png": require("../../assets/images/intro_2.png"),
  "intro_3.png": require("../../assets/images/intro_3.png"),
  "404.jpg": require("../../assets/images/404.jpg"),
};

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
  const fullUrl = `${APP_CONFIG.urls.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
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
  // If it's a local resource (require statement / numeric asset ID), return as is
  if (typeof path === 'number') return path;
  if (typeof path === 'object' && path.uri) return path;

  // If it's a string path, check if it refers to a local file
  if (typeof path === 'string') {
    const filename = path.split('/').pop() || '';
    if (localImages[filename]) {
      return localImages[filename];
    }

    // If it is a remote or user-uploaded resource, return the URL source
    if (path.startsWith('http') || path.startsWith('/') || !path.includes('assets/images')) {
      const url = getFullImageUrl(path);
      return url ? { uri: url } : undefined;
    }
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

let cachedLogoBase64: string | null = null;

/**
 * Loads the local logo asset and converts it to a base64 Data URL.
 * Falls back to the remote URL if file operations fail.
 */
export const loadLogoAsBase64 = async (): Promise<string> => {
  if (cachedLogoBase64) {
    return cachedLogoBase64;
  }
  const fallbackUrl = "https://dcjewellers.org/wp-content/uploads/2025/05/logo_bg_dark.webp";
  try {
    const asset = Asset.fromModule(require("../../assets/images/logo.png"));
    await asset.downloadAsync();
    const uri = asset.localUri || asset.uri;
    if (!uri) {
      throw new Error("Asset URI is not available");
    }
    const base64Data = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    cachedLogoBase64 = `data:image/png;base64,${base64Data}`;
    return cachedLogoBase64;
  } catch (error) {
    logger.error("❌ Failed to load local logo as base64:", error);
    return fallbackUrl;
  }
}; 
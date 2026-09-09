import { themeConfig as baseThemeConfig } from './theme.config';

interface ThemeConfig {
  customerName?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  address?: string;
  mobile?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  foundationYear?: number;
  baseUrl?: string;
  youtubeUrl?: string;
}

const themeConfig = baseThemeConfig as ThemeConfig;

export const APP_CONFIG = {
  appName: themeConfig.customerName || "",
  companyName: themeConfig.customerName || "",
  companyNameUpper: (themeConfig.customerName || "").toUpperCase(),
  copyright: themeConfig.customerName ? `${themeConfig.customerName}. All rights reserved.` : "",
  playStoreUrl: themeConfig.playStoreUrl || "",
  appStoreUrl: themeConfig.appStoreUrl || "",
  address: themeConfig.address || "",
  mobile: themeConfig.mobile || "",
  whatsapp: themeConfig.whatsapp || "",
  email: themeConfig.email || "",
  website: themeConfig.website || "",
  latitude: themeConfig.latitude || 0,
  longitude: themeConfig.longitude || 0,
  foundationYear: themeConfig.foundationYear || 0,
  baseUrl: (themeConfig as any).baseUrl || (themeConfig as any).baseURL || "",
  urls: {
    baseUrl: (themeConfig as any).baseUrl || (themeConfig as any).baseURL || "",
  },
  youtubeUrl: themeConfig.youtubeUrl || "",
};

export default APP_CONFIG;

import COLORS from './colors';
import { theme } from './theme';

export const APP_CONFIG = {
  // Theme Config
  theme: theme,

  // Centralized Colors
  colors: COLORS,

  // Centralized Typography Configuration
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      bold: 'Inter-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      h1: 32,
    },
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      bold: '700' as const,
    },
  },

  // Centralized Spacing Token Definitions
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  // Centralized Radius Tokens
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },

  // Centralized Shadows Configuration
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.00,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },

  // Centralized Image asset configuration
  images: theme.images,

  // Centralized Feature Flags configuration
  featureFlags: {
    enableBiometrics: true,
    enableNotifications: true,
    enableReferrals: true,
    enableKyc: true,
    enableLuckyDraw: true,
  },

  // Centralized URL endpoints
  urls: {
    baseUrl: theme.baseUrl,
    youtubeUrl: theme.youtubeUrl,
    website: theme.constants.website,
    providerUrl: theme.constants.providerUrl,
  },

  // Centralized Support Details
  support: {
    customerName: theme.constants.customerName,
    address: theme.constants.address,
    mobile: theme.constants.mobile,
    whatsapp: theme.constants.whatsapp,
    email: theme.constants.email,
    latitude: theme.constants.latitude,
    longitude: theme.constants.longitude,
    providerName: theme.constants.providerName,
  },
};

export default APP_CONFIG;

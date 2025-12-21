// src/constants/colors.js
// Centralized color definitions for the entire app

// Import the theme to get the primary color
import { theme } from './theme';

// Primary brand colors
export const PRIMARY_COLORS = {
  primary: theme.colors.primary,
  secondary: theme.colors.secondary,
  gold: theme.colors.gold,
  silver: theme.colors.silver,
};

// Text colors
export const TEXT_COLORS = {
  primary: theme.colors.textPrimary,
  secondary: theme.colors.textSecondary,
  dark: theme.colors.textDark,
  light: theme.colors.textLight,
  grey: theme.colors.textGrey,
  darkGrey: theme.colors.textDarkGrey,
  mediumGrey: theme.colors.textMediumGrey,
  lightGrey: theme.colors.textLightGrey,
  brown: theme.colors.textBrown,
  darkBrown: theme.colors.textDarkBrown,
  success: theme.colors.textSuccess,
  error: theme.colors.textError,
  warning: theme.colors.textWarning,
  muted: theme.colors.textGrey,
  mutedDark: theme.colors.textDarkGrey,
  mutedLight: theme.colors.textLightGrey,
  mutedMedium: theme.colors.textMediumGrey,
};

// Background colors
export const BACKGROUND_COLORS = {
  primary: theme.colors.background,
  secondary: theme.colors.backgroundSecondary,
  tertiary: theme.colors.backgroundTertiary,
  quaternary: theme.colors.backgroundQuaternary,
  quinary: theme.colors.backgroundQuinary,
  card: theme.colors.background,
  cardMedium: theme.colors.backgroundSecondary,
  cardDark: theme.colors.backgroundTertiary,
  muted: theme.colors.lightGrey,
  overlay: theme.colors.blackOverlay || 'rgba(0,0,0,0.5)',
  overlayLight: theme.colors.blackOverlayLight || 'rgba(0,0,0,0.2)',
  overlayMedium: 'rgba(0,0,0,0.3)',
};

// Status colors
export const STATUS_COLORS = {
  success: theme.colors.success,
  successLight: theme.colors.successLight,
  successDark: theme.colors.successDark,
  error: theme.colors.error,
  errorLight: theme.colors.errorLight,
  errorDark: theme.colors.errorDark,
  warning: theme.colors.warning,
  warningLight: theme.colors.warningLight,
  info: theme.colors.info,
  active: theme.colors.statusActive,
  inactive: theme.colors.statusInactive,
  pending: theme.colors.statusPending,
  completed: theme.colors.statusCompleted,
};

// Border colors
export const BORDER_COLORS = {
  primary: theme.colors.border,
  light: theme.colors.borderLight,
  white: theme.colors.borderWhite,
  gold: theme.colors.borderGold,
  bottom: theme.colors.border,
  left: theme.colors.border,
  top: theme.colors.border,
};

// Shadow colors
export const SHADOW_COLORS = {
  black: theme.colors.black,
  gold: theme.colors.gold,
  primary: theme.colors.primary,
  success: theme.colors.success,
};

// Component-specific colors
export const COMPONENT_COLORS = {
  tab: {
    inactive: theme.colors.grey,
    active: theme.colors.primary,
    background: theme.colors.background,
    backgroundLight: theme.colors.backgroundSecondary,
    backgroundMedium: theme.colors.backgroundTertiary,
    backgroundHeavy: theme.colors.backgroundQuaternary,
  },
  button: {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    success: theme.colors.success,
    error: theme.colors.error,
    warning: theme.colors.warning,
    white: theme.colors.white,
    black: theme.colors.black,
    transparent: theme.colors.transparent,
  },
  card: {
    background: theme.colors.background,
    backgroundLight: theme.colors.backgroundSecondary,
    backgroundMedium: theme.colors.backgroundTertiary,
    backgroundDark: theme.colors.backgroundQuaternary,
    border: theme.colors.border,
    borderLight: theme.colors.borderLight,
  },
  icon: {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    success: theme.colors.success,
    error: theme.colors.error,
    warning: theme.colors.warning,
    info: theme.colors.info,
    white: theme.colors.white,
    black: theme.colors.black,
    grey: theme.colors.grey,
    brown: theme.colors.brown,
  },
};

// Gradient colors
export const GRADIENT_COLORS = {
  primary: theme.colors.gradientPrimary,
  primaryDark: theme.colors.gradientPrimaryDark,
  success: theme.colors.gradientSuccess,
  gold: theme.colors.gradientGold,
  red: theme.colors.gradientRed,
  blue: theme.colors.gradientBlue,
  silver: theme.colors.gradientSilver,
};

// Common colors
export const COMMON_COLORS = {
  white: theme.colors.white,
  black: theme.colors.black,
  transparent: theme.colors.transparent,
  grey: theme.colors.grey,
  lightGrey: theme.colors.lightGrey,
  darkGrey: theme.colors.darkGrey,
};

// Red colors
export const RED_COLORS = {
  primary: theme.colors.red,
  light: theme.colors.redLight,
  dark: theme.colors.redDark,
  darker: theme.colors.redDarker,
  burgundy: theme.colors.redBurgundy,
  burgundyLight: theme.colors.redBurgundyLight,
  burgundyDark: theme.colors.redBurgundyDark,
};

// Blue colors
export const BLUE_COLORS = {
  primary: theme.colors.blue,
  dark: theme.colors.blueDark,
  darker: theme.colors.blueDarker,
  darkest: theme.colors.blueDarkest,
};

// Green colors
export const GREEN_COLORS = {
  primary: theme.colors.green,
  light: theme.colors.greenLight,
  success: theme.colors.greenSuccess,
};

// Brown colors
export const BROWN_COLORS = {
  primary: theme.colors.brown,
  light: theme.colors.brownLight,
  dark: theme.colors.brownDark,
  tan: theme.colors.tan,
};

// Support colors
export const SUPPORT_COLORS = theme.colors.support_container || ["#721c0b", "#c42101", "#fc320a"];

// Status bar colors
export const STATUS_BAR_COLORS = {
  primary: theme.colors.primary,
  light: theme.colors.white,
  dark: theme.colors.black,
};

// Export all colors as a single object for convenience
export const COLORS = {
  // Primary colors
  ...PRIMARY_COLORS,

  // Text colors
  ...TEXT_COLORS,

  // Background colors
  ...BACKGROUND_COLORS,

  // Status colors
  ...STATUS_COLORS,

  // Border colors
  ...BORDER_COLORS,

  // Shadow colors
  ...SHADOW_COLORS,

  // Component colors
  ...COMPONENT_COLORS,

  // Gradient colors
  ...GRADIENT_COLORS,

  // Common colors
  ...COMMON_COLORS,

  // Red colors
  ...RED_COLORS,

  // Blue colors
  ...BLUE_COLORS,

  // Green colors
  ...GREEN_COLORS,

  // Brown colors
  ...BROWN_COLORS,

  // Support colors
  support: SUPPORT_COLORS,

  // Status bar colors
  statusBar: STATUS_BAR_COLORS,

  // Additional direct color access
  red: theme.colors.red,
  borderWhiteLight: theme.colors.borderWhiteLight || theme.colors.borderLight,
  borderWhite: theme.colors.borderWhite,
  textDark: theme.colors.textDark,
  green: GREEN_COLORS.primary,
  greenLight: GREEN_COLORS.light,
  goldLight: theme.colors.goldLight,
  blue: BLUE_COLORS.primary,
  cardBackgroundLight: theme.colors.cardBackgroundLight || '#fffbe6',
  cardBackgroundMedium: theme.colors.cardBackgroundMedium || theme.colors.backgroundSecondary,
  brownLight: BROWN_COLORS.light,

  // Additional overlay colors
  brownOverlay: 'rgba(139, 69, 19, 0.3)',
  blackOverlay: 'rgba(0,0,0,0.5)',
  whiteOverlay: 'rgba(255,255,255,0.9)',

  // Additional text colors
  textDarkBrown: '#2C1810',

  // Additional overlay colors for different opacity levels
  whiteOverlayLight: 'rgba(255, 255, 255, 0.7)',
  whiteOverlayVeryLight: 'rgba(255, 255, 255, 0.1)',
  blackOverlayLight: 'rgba(0, 0, 0, 0.2)',

  // Organized access to nested properties for backward compatibility
  background: {
    primary: theme.colors.background,
    secondary: theme.colors.backgroundSecondary,
    tertiary: theme.colors.backgroundTertiary,
    quaternary: theme.colors.backgroundQuaternary,
    quinary: theme.colors.backgroundQuinary,
    card: theme.colors.background,
    cardMedium: theme.colors.backgroundSecondary,
    cardDark: theme.colors.backgroundTertiary,
    muted: theme.colors.lightGrey,
    overlay: theme.colors.blackOverlay || 'rgba(0,0,0,0.5)',
    overlayLight: theme.colors.blackOverlayLight || 'rgba(0,0,0,0.2)',
    overlayMedium: 'rgba(0,0,0,0.3)',
  },

  text: {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    dark: theme.colors.textDark,
    light: theme.colors.textLight,
    grey: theme.colors.textGrey,
    darkGrey: theme.colors.textDarkGrey,
    mediumGrey: theme.colors.textMediumGrey,
    lightGrey: theme.colors.textLightGrey,
    brown: theme.colors.textBrown,
    darkBrown: theme.colors.textDarkBrown,
    success: theme.colors.textSuccess,
    error: theme.colors.textError,
    warning: theme.colors.textWarning,
    muted: theme.colors.textGrey,
    mutedDark: theme.colors.textDarkGrey,
    mutedLight: theme.colors.textLightGrey,
    mutedMedium: theme.colors.textMediumGrey,
  },

  border: {
    primary: theme.colors.border,
    light: theme.colors.borderLight,
    white: theme.colors.borderWhite,
    gold: theme.colors.borderGold,
    bottom: theme.colors.border,
    left: theme.colors.border,
    top: theme.colors.border,
  },

  shadow: {
    black: theme.colors.black,
    gold: theme.colors.gold,
    primary: theme.colors.primary,
    success: theme.colors.success,
  },

  status: {
    active: theme.colors.statusActive,
    inactive: theme.colors.statusInactive,
    pending: theme.colors.statusPending,
    completed: theme.colors.statusCompleted,
  },

  gradients: {
    primary: theme.colors.gradientPrimary,
    primaryDark: theme.colors.gradientPrimaryDark,
    success: theme.colors.gradientSuccess,
    gold: theme.colors.gradientGold,
    red: theme.colors.gradientRed,
    blue: theme.colors.gradientBlue,
    silver: theme.colors.gradientSilver,
  },
};

// Default export for easy importing
export default COLORS;

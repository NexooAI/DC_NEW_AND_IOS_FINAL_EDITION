// src/constants/colors.d.ts
// TypeScript declarations for color constants

export interface PrimaryColors {
  primary: string;
  secondary: string;
  gold: string;
  silver: string;
}

export interface TextColors {
  primary: string;
  secondary: string;
  dark: string;
  light: string;
  grey: string;
  darkGrey: string;
  mediumGrey: string;
  lightGrey: string;
  brown: string;
  darkBrown: string;
  success: string;
  error: string;
  warning: string;
  muted: string;
  mutedDark: string;
  mutedLight: string;
  mutedMedium: string;
  // Additional text colors
  textMediumGrey: string;
  textDarkGrey: string;
  textSecondary: string;
}

export interface BackgroundColors {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  quinary: string;
  card: string;
  cardMedium: string;
  cardDark: string;
  muted: string;
  overlay: string;
  overlayLight: string;
  overlayMedium: string;
  // Additional background colors
  backgroundSecondary: string;
}

export interface StatusColors {
  success: string;
  successLight: string;
  successDark: string;
  error: string;
  errorLight: string;
  errorDark: string;
  warning: string;
  warningLight: string;
  info: string;
  active: string;
  inactive: string;
  pending: string;
  completed: string;
}

export interface BorderColors {
  primary: string;
  light: string;
  white: string;
  gold: string;
  bottom: string;
  left: string;
  top: string;
}

export interface ShadowColors {
  black: string;
  gold: string;
  primary: string;
  success: string;
}

export interface ComponentColors {
  tab: {
    inactive: string;
    active: string;
    background: string;
    backgroundLight: string;
    backgroundMedium: string;
    backgroundHeavy: string;
  };
  button: {
    primary: string;
    secondary: string;
    success: string;
    error: string;
    warning: string;
    white: string;
    black: string;
    transparent: string;
  };
  card: {
    background: string;
    backgroundLight: string;
    backgroundMedium: string;
    backgroundDark: string;
    border: string;
    borderLight: string;
  };
  icon: {
    primary: string;
    secondary: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    white: string;
    black: string;
    grey: string;
    brown: string;
  };
}

export interface GradientColors {
  primary: readonly [string, string, ...string[]];
  primaryDark: readonly [string, string, ...string[]];
  success: readonly [string, string, ...string[]];
  gold: readonly [string, string, ...string[]];
  red: readonly [string, string, ...string[]];
  blue: readonly [string, string, ...string[]];
  silver: readonly [string, string, ...string[]];
}

export interface CommonColors {
  white: string;
  black: string;
  transparent: string;
  grey: string;
  lightGrey: string;
  darkGrey: string;
}

export interface RedColors {
  primary: string;
  light: string;
  dark: string;
  darker: string;
  burgundy: string;
  burgundyLight: string;
  burgundyDark: string;
}

export interface BlueColors {
  primary: string;
  dark: string;
  darker: string;
  darkest: string;
}

export interface GreenColors {
  primary: string;
  light: string;
  success: string;
}

export interface BrownColors {
  primary: string;
  light: string;
  dark: string;
  tan: string;
}

export interface StatusBarColors {
  primary: string;
  light: string;
  dark: string;
}

// Nested color interfaces for backward compatibility
export interface NestedBackgroundColors {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  quinary: string;
  card: string;
  cardMedium: string;
  cardDark: string;
  muted: string;
  overlay: string;
  overlayLight: string;
  overlayMedium: string;
}

export interface NestedTextColors {
  primary: string;
  secondary: string;
  dark: string;
  light: string;
  grey: string;
  darkGrey: string;
  mediumGrey: string;
  lightGrey: string;
  brown: string;
  darkBrown: string;
  success: string;
  error: string;
  warning: string;
  muted: string;
  mutedDark: string;
  mutedLight: string;
  mutedMedium: string;
}

export interface NestedBorderColors {
  primary: string;
  light: string;
  white: string;
  gold: string;
  bottom: string;
  left: string;
  top: string;
}

export interface NestedShadowColors {
  black: string;
  gold: string;
  primary: string;
  success: string;
}

export interface NestedStatusColors {
  active: string;
  inactive: string;
  pending: string;
  completed: string;
  success: string;
  error: string;
  warning: string;
}

export interface NestedGradientColors {
  primary: readonly [string, string, ...string[]];
  primaryDark: readonly [string, string, ...string[]];
  success: readonly [string, string, ...string[]];
  gold: readonly [string, string, ...string[]];
  red: readonly [string, string, ...string[]];
  blue: readonly [string, string, ...string[]];
  silver: readonly [string, string, ...string[]];
}

export interface AllColors extends
  PrimaryColors,
  TextColors,
  BackgroundColors,
  StatusColors,
  BorderColors,
  ShadowColors,
  CommonColors,
  RedColors,
  BlueColors,
  GreenColors,
  BrownColors {
  gray: string | undefined;
  components: ComponentColors;
  gradients: GradientColors;
  support: string[];
  statusBar: StatusBarColors;
  // Additional direct color access
  red: string;
  borderWhiteLight: string;
  borderWhite: string;
  textDark: string;
  green: string;
  greenLight: string;
  goldLight: string;
  blue: string;
  cardBackgroundLight: string;
  cardBackgroundMedium: string;
  brownLight: string;
  brownOverlay: string;
  blackOverlay: string;
  whiteOverlay: string;
  textDarkBrown: string;
  whiteOverlayLight: string;
  whiteOverlayVeryLight: string;
  blackOverlayLight: string;
  // Nested properties for backward compatibility
  background: NestedBackgroundColors;
  text: NestedTextColors;
  border: NestedBorderColors;
  shadow: NestedShadowColors;
  status: NestedStatusColors;
  gradients: NestedGradientColors;
}

// Export the COLORS constant
declare const COLORS: AllColors;
export { COLORS };

// Export individual color groups
declare const PRIMARY_COLORS: PrimaryColors;
export { PRIMARY_COLORS };
declare const TEXT_COLORS: TextColors;
export { TEXT_COLORS };
declare const BACKGROUND_COLORS: BackgroundColors;
export { BACKGROUND_COLORS };
declare const STATUS_COLORS: StatusColors;
export { STATUS_COLORS };
declare const BORDER_COLORS: BorderColors;
export { BORDER_COLORS };
declare const SHADOW_COLORS: ShadowColors;
export { SHADOW_COLORS };
declare const COMPONENT_COLORS: ComponentColors;
export { COMPONENT_COLORS };
declare const GRADIENT_COLORS: GradientColors;
export { GRADIENT_COLORS };
declare const COMMON_COLORS: CommonColors;
export { COMMON_COLORS };
declare const RED_COLORS: RedColors;
export { RED_COLORS };
declare const BLUE_COLORS: BlueColors;
export { BLUE_COLORS };
declare const GREEN_COLORS: GreenColors;
export { GREEN_COLORS };
declare const BROWN_COLORS: BrownColors;
export { BROWN_COLORS };
declare const SUPPORT_COLORS: string[];
export { SUPPORT_COLORS };
declare const STATUS_BAR_COLORS: StatusBarColors;
export { STATUS_BAR_COLORS };

// Default export
declare const _default: AllColors;
export default _default;

// Type definitions for theme.js

export interface ThemeColors {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  backgroundQuaternary: string;
  backgroundQuinary: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  surfaceInverse: string;
  textPrimary: string;
  textSecondary: string;
  textDark: string;
  textLight: string;
  textGrey: string;
  textDarkGrey: string;
  textMediumGrey: string;
  textLightGrey: string;
  textOnPrimary: string;
  textOnSecondary: string;
  textOnAccent: string;
  textDisabled: string;
  textSuccess: string;
  textError: string;
  textWarning: string;
  success: string;
  successLight: string;
  successDark: string;
  error: string;
  errorLight: string;
  errorDark: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  border: any;
  borderLight: string;
  borderWhite: string;
  white: string;
  black: string;
  transparent: string;
  overlay: string;
  overlayLight: string;
  overlayMedium: string;
  blackOverlay: string;
  blackOverlayLight: string;
  whiteOverlay: string;
  whiteOverlayLight: string;
  whiteOverlayVeryLight: string;
  shadow: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  buttonDisabled: string;
  buttonDisabledText: string;
  buttonPressed: string;
  buttonPressedText: string;
  support_container: string[];
  [key: string]: any;
}

export interface ThemeButtonVariant {
  background: string;
  text: string;
  border?: string;
}

export interface ThemeButtonConfig {
  background: string;
  text: string;
  primary: ThemeButtonVariant;
  secondary: ThemeButtonVariant;
  success: ThemeButtonVariant;
  error: ThemeButtonVariant;
  warning: ThemeButtonVariant;
  outline: ThemeButtonVariant;
  ghost: ThemeButtonVariant;
  small: { paddingHorizontal: number; paddingVertical: number; fontSize: number };
  medium: { paddingHorizontal: number; paddingVertical: number; fontSize: number };
  large: { paddingHorizontal: number; paddingVertical: number; fontSize: number };
  disabled: ThemeButtonVariant;
  pressed: ThemeButtonVariant;
}

export interface Theme {
  colors: ThemeColors;
  button: ThemeButtonConfig;
  images: any;
  image: any;
  constants: {
    customerName: string;
    [key: string]: any;
  };
  youtubeUrl: string;
  baseUrl: string;
  [key: string]: any;
}

export declare const theme: Theme;
export declare const lightPalette: ThemeColors;
export declare const darkPalette: ThemeColors;
export declare function createThemeColors(
  basePalette: ThemeColors,
  overrides?: Partial<ThemeColors>
): ThemeColors;

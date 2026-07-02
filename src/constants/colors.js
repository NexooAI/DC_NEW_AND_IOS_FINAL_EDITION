// src/constants/colors.js
// Centralized, dynamically-evaluated color definitions for the entire app

import { theme, lightPalette, darkPalette } from './theme';

// Helper to get active colors safely without React hooks
const getActiveColors = () => {
  try {
    // Dynamic require to avoid circular dependency
    const useGlobalStore = require('@/store/global.store').default;
    const state = useGlobalStore.getState();
    const appConfig = state?.appConfig;
    const themeMode = state?.themeMode;
    const basePalette = themeMode === 'dark' ? darkPalette : lightPalette;
    
    if (appConfig && appConfig.colors) {
      return {
        ...basePalette,
        ...appConfig.colors,
      };
    }
    return basePalette;
  } catch (e) {
    // Fallback if store is not initialized or during test runs
    return lightPalette;
  }
};

const getActiveTheme = () => {
  try {
    const useGlobalStore = require('@/store/global.store').default;
    const appConfig = useGlobalStore.getState()?.appConfig;
    if (appConfig) {
      return {
        ...theme,
        ...appConfig,
      };
    }
    return theme;
  } catch (e) {
    return theme;
  }
};

export const PRIMARY_COLORS = {
  get primary() { return getActiveColors().primary; },
  get secondary() { return getActiveColors().secondary; },
  get gold() { return getActiveColors().gold || getActiveColors().secondary; },
  get silver() { return getActiveColors().silver || "#C0C0C0"; },
};

export const TEXT_COLORS = {
  get primary() { return getActiveColors().textPrimary; },
  get secondary() { return getActiveColors().textSecondary; },
  get dark() { return getActiveColors().textDark; },
  get light() { return getActiveColors().textLight; },
  get grey() { return getActiveColors().textGrey; },
  get darkGrey() { return getActiveColors().textDarkGrey; },
  get mediumGrey() { return getActiveColors().textMediumGrey; },
  get lightGrey() { return getActiveColors().textLightGrey; },
  get brown() { return getActiveColors().textBrown || "#8b5a2b"; },
  get darkBrown() { return getActiveColors().textDarkBrown || "#3E2723"; },
  get success() { return getActiveColors().textSuccess; },
  get error() { return getActiveColors().textError; },
  get warning() { return getActiveColors().textWarning; },
  get muted() { return getActiveColors().textGrey; },
  get mutedDark() { return getActiveColors().textDarkGrey; },
  get mutedLight() { return getActiveColors().textLightGrey; },
  get mutedMedium() { return getActiveColors().textMediumGrey; },
};

export const BACKGROUND_COLORS = {
  get primary() { return getActiveColors().background; },
  get secondary() { return getActiveColors().backgroundSecondary; },
  get tertiary() { return getActiveColors().backgroundTertiary; },
  get quaternary() { return getActiveColors().backgroundQuaternary || getActiveColors().quaternary; },
  get quinary() { return getActiveColors().backgroundQuinary || getActiveColors().quaternary; },
  get card() { return getActiveColors().background; },
  get cardMedium() { return getActiveColors().backgroundSecondary; },
  get cardDark() { return getActiveColors().backgroundTertiary; },
  get muted() { return getActiveColors().lightGrey || "#e5e7eb"; },
  get overlay() { return getActiveColors().blackOverlay || 'rgba(0,0,0,0.5)'; },
  get overlayLight() { return getActiveColors().blackOverlayLight || 'rgba(0,0,0,0.2)'; },
  get overlayMedium() { return 'rgba(0,0,0,0.3)'; },
};

export const STATUS_COLORS = {
  get success() { return getActiveColors().success; },
  get successLight() { return getActiveColors().successLight || "#e8f5e9"; },
  get successDark() { return getActiveColors().successDark || "#2e7d32"; },
  get error() { return getActiveColors().error; },
  get errorLight() { return getActiveColors().errorLight || "#ffebee"; },
  get errorDark() { return getActiveColors().errorDark || "#c62828"; },
  get warning() { return getActiveColors().warning; },
  get warningLight() { return getActiveColors().warningLight || "#fff8e1"; },
  get info() { return getActiveColors().info; },
  get active() { return getActiveColors().statusActive || getActiveColors().success; },
  get inactive() { return getActiveColors().statusInactive || getActiveColors().error; },
  get pending() { return getActiveColors().statusPending || getActiveColors().warning; },
  get completed() { return getActiveColors().statusCompleted || getActiveColors().success; },
};

export const BORDER_COLORS = {
  get primary() { return getActiveColors().border; },
  get light() { return getActiveColors().borderLight; },
  get white() { return getActiveColors().borderWhite || getActiveColors().borderLight; },
  get gold() { return getActiveColors().borderGold || getActiveColors().secondary; },
  get bottom() { return getActiveColors().border; },
  get left() { return getActiveColors().border; },
  get top() { return getActiveColors().border; },
};

export const SHADOW_COLORS = {
  get black() { return getActiveColors().black; },
  get gold() { return getActiveColors().gold || getActiveColors().secondary; },
  get primary() { return getActiveColors().primary; },
  get success() { return getActiveColors().success; },
};

export const COMPONENT_COLORS = {
  tab: {
    get inactive() { return getActiveColors().textGrey; },
    get active() { return getActiveColors().primary; },
    get background() { return getActiveColors().background; },
    get backgroundLight() { return getActiveColors().backgroundSecondary; },
    get backgroundMedium() { return getActiveColors().backgroundTertiary; },
    get backgroundHeavy() { return getActiveColors().quaternary; },
  },
  button: {
    get primary() { return getActiveColors().primary; },
    get secondary() { return getActiveColors().secondary; },
    get success() { return getActiveColors().success; },
    get error() { return getActiveColors().error; },
    get warning() { return getActiveColors().warning; },
    get white() { return getActiveColors().white; },
    get black() { return getActiveColors().black; },
    get transparent() { return getActiveColors().transparent; },
  },
  card: {
    get background() { return getActiveColors().background; },
    get backgroundLight() { return getActiveColors().backgroundSecondary; },
    get backgroundMedium() { return getActiveColors().backgroundTertiary; },
    get backgroundDark() { return getActiveColors().quaternary; },
    get border() { return getActiveColors().border; },
    get borderLight() { return getActiveColors().borderLight; },
  },
  icon: {
    get primary() { return getActiveColors().primary; },
    get secondary() { return getActiveColors().secondary; },
    get success() { return getActiveColors().success; },
    get error() { return getActiveColors().error; },
    get warning() { return getActiveColors().warning; },
    get info() { return getActiveColors().info; },
    get white() { return getActiveColors().white; },
    get black() { return getActiveColors().black; },
    get grey() { return getActiveColors().textGrey; },
    get brown() { return getActiveColors().brown || "#8b5a2b"; },
  },
};

export const GRADIENT_COLORS = {
  get primary() { return getActiveColors().gradientPrimary; },
  get primaryDark() { return getActiveColors().gradientPrimaryDark; },
  get success() { return getActiveColors().gradientSuccess; },
  get gold() { return getActiveColors().gradientGold; },
  get red() { return getActiveColors().gradientRed; },
  get blue() { return getActiveColors().gradientBlue; },
  get silver() { return getActiveColors().gradientSilver; },
};

export const COMMON_COLORS = {
  get white() { return getActiveColors().white; },
  get black() { return getActiveColors().black; },
  get transparent() { return getActiveColors().transparent; },
  get grey() { return getActiveColors().textGrey; },
  get lightGrey() { return getActiveColors().textLightGrey; },
  get darkGrey() { return getActiveColors().textDarkGrey; },
};

export const RED_COLORS = {
  get primary() { return getActiveColors().error; },
  get light() { return "#ffebee"; },
  get dark() { return "#c62828"; },
  get darker() { return "#b71c1c"; },
  get burgundy() { return "#800020"; },
  get burgundyLight() { return "#9a1f40"; },
  get burgundyDark() { return "#5c061b"; },
};

export const BLUE_COLORS = {
  get primary() { return getActiveColors().info; },
  get dark() { return "#1565c0"; },
  get darker() { return "#0d47a1"; },
  get darkest() { return "#0a2540"; },
};

export const GREEN_COLORS = {
  get primary() { return getActiveColors().success; },
  get light() { return "#e8f5e9"; },
  get success() { return getActiveColors().success; },
};

export const BROWN_COLORS = {
  get primary() { return "#8b5a2b"; },
  get light() { return "#d2b48c"; },
  get dark() { return "#3e2723"; },
  get tan() { return "#b58d3d"; },
};

export const SUPPORT_COLORS = {
  get [0]() { return getActiveColors().gradientPrimary[0]; },
  get [1]() { return getActiveColors().gradientPrimary[1]; },
  get [2]() { return getActiveColors().gradientPrimary[2]; },
};

export const STATUS_BAR_COLORS = {
  get primary() { return getActiveColors().primary; },
  get light() { return getActiveColors().white; },
  get dark() { return getActiveColors().black; },
};

export const COLORS = {
  // Direct getters for all properties
  get primary() { return getActiveColors().primary; },
  get secondary() { return getActiveColors().secondary; },
  get gold() { return getActiveColors().gold || getActiveColors().secondary; },
  get silver() { return getActiveColors().silver || "#C0C0C0"; },

  // Text
  get textPrimary() { return getActiveColors().textPrimary; },
  get textSecondary() { return getActiveColors().textSecondary; },
  get textDark() { return getActiveColors().textDark; },
  get textLight() { return getActiveColors().textLight; },
  get textGrey() { return getActiveColors().textGrey; },
  get textDarkGrey() { return getActiveColors().textDarkGrey; },
  get textMediumGrey() { return getActiveColors().textMediumGrey; },
  get textLightGrey() { return getActiveColors().textLightGrey; },
  get textBrown() { return getActiveColors().textBrown || "#8b5a2b"; },
  get textDarkBrown() { return getActiveColors().textDarkBrown || "#3E2723"; },
  get textSuccess() { return getActiveColors().textSuccess; },
  get textError() { return getActiveColors().textError; },
  get textWarning() { return getActiveColors().textWarning; },

  // Backgrounds
  get background() {
    return {
      get primary() { return getActiveColors().background; },
      get secondary() { return getActiveColors().backgroundSecondary; },
      get tertiary() { return getActiveColors().backgroundTertiary; },
      get quaternary() { return getActiveColors().backgroundQuaternary || getActiveColors().quaternary; },
      get quinary() { return getActiveColors().backgroundQuinary || getActiveColors().quaternary; },
      get card() { return getActiveColors().background; },
      get cardMedium() { return getActiveColors().backgroundSecondary; },
      get cardDark() { return getActiveColors().backgroundTertiary; },
      get muted() { return getActiveColors().lightGrey || "#e5e7eb"; },
      get overlay() { return getActiveColors().blackOverlay || 'rgba(0,0,0,0.5)'; },
      get overlayLight() { return getActiveColors().blackOverlayLight || 'rgba(0,0,0,0.2)'; },
      get overlayMedium() { return 'rgba(0,0,0,0.3)'; },
    };
  },

  get text() {
    return {
      get primary() { return getActiveColors().textPrimary; },
      get secondary() { return getActiveColors().textSecondary; },
      get dark() { return getActiveColors().textDark; },
      get light() { return getActiveColors().textLight; },
      get grey() { return getActiveColors().textGrey; },
      get darkGrey() { return getActiveColors().textDarkGrey; },
      get mediumGrey() { return getActiveColors().textMediumGrey; },
      get lightGrey() { return getActiveColors().textLightGrey; },
      get brown() { return getActiveColors().textBrown || "#8b5a2b"; },
      get darkBrown() { return getActiveColors().textDarkBrown || "#3E2723"; },
      get success() { return getActiveColors().textSuccess; },
      get error() { return getActiveColors().textError; },
      get warning() { return getActiveColors().textWarning; },
      get muted() { return getActiveColors().textGrey; },
      get mutedDark() { return getActiveColors().textDarkGrey; },
      get mutedLight() { return getActiveColors().textLightGrey; },
      get mutedMedium() { return getActiveColors().textMediumGrey; },
    };
  },

  get border() {
    return {
      get primary() { return getActiveColors().border; },
      get light() { return getActiveColors().borderLight; },
      get white() { return getActiveColors().borderWhite || getActiveColors().borderLight; },
      get gold() { return getActiveColors().borderGold || getActiveColors().secondary; },
      get bottom() { return getActiveColors().border; },
      get left() { return getActiveColors().border; },
      get top() { return getActiveColors().border; },
    };
  },

  get shadow() {
    return {
      get black() { return getActiveColors().black; },
      get gold() { return getActiveColors().gold || getActiveColors().secondary; },
      get primary() { return getActiveColors().primary; },
      get success() { return getActiveColors().success; },
    };
  },

  get status() {
    return {
      get active() { return getActiveColors().statusActive || getActiveColors().success; },
      get inactive() { return getActiveColors().statusInactive || getActiveColors().error; },
      get pending() { return getActiveColors().statusPending || getActiveColors().warning; },
      get completed() { return getActiveColors().statusCompleted || getActiveColors().success; },
    };
  },

  get gradients() {
    return {
      get primary() { return getActiveColors().gradientPrimary; },
      get primaryDark() { return getActiveColors().gradientPrimaryDark; },
      get success() { return getActiveColors().gradientSuccess; },
      get gold() { return getActiveColors().gradientGold; },
      get red() { return getActiveColors().gradientRed; },
      get blue() { return getActiveColors().gradientBlue; },
      get silver() { return getActiveColors().gradientSilver; },
    };
  },

  // Flat values
  get white() { return getActiveColors().white; },
  get black() { return getActiveColors().black; },
  get transparent() { return getActiveColors().transparent; },
  get grey() { return getActiveColors().textGrey; },
  get lightGrey() { return getActiveColors().textLightGrey; },
  get darkGrey() { return getActiveColors().textDarkGrey; },
  get borderWhiteLight() { return getActiveColors().borderLight; },
  get borderWhite() { return getActiveColors().borderWhite || getActiveColors().borderLight; },
  get green() { return getActiveColors().success; },
  get greenLight() { return "#e8f5e9"; },
  get goldLight() { return getActiveColors().goldLight || "#fffbe6"; },
  get blue() { return getActiveColors().info; },
  get cardBackgroundLight() { return getActiveColors().cardBackgroundLight || '#fffbe6'; },
  get cardBackgroundMedium() { return getActiveColors().backgroundSecondary; },
  get brownLight() { return "#d2b48c"; },
  get brownOverlay() { return 'rgba(139, 69, 19, 0.3)'; },
  get blackOverlay() { return 'rgba(0,0,0,0.5)'; },
  get whiteOverlay() { return 'rgba(255,255,255,0.9)'; },
  get textDarkBrown() { return '#2C1810'; },
  get whiteOverlayLight() { return 'rgba(255, 255, 255, 0.7)'; },
  get whiteOverlayVeryLight() { return 'rgba(255, 255, 255, 0.1)'; },
  get blackOverlayLight() { return 'rgba(0, 0, 0, 0.2)'; },
};

export default COLORS;

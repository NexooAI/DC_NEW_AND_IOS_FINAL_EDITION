// src/constants/colors.js
// Centralized, dynamically-evaluated color definitions for the entire app

import { theme, lightPalette, darkPalette, createThemeColors } from './theme';

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
      return createThemeColors(basePalette, appConfig.colors);
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
  get silver() { return getActiveColors().silver; },
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
  get brown() { return getActiveColors().textBrown; },
  get darkBrown() { return getActiveColors().textDarkBrown; },
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
  get muted() { return getActiveColors().backgroundTertiary; },
  get overlay() { return getActiveColors().overlay; },
  get overlayLight() { return getActiveColors().overlayLight; },
  get overlayMedium() { return getActiveColors().overlayMedium; },
};

export const STATUS_COLORS = {
  get success() { return getActiveColors().success; },
  get successLight() { return getActiveColors().successLight; },
  get successDark() { return getActiveColors().successDark; },
  get error() { return getActiveColors().error; },
  get errorLight() { return getActiveColors().errorLight; },
  get errorDark() { return getActiveColors().errorDark; },
  get warning() { return getActiveColors().warning; },
  get warningLight() { return getActiveColors().warningLight; },
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
    get brown() { return getActiveColors().textBrown; },
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
  get light() { return getActiveColors().errorLight; },
  get dark() { return getActiveColors().errorDark; },
  get darker() { return getActiveColors().error; },
  get burgundy() { return getActiveColors().primary; },
  get burgundyLight() { return getActiveColors().backgroundTertiary; },
  get burgundyDark() { return getActiveColors().primary; },
};

export const BLUE_COLORS = {
  get primary() { return getActiveColors().info; },
  get dark() { return getActiveColors().info; },
  get darker() { return getActiveColors().primary; },
  get darkest() { return getActiveColors().primary; },
};

export const GREEN_COLORS = {
  get primary() { return getActiveColors().success; },
  get light() { return getActiveColors().successLight; },
  get success() { return getActiveColors().success; },
};

export const BROWN_COLORS = {
  get primary() { return getActiveColors().textBrown; },
  get light() { return getActiveColors().goldLight; },
  get dark() { return getActiveColors().textDarkBrown; },
  get tan() { return getActiveColors().secondary; },
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
  get silver() { return getActiveColors().silver; },

  // Text
  get textPrimary() { return getActiveColors().textPrimary; },
  get textSecondary() { return getActiveColors().textSecondary; },
  get textDark() { return getActiveColors().textDark; },
  get textLight() { return getActiveColors().textLight; },
  get textGrey() { return getActiveColors().textGrey; },
  get textDarkGrey() { return getActiveColors().textDarkGrey; },
  get textMediumGrey() { return getActiveColors().textMediumGrey; },
  get textLightGrey() { return getActiveColors().textLightGrey; },
  get textBrown() { return getActiveColors().textBrown; },
  get textDarkBrown() { return getActiveColors().textDarkBrown; },
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
      get muted() { return getActiveColors().backgroundTertiary; },
      get overlay() { return getActiveColors().overlay; },
      get overlayLight() { return getActiveColors().overlayLight; },
      get overlayMedium() { return getActiveColors().overlayMedium; },
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
      get brown() { return getActiveColors().textBrown; },
      get darkBrown() { return getActiveColors().textDarkBrown; },
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
  get greenLight() { return getActiveColors().successLight; },
  get goldLight() { return getActiveColors().goldLight; },
  get blue() { return getActiveColors().info; },
  get cardBackgroundLight() { return getActiveColors().cardBackgroundLight; },
  get cardBackgroundMedium() { return getActiveColors().backgroundSecondary; },
  get brownLight() { return getActiveColors().goldLight; },
  get brownOverlay() { return getActiveColors().warningLight; },
  get blackOverlay() { return getActiveColors().blackOverlay; },
  get whiteOverlay() { return getActiveColors().whiteOverlay; },
  get textDarkBrown() { return getActiveColors().textDarkBrown; },
  get whiteOverlayLight() { return getActiveColors().whiteOverlayLight; },
  get whiteOverlayVeryLight() { return getActiveColors().whiteOverlayVeryLight; },
  get blackOverlayLight() { return getActiveColors().blackOverlayLight; },

  // Status & semantic colors
  get error() { return getActiveColors().error || "#ef4444"; },
  get errorLight() { return getActiveColors().errorLight || "#fee2e2"; },
  get errorDark() { return getActiveColors().errorDark || "#dc2626"; },
  get warning() { return getActiveColors().warning || "#f59e0b"; },
  get warningLight() { return getActiveColors().warningLight || "#fef3c7"; },
  get success() { return getActiveColors().success || "#10b981"; },
  get successLight() { return getActiveColors().successLight || "#d1fae5"; },
  get successDark() { return getActiveColors().successDark || "#047857"; },
  get info() { return getActiveColors().info || "#3b82f6"; },
  get dark() { return getActiveColors().textDark || getActiveColors().primary; },
  get red() { return getActiveColors().error || "#ef4444"; },
  get goldDark() { return getActiveColors().goldDark || "#B8860B"; },
  get accent() { return getActiveColors().accent || getActiveColors().secondary || "#FFD700"; },
  get bgPrimaryHeavy() { return getActiveColors().bgPrimaryHeavy || getActiveColors().primary; },
  get bgPrimaryMedium() { return getActiveColors().bgPrimaryMedium || getActiveColors().primary; },
  get primaryDark() { return getActiveColors().primaryDark || getActiveColors().primary; },
  get redDarker() { return getActiveColors().redDarker || "#5a000b"; },
  get redBurgundyLight() { return getActiveColors().redBurgundyLight || "#B31313"; },
  get redBurgundyDark() { return getActiveColors().redBurgundyDark || "#700B0B"; },
  get support() { return getActiveColors().support_container || [getActiveColors().primary, getActiveColors().primary, getActiveColors().secondary]; },
};

export default COLORS;

const { themeConfig } = require('./theme.config');

const withAlpha = (hex, alpha) => {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ensureValidGradient = (gradient, fallback) => {
  if (Array.isArray(gradient) && gradient.length >= 2 && gradient.every(c => typeof c === 'string' && c && !c.includes('null') && !c.includes('undefined'))) {
    return gradient;
  }
  if (Array.isArray(fallback) && fallback.length >= 2 && fallback.every(c => typeof c === 'string' && c)) {
    return fallback;
  }
  return ["#0b162c", "#d4af37"];
};

const createThemeColors = (basePalette, overrides = {}) => {
  // Filter out null, undefined, or empty values from overrides to prevent pollution
  const safeOverrides = {};
  if (overrides && typeof overrides === 'object') {
    Object.keys(overrides).forEach(key => {
      const val = overrides[key];
      if (val !== null && val !== undefined && val !== "") {
        safeOverrides[key] = val;
      }
    });
  }

  const colors = {
    ...basePalette,
    ...safeOverrides,
  };

  // Safe fallback gradients
  const fallbackPrimary = ["#0b162c", "#16315c", "#d4af37"];
  const fallbackPrimaryDark = ["#0b162c", "#081121", "#020408"];
  const fallbackSuccess = ["#10b981", "#059669", "#047857"];
  const fallbackGold = ["#d4af37", "#f4c961"];
  const fallbackRed = ["#ef4444", "#dc2626"];
  const fallbackBlue = ["#1e293b", "#334155", "#475569"];
  const fallbackSilver = ["#cbd5e1", "#94a3b8", "#64748b"];

  colors.gradientPrimary = ensureValidGradient(colors.gradientPrimary, fallbackPrimary);
  colors.gradientPrimaryDark = ensureValidGradient(colors.gradientPrimaryDark, fallbackPrimaryDark);
  colors.gradientSuccess = ensureValidGradient(colors.gradientSuccess, fallbackSuccess);
  colors.gradientGold = ensureValidGradient(colors.gradientGold, fallbackGold);
  colors.gradientRed = ensureValidGradient(colors.gradientRed, fallbackRed);
  colors.gradientBlue = ensureValidGradient(colors.gradientBlue, fallbackBlue);
  colors.gradientSilver = ensureValidGradient(colors.gradientSilver, fallbackSilver);

  const isDarkSurface = colors.background === "#121212";
  const textOnPrimary = colors.textPrimary;
  const textOnAccent = isDarkSurface ? "#0b162c" : "#0b162c";
  const surface = colors.background;
  const surfaceElevated = colors.backgroundSecondary;
  const surfaceMuted = colors.backgroundTertiary;
  const inverseSurface = isDarkSurface ? "#f8fafc" : "#0b162c";
  const inverseText = isDarkSurface ? "#0b162c" : "#ffffff";

  return {
    ...colors,
    backgroundQuaternary: colors.backgroundQuaternary || colors.quaternary,
    backgroundQuinary: colors.backgroundQuinary || colors.backgroundTertiary,
    bgBlackHeavy: colors.bgBlackHeavy || "rgba(0, 0, 0, 0.8)",
    bgBlackMedium: colors.bgBlackMedium || "rgba(0, 0, 0, 0.5)",
    surface,
    surfaceElevated,
    surfaceMuted,
    surfaceInverse: inverseSurface,
    textOnPrimary,
    textOnSecondary: textOnAccent,
    textOnAccent,
    textDisabled: colors.textDisabled || colors.textLightGrey,
    iconPrimary: colors.iconPrimary || colors.primary,
    iconSecondary: colors.iconSecondary || colors.secondary,
    iconMuted: colors.iconMuted || colors.textGrey,
    silver: colors.silver || colors.textLightGrey,
    gold: colors.gold || colors.secondary,
    goldLight: colors.goldLight || colors.backgroundTertiary,
    textBrown: colors.textBrown || colors.textSecondary,
    textDarkBrown: colors.textDarkBrown || colors.textDark,
    cardBackgroundLight: colors.cardBackgroundLight || surfaceElevated,
    borderWhite: colors.borderWhite || colors.borderLight,
    successLight: colors.successLight || withAlpha(colors.success, isDarkSurface ? 0.18 : 0.12),
    successDark: colors.successDark || colors.success,
    errorLight: colors.errorLight || withAlpha(colors.error, isDarkSurface ? 0.18 : 0.12),
    errorDark: colors.errorDark || colors.error,
    warningLight: colors.warningLight || withAlpha(colors.warning, isDarkSurface ? 0.2 : 0.14),
    infoLight: colors.infoLight || withAlpha(colors.info, isDarkSurface ? 0.18 : 0.12),
    statusActive: colors.statusActive || colors.success,
    statusInactive: colors.statusInactive || colors.error,
    statusPending: colors.statusPending || colors.warning,
    statusCompleted: colors.statusCompleted || colors.success,
    overlay: colors.overlay || withAlpha("#000000", isDarkSurface ? 0.7 : 0.5),
    overlayLight: colors.overlayLight || withAlpha("#000000", isDarkSurface ? 0.45 : 0.2),
    overlayMedium: colors.overlayMedium || withAlpha("#000000", isDarkSurface ? 0.55 : 0.3),
    bgImageOverlay: colors.bgImageOverlay || colors.overlay || withAlpha("#000000", isDarkSurface ? 0.7 : 0.5),
    bgImageOverlayMedium: colors.bgImageOverlayMedium || colors.overlayMedium || withAlpha("#000000", isDarkSurface ? 0.55 : 0.3),
    blackOverlay: colors.blackOverlay || withAlpha("#000000", 0.5),
    blackOverlayLight: colors.blackOverlayLight || withAlpha("#000000", 0.2),
    whiteOverlay: colors.whiteOverlay || withAlpha("#ffffff", isDarkSurface ? 0.12 : 0.9),
    whiteOverlayLight: colors.whiteOverlayLight || withAlpha("#ffffff", isDarkSurface ? 0.1 : 0.7),
    whiteOverlayVeryLight: colors.whiteOverlayVeryLight || withAlpha("#ffffff", 0.1),
    shadow: colors.shadow || withAlpha("#000000", isDarkSurface ? 0.55 : 0.16),
    buttonPrimary: colors.buttonPrimary || colors.primary,
    buttonPrimaryText: colors.buttonPrimaryText || textOnPrimary,
    buttonSecondary: colors.buttonSecondary || colors.secondary,
    buttonSecondaryText: colors.buttonSecondaryText || textOnAccent,
    buttonDisabled: colors.buttonDisabled || colors.backgroundTertiary,
    buttonDisabledText: colors.buttonDisabledText || colors.textDisabled,
    buttonPressed: colors.buttonPressed || colors.secondary,
    buttonPressedText: colors.buttonPressedText || textOnAccent,
    outlineButtonText: colors.outlineButtonText || colors.primary,
    outlineButtonBorder: colors.outlineButtonBorder || colors.primary,
    inverseText,
  };
};

const lightPalette = createThemeColors({
  primary: themeConfig.primaryColor || "#5B0E2D",
  secondary: themeConfig.secondaryColor || "#D4AF37",
  tertiary: "#F2B8C6",
  quaternary: "#F8F5EC",
  bgBlackHeavy: "rgba(0, 0, 0, 0.85)",
  bgBlackMedium: "rgba(0, 0, 0, 0.5)",
  background: "#fafafa",
  backgroundSecondary: "#f0f0f0",
  backgroundTertiary: "#f3f4f6",
  textPrimary: "#ffffff",
  textSecondary: "#1e293b",
  textDark: themeConfig.primaryColor || "#5B0E2D",
  textLight: "#ffffff",
  textGrey: "#64748b",
  textDarkGrey: "#1e293b",
  textMediumGrey: "#64748b",
  textLightGrey: "#94a3b8",
  textSuccess: "#10b981",
  textError: "#ef4444",
  textWarning: "#f59e0b",
  error: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#3b82f6",
  border: "#cbd5e1",
  borderLight: "#e2e8f0",
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
  gradientPrimary: [themeConfig.primaryColor || "#5B0E2D", "#7A143C", "#D4AF37"],
  gradientPrimaryDark: [themeConfig.primaryColor || "#5B0E2D", "#3D081D", "#20030E"],
  gradientSuccess: ["#10b981", "#059669", "#047857"],
  gradientGold: [themeConfig.secondaryColor || "#D4AF37", "#faeba0"],
  gradientRed: ["#ef4444", "#dc2626"],
  gradientBlue: ["#1e293b", "#334155", "#475569"],
  gradientSilver: ["#cbd5e1", "#94a3b8", "#64748b"],
  support_container: [themeConfig.primaryColor || "#5B0E2D", "#7A143C", "#3D081D"],
  text: {
    primary: "#ffffff",
    secondary: "#1e293b",
    dark: "#0b162c",
    light: "#ffffff",
    grey: "#64748b",
    darkGrey: "#1e293b",
    mediumGrey: "#64748b",
    lightGrey: "#94a3b8",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
  },
  additional: {
    formBg: "#fafafa",
    formBorder: "#cbd5e1",
    formText: "#64748b",
    formTextDark: "#1e293b",
    buttonOrange: "#f97316",
  }
});

const darkPalette = createThemeColors({
  primary: "#0b162c",
  secondary: "#ffd700",
  tertiary: "#F2B8C6",
  quaternary: "#22252a",
  bgBlackHeavy: "rgba(0, 0, 0, 0.9)",
  bgBlackMedium: "rgba(0, 0, 0, 0.7)",
  background: "#121212",
  backgroundSecondary: "#1e1e1e",
  backgroundTertiary: "#2a2a2a",
  textPrimary: "#ffffff",
  textSecondary: "#f8fafc",
  textDark: "#f8fafc",
  textLight: "#ffffff",
  textGrey: "#94a3b8",
  textDarkGrey: "#f8fafc",
  textMediumGrey: "#94a3b8",
  textLightGrey: "#64748b",
  textSuccess: "#34d399",
  textError: "#f87171",
  textWarning: "#fbbf24",
  error: "#f87171",
  success: "#34d399",
  warning: "#fbbf24",
  info: "#60a5fa",
  border: "#2d3748",
  borderLight: "#3f485a",
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
  gradientPrimary: ["#0b162c", "#1e293b", "#ffd700"],
  gradientPrimaryDark: ["#121212", "#1e1e1e", "#2a2a2a"],
  gradientSuccess: ["#34d399", "#059669", "#047857"],
  gradientGold: ["#ffd700", "#f4c961"],
  gradientRed: ["#f87171", "#dc2626"],
  gradientBlue: ["#1e1e1e", "#2d3748", "#3f485a"],
  gradientSilver: ["#cbd5e1", "#94a3b8", "#64748b"],
  support_container: ["#121212", "#1e1e1e", "#2a2a2a"],
  text: {
    primary: "#ffffff",
    secondary: "#f8fafc",
    dark: "#f8fafc",
    light: "#ffffff",
    grey: "#94a3b8",
    darkGrey: "#f8fafc",
    mediumGrey: "#94a3b8",
    lightGrey: "#64748b",
    success: "#34d399",
    error: "#f87171",
    warning: "#fbbf24",
  },
  additional: {
    formBg: "#1e1e1e",
    formBorder: "#2d3748",
    formText: "#94a3b8",
    formTextDark: "#f8fafc",
    buttonOrange: "#f97316",
  }
});

const theme = {
  get colors() {
    try {
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
      return lightPalette;
    }
  },

  get button() {
    const colors = this.colors;

    return {
      background: colors.buttonSecondary,
      text: colors.buttonSecondaryText,
      primary: {
        background: colors.buttonPrimary,
        text: colors.buttonPrimaryText,
      },
      secondary: {
        background: colors.buttonSecondary,
        text: colors.buttonSecondaryText,
      },
      success: {
        background: colors.success,
        text: colors.textLight,
      },
      error: {
        background: colors.error,
        text: colors.textLight,
      },
      warning: {
        background: colors.warning,
        text: colors.textOnAccent,
      },
      outline: {
        background: colors.transparent,
        text: colors.outlineButtonText,
        border: colors.outlineButtonBorder,
      },
      ghost: {
        background: colors.transparent,
        text: colors.outlineButtonText,
      },

      // Button sizes
      small: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 12,
      },
      medium: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
      },
      large: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: 16,
      },

      disabled: {
        background: colors.buttonDisabled,
        text: colors.buttonDisabledText,
      },
      pressed: {
        background: colors.buttonPressed,
        text: colors.buttonPressedText,
      },
    };
  },

  // Comprehensive images object with semantic keys
  images: {
    // Authentication and login backgrounds
    auth: {
      loginBg: "../../assets/images/bg_login.jpg",
      newBg: "../../assets/images/bg_new.jpg",
      logo: "../../assets/images/logo_trans.png",
      splashLogo: "../../assets/images/splashscreen_logo.png",
      adaptiveIcon: "../../assets/images/adaptive-icon.png",
    },

    // Navigation and UI elements
    navigation: {
      menuBg: "../../assets/images/menu_bg.png",
      goldPattern: "../../assets/images/gold_pattern.jpg",
      cancelIcon: "../../assets/images/cancel.png",
      successIcon: "../../assets/images/success.png",
      noData: "../../assets/images/no-data.png",
    },

    // Product and scheme images
    products: {
      gold: "../../assets/images/gold.png",
      silver: "../../assets/images/silver.png",
      goldBar: "../../assets/images/bar.png",
      schemeCardBg: "../../assets/images/scheme_card_bg.png",
      saveAsMoney: "../../assets/images/saveasmoneyproduct.png",
      saveGold: "../../assets/images/savegold.png",
      digiGoldProduct: "../../assets/images/digigoldproduct.png",
      rupeeBg: "../../assets/images/rupee-bg.png",
    },

    // Slider and banner images
    banners: {
      slider1: "../../assets/images/slider.png",
      slider2: "../../assets/images/slider2.png",
      slider3: "../../assets/images/slider3.png",
      slider4: "../../assets/images/slider4.png",
      banner: "../../assets/images/banner.png",
      banner2: "../../assets/images/banner2.png",
      flashBanner: "../../assets/images/flashbanner.png",
    },

    // Status and collection images
    status: {
      status1: "../../assets/images/status1.jpg",
      status2: "../../assets/images/status2.jpg",
      status3: "../../assets/images/status3.jpg",
      status4: "../../assets/images/status4.jpg",
      status5: "../../assets/images/status5.jpg",
      status6: "../../assets/images/status6.jpg",
    },

    // Scheme images
    schemes: {
      scheme1: "../../assets/images/scheme1.jpg",
      scheme2: "../../assets/images/scheme2.jpg",
      scheme3: "../../assets/images/scheme3.jpg",
      scheme4: "../../assets/images/scheme4.jpg",
    },

    // Store and location images
    store: {
      storeIcon: "../../assets/images/store.png",
      shopIcon: "../../assets/images/shop.jpg",
      mapPin: "../../assets/images/map-pin.png",
      centerLocation: "../../assets/images/center-location.png",
      centralPark: "../../assets/images/central-park.jpg",
      empireState: "../../assets/images/empire-state.jpg",
    },

    // Savings and background images
    savings: {
      savingsBg: "../../assets/images/savingsbg.jpg",
      savingBg: "../../assets/images/saving_bg.png",
    },

    // Hallmark images
    hallmarks: {
      hallmark1: "../../assets/images/halmark1.jpg",
      hallmark2: "../../assets/images/halmark2.jpg",
    },

    // Translation and language images
    translate: {
      malayalam: "../../assets/images/translate/mal.png",
      english: "../../assets/images/translate/eng.png",
    },

    // Intro screen images
    intro: {
      intro1: "../../assets/images/intro_1.png",
      intro2: "../../assets/images/intro_1.png",
      intro3: "../../assets/images/intro_1.png",
    },

    // Error and utility images
    utility: {
      error404: "../../assets/images/404.jpg",
    },

    // Additional images found in components
    additional: {
      // Download and notification images
      notification: "../../assets/sound/notification.wav",
    },
  },

  // Legacy image object for backward compatibility
  image: {
    splashScreen: "../../assets/images/splashscreen_logo.png",
    splash_logo: "../../assets/images/splashscreen_logo.png",
    adative_icon: "../../assets/images/adaptive-icon.png",
    transparentLogo: "../../assets/images/logo_trans.png",
    menu_bg: "../../assets/images/menu_bg.png",
    bg_image: "../../assets/images/bg_login.jpg",
    gold_image: "../../assets/images/bar.png",
    silver_image: "../../assets/images/silver.png",
    sliderImages: [
      "../../assets/images/slider.png",
      "../../assets/images/slider2.png",
      "../../assets/images/slider3.png",
      "../../assets/images/slider4.png",
    ],
    store_image: "../../assets/images/store.png",
    gold_pattern: "../../assets/images/gold_pattern.jpg",
    cancel_icon: "../../assets/images/cancel.png",
    success_icon: "../../assets/images/success.png",
    shop_icon: "../../assets/images/shop.jpg",
    no_data: "../../assets/images/no-data.png",
    savings_bg: "../../assets/images/savingsbg.jpg",
    digigoldproduct: "../../assets/images/digigoldproduct.png",
    translate: "../../assets/images/translate/mal.png",
    bg_new: "../../assets/images/bg_new.jpg",
  },

  constants: {
    customerName: themeConfig.customerName || "Sri Ganapathy Jewel City",
    address: themeConfig.address || "M245+HGH, Kadai veethi, Puliampatti, Pollachi, Tamil Nadu 642001",
    mobile: themeConfig.mobile || "+919842230015",
    whatsapp: themeConfig.whatsapp || "+919842230015",
    email: themeConfig.email || "info@ganapathijewelcity.com",
    website: themeConfig.website || "https://ganapathijewelcity.com",
    latitude: themeConfig.latitude || 10.6582,
    longitude: themeConfig.longitude || 77.0084,
    foundationYear: themeConfig.foundationYear || 1998,
    enableDashboard: themeConfig.enableDashboard !== undefined ? themeConfig.enableDashboard : false,
    homeVersion: themeConfig.homeVersion || "v2",
    enableHomeV2: themeConfig.enableHomeV2 !== undefined ? themeConfig.enableHomeV2 : true,
    providerName: "Agnisofterp",
    providerUrl: "https://agnisofterp.com/",
  },
  homeVersion: themeConfig.homeVersion || "v2",
  enableHomeV2: themeConfig.enableHomeV2 !== undefined ? themeConfig.enableHomeV2 : true,
  baseUrl: themeConfig.baseUrl || themeConfig.baseURL || "https://api.sriganapathijewelcity.com",
  youtubeUrl: themeConfig.youtubeUrl || "https://youtu.be/8RAhdn5b9Bw",
};

module.exports = { theme, lightPalette, darkPalette, createThemeColors };

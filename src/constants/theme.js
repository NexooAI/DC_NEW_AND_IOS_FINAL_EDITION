const lightPalette = {
  primary: "#0b162c",
  secondary: "#d4af37",
  tertiary: "#F2B8C6",
  quaternary: "#F2E6D2",
  background: "#fafafa",
  backgroundSecondary: "#f0f0f0",
  backgroundTertiary: "#f3f4f6",
  textPrimary: "#ffffff",
  textSecondary: "#1e293b",
  textDark: "#0b162c",
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
  gradientPrimary: ["#0b162c", "#16315c", "#d4af37"],
  gradientPrimaryDark: ["#0b162c", "#081121", "#020408"],
  gradientSuccess: ["#10b981", "#059669", "#047857"],
  gradientGold: ["#d4af37", "#f4c961"],
  gradientRed: ["#ef4444", "#dc2626"],
  gradientBlue: ["#1e293b", "#334155", "#475569"],
  gradientSilver: ["#cbd5e1", "#94a3b8", "#64748b"],
  support_container: ["#0b162c", "#16315c", "#1e3a6c"],
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
};

const darkPalette = {
  primary: "#0b162c",
  secondary: "#ffd700",
  tertiary: "#F2B8C6",
  quaternary: "#22252a",
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
  white: "#1e1e1e",
  black: "#ffffff",
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
};

const theme = {
  get colors() {
    try {
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
      return lightPalette;
    }
  },

  // Standardized button configuration
  button: {
    // Default button colors
    background: "#FFD700", // Gold background as requested
    text: "#000000", // Black text for contrast

    // Button variants
    primary: {
      background: "#1a2a39",
      text: "#ffffff",
    },
    secondary: {
      background: "#ffc90c",
      text: "#000000",
    },
    success: {
      background: "#4CAF50",
      text: "#ffffff",
    },
    error: {
      background: "#ff4444",
      text: "#ffffff",
    },
    warning: {
      background: "#FF9800",
      text: "#ffffff",
    },
    outline: {
      background: "transparent",
      text: "#0e1e38",
      border: "#0e1e38",
    },
    ghost: {
      background: "transparent",
      text: "#0e1e38",
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

    // Button states
    disabled: {
      background: "#cccccc",
      text: "#666666",
    },
    pressed: {
      background: "#B8860B", // Darker gold when pressed
      text: "#000000",
    },
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
      slider1: "../../assets/images/slider1.png",
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
      intro2: "../../assets/images/intro_2.png",
      intro3: "../../assets/images/intro_3.png",
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
      "../../assets/images/slider1.png",
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
    customerName: "Sri Thanga Thamarai",
    address: "2/59, Pacharisikara Street, Khansa Mettu Street, Madurai - 625001",
    mobile: "+919876543210",
    whatsapp: "+919876543210",
    email: "info@sttjewellers.com",
    website: "https://srithangathamarai.com",
    latitude: 9.9175,
    longitude: 78.1192,
    foundationYear: 1995,
    enableDashboard: false,
  },
  baseUrl: "https://api.prod.dcjewellers.org",
  // baseUrl: "https://nexooai.ramcarmotor.com",
  youtubeUrl: "https://youtu.be/8RAhdn5b9Bw",
};

module.exports = { theme, lightPalette, darkPalette };

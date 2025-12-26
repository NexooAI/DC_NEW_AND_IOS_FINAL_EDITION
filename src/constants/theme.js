// src/constants/theme.js

const theme = {
  colors: {
    // Primary brand colors
    primary: "#850111",
    secondary: "#ffc90c", //
    tertiary: "#F2B8C6",

    // Background colors
    background: "#ffffff",
    backgroundSecondary: "#f0f0f0",
    backgroundTertiary: "#f3f4f6",
    backgroundQuaternary: "#f5f5f5",
    backgroundQuinary: "#f7f7f7",

    // Text colors
    textPrimary: "#ffffff",
    textSecondary: "#000000",
    textDark: "#2e0406",
    textLight: "#ffffff",
    textGrey: "#808080",
    textDarkGrey: "#333",
    textMediumGrey: "#666",
    textLightGrey: "#888",
    textBrown: "#8B4513",
    textDarkBrown: "#2C1810",
    textSuccess: "#00cc44",
    textError: "#ff4444",
    textWarning: "#FF9800",

    // Status colors
    error: "#ff4d4f",
    errorLight: "#FF6B6B",
    errorDark: "#D32F2F",
    success: "#4CAF50",
    successLight: "#4caf50",
    successDark: "#2E7D32",
    warning: "#FF9800",
    warningLight: "#FFC857",
    info: "#007AFF",

    // Border colors
    border: "#cccccc",
    borderLight: "#e5e5e5",
    borderWhite: "#f0f0f0",
    borderGold: "#ffd700",

    // Input and form colors
    inputBackground: "rgba(255, 255, 255, 0.2)",

    // Link colors
    link: "#ffc90c",

    // Neutral colors
    white: "#ffffff",
    black: "#000000",
    grey: "#808080",
    lightGrey: "#f0f0f0",
    darkGrey: "#808080",
    lightBlack: "#000000",
    transparent: "transparent",

    // Gold and metallic colors
    gold: "#ffd700",
    goldLight: "#DAA520",
    goldDark: "#B8860B",
    goldDarker: "#8B4513",
    silver: "#C0C0C0",
    silverLight: "#A8A8A8",
    silverDark: "#808080",

    // Red and burgundy colors
    red: "#FF0000",
    redLight: "#ff4444",
    redDark: "#7c0a12",
    redDarker: "#5a000b",
    redBurgundy: "#7b0006",
    redBurgundyLight: "#B31313",
    redBurgundyDark: "#8B0000",

    // Blue colors
    blue: "#60a5fa",
    blueDark: "#1a1a2e",
    blueDarker: "#16213e",
    blueDarkest: "#0f3460",

    // Green colors
    green: "#4ade80",
    greenLight: "#96fc88",
    greenSuccess: "#00cc44",

    // Brown and tan colors
    brown: "#8B4513",
    brownLight: "#F5DEB3",
    brownDark: "#2C1810",
    tan: "#FFF8DC",

    // Support container colors
    support_container: ["#1a4a6d", "#2a5a8d", "#3a6aad"],

    // Overlay and shadow colors
    overlayDark: "rgba(0, 0, 0, 0.5)",
    overlayLight: "rgba(255, 255, 255, 0.2)",
    overlayMedium: "rgba(255, 255, 255, 0.5)",
    overlayHeavy: "rgba(0, 0, 0, 0.8)",

    // Shadow colors
    shadowBlack: "#000",
    shadowGold: "#ffd700",
    shadowPrimary: "#850111",
    shadowSuccess: "#4CAF50",

    // Specific UI colors
    statusActive: "#2E7D32",
    statusInactive: "#D32F2F",
    statusPending: "#FF9800",
    statusCompleted: "#4CAF50",

    // Gradient colors
    gradientPrimary: ["#850111", "#B8860B", "#DAA520"],
    gradientPrimaryDark: ["#850111", "#5a000b", "#2e0406"],
    gradientSuccess: ["#4CAF50", "#45a049", "#3d8b40"],
    gradientGold: ["#ffc90c", "#ffd700"],
    gradientRed: ["#B31313", "#8B0000"],
    gradientBlue: ["#1a1a2e", "#16213e", "#0f3460"],
    gradientSilver: ["#C0C0C0", "#A8A8A8", "#808080"],

    // Background image colors
    bgImageOverlay: "rgba(0,0,0,0.7)",
    bgImageOverlayLight: "rgba(0,0,0,0.5)",
    bgImageOverlayMedium: "rgba(0,0,0,0.3)",

    // Text shadow colors
    textShadowGold: "rgba(255, 215, 0, 0.8)",
    textShadowBlack: "rgba(0, 0, 0, 0.3)",
    textShadowWhite: "rgba(255, 255, 255, 0.5)",
    textShadowBrown: "rgba(139, 69, 19, 0.3)",

    // Border opacity colors
    borderWhiteLight: "rgba(255, 255, 255, 0.3)",
    borderWhiteMedium: "rgba(255, 255, 255, 0.5)",
    borderGoldLight: "rgba(255, 215, 0, 0.2)",
    borderGoldMedium: "rgba(255, 215, 0, 0.3)",

    // Background opacity colors
    bgWhiteLight: "rgba(255, 255, 255, 0.1)",
    bgWhiteMedium: "rgba(255, 255, 255, 0.2)",
    bgWhiteHeavy: "rgba(255, 255, 255, 0.5)",
    bgWhiteVeryHeavy: "rgba(255, 255, 255, 0.8)",
    bgBlackLight: "rgba(0, 0, 0, 0.1)",
    bgBlackMedium: "rgba(0, 0, 0, 0.2)",
    bgBlackHeavy: "rgba(0, 0, 0, 0.5)",
    bgPrimaryLight: "rgba(133, 1, 17, 0.1)",
    bgPrimaryMedium: "rgba(133, 1, 17, 0.15)",
    bgPrimaryHeavy: "rgba(133, 1, 17, 0.85)",
    bgGoldLight: "rgba(255, 215, 0, 0.1)",
    bgGoldMedium: "rgba(255, 215, 0, 0.2)",
    bgGoldHeavy: "rgba(255, 215, 0, 0.25)",
    bgSuccessLight: "rgba(0, 204, 68, 0.1)",
    bgErrorLight: "rgba(255, 68, 68, 0.1)",
    bgErrorMedium: "rgba(255, 68, 68, 0.95)",

    // Specific component colors
    tabInactive: "#888",
    tabActive: "#FFC857",
    tabBackground: "#777",
    tabBackgroundLight: "#f0f0f0",
    tabBackgroundMedium: "#f5f5f5",
    tabBackgroundHeavy: "#f7f7f7",

    // Icon colors
    iconPrimary: "#850111",
    iconSecondary: "#ffd700",
    iconSuccess: "#4CAF50",
    iconError: "#ff4444",
    iconWarning: "#FF9800",
    iconInfo: "#60a5fa",
    iconWhite: "#FFFFFF",
    iconBlack: "#000",
    iconGrey: "#777",
    iconBrown: "#8B4513",

    // Button colors
    buttonPrimary: "#850111",
    buttonSecondary: "#ffc90c",
    buttonSuccess: "#4CAF50",
    buttonError: "#ff4444",
    buttonWarning: "#FF9800",
    buttonWhite: "#ffffff",
    buttonBlack: "#000000",
    buttonTransparent: "transparent",

    // Card colors
    cardBackground: "#ffffff",
    cardBackgroundLight: "#FFF8DC",
    cardBackgroundMedium: "#F5DEB3",
    cardBackgroundDark: "#f3f4f6",
    cardBorder: "#e5e5e5",
    cardBorderLight: "#f0f0f0",

    // Status bar colors
    statusBarPrimary: "#5a000b",
    statusBarLight: "light-content",
    statusBarDark: "dark-content",

    // Additional colors found in components
    // Common UI colors
    common: {
      white: "#ffffff",
      black: "#000000",
      transparent: "transparent",
    },

    // Overlay colors
    blackOverlay: "rgba(0,0,0,0.5)",
    blackOverlayLight: "rgba(0,0,0,0.2)",

    // Additional hardcoded colors found in components
    additional: {
      // Form and input colors
      formBg: "#f8f9fa",
      formBorder: "#f0f0f0",
      formText: "#666",
      formTextDark: "#333",
      formTextMedium: "#555",
      formTextLight: "#999999",

      // Button and action colors
      buttonOrange: "#ff6b35",
      buttonBlue: "#007AFF",
      buttonGrey: "#e0e0e0",

      // Status and notification colors
      statusBlue: "#1976d2",
      statusGold: "#bfa14a",
      statusGreen: "#388e3c",
      statusRed: "#FF3B30",

      // UI element colors
      cardBgLight: "#fafafa",
      cardBgMedium: "#F9F9F9",
      cardBgDark: "#EEE",
      cardBorder: "#E0E0E0",

      // Text variations
      textMuted: "#595959",
      textMutedDark: "#262626",
      textMutedLight: "#bfbfbf",
      textMutedMedium: "#555555",
      textLightGrey: "#9E9E9E",

      // Background variations
      bgLight: "#f9fafb",
      bgMedium: "#f3f4f6",
      bgDark: "#ef4444",
      bgGrey: "#6b7280",
      bgLightGrey: "#374151",
      bgDarkGrey: "#1f2937",
      bgMediumGrey: "#222",
      bgLightMedium: "#444",

      // Icon background colors
      iconBgBlue: "#E3F2FD",
      iconBgGreen: "#E8F5E9",
      iconBgOrange: "#FFF3E0",
      iconBgRed: "#FFEBEE",
      iconBgRedText: "#F44336",

      // Collection status colors
      collectionBlue: "#4ECDC4",
      collectionGreen: "#45B7D1",
      collectionLightGreen: "#96CEB4",
      collectionOrange: "#FFA726",
    },

    // Text variations
    text: {
      primary: "#ffffff",
      secondary: "#000000",
      dark: "#2e0406",
      light: "#ffffff",
      grey: "#808080",
      darkGrey: "#333",
      mediumGrey: "#666",
      lightGrey: "#888",
      brown: "#8B4513",
      darkBrown: "#2C1810",
      success: "#00cc44",
      error: "#ff4444",
      warning: "#FF9800",
      // Additional text colors found
      muted: "#595959",
      mutedDark: "#262626",
      mutedLight: "#bfbfbf",
      mutedMedium: "#555555",
    },

    // Background variations
    bg: {
      white: "#ffffff",
      light: "#f0f0f0",
      medium: "#f5f5f5",
      dark: "#f3f4f6",
      card: "#FFF8DC",
      cardMedium: "#F5DEB3",
      cardDark: "#f7f7f7",
      // Additional background colors found
      muted: "#f7f7f7",
      overlay: "rgba(0,0,0,0.7)",
      overlayLight: "rgba(0,0,0,0.5)",
      overlayMedium: "rgba(0,0,0,0.3)",
    },

    // Border variations
    borderVariants: {
      light: "#e5e5e5",
      white: "#f0f0f0",
      gold: "#ffd700",
      muted: "#cccccc",
      // Additional border colors found
      bottom: "#f0f0f0",
      left: "#850111",
      top: "#f0f0f0",
    },

    // Shadow variations
    shadow: {
      black: "#000",
      gold: "#ffd700",
      primary: "#850111",
      success: "#4CAF50",
    },

    // Status variations
    status: {
      active: "#2E7D32",
      inactive: "#D32F2F",
      pending: "#FF9800",
      completed: "#4CAF50",
    },

    // Component-specific colors
    components: {
      tab: {
        inactive: "#888",
        active: "#FFC857",
        background: "#777",
        backgroundLight: "#f0f0f0",
        backgroundMedium: "#f5f5f5",
        backgroundHeavy: "#f7f7f7",
      },
      button: {
        primary: "#850111",
        secondary: "#ffc90c",
        success: "#4CAF50",
        error: "#ff4444",
        warning: "#FF9800",
        white: "#ffffff",
        black: "#000000",
        transparent: "transparent",
      },
      card: {
        background: "#ffffff",
        backgroundLight: "#FFF8DC",
        backgroundMedium: "#F5DEB3",
        backgroundDark: "#f3f4f6",
        border: "#e5e5e5",
        borderLight: "#f0f0f0",
      },
      icon: {
        primary: "#850111",
        secondary: "#ffd700",
        success: "#4CAF50",
        error: "#ff4444",
        warning: "#FF9800",
        info: "#60a5fa",
        white: "#FFFFFF",
        black: "#000",
        grey: "#777",
        brown: "#8B4513",
      },
    },
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
      text: "#850111",
      border: "#850111",
    },
    ghost: {
      background: "transparent",
      text: "#850111",
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
    customerName: "DC Jewellers",
    address: "Road Fathima Nagar, Mission Quarters, Anchery, Thrissur, Kerala 680005",
    mobile: "+919061803999",
    whatsapp: "+919061803999",
    email: "dcjewellerstcr@gmail.com",
    website: "https://www.dcjewellers.org",
    latitude: 8.427828080550306,
    longitude: 78.02855977120382,
  },
  baseUrl: "https://api.prod.dcjewellers.org",
  // baseUrl: "https://nexooai.ramcarmotor.com",
  youtubeUrl: "https://youtu.be/8RAhdn5b9Bw",
};

module.exports = { theme };

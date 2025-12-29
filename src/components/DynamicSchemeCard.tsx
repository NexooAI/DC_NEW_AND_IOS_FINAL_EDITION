import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "../constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { theme } from "@/constants/theme";
import api from "@/services/api";
import { logger } from "@/utils/logger";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useGlobalStore from "@/store/global.store";

const { width: screenWidth } = Dimensions.get("window");
console.log('DynamicSchemeCard', useAppVisibility);

// Type guard functions for better null/undefined handling
const isValidScheme = (scheme: any): scheme is Scheme => {
  return (
    scheme !== null &&
    scheme !== undefined &&
    typeof scheme === "object" &&
    (scheme.SCHEMEID !== undefined || scheme.SCHEMENAME !== undefined)
  );
};

const isValidString = (value: any): value is string => {
  return typeof value === "string" && value.trim() !== "";
};

const isValidNumber = (value: any): value is number => {
  return typeof value === "number" && !isNaN(value);
};

const isValidArray = (value: any): value is any[] => {
  return Array.isArray(value) && value.length > 0;
};

interface Chit {
  CHITID: number | null | undefined;
  AMOUNT: string | null | undefined;
  NOINS?: number | null | undefined;
  TOTALMEMBERS?: number | null | undefined;
  PAYMENT_FREQUENCY?: string | null | undefined;
  ACTIVE?: string | null | undefined;
  PAYMENT_FREQUENCY_ID?: string | null | undefined;
}

interface Scheme {
  SCHEMEID: number | null | undefined;
  SCHEMENAME: string | { en: string; ta: string } | null | undefined;
  DESCRIPTION: string | { en: string; ta: string } | null | undefined;
  SLOGAN?: string | null | undefined;
  SCHEMETYPE?: string | null | undefined;
  savingType?: string | null | undefined; // "weight" or "amount"
  DURATION_MONTHS?: number | null | undefined;
  IMAGE?: string | null | undefined;
  ICON?: string | null | undefined;
  chits?: Chit[] | null | undefined;
  table_meta?:
  | {
    headers?: {
      en?: string[];
      ta?: string[];
    };
    rows?: Array<Record<string, any>>;
  }
  | null
  | undefined;
}

interface DynamicSchemeCardProps {
  onJoinPress?: (scheme: Scheme) => void;
  onInfoPress?: (scheme: Scheme) => void;
  onQuickJoinPress?: (scheme: Scheme) => void;
  showDots?: boolean; // Show pagination dots
  visibilityFlags?: {
    showFlexiScheme: boolean;
    showFixedScheme: boolean;
    showDailyScheme: boolean;
    showWeeklyScheme: boolean;
    showMonthlyScheme: boolean;
  };
}

const DynamicSchemeCard: React.FC<DynamicSchemeCardProps> = ({
  onJoinPress,
  onInfoPress,
  onQuickJoinPress,
  showDots = true,
  visibilityFlags,
}) => {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { language } = useGlobalStore();
  const { isVisible } = useAppVisibility();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = React.useRef<FlatList>(null);

  const currentLanguage = locale;
  const showSchemsPage = isVisible("showSchemsPage");

  // Load schemes data from API with cache
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const { fetchSchemesWithCache } = await import("@/utils/apiCache");
        const schemesData = await fetchSchemesWithCache();

        if (schemesData && isValidArray(schemesData)) {
          // Filter out invalid schemes first
          const validSchemes = schemesData.filter(isValidScheme);

          if (validSchemes.length === 0) {
            logger.warn("No valid schemes found in API response");
            setSchemes([]);
            return;
          }

          let filteredSchemes = validSchemes;

          // Filter schemes based on visibility flags
          if (visibilityFlags) {
            filteredSchemes = validSchemes.filter((scheme: Scheme) => {
              const schemeType = getLocalizedText(
                scheme.SCHEMETYPE
              ).toLowerCase();

              // Map scheme types to visibility flags
              if (
                schemeType.includes("flexi") ||
                schemeType.includes("flexible")
              ) {
                return visibilityFlags.showFlexiScheme;
              }
              if (schemeType.includes("fixed")) {
                return visibilityFlags.showFixedScheme;
              }
              if (schemeType.includes("daily")) {
                return visibilityFlags.showDailyScheme;
              }
              if (schemeType.includes("weekly")) {
                return visibilityFlags.showWeeklyScheme;
              }
              if (schemeType.includes("monthly")) {
                return visibilityFlags.showMonthlyScheme;
              }

              // If no specific type matches, show by default
              return true;
            });
          }

          setSchemes(filteredSchemes);
        } else {
          logger.warn("No schemes data in API response");
          setSchemes([]);
        }
      } catch (error) {
        logger.error("Error fetching schemes:", error);
        setSchemes([]);
      }
    };

    fetchSchemes();
  }, [visibilityFlags]);

  const getSchemeTypeForTab = (scheme: Scheme): string => {
    // First check if scheme has chits to determine the actual payment frequency
    if (scheme.chits && scheme.chits.length > 0) {
      const activeChits = scheme.chits.filter(
        (chit) => chit && chit.ACTIVE === "Y"
      );
      if (activeChits.length > 0) {
        const paymentFrequencies = activeChits
          .map((chit) => chit.PAYMENT_FREQUENCY)
          .filter(Boolean);
        if (paymentFrequencies.length > 0) {
          // Check if any chit is flexi/flexible
          const flexiChits = paymentFrequencies.filter(freq =>
            freq && (freq.toLowerCase().includes("flexi") || freq.toLowerCase().includes("flexible"))
          );
          if (flexiChits.length > 0) {
            return "Flexi";
          }
          // Return the first active payment frequency
          return paymentFrequencies[0] || "Monthly";
        }
      }
    }

    // Fallback to SCHEMETYPE field
    const schemeType = getLocalizedText(scheme.SCHEMETYPE).toLowerCase();

    if (schemeType.includes("flexi") || schemeType.includes("flexible")) {
      return "Flexi";
    } else if (schemeType.includes("daily")) {
      return "Daily";
    } else if (schemeType.includes("weekly")) {
      return "Weekly";
    } else if (schemeType.includes("monthly")) {
      return "Monthly";
    }

    return "Monthly"; // Default fallback
  };

  // Handle Quick Join (Popup)
  const handleQuickJoinPress = (scheme: Scheme | null = null) => {
    const schemeToJoin = scheme || selectedScheme;
    if (!schemeToJoin) return;
    
    if (onQuickJoinPress) {
       onQuickJoinPress(schemeToJoin);
       closeModal();
    } else {
      logger.warn("No onQuickJoinPress handler provided");
    }
  };

  const handleJoinPress = async (scheme: Scheme | null = null) => {
    const schemeToJoin = scheme || selectedScheme;
    if (!schemeToJoin) {
      console.error("Join Savings - scheme is null");
      return;
    }

    setIsLoading(true);
    try {
      // Standard Navigation Logic Only
      if (onJoinPress) {
        logger.log("Using custom onJoinPress handler", schemeToJoin);
        await onJoinPress(schemeToJoin);
      } else {
        // Fallback internal navigation
         logger.log("Redirecting dynamic card directly to join_savings (bypassing schemes/calculator)");

        // Determine scheme type and active tab
        const targetTab = getSchemeTypeForTab(schemeToJoin);
        const isFlexi = targetTab.toLowerCase() === "flexi";

        // Get relevant chits
        const chits = schemeToJoin.chits || [];
        const relevantChits = chits.filter(
          (chit) => {
            if (!chit || !chit.PAYMENT_FREQUENCY) return false;
            const chitFreq = chit.PAYMENT_FREQUENCY.toLowerCase().trim();
            const targetTabLower = targetTab.toLowerCase().trim();

            if (chitFreq === targetTabLower) return true;
            if (targetTabLower === "flexi") {
              return chitFreq.includes("flexi") || chitFreq.includes("flexible");
            }
            return false;
          }
        );

        // Prepare scheme data to store
        const schemeDataToStore = {
          schemeId: schemeToJoin.SCHEMEID || 0,
          name: getTranslatedText(schemeToJoin.SCHEMENAME as any, language) || "Unnamed Scheme",
          description: getTranslatedText(schemeToJoin.DESCRIPTION as any, language) || "No description available",
          type: targetTab,
          chits: relevantChits,
          schemeType: isFlexi ? "flexi" : "fixed",
          activeTab: targetTab,
          benefits: (schemeToJoin as any).BENEFITS || [],
          slogan: getTranslatedText((schemeToJoin as any).SLOGAN || { en: "" }, language) || "",
          image: schemeToJoin.IMAGE || "",
          icon: schemeToJoin.ICON || "",
          durationMonths: schemeToJoin.DURATION_MONTHS || 0,
          metaData: schemeToJoin.table_meta || (schemeToJoin as any).meta_data || null,
          instant_intrest: (schemeToJoin as any).instant_intrest || false,
          timestamp: new Date().toISOString(),
          savingType: schemeToJoin.savingType || (schemeToJoin.SCHEMETYPE?.toLowerCase() === "weight" ? "weight" : "amount"),
        };

        await AsyncStorage.setItem(
          "@current_scheme_data",
          JSON.stringify(schemeDataToStore)
        );

        router.push({
          pathname: "/home/join_savings",
          params: {
            schemeId: (schemeToJoin.SCHEMEID || 0).toString(),
          },
        });
      }
      // Add a small delay
      await new Promise((resolve: any) => setTimeout(resolve, 500));
    } catch (error) {
      logger.error("Error in handleJoinPress:", error);
      Alert.alert(t("schemes.error") || "Error", t("schemes.failedToLoadSchemeData") || "Failed to load scheme data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInfoPress = (scheme: Scheme) => {
    if (!isLoading) {
      // Call parent's onInfoPress handler if provided (for custom modal)
      if (onInfoPress) {
        onInfoPress(scheme);
      } else {
        // Fallback to internal modal if no custom handler
        setSelectedScheme(scheme);
        setModalVisible(true);
      }
    }
  };

  const closeModal = () => {
    if (!isLoading) {
      setModalVisible(false);
      setSelectedScheme(null);
    }
  };

  const getLocalizedText = (textObj: any): string => {
    // Handle null, undefined, empty string, or falsy values
    if (textObj === null || textObj === undefined || textObj === "") {
      return "";
    }

    // Handle strings
    if (typeof textObj === "string") {
      return textObj.trim() || "";
    }

    // Handle numbers
    if (typeof textObj === "number") {
      return isNaN(textObj) ? "" : textObj.toString();
    }

    // Handle boolean
    if (typeof textObj === "boolean") {
      return textObj.toString();
    }

    // Handle objects with en/ta keys
    if (typeof textObj === "object" && textObj !== null) {
      // Check if it's a valid object with language keys
      if (textObj.hasOwnProperty("en") || textObj.hasOwnProperty("ta")) {
        const enText = textObj.en || "";
        const taText = textObj.ta || "";

        if (currentLanguage === "ta") {
          return taText || enText || "";
        } else {
          return enText || taText || "";
        }
      }

      // Handle arrays
      if (Array.isArray(textObj)) {
        const validItems = textObj.filter(
          (item) => item !== null && item !== undefined && item !== ""
        );
        return validItems.length > 0 ? validItems.join(", ") : "";
      }

      // Handle other objects - convert to string safely
      try {
        const stringified = JSON.stringify(textObj);
        return stringified === "{}" || stringified === "[]" ? "" : stringified;
      } catch {
        return "";
      }
    }

    // Fallback for any other type
    try {
      return String(textObj);
    } catch {
      return "";
    }
  };

  // Helper function to get translated text using global store language
  const getTranslatedText = (
    textObj: { en: string; ta?: string } | string | undefined | null,
    lang: string
  ): string => {
    if (textObj === null || textObj === undefined || textObj === "") {
      return "";
    }

    if (typeof textObj === "string") {
      return textObj.trim() || "";
    }

    if (typeof textObj === "number") {
      return isNaN(textObj) ? "" : String(textObj);
    }

    if (typeof textObj === "boolean") {
      return String(textObj);
    }

    if (typeof textObj === "object" && textObj !== null) {
      if (textObj.hasOwnProperty("en") || textObj.hasOwnProperty("ta")) {
        const enText = textObj.en || "";
        const taText = textObj.ta || "";

        if (lang === "ta") {
          return taText || enText || "";
        } else {
          return enText || taText || "";
        }
      }

      if (Array.isArray(textObj)) {
        const validItems = textObj.filter(
          (item) => item !== null && item !== undefined && item !== ""
        );
        return validItems.length > 0 ? validItems.join(", ") : "";
      }

      try {
        const stringified = JSON.stringify(textObj);
        return stringified === "{}" || stringified === "[]" ? "" : stringified;
      } catch {
        return "";
      }
    }

    try {
      return String(textObj);
    } catch {
      return "";
    }
  };

  const getCardGradient = (schemeId: number | null | undefined) => {
    if (schemeId === null || schemeId === undefined || isNaN(schemeId)) {
      return ["#1a1a1a", "#000000"];
    }

    const gradients = [
      ["#2C3E50", "#000000"], // Dark Blue - Black
      ["#434343", "#000000"], // Grey - Black
      ["#141E30", "#243B55"], // Deep Blue
      ["#232526", "#414345"], // Midnight City
      ["#0f0c29", "#302b63", "#24243e"], // Deep Purple
    ];
    
    return gradients[Math.abs(schemeId) % gradients.length];
  };

  const getCardAccentColor = (schemeId: number | null | undefined) => {
     if (schemeId === null || schemeId === undefined || isNaN(schemeId)) {
      return "#FFD700"; // Gold
    }
    // const colors = ["#FFD700", "#C0C0C0", "#CD7F32", "#E5E4E2", "#B76E79"]; // Gold, Silver, Bronze, Platinum, Rose Gold
    // return colors[Math.abs(schemeId) % colors.length];
    return "#FFD700"; // Uniform Gold for premium feel
  };

  const getDefaultBackgroundImage = (schemeId: number | null | undefined) => {
    // Handle null, undefined, or invalid schemeId
    if (schemeId === null || schemeId === undefined || isNaN(schemeId)) {
      schemeId = 0; // Default to first image
    }

    const defaultImages = [
      require("../../assets/images/gold_pattern.jpg"),
      require("../../assets/images/gold_bg.png"),
      require("../../assets/images/gold_bg2.png"),
      require("../../assets/images/scheme1.jpg"),
      require("../../assets/images/scheme2.jpg"),
      require("../../assets/images/scheme3.jpg"),
      require("../../assets/images/scheme4.jpg"),
    ];
    return defaultImages[Math.abs(schemeId) % defaultImages.length];
  };

  const getDefaultIcon = (schemeId: number | null | undefined) => {
    // Handle null, undefined, or invalid schemeId
    if (schemeId === null || schemeId === undefined || isNaN(schemeId)) {
      schemeId = 0; // Default to first icon
    }

    const defaultIcons = [
      "diamond",
      "star",
      "trophy",
      "gift",
      "medal",
      "ribbon",
      "sparkles",
      "gem",
    ];
    return defaultIcons[Math.abs(schemeId) % defaultIcons.length];
  };

  const isValidIoniconName = (iconName: string): boolean => {
    // List of common valid Ionicons names
    const validIonicons = [
      "diamond",
      "star",
      "trophy",
      "gift",
      "medal",
      "ribbon",
      "gem",
      "add",
      "add-circle",
      "add-circle-outline",
      "add-outline",
      "checkmark",
      "checkmark-circle",
      "checkmark-circle-outline",
      "close",
      "close-circle",
      "close-circle-outline",
      "close-outline",
      "information",
      "information-circle",
      "information-circle-outline",
      "time",
      "time-outline",
      "calendar",
      "calendar-outline",
      "location",
      "location-outline",
      "home",
      "home-outline",
      "person",
      "person-outline",
      "people",
      "people-outline",
      "settings",
      "settings-outline",
      "menu",
      "menu-outline",
      "search",
      "search-outline",
      "filter",
      "filter-outline",
      "heart",
      "heart-outline",
      "bookmark",
      "bookmark-outline",
      "share",
      "share-outline",
      "download",
      "download-outline",
      "refresh",
      "refresh-outline",
      "sync",
      "sync-outline",
      "play",
      "play-outline",
      "pause",
      "pause-outline",
      "stop",
      "stop-outline",
      "skip-forward",
      "skip-backward",
      "volume-high",
      "volume-low",
      "volume-mute",
      "volume-off",
      "camera",
      "camera-outline",
      "image",
      "image-outline",
      "document",
      "document-outline",
      "folder",
      "folder-outline",
      "mail",
      "mail-outline",
      "call",
      "call-outline",
      "chatbubble",
      "chatbubble-outline",
      "chatbubbles",
      "chatbubbles-outline",
      "notifications",
      "notifications-outline",
      "alarm",
      "alarm-outline",
      "flash",
      "flash-outline",
      "bulb",
      "bulb-outline",
      "battery-full",
      "battery-half",
      "battery-dead",
      "battery-charging",
      "wifi",
      "wifi-outline",
      "cellular",
      "cellular-outline",
      "bluetooth",
      "bluetooth-outline",
      "radio",
      "radio-outline",
      "car",
      "car-outline",
      "bicycle",
      "bicycle-outline",
      "airplane",
      "airplane-outline",
      "boat",
      "boat-outline",
      "train",
      "train-outline",
      "bus",
      "bus-outline",
      "walk",
      "walk-outline",
      "fitness",
      "fitness-outline",
      "football",
      "football-outline",
      "basketball",
      "basketball-outline",
      "football",
      "football-outline",
      "tennisball",
      "tennisball-outline",
      "golf",
      "golf-outline",
      "restaurant",
      "restaurant-outline",
      "wine",
      "wine-outline",
      "pizza",
      "pizza-outline",
      "ice-cream",
      "ice-cream-outline",
      "cafe",
      "cafe-outline",
      "beer",
      "beer-outline",
      "musical-notes",
      "musical-notes-outline",
      "headset",
      "headset-outline",
      "mic",
      "mic-outline",
      "videocam",
      "videocam-outline",
      "tv",
      "tv-outline",
      "radio",
      "radio-outline",
      "game-controller",
      "game-controller-outline",
      "dice",
      "dice-outline",
      "card",
      "card-outline",
      "cash",
      "cash-outline",
      "wallet",
      "wallet-outline",
      "card",
      "card-outline",
      "gift",
      "gift-outline",
      "ribbon",
      "ribbon-outline",
      "trophy",
      "trophy-outline",
      "medal",
      "medal-outline",
      "star",
      "star-outline",
      "heart",
      "heart-outline",
      "thumbs-up",
      "thumbs-up-outline",
      "thumbs-down",
      "thumbs-down-outline",
      "happy",
      "happy-outline",
      "sad",
      "sad-outline",
      "sunny",
      "sunny-outline",
      "moon",
      "moon-outline",
      "cloudy",
      "cloudy-outline",
      "rainy",
      "rainy-outline",
      "snow",
      "snow-outline",
      "thunderstorm",
      "thunderstorm-outline",
      "leaf",
      "leaf-outline",
      "flower",
      "flower-outline",
      "tree",
      "tree-outline",
      "bug",
      "bug-outline",
      "fish",
      "fish-outline",
      "paw",
      "paw-outline",
      "bird",
      "bird-outline",
      "car",
      "car-outline",
      "bicycle",
      "bicycle-outline",
      "boat",
      "boat-outline",
      "airplane",
      "airplane-outline",
      "train",
      "train-outline",
      "bus",
      "bus-outline",
      "walk",
      "walk-outline",
      "fitness",
      "fitness-outline",
      "basketball",
      "basketball-outline",
      "football",
      "football-outline",
      "tennisball",
      "tennisball-outline",
      "golf",
      "golf-outline",
      "baseball",
      "baseball-outline",
      "football",
      "football-outline",
      "football",
      "football-outline",
      "basketball",
      "basketball-outline",
      "tennisball",
      "tennisball-outline",
      "golf",
      "golf-outline",
      "baseball",
      "baseball-outline",
      "football",
      "football-outline",
      "football",
      "football-outline",
      "basketball",
      "basketball-outline",
      "tennisball",
      "tennisball-outline",
      "golf",
      "golf-outline",
      "baseball",
      "baseball-outline",
      "football",
      "football-outline",
    ];

    return validIonicons.includes(iconName.toLowerCase());
  };

  const getSchemeBackgroundImage = (scheme: Scheme | null | undefined) => {
    // Handle null or undefined scheme
    if (!scheme) {
      return getDefaultBackgroundImage(0);
    }

    // Check if IMAGE exists and is a valid string
    if (
      scheme.IMAGE &&
      typeof scheme.IMAGE === "string" &&
      scheme.IMAGE.trim() !== ""
    ) {
      return { uri: scheme.IMAGE };
    }
    return getDefaultBackgroundImage(scheme.SCHEMEID);
  };

  const getSchemeIcon = (scheme: Scheme | null | undefined) => {
    // Handle null or undefined scheme
    if (!scheme) {
      return getDefaultIcon(0);
    }

    // Check if ICON exists and is a valid Ionicons name
    if (
      scheme.ICON &&
      typeof scheme.ICON === "string" &&
      scheme.ICON.trim() !== ""
    ) {
      const iconName = scheme.ICON.trim();

      // Check if ICON is an image path (starts with / or http) - skip validation if so
      if (iconName.startsWith("/") || iconName.startsWith("http://") || iconName.startsWith("https://") || iconName.includes("/uploads/") || iconName.includes(".")) {
        // This is an image path, not an Ionicons name - use default icon
        return getDefaultIcon(scheme.SCHEMEID);
      }

      // Validate as Ionicons name
      if (isValidIoniconName(iconName)) {
        return iconName;
      } else {
        logger.warn(
          `Invalid Ionicons name: "${iconName}" for scheme ${scheme.SCHEMEID}. Using default icon.`
        );
      }
    }
    return getDefaultIcon(scheme.SCHEMEID);
  };

  const renderSchemeCard = ({ item }: { item: Scheme | null | undefined }) => {
    // Handle null or undefined item
    if (!item) {
      return null;
    }

    const gradientColors = getCardGradient(item.SCHEMEID);
    const accentColor = getCardAccentColor(item.SCHEMEID);

    return (
      <View style={[styles.card, { borderColor: accentColor }]}>
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <ImageBackground
            source={getSchemeBackgroundImage(item)}
            style={styles.cardBackground}
            imageStyle={styles.cardBackgroundImage}
          >
            <View style={styles.cardBackgroundOverlay} />

            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderContent}>
                <View style={[styles.schemeIdBadge, { borderColor: accentColor }]}>
                  <Text style={[styles.schemeIdText, { color: accentColor }]}>
                    #{item.SCHEMEID || "N/A"}
                  </Text>
                </View>
                {/* Scheme Type and Duration */}
                <View style={styles.schemeInfoContainer}>
                  {item.SCHEMETYPE && getLocalizedText(item.SCHEMETYPE) && (
                    <View style={[styles.schemeInfoBadge, { borderColor: accentColor }]}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={accentColor}
                      />
                      <Text style={[styles.schemeInfoText, { color: accentColor }]}>
                        {getLocalizedText(item.SCHEMETYPE)}
                      </Text>
                    </View>
                  )}
                  {/* Saving Type Badge */}
                   {item.savingType && typeof item.savingType === "string" && (
                  <View style={[styles.schemeInfoBadge, { borderColor: accentColor }]}>
                    <Ionicons
                      name={item.savingType.toLowerCase() === "amount" ? "cash-outline" : "scale-outline"}
                      size={12}
                      color={accentColor}
                    />
                    <Text style={[styles.schemeInfoText, { color: accentColor }]}>
                      {item.savingType.charAt(0).toUpperCase() + item.savingType.slice(1).toLowerCase()}
                    </Text>
                  </View>
                )}
                 {/* Amount/Weight Type Badge (fallback from SCHEMETYPE) */}
                {!item.savingType && (() => {
                  const schemeType = getLocalizedText(item.SCHEMETYPE).toLowerCase();
                  if (schemeType.includes("amount") || schemeType.includes("weight")) {
                    const typeLabel = schemeType.includes("amount") ? "Amount" : "Weight";
                    return (
                      <View style={[styles.schemeInfoBadge, { borderColor: accentColor }]}>
                        <Ionicons
                          name={schemeType.includes("amount") ? "cash-outline" : "scale-outline"}
                          size={12}
                          color={accentColor}
                        />
                        <Text style={[styles.schemeInfoText, { color: accentColor }]}>
                          {typeLabel}
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}

                  {item.DURATION_MONTHS && !isNaN(item.DURATION_MONTHS) && (
                    <View style={[styles.schemeInfoBadge, { borderColor: accentColor }]}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={accentColor}
                      />
                      <Text style={[styles.schemeInfoText, { color: accentColor }]}>
                        {item.DURATION_MONTHS}M
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={[styles.cardSlogan, { color: COLORS.white }]}>
                {getLocalizedText(item.SCHEMENAME) || "Unnamed Scheme"}
              </Text>

              {/* Slogan */}
              {item.SLOGAN && getLocalizedText(item.SLOGAN) && (
                <Text style={[styles.cardTitle, { color: accentColor }]}>
                  {getLocalizedText(item.SLOGAN)}
                </Text>
              )}

              <View style={[styles.titleUnderline, { backgroundColor: accentColor }]} />
            </View>

            {/* Card Footer */}
            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={[
                  styles.infoButton,
                  { borderColor: accentColor },
                  isLoading && styles.disabledButton,
                ]}
                onPress={() => handleInfoPress(item)}
                disabled={isLoading}
              >
                <Ionicons name="information-circle-outline" size={18} color={accentColor} />
                <Text style={[styles.infoButtonText, { color: accentColor }]}>
                  {t("info")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                 style={[
                  styles.joinButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={() => handleJoinPress(item)}
                disabled={isLoading}
              >
                 <LinearGradient
                    colors={[accentColor, "#FDB931", accentColor]} // Gold gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.joinButtonGradient}
                  >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Ionicons name="add-circle" size={20} color="#000" />
                  )}
                  <Text style={styles.joinButtonText}>
                    {isLoading ? t("loading") || "Loading..." : t("joinNow")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </LinearGradient>

        {/* Decorative Elements - Simplified for premium look */}
        {/* <View style={styles.cardDecoration}>
           ... elements removed for cleaner look
        </View> */}
      </View>
    );
  };

  const renderPaginationDots = () => {
    if (!showDots || schemes.length <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        {schemes.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.activeDot,
            ]}
            onPress={() => {
              setCurrentIndex(index);
              flatListRef.current?.scrollToOffset({
                offset: index * (screenWidth - 60),
                animated: true,
              });
            }}
          />
        ))}
      </View>
    );
  };

  const renderModalContent = () => {
    if (!selectedScheme) return null;
    const accentColor = "#FFD700"; // Gold
    const gradientColors = ["#0A0A0A", "#252525"];

    return (
      <View style={styles.modalContentModern}>
        
        {/* Modern Floating Close Button */}
        <TouchableOpacity style={styles.floatingCloseButton} onPress={closeModal}>
            <View style={styles.closeButtonBlur}>
               <Ionicons name="close" size={20} color={COLORS.text.dark} />
            </View>
        </TouchableOpacity>

        <ScrollView 
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
        >
             {/* Large Trendy Header (No Background Block) */}
             <View style={styles.modernHeader}>
                <Text style={styles.modernTitle}>
                    {getLocalizedText(selectedScheme.SCHEMENAME) || "Unnamed Scheme"}
                </Text>
                 {selectedScheme.SLOGAN && getLocalizedText(selectedScheme.SLOGAN) && (
                     <Text style={styles.modernSlogan}>
                         {getLocalizedText(selectedScheme.SLOGAN)}
                     </Text>
                 )}
                 <View style={styles.titleUnderlineGradient} />
             </View>


             {/* Pill Badges Row */}
            <View style={styles.pillBadgesContainer}>
                {selectedScheme.SCHEMETYPE && getLocalizedText(selectedScheme.SCHEMETYPE) && (
                   <View style={styles.pillBadge}>
                       <Text style={styles.pillBadgeText}>{getLocalizedText(selectedScheme.SCHEMETYPE)}</Text>
                   </View>
                )}
                 {selectedScheme.DURATION_MONTHS && !isNaN(selectedScheme.DURATION_MONTHS) && (
                     <View style={styles.pillBadge}>
                         <Text style={styles.pillBadgeText}>{selectedScheme.DURATION_MONTHS} {t("monthsLabel") || "Months"}</Text>
                     </View>
                 )}
                 {/* Saving Type Pill */}
                 <View style={[styles.pillBadge, { backgroundColor: '#F0F0FF' }]}>
                     <Text style={[styles.pillBadgeText, { color: '#5D5DFF' }]}>
                         {selectedScheme.savingType === 'weight' ? (t('goldWeight') || 'Gold Weight') : (t('amount') || 'Amount')}
                     </Text>
                 </View>
            </View>


          {/* 2-Column Grid Benefits */}
            <View style={styles.gridSection}>
              <Text style={styles.gridSectionTitle}>{t("benefits") || "Benefits"}</Text>
              <View style={styles.benefitsGrid}>
                  {(() => {
                        const benefits = (selectedScheme as any).BENEFITS
                        ? (selectedScheme as any).BENEFITS.split(",").map((b: string) => b.trim())
                        : [];
                        
                         /* Default benefits if none */
                         const displayBenefits = benefits.length > 0 ? benefits : [
                            "No joining fee",
                            "Bonus on maturity",
                            "Secure investment",
                            "Track anytime"
                         ];

                         return displayBenefits.map((benefit: string, index: number) => (
                             <View key={index} style={styles.gridBenefitItem}>
                                <View style={styles.gridIconContainer}>
                                     <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                                </View>
                                <Text style={styles.gridBenefitText}>{benefit}</Text>
                             </View>
                         ));
                  })()}
              </View>
            </View>

          {/* Description Section */}
          {selectedScheme.DESCRIPTION && getLocalizedText(selectedScheme.DESCRIPTION) && (
            <View style={styles.modernSection}>
              <Text style={styles.modernSectionTitle}>{t("description")}</Text>
              <Text style={styles.modernDescription}>
                  {getLocalizedText(selectedScheme.DESCRIPTION)}
              </Text>
            </View>
          )}

           {/* Scheme Details Table */}
           {selectedScheme.table_meta &&
            selectedScheme.table_meta.headers &&
            selectedScheme.table_meta.rows &&
            selectedScheme.table_meta.rows.length > 0 && (
                <View style={styles.modernSection}>
                     <Text style={styles.modernSectionTitle}>{t("schemeDetails")}</Text>
                     <View style={styles.tableRefinedContainer}>
                       {/* Headers */}
                       <View style={styles.tableRefinedHeader}>
                             {selectedScheme.table_meta.headers[currentLanguage === "ta" ? "ta" : "en"]?.map((header, index) => (
                                 <Text key={index} style={styles.tableRefinedHeaderText}>{getLocalizedText(header)}</Text>
                             ))}
                       </View>
                        {/* Rows */}
                        {selectedScheme.table_meta.rows.map((row, rowIndex) => (
                           <View key={rowIndex} style={[styles.tableRefinedRow, rowIndex % 2 !== 0 && styles.tableRowAlt]}>
                               {Object.values(row).map((cell, cellIndex) => (
                                   <Text key={cellIndex} style={styles.tableRefinedCell}>{getLocalizedText(cell)}</Text>
                               ))}
                           </View>
                        ))}
                     </View>
                </View>
            )}

            <View style={{ height: 100 }} /> 
        </ScrollView>
        
        {/* Sticky Footer */}
        <View style={styles.stickyModalFooter}>
             <View style={styles.modalFooter}>
             {/* Quick Join Button (Lightning) */}
            <TouchableOpacity
              style={styles.modalQuickJoinButton}
              onPress={() => handleQuickJoinPress(selectedScheme)}
            >
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalQuickJoinGradient}
              >
                <Ionicons name="flash" size={20} color="#000" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Join Button */}
            <TouchableOpacity
              style={[
                styles.modalJoinButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={async () => {
                if (!isLoading) {
                  setIsLoading(true);
                  try {
                    await handleJoinPress(selectedScheme);
                    await new Promise((resolve: any) => setTimeout(resolve, 500));
                    closeModal();
                  } catch (error) {
                    console.error("Error in modal join:", error);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              disabled={isLoading}
            >
              <LinearGradient
                  colors={[accentColor, "#FDB931", accentColor]} // Gold gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.joinButtonGradient}
                >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name="add-circle" size={22} color="#000" />
              )}
              <Text style={styles.joinButtonText}>
                {isLoading ? t("loading") || "Loading..." : t("joinThisScheme")}
              </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    );
  };


  if (schemes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t("loading")}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={schemes}
        renderItem={renderSchemeCard}
        keyExtractor={(item, index) =>
          item?.SCHEMEID?.toString() || `scheme-${index}`
        }
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={screenWidth - 60} // Account for margins
        snapToAlignment="center"
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / (screenWidth - 60)
          );
          setCurrentIndex(Math.min(index, schemes.length - 1));
        }}
        onScrollToIndexFailed={(info) => {
          // Handle scroll to index failure
          const wait = new Promise((resolve: any) => setTimeout(resolve, 100));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: Math.min(info.index, schemes.length - 1),
              animated: true,
            });
          });
        }}
        contentContainerStyle={styles.horizontalListContainer}
        getItemLayout={(data, index) => ({
          length: screenWidth - 60,
          offset: (screenWidth - 60) * index,
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
      />

      {renderPaginationDots()}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>{renderModalContent()}</View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  horizontalListContainer: {
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 20,
    marginHorizontal: 10,
    width: screenWidth - 60,
    height: 230,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1, // Subtle border
    overflow: "hidden",
  },
  cardGradient: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#FFD700", // Gold
    width: 12,
    height: 6,
    borderRadius: 3,
  },
  // Removed decoration circles styles
  decorationCircle1: { display: 'none' },
  decorationCircle2: { display: 'none' },
  cardDecoration: { display: 'none' },
  
  cardBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  cardBackgroundImage: {
    opacity: 0.15, // Subtle texture
    resizeMode: "cover",
  },
  cardBackgroundOverlay: {
    display: "none",
  },
  cardHeader: {
    padding: 16,
    height: 150,
  },
  cardHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  schemeIdBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  schemeIdText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif-condensed", // Or a custom premium font if available
  },
  cardSlogan: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 2,
    opacity: 0.8,
  },
  schemeInfoContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flex: 1,
    gap: 4,
  },
  schemeInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  schemeInfoText: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
  titleUnderline: {
    width: 40,
    height: 2,
    alignSelf: "center",
    marginTop: 8,
    borderRadius: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    gap: 12,
   // backgroundColor: "rgba(0,0,0,0.3)", // Optional: slight darkening
  },
  joinButton: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden", // For gradient
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  joinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  joinButtonText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 15,
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  infoButtonText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.background.overlay,
    justifyContent: "flex-end", // Align to bottom
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    margin: 0,
    height: "80%", // Tall bottom sheet
    width: "100%",
    shadowColor: COLORS.shadow.black,
    shadowOffset: {
      width: 0,
      height: -4, // Shadow upwards
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContent: {
    padding: 0,
  },
  modalHeader: {
    minHeight: 200,
  },
  modalHeaderBackgroundContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  modalHeaderBackgroundImage: {
    opacity: 0.15,
    resizeMode: "cover",
  },
  modalHeaderOverlay: {
    display: "none",
  },
  modalHeaderContent: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  modalSchemeInfo: {
    flex: 1,
  },
  modalTitleContainer: {
    marginBottom: 16,
  },
  modalIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: COLORS.white,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalTitleTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  modalSlogan: {
    fontSize: 14,
    color: COLORS.white,
    fontStyle: "italic",
    opacity: 0.95,
    marginBottom: 12,
    fontWeight: "500",
  },
  modalBadgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  modalBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalBadgeText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 10,
  },
  modalBody: {
    padding: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  modalDescriptionContainer: {
    marginBottom: 24,
  },
  modalDescriptionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  descriptionBox: {
    backgroundColor: COLORS.background.secondary,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  modalDescription: {
    fontSize: 15,
    color: COLORS.text.dark,
    lineHeight: 24,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.text.mediumGrey,
    marginLeft: 8,
    flex: 1,
  },
  detailsTable: {
    marginBottom: 24,
  },
  tableContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.white,
    flex: 1,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  tableRowEven: {
    backgroundColor: COLORS.background.secondary,
  },
  tableRowOdd: {
    backgroundColor: COLORS.white,
  },
  tableCell: {
    fontSize: 14,
    color: COLORS.text.dark,
    flex: 1,
    textAlign: "center",
  },
  tableLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.dark,
    flex: 1,
  },
  tableValue: {
    fontSize: 14,
    color: COLORS.text.mediumGrey,
    flex: 1,
    textAlign: "right",
  },
  modalJoinButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 0,
    marginBottom: 0,
    flex: 1, // Make it take available space in row
    elevation: 4,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    paddingBottom: 20, // Add some bottom padding
  },
  modalQuickJoinButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.5)",
    elevation: 3,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalQuickJoinGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  quickJoinButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.5)",
    elevation: 3,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  quickJoinGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  // Modern Modal Styles
  modalContentModern: {
      flex: 1,
      backgroundColor: COLORS.white,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
  },
  modalScroll: {
      flex: 1,
  },
  modalScrollContent: {
      paddingBottom: 120, // Space for footer
  },
  stickyModalFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: COLORS.white,
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      elevation: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -5 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
  },
  floatingCloseButton: {
      position: 'absolute',
      top: 15,
      right: 15,
      zIndex: 100,
  },
  closeButtonBlur: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
  },
  modernHeader: {
      paddingHorizontal: 24,
      paddingTop: 30, // Space for close button
      paddingBottom: 10,
  },
  modernTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: COLORS.text.dark,
      letterSpacing: -0.5,
      marginBottom: 2,
  },
  modernSlogan: {
      fontSize: 14,
      color: '#666',
      fontWeight: '500',
      marginBottom: 10,
  },
  titleUnderlineGradient: {
      height: 3,
      width: 60,
      backgroundColor: '#FFD700',
      borderRadius: 2,
      marginBottom: 15
  },
  pillBadgesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingHorizontal: 24,
      marginBottom: 25,
  },
  pillBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#FFF9E6', // Light gold bg
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  pillBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#B8860B', // Dark gold text
  },
  
  // Grid Section
  gridSection: {
      paddingHorizontal: 24,
      marginBottom: 30,
  },
  gridSectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 15,
      color: COLORS.text.dark,
  },
  benefitsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
  },
  gridBenefitItem: {
      width: '48%', // 2 columns
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FAFAFA',
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#f0f0f0',
  },
  gridIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
  },
  gridBenefitText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#444',
      flex: 1,
  },
  
  // Modern Section
  modernSection: {
      paddingHorizontal: 24,
      marginBottom: 25,
  },
  modernSectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: COLORS.text.dark,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      opacity: 0.8,
  },
  modernDescription: {
      fontSize: 15,
      lineHeight: 24,
      color: '#555',
  },
  
  // Refined Table
  tableRefinedContainer: {
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#EEE',
  },
  tableRefinedHeader: {
      flexDirection: 'row',
      backgroundColor: '#F8F8F8',
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
  },
  tableRefinedHeaderText: {
      flex: 1,
      fontWeight: '700',
      fontSize: 13,
      color: '#333',
  },
  tableRefinedRow: {
       flexDirection: 'row',
       paddingVertical: 12,
       paddingHorizontal: 15,
       borderBottomWidth: 1,
       borderBottomColor: '#F5F5F5',
       backgroundColor: '#FFF',
  },
  tableRowAlt: {
      backgroundColor: '#FAFAFA',
  },
  tableRefinedCell: {
      flex: 1,
      fontSize: 13,
      color: '#555',
  },
  modalJoinButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.text.mediumGrey,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default DynamicSchemeCard;
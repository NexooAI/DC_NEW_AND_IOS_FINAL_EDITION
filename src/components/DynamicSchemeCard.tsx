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
} from "react-native";
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

  const handleJoinPress = async (scheme: Scheme, manageLoading = true) => {
    if (manageLoading) {
      setIsLoading(true);
    }
    try {
      if (onJoinPress) {
        logger.log("Using custom onJoinPress handler", scheme);
        await onJoinPress(scheme);
      } else {
        // Check if schemes page should be skipped
        if (!showSchemsPage) {
          logger.log("showSchemsPage is 0, skipping schemes page and navigating directly");

          // Determine scheme type and active tab
          const targetTab = getSchemeTypeForTab(scheme);
          const isFlexi = targetTab.toLowerCase() === "flexi";

          // Get relevant chits for the target tab
          const chits = scheme.chits || [];
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

          // Prepare scheme data to store (similar to schemes.tsx)
          const schemeDataToStore = {
            schemeId: scheme.SCHEMEID || 0,
            name: getTranslatedText(scheme.SCHEMENAME as any, language) || "Unnamed Scheme",
            description: getTranslatedText(scheme.DESCRIPTION as any, language) || "No description available",
            type: targetTab,
            chits: relevantChits,
            schemeType: isFlexi ? "flexi" : "fixed",
            activeTab: targetTab,
            benefits: (scheme as any).BENEFITS || [],
            slogan: getTranslatedText((scheme as any).SLOGAN || { en: "" }, language) || "",
            image: scheme.IMAGE || "",
            icon: scheme.ICON || "",
            durationMonths: scheme.DURATION_MONTHS || 0,
            metaData: scheme.table_meta || (scheme as any).meta_data || null,
            instant_intrest: (scheme as any).instant_intrest || false,
            timestamp: new Date().toISOString(),
            savingType: scheme.savingType || (scheme.SCHEMETYPE?.toLowerCase() === "weight" ? "weight" : "amount"),
          };

          // Store scheme data in AsyncStorage
          await AsyncStorage.setItem(
            "@current_scheme_data",
            JSON.stringify(schemeDataToStore)
          );

          logger.log("Scheme data stored, navigating directly to: join_savings");

          // Navigate directly to join_savings page
          router.push({
            pathname: "/home/join_savings",
            params: {
              schemeId: (scheme.SCHEMEID || 0).toString(),
            },
          });
        }
        // Always force direct navigation to join_savings for DynamicSchemeCard
        // regardless of showSchemsPage, per user request to bypass other flows
        else {
          logger.log("Redirecting dynamic card directly to join_savings (bypassing schemes/calculator)");
          
           // Store scheme data in AsyncStorage if not already stored
           const schemeDataToStore = {
            ...scheme,
            schemeId: scheme.SCHEMEID,
            name: getLocalizedText(scheme.SCHEMENAME),
            description: getLocalizedText(scheme.DESCRIPTION),
            type: getSchemeTypeForTab(scheme),
             // Default to "flexi" if unclear, to trigger the new Flexi UI in join_savings
            schemeType: getSchemeTypeForTab(scheme) === "flexi" ? "flexi" : "fixed",
            savingType: scheme.savingType || (scheme.SCHEMETYPE?.toLowerCase() === "weight" ? "weight" : "amount"),
            timestamp: new Date().toISOString(),
          };

          await AsyncStorage.setItem(
            "@current_scheme_data",
            JSON.stringify(schemeDataToStore)
          );

          router.push({
            pathname: "/home/join_savings",
            params: {
              schemeId: (scheme.SCHEMEID || 0).toString(),
            },
          });
        }
      }
      // Add a small delay to show loading state
      if (manageLoading) {
        await new Promise((resolve: any) => setTimeout(resolve, 500));
      }
    } catch (error) {
      logger.error("Error in handleJoinPress:", error);
      Alert.alert(t("schemes.error") || "Error", t("schemes.failedToLoadSchemeData") || "Failed to load scheme data");
    } finally {
      if (manageLoading) {
        setIsLoading(false);
      }
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

  const getCardColor = (schemeId: number | null | undefined) => {
    // Handle null, undefined, or invalid schemeId
    if (schemeId === null || schemeId === undefined || isNaN(schemeId)) {
      return COLORS.primary; // Default color
    }

    const colors = [
  "#850111", // Primary – Wine / Maroon
  "#0E0E0E", // Main background (Almost black)
  "#1A1A1A", // Card / Surface
  "#2B2B2B", // Border / Divider
  "#000B58", // Gold – Accent / Highlight
  "#360185", // Primary text
  "#0046FF", // Secondary text
];
    return colors[Math.abs(schemeId) % colors.length];
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

    const cardColor = getCardColor(item.SCHEMEID); // Use different colors for each card

    return (
      <View style={[styles.card, { borderColor: cardColor }]}>
        {/* Full Card Background Image */}
        <ImageBackground
          source={getSchemeBackgroundImage(item)}
          style={styles.cardBackground}
          imageStyle={styles.cardBackgroundImage}
        >
          <View style={styles.cardBackgroundOverlay} />

          {/* Card Header */}
          <View
            style={[styles.cardHeader, { backgroundColor: `${cardColor}90` }]}
          >
            <View style={styles.cardHeaderContent}>
              <View style={[styles.schemeIdBadge, { borderColor: cardColor }]}>
                <Text style={[styles.schemeIdText, { color: cardColor }]}>
                  #{item.SCHEMEID || "N/A"}
                </Text>
              </View>
              {/* Scheme Type and Duration */}
              <View style={styles.schemeInfoContainer}>
                {item.SCHEMETYPE && getLocalizedText(item.SCHEMETYPE) && (
                  <View style={styles.schemeInfoBadge}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={COLORS.white}
                    />
                    <Text style={styles.schemeInfoText}>
                      {getLocalizedText(item.SCHEMETYPE)}
                    </Text>
                  </View>
                )}
                {/* Saving Type Badge (from savingType field) */}
                {item.savingType && typeof item.savingType === "string" && (
                  <View style={styles.schemeInfoBadge}>
                    <Ionicons
                      name={item.savingType.toLowerCase() === "amount" ? "cash-outline" : "scale-outline"}
                      size={12}
                      color={COLORS.white}
                    />
                    <Text style={styles.schemeInfoText}>
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
                      <View style={styles.schemeInfoBadge}>
                        <Ionicons
                          name={schemeType.includes("amount") ? "cash-outline" : "scale-outline"}
                          size={12}
                          color={COLORS.white}
                        />
                        <Text style={styles.schemeInfoText}>
                          {typeLabel}
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}
                {item.DURATION_MONTHS && !isNaN(item.DURATION_MONTHS) && (
                  <View style={styles.schemeInfoBadge}>
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color={COLORS.white}
                    />
                    <Text style={styles.schemeInfoText}>
                      {item.DURATION_MONTHS}M
                    </Text>
                  </View>
                )}
              </View>
              {/* <View
                style={[
                  styles.goldIconContainer,
                  { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                ]}
              >
                <Ionicons
                  name={getSchemeIcon(item) as any}
                  size={28}
                  color={COLORS.white}
                />
              </View> */}
            </View>
            <Text style={styles.cardSlogan}>
              {getLocalizedText(item.SCHEMENAME) || "Unnamed Scheme"}
            </Text>

            {/* Slogan */}
            {item.SLOGAN && getLocalizedText(item.SLOGAN) && (
              <Text style={styles.cardTitle}>
                {getLocalizedText(item.SLOGAN)}
              </Text>
            )}

            <View style={styles.titleUnderline} />
          </View>

          {/* Card Footer */}
          <View
            style={[styles.cardFooter, { backgroundColor: `${cardColor}20` }]}
          >
            <TouchableOpacity
              style={[
                styles.infoButton,
                { borderColor: cardColor, backgroundColor: COLORS.white },
                isLoading && styles.disabledButton,
              ]}
              onPress={() => handleInfoPress(item)}
              disabled={isLoading}
            >
              <Ionicons name="information-circle" size={16} color={cardColor} />
              <Text style={[styles.infoButtonText, { color: cardColor }]}>
                {t("info")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.joinButton,
                { backgroundColor: cardColor },
                isLoading && styles.disabledButton,
              ]}
              onPress={() => handleJoinPress(item)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="add-circle" size={18} color={COLORS.white} />
              )}
              <Text style={styles.joinButtonText}>
                {isLoading ? t("loading") || "Loading..." : t("joinNow")}
              </Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Decorative Elements */}
        <View style={styles.cardDecoration}>
          <View
            style={[
              styles.decorationCircle1,
              { backgroundColor: `${cardColor}20` },
            ]}
          />
          <View
            style={[
              styles.decorationCircle2,
              { backgroundColor: `${cardColor}10` },
            ]}
          />
        </View>
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
    const cardColor = getCardColor(selectedScheme.SCHEMEID);
    const schemeType = getLocalizedText(selectedScheme.SCHEMETYPE).toLowerCase();

    return (
      <ScrollView
        style={styles.modalContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <ImageBackground
          source={getSchemeBackgroundImage(selectedScheme)}
          style={[styles.modalHeader, { backgroundColor: cardColor }]}
          imageStyle={styles.modalHeaderBackground}
        >
          <View style={styles.modalHeaderOverlay} />
          <View style={styles.modalHeaderContent}>
            <View style={styles.modalSchemeInfo}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.modalIconContainer}>
                  <Ionicons
                    name={getSchemeIcon(selectedScheme) as any}
                    size={28}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.modalTitleTextContainer}>
                  <Text style={styles.modalTitle}>
                    {getLocalizedText(selectedScheme.SCHEMENAME) ||
                      "Unnamed Scheme"}
                  </Text>
                  {selectedScheme.SLOGAN &&
                    getLocalizedText(selectedScheme.SLOGAN) && (
                      <Text style={styles.modalSlogan}>
                        {getLocalizedText(selectedScheme.SLOGAN)}
                      </Text>
                    )}
                </View>
              </View>

              {/* Scheme Info Badges */}
              <View style={styles.modalBadgesContainer}>
                {selectedScheme.SCHEMEID && (
                  <View style={[styles.modalBadge, { backgroundColor: "rgba(255, 255, 255, 0.25)" }]}>
                    <Ionicons name="pricetag-outline" size={14} color={COLORS.white} />
                    <Text style={styles.modalBadgeText}>
                      #{selectedScheme.SCHEMEID}
                    </Text>
                  </View>
                )}
                {selectedScheme.SCHEMETYPE &&
                  getLocalizedText(selectedScheme.SCHEMETYPE) && (
                    <View style={[styles.modalBadge, { backgroundColor: "rgba(255, 255, 255, 0.25)" }]}>
                      <Ionicons name="time-outline" size={14} color={COLORS.white} />
                      <Text style={styles.modalBadgeText}>
                        {getLocalizedText(selectedScheme.SCHEMETYPE)}
                      </Text>
                    </View>
                  )}
                {/* Saving Type Badge (from savingType field) */}
                {selectedScheme.savingType && typeof selectedScheme.savingType === "string" && (
                  <View style={[styles.modalBadge, { backgroundColor: "rgba(255, 255, 255, 0.25)" }]}>
                    <Ionicons
                      name={selectedScheme.savingType.toLowerCase() === "amount" ? "cash-outline" : "scale-outline"}
                      size={14}
                      color={COLORS.white}
                    />
                    <Text style={styles.modalBadgeText}>
                      {selectedScheme.savingType.charAt(0).toUpperCase() + selectedScheme.savingType.slice(1).toLowerCase()}
                    </Text>
                  </View>
                )}
                {/* Amount/Weight Type Badge (fallback from SCHEMETYPE) */}
                {!selectedScheme.savingType && (schemeType.includes("amount") || schemeType.includes("weight")) && (
                  <View style={[styles.modalBadge, { backgroundColor: "rgba(255, 255, 255, 0.25)" }]}>
                    <Ionicons
                      name={schemeType.includes("amount") ? "cash-outline" : "scale-outline"}
                      size={14}
                      color={COLORS.white}
                    />
                    <Text style={styles.modalBadgeText}>
                      {schemeType.includes("amount") ? "Amount" : "Weight"}
                    </Text>
                  </View>
                )}
                {selectedScheme.DURATION_MONTHS &&
                  !isNaN(selectedScheme.DURATION_MONTHS) && (
                    <View style={[styles.modalBadge, { backgroundColor: "rgba(255, 255, 255, 0.25)" }]}>
                      <Ionicons name="calendar-outline" size={14} color={COLORS.white} />
                      <Text style={styles.modalBadgeText}>
                        {selectedScheme.DURATION_MONTHS}M
                      </Text>
                    </View>
                  )}
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Body Section */}
        <View style={styles.modalBody}>
          {/* Description Section */}
          {selectedScheme.DESCRIPTION && getLocalizedText(selectedScheme.DESCRIPTION) && (
            <View style={styles.modalDescriptionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={20} color={cardColor} />
                <Text style={[styles.modalDescriptionTitle, { color: cardColor }]}>
                  {t("description")}
                </Text>
              </View>
              <View style={styles.descriptionBox}>
                <Text style={styles.modalDescription}>
                  {getLocalizedText(selectedScheme.DESCRIPTION)}
                </Text>
              </View>
            </View>
          )}

          {/* Scheme Details Table */}
          {selectedScheme.table_meta &&
            selectedScheme.table_meta.headers &&
            selectedScheme.table_meta.rows !== undefined &&
            selectedScheme.table_meta.rows !== null &&
            selectedScheme.table_meta.rows.length > 0 && (
              <View style={styles.detailsTable}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="list-outline" size={20} color={cardColor} />
                  <Text style={[styles.sectionTitle, { color: cardColor }]}>
                    {t("schemeDetails")}
                  </Text>
                </View>

                <View style={styles.tableContainer}>
                  {/* Table Headers */}
                  <View
                    style={[styles.tableHeader, { backgroundColor: cardColor }]}
                  >
                    {selectedScheme.table_meta.headers[
                      currentLanguage === "ta" ? "ta" : "en"
                    ]?.map((header, index) => (
                      <Text key={index} style={styles.tableHeaderText}>
                        {getLocalizedText(header)}
                      </Text>
                    )) || []}
                  </View>

                  {/* Table Rows */}
                  {selectedScheme.table_meta.rows.map((row, rowIndex) => (
                    <View
                      key={rowIndex}
                      style={[
                        styles.tableRow,
                        rowIndex % 2 === 0
                          ? styles.tableRowEven
                          : styles.tableRowOdd,
                      ]}
                    >
                      {Object.values(row).map((cell, cellIndex) => (
                        <Text key={cellIndex} style={styles.tableCell}>
                          {getLocalizedText(cell)}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            )}

          {/* Join Button */}
          <TouchableOpacity
            style={[
              styles.modalJoinButton,
              { backgroundColor: cardColor },
              isLoading && styles.disabledButton,
            ]}
            onPress={async () => {
              if (!isLoading) {
                setIsLoading(true);
                try {
                  await handleJoinPress(selectedScheme, false);
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
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="add-circle" size={22} color={COLORS.white} />
            )}
            <Text style={styles.modalJoinButtonText}>
              {isLoading ? t("loading") || "Loading..." : t("joinThisScheme")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 0,
    marginHorizontal: 8,
    width: screenWidth - 60, // Responsive width for better scrolling
    height: 240, // Reduced height for more compact card
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    // elevation: 15,
    borderWidth: 0,
    overflow: "hidden",
    position: "relative",
    transform: [{ scale: 0.98 }],
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border.light,
    marginHorizontal: 6,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 16,
    height: 10,
    borderRadius: 5,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDecoration: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    zIndex: 0,
  },
  decorationCircle1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 215, 0, 0.08)",
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  decorationCircle2: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 215, 0, 0.06)",
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  cardBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  cardBackgroundImage: {
    opacity: 0.4,
    resizeMode: "cover",
  },
  cardBackgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  cardHeader: {
    padding: 14,
    paddingBottom: 10,
    position: "relative",
    overflow: "hidden",
    height: 150, // Reduced height to match card height reduction
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  cardHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  schemeIdBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  schemeIdText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  //   goldIconContainer: {
  //     backgroundColor: "rgba(255, 255, 255, 0.2)",
  //     padding: 14,
  //     borderRadius: 30,
  //     shadowColor: COLORS.white,
  //     shadowOffset: {
  //       width: 0,
  //       height: 6,
  //     },
  //     shadowOpacity: 0.4,
  //     shadowRadius: 8,
  //     elevation: 6,
  //     borderWidth: 2,
  //     borderColor: "rgba(255, 255, 255, 0.5)",
  //   },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.secondary,
    textAlign: "center",
    marginBottom: 6,
    textShadowRadius: 6,
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  cardSlogan: {
    fontSize: 12,
    color: COLORS.white,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 6,
    opacity: 0.95,
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
  schemeInfoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  schemeInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: COLORS.white,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  schemeInfoText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: "600",
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  titleUnderline: {
    width: 80,
    height: 4,
    backgroundColor: COLORS.white,
    alignSelf: "center",
    borderRadius: 4,
    shadowColor: COLORS.white,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    height: 90, // Reduced height for footer
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    flex: 1,
    marginLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  joinButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  infoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: COLORS.white,
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
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    margin: 20,
    maxHeight: "80%",
    width: screenWidth - 40,
    shadowColor: COLORS.shadow.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContent: {
    padding: 0,
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 20,
    overflow: "hidden",
  },
  modalHeaderBackground: {
    opacity: 0.3,
    resizeMode: "cover",
  },
  modalHeaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalSchemeInfo: {
    flex: 1,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 6,
    letterSpacing: 0.5,
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
  },
  modalBadgeText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
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
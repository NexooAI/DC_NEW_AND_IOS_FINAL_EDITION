import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Animated,
  Platform,
  PanResponder,
  Image,
  RefreshControl,
  ImageBackground,
  ScrollView,
  Alert,
  Modal,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import useGlobalStore from "@/store/global.store";
import { useTranslation } from "@/hooks/useTranslation";
import { theme } from "@/constants/theme";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "@/utils/logger";
const { width, height } = Dimensions.get("window");
import * as Haptics from "expo-haptics";
import { COLORS } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Chit {
  CHITID: number | null | undefined;
  AMOUNT: string | null | undefined;
  NOINS?: number | null | undefined;
  TOTALMEMBERS?: number | null | undefined;
  PAYMENT_FREQUENCY?: string | null | undefined;
  ACTIVE?: string | null | undefined;
  PAYMENT_FREQUENCY_ID?: string | null | undefined;
}

interface TableMeta {
  rows?: Array<Record<string, any>> | null | undefined;
  headers?:
  | {
    en?: string[] | null | undefined;
    ta?: string[] | null | undefined;
  }
  | null
  | undefined;
}

interface Scheme {
  SCHEMEID: number | null | undefined;
  SCHEMENAME: { en: string; ta?: string } | string | null | undefined;
  DESCRIPTION: { en: string; ta?: string } | string | null | undefined;
  BENEFITS?: string[] | null | undefined;
  SCHEMETYPE: string | null | undefined;
  savingType?: string | null | undefined;
  SLOGAN?: { en: string; ta?: string } | string | null | undefined;
  IMAGE?: string | null | undefined;
  ICON?: string | null | undefined;
  DURATION_MONTHS?: number | null | undefined;
  FIXED?: string | null | undefined;
  ACTIVE: string | null | undefined;
  SCHEMENO?: string | null | undefined;
  REGNO?: string | null | undefined;
  BRANCHID?: string | null | undefined;
  INS_TYPE?: string | null | undefined;
  meta_data?: Array<{ table_meta?: TableMeta }> | null | undefined;
  table_meta?: TableMeta | null | undefined;
  chits: Chit[] | null | undefined;
  branch?: Array<any> | null | undefined;
  relevantChits?: Array<{ CHITID: number; AMOUNT: number }> | null | undefined;
  instant_intrest?: boolean | null | undefined;
  scheme_plan_type_id?: number | null | undefined;
  SCHEME_PLAN_TYPE_ID?: number | null | undefined;
}

const DEFAULT_SCHEME_TYPE = "Monthly";

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

const getTranslatedText = (
  textObj: any,
  language: string
): string => {
  if (textObj === null || textObj === undefined || textObj === "") {
    return "";
  }

  if (typeof textObj === "string") {
    const trimmed = textObj.trim();
    const key = trimmed
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .split(" ")
      .filter(Boolean)
      .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
    const translated = t(key);
    if (translated && translated !== key && !translated.includes("missing")) {
      return translated;
    }
    return trimmed;
  }

  if (typeof textObj === "number") {
    return isNaN(textObj) ? "" : String(textObj);
  }

  if (typeof textObj === "boolean") {
    return String(textObj);
  }

  if (typeof textObj === "object" && textObj !== null) {
    if (Array.isArray(textObj)) {
      const validItems = textObj.filter(
        (item) => item !== null && item !== undefined && item !== ""
      );
      return validItems.length > 0 ? validItems.join(", ") : "";
    }

    // Check if this object contains any translation keys
    const hasEn = textObj.hasOwnProperty("en") || textObj.hasOwnProperty("EN");
    const hasTa = textObj.hasOwnProperty("ta") || textObj.hasOwnProperty("TA");
    const hasTe = textObj.hasOwnProperty("te") || textObj.hasOwnProperty("TE");
    const hasHi = textObj.hasOwnProperty("hi") || textObj.hasOwnProperty("HI");
    const hasMal = textObj.hasOwnProperty("mal") || textObj.hasOwnProperty("MAL") || (textObj as any).hasOwnProperty("_ta") || (textObj as any).hasOwnProperty("_TA");

    if (hasEn || hasTa || hasTe || hasHi || hasMal) {
      const targetText = textObj[language] || textObj[language.toUpperCase()] || textObj[language.toLowerCase()];
      const enText = textObj.en || textObj.EN || "";
      const taText = textObj.ta || textObj.TA || "";

      // Malayalam fallback logic if "mal" translation is missing
      if ((language === "mal" || language === "MAL") && !targetText) {
        const malTextLegacy = (textObj as any)._ta || (textObj as any)._TA || "";
        return malTextLegacy || taText || enText || Object.values(textObj)[0] || "";
      }

      return targetText || enText || taText || Object.values(textObj)[0] || "";
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

export default function SchemeList({ isNested = false }: { isNested?: boolean }) {
  const { schemeId, schemeType, mode } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<string>("");
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [joiningScheme, setJoiningScheme] = useState<number | null>(null);
  const router = useRouter();
  const { language } = useGlobalStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<any[]>([]);

  const getEnquiryButtonText = (lang: string) => {
    const texts: Record<string, string> = {
      en: "Visit Branch / Enquiry Now",
      ta: "கிளையை அணுகவும் / விசாரிக்க",
      te: "బ్రాంచ్ సందర్శించండి / విచారణ",
      hi: "శాखा में संपर्क करें / पूछताछ",
      mal: "ബ്രാഞ്ച് സന്ദർശിക്കുക / അന്വേഷണം",
    };
    return texts[lang] || texts.en;
  };

  const underlineAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef(new Animated.Value(0)).current;
  const tabScaleAnim = useRef(new Animated.Value(1)).current;
  const [tabLayouts, setTabLayouts] = useState<{
    [key: string]: { x: number; width: number };
  }>({});
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [currentPanResponder, setCurrentPanResponder] = useState<ReturnType<
    typeof PanResponder.create
  > | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | null>(null);
  const [userSelectedTab, setUserSelectedTab] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);

  const getAvailableTabTypes = useCallback(
    (schemesData: Scheme[]): string[] => {
      if (!schemesData || schemesData.length === 0) return [];

      const tabTypes = new Set<string>();

      schemesData.forEach((scheme) => {
        if (scheme.ACTIVE === "Y") {
          // Check scheme-level fields
          const schemeTypeLower = (scheme.SCHEMETYPE || "").toLowerCase();
          const schemeNameLower = (getTranslatedText(scheme.SCHEMENAME, "en") || "").toLowerCase();
          const insTypeLower = (scheme.INS_TYPE || "").toLowerCase();

          const isSchemeFlexi =
            schemeTypeLower.includes("flexi") ||
            schemeTypeLower.includes("flexible") ||
            schemeNameLower.includes("flexi") ||
            insTypeLower.includes("flexi");

          const isSchemeHybrid =
            schemeTypeLower.includes("hybrid") ||
            schemeNameLower.includes("hybrid") ||
            insTypeLower.includes("hybrid") ||
            scheme.scheme_plan_type_id === 3 ||
            scheme.SCHEME_PLAN_TYPE_ID === 3;

          if (isSchemeFlexi) {
            tabTypes.add("Flexi");
          }
          if (isSchemeHybrid) {
            tabTypes.add("Hybrid");
          }

          // Fallback to chit-level fields
          if (scheme.chits && scheme.chits.length > 0) {
            scheme.chits.forEach((chit) => {
              if (
                chit &&
                chit.PAYMENT_FREQUENCY &&
                chit.ACTIVE === "Y" &&
                isValidString(chit.PAYMENT_FREQUENCY)
              ) {
                const normalizedFreq = chit.PAYMENT_FREQUENCY.trim();
                tabTypes.add(normalizedFreq);

                if (
                  normalizedFreq.toLowerCase().includes("flexi") ||
                  normalizedFreq.toLowerCase().includes("flexible")
                ) {
                  tabTypes.add("Flexi");
                }
                if (normalizedFreq.toLowerCase().includes("hybrid")) {
                  tabTypes.add("Hybrid");
                }
              }
            });
          }
        }
      });

      const sortedTabs = Array.from(tabTypes).sort((a, b) => {
        const order: Record<string, number> = {
          Daily: 1,
          Weekly: 2,
          Monthly: 3,
          Flexi: 4,
          Hybrid: 5,
        };
        return (order[a] || 999) - (order[b] || 999);
      });

      logger.log("Available tab types detected:", sortedTabs);
      return sortedTabs;
    },
    []
  );

  const filteredSchemes = useMemo(() => {
    if (!allSchemes.length || !activeTab) return [];

    const buckets: { [key: string]: any[] } = {};

    allSchemes.forEach((scheme: Scheme) => {
      if (scheme.ACTIVE !== "Y") return;

      const activeTabLower = activeTab.toLowerCase().trim();
      const schemeTypeLower = (scheme.SCHEMETYPE || "").toLowerCase();
      const schemeNameLower = (getTranslatedText(scheme.SCHEMENAME, "en") || "").toLowerCase();
      const insTypeLower = (scheme.INS_TYPE || "").toLowerCase();

      const isSchemeFlexi =
        schemeTypeLower.includes("flexi") ||
        schemeTypeLower.includes("flexible") ||
        schemeNameLower.includes("flexi") ||
        insTypeLower.includes("flexi");

      const isSchemeHybrid =
        schemeTypeLower.includes("hybrid") ||
        schemeNameLower.includes("hybrid") ||
        insTypeLower.includes("hybrid") ||
        scheme.scheme_plan_type_id === 3 ||
        scheme.SCHEME_PLAN_TYPE_ID === 3;

      const isFlexiTab = activeTabLower === "flexi";
      const isHybridTab = activeTabLower === "hybrid";
      const matchesTabDirectly =
        (isFlexiTab && isSchemeFlexi) || (isHybridTab && isSchemeHybrid);

      const chits = scheme.chits || [];
      const relevantChits = chits.filter(
        (chit) => {
          if (!chit || !chit.PAYMENT_FREQUENCY) return false;

          const chitFreq = chit.PAYMENT_FREQUENCY.toLowerCase().trim();

          if (chitFreq === activeTabLower) return true;

          if (activeTabLower === "flexi") {
            return chitFreq.includes("flexi") || chitFreq.includes("flexible");
          }
          if (activeTabLower === "hybrid") {
            return chitFreq.includes("hybrid");
          }

          return false;
        }
      );

      if (relevantChits.length > 0 || matchesTabDirectly) {
        if (!buckets[activeTab.toLowerCase()]) {
          buckets[activeTab.toLowerCase()] = [];
        }

        const chitsToUse = relevantChits.length > 0 ? relevantChits : chits;

        buckets[activeTab.toLowerCase()].push({
          ...scheme,
          chits: chitsToUse,
          relevantChits: chitsToUse.map((chit) => ({
            CHITID: chit.CHITID || 0,
            AMOUNT: parseFloat(chit.AMOUNT || "0") || 0,
          })),
        });
      }
    });

    return buckets[activeTab.toLowerCase()] || [];
  }, [activeTab, allSchemes]);

  useEffect(() => {
    logger.log("SchemeList params:", { schemeId, schemeType, mode });
    logger.log("Available tabs:", availableTabs);
    logger.log("Active tab:", activeTab);
    logger.log("Filtered schemes count:", filteredSchemes.length);
    logger.log("User selected tab:", userSelectedTab);
  }, [schemeId, schemeType, mode, availableTabs, activeTab, filteredSchemes.length, userSelectedTab]);

  useEffect(() => {
    if (schemeType) {
      logger.log("SchemeType changed, resetting user selection flag");
      setUserSelectedTab(false);
    }
  }, [schemeType]);

  useEffect(() => {
    setSchemes(filteredSchemes);
  }, [filteredSchemes]);

  useEffect(() => {
    if (schemes.length > 0 && !loading) {
      Animated.timing(cardAnimations, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [schemes, loading]);

  useEffect(() => {
    logger.log("Auto-select effect triggered:", {
      schemeId,
      schemeIdType: typeof schemeId,
      schemeType,
      filteredSchemesLength: filteredSchemes.length,
      activeTab,
      availableTabsLength: availableTabs.length,
    });

    if (schemeId && filteredSchemes.length > 0) {
      const targetSchemeId =
        typeof schemeId === "string"
          ? parseInt(schemeId, 10)
          : Number(schemeId);

      logger.log(
        "Looking for scheme ID:",
        targetSchemeId,
        "in schemes:",
        filteredSchemes.map((s) => ({ id: s.SCHEMEID, name: s.SCHEMENAME }))
      );

      const targetScheme = filteredSchemes.find(
        (scheme) => scheme.SCHEMEID === targetSchemeId
      );

      logger.log(
        "Target scheme found:",
        !!targetScheme,
        targetScheme
          ? {
            id: targetScheme.SCHEMEID,
            name: targetScheme.SCHEMENAME,
          }
          : null
      );

      if (targetScheme) {
        setSelectedSchemeId(targetSchemeId);
        logger.log("Selected scheme ID set:", targetSchemeId);

        setTimeout(() => {
          const schemeIndex = filteredSchemes.findIndex(
            (scheme) => scheme.SCHEMEID === targetSchemeId
          );
          logger.log("Scheme index for scrolling:", schemeIndex);

          if (schemeIndex >= 0 && flatListRef.current) {
            try {
              flatListRef.current.scrollToIndex({
                index: schemeIndex,
                animated: true,
                viewPosition: 0.5,
              });
              logger.log("Successfully scrolled to scheme");
            } catch (error) {
              logger.warn("Error scrolling to scheme:", error);
              flatListRef.current.scrollToOffset({
                offset: schemeIndex * 300,
                animated: true,
              });
            }
          }
        }, 500);
      } else {
        logger.warn(
          `Scheme with ID ${targetSchemeId} not found in current tab. Available schemes:`,
          filteredSchemes.map((s) => s.SCHEMEID)
        );
      }
    }
  }, [schemeId, filteredSchemes, activeTab, availableTabs.length, schemeType]);

  useEffect(() => {
    let isMounted = true;

    const fetchAllSchemes = async () => {
      if (!isMounted) return;
      setLoading(true);
      setShowShimmer(true);
      try {
        const { fetchSchemesWithCache } = await import("@/utils/apiCache");
        const schemesData = await fetchSchemesWithCache();

        if (isMounted) {
          if (schemesData && isValidArray(schemesData)) {
            const validSchemes = schemesData.filter(isValidScheme);

            if (validSchemes.length === 0) {
              logger.warn("No valid schemes found in API response");
              setAllSchemes([]);
            } else {
              setAllSchemes(validSchemes);
            }
          } else {
            logger.warn("No schemes data in response");
            setAllSchemes([]);
          }
        }
      } catch (error) {
        if (isMounted) {
          logger.error("Error fetching schemes:", error);
          Alert.alert(t("schemes.error"), t("schemes.failedToFetchSchemes"));
          setAllSchemes([]);
        }
      } finally {
        if (isMounted) {
          setTimeout(() => {
            setLoading(false);
            setShowShimmer(false);
          }, 500);
        }
      }
    };

    fetchAllSchemes();
    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { fetchSchemesWithCache } = await import("@/utils/apiCache");
      const schemesData = await fetchSchemesWithCache();

      if (schemesData && isValidArray(schemesData)) {
        const validSchemes = schemesData.filter(isValidScheme);
        setAllSchemes(validSchemes);
      }
    } catch (error) {
      logger.error("Error refreshing schemes:", error);
      Alert.alert(t("schemes.error"), t("schemes.failedToFetchSchemes"));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const tabs = getAvailableTabTypes(allSchemes);
    setAvailableTabs(tabs);
    logger.log("Tab selection effect:", {
      tabs,
      schemeType,
      activeTab,
      allSchemesLength: allSchemes.length,
    });

    if (tabs.length > 0) {
      let targetTab = tabs[0];

      if (schemeType && tabs.includes(schemeType as string) && !userSelectedTab) {
        targetTab = schemeType as string;
        logger.log("Using provided schemeType:", targetTab);
      } else if (activeTab && tabs.includes(activeTab)) {
        targetTab = activeTab;
        logger.log("Keeping current active tab:", targetTab);
      } else {
        logger.log("Using default first tab:", targetTab);
      }

      if (targetTab !== activeTab && (!activeTab || !tabs.includes(activeTab)) && !userSelectedTab) {
        logger.log("Setting active tab to:", targetTab);
        setActiveTab(targetTab);
      }
    } else if (tabs.length === 0) {
      setActiveTab("");
    }
  }, [allSchemes, getAvailableTabTypes, schemeType, userSelectedTab]);

  useEffect(() => {
    if (availableTabs.length > 1) {
      const newPanResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 20;
        },
        onPanResponderRelease: (_, gestureState) => {
          const currentIndex = availableTabs.indexOf(activeTab);
          if (
            gestureState.dx < -50 &&
            currentIndex < availableTabs.length - 1
          ) {
            handleTabPress(availableTabs[currentIndex + 1]);
          } else if (gestureState.dx > 50 && currentIndex > 0) {
            handleTabPress(availableTabs[currentIndex - 1]);
          }
        },
      });
      setCurrentPanResponder(newPanResponder);
    } else {
      setCurrentPanResponder(null);
    }
  }, [availableTabs, activeTab]);

  useEffect(() => {
    if (!activeTab || availableTabs.length === 0) return;
    const currentTabIndex = availableTabs.indexOf(activeTab);
    if (currentTabIndex >= 0) {
      // Initialize underline position if tab layout is available
      if (tabLayouts[activeTab]) {
        underlineAnim.setValue(tabLayouts[activeTab].x);
      }

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: currentTabIndex * -width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(tabScaleAnim, {
            toValue: 1.05,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(tabScaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [activeTab, availableTabs, slideAnim, tabLayouts]);

  const handleJoinScheme = async (item: Scheme) => {
    const schemeId = item.SCHEMEID || 0;
    setJoiningScheme(schemeId);

    try {
      const chits = item.chits || [];
      const relevantChits = chits.filter(
        (chit) => chit && chit.PAYMENT_FREQUENCY === activeTab
      );

      const schemeDataToStore = {
        schemeId: schemeId,
        name: getTranslatedText(item.SCHEMENAME, language) || "Unnamed Scheme",
        description:
          getTranslatedText(item.DESCRIPTION as any, language) ||
          "No description available",
        type: activeTab,
        chits: relevantChits,
        schemeType: activeTab.toLowerCase() === "flexi" ? "flexi" : "fixed",
        activeTab: activeTab,
        benefits: item.BENEFITS || [],
        slogan: getTranslatedText(item.SLOGAN || { en: "" }, language) || "",
        image: item.IMAGE || "",
        icon: item.ICON || "",
        durationMonths: item.DURATION_MONTHS || 0,
        metaData: item.table_meta || item.meta_data || null,
        instant_intrest: item.instant_intrest || false,
        timestamp: new Date().toISOString(),
        savingType: item.savingType || (item.SCHEMETYPE?.toLowerCase() === "weight" ? "weight" : "amount"),
      };

      await AsyncStorage.setItem(
        "@current_scheme_data",
        JSON.stringify(schemeDataToStore)
      );

      router.push({
        pathname: "/home/join_savings",
        params: {
          schemeId: schemeId.toString(),
        },
      });
    } catch (error) {
      logger.error("Error storing scheme data:", error);
      Alert.alert(t("schemes.error"), t("schemes.failedToLoadSchemeData"));
    } finally {
      setJoiningScheme(null);
    }
  };

  const handleTabPress = (title: string) => {
    logger.log("User manually selected tab:", title);
    setUserSelectedTab(true);
    setActiveTab(title);

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (tabLayouts[title]) {
      Animated.spring(underlineAnim, {
        toValue: tabLayouts[title].x,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const showDetailModal = useCallback((scheme: Scheme) => {
    setSelectedScheme(scheme);
    setIsDetailModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalVisible(false);
    setSelectedScheme(null);
  }, []);

  const getTabColor = (title: string) => {
    const colors: Record<string, string[]> = {
      Daily: ["#FF9A9E", "#FAD0C4"],
      Weekly: ["#A1C4FD", "#C2E9FB"],
      Monthly: ["#FFECD2", "#FCB69F"],
      Flexi: ["#D4FC79", "#96E6A1"],
      Hybrid: ["#e0c3fc", "#8ec5fc"], // Light lavender/sky blue gradient
    };
    return colors[title] || ["#667eea", "#764ba2"];
  };

  // Helper to convert hex to rgba with opacity
  const hexToRgba = (hex: string, alpha: number = 1): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getCardGradient = (title: string): [string, string] => {
    const tabColors = getTabColor(title);
    // Use slightly darker/more saturated colors for better text contrast
    return [
      hexToRgba(tabColors[0], 0.95),
      hexToRgba(tabColors[1], 0.95),
    ];
  };

  // Helper to calculate luminance of a color
  const getLuminance = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const [rs, gs, bs] = [r, g, b].map(val =>
      val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  // Helper to determine if text should be dark or light based on background
  const getTextColorForBackground = (title: string): string => {
    const tabColors = getTabColor(title);
    // Calculate average luminance of the gradient
    const avgLuminance = (getLuminance(tabColors[0]) + getLuminance(tabColors[1])) / 2;
    // If background is light (luminance > 0.5), use dark text; otherwise use light text
    return avgLuminance > 0.5 ? '#1a1a1a' : '#ffffff';
  };

  // Helper to darken a hex color
  const darkenColor = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - percent)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent)));
    const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent)));
    return `rgba(${r}, ${g}, ${b}, 0.95)`;
  };

  // Helper to get a darker version of the gradient for better contrast
  const getDarkerGradient = (title: string): [string, string] => {
    const tabColors = getTabColor(title);
    // Darken colors by 15% for better text contrast while maintaining color identity
    return [
      darkenColor(tabColors[0], 0.15),
      darkenColor(tabColors[1], 0.15),
    ];
  };

  const getTabIcon = (title: string) => {
    switch (title) {
      case "Daily":
        return "today-outline";
      case "Weekly":
        return "calendar-outline";
      case "Monthly":
        return "moon-outline";
      case "Flexi":
        return "options-outline";
      case "Hybrid":
        return "layers-outline";
      default:
        return "grid-outline";
    }
  };

  const renderTab = (title: string) => {
    const isActive = activeTab === title;

    return (
      <TouchableOpacity
        key={title}
        onLayout={(e) => {
          const { x, width } = e.nativeEvent.layout;
          setTabLayouts((prev) => ({ ...prev, [title]: { x, width } }));
        }}
        onPress={() => handleTabPress(title)}
        style={styles.pillTabWrapper}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.pillTabContainer,
            isActive && styles.pillTabActiveContainer,
            isActive && {
              transform: [{ scale: tabScaleAnim }]
            }
          ]}
        >
          {isActive && (
             <LinearGradient
                colors={['#FFD700', '#DAA520']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
             />
          )}
          <Text style={[
            styles.pillTabText,
            isActive && styles.pillTabActiveText
          ]}>
            {title}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const extractTableMetaFromItem = (item: Scheme): TableMeta | null => {
    if (!item) return null;

    if (item.table_meta && typeof item.table_meta === "object") {
      return item.table_meta as TableMeta;
    }

    if (Array.isArray(item.meta_data) && item.meta_data.length > 0) {
      const firstMeta = item.meta_data[0];
      if (
        firstMeta &&
        firstMeta.table_meta &&
        typeof firstMeta.table_meta === "object"
      ) {
        return firstMeta.table_meta as TableMeta;
      }
    }

    return null;
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderTableMeta = (item: Scheme) => {
    const table: TableMeta | null = extractTableMetaFromItem(item);
    if (!table || !table.headers || !table.rows) return null;

    const headers = (table.headers as any)[language] || table.headers.en || [];

    return (
      <View style={styles.tableRefinedContainer}>
        {/* Table Header */}
        <View style={styles.tableRefinedHeader}>
          {headers.map((h: string, idx: number) => (
            <Text key={idx} style={styles.tableRefinedHeaderText}>
              {getTranslatedText(h, language)}
            </Text>
          ))}
        </View>

        {/* Table Rows */}
        {table.rows.map((row, rIndex) => (
          <View key={rIndex} style={[styles.tableRefinedRow, rIndex % 2 !== 0 && styles.tableRowAlt]}>
            {Object.values(row).map((cell, cIndex) => (
              <Text key={cIndex} style={styles.tableRefinedCell}>
                {getTranslatedText(cell, language)}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const getPremiumGradient = (index: number): [string, string] => {
    const gradients: [string, string][] = [
      ['#000000', '#1A1A1A'], // Onyx Black
      ['#020818', '#0A1A44'], // Midnight Sapphire
      ['#240505', '#550A0A'], // Royal Ruby
      ['#041408', '#0D3315'], // Forest Emerald
      ['#120418', '#330D44'], // Imperial Plum
      ['#0F172A', '#1E293B'], // Charcoal Slate
    ];
    return gradients[index % gradients.length];
  };

  const getMinMaxAmount = (item: Scheme) => {
    if (!item.chits || item.chits.length === 0) return { min: 0, max: 0 };
    
    const amounts = item.chits
      .map(c => parseFloat(c.AMOUNT || "0"))
      .filter(a => a > 0);
    
    if (amounts.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...amounts),
      max: Math.max(...amounts)
    };
  };

  const renderSchemeItem = ({ item, index }: { item: Scheme; index: number }) => {
    if (!item) return null;

    const type = (item.SCHEMETYPE || activeTab || "").toLowerCase();
    const isFlexi = type.includes('flexi') || type.includes('flexible');
    const gradientColors = getPremiumGradient(index);
    const { min, max } = getMinMaxAmount(item);

    // Determine coin type
    const schemeNameLower = (getTranslatedText(item.SCHEMENAME, 'en') || "").toLowerCase();
    const coinSource = schemeNameLower.includes('silver')
      ? require("../../../../../assets/images/silver_coin_badge.png")
      : schemeNameLower.includes('diamond')
        ? require("../../../../../assets/images/diamond_coin_badge.png")
        : require("../../../../../assets/images/gold_coin_badge.png");

    const cardAnimation = {
      opacity: cardAnimations,
      transform: [
        {
          translateY: cardAnimations.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View
        style={[
          styles.schemeCardContainer,
          cardAnimation,
          { marginTop: index === 0 ? 10 : 0 },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.schemeCardGradient}
        >
          <Image
            source={require("../../../../../assets/images/jewelry_pattern.png")}
            style={styles.cardWatermark}
            resizeMode="contain"
          />

          <View style={styles.cardHeader}>
            <View style={styles.cardMainInfo}>
              <Text style={styles.newSchemeName} numberOfLines={2}>
                {getTranslatedText(item.SCHEMENAME, language) || "Unnamed Scheme"}
              </Text>
              
              {min > 0 ? (
                <View style={styles.amountRangeContainer}>
                  <Text style={styles.minAmountLabel}>
                    {t("schemes.minimumAmount") || "Min"} : {formatAmount(min)}
                  </Text>
                  {max > min && (
                    <Text style={styles.minAmountLabel}>
                      {" | "}{t("maximum") || "Max"} : {formatAmount(max)}
                    </Text>
                  )}
                </View>
              ) : item.SLOGAN ? (
                <View style={styles.amountRangeContainer}>
                  <Text style={styles.minAmountLabel} numberOfLines={1}>
                    {getTranslatedText(item.SLOGAN, language)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.inlineInfoRow}>
                <View style={styles.infoPill}>
                  <Ionicons name="calendar-outline" size={14} color="#FFD700" />
                  <Text style={styles.infoPillText}>
                    {item.DURATION_MONTHS || "11"} {t("schemes.months") || "Months"}
                  </Text>
                </View>
                <View style={[styles.infoPill, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <Ionicons name={isFlexi ? "options-outline" : "timer-outline"} size={14} color="#FFF" />
                  <Text style={[styles.infoPillText, { color: '#FFF' }]}>{activeTab}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardSideInfo}>
              <Image source={coinSource} style={styles.coinIcon} />
            </View>
          </View>

          <View style={styles.cardActionRow}>
             <TouchableOpacity
              onPress={() => {
                const planTypeId = item.SCHEME_PLAN_TYPE_ID || item.scheme_plan_type_id;
                if (planTypeId === 4) {
                  router.push({
                    pathname: "/(app)/old_gold",
                    params: { tab: "enquiry" }
                  });
                } else {
                  showDetailModal(item);
                }
              }}
              style={styles.knowMoreButtonClean}
            >
              <Text style={styles.knowMoreButtonTextClean}>
                {(item.SCHEME_PLAN_TYPE_ID === 4 || item.scheme_plan_type_id === 4)
                  ? (language === "ta" ? "விசாரிக்க" : language === "te" ? "విచారణ" : language === "hi" ? "पूछताछ" : language === "mal" ? "അന്വേഷണം" : "Enquiry Now")
                  : (t("joinThisSchemes") || "Join Now")
                }
              </Text>
              <Ionicons 
                name={(item.SCHEME_PLAN_TYPE_ID === 4 || item.scheme_plan_type_id === 4) ? "call" : "arrow-forward-circle"} 
                size={24} 
                color="#FFD700" 
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderShimmerItem = () => (
    <View style={styles.shimmerCard}>
      <View style={styles.shimmerHeader} />
      <View style={styles.shimmerContent}>
        <View style={styles.shimmerLine} />
        <View style={[styles.shimmerLine, { width: '80%' }]} />
        <View style={[styles.shimmerLine, { width: '60%' }]} />
        <View style={styles.shimmerButton} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      {!isNested && (
        <View
          style={[styles.headerGradient, { backgroundColor: theme.colors.quaternary || '#F2E6D2', paddingTop: insets.top + 10 }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                  <Ionicons name="arrow-back" size={28} color={theme.colors.primary || "#850111"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.primary || "#850111", marginBottom: 0 }]} numberOfLines={1} adjustsFontSizeToFit>
                  {t("schemes.explore") || "Explore Schemes"}
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: "rgba(133, 1, 17, 0.7)" }]} numberOfLines={1}>
                {t("schemes.subtitle") || "Find the perfect gold savings plan for you"}
              </Text>
            </View>

            {/* Savings Home Button */}
            <TouchableOpacity
              onPress={() => router.push('/(app)/(tabs)/home')}
              style={{ backgroundColor: 'rgba(133, 1, 17, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}
            >
              <Ionicons name="home" size={16} color={theme.colors.primary || "#850111"} style={{ marginRight: 4 }} />
              <Text style={{ color: theme.colors.primary || "#850111", fontSize: 12, fontWeight: '600' }}>Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[
        styles.tabsWrapper,
        styles.iosTabsWrapper
      ]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabsScrollContainer,
            styles.iosTabsScrollContainer
          ]}
        >
          {availableTabs.map((tab) => renderTab(tab))}
        </ScrollView>
      </View>

      <View style={styles.contentContainer}>
        {loading && showShimmer ? (
          <FlatList
            data={[1, 2, 3]}
            renderItem={renderShimmerItem}
            keyExtractor={(item) => item.toString()}
            contentContainerStyle={styles.shimmerContainer}
          />
        ) : availableTabs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={80} color="#ccc" />
            <Text style={styles.emptyStateTitle}>{t("noSchemesAvailable") || "No Schemes Available"}</Text>
            <Text style={styles.emptyStateText}>
              Check back later for new savings opportunities
            </Text>
          </View>
        ) : schemes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={80} color="#ccc" />
            <Text style={styles.emptyStateTitle}>
              No {activeTab} Schemes Found
            </Text>
            <Text style={styles.emptyStateText}>
              Try selecting a different category
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={schemes}
            renderItem={renderSchemeItem}
            keyExtractor={(item, index) =>
              item?.SCHEMEID?.toString() || `scheme-${index}`
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#667eea"]}
                tintColor="#667eea"
              />
            }
            ListHeaderComponent={
              <Text style={styles.resultsCount}>
                {schemes.length} {activeTab} Scheme{schemes.length !== 1 ? 's' : ''} Available
              </Text>
            }
            ListFooterComponent={
              <View style={styles.listFooter}>
                <Text style={styles.footerText}>
                  Scroll for more savings options
                </Text>
              </View>
            }
          />
        )}
      </View>

      {schemes.length > 0 && !loading && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }}
        >
          <Ionicons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal
        visible={isDetailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentModern}>
             <TouchableOpacity style={styles.floatingCloseButton} onPress={closeDetailModal}>
                 <View style={styles.closeButtonBlur}>
                    <Ionicons name="close" size={20} color="#000" />
                 </View>
             </TouchableOpacity>

            <ScrollView 
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
            >
              {selectedScheme && (
                <>
                  <View style={styles.modernHeader}>
                    <Text style={styles.modernTitle}>
                      {getTranslatedText(selectedScheme.SCHEMENAME, language) || "Unnamed Scheme"}
                    </Text>
                    {selectedScheme.SLOGAN && (
                      <Text style={styles.modernSlogan}>
                        {getTranslatedText(selectedScheme.SLOGAN as any, language)}
                      </Text>
                    )}
                    <View style={styles.titleUnderlineGradient} />
                  </View>

                  <View style={styles.pillBadgesContainer}>
                    <View style={styles.pillBadge}>
                      <Text style={styles.pillBadgeText}>{activeTab}</Text>
                    </View>
                    {selectedScheme.DURATION_MONTHS && (
                      <View style={styles.pillBadge}>
                        <Text style={styles.pillBadgeText}>{selectedScheme.DURATION_MONTHS} {t("schemes.months") || "Months"}</Text>
                      </View>
                    )}
                    <View style={[styles.pillBadge, { backgroundColor: '#F0F0FF' }]}>
                      <Text style={[styles.pillBadgeText, { color: '#5D5DFF' }]}>
                        {selectedScheme.savingType === 'weight' ? (t('goldWeight') || 'Gold Weight') : (t('amount') || 'Amount')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.gridSection}>
                    <Text style={styles.gridSectionTitle}>{t("benefits") || "Benefits"}</Text>
                    <View style={styles.benefitsGrid}>
                      {(selectedScheme.BENEFITS || ["Secure Gold Savings", "Bonus on Maturity", "Instant Access"]).map((benefit, idx) => (
                        <View key={idx} style={styles.gridBenefitItem}>
                          <View style={styles.gridIconContainer}>
                            <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
                          </View>
                          <Text style={styles.gridBenefitText}>{getTranslatedText(benefit, language)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {selectedScheme.DESCRIPTION && (
                    <View style={styles.modernSection}>
                      <Text style={styles.modernSectionTitle}>{t("description") || "Description"}</Text>
                      <Text style={styles.modernDescription}>
                        {getTranslatedText(selectedScheme.DESCRIPTION as any, language)}
                      </Text>
                    </View>
                  )}

                  {selectedScheme.table_meta && (
                    <View style={styles.modernSection}>
                      <Text style={styles.modernSectionTitle}>{t("schemeDetails") || "Scheme Details"}</Text>
                      {renderTableMeta(selectedScheme)}
                    </View>
                  )}
                  
                  <View style={{ height: 40 }} />
                </>
              )}
            </ScrollView>

            <View style={styles.stickyModalFooter}>
              <TouchableOpacity
                onPress={() => {
                  if (selectedScheme) {
                    closeDetailModal();
                    const planTypeId = selectedScheme.SCHEME_PLAN_TYPE_ID || selectedScheme.scheme_plan_type_id;
                    if (planTypeId === 4) {
                      router.push({
                        pathname: "/(app)/old_gold",
                        params: { tab: "enquiry" }
                      });
                    } else {
                      handleJoinScheme(selectedScheme);
                    }
                  }
                }}
                style={styles.modalJoinNowButton}
              >
                <LinearGradient
                  colors={['#FFD700', '#DAA520']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalJoinButtonGradient}
                >
                  <Ionicons name={(selectedScheme?.SCHEME_PLAN_TYPE_ID === 4 || selectedScheme?.scheme_plan_type_id === 4) ? "call" : "add-circle"} size={22} color="#000" />
                  <Text style={styles.modalJoinButtonText}>
                    {(selectedScheme?.SCHEME_PLAN_TYPE_ID === 4 || selectedScheme?.scheme_plan_type_id === 4)
                      ? getEnquiryButtonText(language)
                      : (t("joinThisScheme") || "JOIN THIS SCHEME")
                    }
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Branch Details / Enquiry Modal */}
      <Modal
        visible={branchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentModern, { maxHeight: height * 0.7 }]}>
            <TouchableOpacity style={styles.floatingCloseButton} onPress={() => setBranchModalVisible(false)}>
              <View style={styles.closeButtonBlur}>
                <Ionicons name="close" size={20} color="#000" />
              </View>
            </TouchableOpacity>

            <View style={styles.modernHeader}>
              <Text style={styles.modernTitle}>
                {language === "ta" ? "எங்களை தொடர்பு கொள்ளவும்" : "Contact / Enquiry"}
              </Text>
              <Text style={styles.modernSlogan}>
                {language === "ta" 
                  ? "கீழே உள்ள எங்களின் கிளைகளைத் தொடர்பு கொண்டு இத்திட்டத்தில் இணையுங்கள்"
                  : "Visit or call any of our branches to enroll in this scheme"
                }
              </Text>
              <View style={styles.titleUnderlineGradient} />
            </View>

            <ScrollView 
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {selectedBranches && selectedBranches.length > 0 ? (
                selectedBranches.map((branch, idx) => (
                  <View key={idx} style={styles.branchCard}>
                    <View style={styles.branchHeaderRow}>
                      <Ionicons name="business" size={22} color="#DAA520" />
                      <Text style={styles.branchNameText}>
                        {branch.branchName || "Branch"}
                      </Text>
                    </View>
                    
                    <Text style={styles.branchAddressText}>
                      {branch.branchAddress}, {branch.branchCity}, {branch.branchState}
                    </Text>

                    {branch.branchPhone && (
                      <TouchableOpacity 
                        style={styles.branchCallButton}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          Linking.openURL(`tel:${branch.branchPhone}`);
                        }}
                      >
                        <Ionicons name="call" size={16} color="#fff" />
                        <Text style={styles.branchCallButtonText}>
                          {branch.branchPhone}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#666' }}>
                    {language === "ta" ? "கிளை விவரங்கள் கிடைக்கவில்லை" : "No branch details available"}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    // Removed borderBottomLeftRadius and borderBottomRightRadius to remain flat
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  tabsWrapper: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  tabsScrollContainer: {
    paddingHorizontal: 8,
  },
  tabWrapper: {
    marginHorizontal: 6,
  },
  tabContainer: {
    minWidth: 100,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  inactiveTabContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },


  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },



  // iOS Specific Styles
  iosTabsWrapper: {
    backgroundColor: '#f2f2f7', // System Gray 6
    paddingVertical: 10,
    borderBottomWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  iosTabsScrollContainer: {
    paddingHorizontal: 16,
  },
  iosTabContainer: {
    height: 32,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  iosInactiveTabContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 12,
  },
  iosActiveTabContainer: {
    backgroundColor: COLORS.info,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 0, // No elevation on iOS for this specific look, using shadow
  },
  iosActiveTabContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  iosActiveTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  iosTabText: {
    fontSize: 13,
    fontWeight: '400',
  },
  iosCardHeader: {
    padding: 20,
    backgroundColor: '#fff', // Or a very light gradient if preferred
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  iosSchemeBadge: {
    backgroundColor: '#007AFF', // System Blue
    borderWidth: 0,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  iosSchemeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'none',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginVertical: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  pillTabWrapper: {
    marginRight: 10,
  },
  pillTabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillTabActiveContainer: {
    borderColor: '#FFD700',
    backgroundColor: 'transparent',
  },
  pillTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  pillTabActiveText: {
    color: '#000',
    fontWeight: '900',
  },
  schemeCardContainer: {
    width: width - 40,
    borderRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  schemeCardGradient: {
    padding: 24,
    minHeight: 200,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardMainInfo: {
    flex: 1,
    gap: 8,
  },
  newSchemeName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  minAmountLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  amountRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  inlineInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    gap: 6,
  },
  infoPillText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
  },
  cardSideInfo: {
    marginLeft: 15,
    alignItems: 'center',
    gap: 12,
  },
  coinIcon: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    opacity: 0.9,
  },
  cardActionRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  knowMoreButtonClean: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  knowMoreButtonTextClean: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD700',
    textTransform: 'uppercase',
  },
  durationTagText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B4513', // Saddle Brown
  },
  cardWatermark: {
    position: 'absolute',
    top: -10,
    right: 40,
    width: 250,
    height: 250,
    opacity: 0.1,
    transform: [{ rotate: '-15deg' }],
  },
  durationTag: {
    backgroundColor: '#FFE5B4', // Light golden
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  newTableWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
  },
  actionButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 5,
  },
  newCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  newCancelButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  newJoinNowButton: {
    backgroundColor: '#FFE5B4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  newJoinNowButtonText: {
    color: '#8B4513',
    fontWeight: '800',
  },
  tableContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#E0E0E0',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    paddingVertical: 16,
  },
  listFooter: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  swipeHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  shimmerContainer: {
    paddingVertical: 16,
  },
  shimmerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  shimmerHeader: {
    height: 140,
    backgroundColor: '#e0e0e0',
  },
  shimmerContent: {
    padding: 20,
    gap: 12,
  },
  shimmerLine: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    width: '100%',
  },
  shimmerButton: {
    height: 50,
    backgroundColor: '#e0e0e0',
    borderRadius: 14,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentModern: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: "hidden",
    width: '90%',
    height: '75%',
  },
  floatingCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 100,
  },
  closeButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 45,
  },
  modernHeader: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 10,
  },
  modernTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -0.5,
  },
  modernSlogan: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginTop: 4,
  },
  titleUnderlineGradient: {
    height: 4,
    width: 50,
    backgroundColor: '#FFD700',
    borderRadius: 2,
    marginTop: 15,
  },
  pillBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    marginTop: 15,
  },
  pillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF9E6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  pillBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B8860B',
  },
  gridSection: {
    paddingHorizontal: 24,
    marginTop: 30,
  },
  gridSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 15,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridBenefitItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  gridIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  gridBenefitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
  },
  modernSection: {
    paddingHorizontal: 24,
    marginTop: 30,
  },
  modernSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    opacity: 0.6,
  },
  modernDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: '#444',
  },
  tableRefinedContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F3F5',
    backgroundColor: '#FFF',
  },
  tableRefinedHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  tableRefinedHeaderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#868E96',
    textAlign: 'left',
  },
  tableRefinedRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  tableRefinedCell: {
    flex: 1,
    fontSize: 13,
    color: '#495057',
    fontWeight: '600',
  },
  stickyModalFooter: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ADB5BD',
  },
  modalJoinNowButton: {
    width: "100%",
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#DAA520',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalJoinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  modalJoinButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  branchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  branchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  branchNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
  },
  branchAddressText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 12,
    lineHeight: 20,
  },
  branchCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  branchCallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
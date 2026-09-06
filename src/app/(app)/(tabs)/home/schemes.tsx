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
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { theme } from "@/constants/theme";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "@/utils/logger";
const { width, height } = Dimensions.get("window");
import * as Haptics from "expo-haptics";
import { COLORS } from "@/constants/colors";

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
    return textObj.trim() || "";
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

export const getSchemeMetalType = (scheme: Scheme | any): "gold" | "silver" | "diamond" | "platinum" | "old_gold" => {
  if (!scheme) return "gold";

  const extractAllStrings = (val: any): string => {
    if (!val) return "";
    if (typeof val === "string") return val.toLowerCase();
    if (typeof val === "object") {
      return Object.values(val)
        .map((v) => extractAllStrings(v))
        .join(" ")
        .toLowerCase();
    }
    return "";
  };

  const nameText = extractAllStrings(scheme.SCHEMENAME);
  const sloganText = extractAllStrings(scheme.SLOGAN);
  const schemeType = (scheme.SCHEMETYPE || "").toLowerCase();
  const insType = (scheme.INS_TYPE || "").toLowerCase();
  const savingType = (scheme.savingType || "").toLowerCase();
  const metalField = (scheme.metal || scheme.METAL || scheme.metal_type || scheme.METATYPE || "").toLowerCase();

  // Combine title, type, and metal attributes (do NOT use description to avoid generic jeweler keywords)
  const primaryText = `${nameText} ${sloganText} ${metalField} ${schemeType} ${insType} ${savingType}`;

  // 1. Old Gold check (must precede general gold)
  if (
    primaryText.includes("old gold") ||
    primaryText.includes("oldgold") ||
    primaryText.includes("old_gold") ||
    primaryText.includes("பழைய தங்கம்") ||
    primaryText.includes("பழைய") ||
    primaryText.includes("పాత బంగారం") ||
    primaryText.includes("पुराना सोना") ||
    primaryText.includes("പഴയ സ്വർണം")
  ) {
    return "old_gold";
  }

  // 2. Silver check
  if (
    primaryText.includes("silver") ||
    primaryText.includes("வெள்ளி") ||
    primaryText.includes("వెండి") ||
    primaryText.includes("चांदी")
  ) {
    return "silver";
  }

  // 3. Diamond check
  if (
    primaryText.includes("diamond") ||
    primaryText.includes("வைரம்") ||
    primaryText.includes("వజ్రం") ||
    primaryText.includes("हीरा") ||
    primaryText.includes("ഡയമണ്ട്")
  ) {
    return "diamond";
  }

  // 4. Platinum check
  if (
    primaryText.includes("platinum") ||
    primaryText.includes("பிளாட்டினம்") ||
    primaryText.includes("ప్లాటినం") ||
    primaryText.includes("प्लैटिनम") ||
    primaryText.includes("പ്ലാറ്റിനം")
  ) {
    return "platinum";
  }

  // 5. Default is Gold
  return "gold";
};

export default function SchemeList({ isNested = false }: { isNested?: boolean }) {
  const { isVisible } = useAppVisibility();
  const theme = useAppTheme();
  styles = getStyles(theme);
  const params = useLocalSearchParams<{ schemeId?: string; schemeType?: string; mode?: string; type?: string; category?: string; metal?: string }>();
  const { schemeId, schemeType, mode } = params;

  const parseIncomingMetal = useCallback(() => {
    const rawType = (params.type || params.category || params.metal || "").toLowerCase().trim();
    if (rawType === "gold" || rawType === "silver" || rawType === "diamond" || rawType === "platinum" || rawType === "old_gold" || rawType === "oldgold") {
      return rawType === "oldgold" ? "old_gold" : rawType;
    }
    if (rawType === "all") return "all";
    return "gold"; // Default to Gold rather than All
  }, [params.type, params.category, params.metal]);

  const [selectedMetal, setSelectedMetal] = useState<string>(parseIncomingMetal);

  const [schemePlanType, setSchemePlanType] = useState<"all" | "fixed" | "flexi" | "hybrid">("all");
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [joiningScheme, setJoiningScheme] = useState<number | null>(null);
  const router = useRouter();
  const { language } = useGlobalStore();
  const { t } = useTranslation();

  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<any[]>([]);

  // Update selectedMetal when navigation params change
  useEffect(() => {
    const incoming = parseIncomingMetal();
    setSelectedMetal(incoming);
    setUserSelectedTab(false);
  }, [params.type, params.category, params.metal, parseIncomingMetal]);

  useFocusEffect(
    useCallback(() => {
      const incoming = parseIncomingMetal();
      setSelectedMetal(incoming);
    }, [parseIncomingMetal])
  );

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

  const availableMetals = useMemo(() => {
    const metals = { gold: false, silver: false, diamond: false, platinum: false, old_gold: false };
    if (!allSchemes || allSchemes.length === 0) return { gold: true, silver: false, diamond: false, platinum: false, old_gold: false };

    allSchemes.forEach((scheme) => {
      if (scheme.ACTIVE !== "Y") return;
      const metalType = getSchemeMetalType(scheme);
      metals[metalType] = true;
    });

    if (!metals.gold && !metals.silver && !metals.diamond && !metals.platinum && !metals.old_gold) {
      metals.gold = true;
    }
    return metals;
  }, [allSchemes]);

  useEffect(() => {
    if (!allSchemes || allSchemes.length === 0) return;
    const current = selectedMetal.toLowerCase();
    if (current === "all") return;
    
    if (current === "gold" && !availableMetals.gold) {
      const first = Object.keys(availableMetals).find((k) => (availableMetals as any)[k]);
      if (first) setSelectedMetal(first);
    } else if (current === "silver" && !availableMetals.silver) {
      const first = Object.keys(availableMetals).find((k) => (availableMetals as any)[k]);
      if (first) setSelectedMetal(first);
    } else if (current === "diamond" && !availableMetals.diamond) {
      const first = Object.keys(availableMetals).find((k) => (availableMetals as any)[k]);
      if (first) setSelectedMetal(first);
    } else if (current === "platinum" && !availableMetals.platinum) {
      const first = Object.keys(availableMetals).find((k) => (availableMetals as any)[k]);
      if (first) setSelectedMetal(first);
    } else if (current === "old_gold" && !availableMetals.old_gold) {
      const first = Object.keys(availableMetals).find((k) => (availableMetals as any)[k]);
      if (first) setSelectedMetal(first);
    }
  }, [allSchemes, availableMetals, selectedMetal]);

  const schemesForSelectedMetal = useMemo(() => {
    if (!allSchemes || allSchemes.length === 0) return [];
    if (selectedMetal === "all") return allSchemes.filter((s) => s.ACTIVE === "Y");

    return allSchemes.filter((scheme: Scheme) => {
      if (scheme.ACTIVE !== "Y") return false;
      return getSchemeMetalType(scheme) === selectedMetal;
    });
  }, [allSchemes, selectedMetal]);

  const metalHasFlexi = useMemo(() => {
    return schemesForSelectedMetal.some((scheme) => {
      const schemeTypeLower = (scheme.SCHEMETYPE || "").toLowerCase();
      const schemeNameLower = (getTranslatedText(scheme.SCHEMENAME, "en") || "").toLowerCase();
      const insTypeLower = (scheme.INS_TYPE || "").toLowerCase();
      return (
        schemeTypeLower.includes("flexi") ||
        schemeTypeLower.includes("flexible") ||
        schemeNameLower.includes("flexi") ||
        insTypeLower.includes("flexi")
      );
    });
  }, [schemesForSelectedMetal]);

  const metalHasFixed = useMemo(() => {
    return schemesForSelectedMetal.some((scheme) => {
      const schemeTypeLower = (scheme.SCHEMETYPE || "").toLowerCase();
      const schemeNameLower = (getTranslatedText(scheme.SCHEMENAME, "en") || "").toLowerCase();
      const insTypeLower = (scheme.INS_TYPE || "").toLowerCase();
      const isFlexi =
        schemeTypeLower.includes("flexi") ||
        schemeTypeLower.includes("flexible") ||
        schemeNameLower.includes("flexi") ||
        insTypeLower.includes("flexi");
      return !isFlexi;
    });
  }, [schemesForSelectedMetal]);

  // Adjust plan type if the selected metal only has one plan type available
  useEffect(() => {
    if (metalHasFlexi && !metalHasFixed) {
      setSchemePlanType("flexi");
    } else if (!metalHasFlexi && metalHasFixed) {
      setSchemePlanType("fixed");
    } else if (schemeType) {
      if (schemeType.toLowerCase().includes("flexi") && metalHasFlexi) {
        setSchemePlanType("flexi");
      } else if (metalHasFixed) {
        setSchemePlanType("fixed");
      }
    } else if (metalHasFlexi && metalHasFixed) {
      setSchemePlanType("all");
    }
  }, [selectedMetal, metalHasFlexi, metalHasFixed, schemeType]);

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
    if (!allSchemes.length) return [];

    return allSchemes.filter((scheme: Scheme) => {
      if (scheme.ACTIVE !== "Y") return false;

      // Filter by selected metal category (gold, silver, diamond, platinum, old_gold, all)
      if (selectedMetal !== "all") {
        if (getSchemeMetalType(scheme) !== selectedMetal) {
          return false;
        }
      }

      // Filter by plan type (fixed, flexi, hybrid)
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

      if (schemePlanType === "flexi") {
        return isSchemeFlexi;
      } else if (schemePlanType === "hybrid") {
        return isSchemeHybrid;
      } else if (schemePlanType === "fixed") {
        // fixed: matches anything that is NOT flexi and NOT hybrid
        return !isSchemeFlexi && !isSchemeHybrid;
      } else {
        // "all": shows all schemes (both fixed and flexi) of the selected metal
        return true;
      }
    });
  }, [allSchemes, selectedMetal, schemePlanType]);

  const groupedSchemesData = useMemo(() => {
    if (selectedMetal !== "all") return [];

    const groups: Record<string, Scheme[]> = {};
    allSchemes.forEach(scheme => {
      if (scheme.ACTIVE !== "Y") return;

      const tab = (scheme.SCHEMETYPE || "Monthly");
      let groupName = "Monthly";
      if (tab.toLowerCase().includes("flexi") || tab.toLowerCase().includes("flexible")) {
        groupName = "Flexi";
      } else if (tab.toLowerCase().includes("daily")) {
        groupName = "Daily";
      } else if (tab.toLowerCase().includes("weekly")) {
        groupName = "Weekly";
      } else if (tab.toLowerCase().includes("monthly")) {
        groupName = "Monthly";
      } else if (tab.toLowerCase().includes("hybrid")) {
        groupName = "Hybrid";
      }

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(scheme);
    });

    const listData: Array<{ type: 'header' | 'scheme'; id: string; title?: string; scheme?: Scheme; index?: number }> = [];
    Object.keys(groups).sort().forEach(group => {
      const schemesInGroup = groups[group];
      if (schemesInGroup.length > 0) {
        listData.push({
          type: 'header',
          id: `header-${group}`,
          title: `${group} Schemes (${schemesInGroup.length} Scheme${schemesInGroup.length !== 1 ? 's' : ''} Available)`,
        });
        schemesInGroup.forEach((scheme, index) => {
          listData.push({
            type: 'scheme',
            id: scheme.SCHEMEID?.toString() || `scheme-${group}-${index}`,
            scheme,
            index,
          });
        });
      }
    });

    return listData;
  }, [allSchemes, selectedMetal]);

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

  const schemesListData = useMemo(() => {
    if (selectedMetal === "all") {
      return groupedSchemesData;
    }
    return filteredSchemes;
  }, [selectedMetal, groupedSchemesData, filteredSchemes]);

  useEffect(() => {
    if (schemesListData.length > 0 && !loading) {
      Animated.timing(cardAnimations, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [schemesListData, loading]);

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

  const hasFlexiSchemes = useMemo(() => {
    return availableTabs.some(t => t.toLowerCase() === "flexi");
  }, [availableTabs]);

  const hasFixedSchemes = useMemo(() => {
    return availableTabs.some(t => t.toLowerCase() !== "flexi");
  }, [availableTabs]);

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
      let planType = schemePlanType;
      
      if (!userSelectedTab) {
        const isFlexiParam = schemeType?.toLowerCase().includes("flexi");
        const containsFlexi = tabs.some(t => t.toLowerCase() === "flexi");
        const containsFixed = tabs.some(t => t.toLowerCase() !== "flexi");

        if (isFlexiParam && containsFlexi) {
          planType = "flexi";
        } else if (containsFixed && containsFlexi) {
          planType = "all";
        } else if (containsFixed) {
          planType = "fixed";
        } else if (containsFlexi) {
          planType = "flexi";
        }
        setSchemePlanType(planType);
      }

      let targetTab = tabs[0];
      if (planType === "all") {
        targetTab = t("allOnly") || "All";
      } else if (planType === "flexi") {
        targetTab = tabs.find(t => t.toLowerCase() === "flexi") || "Flexi";
      } else {
        const firstFixed = tabs.find(t => t.toLowerCase() !== "flexi");
        if (schemeType && schemeType.toLowerCase() !== "flexi" && tabs.includes(schemeType) && !userSelectedTab) {
          targetTab = schemeType;
        } else if (activeTab && activeTab.toLowerCase() !== "flexi" && tabs.includes(activeTab)) {
          targetTab = activeTab;
        } else if (firstFixed) {
          targetTab = firstFixed;
        }
      }

      if (targetTab !== activeTab && !userSelectedTab) {
        logger.log("Setting active tab to:", targetTab);
        setActiveTab(targetTab);
      }
    } else if (tabs.length === 0) {
      setActiveTab("");
    }
  }, [allSchemes, getAvailableTabTypes, schemeType, userSelectedTab, schemePlanType]);

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

    // Determine metal type details
    const metalType = getSchemeMetalType(item);
    const isSilver = metalType === "silver";
    const isDiamond = metalType === "diamond";
    const isPlatinum = metalType === "platinum";
    const isOldGold = metalType === "old_gold";
    
    let metalLabel = t("gold") || "Gold";
    let metalColor = "#FFD700";
    let metalBg = "rgba(255, 215, 0, 0.1)";

    if (isSilver) {
      metalLabel = t("silver") || "Silver";
      metalColor = "#94A3B8";
      metalBg = "rgba(148, 163, 184, 0.1)";
    } else if (isDiamond) {
      metalLabel = t("diamond") || "Diamond";
      metalColor = "#38BDF8";
      metalBg = "rgba(56, 189, 248, 0.1)";
    } else if (isPlatinum) {
      metalLabel = t("platinum") || "Platinum";
      metalColor = "#9CA3AF";
      metalBg = "rgba(156, 163, 175, 0.1)";
    } else if (isOldGold) {
      metalLabel = t("oldGold") || "Old Gold";
      metalColor = "#F59E0B";
      metalBg = "rgba(245, 158, 11, 0.1)";
    }

    // Determine coin type
    const coinSource = isSilver
      ? require("../../../../../assets/images/silver_coin_badge.png")
      : isDiamond
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
                {(getTranslatedText(item.SCHEMENAME, language) || "Unnamed Scheme").toUpperCase()}
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
                <View style={[styles.infoPill, { borderColor: metalColor, backgroundColor: metalBg }]}>
                  <Ionicons name="sparkles-outline" size={12} color={metalColor} />
                  <Text style={[styles.infoPillText, { color: metalColor }]}>
                    {metalLabel}
                  </Text>
                </View>
                <View style={styles.infoPill}>
                  <Ionicons name="calendar-outline" size={12} color="#FFD700" />
                  <Text style={styles.infoPillText}>
                    {item.DURATION_MONTHS || "11"} {t("schemes.months") || "Months"}
                  </Text>
                </View>
                <View style={[styles.infoPill, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <Ionicons name={isFlexi ? "options-outline" : "timer-outline"} size={12} color="#FFF" />
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
              onPress={() => showDetailModal(item)}
              style={styles.knowMoreButtonClean}
            >
              <Text style={styles.knowMoreButtonTextClean}>
                {t("knowMore") || "Know More"}
              </Text>
              <Ionicons name="arrow-forward-circle" size={24} color="#FFD700" />
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
      {!isNested && <StatusBar barStyle="dark-content" backgroundColor={theme.colors.quaternary || "#F2E6D2"} />}
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      {!isNested && (
        <SafeAreaView edges={["top"]} style={{ backgroundColor: theme.colors.quaternary || "#F2E6D2" }}>
          <View style={{ backgroundColor: theme.colors.quaternary || "#F2E6D2", paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.textDark || "#850111"} />
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textDark || "#850111", flex: 1 }}>
                {t("schemes.title") || "Schemes"}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      )}

      {/* Metal Category Filter Bar */}
      <View style={styles.metalTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metalTabsScroll}>
          <TouchableOpacity
            onPress={() => setSelectedMetal("all")}
            style={[styles.metalTabPill, selectedMetal === "all" && styles.metalTabPillAllActive]}
            activeOpacity={0.8}
          >
            <Ionicons name="grid-outline" size={14} color={selectedMetal === "all" ? "#FFF" : "#666"} />
            <Text style={[styles.metalTabText, selectedMetal === "all" && { color: "#FFF" }]}>
              {t("allSchemes") || "All Schemes"}
            </Text>
          </TouchableOpacity>

          {isVisible("showGoldScheme") && availableMetals.gold && (
            <TouchableOpacity
              onPress={() => setSelectedMetal("gold")}
              style={[styles.metalTabPill, selectedMetal === "gold" && styles.metalTabPillGoldActive]}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={14} color={selectedMetal === "gold" ? "#7A4D00" : "#B8860B"} />
              <Text style={[styles.metalTabText, selectedMetal === "gold" && styles.metalTabTextActive]}>
                {t("goldSchemes") || "Gold Schemes"}
              </Text>
            </TouchableOpacity>
          )}

          {isVisible("showSilverScheme") && availableMetals.silver && (
            <TouchableOpacity
              onPress={() => setSelectedMetal("silver")}
              style={[styles.metalTabPill, selectedMetal === "silver" && styles.metalTabPillSilverActive]}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles-outline" size={14} color={selectedMetal === "silver" ? "#333333" : "#666666"} />
              <Text style={[styles.metalTabText, selectedMetal === "silver" && styles.metalTabTextActive]}>
                {t("silverSchemes") || "Silver Schemes"}
              </Text>
            </TouchableOpacity>
          )}

          {isVisible("showDiamondScheme") && availableMetals.diamond && (
            <TouchableOpacity
              onPress={() => setSelectedMetal("diamond")}
              style={[styles.metalTabPill, selectedMetal === "diamond" && styles.metalTabPillDiamondActive]}
              activeOpacity={0.8}
            >
              <Ionicons name="diamond-outline" size={14} color={selectedMetal === "diamond" ? "#0F4C81" : "#1D70B8"} />
              <Text style={[styles.metalTabText, selectedMetal === "diamond" && styles.metalTabTextActive]}>
                {t("diamondSchemes") || "Diamond Schemes"}
              </Text>
            </TouchableOpacity>
          )}

          {isVisible("showPlatinumScheme") && availableMetals.platinum && (
            <TouchableOpacity
              onPress={() => setSelectedMetal("platinum")}
              style={[styles.metalTabPill, selectedMetal === "platinum" && styles.metalTabPillPlatinumActive]}
              activeOpacity={0.8}
            >
              <Ionicons name="ribbon-outline" size={14} color={selectedMetal === "platinum" ? "#1E293B" : "#475569"} />
              <Text style={[styles.metalTabText, selectedMetal === "platinum" && styles.metalTabTextActive]}>
                {t("platinumSchemes") || "Platinum Schemes"}
              </Text>
            </TouchableOpacity>
          )}

          {availableMetals.old_gold && (
            <TouchableOpacity
              onPress={() => setSelectedMetal("old_gold")}
              style={[styles.metalTabPill, selectedMetal === "old_gold" && styles.metalTabPillOldGoldActive]}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal-outline" size={14} color={selectedMetal === "old_gold" ? "#78350F" : "#B45309"} />
              <Text style={[styles.metalTabText, selectedMetal === "old_gold" && styles.metalTabTextActive]}>
                {t("oldGoldSchemes") || "Old Gold Schemes"}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Plan Type Selector (All vs Fixed vs Flexi) - Only shown if both are available for the selected metal and not All Schemes */}
      {selectedMetal !== "all" && metalHasFlexi && metalHasFixed && (
        <View style={styles.planTypeWrapper}>
          <TouchableOpacity
            onPress={() => {
              setSchemePlanType("all");
              setUserSelectedTab(true);
              setActiveTab(t("allOnly") || "All");
            }}
            style={[styles.planTypeButton, schemePlanType === "all" && styles.planTypeButtonActive]}
            activeOpacity={0.8}
          >
            <Ionicons name="grid-outline" size={15} color={schemePlanType === "all" ? "#FFF" : "#4A0007"} />
            <Text style={[styles.planTypeText, schemePlanType === "all" && styles.planTypeTextActive]}>
              {t("allOnly") || "All"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSchemePlanType("fixed");
              setUserSelectedTab(true);
              const firstFixed = availableTabs.find(t => t.toLowerCase() !== "flexi");
              if (firstFixed) {
                setActiveTab(firstFixed);
              }
            }}
            style={[styles.planTypeButton, schemePlanType === "fixed" && styles.planTypeButtonActive]}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={15} color={schemePlanType === "fixed" ? "#FFF" : "#4A0007"} />
            <Text style={[styles.planTypeText, schemePlanType === "fixed" && styles.planTypeTextActive]}>
              {t("Fixed") || "Fixed"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSchemePlanType("flexi");
              setUserSelectedTab(true);
              setActiveTab("Flexi");
            }}
            style={[styles.planTypeButton, schemePlanType === "flexi" && styles.planTypeButtonActive]}
            activeOpacity={0.8}
          >
            <Ionicons name="infinite-outline" size={15} color={schemePlanType === "flexi" ? "#FFF" : "#4A0007"} />
            <Text style={[styles.planTypeText, schemePlanType === "flexi" && styles.planTypeTextActive]}>
              {t("Flexi") || "Flexi"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sub-tabs for Fixed Schemes - Hidden per user request */}
      {false && selectedMetal !== "all" && schemePlanType === "fixed" && (
        <View 
          style={[
            styles.tabsWrapper,
            styles.iosTabsWrapper,
            selectedMetal === "all" && { opacity: 0.5 }
          ]}
          pointerEvents={selectedMetal === "all" ? "none" : "auto"}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.tabsScrollContainer,
              styles.iosTabsScrollContainer
            ]}
          >
            {availableTabs.filter((tab) => tab.toLowerCase() !== "flexi").map((tab) => renderTab(tab))}
          </ScrollView>
        </View>
      )}

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
            <Text style={styles.emptyStateTitle}>No Schemes Available</Text>
            <Text style={styles.emptyStateText}>
              Check back later for new savings opportunities
            </Text>
          </View>
        ) : schemesListData.length === 0 ? (
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
            data={schemesListData}
            renderItem={({ item, index }) => {
              if (selectedMetal === "all") {
                if (item.type === 'header') {
                  return (
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '800',
                      color: theme.colors.primary || '#850111',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      marginTop: 14,
                      marginBottom: 4,
                    }}>
                      {item.title}
                    </Text>
                  );
                }
                return renderSchemeItem({ item: item.scheme, index: item.index });
              }
              return renderSchemeItem({ item, index });
            }}
            keyExtractor={(item, index) => {
              if (selectedMetal === "all") {
                return item.id;
              }
              return item?.SCHEMEID?.toString() || `scheme-${index}`;
            }}
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
              selectedMetal === "all" ? null : (
                <Text style={styles.resultsCount}>
                  {schemesListData.length} {schemePlanType === "all" ? "" : `${activeTab} `}Scheme{schemesListData.length !== 1 ? 's' : ''} Available
                </Text>
              )
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

      {schemesListData.length > 0 && !loading && (
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
        animationType="slide"
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalOverlay}>
          {/* Close button stacked directly above the card content */}
          <View style={{ alignItems: 'center', paddingBottom: 10, zIndex: 1000 }}>
            <TouchableOpacity 
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: 'rgba(0,0,0,0.6)',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }} 
              onPress={closeDetailModal}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContentModern}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F3F5',
              backgroundColor: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}>
              <Text 
                style={{ 
                  fontSize: 15, 
                  fontWeight: '800', 
                  color: theme.colors.textDark || '#0b162c', 
                  flex: 1, 
                  marginRight: 12,
                  lineHeight: 19
                }} 
                numberOfLines={2} 
                adjustsFontSizeToFit 
                minimumFontScale={0.75}
              >
                {(getTranslatedText(selectedScheme?.SCHEMENAME, language) || "Scheme Details").toUpperCase()}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (selectedScheme) {
                    closeDetailModal();
                    if (selectedScheme.SCHEME_PLAN_TYPE_ID === 4) {
                      setSelectedBranches(selectedScheme.branch || []);
                      setBranchModalVisible(true);
                    } else {
                      handleJoinScheme(selectedScheme);
                    }
                  }
                }}
                style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  height: 36,
                }}
              >
                <LinearGradient
                  colors={['#FFD700', '#DAA520']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                    height: '100%',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#000' }}>
                    {selectedScheme?.SCHEME_PLAN_TYPE_ID === 4 
                      ? (language === "ta" ? "விசாரிக்க" : "Enquire")
                      : (t("joinNow") || "Join Now")
                    }
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
            >
              {selectedScheme && (
                <>
                  <View style={styles.modernHeader}>
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
                  
                  <View style={{ height: 100 }} />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Branch Details / Enquiry Modal */}
      <Modal
        visible={branchModalVisible}
        transparent
        animationType="slide"
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

function getStyles(theme: any) { return StyleSheet.create({
  planTypeWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    gap: 4,
    alignSelf: 'flex-start',
  },
  planTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'transparent',
    gap: 4,
  },
  planTypeButtonActive: {
    backgroundColor: '#850111',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  planTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  planTypeTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  metalTabsWrapper: {
    backgroundColor: theme.colors.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight || '#f0f0f0',
  },
  metalTabsScroll: {
    gap: 8,
    paddingRight: 16,
  },
  metalTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundSecondary || '#f8f9fa',
    borderWidth: 1,
    borderColor: theme.colors.borderLight || '#e9ecef',
    marginRight: 6,
    gap: 6,
  },
  metalTabPillGoldActive: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FFD700',
  },
  metalTabPillSilverActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#94A3B8',
  },
  metalTabPillDiamondActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#38BDF8',
  },
  metalTabPillPlatinumActive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
  },
  metalTabPillOldGoldActive: {
    backgroundColor: '#FFEBE0',
    borderColor: '#F59E0B',
  },
  metalTabPillAllActive: {
    backgroundColor: '#850111',
    borderColor: '#850111',
  },
  metalTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary || '#495057',
  },
  metalTabTextActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  stickyModalFooter: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight || '#F1F3F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  stickyTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textSecondary || '#1E293B',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 12 : 30,
    paddingBottom: 12,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 0,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  tabsWrapper: {
    backgroundColor: theme.colors.white,
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
    backgroundColor: theme.colors.white, // Or a very light gradient if preferred
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
    padding: 12,
    minHeight: 115,
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
    width: 42,
    height: 42,
    resizeMode: 'contain',
    opacity: 0.9,
  },
  cardActionRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  knowMoreButtonClean: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    backgroundColor: theme.colors.white,
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
    backgroundColor: theme.colors.white,
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
    justifyContent: 'flex-end',
  },
  modalContentModern: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    height: '85%',
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
    paddingTop: 16,
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
    backgroundColor: theme.colors.white,
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
    backgroundColor: theme.colors.background,
  },
  tableRefinedCell: {
    flex: 1,
    fontSize: 13,
    color: '#495057',
    fontWeight: '600',
  },
  stickyModalHeader: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    flex: 2.5,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#DAA520',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalJoinButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  modalJoinButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  branchCard: {
    backgroundColor: theme.colors.white,
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
}) }

var styles = getStyles(theme);;
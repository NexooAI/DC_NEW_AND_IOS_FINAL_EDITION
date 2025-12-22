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
  ScrollView,
  ImageBackground,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  textObj: { en: string; ta?: string } | string | undefined | null,
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
    if (textObj.hasOwnProperty("en") || textObj.hasOwnProperty("ta")) {
      const enText = textObj.en || "";
      const taText = textObj.ta || "";

      if (language === "ta") {
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

export default function SchemeList() {
  const { schemeId, schemeType, mode } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<string>("");
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [joiningScheme, setJoiningScheme] = useState<number | null>(null);
  const router = useRouter();
  const { language } = useGlobalStore();
  const { t } = useTranslation();

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
  const [descModalVisible, setDescModalVisible] = useState(false);
  const [descModalText, setDescModalText] = useState("");
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | null>(null);
  const [userSelectedTab, setUserSelectedTab] = useState<boolean>(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);

  const getAvailableTabTypes = useCallback(
    (schemesData: Scheme[]): string[] => {
      if (!schemesData || schemesData.length === 0) return [];

      const tabTypes = new Set<string>();

      schemesData.forEach((scheme) => {
        if (scheme.ACTIVE === "Y" && scheme.chits && scheme.chits.length > 0) {
          scheme.chits.forEach((chit) => {
            if (
              chit &&
              chit.PAYMENT_FREQUENCY &&
              chit.ACTIVE === "Y" &&
              isValidString(chit.PAYMENT_FREQUENCY)
            ) {
              const normalizedFreq = chit.PAYMENT_FREQUENCY.trim();
              tabTypes.add(normalizedFreq);

              if (normalizedFreq.toLowerCase().includes("flexi") ||
                normalizedFreq.toLowerCase().includes("flexible")) {
                tabTypes.add("Flexi");
              }
            }
          });
        }
      });

      const sortedTabs = Array.from(tabTypes).sort((a, b) => {
        const order: Record<string, number> = {
          Daily: 1,
          Weekly: 2,
          Monthly: 3,
          Flexi: 4,
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

      const chits = scheme.chits || [];
      const relevantChits = chits.filter(
        (chit) => {
          if (!chit || !chit.PAYMENT_FREQUENCY) return false;

          const chitFreq = chit.PAYMENT_FREQUENCY.toLowerCase().trim();
          const activeTabLower = activeTab.toLowerCase().trim();

          if (chitFreq === activeTabLower) return true;

          if (activeTabLower === "flexi") {
            return chitFreq.includes("flexi") || chitFreq.includes("flexible");
          }

          return false;
        }
      );

      if (relevantChits.length > 0) {
        if (!buckets[activeTab.toLowerCase()]) {
          buckets[activeTab.toLowerCase()] = [];
        }

        buckets[activeTab.toLowerCase()].push({
          ...scheme,
          chits: relevantChits,
          relevantChits: relevantChits.map((chit) => ({
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

  const toggleDescription = (schemeId: number | null | undefined) => {
    if (!schemeId) return;
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(schemeId)) {
        newSet.delete(schemeId);
      } else {
        newSet.add(schemeId);
      }
      return newSet;
    });
  };

  const getTabColor = (title: string) => {
    const colors: Record<string, string[]> = {
      Daily: ["#FF9A9E", "#FAD0C4"],
      Weekly: ["#A1C4FD", "#C2E9FB"],
      Monthly: ["#FFECD2", "#FCB69F"],
      Flexi: ["#D4FC79", "#96E6A1"],
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
      default:
        return "grid-outline";
    }
  };

  const renderTab = (title: string) => {
    const isActive = activeTab === title;
    const tabGradient = getTabColor(title);
    const textColor = getTextColorForBackground(title);

    return (
      <TouchableOpacity
        key={title}
        onLayout={(e) => {
          const { x, width } = e.nativeEvent.layout;
          setTabLayouts((prev) => ({ ...prev, [title]: { x, width } }));
        }}
        onPress={() => handleTabPress(title)}
        style={styles.tabWrapper}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.tabContainer,
            isActive && styles.activeTabContainer,
            isActive && {
              transform: [{ scale: tabScaleAnim }]
            },
            Platform.OS === 'ios' && styles.iosTabContainer,
            Platform.OS === 'ios' && isActive && styles.iosActiveTabContainer
          ]}
        >
          {isActive ? (
            Platform.OS === 'ios' ? (
              <View style={styles.iosActiveTabContent}>
                <Text style={styles.iosActiveTabText}>{title}</Text>
              </View>
            ) : (
              <LinearGradient
                colors={tabGradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabGradient}
              >
                <Ionicons
                  name={getTabIcon(title)}
                  size={22}
                  color={textColor}
                  style={styles.tabIcon}
                />
                <Text style={[styles.activeTabText, { color: textColor }]}>{title}</Text>
              </LinearGradient>
            )
          ) : (
            <View style={[
              styles.inactiveTabContainer,
              Platform.OS === 'ios' && styles.iosInactiveTabContainer
            ]}>
              {Platform.OS !== 'ios' && (
                <Ionicons
                  name={getTabIcon(title)}
                  size={18}
                  color="#666"
                  style={styles.tabIcon}
                />
              )}
              <Text style={[
                styles.tabText,
                { color: "#666" },
                Platform.OS === 'ios' && styles.iosTabText
              ]}>
                {title}
              </Text>
            </View>
          )}
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

  const renderTableMeta = (item: Scheme) => {
    const table: TableMeta | null = extractTableMetaFromItem(item);
    if (!table || !table.headers || !table.rows) return null;

    const headers = (table.headers as any)[language] || table.headers.en || [];

    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          {headers.map((h: string, idx: number) => (
            <Text key={idx} style={styles.tableHeaderText}>
              {getTranslatedText(h, language)}
            </Text>
          ))}
        </View>

        {table.rows.map((row, rIndex) => (
          <View key={rIndex} style={styles.tableRow}>
            {Object.values(row).map((cell, cIndex) => (
              <Text key={cIndex} style={styles.tableCell}>
                {getTranslatedText(cell, language)}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderSchemeItem = ({ item, index }: { item: Scheme; index: number }) => {
    if (!item) return null;

    const tabColor = getTabColor(activeTab);
    const gradientColors = getDarkerGradient(activeTab); // Use darker gradient for better contrast
    const textColor = getTextColorForBackground(activeTab);
    const isSelected = selectedSchemeId === item.SCHEMEID;
    const isExpanded = expandedDescriptions.has(item.SCHEMEID || 0);
    const cardAnimation = {
      opacity: cardAnimations,
      transform: [
        {
          translateY: cardAnimations.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        },
        {
          scale: cardAnimations.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }),
        },
      ],
    };

    const renderHeaderContent = (isIos: boolean) => (
      <View style={styles.cardHeaderContent}>
        <View style={styles.cardHeaderTop}>
          <View style={[
            styles.schemeBadge,
            isIos ? styles.iosSchemeBadge : { backgroundColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)' }
          ]}>
            <Text style={[
              styles.schemeBadgeText,
              isIos ? styles.iosSchemeBadgeText : { color: textColor }
            ]}>
              {getTranslatedText(item.SCHEMETYPE, language) || activeTab}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {isSelected && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.selectedBadgeText}>Selected</Text>
              </View>
            )}
            <TouchableOpacity
              accessibilityLabel={isExpanded ? "Collapse description" : "Expand description"}
              onPress={() => toggleDescription(item.SCHEMEID)}
              style={styles.expandIconButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isExpanded ? "chevron-up-circle" : "chevron-down-circle"}
                size={22}
                color={isIos ? '#000' : textColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.schemeInfo}>
          <Text style={[
            styles.schemeName,
            {
              color: isIos ? '#000' : textColor,
              textShadowColor: !isIos && textColor === '#ffffff' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'
            }
          ]}>
            {getTranslatedText(item.SCHEMENAME, language) || "Unnamed Scheme"}
          </Text>
          {item.SLOGAN && getTranslatedText(item.SLOGAN, language) && (
            <Text style={[
              styles.slogan,
              {
                color: isIos ? '#666' : (textColor === '#ffffff' ? 'rgba(255,255,255,0.9)' : 'rgba(26,26,26,0.85)'),
                textShadowColor: !isIos && textColor === '#ffffff' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'
              }
            ]}>
              "{getTranslatedText(item.SLOGAN, language)}"
            </Text>
          )}
        </View>

        <View style={styles.metaChipsContainer}>
          {(item.savingType || item.SCHEMETYPE) && (
            <View style={[styles.metaChip, {
              backgroundColor: isIos ? '#f2f2f7' : (textColor === '#ffffff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'),
              borderColor: isIos ? 'transparent' : (textColor === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)')
            }]}>
              <Ionicons
                name={item.savingType?.toLowerCase() === "weight" || item.SCHEMETYPE?.toLowerCase() === "weight" ? "scale-outline" : "cash-outline"}
                size={12}
                color={isIos ? '#666' : textColor}
              />
              <Text style={[styles.metaChipText, { color: isIos ? '#666' : textColor }]}>
                {item.savingType?.toLowerCase() === "weight" || item.SCHEMETYPE?.toLowerCase() === "weight"
                  ? ("Weight Based")
                  : ("Amount Based")}
              </Text>
            </View>
          )}
          {item.INS_TYPE && getTranslatedText(item.INS_TYPE, language) && (
            <View style={[styles.metaChip, {
              backgroundColor: isIos ? '#f2f2f7' : (textColor === '#ffffff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'),
              borderColor: isIos ? 'transparent' : (textColor === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)')
            }]}>
              <Ionicons name="cube-outline" size={12} color={isIos ? '#666' : textColor} />
              <Text style={[styles.metaChipText, { color: isIos ? '#666' : textColor }]}>
                {getTranslatedText(item.INS_TYPE, language)}
              </Text>
            </View>
          )}
          {item.DURATION_MONTHS && !isNaN(item.DURATION_MONTHS) ? (
            <View style={[styles.metaChip, {
              backgroundColor: isIos ? '#f2f2f7' : (textColor === '#ffffff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'),
              borderColor: isIos ? 'transparent' : (textColor === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)')
            }]}>
              <Ionicons name="calendar-outline" size={12} color={isIos ? '#666' : textColor} />
              <Text style={[styles.metaChipText, { color: isIos ? '#666' : textColor }]}>
                {item.DURATION_MONTHS} {t("schemes.months") || "months"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );

    return (
      <Animated.View
        style={[
          styles.schemeCard,
          isSelected && styles.selectedSchemeCard,
          cardAnimation,
          { marginTop: index === 0 ? 10 : 0 },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <View style={styles.iosCardHeader}>
            {renderHeaderContent(true)}
          </View>
        ) : (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardHeaderGradient}
          >
            {renderHeaderContent(false)}
          </LinearGradient>
        )}

        <View style={styles.cardContent}>
          <View style={styles.descriptionContainer}>
            <Text
              style={[styles.descriptionText, { color: '#2c2c2c' }]}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {getTranslatedText(item.DESCRIPTION as any, language) || "No description available"}
            </Text>
            {getTranslatedText(item.DESCRIPTION as any, language)?.length > 100 && (
              <TouchableOpacity
                onPress={() => toggleDescription(item.SCHEMEID)}
                style={styles.readMoreButton}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[hexToRgba(theme.colors.primary, 0.1), hexToRgba(theme.colors.primary, 0.1)]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.readMoreContainer, { borderColor: hexToRgba(theme.colors.primary, 0.3) }]}
                >
                  <Text style={[styles.readMoreText, { color: theme.colors.primary }]}>
                    {isExpanded ? "Show Less" : "Read More"}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={theme.colors.primary}
                  />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {item.BENEFITS && item.BENEFITS.length > 0 && (
            <View style={[styles.benefitsContainer, {
              backgroundColor: textColor === '#ffffff' ? 'rgba(248, 249, 255, 0.8)' : 'rgba(248, 252, 240, 0.8)',
              borderColor: theme.colors.primary + '40'
            }]}>
              <Text style={[styles.benefitsTitle, { color: '#1a1a1a' }]}>Benefits</Text>
              {item.BENEFITS.slice(0, 3).map((benefit, idx) => (
                <View key={idx} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                  <Text style={[styles.benefitText, { color: '#2c2c2c' }]}>
                    {getTranslatedText(benefit, language)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Table Meta (if present) */}
          {item.table_meta && item.table_meta.headers && item.table_meta.rows && item.table_meta.rows !== null && item.table_meta.rows !== undefined && item.table_meta.rows.length > 0 && renderTableMeta(item)}

          <TouchableOpacity
            onPress={() => handleJoinScheme(item)}
            disabled={joiningScheme === item.SCHEMEID}
            style={styles.joinButtonContainer}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD700', '#FFD700'] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.joinButton,
                Platform.OS === 'ios' && styles.iosJoinButton,
                joiningScheme === item.SCHEMEID && styles.joinButtonDisabled,
              ]}
            >
              {joiningScheme === item.SCHEMEID ? (
                <ActivityIndicator size="small" color={textColor === '#ffffff' ? '#fff' : '#1a1a1a'} />
              ) : (
                <>
                  <Text style={[styles.joinButtonText, { color: textColor === '#ffffff' ? '#fff' : '#1a1a1a' }]}>
                    {t("schemes.joinNow") || "Join Now"}
                  </Text>
                  <Ionicons name="arrow-forward-circle" size={20} color={textColor === '#ffffff' ? '#fff' : '#1a1a1a'} />
                </>
              )}
            </LinearGradient>
            <Text style={[styles.joinButtonSubtext, { color: '#666' }]}>
              Start your savings journey today
            </Text>
          </TouchableOpacity>
        </View>
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
      {/* <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Savings Schemes</Text>
        <Text style={styles.headerSubtitle}>
          Choose the perfect plan for your financial goals
        </Text>
      </LinearGradient> */}

      <View style={[
        styles.tabsWrapper,
        Platform.OS === 'ios' && styles.iosTabsWrapper
      ]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabsScrollContainer,
            Platform.OS === 'ios' && styles.iosTabsScrollContainer
          ]}
        >
          {availableTabs.map((tab) => renderTab(tab))}
        </ScrollView>

        {Platform.OS !== 'ios' && activeTab && tabLayouts[activeTab] && (
          <Animated.View
            style={[
              styles.activeTabIndicator,
              {
                width: tabLayouts[activeTab]?.width || 0,
                transform: [{ translateX: underlineAnim }],
                backgroundColor: getTabColor(activeTab)[0],
                shadowColor: getTabColor(activeTab)[0],
              },
            ]}
          />
        )}
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
            <Text style={styles.emptyStateTitle}>No Schemes Available</Text>
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

      {/* {availableTabs.length > 1 && (
        <View style={styles.swipeHint}>
          <Ionicons name="swap-horizontal" size={16} color="#fff" />
          <Text style={styles.swipeHintText}>
            Swipe to explore more categories
          </Text>
        </View>
      )} */}

      <Modal
        visible={descModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDescModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("schemes.description") || "Description"}
              </Text>
              <TouchableOpacity
                onPress={() => setDescModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#667eea" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.fullDescriptionText}>{descModalText}</Text>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
  tabGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  activeTabContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: '800',
    // Color is set dynamically based on background
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
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
    backgroundColor: '#fff',
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
    color: '#000',
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
  schemeCard: {
    backgroundColor: '#fff',
    borderColor: COLORS.border.primary,
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  selectedSchemeCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: "#4CAF50",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  cardHeaderGradient: {
    padding: 20,
    borderWidth: 1,
  },
  cardHeaderContent: {
    flexDirection: 'column',
    gap: 12,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  schemeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  schemeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  selectedBadge: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandIconButton: {
    padding: 4,
  },
  schemeInfo: {
    gap: 4,
  },
  schemeName: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
    // textShadowColor is set dynamically based on text color
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  slogan: {
    fontSize: 14,
    fontStyle: 'italic',
    // textShadowColor is set dynamically based on text color
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metaChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 10,
    gap: 10,

  },
  descriptionContainer: {
    gap: 8,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#555',
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  benefitsContainer: {
    backgroundColor: '#f8f9ff',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e6e9ff',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  joinButtonContainer: {
    gap: 8,
  },
  joinButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  iosJoinButton: {
    borderRadius: 28, // Pill shape for iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0,
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  joinButtonSubtext: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
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
    backgroundColor: '#667eea',
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
    borderBottomColor: '#f5f5f5',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#555',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: '70%',
    backgroundColor: '#fafafa',
  },
  fullDescriptionText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
});
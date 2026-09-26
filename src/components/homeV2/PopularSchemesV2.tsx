import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import * as Haptics from "expo-haptics";
import api from "@/services/api";
import { useAppTheme } from "@/store/global.store";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { useTranslation } from "@/hooks/useTranslation";

export interface SchemeItem {
  id: string | number;
  title: string;
  subtitle: string;
  image: any;
  type?: string;
  metal: "gold" | "silver" | "diamond" | "platinum" | "old_gold";
  mode?: string;
  badgeText: string;
  badgeIcon: keyof typeof Ionicons.glyphMap;
  badgeColor: string;
  badgeBg: string;
  gradientColors: [string, string, string];
  borderColor: string;
  glowColor: string;
  buttonGradient: [string, string];
  buttonTextColor: string;
}

export interface PopularSchemesV2Props {
  schemes?: any[];
  onSchemePress?: (scheme: SchemeItem) => void;
  onViewAllPress?: () => void;
}

const detectMetalType = (scheme: any): "gold" | "silver" | "diamond" | "platinum" | "old_gold" => {
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

  const nameText = extractAllStrings(scheme.SCHEMENAME || scheme.title || scheme.name);
  const sloganText = extractAllStrings(scheme.SLOGAN || scheme.subtitle || scheme.description);
  const schemeType = (scheme.SCHEMETYPE || "").toLowerCase();
  const insType = (scheme.INS_TYPE || "").toLowerCase();
  const savingType = (scheme.savingType || "").toLowerCase();
  const metalField = (scheme.metal || scheme.METAL || scheme.metal_type || scheme.METATYPE || "").toLowerCase();

  const primaryText = `${nameText} ${sloganText} ${metalField} ${schemeType} ${insType} ${savingType}`;

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

  if (
    primaryText.includes("silver") ||
    primaryText.includes("வெள்ளி") ||
    primaryText.includes("వెండి") ||
    primaryText.includes("चांदी")
  ) {
    return "silver";
  }

  if (
    primaryText.includes("diamond") ||
    primaryText.includes("வைரம்") ||
    primaryText.includes("వజ్రం") ||
    primaryText.includes("हीरा") ||
    primaryText.includes("ഡയമണ്ട്")
  ) {
    return "diamond";
  }

  if (
    primaryText.includes("platinum") ||
    primaryText.includes("பிளாட்டினம்") ||
    primaryText.includes("ప్లాటినం") ||
    primaryText.includes("प्लैटिनम") ||
    primaryText.includes("പ്ലാറ്റിനം")
  ) {
    return "platinum";
  }

  return "gold";
};

export const PopularSchemesV2: React.FC<PopularSchemesV2Props> = ({
  schemes,
  onSchemePress,
  onViewAllPress,
}) => {
  const router = useRouter();
  const theme = useAppTheme();
  const { isVisible } = useAppVisibility();
  const { t } = useTranslation();
  const [fetchedSchemes, setFetchedSchemes] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  useEffect(() => {
    if (!schemes || schemes.length === 0) {
      let isMounted = true;
      try {
        const req = api?.get ? api.get("/schemes/active", { skipLoading: true } as any) : null;
        if (req && typeof req.then === "function") {
          req
            .then((res: any) => {
              if (!isMounted) return;
              if (res?.data && Array.isArray(res.data.data)) {
                setFetchedSchemes(res.data.data);
              } else if (res?.data && Array.isArray(res.data)) {
                setFetchedSchemes(res.data);
              }
            })
            .catch(() => {
              try {
                const req2 = api?.get ? api.get("/schemes", { skipLoading: true } as any) : null;
                if (req2 && typeof req2.then === "function") {
                  req2
                    .then((res2: any) => {
                      if (!isMounted) return;
                      if (res2?.data && Array.isArray(res2.data.data)) {
                        setFetchedSchemes(res2.data.data);
                      } else if (res2?.data && Array.isArray(res2.data)) {
                        setFetchedSchemes(res2.data);
                      }
                    })
                    .catch(() => {});
                }
              } catch {}
            });
        }
      } catch {}
      return () => {
        isMounted = false;
      };
    }
  }, [schemes]);

  const activeSchemesSource = schemes && schemes.length > 0 ? schemes : fetchedSchemes;

  // Determine available categories based on active schemes source
  const availableCategories = useMemo(() => {
    const categories: Record<string, boolean> = {
      gold: false,
      silver: false,
      diamond: false,
      platinum: false,
      old_gold: false,
    };

    if (!activeSchemesSource || activeSchemesSource.length === 0) {
      // Defaults when schemes haven't loaded yet
      categories.gold = true;
      categories.silver = true;
      categories.diamond = true;
      categories.old_gold = true;
      return categories;
    }

    activeSchemesSource.forEach((s) => {
      if (s.ACTIVE && s.ACTIVE !== "Y") return;
      const metal = detectMetalType(s);
      if (categories[metal] !== undefined) {
        categories[metal] = true;
      }
    });

    if (!categories.gold && !categories.silver && !categories.diamond && !categories.platinum && !categories.old_gold) {
      categories.gold = true;
    }

    return categories;
  }, [activeSchemesSource]);

  // Master definition of curated luxury cards
  const allItems: SchemeItem[] = useMemo(() => {
    const list: SchemeItem[] = [];

    // 1. Gold Savings (Single unified card)
    if (availableCategories.gold && isVisible("showGoldScheme" as any)) {
      list.push({
        id: "gold_savings",
        title: "Gold Savings",
        subtitle: "Save gold for your golden future",
        image: require("../../../assets/images/luxury_gold_coin.png"),
        type: "gold",
        metal: "gold",
        badgeText: "22K GOLD",
        badgeIcon: "sparkles",
        badgeColor: "#9A6B00",
        badgeBg: "rgba(212, 175, 55, 0.16)",
        gradientColors: ["#FFFDF6", "#FFF8E7", "#FEF0CE"],
        borderColor: "rgba(212, 175, 55, 0.38)",
        glowColor: "rgba(255, 215, 0, 0.22)",
        buttonGradient: ["#B8860B", "#8C6203"],
        buttonTextColor: "#FFFFFF",
      });
    }

    // 2. Silver Savings
    if (availableCategories.silver && isVisible("showSilverScheme" as any)) {
      list.push({
        id: "silver_savings",
        title: "Silver Savings",
        subtitle: "Small savings Big security",
        image: require("../../../assets/images/silver_coin_badge.png"),
        type: "silver",
        metal: "silver",
        badgeText: "999 SILVER",
        badgeIcon: "disc-outline",
        badgeColor: "#334155",
        badgeBg: "rgba(148, 163, 184, 0.2)",
        gradientColors: ["#FBFDFF", "#F1F5F9", "#E2E8F0"],
        borderColor: "rgba(148, 163, 184, 0.45)",
        glowColor: "rgba(148, 163, 184, 0.25)",
        buttonGradient: ["#475569", "#334155"],
        buttonTextColor: "#FFFFFF",
      });
    }

    // 3. Diamond Savings
    if (availableCategories.diamond && isVisible("showDiamondScheme" as any)) {
      list.push({
        id: "diamond_savings",
        title: "Diamond Savings",
        subtitle: "Sparkle with your savings",
        image: require("../../../assets/images/diamond_coin_badge.png"),
        type: "diamond",
        metal: "diamond",
        badgeText: "DIAMOND",
        badgeIcon: "diamond-outline",
        badgeColor: "#0369A1",
        badgeBg: "rgba(56, 189, 248, 0.18)",
        gradientColors: ["#F8FBFF", "#EEF6FF", "#E0F2FE"],
        borderColor: "rgba(56, 189, 248, 0.45)",
        glowColor: "rgba(56, 189, 248, 0.22)",
        buttonGradient: ["#0284C7", "#0369A1"],
        buttonTextColor: "#FFFFFF",
      });
    }

    // 4. Platinum Savings
    if (availableCategories.platinum && isVisible("showPlatinumScheme" as any)) {
      list.push({
        id: "platinum_savings",
        title: "Platinum Savings",
        subtitle: "Precious metals for life",
        image: require("../../../assets/images/luxury_gold_coin.png"),
        type: "platinum",
        metal: "platinum",
        badgeText: "PLATINUM",
        badgeIcon: "shield-checkmark-outline",
        badgeColor: "#374151",
        badgeBg: "rgba(156, 163, 175, 0.2)",
        gradientColors: ["#F9FAFB", "#F3F4F6", "#E5E7EB"],
        borderColor: "rgba(156, 163, 175, 0.45)",
        glowColor: "rgba(156, 163, 175, 0.22)",
        buttonGradient: ["#374151", "#1F2937"],
        buttonTextColor: "#FFFFFF",
      });
    }

    // 5. Old Gold Deposit
    if (availableCategories.old_gold && isVisible("showOldGoldScheme" as any)) {
      list.push({
        id: "old_gold_savings",
        title: "Old Gold Deposit",
        subtitle: "Convert old gold into savings",
        image: require("../../../assets/images/gold.png"),
        type: "old_gold",
        metal: "old_gold",
        badgeText: "OLD GOLD",
        badgeIcon: "repeat-outline",
        badgeColor: "#B45309",
        badgeBg: "rgba(245, 158, 11, 0.2)",
        gradientColors: ["#FFFBF5", "#FEF3C7", "#FDE68A"],
        borderColor: "rgba(245, 158, 11, 0.45)",
        glowColor: "rgba(245, 158, 11, 0.25)",
        buttonGradient: ["#D97706", "#B45309"],
        buttonTextColor: "#FFFFFF",
      });
    }

    // Fallback if visibility filtered out everything
    if (list.length === 0) {
      list.push({
        id: "gold_savings",
        title: "Gold Savings",
        subtitle: "Save gold for your golden future",
        image: require("../../../assets/images/luxury_gold_coin.png"),
        type: "gold",
        metal: "gold",
        badgeText: "22K GOLD",
        badgeIcon: "sparkles",
        badgeColor: "#9A6B00",
        badgeBg: "rgba(212, 175, 55, 0.16)",
        gradientColors: ["#FFFDF6", "#FFF8E7", "#FEF0CE"],
        borderColor: "rgba(212, 175, 55, 0.38)",
        glowColor: "rgba(255, 215, 0, 0.22)",
        buttonGradient: ["#B8860B", "#8C6203"],
        buttonTextColor: "#FFFFFF",
      });
    }

    return list;
  }, [availableCategories, isVisible]);

  // Metal Filter Tabs Row
  const filterTabs = useMemo(() => {
    const tabs: Array<{ key: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
      { key: "all", label: t("allSchemes") || "All Schemes", icon: "grid-outline" },
    ];

    if (availableCategories.gold && isVisible("showGoldScheme" as any)) {
      tabs.push({ key: "gold", label: t("gold") || "Gold", icon: "sparkles" });
    }
    if (availableCategories.silver && isVisible("showSilverScheme" as any)) {
      tabs.push({ key: "silver", label: t("silver") || "Silver", icon: "disc-outline" });
    }
    if (availableCategories.diamond && isVisible("showDiamondScheme" as any)) {
      tabs.push({ key: "diamond", label: t("diamond") || "Diamond", icon: "diamond-outline" });
    }
    if (availableCategories.platinum && isVisible("showPlatinumScheme" as any)) {
      tabs.push({ key: "platinum", label: t("platinum") || "Platinum", icon: "shield-checkmark-outline" });
    }
    if (availableCategories.old_gold && isVisible("showOldGoldScheme" as any)) {
      tabs.push({ key: "old_gold", label: t("oldGold") || "Old Gold", icon: "repeat-outline" });
    }

    return tabs;
  }, [availableCategories, isVisible, t]);

  // Filtered Cards
  const displayedItems = useMemo(() => {
    if (selectedFilter === "all") {
      return allItems;
    }
    const filtered = allItems.filter((item) => item.metal === selectedFilter);
    return filtered.length > 0 ? filtered : allItems;
  }, [allItems, selectedFilter]);

  const safeHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (process.env.NODE_ENV !== "test") {
      try {
        Haptics?.impactAsync?.(style)?.catch?.(() => {});
      } catch {}
    }
  };

  const handleFilterPress = (key: string) => {
    safeHaptic(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(key);
  };

  const handleSchemePress = (item: SchemeItem) => {
    safeHaptic(Haptics.ImpactFeedbackStyle.Medium);

    if (onSchemePress) {
      onSchemePress(item);
    } else {
      router.push({
        pathname: "/(app)/(tabs)/home/schemes",
        params: {
          type: item.metal || item.type || "gold",
          metal: item.metal || item.type || "gold",
          category: item.metal || item.type || "gold",
          ...(item.mode ? { mode: item.mode } : {}),
        },
      });
    }
  };

  const handleViewAll = () => {
    safeHaptic(Haptics.ImpactFeedbackStyle.Medium);

    if (onViewAllPress) {
      onViewAllPress();
    } else {
      router.push("/(app)/(tabs)/home/schemes");
    }
  };

  if (!allItems || allItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Popular Schemes</Text>
        </View>
        <TouchableOpacity
          onPress={handleViewAll}
          activeOpacity={0.7}
          style={styles.viewAllBtn}
        >
          <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
            {t("viewAll") || "View All"}
          </Text>
          <Ionicons name="arrow-forward" size={13} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Metal Category Filter Tabs */}
      {filterTabs.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsScroll}
        >
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleFilterPress(tab.key)}
                activeOpacity={0.75}
                style={[
                  styles.filterTabPill,
                  isActive && styles.filterTabPillActive,
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={13}
                  color={isActive ? "#FFFFFF" : "#64748B"}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    isActive && styles.filterTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Upgraded Unique Scheme Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        {displayedItems.map((item) => (
          <TouchableOpacity
            key={item.id.toString()}
            style={styles.cardWrapper}
            onPress={() => handleSchemePress(item)}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={item.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, { borderColor: item.borderColor }]}
            >
              {/* Top Row: Metal Badge Pill */}
              <View style={styles.topBadgeRow}>
                <View style={[styles.badgePill, { backgroundColor: item.badgeBg }]}>
                  <Ionicons name={item.badgeIcon} size={11} color={item.badgeColor} />
                  <Text style={[styles.badgeText, { color: item.badgeColor }]}>
                    {item.badgeText}
                  </Text>
                </View>
              </View>

              {/* Center 3D Image Showcase with Ambient Aura */}
              <View style={styles.imageShowcase}>
                <View style={[styles.ambientGlow, { backgroundColor: item.glowColor }]} />
                <Image
                  source={item.image}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>

              {/* Title & Subtitle */}
              <View style={styles.contentSection}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </View>

              {/* Tactile Action Button */}
              <LinearGradient
                colors={item.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButton}
              >
                <Text style={[styles.actionButtonText, { color: item.buttonTextColor }]}>
                  {t("knowMore") || "Know More"}
                </Text>
                <View style={styles.actionButtonIconCircle}>
                  <Ionicons name="arrow-forward" size={10} color="#0F172A" />
                </View>
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: moderateScale(10),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(10),
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewAllText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#003C28",
  },
  filterTabsScroll: {
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  filterTabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterTabPillActive: {
    backgroundColor: "#850111",
    borderColor: "#850111",
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#475569",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cardsRow: {
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(12),
  },
  cardWrapper: {
    width: moderateScale(152),
  },
  card: {
    borderRadius: moderateScale(20),
    padding: moderateScale(12),
    borderWidth: 1.2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    minHeight: moderateScale(218),
    justifyContent: "space-between",
  },
  topBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
  },
  badgeText: {
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  imageShowcase: {
    height: moderateScale(78),
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginVertical: moderateScale(4),
  },
  ambientGlow: {
    position: "absolute",
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    opacity: 0.8,
  },
  cardImage: {
    width: moderateScale(60),
    height: moderateScale(60),
  },
  contentSection: {
    marginBottom: moderateScale(8),
  },
  cardTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: moderateScale(2),
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: moderateScale(10.5),
    fontWeight: "500",
    color: "#64748B",
    lineHeight: moderateScale(14),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(12),
    marginTop: "auto",
  },
  actionButtonText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  actionButtonIconCircle: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PopularSchemesV2;

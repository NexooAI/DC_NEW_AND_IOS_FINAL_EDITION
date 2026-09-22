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
import api from "@/services/api";

interface SchemeItem {
  id: string | number;
  title: string;
  subtitle: string;
  image: any;
  type?: string;
  metal?: string;
  mode?: string;
}

interface PopularSchemesV2Props {
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
  const [fetchedSchemes, setFetchedSchemes] = useState<any[]>([]);

  useEffect(() => {
    if (!schemes || schemes.length === 0) {
      let isMounted = true;
      api
        .get("/schemes/active", { skipLoading: true } as any)
        .then((res: any) => {
          if (!isMounted) return;
          if (res.data && Array.isArray(res.data.data)) {
            setFetchedSchemes(res.data.data);
          } else if (res.data && Array.isArray(res.data)) {
            setFetchedSchemes(res.data);
          }
        })
        .catch(() => {
          api
            .get("/schemes", { skipLoading: true } as any)
            .then((res2: any) => {
              if (!isMounted) return;
              if (res2.data && Array.isArray(res2.data.data)) {
                setFetchedSchemes(res2.data.data);
              } else if (res2.data && Array.isArray(res2.data)) {
                setFetchedSchemes(res2.data);
              }
            })
            .catch(() => {});
        });
      return () => {
        isMounted = false;
      };
    }
  }, [schemes]);

  const activeSchemesSource = schemes && schemes.length > 0 ? schemes : fetchedSchemes;

  const items = useMemo(() => {
    const defaultFullCards: SchemeItem[] = [
      {
        id: "monthly_chit",
        title: "Monthly Gold Chit",
        subtitle: "Fixed monthly installment scheme",
        image: require("../../../assets/images/luxury_gold_coin.png"),
        type: "gold",
        metal: "gold",
        mode: "fixed",
      },
      {
        id: "gold_savings",
        title: "Gold Savings",
        subtitle: "Save Gold for future",
        image: require("../../../assets/images/gold.png"),
        type: "gold",
        metal: "gold",
      },
      {
        id: "silver_savings",
        title: "Silver Savings",
        subtitle: "Small savings Big security",
        image: require("../../../assets/images/silver.png"),
        type: "silver",
        metal: "silver",
      },
      {
        id: "diamond_savings",
        title: "Diamond Savings",
        subtitle: "Sparkle with your savings",
        image: require("../../../assets/images/diamond_coin_badge.png"),
        type: "diamond",
        metal: "diamond",
      },
      {
        id: "old_gold_savings",
        title: "Old Gold Deposit",
        subtitle: "Convert old gold into savings",
        image: require("../../../assets/images/gold.png"),
        type: "old_gold",
        metal: "old_gold",
      },
    ];

    if (!activeSchemesSource || activeSchemesSource.length === 0) {
      return defaultFullCards;
    }

    const availableCategories: Record<string, boolean> = {
      gold_fixed: false,
      gold_flexi: false,
      silver: false,
      diamond: false,
      platinum: false,
      old_gold: false,
    };

    activeSchemesSource.forEach((s) => {
      if (s.ACTIVE && s.ACTIVE !== "Y") return;
      const metal = detectMetalType(s);
      const st = (s.SCHEMETYPE || s.INS_TYPE || "").toLowerCase();
      const sn = (
        typeof s.SCHEMENAME === "object"
          ? s.SCHEMENAME.en || s.SCHEMENAME.ta || ""
          : s.SCHEMENAME || ""
      ).toLowerCase();
      const isFlexi =
        st.includes("flexi") || st.includes("flexible") || sn.includes("flexi");

      if (metal === "gold") {
        if (isFlexi) {
          availableCategories.gold_flexi = true;
        } else {
          availableCategories.gold_fixed = true;
        }
      } else if (metal === "silver") {
        availableCategories.silver = true;
      } else if (metal === "diamond") {
        availableCategories.diamond = true;
      } else if (metal === "platinum") {
        availableCategories.platinum = true;
      } else if (metal === "old_gold") {
        availableCategories.old_gold = true;
      }
    });

    const generatedCards: SchemeItem[] = [];

    if (availableCategories.gold_fixed) {
      generatedCards.push({
        id: "monthly_chit",
        title: "Monthly Gold Chit",
        subtitle: "Fixed monthly installment scheme",
        image: require("../../../assets/images/luxury_gold_coin.png"),
        type: "gold",
        metal: "gold",
        mode: "fixed",
      });
    }

    if (availableCategories.gold_flexi) {
      generatedCards.push({
        id: "gold_flexi",
        title: "Gold Flexi Savings",
        subtitle: "Flexible gold accumulation scheme",
        image: require("../../../assets/images/gold.png"),
        type: "gold",
        metal: "gold",
        mode: "flexi",
      });
    }

    if (availableCategories.silver) {
      generatedCards.push({
        id: "silver_savings",
        title: "Silver Savings",
        subtitle: "Small savings Big security",
        image: require("../../../assets/images/silver.png"),
        type: "silver",
        metal: "silver",
      });
    }

    if (availableCategories.diamond) {
      generatedCards.push({
        id: "diamond_savings",
        title: "Diamond Savings",
        subtitle: "Sparkle with your savings",
        image: require("../../../assets/images/diamond_coin_badge.png"),
        type: "diamond",
        metal: "diamond",
      });
    }

    if (availableCategories.platinum) {
      generatedCards.push({
        id: "platinum_savings",
        title: "Platinum Savings",
        subtitle: "Precious metals for life",
        image: require("../../../assets/images/luxury_gold_coin.png"),
        type: "platinum",
        metal: "platinum",
      });
    }

    if (availableCategories.old_gold) {
      generatedCards.push({
        id: "old_gold_savings",
        title: "Old Gold Deposit",
        subtitle: "Convert old gold into savings",
        image: require("../../../assets/images/gold.png"),
        type: "old_gold",
        metal: "old_gold",
      });
    }

    return generatedCards.length > 0 ? generatedCards : defaultFullCards;
  }, [activeSchemesSource]);

  const handleSchemePress = (item: SchemeItem) => {
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
    if (onViewAllPress) {
      onViewAllPress();
    } else {
      router.push("/(app)/(tabs)/home/schemes");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Popular Schemes</Text>
        <TouchableOpacity
          onPress={handleViewAll}
          activeOpacity={0.7}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={13} color="#003C28" />
        </TouchableOpacity>
      </View>

      {/* 3 Scheme Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id.toString()}
            style={styles.cardWrapper}
            onPress={() => handleSchemePress(item)}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#FFFDF8", "#FAF4E8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Top 3D Icon */}
              <View style={styles.iconContainer}>
                <Image
                  source={item.image}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>

              {/* Know More Action */}
              <View style={styles.knowMoreRow}>
                <Text style={styles.knowMoreText}>Know More</Text>
                <Ionicons name="arrow-forward" size={12} color="#A16207" />
              </View>
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
  cardsRow: {
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(10),
  },
  cardWrapper: {
    width: moderateScale(120),
  },
  card: {
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.22)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    minHeight: moderateScale(152),
    justifyContent: "space-between",
  },
  iconContainer: {
    height: moderateScale(48),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(6),
  },
  cardImage: {
    width: moderateScale(44),
    height: moderateScale(44),
  },
  cardTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: moderateScale(2),
  },
  cardSubtitle: {
    fontSize: moderateScale(10),
    fontWeight: "500",
    color: "#64748B",
    lineHeight: moderateScale(14),
    marginBottom: moderateScale(6),
  },
  knowMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: "auto",
  },
  knowMoreText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#A16207", // Warm golden brown
  },
});

export default PopularSchemesV2;

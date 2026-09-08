import React from "react";
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

interface SchemeItem {
  id: string | number;
  title: string;
  subtitle: string;
  image: any;
  type?: string;
}

interface PopularSchemesV2Props {
  schemes?: any[];
  onSchemePress?: (scheme: SchemeItem) => void;
  onViewAllPress?: () => void;
}

export const PopularSchemesV2: React.FC<PopularSchemesV2Props> = ({
  schemes,
  onSchemePress,
  onViewAllPress,
}) => {
  const router = useRouter();

  const defaultSchemes: SchemeItem[] = [
    {
      id: "monthly_chit",
      title: "Monthly Chit",
      subtitle: "Build your wealth regularly",
      image: require("../../../assets/images/luxury_gold_coin.png"),
      type: "chit",
    },
    {
      id: "gold_savings",
      title: "Gold Savings",
      subtitle: "Save Gold for future",
      image: require("../../../assets/images/gold.png"),
      type: "gold",
    },
    {
      id: "silver_savings",
      title: "Silver Savings",
      subtitle: "Small savings Big security",
      image: require("../../../assets/images/silver.png"),
      type: "silver",
    },
  ];

  const items: SchemeItem[] =
    schemes && schemes.length > 0
      ? schemes.slice(0, 5).map((s, i) => ({
          id: s.SCHEMEID || s.id || `s_${i}`,
          title: typeof s.SCHEMENAME === "object" ? s.SCHEMENAME.en : s.SCHEMENAME || s.name || defaultSchemes[i % 3].title,
          subtitle: typeof s.DESCRIPTION === "object" ? s.DESCRIPTION.en : s.DESCRIPTION || s.subtitle || defaultSchemes[i % 3].subtitle,
          image: defaultSchemes[i % 3].image,
          type: s.TYPE || defaultSchemes[i % 3].type,
        }))
      : defaultSchemes;

  const handleSchemePress = (item: SchemeItem) => {
    if (onSchemePress) {
      onSchemePress(item);
    } else {
      router.push({
        pathname: "/(app)/(tabs)/home/schemes",
        params: { type: item.type || "gold" },
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

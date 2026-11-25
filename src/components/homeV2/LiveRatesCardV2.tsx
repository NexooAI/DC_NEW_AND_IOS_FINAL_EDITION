import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { formatChangeValue, RateChangeInfo } from "@/utils/rateComparison";
import { useTranslation } from "@/hooks/useTranslation";

const GOLD_ICON = require("../../../assets/images/gold.png");
const SILVER_ICON = require("../../../assets/images/silver.png");

export interface LiveRatesCardV2Props {
  goldRate?: string | number;
  silverRate?: string | number;
  goldChange?: string | number | RateChangeInfo | null;
  silverChange?: string | number | RateChangeInfo | null;
  goldPurity?: string;
  updatedAt?: string;
  onGoldPress?: () => void;
  onSilverPress?: () => void;
  onPress?: () => void;
}

export const LiveRatesCardV2: React.FC<LiveRatesCardV2Props> = ({
  goldRate = "6,485",
  silverRate = "78.50",
  goldChange = null,
  silverChange = null,
  goldPurity = "22K",
  updatedAt,
  onGoldPress,
  onSilverPress,
  onPress,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  // Resolve dynamic change metadata (color, icon, direction, formatted text)
  // No fake defaults: returns null if there is no previous comparison data
  const goldChangeInfo = useMemo(() => {
    if (!goldChange) return null;
    if (typeof goldChange === "object" && "direction" in goldChange) {
      return goldChange as RateChangeInfo;
    }
    return formatChangeValue(goldChange);
  }, [goldChange]);

  const silverChangeInfo = useMemo(() => {
    if (!silverChange) return null;
    if (typeof silverChange === "object" && "direction" in silverChange) {
      return silverChange as RateChangeInfo;
    }
    return formatChangeValue(silverChange);
  }, [silverChange]);

  const handleGoldPress = () => {
    if (onGoldPress) {
      onGoldPress();
    } else if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: "/(app)/(tabs)/home/ratechart",
        params: { type: "gold" },
      });
    }
  };

  const handleSilverPress = () => {
    if (onSilverPress) {
      onSilverPress();
    } else if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: "/(app)/(tabs)/home/ratechart",
        params: { type: "silver" },
      });
    }
  };

  const formatRate = (val: string | number): string => {
    if (!val) return "0";
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
    if (isNaN(num)) return String(val);
    return num.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  const formatUpdatedDate = (rawDate?: string): string => {
    if (!rawDate) return t("today", { defaultValue: "Today" });
    try {
      let normalized = String(rawDate).trim();
      // Treat naive SQL/ISO server timestamps (without Z or +/-offset) as UTC before converting to IST (+5:30)
      if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(normalized)) {
        normalized = normalized.replace(" ", "T") + "Z";
      }
      const d = new Date(normalized);
      if (isNaN(d.getTime())) return String(rawDate);
      const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
      const day = ist.getUTCDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[ist.getUTCMonth()];
      let hours = ist.getUTCHours();
      const minutes = ist.getUTCMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
    } catch {
      return String(rawDate);
    }
  };

  const formattedTime = updatedAt ? formatUpdatedDate(updatedAt) : null;

  return (
    <View style={styles.container}>
      {/* Gold Rate Card */}
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={handleGoldPress}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#FFFDF5", "#FDF3DD", "#F6E3B4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, styles.goldCard]}
        >
          <View style={styles.topRow}>
            <Image
              source={GOLD_ICON}
              style={styles.icon}
              resizeMode="contain"
              fadeDuration={0}
            />
            <View style={styles.rateHeaderContainer}>
              <Text style={styles.goldRateType}>
                {t("goldRate", { defaultValue: "Gold Rate" })} ({goldPurity})
              </Text>
              {goldChangeInfo && (
                <View style={[styles.changeBadge, { backgroundColor: goldChangeInfo.bgColor }]}>
                  <Ionicons name={goldChangeInfo.iconName} size={10} color={goldChangeInfo.color} />
                  <Text style={[styles.changeText, { color: goldChangeInfo.color }]}>
                    {goldChangeInfo.formattedChange}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.goldRateValue}>
              ₹ {formatRate(goldRate)}
              <Text style={styles.goldUnitText}> {t("perGram", { defaultValue: "/ gm" })}</Text>
            </Text>
            <View style={styles.timeBadgeContainer}>
              <Ionicons name="time-outline" size={10} color="#850111" />
              <Text style={styles.goldTodayText}>{formattedTime || t("today", { defaultValue: "Today" })}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Silver Rate Card */}
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={handleSilverPress}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#F8FAFC", "#EDF2F7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.topRow}>
            <Image
              source={SILVER_ICON}
              style={styles.icon}
              resizeMode="contain"
              fadeDuration={0}
            />
            <View style={styles.rateHeaderContainer}>
              <Text style={styles.rateType}>{t("silverRate", { defaultValue: "Silver Rate" })}</Text>
              {silverChangeInfo && (
                <View style={[styles.changeBadge, { backgroundColor: silverChangeInfo.bgColor }]}>
                  <Ionicons name={silverChangeInfo.iconName} size={10} color={silverChangeInfo.color} />
                  <Text style={[styles.changeText, { color: silverChangeInfo.color }]}>
                    {silverChangeInfo.formattedChange}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.rateValue}>
              ₹ {formatRate(silverRate)}
              <Text style={styles.unitText}> {t("perGram", { defaultValue: "/ gm" })}</Text>
            </Text>
            <View style={styles.timeBadgeContainer}>
              <Ionicons name="time-outline" size={10} color="#94A3B8" />
              <Text style={styles.todayText}>{formattedTime || t("today", { defaultValue: "Today" })}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    gap: moderateScale(10),
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderWidth: 1,
    borderColor: "#CBD5E1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: "space-between",
    minHeight: moderateScale(76),
  },
  goldCard: {
    borderColor: "#D4AF37", // Sacred Heritage Gold Border
    borderWidth: 1.5,
    shadowColor: "#850111", // Warm Temple Maroon Glow
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  icon: {
    width: moderateScale(34),
    height: moderateScale(34),
  },
  rateHeaderContainer: {
    flex: 1,
  },
  rateType: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#475569",
    marginBottom: 1,
  },
  goldRateType: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#850111", // Royal Temple Maroon
    marginBottom: 1,
    letterSpacing: 0.2,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(1),
    borderRadius: moderateScale(4),
    marginTop: 1,
  },
  changeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  todayText: {
    fontSize: moderateScale(9),
    fontWeight: "500",
    color: "#64748B",
    marginLeft: 2,
  },
  goldTodayText: {
    fontSize: moderateScale(9),
    fontWeight: "600",
    color: "#850111",
    marginLeft: 2,
  },
  bottomRow: {
    marginTop: moderateScale(4),
    flexDirection: "column",
    justifyContent: "space-between",
  },
  timeBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  rateValue: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.3,
  },
  goldRateValue: {
    fontSize: moderateScale(15),
    fontWeight: "900",
    color: "#700918", // Deep Royal Ruby
    letterSpacing: 0.3,
  },
  unitText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#64748B",
  },
  goldUnitText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#850111",
  },
});

export default LiveRatesCardV2;

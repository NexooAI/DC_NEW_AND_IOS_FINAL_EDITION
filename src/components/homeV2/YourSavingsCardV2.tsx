import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import useGlobalStore, { useAppTheme } from "@/store/global.store";
import { useTranslation } from "@/hooks/useTranslation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface YourSavingsCardV2Props {
  totalAmount?: number | string;
  totalGoldGrams?: number | string;
  onPress?: () => void;
  onPayChitPress?: () => void;
}

export const YourSavingsCardV2: React.FC<YourSavingsCardV2Props> = ({
  totalAmount = 0,
  totalGoldGrams = 0,
  onPress,
  onPayChitPress,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { user } = useGlobalStore();

  const handlePassbookPress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/(app)/(tabs)/savings");
    }
  };

  const handlePayChit = () => {
    if (onPayChitPress) {
      onPayChitPress();
    } else {
      router.push("/(app)/(tabs)/quick_join");
    }
  };

  const formatCurrency = (val: number | string): string => {
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });
  };

  const formatWeight = (val: number | string): string => {
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
    if (isNaN(num)) return "0.000";
    return num.toFixed(3);
  };

  const userName = user?.name ? user.name.split(" ")[0] : "";

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={["#1A134A", "#2F2483", "#43339E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Subtle Golden Glow / Decorative Overlay */}
          <View style={styles.decorativeCircleTop} />
          <View style={styles.decorativeCircleBottom} />

          {/* Top Bar: User Greeting / Portfolio Title & Security Badge */}
          <View style={styles.topRow}>
            <View style={styles.titleGroup}>
              <View style={styles.greetingRow}>
                <Ionicons name="sparkles" size={14} color="#DFB45B" />
                <Text style={styles.greetingText}>
                  {userName
                    ? `${t("hello", { defaultValue: "Hello" })}, ${userName}`
                    : t("jeyabalaGoldVault", { defaultValue: "Jeyabala Gold Vault" })}
                </Text>
              </View>
              <Text style={styles.cardMainTitle}>
                {t("yourGoldenPortfolio", { defaultValue: "Your Golden Portfolio" })}
              </Text>
            </View>

            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#DFB45B" />
              <Text style={styles.trustBadgeText}>
                {t("100PercentHallmark", { defaultValue: "916 BIS Vault" })}
              </Text>
            </View>
          </View>

          {/* Center Showcase: Accumulated Gold Grams & Total Valuation */}
          <TouchableOpacity
            style={styles.metricsContainer}
            onPress={handlePassbookPress}
            activeOpacity={0.88}
          >
            {/* Left Metric: Gold Grams */}
            <View style={styles.metricBlock}>
              <View style={styles.metricLabelRow}>
                <Image
                  source={require("../../../assets/images/gold.png")}
                  style={styles.metricIconSmall}
                  resizeMode="contain"
                />
                <Text style={styles.metricLabel}>
                  {t("goldAccumulated", { defaultValue: "Gold Accumulated" })}
                </Text>
              </View>
              <Text style={styles.metricValuePrimary}>
                {formatWeight(totalGoldGrams)}
                <Text style={styles.metricUnit}> {t("gramsShort", { defaultValue: "gms" })}</Text>
              </Text>
            </View>

            {/* Vertical Elegant Gold Divider */}
            <View style={styles.metricDivider} />

            {/* Right Metric: Saved Valuation */}
            <View style={styles.metricBlock}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="wallet-outline" size={13} color="#DFB45B" />
                <Text style={styles.metricLabel}>
                  {t("portfolioValue", { defaultValue: "Portfolio Value" })}
                </Text>
              </View>
              <Text style={styles.metricValueSecondary}>
                ₹ {formatCurrency(totalAmount)}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Bottom Action Strip: Pay Chit (Gold CTA) + View Passbook */}
          <View style={styles.actionStrip}>
            {/* Primary Action: Pay Monthly Chit */}
            <TouchableOpacity
              style={styles.payChitButton}
              onPress={handlePayChit}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#DFB45B", "#C89938"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payChitGradient}
              >
                <Ionicons name="flash" size={14} color="#1A134A" />
                <Text style={styles.payChitText}>
                  {t("payChit", { defaultValue: "Pay Chit / தவணை" })}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary Action: View Passbook */}
            <TouchableOpacity
              style={styles.passbookButton}
              onPress={handlePassbookPress}
              activeOpacity={0.8}
            >
              <Text style={styles.passbookText}>
                {t("viewPassbook", { defaultValue: "View Passbook" })}
              </Text>
              <Ionicons name="arrow-forward" size={13} color="#DFB45B" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
  },
  cardWrapper: {
    borderRadius: moderateScale(20),
    shadowColor: "#2F2483",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    borderWidth: 1.5,
    borderColor: "rgba(223, 180, 91, 0.45)",
    position: "relative",
    overflow: "hidden",
  },
  decorativeCircleTop: {
    position: "absolute",
    top: -40,
    right: -40,
    width: moderateScale(130),
    height: moderateScale(130),
    borderRadius: moderateScale(65),
    backgroundColor: "rgba(223, 180, 91, 0.08)",
  },
  decorativeCircleBottom: {
    position: "absolute",
    bottom: -50,
    left: -30,
    width: moderateScale(110),
    height: moderateScale(110),
    borderRadius: moderateScale(55),
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(14),
  },
  titleGroup: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    marginBottom: moderateScale(2),
  },
  greetingText: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    color: "#DFB45B",
    letterSpacing: 0.3,
  },
  cardMainTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(223, 180, 91, 0.16)",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "rgba(223, 180, 91, 0.35)",
    gap: moderateScale(4),
  },
  trustBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#DFB45B",
  },
  metricsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: moderateScale(14),
  },
  metricBlock: {
    flex: 1,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    marginBottom: moderateScale(4),
  },
  metricIconSmall: {
    width: moderateScale(14),
    height: moderateScale(14),
  },
  metricLabel: {
    fontSize: moderateScale(10.5),
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.72)",
  },
  metricValuePrimary: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#DFB45B",
    letterSpacing: 0.2,
  },
  metricUnit: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
  },
  metricDivider: {
    width: 1,
    height: moderateScale(34),
    backgroundColor: "rgba(223, 180, 91, 0.3)",
    marginHorizontal: moderateScale(12),
  },
  metricValueSecondary: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  actionStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(10),
  },
  payChitButton: {
    flex: 1,
    borderRadius: moderateScale(12),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  payChitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    gap: moderateScale(6),
  },
  payChitText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#1A134A",
    letterSpacing: 0.2,
  },
  passbookButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(9),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(12),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(223, 180, 91, 0.4)",
    gap: moderateScale(5),
  },
  passbookText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default YourSavingsCardV2;

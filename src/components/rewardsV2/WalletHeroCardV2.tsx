import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";

interface WalletHeroCardV2Props {
  balance: number;
  totalEarned?: number;
  pointRate?: number;
  onRedeemPress: () => void;
  loading?: boolean;
}

export const WalletHeroCardV2: React.FC<WalletHeroCardV2Props> = ({
  balance,
  totalEarned = 0,
  pointRate = 1,
  onRedeemPress,
  loading = false,
}) => {
  const { t } = useTranslation();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const currentPointRate = pointRate > 0 ? pointRate : 1;
  const worthValue = balance * currentPointRate;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={["#FFE57F", "#FFC107", "#D4AF37", "#B8860B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Subtle decorative circles */}
        <View style={styles.bgCircleTopRight} />
        <View style={styles.bgCircleBottomLeft} />

        <View style={styles.cardContentRow}>
          {/* Left Column: Points & Value */}
          <View style={styles.leftCol}>
            <View style={styles.badgeLabel}>
              <FontAwesome5 name="gem" size={11} color="#5D4037" style={{ marginRight: 5 }} />
              <Text style={styles.badgeLabelText}>
                {t("total_rewards") || "Total Rewards"}
              </Text>
            </View>

            <View style={styles.pointsRow}>
              <Text style={styles.pointsNumber}>{balance.toLocaleString("en-IN")}</Text>
              <Text style={styles.pointsUnit}>{t("pts") || "Pts"}</Text>
            </View>

            <View style={styles.valueRow}>
              <Text style={styles.valueText}>
                {t("worth_value") || "Worth"}: <Text style={styles.valueBold}>₹{worthValue.toLocaleString("en-IN")}</Text>
              </Text>
              <Text style={styles.conversionNote}> (1 {t("pt") || "Pt"} = ₹{currentPointRate})</Text>
            </View>

            {totalEarned > 0 && (
              <Text style={styles.totalEarnedText}>
                {t("total_earned") || "Total Earned"}: {totalEarned.toLocaleString("en-IN")} {t("pts") || "Pts"}
              </Text>
            )}

            <TouchableOpacity
              style={styles.redeemButton}
              onPress={onRedeemPress}
              activeOpacity={0.85}
              disabled={loading}
            >
              <LinearGradient
                colors={["#FFFFFF", "#FFF8E1"]}
                style={styles.redeemBtnGradient}
              >
                <FontAwesome5 name="gift" size={13} color="#850111" style={{ marginRight: 6 }} />
                <Text style={styles.redeemBtnText}>
                  {t("redeemNow") || t("redeemPoints") || "Redeem Now"}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#850111" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Right Column: Floating Treasure Chest / Coins Graphic */}
          <View style={styles.rightCol}>
            <Animated.View
              style={[
                styles.chestGraphicContainer,
                { transform: [{ translateY: floatAnim }] },
              ]}
            >
              <View style={styles.chestGlow} />
              <View style={styles.chestIconBox}>
                <FontAwesome5 name="coins" size={54} color="#5D4037" />
              </View>
              <View style={styles.sparkleOne}>
                <Ionicons name="sparkles" size={16} color="#FFF" />
              </View>
              <View style={styles.sparkleTwo}>
                <Ionicons name="sparkles" size={13} color="#FFF8E1" />
              </View>
            </Animated.View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 24,
    shadowColor: "#FFC107",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  cardGradient: {
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
    position: "relative",
  },
  bgCircleTopRight: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  bgCircleBottomLeft: {
    position: "absolute",
    bottom: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  cardContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftCol: {
    flex: 1,
    paddingRight: 10,
  },
  badgeLabel: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  badgeLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5D4037",
    letterSpacing: 0.3,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 2,
  },
  pointsNumber: {
    fontSize: 34,
    fontWeight: "900",
    color: "#2C1810",
    letterSpacing: -0.5,
  },
  pointsUnit: {
    fontSize: 16,
    fontWeight: "800",
    color: "#5D4037",
    marginLeft: 6,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  valueText: {
    fontSize: 13,
    color: "#4E342E",
    fontWeight: "600",
  },
  valueBold: {
    fontWeight: "800",
    color: "#1B5E20",
  },
  conversionNote: {
    fontSize: 11,
    color: "#5D4037",
    opacity: 0.85,
    fontWeight: "500",
  },
  totalEarnedText: {
    fontSize: 11,
    color: "#5D4037",
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.9,
  },
  redeemButton: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  redeemBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.6)",
  },
  redeemBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#850111",
    marginRight: 2,
  },
  rightCol: {
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
  },
  chestGraphicContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  chestGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },
  chestIconBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  sparkleOne: {
    position: "absolute",
    top: -4,
    right: 4,
  },
  sparkleTwo: {
    position: "absolute",
    bottom: 6,
    left: -6,
  },
});

export default WalletHeroCardV2;

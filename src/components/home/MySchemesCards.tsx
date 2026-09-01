import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";
import { responsiveUtils } from "@/utils/responsiveUtils";

const { rp, rf } = responsiveUtils;

interface MySchemesCardsProps {
  onGoldPress?: () => void;
  onSilverPress?: () => void;
  onDiamondPress?: () => void;
  onPlatinumPress?: () => void;
  onOldGoldPress?: () => void;
  showGold?: boolean;
  showSilver?: boolean;
  showDiamond?: boolean;
  showPlatinum?: boolean;
  showOldGold?: boolean;
}

export const MySchemesCards: React.FC<MySchemesCardsProps> = ({
  onGoldPress,
  onSilverPress,
  onDiamondPress,
  onPlatinumPress,
  onOldGoldPress,
  showGold = true,
  showSilver = true,
  showDiamond = true,
  showPlatinum = true,
  showOldGold = true,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerTitleRow}>
          <Ionicons
            name="ribbon-outline"
            size={22}
            color="#FFD700"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.sectionTitle}>
            {t("mySchemes") || "My Schemes & Plans"}
          </Text>
        </View>
      </View>

      {/* Gold Schemes Card */}
      {showGold && (
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={onGoldPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#2E0406", "#4A0007", "#7A121D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cardGradient, styles.goldBorder]}
          >
            <View style={styles.cardLeft}>
              <View style={styles.badgeContainerGold}>
                <Text style={styles.badgeTextGold}>
                  {t("goldSavingsPlan") || "GOLD SAVINGS SCHEMES"}
                </Text>
              </View>
              <Text style={styles.cardTitle}>
                {t("goldSchemes") || "Gold Schemes"}
              </Text>
              <Text style={styles.cardSubtitle}>
                {t("exploreGoldSavingsPlans") || "Explore exclusive 22KT & 18KT Gold savings schemes with high growth"}
              </Text>
              <View style={styles.ctaButtonGold}>
                <Text style={styles.ctaTextGold}>
                  {t("exploreSchemes") || "Explore Schemes"}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#FFD700" style={{ marginLeft: 4 }} />
              </View>
            </View>

            <View style={styles.cardRight}>
              <Image
                source={require("../../../assets/images/logo_trans.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Image
                source={require("../../../assets/images/gold_coin_badge.png")}
                style={styles.badgeGraphic}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Silver Schemes Card */}
      {showSilver && (
        <TouchableOpacity
          style={[styles.cardWrapper, { marginTop: 14 }]}
          onPress={onSilverPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#0F172A", "#1E293B", "#334155"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cardGradient, styles.silverBorder]}
          >
            <View style={styles.cardLeft}>
              <View style={styles.badgeContainerSilver}>
                <Text style={styles.badgeTextSilver}>
                  {t("silverSavingsPlan") || "SILVER SAVINGS SCHEMES"}
                </Text>
              </View>
              <Text style={styles.cardTitle}>
                {t("silverSchemes") || "Silver Schemes"}
              </Text>
              <Text style={styles.cardSubtitle}>
                {t("exploreSilverSavingsPlans") || "Smart silver accumulation plans with zero wastage benefits"}
              </Text>
              <View style={styles.ctaButtonSilver}>
                <Text style={styles.ctaTextSilver}>
                  {t("exploreSchemes") || "Explore Schemes"}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#E2E8F0" style={{ marginLeft: 4 }} />
              </View>
            </View>

            <View style={styles.cardRight}>
              <Image
                source={require("../../../assets/images/logo_trans.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Image
                source={require("../../../assets/images/silver_coin_badge.png")}
                style={styles.badgeGraphic}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Diamond Schemes Card */}
      {showDiamond && (
        <TouchableOpacity
          style={[styles.cardWrapper, { marginTop: 14 }]}
          onPress={onDiamondPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#1E1B4B", "#312E81", "#581C87"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cardGradient, styles.diamondBorder]}
          >
            <View style={styles.cardLeft}>
              <View style={styles.badgeContainerDiamond}>
                <Text style={styles.badgeTextDiamond}>
                  {t("diamondSavingsPlan") || "DIAMOND JEWELLERY PLAN"}
                </Text>
              </View>
              <Text style={styles.cardTitle}>
                {t("diamondSchemes") || "Diamond Schemes"}
              </Text>
              <Text style={styles.cardSubtitle}>
                {t("exploreDiamondSavingsPlans") || "Precious diamond jewellery savings plans with special bonus additions"}
              </Text>
              <View style={styles.ctaButtonDiamond}>
                <Text style={styles.ctaTextDiamond}>
                  {t("exploreSchemes") || "Explore Schemes"}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#A5F3FC" style={{ marginLeft: 4 }} />
              </View>
            </View>

            <View style={styles.cardRight}>
              <Image
                source={require("../../../assets/images/logo_trans.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Image
                source={require("../../../assets/images/diamond_coin_badge.png")}
                style={styles.badgeGraphic}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Platinum Schemes Card */}
      {showPlatinum && (
        <TouchableOpacity
          style={[styles.cardWrapper, { marginTop: 14 }]}
          onPress={onPlatinumPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#0B192C", "#1E3E62", "#000000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cardGradient, styles.platinumBorder]}
          >
            <View style={styles.cardLeft}>
              <View style={styles.badgeContainerPlatinum}>
                <Text style={styles.badgeTextPlatinum}>
                  {t("platinumSavingsPlan") || "PLATINUM SAVINGS SCHEMES"}
                </Text>
              </View>
              <Text style={styles.cardTitle}>
                {t("platinumSchemes") || "Platinum Schemes"}
              </Text>
              <Text style={styles.cardSubtitle}>
                {t("explorePlatinumSavingsPlans") || "Elite 950 Pure Platinum savings collection with maximum flexibility"}
              </Text>
              <View style={styles.ctaButtonPlatinum}>
                <Text style={styles.ctaTextPlatinum}>
                  {t("exploreSchemes") || "Explore Schemes"}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#94A3B8" style={{ marginLeft: 4 }} />
              </View>
            </View>

            <View style={styles.cardRight}>
              <Image
                source={require("../../../assets/images/logo_trans.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View style={styles.platinumBadgeCircle}>
                <Ionicons name="sparkles" size={30} color="#E2E8F0" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Old Gold Schemes Card */}
      {showOldGold && (
        <TouchableOpacity
          style={[styles.cardWrapper, { marginTop: 14 }]}
          onPress={onOldGoldPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#2D1500", "#4D2600", "#733B00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cardGradient, styles.oldGoldBorder]}
          >
            <View style={styles.cardLeft}>
              <View style={styles.badgeContainerOldGold}>
                <Text style={styles.badgeTextOldGold}>
                  {t("oldGoldSavingsPlan") || "OLD GOLD SAVINGS SCHEMES"}
                </Text>
              </View>
              <Text style={styles.cardTitle}>
                {t("oldGoldSchemes") || "Old Gold Schemes"}
              </Text>
              <Text style={styles.cardSubtitle}>
                {t("exploreOldGoldSavingsPlans") || "Exchange your old gold jewellery for new with maximum value benefits"}
              </Text>
              <View style={styles.ctaButtonOldGold}>
                <Text style={styles.ctaTextOldGold}>
                  {t("exploreSchemes") || "Explore Schemes"}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#FBBF24" style={{ marginLeft: 4 }} />
              </View>
            </View>

            <View style={styles.cardRight}>
              <Image
                source={require("../../../assets/images/logo_trans.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View style={styles.oldGoldBadgeCircle}>
                <Ionicons name="swap-horizontal" size={26} color="#FBBF24" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    width: "100%",
    paddingHorizontal: rp(12),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: rp(4),
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: rf(16),
    fontWeight: "800",
    color: "#2E0406",
    letterSpacing: 0.3,
  },
  cardWrapper: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardGradient: {
    flexDirection: "row",
    paddingHorizontal: rp(18),
    paddingVertical: rp(12),
    borderRadius: 16,
    height: 145,
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  goldBorder: {
    borderWidth: 1.8,
    borderColor: "rgba(255, 215, 0, 0.45)",
  },
  silverBorder: {
    borderWidth: 1.8,
    borderColor: "rgba(203, 213, 225, 0.45)",
  },
  diamondBorder: {
    borderWidth: 1.8,
    borderColor: "rgba(165, 243, 252, 0.5)",
  },
  platinumBorder: {
    borderWidth: 1.8,
    borderColor: "rgba(148, 163, 184, 0.5)",
  },
  oldGoldBorder: {
    borderWidth: 1.8,
    borderColor: "rgba(251, 191, 36, 0.5)",
  },
  cardLeft: {
    flex: 1,
    paddingRight: 12,
    justifyContent: "space-between",
    height: "100%",
    paddingVertical: 2,
  },
  badgeContainerGold: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255, 215, 0, 0.35)",
  },
  badgeTextGold: {
    color: "#FFD700",
    fontSize: rf(9),
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  badgeContainerSilver: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(226, 232, 240, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(226, 232, 240, 0.35)",
  },
  badgeTextSilver: {
    color: "#E2E8F0",
    fontSize: rf(9),
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  badgeContainerDiamond: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(165, 243, 252, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(165, 243, 252, 0.35)",
  },
  badgeTextDiamond: {
    color: "#A5F3FC",
    fontSize: rf(9),
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  badgeContainerPlatinum: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(148, 163, 184, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(148, 163, 184, 0.35)",
  },
  badgeTextPlatinum: {
    color: "#94A3B8",
    fontSize: rf(9),
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: rf(18),
    fontWeight: "800",
    letterSpacing: 0.4,
    marginTop: 4,
  },
  cardSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: rf(11),
    fontWeight: "500",
    lineHeight: 16,
    marginVertical: 4,
  },
  ctaButtonGold: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)",
  },
  ctaTextGold: {
    color: "#FFD700",
    fontSize: rf(11),
    fontWeight: "700",
  },
  ctaButtonSilver: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(226, 232, 240, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.4)",
  },
  ctaTextSilver: {
    color: "#E2E8F0",
    fontSize: rf(11),
    fontWeight: "700",
  },
  ctaButtonDiamond: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(165, 243, 252, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(165, 243, 252, 0.4)",
  },
  ctaTextDiamond: {
    color: "#A5F3FC",
    fontSize: rf(11),
    fontWeight: "700",
  },
  ctaButtonPlatinum: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(148, 163, 184, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.4)",
  },
  ctaTextPlatinum: {
    color: "#94A3B8",
    fontSize: rf(11),
    fontWeight: "700",
  },
  cardRight: {
    width: 95,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  logoImage: {
    width: 75,
    height: 75,
    opacity: 0.85,
  },
  badgeGraphic: {
    position: "absolute",
    right: -2,
    bottom: 5,
    width: 50,
    height: 50,
    opacity: 0.85,
  },
  platinumBadgeCircle: {
    position: "absolute",
    right: 2,
    bottom: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(30, 62, 98, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(226, 232, 240, 0.6)",
  },
  badgeContainerOldGold: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(251, 191, 36, 0.35)",
  },
  badgeTextOldGold: {
    color: "#FBBF24",
    fontSize: rf(9),
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  ctaButtonOldGold: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  ctaTextOldGold: {
    color: "#FBBF24",
    fontSize: rf(11),
    fontWeight: "700",
  },
  oldGoldBadgeCircle: {
    position: "absolute",
    right: 2,
    bottom: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(120, 53, 15, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(251, 191, 36, 0.6)",
  },
});

export default MySchemesCards;

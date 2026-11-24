import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppTheme } from "@/store/global.store";

export const ReferTiersSectionV2: React.FC = () => {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      {/* 3-Step How It Works Card */}
      <View style={styles.howItWorksCard}>
        <Text style={styles.sectionHeaderTitle}>
          {t("how_it_works") || "How It Works"}
        </Text>

        <View style={styles.timelineRow}>
          {/* Step 1 */}
          <View style={styles.timelineItem}>
            <View style={[styles.timelineIconCircle, { backgroundColor: "#FFF8E1" }]}>
              <Ionicons name="share-social" size={22} color="#D4AF37" />
            </View>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.timelineTitle}>
              {t("refer_earn_invite_friends") || "Share Code"}
            </Text>
            <Text style={styles.timelineSubtitle}>
              {t("invite_via_whatsapp_desc") || "With friends & family"}
            </Text>
          </View>

          {/* Arrow 1 */}
          <View style={styles.arrowBox}>
            <Ionicons name="arrow-forward" size={16} color="#BDBDBD" />
          </View>

          {/* Step 2 */}
          <View style={styles.timelineItem}>
            <View style={[styles.timelineIconCircle, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="people" size={22} color="#2E7D32" />
            </View>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.timelineTitle}>
              {t("friends_join_pay") || "Friends Join"}
            </Text>
            <Text style={styles.timelineSubtitle}>
              {t("make_first_payment") || "Make first payment"}
            </Text>
          </View>

          {/* Arrow 2 */}
          <View style={styles.arrowBox}>
            <Ionicons name="arrow-forward" size={16} color="#BDBDBD" />
          </View>

          {/* Step 3 */}
          <View style={styles.timelineItem}>
            <View style={[styles.timelineIconCircle, { backgroundColor: "#FCE4EC" }]}>
              <FontAwesome5 name="gift" size={20} color="#850111" />
            </View>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.timelineTitle}>
              {t("you_earn_points") || "You Earn"}
            </Text>
            <Text style={styles.timelineSubtitle}>
              {t("instant_rewards") || "Instant rewards"}
            </Text>
          </View>
        </View>
      </View>

      {/* 
        Premium Reward Tiers Section (Temporarily commented out as requested. 
        Can be re-enabled whenever needed for customer tier promotions).
      */}
      {/*
      <View style={styles.tiersContainer}>
        <View style={styles.tiersHeader}>
          <FontAwesome5 name="award" size={18} color="#D4AF37" style={{ marginRight: 8 }} />
          <Text style={styles.tiersHeaderTitle}>
            {t("premium_reward_tiers") || "Reward Tiers"}
          </Text>
        </View>
        <Text style={styles.tiersSubtitle}>
          {t("premium_reward_tiers_desc") || "Rewards scale with your friend's first payment amount"}
        </Text>

        <View style={styles.tierCardsRow}>
          <View style={styles.tierCard}>
            <LinearGradient
              colors={["#FFFFFF", "#F9F9F9"]}
              style={styles.tierCardGradient}
            >
              <View style={[styles.tierIconContainer, { backgroundColor: "#ECEFF1" }]}>
                <FontAwesome5 name="medal" size={20} color="#78909C" />
              </View>
              <Text style={styles.tierBadge}>SILVER</Text>
              <Text style={styles.tierRange}>₹100 - ₹1,000</Text>
              <View style={styles.tierPointsTag}>
                <Text style={styles.tierPointsText}>+50 Pts</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={[styles.tierCard, styles.goldTierCard]}>
            <LinearGradient
              colors={["#FFFDE7", "#FFF8E1"]}
              style={styles.tierCardGradient}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>POPULAR</Text>
              </View>
              <View style={[styles.tierIconContainer, { backgroundColor: "#FFE082" }]}>
                <FontAwesome5 name="medal" size={22} color="#F57F17" />
              </View>
              <Text style={[styles.tierBadge, { color: "#F57F17" }]}>GOLD</Text>
              <Text style={styles.tierRange}>₹1,000 - ₹10,000</Text>
              <View style={[styles.tierPointsTag, { backgroundColor: "#FFF3E0" }]}>
                <Text style={[styles.tierPointsText, { color: "#E65100" }]}>+250 Pts</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.tierCard}>
            <LinearGradient
              colors={["#FFFFFF", "#F9F9F9"]}
              style={styles.tierCardGradient}
            >
              <View style={[styles.tierIconContainer, { backgroundColor: "#E1F5FE" }]}>
                <FontAwesome5 name="gem" size={19} color="#0288D1" />
              </View>
              <Text style={[styles.tierBadge, { color: "#0288D1" }]}>DIAMOND</Text>
              <Text style={styles.tierRange}>Above ₹10,000</Text>
              <View style={[styles.tierPointsTag, { backgroundColor: "#E1F5FE" }]}>
                <Text style={[styles.tierPointsText, { color: "#0288D1" }]}>2% Bonus</Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  howItWorksCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timelineItem: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  timelineIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepNumber: {
    position: "absolute",
    top: -2,
    right: 18,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#1A1A1A",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 18,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2C1810",
    textAlign: "center",
    marginBottom: 2,
  },
  timelineSubtitle: {
    fontSize: 10,
    color: "#757575",
    textAlign: "center",
    fontWeight: "500",
  },
  arrowBox: {
    paddingBottom: 24,
  },
  tiersContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  tiersHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  tiersHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  tiersSubtitle: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 16,
    lineHeight: 16,
  },
  tierCardsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tierCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  goldTierCard: {
    borderColor: "#FFD54F",
    borderWidth: 1.5,
    transform: [{ scale: 1.02 }],
  },
  tierCardGradient: {
    padding: 12,
    alignItems: "center",
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    backgroundColor: "#FFB300",
    paddingVertical: 2,
    alignItems: "center",
  },
  popularBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  tierIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 6,
  },
  tierBadge: {
    fontSize: 10,
    fontWeight: "900",
    color: "#78909C",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  tierRange: {
    fontSize: 10,
    fontWeight: "600",
    color: "#424242",
    textAlign: "center",
    marginBottom: 8,
    minHeight: 24,
  },
  tierPointsTag: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tierPointsText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2E7D32",
  },
});

export default ReferTiersSectionV2;

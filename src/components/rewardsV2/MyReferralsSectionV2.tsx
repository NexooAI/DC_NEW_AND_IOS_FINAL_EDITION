import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";
import { LinearGradient } from "expo-linear-gradient";

interface MyReferralsSectionV2Props {
  referrals: any[];
  history?: any[];
  walletBalance: number;
  walletTotalEarned: number;
  loading: boolean;
}

export const MyReferralsSectionV2: React.FC<MyReferralsSectionV2Props> = ({
  referrals,
  history = [],
  walletBalance,
  walletTotalEarned,
  loading,
}) => {
  const { t } = useTranslation();

  // Combine or display referral transactions
  const displayItems = history.length > 0 ? history : referrals;

  return (
    <View style={styles.container}>
      {/* Mini Stats Card */}
      <LinearGradient
        colors={["#2C1810", "#4E2616"]}
        style={styles.statsCard}
      >
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>{t("total_referrals") || "Total Referrals"}</Text>
          <View style={styles.statRow}>
            <Ionicons name="people" size={18} color="#FFD54F" style={{ marginRight: 6 }} />
            <Text style={styles.statValue}>
              {referrals.length} <Text style={styles.statUnit}>{t("friends") || "Friends"}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>{t("total_earned") || "Total Earned"}</Text>
          <View style={styles.statRow}>
            <FontAwesome5 name="coins" size={16} color="#FFD54F" style={{ marginRight: 6 }} />
            <Text style={styles.statValue}>
              {walletTotalEarned.toLocaleString("en-IN")} <Text style={styles.statUnit}>{t("pts") || "Pts"}</Text>
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* List Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>{t("loading") || "Loading referrals..."}</Text>
        </View>
      ) : displayItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="people-outline" size={42} color="#D4AF37" />
          </View>
          <Text style={styles.emptyTitle}>
            {t("no_referrals_yet") || "No Referrals Yet"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t("no_referrals_yet_desc") ||
              "Share your invite code with friends to start earning points together!"}
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {displayItems.map((item, index) => {
            const isReferral = item.type === "referral" || item.reward_earned !== undefined;
            const dateObj = new Date(item.created_at || item.joined_at || Date.now());
            const formattedDate = dateObj.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            const pointsEarned = item.points || item.reward_earned || 0;
            const displayName =
              item.description || item.friend_name || item.name || `${t("friend") || "Friend"} #${index + 1}`;
            const mobile = item.mobile_number || item.phone || "";
            const status = item.status || "Active";

            return (
              <View
                key={`${item.id || index}_${index}`}
                style={styles.referralCard}
              >
                {/* Avatar Icon */}
                <View style={[styles.avatarCircle, { backgroundColor: isReferral ? "#E8F5E9" : "#FFF3E0" }]}>
                  <Ionicons
                    name={isReferral ? "person" : "gift"}
                    size={20}
                    color={isReferral ? "#2E7D32" : "#E65100"}
                  />
                </View>

                {/* Details */}
                <View style={styles.detailsCol}>
                  <Text style={styles.friendName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {mobile ? (
                    <Text style={styles.mobileText}>{mobile}</Text>
                  ) : null}
                  <View style={styles.statusRow}>
                    <Text style={styles.dateText}>{formattedDate}</Text>
                    {status ? (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{status}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Points Tag */}
                <View style={styles.pointsBadge}>
                  <Text
                    style={[
                      styles.pointsText,
                      { color: isReferral ? "#2E7D32" : "#C62828" },
                    ]}
                  >
                    {isReferral ? `+${pointsEarned}` : `-${pointsEarned}`}
                  </Text>
                  <Text style={styles.pointsLabel}>{t("pts") || "Pts"}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  statsCard: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statValue: {
    fontSize: 19,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  statUnit: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFD54F",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#757575",
    fontWeight: "500",
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF8E1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2C1810",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#757575",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  listContainer: {
    gap: 10,
  },
  referralCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailsCol: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  mobileText: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 3,
    fontWeight: "500",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 11,
    color: "#9E9E9E",
    fontWeight: "500",
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2E7D32",
  },
  pointsBadge: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "900",
  },
  pointsLabel: {
    fontSize: 10,
    color: "#757575",
    fontWeight: "600",
  },
});

export default MyReferralsSectionV2;

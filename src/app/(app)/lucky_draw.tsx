import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import ResponsiveText from "@/components/ResponsiveText";
import { responsiveUtils } from "@/utils/responsiveUtils";
import { shadowUtils } from "@/utils/shadowUtils";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import { luckyDrawAPI } from "@/services/api";

const { wp, hp, rf } = responsiveUtils;

const luckyDrawColors = {
  surface: "#FFFFFF",
  surfaceWarm: "#FFFDF0",
  surfaceSoft: "rgba(255,255,255,0.72)",
  primary: "#850111", // Burgundy
  primaryDark: "#2C0006",
  goldDeep: "#B8860B", // Dark Gold
  goldPremium: "#D4AF37", // Elegant Gold
  goldLight: "#FAF3E0",
  muted: theme.colors.textMediumGrey,
  subtle: theme.colors.textLightGrey,
};

// --- Types ---
interface LuckyDrawItem {
  id: string;
  title: string;
  prize: string;
  description: string;
  endDate: Date;
  status: "ongoing" | "upcoming" | "completed";
  participants: number;
  image: string;
  ticketNumber: string;
  userWon?: boolean;
  winners?: any[];
  currentUserId?: string | number;
}

// --- Sub-Components ---

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = targetDate.getTime() - new Date().getTime();
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: difference,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference,
      };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatWithZero = (num: number) => (num < 10 ? `0${num}` : num);

  if (timeLeft.total <= 0) {
    return (
      <View style={styles.timerContainer}>
        <ResponsiveText color={luckyDrawColors.primary} size="sm" weight="bold">{t("luckyDrawResultsSoon")}</ResponsiveText>
      </View>
    );
  }

  // Large Countdown Format (2 days more, 1 day more)
  if (timeLeft.days >= 1) {
    return (
      <View style={styles.timerContainer}>
        <Ionicons name="time-outline" size={16} color={luckyDrawColors.primary} style={{ marginRight: 6 }} />
        <ResponsiveText color={luckyDrawColors.primary} size="sm" weight="bold">
          {timeLeft.days === 1
            ? t("luckyDrawDayMore")
            : t("luckyDrawDaysMore").replace("{count}", timeLeft.days.toString())}
        </ResponsiveText>
      </View>
    );
  }

  // Small Countdown Format (HH:MM:SS)
  const timeString = `${formatWithZero(timeLeft.hours)}:${formatWithZero(timeLeft.minutes)}:${formatWithZero(timeLeft.seconds)}`;
  return (
    <View style={styles.timerContainer}>
      <Ionicons name="time-outline" size={16} color={luckyDrawColors.primary} style={{ marginRight: 6 }} />
      <ResponsiveText color={luckyDrawColors.primary} size="sm" weight="bold">
        {t("luckyDrawRemaining").replace("{time}", timeString)}
      </ResponsiveText>
    </View>
  );
};

const LuckyDrawCard = ({ item, onPress }: { item: LuckyDrawItem; onPress?: () => void }) => {
  const { t } = useTranslation();
  const isCompleted = item.status === "completed";
  const userWon = item.userWon;

  // Premium colors based on draw status
  const cardGradientColors = isCompleted
    ? ["#FAFAFA", "#F5F5F5"]
    : userWon
      ? ["#FFFDF0", "#FFF9C4", "#FFF59D"]
      : [luckyDrawColors.surface, luckyDrawColors.surfaceWarm];

  return (
    <TouchableOpacity activeOpacity={0.9} style={[styles.card, userWon && styles.cardWon, isCompleted && styles.cardCompleted]} onPress={onPress}>
      <LinearGradient
        colors={cardGradientColors as any}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={[
            styles.badge, 
            isCompleted && { backgroundColor: "#78909C" },
            userWon && { backgroundColor: luckyDrawColors.goldPremium }
          ]}>
            <ResponsiveText color={userWon ? "#000" : "#fff"} size="xs" weight="bold">
              {userWon 
                ? t("luckyDrawYouWonBadge") || "YOU WON! 🎉"
                : isCompleted 
                  ? t("luckyDrawCompleted") || "Completed" 
                  : t("luckyDrawLive")}
            </ResponsiveText>
          </View>
          {isCompleted ? (
            <ResponsiveText color={luckyDrawColors.muted} size="xs" weight="bold">
              {new Date(item.endDate).toLocaleDateString()}
            </ResponsiveText>
          ) : (
            <CountdownTimer targetDate={item.endDate} />
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.textSection}>
            <ResponsiveText color={luckyDrawColors.primary} size="md" weight="bold" style={styles.cardTitle}>
              {item.title}
            </ResponsiveText>
            <ResponsiveText color={luckyDrawColors.primaryDark} size="lg" weight="bold" style={styles.prizeText}>
              {item.prize}
            </ResponsiveText>
            <ResponsiveText color={luckyDrawColors.muted} size="xs" style={styles.descText} numberOfLines={2}>
              {item.description}
            </ResponsiveText>

            {item.ticketNumber ? (
              <View style={[styles.ticketBadge, userWon && { backgroundColor: "rgba(218,165,32,0.18)", borderColor: "rgba(218,165,32,0.5)" }]}>
                <MaterialCommunityIcons name="ticket-confirmation" size={14} color={userWon ? "#B8860B" : luckyDrawColors.goldPremium} />
                <ResponsiveText color={userWon ? "#B8860B" : luckyDrawColors.primary} size="xs" weight="bold" style={{ marginLeft: 6 }}>
                  {t("luckyDrawDrawNo").replace("{no}", item.ticketNumber)}
                </ResponsiveText>
              </View>
            ) : (
              !isCompleted && (
                <View style={[styles.ticketBadge, { backgroundColor: "rgba(133,1,17,0.03)", borderColor: "rgba(133,1,17,0.08)" }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={14} color={luckyDrawColors.muted} />
                  <ResponsiveText color={luckyDrawColors.muted} size="xs" weight="bold" style={{ marginLeft: 6 }}>
                    {t("youAreNotRegistered") || "Not Registered"}
                  </ResponsiveText>
                </View>
              )
            )}
          </View>

          <View style={[styles.imageSection, userWon && { backgroundColor: "rgba(255,215,0,0.15)", borderColor: "rgba(255,215,0,0.3)" }]}>
            <LinearGradient
              colors={userWon ? ["rgba(255,215,0,0.3)", "transparent"] : ["rgba(255,201,12,0.3)", "transparent"]}
              style={styles.imageOverlay}
            />
            <MaterialCommunityIcons 
              name={userWon ? "trophy-outline" : "trophy-award"} 
              size={rf(44)} 
              color={userWon ? "#FFD700" : luckyDrawColors.goldPremium} 
            />
          </View>
        </View>

        {isCompleted && item.winners && item.winners.length > 0 && (
          <View style={styles.winnersContainer}>
            <ResponsiveText color={luckyDrawColors.primaryDark} size="xs" weight="bold" style={styles.winnersTitle}>
              {t("luckyDrawWinnersList")}
            </ResponsiveText>
            {item.winners.map((winner: any, idx: number) => {
              const isCurrentUser = winner.user_id === item.currentUserId;
              return (
                <View key={idx} style={[styles.winnerRow, isCurrentUser && styles.winnerRowCurrentUser]}>
                  <Ionicons name="ribbon" size={14} color={isCurrentUser ? "#FFD700" : luckyDrawColors.goldPremium} />
                  <ResponsiveText color={luckyDrawColors.primaryDark} size="xs" style={{ marginLeft: 6, flex: 1 }} weight={isCurrentUser ? "bold" : "normal"}>
                    {winner.user_name || winner.userName} {isCurrentUser && `(You - ${t("luckyDrawCongratulations") || "Won!"})`}
                  </ResponsiveText>
                  <ResponsiveText color={luckyDrawColors.goldDeep} size="xs" weight="bold">
                    Rank {winner.prize_rank}
                  </ResponsiveText>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.participantInfo}>
            <Ionicons name="people-outline" size={14} color={luckyDrawColors.subtle} />
            <ResponsiveText color={luckyDrawColors.subtle} size="xs" style={{ marginLeft: 4 }}>
              {t("luckyDrawParticipated").replace("{count}", item.participants.toLocaleString())}
            </ResponsiveText>
          </View>

          {!isCompleted && (
            <TouchableOpacity style={styles.entryButton} onPress={onPress}>
              <LinearGradient
                colors={item.ticketNumber 
                  ? ["#388E3C", "#1B5E20"] 
                  : [luckyDrawColors.primary, "#4A0010"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.entryButtonGradient}
              >
                <ResponsiveText color="#fff" size="xs" weight="bold">
                  {item.ticketNumber 
                    ? t("registered") || "Registered" 
                    : t("luckyDrawHowToParticipate") || "How to Participate"}
                </ResponsiveText>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// --- Main Component ---

export default function LuckyDraw() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useGlobalStore((state) => state.user);

  const [luckyDraws, setLuckyDraws] = useState<LuckyDrawItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [recentWinner, setRecentWinner] = useState<string>("");

  const fetchLuckyDraws = async () => {
    try {
      setLoading(true);
      const response = await luckyDrawAPI.getLuckyDraws();
      if (response && response.data && response.data.success) {
        const list = response.data.data.map((apiItem: any): LuckyDrawItem => {
          const firstPrize = apiItem.prizes?.find((p: any) => p.prize_rank === 1) || apiItem.prizes?.[0];
          const prizeStr = firstPrize 
            ? `${firstPrize.description || firstPrize.prize_value} (${firstPrize.prize_type})` 
            : "Special Prize";

          return {
            id: apiItem.id.toString(),
            title: apiItem.title,
            prize: prizeStr,
            description: firstPrize?.description || apiItem.title,
            endDate: new Date(apiItem.draw_datetime || apiItem.end_date),
            status: apiItem.status === "completed" ? "completed" : apiItem.status === "active" ? "ongoing" : "upcoming",
            participants: apiItem.participants || 0,
            image: "",
            ticketNumber: apiItem.userEligibility?.ticketNumber || "",
            userWon: apiItem.userEligibility?.won || false,
            winners: apiItem.winners || [],
            currentUserId: user?.id,
          };
        });

        // Extract a real recent winner from the completed lucky draws sorted by date descending
        const completedDraws = response.data.data
          .filter((d: any) => d.status === "completed" && d.winners && d.winners.length > 0)
          .sort((a: any, b: any) => {
            const dateA = new Date(a.draw_datetime || a.end_date).getTime();
            const dateB = new Date(b.draw_datetime || b.end_date).getTime();
            return dateB - dateA;
          });
        const completedDraw = completedDraws[0];
        if (completedDraw) {
          const firstWinner = completedDraw.winners.find((w: any) => w.prize_rank === 1) || completedDraw.winners[0];
          const firstPrize = completedDraw.prizes?.find((p: any) => p.prize_rank === 1) || completedDraw.prizes?.[0];
          const prizeStr = firstPrize 
            ? `${firstPrize.description || firstPrize.prize_value}` 
            : "Special Prize";
          const winnerName = firstWinner.user_name || firstWinner.userName || "Customer";
          setRecentWinner(`${t("luckyDrawRecentWinnerLabel") || "Recent Winner"}: ${winnerName} won ${prizeStr}`);
        } else {
          setRecentWinner("");
        }

        // Filter list based on tab
        if (activeTab === "active") {
          setLuckyDraws(list.filter((item: any) => item.status !== "completed"));
        } else {
          setLuckyDraws(list.filter((item: any) => item.status === "completed"));
        }
      }
    } catch (error) {
      console.error("Error fetching lucky draws:", error);
      Alert.alert(t("error"), t("failedToFetchData"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLuckyDraws();
  }, [activeTab]);

  const handleParticipatePress = (item: LuckyDrawItem) => {
    if (item.userWon) {
      Alert.alert(
        "🎉 " + (t("luckyDrawCongratulations") || "CONGRATULATIONS!") + " 🎉",
        `${t("luckyDrawYouWonDesc") || "You won in this draw!"}\n\n${t("luckyDrawDraw") || "Draw"}: ${item.title}\n\n${t("luckyDrawPrize") || "Prize"}: ${item.prize}\n\n${t("luckyDrawTicket") || "Ticket"}: ${item.ticketNumber}\n\n${t("luckyDrawDeliveryDesc") || "Our team will contact you shortly to deliver your prize."}`,
        [{ text: t("ok") || "OK" }]
      );
      return;
    }

    if (item.status === "completed") {
      Alert.alert(
        t("info") || "Info",
        `${item.title} has completed. Thank you for participating. Check the winners list below.`,
        [{ text: t("ok") || "OK" }]
      );
      return;
    }

    if (item.ticketNumber) {
      Alert.alert(
        t("success"),
        `Congratulations!\n\nYou are registered in '${item.title}' draw.\n\nYour Ticket Number:\n${item.ticketNumber}`,
        [{ text: t("ok") }]
      );
    } else {
      Alert.alert(
        t("info"),
        t("luckyDrawInfo"),
        [{ text: t("ok") }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === "ios" ? ["left", "right"] : ["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.quaternary || "#F2E6D2"} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.quaternary }]} />

      {/* Background Decor */}
      <View style={styles.bgDecorCircle1} />
      <View style={styles.bgDecorCircle2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={luckyDrawColors.primary} />
        </TouchableOpacity>
        <ResponsiveText
          variant="title"
          size="lg"
          weight="bold"
          color={luckyDrawColors.primaryDark}
        >
          {t("luckyDraw")}
        </ResponsiveText>
        <TouchableOpacity style={styles.historyButton} onPress={() => setActiveTab(activeTab === "active" ? "history" : "active")}>
          <MaterialCommunityIcons 
            name={activeTab === "active" ? "history" : "trophy-outline"} 
            size={24} 
            color={luckyDrawColors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Toggle Segment */}
      <View style={styles.segmentWrapper}>
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentButton, activeTab === "active" && styles.segmentButtonActive]}
            onPress={() => setActiveTab("active")}
          >
            <ResponsiveText
              color={activeTab === "active" ? "#fff" : luckyDrawColors.primary}
              size="xs"
              weight="bold"
            >
              {t("luckyDrawActiveDraws")}
            </ResponsiveText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, activeTab === "history" && styles.segmentButtonActive]}
            onPress={() => setActiveTab("history")}
          >
            <ResponsiveText
              color={activeTab === "history" ? "#fff" : luckyDrawColors.primary}
              size="xs"
              weight="bold"
            >
              {t("luckyDrawHistory")}
            </ResponsiveText>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={luckyDrawColors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Banner Section */}
          <View style={styles.banner}>
            <LinearGradient
              colors={["#850111", "#4A0010"]}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <ResponsiveText color="#FFD700" size="xl" weight="bold" style={styles.bannerTitle}>
                  {t("luckyDrawBannerTitle")}
                </ResponsiveText>
                <ResponsiveText color="#fff" size="md" style={styles.bannerSubtitle}>
                  {t("luckyDrawBannerSubtitle")}
                </ResponsiveText>

                <View style={styles.winnersTicker}>
                  <Ionicons name="notifications-outline" size={14} color="#FFD700" />
                  <ResponsiveText color="#FFD700" size="xs" style={{ marginLeft: 6 }}>
                    {recentWinner || t("luckyDrawRecentWinner")}
                  </ResponsiveText>
                </View>
              </View>

              <View style={styles.bannerIconContainer}>
                <MaterialCommunityIcons name="clover" size={rf(100)} color="rgba(255,215,0,0.15)" />
              </View>
            </LinearGradient>
          </View>

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <ResponsiveText color={luckyDrawColors.primaryDark} size="md" weight="bold">
              {activeTab === "active" ? t("luckyDrawActiveDraws") : t("luckyDrawHistory")}
            </ResponsiveText>
          </View>

          {/* Lucky Draw Cards / Empty state */}
          {luckyDraws.length > 0 ? (
            luckyDraws.map((item) => (
              <LuckyDrawCard 
                key={item.id} 
                item={item} 
                onPress={() => handleParticipatePress(item)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name={activeTab === "active" ? "clover" : "history"} 
                size={64} 
                color={luckyDrawColors.subtle} 
              />
              <ResponsiveText color={luckyDrawColors.muted} size="sm" style={styles.emptyText}>
                {activeTab === "active" ? t("luckyDrawNoActive") : t("luckyDrawNoHistory")}
              </ResponsiveText>
            </View>
          )}

          {/* Footer info */}
          <View style={styles.footerInfo}>
            <Ionicons name="information-circle-outline" size={16} color={luckyDrawColors.subtle} />
            <ResponsiveText color={luckyDrawColors.subtle} size="xs" style={{ marginLeft: 8, flex: 1 }}>
              {t("luckyDrawTerms")}
            </ResponsiveText>
          </View>

          <View style={{ height: hp(5) }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.quaternary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: "transparent",
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: luckyDrawColors.surfaceSoft,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  historyButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: luckyDrawColors.surfaceSoft,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  segmentWrapper: {
    paddingHorizontal: wp(5),
    marginBottom: hp(1),
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(212, 175, 55, 0.04)",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: luckyDrawColors.primary,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: hp(8),
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: hp(2),
    textAlign: "center",
    paddingHorizontal: wp(10),
  },
  bgDecorCircle1: {
    position: "absolute",
    top: -hp(10),
    right: -wp(20),
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  bgDecorCircle2: {
    position: "absolute",
    bottom: -hp(10),
    left: -wp(20),
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  banner: {
    width: "100%",
    height: hp(22),
    borderRadius: 25,
    overflow: "hidden",
    marginVertical: hp(2),
    borderWidth: 1.5,
    borderColor: "#D4AF37", // Elegant gold border
    ...shadowUtils.SHADOW_PRESETS.medium,
  },
  bannerGradient: {
    flex: 1,
    flexDirection: "row",
    padding: wp(6),
  },
  bannerContent: {
    flex: 2,
    justifyContent: "center",
  },
  bannerIconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  bannerTitle: {
    letterSpacing: 2,
    marginBottom: 4,
  },
  bannerSubtitle: {
    opacity: 0.8,
    marginBottom: hp(2),
    lineHeight: 20,
  },
  winnersTicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
    marginTop: hp(0.5),
  },
  card: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: hp(2.5),
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.22)", // Premium soft gold border
    backgroundColor: "#FFFFFF",
    ...shadowUtils.SHADOW_PRESETS.medium,
  },
  cardWon: {
    borderWidth: 2.5,
    borderColor: "#D4AF37", // Bright gold metallic border
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardCompleted: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    opacity: 0.9,
    shadowOpacity: 0.03,
    elevation: 1,
  },
  cardGradient: {
    padding: wp(5),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
  },
  badge: {
    backgroundColor: luckyDrawColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.28)",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(2.5),
  },
  textSection: {
    flex: 1,
  },
  imageSection: {
    width: wp(20),
    height: wp(20),
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    borderRadius: wp(10), // Fully circular
    justifyContent: "center",
    alignItems: "center",
    marginLeft: wp(4),
    borderWidth: 1.5,
    borderColor: "#D4AF37", // Elegant gold border
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: wp(10),
  },
  cardTitle: {
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  ticketBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.45)",
    borderStyle: "dashed", // Realistic tear-off ticket design
  },
  prizeText: {
    marginBottom: 8,
    fontSize: rf(19),
  },
  descText: {
    lineHeight: 18,
  },
  winnersContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.15)",
    paddingTop: hp(1.5),
    marginBottom: hp(1.5),
  },
  winnersTitle: {
    marginBottom: hp(1),
  },
  winnerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(212, 175, 55, 0.06)",
    borderWidth: 0.5,
    borderColor: "rgba(212, 175, 55, 0.2)",
    marginBottom: 6,
  },
  winnerRowCurrentUser: {
    backgroundColor: "rgba(212, 175, 55, 0.18)",
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.15)",
  },
  participantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryButton: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  entryButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(2),
    marginTop: hp(1),
  }
});

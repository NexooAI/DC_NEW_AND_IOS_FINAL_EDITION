import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import ResponsiveText from "@/components/ResponsiveText";
import { responsiveUtils } from "@/utils/responsiveUtils";
import { shadowUtils } from "@/utils/shadowUtils";

const { wp, hp, rf } = responsiveUtils;

const luckyDrawColors = {
  surface: "#FFFDF8",
  surfaceWarm: "#FFF6E8",
  surfaceSoft: "rgba(255,255,255,0.58)",
  primary: theme.colors.primary,
  primaryDark: theme.colors.textDark,
  goldDeep: theme.colors.goldDark,
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
}

// --- Dummy Data ---
const DUMMY_LUCKY_DRAWS: LuckyDrawItem[] = [
  {
    id: "1",
    title: "Summer Gold Bonanza",
    prize: "22K Gold Chain (10g)",
    description: "Participate and win a pure gold chain this summer! Winner will be announced live on our Instagram.",
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000 + 30 * 60 * 1000), // 2 days, 5.5 hours
    status: "ongoing",
    participants: 1240,
    image: "https://img.freepik.com/free-photo/gold-chain-isolated-white-background_1232-230.jpg",
    ticketNumber: "8820260015",
  },
  {
    id: "2",
    title: "Diamond Weekly Draw",
    prize: "Diamond Stud Earrings",
    description: "Exclusive weekly draw for our premium members. Every week, one lucky member wins diamond jewelry.",
    endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 10 * 60 * 1000), // 1 day, 2 hours
    status: "ongoing",
    participants: 850,
    image: "https://img.freepik.com/free-photo/shiny-diamond-earrings-luxury-jewellery-gift_1232-231.jpg",
    ticketNumber: "8820260124",
  },
  {
    id: "3",
    title: "Flash Silver Giveaway",
    prize: "999 Silver Coin (50g)",
    description: "Quick flash giveaway! Result will be announced within the next few hours.",
    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000 + 10 * 60 * 1000 + 4 * 1000), // 2 hours, 10 mins
    status: "ongoing",
    participants: 3200,
    image: "https://img.freepik.com/free-photo/silver-coin-isolated-white-background_1232-232.jpg",
    ticketNumber: "8820260052",
  }
];

// --- Sub-Components ---

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
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
         <ResponsiveText color={luckyDrawColors.primary} size="sm" weight="bold">Results Announced Soon!</ResponsiveText>
      </View>
    );
  }

  // Large Countdown Format (2 days more, 1 day more)
  if (timeLeft.days >= 1) {
    return (
      <View style={styles.timerContainer}>
        <Ionicons name="time-outline" size={16} color={luckyDrawColors.primary} style={{ marginRight: 6 }} />
        <ResponsiveText color={luckyDrawColors.primary} size="sm" weight="bold">
          {timeLeft.days} {timeLeft.days === 1 ? "Day" : "Days"} More
        </ResponsiveText>
      </View>
    );
  }

  // Small Countdown Format (HH:MM:SS)
  return (
    <View style={styles.timerContainer}>
      <Ionicons name="time-outline" size={16} color={luckyDrawColors.primary} style={{ marginRight: 6 }} />
      <ResponsiveText color={luckyDrawColors.primary} size="sm" weight="bold">
        {formatWithZero(timeLeft.hours)}:{formatWithZero(timeLeft.minutes)}:{formatWithZero(timeLeft.seconds)} Remaining
      </ResponsiveText>
    </View>
  );
};

const LuckyDrawCard = ({ item }: { item: LuckyDrawItem }) => {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card}>
      <LinearGradient
        colors={[luckyDrawColors.surface, luckyDrawColors.surfaceWarm]}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badge}>
            <ResponsiveText color="#fff" size="xs" weight="bold">LIVE</ResponsiveText>
          </View>
          <CountdownTimer targetDate={item.endDate} />
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
            
            <View style={styles.ticketBadge}>
              <MaterialCommunityIcons name="ticket-confirmation" size={14} color={luckyDrawColors.primary} />
              <ResponsiveText color={luckyDrawColors.primary} size="xs" weight="bold" style={{ marginLeft: 6 }}>
                Draw No: {item.ticketNumber}
              </ResponsiveText>
            </View>
          </View>
          
          <View style={styles.imageSection}>
             <LinearGradient
               colors={["rgba(255,201,12,0.3)", "transparent"]}
               style={styles.imageOverlay}
             />
             <MaterialCommunityIcons name="trophy-award" size={rf(50)} color={luckyDrawColors.goldDeep} />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.participantInfo}>
            <Ionicons name="people-outline" size={14} color={luckyDrawColors.subtle} />
            <ResponsiveText color={luckyDrawColors.subtle} size="xs" style={{ marginLeft: 4 }}>
              {item.participants.toLocaleString()} Participated
            </ResponsiveText>
          </View>
          
          <TouchableOpacity style={styles.entryButton}>
            <LinearGradient
              colors={[luckyDrawColors.primary, theme.colors.redDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.entryButtonGradient}
            >
              <ResponsiveText color="#fff" size="xs" weight="bold">Participate Now</ResponsiveText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// --- Main Component ---

export default function LuckyDraw() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
          Lucky Draw
        </ResponsiveText>
        <TouchableOpacity style={styles.historyButton}>
           <MaterialCommunityIcons name="history" size={24} color={luckyDrawColors.primary} />
        </TouchableOpacity>
      </View>

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
                   WIN BIG!
                </ResponsiveText>
                <ResponsiveText color="#fff" size="md" style={styles.bannerSubtitle}>
                   Enter our daily lucky draws and get a chance to win exclusive jewelry.
                </ResponsiveText>
                
                <View style={styles.winnersTicker}>
                   <Ionicons name="notifications-outline" size={14} color="#FFD700" />
                   <ResponsiveText color="#FFD700" size="xs" style={{ marginLeft: 6 }}>
                      Recent Winner: Rajesh Kumar won 5g Gold Coin
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
           <ResponsiveText color={luckyDrawColors.primaryDark} size="md" weight="bold">Active Draws</ResponsiveText>
           <TouchableOpacity>
              <ResponsiveText color={luckyDrawColors.primary} size="xs" weight="bold">View All</ResponsiveText>
           </TouchableOpacity>
        </View>

        {/* Lucky Draw Cards */}
        {DUMMY_LUCKY_DRAWS.map((item) => (
          <LuckyDrawCard key={item.id} item={item} />
        ))}

        {/* Footer info */}
        <View style={styles.footerInfo}>
           <Ionicons name="information-circle-outline" size={16} color={luckyDrawColors.subtle} />
           <ResponsiveText color={luckyDrawColors.subtle} size="xs" style={{ marginLeft: 8, flex: 1 }}>
              Terms and conditions apply. Winners are selected randomly using a certified random generator.
           </ResponsiveText>
        </View>
        
        <View style={{ height: hp(5) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: "rgba(133,1,17,0.12)",
  },
  historyButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: luckyDrawColors.surfaceSoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(133,1,17,0.12)",
  },
  scrollContent: {
    paddingHorizontal: wp(5),
  },
  bgDecorCircle1: {
    position: "absolute",
    top: -hp(10),
    right: -wp(20),
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: "rgba(133,1,17,0.08)",
  },
  bgDecorCircle2: {
    position: "absolute",
    bottom: -hp(10),
    left: -wp(20),
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: "rgba(255,201,12,0.12)",
  },
  banner: {
    width: "100%",
    height: hp(22),
    borderRadius: 25,
    overflow: "hidden",
    marginVertical: hp(2),
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
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
    marginTop: hp(1),
  },
  card: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: hp(2.5),
    borderWidth: 1,
    borderColor: "rgba(133,1,17,0.12)",
    ...shadowUtils.SHADOW_PRESETS.small,
  },
  cardGradient: {
    padding: wp(4.5),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
  },
  badge: {
    backgroundColor: luckyDrawColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(133,1,17,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(133,1,17,0.12)",
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
    backgroundColor: "rgba(255,201,12,0.12)",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: wp(4),
    borderWidth: 1,
    borderColor: "rgba(184,134,11,0.18)",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
  },
  cardTitle: {
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ticketBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(133,1,17,0.06)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: "rgba(133,1,17,0.14)",
  },
  prizeText: {
    marginBottom: 8,
  },
  descText: {
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: "rgba(133,1,17,0.08)",
  },
  participantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryButton: {
    borderRadius: 10,
    overflow: "hidden",
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

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Animated,
  Easing,
  StatusBar,
  Text,
  ScrollView,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Animatable from "react-native-animatable";
import { COLORS } from "@/constants/colors";
import { theme } from "@/constants/theme";
import ResponsiveText from "@/components/ResponsiveText";
import { responsiveUtils } from "@/utils/responsiveUtils";
import { shadowUtils } from "@/utils/shadowUtils";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";

const { wp, hp, rf } = responsiveUtils;
const { width, height } = Dimensions.get("window");

// LUXURY PALETTE
const PREMIUM_GOLD = "#DAA520";
const LUXURY_DARK = "#121212";
const LUXURY_BROWN = "#211714";
const CARD_BG = "rgba(33, 23, 20, 0.75)";

// ─── Luxury Background ───────────────────────────────────────────────────────
const LuxuryBackground = () => {
  return (
    <Image
      source={require("../../../assets/images/dashboard_bg.png")}
      style={styles.bgImage}
      resizeMode="cover"
    />
  );
};

// ─── Image Fallback ──────────────────────────────────────────────────────────
let logoImage: any = null;
try {
  logoImage = require("../../../assets/images/logo_trans.png");
} catch (error) {
  console.log("Logo image not found");
}

// ─── Luxury Card Component ──────────────────────────────────────────────────
const LuxuryCard = ({
  title,
  icon,
  onPress,
  iconType = "ionicons",
  index = 0,
  gradient = ["#1C1614", "#0A0A0A"]
}: {
  title: string;
  icon: string;
  onPress: () => void;
  iconType?: "ionicons" | "material";
  index?: number;
  gradient?: string[];
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      style={styles.luxuryCardWrapper}
    >
      <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.luxuryCardInner}
        >
          {/* Card Base - Pale Beige from Mockup */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#3c2117ff" }]} />

          <View style={styles.cardGoldBorder} />

          <View style={styles.luxuryCardContent}>
            <View style={styles.luxuryIconContainer}>
              {iconType === "ionicons" ? (
                <Ionicons name={icon as any} size={rf(26)} color={PREMIUM_GOLD} />
              ) : (
                <MaterialCommunityIcons name={icon as any} size={rf(26)} color={PREMIUM_GOLD} />
              )}
            </View>

            <ResponsiveText
              variant="body"
              size="lg"
              weight="bold"
              color={PREMIUM_GOLD}
              align="center"
              style={styles.luxuryCardTitle}>
              {title}
            </ResponsiveText>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animatable.View>
  );
};

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setChatOpen, user } = useGlobalStore();
  const [rates, setRates] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user) return;
        const response = await api.get(`/home?userId=${user.id || (user as any).id}`, { skipLoading: true } as any);
        if (response.data.success) {
          setRates(response.data.data.currentRates);
        }

        // Fetch social links/videos data exactly as requested
        const videoRes = await api.get('/videos/active', { skipLoading: true } as any);
        if (videoRes.data?.success && videoRes.data?.data?.length > 0) {
          setSocialLinks(videoRes.data.data[0]);
        }
      } catch (e) {
        console.log("Error fetching dashboard data", e);
      }
    };
    fetchDashboardData();
  }, [user]);

  const cards = [
    { title: t("ourSchemes") || "Schemes", icon: "diamond-outline", gradient: ["#4a1c40", "#8e2e5e"], onPress: () => router.push("/(app)/(tabs)/savings") },
    { title: t("advanceBooking") || "Advance Booking", icon: "calendar-outline", gradient: ["#b8860b", "#daa520"], onPress: () => router.push("/(app)/gold_advance") },
    { title: t("billPayments") || "Bill Payment", icon: "calculator-outline", gradient: ["#2b1a10", "#4a2e1b"], onPress: () => router.push("/(app)/bill_payment") },
    { title: t("rewards") || "Rewards", icon: "gift-outline", gradient: ["#0f342b", "#1a5145"], onPress: () => router.push("/(app)/(tabs)/rewards") },
    { title: t("newCollections") || "New Collections", icon: "sparkles-outline", gradient: ["#0f2027", "#203a43"], onPress: () => router.push({ pathname: "/(app)/(tabs)/home", params: { autoTrigger: "collection", redirectOnClose: "dashboard" } }) },
    { title: t("luckyDraw") || "Lucky Draw", icon: "ticket-confirmation-outline", iconType: "material", gradient: ["#301934", "#4a235a"], onPress: () => router.push("/(app)/lucky_draw") },
    { title: t("newSchemes") || "New Schemes", icon: "briefcase-outline", gradient: ["#85203b", "#e05877"], onPress: () => router.push("/(app)/(tabs)/home/schemes") },
    { title: t("savingsHome") || "Savings Home", icon: "home-outline", gradient: ["#023e8a", "#00b4d8"], onPress: () => router.push("/(app)/(tabs)/home") },
  ];

  const handleWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=${theme.constants.whatsapp}`);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${theme.constants.mobile}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {/* Background set to whole container, but image restricted to header now */}

      <SafeAreaView style={styles.safeContainer} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={height < 750}
        >
          {/* Exactly 1:1 Header Curve Section */}
          <View style={[styles.curveArea, { height: hp(35) }]}>
            <LuxuryBackground />
            <View style={styles.headerContentContainer}>
              <Image
                source={require("../../../assets/images/logo.png")}
                style={{ width: rf(200), height: rf(80) }}
                resizeMode="contain"
              />

              <View style={styles.ratesRow}>
                <ResponsiveText variant="body" size="lg" color={PREMIUM_GOLD}>Gold </ResponsiveText>
                <ResponsiveText variant="body" size="lg" color={COLORS.white} weight="bold">₹ {rates?.gold_rate || "9,250"}/g</ResponsiveText>
                <View style={styles.rateDivider} />
                <ResponsiveText variant="body" size="lg" color={PREMIUM_GOLD}>Silver </ResponsiveText>
                <ResponsiveText variant="body" size="lg" color={COLORS.white} weight="bold">₹ {rates?.silver_rate || "108"}/g</ResponsiveText>
              </View>

              <View style={styles.greetingBox}>
                <ResponsiveText variant="title" size="sm" color={COLORS.white} align="center" style={styles.greetingText}>
                  Welcome, {user?.name || user?.username || "Guest"}
                </ResponsiveText>
                <ResponsiveText variant="body" size="lg" color="#CCCCCC" align="center" style={styles.taglineText}>
                  Luxury Meets Excellence
                </ResponsiveText>
              </View>
            </View>

            {/* Visual Curve defined by background image mostly, but keeping subtle overlay if requested */}
          </View>

          {/* The compact 8-card grid follows right under the curve glow */}

          {/* Compact 8-Card Grid */}
          <View style={styles.compactGrid}>
            {cards.map((card, index) => (
              <LuxuryCard
                key={index}
                index={index}
                title={card.title}
                icon={card.icon}
                iconType={(card as any).iconType}
                gradient={(card as any).gradient}
                onPress={card.onPress}
              />
            ))}
          </View>

          {/* Social Footer & Chat Support As Demanded */}
          <View style={styles.compactFooter}>
            <TouchableOpacity
              style={styles.chatSupportBtn}
              onPress={() => setChatOpen(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#D8B07F", "#B8860B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.chatBtnGradient}
              >
                <MaterialCommunityIcons name="chat-processing-outline" size={18} color="#251A18" />
                <ResponsiveText variant="body" size="lg" weight="bold" color="#251A18" style={{ marginLeft: 8 }}>
                  Chat Support
                </ResponsiveText>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.showroomSocials}>
              {/* Updated social badges for higher contrast and proper show */}
              <TouchableOpacity onPress={() => Linking.openURL(socialLinks?.intsa_url || "https://instagram.com")} style={styles.socialIconBadge}>
                <Ionicons name="logo-instagram" size={rf(22)} color="#DAA520" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL(socialLinks?.facebook_url || "https://facebook.com")} style={styles.socialIconBadge}>
                <Ionicons name="logo-facebook" size={rf(22)} color="#DAA520" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL(socialLinks?.twitter_url || "https://youtube.com")} style={styles.socialIconBadge}>
                <Ionicons name="logo-youtube" size={rf(22)} color="#DAA520" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.quaternary },
  safeContainer: { flex: 1 },
  scrollContent: { paddingBottom: hp(5) },
  bgImage: { ...StyleSheet.absoluteFillObject, width, height },

  // Exact Structure Curve
  curveArea: {
    height: hp(34),
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  headerContentContainer: {
    zIndex: 10,
    alignItems: "center",
    paddingTop: hp(2),
  },
  headerCrown: {
    marginBottom: hp(0.5),
  },
  showroomBrand: {
    letterSpacing: 4,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  showroomSubtitle: {
    letterSpacing: 2,
    marginTop: 2,
    marginBottom: hp(2),
  },
  ratesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp(1),
  },
  rateDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 10,
  },
  greetingBox: {
    marginTop: hp(2.5),
  },
  greetingText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: 0.5,
  },
  taglineText: {
    marginTop: 4,
    letterSpacing: 1.5,
  },

  // Grid
  compactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: wp(6),
  },
  luxuryCardWrapper: {
    width: wp(42),
    height: hp(8.5),
    marginBottom: hp(2),
    ...shadowUtils.SHADOW_PRESETS.small,
  },
  luxuryCardInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    overflow: "hidden",
  },
  cardGoldBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(218, 165, 32, 0.3)", // Subtle gold border
    borderRadius: 14,
  },
  luxuryCardContent: {
    alignItems: "center",
  },
  luxuryIconContainer: {
    marginBottom: 4,
  },
  luxuryCardTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: 0.5,
    fontSize: rf(8.5),
  },

  // Socials & Chat
  compactFooter: {
    alignItems: "center",
    marginTop: hp(4),
    marginBottom: hp(2),
  },
  chatSupportBtn: {
    width: wp(45),
    height: hp(4.5),
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: hp(1.5),
    ...shadowUtils.SHADOW_PRESETS.small,
  },
  chatBtnGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  showroomSocials: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: hp(1.5),
  },
  socialIconBadge: {
    marginHorizontal: 12,
    backgroundColor: "#251A18",
    padding: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(218,165,32,0.4)",
    ...shadowUtils.SHADOW_PRESETS.small,
  },
});
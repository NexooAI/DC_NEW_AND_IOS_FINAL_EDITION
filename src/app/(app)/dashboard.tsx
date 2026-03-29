import React, { useRef, useEffect } from "react";
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

const { wp, hp, rf } = responsiveUtils;
const { SHADOW_UTILS } = shadowUtils;
const { width, height } = Dimensions.get("window");

const QUATERNARY_COLOR = theme.colors.quaternary || "#F2E6D2";

// ─── Image Fallback ──────────────────────────────────────────────────────────
let logoImage: any = null;
try {
  logoImage = require("../../../assets/images/logo_trans.png");
} catch (error) {
  console.log("Logo image not found");
}

// ─── Single Card Component ───────────────────────────────────────────────────
const DashboardCard = ({
  title,
  icon,
  onPress,
  gradient,
  iconType = "ionicons",
  index = 0,
}: {
  title: string;
  icon: string;
  onPress: () => void;
  gradient: string[];
  iconType?: "ionicons" | "material";
  index?: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 4 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  };

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={600}
      style={styles.cardWrapper}
    >
      <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ flex: 1 }}
        >
          <Animated.View
            style={[
              styles.cardGlow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3],
                }),
              },
            ]}
          />
          <LinearGradient
            colors={[gradient[0], gradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "transparent", "rgba(0,0,0,0.1)"]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.1)"]}
                  style={styles.iconGradient}
                >
                  {iconType === "ionicons" ? (
                    <Ionicons name={icon as any} size={rf(28)} color={COLORS.white} />
                  ) : (
                    <MaterialCommunityIcons name={icon as any} size={rf(28)} color={COLORS.white} />
                  )}
                </LinearGradient>
              </View>

              <ResponsiveText
                variant="body"
                size="sm"
                weight="bold"
                color={COLORS.white}
                align="center"
                style={styles.cardTitle}
                numberOfLines={2}
              >
                {title}
              </ResponsiveText>

              <View style={styles.cardBorder} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animatable.View>
  );
};

// ─── Floating Orbs Background ───────────────────────────────────────────────
const AnimatedBackground = () => {
  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(moveAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = moveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, width * 0.2, 0],
  });

  const translateY = moveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, height * 0.1, 0],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.backgroundOrb1,
          { transform: [{ translateX }, { translateY }] },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundOrb2,
          {
            transform: [
              { translateX: Animated.multiply(translateX, -1.2) },
              { translateY: Animated.multiply(translateY, -0.8) }
            ]
          },
        ]}
      />
    </View>
  );
};

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  const cards = [
    { title: t("ourSchemes") || "Our Schemes", icon: "diamond-outline", gradient: ["#8a031a", "#b50d29"], onPress: () => router.push("/(app)/(tabs)/savings") },
    { title: t("advanceBooking") || "Advance Booking", icon: "calendar-star", iconType: "material", gradient: ["#b8860b", "#daa520"], onPress: () => router.push("/(app)/gold_advance") },
    { title: t("billPayments") || "Bill Payments", icon: "receipt-outline", gradient: ["#2b1a10", "#4a2e1b"], onPress: () => router.push("/(app)/bill_payment") },
    { title: t("newCollections") || "New Collections", icon: "sparkles-outline", gradient: ["#0f2027", "#203a43"], onPress: () => router.push("/(app)/(tabs)/home") },
    { title: t("rewards") || "Rewards", icon: "gift-outline", gradient: ["#0f342b", "#1a5145"], onPress: () => router.push("/(app)/(tabs)/rewards") },
    { title: t("luckyDraw") || "Lucky Draw", icon: "ticket-confirmation-outline", iconType: "material", gradient: ["#301934", "#4a235a"], onPress: () => router.push("/(app)/lucky_draw") },
    { title: t("newSchemes") || "New Schemes", icon: "folder-open-outline", gradient: ["#85203b", "#e05877"], onPress: () => router.push("/(app)/(tabs)/home/schemes") },
    { title: t("savingsHome") || "Savings Home", icon: "home-outline", gradient: ["#023e8a", "#00b4d8"], onPress: () => router.push("/(app)/(tabs)/home") },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
      <AnimatedBackground />

      <SafeAreaView style={styles.safeContainer} edges={["top"]}>
        <View style={styles.mainWrapper}>
          <View style={styles.header}>
            <Animatable.View animation="zoomIn" duration={1000} style={styles.logoContainer}>
              <View style={styles.logoGlow} />
              {logoImage ? (
                <Image source={logoImage} style={styles.logo} resizeMode="contain" />
              ) : (
                <View style={styles.textLogoContainer}>
                  <ResponsiveText variant="title" weight="bold" color="#DAA520" style={{ fontSize: rf(32) }}>DC</ResponsiveText>
                  <ResponsiveText variant="body" color={theme.colors.textDark} style={{ fontSize: rf(10), letterSpacing: 4 }}>JEWELLERS</ResponsiveText>
                </View>
              )}
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={300} style={{ alignItems: 'center' }}>
              <ResponsiveText variant="title" weight="bold" color={theme.colors.primary} style={styles.welcomeText}>
                Welcome to DC Jewellers
              </ResponsiveText>
              <View style={styles.divider} />
              <ResponsiveText variant="body" color="rgba(0,0,0,0.5)" align="center" style={styles.tagline}>
                Where Luxury Meets Excellence
              </ResponsiveText>
            </Animatable.View>
          </View>

          <View style={styles.grid}>
            {cards.map((card, index) => (
              <DashboardCard
                key={index}
                index={index}
                title={card.title}
                icon={card.icon}
                iconType={card.iconType as any}
                gradient={card.gradient}
                onPress={card.onPress}
              />
            ))}
          </View>

          {/* Social & Support Footer */}
          <View style={styles.footerContainer}>
            <TouchableOpacity style={styles.footerIcon} activeOpacity={0.7}>
              <Ionicons name="logo-facebook" size={rf(20)} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerIcon} activeOpacity={0.7}>
              <Ionicons name="logo-instagram" size={rf(20)} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerIcon} activeOpacity={0.7}>
              <Ionicons name="logo-youtube" size={rf(20)} color={theme.colors.primary} />
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <TouchableOpacity style={styles.supportButton} activeOpacity={0.7}>
              <Ionicons name="headset-outline" size={rf(18)} color={COLORS.white} />
              <Text style={styles.supportText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2E6D2" },
  safeContainer: { flex: 1 },
  mainWrapper: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: hp(2)
  },
  backgroundOrb1: {
    position: "absolute",
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: "rgba(133,1,17,0.06)",
    top: -hp(10),
    left: -wp(20)
  },
  backgroundOrb2: {
    position: "absolute",
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: "rgba(218,165,32,0.04)",
    bottom: hp(10),
    right: -wp(10)
  },
  header: {
    alignItems: "center",
    marginBottom: hp(3),
    paddingHorizontal: wp(5)
  },
  logoContainer: {
    width: wp(40),
    height: wp(30),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(1)
  },
  logoGlow: {
    position: "absolute",
    width: wp(30),
    height: wp(30),
    backgroundColor: "#DAA520",
    opacity: 0.15,
    borderRadius: wp(15),
    transform: [{ scale: 1.4 }]
  },
  logo: {
    width: "100%",
    height: "100%",
    // tintColor: theme.colors.primary, // Make logo match brand primary on light background
  },
  textLogoContainer: { alignItems: "center" },
  welcomeText: {
    textTransform: "uppercase",
    letterSpacing: 2,
    textAlign: "center",
    fontSize: rf(16)
  },
  divider: {
    width: wp(12),
    height: 2,
    backgroundColor: theme.colors.secondary,
    alignSelf: "center",
    marginVertical: hp(1),
    borderRadius: 1
  },
  tagline: {
    fontSize: rf(9),
    letterSpacing: 1.5,
    textTransform: 'uppercase'
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: wp(2),
    rowGap: hp(1.5),
    paddingHorizontal: wp(5)
  },
  cardWrapper: {
    width: wp(28),
    height: hp(14.5), // Reduce height since width is reduced
  },
  cardGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: "#DAA520",
    zIndex: -1
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(1.5)
  },
  iconContainer: {
    width: rf(38),
    height: rf(38),
    borderRadius: rf(19),
    marginBottom: hp(0.5),
    justifyContent: "center",
    alignItems: "center"
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: rf(19)
  },
  cardTitle: {
    textTransform: "uppercase",
    fontSize: rf(8.5),
    letterSpacing: 0.3,
    marginTop: hp(0.5),
    lineHeight: rf(11),
    textAlign: "center"
  },
  cardBorder: {
    marginTop: hp(0.5),
    width: wp(5),
    height: 1.5,
    backgroundColor: "rgba(255,215,0,0.4)",
    borderRadius: 1
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(4),
  },
  footerIcon: {
    backgroundColor: "rgba(218,165,32,0.1)",
    padding: wp(2.5),
    borderRadius: 20,
    marginHorizontal: wp(2),
  },
  footerDivider: {
    width: 1,
    height: hp(3),
    backgroundColor: "rgba(218,165,32,0.3)",
    marginHorizontal: wp(3),
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: 20,
  },
  supportText: {
    color: COLORS.white,
    fontSize: rf(12),
    fontWeight: "bold",
    marginLeft: wp(2),
  },
});
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  AntDesign,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";

const { width, height } = Dimensions.get("window");

interface Milestone {
  year: string;
  title: string;
  icon: string;
  description: string;
  color: string;
}

const milestones: Milestone[] = [
  {
    year: "2020",
    title: "milestone_2020_title", // translation key
    icon: "storefront",
    description: "milestone_2020_desc", // translation key
    color: "#FF6B6B",
  },
  {
    year: "2021",
    title: "milestone_2021_title",
    icon: "store",
    description: "milestone_2021_desc",
    color: "#4ECDC4",
  },
  {
    year: "2022",
    title: "milestone_2022_title",
    icon: "diamond",
    description: "milestone_2022_desc",
    color: "#45B7D1",
  },
  {
    year: "2023",
    title: "milestone_2023_title",
    icon: "smartphone",
    description: "milestone_2023_desc",
    color: "#96CEB4",
  },
  {
    year: "2024",
    title: "milestone_2024_title",
    icon: "public",
    description: "milestone_2024_desc",
    color: "#FFA726",
  },
];

const stats = [
  { number: "4+", label: "Years of Excellence", icon: "emoji-events" },
  { number: "50+", label: "Stores Worldwide", icon: "store" },
  { number: "100K+", label: "Happy Customers", icon: "favorite" },
  { number: "1000+", label: "Unique Designs", icon: "diamond" },
];

export default function AboutUs() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();
  const [activeMilestone, setActiveMilestone] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Helper for unique icon backgrounds
  const getIconBackground = (index: number, color: string) => {
    switch (index % 5) {
      case 0: // Circle
        return { borderRadius: 24, backgroundColor: color + "cc" };
      case 1: // Hexagon (simulate with border)
        return {
          borderRadius: 24,
          backgroundColor: color + "cc",
          borderWidth: 2,
          borderColor: "#fff",
        };
      case 2: // Star (simulate with border)
        return {
          borderRadius: 24,
          backgroundColor: color + "cc",
          borderWidth: 2,
          borderColor: "#fff",
          shadowColor: color,
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        };
      case 3: // Diamond
        return {
          backgroundColor: color + "cc",
          width: 48,
          height: 48,
          justifyContent: "center" as const,
          alignItems: "center" as const,
          transform: [{ rotate: "45deg" }],
        };
      case 4: // Rounded square
        return {
          borderRadius: 12,
          backgroundColor: color + "cc",
        };
      default:
        return { borderRadius: 24, backgroundColor: color + "cc" };
    }
  };

  // MilestoneCard component to allow hooks
  function MilestoneCard({
    item,
    index,
    isActive,
    onPress,
  }: {
    item: Milestone;
    index: number;
    isActive: boolean;
    onPress: () => void;
  }) {
    const bounceAnim = React.useRef(new Animated.Value(0.95)).current;
    React.useEffect(() => {
      if (isActive) {
        Animated.spring(bounceAnim, {
          toValue: 1.08,
          friction: 3,
          tension: 80,
          useNativeDriver: true,
        }).start(() => {
          Animated.spring(bounceAnim, {
            toValue: 1,
            friction: 4,
            tension: 60,
            useNativeDriver: true,
          }).start();
        });
      } else {
        bounceAnim.setValue(0.95);
      }
    }, [isActive]);

    // Alternate left/right for zig-zag effect
    const isLeft = index % 2 === 0;

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "flex-start",
          marginBottom: 40,
          position: "relative",
        }}
      >
        {/* Timeline and node */}
        <View
          style={{
            width: 90,
            alignItems: "center",
            position: "relative",
            height: 120,
          }}
        >
          {/* Vertical line (full height, behind node) */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 44,
              width: 4,
              height: "100%",
              backgroundColor: item.color + "55",
              zIndex: 0,
            }}
          />
          {/* Node (year) */}
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            style={{ zIndex: 2, position: "absolute", top: 20, left: 10 }}
          >
            <Animated.View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: isActive ? item.color : "#fff",
                borderWidth: 4,
                borderColor: isActive ? "#fff" : item.color,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: item.color,
                shadowOpacity: isActive ? 0.25 : 0.12,
                shadowRadius: 10,
                elevation: 8,
                transform: [{ scale: isActive ? bounceAnim : 1 }],
                overflow: "visible",
              }}
            >
              <Text
                style={{
                  color: isActive ? "#fff" : item.color,
                  fontWeight: "bold",
                  fontSize: 14,
                  letterSpacing: 1,
                  textAlign: "center",
                  textAlignVertical: "center",
                  minWidth: 40,
                  maxWidth: 80,
                  includeFontPadding: false,
                }}
                numberOfLines={1}
                ellipsizeMode="clip"
              >
                {item.year}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
        {/* Callout box for milestone details */}
        <View
          style={{
            flex: 1,
            alignItems: isLeft ? "flex-start" : "flex-end",
            paddingLeft: isLeft ? 16 : 0,
            paddingRight: isLeft ? 0 : 16,
            marginTop: 20,
          }}
        >
          <Animated.View
            style={{
              backgroundColor: isActive ? item.color + "18" : "#fff",
              borderRadius: 18,
              padding: 18,
              minWidth: 180,
              maxWidth: 320,
              marginLeft: isLeft ? 0 : 24,
              marginRight: isLeft ? 24 : 0,
              shadowColor: item.color,
              shadowOpacity: isActive ? 0.18 : 0.08,
              shadowRadius: 8,
              elevation: 3,
              borderLeftWidth: isLeft ? 6 : 0,
              borderRightWidth: isLeft ? 0 : 6,
              borderLeftColor: isLeft ? item.color : undefined,
              borderRightColor: isLeft ? undefined : item.color,
              alignItems: isLeft ? "flex-start" : "flex-end",
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: item.color + "cc",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 8,
                alignSelf: isLeft ? "flex-start" : "flex-end",
              }}
            >
              <MaterialIcons name={item.icon as any} size={28} color="#fff" />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: item.color,
                marginBottom: 4,
                textAlign: isLeft ? "left" : "right",
              }}
            >
              {t(item.title)}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: "#444",
                lineHeight: 22,
                textAlign: isLeft ? "left" : "right",
              }}
            >
              {t(item.description)}
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  const renderMilestone = ({
    item,
    index,
  }: {
    item: Milestone;
    index: number;
  }) => (
    <MilestoneCard
      item={item}
      index={index}
      isActive={activeMilestone === index}
      onPress={() => setActiveMilestone(index)}
    />
  );

  const renderStat = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.statIconContainer}>
        <MaterialIcons name={item.icon as any} size={24} color="white" />
      </View>
      <Text style={styles.statNumber}>{item.number}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
    </Animated.View>
  );

  // ListHeaderComponent for FlatList
  const ListHeader = () => (
    <>
      {/* Hero Section */}
      <LinearGradient
        colors={[
          theme.colors.primary,
          theme.colors.primary,
          theme.colors.primary,
        ]}
        style={styles.heroSection}
      >
        {/* Floating Elements */}
        <Animated.View
          style={[
            styles.floatingElement,
            styles.floatingGem1,
            {
              transform: [
                { translateY: slideAnim },
                { rotate: rotateInterpolate },
              ],
              opacity: fadeAnim,
            },
          ]}
        >
          <FontAwesome5 name="gem" size={20} color="rgba(255,255,255,0.3)" />
        </Animated.View>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.floatingGem2,
            {
              transform: [
                { translateY: slideAnim },
                { rotate: rotateInterpolate },
              ],
              opacity: fadeAnim,
            },
          ]}
        >
          <FontAwesome5 name="gem" size={16} color="rgba(255,255,255,0.2)" />
        </Animated.View>
        <Animated.View
          style={[
            styles.heroContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.heroIconContainer}>
            <FontAwesome5 name="star" size={40} color="white" />
          </View>
          <Text style={styles.heroTitle}>{t("aboutus_hero_title")}</Text>
          <Text style={styles.heroSubtitle}>{t("aboutus_hero_subtitle")}</Text>
          <View style={styles.heroDivider} />
        </Animated.View>
      </LinearGradient>
      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>{t("aboutus_achievements")}</Text>
        <FlatList
          data={stats}
          renderItem={renderStat}
          keyExtractor={(item) => item.label}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsList}
          style={styles.statsFlatList}
        />
      </View>
      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Who We Are Section */}
        <Animated.View
          style={[
            styles.contentCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <FontAwesome5 name="gem" size={24} color="white" />
            </View>
            <Text style={styles.sectionTitle}>{t("aboutus_who_we_are")}</Text>
          </View>
          <Text style={styles.sectionText}>{t("aboutus_who_we_are_desc")}</Text>
        </Animated.View>
        {/* Image Section */}
        <Animated.View
          style={[
            styles.imageCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ImageBackground
            source={{ uri: theme.images.store.storeIcon }}
            style={styles.backgroundImage}
            imageStyle={styles.backgroundImageStyle}
          >
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.imageOverlay}
            >
              <Text style={styles.imageText}>{t("aboutus_our_legacy")}</Text>
              <Text style={styles.imageSubtext}>
                {t("aboutus_legacy_years")}
              </Text>
            </LinearGradient>
          </ImageBackground>
        </Animated.View>
        {/* Journey Section Header */}
        <View style={styles.journeySection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <MaterialIcons name="timeline" size={24} color="white" />
            </View>
            <Text style={styles.sectionTitle}>{t("aboutus_our_journey")}</Text>
          </View>
        </View>
      </View>
    </>
  );

  // ListFooterComponent for FlatList
  const ListFooter = () => (
    <>
      {/* Promise Section */}
      <Animated.View
        style={[
          styles.contentCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="diamond" size={24} color="white" />
          </View>
          <Text style={styles.sectionTitle}>{t("aboutus_our_promise")}</Text>
        </View>
        <Text style={styles.sectionText}>{t("aboutus_our_promise_desc")}</Text>
      </Animated.View>
      {/* CTA Button */}
      <Animated.View
        style={[
          styles.ctaButton,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.ctaTouchable}
          onPress={() => router.push("/(tabs)/home/(storeInfo)/contact_us")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[
              theme.colors.primary,
              theme.colors.primary,
              theme.colors.primary,
            ]}
            style={styles.ctaGradient}
          >
            <View style={styles.ctaIconContainer}>
              <FontAwesome5 name="shopping-bag" size={16} color="white" />
            </View>
            <Text style={styles.ctaText}>{t("aboutus_visit_store")}</Text>
            <AntDesign name="arrow-right" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </>
  );

  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        {/* Main FlatList for scrollable content */}
        <FlatList
          data={milestones}
          renderItem={renderMilestone}
          keyExtractor={(item) => item.year}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </AppLayoutWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  heroSection: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: "center",
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 2,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
  },
  heroDivider: {
    width: 60,
    height: 3,
    backgroundColor: "white",
    borderRadius: 2,
  },
  floatingElement: {
    position: "absolute",
    zIndex: 1,
  },
  floatingGem1: {
    top: 50,
    right: 30,
  },
  floatingGem2: {
    bottom: 80,
    left: 20,
  },
  statsContainer: {
    backgroundColor: "white",
    paddingVertical: 25,
    marginTop: -15,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: 140,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsFlatList: {
    flexGrow: 0,
  },
  statCard: {
    alignItems: "center",
    marginHorizontal: 15,
    minWidth: 100,
    backgroundColor: "rgba(123,0,6,0.05)",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 14,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  contentCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  sectionText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  imageCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  backgroundImage: {
    height: 250,
  },
  backgroundImageStyle: {
    borderRadius: 20,
  },
  imageOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  imageText: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  imageSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  journeySection: {
    marginBottom: 20,
  },
  milestonesList: {
    paddingBottom: 20,
  },
  milestoneCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  milestoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  milestoneText: {
    flex: 1,
  },
  milestoneYear: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 2,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  milestoneDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 0,
    borderBottomWidth: 15,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
  },
  ctaButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  ctaTouchable: {
    borderRadius: 16,
    overflow: "hidden",
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  ctaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ctaText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 12,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

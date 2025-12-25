import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  ScrollView,
  Text,
  Alert,
  RefreshControl,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Animated,
  FlatList,
  ActivityIndicator,
  Easing,
  ListRenderItem,
  Linking,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  BackHandler,
} from "react-native";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LanguageSwitcher from "@/contexts/LanguageSwitcher";
import LanguageSelector from "@/components/LanguageSelector";
import LiveRateCard from "@/components/LiveRateCard";
import ImageSlider from "@/components/ImageSlider";
import { useTranslation } from "@/hooks/useTranslation";
// AppHeader is now handled by the layout wrapper
import ProductsList from "@/components/Products";
import FlashOffer from "@/components/FlashOffer";
import YouTubeVideo from "@/components/YouTubeVideo";
import SupportContactCard from "@/components/SupportContactCard";
import SocialMediaCard from "@/components/SocialMediaCard";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import NetInfo from "@react-native-community/netinfo";
import { ScaledSheet, moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import { COLORS } from "src/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FlashBanner from "@/components/FlashBanner";
import { Ionicons } from "@expo/vector-icons";
import StatusView from "@/components/StatusView";
import NotificationService from "@/services/NotificationService";
import { AppLocale } from "@/i18n";
import AuthGuard from "@/components/AuthGuard";
import { getFullImageUrl, formatGoldWeight } from "@/utils/imageUtils";
import { images } from "@/constants/images";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
// Import API logging utilities
import {
  logApiSummary,
  logRecentApiCalls,
  getApiLogs,
  getFailedApiLogs,
  apiLogManager,
  monitorEndpoint,
  checkForContinuousCalls,
} from "@/utils/apiLogger";
import StaticSchemesHorizontalScroll from "@/components/StaticSchemesHorizontalScroll";
import HallmarkSlider from "@/components/HallmarkSlider";

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import ResponsiveText from "@/components/ResponsiveText";
import ResponsiveButton from "@/components/ResponsiveButton";
import { responsiveUtils } from "@/utils/responsiveUtils";
import { shadowUtils } from "@/utils/shadowUtils";
import { animationUtils } from "@/utils/animationUtils";
// Loader replaced with SkeletonLoader for better UX
import {
  getCommonStyles,
  getSpacingValues,
  getBorderRadius,
} from "@/utils/responsiveUtils";
import RatingModal, { useRatingPrompt } from "@/components/RatingModal";
import SkeletonLoader, {
  SkeletonRateCard,
  SkeletonCollection,
  SkeletonImageSlider,
  SkeletonFlashNews,
  SkeletonUserInfoCard,
  SkeletonSchemeCard,
  SkeletonHomePage,
} from "@/components/SkeletonLoader";
import { fetchSchemesWithCache } from "@/utils/apiCache";

// Constants - Using responsive layout hook instead
const REFRESH_INTERVAL = 15000; // 15 seconds

// Responsive constants
const { wp, hp, rf, rp, rm, rb } = responsiveUtils;
const { SHADOW_UTILS } = shadowUtils;
const { ANIMATION_UTILS } = animationUtils;
const spacing = getSpacingValues();
const borderRadius = getBorderRadius();
const commonStyles = getCommonStyles();

// Fallback data
const getDummyData = (t: (key: string) => string) => ({
  rates: {
    gold: {
      price: "7,315",
      purity: "24K",
      image: theme.images.products.gold,
    },
    silver: {
      price: "101.00",
      purity: "999",
      image: theme.images.products.silver,
    },
  },
  sliderImages: [
    require("../../../../../assets/images/slider1.png"),
    require("../../../../../assets/images/slider2.png"),
    require("../../../../../assets/images/slider3.png"),
    require("../../../../../assets/images/slider4.png"),
  ],
  defaultPopups: [
    {
      id: 1,
      title: t("welcomeToDigitalGold"),
      image: require("../../../../../assets/images/slider1.png"),
      description: t("startYourGoldSavingsJourney"),
      actionText: t("getStarted"),
      actionUrl: "/(app)/(tabs)/home/schemes",
    },
    {
      id: 2,
      title: t("specialGoldOffer"),
      image: require("../../../../../assets/images/slider2.png"),
      description: t("limitedTimeOfferOnGoldSchemes"),
      actionText: t("viewOffers"),
      actionUrl: "/(app)/(tabs)/home/schemes",
    },
    {
      id: 3,
      title: t("goldRateUpdates"),
      image: require("../../../../../assets/images/slider2.png"),
      description: t("stayUpdatedWithLiveGoldRates"),
      actionText: t("checkRates"),
      actionUrl: "#", // Live rates page removed
    },
  ],
});

const banners: Banner[] = [
  {
    id: 2,
    image: theme.images.banners.banner,
    schemeUrl: "/(app)/(tabs)/home/schemes",
  },
  {
    id: 3,
    image: theme.images.banners.banner2,
    schemeUrl: "/(app)/(tabs)/home/schemes",
  },
];

// Add default status images
const getDefaultStatusImages = (t: (key: string) => string): Collection[] => [
  {
    id: 1,
    name: t("goldCollection"),
    thumbnail: require("../../../../../assets/images/status1.jpg"),
    status_images: [
      require("../../../../../assets/images/status1.jpg"),
      require("../../../../../assets/images/status2.jpg"),
      require("../../../../../assets/images/status3.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: t("silverCollection"),
    thumbnail: require("../../../../../assets/images/status4.jpg"),
    status_images: [
      require("../../../../../assets/images/status4.jpg"),
      require("../../../../../assets/images/status5.jpg"),
      require("../../../../../assets/images/status6.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: t("diamondCollection"),
    thumbnail: require("../../../../../assets/images/status7.jpg"),
    status_images: [
      require("../../../../../assets/images/status7.jpg"),
      require("../../../../../assets/images/status8.jpg"),
      require("../../../../../assets/images/status9.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: t("platinumCollection"),
    thumbnail: require("../../../../../assets/images/status10.jpg"),
    status_images: [
      require("../../../../../assets/images/status10.jpg"),
      require("../../../../../assets/images/status11.jpg"),
      require("../../../../../assets/images/status12.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: t("exclusiveCollection"),
    thumbnail: require("../../../../../assets/images/status13.jpg"),
    status_images: [
      require("../../../../../assets/images/status13.jpg"),
      require("../../../../../assets/images/status14.jpg"),
      require("../../../../../assets/images/status15.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Interfaces
interface HomeApiResponse {
  success: boolean;
  data: {
    currentRates: {
      gold_rate: string;
      silver_rate: string;
      updated_at: string;
    };
    collections: Collection[];
    posters: Poster[];
    flashNews: FlashNews[];
    introScreen: {
      title: string | null;
      image: string | null;
      startDate: string | null;
      endDate: string | null;
    };
    initialPopups: any[];
    investments:
    | {
      error: boolean;
      message: string;
    }
    | {
      data: any[];
    };
    videos: Video[];
    socialmedia: any[];
  };
}

interface Banner {
  id: number;
  image: any;
  schemeUrl: string;
}

interface Collection {
  id: number;
  name: string;
  thumbnail: string | any;
  status_images: string[] | any[];
  created_at?: string;
  updated_at?: string;
}

interface Poster {
  id: number;
  title: string;
  image: string;
  startDate: string;
  endDate: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

interface FlashNews {
  id: number;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface Video {
  id: number;
  title: string;
  url: string | null;
  created_at: string;
}

interface UserInfoCardProps {
  userName: string | undefined;
  activeSchemesCount: number;
  onPress: () => void;
  totalGoldSavings?: number;
  totalAmount?: number;
  showTotalGold?: boolean;
  userId: number;
  profilePhoto?: string;
  profileImageError?: boolean;
  retryCount?: number;
  onImageError?: () => void;
  onImageLoad?: () => void;
}

// Components
const UserInfoCard: React.FC<UserInfoCardProps> = React.memo(
  ({
    userName,
    activeSchemesCount,
    onPress,
    userId,
    totalGoldSavings = 0,
    totalAmount = 0,
    showTotalGold = true,
    profilePhoto,
    profileImageError = false,
    retryCount = 0,
    onImageError,
    onImageLoad,
  }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const arrowOpacity = useRef(new Animated.Value(1)).current;
    const expandAnimation = useRef(new Animated.Value(0)).current;
    const rotateAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(arrowOpacity, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(arrowOpacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      blink.start();
      return () => blink.stop();
    }, [arrowOpacity]);

    const handleExpandCollapse = () => {
      const newExpandedState = !isExpanded;
      setIsExpanded(newExpandedState);

      // Animate expansion/collapse
      Animated.parallel([
        Animated.timing(expandAnimation, {
          toValue: newExpandedState ? 1 : 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // Height animation needs false
        }),
        Animated.timing(rotateAnimation, {
          toValue: newExpandedState ? 1 : 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true, // Rotation animation can use native driver
        }),
      ]).start();
    };

    const rotateInterpolate = rotateAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    });

    const statsHeight = expandAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 120], // Height of stats section
    });

    const statsOpacity = expandAnimation.interpolate({
      inputRange: [0, 0.1, 1],
      outputRange: [0, 0, 1], // Completely hidden when collapsed
    });

    return (
      <View style={styles.userInfoCard}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.bgPrimaryHeavy]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userInfoGradient}
        >
          <TouchableOpacity
            style={styles.userInfoTopRow}
            onPress={handleExpandCollapse}
            activeOpacity={0.8}
          >
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>{t("welcomeBack")}</Text>
              <Text style={styles.userName}>
                {userName?.toUpperCase() + " "}
                <Text style={styles.userIdText}>( {userId} )</Text>
              </Text>
            </View>
            <View style={styles.userAvatarContainer}>
              {profilePhoto && !profileImageError ? (
                <Image
                  key={`${profilePhoto}-${retryCount}`}
                  source={{ uri: profilePhoto }}
                  style={styles.userAvatar}
                  resizeMode="cover"
                  onLoad={() => {
                    logger.log(
                      "✅ Profile image loaded successfully:",
                      profilePhoto
                    );
                    onImageLoad?.();
                  }}
                  onError={(error) => {
                    logger.log(
                      "❌ Profile image failed to load:",
                      error.nativeEvent,
                      "URL:",
                      profilePhoto,
                      "Retry count:",
                      retryCount
                    );
                    onImageError?.();
                  }}
                />
              ) : (
                <Ionicons
                  name="person-circle"
                  size={45}
                  color={theme.colors.secondary}
                />
              )}
            </View>
            <View style={styles.expandCollopse}>
              <Animated.View
                style={{
                  transform: [{ rotate: rotateInterpolate }],
                }}
              >
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.colors.secondary}
                />
              </Animated.View>
            </View>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.statsRow,
              {
                height: statsHeight,
                opacity: statsOpacity,
                overflow: "hidden",
              },
            ]}
          >
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t("activeInvestments")}</Text>
                <View style={styles.statValue}>
                  <Text style={styles.countText}>
                    {activeSchemesCount || 0}
                  </Text>
                  <Ionicons name="trending-up" size={16} color="#FFD700" />
                </View>
              </View>
              <View style={styles.statDivider} />
              {showTotalGold && (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t("totalGold")}</Text>
                    <View style={styles.statValue}>
                      <Text style={styles.countText}>
                        {formatGoldWeight(totalGoldSavings).replace(" g", "")}
                      </Text>
                      <Text style={styles.unitText}>g</Text>
                    </View>
                  </View>
                  <View style={styles.statDivider} />
                </>
              )}
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t("totalAmount")}</Text>
                <View style={styles.statValue}>
                  <Text style={styles.countText}>
                    ₹{totalAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
          {isExpanded && (
            <TouchableOpacity
              style={styles.viewDetailsContainer}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[
                  theme.colors.secondary,
                  theme.colors.secondary,
                  theme.colors.secondary,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.viewDetailsGradient}
              >
                {/* <Ionicons name="eye-outline" size={20} color="#850111" /> */}
                <Text style={styles.viewDetailsText}>
                  {t("viewInvestmentDetails")}
                </Text>
                <Animated.View
                  style={[
                    styles.doubleArrowContainer,
                    { opacity: arrowOpacity },
                  ]}
                >
                  <Ionicons name="chevron-forward" size={16} color="#850111" />
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#850111"
                    style={styles.secondArrow}
                  />
                </Animated.View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    );
  }
);

// AnimatedGoldRate: Decorative gold rate label with theme color, 22KT, live dot, and last updated timestamp
// AnimatedGoldRate: Decorative gold rate label with theme color, 22KT, live dot, and last updated timestamp
const AnimatedGoldRate: React.FC<{ goldRate: string; updatedAt?: string }> = ({
  goldRate,
  updatedAt,
}) => {
  const { t } = useTranslation();
  // Animation for the live dot opacity
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  // Format timestamp
  const formatDateToIndian = (isoString: string | undefined) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <View style={agrStyles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark || '#8A0F16']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={agrStyles.card}
      >
        <View style={agrStyles.headerRow}>
          <View style={agrStyles.liveBadge}>
            <Animated.View style={[agrStyles.liveDot, { opacity: opacityAnim }]} />
            <Text style={agrStyles.liveText}>{t("goldRate") || "LIVE RATE"}</Text>
          </View>
          <View style={agrStyles.purityBadge}>
            <Ionicons name="diamond-outline" size={12} color="#FFD700" style={{ marginRight: 4 }} />
            <Text style={agrStyles.purityText}>22KT</Text>
          </View>
        </View>

        <View style={agrStyles.priceContainer}>
          <Text style={agrStyles.currencySymbol}>₹</Text>
          <Text style={agrStyles.priceText}>{goldRate}</Text>
          <Text style={agrStyles.perGramText}>/g</Text>
        </View>

        {updatedAt && (
          <View style={agrStyles.footerRow}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={agrStyles.updatedText}>
              Updated: {formatDateToIndian(updatedAt)}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const agrStyles = StyleSheet.create({
  container: {
    width: "90%",
    alignSelf: "center",
    marginVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  card: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  liveText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  purityBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  purityText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "700",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 8,
  },
  currencySymbol: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "600",
    marginRight: 2,
  },
  priceText: {
    color: "#FFF",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  perGramText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  updatedText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontStyle: "italic",
  },
});

// BannerCard component for FlatList renderItem
interface BannerCardProps {
  item: Banner;
  router: ReturnType<typeof useRouter>;
}
const BannerCard: React.FC<BannerCardProps> = ({ item, router }) => {
  const { t } = useTranslation();
  const joinNowScale = useRef(new Animated.Value(1)).current;
  const { screenWidth } = useResponsiveLayout();

  // Create dynamic styles for BannerCard
  const bannerCardStyles = StyleSheet.create({
    bannerCard: {
      backgroundColor: COLORS.white,
      borderRadius: 20,
      marginHorizontal: 5,
      marginBottom: 8,
      shadowColor: COLORS.secondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
      width: screenWidth * 0.85,
      alignItems: "center",
      overflow: "hidden",
      paddingBottom: 16,
    },
    bannerImage: {
      width: screenWidth * 0.85,
      height: 200,
      borderRadius: 20,
    },
  });

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(joinNowScale, {
          toValue: 1.08,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(joinNowScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [joinNowScale]);

  return (
    <View style={bannerCardStyles.bannerCard}>
      <TouchableOpacity
        style={styles.bannerImageWrapper}
        onPress={() => router.push(item.schemeUrl)}
        activeOpacity={0.9}
      >
        <Image
          source={item.image}
          style={bannerCardStyles.bannerImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.bannerButtonRow}>
        <TouchableOpacity
          style={styles.aboutSchemesButton}
          onPress={() => router.push("/(app)/(tabs)/home/schemes")}
          activeOpacity={0.85}
          accessibilityLabel={t("aboutSchemes")}
        >
          <Text style={styles.aboutSchemesButtonText}>{t("aboutSchemes")}</Text>
        </TouchableOpacity>
        <Animated.View
          style={{ flex: 1, transform: [{ scale: joinNowScale }] }}
        >
          <TouchableOpacity
            style={styles.joinNowButton}
            onPress={() => router.push(item.schemeUrl)}
            activeOpacity={0.85}
            accessibilityLabel={t("joinNow") + " - Highlighted"}
            accessibilityHint={
              t("joinNowHint") ||
              "Tap to join the scheme. This button is highlighted for your attention."
            }
          >
            <Text style={styles.joinNowButtonText}>{t("joinNow")}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

// Floating Chat Button Component
import FloatingChatButton from "@/components/FloatingChatButton";

import { logger } from "@/utils/logger";
import DynamicSchemeCard from "@/components/DynamicSchemeCard";
import GoldSilverRateCard from "@/components/GoldSilverRateCard";


export default function Home() {
  const { t } = useTranslation();
  // State
  const { language, user, debugState, setLanguage } = useGlobalStore();

  // App visibility settings
  const {
    visibleData,
    isLoading: isVisibilityLoading,
    isVisible,
    refetch: refetchVisibility,
  } = useAppVisibility();

  // Responsive layout
  const { screenWidth, deviceScale } = useResponsiveLayout();

  // Create dynamic styles with responsive values
  const dynamicStyles = StyleSheet.create({
    bannerCard: {
      backgroundColor: COLORS.white,
      borderRadius: rb(20),
      marginHorizontal: rp(5),
      marginBottom: rp(8),
      ...SHADOW_UTILS.card(),
      width: wp(85),
      alignItems: "center",
      overflow: "hidden",
      paddingBottom: rp(16),
    },
    bannerImage: {
      width: wp(85),
      height: rp(200),
      borderRadius: rb(20),
    },
  });

  // Debug: Check global store state on component mount
  useEffect(() => {
    logger.log("🔍 Home: Component mounted, checking global store state...");
    debugState();
  }, [debugState]);
  const router = useRouter();
  const navigation = useNavigation();
  const { unreadCount } = useUnreadNotifications();
  const [homeData, setHomeData] = useState<HomeApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFlashBanner, setShowFlashBanner] = useState(false);
  const [activeSchemesCount, setActiveSchemesCount] = useState(0);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const [collectionsData, setCollectionsData] = useState<Collection[]>([]);
  const [totalGoldSavings, setTotalGoldSavings] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [flashNews, setFlashNews] = useState<any[]>([]);
  const [sliderImages, setSliderImages] = useState<any[]>([]);
  const [isSliderLoading, setIsSliderLoading] = useState(true);
  const [viewedCollections, setViewedCollections] = useState<{
    [id: number]: boolean;
  }>({});
  const [showTotalGold, setShowTotalGold] = useState(true);
  const [localProfilePhoto, setLocalProfilePhoto] = useState<string | null>(
    null
  );
  const [profileImageError, setProfileImageError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [kycStatus, setKycStatus] = useState<boolean | null>(null);
  const [isKycLoading, setIsKycLoading] = useState(false);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);

  // Scheme Info Modal States
  const [schemeInfoModalVisible, setSchemeInfoModalVisible] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
  const [schemeInfoModalAnimation] = useState(new Animated.Value(0));

  // Rating Modal Hook
  const {
    showRating,
    checkAndShowRating,
    incrementLaunchCount,
    hideRating,
  } = useRatingPrompt();

  // Quick Join Modal States
  const [quickJoinModalVisible, setQuickJoinModalVisible] = useState(false);
  const [quickJoinFormData, setQuickJoinFormData] = useState({
    name: "",
    amount: "",
  });
  const [quickJoinErrors, setQuickJoinErrors] = useState<{ name?: string; amount?: string }>({});
  const [isSubmittingQuickJoin, setIsSubmittingQuickJoin] = useState(false);
  const [calculatedGoldWeight, setCalculatedGoldWeight] = useState<number | null>(null);
  const [branches, setBranches] = useState<Array<{ id: number; branch_name: string }>>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  // Amount limits for selected scheme
  const [schemeAmountLimits, setSchemeAmountLimits] = useState<{
    min_amount: number;
    max_amount: number;
    quickselectedamount: number[];
  } | null>(null);

  // Refs
  const scrollX = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<FlatList<Banner>>(null);
  // Utility functions
  const formatDateToIndian = useCallback(
    (isoString: string | null | undefined) => {
      if (!isoString) return "N/A";
      const date = new Date(isoString);
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    },
    []
  );
  // Get profile photo from local storage
  const getLocalProfilePhoto = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.profile_photo) {
          setLocalProfilePhoto(parsedUser.profile_photo);
        }
      }
    } catch (error) {
      logger.error("Error getting local profile photo:", error);
    }
  };

  // Function to get the best available profile image URL (string) - for UserInfoCard
  const getProfileImageUrl = (): string | undefined => {
    // Priority: 1. Server profileImage, 2. Server profile_photo, 3. Local profile_photo, 4. undefined
    if (user?.profileImage) {
      return getFullImageUrl(user.profileImage);
    } else if ((user as any)?.profile_photo) {
      return getFullImageUrl((user as any).profile_photo);
    } else if (localProfilePhoto) {
      return getFullImageUrl(localProfilePhoto);
    }
    return undefined;
  };

  // Function to get the best available profile image source (object) - for Image component
  const getProfileImageSource = () => {
    // Priority: 1. Server profileImage, 2. Server profile_photo, 3. Local profile_photo, 4. undefined
    logger.log("🔍 Profile Image Debug:", {
      userProfileImage: user?.profileImage,
      userProfilePhoto: (user as any)?.profile_photo,
      localProfilePhoto: localProfilePhoto,
      user: user ? { id: user.id, name: user.name } : null,
    });

    const url = getProfileImageUrl();
    if (url) {
      logger.log("📸 Using profile image:", url);
      return { uri: url };
    }
    logger.log("❌ No profile image available");
    return undefined;
  };

  // Load local profile photo on component mount and when user changes
  useEffect(() => {
    getLocalProfilePhoto();
    setProfileImageError(false); // Reset error state when user changes
    setRetryCount(0); // Reset retry count when user changes
  }, [user]);

  // Profile image handlers
  const handleProfileImageLoad = () => {
    logger.log("✅ Profile image loaded successfully");
    setProfileImageError(false);
    setRetryCount(0);
  };

  const handleProfileImageError = () => {
    logger.log("❌ Profile image failed to load, retry count:", retryCount);
    if (retryCount < 2) {
      setRetryCount((prev) => prev + 1);
      setProfileImageError(false);
    } else {
      setProfileImageError(true);
    }
  };

  // New image source handling
  const getImageSource = (path: string | any) => {
    if (!path) return undefined;
    // If it's a local resource (require statement), return as is
    if (typeof path === "number") return path;
    // If it's a string, use getFullImageUrl to get the URI
    if (typeof path === "string") {
      const url = getFullImageUrl(path);
      return url ? { uri: url } : undefined;
    }
    return undefined;
  };

  // Fetch schemes data
  const fetchSchemesData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      logger.log("🔍 Fetching schemes data...", { forceRefresh });
      const schemesData = await fetchSchemesWithCache(forceRefresh);
      logger.log("✅ Schemes data fetched:", { count: schemesData?.length || 0 });
      return schemesData;
    } catch (error) {
      logger.error("❌ Error fetching schemes data:", error);
      return [];
    }
  }, []);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    try {
      logger.log("🔍 Fetching branches...");
      const response = await api.get(`/branches`, { skipLoading: true } as any);
      logger.log("Branches API response:", response.data);

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setBranches(response.data.data);

        // Auto-select if only one branch
        if (response.data.data.length === 1) {
          setSelectedBranchId(String(response.data.data[0].id));
          logger.log("Auto-selected branch:", response.data.data[0].id);
        } else if (response.data.data.length > 0) {
          // If multiple branches, select the first one by default
          setSelectedBranchId(String(response.data.data[0].id));
          logger.log("Selected first branch:", response.data.data[0].id);
        }
      } else {
        logger.warn("No branches data found in response");
        setBranches([]);
      }
    } catch (error) {
      logger.error("Error fetching branches:", error);
      setBranches([]);
    }
  }, []);

  // Fetch amount limits for a specific scheme
  const fetchSchemeAmountLimits = useCallback(async (schemeId: number) => {
    try {
      logger.log("🔍 Fetching amount limits for scheme:", schemeId);
      const response = await api.get(`/amount-limits/scheme/${schemeId}`, { skipLoading: true } as any);
      logger.log("Amount limits API response:", response.data);

      if (response.data && response.data.data) {
        const limitData = response.data.data;
        // Find active limit
        const activeLimit = Array.isArray(limitData)
          ? limitData.find((limit: any) => limit.is_active === 1)
          : (limitData.is_active === 1 ? limitData : null);

        if (activeLimit) {
          const limits = {
            min_amount: parseFloat(activeLimit.min_amount) || 0,
            max_amount: parseFloat(activeLimit.max_amount) || 0,
            quickselectedamount: activeLimit.quickselectedamount || [],
          };
          setSchemeAmountLimits(limits);
          logger.log("✅ Amount limits set for scheme:", limits);
          return limits;
        } else {
          logger.warn("No active amount limit found for scheme:", schemeId);
          // Fallback: Try to get from home API schemes data
          const { getCachedSchemes } = useGlobalStore.getState();
          const cachedSchemes = getCachedSchemes();
          if (cachedSchemes?.data) {
            const schemeFromHome = cachedSchemes.data.find((s: any) => s.SCHEMEID === schemeId);
            if (schemeFromHome?.amountLimits) {
              logger.log("📦 Using amount limits from home API data");
              const limits = {
                min_amount: schemeFromHome.amountLimits.min_amount || 0,
                max_amount: schemeFromHome.amountLimits.max_amount || 0,
                quickselectedamount: schemeFromHome.quickSelectedAmounts || [],
              };
              setSchemeAmountLimits(limits);
              return limits;
            }
          }
          setSchemeAmountLimits(null);
          return null;
        }
      } else {
        logger.warn("No amount limits data in response");
        // Fallback: Try to get from home API schemes data
        const { getCachedSchemes } = useGlobalStore.getState();
        const cachedSchemes = getCachedSchemes();
        if (cachedSchemes?.data) {
          const schemeFromHome = cachedSchemes.data.find((s: any) => s.SCHEMEID === schemeId);
          if (schemeFromHome?.amountLimits) {
            logger.log("📦 Using amount limits from home API data (fallback)");
            const limits = {
              min_amount: schemeFromHome.amountLimits.min_amount || 0,
              max_amount: schemeFromHome.amountLimits.max_amount || 0,
              quickselectedamount: schemeFromHome.quickSelectedAmounts || [],
            };
            setSchemeAmountLimits(limits);
            return limits;
          }
        }
        setSchemeAmountLimits(null);
        return null;
      }
    } catch (error) {
      logger.error("Error fetching scheme amount limits:", error);
      // Fallback: Try to get from home API schemes data
      const { getCachedSchemes } = useGlobalStore.getState();
      const cachedSchemes = getCachedSchemes();
      if (cachedSchemes?.data) {
        const schemeFromHome = cachedSchemes.data.find((s: any) => s.SCHEMEID === schemeId);
        if (schemeFromHome?.amountLimits) {
          logger.log("📦 Using amount limits from home API data (error fallback)");
          const limits = {
            min_amount: schemeFromHome.amountLimits.min_amount || 0,
            max_amount: schemeFromHome.amountLimits.max_amount || 0,
            quickselectedamount: schemeFromHome.quickSelectedAmounts || [],
          };
          setSchemeAmountLimits(limits);
          return limits;
        }
      }
      setSchemeAmountLimits(null);
      return null;
    }
  }, []);

  // Fetch KYC status
  const fetchKycStatus = useCallback(async () => {
    if (!user || !user.id) {
      logger.log("⚠️ No user or userId available, skipping KYC status fetch");
      setKycStatus(null);
      return;
    }

    try {
      setIsKycLoading(true);
      logger.log("🔍 Fetching KYC status for user:", user.id);
      const response = await api.get(`/kyc/status/${user.id}`, { skipLoading: true } as any);
      logger.log("KYC API response:", response.data);

      // Check if KYC is completed
      // KYC is completed if:
      // 1. kyc_status field is "Completed" (even if data is null)
      // 2. OR response.data.data exists
      if (response.data) {
        const kycStatusValue = response.data.kyc_status;
        const hasKycData = response.data.data;

        if (kycStatusValue === "Completed" || hasKycData) {
          setKycStatus(true);
          logger.log("✅ KYC is completed", {
            kyc_status: kycStatusValue,
            hasData: !!hasKycData
          });
        } else {
          setKycStatus(false);
          logger.log("⚠️ KYC is not completed", {
            kyc_status: kycStatusValue
          });
        }
      } else {
        setKycStatus(false);
        logger.log("⚠️ KYC is not completed - no response data");
      }
    } catch (error) {
      logger.error("Error fetching KYC status:", error);
      // On error, assume KYC is not completed to show the banner
      setKycStatus(false);
    } finally {
      setIsKycLoading(false);
    }
  }, [user]);

  // Fetch investment data separately
  const fetchInvestmentData = useCallback(async () => {
    if (!user || !user.id) {
      logger.log(
        "⚠️ No user or userId available, skipping investment data fetch"
      );
      return;
    }

    try {
      logger.log("🔍 Fetching investment data for user:", user.id);
      const response = await api.get(`investments/user_investments/${user.id}`, { skipLoading: true } as any);
      logger.log("Investment API response:", response.data);

      // Handle different possible response structures
      let investments = [];

      if (response.data && response.data.data) {
        // If response has data.data structure
        investments = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        // If response.data is directly an array
        investments = response.data;
      } else if (response.data && response.data.investments) {
        // If response has investments property
        investments = response.data.investments;
      }

      // Ensure investments is an array
      if (!Array.isArray(investments)) {
        logger.warn("Expected investments to be an array, got:", investments);
        investments = [];
      }

      logger.log("Total investments found:", investments.length);

      setActiveSchemesCount(investments.length || 0);

      // Safely filter investments by schemeType
      const weightBased = investments.filter(
        (inv: any) => inv && inv.scheme && inv.scheme.schemeType === "weight"
      );
      const amountBased = investments.filter(
        (inv: any) => inv && inv.scheme && inv.scheme.schemeType === "amount"
      );

      if (weightBased.length > 0) {
        // Calculate total gold only for weight-based schemes
        const totalGold = weightBased.reduce((sum: number, investment: any) => {
          const goldWeight =
            parseFloat(investment?.totalgoldweight || "0") || 0;
          return sum + goldWeight;
        }, 0);
        setTotalGoldSavings(totalGold);
        setShowTotalGold(true);
      } else {
        setTotalGoldSavings(0);
        setShowTotalGold(false);
      }

      // Calculate total amount for all investments
      const totalAmount = investments.reduce((sum: number, investment: any) => {
        const amount = parseFloat(investment?.total_paid || "0") || 0;
        return sum + amount;
      }, 0);
      setTotalAmount(totalAmount);
    } catch (error) {
      logger.error("Error fetching investment data:", error);
      setActiveSchemesCount(0);
      setTotalGoldSavings(0);
      setTotalAmount(0);
      setShowTotalGold(false);
    }
  }, [user]);

  // Data fetching - Single API call
  const fetchHomeData = useCallback(
    async (isRefreshing = false) => {
      try {
        logger.log("Starting single API data fetch...");
        logger.log("🔍 Current user object:", user);
        logger.log("🔍 User ID from global store:", user?.id);

        const userId = user?.id;
        logger.log("🔍 Using userId for API call:", userId);

        // Only make API call if userId is present
        if (!userId) {
          logger.log("⚠️ No userId available, skipping API call");
          // Set default data when no userId
          setCollectionsData(getDefaultStatusImages(t));
          setSliderImages(
            getDummyData(t).sliderImages.map((image, index) => ({
              id: index,
              image,
              title: `Slider ${index + 1}`,
            }))
          );
          isRefreshing ? setRefreshing(false) : setIsLoading(false);
          setIsSliderLoading(false);
          return;
        }

        isRefreshing ? setRefreshing(true) : setIsLoading(true);
        // Skip global loader - we use skeleton loader instead
        const response = await api.get(`/home?userId=${userId}`, { skipLoading: true } as any);

        if (response.data.success) {
          const data = response.data.data;
          logger.log("Home API response:", data);

          setHomeData(response.data);

          // Set collections data
          if (data.collections && data.collections.length > 0) {
            logger.log(
              "🔍 Home: Using API collections data:",
              data.collections.length,
              "collections"
            );
            logger.log(
              "🔍 Home: First collection sample:",
              data.collections[0]
            );
            setCollectionsData(data.collections);
          } else {
            logger.log("🔍 Home: No collections found, using default images");
            logger.log(
              "🔍 Home: Default images count:",
              getDefaultStatusImages(t).length
            );
            logger.log(
              "🔍 Home: First default collection sample:",
              getDefaultStatusImages(t)[0]
            );
            setCollectionsData(getDefaultStatusImages(t));
          }

          // Set slider images from posters
          if (data.posters && data.posters.length > 0) {
            const images = data.posters.map((poster: Poster) => ({
              id: poster.id,
              image:
                poster.image && poster.image.startsWith("http")
                  ? poster.image
                  : poster.image
                    ? `${theme.baseUrl}${poster.image}`
                    : "",
              title: poster.title || "",
            }));
            setSliderImages(images);
          } else {
            logger.log("No posters found, using dummy images");
            setSliderImages(
              getDummyData(t).sliderImages.map((image, index) => ({
                id: index,
                image,
                title: `Slider ${index + 1}`,
              }))
            );
          }

          // Set flash news
          logger.log(
            "🔍 FlashNews Debug: Checking data.flashNews:",
            data.flashNews
          );
          if (data.flashNews && data.flashNews.length > 0) {
            logger.log(
              "🔍 FlashNews Debug: Found flashNews data:",
              data.flashNews
            );
            const flashArray = data.flashNews
              .map((f: any) => f.title || "")
              .filter((title: any) => title);
            logger.log("🔍 FlashNews Debug: Processed flashArray:", flashArray);
            setFlashNews(flashArray);
          } else {
            logger.log(
              "🔍 FlashNews Debug: No flashNews data found, using fallback"
            );
            // Set fallback flash news messages
            setFlashNews([
              "🎉 Welcome to Digital Gold Savings!",
              "🔥 Gold price updates available!",
              "🌟 Special offers for new users!",
            ]);
          }

          // Log videos data
          if (data.videos && data.videos.length > 0) {
            logger.log("📹 Videos data received from API:", data.videos);
          } else {
            logger.log(
              "📹 No videos data received from API, will use fallback"
            );
          }


          // Store gold rate in AsyncStorage
          if (
            data.currentRates?.gold_rate &&
            typeof data.currentRates.gold_rate === "string"
          ) {
            await AsyncStorage.setItem(
              "gold_rate",
              data.currentRates.gold_rate
            );
          }

          // Store amountLimits in AsyncStorage
          if (data.amountLimits && Array.isArray(data.amountLimits) && data.amountLimits.length > 0) {
            // Find the active amount limit (is_active === 1)
            const activeLimit = data.amountLimits.find((limit: any) => limit.is_active === 1);
            if (activeLimit) {
              await AsyncStorage.setItem(
                "amountLimits",
                JSON.stringify({
                  min_amount: activeLimit.min_amount,
                  max_amount: activeLimit.max_amount,
                  limit_type: activeLimit.limit_type,
                })
              );
              logger.log("Amount limits stored:", activeLimit);
            }
          }
        } else {
          throw new Error("API response indicates failure");
        }
      } catch (error) {
        logger.error("Error in fetchHomeData:", error);
        // Set default data on error
        setCollectionsData(getDefaultStatusImages(t));
        setSliderImages(
          getDummyData(t).sliderImages.map((image, index) => ({
            id: index,
            image,
            title: `Slider ${index + 1}`,
          }))
        );
        Alert.alert(t("error"), t("failedToFetchData"), [
          {
            text: t("retry"),
            onPress: () => fetchHomeData(true),
          },
          {
            text: t("ok"),
            style: "cancel",
          },
        ]);
      } finally {
        isRefreshing ? setRefreshing(false) : setIsLoading(false);
        setIsSliderLoading(false);
      }
    },
    [user?.id]
  );

  // Auto-refresh when screen comes into focus (user navigates back to home)
  const isInitialMount = useRef(true);
  useFocusEffect(
    useCallback(() => {
      // Skip refresh on initial mount (handled by useEffect below)
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      // Refresh data when user navigates back to home page
      logger.log("🔄 Home: Screen focused, auto-refreshing data...");
      const refreshData = async () => {
        try {
          await Promise.all([
            fetchHomeData(true),
            fetchInvestmentData(),
            fetchSchemesData(true), // Force refresh schemes on focus
            fetchKycStatus(), // Refresh KYC status (important for Quick Join flow)
            refetchVisibility(),
          ]);
          logger.log("✅ Home: Auto-refresh completed");
        } catch (error) {
          logger.error("❌ Home: Auto-refresh error:", error);
        }
      };

      refreshData();
    }, [fetchHomeData, fetchInvestmentData, fetchSchemesData, fetchKycStatus, refetchVisibility])
  );

  // Handle back button press with confirmation
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Show confirmation alert
        Alert.alert(
          t("exitApp") || "Exit App",
          t("exitConfirmation") || "Are you sure you want to exit?",
          [
            {
              text: t("cancel") || "Cancel",
              style: "cancel",
              onPress: () => {
                // Do nothing, stay on the page
              },
            },
            {
              text: t("exitApp") || "Exit",
              style: "destructive",
              onPress: () => {
                // Exit the app
                if (Platform.OS === "android") {
                  BackHandler.exitApp();
                } else {
                  // For iOS, you might want to use a different approach
                  // or just allow navigation
                }
              },
            },
          ],
          { cancelable: true }
        );
        // Return true to prevent default back behavior
        return true;
      };

      // Add event listener
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      // Cleanup function
      return () => backHandler.remove();
    }, [t])
  );

  // Effects
  useEffect(() => {
    logger.log("🔍 Home: Initial useEffect triggered");
    logger.log("🔍 Home: User object:", user);
    logger.log("🔍 Home: User ID:", user?.id);
    logger.log("🔍 Home: Is user logged in:", !!user);

    fetchHomeData();
    fetchInvestmentData();
    fetchSchemesData(false); // Use cache if available on initial load
    fetchKycStatus();
    fetchBranches(); // Fetch branches on mount
  }, [fetchHomeData, fetchInvestmentData, fetchSchemesData, fetchKycStatus, fetchBranches, user]);


  useEffect(() => {
    if (user) {
      logger.log("Setting up notifications...");
      NotificationService.sendFcmTokenToApi();
    }
  }, [user]);

  // Rating prompt - show after app launches and user engagement
  useEffect(() => {
    incrementLaunchCount();

    // Show rating prompt after 15 seconds of being on home screen
    const ratingTimer = setTimeout(() => {
      checkAndShowRating();
    }, 15000);

    return () => clearTimeout(ratingTimer);
  }, []);

  // Monitor flash-news endpoint for continuous calls
  useEffect(() => {
    logger.log("🔍 Setting up flash-news endpoint monitoring...");
    const monitoringInterval = monitorEndpoint("/flash-news/active", 10000); // Check every 10 seconds

    // Check for continuous calls every 30 seconds
    const continuousCheckInterval = setInterval(() => {
      const isContinuous = checkForContinuousCalls("/flash-news/active", 3, 1); // 3+ calls in 1 minute
      if (isContinuous) {
        logger.log("🚨 WARNING: Continuous flash-news API calls detected!");
      }
    }, 30000);

    return () => {
      clearInterval(monitoringInterval);
      clearInterval(continuousCheckInterval);
    };
  }, []);

  useEffect(() => {
    const checkBanner = async () => {
      const seen = await AsyncStorage.getItem("flashBannerSeen");
      if (!seen) setShowFlashBanner(true);
    };
    checkBanner();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) {
        Alert.alert(
          t("noInternetTitle"),
          t("noInternetMessage"),
          [
            {
              text: t("retry"),
              onPress: async () => {
                const netState = await NetInfo.fetch();
                if (!netState.isConnected) {
                  Alert.alert(
                    t("noInternetTitle"),
                    t("noInternetMessage"),
                    [{ text: t("retry") }],
                    { cancelable: false }
                  );
                }
              },
            },
          ],
          { cancelable: false }
        );
      }
    });
    return () => unsubscribe();
  }, []);

  // Event handlers
  const handleRefresh = useCallback(async () => {
    // Refresh home data, app visibility settings, and schemes data
    await Promise.all([
      fetchHomeData(true),
      refetchVisibility(),
      fetchSchemesData(true), // Force refresh schemes data on pull-to-refresh
      fetchKycStatus(), // Refresh KYC status
    ]);
  }, [fetchHomeData, refetchVisibility, fetchSchemesData, fetchKycStatus]);

  const handleCloseBanner = useCallback(async () => {
    setShowFlashBanner(false);
    await AsyncStorage.setItem("flashBannerSeen", "true");
  }, []);

  const handleStatusClose = useCallback(() => {
    if (selectedCollection) {
      // Check if all statuses in the selected collection have been viewed
      // We'll use localStorage or a callback from StatusView if you want to persist, but for now, local state only
      setViewedCollections((prev) => ({
        ...prev,
        [selectedCollection.id]: true, // Mark as viewed when closed (for demo, always true)
      }));
    }
    setShowStatus(false);
    setSelectedCollection(null);
  }, [selectedCollection]);


  // API Logging demonstration function
  const demonstrateApiLogging = useCallback(() => {
    logger.log("🔍 DEMONSTRATING API LOGGING FUNCTIONALITY");
    logger.log("==========================================");

    // Log API summary
    logApiSummary();

    // Log recent API calls
    logRecentApiCalls(5);

    // Get all API logs
    const allLogs = getApiLogs();
    logger.log(`📋 Total API logs collected: ${allLogs.length}`);

    // Get failed API logs
    const failedLogs = getFailedApiLogs();
    logger.log(`❌ Failed API calls: ${failedLogs.length}`);

    // Get logs by service
    const mainLogs = apiLogManager.getLogsByService("main");
    const serviceLogs = apiLogManager.getLogsByService("apiService");
    const paymentLogs = apiLogManager.getLogsByService("payment");

    logger.log(`📊 Logs by service:`);
    logger.log(`  Main API: ${mainLogs.length}`);
    logger.log(`  API Service: ${serviceLogs.length}`);
    logger.log(`  Payment Service: ${paymentLogs.length}`);

    // Get slowest endpoints
    const slowestEndpoints = apiLogManager.getSlowestEndpoints(3);
    logger.log("🐌 Slowest endpoints:", slowestEndpoints);

    // Get error-prone endpoints
    const errorProneEndpoints = apiLogManager.getErrorProneEndpoints(3);
    logger.log("⚠️ Error-prone endpoints:", errorProneEndpoints);

    if (__DEV__) {
      // Export logs (for debugging)
      const exportedLogs = apiLogManager.exportLogs();
      logger.log("📤 Exported logs length:", exportedLogs.length);
    }
    // Show alert with summary
    const summary = apiLogManager.getApiSummary();
    Alert.alert(
      t("apiLogsSummary"),
      `${t("totalRequests")}: ${summary.totalRequests}\n` +
      `${t("successful")}: ${summary.successful}\n` +
      `${t("failed")}: ${summary.failed}\n` +
      `${t("avgResponseTime")}: ${summary.averageResponseTime.toFixed(
        2
      )}ms\n\n` +
      `${t("checkConsoleForDetails")}`,
      [{ text: t("ok") }]
    );
  }, []);

  // Language change handler
  const handleLanguageChange = () => {
    setLanguageSelectorVisible(true);
  };

  // Get language display name and image
  const getLanguageDisplayName = () => {
    if (language === "en") {
      return "தமிழ்"; // Tamil in Tamil script
    } else {
      return "English";
    }
  };

  const getLanguageImage = () => {
    if (language === "en") {
      return require("../../../../../assets/images/translate/ta.png");
    } else {
      return require("../../../../../assets/images/translate/eng.png");
    }
  };

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    (navigation as any).openDrawer();
  };

  // Handle notification press
  const handleNotificationPress = () => {
    router.push("/(app)/(tabs)/notifications");
  };

  // Handle scheme info press - Open modal
  const handleSchemeInfoPress = async (scheme: any) => {
    setSelectedScheme(scheme);
    setSchemeInfoModalVisible(true);
    // Animate modal from bottom
    Animated.spring(schemeInfoModalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();

    // Fetch amount limits for this scheme
    if (scheme?.SCHEMEID) {
      await fetchSchemeAmountLimits(Number(scheme.SCHEMEID));
    }
  };

  // Close scheme info modal
  const closeSchemeInfoModal = () => {
    Animated.timing(schemeInfoModalAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSchemeInfoModalVisible(false);
      setSelectedScheme(null);
      setSchemeAmountLimits(null); // Clear amount limits when closing
      // Reset animation value for next open
      schemeInfoModalAnimation.setValue(0);
    });
  };

  // Helper function to get translated text
  const getTranslatedText = (
    textObj: { en: string; ta?: string } | string | undefined | null,
    lang: string
  ): string => {
    if (textObj === null || textObj === undefined || textObj === "") {
      return "";
    }
    if (typeof textObj === "string") {
      return textObj.trim() || "";
    }
    if (typeof textObj === "number") {
      return isNaN(textObj) ? "" : String(textObj);
    }
    if (typeof textObj === "boolean") {
      return String(textObj);
    }
    if (typeof textObj === "object" && textObj !== null) {
      if (textObj.hasOwnProperty("en") || textObj.hasOwnProperty("ta")) {
        const enText = textObj.en || "";
        const taText = textObj.ta || "";
        if (lang === "ta") {
          return taText || enText || "";
        } else {
          return enText || taText || "";
        }
      }
      if (Array.isArray(textObj)) {
        const validItems = textObj.filter(
          (item) => item !== null && item !== undefined && item !== ""
        );
        return validItems.length > 0 ? validItems.join(", ") : "";
      }
      try {
        const stringified = JSON.stringify(textObj);
        return stringified === "{}" || stringified === "[]" ? "" : stringified;
      } catch {
        return "";
      }
    }
    try {
      return String(textObj);
    } catch {
      return "";
    }
  };

  // Helper function to get scheme type for tab
  const getSchemeTypeForTab = (scheme: any): string => {
    // First check if scheme has chits to determine the actual payment frequency
    if (scheme?.chits && Array.isArray(scheme.chits) && scheme.chits.length > 0) {
      const activeChits = scheme.chits.filter(
        (chit: any) => chit && chit.ACTIVE === "Y"
      );
      if (activeChits.length > 0) {
        const paymentFrequencies = activeChits
          .map((chit: any) => chit.PAYMENT_FREQUENCY)
          .filter(Boolean);
        if (paymentFrequencies.length > 0) {
          // Check if any chit is flexi/flexible
          const flexiChits = paymentFrequencies.filter((freq: string) =>
            freq && (freq.toLowerCase().includes("flexi") || freq.toLowerCase().includes("flexible"))
          );
          if (flexiChits.length > 0) {
            return "Flexi";
          }
          // Return the first active payment frequency
          return paymentFrequencies[0] || "Monthly";
        }
      }
    }

    // Fallback to SCHEMETYPE field
    const schemeType = typeof scheme?.SCHEMETYPE === "string"
      ? scheme.SCHEMETYPE.toLowerCase()
      : getTranslatedText(scheme?.SCHEMETYPE as any, language).toLowerCase();

    if (schemeType.includes("flexi") || schemeType.includes("flexible")) {
      return "Flexi";
    } else if (schemeType.includes("daily")) {
      return "Daily";
    } else if (schemeType.includes("weekly")) {
      return "Weekly";
    } else if (schemeType.includes("monthly")) {
      return "Monthly";
    }

    return "Monthly"; // Default fallback
  };

  // Handle Join Schemes button click (same logic as DynamicSchemeCard)
  const handleJoinSchemesPress = async () => {
    if (!selectedScheme) {
      logger.error("Join Schemes - selectedScheme is null");
      return;
    }

    try {
      // Check if schemes page should be skipped
      const showSchemsPage = isVisible("showSchemsPage");

      if (!showSchemsPage) {
        // Skip schemes page and navigate directly
        logger.log("showSchemsPage is 0, skipping schemes page and navigating directly");

        // Determine scheme type and active tab
        const targetTab = getSchemeTypeForTab(selectedScheme);
        const isFlexi = targetTab.toLowerCase() === "flexi";

        // Get relevant chits for the target tab
        const chits = selectedScheme?.chits || [];
        const relevantChits = chits.filter(
          (chit: any) => {
            if (!chit || !chit.PAYMENT_FREQUENCY) return false;
            const chitFreq = chit.PAYMENT_FREQUENCY.toLowerCase().trim();
            const targetTabLower = targetTab.toLowerCase().trim();

            if (chitFreq === targetTabLower) return true;
            if (targetTabLower === "flexi") {
              return chitFreq.includes("flexi") || chitFreq.includes("flexible");
            }
            return false;
          }
        );

        // Prepare scheme data to store
        const schemeDataToStore = {
          schemeId: selectedScheme?.SCHEMEID || 0,
          name: getTranslatedText(selectedScheme?.SCHEMENAME as any, language) || "Unnamed Scheme",
          description: getTranslatedText(selectedScheme?.DESCRIPTION as any, language) || "No description available",
          type: targetTab,
          chits: relevantChits,
          schemeType: isFlexi ? "flexi" : "fixed",
          activeTab: targetTab,
          benefits: selectedScheme?.BENEFITS || [],
          slogan: getTranslatedText(selectedScheme?.SLOGAN || { en: "" }, language) || "",
          image: selectedScheme?.IMAGE || "",
          icon: selectedScheme?.ICON || "",
          durationMonths: selectedScheme?.DURATION_MONTHS || 0,
          metaData: selectedScheme?.table_meta || (selectedScheme as any)?.meta_data || null,
          instant_intrest: (selectedScheme as any)?.instant_intrest || false,
          timestamp: new Date().toISOString(),
          savingType: (selectedScheme as any)?.savingType || ((selectedScheme as any)?.SCHEMETYPE?.toLowerCase() === "weight" ? "weight" : "amount"),
        };

        // Store scheme data in AsyncStorage
        await AsyncStorage.setItem(
          "@current_scheme_data",
          JSON.stringify(schemeDataToStore)
        );

        logger.log("Scheme data stored, navigating directly to:", isFlexi ? "digigold_payment_calculator" : "join_savings");

        // Close modal first
        closeSchemeInfoModal();

        // Navigate directly to the appropriate page
        router.push({
          pathname: "/home/join_savings",
          params: {
            schemeId: (selectedScheme?.SCHEMEID || 0).toString(),
          },
        });
      } else {
        // Normal flow: Navigate to schemes page
        logger.log("showSchemsPage is 1, navigating to schemes page");

        // Determine scheme type for auto-selection
        const targetTab = getSchemeTypeForTab(selectedScheme);

        // Close modal first
        closeSchemeInfoModal();

        router.push({
          pathname: "/(app)/(tabs)/home/schemes",
          params: {
            schemeId: selectedScheme?.SCHEMEID?.toString() || "",
            schemeType: targetTab,
            mode: "join", // Add mode to indicate this is a join action
          },
        });
      }
    } catch (error) {
      logger.error("Error in handleJoinSchemesPress:", error);
      Alert.alert(t("schemes.error") || "Error", t("schemes.failedToLoadSchemeData") || "Failed to load scheme data");
    }
  };

  // Handle Quick Join button click
  const handleQuickJoinPress = async () => {
    // Store the selected scheme before closing modal (to prevent it from being cleared)
    const schemeToUse = selectedScheme;

    // Close the scheme info modal without clearing selectedScheme immediately
    Animated.timing(schemeInfoModalAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSchemeInfoModalVisible(false);
      // Don't clear selectedScheme here - we need it for quick join
    });

    // Fetch amount limits for the selected scheme
    if (schemeToUse?.SCHEMEID) {
      await fetchSchemeAmountLimits(Number(schemeToUse.SCHEMEID));
    }

    // Check KYC status
    if (kycStatus === false) {
      // Show KYC alert
      Alert.alert(
        "KYC Required",
        "KYC not completed please complete",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              // Clear selectedScheme when canceling
              setSelectedScheme(null);
              schemeInfoModalAnimation.setValue(0);
            },
          },
          {
            text: "Update",
            onPress: () => {
              // Keep selectedScheme for when user returns from KYC page
              router.push("/(app)/(tabs)/home/kyc");
            },
          },
        ]
      );
      return;
    }

    // If KYC is completed, open quick join modal
    if (kycStatus === true) {
      // Ensure selectedScheme is set (in case it was cleared)
      if (!selectedScheme && schemeToUse) {
        setSelectedScheme(schemeToUse);
      }

      // Fetch branches if not already fetched
      if (branches.length === 0) {
        await fetchBranches();
      }

      // Pre-fill name from user data
      setQuickJoinFormData({
        name: user?.name || "",
        amount: "",
      });
      setQuickJoinErrors({});
      setCalculatedGoldWeight(null);
      
      // Wait for the scheme info modal to close completely (animation duration is ~250ms)
      // iOS MIGHT fail to open the second modal if the first one is still animating out
      setTimeout(() => {
        setQuickJoinModalVisible(true);
      }, 450);
    } else {
      // KYC status is still loading, wait a bit and check again
      setTimeout(() => {
        if (kycStatus === false) {
          Alert.alert(
            "KYC Required",
            "KYC not completed please complete",
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                  setSelectedScheme(null);
                  schemeInfoModalAnimation.setValue(0);
                },
              },
              {
                text: "Update",
                onPress: () => {
                  router.push("/(app)/(tabs)/home/kyc");
                },
              },
            ]
          );
        }
      }, 500);
    }
  };

  // Calculate gold weight from amount
  const calculateGoldWeight = (amount: string) => {
    if (!amount || !homeData?.data?.currentRates?.gold_rate) {
      setCalculatedGoldWeight(null);
      return;
    }

    const amountValue = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(amountValue) || amountValue <= 0) {
      setCalculatedGoldWeight(null);
      return;
    }

    const goldRate = parseFloat(homeData.data.currentRates.gold_rate.replace(/,/g, ""));
    if (isNaN(goldRate) || goldRate <= 0) {
      setCalculatedGoldWeight(null);
      return;
    }

    // Calculate gold weight: amount / (gold rate per gram)
    // Assuming gold rate is per gram
    const goldWeight = amountValue / goldRate;
    setCalculatedGoldWeight(goldWeight);
  };

  // Handle amount change in quick join modal
  const handleQuickJoinAmountChange = (amount: string) => {
    // Remove non-numeric characters except decimal point
    const cleanedAmount = amount.replace(/[^0-9.]/g, "");
    setQuickJoinFormData((prev) => ({ ...prev, amount: cleanedAmount }));

    // Calculate gold weight if scheme type is weight
    if (selectedScheme?.SCHEMETYPE?.toLowerCase() === "weight") {
      calculateGoldWeight(cleanedAmount);
    } else {
      setCalculatedGoldWeight(null);
    }
  };

  // Validate quick join form
  const validateQuickJoinForm = (): boolean => {
    const errors: { name?: string; amount?: string } = {};

    if (!quickJoinFormData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!quickJoinFormData.amount.trim()) {
      errors.amount = "Amount is required";
    } else {
      const amountValue = parseFloat(quickJoinFormData.amount.replace(/,/g, ""));
      if (isNaN(amountValue) || amountValue <= 0) {
        errors.amount = "Please enter a valid amount";
      } else {
        // Validate against scheme-specific amount limits if available
        // Use <= and >= to allow exact min and max amounts (no rounding)
        if (schemeAmountLimits) {
          if (amountValue < schemeAmountLimits.min_amount) {
            errors.amount = `Minimum amount is ₹${schemeAmountLimits.min_amount.toLocaleString("en-IN")}`;
          } else if (amountValue > schemeAmountLimits.max_amount) {
            errors.amount = `Maximum amount is ₹${schemeAmountLimits.max_amount.toLocaleString("en-IN")}`;
          }
        }
      }
    }

    setQuickJoinErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle quick join submit
  const handleQuickJoinSubmit = async () => {
    if (!validateQuickJoinForm()) {
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not found. Please login again.");
      return;
    }

    if (!selectedScheme) {
      Alert.alert("Error", "Scheme information is missing. Please try again.");
      logger.error("Quick Join - selectedScheme is null", {
        user: user?.id,
        quickJoinFormData,
      });
      return;
    }

    logger.log("Quick Join - Submitting with scheme:", {
      schemeId: selectedScheme.SCHEMEID,
      schemeName: selectedScheme.SCHEMENAME,
      chits: selectedScheme.chits?.length || 0,
    });

    setIsSubmittingQuickJoin(true);

    try {
      // Get the first active chit for the scheme
      const activeChit = selectedScheme.chits?.find(
        (chit: any) => chit.ACTIVE === "Y"
      );

      if (!activeChit) {
        Alert.alert("Error", "No active payment plan found for this scheme");
        setIsSubmittingQuickJoin(false);
        return;
      }

      // Get branch ID (use selected branch or first available)
      let branchId = selectedBranchId;
      if (!branchId && branches.length > 0) {
        branchId = String(branches[0].id);
        logger.log("Using first branch as fallback:", branchId);
      }

      if (!branchId) {
        Alert.alert("Error", "Branch information is missing. Please try again.");
        setIsSubmittingQuickJoin(false);
        return;
      }

      // Prepare investment payload (based on join_savings.tsx structure)
      const payload = {
        userId: user.id,
        schemeId: Number(selectedScheme.SCHEMEID),
        chitId: activeChit.CHITID || null,
        accountName: quickJoinFormData.name.trim(),
        associated_branch: branchId,
        payment_frequency_id: activeChit.PAYMENT_FREQUENCY_ID || null,
      };

      logger.log("Quick Join - Investment API payload:", payload);

      // Call investment API
      const response = await api.post("/investments", payload);
      logger.log("Quick Join - Investment API response:", response.data);

      // Validate response
      if (!response.data || (!response.data.data && !response.data.data?.data)) {
        throw new Error("Invalid API response structure");
      }

      // Extract accountNo and investmentId
      const accountNo =
        response.data.data?.data?.accountNo ||
        response.data.data?.accountNo ||
        response.data.accountNo ||
        null;
      const investmentId =
        response.data.data?.data?.id ||
        response.data.data?.id ||
        response.data.id ||
        null;

      if (!accountNo || !investmentId) {
        throw new Error("Missing account number or investment ID in response");
      }

      // Extract all values from selectedScheme and activeChit before clearing
      const schemeId = Number(selectedScheme.SCHEMEID);
      const schemeType = selectedScheme.SCHEMETYPE?.toLowerCase() || "weight";
      const chitId = activeChit.CHITID || null;
      const paymentFrequency = activeChit.PAYMENT_FREQUENCY || "";

      // Get scheme name (translated if available)
      const schemeName = selectedScheme?.SCHEMENAME
        ? typeof selectedScheme.SCHEMENAME === "string"
          ? selectedScheme.SCHEMENAME
          : selectedScheme.SCHEMENAME[language] ||
          selectedScheme.SCHEMENAME.en ||
          ""
        : "";

      // Create userDetails object (matching join_savings.tsx structure)
      const userDetailsObject = {
        accountname: quickJoinFormData.name.trim(),
        accNo: accountNo,
        associated_branch: branchId,
        name: quickJoinFormData.name.trim(),
        mobile: String(user?.mobile || ""),
        email: user?.email || "",
        userId: user?.id || "",
        investmentId: investmentId,
        schemeId: schemeId,
        schemeType: schemeType,
        schemeName: schemeName,
        paymentFrequency: paymentFrequency,
        chitId: chitId,
      };

      // Validate and stringify userDetails with error handling
      let userDetailsString: string;
      try {
        userDetailsString = JSON.stringify(userDetailsObject);

        // Check size limit (URL params have ~2000 char limit, but we'll be more conservative)
        const maxSize = 1500; // Conservative limit
        if (userDetailsString.length > maxSize) {
          logger.warn("userDetailsString exceeds size limit, removing non-essential fields", {
            size: userDetailsString.length,
            maxSize
          });

          // Create minimal version without optional fields
          const minimalUserDetails = {
            accountname: quickJoinFormData.name.trim(),
            accNo: accountNo,
            associated_branch: branchId,
            userId: user?.id || "",
            investmentId: investmentId,
            schemeId: schemeId,
            schemeType: schemeType,
            paymentFrequency: paymentFrequency,
            chitId: chitId,
          };
          userDetailsString = JSON.stringify(minimalUserDetails);

          if (userDetailsString.length > maxSize) {
            throw new Error(`userDetails still too large after minimization: ${userDetailsString.length} chars`);
          }
        }

        logger.log("Quick Join - userDetailsString prepared successfully", {
          size: userDetailsString.length,
          hasAccountNo: !!accountNo,
          hasInvestmentId: !!investmentId
        });
      } catch (stringifyError) {
        logger.error("Error stringifying userDetails:", stringifyError);
        throw new Error("Failed to prepare navigation data. Please try again.");
      }

      // Store payment session data in global store
      const { storePaymentSession } = useGlobalStore.getState();
      const paymentSessionData = {
        amount: Number(quickJoinFormData.amount.replace(/,/g, "")),
        userDetails: {
          ...userDetailsObject,
          isRetryAttempt: false,
          source: "quick_join",
        },
        timestamp: new Date().toISOString(),
      };

      storePaymentSession(paymentSessionData);
      logger.log("Quick Join - Payment session stored:", paymentSessionData);

      // Extract amount before clearing form data
      const amount = String(quickJoinFormData.amount.replace(/,/g, ""));

      // Close modal and navigate to payment overview
      setQuickJoinModalVisible(false);
      setQuickJoinFormData({ name: "", amount: "" });
      setCalculatedGoldWeight(null);
      setSelectedScheme(null); // Clear selected scheme after successful submission

      // Navigate with all required params (matching join_savings.tsx)
      router.push({
        pathname: "/(app)/(tabs)/home/paymentNewOverView",
        params: {
          amount: amount,
          schemeName: schemeName,
          schemeId: String(schemeId),
          chitId: chitId ? String(chitId) : "",
          paymentFrequency: paymentFrequency,
          schemeType: schemeType,
          userDetails: userDetailsString,
        },
      });
    } catch (error: any) {
      logger.error("Quick Join - Error creating investment:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create investment. Please try again."
      );
    } finally {
      setIsSubmittingQuickJoin(false);
    }
  };

  // Render functions
  const renderBanner: ListRenderItem<Banner> = useCallback(
    ({ item }) => <BannerCard item={item} router={router} />,
    [router]
  );

  const renderStatusItem = useCallback(
    ({ item }: { item: Collection }) => (
      <TouchableOpacity
        style={styles.statusItem}
        onPress={() => {
          if (__DEV__) {
            logger.log("🔍 Home: Status item pressed:", item.name);
            logger.log("🔍 Home: Item thumbnail type:", typeof item.thumbnail);
            logger.log(
              "🔍 Home: Item status_images count:",
              item.status_images?.length
            );
          }
          setSelectedCollection(item);
          setShowStatus(true);
        }}
      >
        <View style={styles.statusItemWrapper}>
          <View
            style={[
              styles.statusImageContainer,
              {
                borderColor: viewedCollections[item.id]
                  ? theme.colors.primary
                  : theme.colors.primary,
              }, // Use theme primary color for both states
            ]}
          >
            <Image
              source={getImageSource(item.thumbnail) ?? undefined}
              style={styles.statusImage}
              resizeMode="cover"
              onError={(e) => {
                logger.error(
                  "Collection thumbnail failed to load:",
                  getImageSource(item.thumbnail),
                  e.nativeEvent
                );
              }}
            />
          </View>
          <ResponsiveText
            variant="caption"
            size="xs"
            color={theme.colors.primary}
            align="center"
            allowWrap={false}
            maxLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
            style={styles.statusItemName}
          >
            {item.name}
          </ResponsiveText>
        </View>
      </TouchableOpacity>
    ),
    [getImageSource, viewedCollections]
  );

  // Show skeleton loading screen while data is being fetched
  if (isLoading) {
    return (
      <View style={styles.fullHeightBackground}>
        {/* Home Page Header Skeleton */}
        <View style={styles.homeHeader}>
          <View style={styles.headerLeft}>
            <SkeletonLoader width={40} height={40} variant="circle" />
            <View style={[styles.headerNameContainer, { marginLeft: rp(12) }]}>
              <SkeletonLoader width={80} height={12} variant="text" />
              <SkeletonLoader width={120} height={16} variant="text" style={{ marginTop: 4 }} />
              <SkeletonLoader width={60} height={10} variant="text" style={{ marginTop: 4 }} />
            </View>
          </View>
          <View style={styles.headerRight}>
            <SkeletonLoader width={32} height={32} variant="circle" />
            <SkeletonLoader width={32} height={32} variant="circle" />
            <SkeletonLoader width={32} height={32} variant="circle" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Rate Cards Skeleton */}
          <View style={styles.goldRateCardWrapper}>
            <View style={skeletonStyles.rateCardContainer}>
              <SkeletonLoader
                width="100%"
                height={120}
                variant="rounded"
                borderRadius={16}
              />
            </View>
          </View>

          {/* Collections Skeleton */}
          <View style={styles.statusContainer}>
            <View style={styles.statusHeader}>
              <View style={styles.statusHeaderLine} />
              <SkeletonLoader width={140} height={18} variant="text" />
              <View style={styles.statusHeaderLine} />
            </View>
            <SkeletonCollection count={5} />
          </View>

          <View style={styles.mainContent}>
            {/* Image Slider Skeleton */}
            <SkeletonImageSlider style={{ marginTop: rp(16) }} />

            {/* Flash News Skeleton */}
            <SkeletonFlashNews style={{ marginTop: rp(16), marginHorizontal: rp(16) }} />

            {/* User Info Card Skeleton */}
            <SkeletonUserInfoCard style={{ marginTop: rp(16) }} />

            {/* Scheme Section Skeleton */}
            <View style={{ marginTop: rp(24), alignItems: "center" }}>
              <View style={styles.statusHeader}>
                <View style={styles.statusHeaderLine} />
                <SkeletonLoader width={100} height={18} variant="text" />
                <View style={styles.statusHeaderLine} />
              </View>
              <SkeletonSchemeCard style={{ marginTop: rp(16) }} />
            </View>

            {/* YouTube Video Skeleton */}
            <View style={{ marginTop: rp(24), paddingHorizontal: rp(16) }}>
              <SkeletonLoader
                width="100%"
                height={200}
                variant="rounded"
                borderRadius={16}
              />
            </View>

            {/* Support Card Skeleton */}
            <View style={{ marginTop: rp(24), paddingHorizontal: rp(16) }}>
              <SkeletonLoader
                width="100%"
                height={100}
                variant="rounded"
                borderRadius={12}
              />
            </View>

            <View style={styles.spacer} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Show message if no user data is available
  if (!user || !user.id) {
    return (
      <>
        <View style={styles.fullHeightBackground}>
            <View style={styles.loadingContainer}>
              <Ionicons
                name="person-circle-outline"
                size={60}
                color={COLORS.secondary}
              />
              <ResponsiveText
                variant="body"
                size="md"
                color={COLORS.white}
                align="center"
                allowWrap={true}
                maxLines={2}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
                style={styles.loadingText}
              >
                {t("pleaseLoginToViewDashboard")}
              </ResponsiveText>
              <ResponsiveButton
                title={t("goToLogin")}
                variant="primary"
                size="lg"
                onPress={() => router.push("/(auth)/login")}
                style={styles.loginButton}
              />
            </View>
        </View>
      </>
    );
  }

  return (
    <AuthGuard>
      <View style={styles.fullHeightBackground}>
        {/* {showFlashBanner && (
          <FlashBanner
            imageSource={images.banners.flashBanner}
            onClose={handleCloseBanner}
          />
        )} */}
        {/* Home Page Header */}
        <View style={styles.homeHeader}>
          {/* Left: Profile Image and Name */}
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.7}
            >
              {getProfileImageSource() && !profileImageError ? (
                <Image
                  source={getProfileImageSource()}
                  style={styles.headerProfileImage}
                  resizeMode="cover"
                  onError={handleProfileImageError}
                  onLoad={handleProfileImageLoad}
                />
              ) : (
                <Ionicons
                  name="person-circle"
                  size={40}
                  color={theme.colors.primary}
                />
              )}
            </TouchableOpacity>
            <View style={styles.headerNameContainer}>
              <ResponsiveText
                variant="caption"
                size="xs"
                weight="normal"
                color={theme.colors.primary}
                allowWrap={false}
                maxLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.7}
                style={styles.headerWelcomeText}
              >
                {t("welcomeBack")}
              </ResponsiveText>
              <ResponsiveText
                variant="body"
                size="md"
                weight="semibold"
                color={theme.colors.primary}
                allowWrap={false}
                maxLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
                style={styles.headerUserName}
              >
                {user?.name?.toUpperCase() || "USER"}
              </ResponsiveText>
              <ResponsiveText
                variant="caption"
                size="xs"
                weight="normal"
                color={theme.colors.primary}
                allowWrap={false}
                maxLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.7}
                style={styles.headerUserId}
              >
                ID: {user?.id || "N/A"}
              </ResponsiveText>
            </View>
          </View>

          {/* Right: Icons */}
          <View style={styles.headerRight}>
            {/* Translate Icon */}
            <TouchableOpacity
              onPress={handleLanguageChange}
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              <View style={styles.languageIconContainer}>
                <Ionicons
                  name="language"
                  size={24}
                  color={theme.colors.primary}
                />
                {/* <Text style={styles.languageIconText}>
                  {language === "en" ? "தமிழ்" : "EN"}
                </Text> */}
              </View>
            </TouchableOpacity>

            {/* Notification Icon */}
            <TouchableOpacity
              onPress={handleNotificationPress}
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={theme.colors.primary}
              />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Menu Icon */}
            <TouchableOpacity
              onPress={handleDrawerToggle}
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="menu"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#FFD700"]}
                tintColor="#FFD700"
              />
            }
          >
            {/* KYC Status Banner - Show only if KYC is not completed */}
            {kycStatus === false && !isKycLoading && (
              <View style={styles.kycBannerContainer}>
                <TouchableOpacity
                  style={styles.kycBanner}
                  onPress={() => router.push("/(app)/(tabs)/home/kyc")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.error, "#a0000f"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.kycBannerGradient}
                  >
                    <View style={styles.kycBannerContent}>
                      <Ionicons name="alert-circle" size={24} color={COLORS.white} />
                      <Text style={styles.kycBannerText}>
                        KYC not Completed click here to complete
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Gold Rate Card Only */}
            {isVisible("showGoldRate") &&
              homeData?.data?.currentRates?.gold_rate && (
                <TouchableOpacity
                  style={styles.goldRateCardWrapper}
                  onPress={() => router.push("/home/ratechart")}
                  activeOpacity={0.9}
                >
                  <AnimatedGoldRate
                    goldRate={homeData.data.currentRates.gold_rate}
                    updatedAt={homeData.data.currentRates.updated_at || ""}
                  />
                </TouchableOpacity>
              )}
            {/* Gold and Silver Rates - Conditionally rendered based on API */}
            {/* {(isVisible("showGoldRate") || isVisible("showSilverRate")) && (
              <View style={styles.ratesContainer}>
                {homeData?.data?.currentRates ? (
                  <>
                    {isVisible("showGoldRate") && (
                      <View
                        style={[
                          styles.rateCard,
                          !homeData.data.currentRates.silver_rate &&
                          styles.singleRateCard,
                        ]}
                      >
                        <LiveRateCard
                          type={translations.gold}
                          rate={
                            homeData.data.currentRates.gold_rate ||
                            getDummyData(t).rates.gold.price
                          }
                          lastupdated={formatDateToIndian(
                            homeData.data.currentRates.updated_at
                          )}
                          image={require("../../../../../assets/images/gold.png")}
                          isSingle={!homeData.data.currentRates.silver_rate}
                        />
                      </View>
                    )}
                    {isVisible("showSilverRate") &&
                      homeData.data.currentRates.silver_rate && (
                        <View style={styles.rateCard}>
                          <LiveRateCard
                            type={translations.silver}
                            rate={homeData.data.currentRates.silver_rate}
                            lastupdated={formatDateToIndian(
                              homeData.data.currentRates.updated_at
                            )}
                            image={require("../../../../../assets/images/silver.png")}
                          />
                        </View>
                      )}
                  </>
                ) : (
                  <View style={styles.rateWarningContainer}>
                    <View style={styles.rateWarningContent}>
                      <Ionicons
                        name="warning"
                        size={24}
                        color={COLORS.secondary}
                      />
                      <View style={styles.rateWarningTextContainer}>
                        <Text style={styles.rateWarningTitle}>
                          {t("liveRatesUnavailable")}
                        </Text>
                        <Text style={styles.rateWarningSubtitle}>
                          {t("pleaseTryAgainLater")}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.rateWarningRates}>
                      <View style={styles.rateWarningRateItem}>
                        <Text style={styles.rateWarningRateLabel}>
                          {t("goldRate")}
                        </Text>
                        <Text style={styles.rateWarningRateValue}>0.00</Text>
                      </View>
                      <View style={styles.rateWarningDivider} />
                      <View style={styles.rateWarningRateItem}>
                        <Text style={styles.rateWarningRateLabel}>
                          {t("silverRate")}
                        </Text>
                        <Text style={styles.rateWarningRateValue}>0.00</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )} */}
            {/* Gold Rate Widget (inline, below FlashOffer) */}
            {/* {homeData?.data?.currentRates?.gold_rate && (
              <AnimatedGoldRate
                goldRate={homeData.data.currentRates.gold_rate}
                updatedAt={homeData.data.currentRates.updated_at}
              />
            )} */}


            {/* Collections Section - Conditionally rendered based on API */}
            {isVisible("showCollection") && (
              <View style={styles.statusContainer}>
                <View style={styles.statusHeader}>
                  <View style={styles.statusHeaderLine} />
                  <Text style={styles.statusHeaderText}>
                    {t("activeCollections")}
                  </Text>
                  <View style={styles.statusHeaderLine} />
                </View>
                <FlatList
                  data={collectionsData}
                  renderItem={renderStatusItem}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.statusListContent}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                />
              </View>
            )}

            <View style={styles.mainContent}>
              {/* Image Slider (Poster) - Conditionally rendered based on API */}
              {isVisible("showPoster") && (
                <>
                  {isSliderLoading ? (
                    <SkeletonImageSlider style={{ marginVertical: rp(8) }} />
                  ) : (
                    <ImageSlider images={sliderImages} />
                  )}
                </>
              )}

              {/* Flash News - Conditionally rendered based on API */}
              {isVisible("showFlashnews") && (
                <FlashOffer
                  // fallbackMessages={[
                  //   "🎉 Welcome to Digital Gold Savings!",
                  //   "🔥 Gold price drops! Invest smart.",
                  //   "🌟 Special offer for new users!",
                  // ]}
                  fallbackMessages={flashNews}
                  onPress={() => {
                    if (__DEV__) {
                      logger.log(t("flashNewsTapped"));
                    }
                  }}
                  textColor={COLORS.white}
                />
              )}
              {/* Customer Card - Conditionally rendered based on API */}
              {isVisible("showCustomerCard") && (
                <UserInfoCard
                  userName={user?.name?.toUpperCase()}
                  activeSchemesCount={activeSchemesCount}
                  totalGoldSavings={totalGoldSavings}
                  totalAmount={totalAmount}
                  showTotalGold={showTotalGold}
                  onPress={() => router.push("/(tabs)/savings")}
                  userId={Number(user?.id) || 0}
                  profilePhoto={getProfileImageUrl()}
                  profileImageError={profileImageError}
                  retryCount={retryCount}
                  onImageLoad={handleProfileImageLoad}
                  onImageError={handleProfileImageError}
                />
              )}

              {/* <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <View style={styles.sectionHeaderLine} />
                  <Text style={styles.sectionHeaderText}>{t('activeSchemes')}</Text>
                  <View style={styles.sectionHeaderLine} />
                </View>
                <Text style={styles.sectionHeaderSubtext}>{t('exploreGoldSavingsPlans')}</Text>
              </View>

              <View style={styles.bannerContainer}>
                <FlatList
                  data={banners}
                  renderItem={renderBanner}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bannerListContent}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                />
              </View> */}
              {/* Our Schemes Section - Conditionally rendered based on API */}
              {isVisible("showSchemes") && (
                <>
                  <View style={styles.statusHeader}>
                    <View style={styles.statusHeaderLine} />
                    <Text style={styles.statusHeaderText}>
                      {t("ourSchemes")}
                    </Text>
                    <View style={styles.statusHeaderLine} />
                  </View>
                  <DynamicSchemeCard
                    onJoinPress={async (scheme) => {
                      // Check if schemes page should be skipped
                      const showSchemsPage = isVisible("showSchemsPage");

                      if (!showSchemsPage) {
                        // Skip schemes page and navigate directly
                        try {
                          // Helper function to get translated text
                          const getTranslatedText = (
                            textObj: { en: string; ta?: string } | string | undefined | null,
                            lang: string
                          ): string => {
                            if (textObj === null || textObj === undefined || textObj === "") {
                              return "";
                            }
                            if (typeof textObj === "string") {
                              return textObj.trim() || "";
                            }
                            if (typeof textObj === "number") {
                              return isNaN(textObj) ? "" : String(textObj);
                            }
                            if (typeof textObj === "boolean") {
                              return String(textObj);
                            }
                            if (typeof textObj === "object" && textObj !== null) {
                              if (textObj.hasOwnProperty("en") || textObj.hasOwnProperty("ta")) {
                                const enText = textObj.en || "";
                                const taText = textObj.ta || "";
                                if (lang === "ta") {
                                  return taText || enText || "";
                                } else {
                                  return enText || taText || "";
                                }
                              }
                              if (Array.isArray(textObj)) {
                                const validItems = textObj.filter(
                                  (item) => item !== null && item !== undefined && item !== ""
                                );
                                return validItems.length > 0 ? validItems.join(", ") : "";
                              }
                              try {
                                const stringified = JSON.stringify(textObj);
                                return stringified === "{}" || stringified === "[]" ? "" : stringified;
                              } catch {
                                return "";
                              }
                            }
                            try {
                              return String(textObj);
                            } catch {
                              return "";
                            }
                          };

                          // Determine scheme type and active tab
                          const chits = scheme?.chits || [];
                          let targetTab = "Monthly";
                          let isFlexi = false;

                          // Check chits to determine payment frequency
                          if (chits.length > 0) {
                            const activeChits = chits.filter(
                              (chit) => chit && chit.ACTIVE === "Y"
                            );
                            if (activeChits.length > 0) {
                              const paymentFrequencies = activeChits
                                .map((chit) => chit.PAYMENT_FREQUENCY)
                                .filter(Boolean);
                              if (paymentFrequencies.length > 0) {
                                const flexiChits = paymentFrequencies.filter(freq =>
                                  freq && (freq.toLowerCase().includes("flexi") || freq.toLowerCase().includes("flexible"))
                                );
                                if (flexiChits.length > 0) {
                                  targetTab = "Flexi";
                                  isFlexi = true;
                                } else {
                                  targetTab = paymentFrequencies[0] || "Monthly";
                                }
                              }
                            }
                          }

                          // Get relevant chits for the target tab
                          const relevantChits = chits.filter(
                            (chit) => {
                              if (!chit || !chit.PAYMENT_FREQUENCY) return false;
                              const chitFreq = chit.PAYMENT_FREQUENCY.toLowerCase().trim();
                              const targetTabLower = targetTab.toLowerCase().trim();

                              if (chitFreq === targetTabLower) return true;
                              if (targetTabLower === "flexi") {
                                return chitFreq.includes("flexi") || chitFreq.includes("flexible");
                              }
                              return false;
                            }
                          );

                          // Prepare scheme data to store
                          const schemeDataToStore = {
                            schemeId: scheme?.SCHEMEID || 0,
                            name: getTranslatedText(scheme?.SCHEMENAME as any, language) || "Unnamed Scheme",
                            description: getTranslatedText(scheme?.DESCRIPTION as any, language) || "No description available",
                            type: targetTab,
                            chits: relevantChits,
                            schemeType: isFlexi ? "flexi" : "fixed",
                            activeTab: targetTab,
                            benefits: (scheme as any)?.BENEFITS || [],
                            slogan: getTranslatedText((scheme as any)?.SLOGAN || { en: "" }, language) || "",
                            image: scheme?.IMAGE || "",
                            icon: scheme?.ICON || "",
                            durationMonths: scheme?.DURATION_MONTHS || 0,
                            metaData: scheme?.table_meta || (scheme as any)?.meta_data || null,
                            instant_intrest: (scheme as any)?.instant_intrest || false,
                            timestamp: new Date().toISOString(),
                            savingType: (scheme as any)?.savingType || ((scheme as any)?.SCHEMETYPE?.toLowerCase() === "weight" ? "weight" : "amount"),
                          };

                          // Store scheme data in AsyncStorage
                          await AsyncStorage.setItem(
                            "@current_scheme_data",
                            JSON.stringify(schemeDataToStore)
                          );

                          // Navigate directly to the appropriate page
                          // if (isFlexi) {
                          //   router.push({
                          //     pathname: "/home/digigold_payment_calculator",
                          //     params: {
                          //       schemeId: ((scheme?.SCHEMEID || 0)).toString(),
                          //     },
                          //   });
                          // } else {
                            router.push({
                              pathname: "/home/join_savings",
                              params: {
                                schemeId: ((scheme?.SCHEMEID || 0)).toString(),
                              },
                            });
                          // }
                        } catch (error) {
                          logger.error("Error in onJoinPress (skip schemes):", error);
                          Alert.alert(t("schemes.error") || "Error", t("schemes.failedToLoadSchemeData") || "Failed to load scheme data");
                        }
                      } else {
                        // Normal flow: Navigate to schemes page
                        router.push({
                          pathname: "/(app)/(tabs)/home/schemes",
                          params: {
                            schemeId: scheme?.SCHEMEID?.toString() || "",
                            schemeType: scheme?.SCHEMETYPE || "",
                          },
                        });
                      }
                    }}
                    onInfoPress={handleSchemeInfoPress}
                    showDots={false}
                    visibilityFlags={{
                      showFlexiScheme: isVisible("showFlexiScheme"),
                      showFixedScheme: isVisible("showFixedScheme"),
                      showDailyScheme: isVisible("showDailyScheme"),
                      showWeeklyScheme: isVisible("showWeeklyScheme"),
                      showMonthlyScheme: isVisible("showMonthlyScheme"),
                    }}
                  />

                  {/* <DynamicSchemeCard
                    onJoinPress={(scheme) => {
                      console.log(
                        "Join button pressed, navigating to schemes page"
                      );
                      Alert.alert(
                        "Navigation",
                        "Navigating to schemes page...",
                        [
                          {
                            text: "OK",
                            onPress: () =>
                              router.push("/(app)/(tabs)/home/schemes"),
                          },
                        ]
                      );
                    }}
                    onInfoPress={(scheme) => {
                      // Enhanced null/undefined handling for scheme data
                      const safeText = (textObj: any): string => {
                        // Handle null, undefined, empty string, or falsy values
                        if (
                          textObj === null ||
                          textObj === undefined ||
                          textObj === ""
                        ) {
                          return "";
                        }

                        // Handle strings
                        if (typeof textObj === "string") {
                          return textObj.trim() || "";
                        }

                        // Handle numbers
                        if (typeof textObj === "number") {
                          return isNaN(textObj) ? "" : textObj.toString();
                        }

                        // Handle boolean
                        if (typeof textObj === "boolean") {
                          return textObj.toString();
                        }

                        // Handle objects with en/ta keys
                        if (typeof textObj === "object" && textObj !== null) {
                          // Check if it's a valid object with language keys
                          if (
                            textObj.hasOwnProperty("en") ||
                            textObj.hasOwnProperty("ta")
                          ) {
                            const enText = textObj.en || "";
                            const taText = textObj.ta || "";

                            // Use current language preference or fallback to en
                            return enText || taText || "";
                          }

                          // Handle arrays
                          if (Array.isArray(textObj)) {
                            const validItems = textObj.filter(
                              (item) =>
                                item !== null &&
                                item !== undefined &&
                                item !== ""
                            );
                            return validItems.length > 0
                              ? validItems.join(", ")
                              : "";
                          }

                          // Handle other objects - convert to string safely
                          try {
                            const stringified = JSON.stringify(textObj);
                            return stringified === "{}" || stringified === "[]"
                              ? ""
                              : stringified;
                          } catch {
                            return "";
                          }
                        }

                        // Fallback for any other type
                        try {
                          return String(textObj);
                        } catch {
                          return "";
                        }
                      };

                      // Safe logging with fallback
                      const schemeName = safeText(scheme?.SCHEMENAME);
                      logger.log("Info:", schemeName || "Unknown Scheme");
                    }}
                    showDots={false}
                    visibilityFlags={{
                      showFlexiScheme: isVisible("showFlexiScheme"),
                      showFixedScheme: isVisible("showFixedScheme"),
                      showDailyScheme: isVisible("showDailyScheme"),
                      showWeeklyScheme: isVisible("showWeeklyScheme"),
                      showMonthlyScheme: isVisible("showMonthlyScheme"),
                    }}
                  /> */}
                </>
              )}

              {/* YouTube Video - Conditionally rendered based on API */}
              {isVisible("showYoutube") && (
                <YouTubeVideo videos={homeData?.data?.videos} />
              )}

              {/* Social Media Card - Conditionally rendered based on API */}

              {/* Support Contact Card - Conditionally rendered based on API */}
              {isVisible("showSupportCard") && <SupportContactCard />}
              {isVisible("showSocialMedia") && (
                <SocialMediaCard
                  socialMediaUrls={homeData?.data?.socialmedia}
                />
              )}
              {/* Hallmark Images Section - Conditionally rendered based on API */}
              {isVisible("showHallmark") && <HallmarkSlider />}

              {/* Debug buttons for development */}
              {__DEV__ && (
                <View style={styles.poweredByContainer}>
                  <TouchableOpacity
                    style={styles.debugButton}
                    onPress={() => router.push("/(app)/(tabs)/app_visibility")}
                  >
                    <Text style={styles.debugButtonText}>
                      App Visibility Settings
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Powered by Section */}
              <View style={styles.poweredByContainer}>
                <TouchableOpacity
                  style={styles.poweredByButton}
                  onPress={() => Linking.openURL("http://agnisofterp.com/")}
                >
                  <Text style={styles.poweredByText}>{t("poweredBy")}</Text>
                  <Text style={styles.poweredByLink}>agnisofterp.com</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.spacer} />
            </View>
          </ScrollView>

          <StatusView
            collections={collectionsData}
            isVisible={showStatus}
            initialCollectionIndex={(() => {
              if (selectedCollection) {
                const idx = collectionsData.findIndex(
                  (c) => String(c.id) === String(selectedCollection.id)
                );
                return idx >= 0 ? idx : 0;
              }
              return 0;
            })()}
            onClose={handleStatusClose}
          />
          {/* Floating Chat Button - Conditionally rendered based on API */}
          {isVisible("showLiveChatBox") && <FloatingChatButton />}

          {/* Scheme Info Modal */}
          <Modal
            visible={schemeInfoModalVisible}
            transparent={true}
            animationType="none"
            onRequestClose={closeSchemeInfoModal}
            statusBarTranslucent={true}
          >
            <View style={styles.schemeInfoModalOverlay}>
              <TouchableOpacity
                style={styles.schemeInfoModalBackdrop}
                activeOpacity={1}
                onPress={closeSchemeInfoModal}
              />
              <Animated.View
                style={[
                  styles.schemeInfoModalContainer,
                  {
                    transform: [
                      {
                        translateY: schemeInfoModalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [Dimensions.get("window").height, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <SafeAreaView style={styles.schemeInfoModalContent} edges={["top"]}>
                  {/* Header */}
                  <View style={styles.schemeInfoModalHeader}>
                    <Text style={styles.schemeInfoModalTitle}>
                      {selectedScheme?.SCHEMENAME
                        ? typeof selectedScheme.SCHEMENAME === "string"
                          ? selectedScheme.SCHEMENAME
                          : selectedScheme.SCHEMENAME[language] ||
                          selectedScheme.SCHEMENAME.en ||
                          "Scheme Info"
                        : "Scheme Info"}
                    </Text>
                    <TouchableOpacity
                      onPress={closeSchemeInfoModal}
                      style={styles.schemeInfoModalCloseButton}
                    >
                      <Ionicons name="close" size={28} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>

                  {/* Content */}
                  <ScrollView
                    style={styles.schemeInfoModalScrollView}
                    contentContainerStyle={styles.schemeInfoModalScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Scheme Description */}
                    {selectedScheme?.DESCRIPTION && (
                      <View style={styles.schemeInfoSection}>
                        <Text style={styles.schemeInfoSectionTitle}>
                          {t("description") || "Description"}
                        </Text>
                        <Text style={styles.schemeInfoSectionText}>
                          {typeof selectedScheme.DESCRIPTION === "string"
                            ? selectedScheme.DESCRIPTION
                            : selectedScheme.DESCRIPTION[language] ||
                            selectedScheme.DESCRIPTION.en ||
                            ""}
                        </Text>
                      </View>
                    )}

                    {/* Scheme Table */}
                    {selectedScheme?.table_meta &&
                      selectedScheme.table_meta.headers &&
                      selectedScheme.table_meta.rows &&
                      Array.isArray(selectedScheme.table_meta.rows) &&
                      selectedScheme.table_meta.rows.length > 0 && (
                        <View style={styles.schemeInfoSection}>
                          <Text style={styles.schemeInfoSectionTitle}>
                            {t("schemeDetails") || "Scheme Details"}
                          </Text>
                          <View style={styles.tableContainer}>
                            <View style={styles.tableHeader}>
                              {(
                                (selectedScheme.table_meta.headers as any)?.[language] ||
                                (selectedScheme.table_meta.headers as any)?.en ||
                                []
                              ).map((header: string, index: number) => (
                                <Text key={index} style={styles.tableHeaderText}>
                                  {header || ""}
                                </Text>
                              ))}
                            </View>
                            {selectedScheme.table_meta.rows.map(
                              (row: Record<string, any>, rowIndex: number) => (
                                <View
                                  key={rowIndex}
                                  style={[
                                    styles.tableRow,
                                    rowIndex % 2 === 0
                                      ? styles.tableRowEven
                                      : styles.tableRowOdd,
                                  ]}
                                >
                                  {Object.values(row).map(
                                    (cell: any, cellIndex: number) => (
                                      <Text
                                        key={cellIndex}
                                        style={styles.tableCell}
                                      >
                                        {typeof cell === "string"
                                          ? cell
                                          : typeof cell === "number"
                                            ? String(cell)
                                            : cell?.[language] ||
                                            cell?.en ||
                                            ""}
                                      </Text>
                                    )
                                  )}
                                </View>
                              )
                            )}
                          </View>
                        </View>
                      )}

                    {/* Scheme Benefits */}
                    {selectedScheme?.BENEFITS &&
                      Array.isArray(selectedScheme.BENEFITS) &&
                      selectedScheme.BENEFITS.length > 0 && (
                        <View style={styles.schemeInfoSection}>
                          <Text style={styles.schemeInfoSectionTitle}>
                            {t("keyBenefits") || "Key Benefits"}
                          </Text>
                          {selectedScheme.BENEFITS.map((benefit: string, index: number) => (
                            <View key={index} style={styles.benefitItem}>
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={theme.colors.secondary}
                              />
                              <Text style={styles.benefitText}>{benefit}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                    {/* Scheme Type */}
                    {selectedScheme?.SCHEMETYPE && (
                      <View style={styles.schemeInfoSection}>
                        <Text style={styles.schemeInfoSectionTitle}>
                          {t("schemeType") || "Scheme Type"}
                        </Text>
                        <Text style={styles.schemeInfoSectionText}>
                          {typeof selectedScheme.SCHEMETYPE === "string"
                            ? selectedScheme.SCHEMETYPE
                            : selectedScheme.SCHEMETYPE[language] ||
                            selectedScheme.SCHEMETYPE.en ||
                            ""}
                        </Text>
                      </View>
                    )}
                  </ScrollView>

                  {/* Footer Buttons */}
                  <View style={styles.schemeInfoModalFooter}>
                    <TouchableOpacity
                      style={styles.quickJoinButton}
                      onPress={handleQuickJoinPress}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[theme.colors.secondary, "#FFD700"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.quickJoinButtonGradient}
                      >
                        <Ionicons name="flash" size={20} color={COLORS.dark} />
                        <Text style={styles.quickJoinButtonText}>
                          {t("quickJoin") || "Quick Join"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.joinSchemesButton}
                      onPress={handleJoinSchemesPress}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[theme.colors.primary, theme.colors.bgPrimaryHeavy]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.joinSchemesButtonGradient}
                      >
                        <Text style={styles.joinSchemesButtonText}>
                          {t("joinThisSchemes") || "Join this Schemes"}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </SafeAreaView>
              </Animated.View>
            </View>
          </Modal>

          {/* Quick Join Modal */}
          <Modal
            visible={quickJoinModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setQuickJoinModalVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles2.modalOverlay}
            >
              <View style={styles2.modalContainer}>
                {/* Header */}
                <View style={styles2.header}>
                  <View style={styles2.headerContent}>
                    <Text style={styles2.title}>
                      {t("quickJoin") || "Quick Join"}
                    </Text>
                    <Text style={styles2.subtitle}>
                      {t("joinThisSchemeStartSaving") || "Join scheme and start saving"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setQuickJoinModalVisible(false);
                      setSelectedScheme(null);
                      setSchemeAmountLimits(null);
                    }}
                    style={styles2.closeButton}
                  >
                    <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles2.scrollView}
                  contentContainerStyle={styles2.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Name Input */}
                  <View style={styles2.inputSection}>
                    <View style={styles2.inputHeader}>
                      <Text style={styles2.inputLabel}>
                        {t("name") || "Full Name"}
                      </Text>
                      <Text style={styles2.required}>*</Text>
                    </View>
                    <View style={[
                      styles2.inputContainer,
                      quickJoinErrors.name && styles2.inputError
                    ]}>
                      <Ionicons name="person" size={20} color={COLORS.mediumGrey} />
                      <TextInput
                        style={styles2.textInput}
                        value={quickJoinFormData.name}
                        onChangeText={(text) =>
                          setQuickJoinFormData((prev) => ({ ...prev, name: text }))
                        }
                        placeholder={t("enterName") || "Enter your full name"}
                        placeholderTextColor={COLORS.mediumGrey}
                      />
                    </View>
                    {quickJoinErrors.name && (
                      <View style={styles2.errorContainer}>
                        <Ionicons name="warning" size={14} color={COLORS.error} />
                        <Text style={styles2.errorText}>{quickJoinErrors.name}</Text>
                      </View>
                    )}
                  </View>

                  {/* Amount Input */}
                  <View style={styles2.inputSection}>
                    <View style={styles2.inputHeader}>
                      <Text style={styles2.inputLabel}>
                        {t("amount") || "Investment Amount"}
                      </Text>
                      <Text style={styles2.required}>*</Text>
                    </View>

                    {schemeAmountLimits && (
                      <View style={styles2.amountHint}>
                        <Ionicons name="information-circle" size={14} color={theme.colors.primary} />
                        <Text style={styles2.amountHintText}>
                          Min: ₹{schemeAmountLimits.min_amount.toLocaleString("en-IN")} • Max: ₹{schemeAmountLimits.max_amount.toLocaleString("en-IN")}
                        </Text>
                      </View>
                    )}

                    <View style={[
                      styles2.inputContainer,
                      quickJoinErrors.amount && styles2.inputError
                    ]}>
                      <Ionicons name="wallet" size={20} color={COLORS.mediumGrey} />
                      <TextInput
                        style={styles2.textInput}
                        value={quickJoinFormData.amount}
                        onChangeText={handleQuickJoinAmountChange}
                        placeholder={t("enterAmount") || "Enter investment amount"}
                        placeholderTextColor={COLORS.mediumGrey}
                        keyboardType="numeric"
                      />
                      <Text style={styles2.currencySymbol}>₹</Text>
                    </View>
                    {quickJoinErrors.amount && (
                      <View style={styles2.errorContainer}>
                        <Ionicons name="warning-outline" size={14} color={COLORS.error} />
                        <Text style={styles2.errorText}>{quickJoinErrors.amount}</Text>
                      </View>
                    )}
                  </View>

                  {/* Gold Weight Display */}
                  {selectedScheme?.savingType === 'weight' && (
                    <View style={styles2.goldWeightCard}>
                      <View style={styles2.goldWeightHeader}>
                        <Ionicons name="cube-outline" size={20} color={COLORS.warning} />
                        <Text style={styles2.goldWeightLabel}>
                          {t("estimatedGoldWeight") || "Estimated Gold Weight"}
                        </Text>
                      </View>
                      <Text style={styles2.goldWeightValue}>
                        {formatGoldWeight(Number(quickJoinFormData.amount) / Number(homeData?.data?.currentRates?.gold_rate || 0))}
                      </Text>
                    </View>
                  )}

                  {/* Quick Select Amount Buttons */}
                  {(schemeAmountLimits?.quickselectedamount?.length ?? 0) > 0 && (
                    <View style={styles2.quickSelectSection}>
                      <Text style={styles2.quickSelectLabel}>
                        {t("quickSelect") || "Quick Select Amount"}
                      </Text>
                      <View style={styles2.quickSelectGrid}>
                        {schemeAmountLimits?.quickselectedamount
                          ?.filter((amt) => amt >= (schemeAmountLimits?.min_amount ?? 0) && amt <= (schemeAmountLimits?.max_amount ?? Infinity))
                          .map((amount, index) => (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles2.quickAmountButton,
                                quickJoinFormData.amount === String(amount) && styles2.quickAmountButtonActive,
                              ]}
                              onPress={() => {
                                setQuickJoinFormData((prev) => ({ ...prev, amount: String(amount) }));
                                handleQuickJoinAmountChange(String(amount));
                              }}
                            >
                              <Text style={[
                                styles2.quickAmountText,
                                quickJoinFormData.amount === String(amount) && styles2.quickAmountTextActive,
                              ]}>
                                ₹{amount.toLocaleString("en-IN")}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Submit Button */}
                <View style={styles2.footer}>
                  <TouchableOpacity
                    style={[
                      styles2.submitButton,
                      isSubmittingQuickJoin && styles2.submitButtonDisabled,
                    ]}
                    onPress={handleQuickJoinSubmit}
                    disabled={isSubmittingQuickJoin}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={
                        isSubmittingQuickJoin
                          ? [COLORS.mediumGrey, COLORS.mediumGrey]
                          : [theme.colors.primary, theme.colors.bgPrimaryHeavy]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles2.submitGradient}
                    >
                      {isSubmittingQuickJoin ? (
                        <View style={styles2.loadingContainer}>
                          <ActivityIndicator size="small" color={COLORS.white} />
                          <Text style={styles2.submitButtonText}>
                            {t("submitting") || "Processing..."}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles2.submitContent}>
                          <Text style={styles2.submitButtonText}>
                            {t("submit") || "Join Scheme"}
                          </Text>
                          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

        </View>

      </View>

      {/* Rating Modal */}
      <RatingModal
        visible={showRating}
        onClose={hideRating}
        onSubmitFeedback={(rating, feedback) => {
          logger.log("📝 User rating feedback:", { rating, feedback });
          // You can send this to your API if needed
        }}
        appName="DC Jewellers"
      />
        <LanguageSelector
          visible={languageSelectorVisible}
          onClose={() => setLanguageSelectorVisible(false)}
        />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  fullHeightBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.tertiary,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  mainContainer: {
    flex: 1,
    zIndex: 1,
    elevation: 1,
  },
  headerWrapper: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  homeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: rp(16),
    paddingVertical: rp(12),
    paddingTop: Platform.OS === "ios" ? rp(12) : rp(12),
    backgroundColor: "transparent",
    zIndex: 10,
    elevation: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImageContainer: {
    marginRight: rp(12),
  },
  headerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  headerNameContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  headerWelcomeText: {
    fontSize: rf(11, { minSize: 9, maxSize: 13 }),
    fontWeight: "400",
    opacity: 0.7,
    marginBottom: 2,
  },
  headerUserName: {
    fontSize: rf(16, { minSize: 14, maxSize: 18 }),
    fontWeight: "600",
    marginBottom: 2,
  },
  headerUserId: {
    fontSize: rf(12, { minSize: 10, maxSize: 14 }),
    fontWeight: "400",
    opacity: 0.8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: rp(12),
  },
  headerIconButton: {
    padding: rp(8),
    position: "relative",
  },
  languageIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  languageIconText: {
    fontSize: rf(12, { minSize: 10, maxSize: 14 }),
    fontWeight: "600",
    color: theme.colors.primary,
    marginLeft: 2,
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "stretch", // Changed from "center" to "stretch" for edge-to-edge
    paddingVertical: rp(10),
    paddingTop: rp(5),
    paddingBottom: rp(80), // Add bottom padding to prevent overlap with tab bar (60px tab bar + 20px safe area)
    zIndex: 1,
    elevation: 1,
  },
  goldRateCardWrapper: {
    marginTop: rp(5),
    marginBottom: rp(5),
  },
  ratesContainer: {
    paddingHorizontal: rp(16),
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 0,
    marginTop: rp(10),
    zIndex: 1,
    elevation: 1,
  },
  rateCard: {
    flex: 1,
    margin: rp(5),
    alignItems: "center",
    maxWidth: wp(45),
    zIndex: 1,
    elevation: 1,
  },
  singleRateCard: {
    maxWidth: wp(60),
    zIndex: 1,
    elevation: 1,
  },
  mainContent: {
    ...commonStyles.container,
    alignItems: "center",
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  loadingText: {
    textAlign: "center",
    color: COLORS.white,
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    paddingVertical: spacing.lg,
  },
  spacer: {
    height: spacing.xxxl * 2,
  },
  languageSwitcherHeader: {
    marginLeft: spacing.sm,
  },
  bannerContainer: {
    width: "100%",
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  bannerListContent: {
    paddingHorizontal: spacing.sm,
    paddingRight: spacing.xl,
  },
  bannerImageWrapper: {
    width: "100%",
    borderTopLeftRadius: borderRadius.large,
    borderTopRightRadius: borderRadius.large,
    overflow: "hidden",
  },
  bannerButtonRow: {
    ...commonStyles.row,
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  aboutSchemesButton: {
    flex: 1,
    backgroundColor: COLORS.overlayLight,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.md,
    ...commonStyles.center,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    ...SHADOW_UTILS.button(),
    marginRight: spacing.xs,
  },
  aboutSchemesButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: rf(15, { minSize: 13, maxSize: 17 }),
    letterSpacing: 0.2,
  },
  joinNowButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.md,
    ...commonStyles.center,
    ...SHADOW_UTILS.button(),
    marginLeft: spacing.xs,
  },
  joinNowButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: rf(16, { minSize: 14, maxSize: 18 }),
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  userInfoCard: {
    width: wp(90),
    borderRadius: borderRadius.large,
    marginVertical: spacing.sm,
    overflow: "hidden",
    ...SHADOW_UTILS.card(),
  },
  userInfoGradient: {
    padding: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 120,
  },
  userInfoTopRow: {
    ...commonStyles.row,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: spacing.md,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: rf(12, { minSize: 10, maxSize: 14 }),
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: rf(18, { minSize: 16, maxSize: 22 }),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userIdText: {
    fontSize: rf(12, { minSize: 10, maxSize: 14 }),
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.7)",
    marginLeft: spacing.sm,
  },
  userAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  userAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  expandCollopse: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(183, 234, 18, 0.2)",
    borderRadius: 10,
    padding: 12,
    marginBottom: spacing.md,
    width: "100%",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    minWidth: 80,
  },
  statLabel: {
    fontSize: moderateScale(10),
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 2,
    textAlign: "center",
  },
  statValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countText: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  unitText: {
    fontSize: moderateScale(12),
    color: "#FFD700",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  viewMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 12,
  },
  viewMoreText: {
    fontSize: moderateScale(11),
    color: "#FFD700",
    fontWeight: "600",
  },
  statusContainer: {
    width: "100%",
    marginVertical: spacing.sm,
    marginTop: spacing.md,
  },
  statusHeader: {
    ...commonStyles.row,
    alignItems: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  statusHeaderLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: theme.colors.primary,
    marginHorizontal: spacing.xs,
  },
  statusHeaderText: {
    fontSize: rf(16, { minSize: 14, maxSize: 18 }),
    fontWeight: "700",
    color: theme.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  statusListContent: {
    paddingHorizontal: spacing.sm,
  },
  statusItem: {
    marginHorizontal: spacing.xs,
    ...commonStyles.center,
  },
  statusItemWrapper: {
    ...commonStyles.center,
  },
  statusImageContainer: {
    width: rp(70),
    height: rp(70),
    borderRadius: rp(35),
    borderWidth: 2,
    borderColor: theme.colors.primary,
    padding: spacing.xs,
    backgroundColor: COLORS.white,
    marginBottom: spacing.xs,
    ...SHADOW_UTILS.avatar(),
  },
  statusImage: {
    width: "100%",
    height: "100%",
    borderRadius: rp(33),
  },
  statusItemName: {
    fontSize: rf(12, { minSize: 10, maxSize: 14 }),
    color: theme.colors.primary,
    textAlign: "center",
    width: rp(70),
    fontWeight: "600",
    textShadowColor: COLORS.overlayLight,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  headerLanguageButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: COLORS.overlayLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.overlayMedium,
  },
  languageIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  headerLanguageText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.white,
  },
  sliderLoadingContainer: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.overlay,
    borderRadius: 8,
    marginVertical: 10,
  },
  sectionHeader: {
    width: "100%",
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 12,
    alignItems: "center",
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  sectionHeaderLine: {
    height: 1.5,
    width: 20,
    backgroundColor: COLORS.secondary,
    marginHorizontal: 5,
  },
  sectionHeaderText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: COLORS.error,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textShadowColor: COLORS.overlay,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  sectionHeaderSubtext: {
    fontSize: moderateScale(11),
    color: COLORS.mediumGrey,
    marginTop: 4,
    textAlign: "center",
    fontStyle: "italic",
  },
  videoContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginVertical: 15,
  },
  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  videoTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: COLORS.error,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginRight: 10,
  },
  videoHeaderLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: COLORS.secondary,
  },
  videoWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 2,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  rateWarningContainer: {
    width: "90%",
    backgroundColor: COLORS.error,
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
  },
  rateWarningContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rateWarningTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  rateWarningTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 4,
  },
  rateWarningSubtitle: {
    fontSize: moderateScale(12),
    color: COLORS.overlayLight,
  },
  rateWarningRates: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.overlay,
    borderRadius: 12,
    padding: 12,
  },
  rateWarningRateItem: {
    flex: 1,
    alignItems: "center",
  },
  rateWarningRateLabel: {
    fontSize: moderateScale(12),
    color: COLORS.overlayLight,
    marginBottom: 4,
  },
  rateWarningRateValue: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: COLORS.white,
  },
  rateWarningDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.overlayLight,
    marginHorizontal: 12,
  },
  viewDetailsContainer: {
    marginTop: spacing.sm,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
    width: "100%",
    maxWidth: 200,
  },
  viewDetailsGradient: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  viewDetailsText: {
    fontSize: moderateScale(10),
    fontWeight: "bold",
    color: COLORS.errorDark,
    textAlign: "center",
  },
  doubleArrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  secondArrow: {
    marginLeft: -8,
  },
  goldRateLabelContainer: {
    width: "90%",
    alignSelf: "center",
  },
  goldRateLabel: {
    borderRadius: 10,
    borderWidth: 3,
    borderColor: theme.colors.secondary,
    paddingVertical: 2,
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  goldRatePurity: {
    color: COLORS.overlayLight,
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 1,
    marginLeft: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  goldRateTitle: {
    color: COLORS.tan,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 0,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  goldRateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginBottom: 0,
  },
  goldRatePrice: {
    color: COLORS.tan,
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  goldRateUpdatedAt: {
    color: COLORS.tan + "BB",
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.bgBlackLight,
  },
  loginButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    color: COLORS.error,
    fontSize: moderateScale(16),
    fontWeight: "700",
    textAlign: "center",
  },

  poweredByContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
    alignItems: "center",
  },
  poweredByButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.bgWhiteLight,
    borderWidth: 1,
    borderColor: theme.colors.borderGoldMedium,
  },
  poweredByText: {
    fontSize: moderateScale(12),
    color: COLORS.mediumGrey,
    marginRight: 4,
  },
  poweredByLink: {
    fontSize: moderateScale(12),
    color: COLORS.gold,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  debugButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  debugButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Floating Chat Button Styles
  floatingChatButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  floatingButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  // Chat Modal Styles
  chatModalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
  },
  chatHeaderContent: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "white",
  },
  chatHeaderSubtitle: {
    fontSize: moderateScale(14),
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  closeButton: {
    padding: 5,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 4,
    paddingHorizontal: 10,
  },
  botMessageContainer: {
    justifyContent: "flex-start",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  botAvatar: {
    backgroundColor: "#007AFF",
  },
  userAvatarBackground: {
    backgroundColor: theme.colors.primary,
  },
  avatarText: {
    color: "white",
    fontSize: moderateScale(14),
    fontWeight: "bold",
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  botBubble: {
    backgroundColor: "#e0e0e0",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: moderateScale(14),
    lineHeight: 20,
  },
  botBubbleText: {
    color: "#333",
  },
  userBubbleText: {
    color: "white",
  },
  messageTime: {
    fontSize: moderateScale(10),
    color: "#666",
    marginTop: 4,
    textAlign: "right",
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: moderateScale(12),
    color: "#666",
    fontStyle: "italic",
  },
  inputArea: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  faqButtonsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  faqButton: {
    marginRight: 10,
    borderRadius: 20,
    overflow: "hidden",
    minWidth: 120,
    maxWidth: 200,
  },
  faqButtonGradient: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  faqButtonText: {
    color: "white",
    fontSize: moderateScale(12),
    fontWeight: "600",
    textAlign: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: moderateScale(14),
    color: "#333",
    backgroundColor: "#f9f9f9",
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 20,
    overflow: "hidden",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  needHelpButton: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 25,
    overflow: "hidden",
  },
  needHelpGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  needHelpText: {
    color: "white",
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  needHelpSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: moderateScale(12),
    marginTop: 2,
  },
  kycBannerContainer: {
    width: "100%",
    paddingHorizontal: rp(16),
    marginTop: rp(10),
    marginBottom: rp(5),
  },
  kycBanner: {
    borderRadius: borderRadius.medium,
    overflow: "hidden",
    ...SHADOW_UTILS.card(),
  },
  kycBannerGradient: {
    paddingVertical: rp(14),
    paddingHorizontal: rp(16),
  },
  kycBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: rp(12),
  },
  kycBannerText: {
    flex: 1,
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    fontWeight: "600",
    color: COLORS.white,
    textAlign: "left",
  },
  // Scheme Info Modal Styles
  schemeInfoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  schemeInfoModalBackdrop: {
    flex: 1,
  },
  schemeInfoModalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Dimensions.get("window").height * 0.92, // Leave space for header
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...SHADOW_UTILS.card(),
  },
  schemeInfoModalContent: {
    flex: 1,
    flexDirection: "column",
  },
  schemeInfoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: rp(20),
    paddingVertical: rp(16),
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  schemeInfoModalTitle: {
    flex: 1,
    fontSize: rf(20, { minSize: 18, maxSize: 22 }),
    fontWeight: "700",
    color: COLORS.white,
  },
  schemeInfoModalCloseButton: {
    padding: rp(8),
  },
  schemeInfoModalScrollView: {
    flex: 1,
    flexShrink: 1,
  },
  schemeInfoModalScrollContent: {
    padding: rp(20),
    paddingBottom: rp(100),
  },
  schemeInfoSection: {
    marginBottom: rp(24),
  },
  schemeInfoSectionTitle: {
    fontSize: rf(18, { minSize: 16, maxSize: 20 }),
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: rp(12),
  },
  schemeInfoSectionText: {
    fontSize: rf(15, { minSize: 13, maxSize: 17 }),
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: rp(8),
    gap: rp(8),
  },
  benefitText: {
    flex: 1,
    fontSize: rf(15, { minSize: 13, maxSize: 17 }),
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  tableContainer: {
    borderRadius: rb(12),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border?.primary || "#e0e0e0",
    marginTop: rp(8),
    backgroundColor: COLORS.white,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary,
    paddingVertical: rp(12),
    paddingHorizontal: rp(16),
  },
  tableHeaderText: {
    flex: 1,
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: rp(12),
    paddingHorizontal: rp(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border?.primary || "#f5f5f5",
  },
  tableRowEven: {
    backgroundColor: COLORS.white,
  },
  tableRowOdd: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    flex: 1,
    fontSize: rf(13, { minSize: 11, maxSize: 15 }),
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  schemeInfoModalFooter: {
    flexDirection: "row",
    paddingHorizontal: rp(20),
    paddingVertical: rp(16),
    paddingBottom: rp(20),
    gap: rp(12),
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border?.primary || "#e5e5e5",
  },
  quickJoinButton: {
    flex: 1,
    borderRadius: borderRadius.medium,
    overflow: "hidden",
    ...SHADOW_UTILS.button(),
  },
  quickJoinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: rp(14),
    paddingHorizontal: rp(16),
    gap: rp(8),
  },
  quickJoinButtonText: {
    fontSize: rf(16, { minSize: 14, maxSize: 18 }),
    fontWeight: "700",
    color: COLORS.dark,
  },
  joinSchemesButton: {
    flex: 1,
    borderRadius: borderRadius.medium,
    overflow: "hidden",
    ...SHADOW_UTILS.button(),
  },
  joinSchemesButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: rp(14),
    paddingHorizontal: rp(16),
    gap: rp(8),
  },
  joinSchemesButtonText: {
    fontSize: rf(16, { minSize: 14, maxSize: 18 }),
    fontWeight: "700",
    color: COLORS.white,
  },
  // Quick Join Modal Styles
  quickJoinModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  quickJoinModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  quickJoinModalContainer: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    ...SHADOW_UTILS.card(),
  },
  quickJoinModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: rp(20),
    paddingVertical: rp(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border?.primary || "#e5e5e5",
  },
  quickJoinModalTitle: {
    fontSize: rf(20, { minSize: 18, maxSize: 22 }),
    fontWeight: "700",
    color: theme.colors.primary,
  },
  quickJoinModalCloseButton: {
    padding: rp(8),
  },
  quickJoinModalScrollView: {
    maxHeight: 400,
  },
  quickJoinModalScrollContent: {
    padding: rp(20),
  },
  quickJoinInputContainer: {
    marginBottom: rp(20),
  },
  quickJoinInputLabel: {
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: rp(8),
  },
  quickJoinInput: {
    borderWidth: 1,
    borderColor: COLORS.border?.primary || "#e5e5e5",
    borderRadius: borderRadius.medium,
    paddingHorizontal: rp(16),
    paddingVertical: rp(12),
    fontSize: rf(16, { minSize: 14, maxSize: 18 }),
    color: "#000000",
    backgroundColor: COLORS.white,
  },
  quickJoinInputError: {
    borderColor: COLORS.error,
  },
  quickJoinErrorText: {
    fontSize: rf(12, { minSize: 10, maxSize: 14 }),
    color: COLORS.error,
    marginTop: rp(4),
  },
  quickJoinGoldWeightContainer: {
    backgroundColor: "rgba(255, 200, 87, 0.1)",
    borderRadius: borderRadius.medium,
    padding: rp(16),
    marginTop: rp(8),
    borderWidth: 1,
    borderColor: theme.colors.secondary,
  },
  quickJoinGoldWeightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rp(8),
    marginBottom: rp(8),
  },
  quickJoinGoldWeightLabel: {
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    fontWeight: "600",
    color: theme.colors.primary,
  },
  quickJoinGoldWeightValue: {
    fontSize: rf(18, { minSize: 16, maxSize: 20 }),
    fontWeight: "700",
    color: theme.colors.primary,
  },
  quickJoinModalFooter: {
    paddingHorizontal: rp(20),
    paddingVertical: rp(16),
    borderTopWidth: 1,
    borderTopColor: COLORS.border?.primary || "#e5e5e5",
  },
  quickJoinSubmitButton: {
    borderRadius: borderRadius.medium,
    overflow: "hidden",
    ...SHADOW_UTILS.button(),
  },
  quickJoinSubmitButtonDisabled: {
    opacity: 0.6,
  },
  quickJoinSubmitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: rp(14),
    paddingHorizontal: rp(16),
    gap: rp(8),
  },
  quickJoinSubmitButtonText: {
    fontSize: rf(16, { minSize: 14, maxSize: 18 }),
    fontWeight: "700",
    color: COLORS.white,
  },
  quickJoinInputHint: {
    fontSize: rf(12, { minSize: 10, maxSize: 14 }),
    color: COLORS.mediumGrey,
    fontWeight: "400",
  },
  quickJoinQuickAmountsContainer: {
    marginTop: rp(8),
    marginBottom: rp(16),
  },
  quickJoinQuickAmountsLabel: {
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: rp(8),
  },
  quickJoinQuickAmountsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rp(8),
  },
  quickJoinQuickAmountButton: {
    paddingHorizontal: rp(16),
    paddingVertical: rp(10),
    borderRadius: borderRadius.medium,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border?.primary || "#e5e5e5",
  },
  quickJoinQuickAmountButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  quickJoinQuickAmountButtonText: {
    fontSize: rf(14, { minSize: 12, maxSize: 16 }),
    fontWeight: "600",
    color: theme.colors.primary,
  },
  quickJoinQuickAmountButtonTextActive: {
    color: COLORS.white,
  },
});
// Skeleton loading styles
const skeletonStyles = StyleSheet.create({
  rateCardContainer: {
    paddingHorizontal: rp(16),
    width: "100%",
  },
  headerSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: rp(16),
    paddingVertical: rp(12),
    paddingTop: Platform.OS === "ios" ? rp(12) : rp(12),
  },
});

const styles2 = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    marginTop: 60,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  closeButton: {
    padding: 4,
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
  },
  required: {
    color: COLORS.error,
    fontSize: 16,
    marginLeft: 2,
  },
  amountHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountHintText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgWhiteLight,
    borderWidth: 1,
    borderColor: theme.colors.borderGoldMedium,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGrey,
    marginLeft: 12,
    paddingVertical: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGrey,
    marginLeft: 8,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginLeft: 4,
  },
  goldWeightCard: {
    backgroundColor: theme.colors.bgWhiteLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  goldWeightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goldWeightLabel: {
    fontSize: 14,
    color: COLORS.mediumGrey,
    marginLeft: 8,
  },
  goldWeightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkGrey,
  },
  quickSelectSection: {
    marginBottom: 20,
  },
  quickSelectLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginBottom: 12,
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: theme.colors.bgWhiteLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    minWidth: 100,
  },
  quickAmountButtonActive: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGrey,
    textAlign: 'center',
  },
  quickAmountTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
    backgroundColor: COLORS.white,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  submitGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
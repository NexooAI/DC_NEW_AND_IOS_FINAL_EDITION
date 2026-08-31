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
  StatusBar,
} from "react-native";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect, useNavigation, DrawerActions } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LanguageSwitcher from "@/contexts/LanguageSwitcher";
import LanguageSelector from "@/components/LanguageSelector";
import LiveRateCard from "@/components/LiveRateCard";
import PostersSlider from "@/components/PostersSlider";
import { useTranslation } from "@/hooks/useTranslation";
// AppHeader is now handled by the layout wrapper
import ProductsList from "@/components/Products";
import FlashOffer from "@/components/FlashOffer";
import YouTubeVideo from "@/components/YouTubeVideo";
import SupportContactCard from "@/components/SupportContactCard";
import SocialMediaCard from "@/components/SocialMediaCard";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import api, { offersAPI } from "@/services/api";
import NetInfo from "@react-native-community/netinfo";
import { ScaledSheet, moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import { APP_CONFIG } from "@/constants";
import { COLORS } from "src/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FlashBanner from "@/components/FlashBanner";
import { Ionicons } from "@expo/vector-icons";
import StatusView from "@/components/StatusView";
import Constants from "expo-constants";
import { AppLocale } from "@/i18n";
import AuthGuard from "@/components/AuthGuard";
import { getFullImageUrl, formatGoldWeight, getImageSource } from "@/utils/imageUtils";
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
import { fetchSchemesWithCache, fetchBranchesWithCache } from "@/utils/apiCache";
import UserInfoCard from "@/components/home/UserInfoCard";
import AnimatedGoldRate from "@/components/home/AnimatedGoldRate";
import MySchemesCards from "@/components/home/MySchemesCards";

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
    require("../../../../../assets/images/slider.png"),
    require("../../../../../assets/images/slider.png"),
    require("../../../../../assets/images/slider.png"),
    require("../../../../../assets/images/slider.png"),
  ],
  defaultPopups: [
    {
      id: 1,
      title: t("welcomeToDigitalGold"),
      image: require("../../../../../assets/images/slider.png"),
      description: t("startYourGoldSavingsJourney"),
      actionText: t("getStarted"),
      actionUrl: "/(app)/(tabs)/home/schemes",
    },
    {
      id: 2,
      title: t("specialGoldOffer"),
      image: require("../../../../../assets/images/slider.png"),
      description: t("limitedTimeOfferOnGoldSchemes"),
      actionText: t("viewOffers"),
      actionUrl: "/(app)/(tabs)/home/schemes",
    },
    {
      id: 3,
      title: t("goldRateUpdates"),
      image: require("../../../../../assets/images/slider.png"),
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
      require("../../../../../assets/images/status1.jpg"),
      require("../../../../../assets/images/status1.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: t("silverCollection"),
    thumbnail: require("../../../../../assets/images/status1.jpg"),
    status_images: [
      require("../../../../../assets/images/status1.jpg"),
      require("../../../../../assets/images/status1.jpg"),
      require("../../../../../assets/images/status1.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: t("diamondCollection"),
    thumbnail: require("../../../../../assets/images/status1.jpg"),
    status_images: [
      require("../../../../../assets/images/status1.jpg"),
      require("../../../../../assets/images/status1.jpg"),
      require("../../../../../assets/images/status1.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: t("platinumCollection"),
    thumbnail: require("../../../../../assets/images/status1.jpg"),
    status_images: [
      require("../../../../../assets/images/status1.jpg"),
      require("../../../../../assets/images/status1.jpg"),
      require("../../../../../assets/images/status1.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: t("exclusiveCollection"),
    thumbnail: require("../../../../../assets/images/status1.jpg"),
    status_images: [
      require("../../../../../assets/images/status1.jpg"),
      require("../../../../../assets/images/status1.jpg"),
      require("../../../../../assets/images/status1.jpg"),
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
      gold_rate_18?: string;
      gold_rate_14?: string;
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

// Components extracted to separate files in src/components/home/



const collectionStyles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.textDark,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.secondary,
    textDecorationLine: "underline",
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  cardContainer: {
    width: 160,
    height: 220,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardBorder: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    padding: 2, // Slight thicker border for the metallic look
  },
  cardInner: {
    flex: 1,
    backgroundColor: "#111", // Dark background for better contrast
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%", // Full height gradient for better text readability
  },
  topBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 215, 0, 0.9)", // Gold background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  topBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#5D4037", // Dark brown for contrast on gold
    letterSpacing: 0.5,
  },
  bottomContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 16,
  },
  collectionName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 8,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Gill Sans' : 'serif', // Elegant serif font preference
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
    gap: 4,
  },
  countText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "600",
  },
  arrowBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
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

// Floating Chat Button moved to global layout

import { logger } from "@/utils/logger";
import DynamicSchemeCard from "@/components/DynamicSchemeCard";
import GoldSilverRateCard from "@/components/GoldSilverRateCard";


export default function Home() {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const { t } = useTranslation();
  // State
  const { language, user, debugState, setLanguage } = useGlobalStore();

  // Refer & Lucky Draw Animations
  const referAnim = useRef(new Animated.Value(0)).current;
  const luckyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Refer Icon horizontal slide loop (translateX)
    const referLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(referAnim, {
          toValue: 6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(referAnim, {
          toValue: -6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    referLoop.start();

    // 2. Lucky Draw Icon rotation loop (rotate)
    const luckyLoop = Animated.loop(
      Animated.timing(luckyAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    luckyLoop.start();

    return () => {
      referLoop.stop();
      luckyLoop.stop();
    };
  }, [referAnim, luckyAnim]);

  const luckyRotation = luckyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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
  const params = useLocalSearchParams();
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
  const [isCollectionCompact, setIsCollectionCompact] = useState(true); // Added toggle state for layout format
  const [totalGoldSavings, setTotalGoldSavings] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [flashNews, setFlashNews] = useState<any[]>([]);
  const [sliderImages, setSliderImages] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]); // Added schemes state
  const activeMetalTypes = useMemo(() => {
    const types = { gold: false, silver: false, diamond: false, platinum: false, old_gold: false };
    const getLocalText = (textObj: any): string => {
      if (!textObj) return "";
      if (typeof textObj === "string") return textObj;
      if (typeof textObj === "object") {
        return textObj[language] || textObj.en || textObj.ta || "";
      }
      return String(textObj);
    };

    if (!schemes || schemes.length === 0) {
      return {
        gold: isVisible("showGoldScheme"),
        silver: isVisible("showSilverScheme"),
        diamond: isVisible("showDiamondScheme"),
        platinum: isVisible("showPlatinumScheme"),
        old_gold: isVisible("showOldGoldScheme") !== false,
      };
    }

    schemes.forEach((scheme: any) => {
      if (scheme.ACTIVE !== "Y") return;

      const schemeNameLower = getLocalText(scheme.SCHEMENAME).toLowerCase();
      const schemeTypeLower = (scheme.SCHEMETYPE || "").toLowerCase();
      const insTypeLower = (scheme.INS_TYPE || "").toLowerCase();
      const savingTypeLower = (scheme.savingType || "").toLowerCase();
      const descLower = getLocalText(scheme.DESCRIPTION).toLowerCase();
      const combined = `${schemeNameLower} ${schemeTypeLower} ${insTypeLower} ${savingTypeLower} ${descLower}`;

      if (combined.includes("old gold") || combined.includes("oldgold") || combined.includes("பழைய தங்கம்")) {
        types.old_gold = true;
      } else if (combined.includes("silver") || combined.includes("வெள்ளி")) {
        types.silver = true;
      } else if (combined.includes("diamond") || combined.includes("வைரம்")) {
        types.diamond = true;
      } else if (combined.includes("platinum") || combined.includes("பிளாட்டினம்")) {
        types.platinum = true;
      } else {
        types.gold = true;
      }
    });

    return types;
  }, [schemes, isVisible, language]);
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

  // Floating Offer Promo States
  const [activeOffers, setActiveOffers] = useState<any[]>([]);
  const [latestOffer, setLatestOffer] = useState<any | null>(null);
  const [showFloatingOffer, setShowFloatingOffer] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);

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
    limit_type?: string;
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
      setSchemes(schemesData || []);
      return schemesData;
    } catch (error) {
      logger.error("❌ Error fetching schemes data:", error);
      setSchemes([]);
      return [];
    }
  }, []);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    try {
      logger.log("🔍 Fetching branches...");
      const branchData = await fetchBranchesWithCache() || [];
      setBranches(branchData);

      // Auto-select if only one branch
      if (branchData.length === 1) {
        setSelectedBranchId(String(branchData[0].id));
        logger.log("Auto-selected branch:", branchData[0].id);
      } else if (branchData.length > 0) {
        // If multiple branches, select the first one by default
        setSelectedBranchId(String(branchData[0].id));
        logger.log("Selected first branch:", branchData[0].id);
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
      const response = await api.get(`/amount-limits/scheme/${schemeId}?userId=${user?.id || ''}`, { skipLoading: true } as any);
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
            limit_type: activeLimit.limit_type,
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
  const fetchInvestmentData = useCallback(async (existingInvestments?: any[]) => {
    if (!user || !user.id) {
      logger.log(
        "⚠️ No user or userId available, skipping investment data fetch"
      );
      return;
    }

    try {
      let investments = existingInvestments;

      if (!investments) {
        logger.log("🔍 Fetching investment data for user:", user.id);
        const response = await api.get(`investments/user_investments/${user.id}`, { skipLoading: true } as any);
        logger.log("Investment API response:", response.data);

        // Handle different possible response structures
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
      } else {
        logger.log("📦 Using pre-fetched investments data count:", investments.length);
      }

      // Ensure investments is an array
      if (!Array.isArray(investments)) {
        logger.warn("Expected investments to be an array, got:", investments);
        investments = [];
      }

      // Fetch old gold deposits
      let activeOldGoldCount = 0;
      let activeOldGoldWeight = 0;
      try {
        const ogResponse = await api.get(`/old-gold/user/${user.id}`, { skipLoading: true } as any);
        if (ogResponse.data && ogResponse.data.success && Array.isArray(ogResponse.data.data)) {
          const activeOldGold = ogResponse.data.data.filter((dep: any) => dep.status === 'active');
          activeOldGoldCount = activeOldGold.length;
          activeOldGoldWeight = activeOldGold.reduce((sum: number, dep: any) => sum + (parseFloat(dep.netGoldWeight || dep.net_gold_weight || "0") || 0), 0);
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          logger.log("ℹ️ Old gold deposits endpoint not found (404), skipping.");
        } else {
          logger.error("Error fetching old gold deposits in fetchInvestmentData:", err);
        }
      }

      setActiveSchemesCount((investments.length || 0) + activeOldGoldCount);

      // Safely filter investments by schemeType
      const weightBased = investments.filter(
        (inv: any) => inv && inv.scheme && inv.scheme.schemeType === "weight"
      );

      const totalGold = weightBased.reduce((sum: number, investment: any) => {
        const goldWeight =
          parseFloat(investment?.totalgoldweight || "0") || 0;
        return sum + goldWeight;
      }, 0) + activeOldGoldWeight;

      if (weightBased.length > 0 || activeOldGoldCount > 0) {
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

          // Fetch dynamic offers for the floating widget
          try {
            const offersResponse = await offersAPI.getOffers();
            if (offersResponse.data && offersResponse.data.success) {
              const fetchedOffers = offersResponse.data.data || [];
              const activeOnly = fetchedOffers.filter((o: any) => o.status === 'active');
              setActiveOffers(activeOnly);
              if (activeOnly.length > 0) {
                setLatestOffer(activeOnly[0]);
                setShowFloatingOffer(true);
              } else {
                setLatestOffer(null);
                setShowFloatingOffer(false);
              }
            }
          } catch (offerErr) {
            logger.error("Error fetching offers in fetchHomeData:", offerErr);
          }

          // Populate investments calculations directly from pre-fetched list
          if (data.investments) {
            fetchInvestmentData(data.investments);
          }

          // Populate KYC status directly from home API payload
          if (data.kycStatus) {
            const kycStatusValue = data.kycStatus.kyc_status;
            const hasKycData = data.kycStatus.data;
            if (kycStatusValue === "Completed" || hasKycData) {
              setKycStatus(true);
              logger.log("✅ KYC is completed (pre-fetched)", { kyc_status: kycStatusValue });
            } else {
              setKycStatus(false);
              logger.log("⚠️ KYC is not completed (pre-fetched)", { kyc_status: kycStatusValue });
            }
          }

          // Store entire home response data in AsyncStorage for offline cache loading
          try {
            await AsyncStorage.setItem("cached_home_data", JSON.stringify(response.data));
          } catch (storageErr) {
            logger.error("Error saving cached_home_data:", storageErr);
          }

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
              "🔍 FlashNews Debug: No flashNews data found, setting empty array"
            );
            // Set empty array to hide FlashNews if no data from API
            setFlashNews([]);
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
  const lastFocusRefreshTime = useRef(Date.now());
  useFocusEffect(
    useCallback(() => {
      // Reset status bar color and translucency when Home is focused
      StatusBar.setBarStyle("dark-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor(theme.colors.quaternary || "#F2E6D2");
        StatusBar.setTranslucent(false);
      }

      // Skip refresh on initial mount (handled by useEffect below)
      if (isInitialMount.current) {
        isInitialMount.current = false;
        lastFocusRefreshTime.current = Date.now();
        return;
      }

      // Check if we should throttle this focus refresh (e.g. 30 seconds)
      const now = Date.now();
      const timeSinceLastRefresh = now - lastFocusRefreshTime.current;
      if (timeSinceLastRefresh < 30000) {
        logger.log(`📦 Home: Skipping focus auto-refresh (throttled, last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago)`);
        return;
      }

      // Refresh data when user navigates back to home page
      logger.log("🔄 Home: Screen focused, auto-refreshing data...");
      const refreshData = async () => {
        try {
          lastFocusRefreshTime.current = Date.now();
          const refreshPromises: Promise<any>[] = [
            fetchHomeData(true),
            fetchSchemesData(false), // Respect cache on focus
            refetchVisibility(), // Auto-uses Zustand cache
          ];

          await Promise.all(refreshPromises);
          logger.log("✅ Home: Auto-refresh completed");
        } catch (error) {
          logger.error("❌ Home: Auto-refresh error:", error);
        }
      };

      refreshData();
    }, [fetchHomeData, fetchSchemesData, refetchVisibility])
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

  // Load cached home data on initial mount
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedDataStr = await AsyncStorage.getItem("cached_home_data");
        if (cachedDataStr) {
          const cachedData = JSON.parse(cachedDataStr);
          // Only apply cached data if homeData has not been populated by a fresh API response yet
          setHomeData((current) => {
            if (current) return current;

            // Populate nested collections and slider images if they aren't loaded yet
            if (cachedData?.data?.collections && cachedData.data.collections.length > 0) {
              setCollectionsData((currentCols) => currentCols.length > 0 ? currentCols : cachedData.data.collections);
            }
            if (cachedData?.data?.posters && cachedData.data.posters.length > 0) {
              setSliderImages((currentImages) => currentImages.length > 0 ? currentImages : cachedData.data.posters.map((poster: any) => ({
                id: poster.id,
                image: poster.image && poster.image.startsWith("http")
                  ? poster.image
                  : poster.image
                    ? `${theme.baseUrl}${poster.image}`
                    : "",
                title: poster.title || "",
              })));
            }
            return cachedData;
          });
        } else {
          // Fallback to the single "gold_rate" key if cached_home_data is not present
          const storedRate = await AsyncStorage.getItem("gold_rate");
          if (storedRate) {
            setHomeData((current) => {
              if (current) return current;
              return {
                success: true,
                data: {
                  currentRates: {
                    gold_rate: storedRate,
                    silver_rate: "",
                    updated_at: new Date().toISOString(),
                  },
                  collections: [],
                  posters: [],
                  flashNews: [],
                  introScreen: { title: null, image: null, startDate: null, endDate: null },
                  initialPopups: [],
                  investments: { data: [] },
                  videos: [],
                  socialmedia: [],
                }
              };
            });
          }
        }
      } catch (e) {
        logger.error("Error loading cached home data:", e);
      }
    };
    loadCachedData();
  }, []);

  // Effects
  useEffect(() => {
    logger.log("🔍 Home: Initial useEffect triggered");
    logger.log("🔍 Home: User object:", user);
    logger.log("🔍 Home: User ID:", user?.id);
    logger.log("🔍 Home: Is user logged in:", !!user);

    fetchHomeData();
    fetchSchemesData(false); // Use cache if available on initial load
    fetchBranches(); // Fetch branches on mount
  }, [fetchHomeData, fetchSchemesData, fetchBranches, user]);


  useEffect(() => {
    if (user) {
      logger.log("Setting up notifications...");
      if (Constants.executionEnvironment !== "storeClient") {
        import("@/services/NotificationService")
          .then(({ default: NotificationService }) => {
            NotificationService.sendFcmTokenToApi();
          })
          .catch((error) => {
            logger.error("Failed to load NotificationService:", error);
          });
      }
    }
  }, [user]);

  // Auto-trigger first collection if requested via params
  useEffect(() => {
    if (params.autoTrigger === "collection" && collectionsData.length > 0 && !showStatus) {
      logger.log("🎯 Home: Auto-triggering first collection status...");
      setSelectedCollection(collectionsData[0]);
      setShowStatus(true);

      // Clear the param after triggering once to prevent repeated triggers on re-render
      router.setParams({ autoTrigger: undefined });
    }
  }, [params.autoTrigger, collectionsData, showStatus]);

  // Rating prompt - increment launch count on mount
  useEffect(() => {
    incrementLaunchCount();
  }, []);

  // Intercept back button to prompt for rating before leaving the app
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        checkAndShowRating().then((showed) => {
          if (!showed) {
            // If the rating modal wasn't triggered (already rated, prompted today, or count < 5), exit the app
            BackHandler.exitApp();
          }
        });
        return true; // Block default exit behavior
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [checkAndShowRating])
  );

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
      refetchVisibility(true),
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
      setViewedCollections((prev) => ({
        ...prev,
        [selectedCollection.id]: true,
      }));
    }
    setShowStatus(false);
    setSelectedCollection(null);

    // Handle redirection if specified in params (e.g. from Dashboard)
    if (params.redirectOnClose === "schemes") {
      router.push("/(app)/(tabs)/home/schemes");
    } else if (params.redirectOnClose === "dashboard") {
      const hasDashboard = getAppConfig().constants.enableDashboard;
      router.push(hasDashboard ? "/(app)/dashboard" : "/(app)/(tabs)/home");
    }
  }, [selectedCollection, params.redirectOnClose]);


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
    try {
      const drawerNav: any = (navigation as any).getParent?.("AppDrawer") || (navigation as any).getParent?.()?.getParent?.() || (navigation as any).getParent?.();
      if (drawerNav) {
        if (typeof drawerNav.openDrawer === "function") {
          drawerNav.openDrawer();
          return;
        }
        if (typeof drawerNav.toggleDrawer === "function") {
          drawerNav.toggleDrawer();
          return;
        }
        if (typeof drawerNav.dispatch === "function") {
          drawerNav.dispatch(DrawerActions.openDrawer());
          return;
        }
      }

      let parent: any = navigation.getParent();
      while (parent) {
        if (typeof parent.openDrawer === "function") {
          parent.openDrawer();
          return;
        }
        if (typeof parent.toggleDrawer === "function") {
          parent.toggleDrawer();
          return;
        }
        parent = parent.getParent();
      }
    } catch (err) {
      logger.error("Error opening drawer:", err);
    }
  };

  // Handle notification press
  const handleNotificationPress = () => {
    router.push("/(app)/(tabs)/notifications");
  };

  const checkIsOldGold = (scheme: any): boolean => {
    if (!scheme) return false;

    // Check plan type ID (safe from number/string type differences)
    if (
      String(scheme.scheme_plan_type_id) === "4" ||
      String(scheme.SCHEME_PLAN_TYPE_ID) === "4"
    ) {
      return true;
    }

    const containsOldGold = (textObj: any): boolean => {
      if (!textObj) return false;
      if (typeof textObj === "string") {
        const val = textObj.toLowerCase();
        return val.includes("old gold") || val.includes("பழைய தங்கம்") || val.includes("பழைய");
      }
      if (typeof textObj === "object") {
        for (const key of Object.keys(textObj)) {
          const val = String(textObj[key]).toLowerCase();
          if (val.includes("old gold") || val.includes("பழைய தங்கம்") || val.includes("பழைய")) {
            return true;
          }
        }
      }
      return false;
    };

    return (
      containsOldGold(scheme.INS_TYPE) ||
      containsOldGold(scheme.SCHEMETYPE) ||
      containsOldGold(scheme.SCHEMENAME)
    );
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
    textObj: any,
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
      if (Array.isArray(textObj)) {
        const validItems = textObj.filter(
          (item) => item !== null && item !== undefined && item !== ""
        );
        return validItems.length > 0 ? validItems.join(", ") : "";
      }

      // Check if this object contains any translation keys
      const hasEn = textObj.hasOwnProperty("en") || textObj.hasOwnProperty("EN");
      const hasTa = textObj.hasOwnProperty("ta") || textObj.hasOwnProperty("TA");
      const hasTe = textObj.hasOwnProperty("te") || textObj.hasOwnProperty("TE");
      const hasHi = textObj.hasOwnProperty("hi") || textObj.hasOwnProperty("HI");
      const hasMal = textObj.hasOwnProperty("mal") || textObj.hasOwnProperty("MAL") || (textObj as any).hasOwnProperty("_ta") || (textObj as any).hasOwnProperty("_TA");

      if (hasEn || hasTa || hasTe || hasHi || hasMal) {
        const targetText = textObj[lang] || textObj[lang.toUpperCase()] || textObj[lang.toLowerCase()];
        const enText = textObj.en || textObj.EN || "";
        const taText = textObj.ta || textObj.TA || "";

        // Malayalam fallback logic if "mal" translation is missing
        if ((lang === "mal" || lang === "MAL") && !targetText) {
          const malTextLegacy = (textObj as any)._ta || (textObj as any)._TA || "";
          return malTextLegacy || taText || enText || Object.values(textObj)[0] || "";
        }

        return targetText || enText || taText || Object.values(textObj)[0] || "";
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
          chits: relevantChits.length > 0 ? relevantChits : chits,
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

  // Reusable function to initiate Quick Join
  const initiateQuickJoin = async (scheme: any) => {
    if (!scheme) return;

    // Set selected scheme if not already set
    if (selectedScheme?.SCHEMEID !== scheme.SCHEMEID) {
      setSelectedScheme(scheme);
    }

    // Fetch amount limits for the selected scheme
    if (scheme?.SCHEMEID) {
      await fetchSchemeAmountLimits(Number(scheme.SCHEMEID));
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

      setQuickJoinModalVisible(true);
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
                },
              },
              {
                text: "Update",
                onPress: () => router.push("/(app)/(tabs)/home/kyc"),
              },
            ]
          );
        } else {
          // Retry initiate if KYC loaded
          initiateQuickJoin(scheme);
        }
      }, 1000);
    }
  };

  // Handle Quick Join button click from Info Modal
  const handleQuickJoinPress = async () => {
    // Store the selected scheme before closing modal
    const schemeToUse = selectedScheme;

    if (!schemeToUse) return;

    // Close the scheme info modal
    Animated.timing(schemeInfoModalAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSchemeInfoModalVisible(false);

      // Wait for modal to close before opening Quick Join
      // This helps with iOS modal interaction
      setTimeout(() => {
        initiateQuickJoin(schemeToUse);
      }, 300);
    });
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
    // Remove non-numeric characters except decimal point (though keyboard is numeric, pasting is poss)
    const cleanedAmount = amount.replace(/[^0-9.]/g, "");

    // Check if exceeding max amount (if limits exist and amount is a valid number)
    if (schemeAmountLimits && schemeAmountLimits.max_amount) {
      const numericVal = parseFloat(cleanedAmount);
      if (!isNaN(numericVal) && numericVal > schemeAmountLimits.max_amount) {
        return;
      }
    }

    setQuickJoinFormData((prev) => ({ ...prev, amount: cleanedAmount }));

    // Calculate gold weight if scheme type is weight OR flexi/flexible (as users often want to see est. weight)
    const schemeType = selectedScheme?.SCHEMETYPE?.toLowerCase() || "";
    if (schemeType === "weight" || schemeType.includes("flexi") || schemeType.includes("flexible")) {
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
        const min = schemeAmountLimits?.min_amount ?? 0;
        const max = schemeAmountLimits?.max_amount ?? 100000;
        if (amountValue < min) {
          errors.amount = schemeAmountLimits?.limit_type === "user"
            ? `User-specific minimum amount is ₹${min.toLocaleString("en-IN")}`
            : `Minimum amount is ₹${min.toLocaleString("en-IN")}`;
        } else if (amountValue > max) {
          errors.amount = schemeAmountLimits?.limit_type === "user"
            ? `User-specific maximum amount is ₹${max.toLocaleString("en-IN")}`
            : `Maximum amount is ₹${max.toLocaleString("en-IN")}`;
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
      amount: quickJoinFormData.amount
    });

    setIsSubmittingQuickJoin(true);

    try {
      const enteredAmount = parseFloat(quickJoinFormData.amount.replace(/,/g, ""));
      const schemeType = selectedScheme.SCHEMETYPE?.toLowerCase() || "";
      const isFlexi = schemeType.includes("flexi") || schemeType.includes("flexible");
      const isWeight = schemeType === "weight";

      let activeChit: any = null;

      // Filter active chits
      const activeChits = selectedScheme.chits?.filter((chit: any) => chit.ACTIVE === "Y") || [];

      if (activeChits.length === 0) {
        throw new Error("No active payment plan found for this scheme");
      }

      // Check if chits have specific fixed amounts
      // If all active chits have 0 amount, treat it as a Flexi scheme regardless of SCHEMETYPE
      const hasFixedAmounts = activeChits.some((chit: any) => parseFloat(chit.AMOUNT || "0") > 0);

      if (isFlexi || !hasFixedAmounts) {
        // For Flexi schemes OR schemes with no fixed amount (effectively Flexi):
        // 1. Try to find a chit explicitly named 'Flexi' or 'Flexible'
        // 2. Fallback to the first active chit
        activeChit = activeChits.find((chit: any) => {
          const freq = (chit.PAYMENT_FREQUENCY || "").toLowerCase();
          return freq.includes("flexi") || freq.includes("flexible");
        }) || activeChits[0];

        // Limits are already validated in validateQuickJoinForm via schemeAmountLimits
      } else if (isWeight) {
        // Handling weight schemes - usually they act like Flexi but in grams/money conversion
        // For now, selecting the first active chit is standard unless specific logic needed
        activeChit = activeChits[0];
      } else {
        // For Fixed Schemes (Daily, Weekly, Monthly, Fixed) where amounts are defined:
        // The entered amount MUST strictly match one of the active chits' AMOUNT
        activeChit = activeChits.find((chit: any) => {
          const chitAmount = parseFloat(chit.AMOUNT || "0");
          return chitAmount === enteredAmount;
        });

        if (!activeChit) {
          // Provide a helpful error message listing available amounts
          const availableAmounts = activeChits
            .map((c: any) => `₹${parseFloat(c.AMOUNT).toLocaleString('en-IN')}`)
            .join(", ");

          throw new Error(`Invalid amount. For this scheme, please choose one of: ${availableAmounts}`);
        }
      }

      if (!activeChit) {
        throw new Error("Unable to select a valid plan for the entered amount.");
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
      const selectedSchemeType = selectedScheme.SCHEMETYPE?.toLowerCase() || "weight";
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
        schemeType: selectedSchemeType,
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
            schemeType: selectedSchemeType,
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
          schemeType: selectedSchemeType,
          savinsTypes: selectedSchemeType || "amount",
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
    ({ item }: { item: Collection }) => {
      if (isCollectionCompact) {
        return (
          <TouchableOpacity
            style={styles.collectionCompactContainer}
            activeOpacity={0.85}
            onPress={() => {
              setSelectedCollection(item);
              setShowStatus(true);
            }}
          >
            <LinearGradient
              colors={['#BF953F', '#FCF6BA', '#B38728', '#FBF5B7', '#AA771C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.compactCircleBorder}
            >
              <View style={styles.compactCircleInner}>
                <Image
                  source={getImageSource(item.thumbnail) ?? undefined}
                  style={styles.compactImage}
                  resizeMode="cover"
                />
              </View>
            </LinearGradient>
            <Text style={styles.collectionCompactName} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity
          style={styles.collectionCardContainer}
          activeOpacity={0.85}
          onPress={() => {
            setSelectedCollection(item);
            setShowStatus(true);
          }}
        >
          <LinearGradient
            colors={['#BF953F', '#FCF6BA', '#B38728', '#FBF5B7', '#AA771C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={collectionStyles.cardBorder}
          >
            <View style={collectionStyles.cardInner}>
              <Image
                source={getImageSource(item.thumbnail) ?? undefined}
                style={collectionStyles.image}
                resizeMode="cover"
              />
              {/* Dark Gradient Overlay for text readability */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
                locations={[0, 0.5, 0.8, 1]}
                style={collectionStyles.gradientOverlay}
              />

              {/* Top Right "View" Indicator */}
              <View style={collectionStyles.topBadge}>
                <Ionicons name="sparkles" size={10} color="#5D4037" />
                <Text style={collectionStyles.topBadgeText}>NEW</Text>
              </View>

              {/* Bottom Content Area */}
              <View style={collectionStyles.bottomContent}>
                <Text style={collectionStyles.collectionName} numberOfLines={1}>
                  {item.name}
                </Text>

                <View style={collectionStyles.statsRow}>
                  <View style={collectionStyles.countBadge}>
                    <Ionicons name="images-outline" size={10} color="#FFD700" />
                    <Text style={collectionStyles.countText}>{item.status_images?.length || 0} Designs</Text>
                  </View>
                  <TouchableOpacity style={collectionStyles.arrowBtn}>
                    <Ionicons name="arrow-forward" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    },
    [isCollectionCompact, getImageSource]
  );

  // Show skeleton loading screen while data is being fetched
  if (isLoading) {
    return (
      <SafeAreaView style={styles.fullHeightBackground} edges={["top", "left", "right"]}>
        {/* Home Page Header (Real Logo & Welcome) */}
        <View style={styles.homeHeader}>
          {/* Left: Tenant Logo and Welcome Name */}
          <View style={styles.headerLeft}>
            <Image
              source={require("../../../../../assets/images/logo_trans.png")}
              style={{
                width: 40,
                height: 40,
                marginRight: 8,
              }}
              resizeMode="contain"
            />
            <View style={styles.headerNameContainer}>
              <ResponsiveText
                variant="caption"
                size="xs"
                weight="normal"
                color={theme.colors.textSecondary}
                allowWrap={false}
                maxLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.7}
                style={styles.headerWelcomeText}
              >
                {t("hi") || "Hi"},
              </ResponsiveText>
              <ResponsiveText
                variant="body"
                size="md"
                weight="semibold"
                color={theme.colors.textDark}
                allowWrap={false}
                maxLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
                style={styles.headerUserName}
              >
                {user?.name?.toUpperCase() || "USER"}
              </ResponsiveText>
            </View>
          </View>

          {/* Right: Icons */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleLanguageChange}
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              <View style={styles.languageIconContainer}>
                <Ionicons
                  name="language"
                  size={24}
                  color={theme.colors.textDark}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNotificationPress}
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={theme.colors.textDark}
              />
            </TouchableOpacity>

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
              <SkeletonLoader width={140} height={18} variant="text" />
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
            <View style={{ marginTop: rp(24), width: "100%" }}>
              <View style={styles.statusHeader}>
                <SkeletonLoader width={100} height={18} variant="text" />
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
      </SafeAreaView>
    );
  }

  // Show message if no user data is available
  if (!user || !user.id) {
    return (
      <>
        <SafeAreaView style={styles.fullHeightBackground} edges={["top", "left", "right"]}>
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
        </SafeAreaView>
      </>
    );
  }

  return (
    <AuthGuard>
      <SafeAreaView style={styles.fullHeightBackground} edges={["top", "left", "right"]}>
        {/* {showFlashBanner && (
          <FlashBanner
            imageSource={images.banners.flashBanner}
            onClose={handleCloseBanner}
          />
        )} */}
        {/* Home Page Header */}
        <View style={styles.homeHeader}>
          {/* Left: Tenant Logo and Welcome Name */}
          <View style={styles.headerLeft}>
            <Image
              source={require("../../../../../assets/images/logo_trans.png")}
              style={{
                width: 40,
                height: 40,
                marginRight: 8,
              }}
              resizeMode="contain"
            />
            <View style={styles.headerNameContainer}>
              <ResponsiveText
                variant="caption"
                size="xs"
                weight="normal"
                color={theme.colors.textSecondary}
                allowWrap={false}
                maxLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.7}
                style={styles.headerWelcomeText}
              >
                {t("hi") || "Hi"},
              </ResponsiveText>
              <ResponsiveText
                variant="body"
                size="md"
                weight="semibold"
                color={theme.colors.textDark}
                allowWrap={false}
                maxLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
                style={styles.headerUserName}
              >
                {user?.name?.toUpperCase() || "USER"}
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
                  color={theme.colors.textDark}
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
                color={theme.colors.textDark}
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
          {isVisible("showFlashnews") && flashNews && flashNews.length > 0 && (
            <FlashOffer
              fallbackMessages={flashNews}
              onPress={() => {
                if (__DEV__) {
                  logger.log(t("flashNewsTapped"));
                }
              }}
              textColor={COLORS.white}
            />
          )}
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
                    goldRate18={homeData?.data?.currentRates?.gold_rate_18}
                    goldRate14={homeData?.data?.currentRates?.gold_rate_14}
                    silverRate={homeData?.data?.currentRates?.silver_rate}
                    updatedAt={homeData.data.currentRates.updated_at || ""}
                  />
                </TouchableOpacity>
              )}


            {/* Collections Section - Conditionally rendered based on API */}
            {isVisible("showCollection") && (
              <View style={styles.statusContainer}>
                {/* Active Collections Section */}
                <View style={styles.collectionContainer}>
                  <View style={styles.collectionHeader}>
                    <Text style={styles.collectionHeaderTitle}>
                      {t("activeCollections")}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setIsCollectionCompact(!isCollectionCompact)}
                      style={styles.collectionCompactToggle}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isCollectionCompact ? "apps-outline" : "ellipse-outline"}
                        size={20}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={collectionsData}
                    renderItem={renderStatusItem}
                    keyExtractor={(item) => item.id.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.collectionListContent}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    initialNumToRender={5}
                  />
                </View>
              </View>
            )}

            <View style={styles.mainContent}>
              {/* Image Slider (Poster) - Conditionally rendered based on API */}
              {isVisible("showPoster") && (
                <>
                  {isSliderLoading ? (
                    <SkeletonImageSlider style={{ marginVertical: rp(8) }} />
                  ) : (
                    <PostersSlider images={sliderImages} />
                  )}
                </>
              )}
              {/* Customer Card - Conditionally rendered based on API */}
              {isVisible("showCustomerCard") && activeSchemesCount > 0 && (
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

              {/* My Schemes Cards Section */}
              <MySchemesCards
                onGoldPress={() => router.push({ pathname: "/(app)/(tabs)/home/schemes", params: { type: "gold" } })}
                onSilverPress={() => router.push({ pathname: "/(app)/(tabs)/home/schemes", params: { type: "silver" } })}
                onDiamondPress={() => router.push({ pathname: "/(app)/(tabs)/home/schemes", params: { type: "diamond" } })}
                onPlatinumPress={() => router.push({ pathname: "/(app)/(tabs)/home/schemes", params: { type: "platinum" } })}
                onOldGoldPress={() => router.push({ pathname: "/(app)/(tabs)/home/schemes", params: { type: "old_gold" } })}
                showGold={isVisible("showGoldScheme") && activeMetalTypes.gold}
                showSilver={isVisible("showSilverScheme") && activeMetalTypes.silver}
                showDiamond={isVisible("showDiamondScheme") && activeMetalTypes.diamond}
                showPlatinum={isVisible("showPlatinumScheme") && activeMetalTypes.platinum}
                showOldGold={isVisible("showOldGoldScheme") !== false && activeMetalTypes.old_gold}
              />


              {/* Hidden old Our Schemes section as requested */}
              {/* {isVisible("showSchemes") && (
                <>
                  <View style={[styles.statusHeader, { justifyContent: 'space-between', alignItems: 'center' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="ribbon-outline" size={20} color={theme.colors.secondary} style={{ marginRight: 8 }} />
                      <Text style={styles.statusHeaderText}>
                        {t("ourSchemes")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push("/(tabs)/savings?tab=join")}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.textDark }}>
                        {t("viewAll") || "View All"}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={theme.colors.secondary} />
                    </TouchableOpacity>
                  </View>
                  <DynamicSchemeCard
                    onJoinPress={async (scheme) => {
                      ...
                    }}
                  />
                </>
              )} */}

              {/* YouTube Video - Conditionally rendered based on API */}
              {isVisible("showYoutube") && (
                <YouTubeVideo
                  videos={homeData?.data?.videos}
                />
              )}

              {/* Social Media Card - Conditionally rendered based on API */}

              {/* Refer & Earn Premium Card (Refactored to match SupportContactCard) */}
              {/* Refer & Earn and Lucky Draw Side-by-Side Premium Cards (with backend visibility check) */}
              {(isVisible("showReferEarn") || isVisible("showLuckyDraw")) && (
                <View style={{
                  flexDirection: "row",
                  paddingHorizontal: moderateScale(16),
                  paddingVertical: moderateScale(8),
                  gap: moderateScale(12),
                  width: "100%",
                }}>
                  {/* Refer & Earn Card */}
                  {isVisible("showReferEarn") && (
                    <TouchableOpacity
                      onPress={() => router.push("/(app)/(tabs)/home/refer_earn")}
                      activeOpacity={0.9}
                      style={{ flex: 1 }}
                    >
                      <LinearGradient
                        colors={["#FFD700", "#F5DEB3"]} // Premium gold to peach gradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          borderRadius: moderateScale(16),
                          padding: moderateScale(12),
                          height: moderateScale(130), // Fixed height to align them
                          justifyContent: "space-between",
                          shadowColor: theme.colors.primary,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.15,
                          shadowRadius: 6,
                          elevation: 4,
                          borderWidth: 1,
                          borderColor: `rgba(255,201,12,0.6)`,
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Animated.View style={{ transform: [{ translateX: referAnim }] }}>
                            <LinearGradient
                              colors={["#ffffff", "#fefefe"]}
                              style={{
                                width: moderateScale(36),
                                height: moderateScale(36),
                                borderRadius: moderateScale(18),
                                justifyContent: "center",
                                alignItems: "center",
                                shadowColor: theme.colors.primary,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 4,
                              }}
                            >
                              <Ionicons
                                name="gift"
                                size={deviceScale(18)}
                                color={theme.colors.primary}
                              />
                            </LinearGradient>
                          </Animated.View>

                          <Ionicons name="chevron-forward" size={deviceScale(16)} color={theme.colors.textDark} style={{ opacity: 0.8 }} />
                        </View>

                        <View>
                          <Text style={{
                            color: theme.colors.textDark,
                            fontSize: moderateScale(14),
                            fontWeight: "800",
                            letterSpacing: 0.3,
                            marginBottom: 2
                          }}>
                            {t("referAndEarn") || "Refer & Earn"}
                          </Text>
                          <Text
                            style={{
                              color: theme.colors.textDark,
                              fontSize: moderateScale(10),
                              fontWeight: "500",
                              opacity: 0.85,
                            }}
                            numberOfLines={2}
                          >
                            {t("inviteFriendsEarn") || "Invite your friends and earn rewards."}
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {/* Lucky Draw Card */}
                  {isVisible("showLuckyDraw") && (
                    <TouchableOpacity
                      onPress={() => router.push("/(app)/lucky_draw")}
                      activeOpacity={0.9}
                      style={{ flex: 1 }}
                    >
                      <LinearGradient
                        colors={["#4F46E5", "#7C3AED"]} // Indigo to Violet premium gradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          borderRadius: moderateScale(16),
                          padding: moderateScale(12),
                          height: moderateScale(130), // Same fixed height to match Refer card
                          justifyContent: "space-between",
                          shadowColor: "#7C3AED",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 6,
                          elevation: 4,
                          borderWidth: 1.5,
                          borderColor: "#FFD700", // Metallic Gold Border
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Animated.View style={{ transform: [{ rotate: luckyRotation }] }}>
                            <LinearGradient
                              colors={["#BF953F", "#FCF6BA", "#B38728", "#FBF5B7", "#AA771C"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{
                                width: moderateScale(36),
                                height: moderateScale(36),
                                borderRadius: moderateScale(18),
                                justifyContent: "center",
                                alignItems: "center",
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 4,
                              }}
                            >
                              <Ionicons
                                name="aperture"
                                size={deviceScale(18)}
                                color="#FFF"
                              />
                            </LinearGradient>
                          </Animated.View>

                          <Ionicons name="chevron-forward" size={deviceScale(16)} color="#FFF" style={{ opacity: 0.8 }} />
                        </View>

                        <View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                            <Text style={{
                              color: "#FFF",
                              fontSize: moderateScale(14),
                              fontWeight: "800",
                              letterSpacing: 0.3,
                            }}>
                              {
                                {
                                  en: "Lucky Draw",
                                  ta: "லக்கி டிரா",
                                  mal: "ലക്കി ഡ്രോ",
                                  te: "లక్కీ డ్రా",
                                  hi: "लकी ड्रा"
                                }[language] || "Lucky Draw"
                              }
                            </Text>
                            <View style={{
                              backgroundColor: "#FFD700",
                              paddingHorizontal: moderateScale(4),
                              paddingVertical: moderateScale(1),
                              borderRadius: moderateScale(4),
                            }}>
                              <Text style={{
                                color: "#111",
                                fontSize: moderateScale(8),
                                fontWeight: "900",
                              }}>
                                NEW
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={{
                              color: "#E2E8F0",
                              fontSize: moderateScale(10),
                              fontWeight: "500",
                              opacity: 0.9,
                            }}
                            numberOfLines={2}
                          >
                            {
                              {
                                en: "Participate in draw & view winners",
                                ta: "குலுக்கலில் வெற்றியாளர்களைக் காண்க",
                                mal: "വിജയികളെ കാണുക",
                                te: "വിജയികളെ കാണുക",
                                hi: "विजेताओं को देखें"
                              }[language] || "Participate in draw & view winners"
                            }
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Support Contact Card - Conditionally rendered based on API */}

              {isVisible("showSupportCard") && <SupportContactCard />}
              {isVisible("showSocialMedia") && (
                <SocialMediaCard
                  socialMediaUrls={homeData?.data?.socialmedia}
                  videos={homeData?.data?.videos}
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


          {/* Scheme Info Modal */}
          <Modal
            visible={schemeInfoModalVisible}
            transparent={true}
            animationType="fade"
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
                    opacity: schemeInfoModalAnimation,
                    transform: [
                      {
                        scale: schemeInfoModalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.schemeInfoModalContent}>
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
                  {!checkIsOldGold(selectedScheme) && (
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
                          <Ionicons name="flash" size={24} color={COLORS.dark} />
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
                  )}
                </View>
              </Animated.View>
            </View>
          </Modal>

          {/* Quick Join Modal - Pro Design */}
          <Modal
            visible={quickJoinModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setQuickJoinModalVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles2.modalOverlay}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
              {/* Dismiss on backdrop press */}
              <TouchableOpacity
                style={styles2.modalBackdrop}
                activeOpacity={1}
                onPress={() => setQuickJoinModalVisible(false)}
              />

              <View style={styles2.modalContainer}>
                {/* Modern Header */}
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
                    <View style={styles2.closeButtonContainer}>
                      <Ionicons name="close" size={20} color={COLORS.dark} />
                    </View>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles2.scrollView}
                  contentContainerStyle={styles2.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Name Input - Floating Label Style */}
                  <View style={styles2.inputSection}>
                    <Text style={styles2.inputLabel}>{t("name") || "Full Name"}</Text>
                    <View style={[
                      styles2.inputContainer,
                      quickJoinErrors.name && styles2.inputError
                    ]}>
                      <Ionicons name="person-outline" size={20} color={COLORS.mediumGrey} />
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
                      <Text style={styles2.errorText}>{quickJoinErrors.name}</Text>
                    )}
                  </View>

                  {/* Amount Input */}
                  <View style={styles2.inputSection}>
                    <View style={styles2.amountHeader}>
                      <Text style={styles2.inputLabel}>{t("amount") || "Investment Amount"}</Text>
                      {schemeAmountLimits && (
                        <Text style={styles2.limitText}>
                          {t('min') || 'Min'} ₹{schemeAmountLimits.min_amount} - {t('max') || 'Max'} ₹{schemeAmountLimits.max_amount}
                        </Text>
                      )}
                    </View>

                    <View style={[
                      styles2.inputContainer,
                      quickJoinErrors.amount && styles2.inputError
                    ]}>
                      <Text style={styles2.currencySymbol}>₹</Text>
                      <TextInput
                        style={styles2.textInput}
                        value={quickJoinFormData.amount}
                        onChangeText={handleQuickJoinAmountChange}
                        placeholder={t("enterAmount") || "Enter amount"}
                        placeholderTextColor={COLORS.mediumGrey}
                        keyboardType="numeric"
                      />
                    </View>
                    {quickJoinErrors.amount && (
                      <Text style={styles2.errorText}>{quickJoinErrors.amount}</Text>
                    )}
                  </View>

                  {/* Gold Weight Display - Gradient Card */}
                  {selectedScheme?.savingType === 'weight' && (
                    <LinearGradient
                      colors={['#FFF9E6', '#FFF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles2.goldWeightCard}
                    >
                      <View style={styles2.goldWeightHeader}>
                        <View style={styles2.goldIconBg}>
                          <Ionicons name="scale" size={18} color="#B8860B" />
                        </View>
                        <Text style={styles2.goldWeightLabel}>
                          {t("estimatedGoldWeight") || "Est. Gold Weight"}
                        </Text>
                      </View>
                      <Text style={styles2.goldWeightValue}>
                        {formatGoldWeight(Number(quickJoinFormData.amount) / Number(homeData?.data?.currentRates?.gold_rate || 0))}
                      </Text>
                    </LinearGradient>
                  )}

                  {/* Quick Select Amount Pills */}
                  {(schemeAmountLimits?.quickselectedamount?.length ?? 0) > 0 && (
                    <View style={styles2.quickSelectSection}>
                      <Text style={styles2.quickSelectLabel}>
                        {t("quickSelect") || "Quick Select"}
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

                  {/* Spacing for keyboard */}
                  <View style={{ height: 100 }} />
                </ScrollView>

                {/* Footer */}
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
                          : [theme.colors.secondary, theme.colors.primary] // Gold to Primary
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles2.submitGradient}
                    >
                      {isSubmittingQuickJoin ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={styles2.submitButtonText}>
                          {t("joinNow") || "Join Now"}
                        </Text>
                      )}
                      {!isSubmittingQuickJoin && <Ionicons name="arrow-forward" size={20} color={COLORS.white} />}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

        </View>

        {/* Floating Offer Card */}
        {showFloatingOffer && latestOffer && (
          <View style={styles.floatingOfferContainer}>
            <TouchableOpacity
              style={styles.floatingOfferCard}
              onPress={() => setOfferModalVisible(true)}
              activeOpacity={0.9}
            >
              <Image
                source={getImageSource(latestOffer.image_url) ?? { uri: getFullImageUrl('/uploads/default.jpg') }}
                style={styles.floatingOfferImage}
                resizeMode="cover"
              />
              {parseFloat(latestOffer.discount) > 0 && (
                <View style={styles.floatingDiscountBadge}>
                  <Text style={styles.floatingDiscountText}>
                    {parseInt(latestOffer.discount)}% OFF
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.floatingOfferCloseButton}
              onPress={() => setShowFloatingOffer(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={24} color={theme.colors.textDark} />
            </TouchableOpacity>
          </View>
        )}

        {/* Offer Details Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={offerModalVisible}
          onRequestClose={() => setOfferModalVisible(false)}
        >
          <View style={styles.offerModalOverlay}>
            <View style={styles.offerModalContent}>
              {latestOffer && (
                <>
                  {/* Modal Header */}
                  <View style={styles.offerModalHeader}>
                    <Text style={styles.offerModalTitle} numberOfLines={1}>
                      {latestOffer.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setOfferModalVisible(false)}
                      style={styles.offerModalCloseButton}
                    >
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.offerModalBody}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Large Banner Image */}
                    <Image
                      source={getImageSource(latestOffer.image_url) ?? { uri: getFullImageUrl('/uploads/default.jpg') }}
                      style={styles.offerModalImage}
                      resizeMode="cover"
                    />

                    {/* Discount Section */}
                    {parseFloat(latestOffer.discount) > 0 && (
                      <View style={styles.offerModalDiscountBadge}>
                        <Text style={styles.offerModalDiscountText}>
                          {parseInt(latestOffer.discount)}% DISCOUNT
                        </Text>
                      </View>
                    )}

                    {/* Details Description */}
                    <Text style={styles.offerModalSubtitle}>
                      {latestOffer.subtitle}
                    </Text>

                    {/* Validity Info */}
                    <View style={styles.offerModalValidityContainer}>
                      <Ionicons name="calendar-outline" size={18} color="#666" />
                      <Text style={styles.offerModalValidityText}>
                        Validity: {latestOffer.start_date} to {latestOffer.end_date}
                      </Text>
                    </View>

                    {/* Terms & Conditions */}
                    <View style={styles.offerModalTermsContainer}>
                      <Text style={styles.offerModalTermsTitle}>
                        {t("termsAndConditions") || "Terms & Conditions"}
                      </Text>
                      <View style={styles.offerModalTermItem}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.textDark} />
                        <Text style={styles.offerModalTermText}>
                          Offer is valid on selected jewellery collections.
                        </Text>
                      </View>
                      <View style={styles.offerModalTermItem}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.textDark} />
                        <Text style={styles.offerModalTermText}>
                          Cannot be combined with any other schemes or discount offers.
                        </Text>
                      </View>
                      <View style={styles.offerModalTermItem}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.textDark} />
                        <Text style={styles.offerModalTermText}>
                          Please present this offer popup at the billing counter to claim.
                        </Text>
                      </View>
                    </View>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>

      </SafeAreaView>

      <RatingModal
        visible={showRating}
        onClose={hideRating}
        onSubmitFeedback={(rating, feedback) => {
          logger.log("📝 User rating feedback:", { rating, feedback });
          // You can send this to your API if needed
        }}
        appName={APP_CONFIG.appName}
      />
      <LanguageSelector
        visible={languageSelectorVisible}
        onClose={() => setLanguageSelectorVisible(false)}
      />
      <MinimizedLuckyDrawPill />
    </AuthGuard>
  );
}

// Floating Countdown Pill Component
const MinimizedLuckyDrawPill = () => {
  const router = useRouter();
  const activeDrawCountdown = useGlobalStore((state) => state.activeDrawCountdown);
  const setActiveDrawCountdown = useGlobalStore((state) => state.setActiveDrawCountdown);
  const [timeLeftStr, setTimeLeftStr] = useState("");

  useEffect(() => {
    if (!activeDrawCountdown) return;

    const calculateTime = () => {
      const diff = new Date(activeDrawCountdown.endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeftStr("00:00");
        return;
      }
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      const format = (n: number) => (n < 10 ? `0${n}` : n);
      setTimeLeftStr(`${format(mins)}:${format(secs)}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [activeDrawCountdown]);

  if (!activeDrawCountdown) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        router.push(`/(app)/lucky_draw?drawId=${activeDrawCountdown.id}`);
      }}
      style={styles.floatingPill}
    >
      <LinearGradient
        colors={["#850111", "#4A0010"]}
        style={styles.floatingPillGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="time" size={16} color="#FFD700" style={{ marginRight: 6 }} />
        <View style={{ marginRight: 8 }}>
          <Text style={styles.floatingPillTitle} numberOfLines={1}>
            {activeDrawCountdown.title}
          </Text>
          <Text style={styles.floatingPillTime}>
            Live in: {timeLeftStr}
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            setActiveDrawCountdown(null);
          }}
          style={styles.floatingPillClose}
        >
          <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

function getStyles(theme: any) {
  return StyleSheet.create({
    fullHeightBackground: {
      flex: 1,
      width: "100%",
      height: "100%",
      backgroundColor: theme.colors.quaternary,
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
      paddingTop: 0,
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
      color: theme.colors.textDark,
      marginLeft: 2,
    },
    notificationBadge: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: "#ff3333",
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
      justifyContent: "flex-start",
      alignItems: "stretch",
      paddingVertical: rp(20), // Increased padding
      paddingTop: rp(10),
      paddingBottom: rp(90),
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
      color: theme.colors.textDark,
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
    statusContainer: {
      width: "100%",
      marginVertical: 0,
      marginTop: spacing.xs,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: "center",
      justifyContent: "flex-start",
      width: "100%",
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xs,
    },
    statusHeaderLine: {
      display: 'none', // Hide lines for cleaner look
    },
    statusHeaderText: {
      fontSize: rf(18, { minSize: 16, maxSize: 20 }),
      fontWeight: "800",
      color: theme.colors.textDark,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      textAlign: "left",
    },

    sectionHeader: {
      width: "100%",
      paddingHorizontal: 20,
      marginTop: 20,
      marginBottom: 10,
      alignItems: "center",
    },
    sectionHeaderContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    sectionHeaderLine: {
      height: 1,
      width: 40,
      backgroundColor: theme.colors.secondary, // Thinner, wider lines
      marginHorizontal: 15,
      opacity: 0.6
    },
    sectionHeaderText: {
      fontSize: moderateScale(18),
      fontWeight: "700",
      color: theme.colors.textDark,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    sectionHeaderSubtext: {
      fontSize: moderateScale(12),
      color: COLORS.mediumGrey,
      marginTop: 6,
      textAlign: "center",
      fontWeight: '500',
      letterSpacing: 0.5
    },
    // Collection Styles Added via Implementation Plan
    collectionContainer: {
      marginBottom: spacing.xs,
      paddingVertical: 0,
    },
    collectionHeader: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    collectionHeaderTitle: {
      fontSize: rf(18),
      fontWeight: '700',
      color: theme.colors.textDark,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    collectionCompactToggle: {
      padding: spacing.xs,
      borderRadius: borderRadius.small,
      backgroundColor: 'rgba(133, 1, 17, 0.05)',
    },
    collectionCompactContainer: {
      alignItems: 'center',
      marginRight: spacing.md,
      width: 76,
    },
    compactCircleBorder: {
      width: 64,
      height: 64,
      borderRadius: 32,
      padding: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    compactCircleInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      overflow: 'hidden',
      backgroundColor: '#111',
    },
    compactImage: {
      width: '100%',
      height: '100%',
    },
    collectionCompactName: {
      fontSize: rf(11),
      color: theme.colors.textSecondary,
      fontWeight: '600',
      marginTop: 6,
      width: '100%',
      textAlign: 'center',
    },
    collectionListContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    collectionCardContainer: {
      marginRight: spacing.md,
      borderRadius: borderRadius.medium,
      overflow: 'hidden',
      backgroundColor: COLORS.white,
      ...SHADOW_UTILS.card(),
      width: 140, // Fixed width for horizontal scroll items
      height: 140,
      elevation: 4,
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
      backgroundColor: theme.colors.backgroundSecondary,
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
      backgroundColor: theme.colors.backgroundSecondary,
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
      backgroundColor: theme.colors.error,
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
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "center", // Center vertically
      alignItems: "center", // Center horizontally
    },
    schemeInfoModalBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    schemeInfoModalContainer: {
      backgroundColor: COLORS.white,
      borderRadius: 24, // Rounded corners on all sides
      width: responsiveUtils.isTabletDevice() ? "85%" : "90%",
      maxWidth: responsiveUtils.isTabletDevice() ? 800 : 420,
      height: responsiveUtils.isTabletDevice() ? "80%" : "75%",
      maxHeight: responsiveUtils.isTabletDevice() ? 900 : 620,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 10,
      overflow: "hidden", // Clip content inside rounded corners
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
      color: theme.colors.textDark,
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
      backgroundColor: theme.colors.background,
    },
    tableCell: {
      flex: 1,
      fontSize: rf(13, { minSize: 11, maxSize: 15 }),
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    schemeInfoModalFooter: {
      flexDirection: "row",
      paddingHorizontal: rp(24),
      paddingVertical: rp(20),
      gap: rp(16),
      backgroundColor: COLORS.white,
      borderTopWidth: 1,
      borderTopColor: COLORS.border?.primary || "#e5e5e5",
      borderBottomLeftRadius: 24, // Align rounded corners at the bottom
      borderBottomRightRadius: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 10,
    },
    quickJoinButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: "hidden",
      shadowColor: theme.colors.secondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    quickJoinButtonGradient: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
    },
    quickJoinButtonText: {
      fontSize: rf(15, { minSize: 14, maxSize: 17 }),
      fontWeight: "700",
      color: COLORS.dark,
      letterSpacing: 0.3,
    },
    joinSchemesButton: {
      flex: 1,
      borderRadius: 14,
      overflow: "hidden",
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    joinSchemesButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: rp(16),
      gap: rp(8),
      height: 56,
    },
    joinSchemesButtonText: {
      fontSize: rf(15, { minSize: 14, maxSize: 17 }),
      fontWeight: "700",
      color: COLORS.white,
      letterSpacing: 0.3,
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
      color: theme.colors.textDark,
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
      color: theme.colors.textDark,
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
      color: theme.colors.textDark,
    },
    quickJoinGoldWeightValue: {
      fontSize: rf(18, { minSize: 16, maxSize: 20 }),
      fontWeight: "700",
      color: theme.colors.textDark,
    },
    quickJoinModalFooter: {
      paddingHorizontal: rp(24),
      paddingVertical: rp(20),
      paddingBottom: Platform.OS === 'ios' ? rp(34) : rp(24),
      borderTopWidth: 1,
      borderTopColor: COLORS.border?.primary || "#e5e5e5",
      backgroundColor: COLORS.white,
    },
    quickJoinSubmitButton: {
      borderRadius: 14,
      overflow: "hidden",
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    quickJoinSubmitButtonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0,
      elevation: 0,
    },
    quickJoinSubmitButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: rp(16),
      paddingHorizontal: rp(16),
      gap: rp(8),
      height: 56,
    },
    quickJoinSubmitButtonText: {
      fontSize: rf(16, { minSize: 14, maxSize: 18 }),
      fontWeight: "700",
      color: COLORS.white,
      letterSpacing: 0.5,
      textTransform: "uppercase",
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
      color: theme.colors.textDark,
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
      color: theme.colors.textDark,
    },
    quickJoinQuickAmountButtonTextActive: {
      color: COLORS.white,
    },

    // Floating Offer Card Styles
    floatingOfferContainer: {
      position: "absolute",
      bottom: Platform.OS === 'ios' ? 100 : 90,
      right: 16,
      width: 120,
      height: 160,
      borderRadius: 16,
      backgroundColor: "white",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
      zIndex: 9999,
      padding: 2,
    },
    floatingOfferCard: {
      width: "100%",
      height: "100%",
      borderRadius: 14,
      overflow: "hidden",
    },
    floatingOfferImage: {
      width: "100%",
      height: "100%",
      borderRadius: 14,
    },
    floatingDiscountBadge: {
      position: "absolute",
      top: 6,
      left: 6,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
    },
    floatingDiscountText: {
      color: "white",
      fontSize: 9,
      fontWeight: "800",
    },
    floatingOfferCloseButton: {
      position: "absolute",
      top: -8,
      right: -8,
      backgroundColor: "white",
      borderRadius: 12,
      zIndex: 10000,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 4,
    },

    // Offer Details Modal Styles
    offerModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    offerModalContent: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: "white",
      borderRadius: 24,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
      maxHeight: "80%",
    },
    offerModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#F0F0F0",
    },
    offerModalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#333",
      flex: 1,
      marginRight: 10,
    },
    offerModalCloseButton: {
      padding: 4,
    },
    offerModalBody: {
      padding: 20,
    },
    offerModalImage: {
      width: "100%",
      height: 180,
      borderRadius: 16,
      marginBottom: 16,
    },
    offerModalDiscountBadge: {
      backgroundColor: theme.colors.primary,
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 12,
    },
    offerModalDiscountText: {
      color: "white",
      fontWeight: "800",
      fontSize: 12,
      letterSpacing: 0.5,
    },
    offerModalSubtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: "#444",
      marginBottom: 16,
      fontWeight: "500",
    },
    offerModalValidityContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F9F9F9",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      marginBottom: 20,
    },
    offerModalValidityText: {
      marginLeft: 8,
      fontSize: 13,
      color: "#666",
      fontWeight: "600",
    },
    offerModalTermsContainer: {
      marginBottom: 24,
    },
    offerModalTermsTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#333",
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    offerModalTermItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 10,
      gap: 8,
    },
    offerModalTermText: {
      flex: 1,
      fontSize: 13,
      color: "#666",
      lineHeight: 18,
    },
    floatingPill: {
      position: "absolute",
      bottom: Platform.OS === "ios" ? 100 : 80,
      right: 16,
      zIndex: 9999,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: "#D4AF37",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 8,
      maxWidth: 200,
    },
    floatingPillGradient: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 18,
    },
    floatingPillTitle: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
      maxWidth: 110,
    },
    floatingPillTime: {
      color: "#FFD700",
      fontSize: 11,
      fontWeight: "bold",
      marginTop: 1,
    },
    floatingPillClose: {
      paddingLeft: 4,
    },
  })
}

var styles = getStyles(theme);;
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
    paddingTop: Platform.OS === "ios" ? rp(0) : rp(12),
  },
});

const styles2 = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    height: '85%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: COLORS.white,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text.dark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.mediumGrey,
    marginTop: 4,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 16,
  },
  closeButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: theme.colors.textDark,
    marginLeft: 4,
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitText: {
    fontSize: 12,
    color: theme.colors.textDark,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 14,
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  goldIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.dark,
    letterSpacing: 0.5,
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
    gap: 10,
  },
  quickAmountButton: {
    backgroundColor: theme.colors.bgWhiteLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30, // Pill shape
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    color: theme.colors.textDark,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: rp(24),
    paddingVertical: rp(20),
    paddingBottom: Platform.OS === 'ios' ? rp(34) : rp(24),
    borderTopWidth: 1,
    borderTopColor: COLORS.border?.primary || "#e5e5e5",
    backgroundColor: COLORS.white,
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rp(16),
    paddingHorizontal: rp(16),
    height: 56,
    gap: rp(8),
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
    fontSize: rf(16, { minSize: 14, maxSize: 18 }),
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Linking,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import useGlobalStore, { useAppTheme } from "@/store/global.store";
import StatusView from "@/components/StatusView";
import { resolveRateChange, syncRateHistory } from "@/utils/rateComparison";

// Home V2 Modular Components
import HeaderV2 from "./HeaderV2";
import FlashNewsV2 from "./FlashNewsV2";
import KycPendingActionCardV2 from "./KycPendingActionCardV2";
import LiveRatesCardV2 from "./LiveRatesCardV2";
import StoriesListV2 from "./StoriesListV2";
import BannerSliderV2 from "./BannerSliderV2";
import QuickActionsV2 from "./QuickActionsV2";
import PopularSchemesV2 from "./PopularSchemesV2";
import YourSavingsCardV2 from "./YourSavingsCardV2";
import ConnectWithUsV2 from "./ConnectWithUsV2";
import SupportCardV2 from "./SupportCardV2";
import ChatCardV2 from "./ChatCardV2";

export interface HomePageV2Props {
  homeData?: any;
  collectionsData?: any[];
  sliderImages?: any[];
  refreshing?: boolean;
  onRefresh?: () => void;
  totalGoldSavings?: number;
  totalAmount?: number;
  kycStatus?: boolean | null;
  isKycLoading?: boolean;
  flashNews?: string[];
}

export const HomePageV2: React.FC<HomePageV2Props> = ({
  homeData,
  collectionsData = [],
  sliderImages = [],
  refreshing = false,
  onRefresh,
  totalGoldSavings = 0,
  totalAmount = 0,
  kycStatus = null,
  isKycLoading = false,
  flashNews = [],
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { user } = useGlobalStore();
  const { isVisible, visibleData } = useAppVisibility();

  // Status View (Stories Modal) State
  const [showStatus, setShowStatus] = useState(false);
  const [selectedCollectionIndex, setSelectedCollectionIndex] = useState(0);

  const handleStoryPress = (item: any, index: number) => {
    setSelectedCollectionIndex(index >= 0 ? index : 0);
    setShowStatus(true);
  };

  const handleStatusClose = () => {
    setShowStatus(false);
  };

  // Helper for cascading V2 visibility
  const checkVisible = (v2Key: string, fallbackKey: string): boolean => {
    if (visibleData && (visibleData as any)[v2Key] !== undefined) {
      return (visibleData as any)[v2Key] === 1;
    }
    return isVisible(fallbackKey as any);
  };

  // Extract Flash News messages
  const showFlashNews = checkVisible("showV2FlashNews", "showFlashnews");
  const flashNewsMessages = useMemo(() => {
    if (flashNews && flashNews.length > 0) return flashNews;
    const raw = homeData?.data?.flashNews;
    if (Array.isArray(raw)) {
      return raw
        .map((item: any) =>
          typeof item === "string" ? item : item?.title || item?.description || ""
        )
        .filter(Boolean);
    }
    return [];
  }, [flashNews, homeData?.data?.flashNews]);

  // Determine if KYC is pending
  const isKycPending = useMemo(() => {
    if (isKycLoading) return false;
    if (kycStatus === false) return true;
    if (kycStatus === true) return false;
    // Fallback to homeData pre-fetched KYC status
    const kycData = homeData?.data?.kycStatus;
    if (kycData) {
      const status = kycData.kyc_status;
      const hasData = kycData.data;
      if (status === "Completed" || hasData) return false;
      return true;
    }
    return false;
  }, [kycStatus, isKycLoading, homeData?.data?.kycStatus]);

  // Default section sequence (pendingAction is placed at the top of content)
  const DEFAULT_V2_SECTIONS = [
    "pendingAction",
    "liveRates",
    "stories",
    "posters",
    "quickActions",
    "popularSchemes",
    "savings",
    "socialMedia",
    "supportCard",
    "liveChat",
  ];

  // Dynamic section order based on admin configuration
  const sectionsOrder = useMemo(() => {
    const rawOrder = visibleData?.homeV2SectionsOrder;
    if (!rawOrder) return DEFAULT_V2_SECTIONS;
    const parsed = rawOrder
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    // Ensure pendingAction is always evaluated at top if not explicitly placed
    if (!parsed.includes("pendingAction")) {
      parsed.unshift("pendingAction");
    }
    // Append any default sections not present in custom order
    DEFAULT_V2_SECTIONS.forEach((s) => {
      if (!parsed.includes(s)) {
        parsed.push(s);
      }
    });
    return parsed;
  }, [visibleData?.homeV2SectionsOrder]);

  // Extract Rates & Rate Comparison
  const currentRates = homeData?.data?.currentRates;
  const goldRate =
    currentRates?.gold_rate ||
    currentRates?.gold_rate_22 ||
    "6,485";
  const silverRate = currentRates?.silver_rate || "78.50";
  const updatedAt =
    currentRates?.updated_at ||
    currentRates?.created_at ||
    currentRates?.date;

  // Track cached previous rates from local storage
  const [cachedPrevRates, setCachedPrevRates] = useState<{
    previousGold: number | null;
    previousSilver: number | null;
  }>({ previousGold: null, previousSilver: null });

  useEffect(() => {
    if (goldRate && silverRate) {
      syncRateHistory(goldRate, silverRate, updatedAt).then((prev) => {
        if (prev.previousGold !== null || prev.previousSilver !== null) {
          setCachedPrevRates(prev);
        }
      });
    }
  }, [goldRate, silverRate, updatedAt]);

  // Accurately resolve change comparing today vs yesterday rate without fake defaults
  const goldChange = useMemo(() => {
    return resolveRateChange(
      goldRate,
      currentRates?.gold_change,
      currentRates?.previous_gold_rate,
      cachedPrevRates.previousGold
    );
  }, [goldRate, currentRates?.gold_change, currentRates?.previous_gold_rate, cachedPrevRates.previousGold]);

  const silverChange = useMemo(() => {
    return resolveRateChange(
      silverRate,
      currentRates?.silver_change,
      currentRates?.previous_silver_rate,
      cachedPrevRates.previousSilver
    );
  }, [silverRate, currentRates?.silver_change, currentRates?.previous_silver_rate, cachedPrevRates.previousSilver]);

  // Render individual section dynamically
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "pendingAction":
        return isKycPending ? (
          <KycPendingActionCardV2 key="pendingAction" />
        ) : null;

      case "liveRates":
        return checkVisible("showV2LiveRates", "showGoldRate") ? (
          <LiveRatesCardV2
            key="liveRates"
            goldRate={goldRate}
            silverRate={silverRate}
            goldChange={goldChange}
            silverChange={silverChange}
            goldPurity="22K"
            updatedAt={updatedAt}
          />
        ) : null;

      case "stories":
        return checkVisible("showV2Stories", "showCollection") ? (
          <StoriesListV2
            key="stories"
            collections={collectionsData}
            onStoryPress={handleStoryPress}
          />
        ) : null;

      case "posters":
        return checkVisible("showV2Poster", "showPoster") ? (
          <BannerSliderV2 key="posters" banners={sliderImages} />
        ) : null;

      case "quickActions":
        return checkVisible("showV2QuickActions", "showCustomerCard") ? (
          <QuickActionsV2 key="quickActions" />
        ) : null;

      case "popularSchemes":
        return checkVisible("showV2PopularSchemes", "showSchemes") ? (
          <PopularSchemesV2
            key="popularSchemes"
            schemes={homeData?.data?.schemes}
          />
        ) : null;

      case "savings":
        return checkVisible("showV2Savings", "showCustomerCard") ? (
          <YourSavingsCardV2
            key="savings"
            totalAmount={totalAmount ?? 0}
            totalGoldGrams={totalGoldSavings}
          />
        ) : null;

      case "socialMedia":
        return checkVisible("showV2SocialMedia", "showSocialMedia") ? (
          <ConnectWithUsV2
            key="socialMedia"
            socialMediaUrls={homeData?.data?.socialmedia}
          />
        ) : null;

      case "supportCard":
        return checkVisible("showV2SupportCard", "showSupportCard") ? (
          <SupportCardV2 key="supportCard" />
        ) : null;

      case "liveChat":
        return checkVisible("showV2LiveChatBox", "showLiveChatBox") ? (
          <ChatCardV2 key="liveChat" />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Header (Always visible) */}
      <HeaderV2 />

      {/* 2. Flash News Marquee Ticker (Right below Header if enabled & has messages) */}
      {showFlashNews && flashNewsMessages.length > 0 && (
        <FlashNewsV2 messages={flashNewsMessages} />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#003C28", "#C59B27"]}
            tintColor="#003C28"
          />
        }
      >
        {/* Dynamic V2 Sections rendered in configured order (Pending Action, Live Rates, etc.) */}
        {sectionsOrder.map((sectionId: string) => renderSection(sectionId))}

        {/* Powered By Footer */}
        <View style={styles.poweredByContainer}>
          <TouchableOpacity
            style={styles.poweredByButton}
            onPress={() => Linking.openURL("http://agnisofterp.com/")}
            activeOpacity={0.7}
          >
            <Text style={styles.poweredByText}>Powered by </Text>
            <Text style={styles.poweredByLink}>agnisofterp.com</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Full-Screen Stories Modal */}
      {collectionsData && collectionsData.length > 0 && (
        <StatusView
          collections={collectionsData}
          isVisible={showStatus}
          initialCollectionIndex={selectedCollectionIndex}
          onClose={handleStatusClose}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FAF9F6", // Warm premium off-white luxury canvas
  },
  scrollContent: {
    paddingBottom: 24,
  },
  poweredByContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  poweredByButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  poweredByText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  poweredByLink: {
    fontSize: 11,
    color: "#003C28",
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 30,
  },
});

export default HomePageV2;

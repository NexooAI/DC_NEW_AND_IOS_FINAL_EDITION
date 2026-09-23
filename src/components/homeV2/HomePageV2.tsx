import React, { useState, useMemo } from "react";
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

// Home V2 Modular Components
import HeaderV2 from "./HeaderV2";
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
}

export const HomePageV2: React.FC<HomePageV2Props> = ({
  homeData,
  collectionsData = [],
  sliderImages = [],
  refreshing = false,
  onRefresh,
  totalGoldSavings = 0,
  totalAmount = 0,
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

  // Default section sequence
  const DEFAULT_V2_SECTIONS = [
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
      .map((s) => s.trim())
      .filter(Boolean);
    // Append any default sections not present in custom order
    DEFAULT_V2_SECTIONS.forEach((s) => {
      if (!parsed.includes(s)) {
        parsed.push(s);
      }
    });
    return parsed;
  }, [visibleData?.homeV2SectionsOrder]);

  // Helper for cascading V2 visibility
  const checkVisible = (v2Key: string, fallbackKey: string): boolean => {
    if (visibleData && (visibleData as any)[v2Key] !== undefined) {
      return (visibleData as any)[v2Key] === 1;
    }
    return isVisible(fallbackKey as any);
  };

  // Render individual section dynamically
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "liveRates":
        return checkVisible("showV2LiveRates", "showGoldRate") ? (
          <LiveRatesCardV2
            key="liveRates"
            goldRate={goldRate}
            silverRate={silverRate}
            goldChange="+12"
            silverChange="+0.50"
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

  // Extract Rates
  const goldRate =
    homeData?.data?.currentRates?.gold_rate ||
    homeData?.data?.currentRates?.gold_rate_22 ||
    "6,485";
  const silverRate = homeData?.data?.currentRates?.silver_rate || "78.50";
  const updatedAt =
    homeData?.data?.currentRates?.updated_at ||
    homeData?.data?.currentRates?.created_at ||
    homeData?.data?.currentRates?.date;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Header (Always visible) */}
      <HeaderV2 />

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
        {/* Dynamic V2 Sections rendered in configured order */}
        {sectionsOrder.map((sectionId) => renderSection(sectionId))}

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

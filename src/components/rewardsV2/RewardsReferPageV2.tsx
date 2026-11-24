import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore, { useAppTheme } from "@/store/global.store";
import { rewardsAPI, investmentAPI } from "@/services/api";

import HeaderV2 from "./HeaderV2";
import WalletHeroCardV2 from "./WalletHeroCardV2";
import ReferralCodeCardV2 from "./ReferralCodeCardV2";
import SegmentedTabsV2, { RewardsTabType } from "./SegmentedTabsV2";
import ReferTiersSectionV2 from "./ReferTiersSectionV2";
import MyReferralsSectionV2 from "./MyReferralsSectionV2";
import RedeemFaqSectionV2 from "./RedeemFaqSectionV2";
import StickyBottomBarV2 from "./StickyBottomBarV2";

export interface RewardsReferPageV2Props {
  onBack?: () => void;
  onHistoryPress?: () => void;
}

export const RewardsReferPageV2: React.FC<RewardsReferPageV2Props> = ({
  onBack,
  onHistoryPress,
}) => {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useGlobalStore();

  const [activeTab, setActiveTab] = useState<RewardsTabType>("refer");
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pointRate, setPointRate] = useState(1);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [visitBranchModalVisible, setVisitBranchModalVisible] = useState(false);
  const [noInvestmentModalVisible, setNoInvestmentModalVisible] = useState(false);
  const [redeemChecking, setRedeemChecking] = useState(false);

  // Tab fade animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const referralCode = user?.referralCode || "SMG2026";
  const primaryColor = theme?.colors?.primary || "#850111";

  const fetchData = useCallback(
    async (showLoader = true) => {
      if (!user?.id) return;
      if (showLoader) setLoading(true);

      try {
        const [walletRes, referralsRes] = await Promise.allSettled([
          rewardsAPI.getWalletInfo(user.id),
          rewardsAPI.getMyReferrals(user.id),
        ]);

        if (walletRes.status === "fulfilled" && walletRes.value?.data?.success) {
          const walletData = walletRes.value.data.data;
          setBalance(walletData.balance || 0);
          setTotalEarned(walletData.total_earned || 0);

          // Dynamic point value from backend API
          const dynamicRate =
            walletData.point_value ??
            walletData.point_rate ??
            walletData.conversion_rate ??
            walletData.value_per_point ??
            1;
          setPointRate(Number(dynamicRate) || 1);

          if (Array.isArray(walletData.history)) {
            setHistory(walletData.history);
          }
        }

        if (referralsRes.status === "fulfilled" && referralsRes.value?.data?.success) {
          const refData = referralsRes.value.data.data;
          if (Array.isArray(refData)) {
            setReferrals(refData);
          }
        }
      } catch (error) {
        console.error("Error fetching Rewards & Refer V2 data:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [fetchData])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  const handleTabChange = (newTab: RewardsTabType) => {
    if (newTab === activeTab) return;
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveTab(newTab);
  };

  const handleRedeemPress = async () => {
    if (!user?.id) return;
    setRedeemChecking(true);

    try {
      const response = await investmentAPI.getUserInvestments(user.id);
      const investments = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data?.investments)
        ? response.data.investments
        : [];

      const hasActiveScheme = investments.length > 0;

      if (hasActiveScheme) {
        setVisitBranchModalVisible(true);
      } else {
        setNoInvestmentModalVisible(true);
      }
    } catch (error) {
      console.error("Error checking investments in V2:", error);
      setVisitBranchModalVisible(true);
    } finally {
      setRedeemChecking(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme?.colors?.background || "#FFFFFF" }]} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme?.colors?.background || "#FFFFFF"}
        translucent={false}
      />

      {/* Header */}
      <HeaderV2 onBack={onBack} onHistoryPress={onHistoryPress} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        {/* 1. Golden Wallet Hero Card */}
        <WalletHeroCardV2
          balance={balance}
          totalEarned={totalEarned}
          pointRate={pointRate}
          onRedeemPress={handleRedeemPress}
          loading={redeemChecking}
        />

        {/* 2. Referral Code Card */}
        <ReferralCodeCardV2 code={referralCode} />

        {/* 3. Segmented Switcher */}
        <SegmentedTabsV2
          activeTab={activeTab}
          onTabChange={handleTabChange}
          referralsCount={referrals.length}
        />

        {/* 4. Tab Content Area with Smooth Animation */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {activeTab === "refer" && <ReferTiersSectionV2 />}
          {activeTab === "referrals" && (
            <MyReferralsSectionV2
              referrals={referrals}
              history={history}
              walletBalance={balance}
              walletTotalEarned={totalEarned}
              loading={loading}
            />
          )}
          {activeTab === "guide" && <RedeemFaqSectionV2 />}
        </Animated.View>
      </ScrollView>

      {/* 5. Sticky Bottom WhatsApp & Share Bar */}
      <StickyBottomBarV2
        referralCode={referralCode}
        baseUrl={theme?.baseUrl || "https://api.prod.srimurugangoldhouse.in"}
      />

      {/* Visit Branch Modal */}
      <Modal
        visible={visitBranchModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisitBranchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="storefront" size={38} color="#850111" />
            </View>
            <Text style={styles.modalTitle}>
              {t("visitBranchToRedeemTitle") || "Visit Branch to Redeem"}
            </Text>
            <Text style={styles.modalDesc}>
              {t("visitBranchToRedeemDesc") ||
                "Please visit our showroom/branch directly with your registered phone number to redeem your reward points towards your purchase or scheme discount."}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: primaryColor }]}
              onPress={() => setVisitBranchModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>{t("ok") || "Got it!"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* No Investment Modal */}
      <Modal
        visible={noInvestmentModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNoInvestmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconBox, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="alert-circle" size={38} color="#E65100" />
            </View>
            <Text style={styles.modalTitle}>
              {t("investFirst") || "Join a Scheme First!"}
            </Text>
            <Text style={styles.modalDesc}>
              {t("noInvestmentDesc") ||
                "You need at least one active gold saving scheme or investment to redeem your reward points."}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: primaryColor }]}
              onPress={() => {
                setNoInvestmentModalVisible(false);
                router.push("/(app)/(tabs)/home/schemes");
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>
                {t("clickToJoinScheme") || "Explore Schemes"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setNoInvestmentModalVisible(false)}
            >
              <Text style={styles.modalDismissText}>{t("close") || "Close"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDFBF7",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFF8E1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 10,
  },
  modalDesc: {
    fontSize: 13,
    color: "#616161",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  modalButton: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalDismissBtn: {
    marginTop: 12,
    paddingVertical: 6,
  },
  modalDismissText: {
    fontSize: 13,
    color: "#9E9E9E",
    fontWeight: "600",
  },
});

export default RewardsReferPageV2;

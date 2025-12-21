import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Animated,
  ScrollView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient"; // For gradient background
// AppHeader is now handled by the layout wrapper
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import AuthGuard from "@/components/AuthGuard";
import { formatGoldWeight } from "@/utils/imageUtils";
import EnhancedSchemeCard from "./EnhancedSchemeCard";
import {
  SkeletonSavingsCard,
  SkeletonSavingsPortfolio,
} from "@/components/SkeletonLoader";

import { logger } from "@/utils/logger";
type Transaction = {
  id: string;
  date: string;
  amount: number;
  status: string;
};

type Scheme = {
  chitId: string | number | (string | number)[];
  investmentId: string;
  id: string;
  schemeName: string;
  metalType: string; // "gold" or "silver"
  savingType: string; // "weight" or "amount"
  status?: string; // e.g., "ACTIVE" or "INACTIVE"
  totalPaid: number;
  monthsPaid: number;
  emiAmount: number;
  maturityDate: string; // parsed date string
  goldWeight: number;
  accountHolder: string; // accountName
  accNo: string; // accountNo
  schemeCode: string;
  noOfIns: string;
  transactions: Transaction[];
  joiningDate: string; // parsed date string
  schemesData: any;
  chitData: any;
  paymentFrequency: string; // Add payment frequency
};

interface InvestmentResponse {
  investmentId: string;
  schemeName?: string;
  scheme?: {
    schemeId: string;
    schemeName: string;
    type: string;
    schemeType: string;
  };
  chits?: {
    amount: string;
    noOfInstallments: number;
  };
  status: string;
  total_paid: string;
  lastInstallment: number;
  start_date: string;
  end_date: string;
  totalgoldweight: string;
  accountName: string;
  accountNo: string;
  amount: string;
  paymentFrequency: string;
  rewards?: Array<{
    id: number;
    amount: number;
    gold_grams: string;
    date: string;
    investment_id: number;
  }>;
}

export default function SavingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { language, user } = useGlobalStore();

  const [savings, setSavings] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"Fixed" | "Flexi">("Fixed");
  const { bottom, top } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Increased bottomPadding multiplier from 0.1 to 0.2
  const bottomPadding = height * 0.1 + bottom;

  // Fetch user investment data
  const fetchUserData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      //logger.log("=== FETCHING SAVINGS LIST ===");
      const response = await api.get(`investments/user_investments/${user.id}`, { skipLoading: true } as any);
      // Fetch rewards data
      let rewardsResponse: any = null;
      try {
        rewardsResponse = await api.post(`/payments/rewards-list?userId=${user.id}`, {}, { skipLoading: true } as any);
        logger.log("Rewards data:", rewardsResponse);
      } catch (rewardsApiError: any) {
        // Log error but don't fail the entire fetch if rewards API fails
        logger.warn("Error fetching rewards API:", rewardsApiError);
        rewardsResponse = null;
      }
      // Defensive: log and check response structure


      // Improved error handling: check for backend error
      if (response?.data?.success === false) {
        const backendMsg =
          response.data.message || "Failed to fetch savings data.";
        setError(backendMsg);
        setLoading(false);
        return;
      }

      // Accept both 'data' and 'investments' as possible array fields
      let investments: any[] = [];
      if (Array.isArray(response?.data?.data)) {
        investments = response.data.data;
      } else if (Array.isArray(response?.data?.investments)) {
        investments = response.data.investments;
      } else if (response?.data?.data) {
        // Unexpected structure, log for debugging
        logger.error(
          "Expected investments to be an array, got:",
          response.data.data
        );
        // Show backend error message if available
        const backendMsg =
          response.data.data && response.data.data.message
            ? response.data.data.message
            : null;
        setError(
          backendMsg ||
          "Unexpected data format received from server. Please try again later."
        );
        setLoading(false);
        return;
      } else {
        // No data field or data is undefined
        logger.error("No investments data found in response:", response.data);
        // Show backend error message if available
        const backendMsg =
          response.data && response.data.message ? response.data.message : null;
        setError(
          backendMsg || "No savings data found. Please try again later."
        );
        setLoading(false);
        return;
      }

      // If investments is empty and success is true, do not set error (show EmptyState)
      if (Array.isArray(investments) && investments.length === 0) {
        setSavings([]);
        setLoading(false);
        return;
      }
      logger.log("Rewards data:", rewardsResponse, "investments", investments);
      // Process rewards data and add to investments
      if (rewardsResponse?.data?.success && Array.isArray(rewardsResponse.data.rewards)) {
        // Group rewards by investment_id
        const rewardsByInvestmentId: Map<string | number, any[]> = new Map();
        rewardsResponse.data.rewards.forEach((reward: any) => {
          const investmentId = reward.investment_id?.toString();
          if (investmentId) {
            if (!rewardsByInvestmentId.has(investmentId)) {
              rewardsByInvestmentId.set(investmentId, []);
            }
            rewardsByInvestmentId.get(investmentId)?.push(reward);
          }
        });

        // Add rewards array to each matching investment
        investments = investments.map((investment: any) => {
          const investmentIdStr = investment.investmentId?.toString() || "";
          const matchingRewards = rewardsByInvestmentId.get(investmentIdStr) || [];
          return {
            ...investment,
            rewards: matchingRewards,
          };
        });
      } else {
        // API failed or no rewards data, add empty array to all investments
        investments = investments.map((investment: any) => ({
          ...investment,
          rewards: [],
        }));
      }
      logger.log("Investments with rewards:", investments);
      // Validate and transform each investment
      const transformedSavings: Scheme[] = investments
        .filter((item: InvestmentResponse) => {
          // Basic validation
          const isValid =
            item.investmentId && (item.schemeName || item.scheme?.schemeName);
          if (!isValid) {
            logger.warn("Invalid investment item:", item);
          }
          return isValid;
        })
        .map((item: InvestmentResponse) => {
          const schemeObj = item.scheme || {
            schemeId: "",
            schemeName: "",
            type: "gold",
            schemeType: "weight",
          };
          const chit = item.chits || {
            amount: "0",
            noOfInstallments: 0,
          };

          // Log each investment item for debugging
          /* logger.log("Processing investment item:", {
             investmentId: item.investmentId,
             schemeName: schemeObj.schemeName || item.schemeName,
             emiAmount: chit.amount,
             paymentFrequency: item.paymentFrequency,
             schemeType: schemeObj.schemeType,
             totalPaid: item.total_paid,
             monthsPaid: item.lastInstallment,
             noOfInstallments: chit.noOfInstallments,
           }); */

          // Parse dates with error handling
          const doj = item.start_date
            ? new Date(item.start_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            : "N/A";

          const dom = item.end_date
            ? new Date(item.end_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            : "N/A";

          // Calculate installment amount based on scheme type with validation
          let installmentAmount = 0;
          try {
            installmentAmount = parseFloat(item.amount) || 0;

            // Validate installment amount
            if (isNaN(installmentAmount) || installmentAmount <= 0) {
              logger.warn(
                `Invalid installment amount for investment ${item.investmentId}:`,
                installmentAmount
              );
              installmentAmount = 0;
            }
          } catch (error) {
            logger.error(
              `Error calculating installment amount for investment ${item.investmentId}:`,
              error
            );
            installmentAmount = 0;
          }

          // Calculate total paid with validation
          let totalPaid = 0;
          try {
            totalPaid = parseFloat(item.total_paid) || 0;
            if (isNaN(totalPaid) || totalPaid < 0) {
              logger.warn(
                `Invalid total paid for investment ${item.investmentId}:`,
                totalPaid
              );
              totalPaid = 0;
            }
          } catch (error) {
            logger.error(
              `Error calculating total paid for investment ${item.investmentId}:`,
              error
            );
            totalPaid = 0;
          }

          // Calculate gold weight with validation
          let goldWeight = 0;
          try {
            goldWeight = parseFloat(item.totalgoldweight) || 0;
            if (isNaN(goldWeight) || goldWeight < 0) {
              logger.warn(
                `Invalid gold weight for investment ${item.investmentId}:`,
                goldWeight
              );
              goldWeight = 0;
            }
          } catch (error) {
            logger.error(
              `Error calculating gold weight for investment ${item.investmentId}:`,
              error
            );
            goldWeight = 0;
          }

          // Validate months paid
          const monthsPaid = Math.max(0, item.lastInstallment || 0);

          let chitId: string | number | (string | number)[] = "";
          if (item.chits && "chitId" in item.chits) {
            const val = item.chits.chitId;
            if (
              typeof val === "string" ||
              typeof val === "number" ||
              (Array.isArray(val) &&
                val.every(
                  (v) => typeof v === "string" || typeof v === "number"
                ))
            ) {
              chitId = val;
            }
          }
          return {
            chitId,
            investmentId: item.investmentId || "",
            id: item.investmentId,
            schemeName:
              schemeObj.schemeName || item.schemeName || "Unknown Scheme",
            metalType: schemeObj.type ? schemeObj.type.toLowerCase() : "gold",
            savingType: schemeObj.schemeType
              ? schemeObj.schemeType.toLowerCase()
              : "weight",
            status: item.status || "active",
            totalPaid,
            monthsPaid,
            emiAmount: installmentAmount,
            maturityDate: dom,
            goldWeight,
            accountHolder: item.accountName || "",
            accNo: item.accountNo || "",
            joiningDate: doj,
            schemeCode: schemeObj.schemeId ? schemeObj.schemeId.toString() : "",
            noOfIns: chit.noOfInstallments
              ? chit.noOfInstallments.toString()
              : "0",
            schemesData: schemeObj,
            chitData: chit,
            transactions: [],
            paymentFrequency: item.paymentFrequency || "Monthly",
            rewards: item.rewards || [],
          };
        });


      setSavings(transformedSavings);
    } catch (err: any) {
      logger.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch savings data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  const translations = useMemo(
    () => ({
      yourGoldPortfolio: t("yourGoldPortfolio"),
      totalInvested: t("totalInvested"),
      activeSavingsPlans: t("activeSavingsPlans"),
      monthsPaid: t("monthsPaid"),
      monthlyEMI: t("monthlyEMI"),
      monthsRemaining: t("monthsRemaining"),
      maturesOn: t("maturesOn"),
      noActiveSchemes: t("noActiveSavingsSchemesFound"),
      gold: t("gold"),
      viewDetails: t("viewDetails"),
      payNow: t("payNow"),
      accountHolderLabel: t("accountHolderLabel"),
      accountNumberLabel: t("accountNumberLabel"),
      frequency: t("frequency"),
      totalWeight: t("totalWeight"),
      installmentProgress: t("installmentProgress"),
      investmentTimeline: t("investmentTimeline"),
      started: t("started"),
      currentProgress: t("currentProgress"),
      maturity: t("maturity"),
      paid: t("paid"),
      pending: t("pending"),
      total: t("total"),
      startNewSavings: t("startNewSavings"),
      fixed: t("fixed"),
      flexi: t("flexi"),
      totalInvestedLabel: t("totalInvestedLabel"),
      goldWeightLabel: t("goldWeightLabel"),
      monthlyEMILabel: t("monthlyEMILabel"),
      rewardGoldLabel: t("rewardGoldLabel"),
      rewardAmountLabel: t("rewardAmountLabel"),
      progressLabel: t("progressLabel"),
      remainingLabel: t("remainingLabel"),
      statusLabel: t("statusLabel"),
      monthsLabel: t("monthsLabel"),
      completeLabel: t("completeLabel"),
      somethingWentWrong: t("somethingWentWrong"),
      errorLoadingSavings: t("errorLoadingSavings"),
      retry: t("retry"),
    }),
    [language]
  );

  const totalInvested = savings.reduce((acc, curr) => acc + curr.totalPaid, 0);
  const totalGold = savings.reduce((acc, curr) => acc + curr.goldWeight, 0);
  const hasAmountType = savings.some((s) => s.savingType === "amount");

  // Filtered savings based on selectedType
  const filteredSavings = useMemo(() => {
    return savings.filter((item: any) => {
      const schemeType = item.schemesData.paymentFrequencyName;
      if (selectedType === "Flexi") {
        return schemeType === "Flexi";
      } else {
        return schemeType !== "Flexi";
      }
    });
  }, [savings, selectedType]);

  // Memoized renderItem for FlatList
  const renderSchemeItem = useCallback(
    ({ item }: { item: any }) => (
      <EnhancedSchemeCard item={item} translations={translations} />
    ),
    [translations]
  );

  // Component definitions - moved before early returns
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {!hasAmountType && (
        <LinearGradient
          colors={theme.colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.portfolioCard}
        >
          <View style={styles.portfolioStats}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Image
                  source={require("../../../../../assets/images/saveasmoneyproduct.png")}
                  style={{ width: 20, height: 20 }}
                />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>
                  {translations.totalInvested}
                </Text>
                <Text style={styles.statValue}>
                  ₹{totalInvested.toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Image
                  source={require("../../../../../assets/images/savegold.png")}
                  style={{ width: 20, height: 20 }}
                />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>{translations.gold}</Text>
                <Text style={styles.statValue}>{totalGold.toFixed(2)} g</Text>
              </View>
            </View>
          </View>


        </LinearGradient>
      )}
      <Text style={styles.sectionTitle}>{translations.activeSavingsPlans}</Text>
      <FilterToggle />
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <LinearGradient
        colors={theme.colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyStateGradient}
      >
        <Image
          source={require("../../../../../assets/images/no-data.png")}
          style={styles.emptyStateImage}
          resizeMode="contain"
        />
        <Text style={styles.emptyStateTitle}>
          {translations.noActiveSchemes}
        </Text>
        <Text style={styles.emptyStateSubtitle}>
          Start your gold savings journey today and build your wealth gradually
        </Text>
        <TouchableOpacity
          style={styles.startSavingsButton}
          onPress={() => {
            // Navigate to create new savings
            logger.log("Navigate to create savings");
            router.push("/(app)/(tabs)/home/schemes");
          }}
        >
          <Text style={styles.startSavingsButtonText}>
            {translations.startNewSavings}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  // Error State Component
  const ErrorState = () => (
    <View className="flex-1 justify-center items-center px-4">
      <Image
        source={require("../../../../../assets/images/no-data.png")}
        style={{ width: 150, height: 150, marginBottom: 20 }}
        resizeMode="contain"
      />
      <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
        {translations.somethingWentWrong}
      </Text>
      <Text className="text-gray-600 mb-6 text-center">
        {translations.errorLoadingSavings}
      </Text>
      <TouchableOpacity
        className="bg-red-600 px-6 py-3 rounded-lg flex-row items-center"
        onPress={fetchUserData}
        disabled={loading}
        style={{ opacity: loading ? 0.6 : 1 }}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={theme.colors.white}
            style={{ marginRight: 8 }}
          />
        ) : (
          <Ionicons name="refresh" size={20} color={theme.colors.white} className="mr-2" />
        )}
        <Text className="text-white font-semibold">
          {loading ? t("loading") : translations.retry}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Filter Toggle UI
  const FilterToggle = () => (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: theme.colors.cardBackground, // applied here
        borderRadius: 40,
        padding: 6,
        marginTop: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      }}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor:
            selectedType === "Fixed" ? theme.colors.primary : "transparent",
          borderRadius: 30,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 10,
          marginHorizontal: 2,
        }}
        onPress={() => setSelectedType("Fixed")}
        activeOpacity={0.8}
      >
        <Text
          style={{
            color:
              selectedType === "Fixed" ? theme.colors.white : theme.colors.textSecondary,
            fontWeight: "700",
            fontSize: 16,
            letterSpacing: 0.5,
          }}
        >
          {translations.fixed}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: selectedType === "Flexi" ? theme.colors.primary : "transparent",
          borderRadius: 30,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 10,
          marginHorizontal: 2,
        }}
        onPress={() => setSelectedType("Flexi")}
        activeOpacity={0.8}
      >
        <Text
          style={{
            color: selectedType === "Flexi" ? theme.colors.white : theme.colors.textSecondary,
            fontWeight: "700",
            fontSize: 16,
            letterSpacing: 0.5,
          }}
        >
          {translations.flexi}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Skeleton loading state component
  const SkeletonLoadingState = () => (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require("../../../../../assets/images/bg_new.jpg")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.1)",
            "rgba(0, 0, 0, 0.05)",
            "rgba(0, 0, 0, 0.02)",
          ]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          {/* Header Skeleton */}
          <View style={[styles.pageHeaderContainer, { paddingTop: top + 12 }]}>
            <Text style={styles.pageHeaderTitle}>
              {t("mySchemes") || "My Schemes"}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingBottom: bottomPadding,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Portfolio Skeleton */}
            <View style={styles.headerContainer}>
              <SkeletonSavingsPortfolio />
              
              {/* Section Title Skeleton */}
              <View style={{ alignItems: "center", marginVertical: 20 }}>
                <View style={{ width: 180, height: 22, backgroundColor: "#E1E9EE", borderRadius: 4 }} />
              </View>

              {/* Filter Toggle Skeleton */}
              <View style={{
                flexDirection: "row",
                backgroundColor: "#1a2a39",
                borderRadius: 40,
                padding: 6,
                marginBottom: 20,
              }}>
                <View style={{ flex: 1, height: 40, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 30, marginHorizontal: 2 }} />
                <View style={{ flex: 1, height: 40, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 30, marginHorizontal: 2 }} />
              </View>
            </View>

            {/* Savings Card Skeletons */}
            <SkeletonSavingsCard />
            <SkeletonSavingsCard style={{ marginTop: 16 }} />
            <SkeletonSavingsCard style={{ marginTop: 16 }} />
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );

  // Render loading state when no user
  const renderLoadingState = () => (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </SafeAreaView>
  );

  // Render error state
  const renderErrorState = () => (
    <SafeAreaView className="flex-1 bg-white">
      <ErrorState />
    </SafeAreaView>
  );

  // Render main content
  const renderMainContent = () => (
    <View style={{ flex: 1 }}>
      {/* <ImageBackground
        source={require("../../../../../assets/images/bg_new.jpg")}
        style={{ flex: 1 }}
        resizeMode="cover"
      > */}
        <View style={{ flex: 1 ,backgroundColor:theme.colors.tertiary}}> 
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.1)",
            "rgba(0, 0, 0, 0.05)",
            "rgba(0, 0, 0, 0.02)",
          ]}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          {/* Custom Header with Page Name */}
          <View style={[styles.pageHeaderContainer, { paddingTop: top + 12 }]}>
            <Text style={styles.pageHeaderTitle}>
              {t("mySchemes") || "My Schemes"}
            </Text>
          </View>

          <FlatList
            data={filteredSavings}
            keyExtractor={(item, index) =>
              item.id && item.id !== "" ? item.id : index.toString()
            }
            renderItem={renderSchemeItem}
            ListHeaderComponent={savings.length > 0 ? <ListHeader /> : null}
            ListEmptyComponent={<EmptyState />}
            contentContainerStyle={{
              paddingBottom: bottomPadding,
            }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
          />
        </SafeAreaView>
        </View>
      {/* </ImageBackground> */}
    </View>
  );

  return (
    <AuthGuard>
      {!user
        ? renderLoadingState()
        : loading
          ? <SkeletonLoadingState />
          : error
            ? renderErrorState()
            : renderMainContent()}
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  pageHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pageHeaderTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: theme.colors.white,
    textAlign: "center",
  },
  headerContainer: {
    paddingBottom: 0,
    paddingHorizontal: 10,
  },
  portfolioCard: {
    borderRadius: 24,
    padding: 0,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  portfolioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  portfolioTitleContainer: {
    flex: 1,
  },
  portfolioTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  portfolioBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  portfolioBadgeText: {
    color: theme.colors.gold,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  portfolioIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,215,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  portfolioStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: "rgba(249, 249, 249, 0.95)",
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,215,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 16,
  },
  portfolioFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "rgba(0, 0, 0, 0.89)",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(34, 34, 209, 0.24)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  cardWrapper: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  cardWrapperActive: {
    transform: [{ scale: 1.02 }],
    elevation: 12,
    shadowOpacity: 0.3,
  },
  cardBackgroundImage: {
    flex: 1,
  },
  cardBackgroundImageStyle: {
    borderRadius: 24,
    resizeMode: "cover",
  },
  cardContainer: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.81)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  schemeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  schemeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  schemeTitleContainer: {
    flex: 1,
  },
  schemeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  schemeSubtitleContainer: {
    flexDirection: "row",
    gap: 10,
  },
  metalTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(187, 240, 51, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  metalTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  savingTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  savingTypeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  statusText: {
    fontSize: 8,
    fontWeight: "600",
    color: "#000",
  },
  expandIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(133, 1, 17, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(133, 1, 17, 0.8)",
  },
  accountInfo: {
    flexDirection: "column",
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  accountLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  accountLabelItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  accountIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(228, 16, 41, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  accountLabel: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.8)",
    fontWeight: "600",
  },
  accountValuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "rgb(0, 0, 0)",
    flex: 1,
    textAlign: "center",
  },
  cardContent: {
    overflow: "hidden",
  },
  infoGrid: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.48)",
    borderRadius: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(228, 16, 41, 0.62)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "rgba(7, 0, 0, 0.8)",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(45, 22, 17, 0.78)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  dateSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(133, 1, 17, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  dateDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginHorizontal: 12,
  },
  progressContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  progressStats: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  progressMonths: {
    fontSize: 12,
    color: "rgba(14, 13, 13, 0.8)",
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#850111",
    borderRadius: 4,
  },
  monthsInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  monthItem: {
    alignItems: "center",
    gap: 4,
  },
  monthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  monthLabel: {
    fontSize: 12,
    color: "rgba(18, 18, 18, 0.8)",
  },
  monthValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 16,
    gap: 12,
  },
  detailsButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  detailsButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  detailsButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginRight: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  payNowButtonLarge: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  payNowButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  payNowButtonTextLarge: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginRight: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  paymentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    padding: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentInfoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  paymentInfoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(133, 1, 17, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "rgba(133, 1, 17, 0.95)",
  },
  paymentInfoContent: {
    flex: 1,
  },
  paymentInfoLabel: {
    fontSize: 13,
    color: "rgba(0, 0, 0, 0.7)",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paymentInfoValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#000",
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  paymentInfoDivider: {
    width: 2,
    height: 50,
    backgroundColor: "rgba(133, 1, 17, 0.3)",
    marginHorizontal: 16,
    borderRadius: 1,
  },
  emptyStateContainer: {
    padding: 6,
    marginTop: 2,
  },
  emptyStateCard: {
    borderRadius: 24,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  emptyStateGradient: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  startSavingsButton: {
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  startSavingsButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyStateIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: "rgba(255,215,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  emptyStateImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffd700",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#ffd700",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  emptyStateButtonText: {
    color: "#1a1a2e",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  enhancedInfoGrid: {
    marginBottom: 16,
  },
  enhancedInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  enhancedInfoItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  enhancedInfoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(133, 1, 17, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  enhancedInfoLabel: {
    fontSize: 11,
    color: "#000000",
    marginBottom: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  enhancedInfoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
  },
  smartTimelineContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  timelineContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timelineItem: {
    alignItems: "center",
    flex: 1,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#850111",
    marginBottom: 8,
  },
  timelineInfo: {
    alignItems: "center",
  },
  timelineLabel: {
    fontSize: 10,
    color: "#000000",
    marginBottom: 2,
    textAlign: "center",
  },
  timelineValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  timelineConnector: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(208, 32, 32, 0.3)",
    marginHorizontal: 8,
  },
});

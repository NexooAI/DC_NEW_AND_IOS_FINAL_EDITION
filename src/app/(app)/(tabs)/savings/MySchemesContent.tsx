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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient"; // For gradient background
// AppHeader is now handled by the layout wrapper
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import api from "@/services/api";
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import AuthGuard from "@/components/AuthGuard";
import { formatGoldWeight } from "@/utils/imageUtils";
import EnhancedSchemeCard from "./EnhancedSchemeCard";
import OldGoldSchemeCard from "./OldGoldSchemeCard";
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
  dueDate?: string;
};

interface InvestmentResponse {
  investmentId: string;
  schemeName?: string;
  scheme?: {
    schemeId: string;
    schemeName: string;
    type: string;
    schemeType: string;
    duration_months?: number | string;
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
  dueDate?: string;
  rewards?: Array<{
    id: number;
    amount: number;
    gold_grams: string;
    date: string;
    investment_id: number;
  }>;
}

export default function MySchemesContent({ isNested = false }: { isNested?: boolean }) {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const { t } = useTranslation();

  const router = useRouter();
  const { language, user } = useGlobalStore();
  const params = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  const [savings, setSavings] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Set initial tab based on params (default Active)
  const [selectedType, setSelectedType] = useState<"Active" | "Matured" | "Claimed" | "Drop">("Active");
  // Flexi vs Fixed filter (default to All)
  const [subFilter, setSubFilter] = useState<"All" | "Flexi" | "Fixed">("All");

  const { top } = useSafeAreaInsets();
  // Reduced bottomPadding to prevent massive blank gap above menu tab bar
  const bottomPadding = 20;

  // React to param changes to switch tabs even if component is already mounted
  useEffect(() => {
    logger.log("Params changed in SavingsScreen:", params);
    // Ignore fixed/flexi params now and just default to Active
  }, [params.schemeType, params.paymentFrequency]);

  // Robust switch based on actual data
  useEffect(() => {
    if (!loading && savings.length > 0 && params.investmentId) {
      const targetId = params.investmentId.toString();
      const targetItem = savings.find(s => s.id.toString() === targetId);

      if (targetItem) {
        const itemStatus = targetItem.status?.toLowerCase() || "active";
        let derivedType: "Active" | "Matured" | "Claimed" | "Drop" = "Active";
        if (itemStatus.includes("matured")) derivedType = "Matured";
        else if (itemStatus.includes("claim") || itemStatus.includes("closed")) derivedType = "Claimed";
        else if (itemStatus.includes("drop") || itemStatus.includes("cancel")) derivedType = "Drop";

        if (selectedType !== derivedType) {
          logger.log(`Found target investment ${targetId} in ${derivedType} list. Switching tab.`);
          setSelectedType(derivedType);
        }
      } else {
        logger.warn(`Target investment ${targetId} not found in user savings list.`);
      }
    }
  }, [loading, savings, params.investmentId]);

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
      if (response?.data?.success === false || response?.data?.data?.success === false) {
        const backendMsg =
          response?.data?.message ||
          response?.data?.data?.message ||
          "Failed to fetch savings data.";
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

      if (!Array.isArray(investments)) {
        investments = [];
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
              : (schemeObj.duration_months ? schemeObj.duration_months.toString() : "0"),
            schemesData: schemeObj,
            chitData: chit,
            transactions: [],
            paymentFrequency: item.paymentFrequency || "Monthly",
            rewards: item.rewards || [],
            dueDate: item.dueDate || "",
          };
        });


      let oldGoldDeposits: Scheme[] = [];
      try {
        const ogResponse = await api.get(`/old-gold/user/${user.id}`, { skipLoading: true } as any);
        if (ogResponse.data && ogResponse.data.success && Array.isArray(ogResponse.data.data)) {
          oldGoldDeposits = ogResponse.data.data.map((dep: any) => {
            const doj = dep.depositDate
              ? new Date(dep.depositDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              : "N/A";

            const dom = dep.maturityDate
              ? new Date(dep.maturityDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              : "N/A";

            return {
              chitId: dep.investmentId || "",
              investmentId: String(dep.id),
              id: String(dep.id),
              schemeName: dep.schemeName || "Old Gold Chit Scheme",
              metalType: "gold",
              savingType: "old_gold",
              status: dep.status || "active",
              totalPaid: dep.valuationAmount || 0,
              monthsPaid: 11 - Math.ceil(dep.daysToMaturity / 30) > 0 ? 11 - Math.ceil(dep.daysToMaturity / 30) : 0,
              emiAmount: 0,
              maturityDate: dom,
              goldWeight: dep.netGoldWeight || dep.net_gold_weight || 0,
              accountHolder: user.name || "",
              accNo: String(dep.id),
              joiningDate: doj,
              schemeCode: "OLD_GOLD",
              noOfIns: "11",
              transactions: [],
              paymentFrequency: "One-time",
              rewards: [],
              schemesData: {
                schemeId: "OLD_GOLD",
                schemeName: "Old Gold Chit Scheme",
                type: "gold",
                schemeType: "OLD_GOLD",
                paymentFrequencyName: "One-time",
                paymentFrequencyId: 4,
              },
              chitData: {
                amount: "0",
                noOfInstallments: 11,
              },
              grossWeight: dep.grossWeight,
              purityCarat: dep.purityCarat,
              daysToMaturity: dep.daysToMaturity,
              ornamentDescription: dep.ornamentDescription,
              ornamentPhotos: dep.ornamentPhotos,
              valuationAmount: dep.valuationAmount,
            };
          });
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          logger.log("ℹ️ Old gold deposits endpoint not found (404), skipping.");
        } else {
          logger.error("Error fetching old gold deposits in fetchUserData:", err);
        }
      }

      setSavings([...transformedSavings, ...oldGoldDeposits]);
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
      maturityDateLabel: t("maturityDateLabel"),
      noActiveSchemes: t("noActiveSavingsSchemesFound"),
      gold: t("gold"),
      viewDetails: t("viewDetails"),
      payNow: t("payNow"),
      accountHolderLabel: t("accountHolderLabel"),
      accountNumberLabel: t("accountNumberLabel"),
      frequency: t("frequency"),
      totalWeight: t("totalWeight"),
      paymentsMade: t("paymentsMade"),
      installmentProgress: t("installmentProgress"),
      investmentTimeline: t("investmentTimeline"),
      started: t("started"),
      currentProgress: t("currentProgress"),
      maturity: t("maturity"),
      paid: t("paid"),
      pending: t("pending"),
      total: t("total"),
      startNewSavings: t("startNewSavings"),
      joinNow: t("joinNow"),
      joinSchemes: t("joinSchemes"),
      fixed: t("fixed"),
      flexi: t("flexi"),
      filterAll: t("filterAll"),
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

  // Determine if the user has both types (at least one Fixed and at least one Flexi/Hybrid)
  // of schemes in the currently selected status tab.
  const showSubFilter = useMemo(() => {
    const statusMatchedSavings = savings.filter((item: any) => {
      const status = item.status?.toLowerCase() || "active";
      if (selectedType === "Active") return (status === "active" || status === "y");
      if (selectedType === "Matured") return (status === "matured");
      if (selectedType === "Claimed") return (status.includes("claim") || status === "closed");
      if (selectedType === "Drop") return (status.includes("drop") || status === "cancelled");
      return false;
    });

    let hasFixed = false;
    let hasFlexi = false;

    for (const item of statusMatchedSavings) {
      const nameStr = item.schemeName?.toLowerCase() || "";
      const freqStr = item.paymentFrequency?.toLowerCase() || "";
      // Flexi/Hybrid schemes have 'flexi' or 'hybrid' in name or payment frequency
      const isFlexi =
        freqStr.includes("flexi") ||
        nameStr.includes("flexi") ||
        freqStr.includes("hybrid") ||
        nameStr.includes("hybrid");

      if (isFlexi) {
        hasFlexi = true;
      } else {
        hasFixed = true;
      }

      if (hasFixed && hasFlexi) {
        return true;
      }
    }

    return false;
  }, [savings, selectedType]);

  // Filtered savings based on selectedType, subFilter and showSubFilter presence
  const filteredSavings = useMemo(() => {
    logger.log("Filtering savings for type:", selectedType, "and subFilter:", subFilter, "showSubFilter:", showSubFilter);
    return savings.filter((item: any) => {
      // 1. Core Status filtering
      const status = item.status?.toLowerCase() || "active";
      let statusMatch = false;
      if (selectedType === "Active") statusMatch = (status === "active" || status === "y");
      else if (selectedType === "Matured") statusMatch = (status === "matured");
      else if (selectedType === "Claimed") statusMatch = (status.includes("claim") || status === "closed");
      else if (selectedType === "Drop") statusMatch = (status.includes("drop") || status === "cancelled");

      if (!statusMatch) return false;

      // 2. SubFilter (Flexi vs Fixed) - only if we show sub-filters (both present)
      if (!showSubFilter) return true;

      const nameStr = item.schemeName?.toLowerCase() || "";
      const freqStr = item.paymentFrequency?.toLowerCase() || "";

      // Flexi schemes have 'flexi' or 'hybrid' in name or payment frequency
      const isFlexi =
        freqStr.includes("flexi") ||
        nameStr.includes("flexi") ||
        freqStr.includes("hybrid") ||
        nameStr.includes("hybrid");

      if (subFilter === "All") return true;
      if (subFilter === "Flexi" && isFlexi) return true;
      if (subFilter === "Fixed" && !isFlexi) return true;

      return false;
    });
  }, [savings, selectedType, subFilter, showSubFilter]);

  // Partition filtered savings to render regular schemes first, and then old gold schemes under a separate heading
  const listData = useMemo(() => {
    const regular = filteredSavings.filter(s => s.savingType !== 'old_gold');
    const oldGold = filteredSavings.filter(s => s.savingType === 'old_gold');

    const data: any[] = [...regular];
    if (oldGold.length > 0) {
      data.push({
        isHeader: true,
        title: t("oldGoldDeposits") || "Old Gold Schemes"
      });
      data.push(...oldGold);
    }
    return data;
  }, [filteredSavings, t]);

  // Auto-scroll to specific investment
  useEffect(() => {
    logger.log("Auto-scroll effect triggered:", {
      investmentId: params.investmentId,
      listDataLength: listData.length,
      loading,
      selectedType
    });

    if (params.investmentId && listData.length > 0 && !loading) {
      const index = listData.findIndex(
        (item) => !item.isHeader && item.id.toString() === params.investmentId?.toString()
      );

      logger.log("Auto-scroll index found:", index);

      if (index !== -1) {
        // Wait a bit for list to render
        setTimeout(() => {
          logger.log("Executing scrollToIndex", index);
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.1, // Position toward top/middle
          });
        }, 500);
      }
    }
  }, [listData, params.investmentId, loading]);

  // Memoized renderItem for FlatList
  const renderSchemeItem = useCallback(
    ({ item }: { item: any }) => {
      if (item.isHeader) {
        return (
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeaderTitle}>{item.title}</Text>
            <View style={styles.sectionHeaderLine} />
          </View>
        );
      }

      if (item.savingType === "old_gold") {
        return (
          <OldGoldSchemeCard
            item={item}
            translations={translations}
          />
        );
      }

      return (
        <EnhancedSchemeCard
          item={item}
          translations={translations}
          autoExpand={params.investmentId?.toString() === item.id.toString()}
        />
      );
    },
    [translations, params.investmentId]
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
                <Text style={styles.statValue}>{totalGold.toFixed(3)} g</Text>
              </View>
            </View>
          </View>


        </LinearGradient>
      )}
      <FilterToggle />
    </View>
  );

  const EmptyState = ({ isPageEmpty = false }: { isPageEmpty?: boolean }) => (
    <View style={[styles.emptyStateContainer, isPageEmpty ? { flex: 1, justifyContent: "center" } : { minHeight: 280, paddingVertical: 20 }]}>
      <View style={styles.emptyStateCard}>
        <Image
          source={require("../../../../../assets/images/empty_schemes_illustration.png")}
          style={styles.emptyStateImage}
          resizeMode="contain"
        />
        <Text style={styles.emptyStateTitle}>
          {translations.noActiveSchemes || "No Active Schemes"}
        </Text>
        <Text style={styles.emptyStateSubtitle}>
          Start your gold savings journey today and build your wealth gradually.
        </Text>
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => {
            logger.log("Switching to Join Schemes tab");
            router.replace("/(app)/(tabs)/savings?tab=join");
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={20} color={theme.colors.primaryDark || "#1a1a2e"} />
          <Text style={styles.emptyStateButtonText}>
            {translations.joinNow || "Join Now"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Error State Component
  const ErrorState = () => (
    <View className="flex-1 justify-center items-center px-4">
      <Image
        source={require("../../../../../assets/images/digigoldproduct.png")}
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

  // Filter Toggle UI (4 Status Tabs + Flexi/Fixed SubToggle)
  const FilterToggle = () => (
    <View style={{ marginBottom: 20 }}>
      {/* Main Status Pill Tabs */}
      <View style={styles.pillSwitcherContainer}>
        <View style={styles.pillSwitcherBg}>
          {["Active", "Matured", "Claimed", "Drop"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.pillTabItem,
                selectedType === tab && styles.pillTabActive
              ]}
              onPress={() => setSelectedType(tab as any)}
              activeOpacity={0.9}
            >
              {selectedType === tab && (
                <LinearGradient
                  colors={['#FFD700', '#DAA520']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Text
                style={[
                  styles.pillTabText,
                  selectedType === tab && styles.pillTabActiveText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sub Filter: Flexi vs Fixed Pill Tabs */}
      {showSubFilter && (
        <View style={styles.subPillContainer}>
          <View style={styles.subPillBg}>
            {["All", "Flexi", "Fixed"].map((filterOpt) => (
              <TouchableOpacity
                key={filterOpt}
                style={[
                  styles.subPillItem,
                  subFilter === filterOpt && styles.pillTabActive
                ]}
                onPress={() => setSubFilter(filterOpt as any)}
                activeOpacity={0.9}
              >
                {subFilter === filterOpt && (
                  <LinearGradient
                    colors={['#FFD700', '#DAA520']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text
                  style={[
                    styles.pillTabText,
                    { fontSize: 12 },
                    subFilter === filterOpt && styles.pillTabActiveText,
                  ]}
                >
                  {filterOpt === "All"
                    ? (translations.filterAll || "All")
                    : filterOpt === "Flexi"
                      ? (translations.flexi || "Flexi")
                      : (translations.fixed || "Fixed")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
        <View style={{ flex: 1 }}>
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
        </View>
      </ImageBackground>
    </View>
  );

  // Render loading state when no user
  const renderLoadingState = () => (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color={theme.colors.secondary} />
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

        <View style={{ flex: 1 }}>
          {/* Custom Header with Page Name (hidden if nested) */}
          {!isNested && (
            <View style={[styles.pageHeaderContainer, { paddingTop: 12 }]}>
              <Text style={styles.pageHeaderTitle}>
                {t("mySchemes") || "My Schemes"}
              </Text>
            </View>
          )}

          <FlatList
            ref={flatListRef}
            data={listData}
            keyExtractor={(item, index) => {
              if (item.isHeader) {
                return `header_${item.title}`;
              }
              const type = item.savingType || "saving";
              const id = item.id || item.investmentId || index;
              return `${type}_${id}`;
            }}
            renderItem={renderSchemeItem}
            ListHeaderComponent={savings.length > 0 ? <ListHeader /> : null}
            ListEmptyComponent={<EmptyState isPageEmpty={savings.length === 0} />}
            contentContainerStyle={{
              paddingBottom: bottomPadding,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              });
            }}
          />
        </View>
      </ImageBackground>
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

function getStyles(theme: any) {
  return StyleSheet.create({
    sectionHeaderContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    sectionHeaderTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.textDark,
      letterSpacing: 0.5,
    },
    sectionHeaderLine: {
      flex: 1,
      height: 1,
      backgroundColor: "rgba(0, 0, 0, 0.15)",
    },
    pageHeaderContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.1)",
      // Note: Dropped borderBottomRadius to ensure top header remains perfectly flat
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
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 24,
      width: "100%",
    },
    emptyStateCard: {
      width: "100%",
      backgroundColor: theme.colors.background === "#121212" ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.92)",
      borderRadius: 24,
      padding: 32,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.background === "#121212" ? "rgba(212, 175, 55, 0.15)" : "rgba(212, 175, 55, 0.35)",
      ...Platform.select({
        ios: {
          shadowColor: "#d4af37",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    emptyStateImage: {
      width: 200,
      height: 200,
      marginBottom: 24,
    },
    emptyStateTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.colors.textDark,
      textAlign: "center",
      marginBottom: 12,
    },
    emptyStateSubtitle: {
      fontSize: 14,
      color: theme.colors.textGrey || "#64748b",
      textAlign: "center",
      marginBottom: 28,
      lineHeight: 22,
      paddingHorizontal: 16,
    },
    emptyStateButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.gold || "#ffd700",
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 25,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.gold || "#ffd700",
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
      color: theme.colors.primaryDark || "#1a1a2e",
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
    pillSwitcherContainer: {
      paddingHorizontal: 0,
      marginVertical: 10,
    },
    pillSwitcherBg: {
      flexDirection: "row",
      backgroundColor: "rgba(0,0,0,0.06)",
      borderRadius: 25,
      padding: 4,
      overflow: 'hidden',
    },
    pillTabItem: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: 'center',
      borderRadius: 22,
      overflow: 'hidden',
    },
    pillTabActive: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    pillTabText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#666",
      zIndex: 1,
    },
    pillTabActiveText: {
      color: "#000",
      fontWeight: "900",
    },
    subPillContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
      paddingHorizontal: 10,
    },
    subPillBg: {
      flexDirection: 'row',
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: 20,
      padding: 3,
      width: 250,
    },
    subPillItem: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 18,
      overflow: 'hidden',
    },
  })
}

var styles = getStyles(theme);;

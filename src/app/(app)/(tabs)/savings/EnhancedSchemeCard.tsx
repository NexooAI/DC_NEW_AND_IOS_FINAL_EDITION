import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { formatGoldWeight } from "@/utils/imageUtils";
import { useTranslation } from "@/hooks/useTranslation";
import { theme } from "@/constants/theme";
import api from "@/services/api";
import useGlobalStore from "@/store/global.store";
import { logger } from "@/utils/logger";
import CustomAlert from "@/components/Alert";

type Scheme = {
  rewards?: Array<{
    id: number;
    amount: number;
    gold_grams: string;
    date: string;
    investment_id: number;
  }>;
  chitId: string | number | (string | number)[];
  investmentId: string;
  id: string;
  schemeName: string | { en: string; ta: string };
  metalType: string | { en: string; ta: string };
  savingType: string | { en: string; ta: string };
  status?: string;
  totalPaid: number;
  monthsPaid: number;
  emiAmount: number;
  maturityDate: string;
  goldWeight: number;
  accountHolder: string;
  accNo: string;
  schemeCode: string;
  noOfIns: string;
  transactions: any[];
  joiningDate: string;
  schemesData: any;
  chitData: any;
  paymentFrequency: string | { en: string; ta: string };
};

interface EnhancedSchemeCardProps {
  item: Scheme;
  translations: any;
  autoExpand?: boolean;
}

const EnhancedSchemeCard: React.FC<EnhancedSchemeCardProps> = ({
  item,
  translations,
  autoExpand = false,
}) => {
  const { t, locale } = useTranslation();
  const { user } = useGlobalStore();
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const animatedHeight = useRef(new Animated.Value(autoExpand ? 1 : 0)).current;
  const [isActive, setIsActive] = useState(autoExpand);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info" | "warning",
  });
  // Helper function to safely extract text from multilingual objects
  const getLocalizedText = (textObj: any): string => {
    if (!textObj) return "";

    // Handle strings
    if (typeof textObj === "string") return textObj;

    // Handle numbers
    if (typeof textObj === "number") return textObj.toString();

    // Handle objects with en/ta keys
    if (typeof textObj === "object" && textObj !== null) {
      if ("en" in textObj || "ta" in textObj) {
        return locale === "ta"
          ? textObj.ta || textObj.en || ""
          : textObj.en || textObj.ta || "";
      }

      // Handle arrays
      if (Array.isArray(textObj)) {
        return textObj.join(", ");
      }

      // Handle other objects - convert to string safely
      try {
        return JSON.stringify(textObj);
      } catch {
        return "[Object]";
      }
    }

    // Fallback for any other type
    return String(textObj);
  };
  
  const progressPercentage = useMemo(() => {
    const monthsPaid = Number(item.monthsPaid) || 0;
    const totalMonths = Number(item.noOfIns) || 1;
    return Math.round((monthsPaid / totalMonths) * 100);
  }, [item.monthsPaid, item.noOfIns]);

  // Calculate total reward amount and gold grams from all rewards
  const totalRewardAmount = useMemo(() => {
    if (!item.rewards || !Array.isArray(item.rewards) || item.rewards.length === 0) {
      return 0;
    }

    const total = item.rewards.reduce((sum: number, reward: any, index: number) => {
      const amount = parseFloat(reward.amount || 0) || 0;
      return sum + amount;
    }, 0);

    return total;
  }, [item.rewards]);

  const totalRewardGoldGrams = useMemo(() => {
    if (!item.rewards || !Array.isArray(item.rewards) || item.rewards.length === 0) {
      return 0;
    }

    const total = item.rewards.reduce((sum: number, reward: any, index: number) => {
      const goldGrams = parseFloat(reward.gold_grams || 0) || 0;
      return sum + goldGrams;
    }, 0);

    return total;
  }, [item.rewards]);

  useEffect(() => {
    if (autoExpand) {
      console.log("Auto-expanding card:", item.id);
      setIsExpanded(true);
      setIsActive(true);
      Animated.spring(animatedHeight, {
        toValue: 1,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start();
    }
  }, [autoExpand]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setIsActive(!isActive);
    Animated.spring(animatedHeight, {
      toValue: isExpanded ? 0 : 1,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  };

  const handleNavigation = (item: Scheme) => {
    if (!item) return;
    router.push({
      pathname: "/(tabs)/savings/SavingsDetail",
      params: {
        schemeName: getLocalizedText(item.schemeName) || "",
        totalPaid: item.totalPaid?.toString() || "0",
        monthsPaid: item.monthsPaid?.toString() || "0",
        emiAmount: item.emiAmount?.toString() || "0",
        maturityDate: item.maturityDate || "",
        goldWeight: item.goldWeight?.toString() || "0.00",
        accountHolder: item.accountHolder || "N/A",
        accNo: item.accNo || "N/A",
        schemeCode: item.schemeCode || "",
        id: item.id || "",
        noOfIns: item.noOfIns || 0,
        chitId: item?.chitData?.chitId || "",
        schemesData: JSON.stringify(item.schemesData || {}),
        transactions: JSON.stringify(item.transactions || []),
        paymentFrequency: getLocalizedText(item.paymentFrequency),
        rewards: JSON.stringify(item?.rewards || []),
      },
    });
  };

  const handlePayNow = async () => {
    if (!item || isLoading || !user) return;

    setIsLoading(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      // Call API to check payment and get investment details
      const payload = {
        userId: user.id,
        investmentId: item.id,
      };

      const response = await api.post("investments/check-payment", payload);
      logger.log("Payment check response:", response.data);

      if (response?.data?.success === false) {
        // Handle error - show alert
        logger.error("Payment check failed:", response?.data?.message);
        setAlertConfig({
            visible: true,
            title: "Payment Status",
            message: response?.data?.message || "Payment already made for this month or an error occurred.",
            type: "warning",
        });
        setIsLoading(false);
        return;
      }

      // Safely parse schemes data
      let parseSchemes;
      try {
        parseSchemes = item.schemesData || {};
      } catch (parseError) {
        logger.error("Error parsing schemes data:", parseError);
        parseSchemes = {
          schemeTypeName: "Fixed",
          paymentFrequencyName: getLocalizedText(
            item.schemesData?.paymentFrequencyName
          ) || "Monthly",
        };
      }

      // Get payment history length for paidPaymentCount
      const paymentHistoryLength = Array.isArray(item.transactions)
        ? item.transactions.length
        : 0;

      // Navigate directly to paymentNewOverView
      router.push({
        pathname: "/(app)/(tabs)/home/paymentNewOverView",
        params: {
          amount: item.emiAmount?.toString() || "0",
          schemeName: getLocalizedText(item.schemeName) || "",
          schemeId: response?.data?.data?.schemeId || item.schemeCode || "",
          chitId: response?.data?.data?.chitId || item?.chitData?.chitId || "",
          paymentFrequency:
            parseSchemes.paymentFrequencyName ||
            getLocalizedText(item.schemesData?.paymentFrequencyName) ||
            "Monthly",
          schemeType: parseSchemes.schemeTypeName || "Fixed",
          source: "savings_index",
          savinsTypes: parseSchemes.schemeType || "amount",
          userDetails: JSON.stringify({
            amount: item.emiAmount?.toString() || "0",
            accountname: item.accountHolder || "N/A",
            accNo: item.accNo || "N/A",
            associated_branch: 1, // Default branch, adjust if needed
            investmentId: response?.data?.data?.investmentId || item.id || "",
            schemeId: response?.data?.data?.schemeId || item.schemeCode || "",
            schemeType: parseSchemes.schemeTypeName || "Fixed",
            schemeName: getLocalizedText(item.schemeName) || "",
            paymentFrequency:
              parseSchemes.paymentFrequencyName ||
              getLocalizedText(item.schemesData?.paymentFrequencyName) ||
              "Monthly",
            chitId: response?.data?.data?.chitId || item?.chitData?.chitId || "",
          }),
          paidPaymentCount: String(paymentHistoryLength + 1 || 0),
        },
      });

      // Reset loading state after navigation
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      logger.error("Error in handlePayNow:", error);
      setIsLoading(false);
      // Could show an error alert here if needed
    }
  };

  // Reset loading state when item changes (e.g., when list refreshes)
  useEffect(() => {
    setIsLoading(false);
  }, [item.id]);

  // Safety mechanism: Reset loading if it's been true for too long (e.g., navigation failed or user returned)
  useEffect(() => {
    if (isLoading) {
      const safetyTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 3000); // Reset after 3 seconds as a safety measure

      return () => clearTimeout(safetyTimeout);
    }
  }, [isLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <View
      style={[styles.cardWrapper, isActive && styles.cardWrapperActive]}
    >
      <View
        style={styles.cardBackgroundImage}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand}>
        <View style={styles.cardHeader}>
          <View style={styles.schemeInfo}>
            <View style={styles.schemeTitleContainer}>
              <Text style={styles.schemeTitle}>
                {getLocalizedText(item.schemeName)}
              </Text>
              <View style={styles.schemeSubtitleContainer}>
                <View
                  style={[
                    styles.metalTypeBadge,
                    { backgroundColor: theme.colors.secondary },
                  ]}
                >
                  <Text style={styles.metalTypeText}>
                    {getLocalizedText(item.metalType).charAt(0).toUpperCase() +
                      getLocalizedText(item.metalType).slice(1)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.savingTypeBadge,
                    { backgroundColor: theme.colors.backgroundSecondary },
                  ]}
                >
                  <Text style={styles.savingTypeText}>
                    {getLocalizedText(
                      item.schemesData?.paymentFrequencyName
                    ) === "Flexi"
                      ? translations.flexi
                      : translations.fixed}
                  </Text>
                </View>
                {item.schemesData.paymentFrequencyName.toLowerCase() !== "flexi" && <View
                  style={[
                    styles.savingTypeBadge,
                    { backgroundColor: theme.colors.bgGoldHeavy },
                  ]}
                >
                  <Text style={styles.savingTypeText}>
                    {getLocalizedText(item.schemesData.paymentFrequencyName)}
                  </Text>
                </View>}
                <View
                  style={[
                    styles.savingTypeBadge,
                    { backgroundColor: theme.colors.bgErrorMedium },
                  ]}
                >
                  <Text style={styles.savingTypeText}>
                    {item.schemesData.schemeType.toLowerCase() === "weight" ? "Weight" : "Amount"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === "ACTIVE"
                      ? "rgba(8, 237, 8, 0.56)"
                      : "rgba(255, 0, 0, 0.2)",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: item.status === "ACTIVE" ? "#000" : "#FF0000",
                  },
                ]}
              >
                {item.status || "INACTIVE"}
              </Text>
            </View>
            <View style={styles.expandIcon}>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.primary}
              />
            </View>
          </View>
        </View>

        <View style={styles.paymentInfoRow}>
          <View style={styles.paymentInfoItem}>
            <View style={styles.paymentInfoIconContainer}>
              <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.paymentInfoContent}>
              <Text style={styles.paymentInfoLabel}>
                {translations.accountHolderLabel}
              </Text>
              <Text style={styles.paymentInfoValue}>
                {item.accountHolder?.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.paymentInfoDivider} />
          <View style={styles.paymentInfoItem}>
            <View style={styles.paymentInfoIconContainer}>
              <Ionicons name="card-outline" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.paymentInfoContent}>
              <Text style={styles.paymentInfoLabel}>
                {translations.accountNumberLabel}
              </Text>
              <Text style={styles.paymentInfoValue}>
                DCJ-{item.accNo}
              </Text>
            </View>
          </View>
        </View>
        {/* Payment Info Row - Always Visible */}
        {item.schemesData.schemeType.toLowerCase() === "weight" && <View style={styles.paymentInfoRow}>
          <View style={styles.paymentInfoItem}>
            <View style={styles.paymentInfoIconContainer}>
              <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.paymentInfoContent}>
              <Text style={styles.paymentInfoLabel}>
                {translations.frequency}
              </Text>
              <Text style={styles.paymentInfoValue}>
                {getLocalizedText(item.schemesData?.paymentFrequencyName) ===
                  "Flexi"
                  ? translations.flexi
                  : getLocalizedText(item.paymentFrequency)}
              </Text>
            </View>
          </View>
          <View style={styles.paymentInfoDivider} />
          {item.schemesData.schemeType.toLowerCase() === "weight" && <View style={styles.paymentInfoItem}>
            <View style={styles.paymentInfoIconContainer}>
              <Ionicons name="scale-outline" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.paymentInfoContent}>
              <Text style={styles.paymentInfoLabel}>
                {translations.totalWeight}
              </Text>
              <Text style={styles.paymentInfoValue}>
                {formatGoldWeight(item.goldWeight)}
              </Text>
            </View>
          </View>}
        </View>}

        </TouchableOpacity>

        {/* Action Buttons Container - Always Visible */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => handleNavigation(item)}
          >
            <LinearGradient
              colors={theme.colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.detailsButtonGradient}
            >
              <Text style={styles.detailsButtonText}>
                {translations.viewDetails}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.white}
              />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.payNowButtonLarge,
              isLoading && styles.disabledButton,
            ]}
            onPress={handlePayNow}
            disabled={isLoading}
          >
            <LinearGradient
              colors={
                isLoading
                  ? ["#6B6B6B", "#4A4A4A", "#2E2E2E"] // Disabled / Loading
                  : theme.colors.gradientPrimary // Use theme primary gradient
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payNowButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.payNowButtonTextLarge}>
                    {translations.payNow}
                  </Text>
                  <Ionicons name="card-outline" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.cardContent,
            {
              maxHeight: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500],
              }),
            },
          ]}
        >
          {/* Enhanced Info Grid with More Relevant Data */}
          <View style={styles.enhancedInfoGrid}>
            <View style={styles.enhancedInfoRow}>
              <View style={styles.enhancedInfoItem}>
                <View style={styles.enhancedInfoIconContainer}>
                  <Ionicons name="wallet-outline" size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.enhancedInfoLabel}>
                  {translations.totalInvestedLabel}
                </Text>
                <Text style={styles.enhancedInfoValue}>
                  ₹{(item.totalPaid + totalRewardAmount).toLocaleString()}
                </Text>
              </View>

              {/* <View style={styles.enhancedInfoItem}>
                <View style={styles.enhancedInfoIconContainer}>
                  <Ionicons name="trending-up" size={20} color={theme.colors.secondary} />
                </View>
                <Text style={styles.enhancedInfoLabel}>
                  {translations.goldWeightLabel}
                </Text>
                <Text style={styles.enhancedInfoValue}>
                  {formatGoldWeight(item.goldWeight + totalRewardGoldGrams)}
                </Text>
              </View> */}
              {item?.schemesData?.paymentFrequencyId !== 4 && (
                <View style={styles.enhancedInfoItem}>
                  <View style={styles.enhancedInfoIconContainer}>
                    <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.enhancedInfoLabel}>
                    {translations.maturityDateLabel}
                  </Text>
                  <Text style={styles.enhancedInfoValue}>
                    {item?.maturityDate}
                  </Text>
                </View>
              )}
              <View style={styles.enhancedInfoItem}>
                <View style={styles.enhancedInfoIconContainer}>
                  <Ionicons name="cash-outline" size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.enhancedInfoLabel}>
                  {translations.monthlyEMILabel}
                </Text>
                <Text style={styles.enhancedInfoValue}>₹{item.emiAmount}</Text>
              </View>
            </View>

            {/* Additional Row for More Details */}
            <View style={styles.enhancedInfoRow}>
              {/* Reward Fields - Highlighted */}
              {totalRewardAmount > 0 && (
                <View style={styles.rewardInfoItem}>
                  <View style={styles.rewardIconContainer}>
                    <Ionicons name="trophy" size={22} color="#FFD700" />
                  </View>
                  <Text style={styles.rewardInfoLabel}>
                    {translations.rewardAmountLabel}
                  </Text>
                  <Text style={styles.rewardInfoValue}>
                    ₹{totalRewardAmount.toLocaleString()}
                  </Text>
                </View>
              )}
              {totalRewardGoldGrams > 0 && (
                <View style={styles.rewardInfoItem}>
                  <View style={styles.rewardIconContainer}>
                    <Ionicons name="trophy" size={22} color="#FFD700" />
                  </View>
                  <Text style={styles.rewardInfoLabel}>
                    {translations.rewardGoldLabel}
                  </Text>
                  <Text style={styles.rewardInfoValue}>
                    {formatGoldWeight(totalRewardGoldGrams)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Installment Progress Section - Hide for paymentFrequencyId == 4 */}
          {item.schemesData?.paymentFrequencyId !== 4 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  {translations.installmentProgress}
                </Text>
                <View style={styles.progressStats}>
                  <Text style={styles.progressMonths}>
                    {item.monthsPaid}/{item.noOfIns} {translations.monthsLabel}
                  </Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: animatedHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", `${progressPercentage}%`],
                      }),
                    },
                  ]}
                />
              </View>
              <View style={styles.monthsInfo}>
                <View style={styles.monthItem}>
                  <View
                    style={[styles.monthDot, { backgroundColor: "#850111" }]}
                  />
                  <Text style={styles.monthLabel}>{translations.paid}</Text>
                  <Text style={styles.monthLabel}>{item.monthsPaid}</Text>
                </View>
                <View style={styles.monthItem}>
                  <View
                    style={[styles.monthDot, { backgroundColor: "#DAA520" }]}
                  />
                  <Text style={styles.monthLabel}>{translations.pending}</Text>
                  <Text style={styles.monthLabel}>
                    {Number(item.noOfIns) - Number(item.monthsPaid)}
                  </Text>
                </View>
                <View style={styles.monthItem}>
                  <View
                    style={[styles.monthDot, { backgroundColor: "#850111" }]}
                  />
                  <Text style={styles.monthLabel}>{translations.total}</Text>
                  <Text style={styles.monthLabel}>{item.noOfIns}</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        buttons={[
          {
            text: "OK",
            onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
            style: "default",
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  cardWrapperActive: {
    elevation: 8,
    shadowOpacity: 0.35,
  },
  cardBackgroundImage: {
    width: "100%",
    minHeight: 200,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
  },
  schemeInfo: {
    flex: 1,
    marginRight: 12,
  },
  schemeTitleContainer: {
    marginBottom: 8,
  },
  schemeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 8,
  },
  schemeSubtitleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  metalTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metalTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  savingTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textDark,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  expandIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  accountInfo: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  accountLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  accountLabelItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  accountIconContainer: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  accountLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  accountValuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  accountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textDark,
  },
  paymentInfoRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: "center",
  },
  paymentInfoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paymentInfoIconContainer: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentInfoContent: {
    flex: 1,
  },
  paymentInfoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  paymentInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textDark,
  },
  paymentInfoDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
    marginHorizontal: 12,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  detailsButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    overflow: "hidden",
  },
  detailsButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  detailsButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  payNowButtonLarge: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  payNowButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  payNowButtonTextLarge: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.7,
  },
  cardContent: {
    overflow: "hidden",
  },
  enhancedInfoGrid: {
    padding: 16,
    gap: 16,
  },
  enhancedInfoRow: {
    flexDirection: "row",
    gap: 12,
  },
  enhancedInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  enhancedInfoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  enhancedInfoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },
  enhancedInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textDark,
    textAlign: "center",
  },
  rewardInfoItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.4)",
    marginHorizontal: 4,
  },
  rewardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 215, 0, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.5)",
  },
  rewardInfoLabel: {
    fontSize: 12,
    color: theme.colors.secondary,
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "600",
  },
  rewardInfoValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FF6B00",
    textAlign: "center",
    textShadowColor: "rgba(255, 215, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  smartTimelineContainer: {
    padding: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  timelineContent: {
    gap: 8,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#DAA520",
  },
  timelineInfo: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  timelineConnector: {
    width: 2,
    height: 20,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    marginLeft: 5,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  progressStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressMonths: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  monthsInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
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
    color: theme.colors.textSecondary,
  },
  monthValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
});

export default EnhancedSchemeCard;

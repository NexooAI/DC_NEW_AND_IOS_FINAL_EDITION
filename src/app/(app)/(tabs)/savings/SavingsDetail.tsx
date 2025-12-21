import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

// AppHeader is now handled by the layout wrapper
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import api, { paymentAPI } from "@/services/api";
import { initiatePayment, initializeSocket } from "@/utils/paymentUtils";
import { moderateScale } from "react-native-size-matters";
import SupportContactCard from "@/components/SupportContactCard";
import CustomAlert from "@/components/Alert";
import Icon from "react-native-vector-icons/AntDesign";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Linking from "expo-linking";
import * as Print from "expo-print";
import * as WebBrowser from "expo-web-browser";
import {
  generatePaymentReceiptHTML,
  PaymentReceiptData,
} from "@/templates/html";
import { Socket } from "socket.io-client";
import { CommonActions, useNavigationState } from "@react-navigation/native";
import { formatGoldWeight } from "@/utils/imageUtils";
import { theme } from "@/constants/theme";
import { SkeletonSavingsDetailPage } from "@/components/SkeletonLoader";

import { logger } from "@/utils/logger";
type Transaction = {
  paymentId: number;
  amountPaid: string;
  paymentDate: string;
  paymentMode: string;
  transactionId: string;
  status: string;
  current_goldrate: string;
  gold_rate: string;
  rewardsList?: {
    id: number;
    amount: number;
    gold_grams: string;
    paymentId: number;
    date: string;
    investment_id: number;
  };
  rewardAmount?: string | number;
};

type SchemeParams = {
  accNo: any;
  chitId: any;
  accountNo: any;
  schemeName: string;
  totalPaid: string;
  monthsPaid: string;
  emiAmount: string;
  maturityDate: string;
  goldWeight: string;
  accountHolder: string;
  schemeCode: string;
  transactionId: string;
  id: string;
  noOfIns: string;
  paymentFrequency?: string;
};

interface DetailRowProps {
  label: string;
  value: string;
  labelColor?: string;
  valueColor?: string;
  icon?: string;
}

// Payment data storage keys
const PAYMENT_DATA_KEY = "@payment_data_retry";
const INVESTMENT_DATA_KEY = "@investment_data_retry";
const TRANSACTION_DATA_KEY = "@transaction_data_retry";

const SavingsDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<any>();
  const { language, user } = useGlobalStore();
  const [paymentHistrory, setPaymentHistrory] = useState<Transaction[]>([]);
  const [inversement, setInversement] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { height } = useWindowDimensions();
  const { bottom, top } = useSafeAreaInsets();
  const bottomPadding = height * 0.1 + bottom;
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [selectedPayments, setSelectedPayments] = useState<any[]>([]);
  const [showAdvancePayment, setShowAdvancePayment] = useState(false);
  const translations = useMemo(
    () => ({
      totalInvested: t("totalInvested"),
      goldAccumulated: t("goldAccumulated"),
      accountHolder: t("accountHolder"),
      schemeType: t("schemeType"),
      monthlyEMI: t("monthlyEMI"),
      maturityDate: t("maturityDate"),
      paymentProgress: t("paymentProgress"),
      transactionHistory: t("transactionHistory"),
      noTransactionsFound: t("noTransactionsFound"),
      months: t("months"),
      back: t("back"),
      goldRate: t("goldRate"),
      paymentMethod: t("paymentMethod"),
      advancePayment: t("advancePayment"),
      selectAll: t("selectAll"),
      unselectAll: t("unselectAll"),
      paySelected: t("paySelected"),
      payNow: t("payNow"),
      hide: t("hide"),
      show: t("show"),
      month: t("month"),
      due: t("due"),
      accountDetails: t("accountDetails"),
      accountNo: t("accountNo"),
      goldWeight: t("goldWeight"),
      totalPaid: t("totalPaid"),
      monthsPaid: t("monthsPaid"),
      rewards: t("rewards"),
    }),
    [language]
  );
  const state = useNavigationState((state) => state);
  const [advancePayments, setAdvancePayments] = useState<any[]>([]);
  const totalSelectedAmount = useMemo(() => {
    if (selectedPayments.length === 0) return 0;
    // Use emiAmount from params as it's the fixed installment amount
    return selectedPayments.length * Number(params.emiAmount);
  }, [selectedPayments, params.emiAmount]);
  const schemesData = useMemo(() => {
    return JSON.parse(params.schemesData);
  }, [params.schemesData]);
  const rewardsData = useMemo(() => {
    return JSON.parse(params?.rewards || "[]");
  }, [params?.rewards]);
  const totalAmountandRewards = useMemo(() => {
    return Number(params?.totalPaid) + Number(rewardsData.reduce((acc: number, curr: any) => acc + curr.amount, 0));
  }, [params?.totalPaid, rewardsData]);
  const onlyTotalRewards = useMemo(() => {
    return Number(rewardsData.reduce((acc: number, curr: any) => acc + curr.amount, 0));
  }, [rewardsData]);
  // Recipt cretion
  const sanitizeFileName = (str: string) => str.replace(/[^a-zA-Z0-9]/g, "_");
  // PDF Generation function
  const createAndShareReceiptPDF = async (
    transaction: Transaction,
    inversement: any
  ) => {
    // Extract reward amount and gold grams from rewardsList
    const rewardAmount = transaction.rewardsList?.amount
      ? Number(transaction.rewardsList.amount)
      : undefined;
    const rewardGoldGrams = transaction.rewardsList?.gold_grams
      ? Number(transaction.rewardsList.gold_grams)
      : undefined;

    const receiptData: PaymentReceiptData = {
      transactionId: transaction.transactionId,
      paymentId: String(transaction.paymentId),
      amountPaid: Number(transaction.amountPaid),
      paymentDate: transaction.paymentDate,
      paymentMode: transaction.paymentMode || "NB",
      status: transaction.status,
      goldRate: Number(transaction.gold_rate),
      userName: user?.name,
      userMobile: user?.mobile?.toString(),
      userEmail: user?.email,
      rewardAmount: rewardAmount,
      rewardGoldGrams: rewardGoldGrams,
      inversement: inversement,
    };
    logger.log(
      "createAndShareReceiptPDF",
      generatePaymentReceiptHTML(receiptData)
    );
    const htmlContent = generatePaymentReceiptHTML(receiptData);
    const { uri } = await Print.printToFileAsync({ html: htmlContent }); // e.g. file:///.../ABC123.pdf [web:1]
    // 2) Rename/move to desired filename
    const customerName = sanitizeFileName(user?.name || "Customer");
    const accountNo = sanitizeFileName(user?.id?.toString() || "000000");
    const paymentId = sanitizeFileName(
      transaction.paymentId?.toString() || "000000"
    );
    const fileName = `${customerName}_${accountNo}_${paymentId}.pdf`;

    const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory; // prefer persistent [web:20]
    const targetUri = `${targetDir}${fileName}`;
    await FileSystem.moveAsync({ from: uri, to: targetUri }); // gives custom filename [web:24][web:20]

    // 3) Share or open in browser-like view
    const canShare = await Sharing.isAvailableAsync(); // native sheet availability [web:12]
    if (canShare) {
      await Sharing.shareAsync(targetUri, {
        UTI: "com.adobe.pdf", // iOS UTI [web:12]
        mimeType: "application/pdf", // Android MIME [web:12]
        dialogTitle: "Share payment receipt", // Android/Web title [web:12]
      });
    } else {
      // Fallback: attempt to open via system browser or viewer
      // WebBrowser supports http/https; for file://, many Androids will not open; consider Linking.openURL or a PDF viewer screen [web:30][web:33]
      if (Platform.OS === "ios") {
        await WebBrowser.openBrowserAsync(targetUri); // may work with iOS file URLs depending on handlers [web:30]
      } else {
        Alert.alert("Saved", `Receipt saved at: ${targetUri}`);
      }
    }

    Alert.alert("Success", "Payment receipt generated and ready to share!");
    // await generateInvoicePDF(transaction, inversement);
  };

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = initializeSocket();
    setSocket(socketInstance);
    socketInstance.on("connect", () => { });
    return () => {
      socketInstance.disconnect();
    };
  }, []);
  useEffect(() => {
    const unsubscribe = navigation.addListener("state", () => {
      setIsNavigationReady(true);
    });
    return unsubscribe;
  }, [navigation]);

  // Construct user details in the format expected by payment function
  const parsedUserDetails = useMemo(
    () => ({
      name: params.accountHolder,
      email: user?.email || "",
      mobile: user?.mobile || "",
      data: { data: { userId: user?.id, schemeId: params.schemeCode } },
    }),
    [params, user]
  );

  const PaymentNow = async () => {
    if (!user) {
      setAlertMessage("User not found. Please log in again.");
      setAlertType("error");
      setAlertVisible(true);
      return;
    }

    // Set loading state
    setIsLoading(true);

    let payload = {
      userId: user.id,
      investmentId: params.id,
    };

    try {
      let responce = await api.post("investments/check-payment", payload);
      logger.log(responce.data);
      if (responce?.data?.success === false) {
        setAlertMessage(responce?.data.message || "Something went wrong");
        setAlertType("error");
        setAlertVisible(true);
        return;
      }

      // Safely parse schemes data
      let parseSchemes;
      try {
        parseSchemes = JSON.parse(params.schemesData);
        console.log("parseSchemes=-=========", parseSchemes);
      } catch (parseError) {
        logger.error("Error parsing schemes data:", parseError);
        // Fallback to a default structure
        parseSchemes = {
          schemeTypeName: "Fixed",
          paymentFrequencyName: params.paymentFrequency || "Monthly",
        };
      }
      logger.log("params---------------history", paymentHistrory);
      router.push({
        pathname: "/(tabs)/home/paymentNewOverView",
        params: {
          amount: params.emiAmount,
          schemeName: params.schemeName,
          schemeId: responce?.data.data.schemeId,
          chitId: responce?.data.data?.chitId,
          paymentFrequency:
            parseSchemes.paymentFrequencyName || params.paymentFrequency, // Use the correct paymentFrequency
          schemeType: parseSchemes.schemeTypeName,
          source: params.source || "savings_detail", // Track source
          savinsTypes: parseSchemes.schemeType,
          userDetails: JSON.stringify({
            amount: params.emiAmount,
            accountname: params.accountHolder,
            accNo: params.accNo,
            associated_branch: 1,
            investmentId: responce?.data.data?.investmentId,
            schemeId: responce?.data.data?.schemeId,
            schemeType: parseSchemes.schemeTypeName,
            schemeName: params?.schemeName, // Also inside userDetails for redundancy
            paymentFrequency:
              parseSchemes.paymentFrequencyName || params.paymentFrequency, // Use the correct paymentFrequency
            chitId: responce?.data.data?.chitId,
          }),
          paidPaymentCount: String(paymentHistrory?.length + 1 || 0),
        },
      });
    } catch (error) {
      logger.error("Error in PaymentNow:", error);
      setAlertMessage("An error occurred. Please try again.");
      setAlertType("error");
      setAlertVisible(true);
    } finally {
      // Clear loading state
      setIsLoading(false);
    }
  };

  // Auto-trigger PaymentNow if autoPayNow param is set
  useEffect(() => {
    if (params.autoPayNow === "1") {
      // Set loading state immediately
      setIsLoading(true);
      setLoading(true);

      // Add a small delay to show loading state
      const timer = setTimeout(() => {
        PaymentNow();
      }, 1000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get(`investments/${params.id}`, { skipLoading: true } as any);
        if (response.data.data.paymentHistory) {
          setPaymentHistrory(response.data.data.paymentHistory);
        }
        if (response.data.data.paymentStatus) {
          setAdvancePayments(response.data.data.paymentStatus);
        }
        if (response.data.data.investmentList) {
          setInversement(response.data.data.investmentList);
        }
      } catch (error) {
        logger.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [params.id]);

  const DetailRow: React.FC<DetailRowProps> = ({
    label,
    value,
    labelColor = theme.colors.textSecondary,
    valueColor = theme.colors.textSecondary,
    icon,
  }) => {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 4,
        }}
      >
        {icon && (
          <Icon
            name={icon}
            size={16}
            color="#bfbfbf"
            style={{ marginRight: 8 }}
          />
        )}
        <Text style={{ flex: 1, color: labelColor, fontSize: 14 }}>
          {label}
        </Text>
        <Text style={{ color: valueColor, fontSize: 14, fontWeight: "500" }}>
          {value}
        </Text>
      </View>
    );
  };

  // Parse schemesData for payment_duration
  let parsedSchemesData: any = {};
  try {
    parsedSchemesData = params.schemesData
      ? JSON.parse(params.schemesData)
      : {};
  } catch (e) {
    parsedSchemesData = {};
  }

  const handleSelectPayment = (payment: any) => {
    setSelectedPayments((prev) => {
      const isSelected = prev.some(
        (p) => p.monthNumber === payment.monthNumber
      );
      if (isSelected) {
        return prev.filter((p) => p.monthNumber !== payment.monthNumber);
      } else {
        return [...prev, payment];
      }
    });
  };

  const handleBulkPayment = async () => {
    if (!user || selectedPayments.length === 0) {
      setAlertMessage("Please select at least one installment to pay.");
      setAlertType("error");
      setAlertVisible(true);
      return;
    }

    // Show maintenance message instead of calling API
    setAlertMessage(
      "Advance payment feature is currently under maintenance. Please try again later."
    );
    setAlertType("info");
    setAlertVisible(true);
    return;
  };

  const handleSelectAll = () => {
    const pendingPayments = advancePayments.filter(
      (p) => p.status === "PENDING"
    );
    setSelectedPayments(pendingPayments);
  };

  const handleUnselectAll = () => {
    setSelectedPayments([]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }} edges={["bottom"]}>
      {/* Custom Header with Back Button */}
      <View style={[styles.headerContainer, { paddingTop: top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t("savingsDetail")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Skeleton Loading */}
      {loading && (
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingTop: 24,
            paddingBottom: bottomPadding,
          }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonSavingsDetailPage />
        </ScrollView>
      )}

      {!loading && (
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingTop: 24,
            paddingBottom: bottomPadding,
          }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Card */}
          <LinearGradient
            colors={theme.colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryHeader}>
              <View style={styles.schemeInfo}>
                <View style={styles.schemeIconContainer}>
                  <Ionicons name="diamond-outline" size={20} color="#fff" />
                </View>
                <View style={styles.schemeTextContainer}>
                  <Text style={styles.schemeName}>{params.schemeName}</Text>
                  <View style={styles.schemeDetails}>
                    <Text style={styles.schemeCode}>{params.schemeCode}</Text>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Active</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="wallet-outline" size={18} color="#fff" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statLabel}>
                    {translations.totalInvested}
                  </Text>
                  <Text style={styles.statValue}>
                    ₹{Number(totalAmountandRewards).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.statDivider} />
              {schemesData?.schemeType?.toLowerCase() === "weight" && (
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="diamond-outline" size={18} color="#fff" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>
                      {translations.goldAccumulated}
                    </Text>
                    <Text style={styles.statValue}>
                      {formatGoldWeight(parseFloat(params.goldWeight) || 0)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Progress Bar: Hide if payment_duration === '0.00' */}
            {parsedSchemesData.payment_duration !== "0.00" && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    {translations.paymentProgress}
                  </Text>
                  <Text style={styles.progressValue}>
                    {params.monthsPaid}/{params.noOfIns} {t("months")}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(Number(params.monthsPaid) / Number(params.noOfIns)) *
                          100
                          }%`,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </LinearGradient>

          {/* Details Section */}
          {/* Details Section */}
          <View style={[styles.detailsCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={styles.sectionTitle}>{translations.accountDetails}</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.detailLabel}>
                  {translations.accountHolder}
                </Text>
                <Text style={styles.detailValue}>{params.accountHolder}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="card-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.detailLabel}>{translations.schemeType}</Text>
                <Text style={styles.detailValue}>
                  {JSON.parse(params.schemesData).paymentFrequencyName}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="wallet-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.detailLabel}>{translations.monthlyEMI}</Text>
                <Text style={styles.detailValue}>
                  ₹{Number(params.emiAmount).toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.detailLabel}>
                  {translations.maturityDate}
                </Text>
                <Text style={styles.detailValue}>{params.maturityDate}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.detailLabel}>{translations.accountNo}</Text>
                <Text style={styles.detailValue}>DCJ-{params.accNo}</Text>
              </View>
              {onlyTotalRewards > 0 && (
                <View style={styles.detailItem}>
                  <Ionicons name="diamond-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.detailLabel}>{translations.rewards}</Text>
                  <Text style={styles.detailValue}>₹{Number(onlyTotalRewards).toLocaleString()}</Text>
                </View>
              )}
              {/* {schemesData?.schemeType?.toLowerCase() === "weight" && (
              <View style={styles.detailItem}>
                <Ionicons name="diamond-outline" size={16} color="#8B4513" />
                <Text style={styles.detailLabel}>{translations.goldWeight}</Text>
                <Text style={styles.detailValue}>
                  {formatGoldWeight(parseFloat(params.goldWeight) || 0)}
                </Text>
              </View>)} */}
              {/* <View style={styles.detailItem}>
              <Ionicons name="trending-up-outline" size={16} color="#8B4513" />
              <Text style={styles.detailLabel}>{translations.totalPaid}</Text>
              <Text style={styles.detailValue}>
                ₹{Number(params.totalPaid).toLocaleString()}
              </Text>
            </View> */}
              {/* <View style={styles.detailItem}>
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color="#8B4513"
              />
              <Text style={styles.detailLabel}>{translations.monthsPaid}</Text>
              <Text style={styles.detailValue}>
                {JSON.parse(params.schemesData).paymentFrequencyName === "Flexi"
                  ? params.monthsPaid
                  : params.monthsPaid / params.noOfIns}
              </Text>
            </View> */}
            </View>
          </View>

          {/* Transactions Section */}
          {/* Transactions Section */}
          <View style={[styles.transactionsCard, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.transactionsHeader}>
              <Text style={styles.sectionTitle}>
                {translations.transactionHistory}
              </Text>
              <TouchableOpacity style={styles.filterButton}>
                <Ionicons name="filter" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : paymentHistrory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={theme.colors.primary} />
                <Text style={styles.emptyText}>
                  {translations.noTransactionsFound}
                </Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {paymentHistrory.map((transaction, index) => (
                  <View
                    key={transaction.paymentId?.toString() || index.toString()}
                  >
                    <TouchableOpacity
                      style={styles.transactionItem}
                      onPress={() => setSelectedTransaction(transaction)}
                    >
                      <View style={{ padding: 5 }}>
                        <Text>{index + 1}</Text>
                      </View>
                      <View style={styles.transactionIcon}>
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={theme.colors.success}
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.paymentDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </Text>
                      </View>
                      <Text style={styles.transactionAmount}>
                        ₹{Number(transaction.amountPaid).toLocaleString()}
                      </Text>
                      <Ionicons
                        name="receipt-outline"
                        size={22}
                        color={theme.colors.primary}
                        style={{ marginLeft: 10 }}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Advance Payment Card: Show all PENDING payments */}


          {/* Pay Now Button */}
          {selectedPayments.length === 0 && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={PaymentNow}
              disabled={isLoading}
            >
              <LinearGradient
                colors={theme.colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.payButtonText}>{t("payNow")}</Text>
                    <Ionicons name="arrow-forward" size={24} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          <CustomAlert
            visible={alertVisible}
            message={alertMessage}
            type={alertType}
            onClose={() => setAlertVisible(false)}
          />
        </ScrollView>
      )}

      {/* Transaction Details Modal */}
      <Modal
        visible={!!selectedTransaction}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={theme.colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalTitleContainer}>
                  <Ionicons name="receipt" size={24} color="#fff" />
                  <Text style={styles.modalTitle}>{t("transactionDetails")}</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedTransaction(null)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.modalBody}>
              <View style={styles.transactionStatus}>
                <View style={styles.statusIconContainer}>
                  <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} />
                </View>
                <Text style={styles.modalStatusText}>{t("paymentSuccessful")}</Text>
              </View>

              <View style={styles.amountRowContainer}>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>{t("amountPaid")}</Text>
                  <Text style={styles.amountValue}>
                    ₹
                    {selectedTransaction
                      ? Number(selectedTransaction.amountPaid).toLocaleString()
                      : "0"}
                  </Text>
                </View>
                {selectedTransaction?.rewardsList?.amount && (
                  <View>
                    <View style={[styles.amountDivider, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>{t("interestAmount")}</Text>
                      <Text style={styles.amountValue}>
                        ₹{Number(selectedTransaction.rewardsList.amount).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.modalDetailLabel}>{t("date")}</Text>
                      <Text style={styles.modalDetailValue}>
                        {selectedTransaction
                          ? new Date(
                            selectedTransaction.paymentDate
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          : ""}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.modalDetailLabel}>
                        {t("transactionId")}
                      </Text>
                      <Text style={styles.modalDetailValue}>
                        {selectedTransaction?.transactionId || ""}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons
                        name="wallet-outline"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.modalDetailLabel}>{t("paymentMode")}</Text>
                      <Text style={styles.modalDetailValue}>
                        {(
                          selectedTransaction?.paymentMode || "NB"
                        ).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() =>
                  selectedTransaction &&
                  createAndShareReceiptPDF(selectedTransaction, inversement)
                }
              >
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.shareButtonText}>{t("shareReceipt")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
    color: theme.colors.white,
    textAlign: "center",
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  payButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  payButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  summaryCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  summaryHeader: {
    marginBottom: 14,
  },
  schemeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  schemeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  schemeTextContainer: {
    flex: 1,
  },
  schemeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 3,
  },
  schemeDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  schemeCode: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4caf50",
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  summaryStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 12,
  },
  progressSection: {
    marginTop: 14,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4caf50",
    borderRadius: 4,
  },
  detailsCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C1810",
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailItem: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: theme.colors.backgroundSecondary,
    padding: 12,
    borderRadius: 10,
  },
  detailLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 6,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textDark,
  },
  transactionsCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,204,68,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textDark,
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textDark,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    padding: 20,
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  modalBody: {
    padding: 20,
  },
  transactionStatus: {
    alignItems: "center",
    marginBottom: 24,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,204,68,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalStatusText: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.success,
  },
  amountRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 16,
  },
  amountItem: {
    flex: 1,
    alignItems: "center",
  },
  amountDivider: {
    width: 1,
    height: 50,
    backgroundColor: "rgba(139, 69, 19, 0.3)",
    marginHorizontal: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
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
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailInfo: {
    flex: 1,
  },
  modalDetailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  modalDetailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textDark,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a2a39",
  },
});

export default SavingsDetail;

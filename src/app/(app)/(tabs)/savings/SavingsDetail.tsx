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
  StatusBar,
  Animated,
  RefreshControl,
  LayoutAnimation,
  ImageBackground,
  TextInput,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import api, { paymentAPI } from "@/services/api";
import { initiatePayment } from "@/utils/paymentUtils";
import { saveFileToPublicDirectory } from "@/utils/fileUtils";
import { moderateScale } from "react-native-size-matters";
import SupportContactCard from "@/components/SupportContactCard";
import CustomAlert from "@/components/Alert";
import Icon from "react-native-vector-icons/AntDesign";
import { formatDate, formatDateTime, convertUTCToLocal } from "@/utils/dateTimeUtils";
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

import { CommonActions, useNavigationState } from "@react-navigation/native";
import { formatGoldWeight, loadLogoAsBase64 } from "@/utils/imageUtils";
import { theme } from "@/constants/theme";
import COLORS from "@/constants/colors";
import { SkeletonSavingsDetailPage } from "@/components/SkeletonLoader";
import { responsiveUtils } from "@/utils/responsiveUtils";

import { logger } from "@/utils/logger";

type Transaction = {
  paymentId: number;
  amountPaid: string;
  paymentDate: string;
  paymentMode: string;
  paymentModeType?: string;
  transactionId: string;
  orderId?: string;
  utrReference?: string;
  monthNumber?: number;
  status: string;
  current_goldrate: string;
  gold_rate: string;
  gold_weight?: string | number;
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


const SavingsDetail = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<any>();
  const { language, user } = useGlobalStore();
  const [paymentHistrory, setPaymentHistrory] = useState<Transaction[]>([]);
  const [inversement, setInversement] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { height, width } = useWindowDimensions();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUCCESS" | "PENDING" | "FAILED">("ALL");
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const filteredHistory = useMemo(() => {
    return paymentHistrory.filter((txn) => {
      // 1. Status Filter
      const status = (txn.status || "Success").toUpperCase();
      let matchesStatus = true;
      if (statusFilter === "SUCCESS") {
        matchesStatus = status === "SUCCESS" || status === "ACTIVE" || status === "COMPLETED";
      } else if (statusFilter === "PENDING") {
        matchesStatus = status === "PENDING";
      } else if (statusFilter === "FAILED") {
        matchesStatus = status === "FAILED";
      }

      // 2. Search Query (Transaction ID, Amount, Payment Mode)
      const txnId = (txn.transactionId || "").toLowerCase();
      const amount = (txn.amountPaid || "").toString();
      const mode = (txn.paymentMode || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery = txnId.includes(query) || amount.includes(query) || mode.includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [paymentHistrory, statusFilter, searchQuery]);

  const chronologicalPayments = useMemo(() => {
    return [...paymentHistrory]
      .filter((txn) => {
        const s = (txn.status || "Success").toUpperCase();
        return s === "SUCCESS" || s === "ACTIVE" || s === "COMPLETED";
      })
      .sort((a, b) => {
        return convertUTCToLocal(a.paymentDate).getTime() - convertUTCToLocal(b.paymentDate).getTime();
      });
  }, [paymentHistrory]);

  const getStatusColor = (status?: string) => {
    const s = (status || "Success").toUpperCase();
    if (s === "SUCCESS" || s === "ACTIVE" || s === "COMPLETED") {
      return {
        bg: "#E8F5E9",
        text: "#2E7D32",
        icon: "checkmark-circle-outline",
      };
    }
    if (s === "PENDING") {
      return {
        bg: "#FFF3E0",
        text: "#EF6C00",
        icon: "time-outline",
      };
    }
    return {
      bg: "#FFEBEE",
      text: "#C62828",
      icon: "alert-circle-outline",
    };
  };

  // Animation for scrolling
  const scrollY = new Animated.Value(0);

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
      viewAll: t("viewAll") || "View All",
      recentActivity: t("recentActivity") || "Recent Activity",
      schemeDetails: t("schemeDetails") || "Scheme Details",
      statusActive: t("statusActive"),
      downloadReceipt: t("downloadReceipt"),
    }),
    [language]
  );
  const state = useNavigationState((state) => state);
  const [advancePayments, setAdvancePayments] = useState<any[]>([]);

  const totalSelectedAmount = useMemo(() => {
    if (selectedPayments.length === 0) return 0;
    return selectedPayments.length * Number(params.emiAmount);
  }, [selectedPayments, params.emiAmount]);

  const { displayGoldRate, displayGoldWeight } = useMemo(() => {
    if (!selectedTransaction) return { displayGoldRate: 0, displayGoldWeight: 0 };
    const amount = Number(selectedTransaction.amountPaid || 0);
    let rate = Number(selectedTransaction.gold_rate || selectedTransaction.current_goldrate || 0);
    let weight = Number(selectedTransaction.gold_weight || 0);

    if (rate === 0 && weight > 0 && amount > 0) {
      rate = Math.round(amount / weight);
    } else if (weight === 0 && rate > 0 && amount > 0) {
      weight = Number((amount / rate).toFixed(3));
    }
    return { displayGoldRate: rate, displayGoldWeight: weight };
  }, [selectedTransaction]);

  const schemesData = useMemo(() => {
    try {
      return JSON.parse(params.schemesData);
    } catch (e) {
      return {};
    }
  }, [params.schemesData]);

  const rewardsData = useMemo(() => {
    try {
      return JSON.parse(params?.rewards || "[]");
    } catch {
      return [];
    }
  }, [params?.rewards]);

  const totalAmountandRewards = useMemo(() => {
    return Number(params?.totalPaid) + Number(rewardsData.reduce((acc: number, curr: any) => acc + curr.amount, 0));
  }, [params?.totalPaid, rewardsData]);

  const onlyTotalRewards = useMemo(() => {
    return Number(rewardsData.reduce((acc: number, curr: any) => acc + curr.amount, 0));
  }, [rewardsData]);

  const sanitizeFileName = (str: string) => str.replace(/[^a-zA-Z0-9]/g, "_");

  // PDF Generation functions
  const handleShareReceipt = async (
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

    const logoBase64 = await loadLogoAsBase64();
    const receiptData: PaymentReceiptData = {
      transactionId: transaction.transactionId,
      paymentId: String(transaction.paymentId),
      amountPaid: Number(transaction.amountPaid),
      paymentDate: transaction.paymentDate,
      paymentMode: transaction.paymentMode || "NB",
      paymentModeType: transaction.paymentModeType,
      orderId: transaction.orderId,
      utrReference: transaction.utrReference,
      status: transaction.status,
      goldRate: Number(transaction.gold_rate),
      goldWeight: Number(transaction.gold_weight),
      userName: user?.name,
      userMobile: user?.mobile?.toString(),
      userEmail: user?.email,
      rewardAmount: rewardAmount,
      rewardGoldGrams: rewardGoldGrams,
      maturityDate: params.maturityDate as string,
      inversement: {
        ...inversement,
        schemeName: params.schemeName || inversement?.schemeName,
      },
      logoBase64,
    };

    try {
      const htmlContent = generatePaymentReceiptHTML(receiptData);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const customerName = sanitizeFileName(user?.name || "Customer");
      const accountNo = sanitizeFileName(user?.id?.toString() || "000000");
      const paymentId = sanitizeFileName(
        transaction.paymentId?.toString() || "000000"
      );
      const fileName = `Payment_${customerName}_${accountNo}_${paymentId}.pdf`;

      const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const targetUri = `${targetDir}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(targetUri, {
          UTI: "com.adobe.pdf",
          mimeType: "application/pdf",
          dialogTitle: "Share payment receipt",
        });
      } else {
        if (Platform.OS === "ios") {
          await WebBrowser.openBrowserAsync(targetUri);
        } else {
          Alert.alert(
            "Saved",
            `Receipt saved successfully!\n\nLocation:\n${targetUri}\n\nYou can access it from your device's Files/Documents folder: On My Device -> ${fileName}`
          );
        }
      }
    } catch (e) {
      console.error("Receipt generation failed", e);
      Alert.alert("Error", "Failed to generate receipt");
    }
  };

  const handleDownloadReceipt = async (
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

    const logoBase64 = await loadLogoAsBase64();
    const receiptData: PaymentReceiptData = {
      transactionId: transaction.transactionId,
      paymentId: String(transaction.paymentId),
      amountPaid: Number(transaction.amountPaid),
      paymentDate: transaction.paymentDate,
      paymentMode: transaction.paymentMode || "NB",
      paymentModeType: transaction.paymentModeType,
      orderId: transaction.orderId,
      utrReference: transaction.utrReference,
      status: transaction.status,
      goldRate: Number(transaction.gold_rate),
      goldWeight: Number(transaction.gold_weight),
      userName: user?.name,
      userMobile: user?.mobile?.toString(),
      userEmail: user?.email,
      rewardAmount: rewardAmount,
      rewardGoldGrams: rewardGoldGrams,
      maturityDate: params.maturityDate as string,
      inversement: {
        ...inversement,
        schemeName: params.schemeName || inversement?.schemeName,
      },
      logoBase64,
    };

    try {
      const htmlContent = generatePaymentReceiptHTML(receiptData);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const customerName = sanitizeFileName(user?.name || "Customer");
      const accountNo = sanitizeFileName(user?.id?.toString() || "000000");
      const paymentId = sanitizeFileName(
        transaction.paymentId?.toString() || "000000"
      );
      const fileName = `Payment_${customerName}_${accountNo}_${paymentId}.pdf`;

      const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const targetUri = `${targetDir}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      await saveFileToPublicDirectory(targetUri, fileName, "Payment receipt saved to your chosen folder successfully!");
    } catch (e) {
      console.error("Receipt download failed", e);
      Alert.alert("Error", "Failed to download receipt");
    }
  };



  const PaymentNow = async () => {
    if (!user) {
      setAlertMessage("User not found. Please log in again.");
      setAlertType("error");
      setAlertVisible(true);
      return;
    }

    setIsLoading(true);

    try {
      // Verify KYC status before proceeding to pay
      const kycResponse = await api.get(`/kyc/status/${user.id}`);
      const isKycCompleted = kycResponse.data && (kycResponse.data.kyc_status === "Completed" || kycResponse.data.data);
      if (!isKycCompleted) {
        setIsLoading(false);
        Alert.alert(
          t("kycRequired") || 'KYC Required',
          t("kycNotCompleted") || 'Please complete your KYC details to continue with this payment.',
          [
            { text: t("cancel") || 'Cancel', style: 'cancel' },
            {
              text: t("completeKyc") || 'Complete KYC',
              onPress: () => {
                router.push('/home/kyc');
              }
            }
          ]
        );
        return;
      }

      let payload = {
        userId: user.id,
        investmentId: params.id,
      };

      let responce = await api.post("investments/check-payment", payload);

      if (responce?.data?.success === false) {
        setAlertMessage(responce?.data.message || "Something went wrong");
        setAlertType("error");
        setAlertVisible(true);
        return;
      }

      let parseSchemes;
      try {
        parseSchemes = JSON.parse(params.schemesData);
      } catch (parseError) {
        parseSchemes = {
          schemeTypeName: "Fixed",
          paymentFrequencyName: params.paymentFrequency || "Monthly",
        };
      }

      if (parseSchemes) {
        const isSchemeHybridType = parseSchemes.SCHEMETYPE === "Hybrid" ||
          parseSchemes.SCHEMETYPE?.toLowerCase() === "hybrid" ||
          parseSchemes.schemeType === "Hybrid" ||
          parseSchemes.schemeType?.toLowerCase() === "hybrid";

        const isFixedNull = parseSchemes.FIXED === null ||
          parseSchemes.FIXED === undefined ||
          parseSchemes.FIXED === "" ||
          parseSchemes.fixed === null ||
          parseSchemes.fixed === undefined ||
          parseSchemes.fixed === "";

        if (isSchemeHybridType && isFixedNull) {
          parseSchemes.schemeTypeName = "Flexi";
        }
      }

      const hybridStatus = responce?.data?.data?.hybridStatus || null;

      router.push({
        pathname: "/(tabs)/home/paymentNewOverView",
        params: {
          amount: params.emiAmount,
          schemeName: params.schemeName,
          schemeId: responce?.data.data.schemeId,
          chitId: responce?.data.data?.chitId,
          paymentFrequency: parseSchemes.paymentFrequencyName || params.paymentFrequency,
          schemeType: parseSchemes.schemeTypeName,
          source: params.source || "savings_detail",
          savinsTypes: parseSchemes.schemeType,
          hybridStatus: hybridStatus ? JSON.stringify(hybridStatus) : "",
          userDetails: JSON.stringify({
            amount: params.emiAmount,
            accountname: params.accountHolder,
            accNo: params.accNo,
            associated_branch: 1,
            investmentId: responce?.data.data?.investmentId,
            schemeId: responce?.data.data?.schemeId,
            schemeType: parseSchemes.schemeTypeName,
            schemeName: params?.schemeName,
            paymentFrequency: parseSchemes.paymentFrequencyName || params.paymentFrequency,
            chitId: responce?.data.data?.chitId,
          }),
          paidPaymentCount: String(paymentHistrory?.length + 1 || 0),
          maturityDate: params.maturityDate,
          joiningDate: params.joiningDate || inversement?.joiningDate,
          totalPaid: params.totalPaid,
          noOfIns: params.noOfIns,
          goldWeight: params.goldWeight,
          accNo: params.accNo,
        },
      });
    } catch (error) {
      logger.error("Error in PaymentNow:", error);
      setAlertMessage("An error occurred. Please try again.");
      setAlertType("error");
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-trigger PaymentNow
  useEffect(() => {
    if (params.autoPayNow === "1") {
      setIsLoading(true);
      setLoading(true);
      const timer = setTimeout(() => {
        PaymentNow();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [params.id]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, []);

  const getProgressPercentage = () => {
    const paid = Number(params.monthsPaid) || 0;
    const total = Number(params.noOfIns) || 1;
    return Math.min((paid / total) * 100, 100);
  };

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

    setIsLoading(true);

    try {
      // Verify KYC status before proceeding to pay
      const kycResponse = await api.get(`/kyc/status/${user.id}`);
      const isKycCompleted = kycResponse.data && (kycResponse.data.kyc_status === "Completed" || kycResponse.data.data);
      if (!isKycCompleted) {
        setIsLoading(false);
        Alert.alert(
          t("kycRequired") || 'KYC Required',
          t("kycNotCompleted") || 'Please complete your KYC details to continue with this payment.',
          [
            { text: t("cancel") || 'Cancel', style: 'cancel' },
            {
              text: t("completeKyc") || 'Complete KYC',
              onPress: () => {
                router.push('/home/kyc');
              }
            }
          ]
        );
        return;
      }

      let payload = {
        userId: user.id,
        investmentId: params.id,
      };

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
      } catch (parseError) {
        logger.error("Error parsing schemes data:", parseError);
        // Fallback to a default structure
        parseSchemes = {
          schemeTypeName: "Fixed",
          paymentFrequencyName: params.paymentFrequency || "Monthly",
        };
      }

      if (parseSchemes) {
        const isSchemeHybridType = parseSchemes.SCHEMETYPE === "Hybrid" ||
          parseSchemes.SCHEMETYPE?.toLowerCase() === "hybrid" ||
          parseSchemes.schemeType === "Hybrid" ||
          parseSchemes.schemeType?.toLowerCase() === "hybrid";

        const isFixedNull = parseSchemes.FIXED === null ||
          parseSchemes.FIXED === undefined ||
          parseSchemes.FIXED === "" ||
          parseSchemes.fixed === null ||
          parseSchemes.fixed === undefined ||
          parseSchemes.fixed === "";

        if (isSchemeHybridType && isFixedNull) {
          parseSchemes.schemeTypeName = "Flexi";
        }
      }

      const hybridStatus = responce?.data?.data?.hybridStatus || null;

      router.push({
        pathname: "/(tabs)/home/paymentNewOverView",
        params: {
          amount: totalSelectedAmount,
          schemeName: params.schemeName,
          schemeId: responce?.data.data.schemeId,
          chitId: responce?.data.data?.chitId,
          paymentFrequency:
            parseSchemes.paymentFrequencyName || params.paymentFrequency,
          schemeType: parseSchemes.schemeTypeName,
          source: params.source || "savings_detail_bulk",
          savinsTypes: parseSchemes.schemeType,
          hybridStatus: hybridStatus ? JSON.stringify(hybridStatus) : "",
          userDetails: JSON.stringify({
            amount: totalSelectedAmount,
            accountname: params.accountHolder,
            accNo: params.accNo,
            associated_branch: 1,
            investmentId: responce?.data.data?.investmentId,
            schemeId: responce?.data.data?.schemeId,
            schemeType: parseSchemes.schemeTypeName,
            schemeName: params?.schemeName,
            paymentFrequency:
              parseSchemes.paymentFrequencyName || params.paymentFrequency,
            chitId: responce?.data.data?.chitId,
            selectedMonths: selectedPayments.map((p) => p.monthNumber).join(","),
          }),
          paidPaymentCount: String(
            (paymentHistrory?.length || 0) + selectedPayments.length
          ),
          maturityDate: params.maturityDate,
          joiningDate: params.joiningDate || inversement?.joiningDate,
          totalPaid: params.totalPaid,
          noOfIns: params.noOfIns,
          goldWeight: params.goldWeight,
          accNo: params.accNo,
        },
      });
    } catch (error) {
      logger.error("Error in handleBulkPayment:", error);
      setAlertMessage("An error occurred. Please try again.");
      setAlertType("error");
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
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

  // New Component Renderers

  const renderHeroCard = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={theme.colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroBackground}>
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroSchemeName}>{params.schemeName}</Text>
              <Text style={styles.heroSchemeCode}>{params.schemeCode}</Text>
            </View>
            {/* <View style={styles.heroStatusBadge}>
               <View style={styles.heroStatusDot} />
               <Text style={styles.heroStatusText}>{translations.statusActive || "Active"}</Text>
             </View> */}
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>{translations.totalInvested}</Text>
              <Text style={styles.heroStatValue}>₹{Number(totalAmountandRewards).toLocaleString()}</Text>
            </View>
            {schemesData?.schemeType?.toLowerCase() === "weight" && (
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatLabel}>{translations.goldAccumulated}</Text>
                <Text style={styles.heroStatValue}>{formatGoldWeight(parseFloat(params.goldWeight) || 0)}</Text>
              </View>
            )}
          </View>

          {schemesData?.paymentFrequencyName !== "Flexi" && schemesData?.paymentFrequencyName !== "Hybrid" && schemesData?.paymentFrequencyName?.toLowerCase() !== "hybrid" && (
            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabelText}>{translations.paymentProgress}</Text>
                <Text style={styles.progressValueText}>{params.monthsPaid}/{params.noOfIns} {translations.months}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${getProgressPercentage()}%` }]} />
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  const renderInfoGrid = () => {
    const isFlexiOrHybrid = (schemesData?.paymentFrequencyName || params.paymentFrequency || "").toLowerCase().includes("flexi") ||
      (schemesData?.paymentFrequencyName || params.paymentFrequency || "").toLowerCase().includes("hybrid") ||
      (params.schemeName || "").toLowerCase().includes("flexi") ||
      (params.schemeName || "").toLowerCase().includes("hybrid");

    const schemeTypeDisplay = isFlexiOrHybrid
      ? (((schemesData?.paymentFrequencyName || params.paymentFrequency || "").toLowerCase().includes("hybrid") || (params.schemeName || "").toLowerCase().includes("hybrid")) ? "Hybrid" : "Flexi")
      : (schemesData?.paymentFrequencyName || params.paymentFrequency || "Fixed");

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{translations.schemeDetails}</Text>
        <View style={styles.gridContainer}>
          {/* Scheme Type */}
          <View style={styles.gridItem}>
            <View style={[styles.gridIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="card" size={20} color="#F57C00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gridLabel}>{translations.schemeType}</Text>
              <Text style={styles.gridValue} numberOfLines={1}>{schemeTypeDisplay}</Text>
            </View>
          </View>

          {/* Monthly EMI (Only if not Flexi/Hybrid) */}
          {!isFlexiOrHybrid && (
            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="cash" size={20} color="#388E3C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gridLabel}>{translations.monthlyEMI}</Text>
                <Text style={styles.gridValue} numberOfLines={1}>₹{Number(params.emiAmount).toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Next Due Date */}
          {params.dueDate && params.dueDate !== "N/A" && params.dueDate !== "" ? (
            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: '#E0F7FA' }]}>
                <Ionicons name="time" size={20} color="#00838F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gridLabel}>{t("nextDueDate") || "Next Due Date"}</Text>
                <Text style={styles.gridValue} numberOfLines={1}>
                  {params.dueDate === "Pay Anytime"
                    ? (t("payAnytime") || "Pay Anytime")
                    : formatDate(params.dueDate, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Maturity Date */}
          <View style={styles.gridItem}>
            <View style={[styles.gridIcon, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="calendar" size={20} color="#D32F2F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gridLabel}>{translations.maturityDate}</Text>
              <Text style={styles.gridValue} numberOfLines={1}>{params.maturityDate}</Text>
            </View>
          </View>

          {/* Account Number */}
          <View style={[styles.gridItem, { width: '100%' }]}>
            <View style={[styles.gridIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="bookmark" size={20} color="#7B1FA2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gridLabel}>{translations.accountNo}</Text>
              <Text style={styles.gridValue} numberOfLines={1}>{params.accNo}</Text>
            </View>
          </View>

          {/* Rewards (Only if total rewards > 0) */}
          {onlyTotalRewards > 0 && (
            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gridLabel}>{translations.rewards}</Text>
                <Text style={styles.gridValue} numberOfLines={1}>₹{Number(onlyTotalRewards).toLocaleString()}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTransactionHistory = () => {
    const displayList = showAllTransactions
      ? filteredHistory
      : filteredHistory.slice(0, 20);

    return (
      <View style={[styles.sectionContainer, { marginBottom: 120 }]}>
        {/* Header with View All toggle */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Transaction History ({paymentHistrory.length})</Text>
          {filteredHistory.length > 20 && (
            <TouchableOpacity onPress={() => setShowAllTransactions(!showAllTransactions)}>
              <Text style={styles.viewAllText}>
                {showAllTransactions ? "Show Less" : translations.viewAll}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, amount, or mode..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#888"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#888" style={styles.searchClearIcon} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips - Hidden as we only show success payments, kept code for future usage */}
        {/* <View style={styles.filterContainer}>
          {(["ALL", "SUCCESS", "PENDING", "FAILED"] as const).map((filter) => {
            const isActive = statusFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  isActive && styles.activeFilterChip
                ]}
                onPress={() => setStatusFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.activeFilterChipText
                  ]}
                >
                  {filter === "ALL" 
                    ? "All" 
                    : filter === "SUCCESS" 
                    ? "Success" 
                    : filter === "PENDING" 
                    ? "Pending" 
                    : "Failed"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View> */}

        {/* Transaction Cards List */}
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#CCC" />
            <Text style={styles.emptyStateText}>
              {searchQuery || statusFilter !== "ALL"
                ? "No transactions match your search/filters"
                : translations.noTransactionsFound}
            </Text>
          </View>
        ) : (
          displayList.map((txn, index) => {
            const statusConfig = getStatusColor(txn.status);
            return (
              <TouchableOpacity
                key={txn.transactionId || index}
                style={[styles.transactionCard, { borderLeftColor: statusConfig.text }]}
                onPress={() => setSelectedTransaction(txn)}
                activeOpacity={0.7}
              >
                {/* Left status icon */}
                <View style={[styles.statusIconContainer, { backgroundColor: statusConfig.bg }]}>
                  {(() => {
                    const s = (txn.status || "Success").toUpperCase();
                    const isSuccess = s === "SUCCESS" || s === "ACTIVE" || s === "COMPLETED";
                    const seqNum = isSuccess
                      ? chronologicalPayments.findIndex(p => p.paymentId === txn.paymentId || (p.transactionId && p.transactionId === txn.transactionId)) + 1
                      : 0;
                    return seqNum > 0 ? (
                      <Text style={{ color: statusConfig.text, fontWeight: "bold", fontSize: 15 }}>
                        {seqNum}
                      </Text>
                    ) : (
                      <Ionicons name={statusConfig.icon as any} size={20} color={statusConfig.text} />
                    );
                  })()}
                </View>

                {/* Transaction Info */}
                <View style={styles.transactionContent}>
                  <View style={styles.transactionHeader}>
                    <View>
                      <Text style={styles.transactionDate}>
                        {formatDate(txn.paymentDate, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                      <View style={styles.metaRow}>
                        <Text style={styles.transactionMode}>{(txn.paymentMode || "NB").toUpperCase()}</Text>
                        {txn.gold_rate ? (
                          <Text style={styles.transactionRate}> • ₹{Number(txn.gold_rate).toLocaleString()}/g</Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.transactionAmount}>₹{Number(txn.amountPaid).toLocaleString()}</Text>
                      <View style={[styles.statusMiniBadge, { backgroundColor: statusConfig.bg }]}>
                        <Text style={[styles.statusMiniBadgeText, { color: statusConfig.text }]}>
                          {txn.status || "Success"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.transactionDivider} />
                  <View style={styles.transactionFooter}>
                    <Text style={styles.transactionId}>ID: {txn.transactionId}</Text>
                    <TouchableOpacity onPress={() => setSelectedTransaction(txn)} style={styles.receiptButton}>
                      <Ionicons name="download-outline" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.quaternary || '#F2E6D2'} />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? top + 10 : top - 60 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary || "#850111"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.schemeDetails}</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <SkeletonSavingsDetailPage />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {renderHeroCard()}
            {renderInfoGrid()}
            {renderTransactionHistory()}
            <View style={{ height: bottomPadding + 60 }} />
          </ScrollView>
        )}

        {/* Floating Bottom Bar for Payment */}
        <View style={[styles.bottomBar, { paddingBottom: bottom || 20 }]}>
          <TouchableOpacity
            style={[styles.payButton, isLoading && styles.payButtonDisabled]}
            onPress={PaymentNow}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.payButtonText}>{translations.payNow}</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      {/* Transaction Modal (Optional if you want to show detailed receipt view on tap) */}
      {selectedTransaction && (
        <Modal
          visible={!!selectedTransaction}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedTransaction(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.modalTitle}>Transaction Details</Text>
                  <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: '#2E7D32', fontSize: 12, fontWeight: 'bold' }}>SUCCESS</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedTransaction(null)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Transaction ID</Text>
                  <Text style={styles.receiptValue}>{selectedTransaction.transactionId}</Text>
                </View>
                {selectedTransaction.monthNumber && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Installment Month</Text>
                    <Text style={styles.receiptValue}>Month {selectedTransaction.monthNumber}</Text>
                  </View>
                )}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Date</Text>
                  <Text style={styles.receiptValue}>
                    {formatDateTime(selectedTransaction.paymentDate, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Amount</Text>
                  <Text style={styles.receiptValueHighlight}>₹{Number(selectedTransaction.amountPaid).toLocaleString()}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Mode</Text>
                  <Text style={styles.receiptValue}>
                    {(selectedTransaction.paymentMode || "NB").toUpperCase()}
                    {selectedTransaction.paymentModeType ? ` (${selectedTransaction.paymentModeType.toUpperCase()})` : ""}
                  </Text>
                </View>
                {selectedTransaction.orderId && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Order ID</Text>
                    <Text style={styles.receiptValue}>{selectedTransaction.orderId}</Text>
                  </View>
                )}
                {selectedTransaction.utrReference && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>UTR Reference</Text>
                    <Text style={styles.receiptValue}>{selectedTransaction.utrReference}</Text>
                  </View>
                )}
                {(displayGoldRate > 0 || displayGoldWeight > 0) && (
                  <>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Gold Weight</Text>
                      <Text style={styles.receiptValue}>
                        {displayGoldWeight.toFixed(3)} g
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Gold Rate</Text>
                      <Text style={styles.receiptValue}>₹{displayGoldRate.toLocaleString()}/g</Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.downloadBtn]}
                  onPress={() => handleDownloadReceipt(selectedTransaction, inversement)}
                >
                  <Ionicons name="download-outline" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.downloadBtnText}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.shareBtn]}
                  onPress={() => handleShareReceipt(selectedTransaction, inversement)}
                >
                  <Ionicons name="share-social-outline" size={18} color="white" style={{ marginRight: 6 }} />
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: theme.colors.quaternary,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Hero Card Styles
  heroContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
    marginTop: 10,
  },
  heroCard: {
    borderRadius: 24,
    padding: 2, // Gradient border effect if needed, otherwise padding for inner content
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  heroBackground: {
    padding: 24,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  heroSchemeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  heroSchemeCode: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  heroStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  heroStatusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  heroStatItem: {
    flex: 1,
  },
  heroStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  progressContainer: {
    marginTop: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabelText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  progressValueText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },

  // Section Styles
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  // Grid Styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  gridItem: {
    width: '48%', // 2 columns
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  gridLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Search bar styles
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#333",
    padding: 0,
  },
  searchClearIcon: {
    marginLeft: 8,
  },

  // Filter chips styles
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  activeFilterChipText: {
    color: "#FFF",
    fontWeight: "700",
  },

  // New transaction card styles
  transactionCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  transactionDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  transactionMode: {
    fontSize: 11,
    fontWeight: "600",
    color: "#777",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  transactionRate: {
    fontSize: 11,
    color: "#777",
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  statusMiniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  statusMiniBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  transactionDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 10,
  },
  transactionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionId: {
    fontSize: 11,
    color: "#999",
  },
  receiptButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingTop: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    gap: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  receiptLabel: {
    fontSize: 14,
    color: '#666',
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  receiptValueHighlight: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.success || "green",
  },
  downloadButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  downloadButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  downloadBtn: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.primary,
  },
  downloadBtnText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  shareBtn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  shareBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
});

export default SavingsDetail;

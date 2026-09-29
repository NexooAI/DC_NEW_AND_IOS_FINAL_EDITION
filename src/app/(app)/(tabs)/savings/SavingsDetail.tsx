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
import { useLocalSearchParams, useNavigation, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import api, { paymentAPI } from "@/services/api";
import { initiatePayment, initializeSocket } from "@/utils/paymentUtils";
import { saveFileToPublicDirectory, getPdfFileUri } from "@/utils/fileUtils";
import { loadLogoAsBase64 } from "@/utils/imageUtils";
import { moderateScale } from "react-native-size-matters";
import SupportContactCard from "@/components/SupportContactCard";
import CustomAlert from "@/components/Alert";
import { checkIsDepositScheme } from "@/utils/schemeUtils";
import Icon from "react-native-vector-icons/AntDesign";
import Svg, { Path, Circle } from "react-native-svg";
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
import { formatGoldWeight } from "@/utils/imageUtils";
import { formatDate, formatDateTime } from "@/utils/dateTimeUtils";
import { theme } from "@/constants/theme";
import COLORS from "@/constants/colors";
import { SkeletonSavingsDetailPage } from "@/components/SkeletonLoader";
import { responsiveUtils } from "@/utils/responsiveUtils";
import JoiningGiftBanner from "@/components/JoiningGiftBanner";
import { useAppVisibility } from "@/hooks/useAppVisibility";

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
  current_goldrate?: string | number;
  gold_rate?: string | number;
  gold_weight?: string | number;
  goldRate?: string | number;
  goldWeight?: string | number;
  current_silverrate?: string | number;
  silver_rate?: string | number;
  silver_weight?: string | number;
  silverRate?: string | number;
  silverWeight?: string | number;
  rate?: string | number;
  weight?: string | number;
  rewardsList?: {
    id: number;
    amount: number;
    gold_grams: string;
    paymentId: number;
    date: string;
    investment_id: number;
  };
  rewardAmount?: string | number;
  rewardGoldGrams?: string | number;
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
  const theme = useAppTheme();
  styles = getStyles(theme);
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<any>();
  const { language, user, customerInvestments } = useGlobalStore();
  const { isVisible } = useAppVisibility();

  // Find pre-cached investment data from RAM store
  const invId = params.id || params.investmentId;
  const initialCachedInv = useMemo(() => {
    if (!customerInvestments || !invId) return null;
    return customerInvestments.find(
      (item: any) => String(item.id || item.investmentId) === String(invId)
    );
  }, [customerInvestments, invId]);

  const [paymentHistrory, setPaymentHistrory] = useState<Transaction[]>([]);
  const [inversement, setInversement] = useState<any>(initialCachedInv || undefined);
  const [giftDetails, setGiftDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!initialCachedInv);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
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
        return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
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
      startDate: t("startDate") || "Start Date",
      nextDueDate: t("nextDueDate") || "Next Due Date",
      depositAmount: t("depositAmount") || "Deposit Amount",
      oneTimeDeposit: t("oneTimeDeposit") || "One-Time Deposit",
      bonusRewards: t("bonusRewards") || "Bonus Rewards",
      schemeMatured: t("schemeMatured") || "Scheme Matured",
      redeemAtStore: t("redeemAtStore") || "Redeem Jewellery at Showroom",
      maturedCongratulations: t("maturedCongratulations") || "Congratulations! Your scheme has successfully matured. Visit our showroom to redeem your jewellery.",
      collectGiftAtStore: t("collectGiftAtStore") || "Collect Gift at Showroom",
      searchTxnPlaceholder: t("searchTxnPlaceholder") || "Search by ID, amount, or mode...",
      transactionDetails: t("transactionDetails") || "Transaction Details",
      showLess: t("showLess") || "Show Less",
      silverAccumulated: t("silverAccumulated") || "Silver Accumulated",
      silverRate: t("silverRate") || "Silver Rate",
      silverWeight: t("silverWeight") || "Silver Weight",
      oneTimeDepositCompleted: t("oneTimeDepositCompleted") || "One-Time Deposit Completed",
      depositActiveDesc: t("depositActiveDesc"),
      allInstallmentsCompleted: t("allInstallmentsCompleted") || "All Installments Paid",
      allInstallmentsCompletedDesc: t("allInstallmentsCompletedDesc"),
      daysRemainingSuffix: t("daysToMaturity") || "Days to Maturity",
    }),
    [language]
  );
  const [advancePayments, setAdvancePayments] = useState<any[]>([]);

  const totalSelectedAmount = useMemo(() => {
    if (selectedPayments.length === 0) return 0;
    const rawEmi = params.emiAmount ?? inversement?.chits?.monthlyInstallment ?? inversement?.installmentAmount ?? 0;
    const emi = Number(rawEmi) || 0;
    return selectedPayments.length * emi;
  }, [selectedPayments, params.emiAmount, inversement]);



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

  const rewardsListFromInv = useMemo(() => {
    if (Array.isArray(inversement?.rewardsList) && inversement.rewardsList.length > 0) {
      return inversement.rewardsList;
    }
    const fromPayments = (paymentHistrory || [])
      .map(p => (p as any).rewardsList || ((p as any).rewardAmount ? { amount: (p as any).rewardAmount, gold_grams: (p as any).rewardGoldGrams } : null))
      .filter(Boolean);
    if (fromPayments.length > 0) return fromPayments;
    return rewardsData;
  }, [inversement, paymentHistrory, rewardsData]);

  const totalPaidAmount = useMemo(() => {
    const rawPaid = params?.totalPaid ?? inversement?.total_paid ?? inversement?.totalPaid ?? 0;
    const num = Number(rawPaid);
    return isNaN(num) ? 0 : num;
  }, [params?.totalPaid, inversement]);

  const totalRewardsAmount = useMemo(() => {
    if (inversement?.totalBonusAmount !== undefined && Number(inversement.totalBonusAmount) > 0) {
      return Number(inversement.totalBonusAmount);
    }
    if (inversement?.totalRewardAmount !== undefined && Number(inversement.totalRewardAmount) > 0) {
      return Number(inversement.totalRewardAmount);
    }
    return rewardsListFromInv.reduce((acc: number, curr: any) => {
      const val = Number(curr?.amount || curr?.interest_amount || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  }, [inversement, rewardsListFromInv]);

  const totalRewardsGold = useMemo(() => {
    if (inversement?.totalBonusGold !== undefined && Number(inversement.totalBonusGold) > 0) {
      return Number(inversement.totalBonusGold);
    }
    if (inversement?.totalRewardGoldGrams !== undefined && Number(inversement.totalRewardGoldGrams) > 0) {
      return Number(inversement.totalRewardGoldGrams);
    }
    return rewardsListFromInv.reduce((acc: number, curr: any) => {
      const val = Number(curr?.gold_grams || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  }, [inversement, rewardsListFromInv]);

  const hasBonusRewards = useMemo(() => {
    return totalRewardsAmount > 0 || totalRewardsGold > 0 || inversement?.is_interest_enabled === true || inversement?.is_interest_enabled == 1;
  }, [totalRewardsAmount, totalRewardsGold, inversement]);

  const totalAmountandRewards = useMemo(() => {
    return totalPaidAmount + totalRewardsAmount;
  }, [totalPaidAmount, totalRewardsAmount]);

  const onlyTotalRewards = totalRewardsAmount;

  // Metal type detection (thorough check including scheme name, metal, metalType)
  const metalType = useMemo(() => {
    const combined = String(
      params.metal ||
      params.metalType ||
      inversement?.metal ||
      inversement?.metalType ||
      inversement?.schemes?.metal ||
      schemesData?.metal ||
      schemesData?.metalType ||
      params.schemeName ||
      inversement?.schemeName ||
      inversement?.chits?.name ||
      ""
    ).toLowerCase();

    if (combined.includes("silver")) return "silver";
    if (combined.includes("diamond")) return "diamond";
    if (combined.includes("platinum")) return "platinum";
    if (combined.includes("old_gold") || combined.includes("old gold")) return "old_gold";
    return "gold";
  }, [params.metal, params.metalType, params.schemeName, inversement, schemesData]);

  const isSilver = metalType === "silver";
  const accumulatedLabel = isSilver
    ? (translations.silverAccumulated || "Silver Accumulated")
    : (translations.goldAccumulated || "Gold Accumulated");
  const rateLabel = isSilver
    ? (translations.silverRate || "Silver Rate")
    : (translations.goldRate || "Gold Rate");
  const weightLabel = isSilver
    ? (translations.silverWeight || "Silver Weight")
    : (translations.goldWeight || "Gold Weight");

  const { displayGoldRate, displayGoldWeight } = useMemo(() => {
    if (!selectedTransaction) return { displayGoldRate: 0, displayGoldWeight: 0 };
    const rate = isSilver
      ? Number(
          selectedTransaction.rate ||
          selectedTransaction.silverRate ||
          selectedTransaction.current_silverrate ||
          (Number(selectedTransaction.silver_rate) > 50 ? selectedTransaction.silver_rate : 0) ||
          inversement?.current_silverrate ||
          0
        )
      : Number(
          selectedTransaction.rate ||
          selectedTransaction.goldRate ||
          selectedTransaction.current_goldrate ||
          (Number(selectedTransaction.gold_rate) > 500 ? selectedTransaction.gold_rate : 0) ||
          inversement?.current_goldrate ||
          0
        );

    const weight = isSilver
      ? Number(
          selectedTransaction.weight ||
          selectedTransaction.silverWeight ||
          selectedTransaction.silver_weight ||
          (Number(selectedTransaction.silver_rate) <= 50 ? selectedTransaction.silver_rate : 0) ||
          0
        )
      : Number(
          selectedTransaction.weight ||
          selectedTransaction.goldWeight ||
          selectedTransaction.gold_weight ||
          (Number(selectedTransaction.gold_rate) <= 500 ? selectedTransaction.gold_rate : 0) ||
          0
        );

    return { displayGoldRate: rate, displayGoldWeight: weight };
  }, [selectedTransaction, isSilver, inversement]);

  // Scheme Type Detection
  const isDeposit = useMemo(() => {
    return checkIsDepositScheme({
      schemeName: params.schemeName || inversement?.schemeName || inversement?.chits?.name,
      schemePlanTypeName: schemesData?.schemePlanTypeName || params.schemePlanTypeName || inversement?.schemePlanTypeName,
      scheme_plan_type_id: params.scheme_plan_type_id || schemesData?.scheme_plan_type_id,
      schemeType: inversement?.schemeType || schemesData?.schemeType || params.schemeType,
      paymentFrequency: params.paymentFrequency || inversement?.chits?.paymentFrequency,
      paymentFrequencyName: schemesData?.paymentFrequencyName || inversement?.chits?.paymentFrequencyName,
    });
  }, [schemesData, params, inversement]);

  // Determines whether this scheme strictly accumulates gold/silver weight (Recurring Weight scheme)
  const isWeightScheme = useMemo(() => {
    if (isDeposit) return false;

    const st = String(
      schemesData?.savingType ||
      inversement?.savingType ||
      params.savingType ||
      ""
    ).toLowerCase();
    if (st === "amount") return false;
    if (st === "weight" || st === "old_gold") return true;

    const sType = String(
      schemesData?.schemeType ||
      inversement?.schemeType ||
      params.schemeType ||
      ""
    ).toLowerCase();
    if (sType === "amount") return false;
    if (sType === "weight") return true;

    const planName = String(
      schemesData?.schemeTypeName ||
      inversement?.schemeTypeName ||
      params.schemeTypeName ||
      ""
    ).toLowerCase();
    if (planName === "fixed") return false;

    return false;
  }, [isDeposit, schemesData, inversement, params]);

  const isFlexi = useMemo(() => {
    const freq = String(schemesData?.paymentFrequencyName || params.paymentFrequency || inversement?.chits?.paymentFrequency || "").toLowerCase();
    const name = String(params.schemeName || inversement?.schemeName || inversement?.chits?.name || "").toLowerCase();
    const type = String(schemesData?.schemeTypeName || params.schemeType || inversement?.schemeType || "").toLowerCase();
    return freq.includes("flexi") || name.includes("flexi") || type.includes("flexi");
  }, [schemesData, params, inversement]);

  const isHybrid = useMemo(() => {
    const freq = String(schemesData?.paymentFrequencyName || params.paymentFrequency || inversement?.chits?.paymentFrequency || "").toLowerCase();
    const name = String(params.schemeName || inversement?.schemeName || inversement?.chits?.name || "").toLowerCase();
    const type = String(schemesData?.schemeTypeName || params.schemeType || inversement?.schemeType || "").toLowerCase();
    return freq.includes("hybrid") || name.includes("hybrid") || type.includes("hybrid");
  }, [schemesData, params, inversement]);

  const isFixed = useMemo(() => {
    return !isDeposit && !isFlexi && !isHybrid;
  }, [isDeposit, isFlexi, isHybrid]);

  const maturityDateValue = useMemo(() => {
    return params.maturityDate || inversement?.maturity_date || inversement?.maturityDate || "N/A";
  }, [params.maturityDate, inversement]);

  // Date-based expiration check
  const isDateExpired = useMemo(() => {
    const maturityDateStr = params.maturityDate || inversement?.maturity_date || inversement?.maturityDate;
    if (maturityDateStr && maturityDateStr !== "N/A" && maturityDateStr !== "") {
      const matDate = new Date(maturityDateStr);
      if (!isNaN(matDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const compareMat = new Date(matDate);
        compareMat.setHours(23, 59, 59, 999);
        return today.getTime() > compareMat.getTime();
      }
    }
    return false;
  }, [params.maturityDate, inversement]);

  // Explicit status check from API
  const isExplicitlyMatured = useMemo(() => {
    const status = (inversement?.status || params.status || "").toUpperCase();
    return ["MATURED", "COMPLETED", "CLOSED", "CLAIMED"].includes(status);
  }, [inversement?.status, params.status]);

  // True scheme maturity when date has expired or status is explicitly matured
  const isSchemeMatured = useMemo(() => {
    return isExplicitlyMatured || isDateExpired;
  }, [isExplicitlyMatured, isDateExpired]);

  // Days remaining until maturity
  const daysToMaturity = useMemo(() => {
    const maturityDateStr = params.maturityDate || inversement?.maturity_date || inversement?.maturityDate;
    if (maturityDateStr && maturityDateStr !== "N/A" && maturityDateStr !== "") {
      const matDate = new Date(maturityDateStr);
      if (!isNaN(matDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const compareMat = new Date(matDate);
        compareMat.setHours(0, 0, 0, 0);
        const diffMs = compareMat.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
      }
    }
    return null;
  }, [params.maturityDate, inversement]);

  // One-time deposit payment completed (only applicable if strictly a deposit scheme)
  const isDepositPaymentCompleted = useMemo(() => {
    if (!isDeposit) return false;
    const paid = Number(totalPaidAmount) || Number(params.totalPaid) || Number(inversement?.total_paid) || 0;
    const months = Number(params.monthsPaid) || Number(inversement?.lastInstallment) || 0;
    return paid > 0 || months >= 1;
  }, [isDeposit, totalPaidAmount, params.totalPaid, inversement, params.monthsPaid]);

  const canMakePayment = useMemo(() => {
    if (isSchemeMatured) return false;
    // Only block payment if it is a deposit scheme AND deposit has already been paid
    if (isDeposit && isDepositPaymentCompleted) return false;
    return true;
  }, [isSchemeMatured, isDeposit, isDepositPaymentCompleted]);

  const isMaturedOrCompleted = useMemo(() => {
    return isSchemeMatured || (isDeposit && isDepositPaymentCompleted);
  }, [isSchemeMatured, isDeposit, isDepositPaymentCompleted]);

  const sanitizeFileName = (str: string) => str.replace(/[^a-zA-Z0-9]/g, "_");

  // PDF Generation functions
  const buildReceiptData = async (
    transaction: Transaction,
    inversement: any
  ): Promise<PaymentReceiptData> => {
    const rewardAmount = (transaction as any).rewardAmount || (transaction.rewardsList?.amount
      ? Number(transaction.rewardsList.amount)
      : undefined);
    const rewardGoldGrams = (transaction as any).rewardGoldGrams || (transaction.rewardsList?.gold_grams
      ? Number(transaction.rewardsList.gold_grams)
      : undefined);

    const schemePlanTypeName = inversement?.schemePlanTypeName || params.schemePlanTypeName || schemesData?.schemePlanTypeName || params.scheme_plan_type_id || inversement?.schemeType;

    // Resolve rate according to metal type
    let txnRate = isSilver
      ? Number(
          (transaction as any).rate ||
          (transaction as any).silverRate ||
          (transaction as any).current_silverrate ||
          (Number((transaction as any).silver_rate) > 50 ? (transaction as any).silver_rate : 0) ||
          inversement?.current_silverrate ||
          0
        )
      : Number(
          (transaction as any).rate ||
          (transaction as any).goldRate ||
          transaction.current_goldrate ||
          (Number(transaction.gold_rate) > 500 ? transaction.gold_rate : 0) ||
          inversement?.current_goldrate ||
          0
        );

    // If rate is 0 and this is a weight scheme, fallback to live cached rates
    if (txnRate === 0 && isWeightScheme) {
      try {
        const cachedRates = useGlobalStore.getState().getCachedRates()?.data;
        if (isSilver) {
          txnRate = Number(cachedRates?.silver_rate || 0);
          if (txnRate === 0) {
            const stored = await AsyncStorage.getItem("silver_rate");
            if (stored) txnRate = Number(stored);
          }
        } else {
          txnRate = Number(cachedRates?.gold_rate || 0);
          if (txnRate === 0) {
            const stored = await AsyncStorage.getItem("gold_rate");
            if (stored) txnRate = Number(stored);
          }
        }
      } catch {
        // ignore fallback errors
      }
    }

    // Resolve weight according to metal type
    let txnWeight = isSilver
      ? Number(
          (transaction as any).weight ||
          (transaction as any).silverWeight ||
          (transaction as any).silver_weight ||
          (Number((transaction as any).silver_rate) <= 50 ? (transaction as any).silver_rate : 0) ||
          inversement?.totalsilverweight ||
          0
        )
      : Number(
          (transaction as any).weight ||
          (transaction as any).goldWeight ||
          transaction.gold_weight ||
          (Number(transaction.gold_rate) <= 500 ? transaction.gold_rate : 0) ||
          inversement?.totalgoldweight ||
          0
        );

    if (txnWeight === 0 && isWeightScheme && txnRate > 0 && Number(transaction.amountPaid) > 0) {
      txnWeight = Number((Number(transaction.amountPaid) / txnRate).toFixed(3));
    }

    return {
      transactionId: transaction.transactionId,
      paymentId: String(transaction.paymentId),
      amountPaid: Number(transaction.amountPaid),
      paymentDate: transaction.paymentDate,
      paymentMode: transaction.paymentMode || "NB",
      paymentModeType: transaction.paymentModeType,
      orderId: transaction.orderId,
      utrReference: transaction.utrReference,
      status: transaction.status,
      rate: txnRate,
      weight: txnWeight,
      goldRate: isSilver ? 0 : txnRate,
      goldWeight: isSilver ? 0 : txnWeight,
      silverRate: isSilver ? txnRate : 0,
      silverWeight: isSilver ? txnWeight : 0,
      isWeightScheme: isWeightScheme,
      userName: user?.name,
      userMobile: user?.mobile?.toString(),
      userEmail: user?.email,
      rewardAmount: rewardAmount,
      rewardGoldGrams: rewardGoldGrams,
      schemePlanTypeName: schemePlanTypeName,
      maturityDate: params.maturityDate as string,
      metal: metalType,
      inversement: {
        ...inversement,
        schemeName: params.schemeName || inversement?.schemeName,
        schemePlanTypeName: schemePlanTypeName,
        current_silverrate: isSilver ? txnRate : inversement?.current_silverrate,
        current_goldrate: !isSilver ? txnRate : inversement?.current_goldrate,
      },
    };
  };

  const handleShareReceipt = async (
    transaction: Transaction,
    inversement: any
  ) => {
    try {
      const receiptData = await buildReceiptData(transaction, inversement);
      const logoBase64 = await loadLogoAsBase64();
      const htmlContent = generatePaymentReceiptHTML({ ...receiptData, logoBase64 });
      const customerName = sanitizeFileName(user?.name || "Customer");
      const accountNo = sanitizeFileName(user?.id?.toString() || "000000");
      const paymentId = sanitizeFileName(
        transaction.paymentId?.toString() || "000000"
      );
      const fileName = `Payment_${customerName}_${accountNo}_${paymentId}.pdf`;

      const targetUri = await getPdfFileUri(htmlContent, fileName);

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
    try {
      const receiptData = await buildReceiptData(transaction, inversement);
      const logoBase64 = await loadLogoAsBase64();
      const htmlContent = generatePaymentReceiptHTML({ ...receiptData, logoBase64 });
      const customerName = sanitizeFileName(user?.name || "Customer");
      const accountNo = sanitizeFileName(user?.id?.toString() || "000000");
      const paymentId = sanitizeFileName(
        transaction.paymentId?.toString() || "000000"
      );
      const fileName = `Payment_${customerName}_${accountNo}_${paymentId}.pdf`;

      const targetUri = await getPdfFileUri(htmlContent, fileName);

      await saveFileToPublicDirectory(targetUri, fileName, "Payment receipt saved to your chosen folder successfully!");
    } catch (e) {
      console.error("Receipt download failed", e);
      Alert.alert("Error", "Failed to download receipt");
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = initializeSocket();
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Hide bottom navigation tab bar when on savings detail screen
  useFocusEffect(
    useCallback(() => {
      useGlobalStore.getState().setTabVisibility(false);
      return () => {
        useGlobalStore.getState().setTabVisibility(true);
      };
    }, [])
  );

  const PaymentNow = async () => {
    if (!user) {
      setAlertMessage("User not found. Please log in again.");
      setAlertType("error");
      setAlertVisible(true);
      return;
    }

    if (!canMakePayment) {
      if (isDeposit && isDepositPaymentCompleted) {
        setAlertMessage("Single-time deposit has already been paid for this scheme.");
        setAlertType("info");
        setAlertVisible(true);
        return;
      }
      return;
    }

    setIsLoading(true);

    let payload = {
      userId: user.id,
      investmentId: params.id || params.investmentId || inversement?.id,
      isAdvance: (paymentHistrory?.length || 0) > 0,
    };

    try {
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
          String(parseSchemes.SCHEMETYPE || "").toLowerCase() === "hybrid" ||
          parseSchemes.schemeType === "Hybrid" ||
          String(parseSchemes.schemeType || "").toLowerCase() === "hybrid";

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
          joiningDate: params.joiningDate || inversement?.joiningDate || (inversement as any)?.created_at || (inversement as any)?.joiningdate,
          totalPaid: params.totalPaid,
          noOfIns: params.noOfIns,
          goldWeight: params.goldWeight,
          accNo: params.accNo,
          investmentId: responce?.data?.data?.investmentId || params.id || params.investmentId || inversement?.id,
          schemesData: params.schemesData,
          interestSlabs: JSON.stringify(
            schemesData?.interest_slabs ||
            parseSchemes?.interest_slabs ||
            inversement?.interest_slabs ||
            inversement?.schemes?.interest_slabs ||
            []
          ),
        },
      });
    } catch (error: any) {
      logger.error("Error in PaymentNow:", error);
      const errMsg = error?.response?.data?.message || "An error occurred while preparing payment. Please try again.";
      setAlertMessage(errMsg);
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

  // Pre-load transactions passed from navigation params
  useEffect(() => {
    if (params.transactions) {
      try {
        const parsed = JSON.parse(params.transactions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPaymentHistrory(parsed);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [params.transactions]);

  const fetchTransactions = async () => {
    const invId = params.id || params.investmentId;
    if (!invId || invId === "undefined" || invId === "0") {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await api.get(`investments/${invId}`, { skipLoading: true } as any);
      const data = response?.data?.data || response?.data;

      let historyList: any[] = [];
      if (Array.isArray(data?.paymentHistory)) {
        historyList = data.paymentHistory;
      } else if (Array.isArray(data?.transactions)) {
        historyList = data.transactions;
      } else if (Array.isArray(data?.payments)) {
        historyList = data.payments;
      } else if (Array.isArray(data?.payment_history)) {
        historyList = data.payment_history;
      } else if (Array.isArray(data?.paymentList)) {
        historyList = data.paymentList;
      } else if (Array.isArray(data?.investmentList?.paymentHistory)) {
        historyList = data.investmentList.paymentHistory;
      } else if (Array.isArray(data?.investmentList?.payments)) {
        historyList = data.investmentList.payments;
      } else if (Array.isArray(data?.investmentList?.transactions)) {
        historyList = data.investmentList.transactions;
      }

      // If transactions returned, set them
      if (historyList.length > 0) {
        setPaymentHistrory(historyList);
      } else if (user?.id) {
        // Fallback 1: Query user's payment history to find records matching this investment or chit
        try {
          const userHistoryRes = await api.get(`/payments/history/${user.id}`, { skipLoading: true } as any);
          const allUserTxns = userHistoryRes?.data?.data || userHistoryRes?.data?.history || userHistoryRes?.data;
          if (Array.isArray(allUserTxns)) {
            const matched = allUserTxns.filter((t: any) =>
              String(t.investmentId || t.investment_id) === String(invId) ||
              (params.chitId && String(t.chitId || t.chit_id) === String(params.chitId)) ||
              (params.accNo && String(t.accountNumber || t.accNo) === String(params.accNo))
            );
            if (matched.length > 0) {
              const mapped: Transaction[] = matched.map((t: any) => ({
                paymentId: t.paymentId || t.id,
                amountPaid: String(t.amount || t.amountPaid || 0),
                paymentDate: t.paymentDate || t.createdAt || new Date().toISOString(),
                paymentMode: t.paymentMethod || t.paymentMode || "Online",
                paymentModeType: t.payment_method_type || t.paymentModeType,
                transactionId: t.gatewayTransactionId || t.transactionId || t.orderId || String(t.id),
                orderId: t.orderId,
                utrReference: t.utr_reference || t.utrReference,
                monthNumber: t.installment || 1,
                status: t.paymentStatus || t.status || "SUCCESS",
                current_goldrate: String(t.gold_rate || params.goldRate || ""),
                gold_rate: String(t.gold_rate || params.goldRate || ""),
                gold_weight: t.gold_weight || params.goldWeight || 0,
                current_silverrate: String(t.silver_rate || t.current_silverrate || params.silverRate || ""),
                silver_rate: String(t.silver_rate || params.silverRate || ""),
                silver_weight: t.silver_weight || t.silverWeight || params.silverWeight || 0,
                rate: t.rate || (isSilver ? (t.silver_rate || t.current_silverrate) : (t.gold_rate || t.current_goldrate)),
                weight: t.weight || (isSilver ? (t.silver_weight || t.silverWeight) : (t.gold_weight || t.goldWeight)),
              }));
              setPaymentHistrory(mapped);
              historyList = mapped;
            }
          }
        } catch (e) {
          logger.warn("Fallback payment history fetch error:", e);
        }
      }

      // Fallback 2: For One-Time Deposit scheme (or any scheme where payment has been made),
      // if history is still empty, synthesize the deposit transaction so user sees their payment record & can download receipt!
      const currentInv = data?.investmentList || inversement;
      const paidAmount = Number(currentInv?.total_paid || currentInv?.amount || params.totalPaid || params.emiAmount || 0);
      const isOneTime = checkIsDepositScheme({
        schemeName: params.schemeName || currentInv?.schemeName,
        schemePlanTypeName: schemesData?.schemePlanTypeName || params.schemePlanTypeName || currentInv?.schemePlanTypeName,
        scheme_plan_type_id: params.scheme_plan_type_id || schemesData?.scheme_plan_type_id,
        schemeType: currentInv?.schemeType || schemesData?.schemeType || params.schemeType,
        paymentFrequency: params.paymentFrequency || currentInv?.chits?.paymentFrequency,
        paymentFrequencyName: schemesData?.paymentFrequencyName || currentInv?.chits?.paymentFrequencyName,
      });

      if (historyList.length === 0 && (isOneTime || paidAmount > 0)) {
        const syntheticTxn: Transaction = {
          paymentId: Number(currentInv?.paymentId || invId) || 1,
          amountPaid: String(paidAmount),
          paymentDate: currentInv?.joiningDate || currentInv?.created_at || currentInv?.createdAt || params.joiningDate || new Date().toISOString(),
          paymentMode: currentInv?.paymentMode || currentInv?.payment_mode || "Online",
          paymentModeType: isOneTime ? "One-Time Deposit" : "Initial Installment",
          transactionId: currentInv?.transactionId || currentInv?.transaction_id || currentInv?.orderId || currentInv?.utrReference || `TXN-DEP-${invId}`,
          orderId: currentInv?.orderId,
          utrReference: currentInv?.utrReference || currentInv?.utr_reference,
          monthNumber: 1,
          status: currentInv?.status || "SUCCESS",
          current_goldrate: String(currentInv?.gold_rate || currentInv?.current_goldrate || params.goldRate || ""),
          gold_rate: String(currentInv?.gold_rate || params.goldRate || ""),
          gold_weight: currentInv?.totalgoldweight || currentInv?.gold_weight || params.goldWeight || 0,
          current_silverrate: String(currentInv?.current_silverrate || currentInv?.silver_rate || params.silverRate || ""),
          silver_rate: String(currentInv?.current_silverrate || currentInv?.silver_rate || params.silverRate || ""),
          silver_weight: currentInv?.totalsilverweight || currentInv?.silver_weight || params.silverWeight || 0,
          rate: isSilver ? (currentInv?.current_silverrate || currentInv?.silver_rate || params.silverRate) : (currentInv?.current_goldrate || currentInv?.gold_rate || params.goldRate),
          weight: isSilver ? (currentInv?.totalsilverweight || currentInv?.silver_weight) : (currentInv?.totalgoldweight || currentInv?.gold_weight),
        };
        setPaymentHistrory([syntheticTxn]);
      }

      if (response?.data?.data?.paymentStatus) {
        setAdvancePayments(response.data.data.paymentStatus);
      }
      if (response?.data?.data?.investmentList) {
        setInversement(response.data.data.investmentList);
      }
      if (response?.data?.data?.giftDetails || response?.data?.data?.gift) {
        setGiftDetails(response.data.data.giftDetails || response.data.data.gift);
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
  }, [params.id, params.investmentId]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [params.id, params.investmentId]);

  const getProgressPercentage = () => {
    const rawPaid = params.monthsPaid ?? inversement?.lastInstallment ?? inversement?.monthsPaid ?? 0;
    const paid = Number(rawPaid) || 0;
    const rawTotal = params.noOfIns ?? inversement?.chits?.noOfInstallments ?? inversement?.noOfInstallments ?? 1;
    const total = Number(rawTotal) || 1;
    return Math.min(Math.max((paid / total) * 100, 0), 100);
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

    let payload = {
      userId: user.id,
      investmentId: params.id || params.investmentId || inversement?.id,
      isAdvance: true,
      amount: totalSelectedAmount,
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
          String(parseSchemes.SCHEMETYPE || "").toLowerCase() === "hybrid" ||
          parseSchemes.schemeType === "Hybrid" ||
          String(parseSchemes.schemeType || "").toLowerCase() === "hybrid";

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
          joiningDate: params.joiningDate || inversement?.joiningDate || (inversement as any)?.created_at || (inversement as any)?.joiningdate,
          totalPaid: params.totalPaid,
          noOfIns: params.noOfIns,
          goldWeight: params.goldWeight,
          accNo: params.accNo,
          investmentId: responce?.data?.data?.investmentId || params.id || params.investmentId || inversement?.id,
          schemesData: params.schemesData,
          interestSlabs: JSON.stringify(
            schemesData?.interest_slabs ||
            parseSchemes?.interest_slabs ||
            inversement?.interest_slabs ||
            inversement?.schemes?.interest_slabs ||
            []
          ),
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

  const renderHeroCard = () => {
    const rawTotalMonths = params.noOfIns ?? inversement?.chits?.noOfInstallments ?? inversement?.noOfInstallments ?? 12;
    const totalMonths = Number(rawTotalMonths) || 12;
    const rawMonthsPaid = params.monthsPaid ?? inversement?.lastInstallment ?? inversement?.monthsPaid ?? 0;
    const monthsPaid = Number(rawMonthsPaid) || 0;
    const progressPercent = getProgressPercentage();
    
    // SVG radial configuration
    const size = 95;
    const radius = 38;
    const strokeWidth = 5;
    const cx = size / 2;
    const cy = size / 2 + 10;
    
    // We will draw a semi-circle dial from -180 deg (left) to 0 deg (right)
    // Semi-circle path: start at (cx - radius, cy), end at (cx + radius, cy)
    const startX = cx - radius;
    const endX = cx + radius;
    const dialPath = `M ${startX} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${cy}`;
    const circumference = Math.PI * radius; // Approx 119.38
    const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

    // Generate tick pointers (12 markers or based on totalMonths)
    const ticks = [];
    const maxTicks = Math.min(totalMonths, 12);
    for (let i = 0; i < maxTicks; i++) {
      const angle = 180 - (i * 180) / (maxTicks - 1); // 180 to 0 degrees
      const rad = (angle * Math.PI) / 180;
      const tx = cx + (radius + 6) * Math.cos(rad);
      const ty = cy - (radius + 6) * Math.sin(rad);
      const isReached = i < monthsPaid;
      ticks.push(
        <Circle
          key={i}
          cx={tx}
          cy={ty}
          r={2}
          fill={isReached ? theme.colors.secondary : "rgba(255, 255, 255, 0.3)"}
        />
      );
    }

    const schemeNameDisplay = (params.schemeName || inversement?.schemeName || inversement?.chits?.name || "").toUpperCase();
    const schemeCodeDisplay = params.schemeCode || inversement?.schemeCode || inversement?.chits?.code || "";
    const goldWeightDisplay = params.goldWeight ?? inversement?.total_gold ?? inversement?.goldWeight ?? "0";

    return (
      <View style={styles.heroContainer}>
        <LinearGradient
          colors={theme.colors.gradientPrimary || ["#0b162c", "#16315c", "#d4af37"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={[styles.heroBackground, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
            {/* Left Column: Stats */}
            <View style={{ flex: 1.2, paddingRight: 10 }}>
              <Text style={styles.heroSchemeName} numberOfLines={1}>{schemeNameDisplay}</Text>
              <Text style={[styles.heroSchemeCode, { fontSize: 12, marginBottom: 8 }]}>{schemeCodeDisplay}</Text>
              
              <View style={{ marginBottom: 6 }}>
                <Text style={[styles.heroStatLabel, { fontSize: 10, marginBottom: 2 }]}>{translations.totalInvested}</Text>
                <Text style={styles.heroStatValue}>₹{Number(totalPaidAmount || 0).toLocaleString()}</Text>
              </View>
              
              {isWeightScheme && (
                <View>
                  <Text style={[styles.heroStatLabel, { fontSize: 10, marginBottom: 2 }]}>{accumulatedLabel}</Text>
                  <Text style={[styles.heroStatValue, { fontSize: 16 }]}>
                    {formatGoldWeight(parseFloat(goldWeightDisplay) || 0)}
                  </Text>
                </View>
              )}

              {hasBonusRewards && (totalRewardsAmount > 0 || totalRewardsGold > 0) && (
                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: 6, marginTop: 6, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.45)' }}>
                  <Text style={{ color: '#FFD700', fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {translations.bonusRewards}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>
                      ₹{totalRewardsAmount.toLocaleString()}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>|</Text>
                    <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: 'bold' }}>
                      +{totalRewardsGold.toFixed(3)} g
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Right Column: Speedometer Progress Gauge or Deposit Status */}
            {isDeposit ? (
              <View style={{ flex: 0.8, alignItems: "center", justifyContent: "center" }}>
                <View style={{
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(255, 215, 0, 0.4)",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Ionicons name="shield-checkmark" size={24} color="#FFD700" />
                  <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "bold", marginTop: 4, textAlign: "center" }}>
                    {translations.oneTimeDeposit || "One-Time"}
                  </Text>
                  {daysToMaturity !== null && (
                    <Text style={{ color: "#FFD700", fontSize: 10, fontWeight: "700", marginTop: 2, textAlign: "center" }}>
                      {daysToMaturity} {translations.daysRemainingSuffix || "Days Left"}
                    </Text>
                  )}
                </View>
              </View>
            ) : schemesData?.paymentFrequencyName !== "Flexi" && schemesData?.paymentFrequencyName !== "Hybrid" && String(schemesData?.paymentFrequencyName || "").toLowerCase() !== "hybrid" ? (
              <View style={{ flex: 0.8, alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: size, height: size - 10, position: "relative", alignItems: "center", justifyContent: "center" }}>
                  <Svg width={size} height={size}>
                    {/* Background Dial Track */}
                    <Path
                      d={dialPath}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                    />
                    {/* Active Dial Fill */}
                    <Path
                      d={dialPath}
                      fill="none"
                      stroke={theme.colors.secondary}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                    {/* Pointer Ticks */}
                    {ticks}
                  </Svg>
                  
                  {/* Central Text overlay */}
                  <View style={{ position: "absolute", bottom: 12, alignItems: "center" }}>
                    <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "800" }}>
                      {monthsPaid}/{totalMonths}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {translations.months || "Months"}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderGiftBanner = () => {
    return <JoiningGiftBanner gift={giftDetails || inversement?.giftDetails || inversement?.gift} />;
  };

  const renderInfoGrid = () => {
    const isFlexiOrHybrid = String(schemesData?.paymentFrequencyName || params.paymentFrequency || inversement?.chits?.paymentFrequency || "").toLowerCase().includes("flexi") ||
      String(schemesData?.paymentFrequencyName || params.paymentFrequency || inversement?.chits?.paymentFrequency || "").toLowerCase().includes("hybrid") ||
      String(params.schemeName || inversement?.schemeName || "").toLowerCase().includes("flexi") ||
      String(params.schemeName || inversement?.schemeName || "").toLowerCase().includes("hybrid");

    const schemeTypeDisplay = isDeposit
      ? (translations.oneTimeDeposit || "One-Time Deposit")
      : (isFlexiOrHybrid
          ? (((String(schemesData?.paymentFrequencyName || params.paymentFrequency || inversement?.chits?.paymentFrequency || "").toLowerCase().includes("hybrid") || String(params.schemeName || inversement?.schemeName || "").toLowerCase().includes("hybrid")) ? "Hybrid" : "Flexi"))
          : (schemesData?.paymentFrequencyName || params.paymentFrequency || inversement?.chits?.paymentFrequency || "Fixed"));

    const getStartDate = () => {
      const rawDate = inversement?.start_date || inversement?.joiningDate || params.joiningDate;
      if (rawDate && rawDate !== "N/A" && rawDate !== "") {
        return formatDate(rawDate);
      }
      return null;
    };

    const rawEmi = params.emiAmount ?? inversement?.chits?.monthlyInstallment ?? inversement?.installmentAmount ?? 0;
    const emiAmount = Number(rawEmi) || 0;
    const dueDateValue = params.dueDate || inversement?.next_due_date || inversement?.nextDueDate;
    const maturityDateValue = params.maturityDate || inversement?.maturity_date || inversement?.maturityDate || "N/A";
    const accNoValue = params.accNo || params.accountNo || inversement?.account_no || inversement?.accountNo || "N/A";

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

          {/* Monthly EMI / Deposit Amount */}
          {!isFlexiOrHybrid && (
            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="cash" size={20} color="#388E3C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gridLabel}>{isDeposit ? (translations.depositAmount || "Deposit Amount") : translations.monthlyEMI}</Text>
                <Text style={styles.gridValue} numberOfLines={1}>₹{emiAmount.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Next Due Date - Hide for One-Time deposit schemes */}
          {!isDeposit && dueDateValue && dueDateValue !== "N/A" && dueDateValue !== "" ? (
            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: '#E0F7FA' }]}>
                <Ionicons name="time" size={20} color="#00838F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gridLabel}>{translations.nextDueDate || "Next Due Date"}</Text>
                <Text style={styles.gridValue} numberOfLines={1}>
                  {formatDate(dueDateValue)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Start Date */}
          {getStartDate() ? (
            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gridLabel}>{translations.startDate || "Start Date"}</Text>
                <Text style={styles.gridValue} numberOfLines={1}>{getStartDate()}</Text>
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
              <Text style={styles.gridValue} numberOfLines={1}>{maturityDateValue}</Text>
            </View>
          </View>

          {/* Account Number */}
          <View style={[styles.gridItem, { width: "100%" }]}>
            <View style={[styles.gridIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="bookmark" size={20} color="#7B1FA2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gridLabel}>{translations.accountNo}</Text>
              <Text style={styles.gridValue} numberOfLines={1}>{accNoValue}</Text>
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
          <Text style={styles.sectionTitle}>{translations.transactionHistory} ({paymentHistrory.length})</Text>
          {filteredHistory.length > 20 && (
            <TouchableOpacity onPress={() => setShowAllTransactions(!showAllTransactions)}>
              <Text style={styles.viewAllText}>
                {showAllTransactions ? (translations.showLess || "Show Less") : translations.viewAll}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={translations.searchTxnPlaceholder || "Search by ID, amount, or mode..."}
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
                        {formatDate(txn.paymentDate)}
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
                  {(() => {
                    const rAmt = Number((txn as any).rewardAmount || txn.rewardsList?.amount || 0);
                    const rGold = Number((txn as any).rewardGoldGrams || txn.rewardsList?.gold_grams || 0);
                    if (rAmt > 0 || rGold > 0) {
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FBF5E8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 6, borderWidth: 0.5, borderColor: '#F2D492' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="gift-outline" size={13} color="#B8860B" />
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#B8860B' }}>{translations.bonusRewards}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {rAmt > 0 && <Text style={{ fontSize: 11, fontWeight: '700', color: '#2E7D32' }}>+₹{rAmt.toLocaleString()}</Text>}
                            {rGold > 0 && <Text style={{ fontSize: 11, fontWeight: '700', color: '#B8860B' }}>({rGold.toFixed(3)} g)</Text>}
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })()}
                  <View style={styles.transactionDivider} />
                  <View style={styles.transactionFooter}>
                    <Text style={styles.transactionId}>ID: {txn.transactionId}</Text>
                    <TouchableOpacity onPress={() => setSelectedTransaction(txn)} style={styles.receiptButton}>
                      <Ionicons name="download-outline" size={16} color={theme.colors.textDark} />
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
      {/* Header Container that includes the top safe area with quaternary color */}
      <View style={{ backgroundColor: theme.colors.quaternary || '#F2E6D2', zIndex: 10 }}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 0 : 8 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.textDark || "#850111"} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{translations.schemeDetails}</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>

        {loading ? (
          <SkeletonSavingsDetailPage />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {renderHeroCard()}
            {isVisible('showGifts') && renderGiftBanner()}
            {renderInfoGrid()}
            {renderTransactionHistory()}
            <View style={{ height: bottomPadding + 60 }} />
          </ScrollView>
        )}

        {/* Floating Bottom Bar for Payment / Status */}
        <View style={[styles.bottomBar, { paddingBottom: bottom || 20 }]}>
          {isSchemeMatured ? (
            <View style={styles.maturedBottomContainer}>
              <View style={styles.maturedHeaderRow}>
                <View style={styles.maturedBadge}>
                  <Ionicons name="ribbon" size={16} color="#B8860B" />
                  <Text style={styles.maturedBadgeText}>
                    {translations.schemeMatured || "Scheme Matured"}
                  </Text>
                </View>
                {giftDetails && giftDetails.status !== 'DELIVERED' && (
                  <TouchableOpacity
                    style={styles.collectGiftBtn}
                    onPress={() => router.push('/(app)/gifts' as any)}
                  >
                    <Text style={{ fontSize: 13 }}>🎁</Text>
                    <Text style={styles.collectGiftBtnText}>
                      {translations.collectGiftAtStore || "Gift Ready"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.maturedSubText} numberOfLines={2}>
                {translations.maturedCongratulations || "Congratulations! Your scheme has successfully matured. Visit our nearest branch showroom to purchase your favourite jewellery."}
              </Text>
              <TouchableOpacity
                style={styles.redeemStoreBtn}
                activeOpacity={0.85}
                onPress={() => {
                  Linking.openURL("tel:+918754842999").catch(() => {});
                }}
              >
                <Ionicons name="storefront" size={18} color="#FFF" />
                <Text style={styles.redeemStoreBtnText}>
                  {translations.redeemAtStore || "Redeem Jewellery at Showroom"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (isDeposit && isDepositPaymentCompleted) ? (
            <View style={styles.depositCompletedBottomContainer}>
              <View style={styles.depositHeaderRow}>
                <View style={styles.depositCompletedBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="#1B5E20" />
                  <Text style={styles.depositCompletedBadgeText}>
                    {translations.oneTimeDepositCompleted || "One-Time Deposit Completed"}
                  </Text>
                </View>
                {daysToMaturity !== null && (
                  <View style={styles.daysRemainingBadge}>
                    <Ionicons name="hourglass-outline" size={13} color="#B45309" />
                    <Text style={styles.daysRemainingBadgeText}>
                      {daysToMaturity} {translations.daysRemainingSuffix || "Days to Maturity"}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.depositCompletedSubText} numberOfLines={2}>
                {translations.depositActiveDesc
                  ? translations.depositActiveDesc.replace("{{date}}", maturityDateValue)
                  : `Your single-time deposit has been paid successfully. Your investment is active and will mature on ${maturityDateValue}.`}
              </Text>
              <View style={styles.depositInfoPillRow}>
                <View style={styles.depositInfoPill}>
                  <Ionicons name="wallet-outline" size={13} color="#4B5563" />
                  <Text style={styles.depositInfoPillText}>
                    {translations.depositAmount || "Deposit"}: ₹{Number(totalPaidAmount || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.depositInfoPill}>
                  <Ionicons name="calendar-outline" size={13} color="#4B5563" />
                  <Text style={styles.depositInfoPillText}>
                    {translations.maturityDate || "Matures"}: {maturityDateValue}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
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
          )}
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
                  <Text style={styles.modalTitle}>{translations.transactionDetails || "Transaction Details"}</Text>
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
                    {formatDateTime(selectedTransaction.paymentDate)}
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
                {isWeightScheme && (displayGoldRate > 0 || displayGoldWeight > 0) && (
                  <>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>{weightLabel}</Text>
                      <Text style={styles.receiptValue}>
                        {displayGoldWeight.toFixed(3)} g
                      </Text>
                    </View>
                    {displayGoldRate > 0 && (
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>{rateLabel}</Text>
                        <Text style={styles.receiptValue}>₹{displayGoldRate.toLocaleString()}/g</Text>
                      </View>
                    )}
                  </>
                )}
                {(() => {
                  const rAmt = Number((selectedTransaction as any).rewardAmount || selectedTransaction.rewardsList?.amount || 0);
                  const rGold = Number((selectedTransaction as any).rewardGoldGrams || selectedTransaction.rewardsList?.gold_grams || 0);
                  if (rAmt > 0 || rGold > 0) {
                    return (
                      <>
                        <View style={styles.receiptRow}>
                          <Text style={styles.receiptLabel}>Bonus Reward Amount</Text>
                          <Text style={[styles.receiptValue, { color: '#2E7D32', fontWeight: 'bold' }]}>+₹{rAmt.toLocaleString()}</Text>
                        </View>
                        <View style={styles.receiptRow}>
                          <Text style={styles.receiptLabel}>Bonus Reward Gold</Text>
                          <Text style={[styles.receiptValue, { color: '#B8860B', fontWeight: 'bold' }]}>+{rGold.toFixed(3)} g</Text>
                        </View>
                      </>
                    );
                  }
                  return null;
                })()}
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.downloadBtn]}
                  onPress={() => handleDownloadReceipt(selectedTransaction, inversement)}
                >
                  <Ionicons name="download-outline" size={18} color={theme.colors.textDark} style={{ marginRight: 6 }} />
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

function getStyles(theme: any) { return StyleSheet.create({
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
    paddingBottom: 12,
    backgroundColor: theme.colors.quaternary || '#F2E6D2',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDark,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  heroSchemeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
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
    marginBottom: 8,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  progressContainer: {
    marginTop: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
    backgroundColor: theme.colors.secondary,
    borderRadius: 3,
  },

  // Section Styles
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textDark || '#1A1A1A',
    marginBottom: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  viewAllText: {
    color: theme.colors.textDark,
    fontWeight: '600',
    fontSize: 14,
  },

  // Grid Styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
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
    backgroundColor: theme.colors.white,
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
    backgroundColor: theme.colors.backgroundSecondary,
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
    backgroundColor: theme.colors.white,
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
    backgroundColor: theme.colors.backgroundSecondary,
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
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
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
  maturedBottomContainer: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#F3E5AB',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  maturedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  maturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  maturedBadgeText: {
    color: '#92400E',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  collectGiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  collectGiftBtnText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
  },
  maturedSubText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
  },
  redeemStoreBtn: {
    backgroundColor: theme.colors.primary || '#A3203A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  redeemStoreBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  depositCompletedBottomContainer: {
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#D1E7DD',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  depositHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  depositCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#A5D6A7',
  },
  depositCompletedBadgeText: {
    color: '#1B5E20',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  daysRemainingBadgeText: {
    color: '#B45309',
    fontWeight: '700',
    fontSize: 11,
  },
  depositCompletedSubText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  depositInfoPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  depositInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  depositInfoPillText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
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
    color: theme.colors.textDark,
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
    backgroundColor: theme.colors.white,
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
}) }

var styles = getStyles(theme);;

export default SavingsDetail;

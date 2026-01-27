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
import COLORS from "@/constants/colors";
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

  // PDF Generation function (kept largely the same)
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
      logoBase64: await (async () => {
        try {
          const { Asset } = require("expo-asset");
          // Require the logo - ensure the path is correct
          // Path: ../../../../../assets/images/logo_trans.png (from src/app/(app)/(tabs)/savings/SavingsDetail.tsx)
          const asset = Asset.fromModule(require("../../../../../assets/images/logo_trans.png"));
          await asset.downloadAsync();
          if (asset.localUri) {
            console.log("✅ Logo loaded successfully for receipt");
            return await FileSystem.readAsStringAsync(asset.localUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
        } catch (error) {
          console.log("Error loading logo for receipt:", error);
          return undefined;
        }
      })(),
    };

    try {
      const htmlContent = generatePaymentReceiptHTML(receiptData);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const customerName = sanitizeFileName(user?.name || "Customer");
      const accountNo = sanitizeFileName(user?.id?.toString() || "000000");
      const paymentId = sanitizeFileName(
        transaction.paymentId?.toString() || "000000"
      );
      const fileName = `${customerName}_${accountNo}_${paymentId}.pdf`;

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
          Alert.alert("Saved", `Receipt saved at: ${targetUri}`);
        }
      }
    } catch (e) {
      console.error("Receipt generation failed", e);
      Alert.alert("Error", "Failed to generate receipt");
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

  const PaymentNow = async () => {
    if (!user) {
      setAlertMessage("User not found. Please log in again.");
      setAlertType("error");
      setAlertVisible(true);
      return;
    }

    setIsLoading(true);

    let payload = {
      userId: user.id,
      investmentId: params.id,
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

      router.push({
        pathname: "/(tabs)/home/paymentNewOverView",
        params: {
          amount: params.emiAmount,
          schemeName: params.schemeName,
          schemeId: responce?.data.data?.schemeId || schemesData?.schemeId || schemesData?.id || params.schemeId || params.schemeCode,
          chitId: responce?.data.data?.chitId || params.chitId,
          paymentFrequency: parseSchemes.paymentFrequencyName || params.paymentFrequency,
          schemeType: parseSchemes.schemeTypeName,
          source: params.source || "savings_detail",
          savinsTypes: parseSchemes.schemeType,
          userDetails: JSON.stringify({
            amount: params.emiAmount,
            accountname: params.accountHolder,
            accNo: params.accNo,
            associated_branch: 1,
            investmentId: responce?.data.data?.investmentId || params.id || params.investmentId,
            schemeId: responce?.data.data?.schemeId || schemesData?.schemeId || schemesData?.id || params.schemeId || params.schemeCode,
            schemeType: parseSchemes.schemeTypeName,
            schemeName: params?.schemeName,
            paymentFrequency: parseSchemes.paymentFrequencyName || params.paymentFrequency,
            chitId: responce?.data.data?.chitId || params.chitId,
            userId: user.id
          }),
          paidPaymentCount: String(paymentHistrory?.length + 1 || 0),
          maturityDate: params.maturityDate,
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
      } catch (parseError) {
        logger.error("Error parsing schemes data:", parseError);
        // Fallback to a default structure
        parseSchemes = {
          schemeTypeName: "Fixed",
          paymentFrequencyName: params.paymentFrequency || "Monthly",
        };
      }

      router.push({
        pathname: "/(tabs)/home/paymentNewOverView",
        params: {
          amount: totalSelectedAmount,
          schemeName: params.schemeName,
          schemeId: responce?.data.data?.schemeId || schemesData?.schemeId || schemesData?.id || params.schemeId || params.schemeCode,
          chitId: responce?.data.data?.chitId || params.chitId,
          paymentFrequency:
            parseSchemes.paymentFrequencyName || params.paymentFrequency,
          schemeType: parseSchemes.schemeTypeName,
          source: params.source || "savings_detail_bulk",
          savinsTypes: parseSchemes.schemeType,
          userDetails: JSON.stringify({
            amount: totalSelectedAmount,
            accountname: params.accountHolder,
            accNo: params.accNo,
            associated_branch: 1,
            investmentId: responce?.data.data?.investmentId || params.id || params.investmentId,
            schemeId: responce?.data.data?.schemeId || schemesData?.schemeId || schemesData?.id || params.schemeId || params.schemeCode,
            schemeType: parseSchemes.schemeTypeName,
            schemeName: params?.schemeName,
            paymentFrequency:
              parseSchemes.paymentFrequencyName || params.paymentFrequency,
            chitId: responce?.data.data?.chitId || params.chitId,
            selectedMonths: selectedPayments.map((p) => p.monthNumber).join(","),
            userId: user.id
          }),
          paidPaymentCount: String(
            (paymentHistrory?.length || 0) + selectedPayments.length
          ),
          maturityDate: params.maturityDate,
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

          {schemesData?.paymentFrequencyName !== "Flexi" && (
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

  const renderInfoGrid = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{translations.schemeDetails}</Text>
      <View style={styles.gridContainer}>

        <View style={styles.gridItem}>
          <View style={[styles.gridIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="person" size={20} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.gridLabel}>{translations.accountHolder}</Text>
            <Text style={styles.gridValue} numberOfLines={1}>{params.accountHolder}</Text>
          </View>
        </View>

        <View style={styles.gridItem}>
          <View style={[styles.gridIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="card" size={20} color="#F57C00" />
          </View>
          <View>
            <Text style={styles.gridLabel}>{translations.schemeType}</Text>
            <Text style={styles.gridValue}>{schemesData?.paymentFrequencyName || params.paymentFrequency}</Text>
          </View>
        </View>

        <View style={styles.gridItem}>
          <View style={[styles.gridIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="cash" size={20} color="#388E3C" />
          </View>
          <View>
            <Text style={styles.gridLabel}>{translations.monthlyEMI}</Text>
            <Text style={styles.gridValue}>₹{Number(params.emiAmount).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.gridItem}>
          <View style={[styles.gridIcon, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="calendar" size={20} color="#D32F2F" />
          </View>
          <View>
            <Text style={styles.gridLabel}>{translations.maturityDate}</Text>
            <Text style={styles.gridValue}>{params.maturityDate}</Text>
          </View>
        </View>

        <View style={styles.gridItem}>
          <View style={[styles.gridIcon, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="bookmark" size={20} color="#7B1FA2" />
          </View>
          <View>
            <Text style={styles.gridLabel}>{translations.accountNo}</Text>
            <Text style={styles.gridValue}>DCJ-{params.accNo}</Text>
          </View>
        </View>

        {onlyTotalRewards > 0 && (
          <View style={styles.gridItem}>
            <View style={[styles.gridIcon, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
            </View>
            <View>
              <Text style={styles.gridLabel}>{translations.rewards}</Text>
              <Text style={styles.gridValue}>₹{Number(onlyTotalRewards).toLocaleString()}</Text>
            </View>
          </View>
        )}

      </View>
    </View>
  );

  const renderTransactionHistory = () => (
    <View style={[styles.sectionContainer, { marginBottom: 100 }]}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{translations.recentActivity}</Text>
      </View>

      {paymentHistrory.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIconContainer}>
            <Ionicons name="time-outline" size={32} color="#CCC" />
          </View>
          <Text style={styles.emptyStateText}>{translations.noTransactionsFound}</Text>
        </View>
      ) : (
        paymentHistrory.slice(0, 5).map((txn, index) => (
          <View key={txn.transactionId || index} style={styles.transactionCard}>
            <LinearGradient
              colors={['#ffffff', '#fcfcfc']}
              style={styles.transactionGradient}
            >
              <View style={styles.transactionRow}>
                {/* Icon */}
                <View style={styles.txnIconContainer}>
                  <LinearGradient
                    colors={txn.status === "ACTIVE" ? theme.colors.gradientPrimary : ['#ccc', '#999']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.txnIconGradient}
                  >
                    <Ionicons
                      name={txn.status === "ACTIVE" ? "checkmark-sharp" : "time-outline"}
                      size={18}
                      color="#FFF"
                    />
                  </LinearGradient>
                </View>

                {/* Info */}
                <View style={styles.txnInfo}>
                  <Text style={styles.txnTitle}>
                    {txn.status === "ACTIVE" ? "Payment Successful" : "Payment Pending"}
                  </Text>
                  <Text style={styles.txnDate}>
                    {new Date(txn.paymentDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>

                {/* Amount */}
                <View style={styles.txnAmountContainer}>
                  <Text style={styles.txnAmount}>₹{Number(txn.amountPaid).toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.txnFooter}>
                <View style={styles.idContainer}>
                  <Text style={styles.txnIdLabel}>TXN ID:</Text>
                  <Text style={styles.txnId}>{txn.transactionId}</Text>
                </View>
                <TouchableOpacity
                  style={styles.receiptButtonUnique}
                  onPress={() => setSelectedTransaction(txn)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.receiptText}>{translations.downloadReceipt || "Receipt"}</Text>
                  <Ionicons name="download-outline" size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? top + 10 : top - 60 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
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
                <Text style={styles.modalTitle}>Transaction Details</Text>
                <TouchableOpacity onPress={() => setSelectedTransaction(null)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Transaction ID</Text>
                  <Text style={styles.receiptValue}>{selectedTransaction.transactionId}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Date</Text>
                  <Text style={styles.receiptValue}>{new Date(selectedTransaction.paymentDate).toLocaleDateString()}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Amount</Text>
                  <Text style={styles.receiptValueHighlight}>₹{Number(selectedTransaction.amountPaid).toLocaleString()}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Status</Text>
                  <Text style={[styles.receiptValue, { color: 'green' }]}>{selectedTransaction.status}</Text>
                </View>

                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => createAndShareReceiptPDF(selectedTransaction, inversement)}
                >
                  <Ionicons name="document-text-outline" size={20} color="#FFF" />
                  <Text style={styles.downloadButtonText}>{translations.downloadReceipt || "Download Receipt"}</Text>
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
    backgroundColor: theme.colors.primary,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffffff',
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

  // Transactions
  // Transaction Unique Styles
  transactionCard: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#FFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  transactionGradient: {
    padding: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  txnIconContainer: {
    marginRight: 14,
  },
  txnIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  txnInfo: {
    flex: 1,
  },
  txnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  txnDate: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  txnAmountContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(232, 245, 233, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E7D32', // Darker green for finance
  },
  txnFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txnIdLabel: {
    fontSize: 11,
    color: '#AAA',
    fontWeight: '600',
  },
  txnId: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  receiptButtonUnique: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(216, 26, 52, 0.08)', // Light primary tint
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  receiptText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: 6,
  },
  emptyStateIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    color: theme.colors.primary,
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

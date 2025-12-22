import { useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { BackHandler, InteractionManager } from "react-native";
import Slider from "@react-native-community/slider";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { theme } from "@/constants/theme";
import api from "@/services/api";
import paymentService from "../../../../services/payment.service";
import { PaymentInitPayload } from "@/types/payment.types";

import { logger } from '@/utils/logger';
export default function PaymentNewOverView() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { language, user } = useGlobalStore();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState("test");
  const [currentAmount, setCurrentAmount] = useState(
    Number(params.amount) || 0
  );

  const [goldRate, setGoldRate] = useState(0);
  const [weightPerGram, setWeightPerGram] = useState(0);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isMounted, setIsMounted] = useState(true); // Track component mount state
  const isNavigatingRef = useRef(false); // Prevent multiple simultaneous navigations
  const isMountedRef = useRef(true); // More reliable mount tracking for async operations
  // Check for Flexi type using both paymentFrequency and schemeType parameters
  const isFlexi =
    params.paymentFrequency?.toString().toLowerCase() === "flexi" ||
    params.schemeType?.toString().toLowerCase() === "flexi";
  // Dynamic amount limits from API (defaults to 100000 if not fetched)
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(100000); // Default fallback
  // Scheme calculation slider state

  const [isUserDetailsExpanded, setIsUserDetailsExpanded] = useState(false);
  const userDetailsHeight = useRef(new Animated.Value(0)).current;
  const [isSchemeDetailsExpanded, setIsSchemeDetailsExpanded] = useState(false);
  const schemeDetailsHeight = useRef(new Animated.Value(0)).current;

  // Check if it's first payment based on paid payment count from params
  const isFirstPayment = useMemo(() => {
    // Get paid payment count from params (passed from SavingsDetail)
    // This represents the number of paid transactions in payment history
    const paidPaymentCount = params.paidPaymentCount
      ? Number(params.paidPaymentCount)
      : null;

    // If paidPaymentCount is available, use it to determine first payment
    if (paidPaymentCount !== null && !isNaN(paidPaymentCount)) {
      // If count is 0, no payments have been made yet (first payment)
      // If count >= 1, at least one payment has been made (not first payment)
      return paidPaymentCount === 0;
    }

    // Fallback: check monthsPaid if paidPaymentCount is not available
    const monthsPaid = userDetails?.monthsPaid || params.monthsPaid || 0;
    return Number(monthsPaid) === 0;
  }, [params.paidPaymentCount, userDetails?.monthsPaid, params.monthsPaid]);

  // Define handleBackButtonPress before useFocusEffect to avoid closure issues
  const handleBackButtonPress = useCallback(() => {
    setShowExitModal(true);
  }, []);


  // Reset isProcessing and navigation flag when screen is focused (e.g., when navigating back from payment failure)
  useFocusEffect(
    useCallback(() => {
      setIsProcessing(false);
      isNavigatingRef.current = false; // Reset navigation flag
    }, [])
  );

  // Cleanup on component unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      setIsMounted(false);
      isNavigatingRef.current = false;
    };
  }, []);

  // Handle hardware back button press
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBackButtonPress();
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [handleBackButtonPress])
  );

  // Parse user details only once when component mounts
  useEffect(() => {
    if (params.userDetails && !userDetails) {
      try {
        if (typeof params.userDetails !== 'string') {
          throw new Error("userDetails is not a string");
        }

        // Check if userDetails string is too large or empty
        if (!params.userDetails || params.userDetails.length === 0) {
          throw new Error("userDetails is empty");
        }

        if (params.userDetails.length > 2000) {
          logger.warn("userDetails string is very large", {
            size: params.userDetails.length,
          });
        }

        let details: any;
        try {
          details = JSON.parse(params.userDetails as string);
        } catch (parseError) {
          const userDetailsStr = Array.isArray(params.userDetails)
            ? params.userDetails[0]
            : params.userDetails;
          logger.error("JSON parse error", {
            error: parseError,
            userDetailsPreview: typeof userDetailsStr === 'string' ? userDetailsStr.substring(0, 200) : "not a string",
          });
          throw new Error(`Failed to parse userDetails JSON: ${(parseError as Error).message}`);
        }

        // Validate required fields
        if (!details || typeof details !== 'object') {
          throw new Error("Invalid user details structure - not an object");
        }

        // Fill in missing userId from user object if available
        if (!details.userId && user?.id) {
          details.userId = user.id;
          logger.log("userId missing in userDetails, using user.id as fallback");
        }

        // Check for critical missing fields with better error messages
        // userId should be set by now (either from userDetails or user.id fallback)
        const hasUserId = !!details.userId;
        const hasInvestmentId = !!details.investmentId;
        const missingFields: string[] = [];

        if (!hasUserId) {
          missingFields.push('userId');
        }
        if (!hasInvestmentId) {
          missingFields.push('investmentId');
        }

        // accountNo can be in accNo field as well
        const hasAccountNo = details.accountNo || details.accNo;

        if (missingFields.length > 0) {
          logger.crash(new Error(`Missing required fields: ${missingFields.join(', ')}`), {
            context: "Parsing user details",
            details: {
              hasUserId: !!details.userId,
              hasUserFromStore: !!user?.id,
              hasInvestmentId: !!details.investmentId,
              hasAccountNo: !!hasAccountNo,
              hasAccNo: !!details.accNo,
              userIdSource: details.userId ? 'userDetails' : (user?.id ? 'userStore' : 'none'),
            },
            missingFields,
            params: {
              hasUserDetails: !!params.userDetails,
              userDetailsSize: params.userDetails?.length || 0,
            },
          });
        }

        if (!hasAccountNo) {
          logger.warn("Missing accountNo/accNo in userDetails", {
            detailsKeys: Object.keys(details),
          });
        }

        // Ensure accountNo is set (use accNo as fallback)
        if (!details.accountNo && details.accNo) {
          details.accountNo = details.accNo;
        }

        // Ensure userId is set (use user.id as fallback)
        if (!details.userId && user?.id) {
          details.userId = user.id;
        }

        setUserDetails(details);
        logger.log("User details parsed successfully", {
          hasUserId: !!details.userId,
          hasInvestmentId: !!details.investmentId,
          hasAccountNo: !!details.accountNo,
          keys: Object.keys(details),
        });
      } catch (error) {
        const userDetailsStr = Array.isArray(params.userDetails)
          ? params.userDetails[0]
          : params.userDetails;
        logger.crash(error as Error, {
          context: "Parsing user details in paymentNewOverView",
          params: {
            hasUserDetails: !!params.userDetails,
            userDetailsType: typeof params.userDetails,
            userDetailsSize: typeof userDetailsStr === 'string' ? userDetailsStr.length : 0,
            userDetailsPreview: typeof userDetailsStr === 'string' ? userDetailsStr.substring(0, 200) : "",
          },
        });

        // Set a fallback to prevent further crashes
        // Try to get data from global store as fallback
        const paymentSession = useGlobalStore.getState().getCurrentPaymentSession();
        if (paymentSession?.userDetails) {
          logger.log("Using payment session from global store as fallback");
          setUserDetails(paymentSession.userDetails);
        } else {
          setUserDetails({
            userId: user?.id || "",
            investmentId: "",
            accountNo: "",
            accountname: "",
            name: user?.name || "",
            mobile: user?.mobile || "",
            email: user?.email || "",
          });
        }
      }
    } else if (!params.userDetails) {
      logger.warn("No userDetails in params, checking global store", { params });

      // Try to get from global store as fallback
      const paymentSession = useGlobalStore.getState().getCurrentPaymentSession();
      if (paymentSession?.userDetails) {
        logger.log("Using payment session from global store");
        setUserDetails(paymentSession.userDetails);
      } else {
        logger.error("No userDetails in params or global store", { params });
      }
    }
  }, []); // Empty dependency array to run only once

  // Fetch amount limits for flexi schemes
  const fetchAmountLimits = async () => {
    if (!isFlexi || !params.schemeId) {
      return; // Only fetch for flexi schemes with schemeId
    }

    try {
      const schemeId = Array.isArray(params.schemeId)
        ? params.schemeId[0]
        : params.schemeId;

      const response = await api.get(`/amount-limits/scheme/${schemeId}`);

      if (isMountedRef.current && response?.data) {
        const data = response.data.data || response.data;
        const min = Number(data.minAmount || data.min_amount || 0);
        const max = Number(data.maxAmount || data.max_amount || 100000);

        if (!isNaN(min) && isFinite(min) && min >= 0) {
          setMinAmount(min);
        }
        if (!isNaN(max) && isFinite(max) && max > 0) {
          setMaxAmount(max);
        }

        logger.log("Amount limits fetched", { min, max, schemeId });
      }
    } catch (error) {
      logger.error("Error fetching amount limits:", error);
      // Keep default values on error
    }
  };

  // Fetch gold rate with cache
  const fetchGoldRate = async () => {
    try {
      const { fetchGoldRatesWithCache } = await import("@/utils/apiCache");
      const rateData = await fetchGoldRatesWithCache();
      if (isMountedRef.current && rateData?.gold_rate) {
        const rate = Number(rateData.gold_rate);
        setGoldRate(rate);
        calculateWeightPerGram(currentAmount, rate);
      }
    } catch (error) {
      logger.error("Error fetching gold rate:", error);
      // Don't crash - just log the error
    }
  };

  // Calculate weight per gram based on amount and gold rate
  const calculateWeightPerGram = (amount: number, rate: number) => {
    if (rate > 0 && !isNaN(rate) && isFinite(rate) && amount >= 0) {
      const weight = amount / rate;
      if (isFinite(weight) && !isNaN(weight)) {
        setWeightPerGram(weight);
      }
    }
  };

  // Handle amount adjustment
  const adjustAmount = (increment: number) => {
    if (!isFlexi) return; // Prevent adjustment if not flexi
    const newAmount = currentAmount + increment;

    if (newAmount < minAmount) {
      setCurrentAmount(minAmount);
      calculateWeightPerGram(minAmount, goldRate);
      setAmountError(`Minimum amount allowed is ₹${minAmount.toLocaleString('en-IN')}`);
    } else if (newAmount >= minAmount && newAmount <= maxAmount) {
      setCurrentAmount(newAmount);
      calculateWeightPerGram(newAmount, goldRate);
      setAmountError(""); // Clear any previous error
    } else if (newAmount > maxAmount) {
      setCurrentAmount(maxAmount);
      calculateWeightPerGram(maxAmount, goldRate);
      setAmountError(`Maximum amount allowed is ₹${maxAmount.toLocaleString('en-IN')}`);
    }
  };

  // Handle manual amount editing
  const handleAmountEdit = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleanText = text.replace(/[^0-9.]/g, "");
    const amount = parseFloat(cleanText) || 0;

    if (amount < minAmount) {
      setCurrentAmount(minAmount);
      calculateWeightPerGram(minAmount, goldRate);
      setAmountError(`Minimum amount allowed is ₹${minAmount.toLocaleString('en-IN')}`);
    } else if (amount > maxAmount) {
      setCurrentAmount(maxAmount);
      calculateWeightPerGram(maxAmount, goldRate);
      setAmountError(`Maximum amount allowed is ₹${maxAmount.toLocaleString('en-IN')}`);
    } else {
      setCurrentAmount(amount);
      calculateWeightPerGram(amount, goldRate);
      setAmountError("");
    }
  };

  // Handle edit mode toggle
  const toggleEditMode = () => {
    setIsEditingAmount(!isEditingAmount);
    setAmountError(""); // Clear error when toggling edit mode
  };



  // Toggle user details card expand/collapse
  const toggleUserDetailsCard = useCallback(() => {
    const toValue = isUserDetailsExpanded ? 0 : 1;
    setIsUserDetailsExpanded(!isUserDetailsExpanded);

    Animated.spring(userDetailsHeight, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [isUserDetailsExpanded, userDetailsHeight]);

  // Toggle scheme details card expand/collapse
  const toggleSchemeDetailsCard = useCallback(() => {
    const toValue = isSchemeDetailsExpanded ? 0 : 1;
    setIsSchemeDetailsExpanded(!isSchemeDetailsExpanded);

    Animated.spring(schemeDetailsHeight, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [isSchemeDetailsExpanded, schemeDetailsHeight]);

  // Get scheme name for display
  const schemeName = useMemo(() => {
    return Array.isArray(params.schemeName)
      ? params.schemeName[0]
      : (params.schemeName || userDetails?.schemeName || t("digiGold") || "DigiGold");
  }, [params.schemeName, userDetails?.schemeName, t]);

  useEffect(() => {
    fetchGoldRate();
    if (isFlexi && params.schemeId) {
      fetchAmountLimits();
    }
  }, [params.schemeId, isFlexi]);

  const fetchTermsAndConditions = async () => {
    try {

      const response = await api.get(`/schemes/${params.schemeId}`);
      if (isMountedRef.current) {
        // Select terms based on current language
        let selectedTerms = "";
        if (language === "ta") {
          // For Tamil or Malayalam, prefer Tamil terms
          selectedTerms = response.data.data.terms_conditions_ta || "";
        } else if (language === "en") {
          // For English, prefer English terms
          selectedTerms = response.data.data.terms_conditions_en || "";
        } else {
          selectedTerms = response.data.data.terms_conditions_en || response.data.data.terms_conditions_ta || "";
        }

        if (selectedTerms) {
          setTermsContent(selectedTerms);
        } else {
          logger.warn("Terms and conditions response missing description");
          setTermsContent("Terms and conditions not available.");
        }
      }
    } catch (error) {
      logger.error("Error fetching terms and conditions:", error);
      if (isMountedRef.current) {
        setTermsContent("Unable to load terms and conditions. Please try again later.");
      }
    }
  };
  useEffect(() => {
    fetchTermsAndConditions();
  }, [language, params.schemeId]);
  // Memoize formatted amount to prevent unnecessary recalculations
  const formattedAmount = useMemo(() => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(currentAmount);
  }, [currentAmount]);

  const formattedWeight = useMemo(() => {
    if (isNaN(weightPerGram) || !isFinite(weightPerGram)) {
      return "0.000";
    }
    return weightPerGram.toFixed(3);
  }, [weightPerGram]);

  const handlePayment = async () => {
    // Immediate UX feedback and guards
    if (isProcessing) return;
    if (!currentAmount || currentAmount <= 0) {
      if (isMountedRef.current) {
        Alert.alert(
          "Invalid Amount",
          "Please enter a valid amount greater than 0"
        );
      }
      return;
    }
    setIsProcessing(true);

    try {
      logger.log("userDetails ======>", params.schemeType);
      if (!userDetails) {
        logger.crash(new Error("User details not available"), {
          context: "handlePayment",
          params,
          user,
        });
        if (isMountedRef.current) {
          Alert.alert("Error", "User details not available. Please go back and try again.");
          setIsProcessing(false);
        }
        return;
      }

      // Validate critical fields
      if (!userDetails.investmentId) {
        logger.crash(new Error("Missing investmentId"), {
          context: "handlePayment validation",
          userDetails,
        });
        if (isMountedRef.current) {
          Alert.alert("Error", "Missing investment information. Please go back and try again.");
          setIsProcessing(false);
        }
        return;
      }

      // Check for accountNo with fallback to accNo
      const accountNo = userDetails.accountNo || userDetails.accNo;
      if (!accountNo) {
        logger.crash(new Error("Missing accountNo"), {
          context: "handlePayment validation",
          userDetails,
        });
        if (isMountedRef.current) {
          Alert.alert("Error", "Missing account information. Please go back and try again.");
          setIsProcessing(false);
        }
        return;
      }

      if (currentAmount < minAmount) {
        if (isMountedRef.current) {
          Alert.alert("Invalid Amount", `Minimum amount allowed is ₹${minAmount.toLocaleString('en-IN')}`);
          setIsProcessing(false);
        }
        return;
      }

      if (currentAmount > maxAmount) {
        if (isMountedRef.current) {
          Alert.alert("Invalid Amount", `Maximum amount allowed is ₹${maxAmount.toLocaleString('en-IN')}`);
          setIsProcessing(false);
        }
        return;
      }

      const payload: PaymentInitPayload | any = {
        userId: userDetails.userId || user?.id,
        amount: currentAmount,
        // amount:1,
        accountNo: userDetails.accountNo,
        investmentId: userDetails.investmentId,
        schemeId: params?.schemeId,
        userEmail: userDetails?.email || user?.email,
        userMobile: userDetails?.mobile || user?.mobile,
        userName: userDetails?.accountname,
        // Ensure backend-required identifiers are present
        chitId:
          userDetails?.chitId ||
          (Array.isArray(params.chitId) ? params.chitId[0] : params.chitId),
        paymentFrequency: params.paymentFrequency,
      };

      logger.log("initialpayment ======>", payload);

      const response: any = await paymentService.initiatePayment(payload);
      logger.log("response ======>", response);

       if (response?.success && response?.session?.payment_links?.web) {
        // Extract order ID from the payment response
        const orderId = response?.session?.order_id;
        const paymentUrl = response?.session?.payment_links?.web;

        console.log("Payment URL:", paymentUrl);
        console.log("Order ID:", orderId);

        router.push({
          pathname: "/(tabs)/home/PaymentWebView",
          params: {
            url: paymentUrl,
            orderId: orderId, // Add orderId to params
            userDetails: JSON.stringify({
              ...userDetails,
              amount: currentAmount,
              orderId: orderId, // Include orderId in userDetails
              // investmentId: params.investmentId,
              // schemeId: params.schemeId,
              // chitId:  params.chitId,
              userId: userDetails.userId || user?.id,
              paymentFrequency: params.paymentFrequency,
              schemeType: params.schemeType,
            }),
          },
        });
      }
      // Fallback for old response structure
      else if (response?.success && response?.data) {
        console.log("Using fallback response structure");
        const orderId = response?.order_id || response?.session?.order_id;
        const paymentUrl = response?.data;

        console.log("Fallback Payment URL:", paymentUrl);
        console.log("Fallback Order ID:", orderId);

        router.push({
          pathname: "/(tabs)/home/PaymentWebView",
          params: {
            url: paymentUrl,
            orderId: orderId,
            userDetails: JSON.stringify({
              ...userDetails,
              amount: currentAmount,
              orderId: orderId,
              userId: userDetails.userId || user?.id,
              paymentFrequency: params.paymentFrequency,
              schemeType: params.schemeType,
            }),
          },
        });
      } else {
        console.log("Payment initiation failed:", {
          success: response?.success,
          hasSession: !!response?.session,
          hasPaymentLinks: !!response?.session?.payment_links,
          hasWebUrl: !!response?.session?.payment_links?.web,
          hasData: !!response?.data,
          response: response
        });
        Alert.alert("Error", "No payment URL received. Please try again.");
      }
    } catch (error) {
      logger.crash(error as Error, {
        context: "handlePayment - exception",
        currentAmount,
        userDetails,
        params,
      });
      if (isMountedRef.current) {
        Alert.alert("Error", `Failed to initiate payment: ${(error as Error).message || "Unknown error"}`);
        setIsProcessing(false);
      }
    }
  };

  const handleConfirmExit = useCallback(() => {
    if (!isMountedRef.current) {
      logger.log("Component unmounted, skipping exit navigation");
      return;
    }

    setShowExitModal(false);
    try {
      // Validate router is available
      if (!router || typeof router.back !== 'function') {
        logger.error("Router not available for back navigation");
        return;
      }

      router.back();
    } catch (error) {
      logger.error("Error navigating back:", error);
      // Fallback navigation if router.back() fails
      try {
        if (router && typeof router.canGoBack === 'function' && router.canGoBack()) {
          router.back();
        } else if (router && typeof router.replace === 'function') {
          // Ultimate fallback: navigate to home
          router.replace('/(tabs)/home');
        }
      } catch (fallbackError) {
        logger.error("Fallback navigation also failed:", fallbackError);
      }
    }
  }, [router]);

  const handleCancelExit = () => {
    setShowExitModal(false);
  };

  const TermsAndConditionsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showTermsModal}
      onRequestClose={() => setShowTermsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("termsAndConditions")}</Text>
            <TouchableOpacity
              onPress={() => setShowTermsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.termsText}>

              {termsContent}
            </Text>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                setIsTermsAccepted(true);
                setShowTermsModal(false);
              }}
            >
              <Text style={styles.acceptButtonText}>{t("accept")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Amount Card */}
        {isFlexi ? (
          <View style={styles.amountCard}>
            <View style={styles.amountHeader}>
              <MaterialCommunityIcons
                name="gold"
                size={24}
                color={theme.colors.secondary}
              />
              <Text style={styles.amountTitle}>{t("totalAmount")}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={toggleEditMode}
              >
                <Ionicons
                  name={isEditingAmount ? "checkmark" : "create"}
                  size={20}
                  color={theme.colors.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.amountAdjustmentContainer}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => adjustAmount(-1000)}
                disabled={isEditingAmount}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={
                    isEditingAmount
                      ? theme.colors.secondary + "40"
                      : theme.colors.secondary
                  }
                />
              </TouchableOpacity>

              <View style={styles.amountDisplay}>
                {isEditingAmount ? (
                  <TextInput
                    style={styles.amountInput}
                    value={currentAmount.toString()}
                    onChangeText={handleAmountEdit}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                    placeholderTextColor={theme.colors.secondary + "80"}
                    autoFocus={true}
                  />
                ) : (
                  <>
                    <Text style={styles.amountValue}>{formattedAmount}</Text>

                  </>
                )}
                <Text style={styles.weightText}>
                  {formattedWeight} grams (₹{(goldRate && !isNaN(goldRate) ? Number(goldRate).toFixed(2) : "0.00")}/gram)
                </Text>
                {amountError ? (
                  <Text style={styles.errorText}>{amountError}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => adjustAmount(1000)}
                disabled={isEditingAmount}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={
                    isEditingAmount
                      ? theme.colors.secondary + "40"
                      : theme.colors.secondary
                  }
                />
              </TouchableOpacity>
            </View>

            <View style={styles.quickAdjustButtons}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustAmount(-500)}
                disabled={isEditingAmount}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    isEditingAmount && styles.disabledText,
                  ]}
                >
                  -500
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustAmount(-100)}
                disabled={isEditingAmount}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    isEditingAmount && styles.disabledText,
                  ]}
                >
                  -100
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustAmount(100)}
                disabled={isEditingAmount}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    isEditingAmount && styles.disabledText,
                  ]}
                >
                  +100
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustAmount(500)}
                disabled={isEditingAmount}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    isEditingAmount && styles.disabledText,
                  ]}
                >
                  +500
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.amountCard}>
            <View style={styles.amountHeader}>
              <MaterialCommunityIcons
                name="gold"
                size={24}
                color={theme.colors.secondary}
              />
              <Text style={styles.amountTitle}>{t("totalAmount")}</Text>
            </View>
            <View style={styles.amountDisplay}>
              <Text style={styles.amountValue}>{formattedAmount}</Text>
              {(params.savinsTypes)?.toString().toLowerCase() === "weight" && <Text style={styles.weightText}>
                {formattedWeight} grams (₹{(goldRate && !isNaN(goldRate) ? Number(goldRate).toFixed(2) : "0.00")}/gram)
              </Text>}
            </View>
          </View>
        )}

        {/* User Details Card */}
        <View style={styles.userDetailsCard}>
          <TouchableOpacity
            style={[
              styles.cardHeader,
              isUserDetailsExpanded && styles.cardHeaderWithBorder,
            ]}
            onPress={toggleUserDetailsCard}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={24} color={theme.colors.secondary} />
            <Text style={styles.cardTitle}>
              {isUserDetailsExpanded
                ? t("userDetails")
                : userDetails?.name || user?.name || t("name")}
            </Text>
            <Ionicons
              name={isUserDetailsExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.secondary}
              style={styles.expandIcon}
            />
          </TouchableOpacity>
          <Animated.View
            style={[
              styles.cardContent,
              {
                maxHeight: userDetailsHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200],
                }),
                opacity: userDetailsHeight,
              },
            ]}
          >
            <View style={styles.userDetailsRow}>
              <Text style={styles.userDetailLabel}>{t("name")}:</Text>
              <Text style={styles.userDetailValue}>
                {userDetails?.name || user?.name || "N/A"}
              </Text>
            </View>
            <View style={styles.userDetailsRow}>
              <Text style={styles.userDetailLabel}>{t("mobile")}:</Text>
              <Text style={styles.userDetailValue}>
                {userDetails?.mobile || user?.mobile || "N/A"}
              </Text>
            </View>
            <View style={styles.userDetailsRow}>
              <Text style={styles.userDetailLabel}>{t("email")}:</Text>
              <Text style={styles.userDetailValue}>
                {userDetails?.email || user?.email || "N/A"}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Scheme Details Card */}
        <View style={styles.schemeDetailsCard}>
          <TouchableOpacity
            style={[
              styles.cardHeader,
              isSchemeDetailsExpanded && styles.cardHeaderWithBorder,
            ]}
            onPress={toggleSchemeDetailsCard}
            activeOpacity={0.8}
          >
            <Ionicons
              name="business"
              size={24}
              color={theme.colors.secondary}
            />
            <Text style={styles.cardTitle}>
              {isSchemeDetailsExpanded ? t("schemeDetails") : schemeName}
            </Text>
            <Ionicons
              name={isSchemeDetailsExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.secondary}
              style={styles.expandIcon}
            />
          </TouchableOpacity>
          <Animated.View
            style={[
              styles.cardContent,
              {
                maxHeight: schemeDetailsHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200],
                }),
                opacity: schemeDetailsHeight,
              },
            ]}
          >
            <View style={styles.schemeDetailsRow}>
              <Text style={styles.schemeDetailLabel}>{t("schemeType")}:</Text>
              <Text style={styles.schemeDetailValue}>
                {params.schemeType
                  ? t(params.schemeType.toString())
                  : t("monthly")}
              </Text>
            </View>
            <View style={styles.schemeDetailsRow}>
              <Text style={styles.schemeDetailLabel}>
                {t("paymentFrequency")}:
              </Text>
              <Text style={styles.schemeDetailValue}>
                {params.paymentFrequency
                  ? t(params.paymentFrequency.toString())
                  : t("monthly")}
              </Text>
            </View>
            <View style={styles.schemeDetailsRow}>
              <Text style={styles.schemeDetailLabel}>{t("schemeName")}:</Text>
              <Text style={styles.schemeDetailValue}>{schemeName}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Terms and Conditions */}

      </ScrollView>

      {/* Fixed Bottom Payment Card */}
      <View style={styles.fixedBottomCard}>
        <View style={styles.bottomCardContent}>
          {/* Terms Checkbox and Text */}
          <View style={styles.bottomTermsSection}>
            <TouchableOpacity
              style={styles.bottomTermsCheckbox}
              onPress={() => setIsTermsAccepted(!isTermsAccepted)}
            >
              <Ionicons
                name={isTermsAccepted ? "checkbox" : "square-outline"}
                size={24}
                color={
                  isTermsAccepted
                    ? theme.colors.secondary
                    : theme.colors.textSecondary
                }
              />
            </TouchableOpacity>
            <Text style={styles.bottomTermsText}>
              {t("iAgreeTo")}{" "}
              <Text
                style={styles.bottomTermsLink}
                onPress={() => setShowTermsModal(true)}
              >
                {t("termsAndConditions")}
              </Text>
            </Text>
          </View>

          {/* Payment Button */}
          <TouchableOpacity
            style={[
              styles.bottomPaymentButton,
              !isTermsAccepted && styles.bottomPaymentButtonDisabled,
            ]}
            onPress={handlePayment}
            disabled={!isTermsAccepted || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.bottomPaymentButtonText}>
                {t("proceedToPayment")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Terms Modal */}
      <TermsAndConditionsModal />

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelExit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exitModalContent}>
            <Text style={styles.exitModalTitle}>Leave Payment?</Text>
            <Text style={styles.exitModalMessage}>
              Are you sure you want to leave the payment page? Your payment
              details will be lost.
            </Text>
            <View style={styles.exitModalButtons}>
              <TouchableOpacity
                style={styles.exitModalCancelButton}
                onPress={handleCancelExit}
              >
                <Text style={styles.exitModalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exitModalConfirmButton}
                onPress={handleConfirmExit}
              >
                <Text style={styles.exitModalConfirmButtonText}>Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 120, // Add bottom padding to prevent content from being hidden behind fixed card
  },
  amountCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  amountHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  amountTitle: {
    fontSize: 16,
    color: theme.colors.secondary,
    marginLeft: 8,
    fontWeight: "600",
    flex: 1,
  },
  amountAdjustmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  arrowButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
  },
  amountDisplay: {
    flex: 1,
    alignItems: "center",
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.secondary,
    textAlign: "center",
  },
  weightText: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: 4,
    opacity: 0.9,
  },
  quickAdjustButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  quickButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickButtonText: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontWeight: "600",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    paddingBottom: 12,
    paddingHorizontal: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginLeft: 8,
    flex: 1,
  },
  cardContent: {
    overflow: "hidden",
    paddingTop: 12,
  },
  cardHeaderWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0, // Lift the footer up to avoid tab bar overlap
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20, // Reduced padding since we moved the footer up
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 20,
    zIndex: 20,
  },
  termsContainer: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 4,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  termsText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  termsLink: {
    color: theme.colors.primary,
    textDecorationLine: "underline",
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  payButtonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    height: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 16,
    maxHeight: 'auto',
  },
  modalBodyContent: {
    flexGrow: 1,
    paddingBottom: 2,
  },
  modalFooter: {
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  acceptButtonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    padding: 4,
    marginLeft: 8,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.secondary,
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 200,
  },
  errorText: {
    fontSize: 12,
    color: "#ff4444",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500",
  },
  disabledText: {
    opacity: 0.4,
  },
  userDetailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  userDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userDetailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  userDetailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  schemeDetailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  schemeDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  schemeDetailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  schemeDetailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  termsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  termsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 12,
  },
  termsCheckbox: {
    padding: 8,
  },
  paymentButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
  paymentButtonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  fixedBottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 100,
  },
  bottomCardContent: {
    padding: 20,
    paddingBottom: 10, // Extra padding to avoid tab bar overlap
  },
  bottomTermsSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  bottomTermsCheckbox: {
    padding: 2,
    marginRight: 12,
  },
  bottomTermsText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 20,
  },
  bottomTermsLink: {
    color: 'blue',
    textDecorationLine: "underline",
  },
  bottomPaymentButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  bottomPaymentButtonDisabled: {
    opacity: 0.6,
  },
  bottomPaymentButtonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  exitModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 400,
    zIndex: 1000,
  },
  exitModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  exitModalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  exitModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  exitModalCancelButton: {
    flex: 1,
    backgroundColor: "#95a5a6",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  exitModalCancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  exitModalConfirmButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  exitModalConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  schemeCalculationCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 0,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    overflow: "hidden",
  },
  schemeCardHeader: {
    backgroundColor: theme.colors.primary,
    padding: 20,
    paddingBottom: 16,
  },
  schemeHeaderGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  schemeCardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  expandIcon: {
    marginLeft: "auto",
  },
  schemeDateText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 8,
    fontWeight: "500",
  },
  calculationContent: {
    overflow: "hidden",
  },
  schemeMainValueContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 24,
    gap: 12,
  },
  schemeMainValueBox: {
    flex: 1,
  },
  schemeMainValueGradient: {
    backgroundColor: theme.colors.primary + "10",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.primary + "30",
  },
  schemeMainValueLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  schemeMainValueText: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  sliderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#f8f9fa",
    position: "relative",
  },
  bonusTrackContainer: {
    flexDirection: "row",
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bonusTrackSegment: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  bonusTrackLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sliderWrapper: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 40,
    zIndex: 10,
    justifyContent: "center",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  rangeMarkersContainer: {
    position: "relative",
    height: 30,
    marginTop: 36,
    marginBottom: 8,
  },
  rangeMarker: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -15 }],
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#333",
    marginBottom: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  markerLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "700",
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  bonusAmountContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
  },
  bonusAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bonusLabel: {
    fontSize: 14,
    color: theme.colors.secondary,
    fontWeight: "600",
    opacity: 0.9,
  },
  bonusAmount: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  totalAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  totalAmountLabel: {
    fontSize: 15,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  totalAmountValue: {
    fontSize: 20,
    color: theme.colors.secondary,
    fontWeight: "bold",
  },
});

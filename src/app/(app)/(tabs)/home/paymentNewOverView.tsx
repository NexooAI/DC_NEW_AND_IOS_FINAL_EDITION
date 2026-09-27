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
import { BackHandler } from "react-native";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useFocusEffect, Stack } from "expo-router";
import { theme } from "@/constants/theme";
import api from "@/services/api";
import paymentService from "../../../../services/payment.service";
import { PaymentInitPayload } from "@/types/payment.types";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { logger } from '@/utils/logger';

const getFirstValue = (...values: any[]) => values.find((value) => value !== undefined && value !== null && value !== '');

const extractPaymentUrl = (paymentSession: any) => {
  if (!paymentSession) return '';
  if (typeof paymentSession === 'string') return paymentSession;
  return (
    paymentSession?.payment_links?.web ||
    paymentSession?.paymentLinks?.web ||
    paymentSession?.links?.web ||
    paymentSession?.web ||
    paymentSession?.url ||
    paymentSession?.paymentUrl ||
    paymentSession?.payment_url ||
    ''
  );
};

const extractPaymentLink = (responseData: any) => {
  const data = responseData?.data || responseData;
  const session = data?.session || data?.paymentSession || data?.payment_session;
  const bookingSession = data?.bookingId?.url || data?.booking?.url;
  return (
    data?.paymentLink ||
    data?.payment_link ||
    data?.paymentUrl ||
    data?.payment_url ||
    data?.payment_links?.web ||
    data?.paymentLinks?.web ||
    bookingSession?.payment_links?.web ||
    bookingSession?.paymentLinks?.web ||
    bookingSession?.links?.web ||
    bookingSession?.web ||
    bookingSession?.url ||
    session?.payment_links?.web ||
    session?.paymentLinks?.web ||
    session?.links?.web ||
    session?.web ||
    session?.url ||
    ''
  );
};

const extractOrderId = (responseData: any) => {
  const data = responseData?.data || responseData;
  const session = data?.session || data?.paymentSession || data?.payment_session;
  const bookingSession = data?.bookingId?.url || data?.booking?.url;
  return getFirstValue(
    data?.orderId,
    data?.order_id,
    data?.bookingId?.orderId,
    data?.bookingId?.order_id,
    bookingSession?.order_id,
    bookingSession?.orderId,
    session?.order_id,
    session?.orderId
  );
};

const extractBookingId = (responseData: any) => {
  const data = responseData?.data || responseData;
  return getFirstValue(
    data?.bookingId?.bookingId,
    data?.bookingId?.id,
    data?.booking_id,
    data?.bookingId,
    data?.id,
    data?.booking?.id
  );
};

export default function PaymentNewOverView() {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const paymentType = params.paymentType?.toString() || '';
  const router = useRouter();
  const { language, user } = useGlobalStore();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const { fetchBranchesWithCache } = await import("@/utils/apiCache");
        const branchData = await fetchBranchesWithCache() || [];
        setBranches(branchData);
      } catch (e) {
        logger.error("Error loading branches in overview:", e);
      }
    };
    loadBranches();
  }, []);

  const branchName = useMemo(() => {
    const branchId = userDetails?.associated_branch || userDetails?.branchId || userDetails?.branch_id || (user as any)?.branch_id || "";
    if (!branchId) return "";
    const b = branches.find(item => String(item.id) === String(branchId));
    return b ? b.branch_name : "";
  }, [branches, userDetails, user]);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState("test");
  const [currentAmount, setCurrentAmount] = useState(
    Number(params.amount) || 0
  );

  const [goldRate, setGoldRate] = useState(0);
  const [silverRate, setSilverRate] = useState(0);
  const [fetchedSlabs, setFetchedSlabs] = useState<any[]>([]);
  const [showAllSlabs, setShowAllSlabs] = useState(true);
  const [weightPerGram, setWeightPerGram] = useState(0);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isMounted, setIsMounted] = useState(true); // Track component mount state
  const isNavigatingRef = useRef(false); // Prevent multiple simultaneous navigations
  const isMountedRef = useRef(true); // More reliable mount tracking for async operations
  const isProcessingRef = useRef(false);
  // Check for Flexi type using both paymentFrequency and schemeType parameters
  const hybridStatus = useMemo(() => {
    if (params.hybridStatus) {
      try {
        return JSON.parse(params.hybridStatus as string);
      } catch (e) {
        logger.error("Error parsing hybridStatus param:", e);
      }
    }
    return null;
  }, [params.hybridStatus]);

  const isHybrid =
    params.schemeType?.toString().toLowerCase() === "hybrid";

  const parsedFixedType = useMemo(() => {
    // Try to extract fixed type from params or userDetails
    if (params.fixedType) return params.fixedType.toString();
    if (params.fixed_type) return params.fixed_type.toString();
    if (params.fixed) return params.fixed.toString();
    if (params.FIXED) return params.FIXED.toString();

    // Check userDetails
    if (params.userDetails) {
      try {
        const details = JSON.parse(params.userDetails as string);
        if (details.fixedType !== undefined) return details.fixedType;
        if (details.fixed_type !== undefined) return details.fixed_type;
        if (details.fixed !== undefined) return details.fixed;
        if (details.FIXED !== undefined) return details.FIXED;
      } catch (e) { }
    }

    // Check hybridStatus
    if (hybridStatus) {
      if (hybridStatus.fixedType !== undefined) return hybridStatus.fixedType;
      if (hybridStatus.fixed_type !== undefined) return hybridStatus.fixed_type;
      if (hybridStatus.fixed !== undefined) return hybridStatus.fixed;
      if (hybridStatus.FIXED !== undefined) return hybridStatus.FIXED;
    }

    return null;
  }, [params.fixedType, params.fixed_type, params.fixed, params.FIXED, params.userDetails, hybridStatus]);

  // Check for Flexi type using paymentFrequency, schemeType parameters, or hybrid null fixed types
  const isFlexi = useMemo(() => {
    const isFlexiParam =
      params.paymentFrequency?.toString().toLowerCase() === "flexi" ||
      params.schemeType?.toString().toLowerCase() === "flexi";

    const isHybridParam =
      params.paymentFrequency?.toString().toLowerCase() === "hybrid" ||
      params.schemeType?.toString().toLowerCase() === "hybrid";

    const isFixedNull = parsedFixedType === null || parsedFixedType === "null" || parsedFixedType === "";

    if (isHybridParam && isFixedNull) {
      return true;
    }
    return isFlexiParam;
  }, [params.paymentFrequency, params.schemeType, parsedFixedType]);

  const isEditable = useMemo(() => {
    return isFlexi && !paymentType;
  }, [isFlexi, paymentType]);

  // Dynamic amount limits from API (defaults to 100000 if not fetched)
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(100000); // Default fallback
  const [limitType, setLimitType] = useState<string | null>(null);
  // Scheme calculation slider state

  const [isUserDetailsExpanded, setIsUserDetailsExpanded] = useState(true);
  const userDetailsHeight = useRef(new Animated.Value(1)).current;
  const [isSchemeDetailsExpanded, setIsSchemeDetailsExpanded] = useState(true);
  const schemeDetailsHeight = useRef(new Animated.Value(1)).current;

  const amountScale = useRef(new Animated.Value(1)).current;

  const animateAmountText = () => {
    amountScale.setValue(0.95);
    Animated.spring(amountScale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleBackButtonPress = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    if (!isMountedRef.current) {
      logger.log("Component unmounted, skipping exit navigation");
      return;
    }

    setShowExitModal(false);
    try {
      if (!router) {
        logger.error("Router not available for back navigation");
        return;
      }

      const source = (params.source || userDetails?.source || "").toString();
      const invId = params.investmentId || userDetails?.investmentId || params.id;

      logger.log("Exiting payment overview with source:", { source, invId });

      if (source === "savings_detail" || source === "savings_detail_bulk") {
        if (invId) {
          router.replace({
            pathname: "/(tabs)/savings/SavingsDetail",
            params: {
              id: String(invId),
              investmentId: String(invId),
              schemeName: params.schemeName || userDetails?.schemeName || "",
              schemeId: params.schemeId || userDetails?.schemeId || "",
              schemeCode: params.schemeCode || userDetails?.schemeCode || "",
              emiAmount: params.amount || userDetails?.amount || "",
              accountHolder: userDetails?.accountname || userDetails?.name || "",
              accNo: userDetails?.accNo || params.accNo || "",
              schemesData: typeof params.schemesData === "object" ? JSON.stringify(params.schemesData) : (params.schemesData || ""),
              joiningDate: params.joiningDate || userDetails?.joiningDate || "",
              maturityDate: params.maturityDate || userDetails?.maturityDate || "",
              totalPaid: params.totalPaid || userDetails?.totalPaid || "",
              noOfIns: params.noOfIns || userDetails?.noOfIns || "",
              goldWeight: params.goldWeight || userDetails?.goldWeight || "",
              chitId: params.chitId || userDetails?.chitId || "",
              paymentFrequency: params.paymentFrequency || userDetails?.paymentFrequency || "",
              schemeType: params.schemeType || userDetails?.schemeType || "",
            },
          });
          return;
        } else {
          router.replace("/(tabs)/savings");
          return;
        }
      }

      if (source === "savings_index" || source === "savings" || source === "my_schemes") {
        router.replace("/(tabs)/savings");
        return;
      }

      if (source === "bill_payment") {
        router.replace("/(app)/bill_payment");
        return;
      }

      if (source === "advance_booking") {
        router.replace("/(tabs)/joinAdvGold");
        return;
      }

      if (source === "join_savings") {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)/home/schemes");
        }
        return;
      }

      // Default fallback
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      logger.error("Error navigating back:", error);
      try {
        if (router && typeof router.canGoBack === "function" && router.canGoBack()) {
          router.back();
        } else if (router && typeof router.replace === "function") {
          router.replace("/(tabs)/home");
        }
      } catch (fallbackError) {
        logger.error("Fallback navigation also failed:", fallbackError);
      }
    }
  }, [router, params, userDetails]);

  const handleCancelExit = () => {
    setShowExitModal(false);
  };

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


  // Reset isProcessing and navigation flag when screen is focused (e.g., when navigating back from payment failure)
  // Hide bottom navigation tab bar when on payment overview page
  useFocusEffect(
    useCallback(() => {
      setIsProcessing(false);
      isNavigatingRef.current = false; // Reset navigation flag
      isProcessingRef.current = false;
      useGlobalStore.getState().setTabVisibility(false);

      return () => {
        useGlobalStore.getState().setTabVisibility(true);
      };
    }, [])
  );

  // Cleanup on component unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      setIsMounted(false);
      isNavigatingRef.current = false;
      isProcessingRef.current = false;
    };
  }, []);

  // Sync isProcessing state to ref for synchronous double-tap prevention
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

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

  // Sync currentAmount with latest route params
  useEffect(() => {
    if (params.amount) {
      const parsedAmount = Number(params.amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        setCurrentAmount(parsedAmount);
      }
    }
  }, [params.amount]);

  // Parse user details whenever params change
  useEffect(() => {
    if (params.userDetails) {
      try {
        let details: any;
        if (typeof params.userDetails !== "string") {
          details = params.userDetails;
        } else {
          if (!params.userDetails || params.userDetails.length === 0) {
            throw new Error("userDetails is empty");
          }
          details = JSON.parse(params.userDetails as string);
        }

        if (params.userDetails.length > 2000) {
          logger.warn("userDetails string is very large", {
            size: params.userDetails.length,
          });
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
        const hasInvestmentId = paymentType ? true : !!details.investmentId;
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
        logger.log("User details parsed successfully for scheme:", {
          hasUserId: !!details.userId,
          hasInvestmentId: !!details.investmentId,
          investmentId: details.investmentId,
          accountNo: details.accountNo,
          schemeId: details.schemeId || params.schemeId,
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
  }, [params.userDetails, params.schemeId, params.chitId, params.amount]);

  // Fetch amount limits for flexi/hybrid schemes
  const fetchAmountLimits = async () => {
    if (paymentType) {
      return;
    }
    if ((!isFlexi && !isHybrid) || !params.schemeId) {
      return; // Only fetch for flexi/hybrid schemes with schemeId
    }

    if (isHybrid && hybridStatus?.isFixedPhase && hybridStatus?.rangeReady) {
      return; // Dynamic range already set from hybridStatus
    }

    try {
      const schemeId = Array.isArray(params.schemeId)
        ? params.schemeId[0]
        : params.schemeId;

      const response = await api.get(
        `/amount-limits/scheme/${schemeId}?userId=${userDetails?.userId || user?.id || ""}&investmentId=${userDetails?.investmentId || ""}`
      );

      if (isMountedRef.current && response?.data) {
        const data = response.data.data || response.data;
        const limitsObj = Array.isArray(data) ? data.find((limit: any) => limit.is_active === 1) : data;
        const min = Number(limitsObj?.min_amount || limitsObj?.minAmount || 0);
        const max = Number(limitsObj?.max_amount || limitsObj?.maxAmount || 100000);
        const type = limitsObj?.limit_type || null;

        if (!isNaN(min) && isFinite(min) && min >= 0) {
          setMinAmount(min);
        }
        if (!isNaN(max) && isFinite(max) && max > 0) {
          setMaxAmount(max);
        }
        setLimitType(type);

        logger.log("Amount limits fetched", { min, max, type, schemeId });
      }
    } catch (error) {
      logger.error("Error fetching amount limits:", error);
      // Keep default values on error
    }
  };

  // Fetch gold and silver rates with cache
  const fetchGoldRate = async () => {
    try {
      const { fetchGoldRatesWithCache } = await import("@/utils/apiCache");
      const rateData = await fetchGoldRatesWithCache();
      if (isMountedRef.current && rateData) {
        if (rateData.gold_rate) {
          const rate = Number(rateData.gold_rate);
          setGoldRate(rate);
          calculateWeightPerGram(currentAmount, rate);
        }
        if (rateData.silver_rate) {
          setSilverRate(Number(rateData.silver_rate));
        }
      }
    } catch (error) {
      logger.error("Error fetching metal rates:", error);
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
    if (!isEditable) return; // Prevent adjustment if not editable

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    animateAmountText();

    const newAmount = currentAmount + increment;

    if (newAmount < minAmount) {
      setCurrentAmount(minAmount);
      calculateWeightPerGram(minAmount, goldRate);
      setAmountError(
        limitType === "user"
          ? `User-specific minimum amount allowed is ₹${minAmount.toLocaleString('en-IN')}`
          : `Minimum amount allowed is ₹${minAmount.toLocaleString('en-IN')}`
      );
    } else if (newAmount >= minAmount && newAmount <= maxAmount) {
      setCurrentAmount(newAmount);
      calculateWeightPerGram(newAmount, goldRate);
      setAmountError(""); // Clear any previous error
    } else if (newAmount > maxAmount) {
      setCurrentAmount(maxAmount);
      calculateWeightPerGram(maxAmount, goldRate);
      setAmountError(
        limitType === "user"
          ? `User-specific maximum amount allowed is ₹${maxAmount.toLocaleString('en-IN')}`
          : `Maximum amount allowed is ₹${maxAmount.toLocaleString('en-IN')}`
      );
    }
  };

  // Handle manual amount editing
  const handleAmountEdit = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleanText = text.replace(/[^0-9.]/g, "");
    const amount = parseFloat(cleanText) || 0;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    animateAmountText();

    if (amount < minAmount) {
      setCurrentAmount(minAmount);
      calculateWeightPerGram(minAmount, goldRate);
      setAmountError(
        limitType === "user"
          ? `User-specific minimum amount allowed is ₹${minAmount.toLocaleString('en-IN')}`
          : `Minimum amount allowed is ₹${minAmount.toLocaleString('en-IN')}`
      );
    } else if (amount > maxAmount) {
      setCurrentAmount(maxAmount);
      calculateWeightPerGram(maxAmount, goldRate);
      setAmountError(
        limitType === "user"
          ? `User-specific maximum amount allowed is ₹${maxAmount.toLocaleString('en-IN')}`
          : `Maximum amount allowed is ₹${maxAmount.toLocaleString('en-IN')}`
      );
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
    let name = Array.isArray(params.schemeName)
      ? params.schemeName[0]
      : (params.schemeName || userDetails?.schemeName || t("digiGold") || "DigiGold");

    // Handle case where name is a localized object (e.g. {en: "...", ta: "..."})
    if (typeof name === 'object' && name !== null) {
      // @ts-ignore
      return name[language] || name['en'] || name['ta'] || "DigiGold";
    }

    return name;
  }, [params.schemeName, userDetails?.schemeName, t, language]);

  // Bonus Scheme slabs from params, userDetails, or fetched scheme data
  const rawSlabs = useMemo(() => {
    if (params.interestSlabs) {
      try {
        const parsed = typeof params.interestSlabs === "string" ? JSON.parse(params.interestSlabs) : params.interestSlabs;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        logger.warn("Error parsing params.interestSlabs:", e);
      }
    }
    if (userDetails?.interest_slabs && Array.isArray(userDetails.interest_slabs) && userDetails.interest_slabs.length > 0) {
      return userDetails.interest_slabs;
    }
    if (userDetails?.interestSlabs && Array.isArray(userDetails.interestSlabs) && userDetails.interestSlabs.length > 0) {
      return userDetails.interestSlabs;
    }
    if (fetchedSlabs.length > 0) return fetchedSlabs;
    return [];
  }, [params.interestSlabs, userDetails?.interest_slabs, userDetails?.interestSlabs, fetchedSlabs]);

  // Fallback API call to fetch scheme bonus slabs if not passed via navigation params
  useEffect(() => {
    const fetchSlabsIfNeeded = async () => {
      const schemeId = params.schemeId || userDetails?.schemeId;
      if (!schemeId || rawSlabs.length > 0) return;
      try {
        const res = await api.get(`/schemes/${schemeId}`);
        const data = res?.data?.data || res?.data;
        const s = data?.interest_slabs || data?.interest_slab || data?.interestSlabs;
        if (Array.isArray(s) && s.length > 0) {
          setFetchedSlabs(s);
        } else if (typeof s === "string") {
          try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) setFetchedSlabs(parsed);
          } catch {}
        }
      } catch (err) {
        logger.warn("Could not fetch scheme bonus slabs:", err);
      }
    };
    fetchSlabsIfNeeded();
  }, [params.schemeId, userDetails?.schemeId, rawSlabs.length]);

  const normalizedSlabs = useMemo(() => {
    if (!Array.isArray(rawSlabs)) return [];
    return rawSlabs.map((s: any) => ({
      from_day: Number(s.from_day ?? s.fromDay ?? s.from ?? 0),
      to_day: Number(s.to_day ?? s.toDay ?? s.to ?? 0),
      percentage: Number(s.percentage ?? s.bonus_percentage ?? s.bonusPercentage ?? s.interest_percentage ?? 0),
    })).filter((s: any) => s.to_day > 0 || s.percentage > 0);
  }, [rawSlabs]);

  // Metal type detection
  const isSilverScheme = useMemo(() => {
    const name = String(params.schemeName || userDetails?.schemeName || "").toLowerCase();
    const type = String(params.metalType || userDetails?.metalType || "").toLowerCase();
    return name.includes("silver") || name.includes("வெள்ளி") || type.includes("silver");
  }, [params.schemeName, userDetails?.schemeName, params.metalType, userDetails?.metalType]);

  const effectiveRate = useMemo(() => {
    if (isSilverScheme && silverRate > 0) return silverRate;
    return goldRate > 0 ? goldRate : 0;
  }, [isSilverScheme, silverRate, goldRate]);

  // Days elapsed since enrollment
  const currentDay = useMemo(() => {
    const rawDate = params.joiningDate || userDetails?.joiningDate || (userDetails as any)?.created_at || (userDetails as any)?.joiningdate;
    if (!rawDate) return 1;
    try {
      let joinDate: Date;
      if (typeof rawDate === "string" && rawDate.includes("-")) {
        const parts = rawDate.split("T")[0].split("-");
        if (parts[0].length === 4) {
          joinDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else if (parts[2].length === 4) {
          joinDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        } else {
          joinDate = new Date(rawDate);
        }
      } else {
        joinDate = new Date(rawDate);
      }
      if (isNaN(joinDate.getTime())) return 1;
      const today = new Date();
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const joinMidnight = new Date(joinDate.getFullYear(), joinDate.getMonth(), joinDate.getDate()).getTime();
      const diffTime = todayMidnight - joinMidnight;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, diffDays);
    } catch {
      return 1;
    }
  }, [params.joiningDate, userDetails?.joiningDate, (userDetails as any)?.created_at, (userDetails as any)?.joiningdate]);

  // Payment installment number
  const paymentNumber = useMemo(() => {
    const paidCountParam = params.paidPaymentCount !== undefined && params.paidPaymentCount !== null && params.paidPaymentCount !== ""
      ? Number(params.paidPaymentCount)
      : null;
    if (paidCountParam !== null && !isNaN(paidCountParam) && paidCountParam > 0) {
      return paidCountParam;
    }
    const monthsPaid = Number(userDetails?.monthsPaid || params.monthsPaid || 0);
    return Math.max(1, monthsPaid + 1);
  }, [params.paidPaymentCount, userDetails?.monthsPaid, params.monthsPaid]);

  // Active bonus slab based on current day
  const activeSlab = useMemo(() => {
    if (!normalizedSlabs.length) return null;
    return normalizedSlabs.find(
      (slab: any) => currentDay >= slab.from_day && currentDay <= slab.to_day
    ) || null;
  }, [normalizedSlabs, currentDay]);

  const activeBonusPercent = activeSlab ? activeSlab.percentage : 0;

  // Live dynamic bonus calculations linked to currentAmount
  const bonusCalculations = useMemo(() => {
    const amt = Number(currentAmount) || 0;
    const rate = effectiveRate > 0 ? effectiveRate : (goldRate > 0 ? goldRate : 1);
    const baseWeight = rate > 0 ? amt / rate : 0;
    const bonusCash = (amt * activeBonusPercent) / 100;
    const bonusWeight = rate > 0 ? bonusCash / rate : 0;
    const totalWeight = baseWeight + bonusWeight;

    return {
      baseWeight: Number(baseWeight.toFixed(3)),
      bonusCash: Math.round(bonusCash * 100) / 100,
      bonusWeight: Number(bonusWeight.toFixed(3)),
      totalWeight: Number(totalWeight.toFixed(3)),
    };
  }, [currentAmount, activeBonusPercent, effectiveRate, goldRate]);

  const hasBonusRewards = normalizedSlabs.length > 0;

  useEffect(() => {
    if (paymentType) {
      setMinAmount(0);
      setMaxAmount(9999999);
      return;
    }
    fetchGoldRate();
    if ((isFlexi || isHybrid) && params.schemeId) {
      if (hybridStatus && hybridStatus.isFixedPhase) {
        // If hybridStatus has dynamic limits and we are in the fixed phase, use them!
        if (hybridStatus.minAmount !== undefined && hybridStatus.maxAmount !== undefined) {
          const min = Number(hybridStatus.minAmount);
          const max = Number(hybridStatus.maxAmount);
          setMinAmount(min);
          setMaxAmount(max);

          // Set current amount to min/max if out of bounds
          if (currentAmount < min) {
            setCurrentAmount(min);
            calculateWeightPerGram(min, goldRate);
          } else if (currentAmount > max) {
            setCurrentAmount(max);
            calculateWeightPerGram(max, goldRate);
          }
          logger.log("Hybrid dynamic range limits set (Fixed Phase):", { min, max });
        } else {
          fetchAmountLimits();
        }
      } else {
        fetchAmountLimits();
      }
    }
  }, [params.schemeId, isFlexi, isHybrid, hybridStatus, goldRate, paymentType]);

  const fetchTermsAndConditions = async () => {
    try {
      let response;
      if (paymentType === 'bill') {
        response = await api.get('/policies/type/bill_payment_terms');
      } else if (paymentType === 'advance_booking' || paymentType === 'advance_booking_repayment') {
        response = await api.get('/policies/type/advance_booking_terms');
      }

      if (response && response.data && response.data.success && response.data.data) {
        const policy = response.data.data;
        let selectedTerms = "";

        // Match language with robust progressive fallback
        const targetKey = `description_${language}`;
        selectedTerms = policy[targetKey] || "";

        if (language === "mal" && !selectedTerms) {
          selectedTerms = policy.description_mal || "";
        }

        if (!selectedTerms) {
          selectedTerms = policy.description || ""; // Fallback to English description
        }

        if (!selectedTerms) {
          selectedTerms = policy.description_ta || ""; // Fallback to Tamil
        }

        if (selectedTerms && isMountedRef.current) {
          setTermsContent(selectedTerms);
          return;
        }
      }
    } catch (error) {
      logger.error("Error fetching policy terms and conditions:", error);
    }

    // Local fallback if API call fails or is empty
    if (paymentType === 'bill') {
      setTermsContent("By proceeding with this payment, you authorize the settlement of your outstanding bill amount. The transaction is secure and will be updated in your account history upon successful payment gateway confirmation.");
      return;
    }
    if (paymentType === 'advance_booking' || paymentType === 'advance_booking_repayment') {
      setTermsContent("By proceeding with this payment, you agree to book the gold/silver at today's locked rate by paying the specified advance amount. You will have the designated days to complete the purchase. In case of cancellation or non-completion, standard terms and conditions of advance booking will apply.");
      return;
    }
    if (!params.schemeId) {
      setTermsContent("Terms and conditions not available. Please contact support.");
      return;
    }
    try {

      const response = await api.get(`/schemes/${params.schemeId}`);
      if (isMountedRef.current) {
        // Select terms based on current language with robust progressive fallback
        let selectedTerms = "";
        const termsObj = response.data.data || {};

        // 1. Try specific language key (e.g. terms_conditions_te, terms_conditions_hi, terms_conditions_ta)
        const targetKey = `terms_conditions_${language}`;
        selectedTerms = termsObj[targetKey] || "";

        // 2. If language is Malayalam ('mal'), check terms_conditions_ml as well
        if (language === "mal" && !selectedTerms) {
          selectedTerms = termsObj.terms_conditions_ml || "";
        }

        // 3. Fallback to English
        if (!selectedTerms) {
          selectedTerms = termsObj.terms_conditions_en || "";
        }

        // 4. Fallback to Tamil
        if (!selectedTerms) {
          selectedTerms = termsObj.terms_conditions_ta || "";
        }

        // 5. Fallback to generic terms_description
        if (!selectedTerms) {
          selectedTerms = termsObj.terms_description || "";
        }

        // 6. Fallback to generic description
        if (!selectedTerms) {
          selectedTerms = termsObj.description || "";
        }

        if (selectedTerms) {
          setTermsContent(selectedTerms);
        } else {
          logger.warn("Terms and conditions response missing description");
          setTermsContent("Terms and conditions not available for this scheme. Please contact support.");
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
    if (isProcessing || isProcessingRef.current) return;
    isProcessingRef.current = true;
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

      // Bill Payment Flow
      if (paymentType === 'bill') {
        const billId = params.billId?.toString();
        const userId = userDetails.userId || user?.id;

        logger.log("[DEBUG Payment Flow Overview] Calling billsAPI.payBill with:", { billId, userId });
        const startTime = Date.now();
        console.log(`[Payment Initiation] [${new Date().toISOString()}] Posting to /bills/pay with billId = ${billId}, userId = ${userId}...`);
        const response = await api.post('/bills/pay', { billId, userId });
        console.log(`[Payment Initiation] [${new Date().toISOString()}] /bills/pay response received in ${Date.now() - startTime}ms`);

        logger.log("[DEBUG Payment Flow Overview] billsAPI.payBill response success:", response?.data?.success);

        const data = response?.data?.data;
        const paymentSession = data?.paymentSession;
        const paymentUrl = extractPaymentUrl(paymentSession);
        console.log(`[Payment Initiation] [${new Date().toISOString()}] Extracted details from bill pay: orderId = ${data?.orderId || 'none'}, billId = ${billId || 'none'}, paymentUrl = ${paymentUrl || 'none'}`);

        if (!response?.data?.success || !data?.orderId || !paymentUrl) {
          console.error(`[Payment Initiation] [${new Date().toISOString()}] Bill payment initiation failed: success = ${response?.data?.success}, has orderId = ${!!data?.orderId}, has paymentUrl = ${!!paymentUrl}, message = ${response?.data?.message}`);
          throw new Error(response?.data?.message || 'Payment session not available');
        }

        // Store payment session in global store for retry capability
        const sessionData = {
          amount: Number(currentAmount),
          userDetails: {
            ...userDetails,
            userId: userId,
            investmentId: billId,
            source: 'bill',
            paymentFrequency: params.paymentFrequency || userDetails.paymentFrequency,
            schemeType: params.schemeType || userDetails.schemeType,
            schemeName: params.schemeName || userDetails.schemeName,
          },
          timestamp: new Date().toISOString(),
        };
        useGlobalStore.getState().storePaymentSession(sessionData);

        router.replace({
          pathname: '/(tabs)/home/PaymentWebView',
          params: {
            url: paymentUrl,
            orderId: String(data.orderId),
            bookingId: String(billId),
            amount: String(currentAmount),
            userId: String(userId),
            type: 'bill',
            paymentIntentId: String(data.paymentIntentId || ''),
            accountNumber: String(userDetails.accountNo || ''),
            accountName: String(userDetails.name || ''),
          },
        });
        setIsProcessing(false);
        return;
      }

      // Advance Booking Flow
      if (paymentType === 'advance_booking') {
        const userId = userDetails.userId || user?.id;
        const payload = {
          userId,
          goldWeight: parseFloat(params.goldWeight as string) || 0,
          totalAmount: parseFloat(params.totalAmount as string) || 0,
          userName: userDetails.name,
          userEmail: userDetails.email,
          userMobile: userDetails.mobile,
          ratePerGram: parseFloat(params.ratePerGram as string) || 0,
          bookingAmount: parseFloat(params.bookingAmount as string) || 0,
          paymentMode: "UPI",
          accountNumber: userDetails.accountNo,
          source: "APP",
          expiryDate: params.expiryDate as string,
          branchId: userDetails.associated_branch || userDetails.branchId || userDetails.branch_id || user?.branch_id || 1,
        };

        logger.log("[DEBUG Payment Flow Overview] Calling advanceBookingAPI.createBooking with:", JSON.stringify(payload));
        const startTime = Date.now();
        console.log(`[Payment Initiation] [${new Date().toISOString()}] Posting to /advancebookings...`);
        const response = await api.post('/advancebookings', payload);
        console.log(`[Payment Initiation] [${new Date().toISOString()}] /advancebookings response received in ${Date.now() - startTime}ms`);

        logger.log("[DEBUG Payment Flow Overview] createBooking response success:", response?.data?.success);

        const paymentLink = extractPaymentLink(response?.data);
        const orderId = extractOrderId(response?.data);
        const bookingId = extractBookingId(response?.data);
        console.log(`[Payment Initiation] [${new Date().toISOString()}] Extracted details from booking: orderId = ${orderId || 'none'}, bookingId = ${bookingId || 'none'}, paymentLink = ${paymentLink || 'none'}`);

        if (!response?.data?.success || !paymentLink) {
          console.error(`[Payment Initiation] [${new Date().toISOString()}] Booking initiation failed: success = ${response?.data?.success}, has paymentLink = ${!!paymentLink}, message = ${response?.data?.message}`);
          throw new Error(response?.data?.message || 'Booking or payment session not available');
        }

        // Store payment session in global store for retry capability
        const sessionData = {
          amount: Number(payload.bookingAmount),
          userDetails: {
            ...userDetails,
            userId: userId,
            investmentId: bookingId,
            source: 'advance_booking',
            goldWeight: payload.goldWeight,
            totalAmount: payload.totalAmount,
            ratePerGram: payload.ratePerGram,
            bookingAmount: payload.bookingAmount,
            expiryDate: payload.expiryDate,
            paymentFrequency: params.paymentFrequency || userDetails.paymentFrequency,
            schemeType: params.schemeType || userDetails.schemeType,
            schemeName: params.schemeName || userDetails.schemeName,
          },
          timestamp: new Date().toISOString(),
        };
        useGlobalStore.getState().storePaymentSession(sessionData);

        router.replace({
          pathname: '/(tabs)/home/PaymentWebView',
          params: {
            url: String(paymentLink),
            orderId: orderId ? String(orderId) : '',
            bookingId: bookingId ? String(bookingId) : '',
            amount: String(payload.bookingAmount),
            type: 'advance_booking',
            userId: String(userId),
            accountNumber: String(payload.accountNumber),
            accountName: String(payload.userName),
          }
        });
        setIsProcessing(false);
        return;
      }

      // Advance Booking Repayment Flow
      if (paymentType === 'advance_booking_repayment') {
        const userId = userDetails.userId || user?.id;
        const bookingId = params.bookingId?.toString();
        const payload = {
          userId,
          bookingAmount: parseFloat(params.amount as string) || Number(currentAmount),
          paymentMode: "UPI",
          accountNumber: userDetails.accountNo,
          userName: userDetails.name,
          userEmail: userDetails.email,
          userMobile: userDetails.mobile,
          source: "APP",
        };

        logger.log("[DEBUG Repayment Flow] Calling advancebookings pay with:", JSON.stringify(payload));
        const startTime = Date.now();
        console.log(`[Payment Initiation] [${new Date().toISOString()}] Posting to /advancebookings/${bookingId}/pay...`);
        const response = await api.post(`/advancebookings/${bookingId}/pay`, payload);
        console.log(`[Payment Initiation] [${new Date().toISOString()}] /advancebookings/${bookingId}/pay response received in ${Date.now() - startTime}ms`);

        logger.log("[DEBUG Repayment Flow] pay response success:", response?.data?.success);

        const paymentLink = extractPaymentLink(response?.data);
        const orderId = extractOrderId(response?.data);
        console.log(`[Payment Initiation] [${new Date().toISOString()}] Extracted details from repayment: orderId = ${orderId || 'none'}, bookingId = ${bookingId || 'none'}, paymentLink = ${paymentLink || 'none'}`);

        if (!response?.data?.success || !paymentLink) {
          console.error(`[Payment Initiation] [${new Date().toISOString()}] Repayment initiation failed: success = ${response?.data?.success}, has paymentLink = ${!!paymentLink}, message = ${response?.data?.message}`);
          throw new Error(response?.data?.message || 'Repayment session not available');
        }

        router.replace({
          pathname: '/(tabs)/home/PaymentWebView',
          params: {
            url: String(paymentLink),
            orderId: orderId ? String(orderId) : '',
            bookingId: bookingId ? String(bookingId) : '',
            amount: String(payload.bookingAmount),
            type: 'advance_booking_repayment',
            userId: String(userId),
            accountNumber: String(payload.accountNumber),
            accountName: String(payload.userName),
          }
        });
        setIsProcessing(false);
        return;
      }

      // Validate critical fields
      if (!userDetails.investmentId && paymentType !== 'advance_booking_repayment') {
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
          const errorMsg = limitType === "user"
            ? `User-specific minimum amount allowed is ₹${minAmount.toLocaleString('en-IN')}`
            : `Minimum amount allowed is ₹${minAmount.toLocaleString('en-IN')}`;
          Alert.alert("Invalid Amount", errorMsg);
          setIsProcessing(false);
        }
        return;
      }

      if (currentAmount > maxAmount) {
        if (isMountedRef.current) {
          const errorMsg = limitType === "user"
            ? `User-specific maximum amount allowed is ₹${maxAmount.toLocaleString('en-IN')}`
            : `Maximum amount allowed is ₹${maxAmount.toLocaleString('en-IN')}`;
          Alert.alert("Invalid Amount", errorMsg);
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
        branchId: userDetails?.associated_branch || userDetails?.branchId || userDetails?.branch_id || user?.branch_id || 1,
      };

      logger.log("initialpayment ======>", payload);
      const schemePaymentStartTime = Date.now();
      console.log(`[Payment Initiation] [${new Date().toISOString()}] Initiating payment with payload:`, JSON.stringify(payload));

      const response: any = await paymentService.initiatePayment(payload);
      console.log(`[Payment Initiation] [${new Date().toISOString()}] Payment response received in ${Date.now() - schemePaymentStartTime}ms:`, JSON.stringify(response));

      if (response?.success && response?.session?.payment_links?.web) {
        // Extract order ID from the payment response
        const orderId = response?.session?.order_id;
        const paymentUrl = response?.session?.payment_links?.web;

        console.log(`[Payment Initiation] [${new Date().toISOString()}] Success: Extracted orderId = ${orderId || 'none'}, paymentUrl = ${paymentUrl || 'none'}`);
        console.log("Payment URL:", paymentUrl);
        console.log("Order ID:", orderId);

        // Store payment session in global store for retry capability
        const sessionData = {
          amount: Number(currentAmount),
          userDetails: {
            ...userDetails,
            userId: userDetails.userId || user?.id,
            investmentId: userDetails.investmentId,
            schemeId: params.schemeId || userDetails.schemeId,
            chitId: userDetails.chitId || params.chitId,
            paymentFrequency: params.paymentFrequency || userDetails.paymentFrequency,
            schemeType: params.schemeType || userDetails.schemeType,
            schemeName: params.schemeName || userDetails.schemeName,
            noOfIns: params.noOfIns || userDetails.noOfIns,
            totalPaid: params.totalPaid || userDetails.totalPaid,
            paidPaymentCount: params.paidPaymentCount || userDetails.paidPaymentCount,
            maturityDate: params.maturityDate || userDetails.maturityDate,
            joiningDate: params.joiningDate || userDetails.joiningDate,
            source: params.source || userDetails.source || "payment",
          },
          timestamp: new Date().toISOString(),
        };
        useGlobalStore.getState().storePaymentSession(sessionData);

        router.replace({
          pathname: "/(tabs)/home/PaymentWebView",
          params: {
            url: paymentUrl,
            orderId: orderId, // Add orderId to params
            amount: currentAmount.toString(),
            schemeName: schemeName,
            goldRate: goldRate.toString(),
            maturityDate: params.maturityDate ? params.maturityDate.toString() : "",
            joiningDate: params.joiningDate ? params.joiningDate.toString() : "",
            userDetails: JSON.stringify({
              ...userDetails,
              amount: currentAmount,
              orderId: orderId, // Include orderId in userDetails
              schemeName: schemeName,
              goldRate: goldRate,
              maturityDate: params.maturityDate || "",
              joiningDate: params.joiningDate || "",
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
        console.log(`[Payment Initiation] [${new Date().toISOString()}] Using fallback response structure`);
        const orderId = response?.order_id || response?.session?.order_id;
        const paymentUrl = response?.data;

        console.log(`[Payment Initiation] [${new Date().toISOString()}] Fallback Success: Extracted orderId = ${orderId || 'none'}, paymentUrl = ${paymentUrl || 'none'}`);
        console.log("Fallback Payment URL:", paymentUrl);
        console.log("Fallback Order ID:", orderId);

        // Store payment session in global store for retry capability
        const sessionData = {
          amount: Number(currentAmount),
          userDetails: {
            ...userDetails,
            userId: userDetails.userId || user?.id,
            investmentId: userDetails.investmentId,
            schemeId: params.schemeId || userDetails.schemeId,
            chitId: userDetails.chitId || params.chitId,
            paymentFrequency: params.paymentFrequency || userDetails.paymentFrequency,
            schemeType: params.schemeType || userDetails.schemeType,
            schemeName: params.schemeName || userDetails.schemeName,
            noOfIns: params.noOfIns || userDetails.noOfIns,
            totalPaid: params.totalPaid || userDetails.totalPaid,
            paidPaymentCount: params.paidPaymentCount || userDetails.paidPaymentCount,
            maturityDate: params.maturityDate || userDetails.maturityDate,
            joiningDate: params.joiningDate || userDetails.joiningDate,
            source: params.source || userDetails.source || "payment",
          },
          timestamp: new Date().toISOString(),
        };
        useGlobalStore.getState().storePaymentSession(sessionData);

        router.replace({
          pathname: "/(tabs)/home/PaymentWebView",
          params: {
            url: paymentUrl,
            orderId: orderId,
            amount: currentAmount.toString(),
            schemeName: schemeName,
            goldRate: goldRate.toString(),
            maturityDate: params.maturityDate ? params.maturityDate.toString() : "",
            joiningDate: params.joiningDate ? params.joiningDate.toString() : "",
            userDetails: JSON.stringify({
              ...userDetails,
              amount: currentAmount,
              orderId: orderId,
              schemeName: schemeName,
              goldRate: goldRate,
              maturityDate: params.maturityDate || "",
              joiningDate: params.joiningDate || "",
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t("paymentProcess") || "Payment Process",
          gestureEnabled: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleBackButtonPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ paddingHorizontal: 12, paddingVertical: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t("back") || "Back"}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.textDark || "#333"} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Amount Card */}
        {isEditable ? (
          <LinearGradient
            colors={theme.colors.gradientPrimaryDark || ["#850111", "#5a000b", "#2e0406"]}
            style={styles.amountCard}
          >
            <View style={styles.amountHeader}>
              <FontAwesome5
                name="coins"
                size={20}
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
                  <Animated.View style={{ transform: [{ scale: amountScale }] }}>
                    <Text style={styles.amountValue}>{formattedAmount}</Text>
                  </Animated.View>
                )}
                {(params.savinsTypes)?.toString().toLowerCase() === "weight" && (
                  <Text style={styles.weightText}>
                    {formattedWeight} grams (₹{(goldRate && !isNaN(goldRate) ? Number(goldRate).toFixed(2) : "0.00")}/gram)
                  </Text>
                )}
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
                    isEditingAmount ? styles.disabledText : undefined,
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
                    isEditingAmount ? styles.disabledText : undefined,
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
                    isEditingAmount ? styles.disabledText : undefined,
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
                    isEditingAmount ? styles.disabledText : undefined,
                  ]}
                >
                  +500
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={theme.colors.gradientPrimaryDark || ["#850111", "#5a000b", "#2e0406"]}
            style={styles.amountCard}
          >
            <View style={styles.amountHeader}>
              <FontAwesome5
                name="coins"
                size={20}
                color={theme.colors.secondary}
              />
              <Text style={styles.amountTitle}>
                {paymentType === 'bill'
                  ? 'Bill Amount'
                  : paymentType === 'advance_booking'
                    ? 'Advance Payment Amount'
                    : t("totalAmount")}
              </Text>
            </View>
            <View style={styles.amountDisplay}>
              <Text style={styles.amountValue}>{formattedAmount}</Text>
              {(params.savinsTypes)?.toString().toLowerCase() === "weight" && <Text style={styles.weightText}>
                {formattedWeight} grams (₹{(goldRate && !isNaN(goldRate) ? Number(goldRate).toFixed(2) : "0.00")}/gram)
              </Text>}
            </View>
          </LinearGradient>
        )}

        {/* Bonus Benefits Card (for Incentive / Bonus Slab Schemes) */}
        {hasBonusRewards && (
          <View style={styles.bonusBenefitCard}>
            <LinearGradient
              colors={["#FFFBEB", "#FEF3C7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bonusBenefitGradient}
            >
              {/* Header: Title + Badges */}
              <View style={styles.bonusHeaderRow}>
                <View style={styles.bonusTitleGroup}>
                  <View style={styles.bonusIconWrap}>
                    <Ionicons name="gift" size={18} color="#D97706" />
                  </View>
                  <View>
                    <Text style={styles.bonusMainTitle}>
                      {t("bonusBenefits")}
                    </Text>
                    <Text style={styles.bonusSubTitle}>
                      {t("installment")} #{paymentNumber}
                    </Text>
                  </View>
                </View>

                {/* Day Badge */}
                <View style={styles.dayBadgePill}>
                  <Ionicons name="calendar-outline" size={13} color="#92400E" />
                  <Text style={styles.dayBadgeText}>
                    {t("day")} {currentDay}
                  </Text>
                </View>
              </View>

              {/* Active Tier Banner */}
              <View style={styles.activeTierBanner}>
                {activeSlab ? (
                  <>
                    <View style={styles.activeTierLeft}>
                      <Ionicons name="sparkles" size={15} color="#D97706" />
                      <Text style={styles.activeTierLabel}>
                        {t("activeTier")}:
                      </Text>
                      <Text style={styles.activeTierRange}>
                        {activeSlab.from_day} - {activeSlab.to_day} {t("days")}
                      </Text>
                    </View>
                    <View style={styles.activePercentBadge}>
                      <Text style={styles.activePercentText}>
                        +{activeBonusPercent}%
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.noActiveTierRow}>
                    <Ionicons name="information-circle-outline" size={16} color="#B45309" />
                    <Text style={styles.noActiveTierText}>
                      {t("noActiveTier")} {currentDay}
                    </Text>
                  </View>
                )}
              </View>

              {/* Dynamic Live Calculations Grid */}
              <View style={styles.bonusMetricsGrid}>
                {/* 1. Bonus Cash Reward */}
                <View style={styles.bonusMetricCard}>
                  <View style={styles.metricIconLabelRow}>
                    <Ionicons name="cash-outline" size={14} color="#16A34A" />
                    <Text style={styles.bonusMetricLabel}>
                      {t("bonusReward")}
                    </Text>
                  </View>
                  <Text style={styles.bonusCashValue}>
                    +₹{bonusCalculations.bonusCash.toLocaleString("en-IN")}
                  </Text>
                  <Text style={styles.bonusMetricSub}>
                    {activeBonusPercent}% of ₹{Number(currentAmount).toLocaleString("en-IN")}
                  </Text>
                </View>

                {/* 2. Bonus Gold Weight */}
                <View style={styles.bonusMetricCard}>
                  <View style={styles.metricIconLabelRow}>
                    <FontAwesome5 name="coins" size={12} color="#D97706" />
                    <Text style={styles.bonusMetricLabel}>
                      {t("bonusGold")}
                    </Text>
                  </View>
                  <Text style={styles.bonusWeightValue}>
                    +{bonusCalculations.bonusWeight.toFixed(3)}g
                  </Text>
                  <Text style={styles.bonusMetricSub}>
                    @ ₹{(effectiveRate > 0 ? effectiveRate : goldRate).toLocaleString("en-IN")}/g
                  </Text>
                </View>
              </View>

              {/* Total Gold Credited Row */}
              <View style={styles.totalGoldRow}>
                <View style={styles.totalGoldLeft}>
                  <Text style={styles.totalGoldTitle}>
                    {t("totalGoldCredited")}
                  </Text>
                  <Text style={styles.totalGoldFormula}>
                    {`${t("base")}: ${bonusCalculations.baseWeight.toFixed(3)}g + ${t("bonus")}: ${bonusCalculations.bonusWeight.toFixed(3)}g`}
                  </Text>
                </View>
                <View style={styles.totalGoldBadge}>
                  <Text style={styles.totalGoldGrams}>
                    {bonusCalculations.totalWeight.toFixed(3)} g
                  </Text>
                </View>
              </View>

              {/* Day-Wise Slabs Breakdown Section */}
              {normalizedSlabs.length > 0 && (
                <View style={styles.slabsSectionContainer}>
                  <TouchableOpacity
                    style={styles.slabsToggleRow}
                    onPress={() => setShowAllSlabs((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="layers-outline" size={15} color="#92400E" />
                      <Text style={styles.slabsToggleText}>
                        {t("dayWiseBonusTiers")}
                      </Text>
                      <View style={styles.slabsCountPill}>
                        <Text style={styles.slabsCountText}>{normalizedSlabs.length}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={showAllSlabs ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#92400E"
                    />
                  </TouchableOpacity>

                  {showAllSlabs && (
                    <View style={styles.slabsTable}>
                      <View style={styles.slabsTableHeader}>
                        <Text style={[styles.slabsTableHeaderCell, { flex: 1.4 }]}>
                          {t("daysRange")}
                        </Text>
                        <Text style={[styles.slabsTableHeaderCell, { flex: 0.8, textAlign: "right" }]}>
                          {t("bonusPercentage")}
                        </Text>
                        <Text style={[styles.slabsTableHeaderCell, { flex: 0.8, textAlign: "right" }]}>
                          {t("tierStatus")}
                        </Text>
                      </View>

                      {normalizedSlabs.map((slab: any, idx: number) => {
                        const isCurrent = activeSlab && activeSlab.from_day === slab.from_day && activeSlab.to_day === slab.to_day;
                        const isPast = currentDay > slab.to_day;
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.slabsTableRow,
                              isCurrent && styles.slabsTableRowActive,
                              idx % 2 !== 0 && !isCurrent && styles.slabsTableRowAlt,
                            ]}
                          >
                            <View style={{ flex: 1.4, flexDirection: "row", alignItems: "center", gap: 4 }}>
                              {isCurrent && <Ionicons name="flame" size={14} color="#EA580C" />}
                              <Text
                                style={[
                                  styles.slabsTableCell,
                                  isCurrent && styles.slabsTableCellActive,
                                ]}
                              >
                                {slab.from_day} - {slab.to_day} {t("days")}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.slabsTableCell,
                                { flex: 0.8, textAlign: "right", color: "#16A34A", fontWeight: "700" },
                                isCurrent && { fontWeight: "900", color: "#15803D" },
                              ]}
                            >
                              +{slab.percentage}%
                            </Text>
                            <View style={{ flex: 0.8, alignItems: "flex-end" }}>
                              {isCurrent ? (
                                <View style={styles.currentTierTag}>
                                  <Text style={styles.currentTierTagText}>
                                    {t("tierActive")}
                                  </Text>
                                </View>
                              ) : isPast ? (
                                <Text style={styles.pastTierText}>
                                  {t("tierPast")}
                                </Text>
                              ) : (
                                <Text style={styles.upcomingTierText}>
                                  {t("tierUpcoming")}
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </LinearGradient>
          </View>
        )}

        {/* User Details Card */}
        <View style={styles.userDetailsCard}>
          <TouchableOpacity
            style={[
              styles.cardHeader,
              isUserDetailsExpanded ? styles.cardHeaderWithBorder : undefined,
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

        {/* Scheme / Bill / Booking Details Card */}
        {paymentType === 'bill' ? (
          <View style={styles.schemeDetailsCard}>
            <TouchableOpacity
              style={[
                styles.cardHeader,
                isSchemeDetailsExpanded ? styles.cardHeaderWithBorder : undefined,
              ]}
              onPress={toggleSchemeDetailsCard}
              activeOpacity={0.8}
            >
              <Ionicons
                name="receipt"
                size={24}
                color={theme.colors.secondary}
              />
              <Text style={styles.cardTitle}>Bill Details</Text>
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
                <Text style={styles.schemeDetailLabel}>Bill Number:</Text>
                <Text style={styles.schemeDetailValue}>{params.billNumber || "N/A"}</Text>
              </View>
              <View style={styles.schemeDetailsRow}>
                <Text style={styles.schemeDetailLabel}>Description:</Text>
                <Text style={styles.schemeDetailValue}>{params.description || "N/A"}</Text>
              </View>
              <View style={styles.schemeDetailsRow}>
                <Text style={styles.schemeDetailLabel}>Account Number:</Text>
                <Text style={styles.schemeDetailValue}>
                  {userDetails?.accountNo || userDetails?.accNo || "N/A"}
                </Text>
              </View>
            </Animated.View>
          </View>
        ) : paymentType === 'advance_booking' ? (
          <View style={styles.schemeDetailsCard}>
            <TouchableOpacity
              style={[
                styles.cardHeader,
                isSchemeDetailsExpanded ? styles.cardHeaderWithBorder : undefined,
              ]}
              onPress={toggleSchemeDetailsCard}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={theme.colors.secondary}
              />
              <Text style={styles.cardTitle}>Booking Details</Text>
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
                    outputRange: [0, 300],
                  }),
                  opacity: schemeDetailsHeight,
                },
              ]}
            >
              <View style={styles.schemeDetailsRow}>
                <Text style={styles.schemeDetailLabel}>Metal Type:</Text>
                <Text style={styles.schemeDetailValue}>{params.metalType || "N/A"}</Text>
              </View>
              <View style={styles.schemeDetailsRow}>
                <Text style={styles.schemeDetailLabel}>Booked Weight:</Text>
                <Text style={styles.schemeDetailValue}>{params.goldWeight || "0"} grams</Text>
              </View>
              <View style={styles.schemeDetailsRow}>
                <Text style={styles.schemeDetailLabel}>Rate Per Gram:</Text>
                <Text style={styles.schemeDetailValue}>₹{Number(params.ratePerGram || 0).toLocaleString("en-IN")}/g</Text>
              </View>
              <View style={styles.schemeDetailsRow}>
                <Text style={styles.schemeDetailLabel}>Total Metal Value:</Text>
                <Text style={styles.schemeDetailValue}>₹{Number(params.totalAmount || 0).toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.schemeDetailsRow}>
                <Text style={styles.schemeDetailLabel}>Booking Period:</Text>
                <Text style={styles.schemeDetailValue}>{params.bookingDays || "30"} Days</Text>
              </View>
              <View style={styles.schemeDetailsRow}>
                <Text style={styles.schemeDetailLabel}>Expiry Date:</Text>
                <Text style={styles.schemeDetailValue}>{params.expiryDate || "N/A"}</Text>
              </View>
              <View style={styles.schemeDetailsRow}>
                <Text style={styles.schemeDetailLabel}>Account Number:</Text>
                <Text style={styles.schemeDetailValue}>
                  {userDetails?.accountNo || userDetails?.accNo || "N/A"}
                </Text>
              </View>
            </Animated.View>
          </View>
        ) : (
          <View style={styles.schemeDetailsCard}>
            <TouchableOpacity
              style={[
                styles.cardHeader,
                isSchemeDetailsExpanded ? styles.cardHeaderWithBorder : undefined,
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
                    outputRange: [0, 400], // Increased height for more details
                  }),
                  opacity: schemeDetailsHeight,
                },
              ]}
            >
              <View style={styles.schemeDetailsRow}>
                <Text style={styles.schemeDetailLabel}>{t("accountNo")}:</Text>
                <Text style={styles.schemeDetailValue}>
                  {params.accNo || userDetails?.accNo || "N/A"}
                </Text>
              </View>

              {params.maturityDate && (
                <View style={styles.schemeDetailsRow}>
                  <Text style={styles.schemeDetailLabel}>{t("maturityDate")}:</Text>
                  <Text style={styles.schemeDetailValue}>{params.maturityDate}</Text>
                </View>
              )}

              {!isFlexi && !isHybrid && params.noOfIns && (
                <View style={styles.progressRowContainer}>
                  <View style={styles.schemeDetailsRow}>
                    <Text style={styles.schemeDetailLabel}>{t("installmentProgress")}:</Text>
                    <Text style={styles.schemeDetailValue}>
                      {params.paidPaymentCount || 0}/{params.noOfIns}
                    </Text>
                  </View>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              (Number(params.paidPaymentCount || 0) / Number(params.noOfIns)) * 100
                            )
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              {params.totalPaid && (
                <View style={styles.schemeDetailsRow}>
                  <Text style={styles.schemeDetailLabel}>{t("totalPaid")}:</Text>
                  <Text style={styles.schemeDetailValue}>
                    ₹{Number(params.totalPaid).toLocaleString("en-IN")}
                  </Text>
                </View>
              )}

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
              {!!branchName && (
                <View style={styles.schemeDetailsRow}>
                  <Text style={styles.schemeDetailLabel}>{t("branchName") || "Branch Name"}:</Text>
                  <Text style={styles.schemeDetailValue}>{branchName}</Text>
                </View>
              )}
            </Animated.View>
          </View>
        )}

        {/* Terms and Conditions */}

      </ScrollView>

      {/* Fixed Bottom Payment Card */}
      <View style={styles.fixedBottomCard}>
        <View style={styles.bottomCardContent}>
          {/* Terms Checkbox and Text */}
          <View style={styles.bottomTermsSection}>
            <TouchableOpacity
              style={styles.bottomTermsCheckbox}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                setIsTermsAccepted(!isTermsAccepted);
              }}
            >
              <MaterialCommunityIcons
                name={isTermsAccepted ? "checkbox-marked" : "checkbox-blank-outline"}
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
              !isTermsAccepted ? styles.bottomPaymentButtonDisabled : undefined,
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
                <Ionicons name="close" size={24} color={theme.colors.textDark} />
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

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelExit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exitModalContent}>
            <Text style={styles.exitModalTitle}>{t("leavePayment") || "Leave Payment?"}</Text>
            <Text style={styles.exitModalMessage}>
              {t("leavePaymentConfirmMessage") ||
                "Are you sure you want to leave the payment page? Your payment details will be lost."}
            </Text>
            <View style={styles.exitModalButtons}>
              <TouchableOpacity
                style={styles.exitModalCancelButton}
                onPress={handleCancelExit}
              >
                <Text style={styles.exitModalCancelButtonText}>{t("cancel") || "Cancel"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exitModalConfirmButton}
                onPress={handleConfirmExit}
              >
                <Text style={styles.exitModalConfirmButtonText}>{t("leave") || "Leave"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
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
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    amountHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    amountTitle: {
      fontSize: 16,
      color: theme.colors.secondary, // Keep gold for title or change to white if preferred
      marginLeft: 12,
      fontWeight: "600",
      flex: 1,
      letterSpacing: 0.5,
      textTransform: "uppercase",
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
      fontSize: 42,
      fontWeight: "800",
      color: theme.colors.white,
      textAlign: "center",
      fontVariant: ["tabular-nums"],
      textShadowColor: "rgba(0, 0, 0, 0.2)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    weightText: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginTop: 8,
      opacity: 0.9,
      fontWeight: "500",
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
      backgroundColor: theme.colors.white,
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
      color: theme.colors.textDark,
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
      backgroundColor: theme.colors.white,
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
      color: theme.colors.textDark,
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
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.colors.white,
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
      color: theme.colors.textDark,
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
      color: theme.colors.white, // Ensure white text on primary button
      fontSize: 16,
      fontWeight: "600",
    },
    editButton: {
      padding: 8,
      marginLeft: 8,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 20,
    },
    amountInput: {
      fontSize: 36,
      fontWeight: "bold",
      color: theme.colors.white,
      textAlign: "center",
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      minWidth: 160,
      borderWidth: 1,
      borderColor: theme.colors.secondary,
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
      backgroundColor: theme.colors.white,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.05)",
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
      backgroundColor: theme.colors.white,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.05)",
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
      backgroundColor: theme.colors.white,
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
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
    fixedBottomCard: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.white,
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
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
    exitModalContent: {
      backgroundColor: theme.colors.white,
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
      backgroundColor: theme.colors.white,
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
      color: theme.colors.textDark,
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
    timerBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fffbeb",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#fef3c7",
      gap: 8,
    },
    timerText: {
      fontSize: 14,
      color: "#78350f",
      fontWeight: "500",
    },
    timerCountdown: {
      fontWeight: "700",
      color: "#d97706",
    },
    progressRowContainer: {
      marginBottom: 16,
      width: "100%",
    },
    progressBarBackground: {
      width: "100%",
      height: 6,
      backgroundColor: "#e2e8f0",
      borderRadius: 3,
      marginTop: 6,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
    },
    // Bonus Benefit Card Styles
    bonusBenefitCard: {
      borderRadius: 20,
      marginBottom: 20,
      overflow: "hidden",
      borderWidth: 1.5,
      borderColor: "#F59E0B",
      shadowColor: "#D97706",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    bonusBenefitGradient: {
      padding: 18,
    },
    bonusHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    bonusTitleGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    bonusIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#FEF3C7",
      borderWidth: 1,
      borderColor: "#FCD34D",
      justifyContent: "center",
      alignItems: "center",
    },
    bonusMainTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#78350F",
    },
    bonusSubTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: "#92400E",
    },
    dayBadgePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#FEF3C7",
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#FCD34D",
    },
    dayBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#92400E",
    },
    activeTierBanner: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#FFFBEB",
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: "#FDE68A",
      marginBottom: 14,
    },
    activeTierLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
      flexWrap: "wrap",
    },
    activeTierLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: "#92400E",
    },
    activeTierRange: {
      fontSize: 13,
      fontWeight: "800",
      color: "#B45309",
    },
    activePercentBadge: {
      backgroundColor: "#16A34A",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    activePercentText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 13,
    },
    noActiveTierRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    noActiveTierText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#92400E",
    },
    bonusMetricsGrid: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    bonusMetricCard: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: "#FDE68A",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    metricIconLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 6,
    },
    bonusMetricLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: "#78350F",
    },
    bonusCashValue: {
      fontSize: 18,
      fontWeight: "800",
      color: "#16A34A",
      marginBottom: 2,
    },
    bonusWeightValue: {
      fontSize: 18,
      fontWeight: "800",
      color: "#D97706",
      marginBottom: 2,
    },
    bonusMetricSub: {
      fontSize: 11,
      color: "#9CA3AF",
    },
    totalGoldRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#78350F",
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 14,
    },
    totalGoldLeft: {
      flex: 1,
      marginRight: 10,
    },
    totalGoldTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#FEF3C7",
      marginBottom: 2,
    },
    totalGoldFormula: {
      fontSize: 11,
      color: "#FDE68A",
    },
    totalGoldBadge: {
      backgroundColor: "#F59E0B",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
    },
    totalGoldGrams: {
      fontSize: 15,
      fontWeight: "900",
      color: "#FFFFFF",
    },
    slabsSectionContainer: {
      marginTop: 2,
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#FDE68A",
    },
    slabsToggleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    slabsToggleText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#92400E",
    },
    slabsCountPill: {
      backgroundColor: "#FEF3C7",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FCD34D",
    },
    slabsCountText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#92400E",
    },
    slabsTable: {
      paddingHorizontal: 12,
      paddingBottom: 10,
    },
    slabsTableHeader: {
      flexDirection: "row",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#FDE68A",
      marginBottom: 4,
    },
    slabsTableHeaderCell: {
      fontSize: 11,
      fontWeight: "700",
      color: "#78350F",
      textTransform: "uppercase",
    },
    slabsTableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 7,
      paddingHorizontal: 6,
      borderRadius: 6,
    },
    slabsTableRowActive: {
      backgroundColor: "#FEF3C7",
      borderWidth: 1,
      borderColor: "#F59E0B",
    },
    slabsTableRowAlt: {
      backgroundColor: "rgba(254, 243, 199, 0.4)",
    },
    slabsTableCell: {
      fontSize: 12,
      color: "#4B5563",
    },
    slabsTableCellActive: {
      color: "#78350F",
      fontWeight: "800",
    },
    currentTierTag: {
      backgroundColor: "#EA580C",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    currentTierTagText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "800",
    },
    pastTierText: {
      fontSize: 11,
      color: "#9CA3AF",
      fontStyle: "italic",
    },
    upcomingTierText: {
      fontSize: 11,
      color: "#B45309",
    },
  })
}

var styles = getStyles(theme);;

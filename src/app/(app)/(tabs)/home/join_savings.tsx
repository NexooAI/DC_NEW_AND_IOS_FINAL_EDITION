import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  Animated,
  ImageBackground,
  Image,
  InteractionManager,
} from "react-native";
import { useKeyboardVisibility } from "@/hooks/useKeyboardVisibility";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import api from "@/services/api";
import { theme } from "@/constants/theme";
import RNPickerSelect from "react-native-picker-select";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "@/components/Alert";
import { formatGoldWeight } from "@/utils/imageUtils";
import ResponsiveButton from "@/components/ResponsiveButton";

import { logger } from "@/utils/logger";
const { width } = Dimensions.get("window");

// Add type definitions
interface KycDetails {
  doorno: string;
  street: string;
  area: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  dob: string;
  enternumber: string;
  nominee_name: string;
  nominee_relationship: string;
}

interface Branch {
  id: number;
  branch_name: string;
}

export default function JoinSavings() {
  const { t } = useTranslation();
  const { params } = useRoute();
  const { schemeId, step: stepParam, amount: amountParam, weight: weightParam, calculatedAmount: calculatedAmountParam, calculatedWeight: calculatedWeightParam } = useLocalSearchParams();
  const router = useRouter();
  const { language, user } = useGlobalStore();
  const { keyboardVisible } = useKeyboardVisibility();
  const insets = useSafeAreaInsets();

  // State for scheme data loaded from AsyncStorage
  const [schemeData, setSchemeData] = useState<any>(null);
  const [schemeDataLoading, setSchemeDataLoading] = useState(true);

  // Load scheme data from AsyncStorage on mount
  useEffect(() => {
    const loadSchemeData = async () => {
      try {
        setSchemeDataLoading(true);
        const storedSchemeData = await AsyncStorage.getItem(
          "@current_scheme_data"
        );

        if (storedSchemeData) {
          let parsedData;
          try {
            parsedData = JSON.parse(storedSchemeData);
          } catch (parseError) {
            logger.error("Error parsing stored scheme data:", parseError);
            // Fallback: try to fetch from API
            await fetchSchemeDataFromAPI();
            return;
          }

          //logger.log('Loaded scheme data from storage:', parsedData);

          // Verify that the stored data matches the current schemeId
          if (parsedData.schemeId.toString() === schemeId?.toString()) {
            setSchemeData(parsedData);
          } else {
            logger.warn("Stored scheme data does not match current schemeId");
            // Fallback: try to fetch from API
            await fetchSchemeDataFromAPI();
          }
        } else {
          logger.warn("No stored scheme data found");
          // Fallback: try to fetch from API
          await fetchSchemeDataFromAPI();
        }
      } catch (error) {
        logger.error("Error loading scheme data:", error);
        await fetchSchemeDataFromAPI();
      } finally {
        setSchemeDataLoading(false);
      }
    };

    const fetchSchemeDataFromAPI = async () => {
      try {
        //logger.log('Fetching scheme data from API for schemeId:', schemeId);
        // Add API call here if needed as fallback
        // For now, set a basic structure
        setSchemeData({
          schemeId: schemeId,
          name: "Gold Savings Scheme",
          description: "Save gold with our flexible plan.",
          type: "Monthly",
          chits: [],
          schemeType: "flexi",
          savingType: "amount", // Default to amount-based
          benefits: [
            "Competitive rates",
            "Flexible payments",
            "Zero making charges",
            "Free locker facility",
          ],
        });
      } catch (error) {
        logger.error("Error fetching scheme data from API:", error);
      }
    };

    if (schemeId) {
      loadSchemeData();
    }
  }, [schemeId]);

  // Parse schemeData from loaded data instead of query params
  const parsedData = useMemo(() => {
    return schemeData;
  }, [schemeData]);
  // Add selectedChit state
  const [selectedChit, setSelectedChit] = useState<any>(null);

  // Extract unique payment frequencies from parsedData.chits
  const paymentFrequencies: string[] = useMemo(() => {
    if (Array.isArray(parsedData?.chits)) {
      const freqs = parsedData.chits
        .map((chit: any) => chit.PAYMENT_FREQUENCY?.toLowerCase?.())
        .filter(Boolean);
      return Array.from(new Set(freqs)) as string[];
    }
    return [];
  }, [parsedData]);

  // State declarations - now only 3 steps
  // Initialize step from params if provided (for flexi schemes coming from calculator)
  // Track if user came from calculator (started at step 2)
  const [cameFromCalculator, setCameFromCalculator] = useState(false);
  const [step, setStepState] = useState(() => {
    const stepValue = Array.isArray(stepParam) ? stepParam[0] : stepParam;
    if (stepValue && !isNaN(Number(stepValue)) && Number(stepValue) === 2) {
      return Number(stepValue);
    }
    return 1;
  });

  // Wrapper function to prevent setting step to 1 if came from calculator
  const setStep = (newStep: number) => {
    if (cameFromCalculator && newStep === 1) {
      // Don't allow going back to step 1 if came from calculator
      return;
    }
    setStepState(newStep);
  };
  const [schemeType, setSchemeType] = useState(() => {
    // Set initial scheme type based on payment frequency or explicit scheme type
    if (parsedData?.schemeType === "flexi" || parsedData?.type?.toLowerCase() === "flexible" || parsedData?.type?.toLowerCase() === "flexi") {
      return "flexi";
    }

    const frequency = parsedData?.chits?.[0]?.PAYMENT_FREQUENCY?.toLowerCase();
    return frequency === "flexi" ? "flexi" : "fixed";
  });
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");
  const [amount, setAmount] = useState(0);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycDetails, setKycDetails] = useState<KycDetails | null>(null);
  const [isKycLoading, setIsKycLoading] = useState(true);
  const [branch, setBranch] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    amount: "",
    accountname: user?.name || "",
    associated_branch: "",
    name: "",
    mobile: "",
    email: "",
    address: "",
    pincode: "",
    nominee: "",
    pan: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({
    amount: "",
    accountname: "",
    associated_branch: "",
    name: "",
    email: "",
    mobile: "",
    pincode: "",
    pan: "",
    nominee: "",
  });
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("0");
  const [goldWeight, setGoldWeight] = useState(0);
  const [goldRate, setGoldRate] = useState(5847); // Default fallback


  // State for collapsible KYC cards
  const [addressExpanded, setAddressExpanded] = useState(false);
  const [idProofExpanded, setIdProofExpanded] = useState(false);

  // Animate chevron rotation when cards expand/collapse
  useEffect(() => {
    Animated.timing(addressChevronRotation, {
      toValue: addressExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [addressExpanded]);

  useEffect(() => {
    Animated.timing(idProofChevronRotation, {
      toValue: idProofExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [idProofExpanded]);

  // State for amount limits from API
  const [amountLimits, setAmountLimits] = useState<{
    min_amount: string;
    max_amount: string;
    quickselectedamount?: number[];
  } | null>(null);

  // Custom modal states
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [kycModalData, setKycModalData] = useState({
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
    buttons: [
      {
        text: "OK",
        onPress: () => { },
        style: "default" as "default" | "cancel" | "destructive",
      },
    ],
  });

  // Slider animation value
  const sliderValue = useRef(new Animated.Value(0)).current;
  const sliderWidth = useRef(0);
  const amountInputRef = useRef<TextInput>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const kycRedirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false); // Prevent multiple simultaneous navigations

  // Add this above the component return
  const goldIconOpacity = useRef(new Animated.Value(1)).current;

  // Animation values for collapsible cards
  const addressChevronRotation = useRef(new Animated.Value(0)).current;
  const idProofChevronRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(goldIconOpacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(goldIconOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [goldIconOpacity]);

  // Cleanup countdown timer and navigation ref on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (kycRedirectTimeoutRef.current) {
        clearTimeout(kycRedirectTimeoutRef.current);
        kycRedirectTimeoutRef.current = null;
      }
      isNavigatingRef.current = false; // Reset navigation flag on unmount
    };
  }, []);

  // Update amount when payment frequency changes
  // BUT: Don't reset if we have amount from calculator params
  useEffect(() => {
    // Check if we have amount from params (coming from calculator)
    const amountValue = Array.isArray(amountParam) ? amountParam[0] : amountParam;
    const calculatedAmountValue = Array.isArray(calculatedAmountParam) ? calculatedAmountParam[0] : calculatedAmountParam;
    const hasAmountFromParams = amountValue || calculatedAmountValue;

    // Only reset amount if we don't have amount from params
    if (!hasAmountFromParams) {
      const minAmount = getMinAmount();
      setAmount(minAmount);
      setInputValue(String(minAmount));
      handleChange("amount", String(minAmount));
      sliderValue.setValue(0);
    }
  }, [paymentFrequency, amountParam, calculatedAmountParam]);

  // When parsedData.chits changes, set default selectedChit
  useEffect(() => {
    if (Array.isArray(parsedData?.chits) && parsedData.chits.length > 0) {
      //logger.log(parsedData.chits[0]);
      setSelectedChit(parsedData.chits[0]);
    }
  }, [parsedData]);

  // Update getMinAmount, getMaxAmount, getStepAmount to use amountLimits first, then selectedChit
  const getMinAmount = () => {
    try {
      // Use amountLimits from API if available, otherwise fallback to selectedChit
      if (amountLimits?.min_amount) {
        const minAmt = Number(amountLimits.min_amount);
        if (!isNaN(minAmt) && minAmt >= 0) {
          return minAmt;
        }
      }
      const chitMin = selectedChit?.MIN_AMOUNT ? Number(selectedChit.MIN_AMOUNT) : 0;
      return !isNaN(chitMin) && chitMin >= 0 ? chitMin : 0;
    } catch (error) {
      logger.error("Error in getMinAmount:", error);
      return 0; // Safe fallback
    }
  };
  const getMaxAmount = () => {
    try {
      // Use amountLimits from API if available, otherwise fallback to selectedChit
      if (amountLimits?.max_amount) {
        const maxAmt = Number(amountLimits.max_amount);
        if (!isNaN(maxAmt) && maxAmt > 0) {
          return maxAmt;
        }
      }
      const chitMax = selectedChit?.MAX_AMOUNT ? Number(selectedChit.MAX_AMOUNT) : 100000;
      return !isNaN(chitMax) && chitMax > 0 ? chitMax : 100000;
    } catch (error) {
      logger.error("Error in getMaxAmount:", error);
      return 100000; // Safe fallback
    }
  };
  const getStepAmount = () => {
    try {
      const step = selectedChit?.STEP_AMOUNT ? Number(selectedChit.STEP_AMOUNT) : 100;
      return !isNaN(step) && step > 0 ? step : 100;
    } catch (error) {
      logger.error("Error in getStepAmount:", error);
      return 100; // Safe fallback
    }
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSliderChange = (value: number): void => {
    const minAmount = getMinAmount();
    const maxAmount = getMaxAmount();
    const step = getStepAmount();

    // Calculate the amount based on slider position
    let calculatedAmount = minAmount + (maxAmount - minAmount) * value;

    // Round to nearest step, but preserve exact min/max values
    let newAmount: number;
    if (Math.abs(calculatedAmount - minAmount) < 0.01) {
      // If very close to min, use exact min
      newAmount = minAmount;
    } else if (Math.abs(calculatedAmount - maxAmount) < 0.01) {
      // If very close to max, use exact max
      newAmount = maxAmount;
    } else {
      // Otherwise round to nearest step
      newAmount = Math.round(calculatedAmount / step) * step;
    }

    setAmount(newAmount);
    handleChange("amount", String(newAmount));
  };

  // Fetch branches
  useEffect(() => {
    const fetchBranche = async () => {
      try {
        const branches = await api.get(`/branches`);
        //logger.log("branches", branches.data.data);
        setBranch(branches.data.data);
        // Auto-select if only one branch
        if (branches.data.data.length === 1) {
          handleChange("associated_branch", String(branches.data.data[0].id));
        }
      } catch (error) {
        logger.error("Error fetching branches:", error);
      }
    };
    fetchBranche();
  }, []);

  // Fetch KYC status
  useFocusEffect(
    React.useCallback(() => {
      const fetchKycStatus = async () => {
        try {
          setIsKycLoading(true);
          const response = await api.get(`/kyc/status/${user?.id}`);
          if (response.data) {
            setKycStatus(response.data.kyc_status || "Not Completed");
            if (response.data.data) {
              setKycDetails(response.data.data);
            } else {
              setKycDetails(null);

              // Clear any existing redirect timeout
              if (kycRedirectTimeoutRef.current) {
                clearTimeout(kycRedirectTimeoutRef.current);
                kycRedirectTimeoutRef.current = null;
              }

              const navigateToKyc = () => {
                setKycModalVisible(false);
                // Clear timeout if user manually navigates
                if (kycRedirectTimeoutRef.current) {
                  clearTimeout(kycRedirectTimeoutRef.current);
                  kycRedirectTimeoutRef.current = null;
                }
                // Navigate to KYC page
                setTimeout(() => {
                  try {
                    router.replace("/(tabs)/home/kyc");
                    logger.log("Navigated to KYC page (mandatory)");
                  } catch (navError) {
                    logger.error("Error navigating to KYC page:", navError);
                  }
                }, 100);
              };

              setKycModalData({
                title: "KYC Required",
                message: "Please complete your KYC details to continue. Redirecting to KYC page in 2 seconds...",
                type: "error",
                buttons: [
                  {
                    text: "Go to KYC Now",
                    onPress: navigateToKyc,
                    style: "default"
                  }
                ],
              });
              setKycModalVisible(true);

              // Auto-redirect to KYC page after 2 seconds (mandatory)
              kycRedirectTimeoutRef.current = setTimeout(() => {
                navigateToKyc();
              }, 2000);
            }
          } else {
            logger.warn("No KYC data found");
            setKycStatus("Not Completed");
            setKycDetails(null);
          }
        } catch (error) {
          logger.error("Error fetching KYC status:", error);
          setKycModalData({
            title: "Error",
            message: "Unable to verify KYC status. Please try again.",
            type: "error",
            buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
          });
          setKycModalVisible(true);
        } finally {
          setIsKycLoading(false);
        }
      };

      fetchKycStatus();
    }, [user?.id])
  );

  const handleAmountInput = (text: string): void => {
    // Allow only numbers and remove leading zeros
    const numericValue = text.replace(/[^0-9]/g, "").replace(/^0+/, "") || "0";
    let newAmount = parseInt(numericValue, 10) || 0;
    const maxAmount = getMaxAmount();

    // First update input value
    setInputValue(numericValue);

    // Check if scheme is weight-based or amount-based
    const isWeightBased = parsedData?.savingType === "weight";
    const isFlexi = parsedData?.schemeType === "flexi" || parsedData?.type?.toLowerCase()?.includes("flexi");
    const allowWeightCalc = isWeightBased || isFlexi;

    // Handle empty input
    if (numericValue === "0") {
      setAmount(0);
      if (allowWeightCalc) {
        setGoldWeight(0);
      }
      handleChange("amount", "0");
      return;
    }

    // If amount exceeds max limit
    if (newAmount > maxAmount) {
      // Calculate gold weight for max amount (only if weight-based or flexi)
      const maxGoldWeight = allowWeightCalc ? calculateGoldWeight(maxAmount) : 0;

      // Update all values to max (no alert during typing, validation on Next click)
      setInputValue(String(maxAmount));
      setAmount(maxAmount);
      if (allowWeightCalc) {
        setGoldWeight(maxGoldWeight);
      }
      handleChange("amount", String(maxAmount));

      // Update slider position for max amount
      const minAmount = getMinAmount();
      const sliderPosition = (maxAmount - minAmount) / (maxAmount - minAmount);
      sliderValue.setValue(sliderPosition);
      return;
    }

    // Update amount and gold weight
    // Don't clamp below min during typing - let validation catch it on Next click
    // Only clamp above max to prevent exceeding maximum
    const minAmount = getMinAmount();
    const validAmount = Math.min(maxAmount, newAmount);

    // Calculate exact gold weight for the amount (only if weight-based or flexi)
    const exactGoldWeight = allowWeightCalc ? calculateGoldWeight(validAmount) : 0;

    setAmount(validAmount);
    if (allowWeightCalc) {
      setGoldWeight(exactGoldWeight);
    }
    handleChange("amount", String(validAmount));

    // Update slider position (handle case where amount might be below min)
    const clampedAmountForSlider = Math.max(minAmount, Math.min(maxAmount, validAmount));
    const sliderPosition = (clampedAmountForSlider - minAmount) / (maxAmount - minAmount);
    sliderValue.setValue(Math.max(0, Math.min(1, sliderPosition)));
  };

  const handleAmountSubmit = () => {
    const minAmount = getMinAmount();
    const maxAmount = getMaxAmount();
    const step = getStepAmount();

    // Don't round if amount is exactly at min or max - allow exact values
    let finalAmount = amount;

    // Only round if amount is not at boundaries and not already a step multiple
    if (amount !== minAmount && amount !== maxAmount) {
      const roundedAmount = Math.round(amount / step) * step;
      // Only apply rounding if it doesn't push us outside bounds
      if (roundedAmount >= minAmount && roundedAmount <= maxAmount) {
        finalAmount = roundedAmount;
      }
    }

    // Only clamp above max, don't clamp below min (let validation handle it)
    finalAmount = Math.min(maxAmount, finalAmount);

    setAmount(finalAmount);
    setInputValue(
      finalAmount === 0 ? "0" : String(finalAmount).replace(/^0+/, "")
    );
    handleChange("amount", String(finalAmount));
    // Only calculate gold weight if it's a weight-based scheme or flexi
    const isWeightBased = parsedData?.savingType === "weight";
    const isFlexi = parsedData?.schemeType === "flexi" || parsedData?.type?.toLowerCase()?.includes("flexi");
    const allowWeightCalc = isWeightBased || isFlexi;
    
    if (allowWeightCalc) {
      setGoldWeight(calculateGoldWeight(finalAmount));
    }

    // Update slider position (handle case where amount might be below min)
    const clampedAmountForSlider = Math.max(minAmount, Math.min(maxAmount, finalAmount));
    const sliderPosition = (clampedAmountForSlider - minAmount) / (maxAmount - minAmount);
    sliderValue.setValue(Math.max(0, Math.min(1, sliderPosition)));
  };

  const calculateGoldWeight = (amt: number) => {
    const weight = amt / goldRate;
    // Return the raw number for calculations, formatting will be done when displaying
    return weight;
  };

  const calculateAmount = (weight: number) => {
    return Math.round(weight * goldRate);
  };

  const handleGoldWeightInput = (text: string) => {
    // Allow only numbers and one decimal point
    const numericValue = text.replace(/[^0-9.]/g, "");
    const weight = parseFloat(numericValue) || 0;
    const maxAmount = getMaxAmount();

    // Calculate exact amount for the weight
    const calculatedAmount = calculateAmount(weight);

    // If amount would exceed max limit
    if (calculatedAmount > maxAmount) {
      // Calculate max allowed weight based on current gold rate
      const maxWeight = calculateGoldWeight(maxAmount);

      // Update all values to maximum allowed (no alert during typing, validation on Next click)
      setGoldWeight(maxWeight);
      setAmount(maxAmount);
      setInputValue(String(maxAmount));
      handleChange("amount", String(maxAmount));

      // Update slider position for max amount
      const minAmount = getMinAmount();
      const sliderPosition = (maxAmount - minAmount) / (maxAmount - minAmount);
      sliderValue.setValue(sliderPosition);
      return;
    }

    // Update with exact values
    setGoldWeight(weight);
    setAmount(calculatedAmount);
    setInputValue(String(calculatedAmount));
    handleChange("amount", String(calculatedAmount));

    // Update slider position
    const minAmount = getMinAmount();
    const sliderPosition =
      (calculatedAmount - minAmount) / (maxAmount - minAmount);
    sliderValue.setValue(sliderPosition);
  };

  // Handle amount increment (by 100)
  const handleAmountIncrement = () => {
    const minAmount = getMinAmount();
    const maxAmount = getMaxAmount();
    const newAmount = Math.min(maxAmount, Math.max(minAmount, amount + 100));

    setAmount(newAmount);
    setInputValue(String(newAmount));
    handleChange("amount", String(newAmount));

    // Update gold weight if weight-based or flexi
    const isWeightBased = parsedData?.savingType === "weight";
    const isFlexi = parsedData?.schemeType === "flexi" || parsedData?.type?.toLowerCase()?.includes("flexi");
    const allowWeightCalc = isWeightBased || isFlexi;

    if (allowWeightCalc && goldRate > 0) {
      setGoldWeight(calculateGoldWeight(newAmount));
    }

    // Update slider position
    const sliderPosition = (newAmount - minAmount) / (maxAmount - minAmount);
    sliderValue.setValue(Math.max(0, Math.min(1, sliderPosition)));
  };

  // Handle amount decrement (by 100)
  const handleAmountDecrement = () => {
    const minAmount = getMinAmount();
    const newAmount = Math.max(minAmount, amount - 100);

    setAmount(newAmount);
    setInputValue(String(newAmount));
    handleChange("amount", String(newAmount));

    // Update gold weight if weight-based or flexi
    const isWeightBased = parsedData?.savingType === "weight";
    const isFlexi = parsedData?.schemeType === "flexi" || parsedData?.type?.toLowerCase()?.includes("flexi");
    const allowWeightCalc = isWeightBased || isFlexi;

    if (allowWeightCalc && goldRate > 0) {
      setGoldWeight(calculateGoldWeight(newAmount));
    }

    // Update slider position
    const maxAmount = getMaxAmount();
    const sliderPosition = (newAmount - minAmount) / (maxAmount - minAmount);
    sliderValue.setValue(Math.max(0, Math.min(1, sliderPosition)));
  };

  // Handle gold weight increment (by 0.1g = 100ml)
  const handleGoldWeightIncrement = () => {
    const maxAmount = getMaxAmount();
    const newWeight = goldWeight + 0.1;
    const calculatedAmount = calculateAmount(newWeight);

    // Check if calculated amount exceeds max
    if (calculatedAmount > maxAmount) {
      const maxWeight = calculateGoldWeight(maxAmount);
      setGoldWeight(maxWeight);
      setAmount(maxAmount);
      setInputValue(String(maxAmount));
      handleChange("amount", String(maxAmount));
    } else {
      setGoldWeight(newWeight);
      setAmount(calculatedAmount);
      setInputValue(String(calculatedAmount));
      handleChange("amount", String(calculatedAmount));
    }

    // Update slider position
    const minAmount = getMinAmount();
    const finalAmount = Math.min(maxAmount, calculatedAmount);
    const sliderPosition = (finalAmount - minAmount) / (maxAmount - minAmount);
    sliderValue.setValue(Math.max(0, Math.min(1, sliderPosition)));
  };

  // Handle gold weight decrement (by 0.1g = 100ml)
  const handleGoldWeightDecrement = () => {
    const newWeight = Math.max(0, goldWeight - 0.1);
    const calculatedAmount = calculateAmount(newWeight);
    const minAmount = getMinAmount();

    // Ensure amount doesn't go below minimum
    if (calculatedAmount < minAmount) {
      const minWeight = calculateGoldWeight(minAmount);
      setGoldWeight(minWeight);
      setAmount(minAmount);
      setInputValue(String(minAmount));
      handleChange("amount", String(minAmount));
    } else {
      setGoldWeight(newWeight);
      setAmount(calculatedAmount);
      setInputValue(String(calculatedAmount));
      handleChange("amount", String(calculatedAmount));
    }

    // Update slider position
    const maxAmount = getMaxAmount();
    const finalAmount = Math.max(minAmount, calculatedAmount);
    const sliderPosition = (finalAmount - minAmount) / (maxAmount - minAmount);
    sliderValue.setValue(Math.max(0, Math.min(1, sliderPosition)));
  };

  const translations = useMemo(
    () => ({
      title: t("digiGoldTitle"),
      digiGoldTitle: t("digiGoldTitle"),
      amountPlaceholder: t("monthlyAmount"),
      projectedReturns: t("projectedReturnsYear"),
      projectedReturnsYear: t("projectedReturnsYear"),
      returnRateDetail: t("returnRateDetail"),
      fullName: t("fullName"),
      fullNamePlaceholder: t("fullNamePlaceholder"),
      mobileNumber: t("mobileNumber"),
      mobilePlaceholder: t("mobilePlaceholder"),
      emailAddress: t("emailAddress"),
      emailPlaceholder: t("emailPlaceholder"),
      address: t("address"),
      addressPlaceholder: t("addressPlaceholder"),
      pincode: t("pincode"),
      pincodePlaceholder: t("pincodePlaceholder"),
      nomineeName: t("nomineeName"),
      nomineePlaceholder: t("nomineePlaceholder"),
      panNumber: t("panNumber"),
      panPlaceholder: t("panPlaceholder"),
      next: t("next"),
      previous: t("previous"),
      submit: t("submit"),
      minAmountError: t("minAmountError"),
      invalidEmail: t("invalidEmail"),
      invalidMobile: t("invalidMobile"),
      invalidPincode: t("invalidPincode"),
      invalidPan: t("invalidPan"),
      monthlyAmount: t("monthlyAmount"),
      mobileSummary: t("mobile"),
      emailSummary: t("email"),
      panSummary: t("pan"),
      nomineeSummary: t("nominee"),
      successTitle: t("successTitle"),
      successMessage: t("successMessage"),
      confirmAndJoin: t("confirmAndJoin"),
      amountInRupees: t("amountInRupees"),
      quickSelect: t("quickSelect"),
      accountDetails: t("accountDetails"),
      accountHolderName: t("accountHolderName"),
      useMyLoginName: t("useMyLoginName"),
      branchName: t("branchName"),
      savingSummary: t("savingSummary"),
      schemeType: t("schemeType"),
      fixedAmount: t("fixedAmount"),
      flexiAmount: t("flexiAmount"),
      kycDetails: t("kycDetails"),
      addressDetails: t("addressDetails"),
      idProof: t("idProof"),
      nominee: t("nominee"),
      details: t("details"),
      summary: t("summary"),
      goldWeight: t("goldWeight"),
      goldLabel: t("goldLabel"),
      goldSymbol: t("goldSymbol"),
      goldRateToday: t("goldRateToday"),
      loadingScheme: t("loadingScheme"),
      loadingSchemeDetails: t("loadingSchemeDetails"),
      error: t("error"),
      failedToLoadSchemeDetails: t("failedToLoadSchemeDetails"),
      goBack: t("goBack"),
      loadingKycStatus: t("loadingKycStatus"),
      useLoginName: t("useMyLoginName"),
      branch: t("branchName"),
      gold: t("gold"),
      amount: t("amount"),
      paymentFrequency: t("paymentFrequency"),
      schemeName: t("schemeName"),
      // Add more as needed
    }),
    [language]
  );


  const calculateReturns = (amount: number): number => {
    const monthlyAmount = parseFloat(String(amount)) || 0;
    const annualRate = 0.12;
    const years = 1;
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    const futureValue =
      (monthlyAmount * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate;
    return Math.round(futureValue);
  };

  const validate = (field: keyof typeof formData, value: string): boolean => {
    const newErrors = { ...errors };

    switch (field) {
      case "amount":
        const minAmount = getMinAmount();
        const maxAmount = getMaxAmount();
        const numValue = Number(value);
        // Use <= and >= to allow exact min and max amounts (no rounding)
        newErrors.amount = !value
          ? "Amount is required"
          : numValue < minAmount
            ? `Minimum amount should be ₹${minAmount.toLocaleString("en-IN")}`
            : numValue > maxAmount
              ? `Maximum amount should be ₹${maxAmount.toLocaleString("en-IN")}`
              : "";
        break;
      case "name":
        newErrors.name = !value.trim() ? "Full Name is required" : "";
        break;
      case "email":
        newErrors.email = !value
          ? "Email is required"
          : !/\S+@\S+\.\S+/.test(value)
            ? translations.invalidEmail
            : "";
        break;
      case "mobile":
        newErrors.mobile = !value
          ? "Mobile number is required"
          : !/^[6-9]\d{9}$/.test(value)
            ? translations.invalidMobile
            : "";
        break;
      case "pan":
        newErrors.pan = !value
          ? "PAN is required"
          : !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value)
            ? translations.invalidPan
            : "";
        break;
      case "nominee":
        newErrors.nominee = !value.trim() ? "Nominee Name is required" : "";
        break;
      case "accountname":
        newErrors.accountname = !value.trim() ? "Account Name is required" : "";
        break;
      case "associated_branch":
        newErrors.associated_branch = !value
          ? "Associated Branch is required"
          : "";
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  // Comprehensive validation function for all fields
  const validateAllFields = (): boolean => {
    const fieldsToValidate: (keyof typeof formData)[] = [
      "amount",
      "name",
      "email",
      "mobile",
      "pan",
      "nominee",
      "accountname",
      "associated_branch",
    ];

    let allValid = true;
    const errorMessages: string[] = [];

    fieldsToValidate.forEach((field) => {
      const isValid = validate(field, formData[field]);
      if (!isValid && errors[field]) {
        errorMessages.push(errors[field]);
        allValid = false;
      }
    });

    if (!allValid) {
      setKycModalData({
        title: "Validation Error",
        message: errorMessages.join("\n"),
        type: "error",
        buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
      });
      setKycModalVisible(true);
    }

    return allValid;
  };

  const handleChange = (field: keyof typeof formData, value: string): void => {
    setFormData({ ...formData, [field]: value });
    // Validate but don't show alerts during typing
    // Alerts will only be shown when clicking "Next" button
    validate(field, value);
  };

  const renderGoldRateArea = () => (
    <View style={styles.progressHeader}>
      <View
        style={[styles.goldRateCard, step > 1 && styles.selectedGoldRateCard]}
      >
        <Animated.View
          style={[styles.goldRateIcon, { opacity: goldIconOpacity }]}
        >
          <MaterialCommunityIcons name="gold" size={20} color="#FFC857" />
        </Animated.View>
        <View style={styles.goldRateContent}>
          <Text style={styles.goldRateLabel}>
            Today's Gold Rate: <Text style={styles.goldRateValue}>
              ₹{goldRate.toLocaleString("en-IN")}/gram
            </Text>
          </Text>
        </View>
        {step > 1 && (
          <View style={styles.selectedAmountBadge}>
            <Text style={styles.selectedAmountText}>
              {formatAmount(amount)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressWrapper}>
        {[1, 2].map((num) => {
          // Disable step 1 if user came from calculator
          const isDisabled = num > step || (cameFromCalculator && num === 1);
          const isActive = step >= num;
          const isCurrent = step === num;
          const isLocked = num > step || (cameFromCalculator && num === 1);

          return (
            <React.Fragment key={num}>
              <TouchableOpacity
                style={[
                  styles.progressStepCard,
                  isCurrent && styles.progressStepCardActive,
                  isActive && !isLocked && styles.progressStepCardCompleted,
                  isLocked && styles.progressStepCardLocked,
                ]}
                onPress={() => {
                  // Prevent going to step 1 if came from calculator
                  if (cameFromCalculator && num === 1) {
                    return;
                  }
                  if (num <= step) {
                    setStep(num);
                  }
                }}
                disabled={isDisabled}
                activeOpacity={0.8}
              >
                <View style={styles.progressStepInner}>
                  {/* Step Badge */}
                  <View
                    style={[
                      styles.progressBadge,
                      isCurrent && styles.progressBadgeActive,
                      isActive && !isCurrent && !isLocked && styles.progressBadgeCompleted,
                      isLocked && styles.progressBadgeLocked,
                    ]}
                  >
                    {isLocked ? (
                      <Ionicons
                        name="lock-closed"
                        size={12}
                        color={theme.colors.primary}
                      />
                    ) : isActive && !isCurrent ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={theme.colors.black}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.progressBadgeText,
                          isCurrent && styles.progressBadgeTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    )}
                  </View>

                  {/* Step Label */}
                  <Text
                    style={[
                      styles.progressStepLabel,
                      isCurrent && styles.progressStepLabelActive,
                      isActive && !isCurrent && !isLocked && styles.progressStepLabelCompleted,
                      isLocked && styles.progressStepLabelLocked,
                    ]}
                  >
                    {num === 1 ? "Amount" : "Details & Summary"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Progress Connector (between steps) */}
              {num < 2 && (
                <View style={styles.progressConnector}>
                  <View
                    style={[
                      styles.progressConnectorLine,
                      step > num && styles.progressConnectorLineActive,
                    ]}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );

  // Step 1 (originally step 2) - Amount selection
  // const renderStep1 = () => {
  //   const minAmount = getMinAmount();
  //   const maxAmount = getMaxAmount();

  //   // Check if scheme is weight-based or amount-based
  //   const isWeightBased = parsedData?.weightBased === "weight";
  //   const showWeightInput = isWeightBased;

  //   // Get quick amounts from API if available, otherwise use default
  //   let quickAmounts: number[] = [];

  //   try {
  //     // Validate amountLimits and quickselectedamount before using
  //     if (
  //       amountLimits &&
  //       amountLimits.quickselectedamount &&
  //       Array.isArray(amountLimits.quickselectedamount) &&
  //       amountLimits.quickselectedamount.length > 0
  //     ) {
  //       // Use quick amounts from API, filter to be within min/max range
  //       // Additional validation: ensure all values are valid numbers
  //       quickAmounts = amountLimits.quickselectedamount
  //         .filter((amt: any) => {
  //           const numAmt = Number(amt);
  //           return !isNaN(numAmt) && numAmt > 0 && numAmt >= minAmount && numAmt <= maxAmount;
  //         })
  //         .map((amt: any) => Number(amt))
  //         .sort((a, b) => a - b);

  //       // Always include max amount if not already in the list and it's valid
  //       if (maxAmount > 0 && !quickAmounts.includes(maxAmount)) {
  //         quickAmounts.push(maxAmount);
  //       }

  //       logger.log("Using quick amounts from API:", quickAmounts);
  //     } else {
  //       // Fallback to default quick amounts
  //       const baseQuickAmounts =
  //         paymentFrequency === "monthly"
  //           ? [500, 1000, 2000, 5000, 10000, 20000, 50000, 75000]
  //           : [100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 75000];

  //       // Filter out amounts greater than max, remove duplicates, then add max amount at the end
  //       const filteredAmounts = baseQuickAmounts.filter(amt => amt <= maxAmount && amt >= minAmount);
  //       quickAmounts = filteredAmounts.includes(maxAmount)
  //         ? filteredAmounts
  //         : [...filteredAmounts, maxAmount]; // Always include the maximum allowed amount

  //       logger.log("Using default quick amounts:", quickAmounts);
  //     }
  //   } catch (error) {
  //     logger.error("Error processing quick amounts:", error);
  //     // Fallback to safe default
  //     const baseQuickAmounts = [100, 500, 1000, 2000, 5000, 10000];
  //     quickAmounts = baseQuickAmounts.filter(amt => amt <= maxAmount && amt >= minAmount);
  //     if (maxAmount > 0 && !quickAmounts.includes(maxAmount)) {
  //       quickAmounts.push(maxAmount);
  //     }
  //   }

  //   return (
  //     <TouchableWithoutFeedback onPress={handleOutsideClick}>
  //       <View style={styles.stepContainer}>
  //         <View style={[
  //           styles.dualInputContainer,
  //           !showWeightInput && styles.singleInputContainer,
  //           { alignItems: "stretch" }
  //         ]}>
  //           {/* Amount Input Side */}
  //           <View style={[
  //             styles.inputSide,
  //             styles.amountCardLite,
  //             !showWeightInput && styles.fullWidthInput
  //           ]}>
  //             <Image
  //               source={require("../../../../../assets/images/rupee-bg.png")}
  //               style={styles.amountCardBgImage}
  //               resizeMode="contain"
  //             />
  //             <Text style={styles.label}>{translations.amountInRupees}</Text>
  //             <View style={styles.amountDisplayContainer}>
  //               {isTyping ? (
  //                 <View style={styles.amountInputContainer}>
  //                   <Text style={styles.currencySymbol}>₹</Text>
  //                   <TextInput
  //                     style={styles.amountInput}
  //                     value={inputValue}
  //                     onChangeText={handleAmountInput}
  //                     keyboardType="numeric"
  //                     onFocus={() => setIsTyping(true)}
  //                     onBlur={() => {
  //                       setIsTyping(false);
  //                       handleAmountSubmit();
  //                     }}
  //                     autoFocus
  //                     maxLength={8}
  //                     placeholder="0"
  //                     placeholderTextColor="rgba(255, 255, 255, 0.5)"
  //                     ref={amountInputRef}
  //                   />
  //                 </View>
  //               ) : (
  //                 <TouchableOpacity
  //                   onPress={() => {
  //                     setIsTyping(true);
  //                     setInputValue(String(amount));
  //                   }}
  //                   style={styles.amountValueContainer}
  //                 >
  //                   <Text style={styles.amountValue}>
  //                     {formatAmount(amount)}
  //                   </Text>
  //                   <Ionicons
  //                     name="pencil"
  //                     size={20}
  //                     color="red"
  //                     style={styles.editIcon}
  //                   />
  //                 </TouchableOpacity>
  //               )}
  //             </View>
  //           </View>

  //           {/* Divider - Only show if weight input is visible */}
  //           {showWeightInput && (
  //             <View style={styles.calculationDivider}>
  //               <Ionicons
  //                 name="swap-horizontal"
  //                 size={20}
  //                 color="#FFC857"
  //                 style={{ opacity: 0.9 }}
  //               />
  //             </View>
  //           )}

  //           {/* Gold Weight Input Side - Only show if weight-based scheme */}
  //           {showWeightInput && (
  //             <View style={[styles.inputSide, styles.goldCard]}>
  //               <View style={styles.goldShine} />
  //               <Text style={styles.goldLabel}>{translations.goldWeight}</Text>
  //               <View style={styles.amountDisplayContainer}>
  //                 <View style={styles.goldInputContainer}>
  //                   <TextInput
  //                     style={styles.goldInput}
  //                     value={formatGoldWeight(goldWeight).replace(" g", "")}
  //                     onChangeText={handleGoldWeightInput}
  //                     keyboardType="decimal-pad"
  //                     maxLength={6}
  //                     placeholder="0.000"
  //                     placeholderTextColor="#99999980"
  //                   />
  //                   <Text style={styles.goldSymbol}>g</Text>
  //                 </View>
  //               </View>
  //             </View>
  //           )}
  //         </View>
  //         <View>
  //           <Text style={{ fontSize: 12, color: "#666", textAlign: "center" }}>
  //             Amount Range: Minimum ₹{minAmount.toLocaleString("en-IN")} Maximum ₹{maxAmount.toLocaleString("en-IN")}
  //           </Text>
  //         </View>
  //         <View style={styles.quickAmountContainer}>
  //           <Text style={styles.quickAmountLabel}>
  //             {translations.quickSelect}
  //           </Text>
  //           <View style={styles.quickAmountGrid}>
  //             {quickAmounts.map((quickAmount) => {
  //               // Check if current amount is close to this quick amount (within 1 rupee tolerance)
  //               const isSelected = Math.abs(amount - quickAmount) < 1;

  //               return (
  //                 <TouchableOpacity
  //                   key={quickAmount}
  //                   style={[
  //                     styles.quickAmountButton,
  //                     isSelected && styles.selectedQuickAmountButton,
  //                   ]}
  //                   onPress={() => {
  //                     const newValue =
  //                       (quickAmount - minAmount) / (maxAmount - minAmount);
  //                     sliderValue.setValue(newValue);
  //                     setAmount(quickAmount);
  //                     // Only calculate gold weight if it's a weight-based scheme
  //                     if (showWeightInput) {
  //                       setGoldWeight(calculateGoldWeight(quickAmount));
  //                     }
  //                     setInputValue(String(quickAmount));
  //                     handleChange("amount", String(quickAmount));
  //                     // Remove input focus when quick select is clicked
  //                     handleOutsideClick();
  //                   }}
  //                 >
  //                   <Text
  //                     style={[
  //                       styles.quickAmountText,
  //                       isSelected && styles.selectedQuickAmountText,
  //                     ]}
  //                   >
  //                     ₹{quickAmount.toLocaleString("en-IN")}
  //                   </Text>
  //                 </TouchableOpacity>
  //               );
  //             })}
  //           </View>
  //         </View>

  //         {errors.amount && (
  //           <Text style={styles.errorText}>{errors.amount}</Text>
  //         )}
  //       </View>
  //     </TouchableWithoutFeedback>
  //   );
  // };
  const renderStep1 = () => {
    const minAmount = getMinAmount();
    const maxAmount = getMaxAmount();

    // Check if scheme is weight-based or amount-based
    const isWeightBased = parsedData?.savingType === "weight";
    const isFlexi = parsedData?.schemeType === "flexi" || parsedData?.type?.toLowerCase()?.includes("flexi");
    const showWeightInput = isWeightBased || isFlexi;

    // Get quick amounts from API if available, otherwise use default
    let quickAmounts: number[] = [];

    try {
      // Validate amountLimits and quickselectedamount before using
      if (
        amountLimits &&
        amountLimits.quickselectedamount &&
        Array.isArray(amountLimits.quickselectedamount) &&
        amountLimits.quickselectedamount.length > 0
      ) {
        // Use quick amounts from API, filter to be within min/max range
        // Additional validation: ensure all values are valid numbers
        quickAmounts = amountLimits.quickselectedamount
          .filter((amt: any) => {
            const numAmt = Number(amt);
            return !isNaN(numAmt) && numAmt > 0 && numAmt >= minAmount && numAmt <= maxAmount;
          })
          .map((amt: any) => Number(amt))
          .sort((a, b) => a - b);

        // Always include max amount if not already in the list and it's valid
        if (maxAmount > 0 && !quickAmounts.includes(maxAmount)) {
          quickAmounts.push(maxAmount);
        }

        logger.log("Using quick amounts from API:", quickAmounts);
      } else {
        // Fallback to default quick amounts
        const baseQuickAmounts =
          paymentFrequency === "monthly"
            ? [500, 1000, 2000, 5000, 10000, 20000, 50000, 75000]
            : [100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 75000];

        // Filter out amounts greater than max, remove duplicates, then add max amount at the end
        const filteredAmounts = baseQuickAmounts.filter(amt => amt <= maxAmount && amt >= minAmount);
        quickAmounts = filteredAmounts.includes(maxAmount)
          ? filteredAmounts
          : [...filteredAmounts, maxAmount]; // Always include the maximum allowed amount

        logger.log("Using default quick amounts:", quickAmounts);
      }
    } catch (error) {
      logger.error("Error processing quick amounts:", error);
      // Fallback to safe default
      const baseQuickAmounts = [100, 500, 1000, 2000, 5000, 10000];
      quickAmounts = baseQuickAmounts.filter(amt => amt <= maxAmount && amt >= minAmount);
      if (maxAmount > 0 && !quickAmounts.includes(maxAmount)) {
        quickAmounts.push(maxAmount);
      }
    }

    return (
      <TouchableWithoutFeedback onPress={handleOutsideClick}>
        <View style={styles.stepContainer}>
          {/* Header with Range Info */}
          <View style={styles.rangeInfoContainer}>
            <View style={styles.rangePill}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={styles.rangeText}>
                ₹{minAmount.toLocaleString("en-IN")} - ₹{maxAmount.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>

          {/* Main Input Cards - Zigzag Layout */}
          <View style={styles.zigzagContainer}>
            {/* Amount Input Card - 1st Row, 70% width, left-aligned */}
            <View style={styles.amountCardRow}>
              {/* Horizontal Line Behind Amount Card */}
              <View style={styles.horizontalLineAmount} />
              <View style={[
                styles.inputCard,
                styles.amountCard,
                styles.zigzagCardLeft,
                !showWeightInput && styles.zigzagCardCenter
              ]}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleWithIcon}>
                    <Ionicons name="cash-outline" size={width < 350 ? 14 : 16} color="#FFD700" />
                    <Text style={[styles.cardTitle, { color: '#FFF' }]}>{translations.amountInRupees}</Text>
                  </View>
                  <View style={styles.amountBadge}>
                    <Text style={styles.amountBadgeText}>INR</Text>
                  </View>
                </View>

                <View style={styles.amountInputMain}>
                  <View style={styles.amountInputWithButtons}>
                    {isTyping ? (
                      <View style={styles.amountInputWrapper}>
                        <Text style={styles.currencySymbolLarge}>₹</Text>
                        <TextInput
                          style={styles.amountInputLarge}
                          value={inputValue}
                          onChangeText={handleAmountInput}
                          keyboardType="numeric"
                          onFocus={() => setIsTyping(true)}
                          onBlur={() => {
                            setIsTyping(false);
                            handleAmountSubmit();
                          }}
                          autoFocus
                          maxLength={8}
                          placeholder="0"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          ref={amountInputRef}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setIsTyping(true);
                          setInputValue(String(amount));
                        }}
                        style={styles.amountDisplay}
                      >
                        <Text style={styles.amountDisplayText}>
                          {formatAmount(amount)}
                        </Text>
                        <View style={styles.editButton}>
                          <Ionicons name="create-outline" size={width < 350 ? 14 : 16} color="#FFD700" />
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* Increment/Decrement Buttons - Right Side */}
                    <View style={styles.amountButtonsContainer}>
                      <TouchableOpacity
                        style={styles.incrementButton}
                        onPress={handleAmountIncrement}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={width < 350 ? 14 : 16} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.decrementButton}
                        onPress={handleAmountDecrement}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="remove" size={width < 350 ? 14 : 16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.hintText}>Tap to edit amount</Text>
                </View>
              </View>

            </View>

            {/* L-Shaped Arrow Connecting Amount Card to Gold Card */}
            {showWeightInput && (
              <View style={styles.lArrowContainer}>
                {/* Vertical line down from amount card - starts at card bottom */}
                <View style={styles.lArrowVertical}>
                  <View style={styles.lArrowVerticalLineDown} />
                  <View style={styles.lArrowDownIcon}>
                    <Ionicons name="arrow-down" size={width < 350 ? 12 : 14} color="#FFD700" />
                  </View>
                </View>

                {/* Horizontal line connecting the two cards */}
                <View style={styles.lArrowHorizontal}>
                  <View style={styles.lArrowHorizontalLine} />
                </View>

                {/* Vertical line up to gold card - ends at card top */}
                <View style={styles.lArrowVerticalUp}>
                  <View style={styles.lArrowUpIcon}>
                    <Ionicons name="arrow-up" size={width < 350 ? 12 : 14} color="#FF8F00" />
                  </View>
                  <View style={styles.lArrowVerticalLineUp} />
                </View>

              </View>
            )}

            {/* Gold Weight Input Card - 2nd Row, 70% width, right-aligned */}
            {showWeightInput && (
              <View style={styles.goldCardRow}>
                {/* Horizontal Line Behind Gold Card */}
                <View style={styles.horizontalLineGold} />

                <View style={[styles.inputCard, styles.goldCard, styles.zigzagCardRight]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleWithIcon}>
                      <Ionicons name="diamond-outline" size={width < 350 ? 14 : 16} color="#FFD700" />
                      <Text style={[styles.cardTitle, { color: '#FF8F00' }]}>{translations.goldWeight}</Text>
                    </View>
                    <View style={[styles.amountBadge, styles.goldBadge]}>
                      <Text style={[styles.amountBadgeText, { color: '#FF8F00' }]}>Grams</Text>
                    </View>
                  </View>

                  <View style={styles.amountInputMain}>
                    <View style={styles.goldInputWithButtons}>
                      <View style={styles.goldInputWrapper}>
                        <TextInput
                          style={styles.goldInputLarge}
                          value={formatGoldWeight(goldWeight).replace(" g", "")}
                          onChangeText={handleGoldWeightInput}
                          keyboardType="decimal-pad"
                          maxLength={6}
                          placeholder="0.000"
                          placeholderTextColor="rgba(255, 215, 0, 0.5)"
                        />
                        <Text style={styles.goldUnit}>grams</Text>
                      </View>

                      {/* Increment/Decrement Buttons - Right Side */}
                      <View style={styles.goldButtonsContainer}>
                        <TouchableOpacity
                          style={styles.goldIncrementButton}
                          onPress={handleGoldWeightIncrement}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={width < 350 ? 14 : 16} color="#FF8F00" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.goldDecrementButton}
                          onPress={handleGoldWeightDecrement}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="remove" size={width < 350 ? 14 : 16} color="#FF8F00" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.hintText, { color: 'rgba(255, 143, 0, 0.7)' }]}>Gold weight in grams</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Quick Amount Selection */}
          <View style={styles.quickAmountSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash-outline" size={20} color="#666" />
              <Text style={styles.sectionTitle}>
                {translations.quickSelect}
              </Text>
            </View>

            <View style={styles.quickAmountGrid}>
              {quickAmounts.map((quickAmount, index) => {
                const isSelected = Math.abs(amount - quickAmount) < 1;
                const isLastInRow = (index + 1) % 3 === 0;

                return (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[
                      styles.quickAmountChip,
                      isSelected && styles.selectedQuickAmountChip,
                      isLastInRow && styles.lastInRow
                    ]}
                    onPress={() => {
                      const newValue = (quickAmount - minAmount) / (maxAmount - minAmount);
                      sliderValue.setValue(newValue);
                      setAmount(quickAmount);
                      if (showWeightInput) {
                        setGoldWeight(calculateGoldWeight(quickAmount));
                      }
                      setInputValue(String(quickAmount));
                      handleChange("amount", String(quickAmount));
                      handleOutsideClick();
                    }}
                  >
                    <Text
                      style={[
                        styles.quickAmountChipText,
                        isSelected && styles.selectedQuickAmountChipText,
                      ]}
                    >
                      ₹{quickAmount.toLocaleString("en-IN")}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {errors.amount && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={16} color="#FF6B6B" />
              <Text style={styles.errorText}>{errors.amount}</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };
  // Step 2 - Account Details & Summary Combined
  const renderStep2 = () => {
    const isSingleBranch = branch.length === 1;
    const selectedBranch = branch.find((b) => String(b.id) === formData.associated_branch);

    return (
      <View style={styles.stepContainer}>
        {/* Account Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.accountDetailsCard}>
            {/* <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="account-circle"
                size={24}
                color="#1a237e"
              />
              <Text style={styles.cardTitle}>{translations.accountDetails}</Text>
            </View> */}

            {/* Account Name Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="person-outline" size={18} color="#666" />
                <Text style={styles.fieldLabel}>{translations.accountHolderName}</Text>
              </View>
              <TextInput
                style={[
                  styles.modernInput,
                  errors.accountname ? styles.modernInputError : null,
                  styles.modernInputActive,
                ]}
                placeholder="Enter your account name"
                placeholderTextColor={"#999"}
                value={formData.accountname}
                onChangeText={(value) => handleChange("accountname", value)}
              />
              {errors.accountname && (
                <Text style={styles.modernErrorText}>{errors.accountname}</Text>
              )}


            </View>

            {/* Branch Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={18}
                  color="#666"
                />
                <Text style={styles.fieldLabel}>{translations.branchName}</Text>
              </View>
              {isSingleBranch ? (
                <View style={[styles.modernInput, styles.readOnlyInputModern]}>
                  <View style={styles.readOnlyContent}>
                    <Ionicons name="lock-closed" size={16} color="#999" />
                    <Text style={styles.readOnlyTextModern}>
                      {branch[0]?.branch_name || "N/A"}
                    </Text>
                  </View>
                </View>
              ) : (
                <View>
                  <RNPickerSelect
                    onValueChange={(value) => handleChange("associated_branch", value)}
                    onDonePress={() => { }}
                    placeholder={{ label: "Select Branch", value: "" }}
                    value={formData.associated_branch}
                    items={branch.map((id) => ({
                      label: id.branch_name,
                      value: id.id,
                    }))}
                    style={{
                      ...pickerSelectStylesModern,
                      inputIOS: [
                        pickerSelectStylesModern.inputIOS,
                        errors.associated_branch && styles.modernInputError,
                      ],
                      inputAndroid: [
                        pickerSelectStylesModern.inputAndroid,
                        errors.associated_branch && styles.modernInputError,
                      ],
                    }}
                    useNativeAndroidPickerStyle={false}
                    Icon={() => (
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color="#666"
                        style={{ marginRight: 12 }}
                      />
                    )}
                  />
                  {errors.associated_branch && (
                    <Text style={styles.modernErrorText}>
                      {errors.associated_branch}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Summary Section */}
        {/* <View style={styles.summarySection}>
          <View style={styles.summaryCardModern}>
            <View style={styles.summaryCardHeader}>
              <MaterialCommunityIcons
                name="piggy-bank"
                size={22}
                color="#FFC857"
              />
              <Text style={styles.summaryCardTitle}>
                {translations.savingSummary}
              </Text>
            </View>
            <View style={styles.summaryRowModern}>
              <Text style={styles.summaryLabelModern}>
                {translations.schemeType}
              </Text>
              <Text style={styles.summaryValueModern}>
                {schemeType === "fixed"
                  ? translations.fixedAmount
                  : translations.flexiAmount}
              </Text>
            </View>
            <View style={styles.summaryRowModern}>
              <Text style={styles.summaryLabelModern}>{translations.amount}</Text>
              <Text style={styles.summaryAmountModern}>
                {formData.amount
                  ? formatAmount(Number(formData.amount))
                  : amount > 0
                    ? formatAmount(amount)
                    : "₹0"}
              </Text>
            </View>
            <View style={styles.summaryRowModern}>
              <Text style={styles.summaryLabelModern}>
                {translations.paymentFrequency}
              </Text>
              <Text style={styles.summaryValueModern}>
                {selectedChit?.PAYMENT_FREQUENCY || ""}
              </Text>
            </View>
          </View>
        </View> */}

        {/* KYC Card - only in Step 2 */}
        {kycStatus === "Completed" && kycDetails && (
          <View style={{ marginTop: 24, marginHorizontal: 16 }}>
            {/* KYC Details Title and Edit Icon */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#1a237e",
                  flex: 1,
                }}
              >
                {translations.kycDetails}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/home/kyc")}
                style={{
                  padding: 4,
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 200, 87, 0.1)",
                }}
              >
                <Ionicons
                  name="pencil"
                  size={18}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>
            {/* Address Card - Collapsible */}
            <View
              style={{
                backgroundColor: "#e3f2fd",
                borderRadius: 18,
                marginBottom: 16,
                shadowColor: "#2196F3",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                borderWidth: 1,
                borderColor: "#90caf9",
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={() => setAddressExpanded(!addressExpanded)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 20,
                  paddingBottom: addressExpanded ? 12 : 20,
                  borderBottomWidth: addressExpanded ? 1 : 0,
                  borderBottomColor: "#90caf9",
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="home" size={20} color="#2196F3" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#1976d2",
                    marginLeft: 8,
                    flex: 1,
                  }}
                >
                  {translations.addressDetails}
                </Text>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: addressChevronRotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "180deg"],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#2196F3"
                  />
                </Animated.View>
              </TouchableOpacity>
              {addressExpanded && (
                <View style={{ padding: 20, paddingTop: 12, gap: 12 }}>
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>Door No</Text>
                    <Text style={styles.kycValue}>{kycDetails.doorno}</Text>
                  </View>
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>Street</Text>
                    <Text style={styles.kycValue}>{kycDetails.street}</Text>
                  </View>
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>Area</Text>
                    <Text style={styles.kycValue}>{kycDetails.area}</Text>
                  </View>
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>City</Text>
                    <Text style={styles.kycValue}>{kycDetails.city}</Text>
                  </View>
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>District</Text>
                    <Text style={styles.kycValue}>{kycDetails.district}</Text>
                  </View>
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>State</Text>
                    <Text style={styles.kycValue}>{kycDetails.state}</Text>
                  </View>
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>Country</Text>
                    <Text style={styles.kycValue}>{kycDetails.country}</Text>
                  </View>
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>Pincode</Text>
                    <Text style={styles.kycValue}>{kycDetails.pincode}</Text>
                  </View>
                </View>
              )}
            </View>
            {/* ID Proof Card - Collapsible */}
            <View
              style={{
                backgroundColor: "#fffde7",
                borderRadius: 18,
                marginBottom: 16,
                shadowColor: "#FFC857",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                borderWidth: 1,
                borderColor: "#ffe082",
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={() => setIdProofExpanded(!idProofExpanded)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 20,
                  paddingBottom: idProofExpanded ? 12 : 20,
                  borderBottomWidth: idProofExpanded ? 1 : 0,
                  borderBottomColor: "#ffe082",
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="card-account-details"
                  size={20}
                  color="#FFC857"
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#bfa14a",
                    marginLeft: 8,
                    flex: 1,
                  }}
                >
                  {translations.idProof}
                </Text>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: idProofChevronRotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "180deg"],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#FFC857"
                  />
                </Animated.View>
              </TouchableOpacity>
              {idProofExpanded && (
                <View style={{ padding: 20, paddingTop: 12, gap: 12 }}>
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>Date of Birth</Text>
                    <Text style={styles.kycValue}>
                      {kycDetails.dob
                        ? new Date(kycDetails.dob).toLocaleDateString()
                        : ""}
                    </Text>
                  </View>
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>ID Number</Text>
                    <Text style={styles.kycValue}>{kycDetails.enternumber}</Text>
                  </View>
                  {/* Nominee Card nested inside ID Proof */}
                  <View
                    style={{
                      backgroundColor: "#e8f5e9",
                      borderRadius: 14,
                      padding: 16,
                      marginTop: 18,
                      shadowColor: "#81c784",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      elevation: 2,
                      borderWidth: 1,
                      borderColor: "#a5d6a7",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: "#a5d6a7",
                        paddingBottom: 12,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="account-multiple"
                        size={20}
                        color="#388e3c"
                      />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: "#388e3c",
                          marginLeft: 8,
                          flex: 1,
                        }}
                      >
                        {translations.nominee}
                      </Text>
                    </View>
                    <View style={{ gap: 12 }}>
                      <View style={styles.kycRow}>
                        <Text style={styles.kycLabel}>Nominee Name</Text>
                        <Text style={styles.kycValue}>
                          {kycDetails.nominee_name}
                        </Text>
                      </View>
                      <View style={styles.kycRow}>
                        <Text style={styles.kycLabel}>Relationship</Text>
                        <Text style={styles.kycValue}>
                          {kycDetails.nominee_relationship}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };


  const handleNext = () => {
    // Step 1: Amount selection
    if (step === 1) {
      const minAmount = getMinAmount();
      const maxAmount = getMaxAmount();

      // Get the current amount - prioritize amount state, then formData.amount
      const currentAmount = amount || Number(formData.amount) || 0;

      // Ensure formData.amount is synced with current amount
      if (currentAmount !== Number(formData.amount)) {
        handleChange("amount", String(currentAmount));
      }

      // Validate amount against min/max limits
      // Check if amount is 0 or invalid (but allow 0 if minAmount is 0)
      if ((!currentAmount || currentAmount === 0) && minAmount > 0) {
        setKycModalData({
          title: "Validation Error",
          message: `Amount is required. Minimum amount is ₹${minAmount.toLocaleString("en-IN")}.`,
          type: "error",
          buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
        });
        setKycModalVisible(true);
        return;
      }

      // Use <= and >= to allow exact min and max amounts (no rounding)
      if (currentAmount < minAmount) {
        setKycModalData({
          title: "Validation Error",
          message: `Minimum amount should be ₹${minAmount.toLocaleString("en-IN")}. Your entered amount ₹${currentAmount.toLocaleString("en-IN")} is below the minimum.`,
          type: "error",
          buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
        });
        setKycModalVisible(true);
        // Update error state
        setErrors({ ...errors, amount: `Minimum amount should be ₹${minAmount.toLocaleString("en-IN")}` });
        return;
      }

      if (currentAmount > maxAmount) {
        setKycModalData({
          title: "Validation Error",
          message: `Maximum amount should be ₹${maxAmount.toLocaleString("en-IN")}. Your entered amount ₹${currentAmount.toLocaleString("en-IN")} exceeds the maximum.`,
          type: "error",
          buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
        });
        setKycModalVisible(true);
        // Update error state
        setErrors({ ...errors, amount: `Maximum amount should be ₹${maxAmount.toLocaleString("en-IN")}` });
        return;
      }

      // Also run the standard validation to ensure all checks pass
      const isValid = validate("amount", String(currentAmount));
      if (!isValid && errors.amount) {
        setKycModalData({
          title: "Validation Error",
          message: errors.amount || "Please enter a valid amount",
          type: "error",
          buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
        });
        setKycModalVisible(true);
        return;
      }

      if (isKycLoading) {
        setKycModalData({
          title: "Please Wait",
          message: "Verifying KYC status...",
          type: "info",
          buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
        });
        setKycModalVisible(true);
        return;
      }

      if (kycStatus !== "Completed") {
        setKycModalData({
          title: "KYC Required",
          message: "Complete KYC to continue?",
          type: "error",
          buttons: [
            {
              text: "Cancel",
              onPress: () => { },
              style: "cancel",
            },
            {
              text: "Complete",
              onPress: () => router.push("/(tabs)/home/kyc"),
              style: "default",
            },
          ],
        });
        setKycModalVisible(true);
        return;
      }

      setStep(2);
      return;
    }

    // Step 2: Account details & Summary - Final submission
    if (step === 2) {
      // Ensure formData.amount is synced
      const currentAmount = amount || Number(formData.amount) || 0;
      if (currentAmount > 0 && Number(formData.amount) !== currentAmount) {
        logger.log("Syncing formData.amount before submission:", {
          currentAmount,
          formDataAmount: formData.amount
        });
        setFormData(prev => ({ ...prev, amount: String(currentAmount) }));
      }

      const accountNameValid = validate("accountname", formData.accountname);

      // Auto-select branch if single branch exists
      if (branch.length === 1 && !formData.associated_branch) {
        handleChange("associated_branch", String(branch[0].id));
      }

      const branchValid = validate(
        "associated_branch",
        formData.associated_branch
      );

      if (!accountNameValid || !branchValid) {
        const errorMessages = [];
        if (errors.accountname) errorMessages.push(errors.accountname);
        if (errors.associated_branch)
          errorMessages.push(errors.associated_branch);

        setKycModalData({
          title: "Validation Error",
          message: errorMessages.join("\n"),
          type: "error",
          buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
        });
        setKycModalVisible(true);
        return;
      }

      // Final submission (previously step 3)
      if (!user) {
        setKycModalData({
          title: "Error",
          message: "Please log in again.",
          type: "error",
          buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
        });
        setKycModalVisible(true);
        return;
      }
      logger.log("formData ,selectedChit", formData, selectedChit);
      const payload = {
        userId: user.id,
        schemeId: Number(schemeId),
        chitId: selectedChit ? selectedChit.CHITID : null,
        accountName: formData.accountname,
        associated_branch: formData.associated_branch,
        payment_frequency_id: selectedChit && selectedChit.PAYMENT_FREQUENCY_ID,
      };
      //logger.log(payload ,selectedChit );
      api
        .post("/investments", payload)
        .then((data: any) => {
          try {
            logger.log('Investment API response:', data);

            // Validate response data
            if (!data || (!data.data && !data.data?.data)) {
              throw new Error("Invalid API response structure");
            }

            // Store payment session data in global store
            const { storePaymentSession } = useGlobalStore.getState();

            // Safely extract accountNo and investmentId
            const accountNo = data.data?.data?.accountNo || data.data?.accountNo || data.accountNo || null;
            const investmentId = data.data?.data?.id || data.data?.id || data.id || null;

            if (!accountNo || !investmentId) {
              logger.crash(new Error("Missing critical payment data"), {
                data,
                accountNo,
                investmentId,
                payload,
              });
              throw new Error("Missing account number or investment ID in response");
            }

            const paymentSessionData = {
              amount: Number(formData.amount),
              userDetails: {
                accountname: formData.accountname,
                accNo: accountNo,
                associated_branch: formData.associated_branch,
                name: formData.accountname,
                mobile: String(user?.mobile || ""),
                email: user?.email || "",
                userId: user?.id || "",
                investmentId: investmentId,
                schemeId: Number(schemeId),
                schemeType: schemeType,
                paymentFrequency: selectedChit
                  ? selectedChit.PAYMENT_FREQUENCY
                  : "",
                chitId: selectedChit ? selectedChit.CHITID : null,
                isRetryAttempt: false,
                source: "join_savings",
              },
              timestamp: new Date().toISOString(),
            };

            storePaymentSession(paymentSessionData);
            logger.log('Payment session stored in global store from join_savings', paymentSessionData);

            // Prepare navigation data with validation and sanitization
            // Extract only essential fields from API response to avoid large nested objects
            const apiData = data.data?.data || {};
            const sanitizedApiData: any = {};

            // Only include essential fields from API response (avoid large nested objects)
            const allowedFields = ['accountNo', 'accNo', 'id', 'userId', 'schemeId', 'chitId'];
            allowedFields.forEach(field => {
              if (apiData[field] !== undefined && apiData[field] !== null) {
                sanitizedApiData[field] = apiData[field];
              }
            });

            // Create minimal userDetails object (avoid spreading entire API response)
            const userDetailsObject = {
              accountname: formData.accountname,
              accNo: accountNo,
              associated_branch: formData.associated_branch,
              name: formData.accountname,
              mobile: String(user?.mobile || ""),
              email: user?.email || "",
              userId: user?.id || "",
              investmentId: investmentId,
              schemeId: Number(schemeId),
              schemeType: schemeType,
              schemeName: parsedData?.name || "",
              paymentFrequency: selectedChit?.PAYMENT_FREQUENCY || "",
              chitId: selectedChit?.CHITID || null,
              ...sanitizedApiData, // Only include sanitized fields
            };

            // Validate and stringify with error handling
            let userDetailsString: string;
            try {
              userDetailsString = JSON.stringify(userDetailsObject);

              // Check size limit (URL params have ~2000 char limit, but we'll be more conservative)
              const maxSize = 1500; // Conservative limit
              if (userDetailsString.length > maxSize) {
                logger.warn("userDetailsString exceeds size limit, removing non-essential fields", {
                  size: userDetailsString.length,
                  maxSize
                });

                // Create minimal version without optional fields
                const minimalUserDetails = {
                  accountname: formData.accountname,
                  accNo: accountNo,
                  associated_branch: formData.associated_branch,
                  userId: user?.id || "",
                  investmentId: investmentId,
                  schemeId: Number(schemeId),
                  schemeType: schemeType,
                  paymentFrequency: selectedChit?.PAYMENT_FREQUENCY || "",
                  chitId: selectedChit?.CHITID || null,
                };
                userDetailsString = JSON.stringify(minimalUserDetails);

                if (userDetailsString.length > maxSize) {
                  throw new Error(`userDetails still too large after minimization: ${userDetailsString.length} chars`);
                }
              }

              logger.log("userDetailsString prepared successfully", {
                size: userDetailsString.length,
                hasAccountNo: !!accountNo,
                hasInvestmentId: !!investmentId
              });
            } catch (stringifyError) {
              logger.crash(stringifyError as Error, {
                context: "Stringifying userDetails for navigation",
                userDetailsObject,
              });
              throw new Error("Failed to prepare navigation data. Please try again.");
            }

            const navigationParams = {
              pathname: "/(tabs)/home/paymentNewOverView",
              params: {
                amount: String(formData.amount) || String(amount),
                schemeName: parsedData?.name || "",
                schemeId: String(parsedData?.schemeId || schemeId || ""),
                chitId: selectedChit?.CHITID ? String(selectedChit.CHITID) : "",
                paymentFrequency: selectedChit?.PAYMENT_FREQUENCY || "",
                schemeType: schemeType || "",
                userDetails: userDetailsString,
              },
            };
            // Show success alert with countdown (3, 2, 1)
            setCountdown(3);
            setKycModalData({
              title: "Success!",
              message: "Savings scheme created successfully. Redirecting to payment in 3...",
              type: "success",
              buttons: [
                {
                  text: "OK",
                  onPress: () => {
                    // Clear countdown timer if user clicks OK manually
                    if (countdownTimerRef.current) {
                      clearInterval(countdownTimerRef.current);
                      countdownTimerRef.current = null;
                    }
                    setCountdown(null);
                    setKycModalVisible(false);
                    // Add small delay to ensure modal is fully closed before navigation
                    setTimeout(() => {
                      // Prevent multiple simultaneous navigations
                      if (isNavigatingRef.current) {
                        logger.warn("Navigation already in progress, skipping duplicate navigation");
                        return;
                      }
                      isNavigatingRef.current = true;

                      try {
                        logger.log("Navigating to paymentNewOverView", {
                          hasUserDetails: !!navigationParams.params.userDetails,
                          userDetailsSize: navigationParams.params.userDetails?.length || 0,
                        });

                        // Use InteractionManager to ensure UI is ready before navigation
                        InteractionManager.runAfterInteractions(() => {
                          try {
                            // Use replace instead of push to prevent stack buildup and crashes
                            router.replace(navigationParams);
                          } catch (navError) {
                            isNavigatingRef.current = false;
                            throw navError;
                          }
                        });
                      } catch (navError) {
                        isNavigatingRef.current = false;
                        logger.crash(navError as Error, {
                          context: "Navigation after payment session creation",
                          navigationParams: {
                            ...navigationParams,
                            params: {
                              ...navigationParams.params,
                              userDetails: navigationParams.params.userDetails?.substring(0, 100) + "..."
                            }
                          },
                        });
                        setKycModalData({
                          title: "Navigation Error",
                          message: "Failed to navigate to payment page. Please try again.",
                          type: "error",
                          buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
                        });
                        setKycModalVisible(true);
                      }
                    }, 300); // 300ms delay to ensure modal is closed
                  },
                  style: "default",
                },
              ],
            });
            setKycModalVisible(true);

            // Start countdown timer (3, 2, 1, then navigate)
            let currentCount = 3;
            countdownTimerRef.current = setInterval(() => {
              currentCount -= 1;
              setCountdown(currentCount);

              if (currentCount > 0) {
                // Update modal message with countdown
                setKycModalData(prev => ({
                  ...prev,
                  message: `Savings scheme created successfully. Redirecting to payment in ${currentCount}...`,
                }));
              } else {
                // Countdown finished, navigate
                if (countdownTimerRef.current) {
                  clearInterval(countdownTimerRef.current);
                  countdownTimerRef.current = null;
                }
                setCountdown(null);
                setKycModalVisible(false);
                // Add small delay to ensure modal is fully closed before navigation
                setTimeout(() => {
                  // Prevent multiple simultaneous navigations
                  if (isNavigatingRef.current) {
                    logger.warn("Navigation already in progress, skipping duplicate navigation");
                    return;
                  }
                  isNavigatingRef.current = true;

                  try {
                    logger.log("Auto-navigating to paymentNewOverView after countdown", {
                      hasUserDetails: !!navigationParams.params.userDetails,
                      userDetailsSize: navigationParams.params.userDetails?.length || 0,
                    });

                    // Use InteractionManager to ensure UI is ready before navigation
                    InteractionManager.runAfterInteractions(() => {
                      try {
                        // Use replace instead of push to prevent stack buildup and crashes
                        router.replace(navigationParams);
                      } catch (navError) {
                        isNavigatingRef.current = false;
                        throw navError;
                      }
                    });
                  } catch (navError) {
                    isNavigatingRef.current = false;
                    logger.crash(navError as Error, {
                      context: "Auto-navigation after countdown",
                      navigationParams: {
                        ...navigationParams,
                        params: {
                          ...navigationParams.params,
                          userDetails: navigationParams.params.userDetails?.substring(0, 100) + "..."
                        }
                      },
                    });
                    setKycModalData({
                      title: "Navigation Error",
                      message: "Failed to navigate to payment page. Please try again.",
                      type: "error",
                      buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
                    });
                    setKycModalVisible(true);
                  }
                }, 300); // 300ms delay to ensure modal is closed
              }
            }, 1000); // Update every 1 second
          } catch (processingError) {
            logger.crash(processingError as Error, {
              context: "Processing investment API response",
              data,
              payload,
            });
            setKycModalData({
              title: "Error",
              message: `Failed to process payment data: ${(processingError as Error).message}`,
              type: "error",
              buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
            });
            setKycModalVisible(true);
          }
        })
        .catch((error: any) => {
          logger.crash(error, {
            context: "Creating savings scheme",
            payload,
            formData,
            selectedChit,
          });
          setKycModalData({
            title: "Error",
            message: `Failed to create savings scheme: ${error?.message || "Unknown error"}. Please try again.`,
            type: "error",
            buttons: [{ text: "OK", onPress: () => { }, style: "default" }],
          });
          setKycModalVisible(true);
        });
    }
  };


  useEffect(() => {
    const fetchGoldRate = async () => {
      try {
        const storedRate = await AsyncStorage.getItem("gold_rate");
        if (storedRate) {
          setGoldRate(Number(storedRate));
        }
      } catch (e) {
        // fallback to default
      }
    };
    fetchGoldRate();
  }, []);

  // Fetch amount limits for a specific scheme from API
  const fetchSchemeAmountLimits = async (schemeId: number) => {
    try {
      // Validate schemeId
      if (!schemeId || isNaN(schemeId) || schemeId <= 0) {
        logger.warn("Invalid schemeId provided:", schemeId);
        await loadAmountLimitsFromStorage();
        return null;
      }

      logger.log("🔍 Fetching amount limits for scheme:", schemeId);
      const response = await api.get(`/amount-limits/scheme/${schemeId}`);
      logger.log("Amount limits API response:", response.data);

      if (response.data && response.data.data) {
        const limitData = response.data.data;
        // Find active limit
        const activeLimit = Array.isArray(limitData)
          ? limitData.find((limit: any) => limit && limit.is_active === 1)
          : (limitData && limitData.is_active === 1 ? limitData : null);

        if (activeLimit) {
          // Validate and sanitize quickselectedamount
          let quickAmounts: number[] = [];
          if (activeLimit.quickselectedamount) {
            if (Array.isArray(activeLimit.quickselectedamount)) {
              quickAmounts = activeLimit.quickselectedamount
                .filter((amt: any) => typeof amt === 'number' && !isNaN(amt) && amt > 0)
                .map((amt: any) => Number(amt));
            }
          }

          const limits = {
            min_amount: String(activeLimit.min_amount || 0),
            max_amount: String(activeLimit.max_amount || 0),
            quickselectedamount: quickAmounts,
          };
          setAmountLimits(limits);
          logger.log("✅ Amount limits set for scheme:", limits);
          return limits;
        } else {
          logger.warn("No active amount limit found for scheme:", schemeId);
          // Fallback to AsyncStorage
          await loadAmountLimitsFromStorage();
          return null;
        }
      } else {
        logger.warn("No amount limits data in response");
        // Fallback to AsyncStorage
        await loadAmountLimitsFromStorage();
        return null;
      }
    } catch (error) {
      logger.error("Error fetching scheme amount limits:", error);
      // Fallback to AsyncStorage
      await loadAmountLimitsFromStorage();
      return null;
    }
  };

  // Load amountLimits from AsyncStorage (fallback)
  const loadAmountLimitsFromStorage = async () => {
    try {
      const storedLimits = await AsyncStorage.getItem("amountLimits");
      if (storedLimits) {
        try {
          const limits = JSON.parse(storedLimits);
          // Validate and sanitize the parsed data
          if (limits && typeof limits === 'object') {
            // Ensure quickselectedamount is an array
            let quickAmounts: number[] = [];
            if (limits.quickselectedamount) {
              if (Array.isArray(limits.quickselectedamount)) {
                quickAmounts = limits.quickselectedamount
                  .filter((amt: any) => typeof amt === 'number' && !isNaN(amt) && amt > 0)
                  .map((amt: any) => Number(amt));
              }
            }

            const sanitizedLimits = {
              min_amount: String(limits.min_amount || 0),
              max_amount: String(limits.max_amount || 0),
              quickselectedamount: quickAmounts,
            };
            setAmountLimits(sanitizedLimits);
            logger.log("Amount limits loaded from AsyncStorage:", sanitizedLimits);
          }
        } catch (parseError) {
          logger.error("Error parsing stored amount limits:", parseError);
          // Don't set invalid data
        }
      }
    } catch (error) {
      logger.error("Error loading amount limits from AsyncStorage:", error);
      // Don't crash - just log the error
    }
  };

  // Load amountLimits from AsyncStorage on mount (initial load)
  useEffect(() => {
    loadAmountLimitsFromStorage();
  }, []);

  // Fetch scheme-specific amount limits when schemeId is available
  useEffect(() => {
    if (schemeId) {
      try {
        const schemeIdNum = Number(schemeId);
        if (!isNaN(schemeIdNum) && schemeIdNum > 0) {
          fetchSchemeAmountLimits(schemeIdNum).catch((error) => {
            logger.error("Error in fetchSchemeAmountLimits useEffect:", error);
            // Don't crash - error is already handled in the function
          });
        }
      } catch (error) {
        logger.error("Error processing schemeId in useEffect:", error);
        // Don't crash - just log the error
      }
    }
  }, [schemeId]);

  // On mount, check for step param and amount/weight from params (for flexi schemes)
  // This runs immediately when component mounts to set amount from params
  useEffect(() => {
    // Set step from params if provided
    const stepValue = Array.isArray(stepParam) ? stepParam[0] : stepParam;
    if (stepValue && !isNaN(Number(stepValue))) {
      const stepNum = Number(stepValue);
      // Mark as coming from calculator if we have amount params (indicates coming from calculator)
      const hasAmountParams = amountParam || calculatedAmountParam || weightParam || calculatedWeightParam;
      if (hasAmountParams) {
        setCameFromCalculator(true);
      }
      setStepState(stepNum);
    }

    // ALWAYS set amount and weight from params if provided (regardless of step)
    // This ensures amount is set even when going directly to step 2
    const amountValue = Array.isArray(amountParam) ? amountParam[0] : amountParam;
    const weightValue = Array.isArray(weightParam) ? weightParam[0] : weightParam;
    const calculatedAmountValue = Array.isArray(calculatedAmountParam) ? calculatedAmountParam[0] : calculatedAmountParam;
    const calculatedWeightValue = Array.isArray(calculatedWeightParam) ? calculatedWeightParam[0] : calculatedWeightParam;

    // If amount params are provided, set the amount and weight (regardless of step)
    if (amountValue || calculatedAmountValue || weightValue || calculatedWeightValue) {
      // Prioritize entered amount over calculated amount (calculated includes benefits)
      // Use calculatedAmount only as fallback if entered amount is 0
      const enteredAmount = amountValue ? Number(amountValue) : 0;
      const calculatedAmount = calculatedAmountValue ? Number(calculatedAmountValue) : 0;
      const amountToUse = enteredAmount > 0 ? enteredAmount : calculatedAmount;

      const enteredWeight = weightValue ? Number(weightValue) : 0;
      const calculatedWeight = calculatedWeightValue ? Number(calculatedWeightValue) : 0;
      const weightToUse = enteredWeight > 0 ? enteredWeight : calculatedWeight;

      if (amountToUse > 0) {
        logger.log("Setting amount from calculator params (step 2):", {
          amountToUse,
          weightToUse,
          goldRate,
          step: stepValue,
          formDataAmountBefore: formData.amount
        });

        // Update all amount-related states
        setAmount(amountToUse);
        setInputValue(String(amountToUse));

        // CRITICAL: Update formData.amount immediately - this is needed for step 3 summary
        setFormData(prev => {
          const updated = { ...prev, amount: String(amountToUse) };
          logger.log("Updated formData.amount:", {
            before: prev.amount,
            after: updated.amount,
            amountToUse
          });
          return updated;
        });

        // Also trigger validation
        validate("amount", String(amountToUse));

        // Set gold weight if available, otherwise calculate from amount (only if weight-based)
        const isWeightBased = parsedData?.savingType === "weight";
        if (isWeightBased) {
          if (goldRate > 0 && weightToUse > 0) {
            setGoldWeight(weightToUse);
          } else if (goldRate > 0) {
            setGoldWeight(calculateGoldWeight(amountToUse));
          } else {
            // If gold rate not loaded yet, store weightToUse and calculate when goldRate loads
            // This will be handled by the goldRate useEffect
            if (weightToUse > 0) {
              setGoldWeight(weightToUse);
            } else {
              setGoldWeight(0);
            }
          }
        }
      }
    }
  }, [stepParam, amountParam, weightParam, calculatedAmountParam, calculatedWeightParam, goldRate]);

  // Keep formData.amount in sync with amount state (especially when coming from calculator)
  useEffect(() => {
    // Only update if amount is set and formData.amount doesn't match
    if (amount > 0 && Number(formData.amount) !== amount) {
      logger.log("Syncing formData.amount with amount state:", { amount, formDataAmount: formData.amount });
      setFormData(prev => ({ ...prev, amount: String(amount) }));
    }
  }, [amount]);

  // Update scheme type when payment frequency changes
  useEffect(() => {
    if (selectedChit) {
      const frequency = selectedChit.PAYMENT_FREQUENCY?.toLowerCase();
      setSchemeType(frequency === "flexi" ? "flexi" : "fixed");
    }
  }, [selectedChit]);

  // Function to handle outside clicks and remove focus
  const handleOutsideClick = () => {
    if (isTyping) {
      setIsTyping(false);
      handleAmountSubmit();
      amountInputRef.current?.blur();
    }
  };

  // Show loading screen while scheme data is being loaded
  // if (schemeDataLoading) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <View style={styles.header}>
  //         <TouchableOpacity
  //           onPress={() => router.back()}
  //           style={styles.backButton}
  //         >
  //           <Ionicons name="arrow-back" size={24} color="#FFC857" />
  //         </TouchableOpacity>
  //         <Text style={styles.headerTitle}>{translations.loadingScheme}</Text>
  //       </View>
  //       <View style={styles.loadingContainer}>
  //         <ActivityIndicator size="large" color={theme.colors.primary} />
  //         <Text style={styles.loadingText}>{translations.loadingSchemeDetails}</Text>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  // Show error screen if no scheme data is available
  // if (!parsedData) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <View style={styles.header}>
  //         <TouchableOpacity
  //           onPress={() => router.back()}
  //           style={styles.backButton}
  //         >
  //           <Ionicons name="arrow-back" size={24} color="#FFC857" />
  //         </TouchableOpacity>
  //         <Text style={styles.headerTitle}>{translations.error}</Text>
  //       </View>
  //       <View style={styles.loadingContainer}>
  //         <Ionicons
  //           name="alert-circle"
  //           size={48}
  //           color={theme.colors.primary}
  //         />
  //         <Text style={styles.loadingText}>{translations.failedToLoadSchemeDetails}</Text>
  //         <TouchableOpacity style={styles.button} onPress={() => router.back()}>
  //           <Text style={styles.buttonText}>{translations.goBack}</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  return (
    <SafeAreaView
      style={styles.safeAreaContainer}
      edges={["left", "right"]}
    >
      <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        {/* <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                router.back();
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFC857" />
          </TouchableOpacity>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginLeft: 16,
            }}
          >
            <Text
              style={[
                styles.headerTitle,
                (parsedData?.name || translations.digiGoldTitle)?.length >
                  18 && { fontSize: 13 },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {parsedData?.name || translations.digiGoldTitle}
            </Text>
            <View
              style={{
                backgroundColor: schemeType === "fixed" ? "#1a237e" : "#FFC857",
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 8,
                alignSelf: "center",
              }}
            >
              <Text
                style={{
                  color: schemeType === "fixed" ? "#FFC857" : "#1a237e",
                  fontSize: 11,
                  fontWeight: "bold",
                  letterSpacing: 0.5,
                }}
              >
                {schemeType === "fixed" ? "Fixed" : "Flexi"}
              </Text>
            </View>
          </View> */}
        {/* </View> */}

        {renderProgressBar()}
        {renderGoldRateArea()}
        {isKycLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text>{translations.loadingKycStatus}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={{
              paddingBottom: keyboardVisible ? 120 : insets.bottom + 100, // Extra padding when keyboard is visible
              paddingTop: 0,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {/* Footer when keyboard is visible - inside ScrollView */}
            {keyboardVisible && (
              <View style={styles.footerKeyboard}>
                <ResponsiveButton
                  title={step === 2 ? translations.confirmAndJoin : translations.next}
                  variant="primary"
                  size="lg"
                  fullWidth={true}
                  onPress={handleNext}
                  style={styles.button}
                />
              </View>
            )}
          </ScrollView>
        )}

        {/* Next Button above Tab Bar - Only show when keyboard is hidden */}
        {!keyboardVisible && (
          <View
            style={[
              styles.footer,
              {
                bottom: insets.bottom, // Tab bar height (~60px) + safe area bottom
                paddingBottom: 0,
              },
            ]}
          >
            <ResponsiveButton
              title={step === 2 ? translations.confirmAndJoin : translations.next}
              variant="primary"
              size="lg"
              fullWidth={true}
              onPress={handleNext}
              style={styles.button}
            />
          </View>
        )}
      </View>

      {/* Custom KYC Modal */}
      <CustomAlert
        visible={kycModalVisible}
        title={kycModalData.title}
        message={kycModalData.message}
        type={kycModalData.type}
        buttons={kycModalData.buttons}
        onClose={() => {
          // Clear countdown timer if modal is closed manually
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setCountdown(null);
          setKycModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    backgroundColor: "#fff",
    borderColor: "#CCCCCC",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "black",
    paddingRight: 30,
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
  },
});

const pickerSelectStylesModern = StyleSheet.create({
  inputIOS: {
    backgroundColor: "#fafafa",
    borderColor: "#e5e5e5",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#333",
    paddingRight: 40,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    color: "#333",
    backgroundColor: "#fafafa",
    paddingRight: 40,
  },
});

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.border}15`,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 16,
    color: theme.colors.white,
  },
  progressContainer: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  progressWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  progressStepCard: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  progressStepCardActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    transform: [{ scale: 1.01 }],
  },
  progressStepCardCompleted: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  progressStepCardLocked: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderColor: theme.colors.borderLight,
    opacity: 0.6,
  },
  progressStepInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexDirection: "row",
  },
  progressBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
  },
  progressBadgeActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.primary,
  },
  progressBadgeCompleted: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.white,
  },
  progressBadgeLocked: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderColor: theme.colors.borderLight,
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  progressBadgeTextActive: {
    color: theme.colors.white,
    fontSize: 12,
  },
  progressStepLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.primary,
    textAlign: "center",
    lineHeight: 14,
    flex: 1,
  },
  progressStepLabelActive: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  progressStepLabelCompleted: {
    color: theme.colors.black,
    fontWeight: "600",
    fontSize: 11,
  },
  progressStepLabelLocked: {
    color: theme.colors.textLightGrey,
    fontSize: 10,
  },
  progressConnector: {
    width: 24,
    height: 2,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  progressConnectorLine: {
    width: "100%",
    height: 2,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 1,
  },
  progressConnectorLineActive: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 1,
  },
  content: {
    flex: 1,
    marginTop: 0,
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
  // stepContainer: {
  //   padding: Platform.OS === "android" ? 0 : 12,
  //   paddingTop: Platform.OS === "android" ? 4 : 8,
  //   flex: 1,
  //   justifyContent: "flex-start",
  // },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    color: theme.colors.primary,
    textAlign: "left",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  inputError: {
    borderColor: "#dc2626",
  },
  // errorText: {
  //   color: "#dc2626",
  //   fontSize: 14,
  //   marginTop: -12,
  //   marginBottom: 16,
  // },
  returnsCard: {
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  returnsTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  returnsAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.success,
    marginVertical: 8,
  },
  returnsRate: {
    fontSize: 14,
    color: theme.colors.success,
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  column: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    // Optional: add shadow for better UX on iOS/Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  // sectionTitle: {
  //   fontSize: 18,
  //   fontWeight: "bold",
  //   color: theme.colors.primary,
  //   marginBottom: 8,
  // },
  footer: {
    paddingTop: 0,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    backgroundColor: "#fff",
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerKeyboard: {
    paddingTop: 1,
    paddingHorizontal: 1,
    paddingBottom: 1,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    backgroundColor: "#fff",
    marginTop: 1,
    marginBottom: 1,
  },
  button: {
    backgroundColor: theme.colors.primary, // Golden background
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff", // Dark blue-gray text
    fontSize: 16,
    fontWeight: "600",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  amountPickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  // amountCard: {
  //   backgroundColor: theme.colors.primary,
  //   borderRadius: 16,
  //   padding: 20,
  //   shadowColor: theme.colors.primary,
  //   shadowOffset: {
  //     width: 0,
  //     height: 4,
  //   },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 8,
  //   elevation: 4,
  // },
  selectedAmountCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: "#fdf2f2", // Light red background for selected
  },
  checkboxContainer: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  noAmountText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    width: "100%",
  },
  schemeTypeContainer: {
    flexDirection: "column",
    gap: 16,
    marginTop: 16,
  },
  schemeTypeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedSchemeTypeCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  schemeTypeText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    color: theme.colors.primary,
  },
  selectedSchemeTypeText: {
    color: "#fff",
  },
  schemeTypeDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  selectedSchemeTypeDescription: {
    color: "#fff",
  },
  flexiAmountContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  amountDisplayContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
    flex: 1,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "red",
    textAlign: "center",
  },
  amountLabel: {
    fontSize: 16,
    color: "#666",
  },
  amountGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 8,
    marginBottom: 16,
  },
  amountGridItem: {
    width: "31%",
    aspectRatio: 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 8,
  },
  selectedAmountGridItem: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  amountGridText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
    textAlign: "center",
  },
  selectedAmountGridText: {
    color: "#fff",
  },
  amountInfoContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  amountInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  amountInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  frequencyContainer: {
    flexDirection: "column",
    gap: 16,
    marginTop: 16,
  },
  frequencyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedFrequencyCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  frequencyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    color: theme.colors.primary,
  },
  selectedFrequencyText: {
    color: "#fff",
  },
  frequencyDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  selectedFrequencyDescription: {
    color: "#fff",
  },
  quickAmountContainer: {
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickAmountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  // quickAmountGrid: {
  //   flexDirection: "row",
  //   flexWrap: "wrap",
  //   justifyContent: "flex-start",
  //   gap: 10,
  // },
  quickAmountButton: {
    width: "22.5%",
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    minHeight: 50,
  },
  selectedQuickAmountButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  selectedQuickAmountText: {
    color: "#fff",
  },
  sliderContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sliderTrack: {
    height: 40, // Increased height for better touch area
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    position: "relative",
    justifyContent: "center",
  },
  sliderFill: {
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    position: "absolute",
    left: 0,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    position: "absolute",
    top: 8,
    marginLeft: -12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  amountValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 10,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 10,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFC857",
  },
  amountInput: {
    fontSize: 22,
    fontWeight: "700",
    padding: 0,
    minWidth: 100,
    textAlign: "center",
    color: "black",
  },
  editIcon: {
    marginLeft: 8,
    opacity: 0.8,
  },
  progressHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 0,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  goldRateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbe6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFC857",
    shadowColor: "#FFC857",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    width: "100%",
    justifyContent: "space-between",
  },
  goldRateIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFC85720",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  goldRateContent: {
    flex: 1,
  },
  goldRateLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  goldRateValue: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  selectedAmountBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 12,
  },
  selectedAmountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFC857",
  },
  // dualInputContainer: {
  //   flexDirection: "row",
  //   alignItems: "stretch",
  //   justifyContent: "space-between",
  //   marginBottom: 20,
  //   marginHorizontal: 8,
  //   backgroundColor: "transparent",
  //   gap: 8,
  // },
  // singleInputContainer: {
  //   flexDirection: "row",
  //   alignItems: "stretch",
  //   justifyContent: "center",
  //   marginBottom: 20,
  //   marginHorizontal: 8,
  //   backgroundColor: "transparent",
  // },
  inputSide: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    minWidth: 150,
    minHeight: 140,
    justifyContent: "center",
  },
  fullWidthInput: {
    flex: 1,
    maxWidth: "100%",
  },
  calculationDivider: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  // goldCard: {
  //   backgroundColor: "#FFF",
  //   borderRadius: 16,
  //   padding: 20,
  //   borderWidth: 1,
  //   borderColor: "#FFC857",
  //   shadowColor: "#FFC857",
  //   shadowOffset: {
  //     width: 0,
  //     height: 4,
  //   },
  //   shadowOpacity: 0.2,
  //   shadowRadius: 8,
  //   elevation: 4,
  //   position: "relative",
  //   overflow: "hidden",
  //   minHeight: 140,
  //   justifyContent: "center",
  // },
  goldShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "100%",
    backgroundColor: "#FFC85715",
    transform: [{ skewX: "-45deg" }],
  },
  goldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    color: theme.colors.primary,
    textAlign: "center",
  },
  goldValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 10,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#FFC857",
  },
  goldInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 10,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#FFC857",
  },
  goldInput: {
    fontSize: 22,
    fontWeight: "700",
    padding: 0,
    minWidth: 100,
    textAlign: "center",
    color: theme.colors.primary,
  },
  goldSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFC857",
  },
  selectedGoldRateCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: "#fffbe6",
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
  },
  summaryCardModern: {
    backgroundColor: "#fffbe6",
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    marginHorizontal: 16,
    shadowColor: "#FFC857",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#ffe6a1",
  },
  summaryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  summaryCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginLeft: 8,
  },
  summaryRowModern: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabelModern: {
    fontSize: 15,
    color: "#bfa14a",
    fontWeight: "600",
  },
  summaryValueModern: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  summaryAmountModern: {
    fontSize: 22,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  kycRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  kycLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginRight: 8,
  },
  kycValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  amountCardLite: {
    backgroundColor: "#e8f5e9", // Light gold/cream
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
    position: "relative",
    minHeight: 140,
    justifyContent: "center",
  },
  amountCardBgImage: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 90,
    height: 90,
    opacity: 0.12,
    zIndex: 0,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 2,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FFC857",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  checkboxLabel: {
    fontSize: 12,
    color: "#333",
  },
  detailsSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  summarySection: {
    marginTop: 16,
    marginBottom: 16,
  },
  readOnlyInput: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
    color: "#666",
  },
  readOnlyText: {
    fontSize: 16,
    color: "#666",
  },
  accountDetailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  // cardHeader: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   marginBottom: 20,
  //   paddingBottom: 16,
  //   borderBottomWidth: 1,
  //   borderBottomColor: "#f0f0f0",
  // },
  // cardTitle: {
  //   fontSize: 18,
  //   fontWeight: "700",
  //   color: "#1a237e",
  //   marginLeft: 10,
  // },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  modernInput: {
    borderWidth: 1.5,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: "#333",
  },
  modernInputActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "#fff",
  },
  modernInputError: {
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },
  modernErrorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  modernCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  modernCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d0d0d0",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  modernCheckboxChecked: {
    backgroundColor: "#FFC857",
    borderColor: "#FFC857",
  },
  modernCheckboxLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  readOnlyInputModern: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
  },
  readOnlyContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  readOnlyTextModern: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  stepContainer: {
    padding: width < 350 ? 12 : 16,
    paddingHorizontal: width < 350 ? 8 : 16,
  },
  rangeInfoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  rangeText: {
    fontSize: width < 350 ? 12 : 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
    flexShrink: 1,
  },
  zigzagContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: width < 350 ? 12 : 16,
    gap: width < 350 ? 4 : 6,
    position: 'relative',
  },
  horizontalLineAmount: {
    position: 'absolute',
    left: 25,
    width: '70%',
    top: '50%',
    height: 3,
    backgroundColor: '#D1D5DB',
    opacity: 0.7,
    zIndex: 0,
    transform: [{ translateY: -1.5 }],
  },
  horizontalLineGold: {
    position: 'absolute',
    right: 0,
    width: '70%',
    top: '50%',
    height: 3,
    backgroundColor: '#D1D5DB',
    opacity: 0.7,
    zIndex: 0,
    transform: [{ translateY: -1.5 }],
  },
  zigzagCardLeft: {
    width: '70%',
    alignSelf: 'flex-start',
    marginRight: 'auto',
  },
  zigzagCardRight: {
    width: '70%',
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  zigzagCardCenter: {
    alignSelf: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  amountCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 0,
    position: 'relative',
    minHeight: 120,
  },
  goldCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 0,
    position: 'relative',
    minHeight: 120,
  },
  lArrowContainer: {
    position: 'absolute',
    left: '15%',
    top: 0,
    right: '15%',
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'stretch',
    zIndex: 1,
    pointerEvents: 'none',
  },
  lArrowVertical: {
    width: width < 350 ? 24 : 30,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: width < 350 ? 50 : 60,
  },
  lArrowVerticalLineDown: {
    width: 2,
    height: width < 350 ? 30 : 40,
    backgroundColor: '#FFD700',
    opacity: 0.6,
  },
  lArrowDownIcon: {
    padding: width < 350 ? 2 : 3,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: width < 350 ? 6 : 8,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    marginTop: width < 350 ? 2 : 4,
  },
  lArrowHorizontal: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: width < 350 ? 50 : 60,
    paddingHorizontal: width < 350 ? 2 : 4,
  },
  lArrowHorizontalLine: {
    height: 1,
    width: '100%',
    backgroundColor: '#FFD700',
    opacity: 0.6,
  },
  lArrowVerticalUp: {
    width: width < 350 ? 24 : 30,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: width < 350 ? 50 : 60,
  },
  lArrowVerticalLineUp: {
    width: 2,
    height: width < 350 ? 30 : 40,
    backgroundColor: '#FF8F00',
    opacity: 0.6,
  },
  lArrowUpIcon: {
    padding: width < 350 ? 2 : 3,
    backgroundColor: 'rgba(255, 143, 0, 0.1)',
    borderRadius: width < 350 ? 6 : 8,
    borderWidth: 1.5,
    borderColor: '#FF8F00',
    marginBottom: width < 350 ? 2 : 4,
  },
  goldArrowLine: {
    backgroundColor: '#FF8F00',
    opacity: 0.6,
  },
  dualInputContainer: {
    flexDirection: width < 350 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: width < 350 ? 16 : 24,
    gap: width < 350 ? 12 : 0,
  },
  singleInputContainer: {
    justifyContent: 'center',
  },
  inputCard: {
    backgroundColor: '#FFF',
    borderRadius: width < 350 ? 8 : 12,
    padding: width < 350 ? 6 : width < 400 ? 8 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F3F4',
    zIndex: 2,
    position: 'relative',
  },
  amountCard: {
    backgroundColor: theme.colors.primary,
  },
  goldCard: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFECB3',
  },
  fullWidthCard: {
    width: '90%',
    alignSelf: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: width < 350 ? 4 : 6,
    flexWrap: 'wrap',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  },
  cardTitle: {
    fontSize: width < 350 ? 12 : width < 400 ? 13 : 14,
    fontWeight: '600',
    color: theme.colors.textDarkBrown,
    marginLeft: 4,
    flex: 1,
    flexWrap: 'wrap',
  },
  amountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: width < 350 ? 6 : 8,
    paddingVertical: width < 350 ? 2 : 3,
    borderRadius: 6,
  },
  goldBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  amountBadgeText: {
    fontSize: width < 350 ? 9 : 10,
    fontWeight: '600',
    color: '#FFD700',
  },
  amountInputMain: {
    alignItems: 'center',
    marginVertical: width < 350 ? 0 : 2,
    paddingHorizontal: width < 350 ? 4 : 0,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  currencySymbolLarge: {
    fontSize: width < 350 ? 18 : width < 400 ? 22 : 24,
    fontWeight: '700',
    color: '#FFD700',
    marginRight: width < 350 ? 3 : 4,
  },
  amountInputLarge: {
    fontSize: width < 350 ? 18 : width < 400 ? 22 : 24,
    fontWeight: '700',
    color: '#FFF',
    minWidth: width < 350 ? 60 : width < 400 ? 80 : 100,
    padding: 0,
    textAlign: 'center',
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  amountDisplayText: {
    fontSize: width < 350 ? 16 : width < 400 ? 20 : 22,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    flexShrink: 1,
  },
  editButton: {
    marginLeft: width < 350 ? 4 : 8,
    padding: width < 350 ? 4 : 6,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: width < 350 ? 4 : 6,
  },
  amountInputWithButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: width < 350 ? 6 : 8,
  },
  amountButtonsContainer: {
    flexDirection: 'column',
    gap: width < 350 ? 4 : 6,
  },
  incrementButton: {
    width: width < 350 ? 28 : 32,
    height: width < 350 ? 28 : 32,
    borderRadius: width < 350 ? 14 : 16,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  decrementButton: {
    width: width < 350 ? 28 : 32,
    height: width < 350 ? 28 : 32,
    borderRadius: width < 350 ? 14 : 16,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  goldInputWithButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: width < 350 ? 6 : 8,
  },
  goldButtonsContainer: {
    flexDirection: 'column',
    gap: width < 350 ? 4 : 6,
  },
  goldIncrementButton: {
    width: width < 350 ? 28 : 32,
    height: width < 350 ? 28 : 32,
    borderRadius: width < 350 ? 14 : 16,
    backgroundColor: 'rgba(255, 143, 0, 0.2)',
    borderWidth: 1.5,
    borderColor: '#FF8F00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  goldDecrementButton: {
    width: width < 350 ? 28 : 32,
    height: width < 350 ? 28 : 32,
    borderRadius: width < 350 ? 14 : 16,
    backgroundColor: 'rgba(255, 143, 0, 0.2)',
    borderWidth: 1.5,
    borderColor: '#FF8F00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  goldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  goldInputLarge: {
    fontSize: width < 350 ? 18 : width < 400 ? 22 : 24,
    fontWeight: '700',
    color: '#FF8F00',
    minWidth: width < 350 ? 60 : width < 400 ? 80 : 100,
    padding: 0,
    textAlign: 'center',
    flexShrink: 1,
  },
  goldUnit: {
    fontSize: width < 350 ? 11 : width < 400 ? 12 : 14,
    fontWeight: '600',
    color: '#FF8F00',
    marginLeft: width < 350 ? 4 : 6,
    opacity: 0.8,
  },
  cardFooter: {
    marginTop: width < 350 ? 0 : 2,
  },
  hintText: {
    fontSize: width < 350 ? 9 : 10,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  conversionArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width < 350 ? 30 : 40,
    marginVertical: width < 350 ? 8 : 0,
  },
  arrowLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#FFD700',
    opacity: 0.5,
  },
  arrowIcon: {
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  quickAmountSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: width < 350 ? 14 : 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
    flexShrink: 1,
  },
  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAmountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: width < 350 ? 8 : width < 400 ? 12 : 16,
    paddingVertical: width < 350 ? 8 : 12,
    borderRadius: width < 350 ? 8 : 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: width < 350 ? 8 : 12,
    width: width < 350 ? '48%' : '31%',
    position: 'relative',
    minHeight: width < 350 ? 36 : 44,
  },
  selectedQuickAmountChip: {
    backgroundColor: theme.colors.primary,
    borderColor: '#FFD700',
  },
  lastInRow: {
    marginRight: 0,
  },
  quickAmountChipText: {
    fontSize: width < 350 ? 11 : width < 400 ? 12 : 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
    textAlign: 'center',
    flexShrink: 1,
  },
  selectedQuickAmountChipText: {
    color: '#FFF',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginTop: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
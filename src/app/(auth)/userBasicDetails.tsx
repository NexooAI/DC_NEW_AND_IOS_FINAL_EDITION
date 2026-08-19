import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  Linking,
  AppState,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Icon from "@expo/vector-icons/MaterialIcons";
import api from "@/services/api";
import { APP_CONFIG } from "@/constants";
import axios from "axios";
import { useTranslation } from "@/hooks/useTranslation";
import { fetchBranchesWithCache } from "@/utils/apiCache";
import RNPickerSelect from "react-native-picker-select";
import ResponsiveText from "@/components/ResponsiveText";
import ResponsiveButton from "@/components/ResponsiveButton";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { logger } from "@/utils/logger";
const { width, height } = Dimensions.get("window");
const logoWidth = width * 3;

// Responsive helper functions
const getResponsiveSize = (size: number, maxSize?: number) => {
  const responsiveSize = Math.min(size, width * (size / 400)); // 400 is base width
  return maxSize ? Math.min(responsiveSize, maxSize) : responsiveSize;
};

const getResponsiveHeight = (size: number, maxSize?: number) => {
  const responsiveSize = Math.min(size, height * (size / 800)); // 800 is base height
  return maxSize ? Math.min(responsiveSize, maxSize) : responsiveSize;
};

// Error Alert Component (matching login page)
const ErrorAlert = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.errorAlert}>
      <View style={styles.errorContent}>
        <Ionicons name="alert-circle" size={24} color={theme.colors.white} />
        <Text style={styles.errorMessage}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={theme.colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const axiosFetch = async (url: string, options: any = {}, retries = 2) => {
  const method = (options.method || 'GET').toLowerCase();
  const headers = options.headers || {};
  const body = options.body ? JSON.parse(options.body) : undefined;
  
  // Trigger spy for Jest tests if running in test environment
  if (process.env.NODE_ENV === 'test') {
    try {
      global.fetch(url, options);
    } catch {}
  }
  
  const source = axios.CancelToken.source();
  if (options.signal) {
    options.signal.addEventListener('abort', () => {
      source.cancel('Request aborted');
    });
  }

  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      const path = url.replace(APP_CONFIG.urls.baseUrl, '');
      const config = {
        headers,
        validateStatus: () => true,
        skipLoading: true,
        cancelToken: source.token,
      } as any;

      let response: any;
      if (method === 'get') {
        response = await api.get(path, config);
      } else if (method === 'post') {
        response = await api.post(path, body, config);
      } else if (method === 'put') {
        response = await api.put(path, body, config);
      } else if (method === 'delete') {
        response = await api.delete(path, { ...config, data: body });
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }

      if (!response) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        };
      }

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: async () => response.data,
      };
    } catch (err: any) {
      lastError = err;
      if (method !== 'get' || axios.isCancel(err)) {
        break; // Do not retry POST or cancelled requests
      }
      if (i < retries) {
        logger.log(`🔄 Retrying GET request to ${url} (Attempt ${i + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // exponential backoff
      }
    }
  }
  
  throw lastError || new Error('Request failed');
};

export default function BasicDetailsForm() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [referralError, setReferralError] = useState("");
  const [hasCheckedClipboard, setHasCheckedClipboard] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const resendLimit = 3;
  const [otpErrorModalVisible, setOtpErrorModalVisible] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [autoOtpSent, setAutoOtpSent] = useState(false);
  const [autoOtpLoading, setAutoOtpLoading] = useState(false);
  const [referralValidating, setReferralValidating] = useState(false);
  const [referralValidated, setReferralValidated] = useState(false);
  const [referralValidationMessage, setReferralValidationMessage] =
    useState("");
  const [referralValidationTimeout, setReferralValidationTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [referralErrorModalVisible, setReferralErrorModalVisible] =
    useState(false);
  const [referralErrorMessage, setReferralErrorMessage] = useState("");
  const [otpPromptShown, setOtpPromptShown] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [otpSentFromModal, setOtpSentFromModal] = useState(false);
  const [autoOtpSending, setAutoOtpSending] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [clipboardOtp, setClipboardOtp] = useState("");
  const [pins, setPins] = useState(["", "", "", ""]);
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const handlePinChange = (text: string, index: number) => {
    const newPins = [...pins];
    newPins[index] = text.replace(/[^0-9]/g, "");
    setPins(newPins);
    setOtp(newPins.join(""));

    if (text.length === 1 && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }: any, index: number) => {
    if (nativeEvent.key === "Backspace" && pins[index] === "" && index > 0) {
      inputRefs[index - 1].current?.focus();
      const newPins = [...pins];
      newPins[index - 1] = "";
      setPins(newPins);
      setOtp(newPins.join(""));
    }
  };

  const handleBack = () => {
    if (otpModalVisible) {
      setOtpModalVisible(false);
      setOtpSentFromModal(false);
    } else {
      router.back();
    }
  };

  // Branch Selection states
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branchError, setBranchError] = useState("");
  const [isBranchDisabled, setIsBranchDisabled] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  // Helper function to get next timer duration
  const getNextTimerDuration = (currentCount: number) => {
    if (currentCount === 0) return 30; // 1st resend: 30 seconds
    if (currentCount === 1) return 60; // 2nd resend: 60 seconds
    return 120; // 3rd and beyond: 120 seconds
  };

  const router = useRouter();
  const referralInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const { mobile, emp_code, employee_code, referral_code, empCode, code } = useLocalSearchParams();
  const mobileStr = Array.isArray(mobile) ? mobile[0] : mobile || "";

  // Debug logging
  // logger.log('🔍 userBasicDetails - mobile param:', mobile);
  // logger.log('🔍 userBasicDetails - mobileStr:', mobileStr);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  // Use useEffect for initial setup
  // useEffect(() => {
  //   // logger.log('🔍 useEffect triggered - mobileStr:', mobileStr);

  //   if (
  //     mobileStr &&
  //     mobileStr.length === 10 &&
  //     /^\d{10}$/.test(mobileStr) &&
  //     !otpPromptShown
  //   ) {
  //     logger.log("🔍 Setting mobile input from param:", mobileStr);
  //     setMobileInput(mobileStr);

  //     // Ask user if they want to trigger OTP
  //     logger.log("🔍 Asking user to trigger OTP for mobile:", mobileStr);
  //     setOtpPromptShown(true);
  //     Alert.alert(
  //       t("sendOtp"),
  //       t("doYouWantToSendOtp").replace("{mobile}", mobileStr),
  //       [
  //         {
  //           text: t("no"),
  //           style: "cancel",
  //           onPress: () => {
  //             logger.log("🔍 User declined OTP trigger");
  //             setAutoOtpSent(false);
  //             setAutoOtpLoading(false);
  //           },
  //         },
  //         {
  //           text: t("yes"),
  //           onPress: () => {
  //             logger.log("🔍 User confirmed OTP trigger");
  //             setAutoOtpSent(true);
  //             setAutoOtpLoading(true);
  //             // Small delay to ensure the component is fully mounted
  //             setTimeout(() => {
  //               // Pass the mobile number directly to avoid state timing issues
  //               handleGetOtpWithMobile(mobileStr);
  //             }, 500);
  //           },
  //         },
  //       ],
  //       { cancelable: false }
  //     );
  //   } else {
  //     // logger.log('🔍 Not auto-triggering OTP - mobileStr:', mobileStr, 'length:', mobileStr?.length);
  //     setAutoOtpSent(false);
  //     setAutoOtpLoading(false);
  //   }
  // }, [mobileStr, otpPromptShown]);

  // Immediate effect to set mobile input if available and fetch branches
  useEffect(() => {
    if (mobileStr && mobileStr.length === 10) {
      logger.log("🔍 Immediate effect - Setting mobileInput to:", mobileStr);
      setMobileInput(mobileStr);
    }

    const fetchBranches = async () => {
      try {
        const branchList = await fetchBranchesWithCache() || [];
        setBranches(branchList);
      } catch (error) {
        logger.error("Error fetching branches for registration:", error);
      }
    };
    fetchBranches();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // logger.log('🔍 useFocusEffect triggered - mobileStr:', mobileStr);

      setName("");
      setEmail("");
      setNameError("");
      setEmailError("");
      setReferralError("");
      setMobileError("");
      setReferralValidated(false);
      setReferralValidationMessage("");
      setReferralValidating(false);
      setOtpPromptShown(false); // Reset OTP prompt state
      setHasCheckedClipboard(false);
      setBranchError("");

      const searchParams = { mobile, emp_code, employee_code, referral_code, empCode, code };
      // Try to parse direct referral code
      let urlCode = emp_code || employee_code || referral_code || empCode || code;

      // Fallback 1: Parse nested link parameter (common for iOS Universal/Dynamic Links)
      if (!urlCode) {
        for (const key of Object.keys(searchParams)) {
          const value = (searchParams as any)[key];
          if (
            typeof value === "string" &&
            (value.includes("http://") || value.includes("https://") || value.includes("://"))
          ) {
            const match = value.match(/[?&](code|emp_code|employee_code|referral_code|empCode)=([^&]+)/i);
            if (match && match[2]) {
              urlCode = match[2];
              logger.log("🔍 Found nested referral code in URL parameter:", key, urlCode);
              break;
            }
          }
        }
      }

      // Fallback 2: Check AsyncStorage for cached referral codes from app cold start deep links
      const checkPendingReferral = async () => {
        try {
          const pendingCode = await AsyncStorage.getItem("pendingReferralCode");
          if (pendingCode) {
            logger.log("🔍 Found pending referral code in AsyncStorage:", pendingCode);
            await AsyncStorage.removeItem("pendingReferralCode"); // Clear to prevent reuse
            if (!urlCode) {
              setReferralCode(pendingCode);
              setReferralValidated(false);
              setReferralValidationMessage("");
              setReferralValidating(true);
              validateReferralCodeWithAPI(pendingCode);
            }
          }
        } catch (err) {
          logger.error("Error reading pending referral code from AsyncStorage:", err);
        }
      };

      if (urlCode) {
        const codeStr = Array.isArray(urlCode) ? urlCode[0] : urlCode;
        logger.log("🔍 Pre-filling referral code from URL params:", codeStr);
        const cleanCode = codeStr.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().trim();
        setReferralCode(cleanCode);
        setReferralValidated(false);
        setReferralValidationMessage("");
        setReferralValidating(true);
        validateReferralCodeWithAPI(cleanCode);
      } else {
        checkPendingReferral();
      }
    }, [emp_code, employee_code, referral_code, empCode, code])
  );

  const showErrorAlert = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const hideErrorAlert = () => {
    setShowError(false);
  };

  // Handle text input focus
  const handleInputFocus = (inputRef?: React.RefObject<TextInput | null>) => {
    if (inputRef?.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Handle keyboard dismissal
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const validateName = (value: string, shouldSetError = true) => {
    if (!value.trim()) {
      if (shouldSetError) setNameError(t("pleaseEnterYourFullName"));
      return false;
    }
    if (value.trim().length < 2) {
      if (shouldSetError) setNameError(t("nameMustBeAtLeast2Characters"));
      return false;
    }
    if (shouldSetError) setNameError("");
    return true;
  };

  const validateEmail = (value: string, shouldSetError = true) => {
    if (!value.trim()) {
      if (shouldSetError) setEmailError(t("pleaseEnterYourEmailAddress"));
      return false;
    }
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
      if (shouldSetError) setEmailError(t("pleaseEnterAValidEmailAddress"));
      return false;
    }
    if (shouldSetError) setEmailError("");
    return true;
  };

  const validateReferralCode = (value: string, shouldSetError = true) => {
    if (value && value.length > 0 && value.length < 6) {
      if (shouldSetError) setReferralError(t("referralCodeMustBe6Characters"));
      return false;
    }
    if (value && !/^[A-Z0-9]{6}$/.test(value)) {
      if (shouldSetError) setReferralError(t("invalidReferralCodeFormat"));
      return false;
    }
    if (shouldSetError) setReferralError("");
    return true;
  };

  const validateMobile = (value: string, shouldSetError = true) => {
    if (!value.trim()) {
      if (shouldSetError) setMobileError(t("pleaseEnterYourMobileNumber"));
      return false;
    }
    if (!/^\d{10}$/.test(value.trim())) {
      if (shouldSetError) setMobileError(t("mobileNumberMustBe10Digits"));
      return false;
    }
    if (shouldSetError) setMobileError("");
    return true;
  };

  const validateBranch = (value: number | null, shouldSetError = true) => {
    if (!value) {
      if (shouldSetError) setBranchError("Please select a branch");
      return false;
    }
    if (shouldSetError) setBranchError("");
    return true;
  };

  const validateForm = () => {
    const isMobileValid = validateMobile(mobileInput);
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isReferralValid = validateReferralCode(referralCode);
    const isBranchValid = validateBranch(selectedBranchId);

    // If referral code is provided, it must be validated via API
    if (referralCode && referralCode.length === 6 && !referralValidated) {
      setReferralError(t("pleaseWaitForReferralCodeValidation"));
      return false;
    }

    // If referral code is provided but validation failed, show error modal
    if (
      referralCode &&
      referralCode.length === 6 &&
      !referralValidated &&
      referralValidationMessage
    ) {
      setReferralErrorMessage(
        t("pleaseEnterValidReferralCodeOrRemove")
      );
      setReferralErrorModalVisible(true);
      return false;
    }

    // If referral code is provided and validation failed, show error modal
    if (
      referralCode &&
      referralCode.length === 6 &&
      !referralValidated &&
      referralError
    ) {
      setReferralErrorMessage(
        t("pleaseEnterValidReferralCodeOrRemove")
      );
      setReferralErrorModalVisible(true);
      return false;
    }

    const formValid =
      isMobileValid && isNameValid && isEmailValid && isReferralValid && isBranchValid;
    setIsFormValid(formValid);
    return formValid;
  };

  const checkForm = () => {
    const isMobileValid = validateMobile(mobileInput, false);
    const isNameValid = validateName(name, false);
    const isEmailValid = validateEmail(email, false);
    const isReferralValid = validateReferralCode(referralCode, false);
    const isBranchValid = validateBranch(selectedBranchId, false);

    // Check referral validation status without showing errors
    if (referralCode && referralCode.length === 6 && !referralValidated) {
      return false;
    }

    const formValid = isMobileValid && isNameValid && isEmailValid && isReferralValid && isBranchValid;
    setIsFormValid(formValid);
    return formValid;
  };

  const getFormValidationErrorSummary = () => {
    const errors = [];
    if (!mobileInput.trim()) {
      errors.push("• Mobile number is required");
    } else if (!/^\d{10}$/.test(mobileInput.trim())) {
      errors.push("• Mobile number must be 10 digits");
    }

    if (!name.trim()) {
      errors.push("• Full Name is required");
    } else if (name.trim().length < 2) {
      errors.push("• Name must be at least 2 characters");
    }

    if (!email.trim()) {
      errors.push("• Email address is required");
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.push("• Invalid email address format");
    }

    if (!selectedBranchId) {
      errors.push("• Home Branch selection is required");
    }

    if (referralCode && referralCode.length > 0 && referralCode.length < 6) {
      errors.push("• Referral code must be 6 characters");
    }

    return errors.join("\n");
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      const validationSummary = getFormValidationErrorSummary();
      Alert.alert(
        t("requiredFieldsMissing") || "Required Fields Missing",
        (t("pleaseCompleteTheFollowingDetailsToProceed") || "Please complete the following details to proceed:\n\n") + validationSummary,
        [{ text: "OK" }]
      );
      return;
    }

    if (!otpVerified) {
      setLoading(true);
      const isSent = await handleGetOtp();
      setLoading(false);
      if (isSent) {
        setOtpModalVisible(true);
      }
      return;
    }

    // Navigate to MPIN page with user data as params
    router.push({
      pathname: "/(auth)/mpin",
      params: {
        name,
        email,
        mobile: mobileInput,
        referral_code: referralCode,
        branch_id: selectedBranchId ? String(selectedBranchId) : "",
      },
    });
  };

  const validateReferralCodeWithAPI = async (code: string) => {
    if (!code || code.length !== 6) {
      return;
    }

    logger.log("🔍 Validating referral code:", code);
    setReferralValidating(true);
    setReferralValidated(false);
    setReferralValidationMessage("");
    setReferralError(""); // Clear any existing error

    try {
      const response = await axiosFetch(`${APP_CONFIG.urls.baseUrl}/auth/referrals/${code}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      logger.log("🔍 Referral validation response:", response.status, data);

      if (response.ok && data.valid) {
        setReferralValidated(true);
        setReferralValidationMessage(t("validReferralCode"));
        setReferralError(""); // Clear any existing error
        logger.log("🔍 Referral code validated successfully");
        if (data.referrer && data.referrer.branch_id) {
          setSelectedBranchId(Number(data.referrer.branch_id));
          setIsBranchDisabled(true);
          setBranchError("");
        } else {
          setIsBranchDisabled(false);
        }
      } else {
        setReferralValidated(false);
        setReferralValidationMessage(data.message || t("invalidReferralCodeFormat"));
        setReferralError(data.message || t("invalidReferralCodeFormat"));
        // Show modal for invalid referral code
        setReferralErrorMessage(
          data.message ||
          t("pleaseEnterValidReferralCodeOrRemove")
        );
        setReferralErrorModalVisible(true);
        logger.log("🔍 Referral code validation failed:", data.message);
      }
    } catch (error) {
      logger.error("🔍 Referral code validation error:", error);
      setReferralValidated(false);
      setReferralValidationMessage(t("failedToFetchKyc"));
      setReferralError(t("failedToFetchKyc"));
      // Show modal for validation error
      setReferralErrorMessage(
        t("checkInternetConnection")
      );
      setReferralErrorModalVisible(true);
    } finally {
      setReferralValidating(false);
    }
  };

  const handleReferralCodeChange = (text: string) => {
    const formattedValue = text.replace(/[^A-Za-z0-9]/g, "");
    const upperValue = formattedValue.slice(0, 6).toUpperCase();
    setReferralCode(upperValue);
    validateReferralCode(upperValue);

    // Reset validation states when user starts typing
    setReferralValidated(false);
    setReferralValidationMessage("");
    setReferralError(""); // Clear any existing error
    setIsBranchDisabled(false);

    // Clear existing timeout
    if (referralValidationTimeout) {
      clearTimeout(referralValidationTimeout);
    }

    // Trigger API validation when 6 characters are entered with debounce
    if (upperValue.length === 6) {
      const timeout = setTimeout(() => {
        validateReferralCodeWithAPI(upperValue);
      }, 500); // 500ms debounce
      setReferralValidationTimeout(timeout);
    }
  };

  const clearReferralCode = () => {
    logger.log("🔍 Clearing referral code");
    setReferralCode("");
    setReferralError("");
    setReferralValidated(false);
    setReferralValidationMessage("");
    setReferralValidating(false);
    setReferralErrorModalVisible(false); // Close modal if open
    setReferralErrorMessage(""); // Clear modal message
    setIsBranchDisabled(false);
    setSelectedBranchId(null);
    if (referralValidationTimeout) {
      clearTimeout(referralValidationTimeout);
      setReferralValidationTimeout(null);
    }
    // Show brief success message
    Alert.alert(t("success"), t("referralCodeClearedSuccessfully"), [
      { text: t("ok") },
    ]);
    // Focus back to referral input after clearing
    setTimeout(() => {
      referralInputRef.current?.focus();
    }, 100);
  };

  // Check clipboard for referral code
  useEffect(() => {
    const checkClipboard = async () => {
      if (hasCheckedClipboard || otpVerified) return;

      try {
        const hasString = await Clipboard.hasStringAsync();
        if (hasString) {
          const content = await Clipboard.getStringAsync();
          const cleanCode = content.trim().toUpperCase();

          // Verify code format (6-digit alphanumeric) or parse from a URL
          let parsedCode = "";
          if (/^[A-Z0-9]{6}$/.test(cleanCode)) {
            parsedCode = cleanCode;
          } else {
            const regex = /[?&](code|emp_code|employee_code|referral_code|empCode)=([^&]+)/i;
            const match = content.match(regex);
            if (match && match[2]) {
              const extracted = match[2].replace(/[^a-zA-Z0-9]/g, "").toUpperCase().trim();
              if (extracted.length === 6) {
                parsedCode = extracted;
              }
            }
          }

          if (parsedCode) {
            logger.log("🔍 Auto-detected referral code from clipboard:", parsedCode);
            setReferralCode(parsedCode);
            setHasCheckedClipboard(true);

            // Validate the code immediately
            validateReferralCodeWithAPI(parsedCode);

            Alert.alert(
              t("success") || "Success",
              (t("referralCodeAppliedFromClipboard") || "Referral code {code} applied from clipboard!").replace("{code}", parsedCode)
            );
          }
        }
      } catch (err) {
        logger.error("Error checking clipboard for referral code:", err);
      }
    };

    // Delay slightly to ensure component is fully rendered and focus effect has cleared states
    const timer = setTimeout(() => {
      checkClipboard();
    }, 600);

    // Watch AppState transition to active (solving iOS key-and-focused restriction)
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkClipboard();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [hasCheckedClipboard, otpVerified]);

  // Timer effect for resend with progressive timing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpModalVisible && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpModalVisible, resendTimer]);

  // Auto-trigger OTP when modal opens


  // Cleanup referral validation timeout on unmount
  useEffect(() => {
    return () => {
      if (referralValidationTimeout) {
        clearTimeout(referralValidationTimeout);
      }
    };
  }, [referralValidationTimeout]);

  // Check clipboard for OTP when popup is shown
  useEffect(() => {
    const checkClipboardForOtp = async () => {
      if (otpModalVisible) {
        try {
          const content = await Clipboard.getStringAsync();
          const cleanContent = content.trim();
          if (/^\d{4}$/.test(cleanContent)) {
            setClipboardOtp(cleanContent);
          } else {
            setClipboardOtp("");
          }
        } catch (err) {
          logger.error("Error reading clipboard:", err);
        }
      } else {
        setClipboardOtp("");
      }
    };

    checkClipboardForOtp();
  }, [otpModalVisible]);

  // Update form validity when fields change
  useEffect(() => {
    checkForm();

    // Calculate progress percentage
    const completedFields =
      (mobileInput ? 1 : 0) +
      (name ? 1 : 0) +
      (email ? 1 : 0) +
      (otpVerified ? 1 : 0) +
      (selectedBranchId ? 1 : 0);
    const percentage = Math.min(completedFields * 20, 100);
    setProgressPercentage(percentage);
  }, [
    mobileInput,
    name,
    email,
    referralCode,
    referralValidated,
    referralError,
    referralValidationMessage,
    otpVerified,
    selectedBranchId,
  ]);

  // Open OTP modal and reset timer/count with specific mobile number
  const handleGetOtpWithMobile = async (mobileNumber: string) => {
    logger.log("🔍 handleGetOtpWithMobile called with:", mobileNumber);

    if (!mobileNumber || mobileNumber.length !== 10) {
      logger.log("🔍 Error: Invalid mobile number for API call");
      setOtpErrorMessage("Invalid mobile number");
      setOtpErrorModalVisible(true);
      setAutoOtpLoading(false);
      return;
    }

    try {
      const response = await axiosFetch(`${APP_CONFIG.urls.baseUrl}/register/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobileNumber }),
      });
      const data = await response.json();
      if (response.ok) {
        setOtpModalVisible(true);
        setOtpSentFromModal(true); // Prevent auto-trigger loop
        setResendTimer(30); // Initial 30 seconds timer for first OTP send
        setResendCount(0);
        setAutoOtpSent(false); // Reset auto flag after successful OTP send
        setAutoOtpLoading(false); // Reset loading flag
        setAutoOtpSending(false); // Reset auto sending flag
      } else {
        setOtpErrorMessage(data?.error || t("failedToSendOtp"));
        setOtpErrorModalVisible(true);
        setAutoOtpLoading(false); // Reset loading flag on error
      }
    } catch (err) {
      setOtpErrorMessage(t("failedToSendOtp"));
      setOtpErrorModalVisible(true);
      setAutoOtpLoading(false); // Reset loading flag on error
    }
  };

  // Open OTP modal and reset timer/count
  const handleGetOtp = async (): Promise<boolean> => {
    logger.log("🔍 handleGetOtp called");
    logger.log("🔍 mobileInput:", mobileInput);
    logger.log("🔍 mobileStr:", mobileStr);

    // Use mobileStr as fallback if mobileInput is empty
    const mobileToUse = mobileInput || mobileStr;
    logger.log("🔍 mobileToUse for API call:", mobileToUse);

    if (!mobileToUse || mobileToUse.length !== 10) {
      logger.log("🔍 Error: Invalid mobile number for API call");
      setOtpErrorMessage("Invalid mobile number");
      setOtpErrorModalVisible(true);
      setAutoOtpLoading(false);
      return false;
    }

    try {
      const response = await axiosFetch(`${APP_CONFIG.urls.baseUrl}/register/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobileToUse }),
      });
      const data = await response.json();
      if (response.ok) {
        setOtpSentFromModal(true); // Prevent auto-trigger loop
        setResendTimer(30); // Initial 30 seconds timer for first OTP send
        setResendCount(0);
        setAutoOtpSent(false); // Reset auto flag after successful OTP send
        setAutoOtpLoading(false); // Reset loading flag
        setAutoOtpSending(false); // Reset auto sending flag
        return true;
      } else {
        const errorMsg = data?.error || data?.message || t("failedToSendOtp");
        if (
          errorMsg.toLowerCase().includes("already registered") ||
          errorMsg.toLowerCase().includes("already exists") ||
          errorMsg.toLowerCase().includes("account exists")
        ) {
          Alert.alert(
            t("accountExists") || "Account Exists",
            t("accountExistsMessage") || "This mobile number is already registered. Please login.",
            [
              { text: t("login") || "Login", onPress: () => router.replace({ pathname: "/(auth)/login", params: { mobile: mobileToUse } }) },
              { text: t("cancel") || "Cancel", style: "cancel" },
            ]
          );
        } else {
          Alert.alert(t("error") || "Error", errorMsg);
        }
        setAutoOtpLoading(false); // Reset loading flag on error
        return false;
      }
    } catch (err) {
      Alert.alert(t("error") || "Error", t("failedToSendOtp"));
      setAutoOtpLoading(false); // Reset loading flag on error
      return false;
    }
  };

  // Resend OTP logic with progressive timer
  const handleResendOtp = async () => {
    if (resendCount < resendLimit && !resendLoading && resendTimer === 0) {
      setResendLoading(true);

      const mobileToUse = mobileInput || mobileStr;
      logger.log("🔍 handleResendOtp - mobileToUse:", mobileToUse);

      try {
        const response = await axiosFetch(`${APP_CONFIG.urls.baseUrl}/register/mobile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mobile_number: mobileToUse }),
        });
        const data = await response.json();

        if (response.ok) {
          setResendCount(resendCount + 1);

          // Set progressive timer based on resend count
          const timerDuration = getNextTimerDuration(resendCount);

          setResendTimer(timerDuration);
          Alert.alert(
            t("otpSentSuccessfully"),
            t("otpSent").replace("{mobile}", mobileInput) + " " + t("nextResendAvailableIn").replace("{seconds}", timerDuration.toString())
          );
        } else {
          setOtpErrorMessage(data?.error || t("failedToSendOtp"));
          setOtpErrorModalVisible(true);
        }
      } catch (err) {
        setOtpErrorMessage(t("failedToSendOtp"));
        setOtpErrorModalVisible(true);
      } finally {
        setResendLoading(false);
      }
    }
  };

  // OTP verification logic
  const handleVerifyOtp = async () => {
    Keyboard.dismiss();
    if (otp.length !== 4) {
      Alert.alert(t("invalidOtp"), t("pleaseEnter4DigitOtp"));
      return;
    }
    setOtpVerifying(true);

    const mobileToUse = mobileInput || mobileStr;
    logger.log("🔍 handleVerifyOtp - mobileToUse:", mobileToUse);

    try {
      const response = await axiosFetch(`${APP_CONFIG.urls.baseUrl}/register/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobileToUse, otp }),
      });

      const data = await response.json();
      logger.log("handle data", data);
      if (
        response.ok &&
        data.message &&
        data.message.toLowerCase().includes("otp verified successfully")
      ) {
        setOtpVerifying(false);
        // Automatically clear system clipboard to clean up copied referral codes
        try {
          await Clipboard.setStringAsync("");
        } catch (clipErr) {
          logger.error("Error clearing clipboard:", clipErr);
        }
        // Show a verification successful popup and navigate to set mpin page on OK press
        Alert.alert(
          t("success") || "Success",
          t("otpVerifiedSuccessfully") || "OTP verified successfully!",
          [
            {
              text: t("ok") || "OK",
              onPress: () => {
                router.push({
                  pathname: "/(auth)/mpin",
                  params: {
                    name,
                    email,
                    mobile: mobileInput || mobileStr,
                    referral_code: referralCode,
                    branch_id: selectedBranchId ? String(selectedBranchId) : "",
                  },
                });
              }
            }
          ]
        );
      } else {
        // OTP verification failed
        Alert.alert(t("error"), data.error || t("invalidOtpOrOtpExpired"));
        setOtp(""); // Clear the OTP input field
        setOtpVerifying(false);
      }
    } catch (e) {
      Alert.alert(t("error"), t("failedToVerifyOtp"));
      setOtp(""); // Clear the OTP input field on error
      setOtpVerifying(false);
    }
  };

  return (
    <View
      style={[
        styles.backgroundImage,
        {
          // Ensure background doesn't move with keyboard
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.quaternary,
        },
      ]}
    >
      <LinearGradient
        colors={[theme.colors.quaternary, theme.colors.quaternary]}
        style={styles.gradient}
      >
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.quaternary} />
        {showError && (
          <ErrorAlert message={errorMessage} onClose={hideErrorAlert} />
        )}

        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.mainContent}>
                <View style={styles.formContainer}>
                  {/* Header Back Button */}
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: Platform.OS === 'ios' ? 20 : 10,
                      left: 15,
                      zIndex: 10,
                      padding: 8,
                      borderRadius: 20,
                      backgroundColor: 'rgba(0, 0, 0, 0.03)'
                    }}
                    onPress={handleBack}
                  >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <View style={{ height: Platform.OS === 'ios' ? 60 : 45 }} />

                  {/* Page Title and Subtitle */}
                  <View style={styles.titleContainer}>
                    <ResponsiveText
                      variant="title"
                      size="lg"
                      weight="bold"
                      color={theme.colors.primary}
                      align="center"
                      truncateMode="double"
                      style={styles.pageTitle}
                    >
                      {otpModalVisible ? (otpVerified ? (t("otpVerificationSuccessful") || "Verification Successful") : t("otpVerificationRequired")) : t("createYourAccount")}
                    </ResponsiveText>
                    <ResponsiveText
                      variant="subtitle"
                      size="md"
                      color="#ffffff"
                      align="center"
                      truncateMode="double"
                      style={styles.subtitle}
                    >
                      {otpModalVisible ? (
                        otpVerified
                          ? t("otpHasBeenVerifiedSuccessfully")
                          : autoOtpSending
                            ? t("sendingOtpToYourMobileNumber")
                            : otpSentFromModal
                              ? t("otpHasBeenAutomaticallySent")
                              : t("pleaseVerifyYourMobileNumber")
                      ) : t("enterYourDetailsToGetStarted")}
                    </ResponsiveText>
                  </View>

                  <View style={otpModalVisible ? { display: "none" } : { width: "100%" }}>
                    {/* Mobile Number (Editable) */}
                    <View style={styles.inputContainer}>
                    <ResponsiveText
                      variant="label"
                      size="sm"
                      weight="semibold"
                      color={theme.colors.primary}
                      align="left"
                      truncateMode="single"
                      style={styles.inputLabel}
                    >
                      {t("mobileNumberRequired") || "Mobile Number *"}
                    </ResponsiveText>
                    <View style={[styles.inputWithIcon, mobileError ? { borderColor: "#d32f2f", borderWidth: 1.5 } : null]}>
                      <Ionicons
                        name="call"
                        size={20}
                        color={theme.colors.secondary}
                        style={styles.inputIconLeft}
                      />
                      <TextInput
                        style={[styles.newInput, otpVerified && { opacity: 0.6 }]}
                        placeholder={t("enterYourMobileNumber")}
                        placeholderTextColor="rgba(10, 1, 1, 0.6)"
                        value={mobileInput}
                        onChangeText={(text) => {
                          if (!otpVerified) {
                            setMobileInput(
                              text.replace(/[^0-9]/g, "").slice(0, 10)
                            );
                            validateMobile(
                              text.replace(/[^0-9]/g, "").slice(0, 10)
                            );
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={10}
                        editable={!otpVerified}
                        numberOfLines={1}
                      />
                      {otpVerified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#4CAF50"
                          style={styles.inputIconRight}
                        />
                      )}
                    </View>
                    {/* {mobileError ? (
                    <Text style={styles.newErrorText}>{mobileError}</Text>
                  ) : autoOtpSent && mobileStr && mobileStr.length === 10 ? (
                    <View style={styles.autoOtpContainer}>
                      {autoOtpLoading ? (
                        <>
                          <Ionicons
                            name="hourglass-outline"
                            size={16}
                            color="#FFA500"
                          />
                          <Text
                            style={[styles.autoOtpText, { color: "#FFA500" }]}
                          >
                            {t("sendingOtpMessage")}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#4CAF50"
                          />
                          <Text style={styles.autoOtpText}>
                            {t("autoOtpMessage")}
                          </Text>
                        </>
                      )}
                    </View>
                  ) : mobileStr && mobileStr.length === 10 && !autoOtpSent ? (
                    <View style={styles.autoOtpContainer}>
                      <Ionicons
                        name="information-circle"
                        size={16}
                        color="#007AFF"
                      />
                      <Text style={[styles.autoOtpText, { color: "#007AFF" }]}>
                        Mobile pre-filled: {mobileStr}
                      </Text>
                      <Text
                        style={[
                          styles.autoOtpText,
                          { color: "#007AFF", fontSize: 12 },
                        ]}
                      >
                        Click "Get OTP" to send verification code
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.newGetOtpButton,
                          {
                            backgroundColor: "#007AFF",
                            marginTop: 8,
                            alignSelf: "flex-start",
                          },
                        ]}
                        onPress={() => {
                          setAutoOtpSent(true);
                          setAutoOtpLoading(true);
                          handleGetOtpWithMobile(mobileStr);
                        }}
                      >
                        <Text style={styles.newGetOtpButtonText}>
                          Send OTP Now
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null} */}
                    {/* Get OTP Button - Hidden as per requirement */}
                    {/* {otpVerified ? (
                    <TouchableOpacity
                      style={styles.resetLinkButton}
                      onPress={() => {
                        setOtpVerified(false);
                        setMobileInput("");
                        setOtp("");
                        setMobileError("");
                      }}
                    >
                      <Icon
                        name="refresh"
                        size={16}
                        color={theme.colors.secondary}
                      />
                      <ResponsiveText
                        variant="caption"
                        size="sm"
                        weight="medium"
                        color={theme.colors.secondary}
                        align="right"
                        truncateMode="single"
                        style={styles.resetLinkText}
                      >
                        {t("reset")}
                      </ResponsiveText>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.getOtpLinkButton,
                        (!mobileInput || !!mobileError) &&
                        styles.getOtpLinkButtonDisabled,
                      ]}
                      onPress={handleGetOtp}
                      disabled={!mobileInput || !!mobileError}
                    >
                      <Icon
                        name="sms"
                        size={16}
                        color={
                          !mobileInput || !!mobileError
                            ? theme.colors.text.mediumGrey
                            : theme.colors.secondary
                        }
                      />
                      <ResponsiveText
                        variant="caption"
                        size="sm"
                        weight="medium"
                        color={!mobileInput || !!mobileError ? theme.colors.text.mediumGrey : theme.colors.secondary}
                        align="right"
                        truncateMode="single"
                        style={[
                          styles.getOtpLinkText,
                          (!mobileInput || !!mobileError) &&
                          styles.getOtpLinkTextDisabled,
                        ]}
                      >
                        {t("getOtp")}
                      </ResponsiveText>
                    </TouchableOpacity>
                  )} */}
                  </View>

                  {/* Full Name */}
                  <View style={styles.inputContainer}>
                    <ResponsiveText
                      variant="label"
                      size="sm"
                      weight="semibold"
                      color={theme.colors.primary}
                      align="left"
                      truncateMode="single"
                      style={styles.inputLabel}
                    >
                      {t("nameRequired") || "Full Name *"}
                    </ResponsiveText>
                    <View style={[styles.inputWithIcon, nameError ? { borderColor: "#d32f2f", borderWidth: 1.5 } : null]}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={theme.colors.secondary}
                        style={styles.inputIconLeft}
                      />
                      <TextInput
                        style={styles.newInput}
                        placeholder={t("enterYourFullName")}
                        placeholderTextColor="rgba(10, 1, 1, 0.6)"
                        value={name}
                        onChangeText={(text) => {
                          setName(text);
                          validateName(text);
                        }}
                        autoCapitalize="words"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => {
                          // Focus next input (email)
                          emailInputRef.current?.focus();
                        }}
                      />
                    </View>
                  </View>

                  {/* Email */}
                  <View style={styles.inputContainer}>
                    <ResponsiveText
                      variant="label"
                      size="sm"
                      weight="semibold"
                      color={theme.colors.primary}
                      align="left"
                      truncateMode="single"
                      style={styles.inputLabel}
                    >
                      {t("emailRequired") || "Email Address *"}
                    </ResponsiveText>
                    <View style={[styles.inputWithIcon, emailError ? { borderColor: "#d32f2f", borderWidth: 1.5 } : null]}>
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={theme.colors.secondary}
                        style={styles.inputIconLeft}
                      />
                      <TextInput
                        ref={emailInputRef}
                        style={styles.newInput}
                        placeholder={t("enterYourEmailAddress")}
                        placeholderTextColor="rgba(10, 1, 1, 0.6)"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          validateEmail(text);
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => {
                          // Focus referral input
                          referralInputRef.current?.focus();
                        }}
                      />
                    </View>
                  </View>

                  {/* Branch Selection */}
                  <View style={styles.inputContainer}>
                    <ResponsiveText
                      variant="label"
                      size="sm"
                      weight="semibold"
                      color={theme.colors.primary}
                      align="left"
                      truncateMode="single"
                      style={styles.inputLabel}
                    >
                      Select Branch *
                    </ResponsiveText>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      disabled={isBranchDisabled || branches.length === 0}
                      onPress={() => setBranchModalVisible(true)}
                      style={[
                        styles.inputWithIcon,
                        branchError ? { borderColor: "#d32f2f", borderWidth: 1.5 } : null,
                        isBranchDisabled && { backgroundColor: "rgba(240, 240, 240, 0.2)", borderColor: "rgba(180, 180, 180, 0.3)" }
                      ]}
                    >
                      <Ionicons
                        name="business-outline"
                        size={20}
                        color={theme.colors.secondary}
                        style={styles.inputIconLeft}
                      />
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 10 }}>
                        <Text style={{
                          color: isBranchDisabled
                            ? "rgba(0, 0, 0, 0.4)"
                            : selectedBranchId
                              ? theme.colors.black
                              : branches.length === 0
                                ? "#d32f2f"
                                : "rgba(10, 1, 1, 0.6)",
                          fontSize: getResponsiveSize(14, 16),
                        }}>
                          {(() => {
                            if (branches.length === 0) return "No branches available";
                            const b = branches.find((br) => Number(br.id) === Number(selectedBranchId));
                            return b ? b.branch_name : "Please Select Branch";
                          })()}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color={branches.length === 0 ? "#d32f2f" : theme.colors.secondary}
                        />
                      </View>
                    </TouchableOpacity>
                    {isBranchDisabled && referralValidated && (
                      <View style={styles.successContainer}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#4CAF50"
                        />
                        <ResponsiveText
                          variant="caption"
                          size="xs"
                          color="#4CAF50"
                          align="left"
                          truncateMode="single"
                          style={styles.successText}
                        >
                          Auto-selected based on referral agent branch
                        </ResponsiveText>
                      </View>
                    )}
                  </View>

                  {/* Referral Code */}
                  <View style={styles.inputContainer}>
                    <ResponsiveText
                      variant="label"
                      size="sm"
                      weight="semibold"
                      color={theme.colors.primary}
                      align="left"
                      truncateMode="single"
                      style={styles.inputLabel}
                    >
                      {t("referralByOptional")}
                    </ResponsiveText>
                    <View style={styles.inputWithIcon}>
                      <Ionicons
                        name="gift-outline"
                        size={20}
                        color={theme.colors.secondary}
                        style={styles.inputIconLeft}
                      />
                      <TextInput
                        ref={referralInputRef}
                        style={styles.newInput}
                        placeholder={t("alphanumericCharacters")}
                        placeholderTextColor="rgba(10, 1, 1, 0.6)"
                        value={referralCode}
                        onChangeText={handleReferralCodeChange}
                        keyboardType="default"
                        autoCapitalize="characters"
                        maxLength={6}
                        onFocus={() => handleInputFocus(referralInputRef)}
                        onLayout={() => {
                          // Input layout handled by KeyboardAvoidingView
                        }}
                      />
                      {/* Validation status icon */}
                      {(referralValidating || referralValidated) && (
                        <View style={styles.validationIconContainer}>
                          {referralValidating && (
                            <Ionicons
                              name="hourglass-outline"
                              size={16}
                              color="#FFA500"
                            />
                          )}
                          {referralValidated && (
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#4CAF50"
                            />
                          )}
                        </View>
                      )}
                      {/* Error icon for invalid referral code */}
                      {!referralValidating &&
                        !referralValidated &&
                        referralCode.length === 6 &&
                        referralError && (
                          <View style={styles.validationIconContainer}>
                            <Ionicons
                              name="close-circle"
                              size={16}
                              color="#ff4444"
                            />
                          </View>
                        )}
                      {/* Clear button for referral code */}
                      {referralCode.length > 0 && (
                        <TouchableOpacity
                          style={styles.clearButton}
                          onPress={clearReferralCode}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="close-circle"
                            size={getResponsiveSize(18, 20)}
                            color="#ff4444"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {referralValidating && (
                      <View style={styles.validatingContainer}>
                        <Ionicons
                          name="hourglass-outline"
                          size={16}
                          color="#FFA500"
                        />
                        <ResponsiveText
                          variant="caption"
                          size="xs"
                          color="#FFA500"
                          align="left"
                          truncateMode="single"
                          style={styles.validatingText}
                        >
                          {t("validatingReferralCode")}
                        </ResponsiveText>
                      </View>
                    )}
                    {referralValidated && referralValidationMessage && (
                      <View style={styles.successContainer}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#4CAF50"
                        />
                        <ResponsiveText
                          variant="caption"
                          size="xs"
                          color="#4CAF50"
                          align="left"
                          truncateMode="single"
                          style={styles.successText}
                        >
                          {referralValidationMessage}
                        </ResponsiveText>
                      </View>
                    )}
                    {!referralValidating &&
                      !referralValidated &&
                      referralCode.length === 6 &&
                      !referralError && (
                        <View style={styles.infoContainer}>
                          <Ionicons
                            name="information-circle"
                            size={16}
                            color="#007AFF"
                          />
                          <ResponsiveText
                            variant="caption"
                            size="xs"
                            color="#007AFF"
                            align="left"
                            truncateMode="double"
                            style={styles.referralInfoText}
                          >
                            {t("referralCodeEnteredValidationPending")}
                          </ResponsiveText>
                          <TouchableOpacity
                            style={{ marginLeft: getResponsiveSize(8, 10) }}
                            onPress={() =>
                              validateReferralCodeWithAPI(referralCode)
                            }
                          >
                            <ResponsiveText
                              variant="caption"
                              size="xs"
                              weight="medium"
                              color="#007AFF"
                              align="left"
                              truncateMode="single"
                              style={[
                                styles.referralInfoText,
                                {
                                  textDecorationLine: "underline",
                                },
                              ]}
                            >
                              {t("retry")}
                            </ResponsiveText>
                          </TouchableOpacity>
                        </View>
                      )}
                  </View>

                  {/* Form Validation Summary */}
                  {/* <View style={styles.validationSummary}>
                <Text style={styles.validationTitle}>Form Status:</Text>
                <View style={styles.validationItems}>
                  <View style={styles.validationItem}>
                    <Ionicons 
                      name={mobileInput && !mobileError ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={mobileInput && !mobileError ? "#4CAF50" : "#ccc"} 
                    />
                    <Text style={[styles.validationText, mobileInput && !mobileError && styles.validationTextValid]}>
                      Mobile Number {mobileInput && !mobileError ? "✓" : ""}
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Ionicons 
                      name={otpVerified ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={otpVerified ? "#4CAF50" : "#ccc"} 
                    />
                    <Text style={[styles.validationText, otpVerified && styles.validationTextValid]}>
                      OTP Verification {otpVerified ? "✓" : ""}
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Ionicons 
                      name={name && !nameError ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={name && !nameError ? "#4CAF50" : "#ccc"} 
                    />
                    <Text style={[styles.validationText, name && !nameError && styles.validationTextValid]}>
                      Full Name {name && !nameError ? "✓" : ""}
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Ionicons 
                      name={email && !emailError ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={email && !emailError ? "#4CAF50" : "#ccc"} 
                    />
                    <Text style={[styles.validationText, email && !emailError && styles.validationTextValid]}>
                      Email Address {email && !emailError ? "✓" : ""}
                    </Text>
                  </View>
                  {referralCode && (
                    <View style={styles.validationItem}>
                      <Ionicons 
                        name={referralValidated ? "checkmark-circle" : referralError ? "close-circle" : "ellipse-outline"} 
                        size={16} 
                        color={referralValidated ? "#4CAF50" : referralError ? "#ff4444" : "#ccc"} 
                      />
                      <Text style={[styles.validationText, referralValidated && styles.validationTextValid, referralError && styles.validationTextError]}>
                        Referral Code {referralValidated ? "✓" : referralError ? "✗" : ""}
                      </Text>
                    </View>
                  )}
                </View>
              </View> */}

                  {/* Submit Button */}
                  <ResponsiveButton
                    title={
                      loading
                        ? t("processing")
                        : t("continueToMpinSetup") || "Continue to MPIN Setup"
                    }
                    variant="secondary"
                    size="md"
                    fullWidth={true}
                    loading={loading}
                    disabled={loading}
                    onPress={handleSubmit}
                    style={[
                      styles.loginButton,
                      loading && styles.loginButtonDisabled,
                      { height: 42, minHeight: 42, borderRadius: 21 },
                    ]}
                  />

                  {/* Login Link at the Bottom */}
                  <TouchableOpacity
                    style={styles.loginLinkContainer}
                    onPress={() => router.replace({ pathname: "/(auth)/login" })}
                  >
                    <Text style={styles.loginLinkText}>
                      {t("alreadyHaveAccount")}{" "}
                      <Text
                        style={{
                          textDecorationLine: "underline",
                          color: theme.colors.primary,
                          fontWeight: "bold",
                        }}
                      >
                        {t("login")}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Inline OTP Section */}
                <View style={!otpModalVisible ? { display: "none" } : { width: "100%" }}>
                  {!otpVerified && (
                    <View style={styles.mobileDisplayContainer}>
                      <ResponsiveText
                        variant="body"
                        size="sm"
                        color={theme.colors.textDark}
                        align="left"
                        truncateMode="single"
                        inRow={true}
                        style={styles.mobileDisplayText}
                      >
                        {t("mobile")}:{" "}
                        {(mobileInput || mobileStr)?.replace(
                          /(\d{3})(\d{3})(\d{4})/,
                          "$1-$2-$3"
                        )}
                      </ResponsiveText>
                    </View>
                  )}

                  {!otpVerified && (
                    <View style={styles.otpInputsContainer}>
                      {pins.map((pin, index) => (
                        <TextInput
                          key={index}
                          ref={inputRefs[index]}
                          style={styles.otpBox}
                          keyboardType="numeric"
                          maxLength={1}
                          value={pin}
                          onChangeText={(text) => handlePinChange(text, index)}
                          onKeyPress={(e) => handleKeyPress(e, index)}
                          secureTextEntry={false}
                          textContentType="oneTimeCode"
                          autoComplete="sms-otp"
                        />
                      ))}
                    </View>
                  )}

                  {otpVerified && (
                    <View style={{ marginVertical: 20, alignItems: 'center' }}>
                      <Ionicons name="checkmark-circle" size={54} color="#2e7d32" />
                    </View>
                  )}

                  {!otpVerified && clipboardOtp ? (
                    <TouchableOpacity
                      style={styles.clipboardHintContainer}
                      onPress={() => {
                        setOtp(clipboardOtp);
                        setClipboardOtp(""); // Clear hint after pasting
                      }}
                    >
                      <Ionicons name="clipboard-outline" size={16} color={theme.colors.primary} />
                      <ResponsiveText
                        variant="body"
                        size="xs"
                        weight="semibold"
                        color="#b8860b"
                        align="center"
                        style={styles.clipboardHintText}
                      >
                        Tap to paste OTP: {clipboardOtp}
                      </ResponsiveText>
                    </TouchableOpacity>
                  ) : null}

                  {!otpVerified && (
                    <TouchableOpacity
                      style={[
                        styles.verifyOtpButton,
                        (otp.length !== 4 || otpVerifying || autoOtpSending) &&
                        styles.getOtpButtonDisabled,
                        { width: '100%', marginTop: 20 }
                      ]}
                      onPress={handleVerifyOtp}
                      disabled={otp.length !== 4 || otpVerifying || autoOtpSending}
                    >
                      <ResponsiveText
                        variant="button"
                        size="md"
                        weight="bold"
                        color="#fff"
                        align="center"
                        truncateMode="single"
                        style={styles.getOtpButtonText}
                      >
                        {otpVerifying
                          ? t("verifying")
                          : autoOtpSending
                            ? t("sendingOtp")
                            : t("verifyOtp")}
                      </ResponsiveText>
                    </TouchableOpacity>
                  )}

                  {!otpVerified && (
                    <View style={[styles.resendRow, { marginTop: 15 }]}>
                      <ResponsiveText
                        variant="body"
                        size="xs"
                        color="#444"
                        align="left"
                        truncateMode="single"
                        style={styles.resendText}
                      >
                        {t("didntReceiveOtp")}{" "}
                      </ResponsiveText>
                      <Pressable
                        onPress={handleResendOtp}
                        disabled={
                          resendTimer > 0 ||
                          resendCount >= resendLimit ||
                          resendLoading
                        }
                      >
                        <ResponsiveText
                          variant="body"
                          size="xs"
                          weight="bold"
                          color={(resendTimer > 0 ||
                            resendCount >= resendLimit ||
                            resendLoading) ? "#aaa" : theme.colors.primary}
                          align="left"
                          truncateMode="double"
                          style={[
                            styles.resendLink,
                            (resendTimer > 0 ||
                              resendCount >= resendLimit ||
                              resendLoading) &&
                            styles.resendLinkDisabled,
                          ]}
                        >
                          {resendLoading
                            ? t("sending")
                            : resendTimer > 0
                              ? t("resendIn").replace("{seconds}", resendTimer.toString())
                              : resendCount >= resendLimit
                                ? t("resendLimitReached")
                                : t("resendOtpWithWait").replace("{seconds}", getNextTimerDuration(resendCount).toString())}
                        </ResponsiveText>
                      </Pressable>
                    </View>
                  )}

                  {!otpVerified && (
                    <TouchableOpacity
                      style={[styles.cancelLinkButton, { alignSelf: 'center', marginTop: 15 }]}
                      onPress={() => {
                        setOtpModalVisible(false);
                        setOtpSentFromModal(false);
                      }}
                    >
                      <Text style={[styles.cancelLinkText, { color: theme.colors.primary, fontWeight: 'bold' }]}>{t("cancel")}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
        {!isKeyboardVisible && (
          <TouchableOpacity
            onPress={() => Linking.openURL(theme.constants.providerUrl)}
            style={{
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              bottom: getResponsiveHeight(10, 20),
              left: 0,
              right: 0,
              zIndex: 10,
            }}
          >
            <Text style={{
              fontSize: 12,
              color: "rgba(0, 0, 0, 0.4)",
              fontWeight: "500",
              textDecorationLine: "underline",
            }}>
              Powered by {theme.constants.providerName}
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>


      {/* OTP Error Modal */}
      <Modal
        visible={otpErrorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOtpErrorModalVisible(false)}
      >
        <View style={styles.otpModalOverlay}>
          <View style={[styles.otpModalContent, { alignItems: "center" }]}>
            <Ionicons
              name="alert-circle"
              size={40}
              color="#ff4444"
              style={{ marginBottom: 10 }}
            />
            <ResponsiveText
              variant="title"
              size="md"
              weight="bold"
              color="#ff4444"
              align="center"
              truncateMode="single"
              style={styles.otpModalTitle}
            >
              {t("error")}
            </ResponsiveText>
            <ResponsiveText
              variant="body"
              size="sm"
              color="#333"
              align="center"
              truncateMode="triple"
              maxLines={3}
              style={{
                marginBottom: 24,
                paddingHorizontal: getResponsiveSize(10, 15),
              }}
            >
              {otpErrorMessage}
            </ResponsiveText>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                gap: Math.min(8, width * 0.02),
                minHeight: Math.min(50, width * 0.125),
              }}
            >
              <TouchableOpacity
                style={[
                  styles.verifyOtpButton,
                  {
                    backgroundColor: theme.colors.secondary,
                    flex: 1,
                    marginRight: 8,
                  },
                ]}
                onPress={() => {
                  setOtpErrorModalVisible(false);
                  router.replace({ pathname: "/(auth)/login" });
                }}
              >
                <ResponsiveText
                  variant="button"
                  size="md"
                  weight="bold"
                  color="#fff"
                  align="center"
                  truncateMode="single"
                  style={styles.getOtpButtonText}
                >
                  {t("login")}
                </ResponsiveText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.verifyOtpButton,
                  { backgroundColor: "#aaa", flex: 1, marginLeft: 8 },
                ]}
                onPress={() => {
                  setOtpErrorModalVisible(false);
                  setOtpVerified(false);
                }}
              >
                <ResponsiveText
                  variant="button"
                  size="md"
                  weight="bold"
                  color="#fff"
                  align="center"
                  truncateMode="single"
                  style={styles.getOtpButtonText}
                >
                  {t("close")}
                </ResponsiveText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Referral Error Modal */}
      <Modal
        visible={referralErrorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReferralErrorModalVisible(false)}
      >
        <View style={styles.otpModalOverlay}>
          <View style={[styles.otpModalContent, { alignItems: "center" }]}>
            <Ionicons
              name="alert-circle"
              size={getResponsiveSize(40, 45)}
              color="#ff4444"
              style={{ marginBottom: getResponsiveHeight(10, 15) }}
            />
            <ResponsiveText
              variant="title"
              size="md"
              weight="bold"
              color="#ff4444"
              align="center"
              truncateMode="double"
              style={styles.otpModalTitle}
            >
              {t("referralCodeNotFound")}
            </ResponsiveText>
            <ResponsiveText
              variant="body"
              size="sm"
              color="#333"
              align="center"
              truncateMode="triple"
              maxLines={3}
              style={{
                marginBottom: getResponsiveHeight(24, 30),
                paddingHorizontal: getResponsiveSize(10, 15),
                lineHeight: getResponsiveHeight(22, 26),
              }}
            >
              {referralErrorMessage}
            </ResponsiveText>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                gap: getResponsiveSize(8, 12),
              }}
            >
              <TouchableOpacity
                style={[
                  styles.verifyOtpButton,
                  {
                    backgroundColor: theme.colors.secondary,
                    flex: 1,
                    paddingVertical: getResponsiveHeight(12, 15),
                  },
                ]}
                onPress={() => {
                  setReferralErrorModalVisible(false);
                  clearReferralCode();
                }}
              >
                <ResponsiveText
                  variant="button"
                  size="md"
                  weight="bold"
                  color="#fff"
                  align="center"
                  truncateMode="double"
                  style={[
                    styles.getOtpButtonText,
                    { fontSize: getResponsiveSize(18, 20) },
                  ]}
                >
                  {t("clearAndContinue")}
                </ResponsiveText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.verifyOtpButton,
                  {
                    backgroundColor: "#007AFF",
                    flex: 1,
                    paddingVertical: getResponsiveHeight(12, 15),
                  },
                ]}
                onPress={() => {
                  setReferralErrorModalVisible(false);
                  // Focus back to referral input for retry
                  setTimeout(() => {
                    referralInputRef.current?.focus();
                  }, 300);
                }}
              >
                <ResponsiveText
                  variant="button"
                  size="md"
                  weight="bold"
                  color="#fff"
                  align="center"
                  truncateMode="single"
                  style={[
                    styles.getOtpButtonText,
                    { fontSize: getResponsiveSize(18, 20) },
                  ]}
                >
                  {t("tryAgain")}
                </ResponsiveText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.closeOtpModalBtn}
              onPress={() => setReferralErrorModalVisible(false)}
            >
              <ResponsiveText
                variant="body"
                size="sm"
                color="#888"
                align="center"
                truncateMode="single"
                style={styles.closeOtpModalText}
              >
                {t("close")}
              </ResponsiveText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Branch Selection Modal */}
      <Modal
        visible={branchModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <View style={styles.otpModalOverlay}>
          <View style={[styles.otpModalContent, { maxHeight: height * 0.7, padding: 24 }]}>
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", borderBottomWidth: 1, borderBottomColor: "#f0f0f0", paddingBottom: 12, marginBottom: 12 }}>
              <ResponsiveText variant="title" size="md" weight="bold" color="#1a1a1a">
                {t("selectBranch") || "Select Branch"}
              </ResponsiveText>
              <TouchableOpacity onPress={() => setBranchModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            {/* List of Branches */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }}>
              {branches.map((b) => {
                const isSelected = Number(b.id) === Number(selectedBranchId);
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => {
                      setSelectedBranchId(Number(b.id));
                      validateBranch(Number(b.id));
                      setBranchModalVisible(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: isSelected ? "rgba(133, 1, 17, 0.05)" : "transparent",
                      borderWidth: 1,
                      borderColor: isSelected ? theme.colors.primary : "transparent",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{
                      fontSize: 16,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? theme.colors.primary : "#1a1a1a",
                    }}>
                      {b.branch_name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: getResponsiveHeight(10, 20),
  },
  mainContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: getResponsiveHeight(10, 15),
  },
  logoContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    marginBottom: 0,
  },
  logo: {
    aspectRatio: 0.8,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: getResponsiveSize(20, 30),
    paddingVertical: getResponsiveHeight(5, 10),
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: getResponsiveHeight(20, 25),
    paddingHorizontal: getResponsiveSize(10, 15),
  },
  glassmorphismCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: getResponsiveSize(20, 25),
    padding: getResponsiveSize(25, 30),
    paddingTop: getResponsiveSize(30, 35),
    paddingBottom: getResponsiveSize(30, 35),
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: getResponsiveHeight(15, 20),
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        backdropFilter: "blur(20px)",
      },
      android: {
        elevation: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
    }),
    position: "relative",
  },
  pageTitle: {
    color: theme.colors.primary,
    fontSize: getResponsiveSize(28, 32),
    fontWeight: "bold",
    marginBottom: getResponsiveHeight(8, 12),
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    flexShrink: 1,
    paddingHorizontal: getResponsiveSize(10, 15),
  },
  subtitle: {
    color: theme.colors.primary,
    fontSize: getResponsiveSize(16, 18),
    textAlign: "center",
    opacity: 0.8,
    fontWeight: "400",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flexShrink: 1,
    paddingHorizontal: getResponsiveSize(10, 15),
  },
  inputContainer: {
    width: "100%",
    maxWidth: width * 0.9,
    alignSelf: "center",
    marginBottom: getResponsiveHeight(5, 6),
    paddingHorizontal: getResponsiveSize(5, 10),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: getResponsiveSize(12, 16),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: getResponsiveSize(12, 16),
    paddingVertical: getResponsiveHeight(6, 8),
    minHeight: getResponsiveHeight(50, 60),
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    width: getResponsiveSize(40, 45),
    height: getResponsiveSize(40, 45),
    borderRadius: getResponsiveSize(20, 22),
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: getResponsiveSize(12, 15),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContent: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  inputLabel: {
    color: theme.colors.primary,
    fontSize: getResponsiveSize(14, 16),
    fontWeight: "600",
    marginBottom: getResponsiveHeight(8, 10),
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flexShrink: 1,
  },
  input: {
    color: theme.colors.black,
    fontSize: getResponsiveSize(14, 16),
    paddingVertical: getResponsiveHeight(6, 8),
    paddingHorizontal: 0,
    minHeight: getResponsiveHeight(28, 32),
    flex: 1,
    textAlign: "left",
    maxWidth: "100%",
    fontWeight: "400",
  },
  disabledInput: {
    opacity: 0.6,
  },
  // New input styles for direct background placement
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 6,
    minHeight: getResponsiveHeight(45, 50),
  },
  inputIconLeft: {
    marginRight: 12,
    color: theme.colors.secondary,
  },
  inputIconRight: {
    marginLeft: 8,
  },
  newInput: {
    flex: 1,
    color: theme.colors.black,
    fontSize: getResponsiveSize(14, 16),
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: getResponsiveHeight(28, 32),
    textAlign: "left",
    fontWeight: "400",
  },
  newErrorText: {
    color: "#d32f2f",
    fontSize: getResponsiveSize(12, 14),
    marginTop: getResponsiveHeight(4, 6),
    marginLeft: 0,
    marginBottom: getResponsiveHeight(4, 6),
    flexShrink: 1,
    flexWrap: "wrap",
  },
  newGetOtpButton: {
    marginTop: getResponsiveHeight(8, 10),
    alignSelf: "flex-end",
    backgroundColor: theme.colors.secondary,
    paddingVertical: getResponsiveHeight(10, 12),
    paddingHorizontal: getResponsiveSize(20, 24),
    borderRadius: getResponsiveSize(8, 10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
    flexShrink: 1,
    minWidth: getResponsiveSize(100, 120),
  },
  newGetOtpButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  newGetOtpButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: getResponsiveSize(14, 16),
    textAlign: "center",
    flexShrink: 1,
  },
  errorText: {
    color: "#ff4444",
    fontSize: Math.min(12, width * 0.03),
    marginTop: getResponsiveHeight(8, 10),
    marginLeft: getResponsiveSize(55, 60),
    marginBottom: getResponsiveHeight(5, 8),
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Math.min(5, width * 0.012),
    marginLeft: Math.min(55, width * 0.14),
    flexWrap: "wrap",
  },
  successText: {
    color: "#4CAF50",
    fontSize: Math.min(12, width * 0.03),
    marginLeft: Math.min(5, width * 0.012),
    flexShrink: 1,
    flexWrap: "wrap",
  },
  loginButton: {
    width: "100%",
    maxWidth: width * 0.9,
    height: getResponsiveHeight(45, 50),
    borderRadius: getResponsiveSize(25, 28),
    overflow: "hidden",
    marginTop: getResponsiveHeight(15, 20),
    marginBottom: getResponsiveHeight(10, 15),
    alignSelf: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradientButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginButtonText: {
    color: theme.colors.textDark,
    fontSize: getResponsiveSize(22, 24),
    fontWeight: "bold",
    marginLeft: getResponsiveSize(8, 10),
  },
  infoSection: {
    marginTop: Math.min(5, width * 0.012),
    marginBottom: Math.min(15, width * 0.04),
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Math.min(8, width * 0.02),
  },
  infoText: {
    color: theme.colors.textLight,
    fontSize: Math.min(14, width * 0.035),
    marginLeft: Math.min(8, width * 0.02),
    opacity: 0.8,
  },
  backButton: {
    marginTop: Math.min(20, width * 0.05),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: Math.min(16, width * 0.04),
    marginLeft: Math.min(5, width * 0.012),
    opacity: 0.8,
  },
  errorAlert: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: Math.min(20, width * 0.05),
    right: Math.min(20, width * 0.05),
    backgroundColor: "rgba(255, 68, 68, 0.95)",
    borderRadius: Math.min(12, width * 0.03),
    padding: Math.min(15, width * 0.04),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  errorMessage: {
    color: "#fff",
    fontSize: Math.min(16, width * 0.04),
    marginLeft: Math.min(10, width * 0.025),
    flex: 1,
  },
  closeButton: {
    padding: Math.min(5, width * 0.012),
  },
  loginLinkContainer: {
    marginTop: getResponsiveHeight(10, 15),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: getResponsiveHeight(8, 12),
    paddingHorizontal: getResponsiveSize(20, 30),
    width: "100%",
  },
  loginLinkText: {
    color: theme.colors.primary,
    fontSize: getResponsiveSize(14, 16),
    opacity: 0.85,
    fontWeight: "400",
    flexShrink: 1,
    flexWrap: "wrap",
    paddingHorizontal: getResponsiveSize(10, 15),
  },
  logoContainerNew: {
    width: "100%",
    alignItems: "center",
    marginBottom: getResponsiveHeight(15, 20),
    marginTop: getResponsiveHeight(5, 10),
    paddingHorizontal: getResponsiveSize(10, 15),
  },
  logoNew: {
    width: getResponsiveSize(160, 220),
    height: getResponsiveHeight(100, 140),
    resizeMode: "contain",
    maxWidth: width * 0.6,
    maxHeight: height * 0.15,
  },
  getOtpButton: {
    marginTop: Math.min(8, width * 0.02),
    alignSelf: "flex-end",
    backgroundColor: theme.colors.secondary,
    paddingVertical: Math.min(8, width * 0.02),
    paddingHorizontal: Math.min(22, width * 0.055),
    borderRadius: Math.min(18, width * 0.045),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  getOtpButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  getOtpButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: Math.min(18, width * 0.045),
    textAlign: "center",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  otpModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  otpModalContent: {
    backgroundColor: "#fff",
    borderRadius: getResponsiveSize(16, 18),
    padding: getResponsiveSize(16, 20),
    width: getResponsiveSize(320, 380),
    maxWidth: width * 0.88,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minHeight: getResponsiveHeight(260, 300),
  },
  otpModalTitle: {
    fontSize: Math.min(22, width * 0.055),
    fontWeight: "bold",
    marginBottom: Math.min(8, width * 0.02),
    color: theme.colors.secondary,
  },
  otpModalSubtitle: {
    fontSize: Math.min(16, width * 0.04),
    color: "#333",
    marginBottom: Math.min(20, width * 0.05),
    textAlign: "center",
    lineHeight: Math.min(22, width * 0.055),
    paddingHorizontal: Math.min(10, width * 0.025),
    flexShrink: 1,
    flexWrap: "wrap",
  },
  otpInput: {
    fontSize: Math.min(24, width * 0.06),
    letterSpacing: Math.min(12, width * 0.03),
    borderBottomWidth: 2,
    borderColor: theme.colors.secondary,
    width: Math.min(140, width * 0.35),
    textAlign: "center",
    marginBottom: Math.min(16, width * 0.04),
    color: "#222",
    paddingVertical: Math.min(6, width * 0.015),
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: Math.min(6, width * 0.015),
    fontWeight: "600",
    minHeight: Math.min(44, width * 0.11),
  },
  verifyOtpButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: Math.min(12, width * 0.03),
    paddingHorizontal: Math.min(20, width * 0.05),
    borderRadius: Math.min(12, width * 0.03),
    marginBottom: Math.min(16, width * 0.04),
    alignItems: "center",
    justifyContent: "center",
    minHeight: Math.min(48, width * 0.12),
    flex: 1,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Math.min(10, width * 0.025),
    flexWrap: "wrap",
    justifyContent: "center",
  },
  resendText: {
    color: "#444",
    fontSize: Math.min(14, width * 0.035),
    marginRight: Math.min(8, width * 0.02),
    flexShrink: 1,
  },
  resendLink: {
    color: theme.colors.primary,
    fontWeight: "bold",
    fontSize: Math.min(14, width * 0.035),
    textDecorationLine: "underline",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  resendLinkDisabled: {
    color: "#aaa",
    textDecorationLine: "none",
  },
  closeOtpModalBtn: {
    marginTop: Math.min(8, width * 0.02),
    padding: Math.min(6, width * 0.015),
  },
  closeOtpModalText: {
    color: "#888",
    fontSize: Math.min(14, width * 0.035),
    textDecorationLine: "underline",
  },
  autoOtpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Math.min(4, width * 0.01),
    paddingHorizontal: Math.min(4, width * 0.01),
  },
  autoOtpText: {
    color: "#4CAF50",
    fontSize: Math.min(12, width * 0.03),
    marginLeft: Math.min(4, width * 0.01),
    fontStyle: "italic",
  },
  validatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Math.min(5, width * 0.012),
    marginLeft: Math.min(55, width * 0.14),
    flexWrap: "wrap",
  },
  validatingText: {
    fontSize: Math.min(12, width * 0.03),
    marginLeft: Math.min(5, width * 0.012),
    fontStyle: "italic",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Math.min(5, width * 0.012),
    marginLeft: Math.min(55, width * 0.14),
    flexWrap: "wrap",
  },
  referralInfoText: {
    fontSize: Math.min(12, width * 0.03),
    marginLeft: Math.min(5, width * 0.012),
    fontStyle: "italic",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  validationIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: Math.min(10, width * 0.025),
  },
  clearButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: getResponsiveSize(8, 10),
    paddingVertical: getResponsiveSize(4, 6),
    borderRadius: getResponsiveSize(12, 15),
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    marginLeft: getResponsiveSize(4, 6),
  },
  progressContainer: {
    marginBottom: Math.min(20, width * 0.05),
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: Math.min(6, width * 0.015),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: Math.min(3, width * 0.008),
    overflow: "hidden",
    marginBottom: Math.min(8, width * 0.02),
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.secondary,
    borderRadius: Math.min(3, width * 0.008),
  },
  progressText: {
    color: "#ffffff",
    fontSize: Math.min(12, width * 0.03),
    opacity: 0.8,
  },
  validationSummary: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: Math.min(12, width * 0.03),
    padding: Math.min(16, width * 0.04),
    marginBottom: Math.min(20, width * 0.05),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  validationTitle: {
    color: "#ffffff",
    fontSize: Math.min(14, width * 0.035),
    fontWeight: "bold",
    marginBottom: Math.min(12, width * 0.03),
  },
  validationItems: {
    gap: Math.min(8, width * 0.02),
  },
  validationItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  mobileDisplayContainer: {
    width: "100%",
    marginBottom: Math.min(12, width * 0.03),
    paddingHorizontal: Math.min(8, width * 0.02),
  },
  mobileDisplayText: {
    color: "#333",
    fontSize: Math.min(14, width * 0.035),
    textAlign: "center",
    fontWeight: "600",
    paddingHorizontal: Math.min(12, width * 0.03),
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: Math.min(6, width * 0.015),
    paddingVertical: Math.min(6, width * 0.015),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    minHeight: Math.min(36, width * 0.09),
    maxWidth: "100%",
    flexShrink: 1,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: Math.min(16, width * 0.04),
    gap: Math.min(8, width * 0.02),
    minHeight: Math.min(50, width * 0.125),
  },
  modalButton: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    paddingVertical: Math.min(14, width * 0.035),
    paddingHorizontal: Math.min(12, width * 0.03),
    borderRadius: Math.min(12, width * 0.03),
    alignItems: "center",
    justifyContent: "center",
    minHeight: Math.min(48, width * 0.12),
    minWidth: Math.min(80, width * 0.2),
  },
  modalButtonText: {
    color: theme.colors.gold,
    fontSize: Math.min(18, width * 0.045),
    fontWeight: "bold",
    textAlign: "center",
  },
  cancelLinkButton: {
    flex: 1,
    paddingVertical: Math.min(12, width * 0.03),
    paddingHorizontal: Math.min(16, width * 0.04),
    alignSelf: "center",
    justifyContent: "center",
  },
  cancelLinkText: {
    color: theme.colors.secondary,
    fontSize: Math.min(16, width * 0.04),
    fontWeight: "500",
    textDecorationLine: "underline",
    alignSelf: "center",
    justifyContent: "center",
  },
  resetLinkButton: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingVertical: Math.min(8, width * 0.02),
    paddingHorizontal: Math.min(12, width * 0.03),
  },
  resetLinkText: {
    color: theme.colors.secondary,
    fontSize: Math.min(14, width * 0.035),
    fontWeight: "500",
    textDecorationLine: "underline",
    marginLeft: Math.min(4, width * 0.01),
    flexShrink: 1,
  },
  getOtpLinkButton: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingVertical: Math.min(8, width * 0.02),
    paddingHorizontal: Math.min(12, width * 0.03),
  },
  getOtpLinkButtonDisabled: {
    opacity: 0.5,
  },
  getOtpLinkText: {
    color: theme.colors.secondary,
    fontSize: Math.min(14, width * 0.035),
    fontWeight: "500",
    textDecorationLine: "underline",
    marginLeft: Math.min(4, width * 0.01),
    flexShrink: 1,
  },
  getOtpLinkTextDisabled: {
    color: theme.colors.text.mediumGrey,
  },
  validationText: {
    color: "#ffffff",
    fontSize: Math.min(12, width * 0.03),
    marginLeft: Math.min(8, width * 0.02),
    opacity: 0.7,
  },
  validationTextValid: {
    opacity: 1,
    fontWeight: "500",
  },
  validationTextError: {
    color: "#ff4444",
    opacity: 1,
  },
  tipsSection: {
    marginTop: Math.min(20, width * 0.05),
    marginBottom: Math.min(15, width * 0.04),
  },
  tipsTitle: {
    color: "#ffffff",
    fontSize: Math.min(16, width * 0.04),
    fontWeight: "bold",
    marginBottom: Math.min(12, width * 0.03),
    textAlign: "center",
  },
  tipsContainer: {
    gap: Math.min(8, width * 0.02),
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: Math.min(8, width * 0.02),
    padding: Math.min(10, width * 0.025),
  },
  tipText: {
    color: "#ffffff",
    fontSize: Math.min(12, width * 0.03),
    marginLeft: Math.min(8, width * 0.02),
    opacity: 0.9,
    flex: 1,
  },
  clipboardHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.35)",
    marginTop: 8,
    marginBottom: 8,
    alignSelf: "center",
  },
  clipboardHintText: {
    color: "#b8860b",
    marginLeft: 6,
  },
  otpInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "70%",
    marginBottom: Math.min(16, width * 0.04),
    marginTop: 15,
  },
  otpBox: {
    width: Math.min(48, width * 0.12),
    height: Math.min(52, width * 0.13),
    borderWidth: 1.5,
    borderColor: theme.colors.secondary,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
});

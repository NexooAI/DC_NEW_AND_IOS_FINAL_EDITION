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
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Icon from "@expo/vector-icons/MaterialIcons";
import api from "@/services/api";
import { useTranslation } from "@/hooks/useTranslation";
import ResponsiveText from "@/components/ResponsiveText";
import ResponsiveButton from "@/components/ResponsiveButton";

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

  // Helper function to get next timer duration
  const getNextTimerDuration = (currentCount: number) => {
    if (currentCount === 0) return 30; // 1st resend: 30 seconds
    if (currentCount === 1) return 60; // 2nd resend: 60 seconds
    return 120; // 3rd and beyond: 120 seconds
  };

  const router = useRouter();
  const referralInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const { mobile } = useLocalSearchParams();
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
  useEffect(() => {
    // logger.log('🔍 useEffect triggered - mobileStr:', mobileStr);

    if (
      mobileStr &&
      mobileStr.length === 10 &&
      /^\d{10}$/.test(mobileStr) &&
      !otpPromptShown
    ) {
      logger.log("🔍 Setting mobile input from param:", mobileStr);
      setMobileInput(mobileStr);

      // Ask user if they want to trigger OTP
      logger.log("🔍 Asking user to trigger OTP for mobile:", mobileStr);
      setOtpPromptShown(true);
      Alert.alert(
        t("sendOtp"),
        t("doYouWantToSendOtp").replace("{mobile}", mobileStr),
        [
          {
            text: t("no"),
            style: "cancel",
            onPress: () => {
              logger.log("🔍 User declined OTP trigger");
              setAutoOtpSent(false);
              setAutoOtpLoading(false);
            },
          },
          {
            text: t("yes"),
            onPress: () => {
              logger.log("🔍 User confirmed OTP trigger");
              setAutoOtpSent(true);
              setAutoOtpLoading(true);
              // Small delay to ensure the component is fully mounted
              setTimeout(() => {
                // Pass the mobile number directly to avoid state timing issues
                handleGetOtpWithMobile(mobileStr);
              }, 500);
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      // logger.log('🔍 Not auto-triggering OTP - mobileStr:', mobileStr, 'length:', mobileStr?.length);
      setAutoOtpSent(false);
      setAutoOtpLoading(false);
    }
  }, [mobileStr, otpPromptShown]);

  // Immediate effect to set mobile input if available
  useEffect(() => {
    if (mobileStr && mobileStr.length === 10) {
      logger.log("🔍 Immediate effect - Setting mobileInput to:", mobileStr);
      setMobileInput(mobileStr);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // logger.log('🔍 useFocusEffect triggered - mobileStr:', mobileStr);

      setName("");
      setEmail("");
      setReferralCode("");
      setNameError("");
      setEmailError("");
      setReferralError("");
      setMobileError("");
      setReferralValidated(false);
      setReferralValidationMessage("");
      setReferralValidating(false);
      setOtpPromptShown(false); // Reset OTP prompt state
    }, [])
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

  const validateForm = () => {
    const isMobileValid = validateMobile(mobileInput);
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isReferralValid = validateReferralCode(referralCode);

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
      isMobileValid && isNameValid && isEmailValid && isReferralValid;
    setIsFormValid(formValid);
    return formValid;
  };

  const checkForm = () => {
    const isMobileValid = validateMobile(mobileInput, false);
    const isNameValid = validateName(name, false);
    const isEmailValid = validateEmail(email, false);
    const isReferralValid = validateReferralCode(referralCode, false);
    
    // Check referral validation status without showing errors
    if (referralCode && referralCode.length === 6 && !referralValidated) {
      return false;
    }

    const formValid = isMobileValid && isNameValid && isEmailValid && isReferralValid;
    setIsFormValid(formValid);
    return formValid;
  };

  const handleSubmit = () => {
    if (!otpVerified) {
      // Validate mobile number first
      const isMobileValid = validateMobile(mobileInput);
      if (!isMobileValid) return;

      // Show enhanced OTP modal instead of alert
      setOtpModalVisible(true);
      // Auto-trigger OTP send when modal opens via useEffect

      return;
    }
    if (validateForm()) {
      // Navigate to MPIN page with user data as params
      router.push({
        pathname: "/(auth)/mpin",
        params: {
          name,
          email,
          mobile: mobileInput,
          referral_code: referralCode.trim(),
        },
      });
    }
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
      const response = await fetch(`${theme.baseUrl}/auth/referrals/${code}`, {
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

  // Timer effect for resend with progressive timing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpModalVisible && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpModalVisible, resendTimer]);

  // Auto-trigger OTP when modal opens
  useEffect(() => {
    if (
      otpModalVisible &&
      !otpSentFromModal &&
      !otpVerified &&
      !autoOtpSending
    ) {
      // Small delay to ensure modal is fully visible before sending OTP
      const timer = setTimeout(() => {
        setAutoOtpSending(true);
        setOtpSentFromModal(true);
        handleGetOtp();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [otpModalVisible, otpSentFromModal, otpVerified, autoOtpSending]);

  // Cleanup referral validation timeout on unmount
  useEffect(() => {
    return () => {
      if (referralValidationTimeout) {
        clearTimeout(referralValidationTimeout);
      }
    };
  }, [referralValidationTimeout]);

  // Update form validity when fields change
  useEffect(() => {
    checkForm();

    // Calculate progress percentage
    const completedFields =
      (mobileInput ? 1 : 0) +
      (name ? 1 : 0) +
      (email ? 1 : 0) +
      (otpVerified ? 1 : 0);
    const percentage = Math.min(completedFields * 25, 100);
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
      const response = await fetch(`${theme.baseUrl}/register/mobile`, {
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
        setResendTimer(0); // No initial timer for first OTP send
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
  const handleGetOtp = async () => {
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
      return;
    }

    try {
      const response = await fetch(`${theme.baseUrl}/register/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobileToUse }),
      });
      const data = await response.json();
      if (response.ok) {
        setOtpModalVisible(true);
        setOtpSentFromModal(true); // Prevent auto-trigger loop
        setResendTimer(0); // No initial timer for first OTP send
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

  // Resend OTP logic with progressive timer
  const handleResendOtp = async () => {
    if (resendCount < resendLimit && !resendLoading && resendTimer === 0) {
      setResendLoading(true);

      const mobileToUse = mobileInput || mobileStr;
      logger.log("🔍 handleResendOtp - mobileToUse:", mobileToUse);

      try {
        const response = await fetch(`${theme.baseUrl}/register/mobile`, {
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
    if (otp.length !== 4) {
      Alert.alert(t("invalidOtp"), t("pleaseEnter4DigitOtp"));
      return;
    }
    setOtpVerifying(true);

    const mobileToUse = mobileInput || mobileStr;
    logger.log("🔍 handleVerifyOtp - mobileToUse:", mobileToUse);

    try {
      const response = await fetch(`${theme.baseUrl}/register/verify-otp`, {
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
        setOtpVerified(true);
        // setOtpModalVisible(false); // Keep modal open to show success state
        setOtpVerifying(false);
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
    <ImageBackground
      source={require("../../../assets/images/bg_new.jpg")}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={["#1a2a39", "#1a2a39", "#1a2a39"]}
        style={styles.gradient}
      >
        {showError && (
          <ErrorAlert message={errorMessage} onClose={hideErrorAlert} />
        )}

        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
            keyboardVerticalOffset={
              Platform.OS === "ios"
                ? getResponsiveHeight(20, 30)
                : getResponsiveHeight(20, 30)
            }
          >
            <View style={styles.mainContent}>
              <View style={styles.formContainer}>
                {/* App Logo above the form */}
                <View style={styles.logoContainerNew}>
                  <Image
                    source={require("../../../assets/images/logo_trans.png")}
                    style={styles.logoNew}
                  />
                </View>

                {/* Page Title and Subtitle */}
                <View style={styles.titleContainer}>
                  <ResponsiveText
                    variant="title"
                    size="lg"
                    weight="bold"
                    color="#ffffff"
                    align="center"
                    truncateMode="double"
                    style={styles.pageTitle}
                  >
                    {t("createYourAccount")}
                  </ResponsiveText>
                  <ResponsiveText
                    variant="subtitle"
                    size="md"
                    color="#ffffff"
                    align="center"
                    truncateMode="double"
                    style={styles.subtitle}
                  >
                    {t("enterYourDetailsToGetStarted")}
                  </ResponsiveText>
                </View>

                {/* Mobile Number (Editable) */}
                <View style={styles.inputContainer}>
                  <ResponsiveText
                    variant="label"
                    size="sm"
                    weight="semibold"
                    color="#ffffff"
                    align="left"
                    truncateMode="single"
                    style={styles.inputLabel}
                  >
                    {t("mobileNumberRequired")}
                  </ResponsiveText>
                  <View style={styles.inputWithIcon}>
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
                    color="#ffffff"
                    align="left"
                    truncateMode="single"
                    style={styles.inputLabel}
                  >
                    {t("nameRequired")}
                  </ResponsiveText>
                  <View style={styles.inputWithIcon}>
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
                  {nameError ? (
                    <ResponsiveText
                      variant="caption"
                      size="xs"
                      color="#d32f2f"
                      align="left"
                      truncateMode="double"
                      style={styles.newErrorText}
                    >
                      {nameError}
                    </ResponsiveText>
                  ) : null}
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <ResponsiveText
                    variant="label"
                    size="sm"
                    weight="semibold"
                    color="#ffffff"
                    align="left"
                    truncateMode="single"
                    style={styles.inputLabel}
                  >
                    {t("emailRequired")}
                  </ResponsiveText>
                  <View style={styles.inputWithIcon}>
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
                  {emailError ? (
                    <ResponsiveText
                      variant="caption"
                      size="xs"
                      color="#d32f2f"
                      align="left"
                      truncateMode="double"
                      style={styles.newErrorText}
                    >
                      {emailError}
                    </ResponsiveText>
                  ) : null}
                </View>

                {/* Referral Code */}
                <View style={styles.inputContainer}>
                  <ResponsiveText
                    variant="label"
                    size="sm"
                    weight="semibold"
                    color="#ffffff"
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
                  {referralError ? (
                    <ResponsiveText
                      variant="caption"
                      size="xs"
                      color="#d32f2f"
                      align="left"
                      truncateMode="double"
                      style={styles.newErrorText}
                    >
                      {referralError}
                    </ResponsiveText>
                  ) : null}
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
                      : !isFormValid
                        ? t("completeRequiredFields")
                        : t("continueToMpinSetup")
                  }
                  variant="secondary"
                  size="lg"
                  fullWidth={true}
                  loading={loading}
                  disabled={loading || !isFormValid}
                  onPress={handleSubmit}
                  style={[
                    styles.loginButton,
                    loading && styles.loginButtonDisabled,
                    !isFormValid && styles.loginButtonDisabled,
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
                        color: theme.colors.secondary,
                        fontWeight: "bold",
                      }}
                    >
                      {t("login")}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </LinearGradient>

      {/* OTP Modal */}
      <Modal
        visible={otpModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setOtpModalVisible(false);
          setOtpSentFromModal(false);
        }}
      >
        <View style={styles.otpModalOverlay}>
          <View style={styles.otpModalContent}>
            <ResponsiveText
              variant="title"
              size="md"
              weight="bold"
              color={theme.colors.secondary}
              align="center"
              truncateMode="double"
              style={styles.otpModalTitle}
            >
              {t("otpVerificationRequired")}
            </ResponsiveText>
            <ResponsiveText
              variant="body"
              size="sm"
              color="#333"
              align="center"
              truncateMode="triple"
              maxLines={3}
              style={styles.otpModalSubtitle}
            >
              {otpVerified
                ? t("otpHasBeenVerifiedSuccessfully")
                : autoOtpSending
                  ? t("sendingOtpToYourMobileNumber")
                  : otpSentFromModal
                    ? t("otpHasBeenAutomaticallySent")
                    : t("pleaseVerifyYourMobileNumber")}
            </ResponsiveText>

            {!otpVerified && (
              <>
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

                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={(text) =>
                    setOtp(text.replace(/[^0-9]/g, "").slice(0, 4))
                  }
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="----"
                  placeholderTextColor="#aaa"
                  editable={!otpVerifying && !autoOtpSending}
                />

                <TouchableOpacity
                  style={[
                    styles.verifyOtpButton,
                    (otp.length !== 4 || otpVerifying || autoOtpSending) &&
                    styles.getOtpButtonDisabled,
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

                <View style={styles.resendRow}>
                  <ResponsiveText
                    variant="body"
                    size="xs"
                    color="#444"
                    align="left"
                    truncateMode="single"
                    style={styles.resendText}
                  >
                    {t("didntReceiveOtp")}
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
                        resendLoading) ? "#aaa" : theme.colors.secondary}
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

                {/* <TouchableOpacity
                  style={[styles.getOtpButton, { backgroundColor: '#007AFF', marginTop: 16 }]}
                  onPress={() => {
                    setOtpSentFromModal(true);
                    handleGetOtp();
                  }}
                  disabled={!mobileInput && !mobileStr}
                >
                  <Text style={styles.getOtpButtonText}>Get OTP</Text>
                </TouchableOpacity> */}
              </>
            )}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelLinkButton}
                onPress={() => {
                  setOtpModalVisible(false);
                  setOtpSentFromModal(false);
                }}
              >
                <ResponsiveText
                  variant="body"
                  size="md"
                  weight="medium"
                  color={theme.colors.secondary}
                  align="center"
                  truncateMode="single"
                  style={styles.cancelLinkText}
                >
                  {t("cancel")}
                </ResponsiveText>
              </TouchableOpacity>

              {otpVerified && (
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => {
                    setOtpModalVisible(false);
                    handleSubmit();
                  }}
                >
                  <ResponsiveText
                    variant="button"
                    size="md"
                    weight="bold"
                    color={theme.colors.white}
                    align="center"
                    allowWrap={false}
                    maxLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                    style={styles.modalButtonText}
                  >
                    Continue
                  </ResponsiveText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    </ImageBackground>
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
    color: "#ffffff",
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
    color: "#ffffff",
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
    backgroundColor: "rgba(208, 38, 38, 0.9)",
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
    color: "#ffffff",
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
    color: theme.colors.textLight,
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
    backgroundColor: theme.colors.secondary,
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
    color: theme.colors.secondary,
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
});

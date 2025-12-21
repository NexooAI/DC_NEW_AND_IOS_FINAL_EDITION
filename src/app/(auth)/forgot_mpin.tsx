import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  TextInput,
  Platform,
  Alert,
  Dimensions,
  Image,
  Animated,
  Easing,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Icon from "@expo/vector-icons/MaterialIcons";
import { t } from "@/i18n";
import { AppLocale } from "@/i18n";
import apiClient from "@/services/api";
import useGlobalStore from "@/store/global.store";

import { logger } from "@/utils/logger";
const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;

// Back to MPIN Button Component
const BackToMpinButton = () => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push("/(auth)/mpin_verify")}
      style={{
        // position: "absolute",
        // backgroundColor: theme.colors.primary,
        top: Platform.OS === "ios" ? 60 : 40,
        // left: 20,
        zIndex: 1000,
        // padding: 12,
        // borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        // borderWidth: 1,
        // borderColor: theme.colors.borderWhiteMedium,
      }}
    >
      <Icon name="arrow-back" size={20} color={theme.colors.white} />
      <Text
        style={{
          color: theme.colors.white,
          fontSize: 14,
          fontWeight: "bold",
          marginLeft: 8,
        }}
      >
        {t("backToMpin")}
      </Text>
    </TouchableOpacity>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({
  visible,
  mobileNumber,
  onConfirm,
  onCancel,
  loading,
}: {
  visible: boolean;
  mobileNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon
                name="phone-android"
                size={32}
                color={theme.colors.secondary}
              />
              <Text style={styles.modalTitle}>{t("sendOtpConfirmation")}</Text>
            </View>

            <Text style={styles.modalMessage}>
              {t("sendOtpToNumber")} {mobileNumber}?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>{t("no")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={onConfirm}
                disabled={loading}
              >
                <LinearGradient
                  colors={[theme.colors.secondary, theme.colors.gold]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.confirmButtonText}>
                    {loading ? t("sending") : t("yes")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// MPIN Input Component
const MpinInput = ({
  length = 4,
  onComplete,
  onAutoSubmit,
  secureTextEntry = true,
  autoFocus = false,
  value = "",
}: {
  length?: number;
  onComplete: (value: string) => void;
  onAutoSubmit?: (value: string) => void;
  secureTextEntry?: boolean;
  autoFocus?: boolean;
  value?: string;
}) => {
  const [values, setValues] = useState(Array(length).fill(""));
  const inputs = useRef<(TextInput | null)[]>([]);

  // Reset values when external value changes
  useEffect(() => {
    if (value === "") {
      setValues(Array(length).fill(""));
    }
  }, [value, length]);

  const handleChange = (text: string, index: number) => {
    // Only allow numeric input and limit to 1 character
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 1);

    const newValues = [...values];
    newValues[index] = numericText;

    if (numericText && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (!numericText && index > 0) {
      inputs.current[index - 1]?.focus();
    }

    setValues(newValues);
    const completeValue = newValues.join("");
    onComplete(completeValue);

    // Auto-submit when all digits are entered
    // Add delay to ensure state is fully updated and all 4 digits are captured
    if (completeValue.length === length && onAutoSubmit) {
      setTimeout(() => {
        // Use the latest value to ensure all 4 digits are included
        const finalValue = newValues.join("");
        if (finalValue.length === length) {
          onAutoSubmit(finalValue);
        }
      }, 100); // 100ms delay to ensure state update completes
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.mpinContainer}>
      {values.map((value, index) => (
        <View key={index} style={styles.inputWrapper}>
          <TextInput
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            style={[
              styles.mpinInput,
              value ? styles.mpinInputFilled : styles.mpinInputEmpty,
            ]}
            keyboardType="numeric"
            maxLength={1}
            secureTextEntry={secureTextEntry}
            value={value}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            textAlign="center"
            autoFocus={autoFocus && index === 0}
            selectTextOnFocus={true}
            returnKeyType="next"
          />
          {value && secureTextEntry && <View style={styles.inputDot} />}
        </View>
      ))}
    </View>
  );
};

export default function ForgotMpin() {
  const [step, setStep] = useState<"verifyOtp" | "createMpin">("verifyOtp");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newMpin, setNewMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingMobileNumber, setPendingMobileNumber] = useState("");
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const autoRedirectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Animation for button press
  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Shake animation for error
  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Initialize component and show confirmation modal
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Get user data from local storage
        const userData = await AsyncStorage.getItem("userData");

        if (userData) {
          const parsedUserData = JSON.parse(userData);
          if (parsedUserData.mobile_number) {
            logger.log(
              "📱 Auto-filling mobile number:",
              parsedUserData.mobile_number
            );
            setMobileNumber(parsedUserData.mobile_number);
            setPendingMobileNumber(parsedUserData.mobile_number);

            // Show confirmation modal instead of auto-sending OTP
            setShowConfirmationModal(true);
            setInitializing(false);
          } else {
            logger.log("📱 No mobile number found in user data");
            setInitializing(false);
          }
        } else {
          logger.log("📱 No user data found");
          setInitializing(false);
        }
      } catch (error) {
        logger.error("📱 Error initializing forgot MPIN:", error);
        setInitializing(false);
      }
    };

    initializeComponent();
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      logger.log("Timer starting with countdown:", countdown);
      const timer = setTimeout(() => {
        setCountdown((prevCountdown) => {
          const newCountdown = prevCountdown - 1;
          logger.log("Timer tick, countdown:", newCountdown);
          return newCountdown;
        });
      }, 1000);
      return () => {
        logger.log("Timer cleared");
        clearTimeout(timer);
      };
    }
  }, [countdown]);

  // Validate confirm MPIN when it reaches 4 digits
  useEffect(() => {
    // Only validate when we're on the createMpin step
    if (step !== "createMpin") return;

    // When both MPINs are complete (4 digits), validate them
    if (confirmMpin.length === 4 && newMpin.length === 4) {
      if (newMpin !== confirmMpin) {
        setError(t("mpinMismatchError"));
        shakeError();
      } else {
        // MPINs match - clear any mismatch error
        setError((prevError) => {
          // Only clear if it's the mismatch error, preserve other errors
          return prevError === t("mpinMismatchError") ? "" : prevError;
        });
      }
    }
    // Clear mismatch error if user is still typing (confirm MPIN is incomplete)
    else if (confirmMpin.length < 4 && confirmMpin.length > 0) {
      setError((prevError) => {
        // Only clear if it's the mismatch error, preserve other errors
        return prevError === t("mpinMismatchError") ? "" : prevError;
      });
    }
  }, [confirmMpin, newMpin, step]);

  // Cleanup auto-redirect timeout on unmount
  useEffect(() => {
    return () => {
      if (autoRedirectTimeout.current) {
        clearTimeout(autoRedirectTimeout.current);
        autoRedirectTimeout.current = null;
      }
    };
  }, []);

  const validateMobileNumber = (mobile: string) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const getCountdownDuration = (attempts: number) => {
    switch (attempts) {
      case 0:
        return 30; // First OTP: 30 seconds
      case 1:
        return 120; // Second resend: 120 seconds (2 minutes)
      default:
        return 0; // Third and beyond: disabled
    }
  };

  const isResendDisabled = () => {
    return resendAttempts >= 2 || countdown > 0;
  };

  const handleSendOtp = async (mobile?: string) => {
    const numberToUse = mobile || mobileNumber;

    if (!validateMobileNumber(numberToUse)) {
      setError(t("invalidMobileNumber"));
      shakeError();
      setInitializing(false);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      logger.log("📱 Sending OTP to:", numberToUse);

      const response = await apiClient.post("/auth/check-mobile", {
        mobile_number: numberToUse,
      });

      if (response.data.success) {
        const countdownDuration = getCountdownDuration(resendAttempts);
        logger.log(
          "Setting countdown to:",
          countdownDuration,
          "for attempts:",
          resendAttempts
        );
        setCountdown(countdownDuration);
        setInitializing(false);
        setSuccess(t("otpSentSuccessfully"));
        setError("");
      } else {
        setError(response.data.message || t("failedToSendOtp"));
        shakeError();
        setInitializing(false);
      }
    } catch (error: any) {
      logger.error("📱 Error sending OTP:", error);

      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        setError(errorData.message || t("failedToSendOtp"));
      } else if (error.message?.includes("Network request failed")) {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(t("failedToSendOtp"));
      }

      shakeError();
      setInitializing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    // Use the passed value if available, otherwise use state
    const otpToVerify = otpValue || otp;

    if (otpToVerify.toString().length !== 4) {
      setError(t("pleaseEnterValidOtp"));
      shakeError();
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      logger.log("📱 Verifying OTP for:", mobileNumber, otp);

      const response = await apiClient.post("/auth/reset-verify-otp", {
        mobile_number: mobileNumber,
        otp: otpToVerify,
      });

      if (response.data.success) {
        logger.log("📱 OTP verified successfully");
        setStep("createMpin");
        setError("");
        setSuccess("");
        // Reset resend attempts when OTP is verified
        setResendAttempts(0);
        setCountdown(0);
      } else {
        logger.log("📱 OTP verification failed:", response.data.message);
        setError(response.data.message || t("invalidOtp"));
        shakeError();
      }
    } catch (error: any) {
      logger.error("📱 Error verifying OTP:", error);

      if (error.response?.status === 400) {
        const errorData = error.response.data;
        setError(errorData.message || t("invalidOtp"));
      } else {
        setError(t("failedToVerifyOtp"));
      }

      shakeError();
    } finally {
      setLoading(false);
    }
  };

  // const handleVerifyAndResetMpin = async () => {
  //   if (otp.length !== 4) {
  //     setError(t("pleaseEnterValidOtp"));
  //     shakeError();
  //     return;
  //   }

  //   if (newMpin.length !== 4) {
  //     setError(t("pleaseEnterValidMpin"));
  //     shakeError();
  //     return;
  //   }

  //   if (newMpin !== confirmMpin) {
  //     setError(t("mpinMismatch"));
  //     shakeError();
  //     return;
  //   }

  //   setLoading(true);
  //   setError("");

  //   try {
  //     logger.log('📱 Verifying OTP and resetting MPIN for:', mobileNumber);

  //     // First verify OTP
  //     const otpResponse = await apiClient.post('/auth/verify-forgot-mpin-otp', {
  //       mobileNumber: mobileNumber,
  //       otp: otp
  //     });

  //     if (!otpResponse.data.success) {
  //       logger.log('📱 OTP verification failed:', otpResponse.data.message);
  //       setError(otpResponse.data.message || t("invalidOtp"));
  //       shakeError();
  //       return;
  //     }

  //     logger.log('📱 OTP verified successfully, now resetting MPIN');

  //     // Then reset MPIN
  //     const resetResponse = await apiClient.post('/auth/reset-mpin', {
  //       mobile: mobileNumber,
  //       newMpin: newMpin
  //     });

  //     if (resetResponse.data.success) {
  //       logger.log('📱 MPIN reset successfully');
  //       Alert.alert(
  //         t("success"),
  //         t("mpinResetSuccess"),
  //         [
  //           {
  //             text: t("ok"),
  //             onPress: () => router.replace("/(auth)/login")
  //           }
  //         ]
  //       );
  //     } else {
  //       logger.log('📱 MPIN reset failed:', resetResponse.data.message);
  //       setError(resetResponse.data.message || t("resetFailed"));
  //       shakeError();
  //     }
  //   } catch (error: any) {
  //     logger.error("📱 Error in verify and reset process:", error);

  //     if (error.response?.status === 400) {
  //       const errorData = error.response.data;
  //       setError(errorData.message || t("resetFailed"));
  //     } else {
  //       setError(t("resetFailed"));
  //     }

  //     shakeError();
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleResetMpin = async () => {
    if (newMpin.length !== 4) {
      setError(t("pleaseEnterValidMpin"));
      shakeError();
      return;
    }

    if (newMpin !== confirmMpin) {
      setError(t("mpinMismatch"));
      shakeError();
      return;
    }

    setLoading(true);
    setError("");

    try {
      logger.log("📱 Resetting MPIN for:", mobileNumber);

      const response = await apiClient.post("/auth/reset-mpin", {
        mobile: mobileNumber,
        newMpin: newMpin,
      });
      logger.log(response);
      if (response.data.message === "MPIN reset successfully") {
        logger.log("📱 MPIN reset successfully");

        // Show success alert
        Alert.alert(t("success"), t("mpinResetSuccess"), [
          {
            text: t("ok"),
            onPress: () => {
              // Clear auto-redirect timeout if user clicks OK manually
              if (autoRedirectTimeout.current) {
                clearTimeout(autoRedirectTimeout.current);
                autoRedirectTimeout.current = null;
              }
              router.replace("/(auth)/mpin_verify");
            },
          },
        ]);

        // Auto-redirect after 3 seconds
        autoRedirectTimeout.current = setTimeout(() => {
          autoRedirectTimeout.current = null;
          router.replace("/(auth)/mpin_verify");
        }, 3000);
      } else {
        logger.log("📱 MPIN reset failed:", response.data.message);
        setError(response.data.message || t("resetFailed"));
        shakeError();
      }
    } catch (error: any) {
      logger.error("📱 Error resetting MPIN:", error);

      if (error.response?.status === 400) {
        const errorData = error.response.data;
        setError(errorData.message || t("resetFailed"));
      } else {
        setError(t("resetFailed"));
      }

      shakeError();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResendDisabled()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    // Clear OTP input when resending
    setOtp("");

    // Increment resend attempts
    const newAttempts = resendAttempts + 1;
    setResendAttempts(newAttempts);

    try {
      logger.log("📱 Resending OTP to:", mobileNumber, "attempt:", newAttempts);

      const response = await apiClient.post("/auth/check-mobile", {
        mobile_number: mobileNumber,
      });

      if (response.data.success) {
        const countdownDuration = getCountdownDuration(newAttempts);
        logger.log(
          "Resend: Setting countdown to:",
          countdownDuration,
          "for attempts:",
          newAttempts
        );
        setCountdown(countdownDuration);
        setSuccess(t("otpResentSuccessfully"));
        setError("");
      } else {
        setError(response.data.message || t("failedToResendOtp"));
        shakeError();
      }
    } catch (error: any) {
      logger.error("📱 Error resending OTP:", error);

      if (error.response?.status === 400) {
        const errorData = error.response.data;
        setError(errorData.message || t("failedToResendOtp"));
      } else {
        setError(t("failedToResendOtp"));
      }

      shakeError();
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const handleConfirmSendOtp = async () => {
    setShowConfirmationModal(false);
    await handleSendOtp(pendingMobileNumber);
  };

  const handleCancelSendOtp = () => {
    setShowConfirmationModal(false);
    setPendingMobileNumber("");
  };

  // Show loading screen while initializing
  if (initializing) {
    return (
      <LinearGradient
        colors={[
          theme.colors.transparent,
          theme.colors.transparent,
          theme.colors.bgPrimaryLight,
        ]}
        style={styles.gradient}
      >
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t("loading")}</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  const renderVerifyOtpStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t("verifyOtpTitle")}</Text>
      <Text style={styles.stepSubtitle}>
        {t("otpSentTo")} {mobileNumber}
      </Text>

      <Animated.View
        style={[
          styles.inputContainer,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <Text style={styles.inputLabel}>{t("enterOtp")}</Text>
        <MpinInput
          length={4}
          onComplete={setOtp}
          onAutoSubmit={
            (value) => {
              // Pass the value directly to ensure all 4 digits are captured
              setTimeout(() => {
                handleVerifyOtp(value);
              }, 100);
            }
          }
          secureTextEntry={true}
          autoFocus={true}
          value={otp}
        />
      </Animated.View>

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error" size={16} color={theme.colors.errorLight} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successContainer}>
          <Icon name="check-circle" size={16} color={theme.colors.success} />
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          onPress={() => {
            animatePress();
            handleVerifyOtp();
          }}
          disabled={loading || otp.length !== 4}
        >
          <LinearGradient
            colors={[theme.colors.secondary, theme.colors.secondary]}
            style={styles.buttonGradient}
          >
            <Text style={styles.actionButtonText}>
              {loading ? t("verifying") : t("verifyOtp")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        style={[
          styles.resendButton,
          isResendDisabled() && styles.resendButtonDisabled,
        ]}
        onPress={handleResendOtp}
        disabled={isResendDisabled()}
      >
        <Text style={styles.resendText}>
          {resendAttempts >= 2
            ? t("resendLimitReached")
            : countdown > 0
              ? `${t("resendOtpIn")} ${countdown}s`
              : t("resendOtp")}
        </Text>
        <BackToMpinButton />
      </TouchableOpacity>
    </View>
  );

  const renderCreateMpinStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t("createNewMpinTitle")}</Text>
      <Text style={styles.stepSubtitle}>{t("createNewMpinSubtitle")}</Text>

      <Animated.View
        style={[
          styles.inputContainer,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <Text style={styles.inputLabel}>{t("newMpin")}</Text>
        <MpinInput
          length={4}
          onComplete={setNewMpin}
          secureTextEntry={!showPin}
          autoFocus={true}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.inputContainer,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <Text style={styles.inputLabel}>{t("confirmMpin")}</Text>
        <MpinInput
          length={4}
          onComplete={setConfirmMpin}
          secureTextEntry={!showPin}
        />
      </Animated.View>

      <TouchableOpacity
        style={styles.eyeToggle}
        onPress={() => setShowPin(!showPin)}
      >
        <Icon
          name={showPin ? "visibility-off" : "visibility"}
          size={20}
          color={theme.colors.secondary}
        />
        <Text style={styles.eyeText}>
          {showPin ? t("hideMpin") : t("showMpin")}
        </Text>
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error" size={16} color={theme.colors.errorLight} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successContainer}>
          <Icon name="check-circle" size={16} color={theme.colors.success} />
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          onPress={() => {
            animatePress();
            handleResetMpin();
          }}
          disabled={
            loading ||
            newMpin.length !== 4 ||
            confirmMpin.length !== 4 ||
            newMpin !== confirmMpin
          }
        >
          <LinearGradient
            colors={[theme.colors.secondary, theme.colors.secondary]}
            style={styles.buttonGradient}
          >
            <Text style={styles.actionButtonText}>
              {loading ? t("resetting") : t("resetMpin")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  return (
    <ImageBackground
      source={require("../../../assets/images/bg_login.jpg")}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={[
          theme.colors.transparent,
          theme.colors.transparent,
          theme.colors.bgPrimaryLight,
        ]}
        style={styles.gradient}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.formContainer}>
              {step === "verifyOtp" && renderVerifyOtpStep()}
              {step === "createMpin" && renderCreateMpinStep()}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </LinearGradient>
      {/* <SimpleLanguageSwitcher /> */}

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirmationModal}
        mobileNumber={pendingMobileNumber}
        onConfirm={handleConfirmSendOtp}
        onCancel={handleCancelSendOtp}
        loading={loading}
      />
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
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  logoContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    marginBottom: 20,
  },
  logo: {
    aspectRatio: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
    justifyContent: "center",
  },
  formContainer: {
    flex: 1,
    justifyContent: "space-evenly",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  stepContainer: {
    width: "100%",
  },
  stepTitle: {
    color: theme.colors.white,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  stepSubtitle: {
    color: theme.colors.white,
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: theme.colors.bgWhiteLight,
    borderWidth: 1,
    borderColor: theme.colors.borderWhiteMedium,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.white,
  },
  mpinContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
  },
  inputWrapper: {
    position: "relative",
    width: 45,
    height: 50,
  },
  mpinInput: {
    width: "100%",
    height: "100%",
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    color: theme.colors.black,
    backgroundColor: theme.colors.white,
  },
  mpinInputEmpty: {
    borderColor: theme.colors.errorLight,
    backgroundColor: theme.colors.white,
    color: theme.colors.black,
  },
  mpinInputFilled: {
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.white,
    color: theme.colors.black,
  },
  inputDot: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  actionButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.white,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  eyeToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  eyeText: {
    color: theme.colors.secondary,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    alignItems: "center",
    marginTop: 20,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bgErrorLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    fontWeight: "500",
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bgSuccessLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  successText: {
    color: theme.colors.success,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    fontWeight: "500",
  },
  mpinSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderWhiteLight,
  },
  sectionTitle: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: theme.colors.bgPrimaryHeavy,
    borderRadius: 20,
    padding: 0,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.colors.borderWhiteMedium,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
    textAlign: "center",
  },
  modalMessage: {
    color: theme.colors.white,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.9,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  cancelButton: {
    backgroundColor: theme.colors.bgBlackMedium,
    borderWidth: 1,
    borderColor: theme.colors.borderWhiteMedium,
  },
  confirmButton: {
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalButtonGradient: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
